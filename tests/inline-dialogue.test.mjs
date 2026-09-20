import assert from 'node:assert/strict';
import test from 'node:test';
import { lexInlineText } from '../scripts/inline-dialogue.mjs';
const facts = result => result.dialogue.map(({ speaker, spoken_text }) => ({ speaker, text: spoken_text }));

test('inline lexer handles natural speech cues and source names without forcing one speech verb', () => {
  const cases = [
    ['林岚抬眼看向站在桌对面的陈默，语气清楚但没有拔高地问：“你不是说他昨晚没有回来吗？”', '林岚'],
    ['陈默的画外音继续说：“我只说，门一直关着。”', '陈默'],
    ['广播里传来播音员的声音：“列车即将进站。”', '播音员'],
    ['旁白：“那天，我没有离开。”', '旁白'],
    ['林岚下颌松一点，平静而保留余地地说：“好，你说。”', '林岚'],
    ['锅巴发出：“gu ba”', '锅巴'],
    ['父亲低声读出：“门没有锁。”', '父亲'],
  ];
  for (const [input, name] of cases) {
    const result = lexInlineText(input);
    assert.deepEqual(result.errors, [], input);
    assert.equal(result.dialogue.length, 1, input);
    assert.equal(result.dialogue[0].speaker, name, input);
  }
});
test('ordinary quotations, labels and paper contents are not silently called speech', () => {
  const result = lexInlineText('纸条写着“回家”，她看着所谓的“保证”，标题是“光影：”。陈默说：“我知道。”');
  assert.equal(result.quotes.length, 4);
  assert.deepEqual(facts(result), [{ speaker: '陈默', text: '我知道。' }]);
  assert.equal(result.structuralText.includes('光影：'), false);
});
test('internal directions preserve raw spans and Unicode spoken offsets, not literal words', () => {
  const input = '林岚说：“🙂【短暂停顿】好，【她放低声音】我等你。”';
  const result = lexInlineText(input);
  assert.equal(result.dialogue[0].spoken_text, '🙂好，我等你。');
  assert.deepEqual(result.dialogue[0].annotations.map(item => item.spokenOffset), [1, 3]);
  for (const annotation of result.dialogue[0].annotations) assert.equal(input.slice(annotation.start, annotation.end), '【' + annotation.text + '】');
});
test('a source baseline preserves literal bracket text instead of inventing a direction', () => {
  const text = '原文是【请勿入内】。';
  const result = lexInlineText('父亲读出：“' + text + '”', { expectedDialogue: [{ speaker: '父亲', text }] });
  assert.deepEqual(result.errors, []);
  assert.deepEqual(facts(result), [{ speaker: '父亲', text }]);
  assert.deepEqual(result.dialogue[0].annotations, []);
  assert.equal(result.dialogue[0].literalSourceDelimiters, true);
});
test('source names disambiguate a surface cue but never silently change an explicit other speaker', () => {
  const result = lexInlineText('陈从远看着李宁，停一拍后说：“好。”', { expectedDialogue: [{ speaker: '陈从远', text: '好。' }] });
  assert.equal(result.dialogue[0].speaker, '陈从远');
  assert.equal(result.dialogue[0].speakerResolution, 'supplied-name-cue');
  const changed = lexInlineText('李宁说：“好。”', { expectedDialogue: [{ speaker: '陈从远', text: '好。' }] });
  assert.equal(changed.dialogue[0].speaker, '李宁');
});
test('uncertain subject resolution stays explicit rather than claiming a named character', () => {
  const result = lexInlineText('轻声说：“好。”');
  assert.equal(result.dialogue.length, 1);
  assert.equal(result.dialogue[0].speaker, null);
  assert.equal(result.dialogue[0].speakerResolution, 'unresolved');
});
test('ASCII double quotes are compatible without treating quoted terms as dialogue', () => {
  const result = lexInlineText('陈默说："我只说，门一直关着。"纸条写着"回家"。');
  assert.deepEqual(result.errors, []);
  assert.deepEqual(facts(result), [{ speaker: '陈默', text: '我只说，门一直关着。' }]);
});

test('a provided exact source preserves its original nested quote characters', () => {
  const text = '他说“别走”，纸上写着【请勿入内】。';
  const result = lexInlineText('陈默说：“' + text + '”', { expectedDialogue: [{ speaker: '陈默', text }] });
  assert.deepEqual(result.errors, []);
  assert.deepEqual(facts(result), [{ speaker: '陈默', text }]);
  assert.deepEqual(result.dialogue[0].annotations, []);
});
