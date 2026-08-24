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
    cinemaFiles: 44,
    masterContentFiles: 184,
    masterMethodologyFiles: 67,
    masterWorkFiles: 117,
    masterDirectories: 67,
    manifestRecords: 228,
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
      `# 残留\n\n**技术规格模板**\n\nNOT BGM\n\nAgent 自动模式要求每30秒注入信息。\n\n${"镜头知识。".repeat(120)}`,
      "utf8",
    );
    await writeFile(
      path.join(mastersRoot, "INDEX.md"),
      `# Masters\n\nPhase 4.3 Reviewer 输出模板\n\n[断链](./ghost.md)\n\n${"x".repeat(MAX_MASTER_INDEX_BYTES)}`,
      "utf8",
    );
    await writeFile(path.join(mastersRoot, "INDEX-类型匹配.md"), "# Types\n", "utf8");
    await writeFile(path.join(mastersRoot, "INDEX-反查.md"), "# Dimensions\n", "utf8");

    const result = await validateSkill(root);
    const codes = new Set(result.errors.map((error) => error.code));
    assert(codes.has("CINEMA_PROMPT_TEMPLATE"));
    assert(codes.has("CINEMA_BLANKET_NEGATIVE"));
    assert(codes.has("CINEMA_CONTAMINATION"));
    assert(codes.has("CINEMA_HARD_QUOTA"));
    assert(codes.has("MASTER_INDEX_CHATTER"));
    assert(codes.has("MASTER_INDEX_OVERSIZE"));
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
