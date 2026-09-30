// Maintainer regression only: no test scene or generation-time check.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const cinema=path.join(root,'references/cinema');
const read=p=>readFileSync(p,'utf8');
const chapter=(name,id)=>read(path.join(cinema,'导演体系',name+'.md')).split(`<a id="${id}"></a>`)[1]?.split(/<a id="(?:core|stage|edit|view)-/u)[0]??'';
const guide=read(path.join(cinema,'导演体系/导演判断总纲.md'));
test('case routes land in the chapter that actually holds the decision contrast',()=>{
 for(const [name,id,evidence] of [
  ['创作立场与关系表达','core-11','职业空间对照'],
  ['创作立场与关系表达','core-18','卸妆'],
  ['感知反馈与相对调度','stage-02','上船'],
  ['感知反馈与相对调度','stage-06','赝品'],
  ['感知反馈与相对调度','stage-08','力量与尺度'],
  ['镜组节奏与跨场组织','edit-05','复位'],
  ['镜组节奏与跨场组织','edit-08','单个字母'],
  ['观看距离与运动光影','view-04','一球成名'],
 ]){
  assert.ok(guide.includes(`${name}.md#${id}`),`direct guide route ${id}`);
  assert.ok(chapter(name,id).includes(evidence),`case in ${id}: ${evidence}`);
 }
});
test('selected master and course cross-links resolve in this installation',()=>{
 for(const rel of ['references/masters/frankel/穿普拉达的女王.md','references/masters/wes-anderson/布达佩斯大饭店.md']){
  const f=path.join(root,rel);
  for(const m of read(f).matchAll(/\[[^\]]*\]\(([^)]+)\)/gu)){
   if(!m[1].includes('导演体系/'))continue;
   const [p,id]=m[1].split('#'),dest=path.resolve(path.dirname(f),p);
   assert.ok(existsSync(dest),`${rel} -> ${m[1]}`);
   if(id)assert.ok(read(dest).includes(`<a id="${id}"></a>`));
  }
 }
});
test('acting cases are conditional and do not replace local face or locked-shot work',()=>{
 const micro=read(path.join(root,'modules/micro-performance.md'));
 assert.ok(micro.includes('创作立场与关系表达.md#core-18'));
 assert.match(micro,/普通视线.*局部修复沿原专项/u);
 assert.match(micro,/不照搬卸妆道具/u);
});
