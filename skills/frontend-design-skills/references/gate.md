# Gate Reference

The gate is a state machine that aggregates rule results into a delivery decision.
It is not a checklist that can be waved through. This reference defines states,
transitions, rounds, evidence, waivers, and the persisted record.

## 1. States

| State | Meaning | Can deliver? |
|-------|---------|--------------|
| `UNVERIFIED` | No checks have run | No |
| `IN_PROGRESS` | Checks are running or partial | No |
| `BLOCKED` | A hard failure prevents further checks | No |
| `FAILED` | Checks completed with one or more failures | No |
| `PASSED_WITH_WAIVERS` | All checks pass or are waived; ≤5 waivers | Yes |
| `PASSED` | All checks pass; no waivers | Yes |

`OPEN` is a result state for an individual check, not a gate state. A gate with
any `OPEN` result cannot be `PASSED`.

## 2. Transitions

| From | Event | Guard | To |
|------|-------|-------|----|
| `UNVERIFIED` | start quick | build exists | `IN_PROGRESS` |
| `UNVERIFIED` | start full | build, manifest, inventory exist | `IN_PROGRESS` |
| `IN_PROGRESS` | blocker found | — | `BLOCKED` |
| `IN_PROGRESS` | checks complete, failures | — | `FAILED` |
| `IN_PROGRESS` | checks complete, no failures | no open items | `PASSED` |
| `IN_PROGRESS` | checks complete, waivers only | ≤5 approved waivers | `PASSED_WITH_WAIVERS` |
| `IN_PROGRESS` | interrupted | — | `IN_PROGRESS` |
| `BLOCKED` | blocker fixed | rebuild required | `IN_PROGRESS` |
| `FAILED` | fixes applied | affected phases re-run | `IN_PROGRESS` |
| `PASSED` | code or asset change | — | `IN_PROGRESS` |
| `PASSED_WITH_WAIVERS` | waiver expired | — | `FAILED` |
| `PASSED_WITH_WAIVERS` | code or asset change | — | `IN_PROGRESS` |

Rules:

- A state may move backward only through `IN_PROGRESS`; never jump from `FAILED`
  to `PASSED` without re-running.
- `BLOCKED` requires a named owner and a next action.
- A build failure is always `BLOCKED`, not `FAILED`; downstream checks cannot be
  evaluated.
- The gate never returns to `UNVERIFIED` once evidence exists.

## 3. Rounds

| Round | Scope | Allowed state |
|-------|-------|---------------|
| Quick | Desktop viewport, console, overflow, primary action | `IN_PROGRESS`, `FAILED`, `BLOCKED` |
| Full | Every rule, every viewport, a11y, performance, motion, content | Any terminal state |

Each round records:

```json
{
  "round": 2,
  "mode": "full",
  "started": "2026-11-10T09:00:00Z",
  "finished": "2026-11-10T10:12:00Z",
  "build": "sha256:abc123",
  "browser": "Chromium 141",
  "checks": 84,
  "pass": 80,
  "fail": 1,
  "open": 0,
  "waived": 3
}
```

## 4. Evidence

A check result requires evidence appropriate to its type:

| Check type | Evidence |
|------------|----------|
| Static | Command and matching output |
| Measurement | Recorded value and unit |
| Visual | Screenshot path and viewport |
| Interaction | Steps and observed result |
| Accessibility | Tool output plus manual notes |
| Performance | Lighthouse JSON plus extracted metrics |
| Content | Inventory match and claim source |

```json
{
  "id": "PERF-01",
  "result": "PASS",
  "observed": "LCP 1.9s on mobile",
  "evidence": ["/tmp/opencode/fdm-shop/lh-mobile.json"],
  "at": "2026-11-10T09:42:00Z",
  "by": "run"
}
```

Rules:

- `PASS` without evidence is invalid and must be downgraded to `OPEN`.
- Screenshot paths are relative to the report directory.
- Measurements include units and the viewport where they were taken.
- A manual result names the person or run that observed it.
- Evidence is immutable for the round; a fix creates a new round.

## 5. Aggregation

```text
blockers = results where severity == blocker and result == FAIL
major    = results where severity == major and result == FAIL
open     = results where result == OPEN
waived   = results where result == WAIVED

if blockers > 0            -> FAILED
else if open > 0           -> IN_PROGRESS
else if major > 0 and waivers invalid -> FAILED
else if waivers > 5        -> FAILED
else if waived > 0         -> PASSED_WITH_WAIVERS
else                       -> PASSED
```

Hard blockers: HR-06, HR-07, HR-09, HR-10, any A11Y blocker, any broken build,
any fabricated proof, any missing primary content.

## 6. Waivers

A waiver is valid only when it includes:

- Rule ID and scope (route, viewport, component).
- Observed value and evidence.
- Reason the rule cannot be met now.
- Risk and mitigation.
- Owner and approver.
- Expiry date.

Rules:

- Maximum five active waivers.
- Blockers cannot be waived.
- Waivers are per rule and scope; no blanket waivers.
- An expired waiver becomes a failure.
- Removing a waiver requires the fix and a re-run.
- Waivers appear in the final report with their risk.

## 7. Persisted gate record

```json
{
  "slug": "shop",
  "state": "PASSED_WITH_WAIVERS",
  "round": 3,
  "mode": "full",
  "build": "sha256:abc123",
  "viewports": ["1440x900", "820x1180", "768x1024", "390x844", "320x568"],
  "results": [],
  "waivers": [],
  "report": "/tmp/opencode/fdm-shop/REPORT.md",
  "updated": "2026-11-10T10:12:00Z"
}
```

Store the record beside the report. Do not overwrite a prior round; append and
mark the current round.

## 8. Gate inputs

| Input | Required for full | Source |
|-------|-------------------|--------|
| Direction lock | Yes | `10-art-direction.md` |
| Content inventory | Yes | `60-copy-content.md` |
| Asset manifest | Yes | `40-assets-brand.md` |
| Built output | Yes | Build command |
| Served URL | Yes | Static server |
| Viewport screenshots | Yes | Browser checks |
| Accessibility output | Yes | axe or Lighthouse |
| Performance output | Yes | Lighthouse |
| Keyboard notes | Yes | Manual pass |
| Waivers | If any | Written record |

Missing inputs produce `OPEN`, not a pass.

## 9. Gate anti-patterns

- Marking a group `PASS` because no one tested it.
- Treating a successful build as a browser pass.
- Auditing the dev server.
- Reusing screenshots from a previous build.
- Waiving a blocker by relabeling it "minor".
- Closing `OPEN` items without evidence.
- Reporting only the happy path.
- Claiming `PASSED` from quick mode.
- Ignoring console errors because the page "looks fine".
- Exceeding five waivers and calling them notes.

## 10. Exit checklist

- [ ] Full round completed on the production build.
- [ ] All required viewports captured.
- [ ] No `OPEN` results.
- [ ] No blockers.
- [ ] Waivers ≤5, approved, unexpired, with risk and mitigation.
- [ ] Report written in the required format.
- [ ] Artifacts present and paths valid.
- [ ] State is `PASSED` or `PASSED_WITH_WAIVERS`.
- [ ] Re-run triggered by any change after the round.
