# 50 — Motion and Effects

Motion is part of the information hierarchy. It may reveal sequence, confirm an
action, or demonstrate a product. It may not delay reading, hijack scrolling, or
compete with the message. Choose a tier, spend the budget, ship a fallback.

## 1. Tiers

| Tier | Scope | Allowed | Budget |
|------|-------|---------|--------|
| T0 | Static pages, editorial, service, legal | Color and underline transitions only | 0 entrances, 0 loops, 0 WebGL |
| T1 | Most marketing and product pages | One entrance sequence, media reveals, hover states | ≤3 animated regions, 0 WebGL |
| T2 | Gaming, hardware, technical demos | T1 plus one signature moment | ≤2 moments, ≤4 WebGL instances |

Tier assignment comes from `10-art-direction.md`. A page may use less motion than
its ceiling, never more. If the tier cannot ship a reduced-motion and no-WebGL
fallback, reduce the tier.

## 2. Tokens

```css
:root {
  --dur-fast: 120ms;
  --dur-base: 200ms;
  --dur-slow: 320ms;
  --dur-enter: 560ms;
  --ease-out: cubic-bezier(0.2, 0.6, 0.2, 1);
  --ease-in-out: cubic-bezier(0.45, 0, 0.2, 1);
  --ease-enter: cubic-bezier(0.16, 0.84, 0.24, 1);
}
```

Rules:

- Animate `transform` and `opacity` only. Width, height, top, left, and filter
  animations are prohibited on large surfaces.
- One easing family per page. Do not mix linear, spring, and bounce.
- Durations are fixed tokens, not per-component guesses.
- No animation may run longer than 800ms for an entrance or 2s for a loop.
- Loops pause when the element is offscreen or the tab is hidden.

## 3. Hero entrance

The hero must be readable before motion finishes.

- Content is visible by default in the HTML; motion is additive. Do not hide the
  hero with `opacity: 0` until JavaScript loads.
- Sequence: eyebrow (0ms), display (60ms), lead (120ms), actions (180ms), media
  (240ms). Each step 320–560ms, 12–16px translate, opacity 0→1.
- Total sequence ≤900ms including stagger.
- No letter-by-letter text reveal, no blur-in, no scale from 0.8.
- The primary action is clickable immediately; a transparent overlay must not
  block it during the entrance.
- If the page restores scroll position, skip the entrance and show final state.
- On phone, reduce translate to 8px and total duration to ≤600ms.

## 4. One or two moments

A moment is a deliberate, memorable motion event.

Permitted moments:

- A product surface that assembles once as it enters, then stays still.
- A pinned stage using native scroll where a diagram advances in three beats.
- A shader or canvas field behind a hardware product, capped and pausable.
- A before/after wipe controlled by the user, not autoplay.

Rules:

- Maximum two moments per page. If a third is proposed, cut one.
- A moment must explain something. If it only decorates, remove it.
- A moment must be dismissible or pausable if it lasts more than 5s or loops.
- Do not run a moment in the first viewport before the headline is readable.
- Do not combine a pinned stage with a second scroll-linked animation in the same
  viewport.
- Every moment has a reduced-motion state and a static poster.

## 5. Hover, focus, and press

| State | Change | Duration |
|-------|--------|----------|
| Link hover | Underline thickness or color | 120ms |
| Button hover | Surface shift or 1px lift | 160ms |
| Card hover | Border contrast or 2px lift; no scale | 200ms |
| Media hover | 1.02 scale maximum, or none | 320ms |
| Focus | 2px ring, 2px offset, no motion | Instant |
| Press | 1px translate or darker surface | 80–120ms |

Rules:

- Hover is never the only way to reveal required information.
- No hover effect on touch-only layouts; guard with `@media (hover: hover)`.
- No cursor-following blobs, magnetic buttons, or tilt cards on content pages.
- Do not animate box-shadow on large lists; use border or opacity.
- Focus styles are not transitions and may not be removed.

## 6. Signature effects

### WebGL

- Maximum four WebGL instances per page, including offscreen canvases.
- One context per visible scene. Dispose contexts on route change.
- Cap device pixel ratio at 2. Pause the render loop when offscreen.
- Provide a static poster image, the same crop and grade, for no-WebGL and
  reduced-motion contexts.
- Do not use WebGL for text, navigation, or product UI. It is a background or
  product-visual layer only.
- Detect support before mounting; never let a failed context leave a blank hero.
- Log context loss and restore or fall back within one frame budget.

### GSAP and scroll libraries

- Allowed only for gaming, hardware, and technical pages with a real demo.
- Use a library only when CSS cannot express the sequence; a simple entrance does
  not justify a 70KB dependency.
- ScrollTrigger-style pinning must use native scroll position. Do not intercept
  wheel or touch events to fake scrolling.
- Register cleanup on route change and on `prefers-reduced-motion` change.
- Pin duration is measured in viewport heights and capped at 1.5H per beat.
- Ship a no-JavaScript layout in which all content is visible and ordered.

### Canvas and SVG

- Canvas is for data fields and simulations, not for static diagrams.
- SVG animation uses `stroke-dashoffset` or transform only, with a short path.
- Do not animate more than 200 SVG nodes at once.
- Provide `<title>` and a text alternative for informative SVG.

## 7. Reduced motion

Honor `prefers-reduced-motion: reduce` at load and when it changes.

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

Additional rules:

- Remove transforms larger than 4px, parallax, autoplay video, and all WebGL.
- Replace a pinned stage with a stacked list of the same beats.
- Keep focus and state visibility; do not remove feedback entirely.
- Provide a visible pause control for any loop that remains.
- Test with the OS setting enabled, not only by toggling a class.

## 8. Scrolling

- No scroll-jacking: do not intercept wheel, touchmove, or keyboard scroll to
  drive an animation.
- No CSS scroll-snap on the main document. It is allowed inside a horizontal
  media rail with visible controls.
- `scroll-behavior: smooth` is allowed only for anchor links and must respect
  reduced motion.
- Sticky stages use `position: sticky` and native scroll. The page must remain
  scrollable at normal speed.
- Do not lock body scroll except for a modal, and restore it on close.
- Horizontal rails show a partial next item and a visible control; do not hide
  overflow with no affordance.

## 9. Video and autoplay

- Autoplay is muted, inline, and does not exceed 6s before a pause control.
- No sound on autoplay. Ever.
- Provide captions for speech and a transcript for meaningful audio.
- Compress to a poster plus MP4/WebM; do not autoplay a 20MB file.
- Pause when offscreen and when reduced motion is active.
- Decorative video is not evidence; label product demos as demos.

## 10. Fallbacks

| Feature | Primary | Fallback |
|---------|---------|----------|
| Entrance | Transform plus opacity | Static final state |
| Pinned stage | Sticky native scroll | Stacked steps with headings |
| WebGL field | Canvas scene | Static poster image |
| Video | MP4/WebM | Poster plus play control |
| Horizontal rail | Scroll-snap inside rail | Wrapped grid |
| Before/after | Drag or range control | Side-by-side images |
| Count-up numbers | Animated value | Final value in HTML |

Rules:

- The fallback is designed, not an error state.
- Content order and meaning are identical in both paths.
- Test with JavaScript disabled, WebGL disabled, and reduced motion enabled.
- A fallback that shows less information than the primary path fails.

## 11. Motion QA

| ID | Check | Pass condition |
|----|-------|----------------|
| MOT-01 | Reduced motion | Content visible; no animation >200ms or infinite loop |
| MOT-02 | Motion budget | ≤4 canvases; ≤4 infinite loops; ≤2 animations over 1.6s; hover/focus declared |
| MOT-03 | No scroll hijack or snap | Native scroll; no document scroll-snap; no global smooth scroll |
| NICHE-02 | Motion ceiling | No canvas or heavy library outside gaming, hardware, or technical pages |

Supporting checks without separate gate IDs:

- Observed motion stays at or below the row ceiling.
- No animation blocks reading or the primary action.
- Every WebGL scene has a static poster and a no-WebGL path.
- Loops pause offscreen and when the tab is hidden.
- Hover effects are guarded for touch.
- Every motion path has a reduced-motion alternative.

## 12. Measurement

```js
// Count WebGL contexts created by the page (instrument before load)
const original = HTMLCanvasElement.prototype.getContext;
let count = 0;
HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
  if (type === "webgl" || type === "webgl2") count += 1;
  return original.call(this, type, ...rest);
};

// Check reduced-motion behavior
matchMedia("(prefers-reduced-motion: reduce)").matches;

// Check document scroll snap
getComputedStyle(document.documentElement).scrollSnapType;
```

Record the tier, the moments, the WebGL count, and the fallback screenshots in
the gate evidence. Motion that cannot be observed in the browser is not verified.
