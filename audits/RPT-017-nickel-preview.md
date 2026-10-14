# RPT-017: local nickel research preview

14 October 2026. Owner request: build a research website preview using the earlier
Orvane reference, then explicitly **preview only; do not push**. This overrides
the ordinary push/PR finishing workflow for this step. Implementation is isolated
in the `codex/nickel-research` worktree outside the watched owner site folder.
No catalogue entry, sitemap update, push, PR, merge or publication was made.

## Implemented scope

- A standalone static page, `more-nickel.html`, with the existing Longhand shell,
  theme controls, typography and ordinary page links.
- Page-scoped pale technical panels, a conceptual native vector specimen and
  readable type. The source reference was inspected in a browser; its content,
  media and oversized lettering were not copied.
- Historical benchmark/production-share switch, selectable chart values and
  an alternative-baseline price comparison.
- Separate ore, RKEF and HPAL evidence panels.
- Four customs-product choices with indexed trade weight/value, calculated FOB
  per product tonne, original observations and definition notes.
- A consolidated accounting bridge and Harita counter-evidence, with operating
  cash separated from net profit and financing cash interest.
- Accessible expandable data tables, chapter navigation, a source register,
  downloadable frozen observations and explicit incomplete-research labels.

## Data and claim checks

The frozen dataset reproduces six earlier research files without changing
numeric observations. Input SHA256 hashes are included. Its JS and JSON copies
are checked for equality. Individual observation URLs, periods, edition vintages,
source locators and unresolved differences are retained.

- Annual price means reproduce the 129 World Bank monthly observations from
  January2016 to September2026. The nine-month 2026 value is not annualised.
- The headline price comparison is2025 versus2021, not selectively anchored to
  the 2022 high. Alternative baselines are derived from the same observations.
- Mine share uses contained nickel and a rounded world denominator.2025 is
  labelled estimated; mixed USGS vintages remain explicit.
- Nickel Industries original2025 report pages6 and10 were additionally rendered
  and visually checked for this page. Reported RKEF costs, sale prices, adjusted
  EBITDA, mine sales and standby charges agree with the source tables.
- Earlier source checks visually examined NIC2025 pages8,69 and72, Harita1H26
  page12, MDKA FY2025 page7 and BPS pages51,85,141,147. The research source audit
  in the local research folder records these checks and limitations.
- The accounting bridge reconciles in original USD:
  126,479,854 -133,137,786 =-6,657,932;
  -6,657,932 -34,509,037 =-41,166,969. Displayed amounts round independently.
  Parent-attributable loss and financing cash interest are not substituted.
- Trade uses net product kg and FOB USD without converting to nickel content.
  Intermediates are not called a verified MHP-only series.
- Harita counter-evidence compares1H2026 with1H2025 in native IDR. Gross profit
  and parent-attributable earnings are distinct; company EBITDA definitions and
  associate consolidation differences remain in the source note.
- No current HPM formula, interpolated market-price series, unsupported rating,
  price target or universal ore-versus-metal outcome is introduced.

The selected cases support an inquiry, not a representative profitability
conclusion for all Indonesian or global producers. Consistent Indonesian input
price series, the full September HPM decree and source-definition reconciliation
remain outstanding. The page is visibly a working research draft.

## Validation

Codex author QA under the temporary takeover authorization while Claude is
unavailable. This is not independent Claude review.

- `node --check` on all three new scripts.
- Frozen JSON parses; identical JS/JSON data copy verified.
- Five new arithmetic/provenance tests plus the existing suite:138 passed.
- Site checker passed, including the new files through Git intent-to-add:
  63 scripts,70 JSON files,12 existing catalogue entries,17 existing sitemap
  pages and links in20 HTML pages.
- Browser preview in the Codex in-app browser at desktop,390px phone,320px
  narrow phone and768px tablet widths. Temporary viewport overrides are reset
  after QA. Light and dark themes checked.
- A320px three-column numeric overflow was reproduced and fixed by stacking
  narrow numeric summaries. Final320px document scroll width equals its client
  width;390px,768px and default desktop also have no document overflow.
- Open data tables scroll inside named keyboard-focusable regions. Chart labels
  reflow to the actual container width, with adjacent final-year labels suppressed
  when necessary and exact7.5k/22.5k tick labels retained.
- History series switch,2022 baseline, RKEF/HPAL selection, multiple customs
  products, table expansion and mobile menu/Escape behavior exercised. Nine
  source anchors resolve. No error/warning console entries were reported.

Screenshots are retained outside Git in the local research output folder. Preview
URL: `http://127.0.0.1:8769/more-nickel.html`. The server binds loopback only.
Physical devices and other browser engines were not tested in this preview pass.

## Longhand theme and scroll revision — 15 October 2026

The owner requested Orvane-style scroll choreography within the existing
Longhand research identity. The reference was inspected at multiple scroll
positions: a pinned frame, progressive text emphasis and a moving specimen.
The revision uses the shared palette, Newsreader headings, masthead and footer,
with native passive scroll events, requestAnimationFrame and IntersectionObserver.
There are no new dependencies, video framework or intercepted wheel events.
The frozen 14 October observations, units, research dates and financial claims
were preserved. Three inline SVG instances use distinct gradient/filter IDs.

Codex author QA for this revision:

- JavaScript syntax checks and site checker pass: 64 scripts, 70 JSON files,
  12 catalogue entries, 17 sitemap pages and links in 20 HTML pages.
- The five nickel arithmetic/provenance tests pass again. The earlier full-suite
  result of 138 passes above belongs to the initial preview validation.
- SVG parses; inline IDs are unique and every local gradient reference resolves.
- Desktop scroll selects Ore, RKEF and HPAL in successive bands, retaining a
  frame top of 96px. Manual selection and reverse scrolling were exercised.
- Motion Off removes pinning and transforms and restores every prologue word
  to full opacity. Motion On restores the scroll behavior. The system reduced-
  motion preference uses the same fallback; OS preference emulation was not run.
- 320px and 390px phones, 768px tablet, 1024x640 short desktop and the default
  desktop have no document overflow. Phones and short windows do not pin cases.
  Viewport overrides were reset and the original dark theme was restored.
- Light/dark previews, price/share switch, baseline selection and all nine source
  targets were checked. A small prologue SVG overflow was found and corrected
  using overflow:clip, which preserves sticky positioning.
- Browser capture includes receiving-end connection errors without a source
  stack. Their origin was not confirmed; no reproducible report failure was
  observed. Physical devices and other engines remain outside this preview pass.

Updated screenshots are retained under
`C:/Users/user/Downloads/Nickel Research/2026-10-15/` outside Git. The loopback
preview server was restarted after the overnight session. No push, PR, merge,
catalogue update, sitemap update or publication was performed.

## Fluid motion revision — 15 October 2026

The owner found the first motion pass stiff. The reference was inspected again.
The flat SVG rotations were replaced by conceptual 3D geometry projected with
native Canvas 2D: cube faces, irregular ore facets, directional surface lighting
and an engraving attached to the metal's front face. It introduces no external
library or factual product specification. SVG remains the static fallback.
One specimen travels between the cover and prologue with continuous camera
rotation. A time-based damped playhead follows native scroll position, continues
briefly after input stops, and stops requesting frames once settled.

Cases now crossfade with short vertical movement and blur. Outgoing copies are
inert, hidden from accessibility and removed after the transition. Manual
selection retains the current scroll band. Pinning is toggled only when its
required state changes, avoiding temporary layout changes on panel resize.
Financial labels are never tweened. The price trace reveals on section entry;
the underlying observations and definitions remain unchanged.

Additional Codex author QA:

- All three rendering/motion/report scripts parse; site checks pass with
  65 scripts. The five nickel data/provenance tests pass again.
- At default desktop, the specimen visibly changes faces between the cover and
  prologue, retains its trajectory between scenes, and turns through the cases.
- A case transition was observed with incoming opacity 0.837 and an outgoing
  copy marked aria-hidden and inert. Settled opacity is 1 and no ghosts remain.
- Direct viewport clicking preserved scrollY at 4037 and the frame top at 96px.
  Forward scrolling reached HPAL at progress 0.877; reverse returned to RKEF.
  Browser locator clicking may scroll controls into view, so the position check
  used a direct visible control click.
- Motion Off restores full-opacity words, the SVG fallback and ordinary flow.
  On restores the canvas. System reduced motion shares that code path but was
  not changed in OS settings for this check.
- Phone widths 320/390, tablet 768, short desktop 1024x640 and default desktop
  have no document overflow. Phones and short windows remain unpinned. Mobile HPAL selection settles without duplicate panels. Viewport overrides were reset.
- Updated proof images are stored outside Git in the 15 October output folder.
  Preview-only scope continues; no push or publication.
- Light and dark canvas previews retain readable contrast. Original dark theme
  was restored. All nine source targets resolve; the price chart retains 11
  selectable annual observations and its visible line settles at dash offset 0.
  Owner checkout remains clean. Final JavaScript syntax and diff checks pass.

## Material illustration and composition revision — 15 October 2026

The owner found the previous graphics rigid and the page too empty. The current
preview replaces the procedural cube/low-poly rock with two detailed transparent
AI-generated conceptual illustrations, created with the imagegen skill and
copied into `assets/img/research/`. These depict material contrast, not an actual
ore sample, producer, mine, grade, purity or saleable product. The page explicitly
labels them AI-generated conceptual illustrations. They are not research evidence
and no observation, source definition or financial claim was changed.

The current renderer uses DOM image layers with GPU transforms and subtle
independent CSS drift, plus the existing damped native-scroll playhead. It uses
shallow parallax rather than claiming to rotate a photoreal model in full 3D.
There is no permanent JavaScript render loop. Motion Off restores the ordinary
image pair. Phones, tablets and windows below 701px high use ordinary flow and
static image composition; this is enforced in CSS as well as the controller.

Three linked reading lenses — Output, Margins and Returns — fill the opening's
lower area with research questions. The pinned opening was shortened from 140svh
to 124svh and the chain from 210svh to 188svh. A full-height composition brings
the reading lenses toward the bottom of the screen. Ledger and case content
remain above the decorative image layer so images cannot cover financial text.

Asset provenance: generated composite `exec-0f2c1268-61d4-41ed-8fae-45418ba399a0.png`
was used as the input for isolated material edits. Selected outputs:

- Metal: `exec-cb6be380-6c6a-4055-a612-17393aaf453e.png` →
  `nickel-metal-illustration.png` (1536×1024 RGBA, 2,590,884 bytes).
- Ore: `exec-51e70855-ff77-4f47-80c7-3d52727b99a6.png` →
  `nickel-ore-illustration.png` (1536×1024 RGBA, 3,264,215 bytes).

Both have transparent alpha. Originals remain in the Codex generated-image
folder; only the two selected outputs were copied into this preview. Current
PNG payload is about 5.85 MB across the two unique assets; no bandwidth-limited
device test was performed. The previous source SVG is retained locally as an
earlier preview asset.

Codex author QA: site checks pass (65 scripts, 70 JSON, 12 catalogue entries,
17 sitemap pages and 20 HTML pages); all five nickel data/provenance tests pass.
Changed renderer/controller scripts and Git diff pass syntax/whitespace checks.
The image pair loads in the browser; CSS drift transforms were observed. Motion
Off restores pair opacity 1, hides the floating layer and reveals every word.
Responsive/theme/source-link checks and proof images are recorded in the final
preview pass. No push or publication was performed.

The phone fallback initially exposed an intrinsic-height sizing error: width
was responsive while the HTML image height remained fixed. Explicit height:auto
corrected it. At 320px, the ore image occupies y761–849 inside the material
plate at y671–849, with no document overflow. Static flow and restored image
opacity are enforced by media queries without waiting for a resize callback.

Final pass: 390/320 phone layouts, 768 tablet and 1024x640 short-window layouts
were inspected; the sizing correction was rechecked at 320px. Computed case
position is static in compact layouts and document overflow is 0. Light/dark
desktop illustrations are legible; nine source targets resolve. Viewport
overrides were reset, dark theme restored, temporary QA tabs closed and the
original preview refreshed. Latest proof files are `preview-materials.jpg`
and `preview-materials-paper.jpg` in the local 15 October output folder.

## Indonesia industry edition and holographic atlas — 15 October 2026

The owner requested a deeper country/industry report, with clearly separated
facts, assumptions and criticism; maps of reserves, mining/processing localities
and destinations; smoother transitions; and an interactive futuristic atlas
similar to the existing Coal and Power Behind AI exhibits. The explicit local
preview/no-push constraint continues. No publication, catalogue, sitemap, feed,
tracker or owner-checkout change was made. This is Codex author QA, not an
independent second-agent review.

The current page has nine chapters and 21 registered primary/official sources.
Issuer financial panels were removed from the current report. The original
14 October evidence download and wrapper remain unchanged as an archive. The
new country edition is `updates/nickel-indonesia-2026-10-15.json`, with an
identical `industry-data.js` wrapper. It retains the original benchmark, mine
production and BPS observations, their units, source dates and estimate flags.

New source validation:

- Badan Geologi, *Neraca Sumber Daya dan Cadangan Mineral dan Batubara Indonesia
  Tahun 2025*, Table 7, printed page 55/document page 89, data updated December
  2024. Downloaded to the local research sources folder, text extracted and page
  rendered/visually inspected using the PDF skill. National reserves are
  5,913,865,814 ore tonnes and 62,029,856 tonnes contained nickel. Eight provincial
  rows with reported reserves are mapped. Ore rows sum to one tonne more than the
  reported national total; metal rows reconcile exactly. No silent repair or
  conversion from reserves into annual output. Dashes remain not reported.
- WITS/UN Comtrade 2024 all-partner tables: HS720260, HS750110 and HS750120.
  Original locally frozen HTML rows were parsed and checked against the public
  tables. Trade values are **thousand USD**. World denominators give China shares
  94.3%, 61.5% and 99.5%; Japan's matte share is 32.3%. Small row-sum rounding
  differences remain. HS750120 is not claimed to be MHP only. Partner countries
  are not claimed to be final consumers. No 2024 partner series is relabelled
  2025, and WITS H0 is not silently spliced into BPS HS2022.
- ESDM's January 2020 ore-ban announcement and its 2017 operating-smelter table
  establish dated policy/processing checkpoints. The 25 June 2026 RKAB statement
  is historical context, not a claim that no final decision exists in October.
  No unverified national quota is inserted. WTO DS592 is used only for the 2022
  panel and December appeal history, not a current legal conclusion.
- IMIP and IWIP official descriptions, Badan Geologi's Obi belt description,
  ESDM's Sorowako visit and 2017 Pomalaa record establish selected locality and
  processing descriptions. These are not a complete mine/facility register or
  independent environmental audits. Six locality markers use approximate display
  anchors, not surveyed coordinates, concession boundaries or output weights.
- BKPM's 3 July 2024 Karawang inauguration records a first-phase 10 GWh battery
  cell nameplate. It is not counted as actual 2026 output or proven local nickel
  sourcing. IEA Global EV Outlook 2026 provides 2025 chemistry observations:
  LFP exceeds 55% of global EV battery deployment; outside China almost 80%
  uses nickel-containing chemistry. Both are included to avoid a one-sided
  substitution claim.
- IEA ASEAN Energy Security Review 2026: the estimated 75% refining-capacity
  investment linkage is not converted into foreign profit share. Captive coal,
  imported chemical inputs and supply-chain exposure support the stated risk
  mechanisms. The broad 98% trade statement is not substituted for the
  product-specific WITS observations.
- IEA Global Critical Minerals Outlook 2026 identifies the May 2026 acid export
  curbs and broader sulphur disruption. No plant-specific Indonesian acid price,
  cost or lost production is invented. Its 2035 supply cases remain explicitly
  conditional; no price target or probability is assigned.

The new download records SHA-256 hashes for the geological original, three
WITS source HTML files and retained source-derived historical inputs. Originals
and PDF proof are outside Git in `Downloads/Nickel Research/2026-10-15/sources`
and the earlier 14 October research folder. Narrative interpretations and the
three conditional cases are identified as analysis. Missing provincial output,
cargo provenance, current plant utilisation, retained national income and final
quota evidence are listed as gaps, not populated with assumptions as facts.

Map implementation uses the repo's Natural Earth public-domain outlines and
the Coal projection contract: x=(lon+180)*960/360, y=(85-lat)*520/170. An initial
projection mismatch during implementation was found in visual QA and corrected
before this revision's final pass. `atlas-hud.js` adds bounded zoom/focus,
mouse/keyboard panning, selected-point reticles and relationship lights. Line
width follows product export value share; animation speed and light count do
not represent vessels, cargo amounts or observed routes. Small positive flows
retain their dollar/kg detail instead of being rounded to zero million units.
Playback runs only for visible maps, pauses when hidden/off, and respects system
reduced motion. No new dependency is added.

The previous automatic three-stage scroll swaps and long pinned case section
are removed. Research stays in ordinary document flow; body content is always
readable before its mild 8px/opacity reveal settles. The opening's material
movement uses a continuous quintic interpolation and a damped visual playhead.
The AI material artwork remains conceptual, never research evidence.

Final author QA:

- Nine nickel data/provenance/arithmetic tests passed. Both JSON downloads parse,
  changed JavaScript passes `node --check`, and site checks passed with 70
  scripts, 71 JSON files, 12 catalogue entries and 17 sitemap pages unchanged.
- Browser checked every province selection, industry-layer/Pomalaa selection,
  export product changes, Japan matte selection (32.3%), small Korean matte
  amounts ($2,510 and 250 kg), camera focus/reset and map-motion pause.
- All 21 source targets resolve. Current fresh QA tab reported no JavaScript
  errors. A transient missing trade renderer found during implementation was
  repaired; all four BPS products render correctly in the final pass.
- 320 and 390 phone layouts, 768 tablet and 1024×640 short-window layouts have
  no document overflow. Compact layouts are unpinned. Holographic consoles
  stack into one column on phones. All four BPS product states were inspected
  at 320px. Light and dark themes were visually checked.
- Map Off pauses reticles and hides moving lights. Global Scroll Motion Off
  restores full-opacity opening text and hides the floating artwork. Controls
  were restored, dark theme restored and viewport overrides reset. System
  reduced-motion branches were reviewed; the OS preference and physical-device
  behaviour were not independently exercised.
- Screenshot proof is saved outside Git in the 15 October output folder.
  Work remains uncommitted in the managed worktree; no push or publication.

## Line treatment and editorial voice — 15 October 2026

Owner follow-up: the map lines were unattractive, the narrative felt mechanical,
and source numbers should not appear. Read the existing Coal research letter,
Power Behind AI page, `docs/research-constitution.md` and
`docs/editorial-reading-qa.md` before revising. The constitutional book references
are treated as principles for evidence, assumptions, alternatives and revision;
this is not a claim that the books were read exhaustively in this pass.

Removed the dense graticule and scanline texture from the visible atlas. Coastline
and background strokes are thinner and quieter. Fifteen country outlines now use
Natural Earth 1:50m publisher data, including Indonesia and the major displayed
destinations; other context retains the earlier 1:110m data. No coastline was
invented or smoothed into an arbitrary drawing. Source:
`https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson`.
Publisher repository confirmed through the official Natural Earth download page;
the original is frozen outside Git. SHA256:
`3e458fc036ad0a66411f2c1e6cac49c5d7bfb81cb1123bc513b22511a2b7fdeb`.
Current geography wrapper is 359,898 bytes. Export curves use a gentler cubic
shape and narrower value-ranked strokes. Endpoints, underlying observations,
units and date boundaries remain unchanged.

Edited all nine narrative chapters into connected research prose with concrete
economic questions. Reduced repetitive framework labels and self-certifying
phrases; preserved the distinction between observations and conditional views.
No statistical observation or source dataset was changed. Inline source links
use institution/document names and the source register is an unnumbered list;
runtime-generated chart/map links also have names, not bracketed numbers. Body
paragraphs follow the earlier justified-reading treatment with a natural final
line, hyphenation and 18px phone text.

Author QA: all nine nickel tests pass. Browser verification found zero numbered
source links, no source counter, zero missing source targets and no JavaScript
errors. Revised domestic map and prose visually inspected; 390px reflow and
Japan matte selection preserve correct data and no document overflow. A final
site check and Git diff check accompany this local preview. No push/publication.

## Reader balance and publication authorization — 15 October 2026

The owner asked for fewer visible sources and a better reading balance. Six
core groups now contain 13 links; the eight supporting records remain under a
closed disclosure. All 21 source targets and the full evidence download remain.
No numbered citations return. Methods and three conditional cases open on
request, while the main argument and unresolved evidence gaps remain visible.
The report width, chapter rail, heading scale and section spacing are reduced.
The holographic map uses a lighter frame, a narrower detail panel, larger control
text and a tighter domestic view. Selection, zoom, focus, keyboard pan and
map-motion controls remain. Display anchors and relationships are not upgraded
into surveyed mines or cargo tracks.

Phone QA exposed deep-link positioning after layout changed. Anchor handling
now resolves after chart/font rendering, opens enclosing disclosures and supports
repeat clicks on the current chapter. Native reader scroll remains unchanged.

The owner's later instruction explicitly allows push after rechecking all data,
narrative and Indonesian export destinations. This supersedes the earlier
preview-only restriction for the reviewed report. Publication proceeds under
the temporary Codex takeover in `AI_COLLABORATION.md`; this is **Codex author
QA, not independent Claude review**. No owner checkout edits are needed.

### Source and narrative recheck

`audits/RPT-017-nickel-recheck.json` records 215 successful numerical checks:
129 World Bank months, 60 USGS country/year values, three complete WITS World
and partner tables, five BPS original rows and 18 provincial/national reserve
fields. Freshly downloaded World Bank and nine USGS chapters, WITS tables and
the geological report match the frozen edition. BPS was re-extracted from its
retained publisher original previously downloaded through the public browser
button. Fresh direct BPS HTTP returned 403, which does not replace or invalidate
that original. IEA direct HTTP also returned 403; all four IEA claim-bearing pages
were instead rechecked through the web reader. USGS's index was read through the
web reader, with its individual chapters freshly retrieved directly.

Recomputed headline measures: 2025 mine share 66.6667% of a rounded world total;
2025 annual benchmark vs 2021 -17.8870%; China 2024 value shares 94.3168% for
HS720260, 61.4545% for HS750110 and 99.5088% for HS750120. Japan matte share
32.2759%. Product kg and thousand-USD values remain the original reported values,
including tiny shipments. WITS/BPS rounding and H0/HS2022 differences remain
explicit; no continuous cross-classification history is silently joined.

Read every chapter and the six locality descriptions against the registered
sources. The 2017 ESDM source spells Pomalaa as “Pomala”; its operating FeNi
row is verified. The 2020 booklet's printed page 9 was visually inspected for
the process diagram; its older shares are not carried into current analysis.
BKPM establishes the July 2024 Karawang inauguration and 10GWh first-phase
capacity, not 2026 output. Reserve stocks are not annual production. The map
does not claim all mines, mine-to-plant supply, shipping routes or final demand.
China/Japan shares and the smaller India/Korea/Netherlands/Norway destinations
are described by product. “Other Asia, nes” is not relabelled as a specific
country. A small selected country is shown when a locator is established.

IEA claims retain 2025 battery deployment, capacity-linked investment and
conditional 2035 supply distinctions. The May 2026 acid disruption does not
become an invented Indonesian plant bill. The June quota statement and 2022
WTO findings/appeal retain their dates. A fresh ESDM search did not establish a
final October quota. Its new export target is not realised trade. The October
battery-export announcement was inspected but does not identify enough product
detail to merge it with the 2024 customs data or infer audited annual cell output.
No sector profit, fiscal incentive bill, environmental bill, forecast probability
or full national net benefit has been fabricated. Open gaps remain open.

The current page, downloadable edition, catalogue abstract and discovery metadata
are consistent. It is an Indonesia sector study without issuer ratings. Overseas
markets are trade context; primary-geography counts remain Indonesia/US. The
existing conceptual ore illustration is reused for discovery and labelled as
AI-generated, not a sample. Published metadata replaces preview labels; source
dates do not change. Catalogue, sitemap and RSS use the reviewed title/date.

### Final implementation QA before push

All 142 automated tests pass, including the nine nickel arithmetic/data tests
and the updated discovery count tests. The site checker passes: 70 scripts,
72 JSON files, 13 catalogue entries, 18 sitemap pages and links in 20 pages.
Git whitespace checks pass. The RSS change is exactly one new report item.
Only nickel implementation, evidence, publication metadata and necessary
discovery integration/cache versions are included; owner checkout remains clean.

Browser checks exercised all eight reserve panels, six locality descriptions,
three complete partner tables and their top-five selections, four BPS products,
three alternative baselines, the production-estimate readout, case/method
disclosures, supporting-source deep links, map keyboard zoom/pan/reset and
map-motion pause. Rendered reserve percentages and trade table values were
matched to the frozen data. Desktop, 390px and 320px layouts were inspected in
paper/dark themes; settled layouts have no document overflow or report console
errors. One immediate theme-switch observation found a temporary 15px root
snapshot overflow in the shared 620ms view transition; the subsequent settled
paper/dark layouts are correct. This animation-frame limitation is recorded,
not presented as a persistent report-layout failure or a fix to the shared theme.
Physical devices and other engines remain outside this nickel-specific pass.

Library shows No. 013 with the correct title, sector, Indonesia filter and
unrated metadata. The Netherlands country page and Norway Coverage selection
show zero focused reports and the nickel report as trade context. Testing caught
and corrected obsolete coal-only explanatory text in both country/coverage
renderers. Existing primary geography remains Indonesia and the United States;
no speculative country/company relations or globe arcs were introduced.
The nickel sector path opens the correct report. Seven discovery pages request
the updated graph/art versions; entity pages request their corrected renderer.

Proof images and the detailed browser/source check records are stored outside
Git in the local 15 October research folder. The repository recheck JSON keeps
public retrieval metadata and derived values, not whole publisher documents.

### Publication handoff

The reviewed branch is published through PR #99. GitHub checks passed on the
implementation head, including all 142 tests. The finishing task-board entry
is committed with the publication so main records its completion on merge.
Deployment and live-byte/browser verification follow the merge, with final
publication notes also synchronized to the owner’s Obsidian vault.
