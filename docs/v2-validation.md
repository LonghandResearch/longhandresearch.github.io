# Longhand V2 local implementation validation

Date: 10 October 2026 (Asia/Jakarta). Codex author QA, with a separate read-only
Codex browser review. This is not independent Claude review.

The owner approved implementation, and explicitly withheld pushing and
publication. Work is on `codex/longhand-v2` in the external MCP-tooling worktree,
based on `9c40705a26aa6f061177bd8c6bd1d7528c1ba4dc`. The owner's watched checkout
remains untouched on `main` at `54df02460f2068185bf381b754d76d1de219b7dd`.

## Automated checks

- `node scripts/check-site.mjs`: 59 JavaScript scripts, 67 JSON files, 11 catalogue
  entries, 16 existing sitemap URLs and links in 19 HTML pages pass.
- `node --test world/tests/*.test.mjs tests/*.test.mjs`: 131 tests pass.
- `node indonesia-ai-datacenter-research/tests/test_interactive.cjs`: all 18 Python
  model scenarios reconcile; zero and invalid-input checks pass.
- `git diff --check`: no whitespace errors.
- The new graph tests check every evidence file/anchor, publication identity,
  geographic count scope, private-draft exclusion and impossible company paths.
- Structured-report tests reject unsafe links, nonfinite values, missing evidence,
  invalid tables, wrong report IDs and duplicate anchors. Supplied text is escaped.

## Rendered checks

Configured Playwright MCP, isolated headless Microsoft Edge. Homepage, Library,
Coverage, Country, Sector, Company, PDF reader, About, Wire and six specialized
report pages were checked at 320, 390, 768, 1024 and 1440 pixels. The tablet
masthead overflow found with local author controls was repaired by extending the
mobile-menu breakpoint to 900 pixels. No remaining root horizontal overflow or
unexpected runtime errors were observed. A deliberate unavailable-week request
returned the expected 404 and unavailable state.

Verified Library search shortcut, query persistence, linked facets, reload, empty
state and Back; Coverage selection, representative markers, correct back-face
occlusion, country focus, rotation controls, reset and Back; and the complete
Country → Sector → Company → Report route. Mobile navigation exposes all four
public destinations and supports Escape. PDF zoom and fit, weekly FX scenario
and reset, Coal country selection, PBAI company selection, and the Indonesia
resource calculator/project filter continue to work. Mobile contents links follow
existing section anchors and close after selection.

A browser-only synthetic structured report verified JSON rendering, exact-value
tables, keyboard chart readout, escaped script text and a failed-validation retry
state. No synthetic report or market data was added to the publication catalogue.

Public-host routing in the isolated test browser verified that Add report,
Publish and Delete remain hidden and that Workspace requires a local host.
No author publication/deletion action was exercised. Reduced motion starts the
globe paused and disables DOM transitions. Instrumented WebGL draw calls stop
when the globe scrolls out of view. The desktop homepage used 22 resources and
about 2.01 MB of locally served encoded data in this run; existing progressive
Earth imagery accounts for about 1.82 MB. These are diagnostic observations,
not a Lighthouse/Core Web Vitals score.

## Owner-requested presentation correction, 10 October

The supplied redesign HTML and Fermat Earth reference informed a quieter dark
hero, thin serif typography and a warm paper theme with green ink. Exactly two
theme choices remain. Homepage, Coverage, Library and the PDF reader now use
editorial exhibit thumbnails and a coherent publication layout. The thumbnails
come from unchanged publications; their origins and scenario caveats are listed
in `assets/img/research/README.md`. No example financial data from the design
references was copied into Longhand.

Codex author QA repeated the 131 automated tests, 18 resource-model scenarios,
all site checks, changed-script syntax checks and diff whitespace checks. Edge
Playwright checked 15 pages at 320, 390, 768, 1024 and 1440 pixels. An additional
dark-theme pass covered the same pages at 390 and 1440; final 320-pixel checks
covered Home, Library, Coverage, PDF reader and the standalone resource study
in both themes. The older 320-pixel header grid was corrected so the logo,
theme switch and menu remain visible. The standalone study now shares the
publication theme preference without changing its calculator controller.

Library search, reload persistence, geography filters, clear and empty states,
mobile navigation and Escape passed. Coverage country selection, Back, reset,
keyboard rotation, reduced-motion pause and Country → Sector → Company → Report
navigation passed. The INET PDF rendered 24 pages; zoom, fit and the reading-rail
anchor passed. The weekly FX lab, Coal country selector, PBAI company dialog and
resource calculator/reset were exercised again. No page errors or root horizontal
overflow remain. Visual screenshots are outside Git in the existing `v2-qa`
directory. Physical device and cross-browser certification remain unperformed.

The catalogue, report files, research datasets, model controllers, deployment
workflows and owner checkout remain unchanged. This correction is a local commit
only; no push, pull request, merge or publication was authorized or performed.

### Editorial motion follow-up

The existing seven research arcs now carry small travelling accents and short
trails, sharing the globe's render loop and pause state. Desktop pointer movement
adds a gentle response across the hero. Public discovery rows and publication
tiles enter once when visible; hover feedback, image movement and the mobile
menu remain restrained. Report headers now show the current document scroll
position. Research figures, chart controllers and calculations remain unchanged.

Content remains visible without animations or JavaScript. Reduced motion cancels
active reveals, removes travelling accents and stops automatic globe movement.
The render loop also reconciles preference changes so rotation stops immediately
when reduced motion is enabled during a session. No additional animation timer
or dependency was introduced.

Edge Playwright checked 60 page/theme/viewport combinations: ten public pages in
both themes at 320, 768 and 1440 pixels, with no root overflow or page errors.
Library search, mobile navigation/Escape, Coverage selection, hover feedback and
the report position indicator passed. Instrumented WebGL recorded zero draws
offscreen and zero draws after switching to reduced motion; active DOM animations
were also zero. Site validation passed for 59 scripts, 67 JSON files, 11 catalogue
entries, 16 sitemap pages and internal links in 19 pages. Changed JavaScript
syntax and diff checks pass. This pass remains local only.

### Portrait editorial cover follow-up

The owner selected vintage editorial reference #3, specified portrait artwork,
retained The Memory War's existing anime cover and requested fewer human figures.
Ten conceptual ink illustrations now accompany the existing anime artwork.
Seven new illustrations have no people; figures remain in INET, the power/water
study and September IHSG. All eleven display in complete 2:3 frames. Homepage
and Library retain their original report links, search, geography and company
relationships. Cover colors remain consistent across the two reader themes.

Headlines and metadata are actual HTML drawn from the catalogue, with Newsreader
and Libre Franklin. A restrained navy print wash supports cream headlines across
clouds. Eleven 1024 × 1536 JPG cover exports and ten WebP illustrations without
lettering are stored under `assets/img/research/covers/`; its README records the
prompt set and provenance. The Memory War source PNG and all PDFs are unchanged.
The reading rail continues to use captures of the original publications.

Edge Playwright checked Homepage and Library in both themes at 320, 390, 768,
1024 and 1440 pixels (20 combinations): every image decoded, every frame retained
its portrait ratio, and generated cover titles/dates matched the catalogue.
No page errors or root overflow occurred. Search, empty state, category filters,
mobile navigation/Escape, geography selection and INET report navigation passed.
Changed-script syntax, site validation and diff checks pass. No research, model,
source or deployment data was modified. This remains a local preview only.

## Preservation and limitations

### Globe atmosphere follow-up

At the owner's request, the dark reading surface is now closer to black, with
slightly stronger city lights and a restrained atmospheric rim. The existing
seeded star field is sparse, static and theme-aware. Newsreader and Libre Franklin
remain the publication fonts; the headline weight was refined without introducing
another font dependency.

Seven subdued arcs are derived from countries discussed together in existing
published research. They are conceptual research relationships, not transport
routes, measured flows, recommendations or invented coverage. Private local
records are excluded. Arc geometry rotates with the Earth, uses depth testing
and shares its existing pause, reduced-motion and offscreen lifecycle.

Playwright checked Home and Coverage in both themes at 320, 390, 768 and 1440
pixels: seven arcs render in each case, with no root overflow or page errors.
Country selection, keyboard control, reset and Back pass. Reduced motion starts
paused; instrumented WebGL recorded zero draws while the globe was offscreen.
Changed-script syntax, four existing graph tests, site validation and diff checks
pass. Research and deployment files remain unchanged; this follow-up is local only.

The catalogue, PDFs, dated research JSON, source registers, financial models,
specialized chart controllers, RSS, sitemap, hourly Wire data, GitHub workflows
and auto-publisher have no implementation diff. Existing specialized report
bodies retain their original markup; additions are stylesheet/script links and
the public presentation hook. No research claims or calculations were revised.

New discovery relationships require curated evidence when future reports are
added; unmapped reports still appear in the full Library. Representative globe
markers do not implement country-polygon hit testing. Existing bespoke reports
retain their individual layouts; structured JSON is an opt-in future format.
The JSON authoring path is a reviewed repository operation, not a CMS.

Cross-browser certification and physical iOS/Android device testing remain open.
Browser evidence and temporary harnesses are outside Git under
`C:/Users/user/.codex/tooling/longhand-mcp/v2-qa/`; primary visual screenshots are
in the parent tooling directory. The local preview is served at port 8765.
