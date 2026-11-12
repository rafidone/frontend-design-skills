// Browser launch selection plus the shared page-fact collector.
//
// Playwright is preferred when installed. The CDP engine has no dependencies
// beyond Node 22's built-in WebSocket and a local Chrome/Chromium binary.

import { launchPlaywright } from './playwright-engine.mjs';
import { launchCdp, findChrome, chromeCandidates } from './cdp-engine.mjs';

export { findChrome, chromeCandidates };

// Installed before navigation so layout shift and paint data are available even
// when the page never touches PerformanceObserver itself.
export const PERF_INIT = `(() => {
  try {
    window.__fdmPerf = { cls: 0, lcp: 0, longTasks: [], shifts: [] };
    if (typeof PerformanceObserver !== 'function') return;
    try {
      new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            window.__fdmPerf.cls += entry.value;
            window.__fdmPerf.shifts.push({ value: entry.value, at: Math.round(entry.startTime) });
          }
        }
      }).observe({ type: 'layout-shift', buffered: true });
    } catch (e) {}
    try {
      new PerformanceObserver(list => {
        const entries = list.getEntries();
        const last = entries[entries.length - 1];
        if (last) window.__fdmPerf.lcp = Math.round(last.startTime);
      }).observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (e) {}
    try {
      new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          window.__fdmPerf.longTasks.push({ start: Math.round(entry.startTime), duration: Math.round(entry.duration) });
        }
      }).observe({ type: 'longtask', buffered: true });
    } catch (e) {}
  } catch (e) {}
})();`;

export async function launchBrowser(options = {}) {
  const requested = options.engine || 'auto';
  const warnings = [];
  if (requested === 'playwright') return launchPlaywright(options);
  if (requested === 'cdp') return launchCdp(options);
  try {
    return await launchPlaywright(options);
  } catch (error) {
    warnings.push(`playwright unavailable: ${error.message}`);
    const browser = await launchCdp(options);
    browser.warnings = warnings;
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

// The collector is serialized into the page. Keep every helper inside it and do
// not reference module-scope values. It returns a plain JSON-safe object.
export function collectFacts() {
  const px = value => Math.round((Number(value) || 0) * 100) / 100;
  const clampText = (value, limit = 240) => String(value || '').replace(/\s+/g, ' ').trim().slice(0, limit);
  const rgba = value => {
    const match = String(value || '').match(/rgba?\(([^)]+)\)/i);
    if (!match) return null;
    const parts = match[1].split(/[,\s/]+/).filter(Boolean).map(Number);
    if (parts.length < 3 || parts.some(n => Number.isNaN(n))) return null;
    return { r: Math.round(parts[0]), g: Math.round(parts[1]), b: Math.round(parts[2]), a: parts.length > 3 ? Number(parts[3]) : 1 };
  };
  const alpha = value => {
    const c = rgba(value);
    return c ? c.a : 1;
  };
  const lum = c => {
    const channel = v => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * channel(c.r) + 0.7152 * channel(c.g) + 0.0722 * channel(c.b);
  };
  const ratio = (a, b) => {
    if (!a || !b) return null;
    const l1 = Math.max(lum(a), lum(b));
    const l2 = Math.min(lum(a), lum(b));
    return Math.round(((l1 + 0.05) / (l2 + 0.05)) * 100) / 100;
  };
  const hueOf = c => {
    if (!c) return null;
    const r = c.r / 255, g = c.g / 255, b = c.b / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const d = max - min;
    if (d < 0.02) return { h: 0, s: 0, l: (max + min) / 2 };
    let h;
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h = (h * 60 + 360) % 360;
    const l = (max + min) / 2;
    const s = d / (1 - Math.abs(2 * l - 1) || 1);
    return { h: Math.round(h), s: Math.round(s * 100) / 100, l: Math.round(l * 100) / 100 };
  };
  const isVisible = el => {
    if (!el || !(el instanceof Element)) return false;
    const s = getComputedStyle(el);
    if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) < 0.05) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  const rectOf = el => {
    const r = el.getBoundingClientRect();
    return { x: px(r.x), y: px(r.y), width: px(r.width), height: px(r.height), top: px(r.top), left: px(r.left), right: px(r.right), bottom: px(r.bottom) };
  };
  const selectorOf = el => {
    if (!el || el.nodeType !== 1) return '';
    if (el.id) return `#${CSS.escape(el.id)}`;
    const parts = [];
    let node = el;
    let depth = 0;
    while (node && node.nodeType === 1 && depth < 4) {
      let part = node.tagName.toLowerCase();
      const classes = [...node.classList].filter(c => !c.startsWith('fdm-')).slice(0, 2);
      if (classes.length) part += `.${classes.map(c => CSS.escape(c)).join('.')}`;
      parts.unshift(part);
      if (node === document.body) break;
      node = node.parentElement;
      depth++;
    }
    return parts.join(' > ');
  };
  const topStyle = el => {
    const s = getComputedStyle(el);
    return {
      display: s.display,
      position: s.position,
      fontFamily: s.fontFamily,
      fontSize: px(parseFloat(s.fontSize)),
      fontWeight: s.fontWeight,
      lineHeight: s.lineHeight === 'normal' ? 'normal' : px(parseFloat(s.lineHeight)),
      letterSpacing: s.letterSpacing,
      color: s.color,
      background: s.backgroundColor,
      backgroundImage: s.backgroundImage === 'none' ? '' : s.backgroundImage.slice(0, 220),
      textAlign: s.textAlign,
      borderRadius: s.borderRadius,
      border: s.border,
      boxShadow: s.boxShadow === 'none' ? '' : s.boxShadow.slice(0, 160),
      outline: `${s.outlineStyle} ${s.outlineWidth} ${s.outlineColor}`,
      maxWidth: s.maxWidth,
      overflowX: s.overflowX,
      scrollSnapType: s.scrollSnapType,
      transition: s.transition ? s.transition.slice(0, 180) : '',
      animation: s.animationName && s.animationName !== 'none' ? `${s.animationName} ${s.animationDuration} ${s.animationIterationCount}` : '',
      transform: s.transform === 'none' ? '' : s.transform.slice(0, 120),
      opacity: Number(s.opacity),
      whiteSpace: s.whiteSpace
    };
  };
  const effectiveBg = el => {
    let node = el;
    while (node && node.nodeType === 1) {
      const s = getComputedStyle(node);
      if (s.backgroundImage && s.backgroundImage !== 'none') return { color: rgba(s.backgroundColor), image: true, from: selectorOf(node) };
      const c = rgba(s.backgroundColor);
      if (c && c.a >= 0.85) return { color: c, image: false, from: selectorOf(node) };
      node = node.parentElement;
    }
    const body = rgba(getComputedStyle(document.body).backgroundColor);
    const html = rgba(getComputedStyle(document.documentElement).backgroundColor);
    return { color: body && body.a >= 0.5 ? body : html || { r: 255, g: 255, b: 255, a: 1 }, image: false, from: 'html' };
  };
  const hasMedia = el => Boolean(el.querySelector('img, svg, canvas, video, picture, iframe, [role="img"]')) ||
    /url\(/i.test(getComputedStyle(el).backgroundImage || '');
  const textOf = el => clampText(el.innerText || el.textContent || '', 400);
  const looksLikeVisual = el => {
    const cls = ` ${el.className || ''} `.toLowerCase();
    const datasets = Object.keys(el.dataset || {}).join(' ');
    return /(visual|media|thumb|image|photo|frame|screen|preview|mock|canvas|video|diagram)/.test(cls + ' ' + datasets);
  };

  const everything = [...document.querySelectorAll('*')];
  const visible = everything.filter(isVisible);

  const sections = [...new Set([
    ...document.querySelectorAll('header, footer, main > section, body > section, section, [data-fdm-section]')
  ])].filter(el => isVisible(el) && el.getBoundingClientRect().height > 40).map(el => {
    const r = rectOf(el);
    return {
      tag: el.tagName.toLowerCase(),
      selector: selectorOf(el),
      id: el.id || '',
      classes: [...el.classList].join(' '),
      data: { ...el.dataset },
      rect: r,
      screen: Math.round((r.height / innerHeight) * 100) / 100,
      textLength: textOf(el).length,
      hasMedia: hasMedia(el),
      heading: textOf(el.querySelector('h1, h2, h3') || { innerText: '' }).slice(0, 120),
      background: getComputedStyle(el).backgroundColor,
      backgroundImage: getComputedStyle(el).backgroundImage === 'none' ? '' : getComputedStyle(el).backgroundImage.slice(0, 200)
    };
  }).sort((a, b) => a.rect.top - b.rect.top);

  const heroEls = [
    ...document.querySelectorAll('[data-fdm-hero], [data-hero], .hero, main > header, body > header, header')
  ].filter(el => {
    if (!isVisible(el)) return false;
    const r = el.getBoundingClientRect();
    const marked = el.hasAttribute('data-fdm-hero') || el.hasAttribute('data-hero') || el.classList.contains('hero');
    return marked || r.height >= innerHeight * 0.55;
  });
  const hero = heroEls.length ? {
    selector: selectorOf(heroEls[0]),
    rect: rectOf(heroEls[0]),
    textLength: textOf(heroEls[0]).length,
    hasMedia: hasMedia(heroEls[0]),
    h1: textOf(heroEls[0].querySelector('h1') || { innerText: '' })
  } : null;

  const headings = [...document.querySelectorAll('h1, h2, h3, h4, h5, h6')].filter(isVisible).map(el => {
    const r = rectOf(el);
    const s = topStyle(el);
    return { tag: el.tagName.toLowerCase(), text: textOf(el), selector: selectorOf(el), rect: r, ...s };
  });

  const textBlocks = [...document.querySelectorAll('p, li, blockquote, dd, figcaption, [data-fdm-text]')].filter(el => {
    if (!isVisible(el)) return false;
    if (el.closest('nav, footer, .ui, [data-fdm-ui]')) return false;
    return textOf(el).length >= 18;
  }).map(el => {
    const r = rectOf(el);
    const s = topStyle(el);
    const bg = effectiveBg(el);
    const color = rgba(s.color);
    return {
      tag: el.tagName.toLowerCase(),
      selector: selectorOf(el),
      text: textOf(el).slice(0, 240),
      chars: textOf(el).length,
      rect: r,
      ...s,
      background: bg.color,
      backgroundImage: bg.image,
      contrast: ratio(color, bg.color),
      estimatedCharsPerLine: r.width > 0 && s.fontSize ? Math.round(r.width / (s.fontSize * 0.5)) : null
    };
  });

  const interactiveSelector = 'a[href], button, input, select, textarea, summary, [role="button"], [role="link"], [role="tab"], [tabindex]:not([tabindex="-1"])';
  const interactives = [...document.querySelectorAll(interactiveSelector)].filter(isVisible).map(el => {
    const r = rectOf(el);
    const s = topStyle(el);
    const bg = effectiveBg(el);
    const label = el.getAttribute('aria-label') || el.getAttribute('title') || '';
    const id = el.id;
    let explicitLabel = '';
    if (id) {
      const node = document.querySelector(`label[for="${CSS.escape(id)}"]`);
      if (node) explicitLabel = textOf(node);
    }
    if (!explicitLabel && el.closest('label')) explicitLabel = textOf(el.closest('label'));
    return {
      tag: el.tagName.toLowerCase(),
      type: el.getAttribute('type') || '',
      selector: selectorOf(el),
      role: el.getAttribute('role') || '',
      text: textOf(el).slice(0, 120),
      ariaLabel: label,
      explicitLabel,
      name: el.getAttribute('name') || '',
      href: el.getAttribute('href') || '',
      placeholder: el.getAttribute('placeholder') || '',
      disabled: Boolean(el.disabled) || el.getAttribute('aria-disabled') === 'true',
      rect: r,
      ...s,
      background: bg.color,
      backgroundImage: bg.image,
      contrast: ratio(rgba(s.color), bg.color),
      inline: el.tagName === 'A' && el.closest('p, li, blockquote') ? true : false,
      inNav: Boolean(el.closest('nav, header'))
    };
  });

  const images = [...document.querySelectorAll('img')].map(el => {
    const r = rectOf(el);
    const s = topStyle(el);
    return {
      selector: selectorOf(el),
      src: (el.currentSrc || el.src || '').slice(0, 300),
      alt: el.getAttribute('alt'),
      complete: el.complete,
      naturalWidth: el.naturalWidth,
      naturalHeight: el.naturalHeight,
      loading: el.getAttribute('loading') || '',
      source: el.getAttribute('data-source') || '',
      subject: el.getAttribute('data-subject') || '',
      rect: r,
      displayed: isVisible(el),
      objectFit: getComputedStyle(el).objectFit,
      ...s
    };
  });

  const canvases = [...document.querySelectorAll('canvas')].filter(isVisible).map(el => ({
    selector: selectorOf(el), rect: rectOf(el), width: el.width, height: el.height,
    label: el.getAttribute('aria-label') || '', role: el.getAttribute('role') || ''
  }));

  const videos = [...document.querySelectorAll('video')].filter(isVisible).map(el => ({
    selector: selectorOf(el), rect: rectOf(el), src: el.currentSrc || el.src || '',
    autoplay: el.autoplay, loop: el.loop, muted: el.muted,
    controls: el.controls, poster: el.getAttribute('poster') || ''
  }));

  const iframes = [...document.querySelectorAll('iframe')].filter(isVisible).map(el => ({
    selector: selectorOf(el), rect: rectOf(el), src: (el.src || '').slice(0, 200), title: el.getAttribute('title') || ''
  }));

  const visualCandidates = visible.filter(looksLikeVisual).map(el => {
    const r = rectOf(el);
    const s = getComputedStyle(el);
    const media = hasMedia(el);
    return {
      selector: selectorOf(el), rect: r, tag: el.tagName.toLowerCase(),
      classes: [...el.classList].join(' '), hasMedia: media,
      textLength: textOf(el).length,
      background: s.backgroundColor,
      backgroundImage: s.backgroundImage === 'none' ? '' : s.backgroundImage.slice(0, 160),
      border: s.border
    };
  }).filter(item => item.rect.width > 120 && item.rect.height > 80);

  const fixed = visible.filter(el => {
    const p = getComputedStyle(el).position;
    return p === 'fixed' || p === 'sticky';
  }).map(el => ({ selector: selectorOf(el), rect: rectOf(el), position: getComputedStyle(el).position, tag: el.tagName.toLowerCase(), classes: [...el.classList].join(' ') }));

  const overflow = visible.filter(el => {
    if (el === document.documentElement || el === document.body) return false;
    const r = el.getBoundingClientRect();
    return r.right > innerWidth + 1.5 || r.left < -1.5 || el.scrollWidth > el.clientWidth + 3;
  }).map(el => ({ selector: selectorOf(el), rect: rectOf(el), scrollWidth: el.scrollWidth, clientWidth: el.clientWidth, overflowX: getComputedStyle(el).overflowX })).slice(0, 40);

  const hiddenText = everything.filter(el => el.getAttribute('aria-hidden') === 'true' && textOf(el).length > 2 && isVisible(el))
    .map(el => ({ selector: selectorOf(el), text: textOf(el).slice(0, 120) })).slice(0, 20);

  const animations = [];
  try {
    for (const animation of document.getAnimations()) {
      if (animations.length >= 200) break;
      const effect = animation.effect;
      const timing = effect && effect.getComputedTiming ? effect.getComputedTiming() : {};
      const target = effect && effect.target;
      animations.push({
        name: animation.animationName || animation.id || '',
        playState: animation.playState,
        duration: Number(timing.duration) || 0,
        iterations: timing.iterations === Infinity ? 'infinite' : Number(timing.iterations) || 0,
        selector: target ? selectorOf(target) : ''
      });
    }
  } catch (error) { /* getAnimations may be missing */ }

  const formInputs = interactives.filter(item => ['input', 'select', 'textarea'].includes(item.tag));

  const resources = [];
  try {
    const entries = performance.getEntriesByType('resource');
    for (const entry of entries.slice(0, 300)) {
      resources.push({
        name: entry.name.slice(0, 300),
        type: entry.initiatorType,
        transfer: entry.transferSize || 0,
        encoded: entry.encodedBodySize || 0,
        decoded: entry.decodedBodySize || 0,
        duration: Math.round(entry.duration)
      });
    }
  } catch (error) { /* ignore */ }

  const documentStyle = getComputedStyle(document.documentElement);
  const bodyStyle = getComputedStyle(document.body);
  const rootVars = {};
  for (const name of ['--accent', '--accent-ink', '--ink', '--bg', '--surface', '--muted', '--radius', '--container', '--gutter', '--h']) {
    const value = documentStyle.getPropertyValue(name).trim();
    if (value) rootVars[name] = value;
  }

  // One neutral accent check: collect saturated colours from prominent surfaces
  // and text, then group by hue bucket.
  const swatches = [];
  const addSwatch = (value, where) => {
    const c = rgba(value);
    if (!c || c.a < 0.3) return;
    const hsl = hueOf(c);
    if (!hsl || hsl.s < 0.28 || hsl.l < 0.12 || hsl.l > 0.9) return;
    swatches.push({ hue: hsl.h, sat: hsl.s, light: hsl.l, rgb: [c.r, c.g, c.b], where });
  };
  for (const el of visible.slice(0, 3000)) {
    const s = getComputedStyle(el);
    if (el.matches('button, [role="button"], a[href], input, select, textarea, .btn, [data-fdm-accent]')) {
      addSwatch(s.backgroundColor, selectorOf(el));
      addSwatch(s.color, selectorOf(el));
      addSwatch(s.borderColor, selectorOf(el));
    }
    if (el.matches('section, header, footer, main')) addSwatch(s.backgroundColor, selectorOf(el));
  }

  const fontFamilies = [...new Set([
    bodyStyle.fontFamily,
    ...[...document.querySelectorAll('h1, h2, h3, button, nav a')].slice(0, 20).map(el => getComputedStyle(el).fontFamily)
  ].map(value => String(value || '').split(',')[0].replace(/["']/g, '').trim()).filter(Boolean))];
  const fonts = fontFamilies.map(family => {
    let loaded = false;
    try { loaded = document.fonts.check(`16px "${family}"`); } catch { /* ignore */ }
    return { family, loaded };
  });

  const metaDescription = document.querySelector('meta[name="description"]')?.content || '';
  const title = document.title || '';
  const scrollSnap = [...document.querySelectorAll('html, body, main, section, [data-fdm-section]')]
    .filter(el => { const s = getComputedStyle(el); return s.scrollSnapType && s.scrollSnapType !== 'none'; })
    .map(el => ({ selector: selectorOf(el), value: getComputedStyle(el).scrollSnapType }));

  const anchors = [...document.querySelectorAll('a[href^="#"]')].filter(isVisible).map(el => ({ href: el.getAttribute('href'), text: textOf(el) }));

  return {
    errors: (window.__fdmErrors || []).slice(0, 30),
    googleFonts: [...document.querySelectorAll('link[href*="fonts.googleapis.com"], link[href*="fonts.gstatic.com"]')].map(link => link.href),
    viewport: { width: innerWidth, height: innerHeight, dpr: devicePixelRatio },
    document: {
      title,
      lang: document.documentElement.lang || '',
      description: metaDescription,
      scrollWidth: document.documentElement.scrollWidth,
      scrollHeight: document.documentElement.scrollHeight,
      bodyScrollWidth: document.body.scrollWidth,
      bodyBackground: bodyStyle.backgroundColor,
      htmlBackground: getComputedStyle(document.documentElement).backgroundColor,
      bodyColor: bodyStyle.color,
      bodyFont: bodyStyle.fontFamily,
      bodyFontSize: px(parseFloat(bodyStyle.fontSize)),
      overflowX: bodyStyle.overflowX,
      htmlOverflowX: documentStyle.overflowX,
      scrollBehavior: documentStyle.scrollBehavior,
      fontsStatus: document.fonts?.status || 'unknown',
      scripts: document.scripts.length,
      nodes: document.querySelectorAll('*').length,
      rootVars,
      fixedHeaderHeight: fixed.filter(f => f.rect.top <= 1 && f.rect.width > innerWidth * 0.6).reduce((max, f) => Math.max(max, f.rect.bottom), 0)
    },
    sections,
    hero,
    headings,
    textBlocks,
    interactives,
    formInputs,
    images,
    canvases,
    videos,
    iframes,
    visualCandidates,
    fixed,
    overflow,
    hiddenText,
    animations,
    swatches,
    fonts,
    scrollSnap,
    anchors,
    resources,
    perf: (() => {
      const raw = window.__fdmPerf || {};
      return {
        cls: Math.round((raw.cls || 0) * 1000) / 1000,
        lcp: raw.lcp || 0,
        shifts: (raw.shifts || []).slice(-20),
        longTasks: (raw.longTasks || []).slice(-20),
        navigation: (() => {
          try {
            const nav = performance.getEntriesByType('navigation')[0];
            return nav ? { domContentLoaded: Math.round(nav.domContentLoadedEventEnd), load: Math.round(nav.loadEventEnd), transfer: nav.transferSize || 0 } : null;
          } catch { return null; }
        })()
      };
    })()
  };
}
