# QA-001 stage 2: Coverage and RSS feed

Reviewed 27 September 2026 against the six-entry published catalogue. This is
an audit record, not a change to report figures.

## Coverage

The page shows two rated companies, one BUY and one SELL, with the latest call
dated 27 September. Its displayed calls match `reports/reports.js`:

| Company | Rating | Price | Target | Displayed return | Recalculated return |
| --- | --- | ---: | ---: | ---: | ---: |
| INET | SELL | IDR 290 | IDR 175 | -39.7% | -39.6552%, rounds to -39.7% |
| ADRO | BUY | IDR 2,740 | IDR 3,354 | +22.4% | +22.4088%, rounds to +22.4% |

Both current-call links lead to their catalogue report IDs. Their source
figures and key-data panels were checked against the report PDFs in stage 1.
No earlier calls exist in the current catalogue, so the history display has no
live figures to audit yet. Exchange grouping is unchanged from WEB-007.

## RSS

`feed.xml` parses as XML and contains six items, one per published catalogue
entry, newest publication date first. Each item's title, public report URL,
publication date and description comes from the corresponding catalogue
entry. Regenerating it with `node scripts/build-feed.mjs` produced no diff.
The feed repeats the IHSG blurb's market figures; their source-level audit is
Claude's QA-002 rather than this display-consistency stage.

## Checks and result

- Coverage was previewed at localhost: the two calls, counts and links matched
  the catalogue, with no browser console errors.
- `node scripts/check-site.mjs` passed.
- No Coverage or RSS data correction was needed.
