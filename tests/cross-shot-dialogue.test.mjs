import assert from 'node:assert/strict';
import test from 'node:test';
import { compareDialogue, canonicalShotId } from '../scripts/dialogue-baseline.mjs';
import { validatePrompt as validate } from '../scripts/validate-prompt.mjs';

// Small maintenance inputs only; these are not generated creative trial prompts.
const whole = '我昨晚离开的时候，那盏灯还亮着。';
const first = '我昨晚离开的时候，', last = '那盏灯还亮着。';
const source = [{ speaker: '陈砚', text: whole }];
const mapped = [{ speaker: '陈砚', text: whole, fragments: [
  { shot_id: 'SH01', text: first }, { shot_id: '镜头2', text: last },
] }];
function prompt(lines) {
  const duration = Math.max(4, lines.length * 2);
  const time = seconds => '0:' + String(seconds).padStart(2, '0');
  return ['【风格】数字摄影。', '【素材绑定】无外部参考素材。', '【全局约束】无额外全局约束。',
    '【本段戏剧任务】保留本段对话。', '【本段情绪总控】平静交流。',
    ...lines.map((speech, index) => '镜头' + (index + 1) + '｜' + time(index * 2) + '-' + time(index === lines.length - 1 ? duration : (index + 1) * 2)
      + '\n50mm中景，平视固定。起始画面中，两人站在桌边。'
      + speech + (index === lines.length - 1 ? '话音落下后，两人仍站在桌边。' : '')
      + '光影：工作灯照亮桌边。现场声：持续的通风声。')].join('\n');
}
const two = () => prompt(['陈砚说：“' + first + '”', '陈砚的画外音继续说：“' + last + '”']);
const facts = result => result.facts ?? result;
const errors = result => result.errors.map(error => typeof error === 'string' ? error.split(':')[0] : error.code);
const speech = result => facts(result).utterances ?? facts(result).dialogue;
const check = (input, expectedDialogue) => validate(input, { expectedDialogue });
const pass = result => assert.equal(result.ok, true, JSON.stringify(result.errors));

test('whole-source baseline accepts two or three exact shot fragments without claiming placement', () => {
  for (const input of [two(), prompt(['陈砚说：“' + first + '”', '陈砚的画外音继续说：“那盏灯”', '陈砚的画外音继续说：“还亮着。”'])]) {
    const result = check(input, source);
    pass(result);
    assert.equal(facts(result).dialogueCheck.textMatches, true);
    assert.equal(facts(result).dialogueCheck.shotMatches, null);
    assert.equal(facts(result).dialogueCheck.shotCoverage, 'none');
    assert.equal(speech(result).map(item => item.text).join(''), whole);
  }
});

test('explicit fragments verify two-shot L-cut source and three-shot continuing speech', () => {
  pass(check(two(), mapped));
  const input = prompt(['陈砚说：“' + first + '”', '陈砚的画外音继续说：“那盏灯”', '陈砚的画外音继续说：“还亮着。”']);
  const result = check(input, [{ speaker: '陈砚', spoken_text: whole, fragments: [
    { shot_id: 'S1', text: first }, { shot_id: 'SH02', text: '那盏灯' }, { shot_id: '镜头3', text: '还亮着。' },
  ] }]);
  pass(result);
  assert.equal(facts(result).dialogueCheck.shotCoverage, 'all');
  assert.equal(facts(result).dialogueCheck.shotMatches, true);
  assert.deepEqual(speech(result).map(item => item.shot_id), ['S1', 'S2', 'S3']);
});

test('source offsets are retained inside each actual shot body', () => {
  const result = check(two(), mapped);
  pass(result);
  for (const shot of facts(result).shots) {
    const observed = shot.utterances ?? shot.dialogue;
    assert.equal(observed[0].shot_id, 'S' + shot.number);
    assert.equal(observed[0].raw, '“' + observed[0].text + '”');
    assert.ok(observed[0].end > observed[0].start);
  }
});

test('missing, duplicate, changed words, changed punctuation and wrong speaker fail exact preservation', () => {
  const mutations = [
    two().replace('陈砚的画外音继续说：“' + last + '”', '陈砚的声音继续。'),
    two().replace(last, last + last),
    two().replace('昨晚', '昨天'),
    two().replace(last, '那盏灯还亮着！'),
    two().replace('陈砚的画外音', '阿宁的画外音'),
  ];
  for (const input of mutations) assert.ok(errors(check(input, mapped)).includes('DIALOGUE_LOCK'));
});

test('a whole quote in the onset shot is not valid against per-shot allocation', () => {
  const input = prompt(['陈砚说：“' + whole + '”', '阿宁听着陈砚继续说话。']);
  const result = check(input, mapped);
  assert.equal(facts(result).dialogueCheck.textMatches, true);
  assert.ok(errors(result).includes('DIALOGUE_SHOT'));
  // Without a placement baseline the checker has no evidence of the cut word.
  pass(check(input, source));
});

test('correct words moved to a wrong shot or to a wrong cut boundary are detected', () => {
  for (const input of [
    prompt(['陈砚说：“' + first + '”陈砚继续说：“' + last + '”', '阿宁听着。']),
    prompt(['阿宁听着。', '陈砚的画外音说：“' + first + '”陈砚继续说：“' + last + '”']),
    prompt(['陈砚说：“' + first + '那盏”', '陈砚的画外音继续说：“灯还亮着。”']),
  ]) {
    const result = check(input, mapped);
    assert.equal(facts(result).dialogueCheck.textMatches, true);
    assert.ok(errors(result).includes('DIALOGUE_SHOT'));
  }
});

test('legacy single-shot shot_id constrains all fragments of its original line to that shot', () => {
  const expected = [{ speaker: '陈砚', text: whole, shot_id: 'SH01' }];
  pass(check(prompt(['陈砚说：“' + first + '”陈砚继续说：“' + last + '”']), expected));
  assert.ok(errors(check(two(), expected)).includes('DIALOGUE_SHOT'));
});

test('adjacent independent source lines from one speaker retain their utterance boundaries', () => {
  const expected = [{ speaker: '陈砚', text: '好。' }, { speaker: '陈砚', text: '走。' }];
  pass(check(prompt(['陈砚说：“好。”陈砚接着说：“走。”']), expected));
  assert.ok(errors(check(prompt(['陈砚说：“好。走。”']), expected)).includes('DIALOGUE_LOCK'));
  assert.ok(errors(check(prompt(['陈砚说：“走。”陈砚接着说：“好。”']), expected)).includes('DIALOGUE_LOCK'));
});

test('intentional repeated source lines are neither deduplicated nor globally concatenated', () => {
  const expected = [{ speaker: '陈砚', text: '好。' }, { speaker: '陈砚', text: '好。' }];
  pass(check(prompt(['陈砚说：“好。”陈砚接着说：“好。”']), expected));
  for (const input of [prompt(['陈砚说：“好。”']), prompt(['陈砚说：“好。”陈砚接着说：“好。”陈砚再说：“好。”'])])
    assert.ok(errors(check(input, expected)).includes('DIALOGUE_LOCK'));
});

test('narrator, device voice and J-cut sources can continue without being assigned to the visible listener', () => {
  for (const [speaker, beginning, continuation] of [
    ['旁白', '旁白：', '旁白：'],
    ['播音员', '广播里传来播音员的声音：', '广播里传来播音员的声音：'],
    ['陈砚', '陈砚的画外音说：', '陈砚说：'],
  ]) {
    const input = prompt([beginning + '“前半句，”', continuation + '“后半句。”']);
    pass(check(input, [{ speaker, text: '前半句，后半句。', fragments: [
      { shot_id: 'S1', text: '前半句，' }, { shot_id: 'S2', text: '后半句。' },
    ] }]));
  }
});

test('nonspoken direction inside a fragment keeps exact words and observed annotation offsets', () => {
  const result = check(two().replace(last, '那盏灯【他压低声音】还亮着。'), mapped);
  pass(result);
  const second = speech(result)[1];
  assert.equal(second.text, last);
  assert.equal(second.annotations[0].text, '他压低声音');
  assert.equal(second.annotations[0].spokenOffset, 3);
});

test('explicit fragment originals preserve literal nested quotes and brackets', () => {
  const a = '他说“别走”，', b = '纸上写着【请勿入内】。';
  const result = check(prompt(['陈砚说：“' + a + '”', '陈砚的画外音继续说：“' + b + '”']),
    [{ speaker: '陈砚', text: a + b, fragments: [{ shot_id: 'S1', text: a }, { shot_id: 'S2', text: b }] }]);
  pass(result);
  assert.deepEqual(speech(result).map(item => item.text), [a, b]);
  assert.ok(speech(result).every(item => item.annotations.length === 0));
});

test('no speech and ordinary quoted labels remain empty while an absent baseline makes no exact claim', () => {
  pass(check(prompt(['纸上写着“回家”。']), []));
  const result = check(two(), undefined);
  pass(result);
  assert.equal(facts(result).dialogueCheck.textMatches, null);
  assert.equal(facts(result).dialogueCheck.shotMatches, null);
  assert.ok(errors(check(two(), [])).includes('DIALOGUE_LOCK'));
});

test('partial shot evidence is reported as partial rather than all shots verified', () => {
  const input = prompt(['陈砚说：“好。”', '阿宁说：“走。”']);
  const result = check(input, [{ speaker: '陈砚', text: '好。', shot_id: 'S1' }, { speaker: '阿宁', text: '走。' }]);
  pass(result);
  assert.equal(facts(result).dialogueCheck.shotCoverage, 'partial');
});

test('invalid source/fragment baselines are diagnosed instead of filling or rewriting text', () => {
  for (const expected of [
    null, {}, [null],
    [{ speaker: '陈砚', text: whole, fragments: [] }],
    [{ speaker: '陈砚', text: whole, fragments: [{ shot_id: 'S1', text: first }] }],
    [{ speaker: '陈砚', text: whole, shot_id: 'entrance' }],
    [{ ...mapped[0], shot_id: 'S1' }],
    [{ speaker: '陈砚', text: whole, fragments: [{ shot_id: 'S0', text: whole }] }],
  ]) assert.ok(errors(check(two(), expected)).includes('DIALOGUE_BASELINE'));
});

test('numeric shot aliases are explicit and arbitrary semantic identifiers are not guessed', () => {
  assert.deepEqual(['S1', 'SH01', '镜头1', '镜头 01'].map(canonicalShotId), ['S1', 'S1', 'S1', 'S1']);
  for (const value of ['reaction', 'S0', 'S1-extra', undefined]) assert.equal(canonicalShotId(value), null);
});

test('interleaved speech with only whole-line baselines is not falsely matched by grouping speakers', () => {
  const result = compareDialogue([
    { speaker: '陈砚', text: first, shot_id: 'S1' },
    { speaker: '阿宁', text: '等一下。', shot_id: 'S2' },
    { speaker: '陈砚', text: last, shot_id: 'S3' },
  ], [...source, { speaker: '阿宁', text: '等一下。' }]);
  assert.equal(result.textMatches, false);
  assert.ok(result.errors.some(error => error.code === 'DIALOGUE_LOCK'));
  // This is a sequential lexical scope limit, not a prohibition on overlap or
  // interruption. Such a delivery needs an explicit ordered spoken-piece baseline.
});
