#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const NINE_LAYER_HEADINGS = [
  "头锁区·全片统一",
  "元信息",
  "风险预判",
  "衔接入",
  "时间线",
  "衔接出",
  "声音设计",
  "参考图权重",
  "执行约束",
];

const FIXED_LAYER_HEADINGS = new Set(NINE_LAYER_HEADINGS.filter((heading) => heading !== "时间线"));
const TIMELINE_HEADING = /^时间线 卡(0|[1-9]\d*)(?:\.(\d+))?秒$/;

function parseTimelineHeading(raw) {
  const match = TIMELINE_HEADING.exec(raw);
  if (!match) return null;
  return Number(match[2] === undefined ? match[1] : `${match[1]}.${match[2]}`);
}

function collectLayerHeadings(text) {
  const headings = [];
  for (const line of text.replace(/\r\n?/g, "\n").split("\n")) {
    const match = /^\s*【([^】]+)】\s*$/.exec(line);
    if (!match) continue;
    const raw = match[1];
    const duration = parseTimelineHeading(raw);
    const key = duration === null ? raw : "时间线";
    headings.push({ raw, key, duration, canonical: FIXED_LAYER_HEADINGS.has(raw) || duration !== null });
  }
  return headings;
}

function metadataDurations(text) {
  const values = [];
  let inMetadata = false;
  for (const line of text.replace(/\r\n?/g, "\n").split("\n")) {
    const heading = /^\s*【([^】]+)】\s*$/.exec(line);
    if (heading) {
      inMetadata = heading[1] === "元信息";
      continue;
    }
    if (!inMetadata) continue;
    const match = /^\s*(?:[-*]\s*)?(?:片段时长|时长)\s*[:：]\s*(\d+(?:\.\d+)?)\s*(?:秒|s)(?![\p{L}\p{N}_])/iu.exec(line);
    if (match) values.push(Number(match[1]));
  }
  return values;
}

function layerBody(text, layerName) {
  const body = [];
  let active = false;
  for (const line of text.replace(/\r\n?/g, "\n").split("\n")) {
    const heading = /^\s*【([^】]+)】\s*$/.exec(line);
    if (heading) {
      active = heading[1] === layerName;
      continue;
    }
    if (active) body.push(line);
  }
  return body.join("\n");
}

function hasExactTimeRange(text, expectedStart, expectedEnd) {
  const range = /(\d+(?:\.\d+)?)\s*(?:秒|s)?\s*(?:-|–|—|~|～|至|到)\s*(\d+(?:\.\d+)?)\s*(?:秒|s)/giu;
  let match;
  while ((match = range.exec(text))) {
    const start = Number(match[1]);
    const end = Number(match[2]);
    if (Math.abs(start - expectedStart) < 1e-9 && Math.abs(end - expectedEnd) < 1e-9) return true;
  }
  return false;
}

const CANONICAL_ASSET_TOKEN = /@(image|video|audio)([1-9]\d*)\b/g;
const ASSETISH_AT_TOKEN = /@(?:image|video|audio|img|图片|视频|音频)[\p{L}\p{N}_-]*/giu;
const ASSET_RANGE = /@(image|video|audio)[1-9]\d*\s*(?:-|–|—|~|～|至)\s*@?(?:(?:image|video|audio))?[1-9]\d*/g;
const LOCAL_SOURCE_PATH = /(?:file:\/\/|[A-Za-z]:[\\/]|(?:^|[\s：｜|])\.{1,2}[\\/])/imu;
const SOURCE_URL = /https?:\/\//iu;
const SOURCE_FILENAME = /(?:^|[\s：｜|])[^\r\n：｜|]*?\.(?:png|jpe?g|webp|gif|bmp|tiff?|heic|mp4|mov|mkv|avi|webm|mp3|wav|m4a|flac|aac)(?=$|[\s，。；;｜|])/imu;

function canonicalAssetOccurrences(text) {
  return [...text.matchAll(CANONICAL_ASSET_TOKEN)].map((match) => ({
    token: match[0],
    type: match[1],
    number: Number(match[2]),
  }));
}

function assetContract(text) {
  const errors = [];
  const referenceText = layerBody(text, "参考图权重");
  const allOccurrences = canonicalAssetOccurrences(text);
  const referenceOccurrences = canonicalAssetOccurrences(referenceText);
  const allCounts = new Map();
  const referenceCounts = new Map();

  for (const occurrence of allOccurrences) {
    allCounts.set(occurrence.token, (allCounts.get(occurrence.token) ?? 0) + 1);
  }
  for (const occurrence of referenceOccurrences) {
    referenceCounts.set(occurrence.token, (referenceCounts.get(occurrence.token) ?? 0) + 1);
  }

  const invalidTokens = [...new Set(
    [...text.matchAll(ASSETISH_AT_TOKEN)]
      .map((match) => match[0])
      .filter((token) => !/^@(image|video|audio)[1-9]\d*$/.test(token)),
  )];
  if (invalidTokens.length) {
    errors.push({
      code: "ASSET_TOKEN_FORMAT",
      message: `non-canonical asset placeholders: ${invalidTokens.join(", ")}; use @imageN, @videoN, or @audioN`,
    });
  }

  const ranges = [...referenceText.matchAll(ASSET_RANGE)].map((match) => match[0]);
  if (ranges.length) {
    errors.push({ code: "ASSET_RANGE", message: `asset ranges are not allowed: ${ranges.join(", ")}` });
  }

  if (LOCAL_SOURCE_PATH.test(text) || SOURCE_URL.test(referenceText) || SOURCE_FILENAME.test(referenceText)) {
    errors.push({
      code: "ASSET_SOURCE_LOCATOR",
      message: "formal prompts must not contain asset paths, URLs, or source filenames",
    });
  }

  for (const [token, count] of allCounts) {
    if (count > 1) {
      errors.push({ code: "ASSET_DUPLICATE_REFERENCE", message: `${token} appears ${count} times; each placeholder must appear once` });
    }
    if ((referenceCounts.get(token) ?? 0) !== count) {
      errors.push({ code: "ASSET_REFERENCE_LAYER", message: `${token} appears outside 【参考图权重】` });
    }
  }

  for (const line of referenceText.split("\n")) {
    const occurrences = canonicalAssetOccurrences(line);
    if (occurrences.length > 1 || (occurrences.length === 1 && !line.trimStart().startsWith(occurrences[0].token))) {
      errors.push({
        code: "ASSET_LINE_FORMAT",
        message: "each asset line must start with exactly one canonical placeholder",
      });
      break;
    }
  }

  for (const type of ["image", "video", "audio"]) {
    const numbers = referenceOccurrences.filter((item) => item.type === type).map((item) => item.number);
    if (numbers.some((number, index) => number !== index + 1)) {
      errors.push({
        code: "ASSET_NUMBERING",
        message: `@${type} placeholders must be contiguous from @${type}1 in appearance order`,
      });
    }
  }

  const uniqueTokens = new Set(allOccurrences.map((occurrence) => occurrence.token));
  const declaredValues = [...referenceText.matchAll(/(?:素材总数|参考素材总数|素材数量)\s*[:：]\s*(\d+)/g)]
    .map((match) => Number(match[1]));
  const declared = declaredValues.length ? Math.max(...declaredValues) : null;
  if (declaredValues.length !== 1) {
    errors.push({
      code: "ASSET_COUNT_DECLARATION",
      message: `【参考图权重】 must contain exactly one asset-count declaration; found ${declaredValues.length}`,
    });
  }
  if (declared !== null && declared !== uniqueTokens.size) {
    errors.push({
      code: "ASSET_COUNT_MISMATCH",
      message: `declared asset count ${declared} does not match ${uniqueTokens.size} unique canonical placeholders`,
    });
  }

  const assets = Math.max(uniqueTokens.size, declared ?? 0);
  return { assets, tokens: [...uniqueTokens], errors };
}

function braceError(text) {
  const stack = [];
  for (let index = 0; index < text.length; index += 1) {
    if (text[index] === "{") stack.push(index);
    if (text[index] === "}") {
      if (stack.length === 0) return `unexpected closing brace at character ${index + 1}`;
      stack.pop();
    }
  }
  return stack.length ? `unclosed opening brace at character ${stack.at(-1) + 1}` : null;
}

export function validatePrompt(text) {
  const errors = [];
  const headings = collectLayerHeadings(text);
  const canonicalHeadings = headings.filter((heading) => heading.canonical);
  const actual = canonicalHeadings.map((heading) => heading.key);
  const invalid = headings.filter((heading) => !heading.canonical);
  for (const heading of invalid) {
    errors.push({ code: "INVALID_LAYER_HEADING", message: `unexpected or malformed layer heading: 【${heading.raw}】` });
  }

  const selfCheckHeading = /(?:^\s*【[^】]*(?:正向化检查|自检|自查|验收)[^】]*】\s*$|^\s*#{1,6}\s+.*(?:正向化检查|自检|自查|验收).*$)/m.exec(text);
  if (selfCheckHeading) {
    errors.push({ code: "SELF_CHECK_HEADING", message: `self-check heading found: ${selfCheckHeading[0].trim()}` });
  }

  if (actual.length !== NINE_LAYER_HEADINGS.length || actual.some((value, index) => value !== NINE_LAYER_HEADINGS[index])) {
    errors.push({
      code: "NINE_LAYER_ORDER",
      message: `expected ${NINE_LAYER_HEADINGS.join(" -> ")}; found ${actual.join(" -> ") || "none"}`,
    });
  }

  const timeline = canonicalHeadings.find((heading) => heading.key === "时间线");
  const duration = timeline?.duration ?? null;
  if (duration === null) {
    errors.push({ code: "DURATION_MISSING", message: "duration is missing from an exact 【时间线 卡N秒】 heading" });
  } else if (duration < 4 || duration > 30) {
    errors.push({ code: "DURATION_RANGE", message: `duration ${duration}s is outside 4-30s` });
  }

  if (duration !== null) {
    const mismatchedMetadata = metadataDurations(text).find((value) => value !== duration);
    if (mismatchedMetadata !== undefined) {
      errors.push({
        code: "DURATION_MISMATCH",
        message: `timeline duration ${duration}s conflicts with metadata duration ${mismatchedMetadata}s`,
      });
    }
  }

  if (!hasExactTimeRange(layerBody(text, "衔接入"), 0, 0.5)) {
    errors.push({
      code: "ENTRY_STABILITY_ZONE",
      message: "【衔接入】 must contain the 0.0-0.5s stability range",
    });
  }
  if (duration !== null && !hasExactTimeRange(layerBody(text, "衔接出"), duration - 0.5, duration)) {
    errors.push({
      code: "EXIT_STABILITY_ZONE",
      message: `【衔接出】 must contain the ${duration - 0.5}-${duration}s stability range`,
    });
  }

  const asset = assetContract(text);
  errors.push(...asset.errors);
  const assets = asset.assets;
  if (assets > 50) errors.push({ code: "ASSET_LIMIT", message: `asset count ${assets} exceeds 50` });

  const brace = braceError(text);
  if (brace) errors.push({ code: "BRACE_BALANCE", message: brace });

  return {
    ok: errors.length === 0,
    errors,
    facts: { duration, assets, assetTokens: asset.tokens, headings: actual, rawHeadings: headings.map((heading) => heading.raw) },
  };
}

async function readInput(args) {
  if (args.length > 1) throw new Error("Usage: node scripts/validate-prompt.mjs [--json] [prompt-file]");
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
  const result = validatePrompt(await readInput(args));
  if (json) process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  else if (result.ok) process.stdout.write(`valid duration=${result.facts.duration}s assets=${result.facts.assets}\n`);
  else process.stderr.write(`${result.errors.map((error) => `${error.code}: ${error.message}`).join("\n")}\n`);
  if (!result.ok) process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(`${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  });
}
