// Maintenance fixtures, not generation-time reference prompts.
import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {validatePrompt} from '../scripts/validate-prompt.mjs';
import {lexInlineText} from '../scripts/inline-dialogue.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=f=>readFileSync(path.join(root,f),'utf8');
const draft=({goal,space,light,frame,action,material})=>
  ['【本段目标】',goal+' 6秒，一镜。','【参考绑定】','@image1 = 阿陶的身份与服装，不继承摆姿与背景；不是首尾帧。',
   '【空间】',space,'【环境】',light,'【时间线】','【0:00-0:06】镜头1 '+frame+'。',
   action+' 阿陶说：“拿好了。”'+material+'同一镜到底，不剪切。','【声音】','只有阿陶的对白与室内底声，无BGM（无配乐）。','【不可出错】','无字幕、无文字叠加。'].join('\n');
const cases=[
 // No external look; material and action supply the visible texture.
 {goal:'日间病房里，蓝衬衫的袖口皱成一小团。',space:'阿陶站在床右，窗在床左。',light:'窗纱把晨光散到床沿，墙根仍灰。',frame:'床边中景',
  action:'50mm，镜头与床沿齐高。画左是床，右侧阿陶递出衬衣。',material:'袖口离开手指后，几道折痕还挤在一起。'},
 // A preselected low-key look; only its approved in-scene result is emitted.
 {goal:'冷青的工作间里，铜片上的一道窄亮边从黑里浮出来。',space:'台钳靠后墙，阿陶在桌前。',light:'高窗的斜光只及台钳，桌下保持暗。',frame:'钳口近景',
  action:'85mm。阿陶从画右把铜片递过来，手遮去那条亮线。',material:'她松开手，冷色亮线重新露在磨钝的铜边。'}];
const expected=[{speaker:'阿陶',text:'拿好了。',shot_id:'S1'}];
test('different scene-first or look-first drafts keep the same storyboard contract',()=>{
 for(const c of cases) {
  const text=draft(c),parsed=validatePrompt(text,{expectedDialogue:expected});
  assert.equal(parsed.ok,true,JSON.stringify(parsed.errors));
  assert.equal(parsed.facts.shots.length,1);assert.equal(parsed.facts.duration,6);
  assert.deepEqual(parsed.facts.assetTokens,['@image1']);
  assert.equal(validatePrompt(text.replace('拿好了。','再等等。'),{expectedDialogue:expected}).ok,false);
 }
});
test('design, compile and template reach the same mutable texture rule without a prose exemplar',()=>{
 const old='handbook-gold-mai-long.md';
 assert.equal(existsSync(path.join(root,'references/writing',old)),false);
 for(const f of ['SKILL.md','modules/orchestration.md','modules/compiler.md','modules/prompt-template.md','modules/prompt-writing-sop.md','modules/runtime-foundation.md','references/writing/INDEX.md','references/model/nine-layer-schema.md'])assert.ok(!read(f).includes(old),f);
 for(const f of ['modules/runtime-foundation.md','modules/compiler.md','modules/prompt-template.md'])assert.ok(read(f).includes('prompt-writing-sop.md#visible-texture'),f);
 const t=read('modules/prompt-template.md').split('【参考绑定】')[0];
 assert.match(t,/【本段目标】[\s\S]*开头[\s\S]*质感/u);
 const s=read('modules/prompt-writing-sop.md');
 assert.equal((s.match(/id="visible-texture"/gu)||[]).length,1);
 assert.match(s,/有用就落实到当前对象，无外接照样能写/u);
});
test('natural speech cues preserve ownership without forcing every line to say 说',()=>{
 const text='林芳低声：“到了。”周冬带笑应一声：“诶！”林芳看向周冬：“回去？”';
 const r=lexInlineText(text,{speakerNames:['林芳','周冬']});
 assert.deepEqual(r.dialogue.map(({speaker,text})=>({speaker,text})),[
  {speaker:'林芳',text:'到了。'},{speaker:'周冬',text:'诶！'},{speaker:'林芳',text:'回去？'}]);
 assert.deepEqual(lexInlineText('林芳写下：“押金”。周冬看见招牌写着：“酒”。林芳听到“退钱”。',{speakerNames:['林芳','周冬']}).dialogue,[]);
 const clauseLead='室内说笑未歇，钱掌柜压低嗓子，同旅客算一笔账：“还欠三枚。”';
 assert.deepEqual(lexInlineText(clauseLead,{speakerNames:['钱掌柜','旅客']}).dialogue.map(({speaker,text})=>({speaker,text})),[{speaker:'钱掌柜',text:'还欠三枚。'}]);
 assert.deepEqual(lexInlineText('室内说笑未歇，钱掌柜在纸上写下：“还欠三枚”。',{speakerNames:['钱掌柜']}).dialogue,[]);
});
