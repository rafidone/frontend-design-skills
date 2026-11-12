// Copy audit: filler, CTA quality, heading quality, invented proof.

import { finding, SEVERITY, BANNED_PHRASES } from '../lib/rules.mjs';

export const id = 'copy';
export const label = 'Copy';

const LOREM = /\b(lorem ipsum|dolor sit amet|consectetur adipiscing|placeholder text|dummy copy|sample text|insert copy)\b/i;
const GENERIC_CTA = /^(learn more|read more|find out more|see more|get started|try it|try now|submit|send|continue|next|go|click|click here|more info|details)$/i;
const GENERIC_HEADING = /^(features|benefits|why us|why choose us|our services|solutions|about us|how it works|testimonials|pricing|contact)$/i;
const PROOF = /\b(trusted by|used by|joined by)\s+([\d,.]+[k+]?\+?)\s+(teams|companies|customers|users|businesses)\b/i;
const RATING = /(★{4,5}|⭐{4,5})/;

export async function audit(ctx) {
  const findings = [];
  const copy = await ctx.page.evaluate(() => ({
    text: document.body.innerText || '',
    title: document.title || '',
    description: document.querySelector('meta[name="description"]')?.content || '',
    headings: [...document.querySelectorAll('h1, h2, h3')].map(el => ({ tag: el.tagName.toLowerCase(), text: (el.innerText || '').replace(/\s+/g, ' ').trim(), selector: el.id ? `#${CSS.escape(el.id)}` : el.tagName.toLowerCase() })),
    buttons: [...document.querySelectorAll('button, a[role="button"], a.btn, a[class*="button"]')].map(el => ({ text: (el.innerText || '').replace(/\s+/g, ' ').trim(), selector: el.id ? `#${CSS.escape(el.id)}` : el.tagName.toLowerCase() }))
  })).catch(() => ({ text: '', title: '', description: '', headings: [], buttons: [] }));

  // COP-01 - no lorem or placeholder copy.
  const lorem = copy.text.match(LOREM);
  if (lorem) {
    findings.push(finding('COP-01', `Placeholder copy is visible: "${lorem[0]}".`, {
      severity: SEVERITY.fail,
      selector: 'body',
      fix: 'Write real offer copy for this business.',
      where: `${ctx.width}x${ctx.height}`
    }));
  }
  if (/\b(sample|example|dummy) data\b/i.test(copy.text)) {
    findings.push(finding('COP-01', 'Visible copy says "sample data".', {
      severity: SEVERITY.warn,
      selector: 'body',
      fix: 'Mark mock data in code comments, never in the interface.',
      where: `${ctx.width}x${ctx.height}`
    }));
  }

  // COP-03 - no stock marketing filler.
  const lower = copy.text.toLowerCase();
  const hits = [];
  for (const phrase of BANNED_PHRASES) {
    if (lower.includes(phrase)) hits.push(phrase);
  }
  if (hits.length) {
    findings.push(finding('COP-03', `${hits.length} stock phrase(s) appear in the copy.`, {
      severity: SEVERITY.fail,
      selector: 'body',
      detail: hits.slice(0, 8).map(hit => `"${hit}"`).join(', '),
      fix: 'Replace each phrase with a concrete claim about what the product does.',
      where: `${ctx.width}x${ctx.height}`
    }));
  }

  // COP-02 - buttons say what happens.
  for (const button of copy.buttons) {
    if (!button.text) continue;
    if (/click here/i.test(button.text)) {
      findings.push(finding('COP-02', 'A primary action says "click here".', {
        severity: SEVERITY.fail,
        selector: button.selector,
        fix: 'Name the action and its object, for example "Book a table".',
        where: `${ctx.width}x${ctx.height}`
      }));
    } else if (GENERIC_CTA.test(button.text)) {
      findings.push(finding('COP-02', `"${button.text}" does not name an object.`, {
        severity: SEVERITY.warn,
        selector: button.selector,
        fix: 'Use verb + object: "Start the trial", "See the menu", "Book a room".',
        where: `${ctx.width}x${ctx.height}`
      }));
    }
    if (findings.filter(f => f.rule === 'COP-02').length >= 5) break;
  }
  const primary = copy.buttons.filter(button => button.text && !GENERIC_CTA.test(button.text));
  if (copy.buttons.length > 0 && primary.length === 0) {
    findings.push(finding('COP-02', 'Every action is a generic label; none names the outcome.', {
      severity: SEVERITY.warn,
      selector: 'button, a.btn',
      fix: 'Write one primary action that names what the visitor gets.',
      where: `${ctx.width}x${ctx.height}`
    }));
  }

  // Heading quality.
  if (!copy.headings.some(heading => heading.tag === 'h2') && copy.text.length > 600) {
    findings.push(finding('A11Y-03', 'The page has no h2 section headings.', {
      severity: SEVERITY.warn,
      selector: 'main',
      fix: 'Give each section a specific h2.',
      where: `${ctx.width}x${ctx.height}`
    }));
  }
  for (const heading of copy.headings) {
    if (GENERIC_HEADING.test(heading.text)) {
      findings.push(finding('COP-03', `The heading "${heading.text}" is a label, not an idea.`, {
        severity: SEVERITY.warn,
        selector: heading.selector,
        fix: 'Say what the section proves or shows.',
        where: `${ctx.width}x${ctx.height}`
      }));
    }
    if (heading.text.length < 3 && heading.tag !== 'h3') {
      findings.push(finding('COP-01', 'A heading is empty or one character long.', {
        severity: SEVERITY.fail,
        selector: heading.selector,
        fix: 'Write a specific heading.',
        where: `${ctx.width}x${ctx.height}`
      }));
    }
    if (findings.filter(f => f.rule === 'COP-03').length >= 6) break;
  }

  // COP-04 - no invented proof.
  const proof = copy.text.match(PROOF);
  if (proof) {
    findings.push(finding('COP-04', `The page claims "${proof[0]}" without a source.`, {
      severity: SEVERITY.fail,
      selector: 'body',
      fix: 'Use a real, linkable customer count or remove the claim.',
      where: `${ctx.width}x${ctx.height}`
    }));
  }
  if (RATING.test(copy.text)) {
    findings.push(finding('COP-04', 'The page shows a star rating with no source or review system.', {
      severity: SEVERITY.warn,
      selector: 'body',
      fix: 'Link a real review source or remove the rating.',
      where: `${ctx.width}x${ctx.height}`
    }));
  }

  // Metadata.
  if (!copy.title || copy.title.length < 8) {
    findings.push(finding('COP-01', 'The document title is missing or too short.', {
      severity: SEVERITY.warn,
      selector: 'head title',
      fix: 'Write a title naming the business and the offer.',
      where: `${ctx.width}x${ctx.height}`
    }));
  }
  if (!copy.description || copy.description.length < 50) {
    findings.push(finding('COP-01', 'The meta description is missing or too short.', {
      severity: SEVERITY.warn,
      selector: 'meta[name="description"]',
      fix: 'Write a 120-160 character description of the offer.',
      where: `${ctx.width}x${ctx.height}`
    }));
  }

  // Repeated headings make a template obvious.
  const seen = new Map();
  for (const heading of copy.headings) {
    const key = heading.text.toLowerCase();
    if (key.length < 4) continue;
    seen.set(key, (seen.get(key) || 0) + 1);
  }
  const repeated = [...seen.entries()].filter(([, count]) => count > 1);
  if (repeated.length) {
    findings.push(finding('COP-03', `${repeated.length} heading(s) repeat word for word.`, {
      severity: SEVERITY.warn,
      selector: 'h2',
      detail: repeated.slice(0, 4).map(([text]) => `"${text}"`).join(', '),
      fix: 'Give every section a distinct idea.',
      where: `${ctx.width}x${ctx.height}`
    }));
  }

  return findings;
}
