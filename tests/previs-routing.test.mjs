// Structural wiring tests; realistic branch behavior is tested independently, not inferred from word counts.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => readFile(path.join(root, file), 'utf8');
test('conditional previs route is reachable from entry, compiler, orchestration and model index', async () => {
  for (const file of ['SKILL.md', 'modules/compiler.md', 'modules/orchestration.md', 'references/model/INDEX.md']) {
    assert.ok((await read(file)).includes('previs-reference.md'), file);
  }
  assert.ok((await stat(path.join(root, 'references/model/previs-reference.md'))).isFile());
});
test('restored knowledge scope resolves through entry and knowledge routing', async () => {
  for (const file of ['SKILL.md', 'modules/knowledge-routing.md']) assert.ok((await read(file)).includes('film-rule-scope.md'), file);
  assert.ok((await stat(path.join(root, 'modules/film-rule-scope.md'))).isFile());
  // All Markdown links from the optional module are actual in-skill dependencies.
  const file = 'references/model/previs-reference.md';
  const content = await read(file);
  for (const [, target] of content.matchAll(/\[[^\]\n]+\]\(([^)]+)\)/g)) {
    if (/^[a-z]+:/i.test(target)) continue;
    const full = path.resolve(root, path.dirname(file), target.split('#')[0]);
    assert.ok(!path.relative(root, full).startsWith('..'));
    assert.ok((await stat(full)).isFile(), target);
  }
});
