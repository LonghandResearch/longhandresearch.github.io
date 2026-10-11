# Longhand navigation continuity

11 October 2026. WEB-023, `codex/transition-continuity`, based on `2d2cab2`.
Codex author QA under the owner's continuing repair/publication authorization
and the temporary takeover in `AI_COLLABORATION.md`. This is not independent
Claude review. All browser tests use isolated contexts and suppress analytics.

## Repairs

The owner requested retaining the spatial Home/Coverage globe transition.
Animating a newly initialized WebGL canvas can produce an empty snapshot,
restart the surface orientation and compete with navigation for GPU setup.

Home and Coverage now carry one painted square frame and the surface orientation
through a one-use, bounded session-storage record. The native transition moves
the outgoing painted snapshot to the incoming globe's position. Both crops use
the same surface-to-frame ratio, preserving the circle instead of stretching it.
The rim is masked softly so the carried image has no rectangular edge.
The new three.js import, texture decoding and GPU scene setup wait until the
flight finishes. The carried image stays visible until the first live draw;
the live scene takes over at the same orientation, then resumes normal rotation
or the selected-country focus. The image contains no research or credentials.

Source title selection now uses the activated link. A reproduced Coverage
sector click previously named the country heading `Indonesia`; it now names
the selected sector. Country-heading reuse is restricted to visible country
navigation, so offscreen headings cannot provide a misleading animation origin.

Country, Sector and Company render their existing synchronous content before
the arriving snapshot (`defer blocking="render"`). If an asynchronous weekly
edition still lacks its heading, its native transition is skipped: the loading
state remains usable rather than animating a blank title. This does not wait
indefinitely for data or add invented report content.

The approach follows the native `pageswap`/`pagereveal` timing documented in
[Chrome's cross-document transition guide](https://developer.chrome.com/docs/web-platform/view-transitions/cross-document).
Public routes, ordinary links, report bodies, figures, dates, sources, PDFs,
news generation and static publishing are unchanged.

## Browser checks

Edge/Chromium with Playwright, saved warm-paper/dark preferences, desktop
1280 × 900 and phone-sized 390 × 844 at DPR 3. Navigation readiness checks also
run with 4× CPU throttling. These are browser emulations, not physical phones.

- 140 public navigation assertions: Home, Coverage, Library, Wire, About,
  Country, Sector, Company, every one of the eleven reports, and return history.
  The normal native snapshots have populated headings; no horizontal overflow,
  stranded frame or page JavaScript exception was found. The four weekly-edition
  transitions skipped intentionally while their data was still loading.
- 24 globe flights: Home → Coverage, Coverage → Home, Back and Forward,
  in both themes, desktop at normal/4× CPU and phone viewport at 4× CPU.
  The incoming named frame is square. Each arriving live surface orientation
  matches the carried orientation within 0.00001 radians. New live draws occur
  after the native flight finishes; the carried element is subsequently removed.
- Mid-flight screenshots inspected in both themes: the painted outgoing globe
  remains visible while moving, with no blank incoming canvas crossfade.
- Real Back/Forward-cache restoration checked with that cache enabled. A theme
  change before returning to Home retains the saved theme and traveling frame.
- Reduced motion, denied handoff storage, blocked three.js, delayed three.js,
  disabled WebGL and Save-Data retain usable page navigation and cleanup.
  With a delayed renderer, the decoded carried frame remains visible until ready.

- 24 additional assertions verify the source element for Coverage → Sector,
  Sector → Company, Company → Report and Library → Report in both themes and
  viewport sizes, plus filtered-Library return. Malformed JSON, stale records,
  corrupt image data and mismatched themes are consumed without hiding the live
  globe or leaving a carried frame behind.
- Resizing to a phone viewport during flight, enabling reduced motion during
  flight, and following a related PDF report also complete without an exception,
  overflow or stranded carried frame.

## Automated checks and limits

`node --check` passes for `assets/js/v2.js`, `assets/js/earth.js` and
`assets/js/coverage-map.js`. `node scripts/check-site.mjs` checks all 59 scripts,
67 JSON files, 11 catalogue entries, 16 sitemap pages and links in 19 pages.
All 131 tests pass with `node --test tests/*.test.mjs world/tests/*.test.mjs`.
`git diff --check` passes. No research/data files are changed.

Headless CPU/frame timing includes browser automation and scene setup; it is
not evidence of a universal frame rate. Physical-device GPU performance and
Safari/Firefox have not been verified. Browsers without native cross-document
transitions retain ordinary navigation. Network failure can leave the globe
unavailable while research links remain usable. The asynchronous weekly loading
fallback deliberately has no shared-title flight until content exists.
