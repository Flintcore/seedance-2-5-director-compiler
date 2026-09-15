import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = p => readFileSync(path.join(root, p), 'utf8');
const facePath = "references/cinema/面部表情四部位参考库.md";
const routePath = "modules/knowledge-routing.md";

test('conditional face reference resolves to a real AU chapter with unambiguous action definitions', () => {
  const entry = read('SKILL.md');
  assert.ok(entry.includes('modules/micro-performance.md'));
  const bridge = read('modules/micro-performance.md');
  assert.ok(bridge.includes(facePath));
  const face = read(facePath);
  assert.match(face, /^## .*AU \/ FACS 动作参照/m);
  const rows = new Map([...face.matchAll(/^\| (AU\d+) \| ([^|]+) \|$/gm)].map(m => [m[1], m[2].trim()]));
  for (const [id, shape] of Object.entries({AU9:'皱鼻', AU23:'唇部收紧、变窄', AU24:'双唇压合', AU25:'双唇分开', AU26:'下颌下落', AU6:'脸颊抬起'})) {
    assert.equal(rows.get(id), shape, id);
  }
  assert.ok(face.includes('https://www.cs.cmu.edu/~face/facs.htm'));
  assert.ok(face.includes('https://www.paulekman.com/facial-action-coding-system/'));
  assert.doesNotMatch(face, /AU9 弱|AU23 抖|AU23\+AU31|AU32 类/);
});

test('each newly surfaced specialist route points to an existing body with actual chapters', () => {
  const route = read(routePath);
  for (const name of ["机位技术规格详细参数库", "表演意义化与武戏状态影响", "对白情绪表达参考库", "镜头心理变化与情绪递进参考库", "色彩调性参考库", "空镜素材库", "导演视觉风格参考库", "讲戏口语解析参考库"]) {
    assert.ok(route.includes(name), name);
    const target = path.join("references/cinema", name + '.md');
    assert.ok(existsSync(path.join(root, target)), target);
    assert.match(read(target), /^## /m, target);
  }
});

test('methodology discovery can use real files in selected director directories', () => {
  assert.ok(read(routePath).includes('`_*.md`'));
  const masters = path.join(root, 'references/masters');
  // Directory discovery, not a fixed filename guessed from a Chinese director name.
  for (const dir of readdirSync(masters, {withFileTypes:true}).filter(e => e.isDirectory())) {
    const files = readdirSync(path.join(masters, dir.name));
    if (!files.some(f => f.endsWith('.md') && !f.startsWith('_'))) continue;
    const methods = files.filter(f => f.startsWith('_') && f.endsWith('.md'));
    assert.ok(methods.length > 0, dir.name);
    for (const m of methods) assert.match(read(`references/masters/${dir.name}/${m}`), /^## /m);
  }
});
