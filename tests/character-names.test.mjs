import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { lexInlineText } from '../scripts/inline-dialogue.mjs';

// Maintenance-only guards for curated formal examples. This is not a general
// Chinese coreference detector and never runs as a prompt-generation gate.
// Forward behavior trials remain outside the skill and require semantic review.
const files = ["references/model/shot-prose-example.md", "references/model/character-event-examples.md"];
const examples = (await Promise.all(files.map(async file => {
  const source = await readFile(new URL('../' + file, import.meta.url), 'utf8');
  return [...source.matchAll(/`{3}text\r?\n([\s\S]*?)\r?\n`{3}/gu)].map(m => m[1]);
}))).flat();
const looseCharacter = /自己|对方|前者|后者|他们|她们|它们|(?<!其)[他她它]/u;
function descriptions(text, options = {}) {
  const result = lexInlineText(text, options);
  assert.deepEqual(result.errors, []);
  return result.structuralText + '\n' + result.quotes.flatMap(q => q.annotations.map(a => a.text)).join('\n');
}

test('curated formal samples keep explicit character references outside source quotes', () => {
  assert.equal(examples.length, 4);
  for (const example of examples) assert.doesNotMatch(descriptions(example), looseCharacter);
});

test('example guard catches pronoun regressions without treating source words as character instructions', () => {
  const original = examples[0];
  const name = "女人";
  const shotStart = original.indexOf('【时间线】');
  const changed = original.slice(0, shotStart) + original.slice(shotStart).replace(name, '自己');
  assert.notEqual(changed, original);
  assert.match(descriptions(changed), looseCharacter);
  const source = '小明看向小林。小明说：“他让我自己来。”纸条写着“他会回来”。';
  assert.doesNotMatch(descriptions(source), looseCharacter);
  assert.deepEqual(lexInlineText(source, {speakerNames: ['小明', '小林']}).dialogue.map(({speaker, text}) => ({speaker, text})),
    [{speaker:'小明', text:'他让我自己来。'}]);
});

test('new performance annotations keep explicit owners while literal spoken brackets remain protected', () => {
  const source = '小明说：“他让我自己来，【小明停一拍，目光落在小林脸上】我就来了。”';
  const options = {expectedDialogue:[{speaker:'小明', text:'他让我自己来，我就来了。'}]};
  assert.doesNotMatch(descriptions(source, options), looseCharacter);
  assert.match(descriptions(source.replace('目光落在小林脸上', '目光落在他脸上'), options), looseCharacter);
  assert.equal(lexInlineText(source, options).dialogue[0].text, options.expectedDialogue[0].text);
  const literal = '小明读出：“【他自己来】”';
  const baseline = {expectedDialogue:[{speaker:'小明', text:'【他自己来】'}]};
  assert.doesNotMatch(descriptions(literal, baseline), looseCharacter);
  assert.equal(lexInlineText(literal, baseline).dialogue[0].text, '【他自己来】');
});

test('same-subject predicates, named recipients, natural unnamed labels and reflections remain valid prose', () => {
  const text = '小明抬手，握住门把，推开门。小明看向小雨。小雨握住小明的右手。门外人物站在走廊里。镜中只见小明的倒影。';
  assert.doesNotMatch(descriptions(text), looseCharacter);
  assert.deepEqual(lexInlineText(text).dialogue, []);
  // This tests the boundary helper, not whether a generated image gets it right.
});
