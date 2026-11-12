export const SEVERITY = { fail: 'FAIL', warn: 'WARN', info: 'INFO' };

export const RULES = {
  'LAY-01': 'Hero occupies the first screen alone',
  'LAY-02': 'Sections are one or two viewport screens',
  'LAY-03': 'Equal left and right content edges',
  'LAY-04': 'No horizontal overflow',
  'LAY-05': 'No overlapping content',
  'LAY-06': 'Tablet and mobile stacking is clean',
  'TYP-01': 'Body text is at least 16px',
  'TYP-02': 'Text measure is at most 62 characters',
  'TYP-03': 'Every font family loads',
  'TYP-04': 'One heading hierarchy',
  'TYP-05': 'Primary typefaces are art-directed',
  'COL-01': 'Text contrast passes',
  'COL-02': 'One accent colour',
  'COL-03': 'No violet or lavender in the design',
  'VIS-01': 'Every visual renders',
  'VIS-02': 'No placeholder content',
  'VIS-03': 'No captions under visuals',
  'MOT-01': 'Reduced motion is respected',
  'MOT-02': 'Motion budget is respected',
  'MOT-03': 'No scroll-jacking or scroll-snap',
  'COP-01': 'No lorem ipsum or filler copy',
  'COP-02': 'Buttons are a verb and an object',
  'COP-03': 'No stock marketing phrases',
  'A11Y-01': 'Controls have accessible names',
  'A11Y-02': 'Focus is visible',
  'A11Y-03': 'Heading order is valid',
  'A11Y-04': 'Tap targets are at least 44px',
  'A11Y-05': 'Images have alternative text',
  'A11Y-06': 'A skip link is present',
  'AST-01': 'Photographs declare a source and licence trail',
  'AST-02': 'Referenced assets resolve',
  'AST-03': 'Credits are present when library photos are used',
  'COP-04': 'No invented proof or customer claims',
  'PERF-01': 'Page and image weight are within budget',
  'PERF-02': 'No avoidable layout shift',
  'PERF-03': 'Render-blocking assets are limited',
  'SYS-01': 'One visual system is used',
  'SYS-02': 'No more than two boxes deep',
  'SYS-03': 'No fake product UI',
  'SYS-04': 'The page renders without script errors',
  'NICHE-01': 'The visual language matches the niche',
  'NICHE-02': 'The niche cliché list is respected'
};

export const BANNED_PHRASES = [
  'elevate your', 'seamless experience', 'unleash the power', 'revolutionize',
  'next-generation', 'next gen', 'cutting-edge', 'game-changing', 'game changing',
  'supercharge', 'unlock the power', 'transform your business',
  'built for the future', 'trusted by teams everywhere', 'the future of work',
  'empower your team', 'take it to the next level', 'best-in-class',
  'world-class', 'state-of-the-art', 'one-stop shop', 'synergy'
];

export const BANNED_FONTS = [
  'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins',
  'Space Grotesk', 'Plus Jakarta Sans', 'Arial', 'Helvetica'
];

export const NICHE = {
  software: { label: 'SaaS / software', motion: 'T1', density: 'medium', photos: 'people and product context', effects: false },
  devtool: { label: 'Developer tool', motion: 'T1', density: 'medium', photos: 'product context', effects: false },
  ai: { label: 'AI / technical', motion: 'T1', density: 'medium', photos: 'technical context', effects: true },
  gaming: { label: 'Gaming', motion: 'T2', density: 'dense', photos: 'key art and setting', effects: true },
  hardware: { label: 'Hardware', motion: 'T2', density: 'medium', photos: 'macro product', effects: true },
  commerce: { label: 'Commerce / consumer product', motion: 'T1', density: 'medium', photos: 'product photography', effects: false },
  hospitality: { label: 'Hospitality / place', motion: 'T0', density: 'calm', photos: 'real place photography', effects: false },
  service: { label: 'Service / professional', motion: 'T0', density: 'calm', photos: 'people and work', effects: false },
  editorial: { label: 'Editorial / portfolio', motion: 'T1', density: 'expressive', photos: 'custom work', effects: false }
};

export const HERO_PATTERNS = [
  'split', 'photo', 'product', 'editorial', 'collage',
  'statement', 'film', 'triptych', 'centred', 'word'
];

export const COMPOSITIONS = ['product-ui-first', 'bleed', 'pair', 'trio', 'strip', 'tall-small', 'editorial-index', 'type-led'];

export function finding(rule, message, options = {}) {
  return {
    rule,
    severity: options.severity || SEVERITY.fail,
    message,
    selector: options.selector || '',
    detail: options.detail || '',
    fix: options.fix || '',
    where: options.where || '',
    evidence: options.evidence || null
  };
}

export function summarize(findings) {
  const out = { pass: 0, warn: 0, fail: 0, info: 0, total: findings.length };
  for (const f of findings) {
    if (f.severity === 'FAIL') out.fail++;
    else if (f.severity === 'WARN') out.warn++;
    else if (f.severity === 'INFO') out.info++;
    else out.pass++;
  }
  return out;
}

export function applyWaivers(findings, waivers = []) {
  const used = new Set();
  const out = findings.map(f => {
    for (let i = 0; i < waivers.length; i++) {
      if (used.has(i)) continue;
      const w = waivers[i] || {};
      const check = String(w.check || w.rule || '');
      const target = String(w.target || w.selector || '');
      const reason = String(w.reason || '').trim();
      if (!check || !target || target.length < 3 || reason.length < 12) continue;
      const haystack = `${f.rule} ${f.selector} ${f.where} ${f.message}`;
      if (f.rule === check && haystack.includes(target)) {
        used.add(i);
        return { ...f, severity: 'WAIVED', waiver: reason };
      }
    }
    return f;
  });
  return { findings: out, used: [...used], unused: waivers.map((_, i) => i).filter(i => !used.has(i)) };
}
