import assert from "node:assert/strict";
import test from "node:test";

import { cleanCinemaText, cleanMasterText } from "../scripts/clean-knowledge.mjs";

test("master cleaner removes legacy compiler sections and preserves film analysis", () => {
  const input = `# 作品\r\n\r\n## 二、标志性场景逐镜分析\r\n\r\n镜头分析保留。\r\n- **信息素**：旧配额\r\n- **🎯 可复用模板**：旧模板\r\n\r\n## 六、与信条体系的强关联\r\n\r\n旧映射。\r\n\r\n## 七、AI 模型直接复用的“句式模板”（Copy-Paste Ready）\r\n\r\n旧句式。\r\n\r\n## 八、本作禁忌\r\n\r\n保持空间可读。\r\n`;
  const result = cleanMasterText(input);
  assert.match(result.text, /镜头分析保留/);
  assert.match(result.text, /保持空间可读/);
  assert.doesNotMatch(result.text, /信息素|可复用模板|信条体系|Copy-Paste|旧句式/);
  assert.equal(result.stats.sectionsRemoved, 2);
});

test("master cleaner renames the seven-file short-form boundary heading", () => {
  const input = "# 作品\n\n## 四、信条对应与适用边界\n\n| 原则 | 体现 |\n|---|---|\n| 构图 | 留白 |\n";
  const result = cleanMasterText(input);
  assert.match(result.text, /## 四、设计维度与适用边界/);
  assert.match(result.text, /构图/);
  assert.doesNotMatch(result.text, /信条/);
});

test("cinema cleaner removes output-format sections without removing craft", () => {
  const input = "# 镜头知识\n\n## 一、镜头选择\n\n保留摄影知识。\n\n## 五、输出格式\n\n旧 L2 模板。\n\n## 六、案例\n\n保留案例。\n";
  const result = cleanCinemaText(input, "切镜时机学.md");
  assert.match(result.text, /保留摄影知识/);
  assert.match(result.text, /保留案例/);
  assert.doesNotMatch(result.text, /输出格式|旧 L2 模板/);
});

test("cleaners are idempotent", () => {
  const input = "# 作品\n\n## 二、分析\n\n摄影机保持在人物肩后。\n";
  const once = cleanMasterText(input).text;
  const twice = cleanMasterText(once).text;
  assert.equal(twice, once);
});
