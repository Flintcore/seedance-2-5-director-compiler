// Source fidelity and callable routes; not a prose-style score.
import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync,existsSync} from 'node:fs';
import {cp,mkdtemp,writeFile,rm} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {auditHandbook} from '../scripts/audit-handbook.mjs';
import {auditKnowledgeRoutes} from '../scripts/audit-knowledge-routes.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=f=>readFileSync(path.join(root,f),'utf8');
test('full user message reconstructs losslessly through all eight source spans and 44 code blocks',()=>{
 const r=auditHandbook(root);assert.equal(r.ok,true,JSON.stringify(r.errors));
 assert.equal(r.facts.sourceCharacters,32816);assert.equal(r.facts.sourceBytes,83604);
 assert.equal(r.facts.codeBlocks,44);assert.equal(r.facts.variants,18);assert.equal(r.documents.length,8);
 assert.deepEqual(r.documents.map(d=>d.codeBlocks),[12,2,3,9,16,1,1,0]);
});
test('source chapters and adaptation are reachable from the mandatory runtime SOP',()=>{
 const r=auditKnowledgeRoutes(root);assert.equal(r.ok,true,JSON.stringify(r));
 const manifest=JSON.parse(read('references/writing/handbook/manifest.json'));
 const edges=r.edges['modules/prompt-writing-sop.md'];
 for(const item of manifest.documents.slice(0,7))assert.ok(edges.includes('references/writing/handbook/'+item.file));
 assert.ok(edges.includes('references/writing/handbook-adaptation.md'));
 assert.ok(r.edges['references/writing/handbook/INDEX.md'].includes('references/writing/handbook/source-verbatim.md'));
 assert.deepEqual(r.unreachable,[]);
 if(existsSync(path.join(root,'modules/bundles'))){
  for(let i=1;i<=6;i++)assert.ok(read('modules/bundles/bundle-ring'+i+'.md').includes(read('modules/prompt-writing-sop.md').trim()));
 }
});
test('the source compact template is an explicit request exception across runtime entry points',()=>{
 const required=['SKILL.md','modules/prompt-writing-sop.md','modules/prompt-template.md','references/writing/handbook-adaptation.md'];
 if(existsSync(path.join(root,'modules/compiler.md')))required.push('modules/compiler.md');
 else required.push('modules/core-credos.md','modules/assembly-protocol.md','modules/agent-5-assembler.md','modules/agent-6-reviewer.md');
 for(const f of required){const text=read(f);assert.ok(text.includes('1.7'),f);assert.ok(text.includes('明确'),f);}
 assert.ok(read('references/writing/handbook-adaptation.md').includes('七块维护校验器不适用'));
});
test('loss or alteration of an original example cannot pass a fresh archive audit',async()=>{
 const tempBase=path.resolve(os.tmpdir()),temp=await mkdtemp(path.join(tempBase,'seedance-handbook-test-'));
 const rel='references/writing/handbook';
 try{
  await cp(path.join(root,rel),path.join(temp,rel),{recursive:true});
  const candidate=path.join(temp,rel,'03-camera-editing.md'),baseline=read(rel+'/03-camera-editing.md');
  assert.ok(baseline.includes('### 案例 C：'));
  await writeFile(candidate,baseline.replace(/### 案例 C：[\s\S]*?(?=### 案例 D：)/u,''),'utf8');
  assert.equal(auditHandbook(temp).ok,false);
  await writeFile(candidate,baseline,'utf8');assert.equal(auditHandbook(temp).ok,true);
  const variants=path.join(temp,rel,'04-variants.md');
  await writeFile(variants,read(rel+'/04-variants.md').replace('### V18','### REMOVED18'),'utf8');
  assert.equal(auditHandbook(temp).ok,false);
  await writeFile(variants,read(rel+'/04-variants.md'),'utf8');
  const raw=path.join(temp,rel,'source-verbatim.md');
  await writeFile(raw,read(rel+'/source-verbatim.md')+'\n','utf8');
  assert.equal(auditHandbook(temp).ok,false);
 }finally{
  assert.equal(path.dirname(path.resolve(temp)),tempBase);assert.ok(path.basename(temp).startsWith('seedance-handbook-test-'));
  await rm(temp,{recursive:true,force:true});
 }
});
