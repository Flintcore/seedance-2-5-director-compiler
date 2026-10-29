// Maintenance-only behavioral graph mutations; no story or prompt fixtures.
import test from 'node:test';
import assert from 'node:assert/strict';
import { auditKnowledgeRoutes,auditDecisionHandoffs,decisionEdges } from '../scripts/audit-knowledge-routes.mjs';

for(const compiler of [true,false]){
 const name=compiler?'compiler':'six-ring';
 function valid(){
  const g={};for(const [from,to] of decisionEdges(compiler))(g[from]??=[]).push(to);return g;
 }
 test(`${name}: explicit design and compile handoffs are connected`,()=>{
  assert.equal(auditDecisionHandoffs(valid(),compiler).ok,true);
 });
 test(`${name}: globally indexed knowledge does not excuse a bypassed design route`,()=>{
  const g=valid(),design=compiler?'modules/shot-design.md':'modules/agent-3-shot-designer.md';
  g['SKILL.md'].push(...(g['modules/knowledge-routing.md']??[]));g[design]=[];
  const r=auditDecisionHandoffs(g,compiler);
  assert.equal(r.ok,false);assert.ok(r.missing.some(x=>x.from===design));
 });
 test(`${name}: a template-only compiler loses the design handoff`,()=>{
  const g=valid(),writer=compiler?'modules/compiler.md':'modules/agent-5-assembler.md';
  g[writer]=['modules/prompt-template.md'];
  assert.equal(auditDecisionHandoffs(g,compiler).ok,false);
 });
 test(`${name}: removing viewpoint body is caught even when indexes remain`,()=>{
  const g=valid();g['modules/knowledge-routing.md']=g['modules/knowledge-routing.md'].filter(p=>!p.endsWith('视点体系与镜头运动地基.md'));
  assert.equal(auditDecisionHandoffs(g,compiler).ok,false);
 });
}
test('installed runtime routes and existing corpus remain connected',()=>{
 const r=auditKnowledgeRoutes();assert.deepEqual(r.decisionHandoffs.missing,[]);
 assert.deepEqual(r.unreachable,[]);assert.deepEqual(r.broken,[]);assert.equal(r.ok,true);
});

// A globally indexed composition library must also reach the actual designer/writer.
for (const compiler of [true,false]) {
 const name=compiler?'compiler':'six-ring';
 test(name+': composition is not an index-only orphan',()=>{
  const g={};for(const [from,to] of decisionEdges(compiler))(g[from]??=[]).push(to);
  const design=compiler?'modules/shot-design.md':'modules/agent-3-shot-designer.md';
  g[design]=g[design].filter(p=>!p.endsWith('构图设计参考库.md'));
  const r=auditDecisionHandoffs(g,compiler);
  assert.equal(r.ok,false);assert.ok(r.missing.some(x=>x.from===design&&x.to.endsWith('构图设计参考库.md')));
 });
 test(name+': projected L1 must reach the writing owner',()=>{
  const g={};for(const [from,to] of decisionEdges(compiler))(g[from]??=[]).push(to);
  const handoff=compiler?'modules/director-ir.md':'modules/assembly-l1-protocol.md';
  g[handoff]=g[handoff].filter(p=>p!=='modules/prompt-writing-sop.md');
  assert.equal(auditDecisionHandoffs(g,compiler).ok,false);
 });
}

// Style learning must survive selection, design and the existing handoff.
for (const compiler of [true,false]) {
 const name=compiler?'compiler':'six-ring';
 const design=compiler?'modules/shot-design.md':'modules/agent-3-shot-designer.md';
 const handoff=compiler?'modules/director-ir.md':'modules/assembly-l1-protocol.md';
 const froms=['modules/knowledge-routing.md',design,handoff];
 if(!compiler)froms.push('modules/agent-4-style-sound.md');
 for(const from of froms)test(`${name}: style mechanism survives ${from}`,()=>{
  const g={};for(const [src,to] of decisionEdges(compiler))(g[src]??=[]).push(to);
  const target=(compiler?'references/cinema/':'references/')+'导演视觉风格参考库.md';
  g[from]=g[from].filter(to=>to!==target);
  // The library remains reachable through the global index; the runtime edge is still required.
  (g['references/INDEX.md']??=[]).push(target);
  const r=auditDecisionHandoffs(g,compiler);
  assert.equal(r.ok,false);assert.ok(r.missing.some(x=>x.from===from&&x.to===target));
 });
}
