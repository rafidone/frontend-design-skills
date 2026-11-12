#!/usr/bin/env node
// Environment and installation health check.

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const here = path.dirname(fileURLToPath(import.meta.url));
const skillRoot = path.resolve(here, '..');
const json = process.argv.includes('--json');
const checks = [];

function check(name, ok, detail, required = false) {
  checks.push({ name, ok, detail, required });
}

const major = Number(process.versions.node.split('.')[0]);
check('node', major >= 22, `Node ${process.versions.node}${major >= 22 ? '' : ' (22+ required)'}`, true);

const chromeCandidates = [
  process.env.CHROME_PATH,
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/snap/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'
].filter(Boolean);
const chrome = chromeCandidates.find(p => { try { return fs.existsSync(p); } catch { return false; } });
check('chrome', Boolean(chrome), chrome || 'not found; set CHROME_PATH', true);

let playwright = '';
try {
  playwright = import.meta.resolve('playwright-core');
} catch { /* optional */ }
check('playwright', Boolean(playwright), playwright ? 'playwright-core available' : 'not installed (CDP fallback will be used)', false);

const ffmpeg = spawnSync('ffmpeg', ['-version'], { encoding: 'utf8' });
check('ffmpeg', ffmpeg.status === 0, ffmpeg.status === 0 ? 'available (optional image conversion)' : 'not found (optional)', false);

const requiredFiles = [
  'SKILL.md',
  'rules/00-house-rules.md',
  'references/browser-checks.md',
  'assets/starter/index.html',
  'scripts/verify.mjs'
];
for (const rel of requiredFiles) {
  check(`file:${rel}`, fs.existsSync(path.join(skillRoot, rel)), path.join(skillRoot, rel), true);
}

check('platform', ['linux', 'darwin', 'win32'].includes(process.platform), `${process.platform} ${os.release()}`, false);

const failed = checks.filter(c => c.required && !c.ok);
if (json) {
  console.log(JSON.stringify({ skillRoot, checks, ok: failed.length === 0 }, null, 2));
} else {
  console.log(`frontend-design-skills doctor\nskill: ${skillRoot}\n`);
  for (const c of checks) {
    console.log(`${c.ok ? 'PASS' : c.required ? 'FAIL' : 'WARN'}  ${c.name.padEnd(24)} ${c.detail}`);
  }
  console.log(`\n${failed.length ? `FAIL ${failed.length} required check(s)` : 'PASS environment ready'}`);
}
process.exit(failed.length ? 1 : 0);
