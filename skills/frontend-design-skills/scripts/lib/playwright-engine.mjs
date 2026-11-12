// Playwright engine. Used when playwright-core is installed; otherwise the
// caller falls back to the dependency-free CDP engine.

import fs from 'node:fs';
import path from 'node:path';
import { chromeCandidates, findChrome } from './cdp-engine.mjs';

async function loadPlaywright() {
  try {
    return await import('playwright-core');
  } catch {
    try {
      return await import('playwright');
    } catch {
      return null;
    }
  }
}

class PlaywrightPage {
  constructor(context, page) {
    this.context = context;
    this.page = page;
    this.engine = 'playwright';
    this.viewport = page.viewportSize() || { width: 1440, height: 900, deviceScaleFactor: 1 };
  }

  async setViewport({ width = 1440, height = 900, deviceScaleFactor = 1 } = {}) {
    this.viewport = { width, height, deviceScaleFactor };
    await this.page.setViewportSize({ width, height });
  }

  async emulateMedia({ reducedMotion = null, colorScheme = null, forcedColors = null } = {}) {
    await this.page.emulateMedia({
      reducedMotion: reducedMotion === 'reduce' ? 'reduce' : 'no-preference',
      colorScheme: colorScheme === 'dark' ? 'dark' : colorScheme === 'light' ? 'light' : null,
      forcedColors: forcedColors === 'active' ? 'active' : forcedColors === 'none' ? 'none' : null
    });
  }

  async setJavaScriptEnabled(enabled) {
    // Playwright fixes this per context. Rebuilding a context mid-audit would
    // lose state, so this is a no-op; create the page with javaScriptEnabled.
    this.javaScriptEnabled = enabled;
  }

  async addInitScript(source) {
    await this.page.addInitScript({ content: String(source) });
  }

  async goto(url, { timeout = 30000, waitUntil = 'load' } = {}) {
    const response = await this.page.goto(url, { waitUntil, timeout });
    await this._settle(timeout);
    return { status: response ? response.status() : 0, url: this.page.url() };
  }

  async reload({ timeout = 30000 } = {}) {
    await this.page.reload({ waitUntil: 'load', timeout });
    await this._settle(timeout);
  }

  async _settle(timeout) {
    try {
      await this.page.evaluate(async () => {
        const wait = (p, ms) => Promise.race([Promise.resolve(p).catch(() => {}), new Promise(r => setTimeout(r, ms))]);
        if (document.fonts && document.fonts.ready) await wait(document.fonts.ready, 4000);
        const pending = [...document.images].filter(img => !img.complete);
        await wait(Promise.all(pending.map(img => new Promise(r => {
          img.addEventListener('load', r, { once: true });
          img.addEventListener('error', r, { once: true });
        }))), 5000);
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
        return true;
      });
    } catch { /* best effort */ }
    await this.page.waitForTimeout(80);
  }

  async evaluate(fn, arg) {
    if (typeof fn === 'string') return this.page.evaluate(fn);
    return this.page.evaluate(fn, arg);
  }

  async screenshot({ path: file = '', fullPage = false, clip = null, type = 'png' } = {}) {
    const options = { type, fullPage, animations: 'disabled' };
    if (clip) {
      options.clip = {
        x: Math.max(0, clip.x || 0),
        y: Math.max(0, clip.y || 0),
        width: Math.max(1, clip.width || 1),
        height: Math.max(1, clip.height || 1)
      };
      options.fullPage = false;
    }
    const buffer = await this.page.screenshot(options);
    if (file) {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, buffer);
    }
    return buffer;
  }

  async hover(selector) {
    const element = this.page.locator(selector).first();
    if (!(await element.count())) return null;
    const box = await element.boundingBox();
    if (!box) return null;
    await element.hover();
    await this.page.waitForTimeout(280);
    return { x: box.x + box.width / 2, y: box.y + box.height / 2, ...box };
  }

  async click(selector) {
    const element = this.page.locator(selector).first();
    if (!(await element.count())) return false;
    await element.click();
    return true;
  }

  async focus(selector) {
    const element = this.page.locator(selector).first();
    if (!(await element.count())) return false;
    await element.focus();
    return true;
  }

  async url() { return this.page.url(); }
  async title() { return this.page.title(); }
  async close() { await this.context.close().catch(() => {}); }
}

class PlaywrightBrowser {
  constructor(browser, chromium) {
    this.browser = browser;
    this.chromium = chromium;
    this.engine = 'playwright';
    this.closed = false;
  }

  async newPage({ width = 1440, height = 900, deviceScaleFactor = 1, reducedMotion = null, colorScheme = null, javaScriptEnabled = true, initScripts = [] } = {}) {
    const context = await this.browser.newContext({
      viewport: { width, height },
      screen: { width, height },
      deviceScaleFactor,
      isMobile: width < 600,
      hasTouch: width < 600,
      javaScriptEnabled,
      reducedMotion: reducedMotion === 'reduce' ? 'reduce' : 'no-preference',
      colorScheme: colorScheme === 'dark' ? 'dark' : colorScheme === 'light' ? 'light' : null,
      bypassCSP: false
    });
    const page = await context.newPage();
    for (const source of initScripts) await page.addInitScript({ content: String(source) });
    return new PlaywrightPage(context, page);
  }

  async close() {
    if (this.closed) return;
    this.closed = true;
    await this.browser.close().catch(() => {});
  }
}

export async function launchPlaywright(options = {}) {
  const module = await loadPlaywright();
  if (!module) throw new Error('playwright-core is not installed');
  const chromium = module.chromium || module.default?.chromium;
  if (!chromium) throw new Error('playwright-core does not expose chromium');
  let executablePath = options.executablePath || process.env.CHROME_PATH || process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || '';
  if (!executablePath) {
    try {
      const bundled = chromium.executablePath();
      if (bundled && fs.existsSync(bundled)) executablePath = bundled;
    } catch { /* not installed */ }
  }
  if (!executablePath) executablePath = findChrome();
  if (!executablePath) throw new Error('No Chrome/Chromium executable found for Playwright');
  const args = ['--no-sandbox', '--disable-dev-shm-usage', '--font-render-hinting=none'];
  if (Array.isArray(options.args)) args.push(...options.args);
  const browser = await chromium.launch({ headless: options.headless !== false, executablePath, args });
  return new PlaywrightBrowser(browser, chromium);
}

export { chromeCandidates, findChrome };
