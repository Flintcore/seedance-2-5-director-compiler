import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const slug = s => s.replace(/<[^>]+>/gu, '').trim().toLowerCase()
  .replace(/[\p{P}\p{S}]/gu, c => /[-_]/u.test(c) ? c : '')
  .replace(/ /gu, '-');

// Maintenance only: a reachable file is not proof that its linked section exists,
// and a valid section is not proof of runtime reading or creative quality.
test('explicit runtime section links resolve to real headings or HTML anchors', () => {
  const sources = ['SKILL.md', ...['modules', 'references/writing', 'references/model']
    .filter(dir => existsSync(path.join(root, dir)))
    .flatMap(dir => readdirSync(path.join(root, dir))
      .filter(name => name.endsWith('.md')).map(name => `${dir}/${name}`))];
  let checked = 0;
  for (const source of sources) {
    const text = readFileSync(path.join(root, source), 'utf8');
    for (const [, raw] of text.matchAll(/\[[^\]\r\n]+\]\(([^)\r\n]*#[^)\r\n]+)\)/gu)) {
      if (/^[a-z][a-z0-9+.-]*:/iu.test(raw)) continue;
      const [relative, encodedAnchor] = raw.split('#');
      const target = relative ? path.resolve(root, path.dirname(source), decodeURIComponent(relative))
        : path.join(root, source);
      assert.ok(!path.relative(root, target).startsWith('..'), `${source}: outside root: ${raw}`);
      assert.ok(existsSync(target), `${source}: missing file: ${raw}`);
      const body = readFileSync(target, 'utf8');
      const anchors = new Set([...body.matchAll(/\bid=["']([^"']+)["']/gu)].map(m => m[1]));
      const counts = new Map();
      for (const [, heading] of body.matchAll(/^#{1,6}\s+(.+)\r?$/gmu)) {
        const base = slug(heading), count = counts.get(base) ?? 0;
        anchors.add(count ? `${base}-${count}` : base); counts.set(base, count + 1);
      }
      assert.ok(anchors.has(decodeURIComponent(encodedAnchor)), `${source}: missing section: ${raw}`);
      checked++;
    }
  }
  assert.ok(checked > 0, 'no runtime section links checked');
});
