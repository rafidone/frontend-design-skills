// Browser selection.
//
// Playwright is preferred when playwright-core (or playwright) is installed.
// When it is absent, or fails to launch, the zero-dependency CDP engine drives
// the local Chrome/Chromium binary instead. Both expose the same page surface:
// setViewport, emulateMedia, addInitScript, goto, evaluate, screenshot, hover,
// click, focus, url, title and close.

import { launchPlaywright } from './playwright-engine.mjs';
import { launchCdp, findChrome, chromeCandidates } from './cdp-engine.mjs';

export { findChrome, chromeCandidates };

export async function launchBrowser(options = {}) {
  const requested = String(options.engine || 'auto').toLowerCase();
  const warnings = [];

  if (requested === 'playwright') return launchPlaywright(options);
  if (requested === 'cdp' || requested === 'chrome') return launchCdp(options);

  try {
    return await launchPlaywright(options);
  } catch (error) {
    warnings.push(`playwright unavailable: ${error.message}`);
    const browser = await launchCdp(options);
    browser.warnings = [...(browser.warnings || []), ...warnings];
    return browser;
  }
}

export async function withBrowser(options, run) {
  const browser = await launchBrowser(options);
  try {
    return await run(browser);
  } finally {
    await browser.close();
  }
}
