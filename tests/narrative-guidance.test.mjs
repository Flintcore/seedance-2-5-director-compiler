import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function read(relativePath) {
  return readFile(path.join(root, relativePath), "utf8");
}

// Structural smoke check only; prose semantics are exercised by independent prompt trials.
test("keeps the existing continuous-narrative guidance markers connected", async () => {
  const [schema, compiler, shotDesign, directorIr, orchestration, complexity, continuity] = await Promise.all([
    read("references/model/nine-layer-schema.md"),
    read("modules/compiler.md"),
    read("modules/shot-design.md"),
    read("modules/director-ir.md"),
    read("modules/orchestration.md"),
    read("references/model/complexity.md"),
    read("references/model/continuity.md"),
  ]);

  assert.match(schema, /镜头级连续画面叙事/u);
  assert.match(schema, /动态锚点/u);
  assert.doesNotMatch(schema, /只写本镜新增的可见事件和结果；通用栏已经说明的内容不重复/u);

  assert.match(compiler, /Shot-Level Continuous Visual Narrative/u);
  assert.match(compiler, /linked reaction/u);
  assert.match(compiler, /Repeat dynamic anchors/u);
  assert.match(shotDesign, /保持同一空间中的背景人物和未完成动作继续可见/u);
  assert.match(directorIr, /可读的完整画面事件链/u);
  assert.match(orchestration, /连续的画面因果脊柱/u);
  assert.match(complexity, /causal spine/u);
  assert.match(continuity, /incoming shot paragraph re-establishes/u);
});
