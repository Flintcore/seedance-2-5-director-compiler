// Maintenance contract regression, not a predictor of rendered exposure or acting.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => readFileSync(path.join(root, file), 'utf8');

test('motivated sources can remain offscreen and are not a fixture quota', () => {
 const s = read('modules/prompt-writing-sop.md');
 for (const term of ['整体照度、亮暗面积', '逻辑光源不等于灯具必须入画', '画外房间灯', '窗外月光或天空散射', '不为证明有来源新增壁灯、檐灯或光点']) assert.ok(s.includes(term), term);
 assert.ok(s.includes('不把所有夜外景统一成月光'));
 assert.ok(s.includes('柔光不等于大平光'));
});

test('approved darkness survives performance readability requirements', () => {
 const s = read('modules/prompt-writing-sop.md');
 for (const term of ['不等于每时刻五官', '暗侧失去纹理', '人物融入背景', '光源稳定不等于人脸亮度恒定', '不追光或用曝光补偿消除变化']) assert.ok(s.includes(term), term);
});

test('director design and existing IR carry source visibility and exposure', () => {
 const design = read('modules/shot-design.md'), ir = read('modules/director-ir.md');
 for (const term of ['整体照度、亮暗面积', '逻辑光源可以在画外', '不因要看表情', '固定光场不等于脸部曝光恒定']) assert.ok(design.includes(term), term);
 assert.ok(ir.includes('沿已有 `look_and_sound`'));
 assert.ok(ir.includes('不新增字段或数值配额'));
});

test('continuous reference transfer retains viewing distance not only a route', () => {
 const s = read('modules/shot-design.md');
 for (const term of ['人物与摄影机的起止距离', '主体画幅占比', '到达同一扇门不等于', '不把每场都改成最后推脸']) assert.ok(s.includes(term), term);
});

test('compilation and template do not invent readability fill', () => {
 const s = read('modules/compiler.md'), t = read('modules/prompt-template.md');
 for (const term of ['来源可在画外', '既定月光不替换成工作灯', '不另添正面或轮廓补光']) assert.ok(s.includes(term), term);
 assert.ok(t.includes('不以五官和黑衣细节始终清楚为目标'));
 assert.ok(read('modules/diagnosis.md').includes('compare the result to the actual prompt first'));
});

test('final pass remains six basic fidelity checks with no relighting research', () => {
 const s = read('modules/delivery-check.md');
 assert.deepEqual([...s.matchAll(/^(\d+)\. /gmu)].map(m => Number(m[1])), [1,2,3,4,5,6]);
 for (const term of ['不重新查库设计灯位', '未把灯具拍入不算遗漏', '不按脸是否始终清楚判合格', '有方向和层次的柔光、高调保留']) assert.ok(s.includes(term), term);
});

test('entry, design, compile and final checks link to the same project policy anchor', () => {
 const sop = read('modules/prompt-writing-sop.md');
 const anchor = '<a id="project-flat-light-ban"></a>';
 assert.equal(sop.split(anchor).length, 2);
 for (const f of ['SKILL.md', 'modules/shot-design.md', 'modules/compiler.md', 'modules/film-rule-scope.md', 'modules/delivery-check.md']) {
  const link = [...read(f).matchAll(/\[[^\]]+\]\(([^)]+)#project-flat-light-ban\)/gu)][0];
  assert.ok(link, f);
  const target = path.resolve(root, path.dirname(f), link[1]);
  assert.equal(target, path.join(root, 'modules/prompt-writing-sop.md'));
  assert.ok(readFileSync(target,'utf8').includes(anchor));
 }
});

test('project policy bars automatic flat-fill exemptions and preserves conditional dark onset', () => {
 const s = read('modules/prompt-writing-sop.md');
 for (const term of ['禁止以正面均匀补亮', '都不构成豁免', '只有导演明确修改这一约束才可例外', '不改写通用电影知识', '导演锁定极暗起步时', '不偷换成身体清楚', '不把这一显露曲线套给所有场景']) assert.ok(s.includes(term), term);
 const d = read('modules/delivery-check.md');
 assert.ok(!d.includes('有依据的柔光、高调或正面光保留'));
 assert.ok(d.includes('不打开链接重新研究'));
});
