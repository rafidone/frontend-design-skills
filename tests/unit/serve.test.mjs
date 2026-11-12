import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { startServer, resolveTarget } from '../../skills/frontend-design-skills/scripts/serve.mjs';

function tempSite() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fdm-serve-'));
  fs.writeFileSync(path.join(dir, 'index.html'), '<!doctype html><title>Home</title><h1>Home</h1>');
  fs.mkdirSync(path.join(dir, 'guide'));
  fs.writeFileSync(path.join(dir, 'guide', 'index.html'), '<!doctype html><title>Guide</title>');
  fs.writeFileSync(path.join(dir, 'plain.html'), '<!doctype html><title>Plain</title>');
  fs.writeFileSync(path.join(dir, 'data.json'), '{"ok":true}');
  return dir;
}

function rawRequest(port, requestPath, method = 'GET') {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port, path: requestPath, method }, res => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks).toString('utf8') }));
    });
    req.on('error', reject);
    req.end();
  });
}

test('the static server serves index, directory indexes and typed files', async () => {
  const root = tempSite();
  const server = await startServer({ root });
  try {
    const home = await fetch(server.url);
    assert.equal(home.status, 200);
    assert.match(await home.text(), /<h1>Home<\/h1>/);
    assert.match(home.headers.get('content-type'), /text\/html/);

    const guide = await fetch(new URL('guide/', server.url));
    assert.equal(guide.status, 200);
    assert.match(await guide.text(), /<title>Guide<\/title>/);

    const plain = await fetch(new URL('plain', server.url));
    assert.equal(plain.status, 200);
    assert.match(await plain.text(), /<title>Plain<\/title>/);

    const json = await fetch(new URL('data.json', server.url));
    assert.equal(json.status, 200);
    assert.match(json.headers.get('content-type'), /application\/json/);
    assert.deepEqual(await json.json(), { ok: true });

    const missing = await fetch(new URL('missing.txt', server.url));
    assert.equal(missing.status, 404);
    assert.match(missing.headers.get('content-type'), /text\/plain/);
  } finally {
    await server.close();
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('the static server blocks path traversal outside its root', async () => {
  const parent = fs.mkdtempSync(path.join(os.tmpdir(), 'fdm-serve-'));
  const root = path.join(parent, 'site');
  fs.mkdirSync(root);
  fs.writeFileSync(path.join(root, 'index.html'), 'site');
  fs.writeFileSync(path.join(parent, 'secret.txt'), 'do not serve');
  const server = await startServer({ root });
  try {
    for (const requestPath of ['/../secret.txt', '/%2e%2e/secret.txt', '/..%2fsecret.txt']) {
      const response = await rawRequest(server.port, requestPath);
      assert.notEqual(response.status, 200, `${requestPath} leaked a file`);
      assert.doesNotMatch(response.body, /do not serve/);
    }
  } finally {
    await server.close();
    fs.rmSync(parent, { recursive: true, force: true });
  }
});

test('HEAD returns headers without a body and non-GET methods are rejected', async () => {
  const root = tempSite();
  const server = await startServer({ root });
  try {
    const head = await rawRequest(server.port, '/', 'HEAD');
    assert.equal(head.status, 200);
    assert.equal(head.body, '');
    assert.match(head.headers['content-type'], /text\/html/);

    const post = await rawRequest(server.port, '/', 'POST');
    assert.equal(post.status, 405);
  } finally {
    await server.close();
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('resolveTarget owns a server for directories and points at a single file', async () => {
  const root = tempSite();
  try {
    const directory = await resolveTarget(root);
    try {
      const response = await fetch(directory.url);
      assert.equal(response.status, 200);
      assert.equal(directory.root, root);
    } finally {
      await directory.close();
    }

    const fileTarget = await resolveTarget(path.join(root, 'plain.html'));
    try {
      const response = await fetch(fileTarget.url);
      assert.equal(response.status, 200);
      assert.match(await response.text(), /<title>Plain<\/title>/);
    } finally {
      await fileTarget.close();
    }

    const remote = await resolveTarget('https://example.com/');
    assert.equal(remote.url, 'https://example.com/');
    await remote.close();
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
