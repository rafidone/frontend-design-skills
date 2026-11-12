# 60 — Copy and Content

Copy is the interface. This document defines voice, headline formulas, action
labels, filler to remove, placeholder rules, and word budgets. Write the page
before styling it; layout follows the argument.

## 1. Voice

- **Direct.** Subject, verb, object. One idea per sentence.
- **Specific.** Name the audience, the object, the unit, the timeframe.
- **Calm.** No exclamation marks, no shouting caps, no stacked superlatives.
- **Accountable.** Say who does what. Prefer "we" for the maker and "you" for the
  reader; avoid the impersonal "it is possible to".
- **Consistent.** Choose second person or third person per page and keep it.
- **Plain.** Prefer the short word. Define a technical term the first time.

Sentence limits:

| Element | Limit |
|---------|-------|
| Headline | 3–10 words, one clause |
| Subhead | 12–24 words |
| Body paragraph | 45–90 words, 2–4 sentences |
| Bullet | 6–18 words, parallel grammar |
| Action label | 2–4 words, verb plus object |
| Helper text | ≤20 words |
| Error message | What happened plus what to do next |

## 2. Headline formulas

Use one formula per section. Do not stack two formulas into a headline.

| Formula | Pattern | Example |
|---------|---------|---------|
| Outcome | Get <outcome> without <cost> | Get a production site without a design retainer |
| Mechanism | <Thing> that <specific behavior> | A booking page that holds the room while you pay |
| Constraint | <Outcome>, even when <constraint> | Clear pricing, even when the catalog changes daily |
| Audience | For <specific role> who <specific job> | For operators who close the books on Friday |
| Contrast | <Common assumption>. <Correction>. | Everyone sells features. Guests buy a quiet room. |
| Number | <Number> <unit> <result> | Three clicks from cart to delivery window |
| Problem | Stop <costly behavior> | Stop rebuilding the same pricing table |
| Plain claim | <Product> <does the thing> | The ledger reconciles itself |
| Question | <Question the reader already asks> | What happens after the trial ends? |

Rules:

- A headline makes a claim the page can prove. If the proof is absent, change the
  headline.
- Do not use wordplay that hides the category. A visitor must know what is sold.
- No question headlines on a page where the answer is "it depends".
- No "the future of X", "X, reimagined", or "unlock the power of X" (see filler).

## 3. CTA labels

Every action label is **verb + object**. The object is the thing the user gets or
does, not the interface mechanism.

| Good | Weak | Why |
|------|------|-----|
| Book a room | Get started | Names the outcome and the object |
| View pricing | Learn more | Names the destination |
| Start a project | Contact us | Names the first step |
| Open the dashboard | Submit | Names the surface |
| Download the report | Click here | Describes the result |
| Compare plans | See options | Specific action |

Rules:

- One primary action per decision area. Secondary actions are visibly quieter.
- Never use "Submit", "Click here", "Learn more", or "Get started" as the primary
  label. "Learn more" is allowed only as a tertiary link with a specific
  destination in the accessible name.
- The label must remain accurate after the click. "Book a room" must open a
  booking flow, not a contact form.
- Buttons do not use exclamation marks, arrows as the only label, or all caps.
- Repeat the primary action after the proof block with the same wording.

## 4. Banned filler

Remove these unless the sentence fails without them. They add no information and
signal generic marketing.

| Group | Remove |
|-------|--------|
| Inflation | seamless, robust, cutting-edge, innovative, revolutionary, next-generation, state-of-the-art, best-in-class, world-class, game-changing, groundbreaking |
| Abstraction | leverage, empower, unlock, unleash, elevate, transform, supercharge, harness, curate, facilitate, utilize |
| Vagueness | solutions, offerings, capabilities, synergies, holistic, frictionless, end-to-end, turnkey, bespoke, tailored |
| Journey language | journey, landscape, realm, tapestry, delve, navigate the complexities |
| Empty proof | trusted, leading, award-winning, industry-leading, proven, reliable |
| Throat-clearing | we believe, we are passionate about, at our core, in today's world, it's no secret |
| Interface noise | simply, just, easily, quickly, effortlessly, intuitively |

Replacements:

- "seamless integration" → "connects to Stripe in one OAuth step".
- "powerful insights" → "a weekly table of margin by SKU".
- "world-class support" → "a named engineer answers within one business day".
- "cutting-edge AI" → "summarizes a 40-page contract in 20 seconds".

## 5. Placeholders and lorem

- No lorem ipsum, no Greeked text, no repeated "Lorem" fragments, no dummy
  paragraphs that resemble final copy.
- Use a visible placeholder token with an owner and a fact to obtain:

```text
[[TBD:headline — confirm the 2026 outcome metric with client, owner: name]]
```

- Placeholders must appear in the content inventory and in the gate report.
- A placeholder may not be used for proof, pricing, legal, or safety copy.
- The page must not ship with any `[[TBD:` token remaining.

## 6. Facts and assumptions

- Every number needs a source, a date, and a unit. Record them in the content
  inventory beside the claim.
- Do not round a number in a way that changes its meaning. Do not convert units
  without showing the original.
- Do not invent customer names, quotes, ratings, awards, certifications, or
  partnerships (`HR-09`).
- When a fact is unavailable, write an assumption explicitly:

```text
ASSUMPTION: Trial length is 14 days; confirm with billing before launch.
```

- Assumptions appear in the final report; they do not silently become copy.
- Testimonials require the speaker's approval and the exact wording they approved.
- Legal and medical claims require review by the responsible party.

## 7. Word budgets

A "screen" is one viewport-height beat at the target size, not a full page.

| Page type | Words per screen | Notes |
|-----------|------------------|-------|
| Technical product / devtool | 60–90 | Dense enough to explain, short enough to scan |
| SaaS marketing | 40–80 | One claim plus one proof per beat |
| AI / research | 50–90 | Name the model, input, output, and limit |
| Commerce | 20–60 | Price, variant, delivery, action |
| Hospitality | 20–50 | Place, room, date, action |
| Service | 40–80 | Promise, process, proof, contact |
| Editorial | 120–220 | Reading measure and paragraph rhythm |
| Documentation | 150–300 | Navigation and code reduce prose load |

Rules:

- Count visible words in the first viewport. If a technical hero exceeds 90 words
  including the action labels, cut the lead or move detail into a proof row.
- A section with more than 120 words needs a subhead, list, or figure to break it.
- A phone screen holds roughly 40% fewer words than a desktop screen at the same
  type size. Do not assume the desktop copy fits.

## 8. Page copy map

Every page uses this order unless the niche row says otherwise:

1. **Hero** — category, audience, outcome, primary action.
2. **Proof** — one verifiable fact, product surface, customer, or measurement.
3. **Mechanism** — how it works in 2–3 steps or one annotated visual.
4. **Objections** — price, effort, risk, compatibility, support.
5. **Close** — restate the outcome and repeat the primary action.
6. **Footer** — navigation, legal, one credit line.

Section-level rules:

- Each section has one job. The heading names the job.
- Do not repeat the hero claim in every section with synonyms.
- The close is shorter than the hero; it assumes the reader has read.
- Footer copy is functional: addresses, hours, legal names, links.

## 9. Microcopy

| Context | Rule | Example |
|---------|------|---------|
| Field label | Noun or question, always visible | Work email |
| Helper | Format or consequence | We use this only for the receipt. |
| Error | What happened plus fix | Enter a date after today. |
| Success | Confirm the result | Room held for 15 minutes. |
| Empty state | Explain the next action | No invoices yet. Create one from an order. |
| Loading | State what is loading | Loading availability… |
| Destructive | Name the object and consequence | Delete this draft? This cannot be undone. |
| Permission | Explain before the OS prompt | Allow notifications for gate changes only. |

Rules:

- Errors appear next to the field and in a summary at the top of long forms.
- Do not blame the user. Do not use "invalid" without saying what is valid.
- Do not use humor in errors, payments, legal, or health contexts.
- Do not use "Are you sure?" without naming the object and the consequence.

## 10. Readability

- Target a lower-secondary reading level for marketing; technical terms are fine
  when defined.
- Prefer active voice. Passive is allowed when the actor is unknown or irrelevant.
- One colon per paragraph at most. One parenthetical per sentence at most.
- Expand an acronym on first use unless the audience uses it daily.
- Use sentence case for headings and labels. Title Case only for proper names.
- Use the serial comma consistently.
- Use numerals for measurements and times; spell out one to nine in prose.

## 11. Copy QA

| ID | Check | Pass condition |
|----|-------|----------------|
| COP-01 | No lorem or filler | No lorem, dummy prose, visible sample-data label, or missing title/meta |
| COP-02 | Action labels | Primary labels are verb plus object; no generic-only action set |
| COP-03 | No stock phrases | No banned phrase, label heading, or repeated heading |
| COP-04 | No invented proof | Every claim, rating, customer, and metric has a source |

Supporting checks without separate gate IDs:

- No `[[TBD:` placeholder remains at the gate.
- Every assumption is labeled and reported.
- No caption restates an image.
- First viewport fits the page-type word budget.
- One voice, one person, one terminology.
- Errors, empty, loading, and success states are written.

## 12. Content inventory format

```text
id: hero-headline
slot: hero.h1
text: A booking page that holds the room while you pay
formula: mechanism
claim: inventory is reserved during payment
source: client interview 2026-10-14
status: approved
owner: name
```

The inventory is the single source of truth. When the page and the inventory
disagree, the page is wrong.
