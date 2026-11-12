# 40 — Assets, Brand, and Provenance

Every visual is either licensed, owned, or built. This document defines asset
classes, sourcing rules, the manifest, and the single permitted credit line. If an
asset cannot be classified and traced, it does not ship.

## 1. Asset classes

| Class | Definition | Required record |
|-------|------------|-----------------|
| `product-ui` | A real interface surface or a faithful fragment built from `references/mock-ui.md` | Build reference, data source, state list |
| `photo` | A photograph of a person, place, object, or environment | Author, source URL, license, model/property release |
| `diagram` | A schematic, flow, architecture, or measurement drawing | Author, tool, source facts, units |
| `brand` | A client or partner mark used with permission | Permission record, file variant, clear-space rule |
| `data` | A chart, table, or metric embedded as a visual | Dataset, date, method, license |
| `texture` | A material or surface used as background atmosphere | Source, license, tileability |
| `icon` | A glyph from one icon family or a custom set | Family name, license, grid, stroke |
| `placeholder` | A labeled stand-in that must be replaced | Owner, target asset, gate status |

Decorative gradients, blobs, and particle fields are `texture` at most. They may
not be classified as product evidence.

## 2. Photography

### Source order

1. Commissioned or client-owned photography.
2. Licensed library photography with a recorded license.
3. Public-domain or permissively licensed archives with a recorded source.
4. No fourth option.

### Vetting checklist

- The subject matches the niche row and the specific offer.
- The location, season, and clothing are plausible for the audience.
- No visible third-party logos, trademarks, or readable private data.
- No identifiable person without a model release for commercial use.
- No identifiable private property without permission.
- Resolution supports the largest rendered size at 2× density.
- The image is not a synthetic or AI-generated image.
- The file has a traceable source and license, not a re-upload.
- The color grade is consistent with the other images on the page.
- Crops preserve the subject at every breakpoint.

### Art direction

- Use one lighting family per page: daylight, overcast, studio, or interior
  practical. Do not mix hard noon sun with soft studio light in the same grid.
- Match perspective: eye level for people and rooms, slight top-down for objects
  and food, straight-on for architecture.
- Keep a consistent grade: neutral white balance, restrained saturation, and
  blacks that retain detail.
- Prefer environmental context over isolated cutouts for hospitality and service.
- Prefer isolated, consistent-background cutouts for commerce.
- For hardware, include one scale reference and one macro detail.

### Cropping and aspect ratios

| Placement | Desktop | Phone |
|-----------|---------|-------|
| Hero media | 16:10 or 3:2 | 4:3 |
| Split feature | 4:3 | 4:3 |
| Card thumbnail | 3:2 | 3:2 |
| Portrait | 3:4 | 4:5 |
| Full-bleed band | 21:9 or 2:1 | 16:9 |

- Set `aspect-ratio` and `object-fit: cover`; choose the focal point with
  `object-position`, not by distorting the image.
- Export AVIF and WebP with a JPEG fallback only if required. Serve responsive
  widths: 480, 768, 1200, 1600, 2400.
- Strip EXIF location data unless the location is intentionally public.

### No synthetic imagery

Do not use generated images for people, places, products, or evidence. Generated
imagery is prohibited because it cannot be verified, often carries anatomical or
text artifacts, and misrepresents provenance. If a supplied asset is suspected to
be generated, flag it, replace it, and record the decision in the manifest.

## 3. Icons

- One family per page: outline or filled, not both. The only exception is a
  deliberate active/inactive pair from the same family.
- Stroke width 1.5px at 24px, 1.5px at 20px, 1.25px at 16px. Optical correction
  is allowed; mixed stroke weights are not.
- Sizes: 16, 20, 24, 32. Do not scale a 16px icon to 48px.
- Icons inherit `currentColor`. Do not tint individual icons with the accent
  unless the icon represents the accent's single job.
- Decorative icons use `aria-hidden="true"`. Meaningful icon-only controls need
  an accessible name.
- Align icons to the text cap height, not the line box. Use a 4px gap at 16px and
  an 8px gap at 20px and above.
- Do not use emoji as icons. Do not mix rounded, sharp, and duotone styles.
- Custom icons follow the same 24px grid, 2px safe area, and 1.5px stroke.
- See `references/iconography.md` for the family table and drawing rules.

## 4. Brand marks

- Use a client mark only with written permission and the correct file variant.
- Partner or customer marks require an active endorsement record. A logo row is
  not a design flourish.
- Do not fabricate marks, alter proportions, recolor outside the brand rules, or
  place a mark on a busy photo without a solid field.
- Clear space: at least the height of the mark's counter on all sides, minimum
  16px.
- Minimum sizes: 24px height for a symbol, 80px width for a wordmark. Below that,
  use the symbol only.
- Monochrome marks in a logo row use one ink at 60–70% opacity; hover restores
  full ink. Never apply the accent to a third-party mark.
- If no licensed marks exist, omit the row. A neutral text list of customer names
  is acceptable only when those relationships are verified.
- The product's own logo follows the same rules as any other mark.

## 5. UI fragments

Product UI is the strongest proof in SaaS, devtool, AI, and hardware pages. Build
it from a real state model, not from decorative rectangles.

- Define the screen, the user, the task, and the state shown.
- Include real labels, units, timestamps, and one empty or error state in the
  fragment set.
- Use the product's actual navigation and terminology; do not invent a second
  information architecture for the marketing page.
- Show one primary surface per frame. Do not collage five floating panels.
- Keep browser chrome out unless the frame is explicitly a browser capture.
- Use a consistent device scale: 1440-wide capture at 2×, or a vector rebuild.
- Redact secrets, emails, tokens, and customer names. Replace with clearly
  fictional but plausible values, marked `data-demo="true"`.
- Do not add unlabeled charts. Every axis, unit, and time range must be visible.
- See `references/mock-ui.md` for the component inventory and data rules.

## 6. Diagrams

- One idea per diagram. If it needs a legend longer than three items, split it.
- Label nodes with nouns and edges with verbs. No unlabeled arrows.
- Include units and a date or version for any measurement.
- Use the page's type and line tokens; diagrams are part of the system.
- Export as SVG with text as text, not outlines, unless the font license forbids
  embedding.
- Provide a text equivalent: a short description plus the underlying list.
- Do not use a diagram to imply a capability the product does not have.

## 7. Mock data

Mock data is allowed for product fragments and demos when it is:

- Labeled in the source with `data-demo="true"`.
- Plausible in format and scale, not inflated for effect.
- Free of real personal data and real customer names.
- Consistent across screens: same account, same currency, same date range.
- Removed or replaced when a real capture becomes available.

Mock data may not be used for claims: no fake revenue, usage, ratings, or growth
curves presented as the product's results. Those are `COP-04` failures.

## 8. Licensing manifest

Every non-code asset gets a row. Store the manifest beside the build or in the
project README.

```json
{
  "assets": [
    {
      "id": "hero-property-01",
      "class": "photo",
      "path": "/assets/photos/hero-property-01.avif",
      "source": "https://example.com/photo/123",
      "author": "Name",
      "license": "Commercial license #ABC-123",
      "license_url": "https://example.com/license",
      "release": "model-release-2026-04.pdf",
      "added": "2026-11-09",
      "expires": null,
      "credit_required": true,
      "notes": "Cropped 3:2 from original; grade matched to set."
    }
  ]
}
```

Required fields: `id`, `class`, `path`, `source`, `author`, `license`, `added`,
`credit_required`. Add `release` for people or private property, `expires` for
time-limited licenses, and `notes` for edits.

In the HTML, mirror the manifest on the element: `data-source` (the source URL or
`owned`), `data-subject` for library images, `data-credit="true"` when the
license requires the footer line, and `data-demo="true"` for mock UI data. The
browser audit reads these attributes.

Rules:

- File names are lowercase, hyphenated, and contain no spaces.
- One asset, one row. Do not bundle multiple images under one license record.
- Do not reuse one file for two unrelated subjects; the audit treats duplicate
  image sources as a sign that the visual is decorative.
- Keep the license text or receipt in the project archive, not only a URL.
- If a license cannot be produced, replace the asset. Do not ship with a note.
- Icons and fonts also get rows, including the exact weights used.

## 9. Footer credit

Use one credit line for the whole site, in the footer, at small size:

```text
Photography: Name / Studio. Type: Family by Foundry. Icons: Family.
```

Rules:

- One line at 1440; wraps to at most two lines on phone.
- No per-image captions (`HR-08`).
- Credit only what the license requires or what the client wants acknowledged.
- Do not use the credit line for marketing copy or a second navigation.
- Link the credit only when the license requires a link; otherwise plain text.

## 10. Asset QA

| ID | Check | Pass condition |
|----|-------|----------------|
| VIS-01 | Visuals render | Every image loads, has pixels, and has a scrim if text sits over it |
| VIS-02 | No placeholders | No placeholder copy, image service, or tracking pixel |
| VIS-03 | No captions | No visible caption restates an image |
| AST-01 | Source and subject | Every image has a source trail and a subject note if from a library |
| AST-02 | Assets resolve | Every referenced asset returns 200 and inline SVG has a role |
| AST-03 | Credits | Library photography has the required footer credit |

Supporting checks without separate gate IDs:

- Visuals are classified and tied to the offer; no decorative substitute for a
  product surface.
- No generated people, places, products, or evidence.
- One icon family with consistent stroke and sizing.
- No fabricated logos, reviews, metrics, or badges.
- Crops preserve the subject at every breakpoint; no distortion.
- Brand marks have permission and correct clear space.
- The manifest matches files on disk.
- Mock data is labeled and consistent.

## 11. Replacement workflow

1. Flag the asset `placeholder` in the manifest.
2. Add a visible neutral field with the intended subject and aspect ratio; do not
   use an unrelated image.
3. Mark the related gate item `OPEN`.
4. Replace before delivery, or carry a waiver only if the placeholder is not
   evidence and is documented in the final report.
5. Re-run `VIS-01`, `AST-01`, `AST-03`, and the browser checks after replacement.
