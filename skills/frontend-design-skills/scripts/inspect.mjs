#!/usr/bin/env node
// Browser inspection orchestrator.
//
// Serves a local target, launches one browser, runs every audit at the selected
// viewports, optionally writes screenshots, and prints or emits JSON findings.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveTarget } from './serve.mjs';
import { launchBrowser } from './lib/browser.mjs';
import { collectFacts, PERF_INIT } from './lib/dom.mjs';
import { finding, SEVERITY, RULES, summarize } from './lib/rules.mjs';
import { ensureDir } from './lib/json.mjs';

import * as layout from './audit/layout.mjs';
import * as visual from './audit/visual.mjs';
import * as typography from './audit/typography.mjs';
import * as motion from './audit/motion.mjs';
import * as a11y from './audit/a11y.mjs';
import * as perf from './audit/perf.mjs';
import * as copy from './audit/copy.mjs';
import * as assets from './audit/assets.mjs';

export const AUDITS = [layout, typography, visual, motion, a11y, perf, copy, assets];
export const VIEWPORTS = {
  quick: [
    { width: 1440, height: 900 },
    { width: 390, height: 844 }
  ],
  full: [
    { width: 1440, height: 900 },
    { width: 1280, height: 800 },
    { width: 1024, height: 768 },
    { width: 820, height: 1180 },
    { width: 768, height: 1024 },
    { width: 390, height: 844 },
    { width: 320, height: 568 }
  ]
};

const ERROR_INIT = `(() => {
  window.__fdmErrors = [];
  addEventListener('error', event => {
    window.__fdmErrors.push({ type: 'error', message: String(event.message || event.error || 'script error').slice(0, 300), at: Math.round(performance.now()) });
  });
  addEventListener('unhandledrejection', event => {
    window.__fdmErrors.push({ type: 'rejection', message: String(event.reason?.message || event.reason || 'unhandled rejection').slice(0, 300), at: Math.round(performance.now()) });
  });
})();`;

export function parseArgs(argv) {
  const args = {
    target: '.',
    mode: 'full',
    widths: null,
    json: false,
    shots: '',
    out: '',
    root: '',
    niche: 'software',
    engine: 'auto',
    capture: false,
    quiet: false
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--url' || a === '--target') args.target = argv[++i];
    else if (a === '--quick') args.mode = 'quick';
    else if (a === '--full') args.mode = 'full';
    else if (a === '--widths') args.widths = argv[++i];
    else if (a === '--json') args.json = true;
    else if (a === '--shots') { args.shots = argv[++i] || 'screenshots'; args.capture = true; }
    else if (a === '--capture') args.capture = true;
    else if (a === '--out') args.out = argv[++i];
    else if (a === '--root') args.root = argv[++i];
    else if (a === '--niche') args.niche = argv[++i];
    else if (a === '--engine') args.engine = argv[++i];
    else if (a === '--quiet') args.quiet = true;
    else if (a === '--help' || a === '-h') args.help = true;
    else if (!a.startsWith('--')) args.target = a;
  }
  if (args.widths) {
    args.mode = 'custom';
    args.viewports = args.widths.split(',').map(pair => {
      const [width, height] = pair.split('x').map(Number);
      return { width: width || 1440, height: height || 900 };
    });
  }
  return args;
}

function viewportsFor(args) {
  if (args.viewports) return args.viewports;
  return VIEWPORTS[args.mode] || VIEWPORTS.full;
}

async function captureShots(page, facts, outDir, viewport, options) {
  if (!options.capture) return [];
  const shots = [];
  const tag = `${viewport.width}`;
  const first = path.join(outDir, `first-screen-${tag}.png`);
  await page.screenshot({ path: first });
  shots.push(first);

  if (viewport.width === 1440 || viewport.width === 390) {
    const full = path.join(outDir, `full-page-${tag}.png`);
    await page.screenshot({ path: full, fullPage: true });
    shots.push(full);
  }

  if (viewport.width === 1440) {
    const sections = facts.sections.filter(section => section.rect.height > 80).slice(0, 24);
    for (let index = 0; index < sections.length; index++) {
      const section = sections[index];
      const file = path.join(outDir, `section-${String(index + 1).padStart(2, '0')}-${tag}.png`);
      try {
        await page.screenshot({
          path: file,
          clip: {
            x: 0,
            y: Math.max(0, section.rect.top),
            width: Math.min(viewport.width, Math.max(1, section.rect.width || viewport.width)),
            height: Math.min(4000, Math.max(1, section.rect.height))
          }
        });
        shots.push(file);
      } catch { /* a clip that leaves the surface is skipped */ }
    }
  }
  return shots;
}

export async function runInspection(options = {}) {
  const args = { capture: false, mode: 'quick', niche: 'software', engine: 'auto', quiet: true, ...options };
  const viewports = options.viewports || viewportsFor(args);
  const target = await resolveTarget(args.target, { root: args.root, cwd: options.cwd, port: options.port });
  const outDir = args.shots ? path.resolve(options.cwd || process.cwd(), args.shots) : '';
  if (outDir) ensureDir(outDir);

  const browser = await launchBrowser({ engine: args.engine, executablePath: options.executablePath });
  const all = [];
  const shots = [];
  const viewportResults = [];
  const errors = [];

  try {
    for (const viewport of viewports) {
      const page = await browser.newPage({
        width: viewport.width,
        height: viewport.height,
        initScripts: [PERF_INIT, ERROR_INIT]
      });
      try {
        await page.goto(target.url, { timeout: options.timeout || 30000 });
        const facts = await page.evaluate(collectFacts);
        const ctx = {
          page,
          facts,
          browser,
          width: viewport.width,
          height: viewport.height,
          viewport,
          niche: args.niche,
          url: target.url,
          root: target.root,
          mode: args.mode
        };
        const findings = [];
        for (const module of AUDITS) {
          try {
            const result = await module.audit(ctx);
            findings.push(...(result || []));
          } catch (error) {
            errors.push(`${module.id}@${viewport.width}: ${error.message}`);
          }
        }
        for (const runtimeError of facts.errors || []) {
          findings.push(finding('SYS-04', `Script error: ${runtimeError.message}`, {
            severity: SEVERITY.fail,
            selector: 'body',
            fix: 'Fix the browser error; a page is not finished while the console is red.',
            where: `${viewport.width}x${viewport.height}`
          }));
        }
        if (facts.document.scrollWidth > viewport.width + 1.5) {
          // Layout audit already reports LAY-04; no duplicate.
        }
        try {
          shots.push(...await captureShots(page, facts, outDir, viewport, args));
        } catch (error) {
          errors.push(`capture@${viewport.width}: ${error.message}`);
        }
        viewportResults.push({
          width: viewport.width,
          height: viewport.height,
          url: await page.url().catch(() => target.url),
          title: facts.document.title,
          counts: summarize(findings),
          facts: {
            sections: facts.sections.length,
            headings: facts.headings.length,
            images: facts.images.length,
            nodes: facts.document.nodes,
            scrollWidth: facts.document.scrollWidth,
            scrollHeight: facts.document.scrollHeight
          }
        });
        all.push(...findings);
      } catch (error) {
        errors.push(`viewport ${viewport.width}x${viewport.height}: ${error.message}`);
        viewportResults.push({ width: viewport.width, height: viewport.height, error: error.message, counts: { fail: 1, warn: 0, total: 1 } });
        all.push(finding('SYS-04', `The page failed to render at ${viewport.width}x${viewport.height}: ${error.message}`, {
          severity: SEVERITY.fail,
          selector: 'html',
          fix: 'Start the page server and verify the URL responds with HTML.',
          where: `${viewport.width}x${viewport.height}`
        }));
      } finally {
        await page.close().catch(() => {});
      }
    }
  } finally {
    await browser.close().catch(() => {});
    await target.close().catch(() => {});
  }

  // Merge repeated findings across viewports so a single defect is one row.
  const merged = [];
  const index = new Map();
  for (const item of all) {
    const key = `${item.rule}|${item.selector}|${item.message}`;
    if (!index.has(key)) {
      const copy = { ...item, whereAll: item.where ? [item.where] : [] };
      delete copy.where;
      index.set(key, copy);
      merged.push(copy);
    } else {
      const existing = index.get(key);
      if (item.where && !existing.whereAll.includes(item.where)) existing.whereAll.push(item.where);
      if (item.severity === SEVERITY.fail && existing.severity !== SEVERITY.fail) existing.severity = item.severity;
    }
  }
  for (const item of merged) item.where = item.whereAll.join(', ');

  return {
    target: target.url,
    root: target.root,
    engine: browser.engine,
    warnings: browser.warnings || [],
    mode: args.mode,
    niche: args.niche,
    viewports: viewportResults,
    findings: merged,
    summary: summarize(merged),
    errors,
    screenshots: shots,
    generatedAt: new Date().toISOString(),
    rules: RULES
  };
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isCli) {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(`usage: inspect.mjs [target] [--quick|--full] [--widths 1440x900,390x844]
       [--shots dir] [--out file.json] [--json] [--niche kind] [--engine auto|playwright|cdp]
       [--root dir] [--quiet]`);
    process.exit(0);
  }
  const report = await runInspection({
    target: args.target,
    mode: args.mode,
    viewports: args.viewports,
    capture: args.capture,
    shots: args.shots,
    niche: args.niche,
    engine: args.engine,
    root: args.root,
    quiet: args.quiet
  });
  if (args.out) {
    fs.mkdirSync(path.dirname(path.resolve(args.out)), { recursive: true });
    fs.writeFileSync(path.resolve(args.out), JSON.stringify(report, null, 2) + '\n');
  }
  if (args.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(`frontend-design-skills inspect`);
    console.log(`target: ${report.target}`);
    console.log(`engine: ${report.engine}`);
    for (const warning of report.warnings) console.log(`note:   ${warning}`);
    console.log('');
    for (const viewport of report.viewports) {
      const counts = viewport.counts || {};
      console.log(`${String(viewport.width).padStart(4)}x${String(viewport.height).padEnd(4)}  FAIL ${counts.fail || 0}  WARN ${counts.warn || 0}  ${viewport.error ? `ERROR ${viewport.error}` : ''}`);
    }
    console.log('');
    if (!report.findings.length) console.log('no findings');
    for (const item of report.findings) {
      const where = item.where ? ` [${item.where}]` : '';
      console.log(`${item.severity.padEnd(6)} ${item.rule.padEnd(8)} ${item.message}${where}`);
      if (item.selector) console.log(`       at ${item.selector}`);
      if (item.fix) console.log(`       fix: ${item.fix}`);
    }
    console.log('');
    console.log(`summary: ${report.summary.fail} FAIL, ${report.summary.warn} WARN, ${report.summary.info} INFO`);
    if (report.screenshots.length) console.log(`shots: ${report.screenshots.length} written`);
    for (const error of report.errors) console.log(`error: ${error}`);
  }
  process.exit(report.summary.fail > 0 ? 1 : 0);
}
