// Maintainer regressions, not a generated-action quality score or runtime gate.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=f=>readFileSync(path.join(root,f),'utf8');
const prefix='references/cinema/';
const names=['动作设计与武指体系参考库.md','武戏动作模板库.md','速度与力量量化标准.md'];
test('each action source delta is traced to an actual current target body, not a claimed full mirror',()=>{
 const ledger=JSON.parse(read('KNOWLEDGE_PATCH.json'));
 assert.equal(ledger.sync_mode,'targeted-patch-not-full-mirror');
 for(const n of names){
  const target=prefix+n;
  const patch=[...ledger.patches].reverse().find(p=>p.files.some(f=>f.target_path===target));
  assert.ok(patch,'missing provenance '+target);
  const f=patch.files.find(f=>f.target_path===target);
  assert.equal(f.source_path,'references/'+n);
  assert.match(patch.source.commit,/^[a-f0-9]{40}$/);
  assert.equal(createHash('sha256').update(readFileSync(path.join(root,target))).digest('hex'),f.target_sha256);
  assert.equal(f.sha256,f.target_sha256);
 }
});
test('the actual action vocabulary no longer prescribes the known universal pause and finale recipes',()=>{
 const body=read(prefix+'武戏动作模板库.md');
 assert.doesNotMatch(body,/连续攻击时[，,]\s*每次攻击之间有蓄力\/调整动作/u);
 assert.doesNotMatch(body,/高潮一击（慢镜头）|短打\s*[（(]3[-–]4\s*镜|长打\s*[（(]7[-–]9\s*镜/u);
 assert.doesNotMatch(body,/拳收回腰间，深吸一口气，重心微调/u);
 // Keep the old vocabulary covered while retiring its universal timing recipe.
 for(const move of ['拳','腿','刀','剑','位移']) assert.ok(body.includes(move),'lost move family '+move);
});
