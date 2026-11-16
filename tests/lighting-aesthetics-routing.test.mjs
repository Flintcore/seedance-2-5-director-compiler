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
 for(const rule of ['本轮提供或明确指定','题材名称本身不触发自动载入','七块SOP','不把其全文','跨题材不沿用上次外挂','不启动外接库重组']) assert.ok(block.includes(rule),rule);
});
