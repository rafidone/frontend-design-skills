# Photography Reference

Photography is evidence of a place, person, object, or process. This reference
covers sourcing, licensing, art direction, vetting, treatment, and delivery for
frontend-design-skills projects.

## 1. Source hierarchy

1. **Commissioned work.** The client pays for the shoot and owns or licenses the
   files. Best for hospitality, service, hardware, and commerce.
2. **Client-owned archive.** Existing photography with a documented owner. Check
   whether the license covers web use and whether the people in the images have
   releases.
3. **Licensed library.** A paid or free license with a recorded source, author,
   and terms. Verify commercial use, modification, and model/property releases.
4. **Public-domain or permissive archives.** Confirm that the specific file is
   public domain or under a license that allows commercial use and modification.
5. **No fifth option.** Do not pull an image from a search result, a competitor,
   a social post, or a screenshot without a license.

## 2. License fields to capture

| Field | Why |
|-------|-----|
| Source URL | Traceability |
| Author | Attribution and verification |
| License name and URL | Legal terms |
| Commercial use | Some licenses forbid it |
| Modification | Cropping and grading may be restricted |
| Model release | Required for identifiable people |
| Property release | Required for private buildings and interiors |
| Expiry | Some licenses are time-limited |
| Credit requirement | Determines the footer line |

If any field is unknown, treat the asset as unlicensed and replace it.

## 3. Search queries that produce specific images

Generic queries return generic images. Search with place, material, activity, and
light.

| Need | Better query |
|------|--------------|
| Hotel | "boutique hotel courtyard morning light Lisbon" |
| Workshop | "ceramic studio hands wheel natural light" |
| Team | "two engineers reviewing hardware at bench" |
| Product | "brushed aluminum enclosure macro edge" |
| Food | "wood-fired bread cooling rack close" |
| Office | "small studio desk plants north window" |
| Outdoors | "trailhead fog fir forest morning" |

Add a location when the business is local. Add a constraint ("no people", "no
logos", "interior only") to filter noise. Avoid "business", "technology",
"success", and "innovation" as primary terms; they return staged imagery.

## 4. Vetting checklist

- **Subject accuracy.** The image shows the actual place, object, or activity. A
  generic resort is not a substitute for a specific hotel.
- **Identity.** No identifiable person without a release. No recognizable private
  property without permission.
- **Brands.** No visible third-party logos, trademarks, or branded products that
  imply endorsement.
- **Data.** No readable screens, documents, license plates, addresses, or badges.
- **Resolution.** The longest side supports the largest rendered size at 2×.
- **Quality.** Sharp at the focal point, controlled noise, no compression blocks,
  no excessive sharpening halos.
- **Lighting.** Consistent direction and color temperature with the rest of the
  page.
- **Composition.** Room for the intended crop and for text if the image is a
  background.
- **Provenance.** The file is not a re-upload with stripped metadata; the source
  page is reachable.
- **Synthetic check.** Look for malformed hands, impossible reflections, repeating
  textures, garbled text, and inconsistent shadows. Generated imagery is
  prohibited for people, places, products, and evidence.

## 5. Art direction by niche

| Niche | Lighting | Perspective | Grade | Composition |
|-------|----------|-------------|-------|-------------|
| SaaS / devtool | Even, neutral | Eye level or screen capture | Neutral, low saturation | Product surface, minimal environment |
| AI | Soft, neutral | Straight-on | Neutral, no glow | Output, demo, or data |
| Gaming | Dramatic, controlled | Low or wide | Deep blacks, one accent | One dominant frame |
| Hardware | Studio softbox | Three-quarter and macro | Neutral metal, true color | Object with scale cue |
| Commerce | Bright, even | Straight-on | True color, white balance | Isolated on consistent ground |
| Hospitality | Natural, warm | Eye level, room corner | Warm but neutral | Place and detail |
| Service | Available light | Eye level | Documentary | Person at work, real location |
| Editorial | Natural or studio | Intentional | Consistent per story | Lead image plus detail |

Do not mix hard sun and soft studio light in the same grid. Do not mix warm and
cool grades without a transition.

## 6. Crops and focal points

| Use | Ratio | Rule |
|-----|-------|------|
| Desktop hero | 16:10 or 3:2 | Keep the subject in the right or center third |
| Phone hero | 4:3 | Crop to the subject, not the widest view |
| Split feature | 4:3 | Align the horizon with the copy block |
| Portrait | 3:4 or 4:5 | Eyes in the upper third |
| Card | 3:2 | Same crop across the grid |
| Full-bleed band | 21:9 or 2:1 | Subject centered or offset to the copy side |

Set `object-position` per breakpoint when the subject would be cropped out. Test
at 1440, 820, and 390. Do not use `object-fit: fill`.

## 7. Treatment

- Correct white balance before grading.
- Keep blacks detailed; avoid crushed shadows in product and interior images.
- Reduce saturation for backgrounds behind text; never rely on a blur alone for
  contrast.
- A scrim must be measured, not guessed: sample the lightest pixel under the text
  and confirm 4.5:1.
- Do not apply a heavy duotone to evidence photography; it hides material and
  place.
- Keep a consistent grain and sharpening level across a set.
- Do not add fake light leaks, lens flares, or film borders.

## 8. Delivery

```text
assets/photos/
  hero-property-01.avif      2400w
  hero-property-01-1600.avif
  hero-property-01-1200.avif
  hero-property-01-768.avif
  hero-property-01-480.avif
  hero-property-01.jpg       fallback only if required
```

- Export AVIF at quality 50–65 and WebP at 70–80. Compare visually at 100%.
- Use `srcset` and `sizes`; never serve the 2400px file to a phone.
- Strip EXIF location unless it is intentionally public.
- Keep the original and the license receipt in the project archive.
- Record every file in the asset manifest with class, author, license, and credit
  flag.
- Name files by subject and role, not by camera sequence.

## 9. Accessibility

- Alt text describes the informational content, not the file or the art
  direction.
- For a place: "Courtyard at the hotel with olive trees and six café tables."
- For a person: role and context, not appearance, unless appearance is the point.
- For a product: the object and the visible feature.
- For a decorative background: empty alt.
- Do not repeat the adjacent heading in the alt text.
- If the image is a link, the alt text names the destination.
- Complex images need a longer description nearby, not a 200-word alt attribute.

## 10. Credit line

One footer line for the site:

```text
Photography: Name / Studio. Type: Family by Foundry. Icons: Family.
```

Only include what the license requires or the client wants acknowledged. No
per-image captions. Link only when required by the license.

## 11. Rejection list

Reject an image if:

- It is a stock cliché: handshake, glowing globe, generic team meeting, fake
  dashboard, laptop on a beach.
- It implies a false capability or location.
- It contains an unlicensed logo or recognizable person.
- It cannot survive the phone crop.
- It is visibly generated and presented as real.
- It is low resolution, soft, or heavily compressed.
- It fights the palette or the type contrast.
- It cannot be understood without visible explanatory text.

## 12. QA

| Check | Pass condition |
|-------|----------------|
| License | Source, author, terms, and releases recorded |
| Subject | Actual place, object, or activity |
| Provenance | File traceable to the source |
| Synthetic | No generated evidence imagery |
| Resolution | Supports 2× at the largest rendered size |
| Crop | Subject survives every breakpoint |
| Grade | Consistent with the set |
| Contrast | Text over image reaches 4.5:1 |
| Alt text | Informative and non-redundant |
| Manifest | File path and credit flag match |
| Credit | One footer line |
