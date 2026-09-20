import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { validatePrompt } from "../scripts/validate-prompt.mjs";

// Historical fixture filename retained; its content follows the current six-part contract.
const fixtureFile = fileURLToPath(new URL("./fixtures/five-part-prompt.txt", import.meta.url));
const fixture = (await readFile(fixtureFile, "utf8")).replace(/\r\n?/g, "\n").trim();
const script = fileURLToPath(new URL("../scripts/validate-prompt.mjs", import.meta.url));
const codes = (result) => result.errors.map((error) => error.code);
function accepts(input, options) {
  const result = validatePrompt(input, options);
  assert.equal(result.ok, true, JSON.stringify(result.errors));
  return result;
}
function rejects(input, code, options) {
  const result = validatePrompt(input, options);
  assert.equal(result.ok, false);
  assert.ok(codes(result).includes(code), code + " not found: " + JSON.stringify(result.errors));
}
function references(value) {
  return fixture.replace(/^【素材绑定】.*$/mu, "【素材绑定】" + value);
}
function singleShot(duration) {
  return fixture.slice(0, fixture.indexOf("镜头1｜"))
    + "镜头1｜0:00-0:" + String(duration).padStart(2, "0")
    + "\n中景，50mm，人物右前1/4、胸口高度，平拍并固定。开头0.5秒保持站姿，人物推门走出，最后0.5秒停稳。光影：人物离开门厅时面部暖光逐渐减弱。现场声：门轴摩擦声，鞋底踏地声。";
}

test("complete six-part fixture parses facts, exact times, and mixed-media references", () => {
  const result = accepts(fixture);
  assert.deepEqual(result.facts.headings, ["风格", "素材绑定", "全局约束", "本段戏剧任务", "本段情绪总控"]);
  assert.equal(result.facts.duration, 8);
  assert.equal(result.facts.assets, 3);
  assert.deepEqual(result.facts.assetTokens, ["@image1", "@video1", "@audio1"]);
  assert.deepEqual(result.facts.shots.map(({ number, start, end }) => [number, start, end]), [[1, 0, 3.5], [2, 3.5, 8]]);
});
test("the maintained full prompt example satisfies the mechanical contract", async () => {
  const document = await readFile(new URL("../references/model/shot-prose-example.md", import.meta.url), "utf8");
  const examples = [...document.matchAll(/\x60{3}text\r?\n([\s\S]*?)\r?\n\x60{3}/gu)];
  assert.equal(examples.length, 1, "the maintained example has one complete text fence");
  accepts(examples[0][1]);
});
test("accepts 4s and 30s boundaries, a fenced prompt, CRLF and a BOM", () => {
  accepts(singleShot(4));
  accepts(singleShot(30));
  accepts("~~~text\n" + fixture + "\n~~~");
  accepts("\uFEFF" + fixture.replaceAll("\n", "\r\n"));
});
test("rejects missing, duplicate, empty and reordered fixed sections", () => {
  for (const name of ["风格", "素材绑定", "全局约束", "本段戏剧任务", "本段情绪总控"]) {
    rejects(fixture.replace("【" + name + "】", "【未知栏】"), "SECTION_MISSING");
    rejects(fixture.replace("【" + name + "】", "【" + name + "】重复内容\n【" + name + "】"), "SECTION_DUPLICATE");
  }
  rejects(fixture.replace(/^【风格】.*$/mu, "【风格】"), "SECTION_EMPTY");
  rejects(fixture.replace("【风格】", "【占位】").replace("【本段情绪总控】", "【风格】").replace("【占位】", "【本段情绪总控】"), "SECTION_ORDER");
  rejects("这里是正式提示词：\n" + fixture, "PROMPT_PREFIX");
});
test("rejects retired fields and bracketted or decorated shot headings", () => {
  for (const heading of ["通用约束栏 · 本 segment 共享", "本段情节", "本段故事内容", "收尾约束", "头锁区", "光影风格卡"]) {
    rejects(fixture + "\n【" + heading + "】旧内容", "LEGACY_SECTION");
  }
  for (const heading of ["【镜头1】| 0:00-0:03.5", "镜头1：门口中景｜0:00-0:03.5", "镜头1｜0-3.5"]) {
    rejects(fixture.replace("镜头1｜0:00-0:03.5", heading), "SHOT_HEADING_FORMAT");
  }
  rejects(fixture + "\n收尾约束：保持结束状态。", "LEGACY_ROW");
  rejects(fixture + "\n【自检】通过", "SELF_CHECK_HEADING");
});
test("global constraints are a short required preamble, not an empty or late tail card", () => {
  const globalLine = fixture.match(/^【全局约束】.*$/mu)[0];
  accepts(fixture.replace(globalLine, "【全局约束】无额外全局约束。"));
  accepts(fixture.replace(globalLine, "【全局约束】\n同一雨夜；保留既定人物外观。\n字幕只按用户已定的末镜范围出现。"));
  rejects(fixture.replace(globalLine, "【全局约束】"), "SECTION_EMPTY");
  rejects(fixture.replace(globalLine, "") + "\n" + globalLine, "SECTION_ORDER");
  rejects(fixture.replace(globalLine, "").replace("【素材绑定】", globalLine + "\n【素材绑定】"), "SECTION_ORDER");
});
test("global constraints do not become a second asset-binding location", () => {
  for (const token of ["@image1", "@video1", "@audio1", "@image2"]) {
    rejects(fixture.replace("【全局约束】", "【全局约束】" + token + "为参考。"), "ASSET_REFERENCE_LOCATION");
  }
  rejects(fixture.replace("【全局约束】", "【全局约束】参考 C:/refs/hero.png\n"), "ASSET_SOURCE_LOCATOR");
});
test("checks contiguous shot numbering, timestamps and positive duration", () => {
  for (const [before, after, code] of [
    ["镜头2｜", "镜头3｜", "SHOT_NUMBERING"],
    ["0:00-0:03.5", "0:01-0:03.5", "SHOT_START"],
    ["0:03.5-0:08", "0:04-0:08", "SHOT_TIME_GAP"],
    ["0:03.5-0:08", "0:03-0:08", "SHOT_TIME_OVERLAP"],
    ["0:03.5-0:08", "0:03.5-0:03.5", "SHOT_TIME_FORMAT"],
    ["0:03.5-0:08", "0:03.5-0:60", "SHOT_TIME_FORMAT"],
  ]) rejects(fixture.replace(before, after), code);
  rejects(singleShot(3), "DURATION_RANGE");
  rejects(singleShot(31), "DURATION_RANGE");
});
test("requires explicit half-second declarations in the relevant shot rather than a tail card", () => {
  rejects(fixture.replace("开头0.5秒", "开头"), "ENTRY_STABILITY_ZONE");
  rejects(fixture.replace("最后0.5秒", "结束时"), "EXIT_STABILITY_ZONE");
  accepts(fixture.replace("开头0.5秒", "0:00-0:00.5").replace("最后0.5秒", "0:07.5-0:08"));
  accepts(fixture.replace("开头0.5秒保持", "起幅固定半秒，保持").replace("最后0.5秒保持", "最后半秒机身停下，保持"));
  const spokenOnly = fixture.replace("开头0.5秒", "开头").replace("等我。", "开头0.5秒。");
  rejects(spokenOnly, "ENTRY_STABILITY_ZONE");
});
test("requires one continuous prose paragraph with populated light and on-set sound tails", () => {
  rejects(fixture.replace("她听见街口", "\n\n她听见街口"), "SHOT_PARAGRAPH");
  accepts(fixture.replace("她听见街口", "\n她听见街口")); // Soft wrapping is not a new field.
  rejects(fixture.replace("光影：门厅", "照明：门厅"), "SHOT_LIGHT_SENTENCE");
  rejects(fixture.replace("现场声：雨滴", "声音：雨滴"), "SHOT_SOUND_SENTENCE");
  rejects(fixture.replace(/光影：门厅[^\n]*?现场声：/u, "光影：。现场声："), "SHOT_LIGHT_EMPTY");
  rejects(fixture.replace(/现场声：雨滴[^\n]*/u, "现场声：。"), "SHOT_SOUND_EMPTY");
  rejects(fixture.replace("光影：门厅", "现场声：门厅").replace("现场声：雨滴", "光影：雨滴"), "SHOT_TAIL_ORDER");
  rejects(fixture.replace("中景，50mm", "景别：中景，50mm"), "LEGACY_ROW");
});
test("dialogue stays on the independent final line; silence omits that line", () => {
  accepts(fixture.replace(/^台词：.*\n/mu, ""));
  accepts(fixture.replace("街口的人说{还走吗？}", "旁白{雨仍没有停。}"));
  accepts(fixture.replace("街口的人说{还走吗？}", "街口的人看着林岚，停一拍后说{还走吗？}"));
  accepts(fixture.replace("；林岚说", "；林岚（门内，轻声），随后说"));
  accepts(fixture.replace("；林岚说", "\n台词：林岚说"));
  rejects(fixture.replace("台词：街口的人", "街口的人"), "DIALOGUE_REFERENCE_LOCATION");
  rejects(fixture.replace("身体仍留在门内。", "身体仍留在门内。林岚说{等我。}"), "DIALOGUE_REFERENCE_LOCATION");
  rejects(fixture.replace("林岚说{等我。}", "林岚说等我。"), "DIALOGUE_FORMAT");
  rejects(fixture.replace("林岚说{等我。}", "林岚{等我。}"), "DIALOGUE_SPEAKER");
  rejects(fixture.replace("林岚说{等我。}", "林岚说{}"), "DIALOGUE_FORMAT");
  rejects(fixture.replace("林岚说{等我。}", "林岚说{等我。}\n她转过身。"), "DIALOGUE_NOT_LAST");
});
test("keeps exact dialogue separate from trailing sound-bridge scope notes", () => {
  accepts(fixture.replace("林岚说{等我。}", "林岚说{等我。}（同次声音延续到下一镜，画内人物闭口倾听）"));
  accepts(fixture.replace("林岚说{等我。}", "林岚说{等我。}（同一次发声覆盖镜头1至镜头2；前一分句在镜头1画内说出，后半句在镜头2画外继续。）"));
  accepts(fixture.replace("林岚说{等我。}", "林岚说{等我。}，同次声音覆盖下一镜开头，保留林岚声源。"));
  accepts(fixture.replace("林岚说{等我。}", "林岚说{等我。}同一句由林岚在下一镜画外继续说完。"));
  for (const separator of ["", "，", "。", "；"]) {
    rejects(fixture.replace("林岚说{等我。}", "林岚说{等我。}" + separator + "陈默说别走。"), "DIALOGUE_FORMAT");
  }
  rejects(fixture.replace("林岚说{等我。}", "林岚说{等我。}（同次声音延续）{无主句}"), "DIALOGUE_SPEAKER");
  rejects(fixture.replace("林岚说{等我。}", "林岚说{等我。}（同次声音延续）\n她转过身。"), "DIALOGUE_NOT_LAST");
});
test("rejects unbalanced, nested, orphan and unbound dialogue braces", () => {
  for (const value of ["林岚说{等我。", "林岚说等我。}", "林岚说{{等我。}}"]) {
    rejects(fixture.replace("林岚说{等我。}", value), "BRACE_BALANCE");
  }
  rejects(fixture.replace("台词：街口的人", "台词：{无主句}街口的人"), "DIALOGUE_FORMAT");
  rejects(fixture.replace("【风格】", "【风格】林岚说{等我。}"), "DIALOGUE_REFERENCE_LOCATION");
});
test("canonical assets are bound once in their own section without file locators", () => {
  accepts(references("@image1为林岚参考。\n@video1为路径参考。"));
  for (const [value, code] of [
    ["@image1为人物；@image1为身高", "ASSET_DUPLICATE_REFERENCE"],
    ["@img-1为人物", "ASSET_TOKEN_FORMAT"],
    ["@image0为人物", "ASSET_TOKEN_FORMAT"],
    ["@image1_extra为人物", "ASSET_TOKEN_FORMAT"],
    ["@image1.5为人物", "ASSET_TOKEN_FORMAT"],
    ["@unknown为人物", "ASSET_TOKEN_FORMAT"],
    ["@image1-@image2为人物", "ASSET_RANGE"],
    ["@image1=C:/refs/hero.png", "ASSET_SOURCE_LOCATOR"],
    ["@image1=hero.png", "ASSET_SOURCE_LOCATOR"],
    ["@image1=https://example.com/image", "ASSET_SOURCE_LOCATOR"],
  ]) rejects(references(value), code);
  rejects(fixture.replace("她听见街口", "@image1中的她听见街口"), "ASSET_REFERENCE_LOCATION");
  rejects(fixture.replace("【风格】", "【风格】@image1"), "ASSET_REFERENCE_LOCATION");
});
test("no-reference prompts retain the section and the explicit empty declaration", () => {
  assert.equal(accepts(references("无外部参考素材")).facts.assets, 0);
  accepts(references("无外部参考素材。").replace(/^【全局约束】.*$/mu, "【全局约束】林岚穿深色外套，场景为门外的湿润街道；无字幕，无BGM。"));
  rejects(references("无外部参考素材。林岚穿深色外套。"), "ASSET_EMPTY_DECLARATION");
  rejects(references(""), "ASSET_EMPTY_DECLARATION");
  rejects(references("无"), "ASSET_EMPTY_DECLARATION");
  rejects(references("@image1为人物；无外部参考素材"), "ASSET_EMPTY_CONFLICT");
});
test("counts 50 mixed unique assets, not highest ID, and rejects 51", () => {
  const fifty = Array.from({ length: 49 }, (_, index) => "@image" + (index + 1) + "=人物").join("；") + "；@video1=预演";
  assert.equal(accepts(references(fifty)).facts.assets, 50);
  rejects(references(fifty + "；@audio1=音色"), "ASSET_LIMIT");
  const sparse = Array.from({ length: 49 }, (_, index) => "@image" + (index + 100) + "=人物").join("；") + "；@video70=预演";
  assert.equal(accepts(references(sparse), { preserveAssetNumbering: true }).facts.assets, 50);
  rejects(references(sparse + "；@audio90=音色"), "ASSET_LIMIT", { preserveAssetNumbering: true });
});
test("number preservation remains explicit and leaves all other asset checks active", () => {
  const input = references("@image4=人物；@image1=街道；@video7=预演；@video8=新增视频");
  for (const options of [undefined, { preserveAssetNumbering: false }, { preserveAssetNumbering: "true" }]) rejects(input, "ASSET_NUMBERING", options);
  accepts(input, { preserveAssetNumbering: true });
  rejects(input.replace("@image4=人物", "@image4=人物；@image4=比例"), "ASSET_DUPLICATE_REFERENCE", { preserveAssetNumbering: true });
  rejects(input.replace("她听见街口", "@video8她听见街口"), "ASSET_REFERENCE_LOCATION", { preserveAssetNumbering: true });
});
test("a supplied prior token ledger verifies retained order and append-after-highest numbering", () => {
  const options = { preserveAssetNumbering: true, existingAssetTokens: ["@image4", "@image1", "@video7"] };
  accepts(references("@image4=人物；@image1=街道；@video7=预演；@image5=新增图；@video8=新增视频"), options);
  rejects(references("@image1=街道；@image4=人物；@video7=预演"), "ASSET_EXISTING_ORDER", options);
  rejects(references("@image4=人物；@video7=预演"), "ASSET_EXISTING_ORDER", options);
  rejects(references("@image4=人物；@image1=街道；@video7=预演；@image2=新图"), "ASSET_APPEND_NUMBERING", options);
  rejects(fixture, "ASSET_BASELINE", { existingAssetTokens: ["@image1"] });
});
test("does not masquerade character counts, repeated lenses or sound-word counts as quality checks", () => {
  accepts(fixture.replace("全景，35mm", "中景，50mm"));
  accepts(fixture.replace("雨滴敲打雨棚，门轴摩擦声随开门响起", "雨滴敲打雨棚；同一雨棚的滴水声延续；这一声源的远近层次清楚；不添加BGM"));
  accepts(fixture.replace("【风格】", "【风格】" + "这是一段较长的质感描述。".repeat(1200)));
});
test("CLI accepts a file or stdin, emits JSON, and has meaningful failure exit codes", () => {
  const file = spawnSync(process.execPath, [script, "--json", fixtureFile], { encoding: "utf8" });
  assert.equal(file.status, 0, file.stderr);
  assert.equal(JSON.parse(file.stdout).facts.duration, 8);
  const input = references("@image4=人物；@video8=预演");
  const strict = spawnSync(process.execPath, [script, "--json"], { input, encoding: "utf8" });
  assert.equal(strict.status, 1, strict.stderr);
  assert.ok(codes(JSON.parse(strict.stdout)).includes("ASSET_NUMBERING"));
  const preserved = spawnSync(process.execPath, [script, "--json", "--preserve-asset-numbering"], { input, encoding: "utf8" });
  assert.equal(preserved.status, 0, preserved.stderr);
  assert.equal(JSON.parse(preserved.stdout).ok, true);
});
