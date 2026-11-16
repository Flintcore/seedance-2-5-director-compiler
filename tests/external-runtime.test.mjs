import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {auditStandaloneContext} from '../scripts/standalone-context.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=f=>readFileSync(path.join(root,f),'utf8');
const headings=['本段目标','参考绑定','空间','环境','时间线','声音','不可出错'];
const fixture=patch=>headings.map(h=>`【${h}】\n${patch?.[h]??'本段当前事实。'}`).join('\n');

test('runtime foundation is resident and original source remains a reachable conditional archive',()=>{
  const entry=read('SKILL.md'),sop=read('modules/prompt-writing-sop.md');
  assert.match(entry,/modules\/runtime-foundation\.md/u);
  assert.match(entry,/modules\/external-knowledge\.md/u);
  assert.match(sop,/不再强制通读独立元模板及①—⑥全册/u);
  for(const n of ['00-independent','01-overview','02-reference-space-timeline','03-camera-editing','04-variants','05-sound-dialogue-diagnosis','06-director-thinking'])assert.ok(sop.includes(n+'.md'));
  const base=read('modules/runtime-foundation.md');
  for(const detail of ['镜头组先回答四问','观看立场','接收','画左/画右','有效光源视角尺寸','白平衡','声桥','动作相位','完整微型示例'])assert.ok(base.includes(detail),detail);
});

test('external routing is opt in, missing packs do not erase core, and formal matcher remains independent',()=>{
  const x=read('modules/external-knowledge.md');
  for(const detail of ['explicit-only','目录查询','director-style-matcher','不替代','缺包','不伪造已读','不重查库'])assert.ok(x.includes(detail)||read('modules/knowledge-routing.md').includes(detail),detail);
  assert.match(x,/不依赖联网或外接仓始终可用/u);
  assert.match(x,/当前用户锁与批准版本 → 本skill的运行SOP/u);
  for(const contract of ['~/.codex/seedance-external-knowledge.json','catalog_path','catalog_version','不代表启用任何包','不全盘搜索','不等于上传给视频模型'])assert.ok(x.includes(contract),contract);
});

test('all seven blocks reject explicit unsubmitted segment history, including last-column negative history',()=>{
  for(const h of headings){
    const r=auditStandaloneContext(fixture({[h]:'与上一段相同。'}));
    assert.ok(r.findings.some(f=>f.code==='UNSUBMITTED_HISTORY'&&f.section===h),h);
  }
  for(const phrase of ['保持此前位置。','沿用之前的音色。','不出现上一段的老师。','同原声线。'])
    assert.ok(auditStandaloneContext(fixture({'不可出错':phrase})).findings.some(f=>f.code==='UNSUBMITTED_HISTORY'));
});

test('unuploaded A1 gets a concrete location; physically declared or uploaded visible labels remain valid',()=>{
  const bad=fixture({'空间':'佳佳坐在A1。'});
  assert.ok(auditStandaloneContext(bad).findings.some(f=>f.code==='UNRESOLVED_SYMBOL'));
  assert.equal(auditStandaloneContext(fixture({'空间':'从教室门口朝黑板看，佳佳坐在靠窗第一排临过道的座位。'})).ok,true);
  const declaration='A1是靠窗第一排临过道的座位';
  assert.equal(auditStandaloneContext(fixture({'空间':declaration+'。佳佳坐在A1。'}),{internalSymbols:[{id:'A1',definition:declaration}]}).ok,true);
  assert.equal(auditStandaloneContext(fixture({'空间':'佳佳坐在贴有“A1”标牌的座位，座位在靠窗第一排。'})).ok,true);
  const withAsset=fixture({'参考绑定':'@image1 = 本次教室座位图，提供可见座位标号与布局。','空间':'佳佳坐在A1。'});
  const symbols=[{id:'A1',sourceAsset:'@image1',visibleInAsset:true}];
  assert.equal(auditStandaloneContext(withAsset,{suppliedAssetTokens:['@image1'],internalSymbols:symbols}).ok,true);
  const missing=auditStandaloneContext(withAsset,{suppliedAssetTokens:[],internalSymbols:symbols});
  assert.ok(missing.findings.some(f=>f.code==='ASSET_NOT_SUBMITTED'));
  assert.ok(missing.findings.some(f=>f.code==='UNRESOLVED_SYMBOL'));
  const unbound=fixture({'空间':'@image1中佳佳坐在A1。'});
  assert.ok(auditStandaloneContext(unbound,{suppliedAssetTokens:['@image1'],internalSymbols:symbols}).findings.some(f=>f.code==='UNRESOLVED_SYMBOL'));
});

test('diagram reference requires an actually supplied layout authority rather than any old image',()=>{
  const text=fixture({'参考绑定':'@image1 = 佳佳面貌。','空间':'两人按图示站位。'});
  assert.ok(auditStandaloneContext(text,{suppliedAssetTokens:['@image1']}).findings.some(f=>f.code==='UNSUBMITTED_DIAGRAM'));
  assert.equal(auditStandaloneContext(text,{suppliedAssetTokens:['@image1'],layoutAssetTokens:['@image1']}).ok,true);
});

test('original speech, explicit current-shot references and design notes are not keyword-deleted',()=>{
  const spoken=fixture({'时间线':'佳佳说：“上一段你叫我坐A1，下一段还这样？”摄影机仍看本段上一镜已出现的门口。'});
  assert.equal(auditStandaloneContext(spoken,{speakerNames:['佳佳']}).ok,true);
  const note='设计说明：沿LOOK-01，上一段末镜位置为A1。';
  assert.equal(auditStandaloneContext(note,{scope:'design'}).skipped,true);
  assert.equal(auditStandaloneContext(note).ok,false);
});

test('standalone compilation checks actual submitted inputs instead of agent memory, without adding a review ring',()=>{
  const sop=read('modules/prompt-writing-sop.md');
  for(const detail of ['实际输入集合','七块共同自足','未上传草图编号','姓名本身不携带','故事对白中的','不凑3–6条'])assert.ok(sop.includes(detail),detail);
  assert.match(read('modules/compiler.md'),/standalone-readable-prose/u);
  assert.match(read('modules/delivery-check.md'),/本说明并入既有第1项，不多开审查轮/u);
  assert.match(sop,/不新增可读性审查环/u);
});

test('ordinary natural L1 has a complete resident handoff without IR or course pre-read',()=>{
  const foundation=read('modules/runtime-foundation.md');
  const handoff=foundation.split('## 自然L1与扩读边界')[1];
  assert.ok(handoff);
  for(const detail of ['戏核','人物策略','观看立场','原对白','前中后景','当前受光和声音','切连','CREATE_AUTO','DIRECTOR_CHECKPOINT','真实六环'])assert.ok(handoff.includes(detail),detail);
  assert.match(read('modules/orchestration.md'),/普通自然L1不读取整本Director IR/u);
  assert.match(read('modules/director-ir.md'),/普通单场自然L1[\s\S]*无需读取或填写本页schema/u);
});

test('source navigation and general methods no longer form a compulsory new-design read cascade',()=>{
  const routing=read('modules/knowledge-routing.md');
  assert.match(routing,/基础或已选知识完整单元已解决当前选择时，不进入本页扩搜/u);
  assert.match(routing,/不通读索引/u);
  assert.match(routing,/新建或重做一场戏本身不触发通读总纲/u);
  assert.doesNotMatch(routing,/每次导演任务按此顺序/u);
  assert.doesNotMatch(routing,/\*\*读影视索引\*\*：打开/u);
  assert.match(read('SKILL.md'),/不通读路由、索引、总纲、镜头设计或IR/u);
  assert.match(read('references/cinema/INDEX.md'),/不因新建\/重做一场戏就通读索引/u);
});

test('complex capability and real conflict handling remain conditional rather than deleted',()=>{
  const shot=read('modules/shot-design.md'),judgment=read('modules/design-judgment.md');
  assert.match(shot,/只读当前仍未解决问题所在的完整节及必要定义/u);
  assert.match(judgment,/仅已发现实际锁冲突、目标与做法不相容/u);
  for(const heading of ['## 三类判断，三种处理','## 实质问题怎样交给用户'])assert.ok(judgment.includes(heading));
  for(const heading of ['## 二、建立主镜骨架','## 三、逐镜设计顺序','## 八、锁定与编译交接'])assert.ok(shot.includes(heading));
  assert.ok(read('schemas/director-ir.yaml').includes('knowledge_applications'));
});
