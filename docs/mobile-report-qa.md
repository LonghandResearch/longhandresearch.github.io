# Mobile report layout and remaining browser QA

Date: 11 October 2026. Task: WEB-025. Branch: `codex/mobile-report-collisions`.

Codex author QA under the owner's continuing temporary takeover authorization
in `AI_COLLABORATION.md`. The owner requested the remaining browser tests and
reported a collision in the Coal IEA thermal comparison on phones.

## Repairs

- The Coal BPS/IEA comparison uses a native-width layout below 500 CSS pixels.
  Each year has separate BPS and IEA label rows; the legend wraps. Both years
  retain the same zero-based scale and the original series and definitions.
- Coal chart margins separate years, forecast/status labels, price periods and
  axis labels. Open data tables stay inside horizontally scrollable containers.
  The existing shared controller gives overflowing tables keyboard focus and
  accessible region names. Scenario statistics reflow when space is tight.
- AI financial charts measure tick widths, allow room for negative labels and
  keep long values below horizontal bars on phones. Dense five-year labels are
  shown only when they fit; keyboard/touch tips and a collapsible full-value
  table retain every value and missing-year status. Metric changes release
  observers for chart hosts that were replaced.
- The AI simulation separates percentile, market-value and axis labels without
  changing the seeded simulation, distribution, percentile or DCF calculations.
- The IHSG sector axis keeps the zero and positive endpoint distinct at narrow
  widths. Homepage ledger items and the footer wordmark wrap with enlarged text
  spacing. Changed asset URLs include `2026-10-11mobile` to refresh caches.

Catalogue, report data, dates, prose, sources, PDFs, URLs, globe and transition
controllers, generated news, feeds and static publishing workflows are preserved.

## Validation

Playwright ran against the external worktree at `http://127.0.0.1:8765/`.
Both warm-paper and dark themes were tested.

| Check | Coverage | Result |
| --- | --- | --- |
| Public mobile layout | 19 routes, including all 11 reports; 320, 360, 390 and 430 CSS pixels; 152 combinations in Edge | No detected chart-label, control or body-text collisions, viewport overflow or page errors |
| Open tables and text spacing | All 19 routes at 320 CSS pixels, both normal spacing and the WCAG text-spacing override, in Edge, WebKit and Firefox; 228 combinations | No viewport overflow or page errors |
| Changed-page accessibility | Homepage, Coal, both AI editions and both IHSG editions; 320, 844 and 1280 CSS pixels; 108 combinations across all three engines | No axe WCAG A/AA violations or page errors |
| Interactive chart states | Six financial measures at 3Y/5Y, three valuation measures, three simulations, three company dialogs, focus tips, full-value tables, Coal price/map/chain controls and keyboard table scrolling | 594 normal-spacing and 198 expanded-spacing states across all three engines, with no detected SVG label collisions/clipping, viewport overflow or page errors |
| Rendered inspection and rotation | Coal comparison at 390; open table at 320; 320 to 844 to 320 resize; narrow five-year AI chart | Comparison redraws correctly, data table remains open and keyboard-scrollable, no viewport overflow |
| Firefox live public baseline | 19 routes at desktop/phone widths in both themes; 76 accessibility combinations and 46 interaction assertions | Passed, including all five PDF first pages, globe readiness, keyboard navigation, filters and reduced-motion behavior |
| Repository checks | Site checker, syntax checks for all three changed scripts, all `world/tests/*.test.mjs` and `tests/*.test.mjs`, diff whitespace and scoped file review | Site checker passed; 131 tests passed |

The text-spacing override sets line height to 1.5, letter spacing to 0.12em,
word spacing to 0.16em and paragraph spacing to 2em. The 320 CSS pixel checks
exercise reflow equivalent to a 1280 pixel layout at 400% zoom; they do not
certify a physical browser's zoom controls. Geometric collision checks exclude
intentional sticky navigation, globe markers, offscreen/clipped content and
transparent PDF selection layers. Actual PDF canvases were also inspected.

Browser engines: installed Edge 155, Playwright WebKit 26.6 and Playwright
Firefox 157. Firefox initially could not start because Windows did not resolve
its `mozglue` assembly. An isolated runtime copy outside Git now uses the DLL's
own embedded assembly manifest as a sidecar. Executable/DLL SHA-256 hashes match
the original runtime; neither repository dependencies nor Windows settings were
changed. QA scripts, results, browser runtime and screenshots remain outside Git
under the Codex tooling directory.

## Limits and publication verification

These are automated browser-engine tests and rendered desktop previews.
Physical Android/iPhone hardware, branded Safari, VoiceOver and NVDA are not
available in this session and remain unverified. Axe is not a substitute for
manual assistive-technology testing or an accessibility certification.

Publication is checked after merge using the Pages deployment status, byte
comparison of changed public assets, and the mobile chart-state suite against
the live site. Git continues to report permission warnings while cleaning four
old worktree registrations; those unrelated registrations are preserved.
