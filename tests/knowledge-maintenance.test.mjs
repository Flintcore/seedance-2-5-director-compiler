import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { refreshManifest, aggregateHash } from '../scripts/refresh-knowledge-manifest.mjs';
import { cleanKnowledge } from '../scripts/clean-knowledge.mjs';

test('inventory refresh preserves exact curated bodies and historical migration snapshot', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'seedance-curation-'));
  try {
    await mkdir(path.join(root, 'references/cinema'), { recursive: true });
    await mkdir(path.join(root, 'references/masters/example'), { recursive: true });
    const files = {
      'references/cinema/动作.md': '# 动作\r\n\r\n先转头，肩与重心随后参与；坐起保持受力。\r\n',
      'references/masters/example/作品.md': '# 作品\n\n看、所见、反应构成关系，教学重建保留条件。\n',
      'references/masters/example/_方法.md': '# 方法\n\n空间与声音。\n',
      'MIGRATION-MANIFEST.yaml': 'historical_snapshot: true\n',
    };
    for (const [file, body] of Object.entries(files)) await writeFile(path.join(root, file), body, 'utf8');
    const timestamp = '2026-09-11T00:00:00.000Z';
    const dry = await refreshManifest({ root, timestamp });
    assert.equal(dry.files, 3);
    await assert.rejects(readFile(path.join(root, 'KNOWLEDGE-MANIFEST.yaml')), { code: 'ENOENT' });
    const result = await refreshManifest({ root, write: true, timestamp });
    const manifest = await readFile(path.join(root, 'KNOWLEDGE-MANIFEST.yaml'), 'utf8');
    assert.equal(result.aggregate_sha256, dry.aggregate_sha256);
    await refreshManifest({ root, write: true, timestamp });
    assert.equal(await readFile(path.join(root, 'KNOWLEDGE-MANIFEST.yaml'), 'utf8'), manifest);
    for (const [file, body] of Object.entries(files)) assert.equal(await readFile(path.join(root, file), 'utf8'), body);
    // This must stop before any text cleaning or historical manifest replacement.
    await assert.rejects(cleanKnowledge({ skillRoot: root, write: true, manifests: true }), /protected from legacy rewriting/);
    for (const [file, body] of Object.entries(files)) assert.equal(await readFile(path.join(root, file), 'utf8'), body);
  } finally {
    assert.equal(path.dirname(path.resolve(root)), path.resolve(tmpdir()));
    assert.ok(path.basename(root).startsWith('seedance-curation-'));
    await rm(root, { recursive: true, force: true });
  }
});
test('inventory aggregate is order-independent but sensitive to paths and content hashes', () => {
  const a = { path: 'references/cinema/a.md', sha256: 'a'.repeat(64) };
  const b = { path: 'references/masters/b.md', sha256: 'b'.repeat(64) };
  assert.equal(aggregateHash([a, b]), aggregateHash([b, a]));
  assert.notEqual(aggregateHash([a, b]), aggregateHash([a, { ...b, sha256: 'c'.repeat(64) }]));
  assert.notEqual(aggregateHash([a, b]), aggregateHash([a, { ...b, path: 'references/masters/c.md' }]));
});
