import assert from "node:assert/strict";
import test from "node:test";

import { validatePrompt } from "../scripts/validate-prompt.mjs";

function shot(number, start, end, body) {
  return [
    "【镜头" + number + "】| " + start + "-" + end,
    "中景，50mm镜头，平视，机位位于主角正前方。",
    body,
  ].join("\n");
}

function validPrompt(options = {}) {
  const duration = options.duration ?? 8;
  const references = Object.hasOwn(options, "references")
    ? options.references
    : "─ 素材绑定：@image1=主角定妆照；@video1=街道运动参考";
  const commonRows = [];
  if (references) commonRows.push(references);
  commonRows.push(options.style ?? "─ 光影色彩风格：真实数码摄影机质感，冷色阴影与暖色街灯形成对照；保留自然运动模糊、雨声和远处车流。");
  commonRows.push("─ 角色外观：主角穿深色外套。");
  commonRows.push("─ 场景外观：湿润街道，空间关系连续。");
  const shots = options.shots ?? [
    shot(1, "0:00", "3", "开头0.5秒保持起始状态，主角抬眼看向街口，摄影机缓慢靠近。"),
    shot(2, "3", String(duration), "主角迈入雨幕并停在画面中心，最后0.5秒保持结束状态。"),
  ];
  return [
    "【通用约束栏 · 本 segment 共享】",
    ...commonRows,
    "",
    "【本段戏剧任务】让主角在犹豫后作出不可逆的选择，并把观众注意力引向街口。",
    "",
    "【本段情节】主角发现街口的信号后穿过雨幕，停在新的位置。",
    "",
    shots.join("\n\n"),
    "",
    "【收尾约束】最后0.5秒保持主角停定、视线朝向街口的结束状态，声音自然延续。",
  ].join("\n");
}

function codes(result) {
  return result.errors.map((error) => error.code);
}

test("accepts native prompts at the 4s and 30s boundaries", () => {
  for (const duration of [4, 30]) {
    const result = validatePrompt(validPrompt({
      duration,
      shots: [shot(1, "0:00", String(duration), "开头0.5秒保持起始状态，人物完成动作，最后0.5秒保持结束状态。")],
    }));
    assert.equal(result.ok, true, JSON.stringify(result.errors));
    assert.equal(result.facts.duration, duration);
    assert.deepEqual(result.facts.headings, ["通用约束栏 · 本 segment 共享", "本段戏剧任务", "本段情节", "收尾约束"]);
  }
});

test("requires the single added dramatic-task section and rejects legacy headings", () => {
  const missing = validPrompt().replace("【本段戏剧任务】", "【段落说明】");
  const missingResult = validatePrompt(missing);
  assert.ok(codes(missingResult).includes("DRAMA_TASK_MISSING"));
  assert.ok(codes(missingResult).includes("UNEXPECTED_SECTION"));

  const legacy = validPrompt().replace("【本段戏剧任务】", "【头锁区·全片统一】");
  const legacyResult = validatePrompt(legacy);
  assert.ok(codes(legacyResult).includes("LEGACY_SECTION"));
  assert.ok(codes(legacyResult).includes("DRAMA_TASK_MISSING"));

  const retired = validPrompt().replace("【本段戏剧任务】", "【光影风格卡】旧容器\n\n【本段戏剧任务】");
  assert.ok(codes(validatePrompt(retired)).includes("LEGACY_SECTION"));

  const splitStory = validPrompt().replace("【本段情节】", "【本段情节】\n");
  assert.ok(codes(validatePrompt(splitStory)).includes("STORY_INLINE"));
});

test("allows long native prose without character quotas", () => {
  const longText = "连续动作与空间关系保持清晰。".repeat(1200);
  const result = validatePrompt(validPrompt({
    style: "─ 光影色彩风格：" + longText,
  }));
  assert.equal(result.ok, true, JSON.stringify(result.errors));
});

test("detects shot gaps, overlaps, and duration violations", () => {
  const gap = validPrompt({
    shots: [
      shot(1, "0:00", "2", "开头0.5秒保持起始状态，人物观察街口。"),
      shot(2, "2.2", "8", "人物向前走，最后0.5秒保持结束状态。"),
    ],
  });
  assert.ok(codes(validatePrompt(gap)).includes("SHOT_TIME_GAP"));

  const overlap = validPrompt({
    shots: [
      shot(1, "0:00", "3", "开头0.5秒保持起始状态，人物观察街口。"),
      shot(2, "2", "8", "人物向前走，最后0.5秒保持结束状态。"),
    ],
  });
  assert.ok(codes(validatePrompt(overlap)).includes("SHOT_TIME_OVERLAP"));

  const tooShort = validPrompt({
    shots: [shot(1, "0:00", "3", "开头0.5秒保持起始状态，最后0.5秒保持结束状态。")],
  });
  assert.ok(codes(validatePrompt(tooShort)).includes("DURATION_RANGE"));
});

test("counts mixed media references together and requires one common reference row", () => {
  const result = validatePrompt(validPrompt({
    references: "─ 素材绑定：@image1=人物；@video1=动作；@audio1=环境声",
  }));
  assert.equal(result.ok, true, JSON.stringify(result.errors));
  assert.equal(result.facts.assets, 3);
  assert.deepEqual(result.facts.assetTokens, ["@image1", "@video1", "@audio1"]);
});

test("rejects duplicate, misplaced, aliased, ranged, and source-locator references", () => {
  const duplicate = validPrompt().replace("主角定妆照", "主角定妆照 @image1");
  assert.ok(codes(validatePrompt(duplicate)).includes("ASSET_DUPLICATE_REFERENCE"));

  const misplaced = validPrompt().replace("主角抬眼看向街口", "主角抬眼看向街口并参考@image1");
  assert.ok(codes(validatePrompt(misplaced)).includes("ASSET_REFERENCE_LOCATION"));

  const alias = validPrompt().replace("@image1", "@img-1");
  assert.ok(codes(validatePrompt(alias)).includes("ASSET_TOKEN_FORMAT"));

  const oldLabel = validPrompt().replace("─ 素材绑定：", "─ 素材引用：");
  assert.ok(codes(validatePrompt(oldLabel)).includes("ASSET_REFERENCE_LOCATION"));

  const range = validPrompt().replace("@image1=主角定妆照；@video1=街道运动参考", "@image1-@image2=人物组");
  assert.ok(codes(validatePrompt(range)).includes("ASSET_RANGE"));

  const locator = validPrompt().replace("@image1=主角定妆照", "@image1=C:/refs/hero.png");
  assert.ok(codes(validatePrompt(locator)).includes("ASSET_SOURCE_LOCATOR"));
});

test("accepts 50 unique references, rejects 51, and does not require a count row", () => {
  const fifty = Array.from({ length: 50 }, (_, index) => "@image" + (index + 1) + "=素材" + (index + 1)).join("；");
  const accepted = validatePrompt(validPrompt({ references: "─ 素材绑定：" + fifty }));
  assert.equal(accepted.ok, true, JSON.stringify(accepted.errors));
  assert.equal(accepted.facts.assets, 50);

  const fiftyOne = fifty + "；@video1=额外运动参考";
  const rejected = validatePrompt(validPrompt({ references: "─ 素材绑定：" + fiftyOne }));
  assert.ok(codes(rejected).includes("ASSET_LIMIT"));
});

test("allows a segment without references", () => {
  const result = validatePrompt(validPrompt({ references: null }));
  assert.equal(result.ok, true, JSON.stringify(result.errors));
  assert.equal(result.facts.assets, 0);
  assert.doesNotMatch(validPrompt({ references: null }), /素材绑定|无外部素材/);
});

test("rejects unbalanced dialogue braces and a self-check section", () => {
  const braces = validPrompt().replace("主角抬眼看向街口", "主角说{我要走向街口");
  assert.ok(codes(validatePrompt(braces)).includes("BRACE_BALANCE"));

  const selfCheck = validPrompt().replace("【收尾约束】", "【自检】\n通过\n\n【收尾约束】");
  const result = validatePrompt(selfCheck);
  assert.ok(codes(result).includes("SELF_CHECK_HEADING"));
  assert.ok(codes(result).includes("LEGACY_SECTION"));

  const titledShot = validPrompt().replace("【镜头1】", "【镜头1：雨中犹豫 · 中景】");
  assert.ok(codes(validatePrompt(titledShot)).includes("SHOT_HEADING_FORMAT"));
});
