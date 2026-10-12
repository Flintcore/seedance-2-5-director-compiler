import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const load = (relative) => readFile(path.join(root, relative), "utf8");
const links = (source) => [...source.matchAll(/\[[^\]\r\n]+\]\(([^)\r\n]+)\)/gu)]
  .map((match) => match[1]);
const slug = (heading) => heading.toLowerCase().replace(/[\p{P}\p{S}]/gu, "").replace(/\s+/gu, "-");

async function reachableSection(sourceFile, relativeLink, expectedHeading) {
  const source = await load(sourceFile);
  assert.ok(links(source).includes(relativeLink), `${sourceFile} lost ${relativeLink}`);
  const [relativePath, anchor] = relativeLink.split("#");
  const target = path.resolve(root, path.dirname(sourceFile), relativePath);
  assert.ok(!path.relative(root, target).startsWith(".."));
  const document = await readFile(target, "utf8");
  const headings = [...document.matchAll(/^#{1,6}\s+(.+)\r?$/gmu)].map((match) => match[1].trim());
  assert.ok(headings.includes(expectedHeading), `${target} lost its actual source section`);
  assert.equal(slug(expectedHeading), anchor);
}

// Maintenance of ownership and real source navigation only. These assertions do
// not score creative quality, prescribe prompt wording, or run during generation.
test("design and compilation share the existing IR strategy/execution boundary", async () => {
  for (const source of ["modules/shot-design.md", "modules/compiler.md"]) {
    await reachableSection(source, "director-ir.md#段级策略与逐镜执行", "段级策略与逐镜执行");
  }
});

test("design and compilation share the existing IR shot/beat boundary", async () => {
  for (const source of ["modules/shot-design.md", "modules/compiler.md"]) {
    await reachableSection(source, "director-ir.md#镜头与节拍边界", "镜头与节拍边界");
  }
});

test("ensemble decisions reach the complete existing character chapter", async () => {
  for (const source of ["modules/shot-design.md", "modules/knowledge-routing.md"]) {
    await reachableSection(source,
      "../references/cinema/角色行为与动作叙事参考库.md#七群像非人角色与预演",
      "七、群像、非人角色与预演");
  }
});

test("limited observations reach the existing viewpoint chapter instead of a new mandatory package", async () => {
  for (const source of ["modules/shot-design.md", "modules/knowledge-routing.md"]) {
    await reachableSection(source,
      "../references/cinema/视点体系与镜头运动地基.md#二四种常用观看位置",
      "二、四种常用观看位置");
  }
});
