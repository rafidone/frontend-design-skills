# 10 — Art Direction

Art direction is a decision record, not a mood. This document turns a brief into
one defensible visual system: one niche, one composition, one palette, one type
pairing, one image language, one motion tier. Every later rule consumes that
record. If a choice is not in the record, it is not allowed.

## 1. Classify the niche

Classify before designing. Use the strongest signal, not the industry label the
client uses about itself.

| Signal | Evidence to collect |
|--------|---------------------|
| Product surface | Is the product software, a physical object, a place, or a publication? |
| Purchase mode | Self-serve, sales-led, booked, walked-in, subscribed, or read? |
| Proof type | Interface, benchmark, specification, inventory, menu, case result, byline? |
| Audience mode | Operator, buyer, enthusiast, guest, patient, reader? |
| Content density | Three claims or thirty? |
| Asset reality | Real product captures, commissioned photos, or neither? |

If two rows fit, choose the row that determines the first viewport's primary
visual. A hotel booking platform is hospitality when the property is the product;
it is SaaS when the booking engine is the product.

## 2. Lock the direction record

Write this block into the build notes before opening a component library.

```text
DIRECTION LOCK
project:            <slug>
niche:              <one of the eight rows>
audience:           <one sentence>
primary decision:   <what the visitor must do>
hero archetype:     <split | photo | product | editorial | collage | statement | film | triptych | centred | word>
hero layout:        <split | media>
composition:        <product-ui-first | bleed | pair | trio | strip | tall-small | editorial-index | type-led>
container:          <max width and side margins per breakpoint>
palette:            <neutral ramp + one accent + semantic states>
type pairing:       <display face + text face + optional mono>
image language:     <product-ui | photo | diagram | data | mixed>
motion tier:        <T0 | T1 | T2>
motion moment:      <one sentence, or "none">
proof element:      <the one verifiable fact in the first two viewports>
forbidden:          <three things this project must not do>
```

The `forbidden` line is required. It prevents drift toward the previous project or
toward a default template.

## 3. The eight-row niche matrix (nine assignable niches)

Each row is a complete starting system, not a menu. Adjust within the row; do not
mix rows unless the direction lock documents why. The `SaaS / devtool` row maps
to the two implemented niches `software` and `devtool`; the other rows map
one-to-one, for nine assignable niches in `scripts/lib/rules.mjs` (`NICHE`).

| Niche | Detection signals | Composition | Palette posture | Type posture | Image language | Motion ceiling | Proof element |
|-------|-------------------|-------------|-----------------|--------------|----------------|----------------|---------------|
| SaaS / devtool | Self-serve trial, docs, API, dashboard, seats | Product-first split; UI above the fold; docs-style density | Light neutral canvas, near-black text, one cool or green accent | Grotesk text + mono for code and keys; tight headings | Real UI, code blocks, terminal, architecture diagram | T1 | Live-looking product surface or measured outcome |
| AI | Model capability, prompt/response, agent workflow, API | Demonstration stage; input/output pair; restrained chrome | Warm off-white or deep charcoal, one signal accent, no rainbow gradients | Neutral grotesk + mono for model names and tokens | Actual output, before/after, data table, latency chart | T1, T2 only with a real demo | Reproducible example with model and settings named |
| Gaming | Trailer energy, frames, editions, platforms, lore | Full-bleed stage; asymmetric type; strong crop | Dark base, high-chroma accent, controlled bloom | Condensed or wide display + sturdy text face | Key art, in-engine capture, character/weapon detail | T2 | Platform list, release date, or playable build |
| Hardware | Physical object, specs, ports, materials, dimensions | Object hero; macro detail; spec table; exploded view | Neutral industrial: graphite, bone, one anodized accent | Precise grotesk + mono for measurements | Studio photography, macro texture, scale diagram | T1, T2 for product reveal | Measured specs and material facts |
| Commerce | Catalog, price, variant, stock, shipping | Index/grid first; filters visible; product card system | Warm neutral or clean white; accent reserved for price/action | Humanist sans + display for campaign; readable at density | Product cutouts on consistent ground; detail and scale shots | T1 | Price, availability, delivery, returns |
| Hospitality | Property, room, table, menu, date, location | Image-led editorial; booking panel; seasonal rhythm | Stone, clay, linen, deep green; low chroma | Serif display + clean sans text | Commissioned place and room photography; food detail | T1 | Address, hours, availability, or menu |
| Service | Expertise, process, quote, coverage, trust | Split: promise + proof; process steps; local detail | Calm neutral, one grounded accent, no tech blue default | Strong sans display + plain text face | Real team, real work, location, before/after | T0, T1 | Credential, case result, service area, response time |
| Editorial | Article, issue, essay, report, archive | Columnar; strong masthead; reading rhythm | Paper-neutral, ink text, one editorial accent | Serif text + sans metadata, or sans text + serif display | Commissioned illustration, documentary photo, charts | T0, T1 | Byline, date, sources, issue number |

### Row discipline

- **SaaS/devtool:** density is the visual signature. Do not add lifestyle
  photography to compensate for a weak product surface.
- **AI:** the output is the hero. Never place a fabricated benchmark beside a
  model claim; show the prompt, the output, and the conditions.
- **Gaming:** one dominant frame, one supporting detail, one action. Avoid
  interface chrome that competes with key art.
- **Hardware:** scale and material must be legible. Every macro shot needs a
  reference object or dimension.
- **Commerce:** the card system is the design. Sorting, variant state, and price
  hierarchy matter more than a campaign headline.
- **Hospitality:** place photography must be real and current. A generic resort
  image is a factual error, not a placeholder.
- **Service:** faces and process beat abstract trust badges. Show the work, the
  area, and the person accountable.
- **Editorial:** reading comfort outranks novelty. The measure, leading, and
  byline hierarchy are the craft.

## 4. Composition archetypes

Choose one primary composition and at most one supporting pattern.

| Archetype | Structure | Best for | Risk |
|-----------|-----------|----------|------|
| Split | 5/7 or 6/6 columns; copy and visual share the first viewport | SaaS, service, hardware | Two equal halves can feel static; weight one side. |
| Stack | Centered or left-aligned display over full-width media | Gaming, hospitality, editorial covers | Weak if the media is generic. |
| Editorial | Asymmetric columns, rules, folios, running heads | Editorial, reports, long-form | Can become cramped on mobile. |
| Stage | Pinned product or scene with annotated steps | AI, technical hardware, complex tools | Needs native scroll and a static fallback. |
| Index | Dense grid or list with filters and metadata | Commerce, archives, docs | Needs a strong type hierarchy to avoid clutter. |

## 5. Motion tiers

Motion is assigned by niche and capability, never by enthusiasm.

### T0 — Static

- No entrance animation. No parallax. No autoplay.
- Hover changes color, underline, or border only.
- Permitted for service, editorial, legal, and any reduced-motion context.
- Budget: 0 animated regions; 0 WebGL.

### T1 — Restrained

- One entrance sequence per page: opacity plus 8–16px translate, 320–560ms.
- One reveal per media block using clip-path or opacity.
- Hover transitions 120–200ms on color, border, shadow, or 2px lift.
- Budget: at most 3 animated regions; 0 WebGL.

### T2 — Signature

- T1 plus one signature moment: a pinned product stage, a shader field, a
  frame-accurate product reveal, or a scroll-linked diagram.
- Must ship a static poster and a reduced-motion path.
- Budget: at most 2 signature moments; at most 4 WebGL instances.
- Restricted to gaming, hardware, and genuinely technical products with a real
  demo or capture.

## 6. Deterministic assignment

The run must be reproducible. `scripts/assign.mjs` is the implementation of
record; do not pick a palette because it "feels right" in the moment.

1. **Niche.** Choose one of the nine assignable niche IDs. Each matrix row maps
   to one or two of these IDs.
2. **Eligible pools.** From `assets/palettes/palettes.json`, keep palettes that
   pass the contrast floor and avoid violet, then keep those tagged for the
   niche or untagged generalists. Apply the same two filters to
   `assets/typography/type-pairs.json`. Sort both pools by niche affinity score.
3. **Selection.** `pick()` hashes `seed|salt` with SHA-256, takes the first 12
   hex digits, and uses that value modulo the pool size. Separate salts
   (`palette:<niche>`, `type:<niche>`, `hero:<niche>`, `composition:<niche>`) keep
   the axes independent. The same seed and niche always produce the same result.
4. **History.** With `--history`, palettes, pairings and heroes recently used
   for the same niche are excluded before selection; `--record` appends the
   result. This rotates directions across repeated runs.
5. **Locked values.** Motion tier, density, photo direction and effects come
   from the niche config; hero and composition come from niche-specific pools.

The direction lock records the chosen IDs, seed and timestamp. Re-running with
the same seed, niche and history must produce the same result. Model preference,
current trends, and "make it pop" are not inputs.

## 7. Avoid generic AI layout tells

These patterns appear so often in generated pages that they read as a template.
Each row names the tell, why it weakens the page, and the replacement.

| Tell | Why it weakens the page | Replacement |
|------|-------------------------|-------------|
| Centered hero over a violet-to-blue gradient | The gradient carries no product information; the composition is interchangeable | Product surface or real photograph anchored to the grid |
| Pill badge above the headline ("Now in beta") | Adds a third type style before the main message | Move status into a small metadata row or the CTA area |
| Three equal feature cards with line icons in rounded squares | Equal weight implies equal importance; icons are decorative | One primary capability with evidence, two supporting links |
| Glassmorphism panels over abstract blobs | Reduces contrast and hides the product | Solid surfaces, one elevation rule, real UI |
| Gradient text on key words | Low contrast, dated, and inaccessible at small sizes | One accent color on a short phrase or a ruled emphasis |
| Fake dashboard with unlabeled charts | Signals fabricated proof and teaches nothing | Real interface or a labeled diagram with units |
| "Trusted by" row of invented logos | Fabricated endorsement | Named customer with permission, or no logo row |
| Bento grid with eight equal tiles | No hierarchy; every tile competes | 2–3 tiles with distinct scale and one narrative order |
| Emoji as feature icons | Inconsistent rendering and tone | One icon family at consistent stroke |
| Scroll-triggered everything | Motion becomes noise and blocks reading | One entrance plus one signature moment |
| Dark mode with neon glow as a default | Reads as a template and hurts long-form reading | Dark only when the product or venue demands it |
| Floating centered paragraph | No reading edge; text appears unanchored | Left-aligned copy in a defined content window |
| Oversized rounded corners on every surface | Blurs the difference between button, card, and media | One radius family with 2–3 roles |
| Stock "team meeting" photo in the hero | Generic and unverifiable | Product, place, or accountable person |
| Lorem-style placeholder copy | Hides layout failure and ships by accident | Real draft copy or a flagged placeholder |
| Arbitrary animation on page load | Delays the first message | Content visible immediately; motion enhances only |

## 8. Direction review

Before implementation, answer these questions in the build notes:

- Does the niche row match the purchase mode and proof type?
- Is the primary visual real, licensed, and specific to this offer?
- Does the composition give the first viewport one clear focal point?
- Is the accent used for exactly one job?
- Is the motion tier justified by the niche and the available fallback?
- Can a competitor swap their logo into the hero without changing anything else?
  If yes, the direction is not specific enough.
- Name the three forbidden moves. Are they absent from the first screen?

## 9. Handoff contract

The direction lock is consumed by:

- `20-layout-rhythm.md` for composition, container, and section budgets.
- `30-typography-color.md` for pairing, scale, accent, and neutral ramp.
- `40-assets-brand.md` for image language and licensing.
- `50-motion-effects.md` for tier and moment.
- `60-copy-content.md` for voice and claim limits.
- `90-verification.md` for NICHE checks.

Any deviation after the lock is a recorded change, not a silent edit.

## 10. NICHE checks

| ID | Check | Pass condition |
|----|-------|----------------|
| NICHE-01 | Visual language | Composition, type, image language, and motion match the assigned row |
| NICHE-02 | Cliché list | No generic tell from section 7; no heavy effects outside the row ceiling |

Supporting checks without separate gate IDs:

- Exactly one matrix row is assigned, with evidence.
- The direction lock is complete, including three forbidden moves.
- One verifiable element appears in the first two viewports.
- The hero cannot be reused unchanged by a different offer.
- The motion tier is at or below the row ceiling and capability score.
- Hash, palette ID, and pairing ID are recorded for reproducibility.
