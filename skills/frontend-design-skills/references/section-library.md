# Section Library Reference

Reusable section recipes with budgets, column spans, content limits, and failure
modes. Compose from this library; do not invent a new structure for every
heading. All recipes use the container and grid in `20-layout-rhythm.md`.

## Budget key

- **Strip:** ≤0.3H. Proof, credits, legal. Never a sales argument.
- **1H:** 0.90–1.16H. One message plus one action or proof.
- **2H:** 1.84–2.16H. Two 1H beats with a midpoint.

## 1. Proof strip

**Budget:** strip · **Grid:** label 3, items 9 · **Phone:** stack.
**Rules:** 3–5 verified facts or licensed logos; label the relationship; units
and dates; one line; monochrome marks at optical parity; no heading above 20px.
**Fails:** five invented logos, mixed logo sizes, a carousel, a second nav row.

## 2. Logo row

**Budget:** strip or inside proof · **Grid:** 5–6 marks · **Phone:** two rows.
**Rules:** one ink at 60–70%, full ink on hover; equal optical height; label
"Customers", "Integrations", or "Partners"; written permission only.
**Fails:** fabricated endorsements, unlabeled wall, a marquee that cannot pause.

## 3. Three-step process

**Budget:** 1H · **Grid:** 3 × 4 columns · **Phone:** vertical with a rule.
**Rules:** sequential and exhaustive; verb titles; visible numbers; same
information type per step; the connector is decorative and hidden from AT.
**Fails:** four steps in a three-column grid, unordered steps, a step that is
actually a feature, icons that do not match the verb.

## 4. Feature split

**Budget:** 1H · **Grid:** 6 media + 5 copy + 1 gap · **Phone:** copy first.
**Rules:** one feature per split; media shows that feature; H2 under 10 words;
one paragraph, one detail, one link; alternate sides only when evidence changes.
**Fails:** two features in one split, one screenshot reused three times, a
90-word paragraph, alternating with no content reason.

## 5. Capability grid

**Budget:** 1H · **Grid:** 2 large + 3 small · **Phone:** one column.
**Rules:** asymmetry creates hierarchy; the largest tile carries the primary
capability and a visual; small tiles carry one sentence and one evidence link.
**Fails:** eight equal tiles, icons as the only difference, uneven text with no
alignment, a tile without evidence.

## 6. Product tour

**Budget:** 2H · **Grid:** sticky media 7, steps 5 · **Phone:** stacked beats.
**Rules:** three beats (setup, core action, result); each beat changes the media;
native scroll only; no-JS path shows all beats; pin ≤1.5H per beat; static
fallback included.
**Fails:** scroll hijacking, four beats with no hierarchy, media that never
changes, a tour that requires WebGL.

## 7. Metrics band

**Budget:** strip or 1H · **Grid:** 3–4 metrics · **Phone:** 2 × 2 or stack.
**Rules:** value, unit, label, source and date; tabular numerals; one lead metric;
final value present in HTML.
**Fails:** invented growth, percentages without a baseline, four different type
sizes, counters that never finish.

## 8. Testimonial

**Budget:** 1H · **Grid:** quote 8, attribution 4 · **Phone:** stack.
**Rules:** exact approved quote; real name, role, organization, source; one quote
beats a carousel; portrait only if it is the actual speaker.
**Fails:** anonymous "Sarah K.", invented titles, marketing-sounding quote, a
five-quote carousel with no controls.

## 9. Case study card

**Budget:** 1H · **Grid:** 7 media + 5 copy, or four cards · **Phone:** one per row.
**Rules:** result first, then method; real metric with baseline; label industry
and timeframe; one card per client.
**Fails:** "increased efficiency" without a number, a logo with no story, a card
that links to a generic services page.

## 10. Pricing

**Budget:** 1H · **Grid:** 3 plans × 4 columns · **Phone:** stacked.
**Rules:** plan, price, billing unit, 4–6 parallel features, action, terms; mark
the recommended plan with text; show currency, taxes, cancellation, trial.
**Fails:** "Contact us" on every plan, hidden fees, unequal feature lists used to
fake value, a toggle that changes price without announcement.

## 11. Comparison table

**Budget:** 1H · **Grid:** 12 columns · **Phone:** scroll wrapper with label.
**Rules:** 5–8 rows, 2–4 plans; real values where they exist; logical order: core,
limits, support, security; highlight one column once; give the table a heading
above it.
**Fails:** ten rows of checkmarks, no units, page-level overflow, color-only
differences.

## 12. FAQ

**Budget:** 1H · **Grid:** 7 columns · **Phone:** full width.
**Rules:** 5–8 real questions; answers 2–4 sentences; native `<details>` or
`aria-expanded`; first answer visible; link to deeper docs.
**Fails:** questions nobody asks, answers that dodge price or limits, an
accordion that cannot be operated by keyboard, all items collapsed.

## 13. Team / about

**Budget:** 1H · **Grid:** 3–5 portraits at 3 columns · **Phone:** 2 columns.
**Rules:** real portraits with permission; one crop and one background; specific
roles; one relevant fact per person; a group photo beats unrelated stock faces.
**Fails:** "Our amazing team" with no names, mismatched crops, stock portraits,
no accountable role.

## 14. Gallery

**Budget:** 1H–2H · **Grid:** 3–4 columns, one lead · **Phone:** rail or stack.
**Rules:** one lead image, then support; consistent ratios per row; lightbox traps
focus and closes on Escape; no autoplay; no visible caption text.
**Fails:** ten equal thumbnails, mixed quality, no lead, no close button, layout
shift on load.

## 15. Booking / contact

**Budget:** 1H · **Grid:** form 5, context 6, gap 1 · **Phone:** form first.
**Rules:** 2–5 fields; ask only the next step; show response time and what happens
after submission; inline errors; visible success state; no account required.
**Fails:** ten-field form, unlabeled inputs, a date picker that cannot be typed,
no confirmation, hidden cancellation policy.

## 16. Newsletter / subscribe

**Budget:** strip or 1H · **Grid:** copy 6, form 5, gap 1 · **Phone:** stack.
**Rules:** say what arrives and how often; one email field; double opt-in; no
pre-checked consent; link privacy; not the primary action on a product page.
**Fails:** "Join our newsletter" with no content description, two fields for one
value, a dark-pattern checkbox, no privacy link.

## 17. Editorial index

**Budget:** 2H · **Grid:** lead 8, two secondary 4, then list · **Phone:** stack.
**Rules:** lead with the most important story; visible dates; rules between items;
consistent metadata order; label sponsored content.
**Fails:** a grid of identical cards, no dates or bylines, an unlabeled ad as the
lead story.

## 18. Spec table

**Budget:** 1H · **Grid:** table 8, notes 4 · **Phone:** scroll wrapper.
**Rules:** group by category; tabular numerals; units in header or every cell;
footnotes carry test conditions; do not hide key specs in a PDF.
**Fails:** missing units, inconsistent precision, clipped mobile table,
marketing claims mixed into technical rows.

## 19. Close

**Budget:** 1H · **Grid:** copy 7, action 4, gap 1 · **Phone:** stack.
**Rules:** restate one outcome; same primary action wording as the hero; add one
risk reducer (trial, cancellation, response time, guarantee); no new claim.
**Fails:** a second full pitch, three actions, a new price, a longer form than the
hero action.

## 20. Footer

**Budget:** strip · **Grid:** four link groups, legal row, credit · **Phone:** stack.
**Rules:** one container; links 16px with focus; real legal name and address; one
credit line; no newsletter unless it is the page's primary action.
**Fails:** five columns of tiny links, no address, a second logo wall, copyright
only, a credit per image.

## Composition checks

- Adjacent sections do not repeat the same layout and surface.
- A strip never contains a full sales argument.
- A 1H section has one message and one action or proof.
- A 2H section has two beats and a midpoint.
- One heading level per place; no skipped levels.
- No section introduces a new radius, button, or card style.
- Order answers: what, proof, how, objections, close.
- Hero fills the first screen; the next section starts at the next boundary.
