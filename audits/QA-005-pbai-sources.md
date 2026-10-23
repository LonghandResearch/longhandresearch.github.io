# QA-005: primary sources for The Power Behind AI market data

24 October 2026, Claude. Fourteen citations in `assets/js/pbai/data.js` pointed at
secondary market-data sites. Each figure was re-read from the exchange or the
issuer, and every figure matched, so only the citations change.

## Prices (ten tickers, previously Yahoo Finance)

IDX Stock Summary (`GetStockSummary`) for 30 December 2021, 30 December 2022,
29 December 2023, 30 December 2024 and 30 December 2025, read in the browser on
the IDX site, plus the 24 September 2026 closes from the IDX feed (see
`QA-005-RPT-015-pbai-october.md`):

- All 47 available year-end closes equal the stored `priceHistory` values once
  splits are applied. ISAT before FY2024 is the raw close divided by 4 (2024 1:4
  split). DSSA before FY2024 is divided by 250, and FY2024 to FY2025 by 25 (2024
  and 2026 splits). Every other ticker matches the raw close exactly. PGEO listed
  in 2023.
- All ten 24 September closes match.

## Share counts (DMAS and KIJA, previously LembarSaham)

IDX listed-company profile, shareholder register summed: DMAS 48,198,111,100 and
KIJA 20,824,888,369. Both match. The same check also confirms DCII
(2,383,745,900) and TLKM (99,062,216,600).

## FY2025 results (PTBA and DMAS, previously StockWatch)

Audited FY2025 statements from the IDX financial-report archive, read in the
browser:

- PTBA: sales and revenue Rp42,651,724m (FY2024 Rp42,764,968m), profit
  attributable to the parent Rp2,929,957m (FY2024 Rp5,103,720m), net operating
  cash flow Rp6,260,828m (FY2024 Rp5,049,190m). All match the stored figures.
  EBITDA (Rp6.08tn) is not a line in the audited statements. It is the
  company-reported figure from its 1 April 2026 results release, confirmed
  through Bisnis Indonesia, and the citation now says so.
- DMAS: profit attributable to the parent Rp800,308,422,064 against
  Rp1,333,657,486,567, down 40.0%. Matches.

## Page text

Three page notes that named Yahoo Finance now name IDX closes. One of them also
loses a semicolon. No chart, model input or result changes.
