// Source/decision/compile handoff regression, not rendered-lighting validation.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => readFileSync(path.join(root, file), 'utf8');
const owners = ['modules/shot-design.md','modules/director-ir.md','modules/compiler.md','modules/knowledge-routing.md','modules/diagnosis.md'];
const target = 'prompt-writing-sop.md#lighting-design-transfer';
const missing = sources => owners.filter(f => ![...sources[f].matchAll(/\]\(([^)]+)\)/gu)].some(m => m[1] === target));

test('lighting methods have a single design-transfer target reachable by their actual owners', () => {
 const sources = Object.fromEntries(owners.map(f => [f, read(f)]));
 assert.deepEqual(missing(sources), []);
 const sop = read('modules/prompt-writing-sop.md');
 assert.equal((sop.match(/<a id="lighting-design-transfer"><\/a>/gu) || []).length, 1);
 for (const f of owners) {
  const resolved = path.resolve(root, path.dirname(f), target.split('#')[0]);
  assert.equal(resolved, path.join(root, 'modules/prompt-writing-sop.md'));
 }
 const design = read('modules/shot-design.md');
 assert.ok(design.includes('../references/cinema/光影设计参考库.md#world-light-continuity'));
 assert.ok(read('references/cinema/光影设计参考库.md').includes('<a id="world-light-continuity"></a>'));
});

test('a global source index cannot conceal a removed design or compilation handoff', () => {
 for (const owner of owners) {
  const sources = Object.fromEntries(owners.map(f => [f, read(f)]));
  sources[owner] = sources[owner].replaceAll(target, 'prompt-template.md');
  assert.deepEqual(missing(sources), [owner]);
 }
});

test('the existing final pass stays six checks rather than another design/research phase', () => {
 const final = read('modules/delivery-check.md');
 assert.deepEqual([...final.matchAll(/^(\d+)\. /gmu)].map(m => Number(m[1])), [1,2,3,4,5,6]);
 assert.ok(!final.includes(target));
});
