import test from 'node:test';
import assert from 'node:assert/strict';
import { SEVERITY, RULES, BANNED_PHRASES, finding, summarize, applyWaivers } from '../../skills/frontend-design-skills/scripts/lib/rules.mjs';

test('every rule has an identifier, title and severity vocabulary', () => {
  assert.ok(Object.keys(RULES).length >= 30);
  for (const [id, title] of Object.entries(RULES)) {
    assert.match(id, /^[A-Z][A-Z0-9]+-\d{2}$/);
    assert.ok(title.length > 8);
  }
  assert.deepEqual(SEVERITY, { fail: 'FAIL', warn: 'WARN', info: 'INFO' });
  assert.ok(BANNED_PHRASES.length > 10);
});

test('finding defaults to a blocking finding and keeps its context', () => {
  const plain = finding('LAY-04', 'The page scrolls sideways.');
  assert.equal(plain.rule, 'LAY-04');
  assert.equal(plain.severity, 'FAIL');
  assert.equal(plain.message, 'The page scrolls sideways.');
  assert.equal(plain.selector, '');
  const detailed = finding('COL-01', 'Contrast is 2.1:1.', {
    severity: SEVERITY.warn,
    selector: 'p.lede',
    detail: 'A quiet sentence',
    fix: 'Raise the ink colour.',
    where: '390x844'
  });
  assert.equal(detailed.severity, 'WARN');
  assert.equal(detailed.selector, 'p.lede');
  assert.equal(detailed.where, '390x844');
});

test('summarize counts each severity and the total', () => {
  const findings = [
    finding('A', 'one', { severity: 'FAIL' }),
    finding('B', 'two', { severity: 'FAIL' }),
    finding('C', 'three', { severity: 'WARN' }),
    finding('D', 'four', { severity: 'INFO' })
  ];
  assert.deepEqual(summarize(findings), { pass: 0, warn: 1, fail: 2, info: 1, total: 4 });
  assert.deepEqual(summarize([]), { pass: 0, warn: 0, fail: 0, info: 0, total: 0 });
});

test('a valid waiver marks one matching finding and consumes the waiver', () => {
  const findings = [
    finding('COL-01', 'Contrast is 4.2:1.', { selector: 'a.nav-link', where: '1440x900' }),
    finding('COL-01', 'Contrast is 4.2:1.', { selector: 'a.footer-link', where: '1440x900' }),
    finding('LAY-04', 'Overflow.', { selector: 'main' })
  ];
  const waivers = [{
    check: 'COL-01',
    target: 'a.nav-link',
    reason: 'The legacy logo asset is a documented exception.'
  }];
  const result = applyWaivers(findings, waivers);
  assert.equal(result.findings[0].severity, 'WAIVED');
  assert.equal(result.findings[0].waiver, waivers[0].reason);
  assert.equal(result.findings[1].severity, 'FAIL');
  assert.equal(result.findings[2].severity, 'FAIL');
  assert.deepEqual(result.used, [0]);
  assert.deepEqual(result.unused, []);
});

test('waivers need a reason, a target and both must match', () => {
  const findings = [finding('COL-01', 'Contrast.', { selector: 'a.nav-link' })];
  const invalid = applyWaivers(findings, [
    { check: 'COL-01', target: 'a.nav-link', reason: 'too short' },
    { check: 'COL-01', target: '', reason: 'A sufficiently long reason here.' },
    { check: '', target: 'a.nav-link', reason: 'A sufficiently long reason here.' }
  ]);
  assert.equal(invalid.findings[0].severity, 'FAIL');
  assert.deepEqual(invalid.used, []);
  assert.deepEqual(invalid.unused, [0, 1, 2]);

  const mismatch = applyWaivers(findings, [{ check: 'LAY-04', target: 'main', reason: 'A sufficiently long reason here.' }]);
  assert.equal(mismatch.findings[0].severity, 'FAIL');
  assert.deepEqual(mismatch.unused, [0]);
});
