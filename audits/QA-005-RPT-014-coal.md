# QA-005: independent review of RPT-014, Coal Still Burns. Trade Is Changing.

Reviewer: Claude, 24 October 2026. First independent second-agent review of the
coal study (Codex final review and publication under the takeover). Reviewed
against `QA.md` using `assets/js/coal/data.js` and the live page text with every
disclosure opened.

**Result: no error found. No change to the report.**

## Sources re-read

| Source | What was checked | Result |
| --- | --- | --- |
| World Bank monthly file (downloaded 24 October), "Coal, Australian" column | Annual 2023 to 2025, five quarters, July to September 2026 | All match after rounding (172.8, 136.1, 108.4; 110.5, 109.3, 122.3, 135.4, 138.1; 131.9, 135.2, 147.1) |
| IEA Coal Mid-Year Update 2026, demand (owner's Chrome) | Global consumption | 8.84 Bt (2025), 8.94 Bt (2026), 8.91 Bt (2027 conditional) match |
| IEA Coal Mid-Year Update 2026, trade | Seaborne thermal demand and Indonesian exports | 1,074 Mt to 1,062 Mt; Indonesia 557, 517 and about 495 Mt match |
| BPS coal exports by destination, 2012 to 2025 | All ten named 2025 destinations, Others and Total; 2024 total | All match. India 100,235.2 kt, China 81,787.7, Philippines 37,705.5, Korea 28,287.2, Malaysia 27,615.9, Japan 27,168.5, Taiwan 15,214.2, Thailand 14,442.6, Hong Kong 3,184.7, Spain 78.0, Others 55,207.8, Total 390,927.2; 2024 405,761.2 |
| BPS lignite exports by destination | 2024 and 2025 totals, China 2025 | 151,994.5, 133,082.6 and 131,054.9 kt match |
| Bayan 2Q26 investor update, slides 2 and 20 | H1 2025 and H1 2026 revenue, EBITDA, production, sales, ASP, cash cost; Q2 capex | All match. Q2 capex US$36.0m |
| PTBA interim statements, 30 June 2026, pages 10, 11, 13, 119 and 120 | All 22 rupiah figures used, both periods | All present on the cited pages. Cost components verified by column: mining services 6,191,085 (H1 2025) to 5,737,978 (H1 2026), and so on |
| PTBA release, 28 July 2026 (owner's Chrome) | H1 2026 operations | Production 19.45 Mt, sales 21.10 Mt, domestic 10.77 Mt (51%), export 10.33 Mt (49%) match |
| ESDM RUPTL 2025 to 2034 announcement (owner's Chrome) | Capacity plan | 69.5 GW additions, about 76% renewables and storage match |

## Derived figures recomputed

- BPS coal plus lignite against IEA thermal: 557.7557 Mt against 557 (2024,
  difference 0.7557) and 524.0098 Mt against 517 (2025, difference 7.0098).
- Q3 2026 price +2.0% on Q2. Bayan unit spread US$16.1 to 19.0 per tonne.
  Bayan H1 2026 capex US$77.1m (41.1 + 36.0).
- PTBA gross margin 11.0% to 19.3%, operating cash less asset purchases
  Rp0.693tn to Rp3.479tn, domestic share 51.0% of sales.
- The ten named destinations plus Others sum to 390,927.3 kt against BPS's
  printed 390,927.2 kt. The 0.1 kt gap is BPS rounding. The page shares use
  the printed total.

## Note on method

An early pass of this review reported two broken source links. Both were caused
by the reviewer truncating URLs to 120 characters before opening them. The full
URLs in `data.js` work and were re-checked. No link change was needed.
