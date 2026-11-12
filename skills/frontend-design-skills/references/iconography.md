# Iconography Reference

Icons are a small, strict system. One family, one grid, one stroke logic, one
color rule. This reference covers family selection, sizing, alignment, custom
drawing, accessibility, and audit.

## 1. Family selection

| Family | Style | License | Best for |
|--------|-------|---------|----------|
| Lucide | Outline, 24px, 2px stroke | ISC | Product UI, general marketing |
| Phosphor | Outline/filled/duotone, multiple weights | MIT | Apps needing weight variants |
| Heroicons | Outline/solid, 24px and 20px | MIT | Tailwind and React projects |
| Material Symbols | Variable weight/fill/grade | Apache 2.0 | Dense product interfaces |
| Remix Icon | Outline/filled, broad set | Apache 2.0 | Admin and data tools |
| Custom set | Drawn to the project grid | Client-owned | Brands with a distinctive mark |

Choose one. Do not mix Lucide outline with Heroicons solid in the same toolbar.
If a family lacks a required glyph, draw it on the same grid rather than importing
a second family.

## 2. Grid and geometry

- Canvas: 24×24. Live area: 20×20. Padding: 2px on each side.
- Stroke: 2px at 24px, 1.75px at 20px, 1.5px at 16px. Optical adjustments are
  allowed; random weights are not.
- Caps: round or butt, one choice per family. Joins: round or miter, one choice.
- Corners: match the family. Do not mix 1px and 3px radii inside one icon.
- Align to the pixel grid at 1×. Avoid half-pixel strokes at 16px.
- Filled and outline variants are separate states, not decoration.

## 3. Sizes

| Size | Use | Stroke |
|------|-----|--------|
| 16 | Inline with 14–16px metadata, dense tables | 1.5 |
| 20 | Buttons, nav items, form affordances | 1.75 |
| 24 | Default UI and feature lists | 2 |
| 32 | Section markers, empty states | 2–2.5 |
| 48+ | Illustration or hero, custom drawing | Recalculate |

Never scale a 16px icon to 48px; the stroke becomes too thin. Use the size variant
or redraw.

## 4. Alignment with text

- Icons beside text align to the cap height, not the line box.
- Gap: 8px at 16px text, 8–12px at 17–18px text.
- In buttons, icon plus label: 8px gap; icon-only: 44×44px target.
- In lists, the icon column has a fixed width equal to the largest icon plus the
  gap; text starts on one rail.
- Do not vertically center an icon against a two-line label; align it to the
  first line.
- Optical size matters: a circle icon looks smaller than a square at the same
  bounding box. Adjust by 1px when needed.

## 5. Color

- Icons inherit `currentColor` by default.
- The accent may color an icon only when the icon represents the accent's single
  job (primary action, live status, selection).
- Feature icons use the ink or secondary ink color, not five different hues.
- Disabled icons use the disabled text token, not opacity alone.
- Icons on photography need a scrim or a solid field with 3:1 contrast.

## 6. Accessibility

- Decorative icons: `aria-hidden="true"` and no accessible name.
- Meaningful icon with adjacent text: keep the icon hidden; the text is the name.
- Icon-only control: `aria-label` with a verb and object, plus a tooltip if the
  action is not obvious. Minimum 44×44px target.
- Icons that convey state need a text label nearby; do not rely on shape or color
  alone.
- An icon inside a link does not replace link text unless the link is in a toolbar
  with an accessible name.
- SVG needs `focusable="false"` in older browsers and a `<title>` only when it is
  the sole accessible name.

```html
<button class="icon-button" aria-label="Close dialog">
  <svg aria-hidden="true" focusable="false" width="24" height="24">…</svg>
</button>
```

## 7. Custom icon drawing

1. Draw on the 24px grid with a 20px live area.
2. Use the same stroke, caps, joins, and corner logic as the family.
3. Test at 16, 20, 24, and 32px.
4. Remove unnecessary detail; an icon is a silhouette, not an illustration.
5. Keep one optical weight; do not mix a thin outline with a heavy filled shape.
6. Export as SVG with `viewBox="0 0 24 24"`, no width/height in the file, and
   `fill="none"` or `fill="currentColor"` as appropriate.
7. Run SVGO or an equivalent optimizer; remove editor metadata.
8. Name the file by action or object: `calendar-check.svg`, not `icon-12.svg`.

## 8. Icon sets by use

| Use | Recommended | Avoid |
|-----|-------------|-------|
| Primary navigation | 20px outline, one family | Filled and outline mixed |
| Feature list | 24px outline, one accent or ink | Five colors, rounded-square badges |
| Status | Filled dot plus text | Color-only status |
| Social | Official brand marks, monochrome | Recolored or distorted marks |
| Payment | Official marks with permission | Hand-drawn approximations |
| Platform | Official store marks | Generic gamepad or monitor glyphs |
| File type | Simple document glyph plus extension text | Detailed file illustrations |

## 9. Common failures

- Emoji used as icons.
- Three families in one page.
- Stroke widths of 1, 1.5, and 2 in the same toolbar.
- Icons scaled from 16 to 48.
- Icon-only buttons with no accessible name.
- Icons colored with the accent for decoration.
- Rounded-square icon containers behind every feature.
- Icons that do not match the verb: a gear for "publish", a star for "delete".
- Filled logos recreated by hand.
- Icons without a text label in a critical flow.

## 10. Icon QA

| Check | Pass condition |
|-------|----------------|
| One family | All icons from one source or custom set |
| Grid | 24px canvas, 20px live area |
| Stroke | Consistent per size |
| Sizes | Only 16/20/24/32 used, with matching variants |
| Alignment | Cap-height alignment, consistent gap |
| Color | Inherits currentColor; accent only for its job |
| Contrast | 3:1 against surface |
| Labels | Icon-only controls have accessible names |
| Targets | 44×44px minimum for touch |
| State | Not color-only |
| Export | Clean SVG, no metadata, correct viewBox |
| License | Family license recorded in the manifest |
