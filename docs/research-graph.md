# Public research discovery

`reports/reports.js` remains the publication record. `assets/js/research-graph.js`
adds a small, synchronous, public relationship index; no database, build step or
private workspace export is involved. Existing publications and URLs are intact.

Countries use ISO alpha-2 identifiers (including separately reported statistical
markets). Sector and company IDs describe stable subjects. Listings are separate
records; exchange location is not treated as company domicile. `countryIds` on a
company means research geography, and domicile remains unknown unless reviewed.

Relationships link a report to a country, sector or company, with a role and a
local evidence URL. `primary` means a central subject; `material` means a substantive
connection within the report. `incidental` and `historical` are supported but do
not appear in default coverage counts. A company discussion never creates a rating.
IHSG is a market index, not a company. The Memory War's abstract supports a sector
relationship but does not, by itself, establish geographic coverage.

The current index identifies Indonesia and the United States as primary research
geographies. Coal destinations are research connections with the report's BPS
definitions retained, including Viet Nam as regional context without a bilateral
volume. The globe shows primary geographies and any selected contextual market.
Its rounded latitude/longitude values are representative locator points, not
offices, projects, exact boundaries, territorial claims or investment exposure.
The complete country list is available without WebGL.

Add a new publication to the existing catalogue first. Add evidence-linked
relationships to the graph after checking the report. Unmapped publications still
appear in the Library and Homepage; they do not acquire inferred country/company
tags. Counts are derived from the current catalogue, so deleted reports do not
remain in the displayed counts. Do not derive counts by summing countries: a
publication can concern more than one geography.

Public API: `LonghandGraph.reportsFor({country,sector,company})` returns the
intersection; `entitiesFor(type,filters)` returns connected subjects;
`contextFor(reportOrId)` returns countries, sectors and companies with their roles
and evidence. Company geography/sector checks prevent a shared sector report from
manufacturing a company-country relationship. `urlFor(type,id,context)` preserves
the discovery path in ordinary query parameters.

Validation: `node --test tests/research-graph.test.mjs` checks publication/entity
references, evidence anchors, count scope and invalid paths. The owner reviews
new factual relationships using the same source standards as the reports.
