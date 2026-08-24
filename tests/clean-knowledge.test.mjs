import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { cleanCinemaText, cleanKnowledge, cleanMasterText } from "../scripts/clean-knowledge.mjs";

test("removes marked legacy prompt fences while preserving nearby craft", () => {
  const markers = ["技术规格模板", "嵌入描述模板", "嵌入描述示例", "嵌入格式", "格式示例", "标注示例", "嵌入描述模板（延性金属碰撞）"];
  const blocks = markers.map((marker, index) => `**${marker}**${index % 2 ? "：" : ""}\n\n\`\`\`${index % 2 ? "text" : ""}\n旧模板 ${index}\n\`\`\``).join("\n\n");
  const input = `# 摄影知识\n\n构图与调度保留。\n\n${blocks}\n\n声画关系保留。\n`;

  const result = cleanCinemaText(input, "摄影知识.md");

  assert.match(result.text, /构图与调度保留/);
  assert.match(result.text, /声画关系保留/);
  assert.doesNotMatch(result.text, /旧模板|技术规格模板|嵌入描述模板|嵌入描述示例|嵌入格式|格式示例|标注示例/);
  assert.equal(result.stats.legacyPromptBlocksRemoved, markers.length);
});

test("keeps an unfenced marker because it may be ordinary prose", () => {
  const input = "# 摄影知识\n\n**格式示例**：\n这里没有 fenced code。\n";
  const result = cleanCinemaText(input, "摄影知识.md");
  assert.match(result.text, /\*\*格式示例\*\*/);
  assert.match(result.text, /这里没有 fenced code/);
});

test("removes embedded prompt-example headings as a complete section", () => {
  const input = "# 动作知识\n\n## 力量传导\n保留动作美学。\n\n### 嵌入到镜头描述的示例\n旧编译样板。\n\n## 空间连续性\n保留空间知识。\n";
  const result = cleanCinemaText(input, "动作设计与武指体系参考库.md");
  assert.match(result.text, /保留动作美学/);
  assert.match(result.text, /保留空间知识/);
  assert.doesNotMatch(result.text, /嵌入到镜头描述|旧编译样板/);
});

test("removes legacy subtitle and music bans and rewrites the music policy", () => {
  const input = "# 声画\n\n动作 + 尘土飞扬 + NOT subtitles + NOT BGM\n配恐怖音乐：违反 NOT BGM 铁律；用环境失真音。\n规则名：无BGM铁律。\n";
  const result = cleanCinemaText(input, "类型片镜头语法库.md");
  assert.match(result.text, /动作 \+ 尘土飞扬/);
  assert.match(result.text, /音乐选择应服从项目策略/);
  assert.doesNotMatch(result.text, /NOT subtitles|NOT BGM|无BGM铁律/i);
});

test("normalizes only the legacy performance ranges in the literary-scene library", () => {
  const input = "# 文戏\n\n极致克制 ≤30% / 克制 30-50% / 古典戏剧化 50–70% / 大开大合 70—95% / Deadpan 10-30%\n";
  const literary = cleanCinemaText(input, "文戏编排参考库.md");
  const other = cleanCinemaText(input, "表演细节参考库.md");
  assert.match(literary.text, /极致克制 \/ 克制 \/ 古典戏剧化 \/ 大开大合 \/ Deadpan/);
  assert.doesNotMatch(literary.text, /30%|50%|70%|95%/);
  assert.match(other.text, /30%/);
});

test("removes legacy architecture chatter while preserving film craft", () => {
  const input = `# 视线设计

> 落地格式见所在版本编译层。
> 两层架构：Layer 1 写判断，Layer 2 写输出，属于单体时代规则。

AI 模型需要精确方向；角色先看门，再看同伴。
这是 LLM 默认的 AI slop。可抄短语：直接写入旧提示词。
**反 AI 陷阱**：不要用空泛的坚定眼神。
`;
  const result = cleanCinemaText(input, "人物视线与目光设计参考库.md");

  assert.match(result.text, /角色先看门，再看同伴/);
  assert.match(result.text, /设计者默认的套路化画面/);
  assert.match(result.text, /避免合成感陷阱/);
  assert.doesNotMatch(result.text, /所在版本编译层|Layer\s*[12]|单体时代|落地格式|可抄短语|AI\s*模型|\bLLM\b|AI slop|反\s*AI/i);
});

test("strips inline legacy routing notes without dropping the shot decision", () => {
  const input = "# 景深\n\n移焦写清起止焦平面与持续过程（是否标注精确时间码由所在版本编译层决定）。\n";
  const result = cleanCinemaText(input, "景深与焦点叙事决策库.md");

  assert.match(result.text, /移焦写清起止焦平面与持续过程/);
  assert.doesNotMatch(result.text, /所在版本编译层|时间码由/);
});

test("removes the Eggers-era creative-principle maintenance line", () => {
  const input = "# 方法论\n\n- **创作原则编号/名称**：版本升级后重核。\n- **构图方法**：轴线稳定。\n";
  const result = cleanMasterText(input);
  assert.doesNotMatch(result.text, /创作原则编号|版本升级后重核/);
  assert.match(result.text, /构图方法/);
});

test("all new cleanup rules are idempotent", () => {
  const input = "# 文戏\n\n**嵌入格式**：\n```text\n旧格式\n```\n\n克制 30-50% + NOT subtitles + NOT BGM\n";
  const once = cleanCinemaText(input, "文戏编排参考库.md").text;
  const twice = cleanCinemaText(once, "文戏编排参考库.md").text;
  assert.equal(twice, once);
});

test("migration manifest records fusion evidence, confirmed contracts, and excluded runtimes", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "seedance-cleaner-"));
  try {
    const cinemaRoot = path.join(root, "references", "cinema");
    const masterRoot = path.join(root, "references", "masters", "robert-eggers");
    await mkdir(cinemaRoot, { recursive: true });
    await mkdir(masterRoot, { recursive: true });
    await writeFile(path.join(cinemaRoot, "切镜时机学.md"), "# 切镜\n\n保留动作。\n", "utf8");
    await writeFile(path.join(masterRoot, "_罗伯特·艾格斯方法论总纲.md"), "# 方法论\n\n保留构图。\n", "utf8");

    await cleanKnowledge({ skillRoot: root, write: true, manifests: true });
    const manifest = await readFile(path.join(root, "MIGRATION-MANIFEST.yaml"), "utf8");

    assert.match(manifest, /action_fusion_source:/);
    assert.match(manifest, /C:\/Users\/ASUS\/\.codex\/skills\/seedance-2-5-prompt-optimizer-action-fusion/);
    assert.match(manifest, /261304C7FDE3D684C5E912DCE00D132AC20CD78A495F97ECFD05B37428AE1C1D/);
    assert.match(manifest, /0E25D895A7D1E71D99BD9DD9E8A9A2EFCB1E5083A919A9701D0E112C86BA3BC4/);
    assert.match(manifest, /C16907960917F586304DB51953221906B048742BAF72BBE3DD09AAACEB2548BB/);
    assert.match(manifest, /minimum: 4[\s\S]*maximum: 30/);
    assert.match(manifest, /maximum_total_reference_assets: 50/);
    assert.match(manifest, /opening: 0\.5[\s\S]*closing: 0\.5/);
    assert.match(manifest, /角色ID说\{逐字台词\}/);
    assert.match(manifest, /旁白\{逐字旁白\}/);
    assert.match(manifest, /excluded_runtime_mechanisms:[\s\S]*project_state_ledgers_and_automatic_writes[\s\S]*reviewer_score_and_self_check_loops/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
