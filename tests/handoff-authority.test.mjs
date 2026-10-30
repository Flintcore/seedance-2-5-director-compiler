// Maintenance of source ownership only, not a prompt-quality classifier.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {decisionEdges,auditDecisionHandoffs} from '../scripts/audit-knowledge-routes.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=f=>readFileSync(path.join(root,f),'utf8');
for(const compiler of [true,false]){
 const design=compiler?'modules/shot-design.md':'modules/agent-3-shot-designer.md';
 const handoff=compiler?'modules/director-ir.md':'modules/assembly-l1-protocol.md';
 const action=compiler?'modules/action-design.md':'modules/action-impact.md';
 for(const [from,to] of [[design,handoff],[action,'modules/prompt-writing-sop.md']]){
  test(`${compiler?'compiler':'multi'}: inheritance boundary cannot become index-only at ${from}`,()=>{
   const graph={};for(const [a,b] of decisionEdges(compiler))(graph[a]??=[]).push(b);
   assert.equal(auditDecisionHandoffs(graph,compiler).ok,true);
   graph[from]=graph[from].filter(p=>p!==to);
   (graph['references/INDEX.md']??=[]).push(to);
   assert.ok(auditDecisionHandoffs(graph,compiler).missing.some(e=>e.from===from&&e.to===to));
  });
 }
}
test('actual design and action handoffs resolve to the shared information-use section',()=>{
 const compiler=existsSync(path.join(root,'modules/director-ir.md'));
 for(const f of compiler?['modules/director-ir.md','modules/action-design.md','modules/compiler.md']:
  ['modules/assembly-l1-protocol.md','modules/action-impact.md','modules/assembly-protocol.md','modules/agent-5-assembler.md'])
  assert.match(read(f),/\]\(prompt-writing-sop\.md#scene-first-handoff\)/u);
 assert.ok(read('modules/prompt-writing-sop.md').includes('<a id="scene-first-handoff"></a>'));
});
test('multi L1 has one six-field skeleton owner, not another skeleton inside role 3',()=>{
 if(!existsSync(path.join(root,'modules/assembly-l1-protocol.md')))return;
 const fields=['[叙事功能]','[叙述]','[对白引用]','[表演]','[镜头语言]','[大师锚]'];
 const skeletons=text=>[...text.matchAll(/```[^\n]*\n([\s\S]*?)\n```/gu)]
  .filter(m=>fields.every(f=>m[1].includes(f))).length;
 assert.equal(skeletons(read('modules/assembly-l1-protocol.md')),1);
 assert.equal(skeletons(read('modules/agent-3-shot-designer.md')),0);
 assert.match(read('modules/agent-3-shot-designer.md'),/\]\(assembly-l1-protocol\.md\)/u);
});
