#!/usr/bin/env node
// Maintainer-only inventory refresh. Reads current bytes; never cleans or imports knowledge.
import { createHash } from 'node:crypto';
import { readFile, readdir, writeFile, rename } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const DEFAULT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export function aggregateHash(records) {
  const hash = createHash('sha256');
  for (const record of [...records].sort((a, b) => a.path.localeCompare(b.path, 'en'))) {
    hash.update(`${record.path}\0${record.sha256}\n`);
  }
  return hash.digest('hex');
}
async function markdownFiles(dir) {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Knowledge symlink needs explicit review: ${full}`);
    if (entry.isDirectory()) files.push(...await markdownFiles(full));
    else if (entry.isFile() && entry.name.endsWith('.md') && entry.name !== 'README.md' && !entry.name.startsWith('INDEX')) files.push(full);
  }
  return files;
}
export async function refreshManifest({ root = DEFAULT_ROOT, write = false, timestamp = new Date().toISOString() } = {}) {
  root = path.resolve(root);
  const cinema = await markdownFiles(path.join(root, 'references/cinema'));
  const masters = await markdownFiles(path.join(root, 'references/masters'));
  const records = [];
  for (const file of [...cinema, ...masters]) {
    const content = await readFile(file);
    records.push({ path: path.relative(root, file).replaceAll('\\', '/'), bytes: content.byteLength, sha256: createHash('sha256').update(content).digest('hex') });
  }
  records.sort((a, b) => a.path.localeCompare(b.path, 'zh-CN'));
  const methodology = masters.filter(file => path.basename(file).startsWith('_')).length;
  const aggregate = aggregateHash(records);
  const lines = [
    'schema_version: 1', `generated_at: ${JSON.stringify(timestamp)}`,
    'skill: "seedance-2-5-director-compiler"', 'maintenance_mode: "curated-manual"',
    '# Current inventory only; semantic equivalence to the historical source is not asserted.',
    'inventory:', `  cinema_content_files: ${cinema.length}`, `  master_methodology_files: ${methodology}`,
    `  master_work_analysis_files: ${masters.length - methodology}`, `  master_content_files: ${masters.length}`,
    `  master_directories: ${new Set(masters.map(file => path.dirname(file))).size}`,
    `  aggregate_sha256: "${aggregate}"`, 'files:',
  ];
  for (const record of records) lines.push(`  - path: ${JSON.stringify(record.path)}`, `    bytes: ${record.bytes}`, `    sha256: "${record.sha256}"`);
  if (write) {
    const target = path.join(root, 'KNOWLEDGE-MANIFEST.yaml');
    const staging = `${target}.tmp-${process.pid}`;
    await writeFile(staging, `${lines.join('\n')}\n`, 'utf8');
    await rename(staging, target);
  }
  return { write, files: records.length, bytes: records.reduce((n, item) => n + item.bytes, 0), aggregate_sha256: aggregate, cinema: cinema.length, methodologies: methodology, works: masters.length - methodology };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const options = {};
  for (let i = 2; i < process.argv.length; i++) {
    const arg = process.argv[i];
    if (arg === '--write') options.write = true;
    else if (arg === '--root' && process.argv[i + 1]) options.root = process.argv[++i];
    else throw new Error(`Unknown or incomplete argument: ${arg}`);
  }
  process.stdout.write(`${JSON.stringify(await refreshManifest(options), null, 2)}\n`);
}
