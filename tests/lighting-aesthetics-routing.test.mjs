// Route and scope contracts only; aesthetic effectiveness is tested separately with forward outputs.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=f=>readFileSync(path.join(root,f),'utf8');
const anchors=['bounce-light-path','motivated-dynamic-light','light-aesthetic-composition','source-color-design'];
const linked=source=>[...source.matchAll(/\]\(([^)]+)#([^)]*)\)/gu)].map(m=>({file:m[1],id:m[2]}));
const missing=source=>anchors.filter(a=>!linked(source).some(l=>l.id===a));
test('lighting design uses specific existing source sections, not only an index label',()=>{
 const sop=read('modules/prompt-writing-sop.md');
 assert.deepEqual(missing(sop),[]);
 for(const a of anchors){
  const link=linked(sop).find(l=>l.id===a);
  const f=path.resolve(root,'modules',link.file);
  assert.ok(f.startsWith(root+path.sep));
  assert.equal(readFileSync(f,'utf8').split(`<a id="${a}"></a>`).length,2,a);
  assert.deepEqual(missing(sop.replaceAll('#'+a,'#broken-anchor')), [a]);
 }
});
test('external type attachments remain opt-in without replacing the resident workflow',()=>{
 const routing=read('modules/knowledge-routing.md');
 const block=routing.split('**外部题材资料按本次授权使用**')[1]?.split('\n\n')[0];
 assert.ok(block);
 for(const rule of ['本轮提供或明确指定','题材名称本身不触发自动载入','七块SOP','不把其全文','跨题材不沿用上次外挂','目录查询只召回候选']) assert.ok(block.includes(rule),rule);
 assert.ok(routing.includes('(external-knowledge.md)'), 'approved external-repo architecture has an executable opt-in entry');
});

// Maintenance coverage only: successful routing does not establish a rendered look.
test('optional light design goes from a selected unit to L1, shared setting and action without auto-loading the pack',()=>{
 const route=read('modules/external-knowledge.md').split('**已选安吉布光。**')[1]?.split('\n\n')[0]??'';
 for(const id of ['method-02','method-03','method-07','method-09'])assert.ok(route.includes(id),id);
 assert.match(route,/未选安吉时，走内置基础/u);
 const foundation=read('modules/runtime-foundation.md'), sop=read('modules/prompt-writing-sop.md'), review=read('modules/delivery-check.md');
 assert.match(foundation,/需要可控光色或反差时[\s\S]*设计近似值[\s\S]*CCT[\s\S]*WB[\s\S]*白物或肤色/u);
 assert.match(foundation,/饱和彩光定色相[\s\S]*同一姿态、同一曝光[\s\S]*相差约几档[\s\S]*动作或遮挡/u);
 assert.match(sop,/L1 转成稿时，【环境】只写一次[\s\S]*【时间线】只随动作[\s\S]*数值[\s\S]*画面/u);
 assert.match(review,/第4项[\s\S]*全脸均匀提亮[\s\S]*整幅套同色滤镜[\s\S]*保本色/u);
 for(const t of [foundation,sop,review,read('modules/prompt-template.md')])assert.doesNotMatch(t,/anj-lighting-aesthetics|method-0[2379]/u);
});
test('single compiler retains approved light numbers and referents without a new stage',()=>{
 assert.match(read('modules/compiler.md'),/CCT、相机 WB、亮暗参照及档差连同可见结果保留/u);
});
