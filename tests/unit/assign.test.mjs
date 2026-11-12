import test from 'node:test';
import assert from 'node:assert/strict';
import { assign, loadLibraries } from '../../skills/frontend-design-skills/scripts/assign.mjs';
import { contrastRatio, isViolet } from '../../skills/frontend-design-skills/scripts/lib/color.mjs';
import { NICHE, HERO_PATTERNS } from '../../skills/frontend-design-skills/scripts/lib/rules.mjs';

const NICHES = ['software', 'devtool', 'gaming', 'hardware', 'hospitality', 'service'];

test('assignment is deterministic for the same niche and seed', () => {
  const a = assign({ niche: 'software', seed: 'unit-seed', useHistory: false });
  const b = assign({ niche: 'software', seed: 'unit-seed', useHistory: false });
  assert.equal(a.palette, b.palette);
  assert.equal(a.typePair, b.typePair);
  assert.equal(a.hero, b.hero);
  assert.equal(a.composition, b.composition);
  assert.equal(a.motionTier, b.motionTier);
});

test('different seeds can change the direction', () => {
  const first = assign({ niche: 'hardware', seed: 'seed-a', useHistory: false });
  const second = assign({ niche: 'hardware', seed: 'seed-b', useHistory: false });
  assert.ok(first.palette && second.palette);
  assert.notEqual(`${first.palette}/${first.typePair}/${first.hero}`, `${second.palette}/${second.typePair}/${second.hero}`);
});

test('every niche assigns a valid palette, pair and hero', () => {
  for (const niche of NICHES) {
    const result = assign({ niche, seed: `unit-${niche}`, useHistory: false });
    assert.ok(NICHE[niche], `missing niche config for ${niche}`);
    assert.ok(result.paletteData, `${niche} has no palette data`);
    assert.ok(result.typePairData, `${niche} has no type data`);
    assert.ok(result.hero, `${niche} has no hero`);
    assert.ok((HERO_BY_NICHE_HINT[niche] || HERO_PATTERNS).includes(result.hero), `${niche} received an unknown hero ${result.hero}`);
    assert.ok(result.rationale.length > 30);
    assert.equal(result.niche, niche);
  }
});

test('unknown niches fail loudly', () => {
  assert.throws(() => assign({ niche: 'spaceship' }), /unknown niche/);
});

test('every palette passes the contrast floor and avoids violet', () => {
  const { palettes } = loadLibraries();
  assert.ok(palettes.length >= 20);
  for (const palette of palettes) {
    const pairs = [
      ['ink', 'bg'],
      ['muted', 'bg'],
      ['accent', 'bg'],
      ['accentInk', 'accent'],
      ['bandInk', 'bandBg']
    ];
    for (const [foreground, background] of pairs) {
      const ratio = contrastRatio(palette[foreground], palette[background]);
      assert.ok(ratio >= 4.5, `${palette.id}: ${foreground} on ${background} is ${ratio}:1`);
    }
    assert.equal(isViolet(palette.accent), false, `${palette.id} uses a violet accent`);
  }
});

test('every type pairing declares display, text and mono roles', () => {
  const { typePairs } = loadLibraries();
  assert.ok(typePairs.length >= 20);
  for (const pair of typePairs) {
    assert.ok(pair.display?.family, `${pair.id} has no display family`);
    assert.ok(pair.text?.family, `${pair.id} has no text family`);
    assert.ok(pair.mono === null || pair.mono?.family, `${pair.id} has an invalid mono role`);
    assert.match(pair.googleFonts, /^https:\/\/fonts\.googleapis\.com\/css2\?/);
    assert.ok(!/family=Inter[:&]/.test(pair.googleFonts), `${pair.id} uses a banned generic face`);
  }
});

const HERO_BY_NICHE_HINT = {
  software: ['split', 'product', 'editorial', 'statement', 'centred'],
  devtool: ['split', 'product', 'editorial', 'statement', 'word'],
  gaming: ['film', 'photo', 'collage', 'statement', 'word'],
  hardware: ['product', 'editorial', 'photo', 'triptych', 'split'],
  hospitality: ['photo', 'editorial', 'collage', 'triptych', 'split'],
  service: ['split', 'editorial', 'photo', 'statement', 'centred']
};
