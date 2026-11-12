#!/usr/bin/env node
// Screenshot capture for visual review: first screen, full page, sections,
// hover and keyboard focus states.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveTarget } from './serve.mjs';
import { launchBrowser } from './lib/browser.mjs';
import { collectFacts, PERF_INIT } from './lib/dom.mjs';
import { ensureDir, writeJson } from './lib/json.mjs';

const DEFAULT_WIDTHS = [1440, 768, 390];

export function parseArgs(argv) {
  const args = { target: '.', out: 'screenshots', widths: '', niche: 'software', engine: 'auto', sections: true, hover: true, focus: true, root: '' };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--url' || a === '--target') args.target = argv[++i];
    else if (a === '--out') args.out = argv[++i];
    else if (a === '--widths') args.widths = argv[++i];
    else if (a === '--niche') args.niche = argv[++i];
    else if (a === '--engine') args.engine = argv[++i];
    else if (a === '--root') args.root = argv[++i];
    else if (a === '--no-sections') args.sections = false;
    else if (a === '--no-hover') args.hover = false;
    else if (a === '--no-focus') args.focus = false;
    else if (a === '--help' || a === '-h') args.help = true;
    else if (!a.startsWith('--')) args.target = a;
  }
  return args;
}

function widthsOf(args) {
  if (!args.widths) return DEFAULT_WIDTHS;
  return args.widths.split(',').map(value => Number(value.split('x')[0])).filter(Boolean);
}

export async function capture(options = {}) {
  const args = { out: 'screenshots', sections: true, hover: true, focus: true, niche: 'software', engine: 'auto', mode: 'quick', ...options };
  const widths = options.widths || widthsOf(args);
  const target = await resolveTarget(args.target, { root: args.root, cwd: options.cwd, port: options.port });
  const outDir = path.resolve(options.cwd || process.cwd(), args.out);
  ensureDir(outDir);
  const browser = await launchBrowser({ engine: args.engine, executablePath: options.executablePath });
  const shots = [];
  const manifest = { target: target.url, engine: browser.engine, generatedAt: new Date().toISOString(), screenshots: [] };

  const record = (file, kind, width, extra = {}) => {
    shots.push(file);
    manifest.screenshots.push({ file: path.relative(outDir, file).split(path.sep).join('/'), kind, width, ...extra });
  };

  try {
    for (const width of widths) {
      const height = width >= 1200 ? 900 : width >= 700 ? 1024 : 844;
      const page = await browser.newPage({ width, height, initScripts: [PERF_INIT] });
      try {
        await page.goto(target.url, { timeout: 30000 });
        const facts = await page.evaluate(collectFacts);

        const first = path.join(outDir, `first-screen-${width}.png`);
        await page.screenshot({ path: first });
        record(first, 'first-screen', width);

        const full = path.join(outDir, `full-page-${width}.png`);
        await page.screenshot({ path: full, fullPage: true });
        record(full, 'full-page', width);

        if (width === 1440 && args.sections) {
          const sections = facts.sections.filter(section => section.rect.height > 80).slice(0, 24);
          for (let index = 0; index < sections.length; index++) {
            const section = sections[index];
            const file = path.join(outDir, `section-${String(index + 1).padStart(2, '0')}-1440.png`);
            try {
              await page.screenshot({
                path: file,
                clip: {
                  x: 0,
                  y: Math.max(0, section.rect.top),
                  width: Math.min(1440, Math.max(1, section.rect.width || 1440)),
                  height: Math.min(4000, Math.max(1, section.rect.height))
                }
              });
              record(file, 'section', 1440, { heading: section.heading || '', selector: section.selector });
            } catch { /* skip sections that cannot be clipped */ }
          }
        }

        if (width === 1440 && args.hover) {
          const hoverables = await page.evaluate(() => {
            const out = [];
            for (const selector of ['.card', '.tile', 'button', '.btn', 'a[class*="card"]']) {
              const el = document.querySelector(selector);
              if (!el) continue;
              const rect = el.getBoundingClientRect();
              if (rect.width < 40 || rect.height < 20) continue;
              out.push({ selector, label: (el.innerText || el.className || selector).toString().trim().slice(0, 40) });
              if (out.length >= 3) break;
            }
            return out;
          }).catch(() => []);
          for (const item of hoverables) {
            const box = await page.hover(item.selector).catch(() => null);
            if (!box) continue;
            const pad = 12;
            const file = path.join(outDir, `hover-${item.selector.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '')}-1440.png`);
            try {
              await page.screenshot({
                path: file,
                clip: { x: Math.max(0, box.x - box.width / 2 - pad), y: Math.max(0, box.y - box.height / 2 - pad), width: box.width + pad * 2, height: box.height + pad * 2 }
              });
              record(file, 'hover', 1440, { selector: item.selector, label: item.label });
            } catch { /* ignore */ }
          }
        }

        if (width === 1440 && args.focus) {
          const focusSelector = await page.evaluate(() => {
            const el = document.querySelector('input:not([type="hidden"]), textarea, select, button, a[href]');
            if (!el) return '';
            if (el.id) return `#${CSS.escape(el.id)}`;
            el.setAttribute('data-fdm-focus-shot', 'true');
            return '[data-fdm-focus-shot="true"]';
          }).catch(() => '');
          if (focusSelector && await page.focus(focusSelector).catch(() => false)) {
            const box = await page.evaluate(selector => {
              const el = document.querySelector(selector);
              if (!el) return null;
              const rect = el.getBoundingClientRect();
              return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
            }, focusSelector).catch(() => null);
            if (box) {
              const pad = 16;
              const file = path.join(outDir, 'focus-1440.png');
              try {
                await page.screenshot({ path: file, clip: { x: Math.max(0, box.x - pad), y: Math.max(0, box.y - pad), width: box.width + pad * 2, height: box.height + pad * 2 } });
                record(file, 'focus', 1440, { selector: focusSelector });
              } catch { /* ignore */ }
            }
          }
        }
      } finally {
        await page.close().catch(() => {});
      }
    }
  } finally {
    await browser.close().catch(() => {});
    await target.close().catch(() => {});
  }

  writeJson(path.join(outDir, 'manifest.json'), manifest);
  return { outDir, shots, manifest, engine: browser.engine };
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isCli) {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log('usage: capture.mjs [target] [--out dir] [--widths 1440,768,390] [--no-hover] [--no-focus] [--no-sections]');
    process.exit(0);
  }
  const result = await capture({
    target: args.target,
    out: args.out,
    widths: widthsOf(args),
    niche: args.niche,
    engine: args.engine,
    root: args.root,
    sections: args.sections,
    hover: args.hover,
    focus: args.focus
  });
  console.log(`captured ${result.shots.length} screenshots in ${result.outDir} (${result.engine})`);
  for (const shot of result.shots) console.log(`  ${path.relative(result.outDir, shot)}`);
  console.log(`wrote ${path.join(result.outDir, 'manifest.json')}`);
}
