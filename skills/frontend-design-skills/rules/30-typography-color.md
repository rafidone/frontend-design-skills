# 30 — Typography and Color

Type and color carry the page before any interaction happens. This document
defines roles, pairings, scale, measure, palette structure, contrast, and control
styling. Use tokens; do not hand-set font sizes or hex values per component.

## 1. Type roles

| Role | Size | Line height | Weight | Tracking | Use |
|------|------|-------------|--------|----------|-----|
| Display | `clamp(44px, 6vw, 76px)` | 0.98–1.02 | 500–600 | -0.035em | Hero statement, cover |
| H1 | `clamp(36px, 4.6vw, 60px)` | 1.05 | 550–600 | -0.03em | One per page |
| H2 | `clamp(30px, 3.2vw, 44px)` | 1.10 | 550 | -0.02em | Section heading |
| H3 | `clamp(24px, 2.2vw, 30px)` | 1.20 | 550 | -0.01em | Card or subsection |
| H4 | 20px | 1.30 | 600 | 0 | Label above a group |
| Lead | `clamp(18px, 1.6vw, 21px)` | 1.50 | 400 | 0 | Hero or section intro |
| Body | 17px (minimum 16px) | 1.60 | 400 | 0 | Prose, descriptions |
| Body strong | 17px | 1.60 | 600 | 0 | Inline emphasis only |
| Small | 14px | 1.50 | 400 | 0 | Metadata, helper text |
| Eyebrow | 14px | 1.30 | 600 | 0.12em, uppercase | Category, section index |
| Button | 16px | 1.00 | 600 | 0.01em | All controls |
| Mono | 14–16px | 1.50 | 400–500 | 0 | Code, keys, measurements |
| Quote | `clamp(22px, 2.4vw, 30px)` | 1.40 | 400 | -0.01em | Pull quote, testimony |

Rules:

- Body, inputs, navigation labels, and table cells are never below 16px.
- Small (14px) is limited to metadata that is not required to complete a task.
  Legal text may be 13px only in the footer.
- Eyebrow is optional. At most one eyebrow per section. Do not stack an eyebrow,
  pill badge, and kicker above the same heading.
- Use no more than three families: display, text, and optional mono.
- Weight variation carries hierarchy; do not use a second display family to
  create emphasis.
- Numerals in tables use `font-variant-numeric: tabular-nums`.

## 2. Measure and line breaks

- Prose measure: 45–75 characters; target 62ch. Hard cap `62ch`.
- Lead paragraph: 50–58ch.
- Display headline: 12–20 words maximum, 1–3 lines desktop.
- H2: 4–10 words, 1–2 lines.
- Body paragraphs: 2–4 sentences, 45–90 words. Technical pages target 60–90
  words per screen (`60-copy-content.md`).
- Balance headings with `text-wrap: balance`; use `text-wrap: pretty` for
  paragraphs where supported. Do not rely on manual `<br>` for desktop line
  breaks that break on mobile.
- No justified text, no all-caps paragraphs, no letter-spaced body copy.

## 3. Approved pairings

Pick one pair; confirm licenses before use. A pairing must include a text face
that remains readable at 17px and 400 weight.

| Context | Display | Text | Notes |
|---------|---------|------|-------|
| Technical SaaS | Inter Tight | Source Serif 4 | Grotesk UI plus readable long-form serif |
| Product UI | Geist | Geist Mono | One family plus mono; use mono for keys and code only |
| Developer tool | IBM Plex Sans | IBM Plex Mono | Coherent superfamily, strong code legibility |
| AI / research | Instrument Sans | Instrument Serif | Sober display, editorial counterpoint |
| Hardware | Archivo | IBM Plex Sans | Precise widths, strong spec tables |
| Commerce | Public Sans | Fraunces | Plain UI plus a warm campaign display |
| Hospitality | Newsreader | Manrope | Serif display, quiet sans text |
| Editorial | Source Serif 4 | Public Sans | Reading-first, metadata in sans |
| Service | Söhne | Tiempos Text | Commercial; confirm web license |
| Gaming | Any licensed condensed display | Archivo | One loud face, one sturdy text face |

Fallback stacks must name a metric-compatible local face and a generic family:

```css
--font-text: "Geist", "Inter", system-ui, sans-serif;
--font-display: "Instrument Serif", "Iowan Old Style", Georgia, serif;
--font-mono: "Geist Mono", "IBM Plex Mono", ui-monospace, monospace;
```

## 4. Banned primary faces

Do not use these as the primary display or body face. They may remain as a last
fallback inside a stack only when the licensed face fails to load.

| Face | Reason |
|------|--------|
| Poppins | Geometric forms collapse at body sizes; strongly associated with templates |
| Montserrat | Overexposed; wide caps weaken dense UI |
| Raleway | Thin weights and unusual caps reduce legibility |
| Lato | Dated at display sizes; weak punctuation |
| Open Sans | Neutral to the point of anonymity; poor display contrast |
| Roboto as display | Default Android texture; no brand signal |
| Space Grotesk | Overused display grotesk; weak at body sizes |
| Plus Jakarta Sans | Default startup face; no specific character |
| Arial / Helvetica as primary | Signals "no decision was made" |
| Bebas Neue | Condensed caps fail for anything except a short title |
| Anton | Too heavy for text and impossible to pair quietly |
| Playfair Display | Default "elegant" cliché; high-contrast strokes fail small |
| Cormorant Garamond | Fragile at UI sizes and low contrast |
| Comic Sans / Papyrus | Not production faces |

Also banned: a display face used for body copy, a text face stretched into a
display role with fake tracking, and more than one accent script face.

## 5. Heading scale discipline

- One H1 per page. Do not use H1 for a logo or footer wordmark.
- Heading levels follow DOM order; do not skip from H1 to H3 for visual size.
- Use the role tokens, not ad-hoc `font-size` values. A heading that needs a
  different size gets a new role, documented once.
- Do not use `clamp()` with viewport units inside a narrow card; card headings
  use fixed H3/H4 sizes.
- Keep display line height at or above 0.95 to avoid clipped descenders.
- Test diacritics, descenders (g, j, p, q, y), and parentheses at every size.

## 6. Color structure

A page is approximately 90% neutral by visible area. The accent is approximately
10% or less and serves one job.

| Token | Role | Example light | Example dark |
|-------|------|---------------|--------------|
| `--canvas` | Page background | `#F7F6F2` | `#0C0D0C` |
| `--surface` | Card or panel | `#FFFFFF` | `#151715` |
| `--surface-2` | Inset panel | `#EFEEE9` | `#1D201D` |
| `--ink` | Primary text | `#111311` | `#F4F3EE` |
| `--ink-2` | Secondary text | `#3D423D` | `#C9CCC5` |
| `--muted` | Metadata | `#666C64` | `#9AA096` |
| `--line` | Borders and rules | `#D8D6CE` | `#2C302B` |
| `--accent` | Action or live state | `#1F6B4F` | `#63C79B` |
| `--accent-ink` | Text on accent | `#FFFFFF` | `#07130D` |
| `--focus` | Focus ring | accent with 3:1 | accent with 3:1 |
| `--danger` | Error only | `#A3342A` | `#F08A80` |
| `--success` | Confirmed state only | `#246B45` | `#7FD3A4` |
| `--warning` | Caution only | `#8A5A12` | `#E7B768` |

Rules:

- Neutral surfaces may carry a trace of the accent hue, but keep chroma below 4%
  so they read as neutral.
- Do not use semantic colors as decoration. A green chip means success, not
  "fresh".
- One accent hue. Tints and shades of that hue are allowed; a second hue is not.
- **Do not use violet or lavender accents in hue 270–330.** This range is
  overused and reads as a default template. It also drifts toward low-contrast
  pastels on light surfaces.
- If the client brand requires a hue in that range, use it only as a small brand
  mark and choose a different action color; document the exception.
- Gradients are allowed only when they model a real surface (metal, light,
  depth). They never replace a flat action color.
- Text on photography requires a scrim that reaches 4.5:1 at the text bounds.

## 7. Contrast

| Content | Minimum | Target |
|---------|---------|--------|
| Body text | 4.5:1 | 7:1 |
| Large text (≥24px or ≥19px bold) | 3:1 | 4.5:1 |
| UI component boundaries and icons | 3:1 | 4.5:1 |
| Focus indicator against adjacent colors | 3:1 | 4.5:1 |
| Placeholder text | 4.5:1 | 4.5:1 |
| Disabled control label | 3:1 | 4.5:1 |
| Text over image or gradient | 4.5:1 at worst pixel | 7:1 |

Rules:

- Check the worst pixel, not the average. Sample the lightest and darkest areas
  under the text.
- Never communicate state with color alone. Pair color with text, an icon, or a
  pattern.
- Underline links in prose. In navigation, use weight, spacing, or an underline
  on hover and focus.
- Focus rings are visible on every surface: 2px ring, 2px offset, high contrast.
- Dark mode is optional; if present, retest every pair. Do not invert by filter.

## 8. Buttons

| Variant | Surface | Label | Border | Use |
|---------|---------|-------|--------|-----|
| Primary | Accent | `--accent-ink`, 4.5:1 | None | One per decision area |
| Secondary | Transparent | `--ink` | 1px `--line` | Alternate action |
| Quiet | Transparent | `--ink-2` | None, underline on hover | Tertiary action |

Rules:

- Minimum height 44px; desktop target 48px. Horizontal padding 20–24px.
- Radius comes from the single radius family defined in `00-house-rules.md`.
- Label format: verb plus object ("Book a room", "View pricing"). Never "Click
  here", "Submit", or "Learn more" as the primary action.
- Icon-only buttons require an accessible name and a 44×44px hit area.
- Hover changes surface or border within 120–200ms. Active state moves at most
  1px. No bounce, scale above 1.02, or glow.
- Disabled buttons explain why nearby; do not rely on opacity alone.
- Button groups align to the first baseline of the heading, not the vertical
  center of the hero.

## 9. Links and inline text

- Prose links are underlined by default, with `text-underline-offset: 0.14em`
  and `text-decoration-thickness: 1px`.
- Link color may be the accent or the ink color; if the accent fails contrast on
  the canvas, use ink with an underline.
- Visited links do not change hue unless the product requires history.
- Do not use "read more" as link text. The link must describe its destination.
- Inline code uses mono at 0.95em with a subtle surface; it does not use the
  accent color.
- Bold is for emphasis, not for entire sentences. Italic is not for UI labels.

## 10. Type and color checks

| ID | Check | Pass condition |
|----|-------|----------------|
| TYP-01 | Minimum body size | Computed ≥16px for body copy |
| TYP-02 | Measure | Prose 45–62ch; no block above 72ch |
| TYP-03 | Fonts load | Every declared family and weight loads |
| TYP-04 | Heading hierarchy | One H1, no skipped levels, ≤5 heading sizes |
| TYP-05 | Banned face | No banned primary face in computed styles |
| COL-01 | Contrast | Text 4.5:1, large 3:1, controls 3:1 |
| COL-02 | One accent | One saturated hue family; ≤10% of visible area |
| COL-03 | Prohibited hue | No violet or lavender in hue 270–330 |

Supporting checks without separate gate IDs:

- Body, inputs, navigation labels, and table cells are ≥16px at every viewport.
- Type roles come from one scale; no ad-hoc sizes.
- Line height is 0.95–1.02 for display and 1.5–1.7 for body.
- The pairing is licensed and includes a readable 400-weight text face.
- State is never communicated by color alone.
- Buttons, links, and focus rings meet the control-contrast floor.

## 11. Token snippet

```css
:root {
  --font-display: "Instrument Serif", Georgia, serif;
  --font-text: "Instrument Sans", system-ui, sans-serif;
  --font-mono: "IBM Plex Mono", ui-monospace, monospace;

  --step--1: 0.875rem;
  --step-0: 1.0625rem;
  --step-1: 1.25rem;
  --step-2: 1.5rem;
  --step-3: 1.875rem;
  --step-4: 2.75rem;
  --step-5: 4.75rem;

  --measure: 62ch;
  --radius-sm: 4px;
  --radius-md: 10px;
  --radius-lg: 18px;

  --canvas: #f7f6f2;
  --surface: #ffffff;
  --surface-2: #efeee9;
  --ink: #111311;
  --ink-2: #3d423d;
  --muted: #666c64;
  --line: #d8d6ce;
  --accent: #1f6b4f;
  --accent-ink: #ffffff;
  --focus: #1f6b4f;
}
```

The snippet is a starting point, not a palette decision. Replace values from the
direction lock; keep the roles and the constraints.
