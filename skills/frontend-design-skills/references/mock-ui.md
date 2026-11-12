# Mock UI Reference

Product fragments are evidence. Build them from a defined state model with real
labels, realistic data, and a consistent visual system. A wall of gray rectangles
is not a mock; it is a placeholder that weakens trust.

## 1. Define the frame before drawing

Write these six lines first:

```text
screen:        Billing overview
user:          Operations lead at a 40-person company
task:          Confirm the next invoice and update payment method
state shown:   Paid current month, one card expiring
viewport:      1440×900 desktop, sidebar expanded
data source:   mock set billing-01, labeled data-demo="true"
```

If you cannot name the task and the state, the mock is decorative.

## 2. Screen inventory

| Fragment | Purpose | Minimum contents |
|----------|---------|------------------|
| Dashboard | Show the core monitoring surface | Navigation, title, 2–3 metrics, one primary chart, one table |
| List / table | Show inventory or records | Columns, sort state, filters, row actions, pagination |
| Detail | Show one record | Header, status, metadata, primary action, activity |
| Editor | Show creation or configuration | Toolbar, fields, preview, save state |
| Settings | Show control and permissions | Sections, current values, save/cancel, danger zone |
| Onboarding | Show first-run setup | Progress, 2–3 steps, skip path, primary action |
| Empty state | Show what happens before data | Explanation, one action, example |
| Error state | Show failure recovery | What failed, what to do, retry, support path |
| Mobile view | Show the product on phone | Compact nav, one task, bottom action |

Use 2–4 fragments per marketing page, not one per feature. Each fragment should
show a different task and state.

## 3. Density and scale

- Build at 1440px wide, then scale the whole frame. Do not redraw at a smaller
  size with different spacing.
- Product UI inside a screenshot may use 13–14px labels because it is rasterized
  at 2× and presented as an image. Any interactive DOM fragment must use 16px
  minimum for body and controls.
- Base spacing: 4px. Row height: 40px compact, 48px comfortable. Sidebar: 240px
  or 280px. Top bar: 56px.
- Use one radius family and one border color, same as the marketing page.
- Use the accent only for selection, primary action, or live status.

## 4. Layout of a dashboard

```text
┌────────────┬─────────────────────────────────────────────┐
│ brand      │ title                         search  user │
│ nav        ├─────────────────────────────────────────────┤
│            │ metric  metric  metric                      │
│            │                                             │
│            │ primary chart                 side panel    │
│            │                                             │
│            │ table                                       │
└────────────┴─────────────────────────────────────────────┘
```

Rules:

- The sidebar has 5–7 items, one active.
- The page title is the largest text; metrics are second.
- One chart is primary. Supporting charts are smaller and clearly secondary.
- The table shows 4–6 rows, not 20.
- The primary action is in the header, not floating.
- Redact or fictionalize all customer data.

## 5. Tables

- Columns: 4–6. More than six means the frame is too dense for marketing.
- Header row: 12–14px, uppercase or medium weight, muted.
- Cells: left-align text, right-align numbers, use tabular numerals.
- Status: text plus a dot or icon, not color alone.
- Row height consistent; hover is optional and not required to understand.
- Include one selected row if selection is part of the story.
- Truncate long values with an ellipsis and a title attribute in a real build.
- Show units in headers or cells, not in a legend far away.

## 6. Charts

- Every chart has a title, axis labels, units, and a time range.
- Remove gridlines that do not help; keep the baseline.
- One accent series, neutrals for context.
- Do not use 3D, drop shadows, or gradient fills under lines.
- Label the last value or the key point directly.
- Show a realistic range; do not invent hockey-stick growth for a demo.
- Provide the same data in a table for accessibility when the fragment is a real
  DOM element.
- Sparklines need a label and a current value; they are not decoration.

## 7. Data rules

| Rule | Example |
|------|---------|
| Use consistent entities | Same company, people, and IDs across fragments |
| Use plausible ranges | 40 employees, $18,400 monthly, 2.3% churn |
| Use real formats | ISO dates or a single locale format, correct currency |
| Use units | ms, GB, seats, requests/min |
| Avoid real PII | No real emails, phone numbers, addresses, or tokens |
| Avoid vanity inflation | No "1,284,993 users" unless the product has that scale |
| Mark demo state | `data-demo="true"` on the frame |
| Match the story | If the copy claims speed, the chart shows latency |

Mock data sets should be reusable across screens: one account, one billing period,
one set of users, one set of records.

## 8. Navigation and chrome

- Use the product's real information architecture. Do not invent a simpler
  sidebar that does not exist.
- Browser chrome is optional. If used, keep it neutral and do not fake a URL that
  implies a real customer.
- Device frames are optional and often unnecessary. A clean border and shadow
  are enough.
- Do not tilt the frame in 3D, add reflections, or place it on a gradient stage.
- Crop to the task. A full-window capture at 30% scale is unreadable.

## 9. States to include

For every fragment set, cover at least one non-happy state:

- Empty: no records, with one clear action.
- Loading: skeleton or progress, with a label.
- Error: what failed and how to recover.
- Disabled: why the action is unavailable.
- Success: confirmation of the completed action.
- Permission: what the user can and cannot access.

A marketing page that shows only the perfect state implies the product has no
edges. One honest empty or error state builds more trust than three polished
dashboards.

## 10. Framing on the marketing page

```css
.ui-frame {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  box-shadow: 0 24px 60px rgb(0 0 0 / 0.12);
  overflow: clip;
  aspect-ratio: 16 / 10;
}

.ui-frame img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: top left;
}
```

Rules:

- One frame, one shadow, one radius.
- Do not place a second floating card over the frame unless it shows a real
  notification or state that belongs there.
- Give the frame a 1px border so it survives a white canvas.
- Crop from the top-left for app surfaces; crop to the active panel for mobile.
- Keep the frame within 7 columns on desktop; at 5 columns, crop closer.

## 11. Accessibility

- If the fragment is an image, write alt text that names the screen and task:
  "Billing overview showing a paid invoice and an expiring card."
- If the fragment is decorative, `alt=""`; if informative, describe the takeaway.
- If the fragment is live HTML, it must meet every rule in
  `70-accessibility-performance.md`; otherwise render it as an image.
- Do not put focusable controls in a decorative mock. Users will tab into a dead
  interface.
- Provide a text summary of the key data near the frame.
- Do not use text inside images for essential copy.

## 12. Mock UI QA

| Check | Pass condition |
|-------|----------------|
| Task defined | Screen, user, task, state recorded |
| Labels real | No "Item 1", "Label", or placeholder strings |
| Density | 4–6 table rows, 2–3 metrics |
| Data consistent | Same entities across fragments |
| Units present | Numbers carry units and dates |
| Chart honest | Axes, baseline, range, source |
| One accent | Accent only for action, selection, live |
| States | At least one empty, error, or loading state |
| Frame system | One border, radius, shadow |
| Legibility | Labels readable at rendered size |
| No dead controls | Decorative frames are not focusable |
| Demo labeled | `data-demo="true"` and manifest entry |

## 13. Common failures

- A dashboard with no navigation and no task.
- Six floating panels over a gradient.
- Charts with no axes, units, or time range.
- Invented hockey-stick growth.
- Real customer names or emails in a demo.
- Text at 6px because the whole app was scaled to fit.
- A browser frame with a fake URL and a fake security lock.
- A mock that claims a feature the product does not have.
- A live HTML mock with dead buttons and inputs.
- Three different border radii and two shadow styles in one frame.
