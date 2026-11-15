# DDH Consulting brand

Use this when a proposal, a deck, or a page should look like the site. One palette, one type pairing, one spacing scale.

The audience is CFOs, COOs, practice owners, MSO and PE operators, and hospital finance directors. The work is a fractional data lead for healthcare. The tone is trust and precision.

## Palette

Tokens live in `:root` in `assets/site.css`. Do not introduce a second accent.

| Name | Hex | Role |
| --- | --- | --- |
| Paper | `#F3F6F6` | Page background. Cool, very light neutral. |
| Card | `#FFFFFF` | Cards, form fields, diagram frames. |
| Soft band | `#E5EEEE` | Quiet alternate section, such as the cash estimate. |
| Ink | `#0C2C30` | Headings, footer, dark bands, selected controls. |
| Text | `#1C3E42` | Body copy. |
| Muted | `#3A5256` | Secondary copy, hints, captions. |
| Line | `#C5D4D4` | Section rules and dividers. |
| Line strong | `#5E787B` | Field borders and other UI edges that must meet 3:1. |
| Petrol | `#0B555B` | Links, focus, numbers, progress, diagram rules. |
| Mist | `#D5E4E4` | Secondary text on ink (footer, dark bands). |
| On dark | `#F4F8F8` | Primary text on ink. |
| Brass | `#8A3F12` | Primary button fill only. White label. |
| Brass hover | `#73350E` | Primary button hover. |
| Danger | `#8B1E2D` | Form errors only. |
| Good | `#0D5C3D` | Positive status text, such as a solid Health Check result. |

Brass does not appear in headings, links, rules, or the logo. Petrol is the working color. Brass is the one action color, so the primary button is obvious on a cool page.

Why these colors: healthcare guidance in the design references leans teal and blue (`#0077B6`, `#00A896`) and tells you to avoid aggressive red. Finance leans deep navy and teal (`#003366`, `#0F766E`) and a traditional, stable palette. Consulting leans a dark neutral with a clear professional accent. Ocean Depths, the calm professional theme in the theme set, uses deep water and teal. This palette takes the petrol from that overlap and puts it on a cool paper field, darker than a generic medical cyan, and it does not use the cream and terracotta pair the previous site used.

The logo mark keeps its shape. On paper, the tile is ink `#0C2C30` and the cylinder is `#F4F8F8`. In the footer, the tile is `#F4F8F8` and the cylinder is ink, so the same mark reads on the dark band. The browser icon keeps the three-node mark, in the same two colors.

## Type

| Role | Family | Weight | Notes |
| --- | --- | --- | --- |
| Headings | Source Serif 4 | 600 for h1 and h2, 500 for h3 and h4 | Self-hosted, `font-display: swap`. |
| Body, UI, buttons | Source Sans 3 | 400 body, 500 labels and buttons, 600 when a label must carry more weight | Self-hosted, `font-display: swap`. |

Fallback stacks: `"Iowan Old Style", Palatino, "Palatino Linotype", serif` and `"Segoe UI", sans-serif`.

Why this pair: finance references allow a traditional serif for an established firm. Healthcare references ask for a highly legible sans. A single grotesque was the previous site (Geist) and reads as a product template. Source Serif 4 is a text serif made for long reading. Source Sans 3 is the same foundry, with clear figures for the reconciliation table and the cash estimate. Both are SIL Open Font License. See `fonts/OFL-source.txt`.

| Element | Size | Line height | Tracking |
| --- | --- | --- | --- |
| Hero h1 | clamp(2.55rem, 4.6vw, 3.7rem); 1.9rem minimum on a phone | 1.08 | -0.02em |
| Section h2 | clamp(1.7rem, 2.5vw, 2.65rem) | 1.15 | -0.02em |
| h3 | 1.15rem to 1.35rem | 1.25 | -0.015em |
| Body | 17px | 1.5 | -0.006em |
| Lead | 1.125rem | 1.5 | -0.011em |
| Small / captions | 0.8125rem to 0.9375rem | 1.4 | 0 |

Measure is about 40 to 44rem for long copy. Buttons and navigation stay in Source Sans 3.

## Spacing

8px base. Use the steps already in the CSS. Do not invent one-off padding.

| Token | Value |
| --- | --- |
| s1 | 8px |
| s2 | 16px |
| s3 | 24px |
| s4 | 32px |
| s5 | 48px |
| s6 | 64px |
| s7 | 96px |
| s8 | 128px |

Page width is 1120px. The build gallery may run to 1360px. Side padding is 24px, and 16px under 780px.

## Buttons and links

Primary button: brass `#8A3F12`, label `#FFFFFF`, 4px radius, min-height 48px (40px in the header). Hover `#73350E`. On a dark band, add a 2px `#F4F8F8` border so the button edge stays clear against ink.

Secondary button: transparent, ink label, line-strong border, 4px radius.

Ghost button: only on dark bands. Light border, light label.

Text link: petrol `#0B555B`, weight 500, underline. On ink, the link is `#F4F8F8` with an underline.

Focus: 2px petrol outline, 3px offset. On ink, the outline is `#F4F8F8`.

Do not fill a second button with brass on the same screen if it would compete with the main action. The Health Check header uses a quiet text link for that reason.

## Voice

Write to you and your. Short sentences. Say what happens next.

- Plain words. If a finance director would ask what a phrase means, replace it.
- No prices and no dollar signs on the site or in a deck that uses this brand.
- No invented statistics, client names, or testimonials.
- No employer names.
- No About section. The site does not carry one.
- Reply time is the same day. Write "We reply the same day."
- HIPAA, when it has to be said: "HIPAA-eligible with a signed BAA and the correct configuration." Do not write "HIPAA compliant."
- The headline stays "Fractional data lead for healthcare."
- The service line stays "FP&A · Business Intelligence · AI & Automation".
- Reconciliation and accounts receivable stay one of the five service areas.
- Calls to action go to `/apply.html` and `/checkup.html`.
- Path A and Path B stay on the briefing page.

Do not decorate a sentence. Do not stack a label above every heading. Motion, if any, is a short fade on a section heading.
