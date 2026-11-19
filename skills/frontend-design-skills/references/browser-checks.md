# Browser Checks Reference

The browser is the source of truth. This reference defines the inspection matrix,
the checks to run at each viewport, the console probes, and the artifacts the gate
expects.

## 1. Setup

```bash
# Build and serve production output
npm run build
python3 -m http.server 4173 --directory dist
```

If the project outputs to `out/`, `build/`, or `.next/`, adjust the directory.
Never audit `next dev`, `vite dev`, or a file opened with `file://`.

Browser automation options:

- Playwright (`playwright-core` plus an installed Chromium)
- Puppeteer
- Chrome DevTools Protocol against a local Chrome
- Manual Chrome with DevTools, if automation is unavailable

Record the browser and version in the report.

## 2. Viewport matrix

| Name | Width | Height | Why |
|------|-------|--------|-----|
| phone-min | 320 | 568 | Reflow and long-word failure |
| phone | 390 | 844 | Primary mobile target |
| tablet | 768 | 1024 | 8-column grid and split stacking |
| tablet-lg | 820 | 1180 | Large tablet and navigation |
| laptop | 1024 | 768 | Grid transition |
| desktop | 1440 | 900 | Primary desktop target |
| wide | 1920 | 1080 | Max container and whitespace |

Capture a viewport screenshot at every size and a full-page screenshot at 390,
820, and 1440. Name files `<page>-<width>x<height>-<state>.png`.

## 3. First-paint checks

- The headline is readable before any entrance animation completes.
- No blank content area while JavaScript loads.
- No flash of unstyled text beyond one frame.
- The hero image either loads or has a stable poster; no empty box.
- The skip link is present but visually hidden until focused.
- The primary action is visible without scrolling.

## 4. Layout checks

At each viewport:

- `document.documentElement.scrollWidth <= clientWidth`.
- The container rails are equal for every section.
- No element extends past the viewport: check `getBoundingClientRect()`.
- Section heights match the declared budget: 0.90–1.16H or 1.84–2.16H.
- Splits and multi-column card grids are stacked at 820px and below.
- Text does not overlap images, sticky headers, or floating controls.
- Cards in a row have equal heights or intentionally aligned tops.
- Navigation does not wrap into two lines before collapsing.
- Tables scroll inside their wrapper, not the page.
- Sticky headers do not cover anchor targets.
- No card is nested more than two styled boxes deep.

```js
// Rails and overflow probe
(() => {
  const vw = document.documentElement.clientWidth;
  const wide = [...document.querySelectorAll('*')]
    .map((el) => ({ el, r: el.getBoundingClientRect() }))
    .filter(({ r }) => r.width > 0 && (r.right > vw + 1 || r.left < -1))
    .slice(0, 20)
    .map(({ el, r }) => ({
      tag: el.tagName,
      cls: el.className?.toString().slice(0, 60),
      left: Math.round(r.left),
      right: Math.round(r.right),
    }));
  return {
    vw,
    scrollWidth: document.documentElement.scrollWidth,
    overflowing: wide,
  };
})()
```

```js
// Section budgets
[...document.querySelectorAll('main section')].map((s) => ({
  id: s.id || null,
  budget: s.dataset.budget || null,
  height: Math.round(s.getBoundingClientRect().height),
  header: getComputedStyle(document.querySelector('header') || s).height,
}))
```

## 5. Console and network

- Zero console errors.
- Zero uncaught exceptions.
- No failed requests: 404, 500, CORS, blocked fonts, mixed content.
- No hydration warnings or mismatched markup.
- No deprecation warnings from the framework that indicate a broken build.
- No 1MB source maps downloaded by the page.
- No requests to `localhost`, staging, or a design-tool preview.

```js
// Capture after page load in Playwright
page.on('console', (m) => {
  if (m.type() === 'error') console.log('CONSOLE', m.text());
});
page.on('pageerror', (e) => console.log('PAGEERROR', String(e)));
page.on('requestfailed', (r) =>
  console.log('FAILED', r.url(), r.failure()?.errorText)
);
page.on('response', (r) => {
  if (r.status() >= 400) console.log('HTTP', r.status(), r.url());
});
```

## 6. Interaction checks

- Every button does what its label says.
- Every link resolves; no `href="#"` on a primary action.
- Forms validate, show inline errors, and confirm success.
- Menus open, close on Escape, and return focus.
- Modals trap focus and restore it.
- Tabs support arrow keys and expose `aria-selected`.
- Accordions expose `aria-expanded` and animate safely.
- Hover states do not reveal required information.
- Carousels can be paused and operated without a mouse.
- No dead controls in a decorative mock.

## 7. Keyboard checks

1. Load the page and press Tab once: skip link appears.
2. Activate the skip link: focus moves to `main`.
3. Tab through the header: focus order matches visual order.
4. Operate the primary flow using Enter/Space/arrows only.
5. Open and close a modal; confirm focus restoration.
6. Confirm focus is visible at every stop.
7. Confirm no keyboard trap outside a modal.
8. Shift+Tab reverses correctly.

Record the tab stops as a list. A screenshot of a focus ring is useful evidence.

## 8. Motion checks

- Enable reduced motion at the OS level; reload.
- Confirm no transform larger than 4px, no parallax, no autoplay, no WebGL.
- Confirm pinned stages become stacked content.
- Confirm all content is present with JavaScript disabled.
- Confirm loops pause offscreen.
- Confirm no scroll hijacking: use the wheel and touch; the page scrolls
  natively.
- Confirm `scroll-snap-type` is not set on the document.
- Count WebGL contexts; must be ≤4.
- Confirm a static poster exists for every canvas or video.

## 9. Zoom and reflow

- Set browser zoom to 200% at 1440px; content remains usable.
- Set the viewport to 320px; no horizontal scrolling except data tables.
- Apply text spacing overrides via DevTools or a test stylesheet.
- Confirm text does not clip in buttons, badges, tabs, or cards.
- Confirm fixed headers do not consume more than 15% of the viewport at 200%.

## 10. Performance checks

- Run Lighthouse mobile and desktop on the built page.
- Record LCP, CLS, INP or TBT, transfer size, and request count.
- Confirm the hero image is not the largest unoptimized asset.
- Confirm fonts are subset and swapped.
- Confirm below-fold images are lazy.
- Confirm no third-party script blocks first paint.
- Confirm the page weight is within budget in `../rules/70-accessibility-performance.md`.

## 11. Accessibility checks

- Automated: axe or Lighthouse accessibility, zero serious or critical issues.
- One H1; heading order correct.
- Every image has an alt decision.
- Every input has a label.
- Every icon-only control has a name.
- Landmarks are present.
- `lang` is correct.
- All text meets contrast.
- Focus is visible.
- Targets meet size.
- Errors are announced.
- A keyboard-only pass completes the primary flow.

## 12. Screenshot and artifact layout

```text
.frontend-design-skills/runs/<timestamp>/
  report.md
  static.txt
  browser.json
  console.txt
  network.txt
  keyboard.md
  axe.json
  lh-mobile.json
  lh-desktop.json
  screenshots/
    home-1440x900.png
    home-1440x900-full.png
    home-820x1180.png
    home-768x1024.png
    home-390x844.png
    home-390x844-full.png
    home-320x568.png
    focused-skip-link.png
    reduced-motion.png
```

## 13. Quick and full modes

| Mode | Checks | Use |
|------|--------|-----|
| Quick | One desktop viewport, console, overflow, H1, primary action | Iteration only; never delivery |
| Full | All viewports, full a11y, performance, motion, content, gate | Required before delivery |

Quick mode may not produce `GATE: PASS`. It reports `GATE: FAIL n` or
`GATE: OPEN n` and is for iteration only.

## 14. False positives
- A vertical scrollbar changes `clientWidth`; compare against `clientWidth`, not
  `innerWidth`.
- A intentionally offscreen skip link reports a negative left; exclude it.
- A decorative element clipped by a parent may still report a wide bounding box;
  check the computed clip and the parent overflow.
- A sticky element may report a height larger than its visual box; measure the
  rendered position.
- Font metrics differ across platforms; confirm the fallback stack is deliberate.
- Lighthouse variance is real; re-run once before filing a performance failure.

## 15. Browser check QA
| ID | Check | Pass condition |
|----|-------|----------------|
| LAY-02 | Budgets | Section heights are 0.90–1.16H or 1.84–2.16H |
| LAY-04 | No page overflow | `scrollWidth <= clientWidth` at all sizes |
| A11Y-02 | Focus | Visible at every tab stop |
| A11Y-06 | Skip link | First focusable, visible on focus |
| MOT-01 | Reduced motion | No motion beyond 4px, no loops |
| PERF-01 | Weight | Page within budget |
| SYS-04 | Runtime | Zero console or script errors |
| GATE-02 | Evidence | Screenshots and logs saved |
