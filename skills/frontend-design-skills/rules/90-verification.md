# 90 — Verification

Verification is a loop with evidence. A rule is not passed because the source
looks correct, the build succeeded, or the model is confident. It passes when the
built page was observed at the target viewports and the result was recorded.

## 1. Preconditions

- The direction lock exists (`10-art-direction.md`).
- The content inventory is current (`60-copy-content.md`).
- The asset manifest is complete (`40-assets-brand.md`).
- The production build runs locally.
- Browser automation or a manual browser is available.
- The gate writes `report.json`, `report.html`, `report.md` and screenshots to
  `.frontend-design-skills/runs/<timestamp>/` under the project.

If a precondition is missing, stop and fix it. Do not begin the audit with
placeholders that cannot be distinguished from final content.

## 2. The loop

Run phases in order. A failure returns to the earliest phase that can fix it.

```text
0. Inventory      → files, routes, assets, claims, directions
1. Static audit   → source rules, tokens, labels, metadata
2. Build          → production build, no errors, no warnings ignored
3. Serve          → HTTP server on the built output
4. Browser audit  → viewports, overflow, console, network, screenshots
5. Accessibility  → keyboard, focus, labels, axe, zoom, reduced motion
6. Performance    → Lighthouse, weight, LCP, CLS, INP
7. Content audit  → copy, claims, captions, placeholders
8. Gate           → aggregate, waivers, final state
9. Report         → evidence links and residual risks
```

## 3. Phase commands

### 3.1 Inventory

```bash
find . -maxdepth 3 -type f \( -name '*.html' -o -name '*.tsx' -o -name '*.vue' -o -name '*.svelte' -o -name '*.astro' \) | sort
find . -maxdepth 4 -type f \( -name '*.png' -o -name '*.jpg' -o -name '*.webp' -o -name '*.avif' -o -name '*.svg' -o -name '*.woff2' \) | sort
```

Record routes, templates, assets, and the content inventory path.

### 3.2 Static audit

```bash
# Placeholders and dummy prose
rg -n "\[\[TBD:|lorem ipsum|Lorem ipsum" .

# Banned display faces
rg -n "Poppins|Montserrat|Raleway|Bebas Neue|Playfair Display" .

# Prohibited accent range (manual review of tokens; hex values vary)
rg -n "--accent|#7c3aed|#8b5cf6|#a78bfa" .

# Inline sizes that bypass the scale
rg -n "font-size:\s*(1[0-5]|[0-9])px" .

# Off-system radii
rg -n "border-radius:\s*(?!var)" .

# Scroll hijacking and document snap
rg -n "scroll-snap-type|wheel|touchmove|preventDefault" .

# Debug output
rg -n "console\.(log|debug)|debugger" .
```

Treat matches as leads, not verdicts. Confirm in the browser.

### 3.3 Build

```bash
npm ci
npm run build
```

For static output, confirm the directory:

```bash
ls -la dist out build 2>/dev/null
```

### 3.4 Serve

```bash
python3 -m http.server 4173 --directory dist
# or
npx serve dist -l 4173
```

Serve the production output. Dev servers mask asset and hydration failures.

### 3.5 Browser audit

Automate the repeatable checks with Playwright, Puppeteer, or the Chrome DevTools
Protocol. Capture full-page and viewport screenshots at 1440×900, 820×1180,
768×1024, and 390×844.

```js
// tests/audit.mjs — run with node after installing playwright-core
import { chromium } from "playwright-core";

const url = process.env.URL || "http://localhost:4173";
const sizes = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet-lg", width: 820, height: 1180 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "phone", width: 390, height: 844 },
  { name: "phone-min", width: 320, height: 568 },
];

const browser = await chromium.launch();
const page = await browser.newPage();
const errors = [];
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
page.on("pageerror", (e) => errors.push(String(e)));
page.on("response", (r) => r.status() >= 400 && errors.push(`${r.status()} ${r.url()}`));

for (const size of sizes) {
  await page.setViewportSize(size);
  await page.goto(url, { waitUntil: "networkidle" });
  const result = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    sections: [...document.querySelectorAll("main section")].map((s) => ({
      id: s.id,
      budget: s.dataset.budget,
      height: Math.round(s.getBoundingClientRect().height),
    })),
    h1: document.querySelectorAll("h1").length,
  }));
  console.log(size.name, JSON.stringify(result));
  await page.screenshot({
    path: `/tmp/opencode/fdm-audit/${size.name}.png`,
    fullPage: true,
  });
}

console.log("errors", errors);
await browser.close();
```

Record: horizontal overflow, section heights, H1 count, console errors, failed
requests, and screenshot paths.

### 3.6 Accessibility

```bash
npm run test:e2e
# or run the full gate against a served build
node skills/frontend-design-skills/scripts/verify.mjs <target> --full --kind <niche>
```

Manual steps, recorded as notes:

1. Tab from the top; confirm skip link, header, main actions, footer, and that
   focus is always visible.
2. Operate the primary flow with the keyboard only.
3. Zoom to 200% at 1440; confirm no clipping and no two-dimensional scroll.
4. Enable reduced motion; confirm no transforms, parallax, autoplay, or WebGL.
5. Disable JavaScript; confirm content and navigation remain usable.
6. Inspect every image's alt text and every field's label.

### 3.7 Performance

```bash
npx lighthouse http://localhost:4173 --form-factor=mobile --throttling-method=simulate --output=json --output-path=/tmp/opencode/fdm-audit/lh-mobile.json
npx lighthouse http://localhost:4173 --preset=desktop --output=json --output-path=/tmp/opencode/fdm-audit/lh-desktop.json
```

Extract LCP, CLS, INP/TBT, transfer size, and request count. Compare against the
budgets in `70-accessibility-performance.md`.

### 3.8 Content audit

- Read the page aloud in order. Every sentence must make sense without the image.
- Match every number to the content inventory.
- Confirm no caption restates an image.
- Confirm no `PLACEHOLDER`, `TBD`, or demo label remains unless explicitly
  approved in the report.
- Confirm the footer credit is the only credit line.

## 4. Rule ID registry

| Prefix | Check IDs | Source |
|--------|-----------|--------|
| LAY | 01 hero first screen; 02 section budget; 03 equal edges; 04 overflow; 05 overlap; 06 stacking | `20-layout-rhythm.md` |
| TYP | 01 body 16px; 02 measure; 03 fonts load; 04 heading hierarchy; 05 banned faces | `30-typography-color.md` |
| COL | 01 contrast; 02 one accent; 03 no violet/lavender | `30-typography-color.md` |
| VIS | 01 visuals render; 02 no placeholders; 03 no captions | `40-assets-brand.md` |
| AST | 01 source/subject; 02 assets resolve; 03 credits | `40-assets-brand.md` |
| MOT | 01 reduced motion; 02 budget; 03 no hijack/snap | `50-motion-effects.md` |
| COP | 01 lorem/filler; 02 verb+object; 03 stock phrases; 04 invented proof | `60-copy-content.md` |
| A11Y | 01 names/landmarks; 02 focus; 03 headings; 04 targets; 05 alt; 06 skip link | `70-accessibility-performance.md` |
| PERF | 01 weight; 02 CLS/LCP; 03 blocking assets | `70-accessibility-performance.md` |
| SYS | 01 one system; 02 two boxes; 03 fake UI; 04 script errors | `80-stack-integration.md` |
| NICHE | 01 visual language; 02 cliché list | `10-art-direction.md` |
| GATE | 01–08 finish-gate process checks | `references/gate.md` |

Every result uses one of these IDs. Supporting checks are reported in prose under
the nearest ID. Do not invent a new prefix during an audit; add the check to the
relevant document first.

## 5. PASS / FAIL / OPEN

| State | Meaning | Evidence required |
|-------|---------|-------------------|
| `PASS` | The check was observed and meets the rule | Command output, measurement, or screenshot path |
| `FAIL` | The check was observed and does not meet the rule | The same evidence plus the observed value |
| `OPEN` | The check could not be completed | Reason, owner, and next action |

Rules:

- A check with no evidence is `OPEN`, not `PASS`.
- A build error blocks all downstream browser checks until fixed.
- A single `FAIL` on a hard rule blocks delivery.
- `OPEN` is not a finish state. Resolve it or convert it to a waiver.
- Do not mark a group `PASS` because its children were not tested.
- Re-run every failed check after a fix, and re-run adjacent checks that share
  the same cause.

## 6. Severity

| Severity | Definition | Effect |
|----------|------------|--------|
| Blocker | Accessibility, fabricated proof, missing content, broken build | Cannot ship; cannot waive |
| Major | Violates a house rule or budget | Cannot ship without a waiver |
| Minor | Polish issue with no comprehension or access impact | Waiver or fix before handoff |
| Note | Observation, no rule violation | Record only |

Hard-rule blockers: HR-06 (body size), HR-07 (real visuals), HR-09 (invented
proof), HR-10 (gate), any A11Y failure, any broken build, and the structural
checks LAY-01, LAY-04, A11Y-03, SYS-04, and COL-01.

## 7. Waivers

Maximum five. A waiver is a written exception, not a silent omission.

```text
WAIVER W-01
rule: LAY-06
scope: /case-study, desktop only
observed: section height 1.9H against a declared 1H budget
reason: client supplied a long verified timeline that cannot be cut
risk: longer scroll before the close action
mitigation: added an in-section action at the 1H mark
owner: name
approved_by: name
expires: 2026-12-31
```

Rules:

- One waiver per rule and scope. Do not bundle unrelated rules.
- A waiver must include observed evidence, a reason, a risk, and a mitigation.
- Blockers cannot be waived.
- Expired waivers are failures.
- More than five waivers means the design or scope is wrong; return to direction.

## 8. Final report

`scripts/verify.mjs` writes `report.json`, `report.html`, `report.md` and the
screenshots to `.frontend-design-skills/runs/<timestamp>/` under the project.
Include the same summary in the handoff; do not keep a second copy under `/tmp`.

```markdown
# Frontend Verification Report

project: <slug>
date: <ISO date>
build: <commit or artifact hash>
url: <served URL>
viewports: 1440×900, 1280×800, 1024×768, 820×1180, 768×1024, 390×844, 320×568

## Result
GATE: PASS | FAIL n | OPEN n | SETUP | ERROR | DONE

## Gate
| Phase | Result | Evidence |
|-------|--------|----------|
| Static audit | PASS | .frontend-design-skills/runs/<timestamp>/static.txt |
| Build | PASS | npm run build output |
| Browser | PASS | screenshots/ |
| Accessibility | PASS | axe.json, keyboard notes |
| Performance | PASS | lh-mobile.json, lh-desktop.json |
| Content | PASS | inventory diff |

## Rule results
| ID | Result | Observed | Evidence |
|----|--------|----------|----------|
| LAY-03 | PASS | equal rails at 1440 and 820 | desktop.png |
| TYP-01 | PASS | body 17px | computed.txt |
| COL-03 | PASS | accent hue 154 | tokens.css |
| VIS-03 | PASS | no captions under visuals | inventory.md |
| A11Y-02 | PASS | focus ring on every control | keyboard.md |
| PERF-01 | PASS | 1.1MB total transfer | lh-mobile.json |

## Waivers
<list or "none">

## Assumptions
<list>

## Residual risks
<list>

## Artifacts
<paths to screenshots, JSON, logs>
```

The report must be readable by someone who did not watch the run. No unexplained
abbreviations, no "various fixes", no missing evidence paths.

## 9. Re-run triggers
Re-run the affected phases after any of these:

- A token, font, or global stylesheet change: static audit, browser, a11y,
  performance.
- A layout or section change: browser, a11y, performance.
- An asset swap: visual, a11y, performance.
- A copy or claim change: content, static audit.
- A dependency or build change: build, browser, performance.
- A route addition: all phases for the new route plus navigation checks.

Do not re-run only the failing check when the fix could affect shared primitives.

## 10. Exit criteria
The run may stop only when:
- `GATE: PASS` or `GATE: DONE`.
- No `OPEN` items.
- No blocker.
- At most five waivers, all approved and unexpired.
- The built page was served and inspected at all required viewports.
- Screenshots and measurement files exist.
- The report is complete and the residual risks are stated.

## 11. GATE checks
| ID | Check | Pass condition |
|----|-------|----------------|
| GATE-01 | Gate run | Final line is `GATE: PASS` or `GATE: DONE` |
| GATE-02 | Evidence | Every PASS has a path or measurement |
| GATE-03 | No open items | OPEN count is zero |
| GATE-04 | Waivers | ≤5, approved, unexpired, no blockers |
| GATE-05 | Report | Uses the required format |
| GATE-06 | Built page | Audit ran against production output |
| GATE-07 | Viewports | All required sizes captured |
| GATE-08 | Re-run | Fixes triggered the affected phases |
