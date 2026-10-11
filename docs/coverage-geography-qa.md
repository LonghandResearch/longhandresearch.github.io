# Coverage geography and footer atlas QA

Date: 12 October 2026. Task: WEB-029. Branch: `codex/coverage-geography`.

## Meaning of the geography labels

- Library's **Report geography** filter and the country index count only primary country subjects. The current catalogue has Indonesia (10) and United States (2). The existing 9 October IHSG edition is now registered as an Indonesia market update in the discovery graph.
- World counts 12 unique published reports. Country counts can overlap for co-primary subjects; they are not intended to sum to World. The memory-sector report still has no inferred country.
- China, India and the other coal destinations retain their evidence-linked country pages and sector relationships, but appear as **Trade context**, without a focused-report count. Their country page and Coverage panel explicitly distinguish the coal study from a dedicated country report.
- Old context-country Library links remain valid addresses with a **Context only** selection, an explicit explanation, and a link to the country context page. They do not return a misleading dedicated-country report result.
- Sector and company discovery still includes material relationships. Country counts in their geography rail now distinguish primary reports from trade context. Research text, figures, catalogue dates, ratings, PDFs and source records are unchanged.

## Globe and footer

The globe retains three reviewed connections: Indonesia–United States through the co-primary macro study, and Indonesia–China / Indonesia–India through the coal study. No additional decorative country network was added. Arc, trail and travelling-point opacity was reduced in both themes. Only primary countries receive report-count markers in the world view; a selected contextual country receives a Trade context marker. Connection labels use both endpoints' roles in the linked report, so reversing China–Indonesia still says Trade context.

The footer uses a static outline atlas in both themes, with subdued sage ink, a horizontal desktop fade and a vertical mobile fade. It is decorative and encodes no research coverage. `footer-atlas.svg` is derived from the existing Natural Earth public-domain country paths in `assets/js/coal/geography.js`; provenance is recorded in the SVG and `audits/RPT-014-2026-10-08.md`. The map cannot intercept links or add an animation loop.

The wider phone audit also found the new IHSG chart's lowest scale label overlapping its first date. Additional bottom space separates scale and date labels in the shared weekly chart renderer, preserving coordinates, observations, calculations and the existing daily selection controls.

## Codex author QA

- Six changed JavaScript files pass `node --check`. Site validation passes: 59 scripts, 69 JSON files, 12 catalogue entries, 17 sitemap pages and links in 19 HTML pages. All 133 Node tests pass, including a new primary-versus-context graph regression.
- Chromium/Edge, WebKit and Firefox: 240 page/theme/viewport cases pass at 320, 390, 768 and 1280 CSS pixels in both themes. These cover Coverage world/Indonesia/China, Library normal/context links, country index/Indonesia/China, the coal-sector page, and the latest IHSG page. Assertions cover label meanings, counts, filter options, zero focused reports for China, marker roles, footer asset, overflow, control intersections, daily-close selection, browser Back and restored keyboard focus.
- 120 Axe WCAG A/AA audits pass across those pages at 390 and 1280 pixels in both themes, in the same three engines. Visual inspection includes desktop footers in both themes, the expanded phone country drawer, context-country globe, mobile sector rail and the corrected weekly chart.
- All 20 discovery/report routes pass the broader phone collision check at 320 and 390 pixels in both themes: 80 cases with no chart-label intersections, control intersections, text intersections, page overflow or JavaScript errors. This includes all 12 published reports.
- 24 native globe-navigation cases cover Home → Coverage, Home, Back and Forward, both themes, desktop and phone-sized viewports, and normal/4× CPU settings. The painted handoff preserves globe pose, the bridge is removed, and GPU scene creation waits until the transition finishes. Headless scheduling measurements are not a physical-device smoothness benchmark.

These are Codex author checks under the continuing temporary takeover authorization in `AI_COLLABORATION.md`, not independent Claude review. Phone dimensions and browser engines were automated; physical iOS/Android devices were not available. Final publication is checked against the merged asset bytes and the live discovery states.
