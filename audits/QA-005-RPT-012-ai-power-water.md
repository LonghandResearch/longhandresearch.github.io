# QA-005: independent review of RPT-012, AI Runs on Power and Water

Reviewer: Claude, 24 October 2026. First independent second-agent review of the
Indonesia AI and data-center resource study (published under Codex review
during the takeover). This is a sample review: the project holds about 500
numeric source observations, so the largest inputs were traced to their
primary documents and the arithmetic was left to the project's own
reproduction check.

**Result: no error found. No change to the report.**

## Reproduction

The pull-request workflow "Reproduce Indonesia resource research" reruns
`src/pipeline.py` and the project's unit tests from the committed raw
observations. It passes on current `main`, so every calculated table, chart
and the interactive `data.json` follow from the stored inputs.

## Inputs traced to primary sources

ESDM, Handbook of Energy and Economic Statistics of Indonesia 2025, Table 6.4.4
(PDF pages 128 to 129):

| Measure | Stored | Source |
| --- | --- | --- |
| PLN electricity sales 2025 | 317,692 GWh | 317,692 |
| Non-PLN consumption 2025 | 137,309 GWh | 137,309 |
| National utilisation 2025 | 455,001 GWh | 455,001 |
| National utilisation 2024 | 409,605 GWh | 409,605 |

## Check on a series break

The same source shows reported generation jumping from 371,572 GWh (2024) to
494,353 GWh (2025), against a consumption rise of about 11%. The source record
already notes that generation was reclassified in 2025, and
`src/national_impact.py` deliberately refuses to use generation as the national
denominator ("do not substitute generation"). Generation is not charted as a
time series. The break is handled correctly.

## Not re-read in this pass

PLN tariff schedules, water tariffs (PAM Jaya and Air Batam evidence images are
stored in `data/raw/evidence/`), PUE and WUE benchmarks and the project
register. Their locators are in `sources.csv` and the evidence files.
