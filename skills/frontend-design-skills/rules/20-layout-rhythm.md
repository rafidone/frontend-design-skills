# 20 — Layout and Rhythm

Layout is arithmetic. This document fixes the container, grid, viewport budgets,
splits, stacking limits, and overflow behavior so every section shares one
structure. Measure the rendered page; do not estimate from the design file.

## 1. Viewport constants

`H` is usable viewport height: viewport height minus the sticky header. Use
`100svh` for section sizing so mobile browser chrome does not create a jump.

| Target | Viewport | Side margin | Container | Columns | Gutter | Column | Header | Usable H | 1H | 2H | Strip cap |
|--------|----------|-------------|-----------|---------|--------|--------|--------|----------|----|----|-----------|
| Phone | 390×844 | 20 | 350 | 4 | 12 | 78.5 | 56 | 788 | 788 | 1576 | 236 |
| Tablet portrait | 768×1024 | 40 | 688 | 8 | 16 | 72 | 64 | 960 | 960 | 1920 | 288 |
| Tablet large | 820×1180 | 44 | 732 | 8 | 20 | 74 | 64 | 1116 | 1116 | 2232 | 335 |
| Desktop | 1440×900 | 60 | 1320 | 12 | 24 | 88 | 72 | 828 | 828 | 1656 | 248 |

Desktop check: `12 × 88 + 11 × 24 = 1056 + 264 = 1320`; plus two 60px margins
equals 1440. Tablet check at 768: `8 × 72 + 7 × 16 = 576 + 112 = 688`; plus two
40px margins equals 768. Large tablet check: `8 × 74 + 7 × 20 = 592 + 140 = 732`;
plus two 44px margins equals 820. Phone check: `4 × 78.5 + 3 × 12 = 314 + 36 =
350`; plus two 20px margins equals 390.

## 2. Breakpoints and column counts

| Range | Columns | Side margin | Gutter | Container behavior |
|-------|---------|-------------|--------|--------------------|
| 320–479 | 4 | 20 | 12 | Fluid, max 440 |
| 480–767 | 6 | 24 | 16 | Fluid, max 720 |
| 768–1023 | 8 | 40 | 16 | Fluid, max 944 |
| 1024–1439 | 12 | 48 | 24 | Fluid, max 1320 |
| 1440+ | 12 | 60 | 24 | Fixed 1320, centered |

Rules:

- Use `grid-template-columns: repeat(var(--cols), minmax(0, 1fr))`. The
  `minmax(0, 1fr)` prevents long words from forcing overflow.
- Never use `100vw`; scrollbars make it wider than the viewport. Use `100%`.
- Keep the container centered with `margin-inline: auto` and side padding, not
  with a fixed left offset.
- At 1024–1439 the grid stays 12 columns; column width becomes fluid. Do not
  invent a second desktop grid.

## 3. Content windows

A content window is the maximum width a content type may occupy, expressed in
columns and a hard pixel or character limit.

| Content | Desktop columns | Max width | Tablet columns | Phone columns |
|---------|-----------------|-----------|----------------|---------------|
| Display headline | 9 | 960px | 8 | 4 |
| Section heading | 7 | 760px | 7 | 4 |
| Prose | 6 | 62ch | 6 | 4 |
| Lead paragraph | 6 | 58ch | 6 | 4 |
| Form field group | 5 | 520px | 6 | 4 |
| Media | 7 | 760px | 8 | 4 |
| Spec table | 12 | 1320px | 8 | 4, scrollable |
| Card grid | 12 | 1320px | 8 | 4 |

- Prose is capped by `max-width: 62ch`, even when its column span is wider.
- Headline line count: 1–3 lines desktop, 2–4 lines phone. If it exceeds, cut
  words before reducing size.
- Never place a 6-column paragraph beside a 6-column image and call it a hero;
  weight one side. Use 5/7 or 7/5.
- Media may bleed full width, but its internal label or control rail stays on the
  container.

## 4. Section budgets

Every section declares one budget. The budget includes vertical padding.

| Budget | Desktop | Phone | Contents | Internal structure |
|--------|---------|-------|----------|--------------------|
| Strip | ≤248 | ≤236 | Proof strip, logo row, credit, legal | One row, max two lines, not a content section |
| 1H | 745–960 | 709–914 | Hero, feature split, pricing, gallery, contact | One primary message plus one action or evidence |
| 2H | 1524–1788 | 1450–1702 | Narrative stage, long feature tour, case study | Two 1H beats; a decision point at the midpoint |

Rules:

- Content sections are 1H or 2H. A 1H section must measure 0.90–1.16H; a 2H
  section must measure 1.84–2.16H. In-between heights fail the audit.
- Strips are not content sections. Keep them at or under 0.3H and reserve them
  for proof, credits, and legal text. Do not hide a sales argument in a strip.
- The first section includes the header offset: hero height is `1H`, not
  `100svh`, when the header is sticky. If the hero fills the screen, the next
  section starts at the next screen boundary.
- A 2H section must expose its second beat by the 1H mark. Do not hide the next
  action behind a pinned stage longer than one viewport without a visible cue.
- Section padding: desktop 96–128px, tablet 80px, phone 48–56px. Padding counts
  toward the budget.
- A sticky stage may exceed its nominal budget only if it is documented as a
  `stage` and has a non-sticky fallback. Measure the fallback height for the gate.

## 5. Vertical rhythm

Use an 8px baseline and this spacing scale only:

`4, 8, 12, 16, 24, 32, 48, 64, 96, 128`

| Relationship | Desktop | Phone |
|--------------|---------|-------|
| Eyebrow to headline | 12 | 8 |
| Headline to lead | 24 | 16 |
| Lead to action group | 32 | 24 |
| Section heading to grid | 48 | 32 |
| Card padding | 24–32 | 20–24 |
| Grid gap | 24 | 16 |
| Stacked card gap | 16 | 12 |
| Section bottom to next eyebrow | 96–128 | 48–56 |

Rules:

- Line heights are multiples of 4px where possible.
- Align the first baseline of adjacent columns, not their box centers. Optical
  centering is allowed only for a single control beside a single line.
- Do not use margin collapse as a layout tool; use `gap` and explicit padding.
- Headings inside cards use the same scale as outside; do not invent a card-only
  type scale.

## 6. Splits

| Split | Use | Constraint |
|-------|-----|------------|
| 7/5 | Media-led hero, product proof | Text side at least 5 columns; media is the focal point |
| 5/7 | Copy-led hero, editorial feature | Media side may bleed to the viewport edge on desktop |
| 6/6 | Comparison, before/after | Only when both sides carry equal informational weight |
| 8/4 | Article plus aside, form plus context | Aside never contains the primary action |
| 12 | Full-width table, gallery, stage | Inner labels still align to the container |

Rules:

- Gap between split columns is one gutter (24px desktop, 16px phone). Do not add
  a second gap inside the same row.
- Reverse a split on alternate sections only when the content changes; do not
  alternate purely for visual rhythm.
- Stack splits at 820px and below: copy first, then media, unless the media is
  the only explanation of the copy.
- At 820px and below, multi-column card grids collapse to one column. The
  8-column tablet grid is for alignment, not for keeping cards side by side.
- On phone, media inside a split uses a 4:3 or 1:1 crop, not the desktop aspect
  ratio. Never squeeze a 16:9 desktop capture into a 350px column.
- Keep the primary action in the same column as the headline on every breakpoint.

## 7. Stacking and depth

Z-index tokens:

| Token | Value | Use |
|-------|-------|-----|
| `--z-base` | 0 | Page content |
| `--z-raised` | 10 | Sticky section header, floating label |
| `--z-header` | 30 | Global header |
| `--z-menu` | 40 | Mobile menu, command palette |
| `--z-modal` | 50 | Dialog, lightbox |
| `--z-toast` | 60 | Transient status |

Rules:

- Never use a z-index above 60. If a component needs one, the stacking context is
  wrong.
- Create stacking contexts at the component boundary with `position` plus
  `isolation: isolate`; do not fight the global stack.
- Header height is fixed per breakpoint. Anchor links use
  `scroll-margin-top: calc(header + 16px)`.

### Maximum two boxes deep

A styled box is any element with a background, border, radius, or shadow. Limit
nesting:

- Depth 0: section surface.
- Depth 1: card, media frame, form panel.
- Depth 2: an inner panel such as a code block or selected row.
- Depth 3: prohibited.

Do not place a card inside a card inside a card. If content needs three levels,
use a rule, a label, or spacing instead of another surface. Nested panels must
share the same radius family and reduce padding by one step, not increase it.

## 8. Overflow and text safety

- Set `overflow-x: clip` on `html` and `body`; do not use `hidden` on `body` when
  a sticky header is present.
- Put `min-width: 0` on every grid and flex child that contains text or media.
- Use `overflow-wrap: break-word` for prose and `overflow-wrap: anywhere` only
  for URLs, hashes, and code tokens.
- Do not justify text. Do not hyphenate headings.
- Tables wider than the container sit in a wrapper with `overflow-x: auto`,
  `tabindex="0"`, and an accessible label.
- Images and video use `max-width: 100%`, `height: auto`, and explicit
  `aspect-ratio` to reserve space.
- Decorative elements that extend past the viewport use a clipping parent, not a
  negative body margin.
- Test long content: 2× headline length, 80-character email, 12-digit price,
  three-line nav item, and a 20-row table.

## 9. Layout recipes

### Hero split (1H)

- Desktop: 5 columns copy, 7 columns media; copy starts at column 1, media starts
  at column 7 with a 24px gutter.
- Copy block: eyebrow, 2–3 line display, 2-line lead, one primary plus one quiet
  action.
- Media block: one real surface, max 7 columns, aligned to the top third of the
  copy block, not vertically centered.
- Phone: copy then media; media crop 4:3; total height stays within 1H plus 15%.

### Alternating feature (1H each)

- Row: 6 columns media, 5 columns copy, 1 column breathing space.
- Alternate side only when the proof type changes.
- Each row has one heading, one paragraph, one supporting detail (list, metric,
  or code), and one link.
- Do not repeat the same card style for every row.

### Proof strip (compact, ≤0.3H)

- One row: label plus 3–5 items, or one quote plus attribution.
- No heading larger than 24px. No action except a quiet link.
- Logos are monochrome and optically balanced; no invented marks.

### Pricing (1H)

- Three plans maximum on desktop, 4 columns each with 12-column grid; stacked on
  phone.
- One recommended plan with a visible label, not only a color change.
- Feature comparison below the cards in a real table, not a second card grid.

### Editorial index (2H)

- Masthead, lead item at 8 columns, two secondary items at 4 columns, then a
  chronological list.
- Rules separate items; boxes are unnecessary.
- Reading order follows DOM order, not visual position only.

### Footer

- ≤0.3H. One container, four link groups, one legal row, one credit line.
- No newsletter form unless it is the page's primary action.
- Contrast and focus states follow `30-typography-color.md` and
  `70-accessibility-performance.md`.

## 10. Layout checks

| ID | Check | Method |
|----|-------|--------|
| LAY-01 | Hero owns the first screen | Next section starts at or below the viewport edge |
| LAY-02 | Section budgets | Measure height ratio: 0.90–1.16H or 1.84–2.16H |
| LAY-03 | Equal edges | Screenshot overlay at 1440, 820, 390 |
| LAY-04 | No horizontal overflow | `scrollWidth <= clientWidth` at 320, 390, 768, 820, 1440 |
| LAY-05 | No overlap | Sections do not overlap; fixed header does not cover content |
| LAY-06 | Tablet and phone stacking | Splits and card grids collapse at 820px and below |

Supporting checks without separate gate IDs:

- One container and one 12-column grid; no per-section max-widths.
- No floating centered prose; centered display type is anchored to a visual.
- Nested styled boxes are at most two deep.
- Long content, long words, and 20-row tables do not clip or overlap.
- Anchor links land below the sticky header.

## 11. Measurement commands

```bash
# Find horizontal overflow at a given viewport (run in the page console)
document.documentElement.scrollWidth > document.documentElement.clientWidth

# List sections and heights (browser console)
[...document.querySelectorAll('main section')].map(s => ({
  id: s.id,
  budget: s.dataset.budget,
  height: Math.round(s.getBoundingClientRect().height)
}))

# Detect elements wider than the viewport
[...document.querySelectorAll('*')].filter(el => {
  const r = el.getBoundingClientRect();
  return r.right > innerWidth + 1 || r.left < -1;
}).slice(0, 20)
```

Record the numbers in the gate evidence. "Looks fine" is not a layout result.
