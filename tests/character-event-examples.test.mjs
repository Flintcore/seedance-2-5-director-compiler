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
const followupLine = "你再想想。";

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

test("the cross-cut utterance has one exact source anchor rather than a duplicate on the listener", () => {
  const lines = utterances(examples[0]);
  assert.deepEqual(lines.map(({ text }) => text), [expectedLine, followupLine]);
  const first = examples[0].slice(examples[0].indexOf("镜头1｜"), examples[0].indexOf("镜头2｜"));
  const second = examples[0].slice(examples[0].indexOf("镜头2｜"));
  assert.deepEqual(utterances(first).map(speechFacts), [{ speaker: "陈砚", text: expectedLine }]);
  assert.deepEqual(utterances(second).map(speechFacts), [{ speaker: "阿宁", text: followupLine }]);
  // Continuous source speech spans the real cut. This explicitly checks the
  // supplied schedule, not an inferred natural-language lip-sync judgment.
  const result = validatePrompt(examples[0]);
  assert.match(first, /陈砚从0:02开始说/u);
  assert.match(first, /跨镜头1—2连续至0:06.5/u);
  assert.match(second, /阿宁才在0:07.5—0:08.8/u);
  const [start, end] = [2, 6.5];
  assert.ok(start < result.facts.shots[0].end && end > result.facts.shots[1].start);
  assert.ok(end <= result.facts.duration);
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
    examples[0].replace("我昨晚离开的时候，那盏灯还亮着。", "我昨天离开的时候，那盏灯还亮着。"),
    examples[0] + "\n陈砚说：“" + expectedLine + "”",
    examples[0].replace("陈砚从0:02", "阿宁从0:02"),
  ]) assert.throws(() => contract(changed));
});

test("a cross-cut quote may instead be split into exact consecutive substrings without replaying it", () => {
  const split = examples[0]
    .replace('陈砚从0:02开始说：“' + expectedLine + '”', '陈砚于0:02—0:04.5说：“我昨晚离开的时候，”')
    .replace('阿宁才在0:07.5', '陈砚的画外音于0:04.5—0:06.5承接前镜继续说：“那盏灯还亮着。”阿宁才在0:07.5');
  assert.equal(validatePrompt(split).ok, true);
  const lines = utterances(split).map(speechFacts);
  assert.deepEqual(lines.map(({ speaker }) => speaker), ["陈砚", "陈砚", "阿宁"]);
  assert.match(split, /陈砚于0:02—0:04.5说/u);
  assert.match(split, /陈砚的画外音于0:04.5—0:06.5承接前镜继续说/u);
  assert.equal(lines[0].text + lines[1].text, expectedLine);
  assert.equal(lines[2].text, followupLine);
});

test("shared references and optional silence do not loosen mechanical output safeguards", () => {
  const duplicate = examples[0].replace("她仍握着", "@image1中的她仍握着");
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
