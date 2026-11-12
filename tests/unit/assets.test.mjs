import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { verifyManifest, creditsPage } from '../../skills/frontend-design-skills/scripts/assets.mjs';
import { imageSize } from '../../skills/frontend-design-skills/scripts/lib/image.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const skillRoot = path.resolve(here, '../../skills/frontend-design-skills');
const manifestFile = path.join(skillRoot, 'assets/photos/manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));

test('the shipped photo manifest verifies every checksum, size and dimension', () => {
  const result = verifyManifest({ manifest: manifestFile });
  assert.equal(result.ok, true, result.problems.join('\n'));
  assert.equal(result.assets.length, manifest.assets.length);
  assert.ok(result.assets.length >= 6);
  for (const asset of result.assets) {
    assert.equal(asset.problems.length, 0, `${asset.id}: ${asset.problems.join(', ')}`);
    assert.ok(asset.dimensions.width > 0);
    assert.ok(asset.dimensions.height > 0);
    assert.equal(asset.dimensions.format, 'webp');
  }
});

test('a corrupted checksum is reported instead of silently passing', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fdm-assets-'));
  try {
    const first = manifest.assets[0];
    fs.copyFileSync(path.join(skillRoot, 'assets/photos', first.path), path.join(dir, first.path));
    const broken = {
      assets: [{ ...first, sha256: '0'.repeat(64) }]
    };
    const file = path.join(dir, 'manifest.json');
    fs.writeFileSync(file, JSON.stringify(broken));
    const result = verifyManifest({ manifest: file });
    assert.equal(result.ok, false);
    assert.ok(result.problems.some(problem => /sha256 mismatch/.test(problem)));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('creditsPage records every source, author and licence', () => {
  const html = creditsPage(manifestFile, { site: 'Unit Site' });
  assert.match(html, /^<!doctype html>/);
  assert.match(html, /Unit Site/);
  assert.match(html, /Photography and asset credits/);
  for (const asset of manifest.assets) {
    assert.ok(html.includes(asset.id), `missing ${asset.id}`);
    assert.ok(html.includes(asset.author), `missing author for ${asset.id}`);
    assert.ok(html.includes(asset.license), `missing licence for ${asset.id}`);
  }
  assert.match(html, /Back to the site/);
});

test('imageSize reads WebP, PNG and JPEG headers without dependencies', () => {
  const photo = fs.readFileSync(path.join(skillRoot, 'assets/photos', manifest.assets[0].path));
  const webp = imageSize(photo, '.webp');
  assert.deepEqual(webp, {
    width: manifest.assets[0].width,
    height: manifest.assets[0].height,
    format: 'webp',
    variant: webp.variant
  });
  assert.equal(webp.variant, 'VP8');

  const png = Buffer.alloc(24);
  png.write('PNG', 1, 'ascii');
  png.writeUInt32BE(320, 16);
  png.writeUInt32BE(180, 20);
  assert.deepEqual(imageSize(png, 'png'), { width: 320, height: 180, format: 'png' });

  assert.equal(imageSize(Buffer.from('not an image'), 'gif'), null);
});

test('a project manifest resolves site-relative photo paths without --root', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fdm-site-assets-'));
  try {
    const first = manifest.assets[0];
    const photoDir = path.join(dir, 'assets/photos');
    fs.mkdirSync(photoDir, { recursive: true });
    fs.copyFileSync(path.join(skillRoot, 'assets/photos', first.path), path.join(photoDir, first.path));
    const file = path.join(photoDir, 'manifest.json');
    fs.writeFileSync(file, JSON.stringify({
      version: 1,
      assets: [{ ...first, path: `assets/photos/${first.path}` }]
    }));
    const result = verifyManifest({ manifest: file });
    assert.equal(result.ok, true, result.problems.join('\n'));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
