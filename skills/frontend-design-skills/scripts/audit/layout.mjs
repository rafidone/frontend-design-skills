// Layout audit: hero alone, section budget, equal edges, overflow, collisions.

import { finding, SEVERITY } from '../lib/rules.mjs';

export const id = 'layout';
export const label = 'Layout';

export async function audit(ctx) {
  const { facts, height } = ctx;
  const findings = [];
  const viewportHeight = facts.viewport.height || height;

  // LAY-01 - the hero owns the first screen. Nothing of the next section may
  // show at load on tablet and desktop widths.
  if (ctx.width >= 700 && facts.hero) {
    const heroBottom = facts.hero.rect.bottom;
    const following = facts.sections
      .filter(section => section.rect.top >= heroBottom - 4 && section.selector !== facts.hero.selector)
      .sort((a, b) => a.rect.top - b.rect.top)[0];
    const heroLeavesGap = heroBottom < viewportHeight - 8;
    if (following && following.rect.top < viewportHeight - 8 && following.rect.height > 40) {
      findings.push(finding('LAY-01', `The next section starts at ${Math.round(following.rect.top)}px, inside the first ${viewportHeight}px screen.`, {
        severity: SEVERITY.fail,
        selector: following.selector,
        detail: `${following.heading || following.tag} peeks below the hero.`,
        fix: 'Give the hero min-height: 100svh and move the first section to the next screen.',
        where: `${ctx.width}x${ctx.height}`
      }));
    } else if (heroLeavesGap && facts.hero.rect.height < viewportHeight * 0.92) {
      findings.push(finding('LAY-01', `The hero is only ${Math.round(facts.hero.rect.height)}px tall on a ${viewportHeight}px screen.`, {
        severity: SEVERITY.warn,
        selector: facts.hero.selector,
        fix: 'Let the hero fill the first screen: min-height: 100svh; align-content: center.',
        where: `${ctx.width}x${ctx.height}`
      }));
    }
  }

  // LAY-02 - sections are one or two screens on desktop. Allow compact content
  // sections below 0.85 screens and discard nav/footer chrome.
  if (ctx.width >= 1024 && viewportHeight > 0) {
    for (const section of facts.sections) {
      if (!['section'].includes(section.tag) && !section.data['fdm-section']) continue;
      if (section.classes.includes('hero') || section.selector === facts.hero?.selector) continue;
      if (section.rect.height < viewportHeight * 0.3) continue;
      const ratio = section.rect.height / viewportHeight;
      const acceptable = ratio <= 0.85 || (ratio >= 0.9 && ratio <= 1.16) || (ratio >= 1.84 && ratio <= 2.16);
      if (!acceptable) {
        const twoScreen = ratio > 1.16 && ratio < 1.84;
        findings.push(finding('LAY-02', `Section is ${ratio.toFixed(2)} screens tall (${Math.round(section.rect.height)}px at ${ctx.width}x${ctx.height}).`, {
          severity: SEVERITY.fail,
          selector: section.selector,
          detail: section.heading ? `Heading: ${section.heading}` : '',
          fix: twoScreen
            ? 'Split the content into two sections or grow the visual so the section reaches a clean two screens.'
            : 'Trim the section to one screen, or let it become two full screens; avoid in-between heights.',
          where: `${ctx.width}x${ctx.height}`
        }));
      }
    }
  }

  // LAY-03 - major containers keep equal left and right edges.
  const containers = [];
  for (const section of facts.sections) {
    for (const selector of ['wrap', 'container', 'inner', 'shell']) {
      if (!section.classes.split(/\s+/).includes(selector)) continue;
    }
  }
  const edges = await ctx.page.evaluate(() => {
    const out = [];
    const candidates = document.querySelectorAll('.wrap, .container, .inner, [data-fdm-wrap], main > section > .wrap');
    for (const el of candidates) {
      const style = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      if (rect.width < innerWidth * 0.45 || rect.width > innerWidth - 1) continue;
      if (style.position === 'fixed' || style.display === 'none') continue;
      const left = rect.left;
      const right = innerWidth - rect.right;
      if (Math.abs(left - right) > 3) {
        out.push({
          selector: el.id ? `#${CSS.escape(el.id)}` : `${el.tagName.toLowerCase()}.${[...el.classList].map(c => CSS.escape(c)).join('.')}`,
          left: Math.round(left), right: Math.round(right), width: Math.round(rect.width),
          maxWidth: style.maxWidth, marginLeft: style.marginLeft, marginRight: style.marginRight
        });
      }
    }
    return out.slice(0, 12);
  }).catch(() => []);
  for (const edge of edges) {
    containers.push(finding('LAY-03', `Container is off-centre: ${edge.left}px left and ${edge.right}px right.`, {
      severity: SEVERITY.fail,
      selector: edge.selector,
      detail: `width ${edge.width}px, max-width ${edge.maxWidth}`,
      fix: 'Use width: min(100% - 2 * var(--gutter), var(--container)); margin-inline: auto.',
      where: `${ctx.width}x${ctx.height}`
    }));
  }
  findings.push(...containers);

  // LAY-04 - no page-level horizontal overflow.
  const scrollWidth = facts.document.scrollWidth;
  if (scrollWidth > ctx.width + 1.5) {
    const offenders = facts.overflow
      .filter(item => item.rect.right > ctx.width + 1.5 || item.rect.left < -1.5)
      .slice(0, 5)
      .map(item => `${item.selector} (${Math.round(item.rect.left)}..${Math.round(item.rect.right)})`);
    findings.push(finding('LAY-04', `The page scrolls horizontally: ${scrollWidth}px wide on a ${ctx.width}px viewport.`, {
      severity: SEVERITY.fail,
      selector: facts.overflow[0]?.selector || 'html',
      detail: offenders.join('; '),
      fix: 'Remove fixed widths, allow grids to shrink with minmax(0, 1fr), and add overflow-wrap: anywhere to long tokens.',
      where: `${ctx.width}x${ctx.height}`
    }));
  }

  // LAY-05 - sections must not overlap unless the overlap is an explicit
  // negative-margin ribbon of a few pixels.
  const ordered = facts.sections.filter(s => s.rect.height > 60).sort((a, b) => a.rect.top - b.rect.top);
  for (let i = 1; i < ordered.length; i++) {
    const previous = ordered[i - 1];
    const current = ordered[i];
    const overlap = previous.rect.bottom - current.rect.top;
    if (overlap > 24 && current.rect.top > previous.rect.top) {
      findings.push(finding('LAY-05', `${current.selector} overlaps the section above by ${Math.round(overlap)}px.`, {
        severity: SEVERITY.fail,
        selector: current.selector,
        fix: 'Remove the negative offset or give the section enough top padding for the overlap.',
        where: `${ctx.width}x${ctx.height}`
      }));
      break;
    }
  }

  // LAY-05 - fixed chrome must not cover the first heading.
  const headerHeight = facts.document.fixedHeaderHeight;
  if (ctx.width < 700 && headerHeight > 0) {
    const firstHeading = facts.headings.find(h => h.tag === 'h1');
    if (firstHeading && firstHeading.rect.top < headerHeight - 2) {
      findings.push(finding('LAY-05', `The h1 starts ${Math.round(headerHeight - firstHeading.rect.top)}px under the fixed header.`, {
        severity: SEVERITY.fail,
        selector: firstHeading.selector,
        fix: 'Add scroll-padding-top and hero padding equal to the header height.',
        where: `${ctx.width}x${ctx.height}`
      }));
    }
  }

  // LAY-06 - on narrow screens, two-column grids must collapse.
  if (ctx.width <= 820) {
    const stuck = await ctx.page.evaluate(() => {
      const out = [];
      for (const el of document.querySelectorAll('main *, section *')) {
        const style = getComputedStyle(el);
        if (style.display !== 'grid' || style.gridTemplateColumns === 'none') continue;
        const tracks = style.gridTemplateColumns.split(' ').filter(Boolean);
        const rect = el.getBoundingClientRect();
        if (tracks.length >= 2 && rect.width > 480 && rect.width > innerWidth * 0.8) {
          const cards = [...el.children].map(child => child.getBoundingClientRect()).filter(r => r.width > 80);
          if (cards.length >= 2 && cards.every(r => r.width < rect.width * 0.58)) {
            out.push({ selector: el.className ? `.${[...el.classList].map(c => CSS.escape(c)).join('.')}` : el.tagName.toLowerCase(), tracks: tracks.length, width: Math.round(rect.width) });
          }
        }
      }
      return out.slice(0, 4);
    }).catch(() => []);
    for (const item of stuck) {
      findings.push(finding('LAY-06', `A ${item.tracks}-column grid stays side by side at ${ctx.width}px.`, {
        severity: SEVERITY.fail,
        selector: item.selector,
        fix: 'Collapse the grid to one column at 820px or below.',
        where: `${ctx.width}x${ctx.height}`
      }));
    }
  }

  return findings;
}
