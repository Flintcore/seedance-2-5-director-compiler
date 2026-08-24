import assert from "node:assert/strict";
import test from "node:test";

import { validatePrompt } from "../scripts/validate-prompt.mjs";

function validPrompt({
  duration = 8,
  timelineDuration = duration,
  references = "素材总数：1/50\n@image1：主角色身份｜继承：脸部与服装｜不继承：背景｜作用范围：全片",
  dialogue = "角色说{我回来了。}",
} = {}) {
  return `【头锁区·全片统一】
写实电影质感。
【元信息】
片段时长：${duration}秒
【风险预判】
空间方向清晰。
【衔接入】
0.0-0.5秒稳定入场：人物站在门外。
【时间线 卡${timelineDuration}秒】
0.0-0.5秒保持起始状态；中段人物推门，${dialogue}；末0.5秒保持落幅。
【衔接出】
${timelineDuration - 0.5}-${timelineDuration}秒稳定出场：人物停在门内。
【声音设计】
门轴轻响，台词绑定说话人。
【参考图权重】
${references}仅参考已声明职责。
【执行约束】
保持身份、空间、动作和声音连续。`;
}

test("accepts exact nine-layer headings at both duration boundaries", () => {
  for (const duration of [4, 30]) {
    const result = validatePrompt(validPrompt({ duration }));
    assert.equal(result.ok, true, JSON.stringify(result.errors));
    assert.equal(result.facts.duration, duration);
    assert.deepEqual(result.facts.headings, [
      "头锁区·全片统一",
      "元信息",
      "风险预判",
      "衔接入",
      "时间线",
      "衔接出",
      "声音设计",
      "参考图权重",
      "执行约束",
    ]);
  }
});

test("requires the exact dynamic timeline heading instead of metadata fallback", () => {
  for (const malformed of ["【时间线】", "【时间线 卡 8 秒】", "【时间线 8秒】"]) {
    const prompt = validPrompt().replace("【时间线 卡8秒】", malformed);
    const result = validatePrompt(prompt);
    assert.equal(result.ok, false);
    assert(result.errors.some((error) => error.code === "INVALID_LAYER_HEADING"));
    assert(result.errors.some((error) => error.code === "DURATION_MISSING"));
  }
});

test("accepts numeric .0 variants and s units in both stability zones", () => {
  const prompt = validPrompt().replace(
    "0.0-0.5秒稳定入场",
    "0.0s-0.5s稳定入场",
  ).replace(
    "7.5-8秒稳定出场",
    "7.5s-8.0s稳定出场",
  );
  const result = validatePrompt(prompt);
  assert.equal(result.ok, true, JSON.stringify(result.errors));
});

test("requires the entry stability range inside the entry layer", () => {
  const prompt = validPrompt().replace(
    "0.0-0.5秒稳定入场：人物站在门外。",
    "人物站在门外。",
  );
  const result = validatePrompt(prompt);
  assert(result.errors.some((error) => error.code === "ENTRY_STABILITY_ZONE"));
});

test("rejects an incorrect final stability range", () => {
  const prompt = validPrompt().replace("7.5-8秒稳定出场", "7.0-8.0秒稳定出场");
  const result = validatePrompt(prompt);
  assert(result.errors.some((error) => error.code === "EXIT_STABILITY_ZONE"));
});

test("requires the final stability range inside the exit layer", () => {
  const prompt = validPrompt().replace(
    "7.5-8秒稳定出场：人物停在门内。",
    "人物停在门内。",
  );
  const result = validatePrompt(prompt);
  assert(result.errors.some((error) => error.code === "EXIT_STABILITY_ZONE"));
});

test("rejects shortened, additional, duplicated, and reordered layer headings", () => {
  const prompts = [
    validPrompt().replace("【头锁区·全片统一】", "【头锁】"),
    `${validPrompt()}\n【附加说明】\n无。`,
    validPrompt().replace("【衔接出】", "【衔接入】\n重复。\n【衔接出】"),
    validPrompt().replace("【风险预判】\n空间方向清晰。\n【衔接入】", "【衔接入】\n人物站在门外。\n【风险预判】"),
  ];
  for (const prompt of prompts) {
    const result = validatePrompt(prompt);
    assert.equal(result.ok, false);
    assert(result.errors.some((error) => ["INVALID_LAYER_HEADING", "NINE_LAYER_ORDER"].includes(error.code)));
  }
});

test("rejects durations outside 4-30 seconds and metadata conflicts", () => {
  for (const duration of [3.99, 30.01]) {
    const result = validatePrompt(validPrompt({ duration }));
    assert(result.errors.some((error) => error.code === "DURATION_RANGE"));
  }
  const mismatch = validatePrompt(validPrompt({ duration: 9, timelineDuration: 8 }));
  assert(mismatch.errors.some((error) => error.code === "DURATION_MISMATCH"));

  const localBeatDuration = validatePrompt(validPrompt().replace(
    "0.0-0.5秒保持起始状态；",
    "动作时长：1秒\n0.0-0.5秒保持起始状态；",
  ));
  assert.equal(localBeatDuration.ok, true, JSON.stringify(localBeatDuration.errors));
});

test("counts image, video, and audio references together", () => {
  const referenceLines = (imageCount, videoCount, audioCount) => [
    `素材总数：${imageCount + videoCount + audioCount}/50`,
    ...Array.from({ length: imageCount }, (_, index) => `@image${index + 1}：图像职责${index + 1}｜作用范围：全片`),
    ...Array.from({ length: videoCount }, (_, index) => `@video${index + 1}：动作职责${index + 1}｜作用范围：全片`),
    ...Array.from({ length: audioCount }, (_, index) => `@audio${index + 1}：声音职责${index + 1}｜作用范围：全片`),
  ].join("\n");

  const exactlyFifty = validatePrompt(validPrompt({
    references: referenceLines(20, 20, 10),
  }));
  assert.equal(exactlyFifty.ok, true, JSON.stringify(exactlyFifty.errors));
  assert.equal(exactlyFifty.facts.assets, 50);

  const fiftyOne = validatePrompt(validPrompt({
    references: referenceLines(20, 20, 11),
  }));
  assert(fiftyOne.errors.some((error) => error.code === "ASSET_LIMIT"));
  assert.equal(fiftyOne.facts.assets, 51);
});

test("accepts one canonical placeholder per unique source and merges multiple duties", () => {
  const result = validatePrompt(validPrompt({
    references: "素材总数：1/50\n@image1：主角色身份与手持道具材质｜继承：脸部、服装、刀鞘｜不继承：背景人物｜作用范围：身份覆盖全片；刀鞘覆盖2.0-6.0s",
  }));
  assert.equal(result.ok, true, JSON.stringify(result.errors));
  assert.deepEqual(result.facts.assetTokens, ["@image1"]);
});

test("rejects canonical placeholders repeated inside or outside the reference layer", () => {
  const outside = validatePrompt(validPrompt().replace(
    "中段人物推门",
    "中段人物按@image1的身份推门",
  ));
  assert(outside.errors.some((error) => error.code === "ASSET_DUPLICATE_REFERENCE"));
  assert(outside.errors.some((error) => error.code === "ASSET_REFERENCE_LAYER"));

  const inside = validatePrompt(validPrompt({
    references: "素材总数：1/50\n@image1：主角色身份｜作用范围：全片\n@image1：服装细节｜作用范围：全片",
  }));
  assert(inside.errors.some((error) => error.code === "ASSET_DUPLICATE_REFERENCE"));
});

test("rejects paths, URLs, source filenames, and non-canonical asset aliases", () => {
  for (const locator of ["C:\\refs\\hero.png", "hero.png", "https://example.com/hero.png"]) {
    const result = validatePrompt(validPrompt({
      references: `素材总数：1/50\n@image1：主角色身份｜来源：${locator}｜作用范围：全片`,
    }));
    assert(result.errors.some((error) => error.code === "ASSET_SOURCE_LOCATOR"), locator);
  }

  for (const token of ["@图片1", "@img-1", "@image_1", "@image01", "@Image1"]) {
    const result = validatePrompt(validPrompt({
      references: `素材总数：1/50\n${token}：主角色身份｜作用范围：全片`,
    }));
    assert(result.errors.some((error) => error.code === "ASSET_TOKEN_FORMAT"), token);
  }

  const aliasOutside = validatePrompt(validPrompt().replace(
    "中段人物推门",
    "中段人物按@图片1的身份推门",
  ));
  assert(aliasOutside.errors.some((error) => error.code === "ASSET_TOKEN_FORMAT"));
});

test("rejects ranges, gaps, out-of-order numbering, and count mismatches", () => {
  const cases = [
    ["素材总数：2/50\n@image1-@image2：两张角色图", "ASSET_RANGE"],
    ["素材总数：2/50\n@image1：角色\n@image3：场景", "ASSET_NUMBERING"],
    ["素材总数：2/50\n@image2：场景\n@image1：角色", "ASSET_NUMBERING"],
    ["素材总数：2/50\n@image1：角色", "ASSET_COUNT_MISMATCH"],
    ["@image1：角色", "ASSET_COUNT_DECLARATION"],
    ["素材总数：1/50\n素材总数：1/50\n@image1：角色", "ASSET_COUNT_DECLARATION"],
  ];
  for (const [references, code] of cases) {
    const result = validatePrompt(validPrompt({ references }));
    assert(result.errors.some((error) => error.code === code), `${code}: ${JSON.stringify(result.errors)}`);
  }
});

test("accepts a segment with no reference assets", () => {
  const result = validatePrompt(validPrompt({ references: "素材总数：0/50\n无参考素材。" }));
  assert.equal(result.ok, true, JSON.stringify(result.errors));
  assert.equal(result.facts.assets, 0);
});

test("rejects both opening and closing brace imbalance", () => {
  for (const dialogue of ["角色说{我回来了。", "角色说我回来了。}"]) {
    const result = validatePrompt(validPrompt({ dialogue }));
    assert(result.errors.some((error) => error.code === "BRACE_BALANCE"));
  }
});

test("rejects a self-check layer even when all nine prompt layers remain valid", () => {
  const prompt = `${validPrompt()}\n## 自检\n九层齐全。`;
  const result = validatePrompt(prompt);
  assert.equal(result.ok, false);
  assert(result.errors.some((error) => error.code === "SELF_CHECK_HEADING"));
});
