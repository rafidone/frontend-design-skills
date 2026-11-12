// Accessibility audit.

import { finding, SEVERITY } from '../lib/rules.mjs';

export const id = 'a11y';
export const label = 'Accessibility';

const GENERIC_ALT = /^(image|photo|picture|graphic|icon|logo|hero|banner|screenshot)$/i;

export async function audit(ctx) {
  const { facts } = ctx;
  const findings = [];

  // A11Y-01 - controls need accessible names and form fields need labels.
  const focusables = facts.interactives.filter(item => !item.disabled);
  for (const item of focusables) {
    if (!['a', 'button', 'input', 'select', 'textarea', 'summary'].includes(item.tag) && !item.role) continue;
    const name = `${item.text} ${item.ariaLabel} ${item.explicitLabel}`.trim();
    const isButton = item.tag === 'button' || item.role === 'button';
    const isField = ['input', 'select', 'textarea'].includes(item.tag) && !['hidden', 'submit', 'button', 'reset', 'image'].includes(item.type);
    if (isField) {
      const named = name.length > 0 || item.placeholder && false;
      if (!named) {
        findings.push(finding('A11Y-01', 'A form field has no visible or programmatic label.', {
          severity: SEVERITY.fail,
          selector: item.selector,
          detail: item.name ? `name="${item.name}"` : '',
          fix: 'Add a <label for="..."> or aria-label. A placeholder is not a label.',
          where: `${ctx.width}x${ctx.height}`
        }));
      }
    } else if ((isButton || item.tag === 'a') && name.length === 0) {
      findings.push(finding('A11Y-01', `${item.tag === 'a' ? 'Link' : 'Button'} has no accessible name.`, {
        severity: SEVERITY.fail,
        selector: item.selector,
        fix: 'Add visible text, an aria-label, or alt text on the child image.',
        where: `${ctx.width}x${ctx.height}`
      }));
    }
    if (findings.filter(f => f.rule === 'A11Y-01').length >= 8) break;
  }

  // A11Y-02 - keyboard focus must be visible.
  const focus = await ctx.page.evaluate(() => {
    const focusables = [...document.querySelectorAll('a[href], button, input, select, textarea, summary, [tabindex]:not([tabindex="-1"])')]
      .filter(el => {
        const s = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        return s.display !== 'none' && s.visibility !== 'hidden' && r.width > 0 && r.height > 0 && !el.disabled;
      })
      .slice(0, 12);
    const signature = el => {
      const s = getComputedStyle(el);
      return [s.outlineStyle, s.outlineWidth, s.outlineColor, s.boxShadow, s.borderColor, s.backgroundColor].join('|');
    };
    let changed = false;
    let first = '';
    for (const el of focusables) {
      const before = signature(el);
      try { el.focus({ preventScroll: true }); } catch { continue; }
      const after = signature(el);
      if (before !== after) {
        changed = true;
        first = el.id ? `#${CSS.escape(el.id)}` : el.tagName.toLowerCase();
        break;
      }
    }
    let rules = 0;
    for (const sheet of document.styleSheets) {
      let list;
      try { list = sheet.cssRules; } catch { continue; }
      const walk = items => {
        for (const rule of items) {
          if (!rule) continue;
          if (rule.selectorText && /:focus-visible|:focus/.test(rule.selectorText)) rules++;
          if (rule.cssRules) walk(rule.cssRules);
        }
      };
      walk(list);
    }
    document.activeElement?.blur?.();
    return { changed, first, rules };
  }).catch(() => ({ changed: false, rules: 0, first: '' }));
  if (!focus.changed && focus.rules === 0) {
    findings.push(finding('A11Y-02', 'No visible focus style was detected for keyboard users.', {
      severity: SEVERITY.fail,
      selector: 'a, button, input',
      fix: 'Add :focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }.',
      where: `${ctx.width}x${ctx.height}`
    }));
  }

  // A11Y-03 - one h1, no skipped levels, no multiple h1s.
  const h1s = facts.headings.filter(heading => heading.tag === 'h1');
  if (h1s.length === 0) {
    findings.push(finding('A11Y-03', 'The page has no h1.', {
      severity: SEVERITY.fail,
      selector: 'main',
      fix: 'Add one h1 that names the offer.',
      where: `${ctx.width}x${ctx.height}`
    }));
  } else if (h1s.length > 1) {
    findings.push(finding('A11Y-03', `The page has ${h1s.length} h1 elements.`, {
      severity: SEVERITY.fail,
      selector: h1s[1].selector,
      fix: 'Keep one h1; use h2 for sections.',
      where: `${ctx.width}x${ctx.height}`
    }));
  }
  let previous = 0;
  for (const heading of facts.headings) {
    const level = Number(heading.tag.slice(1));
    if (previous && level > previous + 1) {
      findings.push(finding('A11Y-03', `Heading level jumps from h${previous} to h${level}.`, {
        severity: SEVERITY.fail,
        selector: heading.selector,
        detail: heading.text.slice(0, 100),
        fix: 'Use the next heading level in order.',
        where: `${ctx.width}x${ctx.height}`
      }));
      break;
    }
    previous = level;
  }

  // A11Y-04 - tap targets at phone widths.
  if (ctx.width <= 820) {
    for (const item of facts.interactives) {
      if (item.inline || item.disabled) continue;
      if (item.rect.width <= 0 || item.rect.height <= 0) continue;
      const min = Math.min(item.rect.width, item.rect.height);
      if (min < 40) {
        findings.push(finding('A11Y-04', `Tap target is ${Math.round(item.rect.width)}x${Math.round(item.rect.height)}px; 44x44 is the floor.`, {
          severity: SEVERITY.fail,
          selector: item.selector,
          detail: item.text || item.ariaLabel,
          fix: 'Increase padding or the hit area to at least 44x44px.',
          where: `${ctx.width}x${ctx.height}`
        }));
        if (findings.filter(f => f.rule === 'A11Y-04').length >= 6) break;
      } else if (min < 44) {
        findings.push(finding('A11Y-04', `Tap target is ${Math.round(item.rect.width)}x${Math.round(item.rect.height)}px, just under 44px.`, {
          severity: SEVERITY.warn,
          selector: item.selector,
          fix: 'Round the hit area up to 44px.',
          where: `${ctx.width}x${ctx.height}`
        }));
      }
    }
  }

  // A11Y-05 - images declare alt text.
  for (const image of facts.images.filter(img => img.displayed)) {
    if (image.alt === null) {
      findings.push(finding('A11Y-05', 'An image is missing the alt attribute.', {
        severity: SEVERITY.fail,
        selector: image.selector,
        detail: image.src.slice(0, 140),
        fix: 'Describe the content, or alt="" when the image is purely decorative.',
        where: `${ctx.width}x${ctx.height}`
      }));
    } else if (image.alt && GENERIC_ALT.test(image.alt.trim())) {
      findings.push(finding('A11Y-05', `Alt text "${image.alt}" does not describe the image.`, {
        severity: SEVERITY.warn,
        selector: image.selector,
        fix: 'Write a specific description of the subject and context.',
        where: `${ctx.width}x${ctx.height}`
      }));
    }
  }

  // A11Y-06 - skip link.
  const skip = facts.anchors.find(anchor => /skip/i.test(anchor.text) || ['#main', '#content', '#top'].includes(anchor.href)) ||
    await ctx.page.evaluate(() => Boolean(document.querySelector('a.skip-link, a[href="#main"], a[href="#content"]'))).catch(() => false);
  if (!skip) {
    findings.push(finding('A11Y-06', 'There is no skip link.', {
      severity: SEVERITY.warn,
      selector: 'header a',
      fix: 'Add <a class="skip-link" href="#main">Skip to content</a> as the first header link.',
      where: `${ctx.width}x${ctx.height}`
    }));
  }

  // aria-hidden must not contain readable content.
  for (const item of facts.hiddenText) {
    findings.push(finding('A11Y-01', 'Readable text is hidden from assistive technology with aria-hidden.', {
      severity: SEVERITY.fail,
      selector: item.selector,
      detail: item.text,
      fix: 'Remove aria-hidden or provide a duplicate accessible equivalent.',
      where: `${ctx.width}x${ctx.height}`
    }));
  }

  // Landmarks.
  const landmarks = await ctx.page.evaluate(() => ({
    main: document.querySelectorAll('main').length,
    nav: document.querySelectorAll('nav').length,
    unlabelledNav: [...document.querySelectorAll('nav')].filter(nav => !nav.getAttribute('aria-label') && !nav.getAttribute('aria-labelledby')).length
  })).catch(() => ({ main: 0, nav: 0, unlabelledNav: 0 }));
  if (landmarks.main !== 1) {
    findings.push(finding('A11Y-01', `The page has ${landmarks.main} main landmarks; exactly one is expected.`, {
      severity: SEVERITY.warn,
      selector: 'main',
      fix: 'Wrap the page content in a single <main>.',
      where: `${ctx.width}x${ctx.height}`
    }));
  }
  if (landmarks.nav > 1 && landmarks.unlabelledNav > 1) {
    findings.push(finding('A11Y-01', 'Multiple navigation landmarks have no accessible names.', {
      severity: SEVERITY.warn,
      selector: 'nav',
      fix: 'Add aria-label="Primary" and aria-label="Footer" to distinguish them.',
      where: `${ctx.width}x${ctx.height}`
    }));
  }

  return findings;
}
