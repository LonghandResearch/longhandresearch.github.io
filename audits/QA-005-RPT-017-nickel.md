# QA-005: independent review of RPT-017, More Nickel. Who Makes the Money?

Reviewer: Claude, 24 October 2026. First independent second-agent review of this
study, which was published under Codex author QA during the temporary takeover.
Reviewed against `QA.md` using `updates/nickel-indonesia-2026-10-15.json` and the
live page text with every disclosure opened.

**Result: no figure error found. No change to the report.**

## Internal arithmetic

36 checks recomputed from the data file. 35 agree exactly; the one difference is
in the source itself (see reserves below).

- Indonesia's share of world mine output for every year 2016 to 2025 (9.5% to
  66.7%) equals Indonesia ÷ rounded world total.
- Annual benchmark means and month counts for every year, including 2026 as
  nine months (USD17,344). 2025 against 2021: -17.9%.
- Destination shares: ferronickel China 94.32%, India 2.15%, Korea 1.39%;
  matte China 61.45%, Japan 32.28%; HS750120 China 99.51%. Partner rows sum to
  the World row within USD10 (source rounding).
- BPS HS720260 unit values: USD1,454.41 per tonne (2024) and USD1,417.94 (2025).

## Primary sources re-read

| Source | What was checked | Result |
| --- | --- | --- |
| USGS Mineral Commodity Summaries, nickel, editions 2018, 2022, 2025 and 2026 (rendered world production tables) | Indonesia, Australia, Canada, Philippines, Russia and world for 2016, 2020, 2023, 2024 and 2025e, including estimate flags | All match. MCS 2026: Indonesia 2,310,000 (2024) and 2,600,000e (2025); world 3,710,000 and 3,900,000 |
| World Bank Pink Sheet monthly file (downloaded 24 October), BP Nickel column | All 129 monthly observations, January 2016 to September 2026 | 129 of 129 match. Means: 2021 18,465; 2022 25,834; 2025 15,162; 2026 17,344 (nine months) |
| WITS 2024 export pages for HS720260, HS750110 and HS750120 | Every partner value, 24 rows | 24 of 24 match |
| Badan Geologi, Neraca Sumber Daya dan Cadangan 2025, PDF page 89, Table 7 | Ore and metal reserves for all eight provinces and the national total | All match. The source's printed national ore total (5,913,865,814 t) is 1 t below the sum of its own province rows (5,913,865,815 t). The page reproduces the printed figure and calls it the reported total, which is correct |
| Warta Fiskal edition 3 2023, page 16 | Nickel royalty receipts | Rp1.4tn (2018) and Rp11.1tn (2022) match |
| APBN KiTa Q4 2025, printed page 53 | PP 19/2025 royalty table | Ore 14% to 19% (integrated KBLBB 2%), matte 3.5% to 5.5%, ferronickel 4% to 6% match |
| BPS Southeast Sulawesi release, 21 August 2026 | 2025 provincial exports | USD3.72bn and iron and steel about 95.76% match |
| BKPM release, 3 July 2024 | Karawang battery-cell plant | Inaugurated 3 July 2024, first phase 10 GWh match |

## Not independently verified

- The four IEA statements (LFP above 55% of 2025 EV battery deployment, almost
  80% outside China nickel-based, 75% of Indonesian refining capacity linked to
  Chinese investment, May 2026 acid export curbs). The IEA site returned a
  Cloudflare challenge to the browser, and bypassing bot checks is not
  permitted. The owner can confirm them in a normal browser.
- The BPS national export publication rows for HS720260 in 2025. Its 2024
  value equals the WITS World row exactly, which supports the transcription.
- Map locality coordinates and operator descriptions, which the page already
  labels as approximate display anchors.

## Copy

No semicolons or dashes in reader prose. The standalone "See the ..." source
sentence was already removed in PR #110.
