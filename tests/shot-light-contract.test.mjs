// Maintained contracts and example fidelity, not automated cinematic judgement.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=f=>readFileSync(path.join(root,f),'utf8');
test('execution template is self-contained and does not suggest a fatal-lock quota',()=>{
 const s=read('modules/prompt-template.md').match(/```text\s*\n([\s\S]*?)\n```/u)[1];
 assert.doesNotMatch(s,/上接……|下交……|通常3[–—-]6/u);
 assert.match(s,/本镜焦距/u);assert.match(s,/画左\/画右/u);
 assert.match(s,/受光/u);assert.match(s,/无字幕、无文字叠加。/u);
});
test('writing handoff explicitly covers world light, standalone segments and real cut angle',()=>{
 const s=read('modules/prompt-writing-sop.md');
 for(const anchor of ['world-lighting','standalone-segment','segment-boundary'])assert.ok(s.includes(`id="${anchor}"`));
 for(const term of ['至少30°','仅换焦距','固定实体','伦勃朗','丁达尔','不设条数下限','不读手册、范本、影视或大师知识'])assert.ok(s.includes(term),term);
 assert.match(s,/光影设计参考库\.md#world-light-continuity/u);
});
test('last pass checks errors from current artifacts, not another knowledge research cycle',()=>{
 const s=read('modules/delivery-check.md');
 for(const term of ['不读取影视库','180°','30°','同景别','逐字保留','没有额外条件','文字通过不代表'])assert.ok(s.includes(term),term);
 const owner=existsSync(path.join(root,'modules/compiler.md'))?'modules/compiler.md':'modules/agent-6-reviewer.md';
 assert.match(read(owner),/delivery-check\.md/u);
});
test('canonical example is standalone and each shot includes focal length',()=>{
 const s=read('references/writing/handbook-gold-mai-long.md').match(/```text\s*\n([\s\S]*?)\n```/u)[1];
 assert.doesNotMatch(s,/承接上一段|交给婉-3|沿用上一段/u);
 const shots=s.split(/^【[\d:.]+-[\d:.]+】镜头\d+[^\n]*\n/mu).slice(1);
 assert.equal(shots.length,9);
 for(const [i,x] of shots.entries())assert.match(x.split('【声音】')[0],/\d+\s*(?:mm|毫米)/u,`shot ${i+1}`);
});

test('light selection is story and source driven rather than a portrait-light preset',()=>{
 const s=read('modules/prompt-writing-sop.md');
 for(const term of ['伦勃朗光是可选塑形方法','不是默认或必选项','柔光不等于大平光','正暖邪冷、普遍红蓝对打或全员伦勃朗都不是默认','来源色、相机白平衡与材质','遮挡','色光落在具体墙面、衣物或皮肤上','光参与构图'])assert.ok(s.includes(term),term);
 for(const name of ['光影设计参考库.md','色彩调性参考库.md','构图设计参考库.md'])assert.ok(s.includes(name),name);
 const files=['SKILL.md','modules/prompt-template.md','modules/prompt-writing-sop.md','modules/delivery-check.md','modules/film-rule-scope.md','references/writing/handbook-adaptation.md'];
 for(const file of files)assert.doesNotMatch(read(file),/人物可见脸部默认优先伦勃朗|默认人物脸优先伦勃朗|人物默认伦勃朗|人物优先伦勃朗|主光\/弱填充/u,file);
 const check=read('modules/delivery-check.md');
 assert.match(check,/有方向和层次的柔光、高调保留/u);
 assert.match(check,/恒定正面全脸补平不因.*而放行；迎面车灯等已允许的动态正面暴露.*扫入扫出及恢复原光场/u);
 assert.match(check,/不以是否采用伦勃朗/u);
 assert.match(check,/不读取影视库/u);
});
