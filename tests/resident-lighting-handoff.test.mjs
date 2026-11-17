// Maintenance reachability and drift tests; generated lighting still needs visual validation.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => readFileSync(path.join(root, file), 'utf8');
const owners = ['SKILL.md', 'modules/runtime-foundation.md', 'modules/compiler.md', 'modules/prompt-template.md'];
const target = path.join(root, 'modules/prompt-writing-sop.md');
const anchor = 'scene-video-lighting';
const links = text => [...text.matchAll(/\]\(([^)]+)\)/gu)].map(m => m[1]);
function missingHandoffs(texts) {
  return owners.filter(file => !links(texts[file]).some(href => {
    const [name, id] = href.split('#');
    return id === anchor && path.resolve(root, path.dirname(file), name) === target;
  }));
}

test('entry, resident design, compiler and actual template reach the same two-layer contract', () => {
  assert.deepEqual(missingHandoffs(Object.fromEntries(owners.map(f => [f, read(f)]))), []);
  const sop = read('modules/prompt-writing-sop.md');
  assert.equal((sop.match(new RegExp(`<a id="${anchor}"><\\/a>`, 'gu')) || []).length, 1);
  const start = sop.indexOf(`<a id="${anchor}"></a>`);
  assert.ok(start > sop.indexOf('<a id="world-lighting"></a>'));
  assert.ok(start < sop.indexOf('<a id="standalone-segment"></a>'));
  const contract = sop.slice(start, sop.indexOf('\n\n', start + (`<a id="${anchor}"></a>\n`).length));
  for (const destination of ['【参考绑定】','【环境】','【时间线】']) assert.ok(contract.includes(destination), destination);
});

test('removing any real design or compile handoff is detected even while the source still exists', () => {
  for (const owner of owners) {
    const texts = Object.fromEntries(owners.map(f => [f, read(f)]));
    texts[owner] = texts[owner].replaceAll(`#${anchor}`, '#world-lighting');
    assert.deepEqual(missingHandoffs(texts), [owner]);
  }
});

test('film source note is reachable without becoming the resident design body or another final pass', () => {
  const source = path.join(root, 'references/writing/film-lighting-sources.md');
  for (const owner of ['modules/runtime-foundation.md', 'modules/prompt-writing-sop.md', 'references/writing/knowledge-map.md']) {
    assert.ok(links(read(owner)).some(href => path.resolve(root, path.dirname(owner), href.split('#')[0]) === source), owner);
  }
  const foundation = read('modules/runtime-foundation.md');
  const lighting = foundation.split('## 4. ')[1].split('## 5. ')[0];
  assert.ok(lighting.indexOf('剪影') < lighting.indexOf('film-lighting-sources.md'));
  assert.ok(lighting.indexOf('补光先回答') < lighting.indexOf('film-lighting-sources.md'));
  const final = read('modules/delivery-check.md');
  assert.deepEqual([...final.matchAll(/^(\d+)\. /gmu)].map(m => Number(m[1])), [1,2,3,4,5,6]);
  assert.ok(!final.includes('film-lighting-sources.md'));
});
