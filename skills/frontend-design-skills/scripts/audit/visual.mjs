// Visual audit: real media, no placeholder boxes, no captions, one system.

import { finding, SEVERITY } from '../lib/rules.mjs';
import { pngStats, isLikelyBlank, ffmpegAvailable } from '../lib/image.mjs';

export const id = 'visual';
export const label = 'Visual assets';

const PLACEHOLDER_TEXT = /\b(lorem ipsum|dolor sit amet|placeholder|your (image|logo|text) here|image here|feature one|feature two|chart title|sample text|insert (text|image)|tbd)\b/i;
const BAD_IMAGE_SRC = /(placehold|placeholder|via\.placeholder|dummyimage|picsum\.photos|example\.com\/image)/i;

export async function audit(ctx) {
  const { facts } = ctx;
  const findings = [];

  // VIS-01 - images must decode.
  for (const image of facts.images.filter(img => img.displayed)) {
    if (image.complete && image.naturalWidth === 0) {
      findings.push(finding('VIS-01', 'An image failed to load.', {
        severity: SEVERITY.fail,
        selector: image.selector,
        detail: image.src || '(empty src)',
        fix: 'Point the image at a real local file and verify its path and case.',
        where: `${ctx.width}x${ctx.height}`
      }));
    }
    if (image.displayed && image.rect.width > 40 && image.rect.height > 40 && (image.naturalWidth < 2 || image.naturalHeight < 2) && image.src) {
      // Covered by the broken-image check, kept separate for SVG data URIs.
      findings.push(finding('VIS-01', 'An image renders at a usable size but has no intrinsic pixels.', {
        severity: SEVERITY.warn,
        selector: image.selector,
        detail: image.src.slice(0, 160),
        fix: 'Use a real raster or inline SVG asset.',
        where: `${ctx.width}x${ctx.height}`
      }));
    }
  }

  // VIS-01 - visual containers must contain something.
  for (const candidate of facts.visualCandidates) {
    if (candidate.hasMedia) continue;
    if (candidate.textLength > 8) continue;
    if (candidate.backgroundImage) continue;
    if (candidate.rect.width < 180 || candidate.rect.height < 110) continue;
    findings.push(finding('VIS-01', `A visual container (${candidate.classes || candidate.selector}) is an empty box.`, {
      severity: SEVERITY.fail,
      selector: candidate.selector,
      detail: `${Math.round(candidate.rect.width)}x${Math.round(candidate.rect.height)} with no image, SVG, canvas, video or background.`,
      fix: 'Replace the box with a real photograph, product UI fragment, diagram or type composition.',
      where: `${ctx.width}x${ctx.height}`
    }));
    if (findings.filter(f => f.rule === 'VIS-01').length >= 6) break;
  }

  // VIS-02 - no placeholder copy or stand-in image services.
  const bodyText = await ctx.page.evaluate(() => document.body.innerText || '').catch(() => '');
  const placeholder = bodyText.match(PLACEHOLDER_TEXT);
  if (placeholder) {
    findings.push(finding('VIS-02', `Placeholder copy is visible: "${placeholder[0]}".`, {
      severity: SEVERITY.fail,
      selector: 'body',
      fix: 'Write the real product or client copy.',
      where: `${ctx.width}x${ctx.height}`
    }));
  }
  for (const image of facts.images) {
    if (BAD_IMAGE_SRC.test(image.src)) {
      findings.push(finding('VIS-02', 'A placeholder image service is in use.', {
        severity: SEVERITY.fail,
        selector: image.selector,
        detail: image.src,
        fix: 'Use a vetted local WebP from assets/photos or the client\'s own file.',
        where: `${ctx.width}x${ctx.height}`
      }));
    }
    if (/^data:image\/gif;base64,R0lGOD/i.test(image.src)) {
      findings.push(finding('VIS-02', 'A one-pixel tracking GIF is used as an image.', {
        severity: SEVERITY.fail,
        selector: image.selector,
        fix: 'Remove it or replace it with a real asset.',
        where: `${ctx.width}x${ctx.height}`
      }));
    }
  }

  // VIS-03 - no captions that explain a picture.
  const captions = await ctx.page.evaluate(() => {
    const out = [];
    for (const fig of document.querySelectorAll('figure')) {
      const caption = fig.querySelector('figcaption');
      const media = fig.querySelector('img, svg, canvas, video');
      if (caption && media) {
        out.push({ selector: fig.id ? `#${CSS.escape(fig.id)}` : 'figure', text: (caption.innerText || '').trim().slice(0, 160) });
      }
    }
    return out.slice(0, 8);
  }).catch(() => []);
  for (const caption of captions) {
    findings.push(finding('VIS-03', 'A caption explains an image.', {
      severity: SEVERITY.warn,
      selector: caption.selector,
      detail: caption.text,
      fix: 'Move licence credit into the single footer credit line; let the image speak.',
      where: `${ctx.width}x${ctx.height}`
    }));
  }

  // VIS-01 - text sitting directly on a busy image needs a scrim or solid panel.
  const busyText = await ctx.page.evaluate(() => {
    const out = [];
    for (const el of document.querySelectorAll('h1, h2, h3, p, a, button')) {
      const style = getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') continue;
      const rect = el.getBoundingClientRect();
      if (rect.width < 20 || rect.height < 10) continue;
      let node = el.parentElement;
      let layered = false;
      for (let depth = 0; node && depth < 4; depth++, node = node.parentElement) {
        const s = getComputedStyle(node);
        if (s.backgroundImage && s.backgroundImage !== 'none' && /url\(|gradient/.test(s.backgroundImage)) {
          const overlay = getComputedStyle(el).textShadow !== 'none' || Number(getComputedStyle(el).backgroundColor?.match(/[\d.]+/)?.[0] || 0) > 0;
          out.push({ selector: el.tagName.toLowerCase(), text: (el.innerText || '').trim().slice(0, 80), overlay });
          layered = true;
          break;
        }
      }
      if (layered) continue;
    }
    return out.slice(0, 5);
  }).catch(() => []);
  for (const item of busyText) {
    if (!item.overlay) {
      findings.push(finding('VIS-01', 'Text is placed over a background image without a scrim.', {
        severity: SEVERITY.warn,
        selector: item.selector,
        detail: item.text,
        fix: 'Add a solid or gradient scrim with 4.5:1 contrast beneath the text.',
        where: `${ctx.width}x${ctx.height}`
      }));
    }
  }

  // SYS-02 - cards nested more than two deep. Only count container tokens,
  // never BEM sub-elements such as .card__top or .card__number.
  const nested = await ctx.page.evaluate(() => {
    const isCard = el => [...(el.classList || [])].some(token =>
      /^(card|tile|panel|box)(--|$)/i.test(token)
    );
    let worst = null;
    for (const el of document.querySelectorAll('[class]')) {
      if (!isCard(el)) continue;
      let depth = 0;
      let node = el;
      while (node && node.nodeType === 1) {
        if (isCard(node)) depth++;
        node = node.parentElement;
      }
      if (depth > 2 && (!worst || depth > worst.depth)) {
        worst = { depth, selector: el.className, text: (el.innerText || '').trim().slice(0, 90) };
      }
    }
    return worst;
  }).catch(() => null);
  if (nested) {
    findings.push(finding('SYS-02', `Cards are nested ${nested.depth} levels deep.`, {
      severity: SEVERITY.fail,
      selector: String(nested.selector),
      detail: nested.text,
      fix: 'Flatten the composition: a card contains content, not another card.',
      where: `${ctx.width}x${ctx.height}`
    }));
  }

  // SYS-01 - one radius family across controls.
  const radii = new Set(facts.interactives
    .map(item => String(item.borderRadius || '').trim())
    .filter(value => value && value !== '0px')
    .map(value => value.split(/\s+/)[0]));
  if (radii.size > 4) {
    findings.push(finding('SYS-01', `${radii.size} different control radii are in use (${[...radii].slice(0, 6).join(', ')}).`, {
      severity: SEVERITY.warn,
      selector: 'button, a, input',
      fix: 'Choose one radius family and reuse it.',
      where: `${ctx.width}x${ctx.height}`
    }));
  }

  // Pixel variance on the hero catches flat-colour "visuals" that the DOM
  // cannot distinguish from a legitimate solid ground.
  if (ctx.width === 1440 && ffmpegAvailable()) {
    try {
      const clip = facts.hero ? {
        x: Math.max(0, facts.hero.rect.left),
        y: Math.max(0, facts.hero.rect.top),
        width: Math.min(ctx.width, facts.hero.rect.width || ctx.width),
        height: Math.min(ctx.height, Math.max(200, facts.hero.rect.height || ctx.height))
      } : { x: 0, y: 0, width: ctx.width, height: Math.min(ctx.height, 700) };
      const buffer = await ctx.page.screenshot({ clip });
      const stats = pngStats(buffer);
      if (stats && isLikelyBlank(stats) && facts.hero) {
        findings.push(finding('VIS-01', 'The hero renders as a near-flat colour field.', {
          severity: SEVERITY.warn,
          selector: facts.hero.selector,
          detail: `variance ${stats.variance}, ${stats.colors} colour buckets`,
          fix: 'Add real contrast: a photograph, product UI, diagram or type composition.',
          where: '1440x900'
        }));
      }
    } catch { /* screenshot statistics are best effort */ }
  }

  return findings;
}
