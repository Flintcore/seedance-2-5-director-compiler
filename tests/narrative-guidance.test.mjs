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
