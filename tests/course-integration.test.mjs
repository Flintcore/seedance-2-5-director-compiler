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

function stableAnchorProblems(text,prefix,n){
 const expected=Array.from({length:n},(_,i)=>`${prefix}-${String(i+1).padStart(2,'0')}`);
 const found=[...text.matchAll(/<a id="([^"]+)"><\/a>/gu)].map(m=>m[1]);
 return expected.filter(id=>found.filter(x=>x===id).length!==1).concat(found.filter(id=>!expected.includes(id)));
}

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
 for(const f of [guide,...topics.map(([t])=>path.join(BASE,`导演体系/${t}.md`))]){
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

test('stable-anchor guard detects dropped, duplicate and out-of-range chapters',()=>{
 const ok='<a id="core-01"></a>\n<a id="core-02"></a>';
 assert.deepEqual(stableAnchorProblems(ok,'core',2),[]);
 assert.deepEqual(stableAnchorProblems(ok.replace('<a id="core-02"></a>',''),'core',2),['core-02']);
 assert.deepEqual(stableAnchorProblems(ok+'\n<a id="core-02"></a>','core',2),['core-02']);
 assert.deepEqual(stableAnchorProblems(ok+'\n<a id="core-03"></a>','core',2),['core-03']);
});
