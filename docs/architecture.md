# Architecture

`frontend-design-skills` is a self-contained skill plus a small verification
toolchain. There is no runtime dependency on a package registry, a remote design
service or a hosted browser. The repository is designed so a fresh checkout can
answer one question with evidence: **is this page finished?**

```text
brief
  |
  v
assign.mjs ------> palettes.json / type-pairs.json / rules.mjs
  |                  deterministic palette, type pair, hero, composition
  v
scaffold.mjs -----> starter tokens + components + local assets
  |                  html | react | next | vue | svelte | astro | tailwind
  v
serve.mjs --------> http://127.0.0.1:<port>
  |
  v
inspect.mjs ------> browser engine (playwright-core or CDP)
  |                  one page, many viewports, facts collected once per width
  |                  layout, typography, visual, motion, a11y, perf, copy, assets
  v
verify.mjs -------> rounds, waivers, state, screenshots, reports
  |
  v
PASS / FAIL / OPEN / SETUP / ERROR / DONE
```

## Design constraints

- **Clean room.** No code, prose, asset names or naming conventions are copied
  from another design-skill project. The clean-room name rule is enforced by
  `scripts/lint-name.mjs`, which assembles the prohibited token at runtime.
- **Local first.** Fonts may come from Google Fonts because a page needs to show
  its real typefaces, but images, icons, diagrams and mock data are local files
  with declared provenance.
- **One visual system.** Palette, type, spacing, radius and motion are tokens.
  Components consume tokens; sections compose components. A page does not invent
  a second button or a second accent.
- **Evidence over opinion.** Audits run in Chrome. A rule that cannot be
  observed in the DOM, computed styles, resources or screenshots is not a rule.
- **Progressive disclosure.** `SKILL.md` is the operating loop. `rules/` is the
  detailed standard. `references/` holds compact decision tables. Only load what
  the current step needs.

## Entry points

| Entry point | Responsibility |
| --- | --- |
| `SKILL.md` | Agent operating loop, hard stops, output contract, commands. |
| `rules/00-house-rules.md` ... `90-verification.md` | The design and engineering standard, in load order. |
| `references/*.md` | Niche matrix, copy bank, asset rules, gate state machine, framework notes, troubleshooting. |
| `scripts/assign.mjs` | Deterministic direction assignment with optional history. |
| `scripts/scaffold.mjs` | Runnable project from the starter system for seven stacks. |
| `scripts/assets.mjs` | Manifest verification, icon listing, photo selection, credits page. |
| `scripts/serve.mjs` | Static server and target resolution used by all browser runs. |
| `scripts/inspect.mjs` | Browser orchestration and audit fan-out. |
| `scripts/capture.mjs` | Screenshot capture without findings. |
| `scripts/verify.mjs` | Stateful finish gate: rounds, waivers, report artefacts. |
| `scripts/report.mjs` | Re-render an existing run as Markdown or HTML. |
| `scripts/doctor.mjs` | Environment and installation health. |
| `scripts/lint-name.mjs` | Clean-room name compliance. |

## Distribution

The installable skill lives at `skills/frontend-design-skills/`. The Skills CLI
walks the `skills/` container up to three levels, so a single repository can
publish `npx skills add rafidone/frontend-design-skills --skill
frontend-design-skills`. `.claude-plugin/marketplace.json` and
`.claude-plugin/plugin.json` expose the same skill tree to the Claude Code
plugin marketplace. `install.sh` remains the dependency-free fallback for local
copies, symlinked development installs, and remote installation through the
Skills CLI.

## State and artefacts

A build owns one state directory, by default `<target>/.frontend-design-skills/`.
It contains:

```text
.frontend-design-skills/
  art-direction.json       locked palette, type pair, hero, heroLayout, composition, niche
  gate.json                round number, previous result, waiver use
  waivers.json             optional documented exceptions
  runs/
    20261112-120651/
      report.json          machine-readable run
      report.html          reviewable report with screenshots
      report.md            pull-request friendly summary
      first-screen-1440.png
      full-page-1440.png
      section-01-1440.png
      ...
```

`art-direction.json` is the lock. `verify.mjs --start` writes the baseline before
any page code exists; later runs compare findings against that baseline so a
round has a clear delta. `gate.json` is updated after every run.

## The inspection context

`inspect.mjs` opens one browser, then for each viewport:

1. navigates to the target and waits for fonts plus a stable layout;
2. installs a small performance and error collector before page scripts run;
3. calls `collectFacts()` from `scripts/lib/dom.mjs` once;
4. passes the same facts object to all eight audits;
5. closes the page and continues with the next width.

`collectFacts()` is intentionally observational. It returns sections, the hero,
headings, text blocks, interactives, images, visual candidates, fixed elements,
overflow candidates, resources, font loading state, scroll-snap declarations,
anchors, landmarks, the document metadata and runtime errors. Audits do not
re-query the page unless they need an interaction that must be isolated (focus
visibility, hover rules, reduced-motion behaviour). This keeps runs fast and
prevents one audit from changing what another audit sees.

Each audit exports:

```js
export const id = 'layout';
export const label = 'Layout';
export async function audit(ctx) {
  // ctx: { page, facts, width, height, niche, options }
  // returns an array of finding() objects
}
```

Audit modules are registered in `scripts/inspect.mjs` (`AUDITS`). Adding a rule
means adding it to `scripts/lib/rules.mjs`, implementing it in one audit, and
adding a fixture or unit assertion that proves it fires. See
`docs/authoring-rules.md`.

## Rule model

Findings have a stable shape:

```json
{
  "rule": "COL-01",
  "severity": "FAIL",
  "message": "Text contrast is 3.1:1.",
  "selector": "p.lede",
  "detail": "A sentence of copy",
  "fix": "Darken the ink token.",
  "where": "390x844",
  "evidence": null
}
```

Findings are merged across viewports by
`rule + selector + message`, with every viewport retained in `whereAll`. FAIL is
blocking, WARN is reviewable, INFO is context. A waiver changes one matching
finding to WAIVED and records the reason.

The structural rules `LAY-01`, `LAY-04`, `A11Y-03`, `COL-01` and `SYS-04` cannot
be waived. They represent a broken composition, a broken page, a broken reading
order, unreadable text or a runtime failure. A waiver needs a specific target and
a reason of at least twelve characters, and it is consumed once. The default cap
is five waivers per build.

## Browser engines

The browser adapter in `scripts/lib/browser.mjs` prefers `playwright-core` when
it can be resolved. `scripts/lib/playwright-engine.mjs` maps the same page
operations onto Playwright. When Playwright is unavailable,
`scripts/lib/cdp-engine.mjs` launches a local Chrome/Chromium with a temporary
profile and drives it over the DevTools Protocol using Node 22's global
`WebSocket` and `fetch`. No package installation is required.

The CDP launcher parses the `DevTools listening on ws://...` line from stderr
instead of relying on `DevToolsActivePort`; this is what makes the snap build of
Chromium work on Ubuntu. Both engines expose navigation, evaluation,
screenshots, keyboard/mouse input, viewport emulation, media emulation and
resource collection.

If neither engine can start, the run ends as `SETUP`, not as a design failure.
The report says what is missing and `doctor.mjs` gives the exact Chrome path
search order.

## Assets

`assets/` is a library, not a dumping ground:

- `palettes/palettes.json` - 24 palettes with light/dark mode, niche tags,
  contrast pairs, notes and an explicit "avoid" line.
- `typography/type-pairs.json` - 24 display/text/mono pairings with Google Fonts
  URLs and fallbacks.
- `starter/` - the reference HTML/CSS/JS system: tokens, base, layout, components,
  motion, forms, and a complete page. Media-hero rules turn a `film`, `photo` or
  `collage` archetype into a full-bleed photograph with a scrim and local tokens.
- `heroes/`, `sections/`, `fragments/` - structural patterns and realistic UI
  snippets.
- `diagrams/`, `icons/`, `mock-data/` - local SVG and JSON.
- `photos/` - six local WebP files with a manifest containing dimensions, SHA-256,
  author, licence and source.

`scaffold.mjs` copies only what a build needs: the visual system, local icons,
diagrams, mock data and one photograph selected by niche. When the assigned
hero layout is `media`, the photograph is also injected into the hero and the
direction lock records both `hero` and `heroLayout`. `assets.mjs verify`
checks every field, file, byte count, checksum and dimension. `assets.mjs photos
credits` writes the single credits page. A build that uses a library photograph
must ship credits; the asset audit enforces the ledger, not a visual credit line
on every image.

## Framework adapters

The static HTML adapter is the reference implementation. React, Next, Vue,
Svelte, Astro and Tailwind adapters render the same page content against the same
token and component sheets:

- `styles/tokens.css` and the component sheets are copied, not reimplemented;
- the page body is a local trusted module, so no runtime Markdown or HTML
  injection is introduced;
- each adapter writes a runnable project (`package.json`, config, entry module)
  and a README with the exact command;
- framework-specific rules stay in an adapter stylesheet so the visual system
  remains single-source.

The inspector does not care which framework produced the DOM. It checks the
painted result.

## Security and failure handling

- The static server is read-only, rejects methods other than GET/HEAD, rejects
  traversal outside its root and sends `x-content-type-options: nosniff`.
- Reports escape finding text in HTML.
- User-provided names and descriptions are escaped before they enter generated
  HTML.
- CDP runs with a temporary profile and `--no-sandbox` only because the skill is
  designed for containers and CI. Use a normal browser profile for interactive
  work.
- A browser crash, navigation timeout or audit exception becomes `SETUP`/`ERROR`
  with the actual message. The gate never reports PASS when evidence is missing.

## Extending the system

1. Add the rule ID and title to `scripts/lib/rules.mjs`.
2. Add the check to an audit module and register nothing new if the module already
   exists.
3. Add the rule to `rules/` and, if it changes the workflow, to the relevant
   reference.
4. Add a fixture case or unit assertion.
5. Run `npm run lint:name`, `npm test`, `npm run test:e2e` and a full verify on
   the starter.

The architecture is deliberately boring: plain Node, plain CSS, real HTML, one
browser and one source of truth.
