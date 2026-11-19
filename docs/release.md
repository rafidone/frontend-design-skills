# Release notes

This repository is a skill and a toolchain, not a hosted service. A release is a
tagged tree that passes its own gate on a clean machine.

## Versioning

Use semantic versioning for the repository:

- **MAJOR** - the install layout or CLI contract changes, or an existing rule
  becomes structural in a way that breaks an unchanged page.
- **MINOR** - new rules, audit modules, palettes, type pairings, fragments,
  examples or stack adapters.
- **PATCH** - false-positive fixes, copy edits, dependency-free helper fixes and
  documentation corrections that do not change the contract.

`CHANGELOG.md` is the release record; every entry says what changed and what a
user must do. Version numbers live in `package.json` and
`.claude-plugin/plugin.json`; keep those two in sync when releasing.

## Supported environment

- Node 22 or newer.
- Chrome or Chromium available locally. On Ubuntu the snap build is supported;
  the CDP engine parses the DevTools WebSocket line from stderr because the snap
  does not write `DevToolsActivePort`.
- `playwright-core` is optional. If present, the Playwright engine is preferred.
- `ffmpeg` is optional and only improves image statistics and WebP encoding.
- Linux is the primary target. macOS and Windows paths are included in the
  Chrome search order and the scripts avoid shell-specific behaviour, but the
  release gate is exercised on Ubuntu.

## Release procedure

1. **Start from a clean tree.**

   ```bash
   git status --short
   ```

   Do not release with uncommitted changes. Generated run directories and
   screenshots belong in `.gitignore`, not in the release commit.

2. **Run the full local gate.**

   ```bash
   npm run lint:name
   npm test
   npm run test:e2e
   npm run doctor
   node skills/frontend-design-skills/scripts/verify.mjs \
     skills/frontend-design-skills/assets/starter \
     --full --kind service --no-shots --state /tmp/fdm-release-starter
   ```

   Expected: linter PASS, all unit tests pass, E2E PASS, doctor reports Chrome
   available, and the starter reports `GATE: PASS`.

3. **Verify every example.**

   ```bash
   for example in examples/*/; do
     node skills/frontend-design-skills/scripts/verify.mjs "$example" \
       --full --no-shots --state "/tmp/fdm-release-$(basename "$example")"
   done
   ```

   An example may ship with a documented, non-blocking warning. It may not ship
   with a FAIL, a missing asset, an unresolved credit or a console error.

4. **Check the asset ledger.**

   ```bash
   node skills/frontend-design-skills/scripts/assets.mjs verify
   node skills/frontend-design-skills/scripts/assets.mjs photos credits --out /tmp/credits.html
   ```

   Every photo needs a checksum, dimensions, author, licence and source. A file
   added to the folder without a manifest row is not a library asset.

5. **Review the reports.**

   Open the newest `report.html` under the starter and each example. Check that:

   - the gate status and count are plausible;
   - every FAIL has a selector, a fix and a viewport;
   - screenshots show real content, not blank frames;
   - waivers, if any, say why and point to a specific target;
   - the credits page lists every library photograph used.

6. **Update the changelog.**

   Add a dated section with `Added`, `Changed`, `Fixed` and `Removed` headings as
   needed. Call out:

   - new rules and their severity;
   - any rule promoted to structural;
   - CLI flag changes;
   - asset or palette replacements;
   - minimum Node or Chrome changes.

7. **Tag and publish.**

   ```bash
   git add -A
   git commit -m "release: vX.Y.Z"
   git tag -a vX.Y.Z -m "frontend-design-skills vX.Y.Z"
   git push origin "$(git branch --show-current)" --follow-tags
   ```

   The CI workflow runs the linter, unit tests, doctor, browser E2E and the
   reference example. Do not publish a tag that CI has not passed.

## CI expectations

`.github/workflows/ci.yml` runs on Node 22 with a stable Chrome installed by the
workflow:

- clean-room name linter;
- unit tests;
- environment doctor;
- browser end-to-end fixtures;
- full gate on `examples/saas-product` at quick scope.

The workflow has no npm install step because the runtime has no package
dependencies. If a future change adds a dependency, add a lockfile and use
`npm ci`; do not silently rely on whatever is preinstalled.

## What is not a release blocker

- A screenshot difference caused by a different Chrome version.
- A platform-specific font fallback when the declared family fails to load and
  the page reports `TYP-03`.
- An optional `ffmpeg` warning.
- A `PERF-03` warning for a framework adapter that legitimately needs more than
  one stylesheet, provided the page still meets the transfer budget.

## What is a release blocker

- Any structural FAIL: `LAY-01`, `LAY-04`, `A11Y-03`, `COL-01`, `SYS-04`.
- A fixture that stops triggering a required rule.
- A missing checksum or licence row.
- A report that cannot render.
- A prohibited term in any filename, path, config, fixture, document or source
  file.
- `doctor.mjs` failing on the release machine.
- A test that depends on network access, a user home directory or an
  interactive browser profile.

## Rollback

The skill is stateless outside a build's `.frontend-design-skills/` directory.
To roll back a bad release:

1. Reinstall the previous tag with `./install.sh --project` (or `--global`).
2. Delete the affected build's `.frontend-design-skills/` only if its state was
   written by the bad version; keep the build files.
3. Re-run `verify.mjs --new` to start a fresh gate.
4. Record the incident and the false positive or missing rule in the changelog.

Never "fix" a failed gate by deleting its report without recording the reason.
The report is the only evidence that the page was reviewed.

## Post-release check

Install into a scratch project and run the quick start exactly as a user would:

```bash
mkdir -p /tmp/fdm-smoke && cd /tmp/fdm-smoke
/path/to/frontend-design-skills/install.sh --project
node .opencode/skills/frontend-design-skills/scripts/doctor.mjs
node .opencode/skills/frontend-design-skills/scripts/scaffold.mjs \
  --stack html --dir ./site --niche service --name "Release Check"
node .opencode/skills/frontend-design-skills/scripts/verify.mjs ./site \
  --quick --kind service --no-shots --state /tmp/fdm-smoke/state
```

Expected: the installer copies the skill, the doctor finds Chrome, the scaffold
writes a runnable page and the gate passes. If any step needs a path that only
exists in the development tree, the release is not ready.

Also verify the public install surface before announcing the release:

```bash
# The Skills CLI must discover exactly one skill named frontend-design-skills.
npx skills add rafidone/frontend-design-skills --list

# The plugin marketplace manifest must validate.
claude plugin validate .
```

The repository must expose `skills/frontend-design-skills/SKILL.md` and keep
`.claude-plugin/marketplace.json` in sync with `.claude-plugin/plugin.json`.
