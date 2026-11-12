# Troubleshooting Reference

Diagnose in the browser, fix the root cause, re-run the affected checks. This
reference lists the failures that occur most often in frontend-design-skills runs
and the shortest reliable fix.

## 1. Layout

| Symptom | Likely cause | Check | Fix |
|---------|--------------|-------|-----|
| Horizontal scrollbar | Fixed width, negative margin, or unbreakable text | `scrollWidth > clientWidth`; inspect wide elements | Use `minmax(0, 1fr)`, `min-width: 0`, `overflow-wrap` |
| Sections drift left or right | Per-section max-width or padding | Compare rails in DevTools | One container primitive; remove local max-widths |
| Section too tall | Content not budgeted; oversized padding | Measure section height | Cut copy, split section, or reduce padding within scale |
| Section too short | Missing content or collapsed grid | Inspect computed height and children | Merge into neighbor or add the missing proof |
| Sticky header covers anchor | No scroll offset | Click an anchor link | `scroll-margin-top: calc(header + 16px)` |
| Cards unequal height | Flex without stretch or inconsistent content | Inspect align-items | `align-items: stretch`; equal internal structure |
| Grid overflows at 320 | Long word or fixed column | Test 320px; inspect min-content | `min-width: 0`, break long tokens |
| Split does not stack | Breakpoint missing or wrong order | Resize to 820px | Stack at 820px; copy before media |
| Text overlaps image | Absolute positioning without reserved space | Toggle outlines | Use grid flow; remove absolute text over media |
| Z-index war | Global stacking contexts | Inspect z-index values | Use the token scale; isolate components |
| Modal scrolls the page | Body lock missing or wrong | Open modal; scroll background | Lock body, restore on close |
| Two scrollbars in a table | Wrapper and page both overflow | Inspect table wrapper | Only the wrapper scrolls; page stays clipped |

## 2. Typography and color

| Symptom | Likely cause | Check | Fix |
|---------|--------------|-------|-----|
| Font does not load | Wrong path, CORS, or format | Network panel | Serve from same origin; correct `@font-face` |
| Text flashes or shifts | No fallback metrics or swap | Throttle network | `font-display: swap`; metric-compatible fallback |
| Body text looks too small | Hard-coded 14px or below | Computed styles | Set body to 17px; remove per-component overrides |
| Headline wraps badly | Measure too wide or manual breaks | Inspect line boxes | `text-wrap: balance`; cap at 18–20 words |
| Prose too wide | No measure cap | Character count | `max-width: 62ch` |
| Accent everywhere | Accent used for decoration | Count accent areas | Accent only for action, selection, live state |
| Low contrast | Muted token too light | Contrast checker | Darken token; retest worst pixel |
| Color-only status | No text or icon | Inspect state markup | Add label or icon |
| Disallowed hue | Accent in 270–330 | Convert token to HSL | Replace with approved accent |
| Buttons look inconsistent | Multiple radius or padding values | Inspect computed styles | Use one button primitive |
| Links invisible in prose | No underline, low contrast | Inspect link styles | Underline and 4.5:1 contrast |

## 3. Assets

| Symptom | Likely cause | Check | Fix |
|---------|--------------|-------|-----|
| Broken image | Wrong path or missing export | Network 404 | Correct path; add file to build |
| Manifest mismatch | Renamed file or missing row | Compare manifest to disk | Update row or restore file name |
| Huge image | Original uploaded | Network size | Export AVIF/WebP at responsive widths |
| Wrong crop | `object-fit: fill` or no focal point | Resize viewport | `cover` plus `object-position` |
| Subject disappears on phone | Desktop crop reused | Check 390px | Add phone crop or focal point |
| Fake logo row | No licensed marks | Review manifest | Remove row or use verified names |
| Generated evidence | Synthetic image supplied | Inspect provenance | Replace with real photography |
| Icon styles mixed | Multiple families | Inspect SVG sources | One family or custom set |
| Credit missing | License requires attribution | Read license | Add one footer credit line |
| Caption noise | Stock caption copied | Read visible text | Remove; rely on alt text |

## 4. Motion

| Symptom | Likely cause | Check | Fix |
|---------|--------------|-------|-----|
| Hero invisible on load | Content hidden until JS | Disable JS | Visible default; additive animation |
| Animation feels slow | Durations above token | Inspect transitions | Use 120/200/320/560ms tokens |
| Page janks | Animating layout properties | Performance panel | Animate transform and opacity only |
| Scroll hijacked | Wheel/touch interception | Try wheel and touch | Remove interception; use native scroll |
| Snap traps the page | `scroll-snap-type` on document | Computed style | Remove from main scroller |
| Reduced motion ignored | Media query missing or overridden | Enable OS setting | Add reduced-motion path |
| WebGL blank | Context creation failed | Console | Feature detect and show poster |
| Too many contexts | Multiple canvases | Count `getContext` calls | Cap at four; dispose on route change |
| Loop never stops | No visibility check | Switch tabs | Pause offscreen and on hidden |
| Modal animation blocks close | Long exit transition | Click close | Exit ≤200ms; remove after transition |

## 5. Copy and content

| Symptom | Likely cause | Check | Fix |
|---------|--------------|-------|-----|
| Text overflows a card | Copy beyond budget | Measure width and lines | Cut copy; do not shrink type |
| Placeholder shipped | `[[TBD:` not replaced | Search source | Replace or mark gate `OPEN` |
| Invented proof | No source in inventory | Match claim to source | Remove or replace with verified fact |
| Filler language | Generic marketing | Search banned lexicon | Rewrite with specific mechanism |
| CTA unclear | "Learn more" or "Get started" | Read label | Verb plus object |
| Duplicate claims | Same promise in every section | Read headings | Assign one job per section |
| No next step | Hero action missing or hidden | Check first viewport | Add primary action and repeat after proof |
| Caption restates image | Stock caption | Read caption | Remove |
| Inconsistent voice | Multiple writers | Read page aloud | One person, one terminology |

## 6. Accessibility

| Symptom | Likely cause | Check | Fix |
|---------|--------------|-------|-----|
| No visible focus | `outline: none` | Tab through | Add 2px ring with offset |
| Skip link missing | Not first focusable | Tab once | Add skip link to `#main` |
| Keyboard trap | Modal without escape | Tab in dialog | Trap correctly; Escape closes |
| Unlabeled input | Placeholder only | Inspect label association | Add visible `<label>` |
| Multiple H1 | Template plus content | Count H1 | One H1; demote others |
| Heading skips | Visual choice | Inspect outline | Fix level order |
| Images undescribed | Missing alt | Audit images | Informative alt or empty alt |
| Icon-only button unnamed | No `aria-label` | Inspect accessible name | Add label and 44px target |
| Contrast failure | Muted text | axe or checker | Darken or change surface |
| Zoom breaks layout | Fixed heights | 200% zoom | Use min-height and flow |
| Reduced motion ignored | No media query | Toggle setting | Add path |
| Screen reader reads decorative icon | No `aria-hidden` | Inspect accessibility tree | Hide decorative icons |

## 7. Performance

| Symptom | Likely cause | Check | Fix |
|---------|--------------|-------|-----|
| High LCP | Large hero image or blocking font | Lighthouse | Compress, preload, subset |
| Layout shift | Missing dimensions | Performance panel | Reserve space with aspect-ratio |
| Large JS | Client-rendered static page | Bundle analyzer | Server/static render; remove libraries |
| Fonts block render | No swap, too many weights | Network | Swap, subset, limit weights |
| Late third-party tag | Sync script in head | Network waterfall | Defer or remove |
| Slow mobile | Unthrottled images | Throttle 4G | Responsive srcset and sizes |
| CSS too large | Unused framework output | Build stats | Purge, split, remove unused |
| Cache misses | No hashed assets | Response headers | Hash and cache immutable files |

## 8. Build and framework

| Symptom | Likely cause | Check | Fix |
|---------|--------------|-------|-----|
| 404 on assets | Wrong base path | Network | Set base/public path |
| Blank page after build | Client-only render or JS error | Console | Static render; fix error |
| Hydration mismatch | Random/date during render | Console | Stable initial state |
| Styles missing | Tailwind purge or CSS path | Built CSS | Safelist or correct content globs |
| Google font missing | Blocked network | Network | Self-host or preconnect |
| Route 404 on refresh | SPA history fallback | Direct URL | Static export or rewrite |
| Images unoptimized | Framework loader disabled | Build config | Use image component or prebuild |
| Dev overlay in production | Dev server audited | URL | Serve production build |
| Absolute localhost URL | Hard-coded env | Search built files | Use relative or env value |
| Source maps public | Build config | `dist` inspection | Disable production maps |

## 9. Gate

| Symptom | Likely cause | Check | Fix |
|---------|--------------|-------|-----|
| Cannot reach `PASSED` | An `OPEN` item remains | Gate record | Resolve or evidence it |
| Missing evidence | Check marked from memory | Report | Re-run and save artifact |
| Too many waivers | Scope or design problem | Waiver list | Fix or reduce scope |
| Waiver expired | Date passed | Waiver record | Fix or renew with approval |
| Blocker marked minor | Mislabeled severity | Rule table | Restore blocker severity |
| Screenshots stale | Build changed | Compare build hash | Re-capture after rebuild |
| Group pass without children | Aggregation shortcut | Check results | Evaluate each child |

## 10. Escalation

1. **Reproduce.** Confirm the failure at the named viewport with a fresh load.
2. **Isolate.** Disable half the CSS or components to find the cause.
3. **Fix the system.** Change the token, primitive, or layout rule, not the one
   instance.
4. **Re-run.** Run the failing check plus adjacent checks.
5. **Record.** Add evidence and update the gate round.
6. **Escalate.** If the fix requires a scope change, a missing asset, or a legal
   decision, mark `BLOCKED` with an owner and a next action.

Do not "fix" by hiding overflow, shrinking text, removing focus, or deleting the
check. Those convert a visible failure into an invisible one.

## 11. Reset procedure

When a page has accumulated too many local fixes:

1. Stop styling.
2. Return to the direction lock and the grid.
3. Rebuild the page shell with container, section, and type tokens.
4. Re-add sections from `references/section-library.md` one at a time.
5. Audit after each section at 1440 and 390.
6. Delete unused CSS and components.
7. Run the full gate.

A clean rebuild is faster than reconciling five competing systems.
