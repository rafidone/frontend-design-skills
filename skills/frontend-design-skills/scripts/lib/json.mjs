import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export function readJson(file, fallback = null) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '')); }
  catch { return fallback; }
}

export function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n');
}

export function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

export function sha256File(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

export function hashString(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

export function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function walkFiles(root, options = {}) {
  const skip = new Set(options.skip || ['.git', 'node_modules', '.frontend-design-skills']);
  const out = [];
  const visit = dir => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (!skip.has(entry.name)) visit(path.join(dir, entry.name));
      } else {
        out.push(path.join(dir, entry.name));
      }
    }
  };
  if (fs.existsSync(root)) visit(root);
  return out;
}

export function findProjectRoot(start = process.cwd()) {
  let dir = path.resolve(start);
  for (let i = 0; i < 4; i++) {
    if (fs.existsSync(path.join(dir, '.frontend-design-skills'))) return dir;
    if (fs.existsSync(path.join(dir, 'index.html')) && fs.existsSync(path.join(dir, 'assets'))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return path.resolve(start);
}
