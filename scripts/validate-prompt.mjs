#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const PROMPT_HEADINGS = [
  "通用约束栏 · 本 segment 共享",
  "本段戏剧任务",
  "本段情节",
  "镜头",
  "收尾约束",
];

// Import-compatible alias for local tooling that used the previous name.
export const NINE_LAYER_HEADINGS = PROMPT_HEADINGS;

const SECTION_LINE = /^\s*【([^】]+)】\s*(.*?)\s*$/u;
const SHOT_LINE = /^\s*【\s*镜头\s*(\d+)\s*(?:(?::|：)\s*([^】]*?))?\s*】\s*\|\s*(\d{1,2}:\d{2}(?:\.\d+)?|\d+(?:\.\d+)?)\s*(?:秒|s)?\s*[-–—~～至到]\s*(\d{1,2}:\d{2}(?:\.\d+)?|\d+(?:\.\d+)?)\s*(?:秒|s)?\s*$/u;
const CANONICAL_ASSET_TOKEN = /@(image|video|audio)([1-9]\d*)(?![\p{L}\p{N}_-])/gu;
const ASSETISH_AT_TOKEN = /@(?:image|video|audio|img|图片|视频|音频)[\p{L}\p{N}_-]*/giu;
const ASSET_RANGE = /@(image|video|audio)[1-9]\d*\s*(?:-|–|—|~|～|至)\s*@?(?:(?:image|video|audio))?[1-9]\d*/gu;
const LOCAL_SOURCE_PATH = /(?:file:\/\/|[A-Za-z]:[\\/]|(?:^|[\s：｜|])\.{1,2}[\\/])/mu;
const SOURCE_URL = /https?:\/\//iu;
const SOURCE_FILENAME = /(?:^|[\s：｜|])[^\r\n：｜|]*?\.(?:png|jpe?g|webp|gif|bmp|tiff?|heic|mp4|mov|mkv|avi|webm|mp3|wav|m4a|flac|aac)(?=$|[\s，。；;｜|])/imu;
const LEGACY_HEADING = /(?:头锁区|元信息|风险预判|衔接入|时间线(?:\s*卡)?|衔接出|参考图权重|执行约束|正向化检查|自检|自查|验收|光影风格卡|摄影机画面质感|音效风格卡|声音设计|场景空间关系|空间约束|物理空间约束|人物比例约束|表演风格|镜头与机位设置|运镜分段|Style Lock)/u;

const COMMON_HEADING = /^通用约束栏(?:\s*[·|].*)?$/u;
const DRAMA_HEADING = /^本段戏剧任务$/u;
const STORY_HEADINGS = new Set(["本段情节", "本段故事内容", "场景 + 调性"]);
const END_HEADINGS = new Set(["收尾约束", "约束"]);

function normalize(text) {
  return text.replace(/\r\n?/g, "\n");
}

function parseTime(value) {
  if (value.includes(":")) {
    const parts = value.split(":");
    const minutes = Number(parts[0]);
    const seconds = Number(parts[1]);
    if (!Number.isFinite(minutes) || !Number.isFinite(seconds) || seconds >= 60) return null;
    return minutes * 60 + seconds;
  }
  const result = Number(value);
  return Number.isFinite(result) ? result : null;
}

function classifySection(raw) {
  const name = raw.trim();
  if (COMMON_HEADING.test(name)) return "common";
  if (DRAMA_HEADING.test(name)) return "drama";
  if (STORY_HEADINGS.has(name)) return "story";
  if (END_HEADINGS.has(name)) return "ending";
  if (LEGACY_HEADING.test(name)) return "legacy";
  return "unknown";
}

function scanPrompt(text) {
  const lines = normalize(text).split("\n");
  const sections = [];
  const shots = [];
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const shot = SHOT_LINE.exec(line);
    if (shot) {
      shots.push({
        number: Number(shot[1]),
        title: (shot[2] ?? "").trim(),
        start: parseTime(shot[3]),
        end: parseTime(shot[4]),
        line: index + 1,
      });
      continue;
    }
    const heading = SECTION_LINE.exec(line);
    if (heading) sections.push({ raw: heading[1].trim(), inlineBody: heading[2].trim(), kind: classifySection(heading[1]), line: index + 1 });
  }
  return { lines, sections, shots };
}

function bodyBetween(lines, startLine, endLine = lines.length) {
  return lines.slice(startLine, endLine).join("\n");
}

function sectionBody(scan, section, endLine = scan.lines.length) {
  return [section.inlineBody, bodyBetween(scan.lines, section.line, endLine)].filter(Boolean).join("\n");
}

function commonBody(scan, common) {
  const drama = scan.sections.find((section) => section.kind === "drama" && section.line > common.line);
  return sectionBody(scan, common, drama ? drama.line - 1 : scan.lines.length);
}

function shotBody(scan, shot, nextShot) {
  const ending = scan.sections.find((section) => section.kind === "ending" && section.line > shot.line);
  const endLine = nextShot ? nextShot.line - 1 : ending ? ending.line - 1 : scan.lines.length;
  return bodyBetween(scan.lines, shot.line, endLine);
}

function hasRange(text, expectedStart, expectedEnd) {
  const range = /(\d{1,2}:\d{2}(?:\.\d+)?|\d+(?:\.\d+)?)\s*(?:秒|s)?\s*[-–—~～至到]\s*(\d{1,2}:\d{2}(?:\.\d+)?|\d+(?:\.\d+)?)/gu;
  let match;
  while ((match = range.exec(text))) {
    const start = parseTime(match[1]);
    const end = parseTime(match[2]);
    if (start !== null && end !== null && Math.abs(start - expectedStart) < 1e-9 && Math.abs(end - expectedEnd) < 1e-9) return true;
  }
  return false;
}

function hasOpeningStability(text) {
  return hasRange(text, 0, 0.5)
    || /(?:首|开头|前)\s*0?\.5\s*秒|稳定(?:入场|开场)|保持(?:起始|开场)状态|起始状态/u.test(text)
    || /有意(?:冲击|断裂)/u.test(text);
}

function hasEndingStability(text, duration) {
  return hasRange(text, duration - 0.5, duration)
    || /(?:末|最后)\s*0?\.5\s*秒|稳定(?:收尾|出场)|保持(?:落幅|结束)状态|最终状态/u.test(text)
    || /有意(?:戛然而止|断裂|冲击)/u.test(text);
}

function braceError(text) {
  const stack = [];
  for (let index = 0; index < text.length; index += 1) {
    if (text[index] === "{") stack.push(index);
    if (text[index] === "}") {
      if (stack.length === 0) return "unexpected closing brace at character " + (index + 1);
      stack.pop();
    }
  }
  return stack.length ? "unclosed opening brace at character " + (stack.at(-1) + 1) : null;
}

function assetContract(text, scan, common, preserveAssetNumbering) {
  const errors = [];
  const commonText = common ? commonBody(scan, common) : "";
  const allOccurrences = [...text.matchAll(CANONICAL_ASSET_TOKEN)].map((match) => ({
    token: match[0],
    type: match[1],
    number: Number(match[2]),
    index: match.index,
  }));
  const commonOccurrences = [...commonText.matchAll(CANONICAL_ASSET_TOKEN)].map((match) => ({
    token: match[0],
    type: match[1],
    number: Number(match[2]),
  }));
  const invalidTokens = [...new Set(
    [...text.matchAll(ASSETISH_AT_TOKEN)]
      .map((match) => match[0])
      .filter((token) => !/^@(image|video|audio)[1-9]\d*$/.test(token)),
  )];
  if (invalidTokens.length) errors.push({ code: "ASSET_TOKEN_FORMAT", message: "non-canonical asset placeholders: " + invalidTokens.join(", ") });
  const ranges = [...commonText.matchAll(ASSET_RANGE)].map((match) => match[0]);
  if (ranges.length) errors.push({ code: "ASSET_RANGE", message: "asset ranges are not allowed: " + ranges.join(", ") });
  if (LOCAL_SOURCE_PATH.test(text) || SOURCE_URL.test(text) || SOURCE_FILENAME.test(text)) {
    errors.push({ code: "ASSET_SOURCE_LOCATOR", message: "formal prompts must not contain asset paths, URLs, or source filenames" });
  }

  const lines = normalize(text).split("\n");
  const commonStart = common?.line ?? 0;
  const dramaLine = scan.sections.find((section) => section.kind === "drama")?.line ?? Number.POSITIVE_INFINITY;
  for (const occurrence of allOccurrences) {
    const lineNumber = text.slice(0, occurrence.index).split("\n").length;
    const line = lines[lineNumber - 1] ?? "";
    const inCommon = lineNumber >= commonStart && lineNumber < dramaLine;
    const isReferenceLine = /^\s*(?:[─*-]\s*)?素材绑定\s*[:：]/u.test(line)
      || /^\s*【素材绑定】/u.test(line);
    if (!inCommon || !isReferenceLine) {
      errors.push({ code: "ASSET_REFERENCE_LOCATION", message: occurrence.token + " must appear on the 素材绑定 row inside 【通用约束栏】" });
    }
  }

  const counts = new Map();
  for (const occurrence of allOccurrences) counts.set(occurrence.token, (counts.get(occurrence.token) ?? 0) + 1);
  for (const [token, count] of counts) {
    if (count > 1) errors.push({ code: "ASSET_DUPLICATE_REFERENCE", message: token + " appears " + count + " times; each placeholder must appear once" });
  }
  // Existing prompts may retain sparse or reordered IDs when a reference is added.
  // This development-only option leaves every other asset check in force.
  if (preserveAssetNumbering !== true) {
    for (const type of ["image", "video", "audio"]) {
      const numbers = commonOccurrences.filter((item) => item.type === type).map((item) => item.number);
      if (numbers.some((number, index) => number !== index + 1)) {
        errors.push({ code: "ASSET_NUMBERING", message: "@" + type + " placeholders must be contiguous from @" + type + "1 in appearance order" });
      }
    }
  }
  const declaredValues = [...commonText.matchAll(/(?:素材总数|参考素材总数|素材数量)\s*[:：]\s*(\d+)/gu)].map((match) => Number(match[1]));
  if (declaredValues.length > 1) errors.push({ code: "ASSET_COUNT_DECLARATION", message: "keep at most one asset-count declaration in the common section" });
  const uniqueTokens = new Set(allOccurrences.map((occurrence) => occurrence.token));
  if (declaredValues.length && declaredValues[0] !== uniqueTokens.size) {
    errors.push({ code: "ASSET_COUNT_MISMATCH", message: "declared asset count does not match unique canonical placeholders" });
  }
  const assets = Math.max(uniqueTokens.size, declaredValues[0] ?? 0);
  if (assets > 50) errors.push({ code: "ASSET_LIMIT", message: "asset count " + assets + " exceeds 50" });
  return { assets, tokens: [...uniqueTokens], errors };
}

export function validatePrompt(input, { preserveAssetNumbering = false } = {}) {
  const text = normalize(input);
  const scan = scanPrompt(text);
  const errors = [];
  const common = scan.sections.find((section) => section.kind === "common");
  const drama = scan.sections.find((section) => section.kind === "drama");
  const story = scan.sections.find((section) => section.kind === "story");
  const ending = scan.sections.find((section) => section.kind === "ending");

  for (const section of scan.sections) {
    if (section.kind === "legacy") errors.push({ code: "LEGACY_SECTION", message: "legacy section heading at line " + section.line + ": 【" + section.raw + "】" });
    if (section.kind === "unknown") errors.push({ code: "UNEXPECTED_SECTION", message: "unexpected section heading at line " + section.line + ": 【" + section.raw + "】" });
  }
  if (/^\s*【[^】]*(?:自检|自查|验收|正向化检查)[^】]*】/mu.test(text)) errors.push({ code: "SELF_CHECK_HEADING", message: "self-check heading found" });

  if (!common) errors.push({ code: "COMMON_SECTION_MISSING", message: "missing 【通用约束栏】" });
  if (scan.sections.filter((section) => section.kind === "common").length > 1) errors.push({ code: "COMMON_SECTION_DUPLICATE", message: "【通用约束栏】 appears more than once" });
  if (!drama) errors.push({ code: "DRAMA_TASK_MISSING", message: "missing 【本段戏剧任务】" });
  if (scan.sections.filter((section) => section.kind === "drama").length > 1) errors.push({ code: "DRAMA_TASK_DUPLICATE", message: "【本段戏剧任务】 appears more than once" });
  if (!story) errors.push({ code: "STORY_SECTION_MISSING", message: "missing 【本段情节】" });
  if (!ending) errors.push({ code: "ENDING_SECTION_MISSING", message: "missing 【收尾约束】" });
  if (drama && !drama.inlineBody) errors.push({ code: "DRAMA_TASK_INLINE", message: "put the dramatic task on the same line as 【本段戏剧任务】" });
  if (story && !story.inlineBody) errors.push({ code: "STORY_INLINE", message: "put the segment story on the same line as 【本段情节】" });
  if (ending && !ending.inlineBody) errors.push({ code: "ENDING_INLINE", message: "put the ending constraints on the same line as 【收尾约束】" });
  if (!scan.shots.length) errors.push({ code: "SHOT_MISSING", message: "at least one 【镜头N】 block is required" });

  if (common && drama && common.line > drama.line) errors.push({ code: "SECTION_ORDER", message: "【通用约束栏】 must precede 【本段戏剧任务】" });
  if (drama && story && drama.line > story.line) errors.push({ code: "SECTION_ORDER", message: "【本段戏剧任务】 must precede 【本段情节】" });
  if (story && scan.shots[0] && story.line > scan.shots[0].line) errors.push({ code: "SECTION_ORDER", message: "【本段情节】 must precede the first shot" });
  if (scan.shots.length && ending && scan.shots.at(-1).line > ending.line) errors.push({ code: "SECTION_ORDER", message: "all shot blocks must precede 【收尾约束】" });
  if (ending && scan.sections.some((section) => section.line > ending.line)) errors.push({ code: "ENDING_NOT_LAST", message: "【收尾约束】 must be the final section" });

  for (let index = 0; index < scan.shots.length; index += 1) {
    const shot = scan.shots[index];
    if (shot.number !== index + 1) errors.push({ code: "SHOT_NUMBERING", message: "shot numbering must start at 1 and remain contiguous" });
    if (shot.title) errors.push({ code: "SHOT_HEADING_FORMAT", message: "shot headings contain only the shot number and timecode; move names and shot sizes into the technical declaration" });
    if (shot.start === null || shot.end === null || shot.end < shot.start) errors.push({ code: "SHOT_TIME_FORMAT", message: "invalid shot time at line " + shot.line });
    const previous = scan.shots[index - 1];
    if (previous && shot.start !== null && previous.end !== null && Math.abs(shot.start - previous.end) > 1e-9) {
      errors.push({ code: shot.start < previous.end ? "SHOT_TIME_OVERLAP" : "SHOT_TIME_GAP", message: "shot " + shot.number + " does not start at the previous shot's end" });
    }
    const body = shotBody(scan, shot, scan.shots[index + 1]).replace(SHOT_LINE, "").trim();
    if (!body) errors.push({ code: "SHOT_BODY_MISSING", message: "shot " + shot.number + " has no descriptive body" });
  }

  const duration = scan.shots.length ? scan.shots.at(-1).end : null;
  if (duration !== null && (duration < 4 || duration > 30)) errors.push({ code: "DURATION_RANGE", message: "duration " + duration + "s is outside 4-30s" });
  if (scan.shots.length && scan.shots[0].start !== null && Math.abs(scan.shots[0].start) > 1e-9) errors.push({ code: "SHOT_START", message: "the first shot must start at 0:00" });
  if (duration !== null && scan.shots.length) {
    const firstBody = (common ? commonBody(scan, common) : "") + "\n" + shotBody(scan, scan.shots[0], scan.shots[1]);
    const lastBody = shotBody(scan, scan.shots.at(-1));
    const endingBody = ending ? sectionBody(scan, ending, scan.lines.length) : "";
    if (!hasOpeningStability(firstBody)) errors.push({ code: "ENTRY_STABILITY_ZONE", message: "the opening shot must describe a stable first 0.5s state" });
    if (!hasEndingStability(lastBody + "\n" + endingBody, duration)) errors.push({ code: "EXIT_STABILITY_ZONE", message: "the ending must describe a stable final 0.5s state" });
  }

  const asset = assetContract(text, scan, common, preserveAssetNumbering);
  errors.push(...asset.errors);
  const brace = braceError(text);
  if (brace) errors.push({ code: "BRACE_BALANCE", message: brace });

  return {
    ok: errors.length === 0,
    errors,
    facts: {
      duration,
      assets: asset.assets,
      assetTokens: asset.tokens,
      headings: scan.sections.filter((section) => ["common", "drama", "story", "ending"].includes(section.kind)).map((section) => section.raw),
      sections: scan.sections.map((section) => section.kind),
      shots: scan.shots.map(({ number, title, start, end, line }) => ({ number, title, start, end, line })),
    },
  };
}

async function readInput(args) {
  if (args.length > 1) throw new Error("Usage: node scripts/validate-prompt.mjs [--json] [--preserve-asset-numbering] [prompt-file]");
  if (args.length === 1) return readFile(path.resolve(args[0]), "utf8");
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}

async function main() {
  const args = process.argv.slice(2);
  const jsonIndex = args.indexOf("--json");
  const json = jsonIndex !== -1;
  if (json) args.splice(jsonIndex, 1);
  const preserveIndex = args.indexOf("--preserve-asset-numbering");
  const preserveAssetNumbering = preserveIndex !== -1;
  if (preserveAssetNumbering) args.splice(preserveIndex, 1);
  const result = validatePrompt(await readInput(args), { preserveAssetNumbering });
  if (json) process.stdout.write(JSON.stringify(result, null, 2) + "\n");
  else if (result.ok) process.stdout.write("valid duration=" + result.facts.duration + "s assets=" + result.facts.assets + " shots=" + result.facts.shots.length + "\n");
  else process.stderr.write(result.errors.map((error) => error.code + ": " + error.message).join("\n") + "\n");
  if (!result.ok) process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write((error.stack ?? error.message) + "\n");
    process.exitCode = 1;
  });
}
