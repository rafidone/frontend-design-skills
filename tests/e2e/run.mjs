#!/usr/bin/env node
// End-to-end browser proof for the audit engine.
//
// The good fixture must pass every blocking rule at both the desktop and phone
// viewport. The bad fixture must trigger the rules it was built to break, which
// keeps the audits honest against false negatives as the rules evolve.

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { runInspection } from '../../skills/frontend-design-skills/scripts/inspect.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const fixtures = path.resolve(here, '..', 'fixtures');

const REQUIRED_BAD_RULES = [
  'LAY-01', // next section inside the first screen
  'LAY-04', // horizontal overflow
  'TYP-01', // 12px body copy
  'TYP-02', // unreadable measure
  'COL-01', // low contrast
  'MOT-03', // scroll snap
  'A11Y-01', // unlabeled field
  'A11Y-03', // skipped heading level
  'A11Y-04', // tiny tap target
  'A11Y-05', // missing alt
  'COP-01', // lorem ipsum
  'COP-03', // stock marketing phrase
  'AST-01' // image without provenance
];

function heading(text) {
  return `\n${text}\n${'-'.repeat(text.length)}`;
}

function logReport(label, report) {
  console.log(`${label}: engine=${report.engine} viewports=${report.viewports.map(v => `${v.width}x${v.height}`).join(', ')}`);
  console.log(`  summary: ${report.summary.fail} FAIL, ${report.summary.warn} WARN, ${report.summary.total} total`);
  for (const warning of report.warnings) console.log(`  note: ${warning}`);
}

async function main() {
  console.log('frontend-design-skills end-to-end browser test');
  console.log('fixtures:', fixtures);

  console.log(heading('good fixture'));
  const good = await runInspection({
    target: path.join(fixtures, 'good'),
    mode: 'quick',
    niche: 'software',
    quiet: true
  });
  logReport('good', good);
  for (const finding of good.findings) {
    console.log(`  ${finding.severity} ${finding.rule} ${finding.message} at ${finding.selector}`);
  }
  assert.equal(good.summary.fail, 0, `the good fixture must have zero blocking findings:\n${JSON.stringify(good.findings, null, 2)}`);
  assert.equal(good.summary.warn, 0, `the good fixture must have zero warnings:\n${JSON.stringify(good.findings, null, 2)}`);
  assert.ok(good.viewports.length >= 2, 'the good fixture should be checked at desktop and phone widths');

  console.log(heading('bad fixture'));
  const bad = await runInspection({
    target: path.join(fixtures, 'bad'),
    mode: 'quick',
    niche: 'software',
    quiet: true
  });
  logReport('bad', bad);
  const fired = new Set(bad.findings.map(finding => finding.rule));
  const missing = REQUIRED_BAD_RULES.filter(rule => !fired.has(rule));
  assert.equal(missing.length, 0, `the bad fixture did not trigger: ${missing.join(', ')}`);
  assert.ok(bad.summary.fail >= REQUIRED_BAD_RULES.length, `expected at least ${REQUIRED_BAD_RULES.length} distinct failing rules, saw ${bad.summary.fail}`);

  for (const rule of REQUIRED_BAD_RULES) {
    const finding = bad.findings.find(item => item.rule === rule);
    console.log(`  ${rule.padEnd(8)} ${finding.severity.padEnd(5)} ${finding.message}`);
  }

  console.log(heading('result'));
  console.log(`good fixture: ${good.summary.fail} FAIL, ${good.summary.warn} WARN`);
  console.log(`bad fixture: ${bad.summary.fail} FAIL, ${bad.summary.warn} WARN, ${REQUIRED_BAD_RULES.length} required rules fired`);
  console.log('E2E: PASS');
}

main().catch(error => {
  console.error('E2E: FAIL');
  console.error(error?.stack || error);
  process.exit(1);
});
