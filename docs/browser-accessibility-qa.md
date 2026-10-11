# Public browser and accessibility QA

11 October 2026. Codex author QA for WEB-024, under the owner's continuing
authorization while Claude is unavailable. This is not an independent Claude
review or a WCAG certification.

## Verified defects and repairs

- Small warm-paper labels did not meet 4.5:1 contrast on inset reading surfaces.
  The secondary ink is slightly darker. Coal cycle captions and negative
  sensitivity values, resource-study units and the electricity-overhead label
  also receive targeted contrast corrections.
- The resource study's shared report context fell back to a light-theme color
  in dark mode. It now inherits a secondary ink appropriate to each theme.
- Two usable project buttons in the AI infrastructure report stayed at 25%
  opacity because their locations were undisclosed. Their text is now fully
  readable; the research status, dates, capacity figures and map placement do
  not change.
- Narrow charts and scenario tables lacked a keyboard scrolling target. The
  shared report context makes an overflowing wrapper a named, focusable region.
  Resize and content changes update it, and the extra tab stop is removed when
  the content fits. Existing report-managed focus attributes are preserved.
- The homepage's empty marker container had an accessible name on a generic
  element. It is now hidden from assistive technology. Coverage's marker group
  retains a valid role and name. Manual review also adds explicit grouping roles
  to named filter, scenario and publication-summary containers, preserving their
  controls and contents.

Updated asset query versions prevent older CSS and controllers remaining cached.
The changes retain the existing visual direction and traveling globe. No
research facts, catalogue records, source data, calculations, PDFs, publishing
scripts or workflows change. QA dependencies and browser artifacts stay outside
Git in the external tooling directory.

## Local browser results

The final static accessibility matrix used axe-core 4.14.0 with WCAG 2 A/AA,
2.1 AA and 2.2 AA tags, reduced motion, loaded fonts and the first rendered PDF
page. It covers eight discovery routes and all eleven publications in dark and
warm-paper themes at 1280 × 900 and 390 × 844.

- Edge 155/Chromium: 76 combinations, zero detected violations, page exceptions or
  horizontal overflow. One long matrix run timed out awaiting a report heading;
  fresh-context checks of that report and the remaining report passed, including
  their rendered PDFs. This timeout was not reproduced as a website defect.
- Playwright WebKit 26.6: 76 combinations, zero detected violations, page exceptions
  or horizontal overflow. All five PDF reports rendered a first page.
- 46 interaction assertions in each engine (92 total): skip-link activation,
  mobile menu, Escape and focus restoration, Home to Coverage, keyboard globe
  rotation and pause action, country selection, World reset, search shortcut,
  empty-state recovery, filter focus, Back state, geography URLs, arrow-key chart
  scrolling, responsive tab stops and reduced-motion navigation.
- The existing Edge traveling-globe regression suite passed all 24 flights,
  including both themes, phone width, 4× CPU slowdown and history navigation.
- The site checker passed: 59 scripts, 67 JSON files, eleven catalogue entries,
  sixteen sitemap URLs and links in nineteen pages. All 131 automated tests
  passed. Changed JavaScript parses and the diff has no whitespace errors.

Initial audits were performed before repairs. Full text contrast below the
threshold, semantic naming and scroll focus findings above were reproduced in
both engines where applicable. A cancellation reported while leaving a PDF
before its module loaded was absent when the matrix waited for its first page.

## Globe performance

At desktop and phone widths, Home and Coverage continue drawing when visible,
stop scheduling the Earth loop after leaving the viewport, resume when brought
back, and settle to zero Earth-loop callbacks with reduced motion enabled.
These four lifecycle checks passed. Phone textures use the existing 2048px
refinement rather than the 4096px desktop map, and device pixel ratio remains
capped at two. No renderer tuning was needed from this evidence.

RAF counts on the test computer are not a universal frame-rate guarantee.
Physical phone GPU load, sustained battery use and memory pressure have not
been measured. The navigation regression tests verify frame continuity and
cleanup, not flawless animation under every device condition.

## Remaining limits

Playwright WebKit on Windows is useful engine coverage; it is not physical
iPhone Safari or macOS Safari. Real Android/iPhone devices, VoiceOver/NVDA and
zoom/contrast under individual accessibility settings remain manual checks.
Automated checks cannot judge every chart or text label over a photograph or
canvas; those uncertain contrast results remain manual review items.

Firefox could not launch in this Windows environment. Reinstalling the configured
browser and trying a separate stable Playwright runtime both failed. The
Windows SideBySide event reports an unresolved `mozglue` assembly. No global
Windows settings or runtimes were altered to work around it. Firefox therefore
remains unverified, rather than counted as a pass.
