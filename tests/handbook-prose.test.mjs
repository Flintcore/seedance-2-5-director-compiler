// Maintenance evidence, not a prose-quality score or generation-time gate.
import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync, existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {validatePrompt} from '../scripts/validate-prompt.mjs';
import {lexInlineText} from '../scripts/inline-dialogue.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=f=>readFileSync(path.join(root,f),'utf8');
const exampleFile='references/writing/handbook-gold-mai-long.md';
const example=read(exampleFile).match(/```text\r?\n([\s\S]*?)\r?\n```/u)[1];
const expected=[
 ['江渡','掌柜的。','S1'],['婉娘','诶！','S2'],
 ['江渡','门外二十个人，一人一碗面，多放葱。记我账上。','S3'],['婉娘','阿大，二十碗面！','S3'],
 ['老钱','哟，拿白面喂牲口？差爷，面这么贱？','S4'],
 ['老钱','钱多烧得慌，不如卖给我。一个人三斗米，我全要了。','S5'],
 ['江渡','不卖。','S6'],['钱家伙计','嘿，披了身黑皮就不知道二五八万了？你知道在跟谁说话吗？','S7'],
 ['老钱','没教养的东西。','S7'],['老钱','差爷，和气生财。','S7'],
].map(([speaker,text,shot_id])=>({speaker,text,shot_id}));

test('handbook complete example retains original speech, shots, budgets and one-time bindings',()=>{
 const result=validatePrompt(example,{expectedDialogue:expected});
 assert.equal(result.ok,true,JSON.stringify(result.errors));
 assert.equal(result.facts.duration,30);
 assert.equal(result.facts.shots.length,9);
 assert.deepEqual(result.facts.assetTokens,['@image1','@image2','@image3','@image4','@audio1']);
 assert.equal(result.facts.dialogueCheck.shotMatches,true);
 assert.deepEqual(result.facts.dialogue.map(({speaker,text,shot_id})=>({speaker,text,shot_id})),expected);
});
test('actual assembler receives complete example, not only a case-analysis summary',()=>{
 for(const rel of ['modules/prompt-writing-sop.md','modules/prompt-template.md'])
  assert.ok(read(rel).includes('../'+exampleFile));
 if(existsSync(path.join(root,'modules/bundles'))){
  for(const n of [5,6])assert.ok(read(`modules/bundles/bundle-ring${n}.md`).includes(read(exampleFile).trim()));
 }else{
  assert.ok(read('modules/compiler.md').includes('../'+exampleFile));
 }
});
test('complete worked example has named camera headers rather than appended story duties',()=>{
 const headers=[...example.matchAll(/^【[\d:.]+-[\d:.]+】镜头\d+\s+(.+)$/gmu)].map(m=>m[1].trim());
 assert.deepEqual(headers,['房梁顶拍。','柜台中景。','过肩大纵深。','桌面低角度。','穿行跟拍。','江渡近景。','刀柄前景起升成三人中景。','江渡背后斜侧反打。','柜台内反向纵深。']);
 // This checks only the curated source exemplar, not general creative phrasing.
 assert.doesNotMatch(example,/本段完成的核心变化是|结尾观众应理解或感受到|保持各自归属/u);
});
test('natural handbook speech cues preserve ownership without forcing every line to say 说',()=>{
 const text='江渡低声：“掌柜的。”婉娘带笑应一声：“诶！”老钱俯视江渡：“不卖？”老钱反手拍在伙计后脑：“没教养的东西。”';
 const r=lexInlineText(text,{speakerNames:['江渡','婉娘','老钱','伙计']});
 assert.deepEqual(r.dialogue.map(({speaker,text})=>({speaker,text})),[
  {speaker:'江渡',text:'掌柜的。'},{speaker:'婉娘',text:'诶！'},
  {speaker:'老钱',text:'不卖？'},{speaker:'老钱',text:'没教养的东西。'}]);
 const inscriptions='老钱写下：“欠三斗米”。江渡看见招牌写着：“酒”。老钱听到“不卖”。';
 assert.deepEqual(lexInlineText(inscriptions,{speakerNames:['江渡','老钱']}).dialogue,[]);
 const clauseLead='室内说笑未歇，钱掌柜压低嗓子，同旅客算一笔账：“还欠三枚。”';
 assert.deepEqual(lexInlineText(clauseLead,{speakerNames:['钱掌柜','旅客']}).dialogue.map(({speaker,text})=>({speaker,text})),
  [{speaker:'钱掌柜',text:'还欠三枚。'}]);
 assert.deepEqual(lexInlineText('室内说笑未歇，钱掌柜在纸上写下：“还欠三枚”。',{speakerNames:['钱掌柜']}).dialogue,[]);
});
test('handbook source cannot pass exact dialogue verification after alteration or speaker reassignment',()=>{
 for(const text of [example.replace('差爷，和气生财。','差爷，生意兴隆。'),
  example.replace('江渡说：“门外二十个人','老钱说：“门外二十个人')]){
  assert.notEqual(text,example);
  assert.equal(validatePrompt(text,{expectedDialogue:expected}).ok,false);
 }
});
