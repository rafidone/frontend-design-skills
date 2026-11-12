// Motion audit: reduced-motion behaviour, budget, scroll hijacking.

import { finding, SEVERITY, NICHE } from '../lib/rules.mjs';

export const id = 'motion';
export const label = 'Motion';

const TECH_NICHES = new Set(['gaming', 'hardware', 'ai', 'devtool']);

export async function audit(ctx) {
  const { facts } = ctx;
  const findings = [];

  // MOT-01 - reduced-motion mode leaves content visible and stops loops.
  await ctx.page.emulateMedia({ reducedMotion: 'reduce' });
  await ctx.page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const reduced = await ctx.page.evaluate(() => {
    const animations = [];
    for (const animation of document.getAnimations()) {
      const timing = animation.effect?.getComputedTiming?.() || {};
      animations.push({
        name: animation.animationName || animation.id || '',
        state: animation.playState,
        duration: Number(timing.duration) || 0,
        iterations: timing.iterations === Infinity ? 'infinite' : Number(timing.iterations) || 0
      });
    }
    const invisible = [...document.querySelectorAll('[data-enter], [data-reveal], [data-fdm-enter]')]
      .filter(el => {
        const style = getComputedStyle(el);
        return Number(style.opacity) < 0.2 || style.visibility === 'hidden' || style.display === 'none';
      })
      .map(el => el.className || el.tagName.toLowerCase());
    return { animations, invisible };
  }).catch(() => ({ animations: [], invisible: [] }));
  for (const animation of reduced.animations) {
    if (animation.iterations === 'infinite' || animation.duration > 200) {
      findings.push(finding('MOT-01', `"${animation.name || 'animation'}" keeps running in reduced-motion mode (${animation.duration}ms, ${animation.iterations} iterations).`, {
        severity: SEVERITY.fail,
        selector: 'body',
        fix: 'Add a prefers-reduced-motion block that sets animation: none and transition-duration: 0.01ms.',
        where: `${ctx.width}x${ctx.height}`
      }));
      break;
    }
  }
  if (reduced.invisible.length) {
    findings.push(finding('MOT-01', `${reduced.invisible.length} entrance element(s) stay hidden when motion is reduced.`, {
      severity: SEVERITY.fail,
      selector: '[data-enter]',
      detail: reduced.invisible.slice(0, 4).join(', '),
      fix: 'Reduced motion must render the finished state, never the pre-animation state.',
      where: `${ctx.width}x${ctx.height}`
    }));
  }
  await ctx.page.emulateMedia({ reducedMotion: 'no-preference' });

  // MOT-03 - no scroll-snap, no locked body, no smooth-scroll hijacking.
  if (facts.scrollSnap.length) {
    findings.push(finding('MOT-03', `Scroll snapping is active on ${facts.scrollSnap[0].selector}.`, {
      severity: SEVERITY.fail,
      selector: facts.scrollSnap[0].selector,
      fix: 'Remove scroll-snap-type from the page and sections.',
      where: `${ctx.width}x${ctx.height}`
    }));
  }
  if (facts.document.overflowX === 'hidden' && facts.document.scrollHeight > facts.viewport.height * 1.2) {
    // overflow-x hidden is normal; this branch only documents it and never fails.
  }
  if (facts.document.scrollBehavior === 'smooth') {
    findings.push(finding('MOT-03', 'Smooth scrolling is applied to the whole document.', {
      severity: SEVERITY.warn,
      selector: 'html',
      fix: 'Use scroll-behavior: smooth only on anchor navigation, never globally.',
      where: `${ctx.width}x${ctx.height}`
    }));
  }

  // MOT-02 - motion budget.
  if (facts.canvases.length > 4) {
    findings.push(finding('MOT-02', `${facts.canvases.length} canvases are active; the budget is four.`, {
      severity: SEVERITY.fail,
      selector: 'canvas',
      fix: 'Keep one hero scene and one moment. Remove the rest.',
      where: `${ctx.width}x${ctx.height}`
    }));
  }
  const infinite = facts.animations.filter(animation => animation.iterations === 'infinite');
  if (infinite.length > 4) {
    findings.push(finding('MOT-02', `${infinite.length} infinite animations are running.`, {
      severity: SEVERITY.warn,
      selector: 'body',
      detail: infinite.slice(0, 6).map(a => a.name || a.selector).join(', '),
      fix: 'Keep at most one ambient loop and pause it when off-screen or when reduced motion is set.',
      where: `${ctx.width}x${ctx.height}`
    }));
  }
  const longAnimations = facts.animations.filter(animation => animation.duration > 1600 && animation.iterations !== 'infinite');
  if (longAnimations.length > 2) {
    findings.push(finding('MOT-02', `${longAnimations.length} animations run longer than 1.6s.`, {
      severity: SEVERITY.warn,
      selector: 'body',
      fix: 'Keep interface transitions under 400ms; reserve long timings for one scene moment.',
      where: `${ctx.width}x${ctx.height}`
    }));
  }

  // Niche gating for heavy effects.
  const niche = NICHE[ctx.niche] || null;
  if (niche && !niche.effects && (facts.canvases.length > 0 || facts.resources.some(r => /three|babylon|gsap|shader/i.test(r.name)))) {
    findings.push(finding('NICHE-02', `A ${niche.label} page loads a canvas or heavy motion library.`, {
      severity: SEVERITY.warn,
      selector: 'canvas',
      fix: 'Reserve WebGL and GSAP for gaming, hardware and technical pages.',
      where: `${ctx.width}x${ctx.height}`
    }));
  }
  if (niche && niche.effects && TECH_NICHES.has(ctx.niche) && facts.canvases.length === 0 && ctx.niche === 'gaming') {
    findings.push(finding('NICHE-01', 'A gaming page has no cinematic visual moment or key art layer.', {
      severity: SEVERITY.warn,
      selector: 'body',
      fix: 'Lead with key art or an in-engine shot; add one hero entrance or scene moment.',
      where: `${ctx.width}x${ctx.height}`
    }));
  }

  // Hover affordance: check that at least one stylesheet declares :hover for
  // interactive components. Cross-origin sheets are skipped silently.
  if (facts.interactives.length > 3) {
    const hoverRules = await ctx.page.evaluate(() => {
      let count = 0;
      for (const sheet of document.styleSheets) {
        let rules;
        try { rules = sheet.cssRules; } catch { continue; }
        const walk = list => {
          for (const rule of list) {
            if (!rule) continue;
            if (rule.selectorText && /:hover|:focus-visible/.test(rule.selectorText)) count++;
            if (rule.cssRules) walk(rule.cssRules);
          }
        };
        try { walk(rules); } catch { /* ignore */ }
      }
      return count;
    }).catch(() => 0);
    if (hoverRules === 0) {
      findings.push(finding('MOT-02', 'No hover or focus-visible rule is declared for interactive controls.', {
        severity: SEVERITY.warn,
        selector: 'a, button',
        fix: 'Add a quiet hover lift and a visible focus ring.',
        where: `${ctx.width}x${ctx.height}`
      }));
    }
  }

  return findings;
}
