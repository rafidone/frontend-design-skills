import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { scaffold, STACKS } from '../../skills/frontend-design-skills/scripts/scaffold.mjs';

function tempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fdm-scaffold-'));
}

test('all declared stacks are exposed', () => {
  assert.deepEqual(STACKS, ['html', 'react', 'next', 'vue', 'svelte', 'astro', 'tailwind']);
});

test('the HTML adapter writes a themed, self-contained static site', () => {
  const dir = tempDir();
  try {
    const result = scaffold({
      stack: 'html',
      dir,
      niche: 'hospitality',
      seed: 'unit-site',
      name: 'Unit Cafe',
      palette: 'terracotta-clay',
      typePair: 'cormorant-karla',
      hero: 'photo'
    });

    assert.equal(result.stack, 'html');
    assert.equal(result.palette, 'terracotta-clay');
    assert.equal(result.typePair, 'cormorant-karla');

    const html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
    assert.match(html, /<title>Unit Cafe/);
    assert.match(html, /family=Cormorant\+Garamond/);
    assert.doesNotMatch(html, /family=DM\+Sans/);
    assert.match(html, /Unit Cafe/);
    assert.doesNotMatch(html, /Morrow/);
    assert.match(html, /brand__mark[^>]*>U</);
    assert.doesNotMatch(html, /Typefaces: Fraunces and DM Sans/);
    assert.match(html, /Typefaces: Cormorant Garamond and Karla/);
    assert.doesNotMatch(html, /<style>/i);

    const tokens = fs.readFileSync(path.join(dir, 'styles/tokens.css'), 'utf8');
    assert.match(tokens, /--font-display: "Cormorant Garamond"/);
    assert.match(tokens, /--font-sans: "Karla"/);
    assert.match(tokens, /--paper: #fbf5f0/);
    assert.match(tokens, /--brand: #a34024/);

    const direction = JSON.parse(fs.readFileSync(path.join(dir, '.frontend-design-skills/art-direction.json'), 'utf8'));
    assert.equal(direction.skill, 'frontend-design-skills');
    assert.equal(direction.stack, 'html');
    assert.equal(direction.niche, 'hospitality');
    assert.equal(direction.palette, 'terracotta-clay');
    assert.equal(direction.typePair, 'cormorant-karla');
    assert.equal(direction.hero, 'photo');
    assert.equal(direction.heroLayout, 'media');
    assert.match(direction.rationale, /Terracotta and clay/);
    assert.match(direction.rationale, /Cormorant and Karla/);
    assert.doesNotMatch(direction.rationale, /Paper and blueprint|Instrument and Archivo/);

    const readme = fs.readFileSync(path.join(dir, 'README.md'), 'utf8');
    assert.match(readme, /Palette: `terracotta-clay`/);
    assert.match(readme, /Type pairing: `cormorant-karla`/);
    assert.match(readme, /Hero archetype: `photo`/);
    assert.match(readme, /Hero layout: `media`/);

    assert.match(html, /<section class="hero hero--media hero--photo"/);
    assert.match(html, /<figure class="hero-photo">/);
    assert.match(html, /<img src="assets\/photos\//);

    for (const file of ['styles/base.css', 'styles/layout.css', 'styles/components.css', 'styles/motion.css', 'scripts/motion.js', 'scripts/system.js', 'scripts/forms.js', 'README.md']) {
      assert.ok(fs.existsSync(path.join(dir, file)), `missing ${file}`);
    }

    const photoManifest = JSON.parse(fs.readFileSync(path.join(dir, 'assets/photos/manifest.json'), 'utf8'));
    assert.equal(photoManifest.assets.length, 1);
    assert.ok(fs.existsSync(path.join(dir, photoManifest.assets[0].path)));
    assert.ok(fs.existsSync(path.join(dir, 'assets/icons/manifest.json')));
    assert.ok(fs.existsSync(path.join(dir, 'assets/diagrams/architecture-stack.html')));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('scaffold refuses to write into a non-empty directory without force', () => {
  const dir = tempDir();
  try {
    fs.writeFileSync(path.join(dir, 'keep.txt'), 'user work');
    assert.throws(() => scaffold({ stack: 'html', dir, name: 'Blocked' }), /target is not empty/);
    assert.equal(fs.readFileSync(path.join(dir, 'keep.txt'), 'utf8'), 'user work');
    assert.doesNotThrow(() => scaffold({ stack: 'html', dir, name: 'Allowed', force: true }));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('unknown stacks and palettes fail with a clear error', () => {
  const dir = tempDir();
  try {
    assert.throws(() => scaffold({ stack: 'flash', dir }), /unknown stack/);
    assert.throws(() => scaffold({ stack: 'html', dir, palette: 'not-a-palette' }), /unknown palette/);
    assert.throws(() => scaffold({ stack: 'html', dir, typePair: 'not-a-pair' }), /unknown type pairing/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('a split hero stays split and does not inject a media photograph', () => {
  const dir = tempDir();
  try {
    const result = scaffold({
      stack: 'html',
      dir,
      niche: 'software',
      seed: 'unit-split',
      name: 'Unit App',
      palette: 'navy-signal',
      typePair: 'schibsted-source',
      hero: 'split'
    });
    const html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
    assert.equal(result.direction.heroLayout, 'split');
    assert.match(html, /<section class="hero" id="top"/);
    assert.doesNotMatch(html, /hero--media/);
    assert.doesNotMatch(html, /<figure class="hero-photo">/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

function sourceFiles(dir) {
  const out = [];
  const walk = current => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === '.frontend-design-skills') continue;
        walk(full);
      } else if (/\.(html|css|js|jsx|vue|svelte|astro|json)$/.test(entry.name)) {
        out.push(full);
      }
    }
  };
  walk(dir);
  return out;
}

test('every adapter renders the media-hero layout it records', () => {
  for (const stack of STACKS) {
    const dir = tempDir();
    try {
      const result = scaffold({
        stack,
        dir,
        niche: 'hospitality',
        seed: `media-${stack}`,
        name: 'Media Test',
        hero: 'photo'
      });
      assert.equal(result.direction.heroLayout, 'media', `${stack} did not record the media layout`);
      const text = sourceFiles(dir).map(file => fs.readFileSync(file, 'utf8')).join('\n');
      assert.match(text, /hero--media hero--photo/, `${stack} did not render the media hero classes`);
      assert.match(text, /assets\/photos\/[a-z0-9-]+\.webp/, `${stack} did not reference a local photograph`);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }
});
