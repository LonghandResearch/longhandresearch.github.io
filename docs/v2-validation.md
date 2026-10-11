# Longhand V2 implementation and publication validation

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

### Transparent editorial controls — 11 October 2026

Following the owner's broader visual feedback, the owner specified plainer,
transparent tabs and labels with a modern, retro/classic character. This pass
removes opaque marker badges, rectangular rotation/reset controls, filled
Coverage steps, boxed Library view switches and relationship chips. Transparent
surfaces use fine rules, readable text and a restrained active accent. Newsreader
and Libre Franklin remain the publication families; existing portrait artwork,
research wording and data are unchanged.

Coverage's opening and country navigation now share a left column beside the
globe, with the research summary below. The former overlapping layout and
accumulated media overrides were consolidated. Mobile places the globe between
the introduction and country navigation. Globe labels use serif type, a small
geographic dot and a subtle underline, with theme-specific text shadows for
legibility. Rotation and reset retain 44-pixel targets and now use small stroke
icons. Dynamic rotation labels update their span without removing the icon.

The shared masthead, Homepage research action, Library controls, PDF actions and
interactive scenario/period controls follow the same transparent treatment.
Chart panels retain their original plotting palettes; active controls remain
distinguishable through underline and text color. Author forms and destructive
tools retain their existing control behavior.

Edge Playwright passed 90 combinations across 15 routes, both themes and 320,
768 and 1440 pixels, with no root overflow or page errors. Additional screenshots
at 390 pixels were inspected along with desktop Home, Coverage and Library.
Computed backgrounds were transparent for normal and selected globe labels,
Coverage steps, globe controls, active Library Compact and interactive chart
controls. Marker selection, rotation/pause label and icon, reset, keyboard focus,
44-pixel targets, Library search/Compact and mobile Menu/Escape passed. Script
syntax, site validation and diff checks passed.

Research, PDFs, original art, chart models/controllers, feeds, sitemap and
publication workflows have no diff. The owner's main checkout remains clean at
`54df02460f2068185bf381b754d76d1de219b7dd`. Screenshots are outside Git in `v2-qa`.
Safari/Firefox and physical devices remain unverified. This pass is local only,
with no push, PR, merge or publication.

### Visual audit refinements — 11 October 2026

The owner authorized all visual audit corrections and subsequently requested a
cleaner footer and World → Country → Sector → Company → Report pathway. The
visible NASA explanatory caption and opening hero dash were removed as requested.
Accessible globe guidance and the existing research disclaimer remain available.

The globe now emphasizes seven documented regional relationships with lower,
less opaque arcs. Warm paper land/water contrast is stronger. All documented
global connections remain discoverable through the country list. The footer has
a publication identity, two clear navigation groups and a quieter map treatment;
its mobile layout avoids the inherited disclaimer flex basis that created an
unnecessary blank area. Coverage's five numbered navigation steps preserve the
selected country through sector/company indexes and the report Library. Narrow
screens use three columns rather than splitting words inside the steps.

Publication metadata, controls and breadcrumbs are more readable. Library now
offers Covers and Compact modes, both retaining portrait artwork and all original
report links. Mode, search and geography survive reloads and history navigation.
Responsive artwork variants reduce image transfer at smaller display sizes, and
a restrained paper wash supports dark cover headlines. Eleven 1024 × 1536 JPG
presentation exports were regenerated; source artwork and catalogue titles/dates
remain unchanged. The existing Memory War anime cover remains complete.

Wire renders 24 headlines initially and reveals the next batch on request while
search and topic counts cover the complete dataset. The PDF reader offers a
mobile Larger view / Fit to width control; enlargement scrolls within the viewer
without widening the page. Bespoke report surfaces inherit the reader theme, and
the Power Behind AI title scale is less oversized. Chart models and controllers
were not changed.

Edge Playwright inspected 90 page/theme/viewport combinations across 15 routes
at 320, 768 and 1440 pixels. A 320-pixel Homepage ledger overflow was corrected;
32 affected-page combinations at 320, 390, 768 and 1440 then passed with no root
overflow. Twelve additional Coverage/entity combinations passed after the
context-preserving navigation change. No page errors were observed. Rendered
screenshots were inspected for both themes, portrait covers, Coverage and footer.

Interaction checks passed for mobile Menu/Escape, persisted theme switching,
country selection and contextual paths, Library search and Compact reload,
Wire 24 → 48 → all 240 unique source links, topic/reset/empty states, the Coal
annual chart toggle, and PDF enlargement to 175% and back to fit. A fresh 390-pixel
browser context selected the 320-pixel cover asset in Compact mode. All eleven
cover images decoded, and exported cover frames are 1024 × 1536. Four existing
research graph tests, syntax checks on all eight changed scripts, site validation
(59 scripts, 67 JSON files, 11 catalogue entries, 16 sitemap pages and links in
19 pages) and diff checks passed.

This pass is local to `codex/longhand-v2` in the external worktree. The owner
checkout remains clean on `main` at `54df02460f2068185bf381b754d76d1de219b7dd`.
Research/PDF/data files, RSS, sitemap and deployment/auto-publish workflows have
no diff. Browser evidence remains outside Git in `v2-qa`. Physical devices and
Safari/Firefox remain unverified. No push, PR, merge or publication was performed.

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

### Quieter separators and substantive atlas links — 11 October 2026

Owner brief: reduce decorative rules, remove the visible Pause rotation control,
replace the homepage atlas-caption strip, refine the globe and plain labels,
connect only strongly related research geographies, and use upright Wire type
with institutional introductory copy. The homepage now uses ambient rotation
without drag, pointer tilt, scroll parallax or a keyboard-button role; Coverage
retains geographic selection, drag, keyboard rotation and World view reset.
Reduced motion remains respected on both pages.

Rules remain at major section boundaries, data rows, inputs and active choices.
Repeated country/sector/control underlines, cover-grid rules, ledger dividers
and the second footer rule were removed. Globe labels are small, transparent
sans-serif annotations without boxes or underlines. The homepage caption and
its rule were removed; Coverage is linked beside the Library action instead.
Warm paper uses NASA surface texture, shaded ivory land and sage seas.

The arc policy now draws three substantive relationships: Indonesia–China and
Indonesia–India from the coal study's existing BPS destination register, and
Indonesia–US from the co-primary monetary-policy report. It no longer selects
seven shortest links or treats every material country mention as an arc.
Country selection filters this subset; Viet Nam, for example, has no qualifying
arc. Both ends must be on the readable hemisphere, preventing isolated horizon
loops and lines pointing to hidden countries. No volume, measured financial
correlation or transport route is encoded. The full research index is unchanged.
Future material arcs require an explicit reviewed selection and an existing
published graph relationship; co-primary links derive from the graph.

Edge Playwright inspected 60 combinations across Home, Coverage, Library, Wire,
About, country, sector, company, PDF Report and Coal at 320, 390 and 1440 pixels
in both themes, with no root overflow or page errors. After the final hemisphere
filter, the light Coverage screenshot was inspected again: two regional arcs
are visible at opening, while the third connection remains behind the Earth.
Marker selection, context-preserving sector links, Back, World view reset,
CN/VN/US eligible counts (1/0/1), keyboard rotation, theme switching, Compact
Library/search, upright Wire title, institutional copy and Menu/Escape passed.
WebGL instrumentation confirmed ongoing ambient drawing in normal motion,
zero additional draws after textures settle with reduced motion, and zero draws
once the stage is outside the viewport. Homepage semantics are an image, with
no tabindex or pointer interaction. Checks on both changed scripts, four existing
research-graph tests, site validation and diff whitespace passed.

All research bodies, catalogue entries, PDFs, dated data, source registers,
financial calculations, news data, RSS, sitemap and publishing workflows remain
unchanged. Specialized report HTML changes only refresh stylesheet version tags.
Screenshots stay outside Git under `v2-qa`. Owner checkout remains clean on main
at `54df02460f2068185bf381b754d76d1de219b7dd`; this work remains local to the
external worktree's `codex/longhand-v2` branch. Physical-device and Safari/Firefox
checks remain open. No push, PR, merge or publication was performed.

### Homepage ambience and public typography — 11 October 2026

Owner brief: give the homepage globe more life, then inspect public wording,
decorative semicolons, slashes and italic type. Homepage-only shader adjustments
warm the existing NASA city lights and strengthen the rim slightly. Warm paper
uses the same urban texture as faint ink. The seeded star field is denser but
remains a single canvas drawing, without a twinkling loop. No new map markers,
relationships, textures, dependencies or animation controllers were added.
The three substantive arc pairs remain CN–ID, ID–IN and ID–US.

Public headings, subheadings, company labels and reading-rail captions now use
upright type. About has a direct title and introduction. Breadcrumbs use chevrons,
nonhierarchical metadata uses quiet dots, and numbered report sections no longer
need slashes. Coal and the resource study have presentation-label punctuation
edits only. Source periods, units and source links retain their meaning.
Catalogue blurbs and reader summaries turn semicolons into sentence breaks at
display time, preserving the original records. HTML entities remain intact.
Financial ratios such as EV/EBITDA, energy units and the search shortcut keep
their meaningful slashes. Original PDFs and research claims are unchanged.

Playwright checked 14 routes at 390 and 1440 pixels in both themes, with no page
errors, root overflow or italic headings/subheadings. The initial sweep found
remaining Library and specialized-report labels; those were corrected and
rechecked. About and Library also fit at 320 pixels in both themes. All eleven
covers loaded as portrait images in their existing 2:3 frames. Compact/Covers,
ADRO search, clear search, the slash shortcut, Menu/Escape and theme persistence
passed. Summary formatting preserved every numeric token in the catalogue.
Numeric tokens in both edited research-page bodies also match the baseline.
Desktop screenshots of both homepage themes and About, Library desktop and
mobile Compact screenshots were visually inspected. Evidence remains outside
Git in `C:/Users/user/.codex/tooling/longhand-mcp/v2-qa/`.

WebGL instrumentation confirms continuous drawing during normal homepage motion,
zero additional draws after textures settle with reduced motion, and zero draws
offscreen. The homepage stage remains an image without a tabindex or pointer
interaction. There were no shader errors in either theme. Syntax checks passed
for all ten changed scripts, the four existing graph tests passed, and site
validation passed for 59 scripts, 67 JSON files and all catalogue/sitemap links.
Diff checks passed. Catalogue files, PDFs, research data, source registers,
models, news data, feed, sitemap and publication workflows have no diff.

This is Codex author QA for the existing local V2 branch. The owner checkout
remains clean on main at `54df02460f2068185bf381b754d76d1de219b7dd`.
Physical-device and Safari/Firefox verification remain open. No push, PR,
merge or publication was performed.

### Editorial composition and reading preview — 11 October 2026

The owner approved the proposed design development and requested a local
preview. This pass implements the first priorities: Homepage composition and
Report reading. Latest research now presents the newest catalogue entry as a
larger portrait edition, with three companion publications. The titles, order,
dates, subject labels and destinations come from the existing catalogue.
Tablet and mobile compositions preserve portrait artwork and readable text.
Image size hints follow each placement without new assets or dependencies.

The PDF reading rail reuses the existing publication jacket, with transparent
Overview, Full report and Library links. Its active location follows the
reading position. A duplicate Library link is hidden only when that rail exists.
The original Memory War cover remains intact. On smaller screens the jacket
yields space to the report text and the navigation remains available. Narrative
paragraphs use a 65-character measure, 18–20px type and ragged-right alignment,
with more room around native exhibits. Source notes, tables and model controls
retain their existing typography and data.

Playwright checked 32 page/theme/viewport combinations: Home and PDF Report
at 320, 390, 768 and 1440px in both themes, plus Library, Coal, PBAI and the
October weekly edition at 390 and 1440px in both themes. No page errors or root
overflow were observed. Additional mobile probes of the October PBAI supplement,
September weekly edition and resource study fit without overflow. All eleven
Library covers loaded in 2:3 frames. All five PDF jackets matched their reports,
including the original anime cover. The four Homepage entries exactly match
catalogue order, titles and links, and the lead opens the Coal report.

Overview/Full report navigation and active states, PDF zoom (100–110–100%),
ADRO search, clear search, Covers/Compact switching and theme persistence passed
on desktop and mobile. Desktop and mobile screenshots of both Homepage themes
and the PDF reader, the tablet composition, and representative research sections
were visually inspected. Screenshots remain outside Git under
`C:/Users/user/.codex/tooling/longhand-mcp/v2-qa/edition-*`.

All changed JavaScript passes syntax checks. Site validation passed for 59
scripts, 67 JSON files, 11 catalogue entries, 16 sitemap pages and links in 19
pages. Diff whitespace checks passed. Specialized report HTML edits refresh
asset versions only. Catalogue records, PDFs, research bodies, financial data,
source registers, model code, news, feed, sitemap and deployment workflows have
no changes in this pass. Homepage globe rendering, ambient rotation and the
three substantive research connections are preserved.

This is Codex author QA for the local `codex/longhand-v2` branch in the external
worktree. The owner checkout remains clean on main at
`54df02460f2068185bf381b754d76d1de219b7dd`. Physical-device and Safari/Firefox
verification remain open. No push, PR, merge or publication was performed.

### Coverage atmosphere preview — 11 October 2026

At the owner's request, the empty space around the Coverage globe now carries
a seeded star field with a few faint light accents. Warm paper uses the same
positions as subdued green ink stippling. A very low-opacity background wash
softens the globe's surroundings. The canvas is decorative, ignores pointers
and redraws only when its dimensions, pixel ratio or theme change; there is
no new animation loop, timer, image asset or dependency.

World view labels China and India alongside the primary research geographies.
These additional endpoints and the transparent connection shortcuts below the
globe derive from its accepted connection pairs, rather than every country in
the graph. Each shortcut identifies its supporting publication in its title
and accessible label, selects the linked country and transfers keyboard focus
to that country's tab. Selection narrows both the endpoints and shortcuts.
Countries without a qualifying arc have no connection shortcuts.

The marker layout prioritizes the selected country and tries the other side
of a point when labels collide. If neither side fits, an additional label
collapses to its point; overlapping secondary targets can be omitted while
the country selector and connection shortcuts remain available. Hover or
keyboard focus reveals compact labels. Mobile label padding is reduced while
retaining 44px minimum targets. Hidden marker selection attributes also reset
when the country changes. Homepage globe behavior and rendering are unchanged;
its HTML only refreshes the shared script cache key.

Playwright checked 60 combinations: World, Indonesia, United States, China,
India and Viet Nam at 320, 390, 768, 1024 and 1440px in both themes. No page
errors, horizontal overflow, overlapping visible targets, off-viewport labels
or incorrect arc/shortcut selection were observed. Keyboard shortcut and
marker selection retain appropriate focus; Back, World reset, publication
titles, theme persistence, theme recoloring and canvas resizing passed. Labels
also stayed separate over 24 manually rotated positions at 320 and 1024px.
Representative desktop/mobile screenshots were visually inspected under
`C:/Users/user/.codex/tooling/longhand-mcp/v2-qa/atmosphere-*` outside Git.

Instrumentation confirmed no canvas redraws while idle and no ongoing WebGL
draws after imagery settled with reduced motion. Ordinary globe rotation still
draws, and drawing stops offscreen on Coverage and Home. The Homepage remains
an ambient image without a tabindex. With WebGL unavailable, Coverage hides
the globe and preserves country context and report links without overflow at
390 and 1440px.

Both changed scripts pass `node --check`. All four research-graph tests pass;
site validation passed for 59 scripts, 67 JSON files, 11 catalogue entries,
16 sitemap pages and links in 19 pages. The globe's accepted pairs remain
CN–ID, ID–IN and ID–US. No research content, financial figures, dates, sources,
PDFs, catalogue or graph records, news, RSS, sitemap or publishing workflows
were edited. This is Codex author QA in the external `codex/longhand-v2`
worktree. Physical-device and Safari/Firefox verification remain open.
No push, PR, merge or publication was performed.

### Coverage reading and selection preview — 11 October 2026

The owner approved the proposed Coverage refinement and requested a preview.
The country selector now sits above the atlas. Selected geography, derived
counts and recent portrait editions appear beside the globe on desktop,
followed by the relevant sector links. Numbered navigation is simplified to
ordinary context-aware links. Mobile has a smaller atlas and a View research
anchor to reach the selected context without searching down the page.

The country counts, report order, companies and sector relationships still
derive from LonghandGraph and the published catalogue. Primary and related
geographies remain explicit, including zero primary-subject reports. Country
counts link to the existing filtered Library, sector and company indexes.
Existing cover assets are reused. No reports, relationships, dates or financial
observations were added or edited.

Globe labels use upright serif names, a small publication count and a point,
with no background panel. Secondary labels yield to the selected geography and
reveal on hover or keyboard focus. Labels reverse direction near the stage
edge. Marker buttons are retained across selection instead of replaced, so
keyboard activation preserves focus. These updates use the existing globe RAF.
Rendering, textures, selection orientation and the three substantive connection
pairs (CN–ID, ID–IN, ID–US) are unchanged. Countries without a qualifying arc,
such as Viet Nam, continue to show zero active arcs.

Playwright checked 40 combinations: World, Indonesia, United States and China
at 320, 390, 768, 1024 and 1440px in both themes. No page errors, root overflow
or incorrect derived counts/report order were observed. Selected labels stayed
within the viewport, and headings remained upright. Desktop/mobile selection,
keyboard marker focus, disclosure selection, Back, World view reset, country-
scoped sector/company destinations, report links and theme persistence passed.
The mobile results anchor showed the heading below the sticky masthead. An
invalid country recovered through the selector. Secondary label focus and the
final two-column tablet sector layout were also checked in both themes.

WebGL instrumentation verified continued drawing during ordinary motion and
zero additional draws after textures settled with reduced motion, on Coverage
and Home. Both stop drawing offscreen. The Homepage remains an ambient image
without a tabindex. With WebGL unavailable, the atlas hides and the country
context and report links remain usable at 390 and 1440px without overflow.
Representative World, Indonesia, China, tablet and mobile screenshots were
visually inspected. Evidence remains outside Git under
`C:/Users/user/.codex/tooling/longhand-mcp/v2-qa/atlas-reading-*`.

Both changed scripts pass syntax checks, all four existing research-graph tests
pass, and site validation passed for 59 scripts, 67 JSON files, 11 catalogue
entries, 16 sitemap pages and links in 19 pages. Diff checks passed. Research
bodies, catalogue, source records, PDFs, graph data, models, news, RSS, sitemap
and publication workflows have no changes in this pass. Index HTML only
refreshes the shared globe script version.

This is Codex author QA, committed locally on `codex/longhand-v2` in the external
worktree. The owner checkout remains clean on main at
`54df02460f2068185bf381b754d76d1de219b7dd`. Physical-device and Safari/Firefox
verification remain open. No push, PR, merge or publication was performed.

### Warm-paper Coverage globe preview — 11 October 2026

The owner requested a livelier warm-paper globe. Coverage now uses the existing
NASA terrain, water mask and settlement imagery for warm land relief, shaded
sage seas and fine coastal ink. A translucent cloud layer drifts on the existing
globe timeline. Quiet bronze connection accents and a short, two-cycle selected
location ring give the paper atlas more presence without new geography or data.
Reduced motion disables the ring animation and stops settled WebGL rendering.

Playwright checked World, Indonesia, United States, China, India and Viet Nam
at 320, 390, 768 and 1440px in warm paper, including a DPR 2 mobile context.
No page or shader errors, root overflow, off-viewport labels or overlapping
visible marker targets were observed. The existing arc pairs and selected
country counts stayed correct. Keyboard selection, Back, theme persistence,
normal animation, reduced motion and offscreen rendering suspension passed.
Desktop World, mobile World and United States screenshots were inspected.

The Homepage paper regression screenshot was byte-identical. Dark Coverage
had only negligible shader compilation rounding differences (at most 2/255
in a few pixels), with no intentional design change. Evidence is outside Git
under `C:/Users/user/.codex/tooling/longhand-mcp/v2-qa/paper-globe-*` and the
before/after globe screenshots in the same folder. Syntax and diff checks
passed. Site validation passed for 59 scripts, 67 JSON files, 11 catalogue
entries, 16 sitemap pages and links in 19 pages.

This is Codex author QA in the external worktree on `codex/longhand-v2`.
Research content, catalogue, graph records, financial figures, dates, sources,
PDFs, news and publishing workflows were not edited. Physical-device and
Safari/Firefox verification remain open. No push, PR, merge or publication.

### Homepage open globe composition — 11 October 2026

The owner requested a livelier Homepage and a solution for the globe's straight
upper and lower cuts without shrinking it. The opening masthead is transparent
and overlays the hero. The hero is tall enough to hold both vertical curves,
with no globe opacity mask or bottom overlay hiding its silhouette. The globe
retains its existing rendered diameters: 901.6px on wide desktop, 828px at
medium widths and 552px on mobile. Deliberate horizontal cropping remains at
the page edge. The tradeoff is a taller opening scene and research farther down
the page. The owner can assess this composition in the local preview.

The large Earth is positioned beside the copy on desktop and in normal flow
below the introduction at tablet/mobile widths. Wrapped copy therefore cannot
collide with the globe. The ledger's extra horizontal rule is removed. The
masthead regains an opaque reading background after scrolling or opening the
mobile menu. Existing copy, Newsreader typography, portrait editions, publication
counts and report destinations are retained.

The warm-paper relief treatment is now shared by Coverage and Home: real NASA
terrain and settlement detail, sage seas, translucent warm clouds and bronze
connection accents. Homepage dark surface and cloud detail are slightly clearer.
Stars remain seeded and drawn on resize/theme changes. There is no new animation
loop, interaction, fabricated geography or additional arc. The Homepage globe
remains an ambient image without drag, pointer tilt or a tabindex. The three
substantive pairs remain CN–ID, ID–IN and ID–US.

Playwright checked 20 viewport/theme combinations: 320, 390, 768, 900, 1000,
1024, 1100, 1280, 1440 and 1920px in both themes, including DPR 2 at 390px.
No page/shader errors or root overflow were observed. Both vertical curves
fit within the hero, with the existing radius and no opacity mask. Stacked
layouts leave at least 48px between the copy and the globe surface. Representative
desktop, tablet and mobile screenshots were visually inspected. Four original
latest-edition artworks loaded successfully after scrolling.

At 390 and 1440px, normal WebGL drawing, reduction to a still globe, motion
resumption and offscreen drawing suspension passed. Theme switching, persisted
dark/light preferences across reloads, the Library destination and Back passed.
Mobile menu opening, Escape/focus behavior and opaque menu/scrolled navigation
passed. With WebGL disabled, the unavailable globe hides, the hero contracts,
and both discovery links remain usable without overflow.

Coverage regression screenshots show only negligible shader compilation
rounding: at most 1/255 in warm paper and 2/255 in dark on a few pixels. Coverage
styling and interactions were not intentionally changed by this Homepage pass.
Evidence is outside Git under
`C:/Users/user/.codex/tooling/longhand-mcp/v2-qa/home-final-*` and
`coverage-home-regression-*`. The changed JavaScript passes `node --check`.
All four existing research-graph tests pass. Site validation passed for
59 scripts, 67 JSON files, 11 catalogue entries, 16 sitemap pages and links in
19 pages. Diff whitespace checks passed.

This is Codex author QA in the external `codex/longhand-v2` worktree. Report
bodies, financial figures, dates, sources, catalogue, PDFs, graph records, news,
RSS, sitemap and deployment/publishing workflows were not edited. The owner
checkout remains clean on main at `54df02460f2068185bf381b754d76d1de219b7dd`.
Physical-device and Safari/Firefox verification remain open. No push, PR, merge
or publication was performed.

### Public navigation and interaction audit — 11 October 2026

The owner requested a thorough bug pass with immediate fixes. This pass retains
the approved visual composition and both themes. Legacy header/list entrances,
the masthead's old camera zoom and the canvas's separate loading fade no longer
run over the V2 navigation snapshots. Scroll/filter reveals remain available
after navigation. Transition flags clear on completion, cancellation and Back.

The mobile masthead now reserves its final height before the menu initializes.
The expanded navigation remains available with JavaScript disabled. Coal's
early script sets the same JavaScript flag as the other public pages. Wire
reserves its folio, topic controls and reading area while loading, exposes a
busy status, keeps controls disabled until data settles and displays useful
empty/error states. Topic selection is retained when its result count is zero.
The stored news file and hourly workflow were not edited.

Library and Wire flush pending search text before a link navigation. Back
therefore retains text entered immediately before leaving. Clearing Library
filters restores search focus. Report context/reading-rail Library links return
to the originating filtered archive and its scroll position, including an
archive fragment and any later in-report anchor history. Modified clicks retain
the archive URL; direct report entry still links to the complete Library.

The standalone resource study's Home/Library links stay on the current origin.
Its stored theme applies before painting. Its navigation opt-in is declared
inline before external styles arrive: the previous external-only declaration
could leave the incoming transition disabled at first render. Skipped transition
promises are handled before the calculator scripts run. Four normal-motion
round trips at 390/1440px in both saved themes passed after this correction.
Shared changed asset versions were refreshed in all 15 importing HTML pages.

Playwright checked 138 direct route/viewport/theme combinations: 23 routes at
320, 768 and 1440px in both themes. These include discovery pages, entity indexes
and filtered contexts, all 11 published reports, About, Wire and the 404 page.
No unexpected script/network errors, document overflow, duplicate IDs or broken
in-page anchors were observed. Representative tablet/desktop screenshots in
both themes and mobile screenshots were inspected. All 11 Library artworks
loaded and retained portrait proportions, including the original Memory War.

Actual click flows at 390/1440px checked navigation, Back, stored themes, normal
and reduced motion, geography selection and World reset, and the path from
Indonesia through coal and Alamtri to its report. Library search/highlighting,
category/facet counts, Covers/Compact, no-results/reset and immediate-navigation
state recovery passed. Wire topic/search recovery, 24-to-48 pagination and the
final 240-headline batch passed, with focus on the first newly revealed story.
Delayed, failed and empty Wire responses retained usable navigation and explicit
status messages. Invalid entity/report/week addresses provided recovery links.

PDF checks covered zoom, mobile Larger view, fullscreen entry/exit, selectable
text and an HTTP 200 download. Copy-link behavior was verified with an isolated
clipboard stub rather than changing the owner's clipboard. Interactive controls
were exercised on all six HTML studies at 390/1440px: scenario ranges/reset,
period/market/company/risk selection, update sorting/stock selection, the resource
diagram and project filters. No page errors, non-finite output text or document
overflow were observed. The company dialog opened, closed with Escape and
returned focus. Contents links closed their disclosure and exposed headings
below the masthead. A final normal-motion Library click through every published
report completed all 11 transitions without errors or stale transition flags.

All 131 existing automated tests pass after the final changes. Changed shared
JavaScript passes `node --check`; site validation passes for 59 scripts, 67 JSON
files, 11 catalogue entries, 16 sitemap pages and links in 19 pages. Diff whitespace
checks pass. Evidence is outside Git under
`C:/Users/user/.codex/tooling/longhand-mcp/v2-qa/audit-*`.

Limits: external font swapping still causes small cold-load movement (Wire CLS
0.003–0.024 in the delayed-load checks); warm real-navigation Wire checks had
CLS 0 after the structural fixes, compared with the original desktop 0.54.
Initial WebGL/shader work depends on hardware. Physical devices and Safari/Firefox
have not been verified, so this audit does not certify universal smoothness.

This is Codex author QA in the external `codex/longhand-v2` worktree. Report prose,
financial figures, dates, sources, PDFs, models, graph/catalogue records, news,
RSS, sitemap and deployment/publishing workflows were not changed. The owner
checkout remains clean on main at `54df02460f2068185bf381b754d76d1de219b7dd`.
No push, PR, merge or publication was performed.

### Owner-authorized publication — 11 October 2026

After the local navigation audit, the owner explicitly requested applying the
completed version to the real website. This supersedes the earlier preview-only
restriction. Publication uses the existing branch-source GitHub Pages workflow
through a pull request from the external `codex/longhand-v2` worktree.
Codex author QA, merge and publication are authorized by the temporary takeover
section in `AI_COLLABORATION.md`; this is not independent Claude review.

The branch was merged normally with public `main` at
`5f0fc9e543af6334d464df4b0c144c062caef42d` before publication. Its seven automatic
Wire update commits were preserved without conflicts. The V2 change does not
edit the report catalogue, PDFs, research data/models, RSS, sitemap, publishing
scripts or GitHub Actions workflows.

[PR #87](https://github.com/LonghandResearch/longhandresearch.github.io/pull/87)
was squash-merged after both GitHub checks passed: site validation (including
all 131 automated tests) and reproduction of the Indonesia resource model,
browser reconciliation, notebooks and deterministic tables. GitHub Pages
successfully built and deployed commit
`b55976c95eef4a8ee8dcb4b9724d9a45a517f2a4` at 08:15 UTC on 11 October.
The main-branch site check also passed. The existing deployment, report feed
and hourly news workflows remain unchanged.

Live Playwright checks used the real public origin,
`https://longhandresearch.github.io/`, with fresh reader contexts. Nineteen routes,
including every published report, were inspected at 390 and 1440px in both
saved themes (76 combinations). They returned HTTP 200 and rendered headings
and the V2 shell, with no root horizontal overflow, visible author controls,
unexpected page errors or failed same-origin requests. Both homepage and Coverage
rendered their WebGL globe. Representative public screenshots were inspected.

Forty-five live interaction assertions passed across mobile and desktop.
They cover saved-theme startup and actual theme switching across navigation,
decoding all 11 portrait artworks, Library search, PDF canvas rendering,
report-to-filtered-Library return, Coverage selection and World reset, the
country route, Wire pagination from 24 to 48 stories, mobile menu Escape and
return to Home. All 16 observed cross-document transitions resolved both their
ready and finished promises and cleared the navigation flag, without page errors.
All five original PDF download URLs, RSS and sitemap returned HTTP 200.

Live screenshots remain outside Git under
`C:/Users/user/.codex/tooling/longhand-mcp/v2-qa/live-*`. The owner's clean main
checkout was safely fast-forwarded to the published commit. The external
worktree was also clean and had identical file contents before this publication
record was added on `codex/longhand-v2-publication`.

These are Codex author QA results. Small cold-load font movement, hardware-
dependent WebGL startup and the unverified physical-device/Safari/Firefox scope
remain as documented above. Public verification does not claim universal
smoothness or replace the research evidence review required for future reports.
