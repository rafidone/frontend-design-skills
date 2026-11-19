# 00 — House Rules

**Project:** frontend-design-skills
**Scope:** every page, screen, component, and prototype produced under this skill.
**Precedence:** a client brand system overrides visual defaults; these rules override
model preference, trend appeal, and framework convenience. When two rules collide,
the rule protecting comprehension and verification wins.

These ten rules are hard stops. A run may not declare completion while any of them
is failing. The verification document (`90-verification.md`) maps each rule to an
automated or manual check, and the gate (`references/gate.md`) records the result.

| ID | Rule | Primary gate IDs |
|----|------|------------------|
| HR-01 | Never ship a hero alone | LAY-01, LAY-02 |
| HR-02 | Budget every section in viewport height | LAY-02 |
| HR-03 | Keep equal edges | LAY-03 |
| HR-04 | Never float centered text | LAY-01, TYP-02 |
| HR-05 | One accent, one radius, one button, one card system | COL-02, SYS-01 |
| HR-06 | Body text is 16px minimum | TYP-01 |
| HR-07 | Use real visuals, not decorative substitutes | VIS-01, VIS-02 |
| HR-08 | No captions | VIS-03 |
| HR-09 | No invented proof | COP-04 |
| HR-10 | The gate is mandatory | SYS-04, gate report |

---

## HR-01 — Never ship a hero alone

**Rule.** A page must contain a complete decision path: hero, then utility or proof,
then a next action. By the end of the second viewport the visitor must be able to
answer "what is this, who is it for, and what can I do next?" A hero may be tall,
but it may never be the whole page.

**Rationale.** A lone hero asks for trust before showing evidence. It also hides
layout, content, and state problems that only appear once real sections stack. The
result reads as a mockup, not a product.

**Failure examples.**
- A gradient hero with a headline, one button, and a decorative dashboard image,
  followed by a footer.
- A "coming soon" page with three animated words and no product explanation.
- A hero that fills the viewport on mobile while the first useful section starts
  below 1.4 viewports of scroll.

**Pass condition.**
- The second viewport contains at least one of: product evidence, a concrete
  capability, a priced offer, a schedule, or a verified proof element.
- The primary action appears in the hero and repeats after the proof block.

---

## HR-02 — Budget every section in viewport height

**Rule.** Declare a height budget for every section before styling it: `1H` or
`2H`, where `H` is the usable viewport height after the sticky header. A compact
strip for proof, legal text, or footer may be at most `0.3H`, but it is not a
content section. A content section must reach `0.9H` and may not stop between
`1.16H` and `1.84H`.

**Rationale.** Scroll rhythm is a design decision, not an accident of content.
Budgeting prevents two common failures: a 120px divider that breaks flow and a
2,800px feature wall that hides the next action.

**Failure examples.**
- Six feature blocks stacked into a single 3,200px section with no summary.
- A logo strip given 600px of vertical padding on desktop.
- A 1.4H pricing section that neither completes a screen nor forms a deliberate
  two-screen narrative.
- A pricing table that begins below three full viewports of preamble.

**Pass condition.**
- Each `<section>` carries a `data-budget="1|2"` attribute or an equivalent
  comment in the source.
- Measured height at 1440×900 is 0.90–1.16H for a 1H section or 1.84–2.16H for a
  2H section, excluding documented sticky stages.
- Strips stay at or below 0.3H and contain no primary sales argument.

---

## HR-03 — Keep equal edges

**Rule.** All text, controls, and cards align to one container and one grid.
Full-bleed elements are allowed only for media or background fields, and their
inner content must still align to the container. Do not invent per-section
max-widths.

**Rationale.** Unequal edges are the fastest way to make a page feel assembled
rather than designed. The eye tracks the left and right rails; when they move
without reason, every section feels like a different site.

**Failure examples.**
- Three sections using `max-width: 1140px`, `1200px`, and `1280px` in sequence.
- A card grid inset 32px inside a section whose heading is flush to the container.
- Mobile cards with 20px side margins while the heading uses 24px.

**Pass condition.**
- One container token governs every section. Full-bleed media uses a wrapper with
  the same inner container.
- At each breakpoint, left and right content rails differ by 0px for standard
  sections and by a documented optical adjustment of at most 2px for display type.

---

## HR-04 — Never float centered text

**Rule.** Body copy is left-aligned. Centered text is permitted only for a display
heading of at most two lines and for a compact action group, and it must be
anchored to a visible element: a ruled line, a media edge, a form, or a card.
Never center a multi-line paragraph in open space.

**Rationale.** Centered paragraphs destroy the return sweep and produce a floating,
unlanded feeling. Centered display type can work when it is short and clearly tied
to the composition; when it is long, it reads as a slide template.

**Failure examples.**
- A four-line centered paragraph under a centered headline with 200px of empty
  space on both sides.
- Centered feature descriptions inside cards of unequal text length.
- A centered legal block with ragged both-edge wrapping.

**Pass condition.**
- Paragraphs use a left edge tied to the grid.
- Any centered block is at most two lines, at most 18 words, and sits within a
  bounded composition whose width is defined in the layout spec.

---

## HR-05 — One accent, one radius, one button, one card system

**Rule.** Choose exactly one accent hue and use it for one job: action, selection,
or live status. Choose one radius family (for example 0/8/16 or 0/4/12), one
button component with defined variants, and one card pattern. New needs are solved
by varying content, density, and hierarchy, not by adding a parallel system.

**Rationale.** Multiple accents, radii, and card styles are the visual equivalent
of competing voices. They make simple pages expensive to maintain and impossible
to audit. A single system also makes exceptions visible.

**Failure examples.**
- Violet primary buttons, green success chips, orange badges, and blue links on
  the same screen, each with a different radius.
- Three card variants: outlined, filled, and glass, used to distinguish content
  that has no structural difference.
- A second button style introduced only for a secondary CTA in the hero.

**Pass condition.**
- One accent token is referenced by all interactive emphasis; semantic colors are
  reserved for state and never used as decoration.
- Radius tokens come from one family. Buttons use at most three variants:
  primary, secondary, quiet. Cards use one border, one padding scale, and one
  elevation rule.

---

## HR-06 — Body text is 16px minimum

**Rule.** Body copy, inputs, navigation labels, and table cells are at least 16px
on every breakpoint. Secondary metadata may be 14px; legal text may be 13px only
when it is not required for a decision. Never use 11px or 12px for readable prose.

**Rationale.** Below 16px, mobile browsers may zoom on focus, line length becomes
unstable, and low-vision readers are excluded. Small type is also a common way to
hide weak copy.

**Failure examples.**
- A 13px feature grid that looks dense on a 27-inch monitor and unreadable on a
  phone.
- Form labels at 11px uppercase with 0.12em tracking.
- Body copy reduced to 14px to make a section fit its budget.

**Pass condition.**
- Computed `font-size` for body, labels, inputs, and table cells is `>= 16px` at
  all audited viewports.
- If content does not fit, cut copy or change the layout; do not shrink type.

---

## HR-07 — Use real visuals, not decorative substitutes

**Rule.** Every visual must carry information: a product surface, a real object,
a place, a person with a licensed portrait, a diagram, a data view, or a brand
mark used with permission. Abstract gradients, blobs, and stock "technology"
collages may be background atmosphere only; they may not stand in for a product.

**Rationale.** Visitors evaluate the product, not the mood. A decorative substitute
forces them to imagine the thing being sold, and imagination defaults to distrust.

**Failure examples.**
- A hero with a floating glass card containing three fake numbers and no product
  interface.
- A "platform" section represented by five colored circles connected by lines.
- A dashboard mock built from gray rectangles and unlabeled sparklines.

**Pass condition.**
- Every visual is classified in the asset manifest with one of the classes in
  `40-assets-brand.md`, with a source or a build reference.
- At least one visual in the first two viewports shows the actual product,
  service, or outcome.

---

## HR-08 — No captions

**Rule.** Do not use `<figcaption>` or caption text under any image, chart, or
video. Put required credit in the single footer line and put diagram labels
inside the graphic. Use alt text for description, not a visible caption.

**Rationale.** Captions that restate the image add noise and make stock imagery
look like evidence. They also create a second reading path that competes with the
main copy.

**Failure examples.**
- "Team collaborating in a modern office" under a generic meeting photo.
- "Dashboard view" under a product screenshot whose heading already says
  "Dashboard".
- A `<figcaption>` used to explain a diagram because the diagram has no internal
  labels.

**Pass condition.**
- No `<figcaption>` element contains text. Images have meaningful `alt` text;
  diagrams carry labels inside the graphic.
- The only site-wide credit is the single footer line defined in
  `40-assets-brand.md`.

---

## HR-09 — No invented proof

**Rule.** Never fabricate customers, logos, testimonials, ratings, awards, user
counts, performance numbers, certifications, or press mentions. Placeholders must
be visibly marked in the source and listed in the asset manifest, and must be
removed before delivery.

**Rationale.** Invented proof is a factual misrepresentation. It also creates
legal, brand, and trust risk that no visual polish can offset.

**Failure examples.**
- A "Trusted by" row filled with real company marks that have not endorsed the
  product.
- "10,000+ teams" when no measurement exists.
- A testimonial attributed to "Sarah K., VP Engineering" with no source.
- A security badge copied from a vendor site without an active certification.

**Pass condition.**
- Every proof claim links to a source in the content inventory, or is labeled
  `PLACEHOLDER` and removed before the gate can pass.
- Logo rows use only licensed marks or neutral wordmarks explicitly marked as
  demonstration content.

---

## HR-10 — The gate is mandatory

**Rule.** Run `references/gate.md` and the full verification loop in
`90-verification.md` before declaring the work complete. Record evidence for every
rule ID. Completion requires `PASS` or an approved waiver; `OPEN` is not a finish
state. Waivers are capped at five and may not cover the structural checks LAY-01,
LAY-04, A11Y-03, SYS-04, COL-01, or any accessibility or fabricated-proof
blocker.

**Rationale.** Visual work fails in the browser, not in the source file. A gate
forces the run to inspect real rendered pages at real viewport sizes and to leave a
trace that another person can audit.

**Failure examples.**
- Reporting "done" from a successful build with no browser inspection.
- Marking a rule `PASS` without a screenshot, command output, or measurement.
- Carrying three unresolved `OPEN` items into delivery and calling them "known
  limitations".

**Pass condition.**
- `scripts/verify.mjs` reports `GATE: PASS` (or `GATE: DONE` when closing the run).
- The final report lists commands, viewports, screenshots, rule results, waivers,
  and residual risks.

---

## Applying the rules in order

1. Read the brief and classify the niche (`10-art-direction.md`).
2. Write the direction lock before choosing components.
3. Define the grid, section budgets, and content windows (`20-layout-rhythm.md`).
4. Set type and color tokens (`30-typography-color.md`).
5. Inventory and license assets (`40-assets-brand.md`).
6. Choose the motion tier and moments (`50-motion-effects.md`).
7. Write copy to the budgets (`60-copy-content.md`).
8. Implement with one system (`80-stack-integration.md`).
9. Audit accessibility and performance (`70-accessibility-performance.md`).
10. Run the gate and report (`90-verification.md`, `references/gate.md`).

## Exception handling

- **Client constraint conflict.** Record the constraint and the rule it overrides
  in the direction lock. Do not silently drop the rule.
- **Missing asset.** Use a labeled neutral placeholder and mark the item `OPEN`;
  do not substitute an unrelated decorative visual.
- **Small screen pressure.** Reduce content, not type size. Stack rather than
  shrink. Move secondary actions into a menu rather than crowding the primary.
- **Time pressure.** Cut scope, not verification. An unreviewed page is not a
  smaller deliverable; it is an unverified one.

## Definition of done

A run is done only when all of the following are true:

- Every page has a hero plus at least one utility or proof section.
- Every section has a declared budget and measured height.
- One container, one grid, one accent, one radius family, one button system, and
  one card pattern are in use.
- All body text is at least 16px and all prose measures 45–75 characters.
- Every visual is classified and licensed or built.
- No caption, invented proof, or unlabeled placeholder remains.
- The gate report is attached and no `OPEN` item remains.
