#!/usr/bin/env node
// Asset pipeline: verify provenance manifests, browse icons, select photographs
// and write the single credits page. No network access is required at runtime.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readJson, writeJson, ensureDir, sha256File, escapeHtml } from './lib/json.mjs';
import { imageSize } from './lib/image.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const skillRoot = path.resolve(here, '..');
const DEFAULT_MANIFEST = path.join(skillRoot, 'assets/photos/manifest.json');
const ICON_MANIFEST = path.join(skillRoot, 'assets/icons/manifest.json');

const REQUIRED = ['id', 'class', 'path', 'source', 'author', 'license', 'added', 'credit_required'];
const CLASSES = new Set([
  'product-ui', 'photo', 'diagram', 'brand', 'data', 'texture', 'icon', 'placeholder',
  'illustration', 'font', 'logo', 'video'
]);
const BAD_PATH = /(^|\/)[^a-z0-9._/-]|[\sA-Z]/;

function parseArgs(argv) {
  const args = {
    command: 'verify', sub: '', manifest: '', root: '', json: false, quiet: false,
    family: '', query: '', id: '', ids: [], out: '', title: '', site: '', all: false,
    allowUnhashed: false
  };
  const words = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--manifest') args.manifest = argv[++i];
    else if (a === '--root') args.root = argv[++i];
    else if (a === '--json') args.json = true;
    else if (a === '--quiet') args.quiet = true;
    else if (a === '--family') args.family = argv[++i];
    else if (a === '--query' || a === '-q') args.query = argv[++i];
    else if (a === '--id') args.ids.push(argv[++i]);
    else if (a === '--ids') args.ids.push(...String(argv[++i] || '').split(',').filter(Boolean));
    else if (a === '--out') args.out = argv[++i];
    else if (a === '--title') args.title = argv[++i];
    else if (a === '--site') args.site = argv[++i];
    else if (a === '--all') args.all = true;
    else if (a === '--allow-unhashed') args.allowUnhashed = true;
    else if (a === '--help' || a === '-h') args.help = true;
    else if (!a.startsWith('--')) words.push(a);
  }
  args.command = words[0] || 'verify';
  args.sub = words[1] || '';
  args.id = args.ids[0] || '';
  return args;
}

function resolveManifest(args) {
  return path.resolve(args.manifest || DEFAULT_MANIFEST);
}

function assetPath(asset, manifestFile, root) {
  const rel = String(asset.path || '');
  const candidates = [];
  if (root) candidates.push(path.resolve(root, rel));
  // A project keeps its manifest in <site>/assets/photos/, while the recorded
  // path is site-relative. Try the site root before treating the path as
  // manifest-relative.
  candidates.push(path.resolve(path.dirname(manifestFile), '..', '..', rel));
  candidates.push(path.resolve(path.dirname(manifestFile), rel));
  candidates.push(path.resolve(skillRoot, 'assets/photos', rel));
  candidates.push(path.resolve(skillRoot, 'assets', rel));
  return candidates.find(candidate => fs.existsSync(candidate)) || candidates[0];
}

function checkAsset(asset, context) {
  const problems = [];
  const warnings = [];
  for (const field of REQUIRED) {
    if (asset[field] === undefined || asset[field] === null || asset[field] === '') {
      problems.push(`missing field "${field}"`);
    }
  }
  if (asset.class && !CLASSES.has(asset.class)) problems.push(`unknown class "${asset.class}"`);
  if (asset.path && BAD_PATH.test(String(asset.path))) problems.push('path must be lowercase, hyphenated and contain no spaces');
  if (asset.source && !/^(https?:\/\/|client:|supplier:|commissioned:|phone:)/i.test(String(asset.source))) {
    warnings.push('source is not a URL or a named provenance prefix');
  }
  if (asset.credit_required === true && !asset.credit) warnings.push('credit_required is true but no credit text is recorded');
  if (!asset.sha256 && !context.allowUnhashed) problems.push('missing sha256 checksum');
  if (!asset.bytes) warnings.push('missing byte size');

  const file = assetPath(asset, context.manifestFile, context.root);
  let stat = null;
  try { stat = fs.statSync(file); } catch { /* reported below */ }
  if (!stat || !stat.isFile()) {
    problems.push(`file not found: ${file}`);
    return { file, problems, warnings, size: null, dimensions: null };
  }
  let dimensions = null;
  try { dimensions = imageSize(fs.readFileSync(file), path.extname(file)); } catch { /* optional */ }
  if (asset.bytes && stat.size !== Number(asset.bytes)) {
    problems.push(`size mismatch: manifest ${asset.bytes}, file ${stat.size}`);
  }
  if (asset.sha256) {
    const actual = sha256File(file);
    if (actual !== String(asset.sha256).toLowerCase()) problems.push(`sha256 mismatch: manifest ${String(asset.sha256).slice(0, 12)}…, file ${actual.slice(0, 12)}…`);
  }
  if (dimensions) {
    if (asset.width && dimensions.width !== Number(asset.width)) problems.push(`width mismatch: manifest ${asset.width}, file ${dimensions.width}`);
    if (asset.height && dimensions.height !== Number(asset.height)) problems.push(`height mismatch: manifest ${asset.height}, file ${dimensions.height}`);
  } else if (/\.webp$/i.test(file)) {
    warnings.push('could not read WebP dimensions from the file header');
  }
  if (stat.size > 1_200_000) warnings.push(`file is ${Math.round(stat.size / 1000)} KB; aim below 500 KB`);
  return { file, problems, warnings, size: stat.size, dimensions };
}

export function verifyManifest(args = {}) {
  const manifestFile = resolveManifest(args);
  const manifest = readJson(manifestFile, null);
  const root = args.root ? path.resolve(args.root) : '';
  if (!manifest) {
    return { ok: false, manifestFile, assets: [], problems: [`manifest not found: ${manifestFile}`], warnings: [] };
  }
  const assets = Array.isArray(manifest) ? manifest : Array.isArray(manifest.assets) ? manifest.assets : [];
  if (!assets.length) return { ok: false, manifestFile, assets: [], problems: ['manifest has no assets'], warnings: [] };
  const context = { manifestFile, root, allowUnhashed: Boolean(args.allowUnhashed) };
  const ids = new Set();
  const hashes = new Map();
  const results = assets.map(asset => {
    const result = checkAsset(asset, context);
    if (asset.id && ids.has(asset.id)) result.problems.push(`duplicate id "${asset.id}"`);
    ids.add(asset.id);
    if (asset.sha256) {
      if (hashes.has(asset.sha256)) result.warnings.push(`same file as "${hashes.get(asset.sha256)}"`);
      else hashes.set(asset.sha256, asset.id);
    }
    return { id: asset.id || '(no id)', class: asset.class || '', path: asset.path || '', ...result };
  });
  const problems = results.flatMap(item => item.problems.map(problem => `${item.id}: ${problem}`));
  const warnings = results.flatMap(item => item.warnings.map(warning => `${item.id}: ${warning}`));
  return { ok: problems.length === 0, manifestFile, assets: results, problems, warnings };
}

function printVerify(result) {
  console.log(`assets verify\nmanifest: ${result.manifestFile}`);
  console.log(`assets:   ${result.assets.length}\n`);
  for (const item of result.assets) {
    const state = item.problems.length ? 'FAIL' : 'PASS';
    const extra = item.dimensions ? ` ${item.dimensions.width}x${item.dimensions.height}` : '';
    const size = item.size ? ` ${Math.round(item.size / 1024)} KB` : '';
    console.log(`${state}  ${String(item.id).padEnd(28)} ${String(item.path).padEnd(36)}${extra}${size}`);
    for (const problem of item.problems) console.log(`      problem: ${problem}`);
    for (const warning of item.warnings) console.log(`      warning: ${warning}`);
  }
  if (result.problems.length) console.log(`\nFAIL ${result.problems.length} problem(s)`);
  else console.log(`\nPASS all ${result.assets.length} asset(s) verified${result.warnings.length ? ` with ${result.warnings.length} warning(s)` : ''}`);
}

function printIcons(args) {
  const manifest = readJson(ICON_MANIFEST, null);
  if (!manifest) throw new Error(`icon manifest missing: ${ICON_MANIFEST}`);
  const family = args.family || '';
  const icons = (manifest.icons || []).filter(icon => !family || icon.category === family);
  if (args.json) {
    console.log(JSON.stringify({ family: family || 'all', count: icons.length, icons }, null, 2));
    return;
  }
  console.log(`icons${family ? ` (${family})` : ''}: ${icons.length}`);
  const missing = [];
  for (const icon of icons) {
    if (!fs.existsSync(path.join(skillRoot, 'assets/icons', icon.file))) missing.push(icon.file);
    console.log(`${icon.category.padEnd(6)} ${icon.file.padEnd(34)} ${icon.title}`);
  }
  if (missing.length) {
    console.error(`\nmissing files: ${missing.join(', ')}`);
    process.exitCode = 1;
  }
}

function photoList(args) {
  const manifestFile = resolveManifest(args);
  const manifest = readJson(manifestFile, { assets: [] });
  const query = String(args.query || '').toLowerCase().trim();
  const items = (manifest.assets || []).filter(asset => {
    if (!query) return true;
    const haystack = [asset.id, asset.class, asset.subject, asset.alt, asset.author, ...(asset.tags || [])].join(' ').toLowerCase();
    return haystack.includes(query);
  });
  if (args.json) {
    console.log(JSON.stringify({ query, count: items.length, assets: items }, null, 2));
    return;
  }
  console.log(`photos${query ? ` matching "${query}"` : ''}: ${items.length}`);
  for (const asset of items) {
    const tags = Array.isArray(asset.tags) ? asset.tags.join(', ') : '';
    console.log(`${String(asset.id).padEnd(28)} ${String(asset.path).padEnd(34)} ${asset.license}${tags ? `  [${tags}]` : ''}`);
  }
}

function photoFetch(args) {
  const manifestFile = resolveManifest(args);
  const manifest = readJson(manifestFile, { assets: [] });
  const wanted = args.ids.length ? args.ids : args.id ? [args.id] : [];
  if (!wanted.length) throw new Error('photos fetch needs --id <id> (repeatable) or --ids a,b');
  const out = path.resolve(args.out || './assets/photos');
  ensureDir(out);
  const selected = [];
  for (const id of wanted) {
    const asset = (manifest.assets || []).find(item => item.id === id);
    if (!asset) throw new Error(`photo not found in manifest: ${id}`);
    const source = assetPath(asset, manifestFile, args.root);
    if (!fs.existsSync(source)) throw new Error(`photo file missing: ${source}`);
    const target = path.join(out, asset.path);
    ensureDir(path.dirname(target));
    fs.copyFileSync(source, target);
    selected.push({ ...asset, path: asset.path, sha256: sha256File(target), bytes: fs.statSync(target).size });
    console.log(`copied ${id} -> ${target}`);
  }
  const siteManifest = {
    version: 1,
    note: 'Project copies of library photographs. Verify with assets.mjs verify.',
    assets: selected
  };
  writeJson(path.join(out, 'manifest.json'), siteManifest);
  console.log(`wrote ${path.join(out, 'manifest.json')}`);
}

function creditText(asset) {
  const author = asset.author || 'Unknown maker';
  const license = asset.license || 'Licence not recorded';
  const title = asset.title || asset.subject || asset.id;
  return `${title} — ${author} (${license})`;
}

export function creditsPage(manifestFile, options = {}) {
  const manifest = readJson(manifestFile, { assets: [] });
  const ids = new Set(options.ids || []);
  const items = (manifest.assets || []).filter(asset => !ids.size || ids.has(asset.id));
  const title = options.title || 'Photography and asset credits';
  const site = options.site || 'this site';
  const rows = items.map(asset => {
    const source = /^https?:\/\//i.test(String(asset.source || '')) ? `<a href="${escapeHtml(asset.source)}" rel="noreferrer">${escapeHtml(asset.source)}</a>` : escapeHtml(asset.source || '');
    return `<tr>
      <td>${escapeHtml(asset.id)}</td>
      <td>${escapeHtml(asset.author || 'Unknown maker')}</td>
      <td>${escapeHtml(asset.license || 'Not recorded')}</td>
      <td>${source}</td>
      <td>${asset.credit_required === false ? 'Not required' : 'Required'}</td>
    </tr>`;
  }).join('\n');
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="Asset sources, authors, licences and credit requirements for ${escapeHtml(site)}.">
  <title>${escapeHtml(title)}</title>
  <style>
    :root { color-scheme: light; --paper: #f7f5ef; --ink: #171a18; --muted: #59605b; --line: #d7d2c7; --accent: #1d4ed8; }
    * { box-sizing: border-box; }
    body { margin: 0; background: var(--paper); color: var(--ink); font: 16px/1.6 ui-sans-serif, system-ui, sans-serif; }
    .wrap { width: min(100% - 2rem, 72rem); margin-inline: auto; padding-block: 4rem; }
    h1 { max-width: 20ch; margin: 0 0 1rem; font-size: clamp(2rem, 5vw, 3.5rem); line-height: 1; letter-spacing: -0.035em; }
    p { max-width: 62ch; color: var(--muted); }
    table { width: 100%; margin-top: 2rem; border-collapse: collapse; font-size: 0.9rem; }
    caption { margin-bottom: 0.75rem; text-align: left; color: var(--muted); }
    th, td { padding: 0.8rem 0.6rem; border-bottom: 1px solid var(--line); text-align: left; vertical-align: top; }
    th { font-size: 0.72rem; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); }
    a { color: var(--accent); overflow-wrap: anywhere; }
    .back { display: inline-flex; min-height: 44px; margin-top: 2rem; align-items: center; }
    @media (max-width: 720px) {
      thead { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
      tr { display: grid; padding-block: 0.9rem; border-bottom: 1px solid var(--line); gap: 0.2rem; }
      td { border: 0; padding: 0; }
      td::before { display: block; color: var(--muted); font-size: 0.68rem; letter-spacing: 0.08em; text-transform: uppercase; content: attr(data-label); }
    }
  </style>
</head>
<body>
  <main class="wrap">
    <h1>${escapeHtml(title)}</h1>
    <p>Source, author, licence and credit requirements for the photographs and assets used by ${escapeHtml(site)}. This page is the single credit record; it is not a second navigation.</p>
    <table>
      <caption>${items.length} recorded asset${items.length === 1 ? '' : 's'}</caption>
      <thead><tr><th>ID</th><th>Author</th><th>Licence</th><th>Source</th><th>Credit</th></tr></thead>
      <tbody>
${rows}
      </tbody>
    </table>
    <a class="back" href="index.html">Back to the site</a>
  </main>
</body>
</html>
`;
}

function writeCredits(args) {
  const manifestFile = resolveManifest(args);
  const html = creditsPage(manifestFile, { ids: args.ids, title: args.title, site: args.site });
  const out = path.resolve(args.out || 'credits.html');
  ensureDir(path.dirname(out));
  fs.writeFileSync(out, html);
  console.log(`wrote ${out}`);
  const included = (readJson(manifestFile, { assets: [] }).assets || []).filter(asset => !args.ids.length || args.ids.includes(asset.id));
  for (const asset of included) console.log(`  ${creditText(asset)}`);
}

function usage() {
  console.log(`usage:
  assets.mjs verify [--manifest file] [--root dir] [--allow-unhashed] [--json]
  assets.mjs icons --list [--family ui|brand] [--json]
  assets.mjs photos list [--query text] [--manifest file] [--json]
  assets.mjs photos search --query text [--manifest file] [--json]
  assets.mjs photos fetch --id <id> [--id <id>] [--out dir] [--manifest file]
  assets.mjs photos credits [--ids a,b] [--out credits.html] [--title text] [--site name]

Manifest paths resolve against --root, then the manifest directory, then the
skill assets directory. A missing or mismatched sha256 is a failure.`);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) { usage(); return; }
  if (args.command === 'verify') {
    const result = verifyManifest(args);
    if (args.json) console.log(JSON.stringify({ ok: result.ok, manifest: result.manifestFile, count: result.assets.length, problems: result.problems, warnings: result.warnings }, null, 2));
    else if (!args.quiet) printVerify(result);
    if (!result.ok) process.exitCode = 1;
    return;
  }
  if (args.command === 'icons') {
    if (args.sub === 'list' || args.sub === '--list' || !args.sub) printIcons(args);
    else usage();
    return;
  }
  if (args.command === 'photos' || args.command === 'photo') {
    if (args.sub === 'list' || args.sub === '--list') photoList(args);
    else if (args.sub === 'search') photoList(args);
    else if (args.sub === 'fetch' || args.sub === 'copy') photoFetch(args);
    else if (args.sub === 'credits') writeCredits(args);
    else usage();
    return;
  }
  usage();
  process.exitCode = 2;
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isCli) {
  try { main(); }
  catch (error) {
    console.error(`assets: ${error.message}`);
    process.exitCode = 1;
  }
}
