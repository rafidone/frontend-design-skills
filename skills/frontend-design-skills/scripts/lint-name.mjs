#!/usr/bin/env node
// Enforce the single-name policy for this repository.
//
// The prohibited token is assembled at runtime from fragments so this file
// never contains the literal token it is designed to reject.

import fs from 'node:fs';
import path from 'node:path';

const TOKEN = String.fromCharCode(116, 97, 115, 116, 101);
const SKIP_DIRS = new Set(['.git', 'node_modules', '.frontend-design-skills', 'coverage', 'dist', 'out', 'test-results', 'playwright-report', '.cache']);
const TEXT_EXT = new Set([
  '.md', '.mdx', '.txt', '.json', '.jsonc', '.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx',
  '.html', '.htm', '.css', '.scss', '.sass', '.less', '.yml', '.yaml', '.toml', '.sh', '.bash',
  '.env', '.example', '.svg', '.xml', '.gitignore', '.gitattributes', ''
]);
const BINARY_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp', '.avif', '.gif', '.ico', '.woff', '.woff2', '.ttf', '.otf', '.mp4', '.webm', '.zip', '.gz', '.pdf']);

const root = path.resolve(process.argv[2] || process.cwd());
const findings = [];
let scanned = 0;

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      if (entry.name.toLowerCase().includes(TOKEN)) {
        findings.push({ kind: 'directory', file: path.relative(root, path.join(dir, entry.name)) });
      }
      walk(path.join(dir, entry.name));
      continue;
    }
    const full = path.join(dir, entry.name);
    if (entry.name.toLowerCase().includes(TOKEN)) {
      findings.push({ kind: 'filename', file: path.relative(root, full) });
    }
    if (entry.name.toLowerCase() === 'license') continue;
    const ext = path.extname(entry.name).toLowerCase();
    if (BINARY_EXT.has(ext)) continue;
    if (!TEXT_EXT.has(ext) && ext !== '') continue;
    let stat;
    try { stat = fs.statSync(full); } catch { continue; }
    if (stat.size > 4 * 1024 * 1024) continue;
    let text;
    try { text = fs.readFileSync(full, 'utf8'); } catch { continue; }
    if (text.includes('\u0000')) continue;
    scanned++;
    const lower = text.toLowerCase();
    let at = lower.indexOf(TOKEN);
    while (at !== -1) {
      const line = lower.slice(0, at).split('\n').length;
      const col = at - lower.lastIndexOf('\n', at);
      findings.push({ kind: 'content', file: path.relative(root, full), line, col });
      at = lower.indexOf(TOKEN, at + TOKEN.length);
    }
  }
}

if (!fs.existsSync(root)) {
  console.error(`lint-name: no such path: ${root}`);
  process.exit(2);
}

walk(root);

if (findings.length) {
  console.error(`lint-name: prohibited token found in ${findings.length} location(s):`);
  for (const f of findings.slice(0, 100)) {
    console.error(`  ${f.kind.padEnd(9)} ${f.file}${f.line ? `:${f.line}:${f.col}` : ''}`);
  }
  if (findings.length > 100) console.error(`  ... ${findings.length - 100} more`);
  process.exit(1);
}

console.log(`lint-name: PASS (${scanned} text files scanned)`);
