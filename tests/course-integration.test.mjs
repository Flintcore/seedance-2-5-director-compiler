// Maintainer-only structural regressions. No generation-time gate or test prompts.
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE=path.join(ROOT, 'references/cinema');
const read=p=>readFileSync(p,'utf8');
const topics=[['创作立场与关系表达','core',18],['感知反馈与相对调度','stage',10],['镜组节奏与跨场组织','edit',20],['观看距离与运动光影','view',20]];
const guide=path.join(BASE,'导演体系/导演判断总纲.md');
const errata=path.join(BASE,'导演体系/课程来源与勘误.md');

function stableAnchorProblems(text,prefix,n){
 const expected=Array.from({length:n},(_,i)=>`${prefix}-${String(i+1).padStart(2,'0')}`);
 const found=[...text.matchAll(/<a id="([^"]+)"><\/a>/gu)].map(m=>m[1]);
 return expected.filter(id=>found.filter(x=>x===id).length!==1).concat(found.filter(id=>!expected.includes(id)));
}


// Labels name chapter ranges; an anchor lands on the first chapter, not every
// chapter in the range. Keep this maintainer-only; it is not a reading quota.
const chapterId=(prefix,n)=>`${prefix}-${String(n).padStart(2,'0')}`;
function chapterRange(label){
 // Decimal section references such as §6.9 (including §6.9至11) are not ranges.
 const m=label.match(/(?<![\d.§至–—~-])(\d{1,2})(?:\s*[-–—~至]\s*(\d{1,2}))?\s*$/u);
 return m?[Number(m[1]),Number(m[2]??m[1])]:null;
}
function problemNavigation(text){
 return text.split(/^## 从当前问题进正文\s*$/mu)[1]?.split(/^## /mu)[0]??'';
}
function navigationReport(text){
 const problems=[],routes=[],counts=new Map();
 for(const m of text.matchAll(/\[([^\]]*)\]\(([^)]+)\)/gu)){
  if(/^[a-z][a-z\d+.-]*:/iu.test(m[2]))continue;
  const [rel,anchor]=m[2].split('#');
  const spec=topics.find(([title])=>path.resolve(path.dirname(guide),decodeURIComponent(rel))===path.join(BASE,`导演体系/${title}.md`));
  if(!spec || !anchor)continue;
  const [,prefix,n]=spec,range=chapterRange(m[1]);
  if(!range || range[0]<1 || range[1]<range[0] || range[1]>n){
   problems.push(`invalid-range: ${m[1]} -> ${m[2]}`);continue;
  }
  const [start,end]=range,expected=chapterId(prefix,start);
  if(anchor!==expected){
   problems.push(`anchor-mismatch: ${m[1]} -> ${m[2]} (expected ${expected})`);continue;
  }
  const ids=Array.from({length:end-start+1},(_,i)=>chapterId(prefix,start+i));
  for(const id of ids)counts.set(id,(counts.get(id)??0)+1);
  routes.push({raw:m[0],label:m[1],href:m[2],index:m.index,prefix,start,end,ids});
 }
 for(const [,prefix,n] of topics)for(let i=1;i<=n;i++){
  const id=chapterId(prefix,i);if(!counts.has(id))problems.push(`missing: ${id}`);
 }
 return {problems,routes,counts};
}
const replaceRoute=(text,route,replacement)=>text.slice(0,route.index)+replacement+text.slice(route.index+route.raw.length);

test('course layer retains all 68 topic anchors and is reachable from index and guide',()=>{
 const index=read(path.join(BASE,'INDEX.md')); const g=read(guide);
 assert.ok(index.includes('导演体系/导演判断总纲.md'));
 let count=0;
 for(const [title,prefix,n] of topics){
  const f=path.join(BASE,`导演体系/${title}.md`),text=read(f);
  assert.deepEqual(stableAnchorProblems(text,prefix,n),[],title);
  assert.ok(index.includes(`导演体系/${title}.md`),`${title} index route`);
  assert.ok(g.includes(`${title}.md#${prefix}-`),`${title} problem route`);
  assert.match(text,/条件|边界/u); assert.match(text,/来源|证据/u); count+=n;
 }
 assert.equal(count,68);
});

test('course pages local file and explicit section links resolve in independent installation',()=>{
 for(const f of [guide,errata,...topics.map(([t])=>path.join(BASE,`导演体系/${t}.md`))]){
  assert.ok(existsSync(f),`required course page: ${f}`);
  for(const m of read(f).matchAll(/\[[^\]]*\]\(([^)]+)\)/gu)){
   const href=m[1]; if(/^[a-z]+:\/\//iu.test(href))continue;
   const [rel,anchor]=href.split('#'); const dest=rel?path.resolve(path.dirname(f),decodeURIComponent(rel)):f;
   assert.ok(existsSync(dest),`${path.basename(f)} -> ${href}`);
   if(anchor && /^(?:core|stage|edit|view)-\d+$/u.test(anchor))assert.ok(read(dest).includes(`<a id="${anchor}"></a>`),href);
  }
 }
});

test('runtime routes distinguish scene design, local refinement and locked compilation',()=>{
 const entry=read(path.join(ROOT,'SKILL.md'));
 const route=read(path.join(ROOT,'modules/knowledge-routing.md'));
 const micro=read(path.join(ROOT,'modules/micro-performance.md'));
 const scope=read(path.join(ROOT,'modules/film-rule-scope.md'));
 assert.ok(entry.includes('导演判断总纲.md'));
 assert.ok(route.includes('导演判断总纲.md'));
 assert.match(route,/完整章节|专题章/u);
 assert.match(route,/局部/u); assert.match(route,/纯编译/u);
 assert.ok(micro.includes('感知反馈与相对调度.md#stage-04'));
 assert.ok(micro.includes('镜组节奏与跨场组织.md#edit-19'));
 assert.match(scope,/POV.*抖动/u);assert.match(scope,/句中反打/u);
 assert.match(scope,/用户构图|项目合同/u);
});


test('problem navigation explicitly covers all 68 chapters including labelled ranges',()=>{
 const nav=problemNavigation(read(guide));
 assert.ok(nav,'guide problem-navigation section');
 const report=navigationReport(nav);
 assert.deepEqual(report.problems,[]);
 assert.equal(report.counts.size,68);
});

test('chapter labels expand dash and Chinese ranges without mistaking decimal sections',()=>{
 assert.deepEqual(chapterRange('创作底座01–03'),[1,3]);
 assert.deepEqual(chapterRange('推至综合06至11'),[6,11]);
 assert.deepEqual(chapterRange('关系01-03'),[1,3]);
 assert.deepEqual(chapterRange('出场07'),[7,7]);
 for(const label of ['原库§6.9','原库§6.9至11','原库§6.9–11','原库§6.9–6.11']){
  assert.equal(chapterRange(label),null,label);
 }
 const unrelated=navigationReport('[原库§6.9](../角色调度与走位参考库.md)');
 assert.equal(unrelated.counts.size,0);
});

test('navigation coverage guard detects deletion of a direct chapter route',()=>{
 const nav=problemNavigation(read(guide)),baseline=navigationReport(nav);
 const route=baseline.routes.find(r=>r.start===r.end && baseline.counts.get(r.ids[0])===1);
 assert.ok(route,'real guide has an independently covering direct route to mutate');
 const mutant=navigationReport(replaceRoute(nav,route,''));
 assert.ok(!baseline.problems.includes(`missing: ${route.ids[0]}`));
 assert.ok(mutant.problems.includes(`missing: ${route.ids[0]}`));
});

test('navigation coverage guard detects a shortened label range',()=>{
 const nav=problemNavigation(read(guide)),baseline=navigationReport(nav);
 const route=baseline.routes.find(r=>r.end>r.start && baseline.counts.get(r.ids.at(-1))===1);
 assert.ok(route,'real guide has a range with an independently covered last chapter');
 const label=route.label.replace(/\d+\s*$/u,String(route.end-1).padStart(2,'0'));
 const mutant=navigationReport(replaceRoute(nav,route,`[${label}](${route.href})`));
 assert.ok(!baseline.problems.includes(`missing: ${route.ids.at(-1)}`));
 assert.ok(mutant.problems.includes(`missing: ${route.ids.at(-1)}`));
});

test('navigation guard rejects disagreement between label numbers and target anchor',()=>{
 const nav=problemNavigation(read(guide)),baseline=navigationReport(nav);
 const route=baseline.routes.find(r=>r.end>r.start);
 assert.ok(route,'real guide has a chapter range to mutate');
 const suffix=`${String(route.start+1).padStart(2,'0')}–${String(route.end).padStart(2,'0')}`;
 const label=route.label.replace(/\d+(?:\s*[-–—~至]\s*\d+)?\s*$/u,suffix);
 const mutant=navigationReport(replaceRoute(nav,route,`[${label}](${route.href})`));
 assert.ok(mutant.problems.some(p=>p.startsWith('anchor-mismatch:')),'valid changed range must not count against its old anchor');
});


test('stable-anchor guard detects dropped, duplicate and out-of-range chapters',()=>{
 const ok='<a id="core-01"></a>\n<a id="core-02"></a>';
 assert.deepEqual(stableAnchorProblems(ok,'core',2),[]);
 assert.deepEqual(stableAnchorProblems(ok.replace('<a id="core-02"></a>',''),'core',2),['core-02']);
 assert.deepEqual(stableAnchorProblems(ok+'\n<a id="core-02"></a>','core',2),['core-02']);
 assert.deepEqual(stableAnchorProblems(ok+'\n<a id="core-03"></a>','core',2),['core-03']);
});
