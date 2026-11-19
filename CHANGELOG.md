# Changelog

All notable changes to `frontend-design-skills` are recorded here. The format
follows Keep a Changelog and the project uses semantic versioning.

## [Unreleased]

### Added

- Remote and project-level installation verified through both `install.sh` and
  the Skills CLI (`npx skills add`), with standalone doctor checks on the
  installed copy.

### Changed

- Rebuilt all six reference builds as distinct art-directed systems: a release
  control surface, patch review room, projected-title gaming frame, product
  monograph, house monograph and practice register.
- Refined typographic scale and editorial rhythm across the builds: enlarged
  display ceilings, tighter leading and tracking, square edges and wider
  hairline-framed gutters while keeping the 320px layout gate intact.
- Recaptured all six 1440x900 previews and refreshed the README showcase.
- Upgraded CI actions to Node 24 based majors to remove runner deprecation
  warnings.
- Corrected the documented photograph count, stale direction labels, release
  and editor-hygiene guidance, and removed trailing whitespace from generated
  diagram templates.
- Rewrote the art-direction rule to describe the shipped SHA-256 assignment
  algorithm and nine assignable niches, and mapped the conceptual gate states to
  the six terminal states emitted by `verify.mjs`.
- Aligned asset-class, icon-stroke and banned-font guidance with the shipped
  manifests, SVGs and type-pair library; documented Anton, Playfair Display and
  Cormorant Garamond as niche-scoped display exceptions.

### Fixed

- Documentation now matches the shipped example fonts and counts, and the
  release guide no longer claims a version field that the skill front matter
  does not carry.
- Removed false and unused photo provenance from the `saas-product` and
  `devtool-diff` examples (photo, manifest and credit rows); their credits pages
  now state that no external photography is used.
- Scaffolded projects now generate `credits.html` when a library photograph is
  copied, keep gate reports in version control and use correct project-relative
  run instructions.
- Removed stale scaffold direction claims from all six per-example READMEs and
  V5 markers from two token files; dropped an ineffective inline `defer`.
- Corrected cross-directory rule references, a duplicate GATE-02 ID, nonexistent
  Playwright commands and `/tmp` report paths that did not match the generated
  artifacts.
- Removed six unreferenced legacy font files.

## [1.0.0] - 2026-11-12

### Added

- OpenCode skill orchestration with a nine-step run loop and hard stops.
- Ten rule documents and nine reference documents covering art direction,
  layout, typography, colour, assets, motion, copy, accessibility, performance,
  framework integration and verification.
- 24 palette definitions and 24 Google Fonts pairings.
- Responsive starter system with tokens, layout, components, motion and forms.
- Ten hero archetypes and reusable marketing sections, including full-bleed
  media heroes for `film`, `photo` and `collage` directions with a local
  photograph, contrast-safe scrim and responsive WebP variants.
- Fourteen realistic UI fragments, four diagram patterns, a UI icon set, a brand
  icon set and six realistic mock-data sets.
- Asset pipeline for photos and icons with manifest verification and credits.
- Deterministic art-direction assignment with history.
- Playwright-first browser inspection engine with a zero-dependency Chrome
  DevTools Protocol fallback.
- Layout, visual, typography, motion, accessibility, performance, copy and asset
  audits.
- Stateful finish gate with quick/full modes, rounds, waivers and reports.
- Good and bad browser fixtures, unit tests and end-to-end tests.
- Six complete example builds and author/release documentation.

### Changed

- Renamed the repository and installable skill to `frontend-design-skills`.
- Moved the installable skill to `skills/frontend-design-skills/` for standard
  Skills CLI discovery with `npx skills add`.
- Added `.claude-plugin/marketplace.json` and `.claude-plugin/plugin.json` for
  Claude Code plugin-marketplace installation.
- Added remote installation and skill listing to `install.sh`.
- Rebuilt the root README with installation, architecture, niche matrix, gate,
  and example-preview sections.
