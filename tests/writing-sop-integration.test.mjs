import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync,existsSync } from 'node:fs';
import { cp,mkdtemp,writeFile,rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { auditKnowledgeRoutes } from '../scripts/audit-knowledge-routes.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const compiler=existsSync(path.join(root,'references/cinema'));
const read=f=>readFileSync(path.join(root,f),'utf8');

test('mandatory SOP reaches every retained film/master and new writing resource',()=>{
 const r=auditKnowledgeRoutes(root);assert.equal(r.ok,true,JSON.stringify(r));
 assert.equal(r.facts.cinemaBodies,compiler?51:53);assert.equal(r.facts.masterBodies,184);
 assert.equal(r.facts.writingResources,9);assert.deepEqual(r.unreachable,[]);
 assert.ok(r.edges['SKILL.md'].includes('modules/prompt-writing-sop.md'));
 assert.ok(r.edges['modules/prompt-writing-sop.md'].includes('modules/knowledge-routing.md'));
});
test('all eighteen named variants are present and mode evidence is actually linked',()=>{
 const ids=[...read('references/writing/variants.md').matchAll(/^## V(\d+) /gm)].map(m=>Number(m[1]));
 assert.deepEqual(ids,Array.from({length:18},(_,i)=>i+1));
 const r=auditKnowledgeRoutes(root);assert.ok(r.edges['modules/prompt-writing-sop.md'].includes('references/writing/modes-and-evidence.md'));
 assert.ok(r.edges['modules/prompt-writing-sop.md'].includes('references/writing/handbook-coverage.md'));
});
test('each architecture retains its actual workflow instead of becoming another template-only entry',()=>{
 const orchestration=read('modules/orchestration.md');
 if(compiler){
  assert.match(orchestration,/CREATE_AUTO/);assert.match(orchestration,/DIRECTOR_CHECKPOINT/);
  assert.equal(existsSync(path.join(root,'modules/bundles')),false);
 } else {
  assert.match(orchestration,/awaiting_l1_approval/);assert.match(orchestration,/5→6/);
  for(let i=1;i<=6;i++){
   const b=read('modules/bundles/bundle-ring'+i+'.md');
   assert.ok(b.includes('来源文件：modules/prompt-writing-sop.md'));
   assert.equal(b.includes('来源文件：modules/prompt-template.md'),i>=5);
   assert.ok(!b.includes('来源文件：modules/micro-performance.md'));
  }
 }
});
test('graph regression catches a missing target and an orphaned topic in an isolated copy',async()=>{
 const tempBase=path.resolve(os.tmpdir());const temp=await mkdtemp(path.join(tempBase,'seedance-route-audit-'));
 try{
  for(const name of ['SKILL.md','modules','references'])await cp(path.join(root,name),path.join(temp,name),{recursive:true});
  await writeFile(path.join(temp,'SKILL.md'),read('SKILL.md')+'\n[bad link](references/writing/missing-route.md)\n','utf8');
  const newTopic=path.join(temp,'references',compiler?'cinema':'','orphan-audit-topic.md');
  await writeFile(newTopic,'# Deliberately unlinked test topic\n','utf8');
  const r=auditKnowledgeRoutes(temp);assert.equal(r.ok,false);
  assert.ok(r.broken.some(x=>x.to==='references/writing/missing-route.md'));
  assert.ok(r.unreachable.some(x=>x.endsWith('orphan-audit-topic.md')));
 } finally {
  // Only delete the verified fresh test directory under the system temporary root.
  assert.equal(path.dirname(path.resolve(temp)),tempBase);
  assert.ok(path.basename(temp).startsWith('seedance-route-audit-'));
  await rm(temp,{recursive:true,force:true});
 }
});

test('AU conditional routing points to the actual local action-reference section',()=>{
 const target=compiler?'references/cinema/面部表情四部位参考库.md':'references/面部表情四部位参考库.md';
 const heading=read(target).match(/^## (?:§)?([一二三四五六七八九十]+)、AU \/ FACS 动作参照/mu);
 assert.ok(heading,'the target contains an AU action-reference section');
 const branch=read('modules/micro-performance.md').split('## AU / 精细面部动作：条件入口')[1];
 assert.ok(branch,'AU is reachable through a conditional runtime branch');
 assert.ok(branch.includes('`'+target+'` §'+heading[1]),'runtime chapter index matches installed body, not the other skill layout');
});
