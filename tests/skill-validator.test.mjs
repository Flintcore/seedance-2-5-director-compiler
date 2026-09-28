import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import {
  DEFAULT_SKILL_ROOT,
  MAX_MASTER_INDEX_BYTES,
  validateSkill,
} from "../scripts/validate-skill.mjs";

test("installed skill retains the complete curated knowledge inventory", async () => {
  const result = await validateSkill(DEFAULT_SKILL_ROOT);
  assert.equal(result.ok, true, result.errors.map((error) => `${error.code}: ${error.message}`).join("\n"));
  assert.deepEqual(result.facts, {
    cinemaFiles: 51,
    masterContentFiles: 184,
    masterMethodologyFiles: 67,
    masterWorkFiles: 117,
    masterDirectories: 67,
    manifestRecords: 235,
  });
});

test("detects legacy cinema rules, stale master routing, broken links, and missing runtime files", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "seedance-skill-validator-"));
  try {
    const cinemaRoot = path.join(root, "references", "cinema");
    const mastersRoot = path.join(root, "references", "masters");
    await mkdir(cinemaRoot, { recursive: true });
    await mkdir(mastersRoot, { recursive: true });

    await writeFile(
      path.join(cinemaRoot, "INDEX.md"),
      "# Cinema\n\n[残留文档](./残留文档.md)\n[断链](./missing.md)\n",
      "utf8",
    );
    await writeFile(
      path.join(cinemaRoot, "残留文档.md"),
      `# 残留\n\n**技术规格模板**\n\nNOT BGM\n\nAgent 自动模式要求每30秒注入信息。\n重复正文。\n重复正文。\n\0\n~~~text\n未闭合围栏\n\n${"镜头知识。".repeat(120)}`,
      "utf8",
    );
    await writeFile(
      path.join(mastersRoot, "INDEX.md"),
      `# Masters\n\nPhase 4.3 Reviewer 输出模板\n\n[断链](./ghost.md)\n\n${"x".repeat(MAX_MASTER_INDEX_BYTES)}`,
      "utf8",
    );
    await writeFile(path.join(mastersRoot, "INDEX-类型匹配.md"), "# Types\n", "utf8");
    await writeFile(path.join(mastersRoot, "INDEX-反查.md"), "# Dimensions\n", "utf8");
    await mkdir(path.join(mastersRoot, "legacy"), { recursive: true });
    await writeFile(
      path.join(mastersRoot, "legacy", "旧作品.md"),
      `# 旧作品\n\n> **用途**：生成模型调用。\n\n- 表演：Deadpan 10-30%。\n- 摄影：暗部 ≥70%，人物占比 <8%。\n- 镜头设计生成中不写配乐。\n- 任意场景默认 35–50mm 禁区。\n- 镜头表达禁写推拉；爆发（）→。\n\n${"镜头知识。".repeat(120)}`,
      "utf8",
    );

    const result = await validateSkill(root);
    const codes = new Set(result.errors.map((error) => error.code));
    assert(codes.has("CINEMA_PROMPT_TEMPLATE"));
    assert(codes.has("CINEMA_BLANKET_NEGATIVE"));
    assert(codes.has("CINEMA_CONTAMINATION"));
    assert(codes.has("CINEMA_HARD_QUOTA"));
    assert(codes.has("KNOWLEDGE_STRUCTURE"));
    assert(codes.has("MASTER_INDEX_CHATTER"));
    assert(codes.has("MASTER_INDEX_OVERSIZE"));
    assert(codes.has("MASTER_CONTAMINATION"));
    assert(codes.has("MASTER_PERFORMANCE_SCALE"));
    assert(codes.has("MASTER_PLATFORM_MUSIC_OVERRIDE"));
    assert(codes.has("MASTER_MIGRATED_INSTRUCTION"));
    assert(codes.has("MASTER_HARD_GATE"));
    assert(codes.has("MASTER_DANGLING_CLEANUP"));
    assert(codes.has("KNOWLEDGE_LINK_MISSING"));

    const missing = result.errors
      .filter((error) => error.code === "REQUIRED_FILE")
      .map((error) => error.message);
    assert(missing.includes("missing modules/compiler.md"));
    assert(missing.includes("missing references/model/nine-layer-schema.md"));
    assert(missing.includes("missing schemas/director-ir.yaml"));
    assert(missing.includes("missing tests/prompt-validator.test.mjs"));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("does not treat a normal bold Markdown label as dangling cleanup", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "seedance-skill-validator-label-"));
  try {
    const mastersRoot = path.join(root, "references", "masters", "sample");
    await mkdir(mastersRoot, { recursive: true });
    await writeFile(
      path.join(mastersRoot, "作品.md"),
      `# 作品\n\n**摄影策略**：以稳定远景建立空间关系。\n\n${"镜头知识。".repeat(120)}`,
      "utf8",
    );

    const result = await validateSkill(root);
    const dangling = result.errors.filter((error) => error.code === "MASTER_DANGLING_CLEANUP");
    assert.deepEqual(dangling, []);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("detects legacy Agent slots in a masters body", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "seedance-skill-validator-agent-"));
  try {
    const mastersRoot = path.join(root, "references", "masters", "sample");
    await mkdir(mastersRoot, { recursive: true });
    await writeFile(
      path.join(mastersRoot, "作品.md"),
      `# 作品\n\n视角主体：代入女搭档 Agent。\n\n${"镜头知识。".repeat(120)}`,
      "utf8",
    );

    const result = await validateSkill(root);
    assert(result.errors.some((error) => error.code === "MASTER_CONTAMINATION"));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
