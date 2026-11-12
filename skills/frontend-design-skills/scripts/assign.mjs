#!/usr/bin/env node
// Deterministic art-direction assignment with optional history so consecutive
// builds do not converge on the same palette, pairing and hero.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readJson, writeJson, hashString } from './lib/json.mjs';
import { contrastRatio, isViolet } from './lib/color.mjs';
import { NICHE, HERO_PATTERNS, COMPOSITIONS } from './lib/rules.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const skillRoot = path.resolve(here, '..');
const PALETTES_FILE = path.join(skillRoot, 'assets/palettes/palettes.json');
const TYPES_FILE = path.join(skillRoot, 'assets/typography/type-pairs.json');

const HERO_BY_NICHE = {
  software: ['split', 'product', 'editorial', 'statement', 'centred'],
  devtool: ['split', 'product', 'editorial', 'word', 'statement'],
  ai: ['statement', 'split', 'editorial', 'word', 'collage'],
  gaming: ['film', 'photo', 'collage', 'statement', 'word'],
  hardware: ['product', 'editorial', 'photo', 'split', 'triptych'],
  commerce: ['photo', 'collage', 'editorial', 'split', 'triptych'],
  hospitality: ['photo', 'editorial', 'collage', 'triptych', 'split'],
  service: ['split', 'editorial', 'photo', 'statement', 'centred'],
  editorial: ['editorial', 'word', 'collage', 'statement', 'triptych']
};

const COMPOSITION_BY_NICHE = {
  software: ['product-ui-first', 'pair', 'strip', 'type-led'],
  devtool: ['product-ui-first', 'pair', 'strip'],
  ai: ['type-led', 'pair', 'strip', 'product-ui-first'],
  gaming: ['bleed', 'trio', 'editorial-index'],
  hardware: ['bleed', 'trio', 'tall-small'],
  commerce: ['trio', 'tall-small', 'editorial-index', 'pair'],
  hospitality: ['bleed', 'pair', 'editorial-index'],
  service: ['pair', 'trio', 'editorial-index'],
  editorial: ['editorial-index', 'trio', 'tall-small', 'type-led']
};

export function loadLibraries() {
  const palettes = readJson(PALETTES_FILE, null);
  const typePairs = readJson(TYPES_FILE, null);
  if (!Array.isArray(palettes) || !palettes.length) throw new Error(`missing palettes: ${PALETTES_FILE}`);
  if (!Array.isArray(typePairs) || !typePairs.length) throw new Error(`missing type pairings: ${TYPES_FILE}`);
  return { palettes, typePairs };
}

function scorePalette(palette, niche) {
  let score = 0;
  if (Array.isArray(palette.niches) && palette.niches.includes(niche)) score += 8;
  if (Array.isArray(palette.tags) && palette.tags.includes(niche)) score += 5;
  if (palette.note && palette.note.length > 40) score += 1;
  return score;
}

function scoreType(pair, niche) {
  let score = 0;
  if (Array.isArray(pair.niches) && pair.niches.includes(niche)) score += 8;
  if (Array.isArray(pair.tags) && pair.tags.includes(niche)) score += 3;
  return score;
}

function validPalette(palette) {
  if (!palette?.bg || !palette?.ink || !palette?.accent || !palette?.accentInk) return false;
  if (isViolet(palette.accent) || isViolet(palette.bg) || isViolet(palette.surface)) return false;
  const body = contrastRatio(palette.ink, palette.bg);
  const button = contrastRatio(palette.accentInk, palette.accent);
  return body !== null && body >= 4.5 && button !== null && button >= 4.5;
}

function validPair(pair) {
  if (!pair?.display?.family || !pair?.text?.family) return false;
  if (!pair.googleFonts || typeof pair.googleFonts !== 'string') return false;
  return true;
}

function pick(list, seed, salt) {
  if (!list.length) return null;
  const hash = hashString(`${seed}|${salt}`);
  const value = parseInt(hash.slice(0, 12), 16);
  return list[value % list.length];
}

function historyFor(history, niche) {
  if (!Array.isArray(history)) return [];
  return history.filter(item => item && item.niche === niche).slice(-8);
}

function filtered(candidates, history, key) {
  const recent = new Set(history.map(item => item[key]).filter(Boolean));
  const fresh = candidates.filter(item => !recent.has(item.id));
  return fresh.length ? fresh : candidates;
}

export function assign(options = {}) {
  const niche = options.niche || 'software';
  if (!NICHE[niche]) throw new Error(`unknown niche "${niche}". Use one of: ${Object.keys(NICHE).join(', ')}`);
  const seed = String(options.seed || `${Date.now()}-${process.pid}`);
  const { palettes, typePairs } = loadLibraries();
  const historyFile = options.history ? path.resolve(options.history) : '';
  const history = options.useHistory === false || !historyFile ? [] : readJson(historyFile, []);
  const recent = historyFor(history, niche);

  const paletteCandidates = palettes
    .filter(validPalette)
    .filter(palette => scorePalette(palette, niche) > 0 || !palette.niches || palette.niches.length === 0)
    .sort((a, b) => scorePalette(b, niche) - scorePalette(a, niche));
  const pairCandidates = typePairs
    .filter(validPair)
    .filter(pair => scoreType(pair, niche) > 0 || !pair.niches || pair.niches.length === 0)
    .sort((a, b) => scoreType(b, niche) - scoreType(a, niche));

  const palettePool = filtered(paletteCandidates, recent, 'palette');
  const pairPool = filtered(pairCandidates, recent, 'typePair');
  const palette = pick(palettePool, seed, `palette:${niche}`);
  const typePair = pick(pairPool, seed, `type:${niche}`);

  const heroPool = HERO_BY_NICHE[niche] || HERO_PATTERNS;
  const recentHeroes = new Set(recent.map(item => item.hero).filter(Boolean));
  const freshHeroes = heroPool.filter(hero => !recentHeroes.has(hero));
  const hero = pick(freshHeroes.length ? freshHeroes : heroPool, seed, `hero:${niche}`);
  const composition = pick(COMPOSITION_BY_NICHE[niche] || COMPOSITIONS, seed, `composition:${niche}`);
  const config = NICHE[niche];
  const motionTier = options.motion || config.motion;

  const result = {
    niche,
    nicheLabel: config.label,
    palette: palette.id,
    paletteData: palette,
    typePair: typePair.id,
    typePairData: typePair,
    hero,
    motionTier,
    density: config.density,
    composition,
    effects: config.effects,
    photoDirection: config.photos,
    rationale: [
      `${palette.name}: ${palette.note || 'a neutral ground with one accent.'}`,
      `${typePair.name || typePair.id}: ${typePair.suits || 'display and text roles are distinct.'}`,
      `Hero "${hero}" with a ${config.density} density, ${motionTier} motion tier and a ${composition} composition.`
    ].join(' '),
    seed,
    assignedAt: new Date().toISOString()
  };

  if (options.record && historyFile) {
    const next = Array.isArray(history) ? history : [];
    next.push({ niche, palette: result.palette, typePair: result.typePair, hero, composition, seed, at: result.assignedAt });
    writeJson(historyFile, next.slice(-100));
    result.recorded = historyFile;
  }

  return result;
}

export function parseArgs(argv) {
  const args = { niche: 'software', seed: '', history: '', record: false, json: false, out: '', motion: '', useHistory: true };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--niche' || a === '--kind' || a === '--page') args.niche = argv[++i];
    else if (a === '--seed') args.seed = argv[++i];
    else if (a === '--history') args.history = argv[++i];
    else if (a === '--record') args.record = true;
    else if (a === '--out') args.out = argv[++i];
    else if (a === '--json') args.json = true;
    else if (a === '--motion') args.motion = argv[++i];
    else if (a === '--no-history') args.useHistory = false;
    else if (a === '--help' || a === '-h') args.help = true;
  }
  return args;
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isCli) {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(`usage: assign.mjs --niche <kind> [--seed text] [--history file] [--record]
       [--motion T0|T1|T2] [--out file] [--json]`);
    console.log(`niches: ${Object.keys(NICHE).join(', ')}`);
    process.exit(0);
  }
  try {
    const history = args.history || path.join(process.cwd(), '.frontend-design-skills', 'history.json');
    const result = assign({ ...args, history, record: args.record });
    if (args.out) writeJson(path.resolve(args.out), result);
    if (args.json || !args.out) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(`niche:      ${result.nicheLabel}`);
      console.log(`palette:    ${result.palette} (${result.paletteData.name})`);
      console.log(`type pair:  ${result.typePair} (${result.typePairData.name || result.typePairData.display.family})`);
      console.log(`hero:       ${result.hero}`);
      console.log(`motion:     ${result.motionTier}`);
      console.log(`density:    ${result.density}`);
      console.log(`composition:${result.composition}`);
      console.log(`rationale:  ${result.rationale}`);
      if (result.recorded) console.log(`recorded:   ${result.recorded}`);
    }
  } catch (error) {
    console.error(`assign: ${error.message}`);
    process.exit(2);
  }
}
