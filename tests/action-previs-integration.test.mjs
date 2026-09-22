// Maintenance dependency tests only; no claim about generated acting or combat quality.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read=f=>readFileSync(path.join(root,f),'utf8');
const action="modules/action-design.md";
const previs="references/model/previs-reference.md";
const sources=["SKILL.md","modules/orchestration.md","modules/knowledge-routing.md","modules/shot-design.md"];
test('action route is reachable through the active design and assembly chain',()=>{
 assert.ok(existsSync(path.join(root,action)));
 for(const source of sources) assert.ok(read(source).includes(path.basename(action)),source+' misses action dependency');
});
test('action and previs Markdown dependencies remain self-contained and resolvable',()=>{
 for(const source of [action,previs]){
  const content=read(source);
  for(const match of content.matchAll(/\[[^\]\n]+\]\(([^)]+)\)/g)){
   const target=match[1].split('#')[0];
   if(!target || /^[a-z]+:/i.test(target)) continue;
   const resolved=path.resolve(root,path.dirname(source),decodeURIComponent(target));
   assert.ok(!path.relative(root,resolved).startsWith('..'),source+' escapes skill');
   assert.ok(existsSync(resolved),source+' broken dependency '+target);
  }
 }
});
test('previs retains separate conditional routes in entry orchestration and compiler',()=>{
 for(const source of ['SKILL.md','modules/orchestration.md','modules/compiler.md'])
  assert.ok(read(source).includes(path.basename(previs)),source+' misses previs dependency');
});
