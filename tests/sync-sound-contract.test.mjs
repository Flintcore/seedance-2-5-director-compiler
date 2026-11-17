// Static production-contract regression; not proof of generated audio quality.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const multi=fs.existsSync(path.join(root,'scripts/build-bundles.mjs'));
const anchor='prompt-writing-sop.md#sync-sound-delivery';

test('one authoritative project contract separates rough-cut production sound from post score',()=>{
 const s=read('modules/prompt-writing-sop.md');
 assert.equal((s.match(/id="sync-sound-delivery"/g)||[]).length,1);
 assert.match(s,/每条不超过30秒的直出视频视为已粗剪素材/);
 assert.match(s,/角色对白与实际发声、场景中可录到的环境声、动作接触产生的物理声/);
 assert.match(s,/配乐、情绪性氛围铺底、升调、惊吓撞击和脱离现场来源的强化音效留后期/);
 assert.match(s,/不是模型能力限制或所有影视作品的通则/);
});

test('runtime entry, deciding foundation, writing template and final check reach the same contract',()=>{
 for(const f of ['SKILL.md','modules/runtime-foundation.md','modules/prompt-template.md','modules/delivery-check.md','references/writing/reference-sound-diagnosis.md']) assert.ok(read(f).includes(anchor),f);
 const t=read('modules/prompt-template.md').split('【声音】')[1].split('【不可出错】')[0];
 assert.match(t,/无配乐、无额外情绪性音效/);
 assert.match(t,/动作接触产生的物理声/);
 assert.match(t,/无对白的段落明确无对白/);
});

test('scene-locked performances remain diegetic while past music examples do not activate a score',()=>{
 const s=read('modules/prompt-writing-sop.md');
 assert.match(s,/剧本原有的现场演奏、收音机\/电视声等依真实发声设备与空间成立/);
 assert.match(s,/不为绕开无配乐约定新造播放设备/);
 assert.match(s,/历史手册及声音库中的配乐案例仍可用于后期研究/);
 const r=read('references/writing/reference-sound-diagnosis.md');
 assert.ok(!r.includes('默认无BGM仅在用户未给音乐设计时生效'));
 assert.match(r,/后期音乐另行交付/);
});

test('lightweight compiler and real six-ring approval are unchanged by the sound correction',async()=>{
 const workflow=read('modules/orchestration.md');
 if(multi){
  assert.match(workflow,/awaiting_l1_approval/);
  assert.match(workflow,/真实执行 1→2→3→4/);
  assert.match(workflow,/真实执行 5→6/);
  const {renderBundle}=await import('../scripts/build-bundles.mjs');
  for(const n of [2,3,4,5,6]){
   const generated=read(`modules/bundles/bundle-ring${n}.md`);
   assert.equal(generated,renderBundle(n),`ring ${n} stays generated from authoritative sources`);
   assert.ok(generated.includes(anchor)||generated.includes('id="sync-sound-delivery"'));
  }
  const role=read('modules/agent-4-style-sound.md');
  assert.match(role,/只有另行做后期声音设计/);
  assert.ok(!role.includes('用户音乐要求优先'));
 }else{
  assert.match(workflow,/CREATE_AUTO/);
  assert.match(workflow,/DIRECTOR_CHECKPOINT/);
  assert.equal(fs.existsSync(path.join(root,'modules/bundles')),false);
 }
});
