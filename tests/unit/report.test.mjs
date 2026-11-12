import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { renderMarkdown, renderHtml, writeReport } from '../../skills/frontend-design-skills/scripts/report.mjs';

function sampleReport() {
  return {
    target: 'http://127.0.0.1:4000/',
    engine: 'cdp',
    niche: 'service',
    generatedAt: '2026-11-12T10:00:00.000Z',
    gate: { status: 'FAIL', open: 2 },
    summary: { pass: 0, warn: 1, fail: 2, info: 0, total: 3 },
    viewports: [
      { width: 1440, height: 900, counts: { fail: 1, warn: 1 }, facts: { sections: 6, images: 1 } },
      { width: 390, height: 844, counts: { fail: 1, warn: 0 }, facts: { sections: 8, images: 1 } }
    ],
    findings: [
      {
        severity: 'FAIL',
        rule: 'COL-01',
        message: 'Text contrast is 3.1:1.',
        selector: 'p.lede',
        fix: 'Darken the ink token.',
        where: '1440x900'
      },
      {
        severity: 'WARN',
        rule: 'PERF-03',
        message: 'Six stylesheets load before paint.',
        selector: 'head link',
        where: '390x844'
      },
      {
        severity: 'FAIL',
        rule: 'A11Y-03',
        message: 'A heading skips a level.',
        detail: '<script>alert(1)</script>',
        where: '390x844'
      }
    ],
    waivers: [{ check: 'COL-01', target: 'p.lede', reason: 'Documented false positive in the legacy shell.' }],
    errors: []
  };
}

test('renderMarkdown reports the gate, viewports, findings and waivers', () => {
  const md = renderMarkdown(sampleReport());
  assert.match(md, /^# frontend-design-skills report/);
  assert.match(md, /GATE: FAIL 2/);
  assert.match(md, /1440x900/);
  assert.match(md, /390x844/);
  assert.match(md, /COL-01/);
  assert.match(md, /p\.lede/);
  assert.match(md, /Documented false positive/);
  assert.match(md, /Fix: Darken the ink token\./);
  assert.match(md, /2 FAIL, 1 WARN, 0 INFO, 3 total/);
});

test('renderMarkdown handles an empty run', () => {
  const md = renderMarkdown({
    target: 'http://localhost/',
    summary: { fail: 0, warn: 0, info: 0, total: 0 },
    findings: []
  });
  assert.match(md, /No findings\./);
  assert.doesNotMatch(md, /\| FAIL \|/);
});

test('renderHtml escapes finding text and includes the gate badge', () => {
  const html = renderHtml(sampleReport());
  assert.match(html, /^<!doctype html>/);
  assert.match(html, /GATE: FAIL 2/);
  assert.match(html, /class="gate fail"/);
  assert.match(html, /COL-01/);
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.doesNotMatch(html, /<script>alert\(1\)<\/script>/);
});

test('writeReport writes json, html and markdown beside each other', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fdm-report-'));
  try {
    const files = writeReport(sampleReport(), dir);
    for (const file of [files.json, files.html, files.md]) {
      assert.ok(fs.existsSync(file), `missing ${file}`);
    }
    const json = JSON.parse(fs.readFileSync(files.json, 'utf8'));
    assert.equal(json.gate.status, 'FAIL');
    assert.equal(json.summary.fail, 2);
    assert.match(fs.readFileSync(files.md, 'utf8'), /COL-01/);
    assert.match(fs.readFileSync(files.html, 'utf8'), /frontend-design-skills report/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
