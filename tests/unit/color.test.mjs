import test from 'node:test';
import assert from 'node:assert/strict';
import { parseColor, relativeLuminance, contrastRatio, hueSaturation, isViolet, generateScale } from '../../skills/frontend-design-skills/scripts/lib/color.mjs';

test('parseColor reads hex, short hex, alpha and rgb()', () => {
  assert.deepEqual(parseColor('#1a4be0'), { r: 26, g: 75, b: 224, a: 1 });
  assert.deepEqual(parseColor('#fff'), { r: 255, g: 255, b: 255, a: 1 });
  assert.ok(Math.abs(parseColor('#00000080').a - 0.502) < 0.001);
  assert.deepEqual(parseColor('rgb(10 20 30)'), { r: 10, g: 20, b: 30, a: 1 });
  assert.deepEqual(parseColor('rgba(10, 20, 30, 0.5)'), { r: 10, g: 20, b: 30, a: 0.5 });
  assert.equal(parseColor('not-a-colour'), null);
  assert.equal(parseColor(''), null);
});

test('relative luminance is bounded and ordered', () => {
  assert.equal(relativeLuminance('#ffffff'), 1);
  assert.equal(relativeLuminance('#000000'), 0);
  assert.ok(relativeLuminance('#777777') > 0.1 && relativeLuminance('#777777') < 0.3);
  assert.equal(relativeLuminance('nope'), null);
});

test('contrastRatio matches WCAG reference values', () => {
  assert.equal(contrastRatio('#000000', '#ffffff'), 21);
  assert.equal(contrastRatio('#ffffff', '#ffffff'), 1);
  assert.equal(contrastRatio('#777777', '#ffffff'), 4.48);
  assert.equal(contrastRatio('#767676', '#ffffff'), 4.54);
  assert.equal(contrastRatio('not-a-colour', '#ffffff'), null);
});

test('hueSaturation finds neutral and saturated colours', () => {
  const grey = hueSaturation('#777777');
  assert.equal(grey.saturation, 0);
  const blue = hueSaturation('#1a4be0');
  assert.ok(blue.hue >= 220 && blue.hue <= 235);
  assert.ok(blue.saturation > 0.7);
});

test('isViolet catches violet accents and leaves blue and green alone', () => {
  assert.equal(isViolet('#7c3aed'), true);
  assert.equal(isViolet('#a855f7'), true);
  assert.equal(isViolet('#a78bfa'), true);
  assert.equal(isViolet('#1a4be0'), false);
  assert.equal(isViolet('#4f46e5'), false);
  assert.equal(isViolet('#0f7b45'), false);
  assert.equal(isViolet('#777777'), false);
  assert.equal(isViolet('nope'), false);
});

test('generateScale returns ten ordered steps for a valid colour', () => {
  const scale = generateScale('#1a4be0');
  assert.ok(scale);
  const keys = Object.keys(scale).map(Number);
  assert.deepEqual(keys, [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]);
  for (const value of Object.values(scale)) assert.match(value, /^hsl\(\d+ \d+% \d+(\.\d+)?%\)$/);
  assert.equal(generateScale('not-a-colour'), null);
});
