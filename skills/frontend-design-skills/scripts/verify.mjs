#!/usr/bin/env node
// The finish gate. Runs the browser audits, applies waivers, tracks fix rounds
// and writes a run directory with report.json, report.html and screenshots.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInspection } from './inspect.mjs';
import { writeReport } from './report.mjs';
import { readJson, writeJson, ensureDir } from './lib/json.mjs';
import { applyWaivers, summarize, SEVERITY } from './lib/rules.mjs';

const STRUCTURAL = new Set(['LAY-01', 'LAY-04', 'A11Y-03', 'SYS-04', 'COL-01']);
const MAX_WAIVERS = 5;

export function parseArgs(argv) {
  const args = {
    target: '.',
    mode: 'quick',
    start: false,
    fresh: false,
    rounds: 3,
    niche: 'software',
    category: '',
    primary: '',
    root: '',
    state: '',
    waivers: '',
    done: false,
    json: false,
    shots: true,
    engine: 'auto',
    quiet: false
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--url' || a === '--start') {
      args.start = true;
      if (argv[i + 1] && !argv[i + 1].startsWith('--')) args.target = argv[++i];
    } else if (a === '--target') args.target = argv[++i];
    else if (a === '--quick') args.mode = 'quick';
    else if (a === '--full') args.mode = 'full';
    else if (a === '--new') args.fresh = true;
    else if (a === '--rounds') args.rounds = Math.max(1, Number(argv[++i]) || 3);
    else if (a === '--kind' || a === '--niche') args.niche = argv[++i];
    else if (a === '--category') args.category = argv[++i];
    else if (a === '--primary') args.primary = argv[++i];
    else if (a === '--root') args.root = argv[++i];
    else if (a === '--state') args.state = argv[++i];
    else if (a === '--waivers') args.waivers = argv[++i];
    else if (a === '--done') args.done = true;
    else if (a === '--json') args.json = true;
    else if (a === '--no-shots') args.shots = false;
    else if (a === '--engine') args.engine = argv[++i];
    else if (a === '--quiet') args.quiet = true;
    else if (a === '--help' || a === '-h') args.help = true;
    else if (!a.startsWith('--')) args.target = a;
  }
  return args;
}

function targetRoot(target) {
  if (/^https?:\/\//i.test(target)) return process.cwd();
  const resolved = path.resolve(target);
  try {
    return fs.statSync(resolved).isDirectory() ? resolved : path.dirname(resolved);
  } catch {
    return path.resolve(path.dirname(target) || '.');
  }
}

function stateDirFor(args) {
  if (args.state) return path.resolve(args.state);
  return path.join(targetRoot(args.target), '.frontend-design-skills');
}

function stamp() {
  const now = new Date();
  const pad = value => String(value).padStart(2, '0');
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

function uniqueRunDir(base) {
  let dir = path.join(base, stamp());
  let n = 1;
  while (fs.existsSync(dir)) dir = path.join(base, `${stamp()}-${n++}`);
  ensureDir(dir);
  return dir;
}

function loadWaivers(args, stateDir) {
  const file = args.waivers ? path.resolve(args.waivers) : path.join(stateDir, 'waivers.json');
  const data = readJson(file, []);
  const list = Array.isArray(data) ? data : Array.isArray(data?.waivers) ? data.waivers : [];
  const accepted = [];
  const rejected = [];
  for (const waiver of list) {
    const check = String(waiver.check || waiver.rule || '');
    const target = String(waiver.target || waiver.selector || '');
    const reason = String(waiver.reason || '').trim();
    if (!check || !target || target.length < 3) rejected.push({ ...waiver, why: 'check and target are required' });
    else if (reason.length < 12) rejected.push({ ...waiver, why: 'reason must be at least 12 characters' });
    else if (STRUCTURAL.has(check)) rejected.push({ ...waiver, why: `${check} is structural and cannot be waived` });
    else if (accepted.length >= MAX_WAIVERS) rejected.push({ ...waiver, why: `at most ${MAX_WAIVERS} waivers are allowed` });
    else accepted.push({ check, target, reason });
  }
  return { file, accepted, rejected };
}

function gateLine(status, open = 0) {
  if (status === 'PASS' || status === 'DONE') return open ? `GATE: ${status} ${open}` : `GATE: ${status}`;
  if (status === 'SETUP' || status === 'ERROR') return `GATE: ${status}`;
  return `GATE: ${status} ${open}`;
}

export async function runGate(options = {}) {
  const args = {
    target: '.', mode: 'quick', start: false, fresh: false, rounds: 3, niche: 'software',
    category: '', primary: '', root: '', state: '', waivers: '', done: false, json: false,
    shots: true, engine: 'auto', quiet: false, ...options
  };
  args.target = args.target || '.';
  const stateDir = stateDirFor(args);
  ensureDir(stateDir);
  const gateFile = path.join(stateDir, 'gate.json');
  const buildFile = path.join(stateDir, 'build.json');
  const previous = readJson(gateFile, null);

  let gate;
  if (!previous || args.fresh || (args.start && ['PASS', 'DONE'].includes(previous.status))) {
    gate = {
      round: 0,
      maxRounds: args.rounds,
      status: 'SETUP',
      open: 0,
      target: args.target,
      kind: args.niche,
      category: args.category,
      primary: args.primary,
      startedAt: new Date().toISOString(),
      runs: []
    };
  } else {
    gate = {
      ...previous,
      target: args.target || previous.target,
      kind: args.niche || previous.kind,
      category: args.category || previous.category,
      primary: args.primary || previous.primary
    };
    if (args.fresh) gate.round = 0;
  }

  const waiverData = loadWaivers(args, stateDir);
  let inspection;
  try {
    const runDir = uniqueRunDir(path.join(stateDir, 'runs'));
    const shotsDir = path.join(runDir, 'screenshots');
    inspection = await runInspection({
      target: args.target,
      mode: args.mode,
      niche: gate.kind || args.niche,
      root: args.root,
      engine: args.engine,
      capture: args.shots,
      shots: args.shots ? shotsDir : '',
      quiet: true
    });
    const applied = applyWaivers(inspection.findings, waiverData.accepted);
    const findings = applied.findings;
    const summary = summarize(findings);
    const structuralFails = findings.filter(item => item.severity === SEVERITY.fail && STRUCTURAL.has(item.rule));
    const failCount = summary.fail;

    let status;
    if (args.done) {
      status = 'DONE';
    } else if (failCount === 0) {
      status = 'PASS';
    } else if (gate.round + 1 >= gate.maxRounds) {
      status = 'OPEN';
    } else {
      status = 'FAIL';
    }
    if (!['PASS', 'DONE'].includes(status)) gate.round += 1;
    gate.status = status;
    gate.open = ['PASS', 'DONE'].includes(status) ? 0 : failCount;
    gate.structuralFailures = structuralFails.length;
    gate.updatedAt = new Date().toISOString();
    gate.lastRun = path.relative(stateDir, runDir).split(path.sep).join('/');
    gate.runs = [...(gate.runs || []), gate.lastRun].slice(-50);

    const report = {
      ...inspection,
      findings,
      summary,
      gate: { ...gate },
      waivers: waiverData.accepted,
      rejectedWaivers: waiverData.rejected,
      unusedWaivers: applied.unused.map(index => waiverData.accepted[index]),
      scope: args.mode,
      stateDir,
      runDir
    };
    report.screenshots = inspection.screenshots;
    const files = writeReport(report, runDir);
    report.reportFiles = files;

    writeJson(gateFile, gate);
    writeJson(buildFile, {
      target: inspection.target,
      root: inspection.root,
      kind: gate.kind,
      category: gate.category,
      primary: gate.primary,
      lastRun: gate.lastRun,
      status,
      summary,
      engine: inspection.engine,
      reports: files,
      updatedAt: gate.updatedAt
    });

    return {
      status,
      open: gate.open,
      round: gate.round,
      maxRounds: gate.maxRounds,
      gate,
      report,
      files,
      runDir,
      line: gateLine(status, gate.open)
    };
  } catch (error) {
    gate.status = 'ERROR';
    gate.error = error.message;
    gate.updatedAt = new Date().toISOString();
    writeJson(gateFile, gate);
    return { status: 'ERROR', open: 0, gate, error: error.message, line: gateLine('ERROR') };
  }
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isCli) {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(`usage: verify.mjs [target] [--start] [--new] [--quick|--full] [--rounds 3]
       [--kind software] [--category "what is sold"] [--primary "main action"]
       [--state dir] [--waivers file] [--done] [--no-shots] [--json]`);
    process.exit(0);
  }
  const result = await runGate({ ...args, start: args.start || args.fresh });
  if (args.json) {
    console.log(JSON.stringify({
      gate: result.status,
      open: result.open,
      round: result.round,
      maxRounds: result.maxRounds,
      line: result.line,
      runDir: result.runDir,
      files: result.files,
      summary: result.report?.summary,
      error: result.error
    }, null, 2));
  }
  if (!args.json) {
    if (result.status === 'ERROR') {
      console.error(`GATE: ERROR ${result.error}`);
      process.exit(2);
    }
    const report = result.report;
    console.log(`frontend-design-skills gate`);
    console.log(`target: ${report.target}`);
    console.log(`engine: ${report.engine}`);
    console.log(`run:    ${path.relative(process.cwd(), result.runDir) || result.runDir}`);
    console.log(`round:  ${result.round}/${result.maxRounds}`);
    console.log('');
    const fails = report.findings.filter(item => item.severity === 'FAIL');
    const warns = report.findings.filter(item => item.severity === 'WARN');
    if (!fails.length) console.log('no blocking findings');
    for (const item of fails.slice(0, 12)) {
      console.log(`FAIL  ${item.rule.padEnd(8)} ${item.message}`);
      if (item.selector) console.log(`      at ${item.selector}`);
      if (item.fix) console.log(`      fix: ${item.fix}`);
    }
    if (fails.length > 12) console.log(`... ${fails.length - 12} more FAIL findings in report.json`);
    if (warns.length) console.log(`${warns.length} warning(s) recorded`);
    for (const waiver of report.rejectedWaivers || []) console.log(`waiver rejected: ${waiver.check} ${waiver.target}: ${waiver.why}`);
    console.log('');
    console.log(`report: ${path.relative(process.cwd(), report.reportFiles.html) || report.reportFiles.html}`);
    console.log(result.line);
  }
  process.exit(result.status === 'PASS' || result.status === 'DONE' ? 0 : result.status === 'ERROR' ? 2 : 1);
}
