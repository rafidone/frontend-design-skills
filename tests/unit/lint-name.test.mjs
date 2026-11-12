import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const linter = path.join(root, 'skills/frontend-design-skills/scripts/lint-name.mjs');
const TOKEN = String.fromCharCode(116, 97, 115, 116, 101);

function run(target) {
  return spawnSync(process.execPath, [linter, target], { encoding: 'utf8' });
}

test('the repository passes the clean-room name linter', () => {
  const result = run(root);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /lint-name: PASS \(\d+ text files scanned\)/);
});

test('the linter rejects a prohibited term in content, names and directories', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fds-lint-'));
  try {
    fs.writeFileSync(path.join(dir, 'notes.md'), `The word ${TOKEN} must not appear.\n`);
    const content = run(dir);
    assert.equal(content.status, 1);
    assert.match(content.stderr, /prohibited token/);
    assert.match(content.stderr, /notes\.md:1/);

    fs.rmSync(path.join(dir, 'notes.md'));
    fs.mkdirSync(path.join(dir, `${TOKEN}-folder`));
    const directory = run(dir);
    assert.equal(directory.status, 1);
    assert.match(directory.stderr, /directory/);

    fs.rmdirSync(path.join(dir, `${TOKEN}-folder`));
    fs.writeFileSync(path.join(dir, `${TOKEN}-file.txt`), 'clean content');
    const filename = run(dir);
    assert.equal(filename.status, 1);
    assert.match(filename.stderr, /filename/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('the linter rejects a prohibited term case-insensitively', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fds-lint-'));
  try {
    fs.writeFileSync(path.join(dir, 'readme.md'), TOKEN.toUpperCase());
    const result = run(dir);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /readme\.md:1/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('the linter ignores binary files and git metadata', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fds-lint-'));
  try {
    fs.mkdirSync(path.join(dir, '.git'));
    fs.writeFileSync(path.join(dir, '.git', `${TOKEN}-ref`), TOKEN);
    fs.writeFileSync(path.join(dir, 'photo.webp'), Buffer.from(`RIFF${TOKEN}`));
    const result = run(dir);
    assert.equal(result.status, 0, result.stderr);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
