# Authoring rules

This document is for people changing the skill itself. It explains how to add a
rule, extend an audit, add a palette or type pairing, add an asset, and prove the
change without weakening the gate.

## 1. Start with an observable failure

A rule exists because a real page can fail in a way a reviewer can see. Before
writing code, describe:

- **the defect** - what is wrong on screen or in the DOM;
- **the evidence** - the property, resource, geometry or text that proves it;
- **the repair** - what the builder should change;
- **the exemption** - what is legitimately allowed to look similar.

If the evidence cannot be collected in Chrome, it is not a browser rule. It may
belong in copy review or asset review, but it should not pretend to be measured.

## 2. Choose the right rule family

| Prefix | Family | Examples |
| --- | --- | --- |
| `LAY` | Composition and geometry | hero alone, section budget, overflow, stacking |
| `TYP` | Type and reading | body size, measure, font loading, heading scale |
| `COL` | Colour | contrast, one accent, no violet |
| `VIS` | Visual evidence | images render, no placeholders, no captions |
| `MOT` | Motion | reduced motion, budget, scroll behaviour |
| `COP` | Copy | filler, CTA quality, stock phrases, invented proof |
| `A11Y` | Accessibility | names, focus, heading order, targets, alt, skip link |
| `AST` | Assets | provenance, resolution, credits |
| `PERF` | Weight and stability | transfer budget, layout shift, blocking assets |
| `SYS` | System integrity | one radius family, box depth, fake UI, runtime errors |
| `NICHE` | Art direction | visual language, cliché list |

Use the next free two-digit number in the family. Keep the title short and
imperative; it appears in reports and reference tables.

## 3. Decide the severity

- `FAIL` blocks the gate. Use it for unreadable text, broken layout, missing
  accessible names, unresolved assets, runtime errors and deceptive copy.
- `WARN` requires review but can ship. Use it for a slightly long measure, an
  extra stylesheet, a radius outlier or a missing hover state.
- `INFO` is context. Do not use it for a defect.

Structural rules cannot be waived: `LAY-01`, `LAY-04`, `A11Y-03`, `COL-01` and
`SYS-04`. If a proposed rule has the same consequence, add it to the structural
set in `scripts/verify.mjs` and explain why in `rules/90-verification.md`.

## 4. Implement the check

1. Add the ID and title to `scripts/lib/rules.mjs`:

```js
'LAY-07': 'Adjacent sections use one vertical rhythm'
```

2. Add the check to the audit that owns the evidence. The audit returns findings
   from the shared factory:

```js
findings.push(finding('LAY-07', 'Two adjacent sections use different padding.', {
  severity: SEVERITY.warn,
  selector: section.selector,
  detail: `${Math.round(section.rect.height)}px tall`,
  fix: 'Use the section rhythm tokens instead of one-off padding.',
  where: `${ctx.width}x${ctx.height}`
}));
```

3. Prefer facts already collected. Use `ctx.facts` for DOM, styles, geometry,
   resources, images, headings and text. Query the page directly only for an
   interaction such as focus visibility or reduced-motion behaviour, and isolate
   it so it cannot disturb another audit.

4. One defect, one finding. Merge repeated instances into a summary row when the
   selector is not useful; otherwise emit the first few examples with selectors
   and a count.

5. Do not mutate the page permanently. If a check needs a class, media emulation
   or focus, restore it before returning.

6. Guard unavailable capabilities. `document.fonts` and `matchMedia` can be
   missing or throw in unusual embeddings; use `try/catch` and emit no finding
   when the evidence is unavailable rather than inventing a failure.

## 5. Add the documentation

Update the numbered rule document that owns the topic. A rule entry needs:

- the ID and title;
- what fails and why;
- what passes;
- the exact evidence used;
- a concrete repair;
- the legitimate exemptions.

If the rule changes the build loop or the gate, update `SKILL.md` and the
relevant reference (`references/gate.md`, `references/browser-checks.md`).

## 6. Prove it

Every new rule needs at least one of:

- a case in `tests/fixtures/bad/index.html` that triggers it;
- a unit test for a pure helper;
- a focused assertion in `tests/e2e/run.mjs`;
- a documented manual check in `rules/90-verification.md` when browser automation
  cannot express it.

The bad fixture is intentionally small. Add the smallest markup and style needed
to create the defect, then add the rule to `REQUIRED_BAD_RULES` in the end-to-end
test. Do not weaken an existing rule to make room for a new one.

For a false positive, first fix the detector. A waiver is the last resort, not a
test strategy. When a false positive cannot be avoided, add a positive fixture
case that must not fire.

## 7. Adding a palette

Palettes live in `assets/palettes/palettes.json`. A palette needs:

```json
{
  "id": "lowercase-hyphenated",
  "name": "Human readable name",
  "mode": "light",
  "tags": ["light-neutral", "mono-accent"],
  "niches": ["software", "service"],
  "bg": "#ffffff",
  "surface": "#f3f4f2",
  "ink": "#14171a",
  "muted": "#5e6468",
  "accent": "#1a4be0",
  "accentInk": "#ffffff",
  "bandBg": "#14171a",
  "bandInk": "#f7f7f4",
  "contrast": { "body": "17.8:1", "muted": "5.8:1", "accent": "6.3:1" },
  "note": "One sentence on where this palette belongs.",
  "avoid": "One sentence on where it does not."
}
```

Rules:

- `ink` on `bg`, `muted` on `bg`, `accent` on `bg`, `accentInk` on `accent` and
  `bandInk` on `bandBg` must each reach 4.5:1.
- The accent must not be violet or lavender (`isViolet()` must return false).
- The palette must have a light and a dark mode counterpart in the starter; do
  not ship a light-only token set.
- `note` and `avoid` must be specific enough to make the choice reviewable.
- Update `loadLibraries` tests if the schema grows.

Run:

```bash
node skills/frontend-design-skills/scripts/assign.mjs --niche software --seed check
npm test
```

## 8. Adding a type pairing

Pairings live in `assets/typography/type-pairs.json`. Each pairing declares:

- `display.family`, `text.family`, and optionally `mono.family`;
- weights, tracking, line height and a three-step scale;
- one Google Fonts URL for all families;
- niche tags, a `suits` line and an `avoid` line;
- fallback stacks.

Rules:

- Display and text roles must be distinct in voice, not just weight.
- No font on the banned generic list: Inter, Roboto, Open Sans, Lato, Montserrat,
  Poppins, Space Grotesk, Plus Jakarta Sans, Arial, Helvetica.
- Load at most two families plus one mono. Do not request unused weights.
- Serif display is a choice, not a default; pair it with a neutral interface sans.
- Sans display needs a real display cut or a strong tracking decision, not a body
  face at a larger size.

Add a test that the URL is one request and every declared family is used by
`patchTokens()`.

## 9. Adding a photograph or icon

Photographs must be local, standards-compliant and provenance-complete:

- public domain or CC0 only, unless the client supplies a licensed asset;
- WebP, sized for its placement, below 500 KB where possible;
- `width`, `height`, `bytes` and `sha256` recorded;
- author, licence, licence URL, source URL and a useful `alt`;
- `credit_required` and `credit` text if the licence asks for attribution;
- a path that is lowercase, hyphenated and contains no spaces.

Add the file under `assets/photos/`, update `manifest.json`, then run:

```bash
node skills/frontend-design-skills/scripts/assets.mjs verify
node skills/frontend-design-skills/scripts/assets.mjs photos credits --out /tmp/credits.html
```

Icons are local SVG files with a manifest entry. Do not add an icon CDN or a
remote sprite. Do not redraw a brand mark by hand; use the supplied brand icon
set and follow its usage note.

## 10. Copy rules for fixtures and examples

Fixtures are not marketing pages. They exist to prove the audits. Still:

- no lorem ipsum in the good fixture;
- no stock phrases;
- no invented customer counts, ratings or logos;
- no "Feature one / Feature two" placeholders;
- alt text must describe the image, not repeat the filename.

The bad fixture is the one place where deliberate filler is allowed, and it must
be clearly labelled as a broken fixture.

## 11. Keep the clean room

- Never write the prohibited token anywhere, including comments, test names,
  fixture paths or report examples.
- The linter assembles the token at runtime. If a new test needs to demonstrate a
  failure, use `String.fromCharCode(...)` exactly like `lint-name.test.mjs`.
- Do not copy prose from another design skill. Read it for comparison if needed,
  then close it and write from the observed result.
- Name files and components by what they do in this system, not by another
  project's vocabulary.

Run `npm run lint:name` before every commit. It scans filenames, directory names
and text content.

## 12. Pre-merge checklist

```bash
npm run lint:name
npm test
npm run test:e2e
npm run doctor
node skills/frontend-design-skills/scripts/verify.mjs \
  skills/frontend-design-skills/assets/starter --full --kind service --no-shots \
  --state /tmp/fdm-starter
```

Then confirm:

- [ ] The starter still passes the full gate.
- [ ] Both fixtures still behave as expected.
- [ ] The bad fixture triggers every required rule.
- [ ] No new warning was introduced by making a detector more permissive.
- [ ] Reports render with the new rule and its fix text.
- [ ] Documentation uses the same ID, title and severity as the code.
- [ ] The linter is green.
