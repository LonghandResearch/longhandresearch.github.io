# IHSG 9 October editorial preview

Owner requested a local preview before publication, then explicitly approved
publication on 12 October 2026 after reviewing the report and cover. Validation
is Codex author QA under the temporary takeover authorization in
`AI_COLLABORATION.md`.

## Final scope

- Original hero, report layout and sidebar retained. Tables keep the existing
  typography and rules, with corrected column alignment and compact widths.
- Only the 9 October edition opts into `presentation: refined`.
- Closing chart adds date selection and a readout. Foreign flows diverge around
  zero; sector returns and index contributions use direct labels and lollipops.
  Exact chart observations remain available in expandable tables.
- Narrative, opening paragraphs and assessment boxes share Newsreader, one
  responsive size and weight. Chart numbers use the site's Libre Franklin data
  font. Section labels also use Libre Franklin. No new font dependencies.
- Headlines and prose revised; dense paragraphs split into coherent ideas.
- Four compact source groups retain primary IDX, BI and issuer links. Full
  source notes and methodology remain in the edition JSON and existing audit.
  Internal Flowless branding is omitted from reader-facing text. Estimate scope
  and closing-price valuation remain disclosed.
- `sourceGroups` references existing source keys; `displayMethod` is the short
  reader-facing method. Older editions retain their original renderer.

## Validation

- `node --check assets/js/ihsg-weekly-template.js` passed.
- `node scripts/check-site.mjs` passed: 59 scripts, 69 JSON files, 12 catalogue
  entries, 17 sitemap pages and links in 19 pages.
- All observations, summary statistics, exact table cells and publication/week
  dates equal the audited main edition. Source group references resolve.
- Rechecked all seven supplied file hashes; all five daily closes, official
  foreign flows, regular-market value/volume, total value and breadth; workbook
  JISDOR and previous baseline; weekly headline metrics and table cells; a fresh
  CLI export and 20 database sessions for the five focus names; BRI attribution
  and units. Passed. See `audits/RPT-016-2026-10-09.md` for source reconciliation.
- Original-layout preview checked in both themes at 320, 390 and 1440 pixels,
  across 9 October, 2 October and 25 September editions: 18 cases, no document
  overflow. Older editions do not receive the refined presentation class.
- Final typography checked again at desktop and 390 pixels: one computed font,
  weight, size and line height across narrative/lede/assessment paragraphs.
  Source list has four rows. Desktop chart date selection updates the exact
  reading and pressed state; default Friday restored. Temporary viewport reset.

Local preview: `http://127.0.0.1:8772/ihsg-weekly.html?week=2026-10-09`.
Owner approved publication on 12 October 2026. Deployment is verified after merge.

## Table follow-up

All 11 tables checked: numeric headers and cells align right; dates, names and
issuer definitions align left. Tables with up to three columns are limited to
600 pixels, and other tables to 760 pixels. Simple tables fit 320- and 390-pixel
viewports without horizontal scrolling; dense tables retain accessible scroll
regions. No document overflow or header/body alignment mismatches. Exact cell
values are unchanged. JavaScript syntax and site checks passed. The preview was reviewed before publication authorization.

## Owner-supplied cover

Added the golden-hour Jakarta artwork to the existing LonghandArt cover map for
this edition. Lettering and decorative price figures were removed with the
built-in imagegen edit; responsive WebPs use the same 2:3 composition. Exact
cover title, No. 012 and 11 October 2026 publication date come from the catalogue.
The full JPG export is 1024 × 1536 and uses the actual website fonts/typesetting.
The original Downloads image is unchanged.

Home and Library render the cover through their existing cover component. Home
checked at desktop and 390 pixels with a decoded image and no document overflow.
Library Covers verified visually; mobile Compact renders at 84 pixels with no
document overflow. New WebPs are 397,734, 138,088 and 34,584 bytes (1024, 640 and
320 pixels). Script cache tags updated on the four existing LonghandArt consumers.
Catalogue summary removes internal tool branding while preserving its scope.
JavaScript syntax and site checks passed. The preview was reviewed before publication authorization.

## Publication authorization

Owner explicitly requested publication on 12 October 2026. The source recheck
passed again immediately before publication. Final site checks and the complete
132-test regression suite passed before committing. Prior audited observations,
statistics, financial table cells and publication dates remain unchanged.

Publication PR: https://github.com/LonghandResearch/longhandresearch.github.io/pull/97.
Deployment/live verification follows merge; its completion is recorded in the
PR and the owner’s Obsidian publication notes.
