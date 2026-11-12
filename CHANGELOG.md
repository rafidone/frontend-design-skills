# Changelog

All notable changes to `frontend-design-skills` are recorded here. The format
follows Keep a Changelog and the project uses semantic versioning.

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
