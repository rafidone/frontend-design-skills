<div align="center">

# Frontend Design Skills

### Studio-grade frontend builds, verified in a real browser.

**One art direction. One visual system. Real assets. Real copy. Evidence from Chrome.**
No page ships until the gate says `GATE: PASS`.

[![Skills CLI](https://img.shields.io/badge/Skills_CLI-npx_skills_add-000000?style=for-the-badge&logo=vercel)](https://skills.sh)
[![Browser Gate](https://img.shields.io/badge/Browser_Gate-PASS-16a34a?style=for-the-badge)](#the-finish-gate)
[![Node](https://img.shields.io/badge/Node-%E2%89%A522-339933?style=for-the-badge&logo=node.js&logoColor=white)](package.json)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Production--ready-0ea5e9?style=for-the-badge)](#)
[![Agents](https://img.shields.io/badge/Agents-75%2B-6b7280?style=for-the-badge)](#compatibility)
[![GitHub stars](https://img.shields.io/github/stars/rafidone/frontend-design-skills?style=for-the-badge&logo=github&labelColor=000000)](https://github.com/rafidone/frontend-design-skills)

[Overview](#overview) · [Quick start](#quick-start) · [Architecture](#architecture) · [Niche matrix](#niche-matrix) · [Finish gate](#the-finish-gate) · [Examples](#six-reference-builds)

</div>

---

## Overview

**Frontend Design Skills is a production workflow for coding agents that turns a brief into a real, art-directed website — and refuses to call it finished until a real browser proves it works.**

Most AI-generated UI fails in the same four ways: generic template layouts, an uncommitted visual direction, fake or missing assets, and no evidence that the result actually works. This skill fixes that with a locked art direction, niche-specific design systems, real local assets, honest copy, and a mandatory `GATE: PASS` finish gate across seven viewports.

It is not a component library or a prompt pack. It is the operating system for one build: classify the business, assign a direction, scaffold the visual system, inspect the result in Chrome, fix what fails, and ship a report you can defend in a client review.

## Quick start

```bash
npx skills add rafidone/frontend-design-skills --skill frontend-design-skills
```

That single command detects your coding agent and installs the skill. Then ask for a build:

> "Build a booking page for a six-room boutique hotel in Lisbon."

The skill activates for landing pages, marketing sites, SaaS and product pages, dashboards, portfolios, storefronts, game and hardware sites, hospitality and professional-service sites, and any existing UI that looks generic or unfinished.

<details>
<summary><strong>More install options (global, agent-specific, plugin marketplace, local checkout)</strong></summary>

<br />

| Method | Command |
| --- | --- |
| **Global install** | `npx skills add rafidone/frontend-design-skills --skill frontend-design-skills -g` |
| **Specific agent** | `npx skills add rafidone/frontend-design-skills --skill frontend-design-skills -a opencode` |
| **All detected agents** | `npx skills add rafidone/frontend-design-skills --skill frontend-design-skills --agent '*'` |
| **List available skills** | `npx skills add rafidone/frontend-design-skills --list` |

### Claude Code plugin marketplace

```text
/plugin marketplace add rafidone/frontend-design-skills
/plugin install frontend-design-skills@frontend-design-skills
```

### Local checkout

```bash
git clone https://github.com/rafidone/frontend-design-skills.git
cd frontend-design-skills

./install.sh --project                 # copy into the current project
./install.sh --global                  # install for the current user
./install.sh --link --project /path    # symlink while developing
```

The local installer copies `skills/frontend-design-skills/` to
`.opencode/skills/frontend-design-skills/` and runs the environment doctor.
In OpenCode, invoke the skill as `@frontend-design-skills`.

</details>

### Requirements

| Requirement | Why |
| --- | --- |
| **Node 22+** | The scaffold, asset, server, audit, and gate tooling. |
| **Chrome or Chromium** | Real-browser inspection. Playwright is optional; the zero-dependency CDP engine is the fallback. |
| **`python3`** | Optional, for the generated static preview command. The skill's own server is Node. |
| **`ffmpeg`** | Optional, for image statistics and WebP encoding. |

```bash
npm run doctor
```

---

## Architecture

```text
 brief
   │
   ▼
 classify ──► assign.mjs ──► palettes · type pairs · heroes · composition
   │
   ▼
 scaffold.mjs ──► tokens · components · local assets · 7 framework adapters
   │
   ▼
 build ──► real copy · local photography · SVG icons · diagrams · mock data
   │
   ▼
 serve.mjs ──► http://127.0.0.1:<port>
   │
   ▼
 inspect.mjs ──► Chrome or Playwright ──► 8 audits × 7 viewports
   │
   ▼
 verify.mjs ──► rounds · waivers · screenshots · report.json/html/md
   │
   ▼
 PASS · PASS WITH WAIVERS · FAIL n · OPEN n · SETUP · ERROR · DONE
```

| Layer | Responsibility |
| --- | --- |
| `SKILL.md` | The nine-step run loop, hard stops, output contract, and commands. |
| `rules/00–90` | Ten rule documents from house rules to the verification checklist. |
| `references/` | Nine decision references: niche matrix, copy, assets, gates, frameworks, troubleshooting. |
| `assets/` | 24 palettes, 24 type pairings, 10 heroes, 7 sections, 14 UI fragments, 4 diagrams, 66 icons, 7 photographs, 6 mock-data sets. |
| `scripts/` | Assignment, scaffolding, asset checks, serving, browser inspection, eight audit modules, capture, verification, and reporting. |
| `examples/` | Six complete, gate-verified reference builds. |
| `tests/` | Unit tests for the pure machinery plus a real-browser end-to-end run. |

### Deterministic by design

The direction is assigned from the niche and a seed, not sampled from a model's mood:

```bash
node skills/frontend-design-skills/scripts/assign.mjs \
  --niche software --seed studio-01 --json
```

The result locks a palette, type pair, hero archetype, rendered hero layout, motion
tier, density, and composition. The lock is written to
`.frontend-design-skills/art-direction.json` and is treated as immutable for the run.
A second palette, a second type system, or a second button is a defect, not a choice.

### Seven framework adapters

The static HTML build is the reference implementation. The same tokens, container,
and component vocabulary render for:

`html` · `react` · `next` · `vue` · `svelte` · `astro` · `tailwind`

The checker does not care which framework rendered the DOM. It cares what Chrome
paints.

---

## Niche matrix

Each row is an operational system: first viewport, page shape, palette, type, proof,
motion ceiling, and the mistakes that break the row. The full matrix lives in
[`references/niche-matrix.md`](skills/frontend-design-skills/references/niche-matrix.md).

| Niche | Visitor is deciding… | First viewport must show | Proof signal | Motion |
| --- | --- | --- | --- | --- |
| **SaaS / devtool** | Whether the tool does the job | Real product UI in a real state, category, outcome, primary action | Live-looking UI, benchmark with method, status page | T1 |
| **AI** | Whether the model can perform the task | A real input/output pair or working demo, constraints named | Reproducible examples, evaluation, latency, human review | T1 (T2 with a real demo) |
| **Gaming** | Whether to play or wishlist | One dominant key-art or in-engine frame, release window, platforms | In-engine footage, platform listing, studio credits | T2 |
| **Hardware** | Whether the object is right | Product photograph at a believable angle, defining property, spec link | Measured specs, materials, test conditions, certification | T1 (T2 for real 3D) |
| **Commerce** | Whether to buy this item | Product isolated with price, variants, delivery estimate, returns | Real inventory, delivery window, verified reviews | T1 |
| **Hospitality** | Whether to stay or book | Real place, room, or table photograph; booking path; location | Current photography, address, hours, menu, policies | T1 |
| **Service** | Whether to hire this provider | Promise tied to a service and place; real person or work; hours | Licence, insurance, years, named result, response time | T0 / T1 |
| **Editorial** | Whether to read or subscribe | Masthead, lead story, byline, date, real image or chart | Sources, issue number, corrections policy, real photography | T0 / T1 |

### The four direction locks

| Lock | What it prevents |
| --- | --- |
| **Palette** | Two competing accents, default tech blue, violet/lavender drift. |
| **Typography** | Display type that fails to load, body copy below 16px, measures over 62 characters. |
| **Composition** | Generic three-card grids, heroes that do not own the first screen, sections between 1.16H and 1.84H. |
| **Assets** | Empty boxes, grey placeholders, stock gradients, fake dashboards, icon CDNs. |

---

## The finish gate

`verify.mjs` opens the page in a real browser, collects facts once per viewport, and
runs **eight audits** across **42 rule IDs**:

| Audit | Rule family | What it proves |
| --- | --- | --- |
| **Layout** | `LAY-01…06` | Hero ownership, section budget, equal edges, overflow, reading order. |
| **Typography** | `TYP-01…05` | Body size, measure, hierarchy, font loading, orphaned display type. |
| **Color** | `COL-01…03` | Contrast, single accent, system consistency. |
| **Visual** | `VIS-01…03` | Real visuals, no empty boxes, no captions-as-design. |
| **Motion** | `MOT-01…03` | Reduced-motion safety, scroll behaviour, WebGL budget. |
| **Accessibility** | `A11Y-01…06` | Focus visibility, landmarks, names, contrast, keyboard paths. |
| **Performance** | `PERF-01…03` | LCP, layout shift, request and stylesheet budget. |
| **Copy & assets** | `COP-01…04`, `AST-01…03`, `SYS-01…04`, `NICHE-01…02` | Honest claims, working assets, one system, niche fit. |

```bash
# Full gate against a built page
node skills/frontend-design-skills/scripts/verify.mjs ./site \
  --full --kind software --category "release planning" --primary "book a demo"

# Quick desktop pass while iterating
node skills/frontend-design-skills/scripts/verify.mjs ./site --quick

# Re-render a previous run
node skills/frontend-design-skills/scripts/report.mjs \
  --run ./site/.frontend-design-skills/runs/<timestamp>
```

### Gate states

| State | Meaning | Deliver? |
| --- | --- | --- |
| `GATE: PASS` | No blocking findings, no open items. | **Yes** |
| `GATE: PASS` with waivers | All findings pass or are documented false positives (≤5). | **Yes** |
| `GATE: FAIL n` | `n` blocking findings remain. | No |
| `GATE: OPEN n` | Findings remain at the round cap. | No |
| `GATE: SETUP` | The page could not be served or inspected. | No |
| `GATE: ERROR` | An audit crashed. | No |
| `GATE: DONE` | The run was explicitly closed with `--done`. | Review |

### Evidence, not opinion

- Every finding records a rule ID, selector, viewport, observed value, and fix.
- The run writes `report.json`, `report.html`, `report.md`, and screenshots under
  `.frontend-design-skills/runs/<timestamp>/`.
- `PASS` without evidence is downgraded to `OPEN`.
- Structural failures cannot be waived: `LAY-01`, `LAY-04`, `A11Y-03`, `COL-01`,
  `SYS-04`.
- Waivers need a target, a reason of at least twelve characters, and a documented
  false positive. The default cap is three rounds and five waivers.
- The checker scripts are never edited to make a page pass.

---

## Six reference builds

Each example is a standalone static build with its own direction lock, local assets,
and gate report. The typography is tuned per build — enlarged display ceilings,
tighter leading and tracking, square edges, and wide hairline-framed gutters — so
each first screen reads as a distinct editorial system rather than a template.
Every preview below is a freshly captured 1440×900 first screen from the live build.

<table>
  <tbody>
    <tr>
      <td width="620" valign="top">
        <a href="examples/saas-product/"><img src="docs/previews/saas-product/first-screen-1440.png" width="620" alt="Northline release control surface with a narrow headline above a three-column command grid: workspace rail, live issue board and selected-issue inspector on a near-black field" /></a>
      </td>
      <td valign="top">
        <a href="examples/saas-product/"><strong>saas-product</strong></a><br />
        <em>Software · geist / geist-mono</em><br /><br />
        A Linear/Vercel-grade operating console: the h1 sits in a narrow band above a full-width masthead and a 3/6/3 grid — workspace rail, live issue board, and an inspector with a decision trail and two measured metrics. Brightness and density carry emphasis, with no chromatic accent.
      </td>
    </tr>
    <tr>
      <td width="620" valign="top">
        <a href="examples/devtool-diff/"><img src="docs/previews/devtool-diff/first-screen-1440.png" width="620" alt="Kestrel patch review room with file tabs, a changed-file tree, a line-numbered unified diff with muted token colors, a two-comment review inspector and a bottom status bar" /></a>
      </td>
      <td valign="top">
        <a href="examples/devtool-diff/"><strong>devtool-diff</strong></a><br />
        <em>Developer tool · geist / ibm-plex-mono</em><br /><br />
        A real pull request, not a marketing editor: a tab bar, 2/12 changed-file tree, 7/12 unified diff with muted sage, sand and steel tokens, a 3/12 review-thread rail, and a full-width status bar. The command palette lives in method, never the hero.
      </td>
    </tr>
    <tr>
      <td width="620" valign="top">
        <a href="examples/gaming-ironwood/"><img src="docs/previews/gaming-ironwood/first-screen-1440.png" width="620" alt="Ironwood projected title frame with a hard-clipped forest photograph, an oversized Anton title cropped at the lower-left edge on a solid scrim, a rotated amber press stamp and a vertical season index" /></a>
      </td>
      <td valign="top">
        <a href="examples/gaming-ironwood/"><strong>gaming-ironwood</strong></a><br />
        <em>Gaming · anton-archivo / ibm-plex-mono</em><br /><br />
        A cinematic title sequence: the forest key art is clipped to an angular frame, an Anton title is cropped by the viewport on a solid black scrim, one rotated 1px amber press stamp sits upper-right, and a four-season index runs down the right edge. One voltage, no glow or poster cards.
      </td>
    </tr>
    <tr>
      <td width="620" valign="top">
        <a href="examples/hardware-macro/"><img src="docs/previews/hardware-macro/first-screen-1440.png" width="620" alt="Lattice product monograph with a four-column type field beside a tall hard-cropped circuit photograph, a four-row ruled specification strip and numbered leader-line callouts" /></a>
      </td>
      <td valign="top">
        <a href="examples/hardware-macro/"><strong>hardware-macro</strong></a><br />
        <em>Hardware · archivo / ibm-plex-mono</em><br /><br />
        Apple restraint crossed with a Swiss instrument catalogue: a 4/8 monograph, a tall hard-cropped macro photograph inside a 1px rule, a four-row spec strip directly beneath it, and numbered leader-line callouts. No plinth, shadow, cards or coordinate rails.
      </td>
    </tr>
    <tr>
      <td width="620" valign="top">
        <a href="examples/cafe-atelier/"><img src="docs/previews/cafe-atelier/first-screen-1440.png" width="620" alt="Atelier Nine house monograph with a vertical metadata rail, an oversized Playfair headline with a clay drop cap, a tall portrait photograph and a thin landscape band lower in the hero" /></a>
      </td>
      <td valign="top">
        <a href="examples/cafe-atelier/"><strong>cafe-atelier</strong></a><br />
        <em>Hospitality · playfair-display / karla</em><br /><br />
        One coffee house's own house style: a 2/6/4 masthead with a vertical metadata rail, an oversized Playfair headline with a real clay drop cap, a tall portrait, and a thin landscape band lower in the hero. The menu is a two-page booklet; the tasting ledger and correspondence are ruled.
      </td>
    </tr>
    <tr>
      <td width="620" valign="top">
        <a href="examples/service-clinic/"><img src="docs/previews/service-clinic/first-screen-1440.png" width="620" alt="Linden Clinic practice register with a 1px letterhead rule, a large Newsreader headline on paper, a hard-framed waiting-room photograph and a mono caption strip" /></a>
      </td>
      <td valign="top">
        <a href="examples/service-clinic/"><strong>service-clinic</strong></a><br />
        <em>Professional service · newsreader-dm / ibm-plex-mono</em><br /><br />
        A practice's official register: a 1px letterhead rule replaces the dark band, and a 6/empty/5 hero sets a fluid 80–124px Newsreader headline on paper beside a hard-framed photograph with a mono caption. Ruled appointment schedule, practice index and fee schedule follow. No dark masthead, no cards.
      </td>
    </tr>
  </tbody>
</table>

Run any example locally:

```bash
python3 -m http.server 4173 --directory examples/cafe-atelier
# open http://127.0.0.1:4173

# Or use the skill's own pipeline
npm run inspect -- examples/cafe-atelier --full --niche hospitality
npm run verify -- examples/cafe-atelier --full --kind hospitality
```

The recurring warning is the shared six-stylesheet first paint (`PERF-03`). Gaming also
records the known `NICHE-01` notice because the checker looks for canvas rather than the
shipped photographic key art, and clinic may show responsive asset/prose notices. Any
`FAIL` is called out in the run report and should be reviewed before shipping.

---

## What is in the box

| Asset | Count | Purpose |
| --- | ---: | --- |
| Validated palettes | 24 | Contrast-checked color systems with one accent. |
| Type pairings | 24 | Display and text pairs with real font loading. |
| Hero archetypes | 10 | Split, full-bleed media, editorial, statement, product, and more. |
| Section patterns | 7 | Proof, features, pricing, split feature, FAQ, CTA, footer. |
| UI fragments | 14 | Analytics, billing, calendar, chat, command palette, diff, invoice, kanban, map, media, notifications, search, settings, table. |
| Diagram patterns | 4 | Architecture, tool hub, pipeline, sequence. |
| Icons | 66 | 50 UI icons and 16 brand icons, all local SVG with a manifest. |
| Photographs | 7 | Local WebP with dimensions, SHA-256, author, licence, and source. |
| Mock-data sets | 6 | Cities, companies, metrics, people, products, schedule. |
| Rule documents | 10 | The design and engineering standard, in load order. |
| References | 9 | Compact decision tables for the whole run. |

### Commands

All commands are relative to the skill directory unless a target is given.

| Command | Purpose |
| --- | --- |
| `doctor.mjs` | Check Node, Chrome, Playwright, ffmpeg, and skill assets. |
| `lint-name.mjs` | Enforce the clean-room name rule across the repository. |
| `assign.mjs` | Deterministically assign palette, type pair, hero, and composition. |
| `scaffold.mjs` | Generate HTML, React, Next, Vue, Svelte, Astro, or Tailwind. |
| `assets.mjs` | Verify manifests, list icons, fetch photos, and write credits. |
| `serve.mjs` | Start a local static server for inspection. |
| `inspect.mjs` | Run the eight browser audits at selected viewports. |
| `capture.mjs` | Capture full-page screenshots at every viewport. |
| `verify.mjs` | Run the stateful finish gate with rounds and waivers. |
| `report.mjs` | Re-render a run as Markdown or HTML. |

```bash
node skills/frontend-design-skills/scripts/assets.mjs verify
node skills/frontend-design-skills/scripts/assets.mjs photos list --query cafe
npm run inspect -- examples/cafe-atelier --quick --niche hospitality
npm run capture -- examples/cafe-atelier --out /tmp/shots
```

---

## Compatibility

| Surface | Support |
| --- | --- |
| **Agents** | OpenCode, Claude Code, Codex, Cursor, and 75+ agents supported by the Skills CLI. |
| **Frameworks** | Plain HTML/CSS/JS, React, Next.js, Vue, Svelte, Astro, Tailwind CSS v4. |
| **Browsers** | Local Chrome or Chromium through `playwright-core` or the zero-dependency CDP engine. |
| **Operating systems** | Linux, macOS, and Windows. |

---

## Quality and clean-room policy

This repository is a clean-room implementation. It does not copy code, prose, asset
names, or naming conventions from any external design-skill project. A prohibited
reference term is never written anywhere in the repository; `lint-name.mjs` assembles
the term at runtime and scans every text file, filename, directory name, and config.
The linter is part of CI and must stay green.

```bash
npm run lint:name   # clean-room name rule
npm test            # 40 pure unit tests
npm run test:e2e    # real-browser fixture run
npm run doctor      # environment and installation health
```

The end-to-end test builds temporary fixtures, serves them, runs the same audits used
by the skill, and asserts that the good fixture passes while the bad fixture produces
the expected rule IDs.

---

## Repository layout

```text
frontend-design-skills/
├── skills/
│   └── frontend-design-skills/        # installable skill (npx skills add)
│       ├── SKILL.md                   # operating loop, hard stops, output contract
│       ├── rules/                     # 00–90 operating rules
│       ├── references/                # niche matrix, copy, assets, gate, frameworks
│       ├── assets/
│       │   ├── palettes/              # 24 validated palettes
│       │   ├── typography/            # 24 validated type pairings
│       │   ├── starter/               # reference HTML/CSS/JS system
│       │   ├── heroes/                # 10 hero archetypes
│       │   ├── sections/              # 7 reusable section patterns
│       │   ├── fragments/             # 14 realistic UI fragments
│       │   ├── diagrams/              # 4 diagram patterns
│       │   ├── icons/                 # UI and brand SVGs plus manifest
│       │   ├── photos/                # local WebP, manifest, credits pipeline
│       │   └── mock-data/             # realistic JSON fixtures
│       └── scripts/                   # assign, scaffold, browser, audits, gate
├── examples/                          # 6 complete, gate-verified builds
├── docs/
│   ├── architecture.md
│   ├── authoring-rules.md
│   ├── release.md
│   └── previews/                      # screenshots captured from the builds
├── tests/
│   ├── unit/
│   ├── e2e/
│   └── fixtures/
├── .claude-plugin/                    # marketplace + plugin manifests
├── install.sh                         # local + remote installer
├── package.json
├── CHANGELOG.md
├── LICENSE
└── README.md
```

---

## Documentation

- [Architecture](docs/architecture.md) — how the skill, audits, and gate fit together.
- [Authoring rules](docs/authoring-rules.md) — how to add rules, assets, and examples.
- [Release guide](docs/release.md) — versioning, verification, and release checks.
- [Examples](examples/README.md) — the six builds and their exact directions.
- [Changelog](CHANGELOG.md) — released capability.

---

## Licence

MIT. See [LICENSE](LICENSE).

<div align="center">

**If a page is not verified, it is not finished.**

`GATE: PASS`

</div>
