import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const canonical = path.join(root, "modules/prompt-template.md");
const sources = [
  "SKILL.md", "modules/compiler.md", "modules/shot-design.md",
  "modules/director-ir.md", "modules/orchestration.md",
  "modules/design-judgment.md", "modules/micro-performance.md", "modules/diagnosis.md",
  "references/model/complexity.md", "references/model/continuity.md",
  "references/model/nine-layer-schema.md",
  "modules/knowledge-routing.md", "modules/action-design.md",
  "references/model/dialogue-binding.md", "references/model/character-event-examples.md",
];
function localTargets(text) {
  const markdown = [...text.matchAll(/\[[^\]\r\n]+\]\(([^)\r\n]+)\)/gu)].map((match) => match[1]);
  const code = [...text.matchAll(/\x60([^\x60\r\n]+\.md)\x60/gu)].map((match) => match[1]);
  return [...new Set([...markdown, ...code])]
    // Wildcards are explicit directory-discovery patterns, not literal links.
    .filter((value) => !/^(?:[a-z]+:|#)/iu.test(value) && !/[<>*]/u.test(value))
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
test("the active entrypoint reaches the compiler and the handbook canonical template", async () => {
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

test("character behavior is an actual dependency of problem routing, performance and action", async () => {
  const target = path.join(root, "references/cinema/角色行为与动作叙事参考库.md");
  for (const source of ["modules/knowledge-routing.md", "modules/micro-performance.md", "modules/action-design.md"]) {
    assert.ok((await resolvedTargets(source)).includes(target), source + " lacks the live character-behavior route");
  }
  assert.ok((await resolvedTargets("references/model/nine-layer-schema.md"))
    .includes(path.join(root, "references/model/character-event-examples.md")));
});

// Structural reachability only; creative behavior is evaluated in isolated trials.
test("group-design and actor-craft routes resolve to actual topic sections", async () => {
  const groups = "references/cinema/戏点选择与主镜框架法.md";
  const view = "references/cinema/视点体系与镜头运动地基.md";
  const actor = "references/cinema/角色行为与动作叙事参考库.md";
  for (const source of ["SKILL.md", "modules/shot-design.md", "modules/knowledge-routing.md"]) {
    const targets = await resolvedTargets(source);
    assert.ok(targets.includes(path.join(root, groups)), source + " missing group knowledge dependency");
    assert.ok(targets.includes(path.join(root, actor)), source + " missing actor knowledge dependency");
  }
  for (const source of ["modules/shot-design.md", "modules/knowledge-routing.md"]) {
    assert.ok((await resolvedTargets(source)).includes(path.join(root, view)));
  }
  assert.match(await readFile(path.join(root, groups), "utf8"), /^### 镜头组四问：摄影选择的上游$/mu);
  assert.match(await readFile(path.join(root, view), "utf8"), /^### 先定镜头组的叙事视角，再定摄影位置$/mu);
  assert.match(await readFile(path.join(root, actor), "utf8"), /<a id="actor-craft-four-senses"><\/a>/u);
});
