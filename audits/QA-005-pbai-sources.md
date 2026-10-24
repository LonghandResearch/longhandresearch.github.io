# QA-005: primary sources for The Power Behind AI market data

24 October 2026, Claude, updated after Codex review of the pull request. Fourteen
citations in `assets/js/pbai/data.js` pointed at secondary market-data sites.
Each figure was re-read from the exchange or the issuer and every figure matched,
so only the citations changed. The rows behind the price checks are retained in
`audits/QA-005-pbai-idx-closes.json`, because idx.co.id answers command-line
clients with 403 and a reviewer may need them.

## Prices: 48 year-end observations and 10 report-date closes

Source: IDX Stock Summary, the `Close` field of
`https://www.idx.co.id/primary/TradingSummary/GetStockSummary?length=9999&start=0&date=YYYYMMDD`
for 30 December 2021, 30 December 2022, 29 December 2023, 30 December 2024,
30 December 2025 and 24 September 2026, read inside the idx.co.id page on
24 October 2026. The report stores split-adjusted values. The factor is the raw
close divided by the stored value, and every factor is a whole number: ISAT 4
before FY2024 (2024 1:4 split), DSSA 250 before FY2024 and 25 for FY2024 and
FY2025 (2024 and 2026 splits). PGEO listed in 2023. Nine tickers have five
year-end observations and PGEO has three, so 48 in all. An earlier version of this
record said 47, which was a miscount.

| Ticker | Fiscal year | IDX session | Raw close, Rp | Split factor | Stored (adjusted) close, Rp |
| --- | --- | --- | ---: | ---: | ---: |
| DCII | FY2021 | 2021-12-30 | 43,975 | 1 | 43,975 |
| DCII | FY2022 | 2022-12-30 | 36,825 | 1 | 36,825 |
| DCII | FY2023 | 2023-12-29 | 43,000 | 1 | 43,000 |
| DCII | FY2024 | 2024-12-30 | 42,100 | 1 | 42,100 |
| DCII | FY2025 | 2025-12-30 | 200,000 | 1 | 200,000 |
| TLKM | FY2021 | 2021-12-30 | 4,040 | 1 | 4,040 |
| TLKM | FY2022 | 2022-12-30 | 3,750 | 1 | 3,750 |
| TLKM | FY2023 | 2023-12-29 | 3,950 | 1 | 3,950 |
| TLKM | FY2024 | 2024-12-30 | 2,710 | 1 | 2,710 |
| TLKM | FY2025 | 2025-12-30 | 3,480 | 1 | 3,480 |
| ISAT | FY2021 | 2021-12-30 | 6,200 | 4 | 1,550 |
| ISAT | FY2022 | 2022-12-30 | 6,175 | 4 | 1,543.75 |
| ISAT | FY2023 | 2023-12-29 | 9,375 | 4 | 2,343.75 |
| ISAT | FY2024 | 2024-12-30 | 2,480 | 1 | 2,480 |
| ISAT | FY2025 | 2025-12-30 | 2,320 | 1 | 2,320 |
| EXCL | FY2021 | 2021-12-30 | 3,170 | 1 | 3,170 |
| EXCL | FY2022 | 2022-12-30 | 2,140 | 1 | 2,140 |
| EXCL | FY2023 | 2023-12-29 | 2,000 | 1 | 2,000 |
| EXCL | FY2024 | 2024-12-30 | 2,250 | 1 | 2,250 |
| EXCL | FY2025 | 2025-12-30 | 3,750 | 1 | 3,750 |
| MTEL | FY2021 | 2021-12-30 | 830 | 1 | 830 |
| MTEL | FY2022 | 2022-12-30 | 800 | 1 | 800 |
| MTEL | FY2023 | 2023-12-29 | 705 | 1 | 705 |
| MTEL | FY2024 | 2024-12-30 | 645 | 1 | 645 |
| MTEL | FY2025 | 2025-12-30 | 700 | 1 | 700 |
| DMAS | FY2021 | 2021-12-30 | 191 | 1 | 191 |
| DMAS | FY2022 | 2022-12-30 | 159 | 1 | 159 |
| DMAS | FY2023 | 2023-12-29 | 163 | 1 | 163 |
| DMAS | FY2024 | 2024-12-30 | 149 | 1 | 149 |
| DMAS | FY2025 | 2025-12-30 | 129 | 1 | 129 |
| KIJA | FY2021 | 2021-12-30 | 166 | 1 | 166 |
| KIJA | FY2022 | 2022-12-30 | 146 | 1 | 146 |
| KIJA | FY2023 | 2023-12-29 | 134 | 1 | 134 |
| KIJA | FY2024 | 2024-12-30 | 186 | 1 | 186 |
| KIJA | FY2025 | 2025-12-30 | 210 | 1 | 210 |
| PGEO | FY2023 | 2023-12-29 | 1,170 | 1 | 1,170 |
| PGEO | FY2024 | 2024-12-30 | 935 | 1 | 935 |
| PGEO | FY2025 | 2025-12-30 | 1,125 | 1 | 1,125 |
| PTBA | FY2021 | 2021-12-30 | 2,710 | 1 | 2,710 |
| PTBA | FY2022 | 2022-12-30 | 3,690 | 1 | 3,690 |
| PTBA | FY2023 | 2023-12-29 | 2,440 | 1 | 2,440 |
| PTBA | FY2024 | 2024-12-30 | 2,750 | 1 | 2,750 |
| PTBA | FY2025 | 2025-12-30 | 2,310 | 1 | 2,310 |
| DSSA | FY2021 | 2021-12-30 | 49,000 | 250 | 196 |
| DSSA | FY2022 | 2022-12-30 | 39,800 | 250 | 159.2 |
| DSSA | FY2023 | 2023-12-29 | 80,000 | 250 | 320 |
| DSSA | FY2024 | 2024-12-30 | 37,000 | 25 | 1,480 |
| DSSA | FY2025 | 2025-12-30 | 101,000 | 25 | 4,040 |

Report-date closes, 24 September 2026, all equal to the stored report prices:

| Ticker | IDX session | Raw close, Rp | Stored close, Rp |
| --- | --- | ---: | ---: |
| DCII | 2026-09-24 | 201,000 | 201,000 |
| TLKM | 2026-09-24 | 2,410 | 2,410 |
| ISAT | 2026-09-24 | 2,400 | 2,400 |
| EXCL | 2026-09-24 | 2,400 | 2,400 |
| MTEL | 2026-09-24 | 482 | 482 |
| DMAS | 2026-09-24 | 192 | 192 |
| KIJA | 2026-09-24 | 176 | 176 |
| PGEO | 2026-09-24 | 1,070 | 1,070 |
| PTBA | 2026-09-24 | 3,050 | 3,050 |
| DSSA | 2026-09-24 | 1,090 | 1,090 |

## Share counts

DMAS 48,198,111,100 and KIJA 20,824,888,369 equal both the sum of the IDX
shareholder register and the listed shares in the Stock Summary on 24 September
2026 (profile pages `https://www.idx.co.id/id/perusahaan-tercatat/profil-perusahaan-tercatat/DMAS`
and `.../KIJA`). The same Stock Summary check also matches DCII, TLKM, PTBA, ISAT,
EXCL and MTEL. Listed shares on that date: DCII 2,383,745,900, TLKM 99,062,216,600, ISAT 32,250,810,957, EXCL 18,199,862,451, MTEL 83,559,677,444, DMAS 48,198,111,100, KIJA 20,824,888,369, PGEO 41,943,125,697, PTBA 11,520,659,250, DSSA 192,638,080,000.

Two counts differ from IDX today, for reasons of date and method. Neither is an
error and both are left unchanged:

- **DSSA** is stored as 154,732,123,250 shares, which is 6,189,284,930 shares at
  31 December 2025 times 25 and excludes treasury shares, as the company note says.
  IDX lists 192,638,080,000 shares and its register shows 33,913,012,750 held as
  treasury, leaving 158,725,067,250 outstanding. The 2.6% gap is the fall in
  treasury shares since 31 December 2025.
- **PGEO** is stored as 41,815,763,396 shares issued at 31 December 2025. The IDX
  register now sums to 41,948,436,343 (+0.3%). The report computes no PGEO market
  value.

## FY2025 results, with document and page locators

All three documents were downloaded from the issuer and read on 24 October 2026.

| Company | Document | PDF page | Figures |
| --- | --- | ---: | --- |
| PTBA | [Annual Report 2025](https://www.ptba.co.id/api/storage/1777608216188-530aad52-cfc2-40fc-8d3c-0afcaa236e6c.pdf) | 798 | Revenue Rp42,651,724m (FY2024 Rp42,764,968m) |
| PTBA | same | 799 | Profit attributable to owners of the parent Rp2,929,957m (FY2024 Rp5,103,720m) |
| PTBA | same | 801 | Net cash flows from operating activities Rp6,260,828m (FY2024 Rp5,049,190m) |
| PTBA | [FY2025 results release](https://www.ptba.co.id/api/storage/1775031467806-4819740c-1812-45f4-a5d0-520f4a4aebb0.pdf), 1 April 2026 | 2 and 7 | EBITDA Rp6,083,959m (FY2024 Rp8,304,264m) |
| DMAS | [Annual and Sustainability Report 2025](https://deltamas.id/wp-content/uploads/2026/05/ARSR-DMAS-2025.pdf) | 283 | Revenues Rp1,309,090,934,782 (FY2024 Rp2,032,677,883,645), profit attributable to owners of the parent Rp800,308,422,064 (FY2024 Rp1,333,657,486,567), down 40.0% |

The same statements are in the IDX archive (`FinancialStatement-2025-Tahunan-PTBA.pdf`
and `FinancialStatement-2025-Tahunan-DMAS.pdf` under the FY2025 audited reports).

### EBITDA

PTBA EBITDA is not a line in the audited statements. It is reported in the
company's FY2025 results release of 1 April 2026
([PDF](https://www.ptba.co.id/api/storage/1775031467806-4819740c-1812-45f4-a5d0-520f4a4aebb0.pdf)):
PDF page 2 (Indonesian) and page 7 (English) give EBITDA of Rp6,083,959 million for
FY2025 and Rp8,304,264 million for FY2024, and page 1 and page 6 round FY2025 to
Rp6.08 trillion with a 14% margin. The report's Rp6.08tn and Rp8.3tn inputs match,
so the earlier `secondary-sourced` limitation is removed. The page citation
now reads company-reported EBITDA from the FY2025 results release. Not reconciled:
the annual report's key-performance-indicator table (PDF page 424) shows EBITDA of
Rp5,875.43bn on a different company definition. The report keeps the release figure
and the rounding is unchanged.

## Page text

Three page notes that named Yahoo Finance now name IDX closes, and one loses an
old semicolon. The source list now says the 14 IDX and audited-statement entries
were rechecked on 24 October 2026, while the report keeps its 24 September 2026
observation dates. No chart, model input or result changes.
