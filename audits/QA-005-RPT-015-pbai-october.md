# QA-005: independent review of RPT-015, The Power Behind AI: October Checkpoint

Reviewer: Claude, 24 October 2026. First independent second-agent review of the
supplement (Codex author QA at publication). Reviewed against `QA.md` using
`updates/power-behind-ai-2026-10-09.json` and the live page with every
disclosure opened.

**Result: no error found. No change to the report.**

## Prices

All 110 stored observations (ten tickers, eleven sessions each, 24 September
to 8 October) were compared with a read-only query of the Flowless
`fact_daily` table: close, volume and frequency match exactly for every row.

- Displayed changes recompute from first and last close: DCII -0.76%, TLKM
  -6.22%, ISAT -10.83%, EXCL -2.50%, MTEL -7.05%, DMAS -2.08%, KIJA -11.93%,
  PGEO -7.01%, PTBA +8.85%, DSSA +0.92%. "8 of 10 names closed below" and the
  largest gain and decline are correct.
- The 24 September baselines equal the September report's prices in
  `assets/js/pbai/data.js` for all ten names, as the page states.
- JISDOR on 8 October, Rp17,890, matches the BI workbook the owner supplied
  for the 5 to 9 October IHSG edition.

## Capacity

- Cushman & Wakefield, 27 March 2026: Greater Jakarta H2 2025 322 MW
  operational, 186 MW under construction, 901 MW planned. Match.
- Cushman & Wakefield, 5 August 2026: Jakarta 1,699 MW pipeline (+56%) and
  395 MW under construction (+112%), with no new operational total. Match.
- Derived figures: pipeline 1,087 to 1,699 MW is +612 MW (56.3%), under
  construction +209 MW, planned remainder 1,304 MW. All correct.

## Project checkpoints

| Project | Source | Result |
| --- | --- | --- |
| PDG JC3 | PDG release, 19 November 2025 | 120 MW, GIIC Bekasi, first phase ready for service by Q4 2026. Match |
| Digital Edge CGK | Digital Edge release, 28 January 2026 | 500 MW IT at full development; buildings Q4 2026, Q1 2027, Q2 2027. Match |
| PDG JC4 | PDG release, 30 April 2026 | 240 MW in four 60 MW buildings; construction commenced. Match |
| NeutraDC Batam | Telkom release, 7 September 2026 | 49.9 MW effective capacity; Batam 6 MW targeted for H2 2026. Match |
| NeutraDC 1 GW | Telkom release, 22 September 2026 | Up to 1 GW plan; investment validation still ahead. Match |

The PLN tariff-document statement is dated to 9 October and was not re-tested
retrospectively.

## Note for the source replacement task

Because the September report's 24 September closes equal the IDX feed exactly,
the Yahoo Finance price citations in The Power Behind AI can be re-pointed to
the IDX Stock Summary without changing any figure.
