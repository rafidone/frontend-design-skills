# 70 — Accessibility and Performance

Accessibility is a correctness requirement. Performance is a comprehension
requirement. Both are measured in the browser on the built page, at the target
viewports, with real network conditions.

## 1. Semantics

- Use one `<header>`, one `<main>`, one `<footer>`, and one `<nav>` per page where
  each applies. Label multiple nav regions.
- Use `<button>` for actions and `<a>` for navigation. Never attach a click handler
  to a `<div>` without role, tabindex, and keyboard handling.
- Use `<ul>`/`<ol>` for lists, `<table>` for tabular data, `<form>` for forms, and
  `<label>` for every control.
- Headings describe sections. Do not use headings for visual size alone.
- Landmarks are not optional on long pages.

## 2. Headings and reading order

- Exactly one `<h1>` per page, matching the page's primary subject.
- Do not skip levels: H1 → H2 → H3. Visual size comes from classes, not tags.
- DOM order matches visual order on mobile and desktop. Do not reorder with CSS in
  a way that changes meaning.
- Decorative section numbers are not headings unless they label the section.
- A card title is a heading only if the card is a section of content; a repeated
  product card title may be an H3 under the collection H2.

## 3. Text alternatives

Decision tree:

| Content | Treatment |
|---------|-----------|
| Informative image | `alt` states the information conveyed, not the pixels |
| Decorative image | `alt=""`, `role="presentation"` if needed |
| Product UI | `alt` names the screen and the task; provide a text summary nearby |
| Chart | Short `alt` plus a data table or text summary |
| Diagram | `alt` plus inline labels; link to a text description |
| Logo | `alt` is the organization name, or empty if the name is adjacent text |
| Icon-only control | `aria-label` with the action |
| Decorative icon | `aria-hidden="true"` |
| Video | Captions plus a transcript for speech |
| Complex image | `aria-describedby` pointing to a longer description |

Rules:

- Do not start alt text with "Image of" or "Photo of".
- Do not repeat a nearby heading or visible label in the alt text.
- Do not put essential text inside an image.
- An empty `alt` is a decision, not an omission.

## 4. Focus and keyboard

- Every interactive element is reachable by Tab in a logical order.
- Focus is always visible: 2px ring, 2px offset, 3:1 contrast against adjacent
  colors. Never `outline: none` without an equivalent.
- The skip link is the first focusable element and becomes visible on focus. It
  targets `<main id="main">`.
- Tab order follows reading order. Do not use positive `tabindex`.
- Modals trap focus, close on Escape, restore focus to the trigger, and mark the
  background inert.
- Menus support arrow keys, Home, End, Escape, and type-ahead where appropriate.
- Custom selects and comboboxes implement the expected keyboard model or use a
  native control.
- Do not rely on hover for information or action.
- Provide visible focus for cards, tabs, accordions, and media controls.

```html
<a class="skip-link" href="#main">Skip to content</a>
<main id="main" tabindex="-1">…</main>
```

## 5. Labels and forms

- Every input has a persistent visible label. Placeholder text is not a label.
- Group related controls with `<fieldset>` and `<legend>`.
- Mark required fields in text, not only with an asterisk.
- Describe format and constraints before the user submits.
- Errors are announced, associated with the field via `aria-describedby`, and
  summarized at the top of long forms.
- Do not disable the submit button as the only error strategy; allow submission
  and explain what failed.
- Autocomplete tokens are correct: `email`, `name`, `tel`, `street-address`, etc.
- Do not block paste in password or code fields.
- Time limits can be extended or are absent.

## 6. Targets, zoom, and reflow

- Minimum target 44×44px for every interactive control. Space targets at least
  8px apart. A 24px target is below the design floor and fails the gate.
- Text remains readable at 200% zoom without loss of content or function.
- Reflow works at 320px CSS width with no two-dimensional scrolling, except for
  data tables and media rails.
- Text spacing overrides (line height 1.5, paragraph spacing 2em, letter spacing
  0.12em, word spacing 0.16em) do not clip content.
- Orientation is not locked.
- Content is not hidden behind hover-only affordances.

## 7. Motion and sensory safety

- Honor reduced motion (`50-motion-effects.md`).
- No flashing above three times per second.
- No autoplaying audio.
- No parallax or zoom that cannot be disabled.
- Provide pause for content that moves for more than 5 seconds.
- Do not use color alone for state, required fields, errors, or links.

## 8. Performance budgets

Measure the built page on a throttled mobile profile (4× CPU slowdown, Slow 4G)
and on desktop.

| Metric | Budget | Hard fail |
|--------|--------|-----------|
| LCP | ≤2.5s | >4.0s |
| CLS | ≤0.10 | >0.25 |
| INP | ≤200ms | >500ms |
| Total page weight | ≤2.5MB | >4.5MB |
| Initial JS (gzip) | ≤170KB | >300KB |
| CSS (gzip) | ≤60KB | >120KB |
| Hero image | ≤250KB | >500KB |
| Single image | ≤500KB | >1.2MB |
| Font files | ≤4 files, ≤180KB total | >6 files |
| Third-party requests | ≤1 | >3 |
| Lighthouse performance (mobile) | ≥90 | <75 |
| Lighthouse accessibility | 100 | <95 |

Rules:

- One hero image preloaded with `fetchpriority="high"`; everything below the fold
  lazy-loads with `loading="lazy"` and explicit dimensions.
- Serve AVIF/WebP with `srcset` and `sizes`. Do not ship a 2400px image to a
  390px viewport.
- Reserve space for images, embeds, and ads with `aspect-ratio` or fixed height.
- Self-host or preconnect fonts; subset to Latin (plus required scripts); use
  `font-display: swap`; limit weights to 400, 500/600, and one display weight.
- Avoid layout-shifting banners, cookie bars, and late-loading badges. Reserve
  their space or load them before first paint.
- Do not load a carousel library for three static cards. Do not load a chart
  library for one sparkline.
- Defer non-critical scripts; no synchronous third-party tags in `<head>`.
- Compress SVG, remove editor metadata, and inline only critical icons.
- Cache immutable assets with content hashes.

## 9. Responsive verification

Audit at minimum:

| Width | Height | Focus |
|-------|--------|-------|
| 320 | 568 | Minimum reflow, long words, tables |
| 390 | 844 | Primary phone target |
| 768 | 1024 | Tablet portrait, split stacking |
| 820 | 1180 | Large tablet, navigation |
| 1024 | 768 | Small laptop, grid transition |
| 1440 | 900 | Desktop target |
| 1920 | 1080 | Wide desktop, max container |

Checks at each width:

- No horizontal scroll: `scrollWidth <= clientWidth`.
- No overlap between sticky header and anchor targets.
- Tap targets meet 44px where practical.
- Text does not clip in buttons, tabs, or cards.
- Images keep the intended focal point.
- Navigation collapses before it wraps awkwardly.
- Tables scroll inside their wrapper, not the page.
- Modals fit the viewport and remain scrollable.

## 10. Accessibility QA

| ID | Check | Pass condition |
|----|-------|----------------|
| A11Y-01 | Accessible names and landmarks | Every control named; one main; nav labels; no readable text hidden |
| A11Y-02 | Focus visible | Visible focus ring for every interactive element |
| A11Y-03 | Heading order | One H1, no skipped levels, section H2s present |
| A11Y-04 | Tap targets | ≥44×44px for interactive targets |
| A11Y-05 | Alternative text | Every image has a meaningful alt decision |
| A11Y-06 | Skip link | First focusable element, visible on focus |

Supporting checks without separate gate IDs:

- Text contrast 4.5:1; large text and controls 3:1.
- Keyboard completes the primary flow; modals trap and restore focus.
- 200% zoom and 320px reflow pass.
- Reduced motion path is complete.
- Errors are associated and announced.
- `lang` is correct.

## 11. Performance QA

| ID | Check | Pass condition |
|----|-------|----------------|
| PERF-01 | Weight | Total page ≤4.5MB hard ceiling; target ≤2.5MB; responsive images |
| PERF-02 | Stability and speed | CLS ≤0.10; LCP ≤2.5s; no main-thread task >200ms |
| PERF-03 | Blocking assets | No blocking head script; limited stylesheets and fonts |

Supporting checks without separate gate IDs:

- Initial JS ≤170KB gzip; CSS ≤60KB gzip.
- Fonts: ≤4 files, subset, `font-display: swap`.
- Third parties ≤1 request.
- No source maps or dev bundles in production.
- DOM node count stays reasonable for the page type.

## 12. Commands

```bash
# Lighthouse mobile (adjust the URL and output path)
npx lighthouse http://localhost:4173 --preset=desktop --only-categories=performance,accessibility,best-practices,seo --output=json --output-path=/tmp/opencode/lh-desktop.json

npx lighthouse http://localhost:4173 --form-factor=mobile --throttling-method=simulate --only-categories=performance,accessibility --output=json --output-path=/tmp/opencode/lh-mobile.json

# Browser-driven accessibility and runtime checks (no dependencies)
npm run test:e2e

# Keyboard smoke test: tab through the page and record every stop
```

Manual checks are required for focus order, keyboard operation, zoom, and
reduced motion. Automated tools catch only part of the surface.
