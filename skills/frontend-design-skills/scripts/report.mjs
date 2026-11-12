#!/usr/bin/env node
// Render an inspection or gate report as report.html and report.md.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { escapeHtml, readJson, ensureDir } from './lib/json.mjs';

const SEVERITY_ORDER = { FAIL: 0, WARN: 1, WAIVED: 2, INFO: 3 };

function severityClass(value) {
  return String(value || '').toLowerCase();
}

function findingRows(findings) {
  return [...findings].sort((a, b) => (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9))
    .map(item => `
      <tr class="${severityClass(item.severity)}">
        <td><span class="badge">${escapeHtml(item.severity)}</span></td>
        <td class="rule">${escapeHtml(item.rule)}</td>
        <td>
          <strong>${escapeHtml(item.message)}</strong>
          ${item.detail ? `<div class="detail">${escapeHtml(item.detail)}</div>` : ''}
          ${item.selector ? `<code>${escapeHtml(item.selector)}</code>` : ''}
          ${item.fix ? `<div class="fix"><span>Fix</span> ${escapeHtml(item.fix)}</div>` : ''}
          ${item.waiver ? `<div class="fix"><span>Waived</span> ${escapeHtml(item.waiver)}</div>` : ''}
        </td>
        <td class="where">${escapeHtml(item.where || '')}</td>
      </tr>`).join('');
}

export function renderMarkdown(report) {
  const summary = report.summary || { fail: 0, warn: 0, info: 0, total: 0 };
  const gate = report.gate ? `GATE: ${report.gate.status}${report.gate.open ? ` ${report.gate.open}` : ''}` : '';
  const lines = [];
  lines.push('# frontend-design-skills report');
  lines.push('');
  lines.push(`- Generated: ${report.generatedAt || new Date().toISOString()}`);
  lines.push(`- Target: ${report.target || '(none)'}`);
  lines.push(`- Engine: ${report.engine || '(none)'}`);
  lines.push(`- Niche: ${report.niche || '(none)'}`);
  if (report.scope) lines.push(`- Scope: ${report.scope}`);
  if (gate) lines.push(`- ${gate}`);
  lines.push(`- Findings: ${summary.fail || 0} FAIL, ${summary.warn || 0} WARN, ${summary.info || 0} INFO, ${summary.total || 0} total`);
  lines.push('');
  if (report.viewports?.length) {
    lines.push('## Viewports');
    lines.push('');
    lines.push('| Viewport | FAIL | WARN | Notes |');
    lines.push('| --- | --- | --- | --- |');
    for (const viewport of report.viewports) {
      const counts = viewport.counts || {};
      lines.push(`| ${viewport.width}x${viewport.height} | ${counts.fail || 0} | ${counts.warn || 0} | ${viewport.error ? escapeHtml(viewport.error) : `${viewport.facts?.sections || 0} sections, ${viewport.facts?.images || 0} images`} |`);
    }
    lines.push('');
  }
  lines.push('## Findings');
  lines.push('');
  if (!report.findings?.length) {
    lines.push('No findings.');
  } else {
    lines.push('| Severity | Rule | Finding | Where |');
    lines.push('| --- | --- | --- | --- |');
    for (const item of [...report.findings].sort((a, b) => (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9))) {
      const detail = [item.message, item.detail, item.selector ? `\`${item.selector}\`` : '', item.fix ? `Fix: ${item.fix}` : ''].filter(Boolean).join('<br>');
      lines.push(`| ${item.severity} | ${item.rule} | ${detail.replace(/\|/g, '\\|')} | ${item.where || ''} |`);
    }
  }
  if (report.waivers?.length) {
    lines.push('');
    lines.push('## Waivers');
    lines.push('');
    for (const waiver of report.waivers) {
      lines.push(`- ${waiver.check} on \`${waiver.target}\`: ${waiver.reason}`);
    }
  }
  if (report.screenshots?.length) {
    lines.push('');
    lines.push('## Screenshots');
    lines.push('');
    for (const shot of report.screenshots) {
      lines.push(`- ${path.basename(shot)}`);
    }
  }
  lines.push('');
  return lines.join('\n');
}

export function renderHtml(report) {
  const summary = report.summary || { fail: 0, warn: 0, info: 0, total: 0 };
  const gate = report.gate ? `GATE: ${report.gate.status}${report.gate.open ? ` ${report.gate.open}` : ''}` : '';
  const screenshots = (report.screenshots || []).map(shot => {
    const relative = path.relative(path.dirname(report.reportFile || process.cwd()), shot).split(path.sep).join('/');
    return `<figure><a href="${escapeHtml(relative)}"><img src="${escapeHtml(relative)}" alt="${escapeHtml(path.basename(shot))}" loading="lazy"></a><figcaption>${escapeHtml(path.basename(shot))}</figcaption></figure>`;
  }).join('');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>frontend-design-skills report</title>
<style>
  :root { color-scheme: light; --bg:#f7f7f5; --surface:#fff; --ink:#161616; --muted:#666; --line:#deded8; --fail:#b42318; --warn:#9a6700; --pass:#0f7b45; }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--bg); color:var(--ink); font:16px/1.55 ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; }
  header, main { width:min(100% - 48px, 1180px); margin-inline:auto; }
  header { padding:48px 0 24px; border-bottom:1px solid var(--line); }
  h1 { margin:0 0 8px; font-size:clamp(28px,4vw,44px); letter-spacing:-0.035em; }
  .meta { color:var(--muted); display:flex; flex-wrap:wrap; gap:8px 20px; font-size:14px; }
  .gate { display:inline-block; margin-top:20px; padding:10px 16px; border-radius:6px; background:var(--ink); color:#fff; font:600 14px/1 ui-monospace, monospace; letter-spacing:.04em; }
  .gate.fail { background:var(--fail); }
  .gate.warn { background:var(--warn); }
  .gate.pass { background:var(--pass); }
  .stats { display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:12px; margin:24px 0 0; }
  .stat { background:var(--surface); border:1px solid var(--line); border-radius:8px; padding:16px; }
  .stat b { display:block; font-size:28px; letter-spacing:-0.03em; }
  .stat span { color:var(--muted); font-size:13px; }
  main { padding:32px 0 80px; }
  h2 { margin:40px 0 12px; font-size:22px; letter-spacing:-0.02em; }
  table { width:100%; border-collapse:collapse; background:var(--surface); border:1px solid var(--line); font-size:14px; }
  th { text-align:left; padding:10px 12px; border-bottom:1px solid var(--line); font-size:12px; text-transform:uppercase; letter-spacing:.08em; color:var(--muted); }
  td { vertical-align:top; padding:12px; border-bottom:1px solid var(--line); }
  tr:last-child td { border-bottom:0; }
  .badge { display:inline-block; padding:3px 7px; border-radius:4px; font:600 11px/1.2 ui-monospace, monospace; }
  .fail .badge { background:#fee4e2; color:var(--fail); }
  .warn .badge { background:#fdf0c2; color:var(--warn); }
  .waived .badge { background:#e6e6e1; color:#555; }
  .info .badge { background:#e8f0fe; color:#1a4be0; }
  .rule, .where { font:12px/1.4 ui-monospace, monospace; white-space:nowrap; color:var(--muted); }
  .detail { margin-top:4px; color:var(--muted); font-size:13px; }
  code { font:12px/1.4 ui-monospace, monospace; background:#f1f1ec; padding:1px 4px; border-radius:3px; }
  .fix { margin-top:6px; font-size:13px; }
  .fix span { font:600 10px/1 ui-monospace, monospace; text-transform:uppercase; letter-spacing:.08em; color:var(--pass); margin-right:4px; }
  .shots { display:grid; grid-template-columns:repeat(auto-fill,minmax(240px,1fr)); gap:16px; }
  .shots figure { margin:0; background:var(--surface); border:1px solid var(--line); border-radius:8px; overflow:hidden; }
  .shots img { display:block; width:100%; height:auto; }
  .shots figcaption { padding:8px 10px; font:11px/1.3 ui-monospace, monospace; color:var(--muted); border-top:1px solid var(--line); }
  .empty { padding:24px; background:var(--surface); border:1px solid var(--line); border-radius:8px; }
  @media (max-width:640px) { .rule, .where { white-space:normal; } th, td { padding:8px; } }
</style>
</head>
<body>
<header>
  <h1>frontend-design-skills report</h1>
  <div class="meta">
    <span>${escapeHtml(report.target || '(no target)')}</span>
    <span>${escapeHtml(report.engine || '')}</span>
    <span>${escapeHtml(report.niche || '')}</span>
    <span>${escapeHtml(report.generatedAt || new Date().toISOString())}</span>
  </div>
  ${gate ? `<div class="gate ${severityClass(report.gate.status)}">${escapeHtml(gate)}</div>` : ''}
  <div class="stats">
    <div class="stat"><b>${summary.fail || 0}</b><span>FAIL</span></div>
    <div class="stat"><b>${summary.warn || 0}</b><span>WARN</span></div>
    <div class="stat"><b>${summary.info || 0}</b><span>INFO</span></div>
    <div class="stat"><b>${report.viewports?.length || 0}</b><span>viewports</span></div>
  </div>
</header>
<main>
  <h2>Findings</h2>
  ${report.findings?.length ? `<table><thead><tr><th>Severity</th><th>Rule</th><th>Finding</th><th>Where</th></tr></thead><tbody>${findingRows(report.findings)}</tbody></table>` : '<div class="empty">No findings.</div>'}
  ${screenshots ? `<h2>Screenshots</h2><div class="shots">${screenshots}</div>` : ''}
  ${report.waivers?.length ? `<h2>Waivers</h2><ul>${report.waivers.map(waiver => `<li><code>${escapeHtml(waiver.check)}</code> on <code>${escapeHtml(waiver.target)}</code>: ${escapeHtml(waiver.reason)}</li>`).join('')}</ul>` : ''}
  ${report.errors?.length ? `<h2>Runner notes</h2><ul>${report.errors.map(error => `<li><code>${escapeHtml(error)}</code></li>`).join('')}</ul>` : ''}
</main>
</body>
</html>
`;
}

export function writeReport(report, outDir) {
  ensureDir(outDir);
  const enriched = { ...report, generatedAt: report.generatedAt || new Date().toISOString() };
  const jsonFile = path.join(outDir, 'report.json');
  const htmlFile = path.join(outDir, 'report.html');
  const mdFile = path.join(outDir, 'report.md');
  enriched.reportFile = htmlFile;
  fs.writeFileSync(jsonFile, JSON.stringify(enriched, null, 2) + '\n');
  fs.writeFileSync(htmlFile, renderHtml(enriched));
  fs.writeFileSync(mdFile, renderMarkdown(enriched));
  return { json: jsonFile, html: htmlFile, md: mdFile };
}

export function parseArgs(argv) {
  const args = { run: '', report: '', out: '', json: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--run') args.run = argv[++i];
    else if (a === '--report') args.report = argv[++i];
    else if (a === '--out') args.out = argv[++i];
    else if (a === '--json') args.json = true;
    else if (a === '--help' || a === '-h') args.help = true;
    else if (!a.startsWith('--')) args.report = a;
  }
  return args;
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isCli) {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log('usage: report.mjs --run <run-dir> | --report <report.json> [--out <dir>] [--json]');
    process.exit(0);
  }
  const source = args.report || (args.run ? path.join(args.run, 'report.json') : '');
  if (!source) {
    console.error('report: pass --run <dir> or --report <file>');
    process.exit(2);
  }
  const report = readJson(path.resolve(source), null);
  if (!report) {
    console.error(`report: cannot read ${source}`);
    process.exit(2);
  }
  const outDir = path.resolve(args.out || path.dirname(path.resolve(source)));
  const files = writeReport(report, outDir);
  if (args.json) console.log(JSON.stringify(files, null, 2));
  else {
    console.log(`wrote ${files.json}`);
    console.log(`wrote ${files.html}`);
    console.log(`wrote ${files.md}`);
  }
}
