#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_SKILL_ROOT = path.resolve(SCRIPT_DIR, "..");
const SOURCE_SKILL_ROOT = "C:/Users/ASUS/.codex/skills/seedance-agent-2-5";
const SOURCE_COMMIT = "2282bbcf1fe7e42f6e6fb2e1ad4666b77dd87bf5";
const ACTION_FUSION_SKILL_ROOT = "C:/Users/ASUS/.codex/skills/seedance-2-5-prompt-optimizer-action-fusion";
const ACTION_FUSION_EVIDENCE = [
  {
    path: "SKILL.md",
    sha256: "261304C7FDE3D684C5E912DCE00D132AC20CD78A495F97ECFD05B37428AE1C1D",
  },
  {
    path: "references/03_九层提示词模板.md",
    sha256: "0E25D895A7D1E71D99BD9DD9E8A9A2EFCB1E5083A919A9701D0E112C86BA3BC4",
  },
  {
    path: "references/10_动作场景与打戏母机.md",
    sha256: "C16907960917F586304DB51953221906B048742BAF72BBE3DD09AAACEB2548BB",
  },
];

const LEGACY_PROMPT_BLOCK_MARKER = /^\s*\*\*(?:技术规格模板|嵌入描述模板|嵌入描述示例|嵌入格式|格式示例|标注示例)(?:[（(][^）)\n]+[）)])?\*\*\s*[：:]?\s*$/;

function normalizeText(text) {
  return text.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
}

function fenceOpening(line) {
  const match = /^\s*(`{3,}|~{3,})/.exec(line);
  return match ? { character: match[1][0], length: match[1].length } : null;
}

function stripLegacyPromptBlocks(lines) {
  const output = [];
  let blocksRemoved = 0;
  let linesRemoved = 0;

  for (let index = 0; index < lines.length;) {
    if (!LEGACY_PROMPT_BLOCK_MARKER.test(lines[index])) {
      output.push(lines[index]);
      index += 1;
      continue;
    }

    let openingIndex = index + 1;
    while (openingIndex < lines.length && lines[openingIndex].trim() === "") openingIndex += 1;
    const opening = openingIndex < lines.length ? fenceOpening(lines[openingIndex]) : null;
    if (!opening) {
      output.push(lines[index]);
      index += 1;
      continue;
    }

    const closingPattern = new RegExp(`^\\s*${opening.character}{${opening.length},}\\s*$`);
    let closingIndex = openingIndex + 1;
    while (closingIndex < lines.length && !closingPattern.test(lines[closingIndex])) closingIndex += 1;
    if (closingIndex >= lines.length) {
      output.push(lines[index]);
      index += 1;
      continue;
    }

    blocksRemoved += 1;
    linesRemoved += closingIndex - index + 1;
    index = closingIndex + 1;
  }

  return { lines: output, blocksRemoved, linesRemoved };
}

function headingOf(line, inFence = false) {
  if (inFence) return null;
  const match = /^(#{1,6})\s+(.+?)\s*$/.exec(line);
  return match ? { level: match[1].length, text: match[2], raw: line } : null;
}

function transformSections(lines, decide) {
  const output = [];
  const stats = { sectionsRemoved: 0, sectionsReplaced: 0, headingsRenamed: 0 };
  let inFence = false;

  for (let index = 0; index < lines.length;) {
    const line = lines[index];
    if (/^\s*```/.test(line)) inFence = !inFence;
    const heading = headingOf(line, inFence);
    const action = heading ? decide(heading) : null;

    if (!action) {
      output.push(line);
      index += 1;
      continue;
    }

    if (action.type === "rename") {
      output.push(`${"#".repeat(heading.level)} ${action.text}`);
      stats.headingsRenamed += 1;
      index += 1;
      continue;
    }

    if (action.type === "remove" || action.type === "replace") {
      if (action.type === "remove") stats.sectionsRemoved += 1;
      if (action.type === "replace") {
        output.push(...action.lines);
        stats.sectionsReplaced += 1;
      }

      const removedLevel = heading.level;
      index += 1;
      let skippedFence = false;
      while (index < lines.length) {
        const candidate = lines[index];
        if (/^\s*```/.test(candidate)) skippedFence = !skippedFence;
        const nextHeading = headingOf(candidate, skippedFence);
        if (nextHeading && nextHeading.level <= removedLevel) break;
        index += 1;
      }
      inFence = false;
      continue;
    }

    throw new Error(`Unknown section action: ${action.type}`);
  }

  return { lines: output, stats };
}

function finishText(lines) {
  const compact = [];
  let blankCount = 0;
  for (const line of lines) {
    const clean = line.replace(/[ \t]+$/g, "");
    if (clean === "") {
      blankCount += 1;
      if (blankCount <= 2) compact.push(clean);
    } else {
      blankCount = 0;
      compact.push(clean);
    }
  }
  while (compact.at(-1) === "") compact.pop();
  return `${compact.join("\n")}\n`;
}

function masterHeadingAction(heading) {
  const text = heading.text;

  if (/^四、\s*信条对应与适用边界$/.test(text)) {
    return { type: "rename", text: "四、设计维度与适用边界" };
  }

  if (heading.level <= 3 && /(?:可复用.*模板|句式模板|Copy-Paste|AI\s*模型直接复用|落地(?:英文)?句式)/i.test(text)) {
    return { type: "remove" };
  }

  if (heading.level === 2 && /^(?:六|八)、.*(?:信条|创作原则)/.test(text)) {
    return { type: "remove" };
  }

  return null;
}

function sanitizeMasterLine(line) {
  if (/(?:信息素|可复用模板)/.test(line)) return null;
  if (/(?:最后更新|维护状态)/.test(line)) return null;
  if (/创作原则编号\s*\/\s*名称/.test(line)) return null;
  if (/reviewer|实读校验/i.test(line)) return null;
  if (/^\s*>.*(?:AI\s*模型直接复用|Copy-Paste)/i.test(line)) return null;

  let clean = line
    .replace(/从�STEP密切突转长镜/g, "剪辑从骤密突转长镜")
    .replace(/\/Layer\s*2句式/gi, "")
    .replace(/\/Layer2句式/gi, "")
    .replace(/Layer1\s*\(/g, "前景层(")
    .replace(/Layer2\s*\(/g, "后景层(")
    .replace(/\bLayer\s*1\b/gi, "前景层")
    .replace(/\bLayer\s*2\b/gi, "镜头表达")
    .replace(/\bL1\b/g, "设计意图")
    .replace(/\bL2\b/g, "镜头表达")
    .replace(/\bP0\b/g, "严重问题")
    .replace(/\bP1\b/g, "待复核项")
    .replace(/\bLLM\b/gi, "索引")
    .replace(/Seedance(?:\s*2(?:\.0|\.5)?)?/gi, "生成模型")
    .replace(/提示词/g, "镜头描述")
    .replace(/信条/g, "创作原则")
    .replace(/自检/g, "设计判断")
    .replace(/自查/g, "诊断")
    .replace(/验收/g, "判断")
    .replace(/checklist/gi, "要点");

  if (/(?:直接复制|可直接喂视频生成|镜头表达句式)/.test(clean)) return null;
  return clean;
}

export function cleanMasterText(input) {
  const beforeLines = normalizeText(input).split("\n");
  const blockResult = stripLegacyPromptBlocks(beforeLines);
  const sectionResult = transformSections(blockResult.lines, masterHeadingAction);
  const output = [];
  let linesRemoved = blockResult.linesRemoved;
  for (const line of sectionResult.lines) {
    const clean = sanitizeMasterLine(line);
    if (clean === null) {
      linesRemoved += 1;
    } else {
      output.push(clean);
    }
  }
  return {
    text: finishText(output),
    stats: {
      ...sectionResult.stats,
      legacyPromptBlocksRemoved: blockResult.blocksRemoved,
      linesRemoved,
    },
  };
}

const CINEMA_DROP_HEADING = /(?:强制输出格式|输出格式(?:完整)?(?:示例)?|完整机位描述模板|输出标注规范|输出格式扩展|嵌入格式(?:示例)?|嵌入写法|嵌入到镜头描述的示例|强制创作思路标注格式|写进\s*L2|现成可套参数模板|与\s*提示词层|与\s*Phase|与现有信条\/Phase|Phase\s*\/\s*信条\s*\/\s*Reviewer|与信条\/审查|生成后执行)/i;

const INFO_DENSITY_REPLACEMENTS = new Map([
  ["〇·五", [
    "## 〇·五 两条等价的叙事信息交付路径",
    "",
    "叙事信息既可通过切点逐步注入，也可在长镜头内部依靠运镜揭示、移焦、调度入画、内部运动和声场变化连续交付。选择依据是戏剧意图、空间可读性和情绪持续性，而不是为了满足固定镜数或密度配额。",
    "",
    "长镜头成立的关键是镜内关系持续变化；静止镜头也可依靠表演、构图压力和环境运动保持有效。",
    "",
    "---",
  ]],
  ["四", [
    "## 四、叙事信息密度曲线",
    "",
    "信息密度应随建立、发展、转折、高潮与释放形成有呼吸的起伏。判断标准是每次变化是否推进观众正在追随的目标、威胁、关系或谜题，不使用固定的每秒元素数作为硬门槛。",
    "",
    "---",
  ]],
  ["七", [
    "## 七、叙事信息原则",
    "",
    "1. 新信息服务当前戏剧问题，而不是为了画面热闹而凑数。",
    "2. 切点注入和镜内揭示都是有效路径，按场景选择。",
    "3. 视听避免机械重复，让画面、声音和台词承担不同信息。",
    "4. 延迟揭示只在能增强悬念、关系或转折时使用。",
    "5. 密度需要起伏，允许为情绪余韵保留空间。",
  ]],
]);

function cinemaHeadingAction(fileName, heading) {
  const text = heading.text;

  if (fileName === "信息素控制参考库.md") {
    if (heading.level === 2 && /^〇·五\s+信息素的两条/.test(text)) {
      return { type: "replace", lines: INFO_DENSITY_REPLACEMENTS.get("〇·五") };
    }
    if (heading.level === 2 && /^四、信息密度曲线/.test(text)) {
      return { type: "replace", lines: INFO_DENSITY_REPLACEMENTS.get("四") };
    }
    if (heading.level === 2 && /^七、核心原则总结/.test(text)) {
      return { type: "replace", lines: INFO_DENSITY_REPLACEMENTS.get("七") };
    }
    if (heading.level === 2 && /^(?:五、协同模式建议|六、嵌入格式)/.test(text)) {
      return { type: "remove" };
    }
    if (heading.level === 3 && /^强制规则/.test(text)) {
      return { type: "remove" };
    }
    if (heading.level === 2 && /^一、信息锚点系统/.test(text)) {
      return { type: "rename", text: "一、叙事信息锚点系统" };
    }
    if (heading.level === 2 && /^三、延迟揭示（/.test(text)) {
      return { type: "rename", text: "三、延迟揭示" };
    }
  }

  if (CINEMA_DROP_HEADING.test(text)) return { type: "remove" };

  if (fileName === "切镜时机学.md" && heading.level === 2 && /^6\.\s*与现有规则的衔接/.test(text)) {
    return { type: "remove" };
  }
  if (fileName === "创意镜头与记忆点设计库.md" && heading.level === 2 && /^八、创意克制治理/.test(text)) {
    return { type: "remove" };
  }
  if (fileName === "表演分寸场景映射库.md" && heading.level === 2 && /^七、与现有信条/.test(text)) {
    return { type: "remove" };
  }
  if (fileName === "类型片镜头语法库.md" && heading.level === 2 && /Reviewer/i.test(text)) {
    return { type: "remove" };
  }
  if (fileName === "声音与音效叙事决策库.md" && heading.level === 2 && /^六、落地写法/.test(text)) {
    return { type: "remove" };
  }

  const renamed = text
    .replace(/导演的["“]自检三问["”]/g, "导演的决策三问")
    .replace(/（自检）/g, "")
    .replace(/自检清单/g, "设计风险与修正")
    .replace(/自查清单/g, "风险与修正")
    .replace(/先自查/g, "先诊断");
  if (renamed !== text) return { type: "rename", text: renamed };

  return null;
}

function sanitizeCinemaLine(line, fileName) {
  if (/两层架构声明.*输出格式/.test(line)) return null;
  if (/^\s*(?:agent|defaults|linked_credos|linked_phases)\s*:/i.test(line)) return null;
  if (/SKILL\.md.*(?:信条|装配|设计阶段)/i.test(line)) return null;
  if (/^\s*>.*(?:Style Lock|\[大师锚\]|\[叙述\]|\[运镜\]).*$/i.test(line)) return null;
  if (/^\s*>?.*(?:两层架构|双层架构).*(?:Layer\s*[12]|单体时代|所在版本编译层|输出区)/i.test(line)) return null;
  if (/^\s*>?\s*(?:🔴+\s*)?(?:落地格式|落地验收方式|以上各项写进哪个字段)[^。\n]*(?:所在版本编译层|编译层)[。\s]*$/i.test(line)) return null;
  let clean = line
    .replace(/边��呈/g, "边缘呈")
    .replace(/信息素/g, "叙事信息")
    .replace(/[（(][^）)\n]*(?:所在版本编译层|Layer\s*[12]|多\s*agent\s*线|单体时代|两层架构|双层架构)[^）)\n]*[）)]/gi, "")
    .replace(/(?:[。；]\s*)?(?:【)?(?:可抄短语|可直接复制)(?:】)?\s*[:：].*$/iu, "")
    .replace(/\s*\bAI\s*slop\b\s*/gi, "套路化画面")
    .replace(/\s*anti[-\s]*AI\s*/gi, "避免合成感")
    .replace(/\s*反\s*AI\s*/g, "避免合成感")
    .replace(/AIGC\s*视频模型/gi, "生成影像")
    .replace(/AI\s*视频模型/gi, "生成影像")
    .replace(/AI\s*模型/gi, "生成影像")
    .replace(/\bAIGC\b/gi, "生成影像")
    .replace(/\s*\bLLM\b\s*/gi, "设计者")
    .replace(/生成影像对物理交互的五大默认失真倾向/g, "物理交互的五类常见失真")
    .replace(/生成影像视线常见\s*Bug/gi, "常见视线失真")
    .replace(/生成影像需要精确的方向数据/g, "视线设计需要可观察的方向与落点")
    .replace(/生成影像只读["“]画面位置语言["”]/g, "连续设计依赖可观察的画面位置")
    .replace(/生成影像无法执行焦点变化时序/g, "焦点变化缺少可读的时序因果")
    .replace(/否则\s*生成影像逐镜独立生成，匹配会丢/g, "让匹配关系在前后镜中均可见")
    .replace(/生成影像产生明显的视觉\s*bug/gi, "画面会失去可信的物理因果")
    .replace(/生成影像/g, "镜头设计")
    .replace(/\bAgent\b/gi, "导演")
    .replace(/\bLayer\s*1\b/gi, "设计意图")
    .replace(/\bLayer\s*2\b/gi, "镜头表达")
    .replace(/两层架构|双层架构/g, "设计与表达分层")
    .replace(/单体时代/g, "旧版")
    .replace(/2\.5\s*多\s*agent\s*线/gi, "当前流程")
    .replace(/2\.5\s*线/g, "当前流程")
    .replace(/所在版本编译层/g, "编译域")
    .replace(/由编译域处理/g, "不在本库规定")
    .replace(/见编译域(?:的[^。；\n]*)?/g, "")
    .replace(/编译域/g, "其他模块")
    .replace(/落地格式/g, "表达方式")
    .replace(/\bPhase\b/gi, "设计阶段")
    .replace(/\bReviewer\b/gi, "审阅")
    .replace(/\bP0\b/g, "严重问题")
    .replace(/\bP1\b/g, "次要问题")
    .replace(/\bL1\b/g, "锁定设计")
    .replace(/\bL2\b/g, "画面表达")
    .replace(/Seedance(?:\s*2(?:\.0|\.5)?)?/gi, "当前项目")
    .replace(/提示词层/g, "编译层")
    .replace(/提示词/g, "镜头描述")
    .replace(/铁律/g, "原则")
    .replace(/强制查询/g, "决策入口")
    .replace(/强制流程/g, "决策路径")
    .replace(/强制要求/g, "关键要求")
    .replace(/强制载入/g, "优先参考")
    .replace(/审查查项/g, "判断要点")
    .replace(/审查时/g, "判断时")
    .replace(/审查/g, "判断")
    .replace(/验收/g, "判断")
    .replace(/必填清单/g, "分析清单")
    .replace(/生成前必填/g, "设计辅助")
    .replace(/自检/g, "设计判断")
    .replace(/自查/g, "诊断")
    .replace(/违反\s*(?:NOT\s+BGM|无\s*BGM)\s*(?:铁律|原则)\s*[；;，,:：]?/gi, "音乐选择应服从项目策略；")
    .replace(/无\s*BGM\s*(?:铁律|原则)/gi, "音乐选择应服从项目策略")
    .replace(/\s*\+\s*NOT\s+subtitles\b/gi, "")
    .replace(/\s*\+\s*NOT\s+BGM\b/gi, "")
    .replace(/\bNOT\s+subtitles\b/gi, "")
    .replace(/\bNOT\s+BGM\b/gi, "")
    .replace(/；{2,}/g, "；")
    .replace(/（\s*）|\(\s*\)/g, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([，。；：])/g, "$1")
    .replace(/[ \t]+$/g, "");

  if (fileName === "文戏编排参考库.md") {
    clean = clean
      .replace(/极致克制\s*≤\s*30%/g, "极致克制")
      .replace(/克制\s*30\s*[-–—]\s*50%/g, "克制")
      .replace(/古典戏剧化\s*50\s*[-–—]\s*70%/g, "古典戏剧化")
      .replace(/大开大合\s*70\s*[-–—]\s*95%/g, "大开大合")
      .replace(/Deadpan\s*10\s*[-–—]\s*30%/gi, "Deadpan");
  }

  if (/(?:5000\s*字符|≤\s*5000\s*字|5K\s*字符)/i.test(clean)) return null;
  return clean;
}

export function cleanCinemaText(input, fileName = "fixture.md") {
  const beforeLines = normalizeText(input).split("\n");
  const blockResult = stripLegacyPromptBlocks(beforeLines);
  const sectionResult = transformSections(blockResult.lines, (heading) => cinemaHeadingAction(fileName, heading));
  const output = [];
  let linesRemoved = blockResult.linesRemoved;
  for (const line of sectionResult.lines) {
    const clean = sanitizeCinemaLine(line, fileName);
    if (clean === null) {
      linesRemoved += 1;
    } else {
      output.push(clean);
    }
  }
  return {
    text: finishText(output),
    stats: {
      ...sectionResult.stats,
      legacyPromptBlocksRemoved: blockResult.blocksRemoved,
      linesRemoved,
    },
  };
}

async function listMarkdownFiles(root) {
  const entries = await readdir(root, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(root, entry.name);
    if (entry.isDirectory()) files.push(...await listMarkdownFiles(full));
    if (entry.isFile() && entry.name.endsWith(".md")) files.push(full);
  }
  return files.sort((a, b) => a.localeCompare(b, "zh-CN"));
}

function isMasterContent(file) {
  const name = path.basename(file);
  return name !== "README.md" && !name.startsWith("INDEX");
}

function mergeStats(target, addition) {
  for (const [key, value] of Object.entries(addition)) {
    target[key] = (target[key] ?? 0) + value;
  }
}

function sha256(text) {
  return createHash("sha256").update(text).digest("hex");
}

function aggregateHash(records) {
  const hash = createHash("sha256");
  for (const record of [...records].sort((a, b) => a.path.localeCompare(b.path, "en"))) {
    hash.update(`${record.path}\0${record.sha256}\n`);
  }
  return hash.digest("hex");
}

function yaml(value) {
  return JSON.stringify(String(value));
}

function sourcePathFor(sourceRoot, relativePath) {
  const sourceRelative = relativePath.startsWith("references/cinema/")
    ? relativePath.replace(/^references\/cinema\//, "references/")
    : relativePath;
  return path.join(sourceRoot, ...sourceRelative.split("/"));
}

async function sourceAggregate(sourceRoot, relativePaths) {
  const records = [];
  let bytes = 0;
  for (const relativePath of relativePaths) {
    const sourcePath = sourcePathFor(sourceRoot, relativePath);
    try {
      const content = await readFile(sourcePath);
      bytes += content.byteLength;
      records.push({ path: relativePath, sha256: sha256(content) });
    } catch {
      // A missing original is recorded by the lower source count in the manifest.
    }
  }
  return { count: records.length, bytes, sha256: aggregateHash(records) };
}

async function analyzeSourceSanitation(records) {
  const result = {
    cinema: { files: 0, changedFiles: 0, bytesBefore: 0, bytesAfter: 0 },
    masters: { files: 0, changedFiles: 0, bytesBefore: 0, bytesAfter: 0 },
  };
  for (const record of records) {
    const sourcePath = sourcePathFor(SOURCE_SKILL_ROOT, record.path);
    const original = await readFile(sourcePath, "utf8");
    const isCinema = record.path.startsWith("references/cinema/");
    const cleaned = isCinema
      ? cleanCinemaText(original, path.basename(sourcePath))
      : cleanMasterText(original);
    const bucket = isCinema ? result.cinema : result.masters;
    bucket.files += 1;
    bucket.bytesBefore += Buffer.byteLength(original);
    bucket.bytesAfter += Buffer.byteLength(cleaned.text);
    if (original !== cleaned.text) bucket.changedFiles += 1;
    mergeStats(bucket, cleaned.stats);
  }
  return result;
}

async function writeManifests(skillRoot, report, records) {
  const now = new Date().toISOString();
  const relativePaths = records.map((record) => record.path);
  const source = await sourceAggregate(SOURCE_SKILL_ROOT, relativePaths);
  const sanitation = await analyzeSourceSanitation(records);
  const knowledgeLines = [
    "schema_version: 1",
    `generated_at: ${yaml(now)}`,
    `skill: ${yaml("seedance-2-5-director-compiler")}`,
    "inventory:",
    `  cinema_content_files: ${report.cinema.files}`,
    `  master_methodology_files: ${report.masters.methodologyFiles}`,
    `  master_work_analysis_files: ${report.masters.workFiles}`,
    `  master_content_files: ${report.masters.files}`,
    `  master_directories: ${report.masters.directories}`,
    `  aggregate_sha256: ${yaml(aggregateHash(records))}`,
    "files:",
  ];
  for (const record of records) {
    knowledgeLines.push(`  - path: ${yaml(record.path)}`);
    knowledgeLines.push(`    bytes: ${record.bytes}`);
    knowledgeLines.push(`    sha256: ${yaml(record.sha256)}`);
  }

  const migrationLines = [
    "schema_version: 1",
    `generated_at: ${yaml(now)}`,
    "source:",
    `  skill: ${yaml("seedance-agent-2-5")}`,
    `  local_path: ${yaml(SOURCE_SKILL_ROOT)}`,
    `  git_commit: ${yaml(SOURCE_COMMIT)}`,
    `  matched_content_files: ${source.count}`,
    `  matched_content_bytes: ${source.bytes}`,
    `  aggregate_sha256: ${yaml(source.sha256)}`,
    "action_fusion_source:",
    `  skill: ${yaml("seedance-2-5-prompt-optimizer-action-fusion")}`,
    `  local_path: ${yaml(ACTION_FUSION_SKILL_ROOT)}`,
    "  evidence:",
    ...ACTION_FUSION_EVIDENCE.flatMap((artifact) => [
      `    - path: ${yaml(artifact.path)}`,
      `      sha256: ${yaml(artifact.sha256)}`,
    ]),
    "target:",
    `  skill: ${yaml("seedance-2-5-director-compiler")}`,
    `  content_files: ${records.length}`,
    `  content_bytes: ${records.reduce((sum, item) => sum + item.bytes, 0)}`,
    `  aggregate_sha256: ${yaml(aggregateHash(records))}`,
    "retained:",
    `  cinema_knowledge_files: ${report.cinema.files}`,
    `  master_methodology_files: ${report.masters.methodologyFiles}`,
    `  master_work_analysis_files: ${report.masters.workFiles}`,
    "confirmed_platform_contract:",
    "  authority: user_confirmed_L1",
    "  segment_duration_seconds:",
    "    minimum: 4",
    "    maximum: 30",
    "  maximum_total_reference_assets: 50",
    "  stability_zone_seconds:",
    "    opening: 0.5",
    "    closing: 0.5",
    `  dialogue_syntax: ${yaml("角色ID说{逐字台词}")}`,
    `  narration_syntax: ${yaml("旁白{逐字旁白}")}`,
    "sanitation:",
    `  changed_cinema_files: ${sanitation.cinema.changedFiles}`,
    `  changed_master_files: ${sanitation.masters.changedFiles}`,
    `  sections_removed: ${sanitation.cinema.sectionsRemoved + sanitation.masters.sectionsRemoved}`,
    `  sections_replaced: ${sanitation.cinema.sectionsReplaced + sanitation.masters.sectionsReplaced}`,
    `  headings_renamed: ${sanitation.cinema.headingsRenamed + sanitation.masters.headingsRenamed}`,
    `  individual_lines_removed: ${sanitation.cinema.linesRemoved + sanitation.masters.linesRemoved}`,
    `  bytes_before: ${sanitation.cinema.bytesBefore + sanitation.masters.bytesBefore}`,
    `  bytes_after: ${sanitation.cinema.bytesAfter + sanitation.masters.bytesAfter}`,
    "  policy:",
    `    - ${yaml("Retain cinematography, blocking, performance, editing, sound, action aesthetics, sources, and master-work analysis.")}`,
    `    - ${yaml("Remove legacy prompt templates, creed mappings, reviewer gates, self-check output, maintenance chatter, and hard output quotas.")}`,
    `    - ${yaml("Keep platform syntax and capability evidence outside the cinema and masters corpora.")}`,
    "excluded_runtime_mechanisms:",
    "  - legacy_multi_agent_role_spawning",
    "  - legacy_two_layer_prompt_assembly",
    "  - legacy_2_0_output_templates",
    "  - project_state_ledgers_and_automatic_writes",
    "  - delivery_bundle_and_log_generation",
    "  - reviewer_score_and_self_check_loops",
    "excluded_source_files:",
    `  - ${yaml("references/内容安全参考库.md")}`,
    `  - ${yaml("references/提示词防污染案例库.md")}`,
    `  - ${yaml("references/masters/README.md")}`,
  ];

  await writeFile(path.join(skillRoot, "KNOWLEDGE-MANIFEST.yaml"), `${knowledgeLines.join("\n")}\n`, "utf8");
  await writeFile(path.join(skillRoot, "MIGRATION-MANIFEST.yaml"), `${migrationLines.join("\n")}\n`, "utf8");
}

export async function cleanKnowledge({ skillRoot = DEFAULT_SKILL_ROOT, write = false, manifests = false } = {}) {
  const cinemaRoot = path.join(skillRoot, "references", "cinema");
  const mastersRoot = path.join(skillRoot, "references", "masters");
  const cinemaFiles = (await listMarkdownFiles(cinemaRoot)).filter((file) => path.basename(file) !== "INDEX.md");
  const allMasterFiles = await listMarkdownFiles(mastersRoot);
  const masterFiles = allMasterFiles.filter(isMasterContent);
  const masterDirectories = new Set(masterFiles.map((file) => path.dirname(file))).size;

  const report = {
    write,
    cinema: { files: cinemaFiles.length, changedFiles: 0, bytesBefore: 0, bytesAfter: 0 },
    masters: {
      files: masterFiles.length,
      directories: masterDirectories,
      methodologyFiles: masterFiles.filter((file) => path.basename(file).startsWith("_")).length,
      workFiles: masterFiles.filter((file) => !path.basename(file).startsWith("_")).length,
      changedFiles: 0,
      bytesBefore: 0,
      bytesAfter: 0,
    },
    removedMasterReadme: false,
  };
  const records = [];

  for (const file of cinemaFiles) {
    const original = await readFile(file, "utf8");
    const cleaned = cleanCinemaText(original, path.basename(file));
    const changed = original !== cleaned.text;
    report.cinema.bytesBefore += Buffer.byteLength(original);
    report.cinema.bytesAfter += Buffer.byteLength(cleaned.text);
    if (changed) report.cinema.changedFiles += 1;
    mergeStats(report.cinema, cleaned.stats);
    if (write && changed) await writeFile(file, cleaned.text, "utf8");
    const relative = path.relative(skillRoot, file).replaceAll("\\", "/");
    records.push({ path: relative, bytes: Buffer.byteLength(cleaned.text), sha256: sha256(cleaned.text) });
  }

  for (const file of masterFiles) {
    const original = await readFile(file, "utf8");
    const cleaned = cleanMasterText(original);
    const changed = original !== cleaned.text;
    report.masters.bytesBefore += Buffer.byteLength(original);
    report.masters.bytesAfter += Buffer.byteLength(cleaned.text);
    if (changed) report.masters.changedFiles += 1;
    mergeStats(report.masters, cleaned.stats);
    if (write && changed) await writeFile(file, cleaned.text, "utf8");
    const relative = path.relative(skillRoot, file).replaceAll("\\", "/");
    records.push({ path: relative, bytes: Buffer.byteLength(cleaned.text), sha256: sha256(cleaned.text) });
  }

  const readme = path.join(mastersRoot, "README.md");
  try {
    const readmeStat = await stat(readme);
    if (readmeStat.isFile()) {
      report.removedMasterReadme = true;
      if (write) await rm(readme);
    }
  } catch {
    // Already removed: the cleanup is idempotent.
  }

  records.sort((a, b) => a.path.localeCompare(b.path, "zh-CN"));
  if (write && manifests) await writeManifests(skillRoot, report, records);
  return report;
}

function parseArgs(argv) {
  const options = { write: false, manifests: false, skillRoot: DEFAULT_SKILL_ROOT, json: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--write") options.write = true;
    else if (arg === "--manifests") options.manifests = true;
    else if (arg === "--json") options.json = true;
    else if (arg === "--root") options.skillRoot = path.resolve(argv[++index]);
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return options;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const report = await cleanKnowledge(options);
  if (options.json) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } else {
    process.stdout.write(`mode=${options.write ? "write" : "dry-run"} cinema=${report.cinema.files} masters=${report.masters.files} changed=${report.cinema.changedFiles + report.masters.changedFiles}\n`);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(`${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  });
}
