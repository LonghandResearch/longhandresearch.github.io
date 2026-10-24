# QA-005: independent review of RPT-013, Higher Yields, Uneven Effects

Reviewer: Claude, 24 October 2026. First independent second-agent review of the
US Treasury macro report (`reports/US_Treasury_Repricing_Update_2026-10-08.pdf`),
published under Codex review during the takeover. The source record in
`audits/RPT-013-2026-10-08.md` was used as the checklist and every primary
series below was re-read.

**Result: no error found. No change to the report.**

| Source | Checked | Result |
| --- | --- | --- |
| US Treasury daily par yield tables, July, September and October 2026 | 2, 5, 10 and 30-year on 6 July, 4 September, 29 September and 6 October | All sixteen match. Changes +66/+82/+79/+65 bp over three months and -10/-3/+1/+5 bp in the final week recompute |
| FRED DGS10, DFII10, T10YIE | 6 July to 6 October | 4.48 to 5.27, 2.24 to 2.91, 2.24 to 2.36 match (+79 = 67 + 12 bp) |
| FRED THREEFY10, THREEFYTP10 (Kim-Wright) | 6 July to 2 October | 4.5222 to 5.2551 and 0.7261 to 1.0847 match (+73.29 and +35.86 bp) |
| FRED SP500 | 6 July to 6 October | 7,537.43 to 7,818.93 match (+3.73%) |
| FRED DTWEXBGS | 28 September to 2 October | 120.6958 to 121.3848 match (+0.57%) |
| FRED MORTGAGE30US (Freddie Mac PMMS) | 2 July and 1 October | 6.43% and 7.28% match (+85 bp) |
| ALFRED NFCI, vintages of 7, 8 and 14 October | Weeks ending 4 September and 2 October | -0.545 and -0.494 match (+0.051) |
| ALFRED NEWORDER and ANXAVS, vintage of 8 October | July and August | 86,295 to 87,640 (+1.56%) and 84,506 to 84,960 (+0.54%) match |
| FOMC statement, 16 September 2026 | Decision | +25 bp to 3.75 to 4.00% matches |

## Revisions since publication

NFCI is revised every week. The vintage of 21 October shows -0.544 and -0.508
(+0.036) for the same two weeks. The report correctly used the values available
on its 8 October assessment date, and its source record already says FRED
observations can change. The direction (slightly tighter, still looser than
average) is unchanged. No correction is needed.

## Not re-read in this pass

The BEA personal income and GDP releases, the BLS CPI release and the Census
construction and new-home-sales tables (report pages 5 to 7) were not reopened.
They are listed with exact locations in the original source record.
