#!/usr/bin/env node
// Static file server used by every browser check. Pages are always served over
// http://127.0.0.1 so module scripts, fonts, fetch and root-relative assets
// behave the way they do in production.

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const MIME = new Map(Object.entries({
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.cjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.wasm': 'application/wasm',
  '.pdf': 'application/pdf',
  '.xml': 'application/xml; charset=utf-8'
}));

function safeJoin(root, urlPath) {
  const clean = decodeURIComponent(urlPath.split('?')[0].split('#')[0]);
  const pieces = clean.split('/').filter(Boolean);
  if (pieces.some(p => p === '..' || p.includes('\0'))) return null;
  const full = path.resolve(root, ...pieces);
  const relative = path.relative(root, full);
  if (relative.startsWith('..') || path.isAbsolute(relative)) return null;
  return full;
}

function statFile(file) {
  try {
    const stat = fs.statSync(file);
    return stat.isFile() ? stat : null;
  } catch {
    return null;
  }
}

export function createStaticServer({ root = process.cwd(), host = '127.0.0.1' } = {}) {
  const rootDir = path.resolve(root);
  if (!fs.existsSync(rootDir)) throw new Error(`serve: root does not exist: ${rootDir}`);

  return http.createServer((req, res) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, { allow: 'GET, HEAD' });
      res.end('Method not allowed');
      return;
    }

    let file = safeJoin(rootDir, req.url || '/');
    if (!file) {
      res.writeHead(403, { 'content-type': 'text/plain; charset=utf-8' });
      res.end('Forbidden');
      return;
    }

    let stat = statFile(file);
    if (!stat && fs.existsSync(file) && fs.statSync(file).isDirectory()) {
      const index = path.join(file, 'index.html');
      if (statFile(index)) {
        file = index;
        stat = statFile(index);
      }
    }
    if (!stat && !path.extname(file)) {
      const asHtml = `${file}.html`;
      if (statFile(asHtml)) {
        file = asHtml;
        stat = statFile(asHtml);
      }
    }
    if (!stat) {
      const index = path.join(rootDir, 'index.html');
      // Single-page application fallback for extensionless routes only.
      if (!path.extname(file) && statFile(index)) {
        file = index;
        stat = statFile(index);
      }
    }
    if (!stat) {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }

    const ext = path.extname(file).toLowerCase();
    const headers = {
      'content-type': MIME.get(ext) || 'application/octet-stream',
      'content-length': stat.size,
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
      'access-control-allow-origin': '*'
    };
    if (req.method === 'HEAD') {
      res.writeHead(200, headers);
      res.end();
      return;
    }
    res.writeHead(200, headers);
    fs.createReadStream(file).pipe(res);
  });
}

export async function startServer({ root = process.cwd(), port = 0, host = '127.0.0.1' } = {}) {
  const server = createStaticServer({ root, host });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, resolve);
  });
  const address = server.address();
  const actualPort = typeof address === 'object' && address ? address.port : port;
  return {
    root: path.resolve(root),
    host,
    port: actualPort,
    url: `http://${host}:${actualPort}/`,
    server,
    close: () => new Promise(resolve => server.close(resolve))
  };
}

// Resolve a target argument (`.`/a directory/a file/an http URL) into a URL
// plus an optional owned server that must be closed by the caller.
export async function resolveTarget(target = '.', options = {}) {
  if (/^https?:\/\//i.test(target)) return { url: target, root: null, close: async () => {} };
  if (/^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?(\/|$)/i.test(target)) {
    const url = /^https?:\/\//i.test(target) ? target : `http://${target}`;
    return { url, root: null, close: async () => {} };
  }
  const resolved = path.resolve(options.cwd || process.cwd(), target || '.');
  if (!fs.existsSync(resolved)) throw new Error(`target does not exist: ${resolved}`);
  const stat = fs.statSync(resolved);
  const root = options.root ? path.resolve(options.root) : stat.isDirectory() ? resolved : path.dirname(resolved);
  const server = await startServer({ root, port: options.port || 0 });
  let url;
  if (stat.isFile()) {
    const rel = path.relative(root, resolved).split(path.sep).join('/');
    url = new URL(rel, server.url).href;
  } else {
    url = server.url;
  }
  return { url, root, server, close: () => server.close() };
}

function parseArgs(argv) {
  const args = { root: '.', port: 0, json: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--root') args.root = argv[++i];
    else if (a === '--port') args.port = Number(argv[++i]);
    else if (a === '--json') args.json = true;
    else if (a === '--help' || a === '-h') args.help = true;
    else if (!a.startsWith('--')) args.root = a;
  }
  return args;
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isCli) {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log('usage: serve.mjs [--root dir] [--port n] [--json]');
    process.exit(0);
  }
  const started = await startServer({ root: args.root, port: args.port });
  if (args.json) console.log(JSON.stringify(started.url));
  else {
    console.log(`frontend-design-skills serve`);
    console.log(`root: ${started.root}`);
    console.log(`url:  ${started.url}`);
    console.log('press Ctrl+C to stop');
  }
  const stop = async () => {
    await started.close();
    process.exit(0);
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
}
