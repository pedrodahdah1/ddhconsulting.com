# Design audit

Audit of ddhbiconsulting.com as it stood on the retainer branch before the visual redesign in this change. The page had the new retainer copy inside the previous template: centered hero, gold italic, equal cards, and a dark band.

Scores are out of 10. The comparison is the polish of a serious B2B firm site: a Stripe-level marketing page or a premium boutique advisory site. Those pages use an asymmetric hero, one strong display face, a strict spacing scale, a single accent, a product or work visual, and a primary action that is obvious in the first screen.

## Scores

| Area | Score | What the page was doing |
| --- | --- | --- |
| Typography | 6 | Playfair Display and DM Sans. Readable, and a familiar template pairing. The hero was centered, the italic gold word was decorative, and the scale did not build a clear editorial hierarchy. |
| Color and contrast | 5 | Navy, gold, and warm white, unchanged from the prior version. Body copy on the dark band sat around a translucent white and was the weakest contrast on the page. |
| Spacing | 6 | Sections were evenly padded. There was no strict spacing scale, and little variation in density, so the page felt long in a uniform way. |
| Visual hierarchy | 4 | Almost every section was an eyebrow, a serif heading, and a grid of equal cards. Nothing in the first screen showed the work. |
| Imagery and icons | 2 | The database mark was the only picture. No diagram, dashboard, or other signal of BI practice. |
| Section rhythm | 4 | Card grid, dark card grid, card grid. The retainer, the workstreams, and the proof used the same card language. |
| CTA prominence | 6 | "Schedule a consultation" was present and the header stayed on screen. The second hero action was "See the retainer," so the Health Check was easy to miss. Buttons were plain rectangles. |
| Trust signals | 6 | HIPAA-aware handling, a BAA, and client ownership were written down. Visually they were another card row, not a distinct assurance band. |
| Mobile | 6 | The page stacked cleanly and did not overflow. The header dropped every section link and kept only "Book a call." |
| Performance | 7 | Lighthouse mobile: performance 93, accessibility 94, best practices 100, SEO 100. FCP 1.7s, LCP 3.0s, CLS 0. A desktop-viewport run under Lighthouse's default simulated throttling scored performance 63 (FCP 3.0s, LCP 3.6s). Render-blocking Google Fonts were the main cost. |
| Accessibility | 8 | Labels, FAQ buttons, and a reduced-motion rule were in place. Missing a skip link. Muted text on the dark band was the contrast risk. Score from Lighthouse: 94. |

Overall: about 5 as a premium advisory site. A competent brochure. Not yet a page a CFO or operating partner would read as a high-value retainer.

## Top issues

1. New sentences in the old layout. Centered hero, pill label, four stat columns, three-up cards, two-up cards, dark band.
2. No visual of reporting, close, or cash. The offer is BI and the page never shows a reporting surface.
3. Display type is a common italic-serif treatment. It does not feel specific to this firm.
4. Every section has the same weight, so the retainer, the Diagnostic, and the proof do not separate.
5. The Health Check is a long stack of questions with no sense of a step.
6. The header does not change on scroll, and on a phone it does not open the section list.
7. Fonts load from Google on the critical path, which is what pulls the throttled Lighthouse performance down.

## What strong firm sites do that this page did not

- Put the outcome in a left-aligned headline and show the work beside it.
- Use one display face and one sans, with a small set of sizes.
- Hold a spacing scale and let some sections be quiet.
- Use one accent for rules, numbers, and focus, not as a second text color everywhere.
- Make the primary action the consultation, and the second action the qualifier.
- Move in short, eased steps. No looping video, no library.
