# Data-driven research reports

Existing PDFs, IHSG weekly data and bespoke interactive reports retain their
current renderers. New text-led research can use the optional `contentUrl` field
in a normal catalogue record, pointing at a local JSON file. The address stays
`report.html?id=<report-id>`; no new HTML page is required. A `pdfUrl` can accompany
the JSON as a downloadable edition. `page` continues to take precedence for a
bespoke report. This format requires HTTP, like existing weekly editions.

The JSON has `schemaVersion: 1`, a matching `reportId`, `sources`, `sections` and an
optional `methodology` string. Sources have unique `id`, `title`, `url` and optional
`note`/`accessed`. Sections have a unique anchor `id`, `title` and `blocks`. IDs use
lowercase letters, numbers and hyphens, beginning with a letter. `sources` and the
`source-` prefix are reserved for the evidence register.

Supported blocks:

| Type | Required fields |
| --- | --- |
| `paragraph` | `text` |
| `list` | `items` text array; optional `ordered` |
| `callout` | `title`, `text` |
| `table` | `title`, `unit`, `period`, `status`, `sources`, `columns`, `rows` |
| `line-chart` | `title`, `unit`, `period`, `status`, `sources`, `points` with `label` and finite numeric `value` |

All blocks can reference source IDs. Every figure must carry sources, period,
units and an explicit evidence status (for example observed, forecast, derived or
scenario), plus an optional caption. Line charts have 2–60 equally spaced
categorical observations and an accessible exact-value table. They are not a
replacement for existing valuation engines, irregular time-series scales or
multi-axis scientific charts. Those remain specialized report modules.

Text is escaped and no supplied HTML, JavaScript or formula is executed. The
renderer rejects missing evidence, invalid numbers, duplicate IDs and malformed
tables. Failed requests/validation show an unavailable state and retry control;
they never substitute an old report. The report's catalogue metadata remains
visible. PDFs use their own genuine document bookmarks when present; contents
are not invented for unbookmarked PDFs.

Add reviewed JSON alongside the report's source files, then add its catalogue
record and existing sitemap/feed publication records through the usual reviewed
workflow. The local Add report form continues to create PDF drafts. Structured
JSON publication is a manual, reviewed repository operation; it is not a new
authoring CMS. Do not put private drafts in the watched owner's `reports/` folder.

Run `node scripts/check-site.mjs` and `node --test tests/structured-report.test.mjs`,
then review every fact, figure, source and rendered chart under `QA.md`. The
schema check establishes structural consistency, not research correctness.
