// Source-contract maintenance only: these checks do not execute a creative task
// or claim that a prompt, optical setup, performance or generated video passed.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => readFileSync(path.join(root, file), 'utf8');
const section = (text, heading) => {
  const start = text.indexOf(heading);
  assert.notEqual(start, -1, `missing section: ${heading}`);
  const level = heading.match(/^#+/u)[0].length;
  const rest = text.slice(start + heading.length);
  const next = new RegExp(`\\n#{1,${level}} `, 'u').exec(rest);
  return text.slice(start, next ? start + heading.length + next.index : undefined);
};
const orchestration = read('modules/orchestration.md');
const ir = read('modules/director-ir.md');
const schema = read('schemas/director-ir.yaml');

test('multi-segment scope preserves task routes and legacy SEQUENCE without granting approval', () => {
  const routing = section(orchestration, '## 一、先定本次还开放什么');
  for (const mode of ['CREATE_AUTO', 'DIRECTOR_CHECKPOINT', 'COMPILE', 'OPTIMIZE']) {
    assert.ok(routing.includes('`' + mode + '`'), `missing task path: ${mode}`);
  }
  assert.match(routing, /多段 `SEQUENCE` 是执行范围[\s\S]*不替代[\s\S]*确认策略/u);
  assert.match(routing, /兼容旧 `task_mode: SEQUENCE`[\s\S]*approval\.status[\s\S]*draft[\s\S]*不自动/u);
  assert.match(schema, /enum: \[CREATE_AUTO, DIRECTOR_CHECKPOINT, COMPILE, SEQUENCE, OPTIMIZE, DIAGNOSE, AUDIT\]/u);
  const handoff = section(read('modules/shot-design.md'), '## 六、多段连续');
  assert.match(handoff, /边界闸门已确认多段执行范围/u);
  assert.doesNotMatch(handoff, /仅当任务模式为 `SEQUENCE`/u);
  assert.match(ir, /meta\.task_mode[\s\S]*旧 `SEQUENCE`[\s\S]*当前路径与批准策略/u);
});

test('creative local revision has a complete current L1 and an explicit approval disposition', () => {
  const lock = section(orchestration, '### E. L1 锁定门');
  assert.match(lock, /OPTIMIZE[\s\S]*更新 L1 版本并交完整当前稿/u);
  assert.match(lock, /待确认[\s\S]*draft[\s\S]*已授权直接修订[\s\S]*turn_locked[\s\S]*明确确认[\s\S]*user_approved/u);
  assert.match(lock, /只改素材\/格式的 A→F 不补造新设计或 L1/u);
  assert.match(lock, /既有批准不自动覆盖新版/u);
  const handoff = section(read('modules/shot-design.md'), '## 八、锁定与编译交接');
  assert.match(handoff, /OPTIMIZE[\s\S]*完整新版 L1[\s\S]*旧批准不自动覆盖新版/u);
  assert.match(ir, /局部修订[\s\S]*l1_version[\s\S]*完整 L1[\s\S]*纯素材\/格式转写不补造新设计版本/u);
});

test('input and freeze steps own actual evidence, mode separation and ready-to-compile decisions', () => {
  const intake = section(orchestration, '### A. 读戏简报');
  assert.match(intake, /权威原稿\/L1及版本/u);
  assert.match(intake, /用户已确认的说明与实际观察分开[\s\S]*未读取或当前不可见[\s\S]*不凭文件名/u);
  assert.match(intake, /创作任务路径与 \[平台模式\]/u);
  assert.match(intake, /已有权威值优先[\s\S]*关键缺口[\s\S]*不连环追问/u);
  const lock = section(orchestration, '### E. L1 锁定门');
  assert.match(lock, /C\/D[\s\S]*完整 L1[\s\S]*逐镜实际对白范围[\s\S]*必要发声时间与总长相容/u);
  assert.match(lock, /只回其负责步骤[\s\S]*不另开审查轮/u);
});

test('IR asset object carries optional canonical numbering without breaking unnumbered sources', () => {
  const assets = schema.match(/^      reference_assets:\n([\s\S]*?)(?=^      assumptions:)/mu)?.[1];
  assert.ok(assets, 'missing reference_assets schema');
  assert.match(assets, /additionalProperties: false/u);
  const required = assets.match(/required: \[([^\]]+)\]/u)[1].split(',').map(value => value.trim());
  assert.deepEqual(required, ['source_ref', 'type', 'binds_to', 'purpose']);
  assert.ok(!required.includes('output_placeholder'));
  const placeholder = assets.match(/^            output_placeholder:\n([\s\S]*?)(?=^            \w+:)/mu)?.[1];
  assert.ok(placeholder, 'existing mappings have no schema carrier');
  const pattern = new RegExp(placeholder.match(/pattern: '([^']+)'/u)[1], 'u');
  for (const valid of ['@image4', '@video3', '@audio12']) assert.ok(pattern.test(valid));
  for (const invalid of ['@image0', '@image 4', '@Image4', 'image4', '@video-3']) assert.ok(!pattern.test(invalid));
  for (const [file, content] of [
    ['IR', ir], ['compiler', read('modules/compiler.md')], ['L1 handoff', read('modules/shot-design.md')],
  ]) {
    assert.match(content, /output_placeholder/u, `${file} must preserve the mapping carrier`);
    assert.match(content, /空号[\s\S]*新[\s\S]*续号/u, `${file} must preserve gaps and append new sources`);
  }
});

test('runtime authority and conditional complete source reading remain distinct', () => {
  const compilerEntry = read('modules/compiler.md').split('## 1.')[0];
  assert.match(compilerEntry, /prompt-writing-sop\.md/u);
  assert.match(compilerEntry, /完整范本/u);
  assert.match(compilerEntry, /不再叠加成首次全册读取门槛/u);
  assert.match(compilerEntry, /同上下文同版本已完整取得[\s\S]*直接复用/u);
  assert.match(compilerEntry, /明确局部修订只取所涉完整手册节\/例[\s\S]*不因进入本页重读全册/u);
  assert.match(compilerEntry, /咨询\/诊断未要求成稿时不进入完整编译/u);
  assert.ok(existsSync(path.join(root, 'references/writing/handbook/INDEX.md')));
  assert.ok(existsSync(path.join(root, 'references/writing/handbook-gold-mai-long.md')));
});

test('long take phases and independent boundaries preserve events rather than timed or settled poses', () => {
  const take = section(read('references/writing/variants.md'), '## V2 一镜到底 / 长镜头穿行');
  assert.match(take, /连续事件节点[\s\S]*不编号为新镜头[\s\S]*不写逐秒动作节点/u);
  assert.doesNotMatch(take, /阶段只写时间节点/u);
  const timing = section(read('modules/action-design.md'), '## Beat Timing');
  assert.match(timing, /readable, inheritable world state and action phase, including continuing motion/u);
  assert.doesNotMatch(timing, /place it at a stable physical state/u);
  assert.match(timing, /prompt-writing-sop\.md#segment-boundary/u);
  const repair = section(read('modules/diagnosis.md'), '## Continuity Repair');
  assert.match(repair, /compatible incoming world\/action phase/u);
  assert.match(repair, /not identical visible framing or screen coordinates/u);
  assert.match(repair, /prompt-writing-sop\.md#segment-boundary/u);
  assert.doesNotMatch(repair, /visible end state = current segment's visible opening state/u);
});

test('diagnosis keeps independent cause chains and distinguishes findings from unsolicited repairs', () => {
  const diagnosis = read('modules/diagnosis.md');
  const causal = section(diagnosis, '## Earliest-Cause Order');
  assert.match(causal, /For each related symptom chain[\s\S]*independent causes[\s\S]*direct dependents/u);
  assert.match(causal, /do not force unrelated faults into one root cause/u);
  assert.doesNotMatch(causal, /explain every observed downstream symptom/u);
  const output = section(diagnosis, '## Minimal Repair Output');
  assert.match(output, /When repair is requested/u);
  assert.match(output, /only for findings[\s\S]*without an unsolicited replacement/u);
  assert.match(output, /for this symptom chain/u);
  assert.match(output, /do not add a whole-prompt review round/u);
});
