// Typography and colour audit.

import { finding, SEVERITY, BANNED_FONTS } from '../lib/rules.mjs';
import { isViolet } from '../lib/color.mjs';

export const id = 'typography';
export const label = 'Typography and colour';

const ALLOW_SMALL = /(credit|fineprint|legal|eyebrow|label|caption|badge|meta|kicker|tag|chip|footnote)/i;

export async function audit(ctx) {
  const { facts } = ctx;
  const findings = [];

  // TYP-01 - body copy stays at 16px or more.
  const small = facts.textBlocks.filter(block => block.fontSize > 0 && block.fontSize < 16 && block.chars >= 40 && !ALLOW_SMALL.test(`${block.className || ''} ${block.selector}`));
  for (const block of small.slice(0, 6)) {
    findings.push(finding('TYP-01', `Body copy is ${block.fontSize}px, below the 16px floor.`, {
      severity: SEVERITY.fail,
      selector: block.selector,
      detail: block.text.slice(0, 120),
      fix: 'Set body copy to 16-18px with line-height 1.5-1.7.',
      where: `${ctx.width}x${ctx.height}`
    }));
  }

  // TYP-02 - measure stays readable. The estimate uses 0.5em per character.
  // A block needs enough real text for a line-length estimate to mean
  // anything; short list rows and labels can be wide without being prose.
  const MEASURE_MIN_CHARS = 80;
  const measured = facts.textBlocks.filter(block => block.chars >= MEASURE_MIN_CHARS);
  const longLines = measured.filter(block => block.estimatedCharsPerLine && block.estimatedCharsPerLine > 85);
  for (const block of longLines.slice(0, 4)) {
    findings.push(finding('TYP-02', `A text block runs about ${block.estimatedCharsPerLine} characters per line.`, {
      severity: SEVERITY.fail,
      selector: block.selector,
      detail: block.text.slice(0, 120),
      fix: 'Constrain prose to max-width: 62ch.',
      where: `${ctx.width}x${ctx.height}`
    }));
  }
  const slightlyLong = measured.filter(block => block.estimatedCharsPerLine && block.estimatedCharsPerLine > 72 && block.estimatedCharsPerLine <= 85);
  if (slightlyLong.length > 2) {
    findings.push(finding('TYP-02', `${slightlyLong.length} text blocks run longer than 72 characters per line.`, {
      severity: SEVERITY.warn,
      selector: slightlyLong[0].selector,
      fix: 'Tighten the prose column to roughly 62 characters.',
      where: `${ctx.width}x${ctx.height}`
    }));
  }

  // TYP-03 - every declared family must actually load.
  const missing = facts.fonts.filter(font => !font.loaded);
  for (const font of missing) {
    findings.push(finding('TYP-03', `The typeface "${font.family}" is used but did not load.`, {
      severity: SEVERITY.fail,
      selector: 'html',
      fix: 'Fix the Google Fonts URL or self-host the face. Never fall back silently.',
      where: `${ctx.width}x${ctx.height}`
    }));
  }
  if (facts.googleFonts.length > 3) {
    findings.push(finding('TYP-03', `${facts.googleFonts.length} Google Fonts requests are made; load at most two families plus one mono.`, {
      severity: SEVERITY.warn,
      selector: 'link[href*="fonts.googleapis.com"]',
      fix: 'Combine families into one request and drop unused weights.',
      where: `${ctx.width}x${ctx.height}`
    }));
  }

  // TYP-04 - one heading scale.
  const sizes = [...new Set(facts.headings.filter(h => ['h1', 'h2', 'h3'].includes(h.tag)).map(h => Math.round(h.fontSize)))].sort((a, b) => a - b);
  if (sizes.length > 5) {
    findings.push(finding('TYP-04', `${sizes.length} distinct heading sizes are in use (${sizes.join(', ')}px).`, {
      severity: SEVERITY.warn,
      selector: 'h1, h2, h3',
      fix: 'Reduce the scale to a small, deliberate set such as 64/40/24px.',
      where: `${ctx.width}x${ctx.height}`
    }));
  }

  // TYP-05 - banned display faces.
  const primary = new Set([
    ...facts.fonts.map(font => font.family),
    ...facts.headings.slice(0, 10).map(h => String(h.fontFamily || '').split(',')[0].replace(/["']/g, '').trim())
  ]);
  for (const family of primary) {
    if (!family) continue;
    if (BANNED_FONTS.some(banned => banned.toLowerCase() === family.toLowerCase())) {
      findings.push(finding('TYP-05', `"${family}" is used as a primary face; it is on the generic display list.`, {
        severity: SEVERITY.fail,
        selector: 'h1',
        fix: 'Use an art-directed pairing from assets/typography/type-pairs.json.',
        where: `${ctx.width}x${ctx.height}`
      }));
    }
  }

  // COL-01 - text contrast.
  for (const block of facts.textBlocks) {
    if (block.backgroundImage) continue;
    if (block.contrast !== null && block.contrast < 4.5) {
      findings.push(finding('COL-01', `Text contrast is ${block.contrast}:1, below 4.5:1.`, {
        severity: SEVERITY.fail,
        selector: block.selector,
        detail: `${block.fontSize}px ${block.color} on ${block.background?.r},${block.background?.g},${block.background?.b}`,
        fix: 'Darken the ink or lighten the surface until the ratio reaches 4.5:1.',
        where: `${ctx.width}x${ctx.height}`
      }));
      if (findings.filter(f => f.rule === 'COL-01').length >= 5) break;
    }
  }
  const lowButtons = facts.interactives.filter(item => item.contrast !== null && item.contrast < 4.5 && (item.tag === 'button' || /btn|button/i.test(`${item.className || ''} ${item.selector}`)) && !item.disabled);
  for (const button of lowButtons.slice(0, 3)) {
    findings.push(finding('COL-01', `Button text contrast is ${button.contrast}:1.`, {
      severity: SEVERITY.warn,
      selector: button.selector,
      fix: 'Use the palette accentInk on accent.',
      where: `${ctx.width}x${ctx.height}`
    }));
  }

  // COL-02 - one accent family.
  const buckets = new Map();
  for (const swatch of facts.swatches) {
    if (swatch.sat < 0.3) continue;
    const bucket = Math.round(swatch.hue / 30) * 30;
    if (!buckets.has(bucket)) buckets.set(bucket, []);
    buckets.get(bucket).push(swatch);
  }
  const strongBuckets = [...buckets.entries()].filter(([, list]) => list.length >= 1);
  if (strongBuckets.length > 4) {
    findings.push(finding('COL-02', `${strongBuckets.length} saturated hue families appear on controls and surfaces.`, {
      severity: SEVERITY.warn,
      selector: 'button, a, input',
      detail: strongBuckets.map(([hue, list]) => `${hue}deg (${list.length})`).join(', '),
      fix: 'Keep one accent hue; let neutrals carry 90-95% of the page.',
      where: `${ctx.width}x${ctx.height}`
    }));
  }

  // COL-03 - no violet or lavender in the page's own design.
  const violet = facts.swatches.filter(swatch => isViolet({ r: swatch.rgb[0], g: swatch.rgb[1], b: swatch.rgb[2] }));
  if (violet.length) {
    const swatch = violet[0];
    findings.push(finding('COL-03', `A violet/lavender hue (${swatch.hue}deg) appears on ${swatch.where}.`, {
      severity: SEVERITY.fail,
      selector: swatch.where,
      fix: 'Remove the violet gradient or accent. Use the assigned palette.',
      where: `${ctx.width}x${ctx.height}`
    }));
  }

  // Centred headings over an empty hero look like floating text.
  const h1 = facts.headings.find(h => h.tag === 'h1');
  if (h1 && h1.textAlign === 'center' && facts.hero && !facts.hero.hasMedia) {
    findings.push(finding('LAY-01', 'The hero centres its headline over an empty background.', {
      severity: SEVERITY.warn,
      selector: h1.selector,
      fix: 'Give the hero a real visual layer or align the type to the grid.',
      where: `${ctx.width}x${ctx.height}`
    }));
  }

  return findings;
}
