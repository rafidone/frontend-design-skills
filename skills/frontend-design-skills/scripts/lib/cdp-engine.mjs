// Zero-dependency Chrome DevTools Protocol engine.
//
// It launches a local Chromium with a temporary profile, parses the DevTools
// WebSocket URL from stderr, and drives one page through flattened sessions.
// This is the fallback when playwright-core is not installed.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

export function chromeCandidates() {
  return [
    process.env.CHROME_PATH,
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
    process.env.FDM_CHROME_PATH,
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/snap/bin/chromium',
    '/usr/local/bin/chromium',
    '/usr/local/bin/google-chrome',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'
  ].filter(Boolean);
}

export function findChrome() {
  for (const candidate of chromeCandidates()) {
    try {
      if (fs.existsSync(candidate)) return candidate;
    } catch { /* ignore */ }
  }
  return '';
}

class CdpConnection {
  constructor(socket) {
    this.socket = socket;
    this.nextId = 0;
    this.pending = new Map();
    this.closed = false;
    socket.addEventListener('message', event => {
      let message;
      try {
        const raw = typeof event.data === 'string' ? event.data : Buffer.from(event.data).toString('utf8');
        message = JSON.parse(raw);
      } catch { return; }
      if (!message.id) return;
      const entry = this.pending.get(message.id);
      if (!entry) return;
      this.pending.delete(message.id);
      if (message.error) entry.reject(new Error(`${message.error.message || 'CDP error'} ${message.error.data || ''}`.trim()));
      else entry.resolve(message.result || {});
    });
    socket.addEventListener('close', () => {
      this.closed = true;
      for (const entry of this.pending.values()) entry.reject(new Error('CDP connection closed'));
      this.pending.clear();
    });
  }

  send(method, params = {}, sessionId, timeout = 30000) {
    if (this.closed) return Promise.reject(new Error(`CDP closed before ${method}`));
    const id = ++this.nextId;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`CDP timeout: ${method}`));
      }, timeout);
      this.pending.set(id, {
        resolve: value => { clearTimeout(timer); resolve(value); },
        reject: error => { clearTimeout(timer); reject(error); }
      });
      const payload = { id, method, params };
      if (sessionId) payload.sessionId = sessionId;
      try {
        this.socket.send(JSON.stringify(payload));
      } catch (error) {
        clearTimeout(timer);
        this.pending.delete(id);
        reject(error);
      }
    });
  }
}

async function waitForWebSocketUrl(child, userDataDir, timeout = 20000) {
  const started = Date.now();
  let buffer = '';
  let resolved = '';
  const parse = text => {
    const match = text.match(/DevTools listening on (ws:\/\/[^\s]+)/);
    if (match) resolved = match[1];
  };
  child.stderr?.on('data', chunk => {
    buffer += chunk.toString();
    parse(buffer);
  });
  child.stdout?.on('data', chunk => {
    buffer += chunk.toString();
    parse(buffer);
  });
  while (Date.now() - started < timeout) {
    if (resolved) return resolved;
    const portFile = path.join(userDataDir, 'DevToolsActivePort');
    try {
      const text = fs.readFileSync(portFile, 'utf8').trim().split('\n');
      if (text[0] && text[1]) return `ws://127.0.0.1:${text[0].trim()}${text[1].trim()}`;
    } catch { /* not ready */ }
    if (child.exitCode !== null) break;
    await sleep(100);
  }
  throw new Error(`CDP launch failed: ${buffer.slice(-1200) || 'no DevTools URL'}`);
}

class CdpPage {
  constructor(browser, sessionId, targetId) {
    this.browser = browser;
    this.sessionId = sessionId;
    this.targetId = targetId;
    this.engine = 'cdp';
    this._features = {};
  }

  send(method, params = {}, timeout = 30000) {
    return this.browser.connection.send(method, params, this.sessionId, timeout);
  }

  async setViewport({ width = 1440, height = 900, deviceScaleFactor = 1 } = {}) {
    this.viewport = { width, height, deviceScaleFactor };
    await this.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor,
      mobile: width < 600,
      screenWidth: width,
      screenHeight: height,
      positionX: 0,
      positionY: 0,
      dontSetVisibleSize: false
    });
  }

  async emulateMedia({ reducedMotion = null, colorScheme = null, forcedColors = null } = {}) {
    if (reducedMotion) this._features['prefers-reduced-motion'] = reducedMotion;
    if (colorScheme) this._features['prefers-color-scheme'] = colorScheme;
    if (forcedColors) this._features['forced-colors'] = forcedColors;
    const features = Object.entries(this._features).map(([name, value]) => ({ name, value }));
    await this.send('Emulation.setEmulatedMedia', { media: '', features });
  }

  async setJavaScriptEnabled(enabled) {
    await this.send('Emulation.setScriptExecutionDisabled', { value: !enabled });
  }

  async addInitScript(source) {
    this._initScripts ||= [];
    this._initScripts.push(String(source));
    await this.send('Page.addScriptToEvaluateOnNewDocument', { source: String(source) });
  }

  async goto(url, { timeout = 30000, waitUntil = 'load' } = {}) {
    this.lastUrl = url;
    await this.send('Page.navigate', { url, transitionType: 'typed' }, timeout);
    await this._waitReady(timeout);
    return { status: 200, url };
  }

  async reload({ timeout = 30000 } = {}) {
    await this.send('Page.reload', { ignoreCache: false });
    await this._waitReady(timeout);
  }

  async _waitReady(timeout) {
    const started = Date.now();
    while (Date.now() - started < timeout) {
      try {
        const result = await this.evaluate('document.readyState');
        if (result === 'complete' || result === 'interactive') break;
      } catch { /* the document may still be swapping */ }
      await sleep(100);
    }
    try {
      await this.evaluate(`(async () => {
        const wait = (p, ms) => Promise.race([Promise.resolve(p).catch(() => {}), new Promise(r => setTimeout(r, ms))]);
        if (document.fonts && document.fonts.ready) await wait(document.fonts.ready, 4000);
        const pending = [...document.images].filter(img => !img.complete);
        await wait(Promise.all(pending.map(img => new Promise(r => {
          img.addEventListener('load', r, { once: true });
          img.addEventListener('error', r, { once: true });
        }))), 5000);
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
        return true;
      })()`, undefined, timeout);
    } catch { /* font/image settling is best effort */ }
    await sleep(80);
  }

  async evaluate(fn, arg, timeout = 30000) {
    let expression;
    if (typeof fn === 'string') {
      expression = fn;
    } else {
      const payload = arg === undefined ? 'undefined' : JSON.stringify(arg);
      expression = `(${fn.toString()})(${payload})`;
    }
    const result = await this.send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true,
      userGesture: true,
      allowUnsafeEvalBlockedByCSP: true
    }, timeout);
    if (result.exceptionDetails) {
      const detail = result.exceptionDetails.exception?.description || result.exceptionDetails.text || 'evaluate failed';
      throw new Error(`evaluate: ${detail}`);
    }
    return result.result?.value;
  }

  async screenshot({ path: file = '', fullPage = false, clip = null, type = 'png' } = {}) {
    let params = { format: type, fromSurface: true, captureBeyondViewport: true };
    if (clip) {
      params.clip = {
        x: Math.max(0, clip.x || 0),
        y: Math.max(0, clip.y || 0),
        width: Math.max(1, clip.width || 1),
        height: Math.max(1, clip.height || 1),
        scale: clip.scale || 1
      };
    } else if (fullPage) {
      const metrics = await this.send('Page.getLayoutMetrics');
      const size = metrics.cssContentSize || metrics.contentSize || { width: this.viewport?.width || 1440, height: this.viewport?.height || 900 };
      params.clip = {
        x: 0,
        y: 0,
        width: Math.max(1, Math.ceil(size.width)),
        height: Math.max(1, Math.ceil(size.height)),
        scale: 1
      };
    }
    const result = await this.send('Page.captureScreenshot', params, 60000);
    const buffer = Buffer.from(result.data, 'base64');
    if (file) {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, buffer);
    }
    return buffer;
  }

  async hover(selector) {
    const box = await this.evaluate(sel => {
      const element = document.querySelector(sel);
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2, width: rect.width, height: rect.height };
    }, selector);
    if (!box) return null;
    await this.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: box.x, y: box.y, button: 'none', buttons: 0 });
    await sleep(280);
    return box;
  }

  async click(selector) {
    return this.evaluate(sel => {
      const element = document.querySelector(sel);
      if (!element) return false;
      element.click();
      return true;
    }, selector);
  }

  async focus(selector) {
    return this.evaluate(sel => {
      const element = document.querySelector(sel);
      if (!element) return false;
      element.focus();
      return true;
    }, selector);
  }

  async url() {
    return this.evaluate('location.href');
  }

  async title() {
    return this.evaluate('document.title');
  }

  async close() {
    try { await this.browser.connection.send('Target.closeTarget', { targetId: this.targetId }); } catch { /* ignore */ }
  }
}

class CdpBrowser {
  constructor({ connection, child, userDataDir }) {
    this.connection = connection;
    this.child = child;
    this.userDataDir = userDataDir;
    this.engine = 'cdp';
    this.closed = false;
  }

  async newPage({ width = 1440, height = 900, deviceScaleFactor = 1, reducedMotion = null, colorScheme = null, javaScriptEnabled = true, initScripts = [] } = {}) {
    if (this.closed) throw new Error('browser is closed');
    const { targetId } = await this.connection.send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await this.connection.send('Target.attachToTarget', { targetId, flatten: true });
    const page = new CdpPage(this, sessionId, targetId);
    await page.send('Page.enable');
    await page.send('Runtime.enable');
    await page.send('Network.enable');
    await page.send('Log.enable').catch(() => {});
    await page.setViewport({ width, height, deviceScaleFactor });
    if (reducedMotion || colorScheme) await page.emulateMedia({ reducedMotion, colorScheme });
    if (!javaScriptEnabled) await page.setJavaScriptEnabled(false);
    for (const source of initScripts) await page.addInitScript(source);
    return page;
  }

  async close() {
    if (this.closed) return;
    this.closed = true;
    try { await this.connection.send('Browser.close', {}, undefined, 3000); } catch { /* ignore */ }
    try { this.connection.socket.close(); } catch { /* ignore */ }
    if (this.child && this.child.exitCode === null) {
      this.child.kill('SIGTERM');
      setTimeout(() => { try { this.child.kill('SIGKILL'); } catch { /* ignore */ } }, 1500).unref?.();
    }
    try { fs.rmSync(this.userDataDir, { recursive: true, force: true }); } catch { /* ignore */ }
  }
}

export async function launchCdp(options = {}) {
  const executablePath = options.executablePath || findChrome();
  if (!executablePath) throw new Error('No Chrome or Chromium binary found. Set CHROME_PATH.');
  const userDataDir = fs.mkdtempSync(path.join(options.profileDir || os.tmpdir(), 'fdm-chrome-'));
  const args = [
    options.headless === false ? '' : '--headless=new',
    '--remote-debugging-port=0',
    '--remote-allow-origins=*',
    `--user-data-dir=${userDataDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-background-networking',
    '--disable-background-timer-throttling',
    '--disable-breakpad',
    '--disable-component-update',
    '--disable-dev-shm-usage',
    '--disable-features=Translate,MediaRouter,OptimizationHints',
    '--disable-sync',
    '--hide-scrollbars',
    '--metrics-recording-only',
    '--mute-audio',
    '--password-store=basic',
    '--use-mock-keychain',
    '--force-device-scale-factor=1',
    '--font-render-hinting=none',
    '--window-size=1440,900',
    'about:blank'
  ].filter(Boolean);
  if (options.sandbox !== true) args.unshift('--no-sandbox', '--disable-gpu');
  if (Array.isArray(options.args)) args.push(...options.args);

  const child = spawn(executablePath, args, { stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, CHROME_HEADLESS: '1' } });
  child.on('error', () => {});
  const wsUrl = await waitForWebSocketUrl(child, userDataDir, options.timeout || 20000);
  const socket = new WebSocket(wsUrl);
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('CDP WebSocket open timeout')), 10000);
    socket.addEventListener('open', () => { clearTimeout(timer); resolve(); }, { once: true });
    socket.addEventListener('error', () => { clearTimeout(timer); reject(new Error('CDP WebSocket connection failed')); }, { once: true });
  });
  const connection = new CdpConnection(socket);
  return new CdpBrowser({ connection, child, userDataDir });
}

export { CdpBrowser };
