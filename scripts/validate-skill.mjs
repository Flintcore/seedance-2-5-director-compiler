#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_SKILL_ROOT = path.resolve(SCRIPT_DIR, "..");
export const MAX_MASTER_INDEX_BYTES = 30000;

const REQUIRED_FILES = [
  "SKILL.md",
  "README.md",
  "VERSION",
  "agents/openai.yaml",
  "modules/orchestration.md",
  "modules/director-ir.md",
  "modules/knowledge-routing.md",
  "modules/film-rule-scope.md",
  "modules/shot-design.md",
  "modules/micro-performance.md",
  "modules/action-design.md",
  "modules/compiler.md",
  "modules/diagnosis.md",
  "references/cinema/INDEX.md",
  "references/masters/INDEX.md",
  "references/masters/INDEX-类型匹配.md",
  "references/masters/INDEX-反查.md",
  "references/model/INDEX.md",
  "references/model/capability-registry.yaml",
  "references/model/nine-layer-schema.md",
  "references/model/dialogue-binding.md",
  "references/model/continuity.md",
  "references/model/complexity.md",
  "references/model/reference-assets.md",
  "references/model/previs-reference.md",
  "references/model/positive-spatial-constraints.md",
  "schemas/director-ir.yaml",
  "scripts/clean-knowledge.mjs",
  "scripts/refresh-knowledge-manifest.mjs",
  "scripts/validate-prompt.mjs",
  "scripts/validate-skill.mjs",
  "tests/clean-knowledge.test.mjs",
  "tests/knowledge-cleaner.test.mjs",
  "tests/prompt-validator.test.mjs",
  "tests/narrative-guidance.test.mjs",
  "tests/skill-validator.test.mjs",
  "KNOWLEDGE-MANIFEST.yaml",
  "MIGRATION-MANIFEST.yaml",
];

const MASTER_INDEX_NAMES = ["INDEX.md", "INDEX-类型匹配.md", "INDEX-反查.md"];
const CINEMA_PROMPT_TEMPLATE = /(?:技术规格模板|嵌入描述(?:模板|示例)|嵌入格式|(?:格式|标注)示例|嵌入到镜头描述的示例|(?:可)?直接复制.{0,16}(?:提示词|prompt)|提示词模板)/iu;
const CINEMA_BLANKET_NEGATIVE = /(?:\bNOT\s+(?:subtitles|BGM)\b|无\s*BGM\s*(?:铁律|规则)|违反\s+NOT\s+BGM)/iu;
const CINEMA_HARD_QUOTA = /(?:每\s*30\s*秒|每\s*\d+\s*镜|连续\s*\d+\s*镜|每场景\s*[≥≤]|反应镜头\s*[≥≤]|留白比例\s*[≥≤]|信息密度\s*[≥≤]|至少\s*\d+\s*项|必用\s*3\s*招)/iu;
const MASTER_INDEX_CHATTER = /(?:\bPhase\s*\d+(?:\.\d+)*|\bReviewer\b|审查员|\bL[12]\b|multi\s*4\.0|多\s*Agent|输出模板|装配协议|维护状态|版本迁移)/iu;
const MASTER_CONTAMINATION = /(?:Copy-Paste|AI\s*模型直接复用|可复用模板|信息素|reviewer|\bAgent\b|\bSkill\b|\bP[01]\b|\bL[12]\b|Layer\s*2\s*句式|最后更新|维护状态|输出格式|《创作原则》|写\s*prompt|(?<!Porta-)\bprompt\b|\bAIGC\b|生成模型|AI\s*(?:视频|分镜|pipeline)|反\s*AI\s*味|女娲|焕新|蒸馏|v3\.2\.(?:3|6)|≤\s*25\s*字|每场\s*[≥>]|每张卡片必带|长镜头加载铁律|大师指纹本镜体现|风格指纹本镜体现|§一至§九全部内容|每镜必过|\bPASS\b|\bFAIL\b|命中\s*(?:≥|>=|>)\s*\d+\s*项|<\/(?:content|invoke)>|\/root\/\.claude\/skills|r\.jina\.ai|本环境一律\s*403|bot\s*拦截|refresh\/references)/iu;
const MASTER_PERFORMANCE_SCALE = /(?:Deadpan|极致克制|克制|标准(?:偏开|偏大)?|古典戏剧化|戏剧化|大开大合|大开|外放|麻木|躁狂|浓烈|含蓄|喜剧化|冷峻|热烈|鲜活|松弛|庄重写意|释放|癫狂|放飞|内省|爆发)[^，。；;|+\n]{0,24}?(?:(?:≤|≥|<|>)?\s*\d+(?:\.\d+)?|\d+(?:\.\d+)?\s*%?\s*[-–—~至]\s*\d+(?:\.\d+)?)\s*%/iu;
const MASTER_PLATFORM_MUSIC_OVERRIDE = /(?:(?:AIGC|生成模型|AI\s*(?:视频|分镜)|视频生成|镜头设计生成)[^\n]{0,120}(?:BGM|配乐)|(?:BGM|配乐)[^\n]{0,120}(?:AIGC|生成模型|AI\s*(?:视频|分镜)|视频生成|镜头设计生成)|(?:不写|禁)\s*(?:BGM|配乐)|绝不[^\n]{0,16}(?:BGM|配乐)[^\n]{0,16}写|(?:BGM|配乐)\s*(?:禁令|限制)|(?:BGM|配乐)\s*(?:用|由|改用)[^，。；\n]{0,24}(?:替代|代替)|(?:BGM|配乐)[^，。；\n]{0,24}(?:声源|环境声)替代)/iu;
const MASTER_MIGRATED_INSTRUCTION = /(?:镜头表达[^\n]{0,48}(?:禁写|字段|写入|写进|可写|直接|调用|起手句|只堆)|(?:写入|写进|可写进)[^\n]{0,24}镜头表达|镜头设计(?:启示|生成|复用|落地)|镜头设计中[^\n]{0,32}(?:禁写|写入|字段)|画面需呈现[^\n]{0,32}(?:触发|关键词)|生成端\s*look|供\s*AI\s*生成|可直接抄进)/iu;
const MASTER_HARD_GATE = /(?:≥\s*6s\s*必满足|元素\s*\/\s*秒|任意场景[^。；\n]{0,40}默认|每户外镜[^。；\n]{0,24}必带雾|35\s*[-–—]\s*50\s*mm\s*禁区|单镜必须\s*≥|每场[^。；\n]{0,40}(?:固定|必须)[^。；\n]{0,24}(?:mm|秒|镜)|表演[^。；\n]{0,20}固定百分比)/iu;
const MASTER_DANGLING_CLEANUP = /(?:（\s*）|\(\s*\)|[（(]\s*(?:→|↔)\s*[）)]|(?:→|↔)\s*(?:[，。；|)]|$)|表演减到\s*\+|常规戏剧\s*=\s*(?:[，。；]|$)|(?:^|\n)\s*\*\*\s*：)/iu;

async function filesUnder(root, predicate = () => true) {
  let entries;
  try {
    entries = await readdir(root, { withFileTypes: true });
  } catch (error) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }
  const files = [];
  for (const entry of entries) {
    const full = path.join(root, entry.name);
    if (entry.isDirectory()) files.push(...await filesUnder(full, predicate));
    if (entry.isFile() && predicate(full)) files.push(full);
  }
  return files;
}

async function exists(file) {
  try {
    return (await stat(file)).isFile();
  } catch {
    return false;
  }
}

function relative(root, file) {
  return path.relative(root, file).replaceAll("\\", "/");
}

function sha256(content) {
  return createHash("sha256").update(content).digest("hex");
}

function structuralKnowledgeErrors(content) {
  const errors = [];
  if (content.includes("\0")) errors.push("contains a null byte");

  let fence = null;
  let previous = null;
  for (const [index, line] of content.replace(/\r\n?/g, "\n").split("\n").entries()) {
    const marker = /^\s*(`{3,}|~{3,})/.exec(line)?.[1] ?? null;
    if (marker) {
      if (fence === null) fence = { character: marker[0], length: marker.length, line: index + 1 };
      else if (marker[0] === fence.character && marker.length >= fence.length) fence = null;
    }

    const trimmed = line.trim();
    if (trimmed && trimmed === previous && !/^[-|: ]+$/.test(trimmed)) {
      errors.push(`repeats an adjacent content line at ${index + 1}`);
    }
    previous = trimmed || null;
  }
  if (fence) errors.push(`has an unclosed ${fence.character.repeat(fence.length)} fence opened at ${fence.line}`);
  return errors;
}

function normalizedAbsolute(file) {
  return path.resolve(file).toLowerCase();
}

function extractMarkdownTargets(content) {
  const targets = new Set();
  const markdown = /\[[^\]\r\n]+\]\(([^)\r\n]+)\)/g;
  const codePath = /`([^`\r\n]+\.md(?:[?#][^`\r\n]*)?)`/gi;
  let match;
  while ((match = markdown.exec(content))) targets.add(match[1].trim());
  while ((match = codePath.exec(content))) targets.add(match[1].trim());
  return [...targets];
}

function cleanLinkTarget(raw) {
  let target = raw.trim();
  if (target.startsWith("<") && target.endsWith(">")) target = target.slice(1, -1).trim();
  if (!target || target.startsWith("#") || /^[a-z][a-z\d+.-]*:/i.test(target)) return null;
  target = target.split(/[?#]/, 1)[0];
  if (!/\.md$/i.test(target)) return null;
  try {
    return decodeURIComponent(target).replaceAll("/", path.sep);
  } catch {
    return { invalid: raw };
  }
}

async function validateKnowledgeLinks(skillRoot, indexFiles, errors) {
  const resolvedByIndex = new Map();
  for (const indexFile of indexFiles) {
    if (!await exists(indexFile)) continue;
    const content = await readFile(indexFile, "utf8");
    const resolved = new Set();
    for (const rawTarget of extractMarkdownTargets(content)) {
      const target = cleanLinkTarget(rawTarget);
      if (target === null) continue;
      if (typeof target === "object") {
        errors.push({ code: "KNOWLEDGE_LINK_INVALID", message: `${relative(skillRoot, indexFile)} has an invalid encoded link: ${target.invalid}` });
        continue;
      }
      const file = path.resolve(path.dirname(indexFile), target);
      const fromRoot = path.relative(skillRoot, file);
      if (fromRoot.startsWith(`..${path.sep}`) || path.isAbsolute(fromRoot)) {
        errors.push({ code: "KNOWLEDGE_LINK_OUTSIDE", message: `${relative(skillRoot, indexFile)} links outside the skill: ${rawTarget}` });
        continue;
      }
      if (!await exists(file)) {
        errors.push({ code: "KNOWLEDGE_LINK_MISSING", message: `${relative(skillRoot, indexFile)} has an unresolved link: ${rawTarget}` });
        continue;
      }
      resolved.add(normalizedAbsolute(file));
    }
    resolvedByIndex.set(normalizedAbsolute(indexFile), resolved);
  }
  return resolvedByIndex;
}

async function validateKnowledgeManifest(skillRoot, errors) {
  const manifestPath = path.join(skillRoot, "KNOWLEDGE-MANIFEST.yaml");
  if (!await exists(manifestPath)) return { records: 0 };
  const manifest = await readFile(manifestPath, "utf8");
  const pattern = /^  - path: "([^"]+)"\r?\n    bytes: (\d+)\r?\n    sha256: "([0-9a-f]{64})"$/gm;
  const records = [];
  let match;
  while ((match = pattern.exec(manifest))) {
    records.push({ path: match[1], bytes: Number(match[2]), sha256: match[3] });
  }
  if (records.length !== 234) {
    errors.push({ code: "MANIFEST_COUNT", message: `expected 234 manifest records, found ${records.length}` });
  }
  for (const record of records) {
    const file = path.join(skillRoot, ...record.path.split("/"));
    try {
      const content = await readFile(file);
      if (content.byteLength !== record.bytes) {
        errors.push({ code: "MANIFEST_BYTES", message: `${record.path} expected ${record.bytes} bytes, found ${content.byteLength}` });
      }
      const actualHash = sha256(content);
      if (actualHash !== record.sha256) {
        errors.push({ code: "MANIFEST_HASH", message: `${record.path} hash mismatch` });
      }
    } catch {
      errors.push({ code: "MANIFEST_PATH", message: `manifest path is missing: ${record.path}` });
    }
  }
  return { records: records.length };
}

export async function validateSkill(skillRoot = DEFAULT_SKILL_ROOT) {
  const errors = [];
  const cinemaRoot = path.join(skillRoot, "references", "cinema");
  const mastersRoot = path.join(skillRoot, "references", "masters");
  const cinema = (await filesUnder(cinemaRoot, (file) => file.endsWith(".md")))
    .filter((file) => path.basename(file) !== "INDEX.md");
  const masterAll = await filesUnder(mastersRoot, (file) => file.endsWith(".md"));
  const masters = masterAll.filter((file) => path.basename(file) !== "README.md" && !path.basename(file).startsWith("INDEX"));
  const methodologies = masters.filter((file) => path.basename(file).startsWith("_"));
  const works = masters.filter((file) => !path.basename(file).startsWith("_"));
  const masterDirectories = new Set(masters.map((file) => path.dirname(file))).size;

  if (cinema.length !== 50) errors.push({ code: "CINEMA_COUNT", message: `expected 50 cinema files, found ${cinema.length}` });
  if (masters.length !== 184) errors.push({ code: "MASTER_COUNT", message: `expected 184 master content files, found ${masters.length}` });
  if (methodologies.length !== 67) errors.push({ code: "METHODOLOGY_COUNT", message: `expected 67 methodology files, found ${methodologies.length}` });
  if (works.length !== 117) errors.push({ code: "WORK_COUNT", message: `expected 117 work analyses, found ${works.length}` });
  if (masterDirectories !== 67) errors.push({ code: "MASTER_DIRECTORY_COUNT", message: `expected 67 master directories, found ${masterDirectories}` });
  if (await exists(path.join(mastersRoot, "README.md"))) errors.push({ code: "LEGACY_MASTER_README", message: "legacy masters/README.md is still present" });

  for (const item of REQUIRED_FILES) {
    if (!await exists(path.join(skillRoot, item))) errors.push({ code: "REQUIRED_FILE", message: `missing ${item}` });
  }
  const manifest = await validateKnowledgeManifest(skillRoot, errors);

  const contentFiles = [...cinema, ...masters];
  for (const file of contentFiles) {
    const content = await readFile(file, "utf8");
    if (Buffer.byteLength(content) < 500) errors.push({ code: "EMPTY_KNOWLEDGE", message: `${relative(skillRoot, file)} is unexpectedly small` });
    if (content.includes("\uFFFD")) errors.push({ code: "UTF8_REPLACEMENT", message: `${relative(skillRoot, file)} contains a replacement character` });
    for (const issue of structuralKnowledgeErrors(content)) {
      errors.push({ code: "KNOWLEDGE_STRUCTURE", message: `${relative(skillRoot, file)} ${issue}` });
    }
  }

  for (const file of masters) {
    const content = await readFile(file, "utf8");
    const match = MASTER_CONTAMINATION.exec(content);
    if (match) errors.push({ code: "MASTER_CONTAMINATION", message: `${relative(skillRoot, file)} contains ${match[0]}` });
    const performance = MASTER_PERFORMANCE_SCALE.exec(content);
    if (performance) errors.push({ code: "MASTER_PERFORMANCE_SCALE", message: `${relative(skillRoot, file)} contains ${performance[0]}` });
    const musicOverride = MASTER_PLATFORM_MUSIC_OVERRIDE.exec(content);
    if (musicOverride) errors.push({ code: "MASTER_PLATFORM_MUSIC_OVERRIDE", message: `${relative(skillRoot, file)} contains ${musicOverride[0]}` });
    const migratedInstruction = MASTER_MIGRATED_INSTRUCTION.exec(content);
    if (migratedInstruction) errors.push({ code: "MASTER_MIGRATED_INSTRUCTION", message: `${relative(skillRoot, file)} contains ${migratedInstruction[0]}` });
    const hardGate = MASTER_HARD_GATE.exec(content);
    if (hardGate) errors.push({ code: "MASTER_HARD_GATE", message: `${relative(skillRoot, file)} contains ${hardGate[0]}` });
    const dangling = MASTER_DANGLING_CLEANUP.exec(content);
    if (dangling) errors.push({ code: "MASTER_DANGLING_CLEANUP", message: `${relative(skillRoot, file)} contains ${dangling[0]}` });
  }

  const cinemaBanned = /(?:\bPhase\b|\bReviewer\b|\bP[012]\b|\bL[12]\b|Seedance\s*2\.0|正向化检查|输出格式|强制输出格式|所在版本编译层|\bLayer\s*[12]\b|多\s*agent\s*线|单体时代|落地格式|两层架构|双层架构|可抄短语|\bAIGC\b|AI\s*模型|AI\s*视频|视频模型|目标模型|给模型|\bLLM\b|anti[-\s]*AI|反\s*AI|\bAI\s*slop\b|生成影像|编译域|Style Lock|\bAgent\b|标注使用声明|画面描述必含|\bS\s*级|\bB\s*级|自动模式|协同模式|编排器)/iu;
  for (const file of cinema) {
    const content = await readFile(file, "utf8");
    const templateMatch = CINEMA_PROMPT_TEMPLATE.exec(content);
    if (templateMatch) errors.push({ code: "CINEMA_PROMPT_TEMPLATE", message: `${relative(skillRoot, file)} contains ${templateMatch[0]}` });
    const negativeMatch = CINEMA_BLANKET_NEGATIVE.exec(content);
    if (negativeMatch) errors.push({ code: "CINEMA_BLANKET_NEGATIVE", message: `${relative(skillRoot, file)} contains ${negativeMatch[0]}` });
    const quotaMatch = CINEMA_HARD_QUOTA.exec(content);
    if (quotaMatch) errors.push({ code: "CINEMA_HARD_QUOTA", message: `${relative(skillRoot, file)} contains ${quotaMatch[0]}` });
    const match = cinemaBanned.exec(content);
    if (match) errors.push({ code: "CINEMA_CONTAMINATION", message: `${relative(skillRoot, file)} contains ${match[0]}` });
  }

  const cinemaIndex = path.join(cinemaRoot, "INDEX.md");
  const masterIndexes = MASTER_INDEX_NAMES.map((name) => path.join(mastersRoot, name));
  for (const file of masterIndexes) {
    if (!await exists(file)) continue;
    const content = await readFile(file, "utf8");
    const bytes = Buffer.byteLength(content);
    if (bytes > MAX_MASTER_INDEX_BYTES) {
      errors.push({ code: "MASTER_INDEX_OVERSIZE", message: `${relative(skillRoot, file)} is ${bytes} bytes; maximum is ${MAX_MASTER_INDEX_BYTES}` });
    }
    const chatter = MASTER_INDEX_CHATTER.exec(content);
    if (chatter) errors.push({ code: "MASTER_INDEX_CHATTER", message: `${relative(skillRoot, file)} contains ${chatter[0]}` });
  }

  const links = await validateKnowledgeLinks(skillRoot, [cinemaIndex, ...masterIndexes], errors);
  const cinemaIndexLinks = links.get(normalizedAbsolute(cinemaIndex)) ?? new Set();
  for (const file of cinema) {
    if (!cinemaIndexLinks.has(normalizedAbsolute(file))) {
      errors.push({ code: "CINEMA_INDEX_COVERAGE", message: `cinema index does not link ${relative(skillRoot, file)}` });
    }
  }
  const masterMain = path.join(mastersRoot, "INDEX.md");
  const masterIndexLinks = links.get(normalizedAbsolute(masterMain)) ?? new Set();
  for (const file of masters) {
    if (!masterIndexLinks.has(normalizedAbsolute(file))) {
      errors.push({ code: "MASTER_INDEX_COVERAGE", message: `master index does not link ${relative(skillRoot, file)}` });
    }
  }

  const forbiddenPaths = [
    "modules/bundles",
    "bundles",
    "core-credos",
    "assembly-protocol",
    "gold-samples",
    "baseline",
    "memory",
    ".seedance-memory",
  ];
  for (const item of forbiddenPaths) {
    try {
      await stat(path.join(skillRoot, item));
      errors.push({ code: "FORBIDDEN_PATH", message: `legacy runtime dependency exists: ${item}` });
    } catch {
      // Expected: the legacy path is absent.
    }
  }

  const runtimeRoots = ["SKILL.md", "modules", "references/model"];
  const runtimeFiles = [];
  for (const item of runtimeRoots) {
    const full = path.join(skillRoot, item);
    try {
      const info = await stat(full);
      if (info.isFile()) runtimeFiles.push(full);
      if (info.isDirectory()) runtimeFiles.push(...await filesUnder(full, (file) => /\.(?:md|ya?ml|json)$/i.test(file)));
    } catch {
      // Optional runtime directories may be under construction.
    }
  }
  const dependencyPattern = /(?:modules\/bundles|bundle-ring|assembly-protocol|gold-samples|core-credos|agent[56]\.md|\.seedance-memory)/i;
  for (const file of runtimeFiles) {
    const content = (await readFile(file, "utf8")).replaceAll("\\", "/");
    const match = dependencyPattern.exec(content);
    if (match) errors.push({ code: "FORBIDDEN_DEPENDENCY", message: `${relative(skillRoot, file)} references ${match[0]}` });
  }

  return {
    ok: errors.length === 0,
    errors,
    facts: {
      cinemaFiles: cinema.length,
      masterContentFiles: masters.length,
      masterMethodologyFiles: methodologies.length,
      masterWorkFiles: works.length,
      masterDirectories,
      manifestRecords: manifest.records,
    },
  };
}

async function main() {
  const args = process.argv.slice(2);
  const json = args.includes("--json");
  const rootIndex = args.indexOf("--root");
  const root = rootIndex === -1 ? DEFAULT_SKILL_ROOT : path.resolve(args[rootIndex + 1]);
  const result = await validateSkill(root);
  if (json) process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  else if (result.ok) process.stdout.write(`valid cinema=${result.facts.cinemaFiles} masters=${result.facts.masterContentFiles} directories=${result.facts.masterDirectories}\n`);
  else process.stderr.write(`${result.errors.map((error) => `${error.code}: ${error.message}`).join("\n")}\n`);
  if (!result.ok) process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(`${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  });
}
