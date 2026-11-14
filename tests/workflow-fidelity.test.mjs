// Maintained final-pass contract only; these tests do not judge generated shots.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => readFileSync(path.join(root, file), 'utf8');
const contract = read('modules/delivery-check.md');
const item = number => contract.split(/\r?\n/u).find(line => line.startsWith(`${number}. `));

test('existing six-item pass owns structure and approved compact exceptions', () => {
  assert.deepEqual([...contract.matchAll(/^(\d+)\. /gmu)].map(match => Number(match[1])), [1, 2, 3, 4, 5, 6]);
  const structure = item(1);
  assert.match(structure, /【本段目标】→【参考绑定】→【空间】→【环境】→【时间线】→【声音】→【不可出错】/u);
  assert.match(structure, /对白密集V3允许声音块移至空间后/u);
  assert.match(structure, /只有用户明确要求4—8秒精简单镜.*手册①1\.7/u);
  assert.match(structure, /空间\/环境融入镜内.*不按缺七块判错.*不因时长短自动省栏/u);
  assert.match(read('references/writing/handbook-adaptation.md'), /V3.*声音移至空间后/u);
  assert.match(read('modules/prompt-template.md'), /用户明确要求4—8秒单镜精简.*原文①1\.7/u);
});

test('existing generation and material bounds do not invent per-type quotas', () => {
  const structure = item(1);
  assert.match(structure, /单条生成4–30秒/u);
  assert.match(structure, /实际参考素材总数至多50/u);
  assert.match(structure, /不在末检新设分类型上限/u);
  assert.match(structure, /没有外部素材就如实说明，不虚构引用/u);
  assert.match(structure, /每份素材仅绑定区一次/u);
  assert.doesNotMatch(structure, /(?:图片|视频|音频)(?:最多|至多|上限)(?:为)?\s*\d+/u);
});

test('approved causal acting and audiovisual decisions survive compilation', () => {
  const fidelity = item(5);
  for (const term of ['已批准设计', '关键事件因果', '人物接收/阻碍及继续或调整',
    '动作接触/受力与后果', '声画显露或隐藏的载体及发生时机', '不被删成仅有情绪或结果词']) {
    assert.ok(fidelity.includes(term), term);
  }
  assert.match(fidelity, /仅核已定内容保真，不添表演或审美配额/u);
  assert.match(fidelity, /因果可跨镜成立.*有意静止、隐藏反应和留白照留.*不要求每镜走完一套动作链/u);
});

test('an empty extra-limit list remains a valid ending', () => {
  const limits = item(6);
  assert.match(limits, /零到少量.*不设3–6条下限/u);
  assert.match(limits, /没有额外条件时写“无额外限制。”/u);
  assert.match(limits, /不发明限制填空/u);
});

test('fidelity stays in the existing pass without knowledge rereads or a new loop', () => {
  assert.match(contract, /compiler在现有编译末尾完成，多Agent由既有独立环6完成；不增加另一轮/u);
  assert.match(contract, /不读取影视库、大师库、手册全文或成稿范本/u);
  assert.match(contract, /不调用开发检查脚本/u);
  assert.match(contract, /已有设计只是漏写，定点补表达/u);
  assert.match(contract, /实质改变批准拍法、事件或用户锁则回负责设计决定/u);
  assert.match(contract, /文字通过不代表真实光学\/表演\/生成成片通过/u);
  const owner = existsSync(path.join(root, 'modules/compiler.md')) ? 'modules/compiler.md' : 'modules/agent-6-reviewer.md';
  assert.match(read(owner), /delivery-check\.md/u);
});

test('conditional lighting and distinct segment boundaries are retained', () => {
  assert.match(item(4), /不以是否采用伦勃朗、低调或固定正邪配色判合格/u);
  assert.match(item(4), /有依据的柔光、高调或正面光保留/u);
  assert.match(item(4), /丁达尔束有光路与介质/u);
  assert.match(item(3), /180°.*独立生成segment.*同轴侧视角至少30°/u);
  assert.match(item(3), /首尾帧\/源片延长时另记例外/u);
});

const siblingName = path.basename(root) === 'seedance-2-5-director-compiler' ? 'seedance-agent-2-5' : 'seedance-2-5-director-compiler';
const sibling = path.join(path.dirname(root), siblingName, 'modules/delivery-check.md');
test('installed paired skills retain byte-identical delivery contracts', {skip: !existsSync(sibling)}, () => {
  assert.deepEqual(readFileSync(path.join(root, 'modules/delivery-check.md')), readFileSync(sibling));
});
