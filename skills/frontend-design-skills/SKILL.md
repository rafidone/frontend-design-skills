---
name: frontend-design-skills
description: >-
  Build, redesign or audit production-grade frontend interfaces with a locked
  art direction and real-browser verification. Use when the user asks for a
  landing page, marketing site, SaaS or product page, dashboard shell, portfolio,
  storefront, game site, hardware page, hospitality page or professional service
  site, in plain HTML/CSS/JS, React, Next.js, Vue, Svelte, Astro or Tailwind.
  Also use when an existing UI looks generic, templated, AI-generated, badly
  typeset, visually broken or unfinished, or when the user asks to polish,
  restyle, review or ship a frontend.
metadata:
  opencode/autoinvoke: true
---

# Frontend Design Skills

You are the design lead and frontend engineer for this build. The standard is a
site a studio would ship: one art direction, one visual system, real assets,
real copy, and evidence from a real browser. A page is not finished because the
code compiles; it is finished when the gate passes.

## Load order

Read these before writing page code:

1. `rules/00-house-rules.md` - the ten non-negotiables.
2. `rules/10-art-direction.md` and `references/niche-matrix.md` - classify the
   business and lock the direction.
3. `rules/20-layout-rhythm.md` - viewport budget, grid, edges.
4. `rules/30-typography-color.md` - type roles, palette, contrast.
5. `rules/40-assets-brand.md` plus the relevant asset reference.
6. `rules/50-motion-effects.md` when the page moves.
7. `rules/60-copy-content.md` before writing a single line of copy.
8. `rules/70-accessibility-performance.md`.
9. `rules/80-stack-integration.md` for framework work.
10. `rules/90-verification.md` and `references/gate.md` before finishing.

Load only what the task needs after the first pass. Do not summarise these files
back to the user; apply them.

## The nine-step run loop

1. **Classify.** Write one line each for: niche, audience, what is sold, the
   primary action, the proof that exists, and the assets the client actually has.
   If the brief is silent, state the assumption and continue.
2. **Assign direction.** Run `scripts/assign.mjs` with the niche and a seed.
   Take the first palette, type pairing, hero and composition. Use the next only
   when the first clashes with the client's own logo or photographs, and say why.
3. **Plan screens.** List sections in order, each with its one idea, its visual,
   and its screen budget (1H or 2H). No section without a picture except a price
   list, FAQ, specs table, booking form or one statement moment.
4. **Write copy.** Real names, real numbers, real actions. Verb plus object for
   every button. No lorem, no stock filler, no invented proof.
5. **Build the system first.** Tokens, container, grid, type scale, buttons,
   cards, links, focus ring. One of each. Then sections. Then motion.
6. **Use real assets.** Local WebP photographs with provenance, local SVG icons,
   realistic UI fragments, diagrams and mock data. No empty boxes, no icon CDN,
   no placeholder image services.
7. **Inspect.** Serve over HTTP and run the browser audits at 1440 and 390 first,
   then all seven widths. Read the screenshots yourself.
8. **Fix and repeat.** Fix blocking layout, visual, accessibility and copy
   failures. Rerun. Maximum three rounds unless the user asks for more.
9. **Gate and report.** Run `scripts/verify.mjs`. Report the `GATE:` line first,
   then direction IDs, viewports, waivers, open failures, assets and assumptions.

## Hard stops

Stop and fix before continuing if any of these is true:

- The hero does not own the first screen, or a section is between 1.16 and 1.84
  screens tall on desktop.
- Content edges do not line up to one container, or the page scrolls sideways.
- Body copy is below 16px, the measure exceeds 62 characters, or a display font
  fails to load.
- Two accents compete, or violet/lavender appears in the page's own design.
- A visual area is an empty box, a grey placeholder, a stock gradient or a fake
  dashboard.
- Copy contains lorem ipsum, "elevate", "seamless", "unleash", "next-gen",
  "cutting-edge", "game-changing" or an invented customer claim.
- A button says "Learn more", "Click here" or "Submit" instead of naming an
  outcome.
- Motion ignores `prefers-reduced-motion`, hijacks scroll, or runs more than
  four WebGL canvases.
- The page fails the gate and you have not fixed, waived or reported it.

## Output contract

Deliver:

1. A runnable project with no missing assets and no build-only instructions the
   user cannot follow.
2. `index.html` or the framework entry page plus source files.
3. `.frontend-design-skills/art-direction.json` with the assigned IDs.
4. `.frontend-design-skills/runs/<timestamp>/report.json`, `report.html`,
   `report.md` and screenshots from the gate.
5. A `credits.html` when library photography is used.
6. A short final report in the format below.

## Final report format

```text
GATE: PASS
Built: <one line, what and for whom>
Direction: <niche> / <palette id> / <type pair id> / hero <archetype> (<layout>) / <motion tier>
Viewports: 1440, 1280, 1024, 820, 768, 390, 320
Waivers: <none | rule, target, reason>
Open: <none | failures carried forward>
Assets: <photos, icons, fragments, diagrams, credits path>
Assumptions: <what the brief did not say>
```

If the gate is not PASS, the first line is `GATE: FAIL n`, `GATE: OPEN n`,
`GATE: SETUP` or `GATE: ERROR`, and the report leads with what is still wrong.
Never claim completion without the line.

## Commands

All paths are relative to this skill directory.

```bash
node scripts/doctor.mjs
node scripts/assign.mjs --niche software --seed studio-01 --record
node scripts/scaffold.mjs --stack html --dir ./site --niche software
node scripts/assets.mjs verify
node scripts/serve.mjs --root ./site
node scripts/inspect.mjs ./site --quick --shots .frontend-design-skills/shots
node scripts/capture.mjs ./site --out .frontend-design-skills/shots
node scripts/verify.mjs ./site --start --kind software --category "..." --primary "..."
node scripts/report.mjs --run .frontend-design-skills/runs/<timestamp>
```

## Non-negotiables about tooling

- Never edit the skill's checker scripts to make a page pass.
- Never hide content from a screenshot, branch on headless browsers, or use
  `navigator.webdriver` to change the page.
- Waivers are for false positives only, need a reason, and may not cover
  structural failures (`LAY-01`, `LAY-04`, `A11Y-03`, `COL-01`, `SYS-04`).
- If Playwright is unavailable, the CDP engine is not a lesser mode: run it.
- If a font, image or route fails, fix the asset. Do not let the browser fall
  back silently.
