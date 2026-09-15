import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const canonical = path.join(root, "references/model/nine-layer-schema.md");
const sources = [
  "SKILL.md", "modules/compiler.md", "modules/shot-design.md",
  "modules/director-ir.md", "modules/orchestration.md",
  "modules/design-judgment.md", "modules/micro-performance.md", "modules/diagnosis.md",
  "references/model/complexity.md", "references/model/continuity.md",
  "references/model/nine-layer-schema.md",
];
function localTargets(text) {
  const markdown = [...text.matchAll(/\[[^\]\r\n]+\]\(([^)\r\n]+)\)/gu)].map((match) => match[1]);
  const code = [...text.matchAll(/\x60([^\x60\r\n]+\.md)\x60/gu)].map((match) => match[1]);
  return [...new Set([...markdown, ...code])]
    .filter((value) => !/^(?:[a-z]+:|#)/iu.test(value) && !/[<>]/u.test(value))
    .map((value) => value.split("#")[0]);
}
async function resolvedTargets(relativeFile) {
  const source = path.join(root, relativeFile);
  const content = await readFile(source, "utf8");
  const resolved = [];
  for (const target of localTargets(content)) {
    const decoded = decodeURIComponent(target);
    const candidates = [path.resolve(path.dirname(source), decoded), path.resolve(root, decoded)];
    let found;
    for (const candidate of candidates) {
      try { if ((await stat(candidate)).isFile()) { found = candidate; break; } } catch {}
    }
    assert.ok(found, relativeFile + " has an unresolved local reference: " + target);
    assert.ok(!path.relative(root, found).startsWith(".."), "local reference escapes skill: " + target);
    resolved.push(found);
  }
  return resolved;
}

// Dependency discovery only. This is not a word-match proxy for narrative quality;
// actual output syntax is exercised with positive/negative prompt fixtures,
// while creative fidelity requires the independent semantic prompt trials.
test("runtime narrative entrypoints retain valid local reference routes", async () => {
  for (const source of sources) await resolvedTargets(source);
});
test("the active entrypoint reaches the compiler and its historical-path canonical schema", async () => {
  assert.ok((await resolvedTargets("SKILL.md")).includes(path.join(root, "modules/compiler.md")));
  assert.ok((await resolvedTargets("modules/compiler.md")).includes(canonical));
});

test("design judgment is reachable from intake, design, compiler, diagnosis and template", async () => {
  const target = path.join(root, "modules/design-judgment.md");
  for (const source of ["SKILL.md", "modules/orchestration.md", "modules/shot-design.md", "modules/compiler.md", "modules/diagnosis.md", "references/model/nine-layer-schema.md"]) {
    assert.ok((await resolvedTargets(source)).includes(target), source + " bypasses design judgment routing");
  }
});
test("judgment routes to existing optics, composition, continuity and performance resources", async () => {
  const targets = await resolvedTargets("modules/design-judgment.md");
  for (const source of ["references/cinema/景深与焦点叙事决策库.md", "references/cinema/构图设计参考库.md", "references/cinema/镜头衔接与连续性参考库.md", "modules/micro-performance.md", "modules/knowledge-routing.md"]) {
    assert.ok(targets.includes(path.join(root, source)), "missing active resource: " + source);
  }
});
