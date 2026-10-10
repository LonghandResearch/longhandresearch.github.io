# Longhand V2 local implementation validation

Date: 10 October 2026 (Asia/Jakarta). Codex author QA, with a separate read-only
Codex browser review. This is not independent Claude review.

The owner approved implementation, and explicitly withheld pushing and
publication. Work is on `codex/longhand-v2` in the external MCP-tooling worktree,
based on `9c40705a26aa6f061177bd8c6bd1d7528c1ba4dc`. The owner's watched checkout
remains untouched on `main` at `54df02460f2068185bf381b754d76d1de219b7dd`.

## Automated checks

- `node scripts/check-site.mjs`: 58 JavaScript scripts, 67 JSON files, 11 catalogue
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

## Preservation and limitations

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
