import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { lexInlineText } from "../scripts/inline-dialogue.mjs";
import { validatePrompt } from "../scripts/validate-prompt.mjs";

const document = await readFile(new URL("../references/model/character-event-examples.md", import.meta.url), "utf8");
const examples = [...document.matchAll(/\x60{3}text\r?\n([\s\S]*?)\r?\n\x60{3}/gu)].map((match) => match[1]);
const utterances = (text) => lexInlineText(text, { speakerNames: ["陈砚", "阿宁"] }).dialogue;
const speechFacts = ({ speaker, text }) => ({ speaker, text });
const expectedLine = "我昨晚离开的时候，那盏灯还亮着。";
const firstPart = "我昨晚离开的时候，", lastPart = "那盏灯还亮着。";
const followupLine = "你再想想。";
const dialogueBaseline = [
  { speaker: "陈砚", text: expectedLine, fragments: [{ shot_id: "S1", text: firstPart }, { shot_id: "S2", text: lastPart }] },
  { speaker: "阿宁", text: followupLine, shot_id: "S2" },
];

// These are maintenance contracts of complete examples, not keyword/length
// scores for acting, physical credibility or narrative quality. Independent
// forward trials inspect meaning; no runtime generation calls these tests.
test("all three full examples retain the six-part contract, timings and asset duties", () => {
  assert.equal(examples.length, 3);
  const contracts = [
    { duration: 12, times: [[1, 0, 4.5], [2, 4.5, 12]], assets: ["@image1", "@image2", "@image3", "@audio1"] },
    { duration: 10, times: [[1, 0, 10]], assets: ["@image1", "@image2", "@image3"] },
    { duration: 4, times: [[1, 0, 4]], assets: [] },
  ];
  examples.forEach((example, index) => {
    const result = validatePrompt(example);
    assert.equal(result.ok, true, JSON.stringify(result.errors));
    assert.equal(result.facts.duration, contracts[index].duration);
    assert.deepEqual(result.facts.shots.map(({ number, start, end }) => [number, start, end]), contracts[index].times);
    assert.deepEqual(result.facts.assetTokens, contracts[index].assets);
    assert.deepEqual(result.facts.headings, ["风格", "素材绑定", "全局约束", "本段戏剧任务", "本段情绪总控"]);
  });
});

test("the cross-cut source is represented by its exact audible fragment in each shot", () => {
  const lines = utterances(examples[0]);
  assert.deepEqual(lines.map(({ text }) => text), [firstPart, lastPart, followupLine]);
  const first = examples[0].slice(examples[0].indexOf("镜头1｜"), examples[0].indexOf("镜头2｜"));
  const second = examples[0].slice(examples[0].indexOf("镜头2｜"));
  assert.deepEqual(utterances(first).map(speechFacts), [{ speaker: "陈砚", text: firstPart }]);
  assert.deepEqual(utterances(second).map(speechFacts), [{ speaker: "陈砚", text: lastPart }, { speaker: "阿宁", text: followupLine }]);
  // Exact fragments and their speakers span the cut without requiring a clock
  // schedule inside prose. The coarse heading ranges remain independently tested.
  const result = validatePrompt(examples[0], { expectedDialogue: dialogueBaseline });
  assert.equal(result.ok, true, JSON.stringify(result.errors));
  assert.equal(result.facts.dialogueCheck.shotMatches, true);
  assert.deepEqual(result.facts.dialogue.map(({ speaker, text, shot_id }) => ({ speaker, text, shot_id })), [
    { speaker: "陈砚", text: firstPart, shot_id: "S1" },
    { speaker: "陈砚", text: lastPart, shot_id: "S2" },
    { speaker: "阿宁", text: followupLine, shot_id: "S2" },
  ]);
  assert.ok(second.indexOf(lastPart) < second.indexOf(followupLine));
});

test("character direction may be multiline or compact without becoming new fields or spoken words", () => {
  // Reuse the maintained example, not a generated trial. This tests structural
  // compatibility only; meaningful motive transfer is evaluated independently.
  const task = /【本段戏剧任务】\r?\n([\s\S]*?)(?=\r?\n【本段情绪总控】)/u;
  const compact = examples[0].replace(task, (_, body) => "【本段戏剧任务】\n" + body.trim().replace(/\r?\n/gu, " ") + "\n");
  const simple = examples[0].replace(task, (_, body) => "【本段戏剧任务】\n" + body.split(/\r?\n/u)[0] + "\n");
  const originalShots = examples[0].slice(examples[0].indexOf("镜头1｜"));
  for (const value of [examples[0], compact, simple]) {
    const result = validatePrompt(value, { expectedDialogue: dialogueBaseline });
    assert.equal(result.ok, true, JSON.stringify(result.errors));
    assert.equal(result.facts.headings.length, 5);
    assert.equal(result.facts.duration, 12);
    assert.equal(result.facts.dialogueCheck.shotMatches, true);
    assert.equal(result.facts.dialogue.length, 3);
    assert.equal(value.slice(value.indexOf("镜头1｜")), originalShots);
  }
});

test("no-dialogue action and deliberately still/hidden-face examples invent no utterance", () => {
  for (const example of examples.slice(1)) {
    assert.deepEqual(utterances(example), []);
    assert.equal(example.includes("{"), false);
    assert.equal(validatePrompt(example).ok, true);
  }
});

test("the sample preservation contract catches quote mutation, duplication and speaker reassignment", () => {
  const contract = (example) => assert.deepEqual(utterances(example).map(speechFacts), utterances(examples[0]).map(speechFacts));
  for (const changed of [
    examples[0].replace(firstPart, "我昨天离开的时候，"),
    examples[0] + "\n陈砚说：“" + expectedLine + "”",
    examples[0].replace(utterances(examples[0])[0].cue, "阿宁说："),
  ]) {
    assert.notEqual(changed, examples[0], "each mutation changes its intended sample");
    assert.throws(() => contract(changed));
  }
});

test("a maintained example cannot regress to all words in the onset shot and an empty continuation", () => {
  const concentrated = examples[0].replace('说：“' + firstPart + '”', '说：“' + expectedLine + '”')
    .replace('继续说：“' + lastPart + '”', '继续说。');
  const result = validatePrompt(concentrated, { expectedDialogue: dialogueBaseline });
  assert.equal(result.facts.dialogueCheck.textMatches, true);
  assert.ok(result.errors.some(error => error.code === "DIALOGUE_SHOT"));
});

test("shared references and optional silence do not loosen mechanical output safeguards", () => {
  const duplicate = examples[0].replace("阿宁仍握着", "@image1中的阿宁仍握着");
  assert.notEqual(duplicate, examples[0]);
  const result = validatePrompt(duplicate);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some(({ code }) => code === "ASSET_DUPLICATE_REFERENCE"));
  assert.ok(result.errors.some(({ code }) => code === "ASSET_REFERENCE_LOCATION"));
  const extra = validatePrompt(examples[2] + "\n【角色档案】强加的另一套交付表。");
  assert.equal(extra.ok, false);
  assert.ok(extra.errors.some(({ code }) => code === "UNEXPECTED_SECTION"));
});

test("maintained examples open with camera position and an initial image before progressing the event", async () => {
  const corridor = await readFile(new URL("../references/model/shot-prose-example.md", import.meta.url), "utf8");
  const paragraphs = [...(document + "\n" + corridor).matchAll(/^镜头\d+｜[^\n]+\r?\n([^\n]+)/gmu)]
    .map((match) => match[1]);
  assert.equal(paragraphs.length, 7);
  // Only these maintained examples use this literal phrase. Runtime prose may
  // express its initial image naturally; this does not score narrative quality.
  for (const paragraph of paragraphs) {
    assert.match(paragraph, /^\d+(?:\.\d+)?mm(?:双人)?(?:中近景|近景|全景|中景)，摄影机/u);
    assert.ok(paragraph.indexOf("起始画面中") > 0);
    assert.ok(paragraph.indexOf("起始画面中") < paragraph.indexOf("光影："));
  }
});

test("compiler and metatemplate distinguish event-first design from camera-first prose", async () => {
  for (const path of ["../modules/compiler.md", "../references/model/nine-layer-schema.md"]) {
    const source = await readFile(new URL(path, import.meta.url), "utf8");
    assert.ok(source.includes("摄影参数开头 → 起始画面 → 连续人物事件与运镜 → 结束状态及必要切镜衔接"));
  }
});
