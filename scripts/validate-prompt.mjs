#!/usr/bin/env node

// Development-only structural checks, not photography/performance/physics QA.
// Real-world sound-source count and reference-source identity are not inferred.
import { lexInlineText } from "./inline-dialogue.mjs";
import { compareDialogue } from "./dialogue-baseline.mjs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const PROMPT_HEADINGS = ["风格", "素材绑定", "全局约束", "本段戏剧任务", "本段情绪总控", "镜头"];
const PREAMBLE = PROMPT_HEADINGS.slice(0, -1);
const SECTION_LINE = /^\s*【([^】]+)】\s*(.*?)\s*$/u;
const SHOT_LINE = /^\s*镜头([1-9]\d*)\s*｜\s*(\d{1,2}:\d{2}(?:\.\d+)?)\s*-\s*(\d{1,2}:\d{2}(?:\.\d+)?)\s*$/u;
const SHOTISH_LINE = /^\s*(?:【\s*)?镜头\s*\d/u;
const ASSET_TOKEN = /@(image|video|audio)([1-9]\d*)(?![A-Za-z0-9_.\/-])/gu;
const AT_TOKEN = /@[^@\s=＝：:，。；;、【】（）(){}]*/gu;
const ASSET_RANGE = /@(image|video|audio)[1-9]\d*\s*(?:-|–|—|~|～|至)\s*@?(?:(?:image|video|audio))?[1-9]\d*/u;
const SOURCE_LOCATOR = /(?:file:\/\/|https?:\/\/|[A-Za-z]:[\\/]|(?:^|[\s：｜|=])\.{1,2}[\\/]|(?:^|[\s：｜|=])[^\r\n：｜|=]*?\.(?:png|jpe?g|webp|gif|bmp|tiff?|heic|mp4|mov|mkv|avi|webm|mp3|wav|m4a|flac|aac)(?=$|[\s，。；;｜|]))/imu;
const LEGACY_HEADING = /(?:通用约束栏|本段情节|本段故事内容|场景\s*\+\s*调性|收尾约束|^约束$|头锁区|元信息|风险预判|衔接入|时间线|衔接出|参考图权重|执行约束|正向化检查|自检|自查|验收|光影风格卡|摄影机画面质感|音效风格卡|声音设计|场景空间关系|空间约束|物理空间约束|人物比例约束|表演风格|镜头与机位设置|运镜分段|Style Lock)/u;
const LEGACY_ROW = /^\s*(?:[─*-]\s*)?(?:通用约束栏|本段情节|本段故事内容|收尾约束|头锁区|本镜NOT|光影色彩风格|角色外观|场景外观|机位|景别|焦距|运镜|叙述|表演)\s*[:：]/mu;

function normalize(input) {
  const text = input.replace(/^\uFEFF/u, "").replace(/\r\n?/g, "\n").trim();
  const fenced = /^(\x60{3,}|~{3,})[^\n]*\n([\s\S]*?)\n\1$/u.exec(text);
  return fenced ? fenced[2].trim() : text;
}
function parseTime(value) {
  const [minutes, seconds] = value.split(":").map(Number);
  return Number.isFinite(minutes) && Number.isFinite(seconds) && seconds < 60 ? minutes * 60 + seconds : null;
}
function scanPrompt(text, options = {}) {
  const lines = text.split("\n"), sections = [], shots = [], malformedShots = [];
  const structuralLines = lexInlineText(text, options).structuralText.split("\n");
  for (const [index, line] of structuralLines.entries()) {
    const match = SHOT_LINE.exec(line);
    if (match) shots.push({ number: Number(match[1]), start: parseTime(match[2]), end: parseTime(match[3]), line: index + 1 });
    else if (SHOTISH_LINE.test(line)) malformedShots.push(index + 1);
    else {
      const heading = SECTION_LINE.exec(line);
      if (heading) sections.push({ name: heading[1].trim(), inlineBody: SECTION_LINE.exec(lines[index])[2], line: index + 1 });
    }
  }
  const boundaries = [...sections, ...shots, ...malformedShots.map((line) => ({ line }))].sort((a, b) => a.line - b.line);
  const body = (item) => {
    const end = boundaries.find((boundary) => boundary.line > item.line)?.line ?? lines.length + 1;
    return [item.inlineBody ?? "", ...lines.slice(item.line, end - 1)].join("\n").trim();
  };
  return { lines, sections, shots, malformedShots, body, boundaries };
}
function tokens(text) {
  return [...text.matchAll(ASSET_TOKEN)].map((match) => ({ token: match[0], type: match[1], number: Number(match[2]), index: match.index }));
}
function assetContract(text, scan, options, errors) {
  const binding = scan.sections.find((section) => section.name === "素材绑定");
  const bindingText = binding ? scan.body(binding) : "";
  const occurrences = tokens(text), bound = tokens(bindingText);
  const unique = [...new Set(occurrences.map((item) => item.token))];
  for (const match of text.matchAll(AT_TOKEN)) {
    // A Chinese description can follow a token without whitespace.
    if (!/^@(image|video|audio)[1-9]\d*(?![A-Za-z0-9_.\/-])/u.test(match[0])) errors.push({ code: "ASSET_TOKEN_FORMAT", message: "non-canonical @ token: " + match[0] });
  }
  if (ASSET_RANGE.test(bindingText)) errors.push({ code: "ASSET_RANGE", message: "list each unique asset separately, not as a range" });
  if (SOURCE_LOCATOR.test(text)) errors.push({ code: "ASSET_SOURCE_LOCATOR", message: "formal prompts exclude asset paths, URLs, and filenames" });
  const end = binding ? (scan.boundaries.find((item) => item.line > binding.line)?.line ?? scan.lines.length + 1) : 0;
  for (const item of occurrences) {
    const line = text.slice(0, item.index).split("\n").length;
    if (!binding || line < binding.line || line >= end) errors.push({ code: "ASSET_REFERENCE_LOCATION", message: item.token + " belongs only inside 【素材绑定】" });
  }
  for (const token of unique) if (occurrences.filter((item) => item.token === token).length > 1) errors.push({ code: "ASSET_DUPLICATE_REFERENCE", message: token + " must occur exactly once" });
  if (!bound.length && binding && !/^无外部参考素材[。.]?$/u.test(bindingText)) errors.push({ code: "ASSET_EMPTY_DECLARATION", message: "without references, 【素材绑定】 contains only 无外部参考素材; shared setting facts belong in 【全局约束】" });
  if (bound.length && bindingText.includes("无外部参考素材")) errors.push({ code: "ASSET_EMPTY_CONFLICT", message: "no-reference declaration conflicts with bound assets" });
  if (unique.length > 50) errors.push({ code: "ASSET_LIMIT", message: "unique asset count " + unique.length + " exceeds 50" });
  if (options.preserveAssetNumbering !== true) {
    for (const type of ["image", "video", "audio"]) {
      if (bound.filter((item) => item.type === type).some((item, index) => item.number !== index + 1)) errors.push({ code: "ASSET_NUMBERING", message: "new @" + type + " placeholders start at 1 and are contiguous in appearance order" });
    }
  }
  // Prior tokens are optional evidence. Final text alone cannot establish the
  // former source-to-token mapping; even this evidence checks IDs, not identity.
  if (options.existingAssetTokens !== undefined) {
    const existing = options.existingAssetTokens;
    if (options.preserveAssetNumbering !== true || !Array.isArray(existing)
      || existing.some((item) => typeof item !== "string" || !/^@(image|video|audio)[1-9]\d*$/u.test(item))
      || new Set(existing).size !== existing.length) {
      errors.push({ code: "ASSET_BASELINE", message: "existingAssetTokens requires preserved numbering and a unique canonical token array" });
    } else {
      const retained = bound.filter((item) => existing.includes(item.token)).map((item) => item.token);
      if (JSON.stringify(retained) !== JSON.stringify(existing)) errors.push({ code: "ASSET_EXISTING_ORDER", message: "existing tokens must remain present in original order" });
      for (const type of ["image", "video", "audio"]) {
        const highest = Math.max(0, ...existing.filter((item) => item.startsWith("@" + type)).map((item) => Number(item.slice(type.length + 1))));
        const added = bound.filter((item) => item.type === type && !existing.includes(item.token));
        if (added.some((item, index) => item.number !== highest + index + 1)) errors.push({ code: "ASSET_APPEND_NUMBERING", message: "new @" + type + " tokens continue after the highest existing ID without filling gaps" });
      }
    }
  }
  return { assets: unique.length, assetTokens: unique };
}
function stabilityDeclaration(text, opening, duration) {
  // Presence of an explicit half-second declaration, not a semantic promise.
  const words = opening
    ? /(?:首|开头|前|起幅|开场|开始)[^。；;\n]*?(?:0?\.5\s*(?:秒|s)|半\s*秒)/u
    : /(?:末|最后|收尾|结尾)[^。；;\n]*?(?:0?\.5\s*(?:秒|s)|半\s*秒)/u;
  if (words.test(text)) return true;
  const ranges = /(\d{1,2}:\d{2}(?:\.\d+)?|\d+(?:\.\d+)?)\s*(?:秒|s)?\s*[-–—~～至到]\s*(\d{1,2}:\d{2}(?:\.\d+)?|\d+(?:\.\d+)?)\s*(?:秒|s)?/gu;
  const number = (value) => value.includes(":") ? parseTime(value) : Number(value);
  return [...text.matchAll(ranges)].some((match) => number(match[1]) === (opening ? 0 : duration - 0.5) && number(match[2]) === (opening ? 0.5 : duration));
}
function validateShotBody(body, shot, errors, options) {
  const add = (code, detail) => errors.push({ code, message: "shot " + shot.number + ": " + detail });
  const lex = lexInlineText(body, { speakerNames: options.speakerNames ?? [], expectedDialogue: options.expectedDialogue ?? [] });
  for (const error of lex.errors) add(error.code, error.message);
  if (/^\s*台词\s*[:：]/mu.test(lex.structuralText)) add("LEGACY_DIALOGUE_LINE", "put double-quoted speech inside continuous shot prose, not on a standalone dialogue line");
  if (/[{}]/u.test(lex.structuralText)) add("LEGACY_DIALOGUE_BRACES", "final prompts use inline double quotes rather than dialogue braces");
  if (!body.trim()) add("SHOT_BODY_MISSING", "missing continuous visual prose");
  if (/\n\s*\n/u.test(body)) add("SHOT_PARAGRAPH", "use one prose paragraph, not separate information blocks");
  const prose = lex.structuralText;
  const light = [...prose.matchAll(/光影\s*[:：]/gu)], sound = [...prose.matchAll(/现场声\s*[:：]/gu)];
  if (light.length !== 1) add("SHOT_LIGHT_SENTENCE", "require one 光影： sentence in the prose tail");
  if (sound.length !== 1) add("SHOT_SOUND_SENTENCE", "require one 现场声： sentence after 光影：");
  if (light.length === 1 && sound.length === 1) {
    const a = light[0], b = sound[0];
    if (a.index >= b.index) add("SHOT_TAIL_ORDER", "光影： precedes 现场声：");
    else {
      if (!prose.slice(0, a.index).trim()) add("SHOT_BODY_MISSING", "light and sound labels do not replace the visual event");
      if (!prose.slice(a.index + a[0].length, b.index).replace(/[\s。；;.]/gu, "")) add("SHOT_LIGHT_EMPTY", "光影： has no content");
      if (!prose.slice(b.index + b[0].length).replace(/[\s。；;.]/gu, "")) add("SHOT_SOUND_EMPTY", "现场声： has no content");
    }
  }
  shot.dialogue = lex.dialogue.map(utterance => ({ ...utterance, shot_id: 'S' + shot.number }));
  return prose;
}
export function validatePrompt(input, options = {}) {
  const text = normalize(input), scan = scanPrompt(text, options), errors = [];
  for (const section of scan.sections) {
    if (!PREAMBLE.includes(section.name)) errors.push({ code: LEGACY_HEADING.test(section.name) ? "LEGACY_SECTION" : "UNEXPECTED_SECTION", message: "unsupported heading at line " + section.line + ": 【" + section.name + "】" });
    if (/(?:自检|自查|验收|正向化检查)/u.test(section.name)) errors.push({ code: "SELF_CHECK_HEADING", message: "self-check headings are outside the prompt" });
  }
  for (const name of PREAMBLE) {
    const matches = scan.sections.filter((item) => item.name === name);
    if (!matches.length) errors.push({ code: "SECTION_MISSING", message: "missing 【" + name + "】" });
    if (matches.length > 1) errors.push({ code: "SECTION_DUPLICATE", message: "duplicate 【" + name + "】" });
    if (matches.length === 1 && !scan.body(matches[0])) errors.push({ code: "SECTION_EMPTY", message: "empty 【" + name + "】" });
  }
  const ordered = scan.sections.map((section) => section.name);
  if (JSON.stringify(ordered) !== JSON.stringify(PREAMBLE)
    || scan.sections.some((section) => section.line > (scan.shots[0]?.line ?? Infinity))) errors.push({ code: "SECTION_ORDER", message: "use 风格 → 素材绑定 → 全局约束 → 本段戏剧任务 → 本段情绪总控 → shots; no tail section" });
  if (scan.boundaries[0]?.line !== 1) errors.push({ code: "PROMPT_PREFIX", message: "the prompt begins at 【风格】" });
  if (LEGACY_ROW.test(lexInlineText(text, options).structuralText)) errors.push({ code: "LEGACY_ROW", message: "retired or split technical-field row found" });
  for (const line of scan.malformedShots) errors.push({ code: "SHOT_HEADING_FORMAT", message: "line " + line + ": use 镜头N｜0:00-0:06 without brackets, names, or other fields" });
  if (!scan.shots.length) errors.push({ code: "SHOT_MISSING", message: "at least one numbered shot is required" });
  const prose = [];
  for (const [index, shot] of scan.shots.entries()) {
    if (shot.number !== index + 1) errors.push({ code: "SHOT_NUMBERING", message: "shot numbers start at 1 and remain contiguous" });
    if (shot.start === null || shot.end === null || shot.end <= shot.start) errors.push({ code: "SHOT_TIME_FORMAT", message: "invalid or zero-length shot at line " + shot.line });
    const previous = scan.shots[index - 1];
    if (previous && shot.start !== null && previous.end !== null && Math.abs(shot.start - previous.end) > 1e-9) errors.push({ code: shot.start < previous.end ? "SHOT_TIME_OVERLAP" : "SHOT_TIME_GAP", message: "shot " + shot.number + " must start at the previous endpoint" });
    prose.push(validateShotBody(scan.body(shot), shot, errors, options));
  }
  const duration = scan.shots.at(-1)?.end ?? null;
  if (duration !== null && (duration < 4 || duration > 30)) errors.push({ code: "DURATION_RANGE", message: "duration " + duration + "s is outside 4-30s" });
  if (scan.shots.length && scan.shots[0].start !== 0) errors.push({ code: "SHOT_START", message: "the first shot starts at 0:00" });
  if (duration !== null && prose.length) {
    if (!stabilityDeclaration(prose[0], true, duration)) errors.push({ code: "ENTRY_STABILITY_ZONE", message: "declare the first 0.5s in the first shot prose" });
    if (!stabilityDeclaration(prose.at(-1), false, duration)) errors.push({ code: "EXIT_STABILITY_ZONE", message: "declare the final 0.5s in final-shot prose or sound, not a tail field" });
  }
  const structural = lexInlineText(text, options).structuralText;
  if (/[{}]/u.test(structural)) errors.push({ code: "LEGACY_DIALOGUE_BRACES", message: "dialogue braces are retired in final prompts" });
  for (const section of scan.sections) {
    if (lexInlineText(scan.body(section)).dialogue.length || /^\s*台词\s*[:：]/mu.test(scan.body(section))) errors.push({ code: "DIALOGUE_REFERENCE_LOCATION", message: "spoken dialogue belongs in shot prose" });
  }
  const dialogue = scan.shots.flatMap(shot => shot.dialogue ?? []);
  const dialogueCheck = compareDialogue(dialogue, options.expectedDialogue);
  errors.push(...dialogueCheck.errors);
  const asset = assetContract(text, scan, options, errors);
  return { ok: errors.length === 0, errors, facts: { duration, ...asset, headings: ordered, shots: scan.shots, dialogue, dialogueCheck } };
}
async function main() {
  const args = process.argv.slice(2), json = args.includes("--json"), preserveAssetNumbering = args.includes("--preserve-asset-numbering");
  const positional = args.filter((arg) => !["--json", "--preserve-asset-numbering"].includes(arg));
  if (positional.length > 1 || positional.some((arg) => arg.startsWith("--"))) throw new Error("Usage: node scripts/validate-prompt.mjs [--json] [--preserve-asset-numbering] [prompt-file]");
  let input;
  if (positional.length) input = await readFile(path.resolve(positional[0]), "utf8");
  else {
    const chunks = [];
    for await (const chunk of process.stdin) chunks.push(chunk);
    input = Buffer.concat(chunks).toString("utf8");
  }
  const result = validatePrompt(input, { preserveAssetNumbering });
  if (json) process.stdout.write(JSON.stringify(result, null, 2) + "\n");
  else if (result.ok) process.stdout.write("valid duration=" + result.facts.duration + "s assets=" + result.facts.assets + " shots=" + result.facts.shots.length + " (structure only)\n");
  else process.stderr.write(result.errors.map((error) => error.code + ": " + error.message).join("\n") + "\n");
  if (!result.ok) process.exitCode = 1;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => { process.stderr.write((error.stack ?? error.message) + "\n"); process.exitCode = 1; });
}
