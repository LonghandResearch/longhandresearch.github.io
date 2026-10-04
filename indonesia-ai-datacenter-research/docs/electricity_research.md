# Indonesia electricity and data-center source audit

Research cutoff: 4 October 2026, Asia/Jakarta. Numerical observations and source metadata are frozen in `data/raw/observations/electricity.json`; short evidence transcriptions are in `data/raw/evidence/elec_*.json`. These observations concern Indonesia only. No global market total is used as an Indonesian proxy.

## National electricity denominator

[ESDM, Handbook of Energy and Economic Statistics of Indonesia 2025](https://www.esdm.go.id/assets/media/content/content-handbook-of-energy-and-economic-statistics-of-indonesia-2025.pdf), source **ELEC001**, supplies six annual observations. The [official handbook index](https://www.esdm.go.id/en/publikasi/handbook-of-energy-economic-statistics-of-indonesia) dates this edition 12 August 2026. PDF page numbers below are one-based; printed pages differ.

| Year | National electricity utilization, TWh | PLN sales including PLN Batam, TWh | Installed generation capacity, GW | PLN peak load, GW |
|---|---:|---:|---:|---:|
| 2020 | 292.953 | 243.583 | 72.76677 | 41.761 |
| 2021 | 314.123 | 257.634 | 74.55689 | 42.785 |
| 2022 | 340.642 | 273.761 | 83.84283 | 42.814 |
| 2023 | 369.722 | 288.436 | 91.20303 | 58.282 |
| 2024 | 409.605 | 306.219 | 100.64877 | 61.288 |
| 2025 | 455.001 | 317.692 | 107.49889 | 65.134 |

The national consumption series is table 6.4.4, printed pages 112–113 / PDF pages 128–129. Its 2025 total is 455,001 GWh: PLN sales 317,692 GWh plus non-PLN consumption 137,309 GWh. Consumption is distinct from generation and PLN sales. The reported 2020 sum differs from the reported grand total by 1 GWh due to source rounding; retain the published grand total.

Installed capacity comes from tables 6.4.1A/B, printed pages 100–103 / PDF pages 116–119. Capacity is generation capacity, not delivered energy, available reserve, or data-center connection capacity. The source changes its ownership classification in 2025.

Peak load comes from table 6.4.8, printed page 117 / PDF page 133. The source explicitly restricts this measure to PLN. Its 2025 figure is unaudited. It is not a verified synchronized peak for all Indonesia, and the 2023 step should not be interpreted without investigating source comparability.

### Generation and mix limitations

Tables 6.4.2A/B, printed pages 106–110 / PDF pages 122–126, report the following generation totals: 291.831, 309.076, 333.537, 350.609, 371.572 and 494.353 TWh for 2020–2025. Historical generation is below the wider consumption series in several years. The source introduces an ownership-based classification in 2025, reporting 144.470 TWh for IUPTLS and PPU generation alongside PLN generation and purchases. Earlier off-grid tables do not separately expose the same fossil-generation components. Preserve the reported observations and the boundary warning; do not force an energy balance or claim a physical shortage from this mismatch. The apparent 2024–2025 growth is not a defensible like-for-like growth rate.

For 2025 only, matching components across PLN own generation, PLN purchases and IUPTLS/PPU yield the following arithmetic estimates, class **E**:

| Component | GWh numerator | Formula |
|---|---:|---|
| Gas | 70,154 | numerator / 494,353 × 100 |
| Hydro, including mini/micro hydro | 30,736 | numerator / 494,353 × 100 |
| Geothermal | 17,740 | numerator / 494,353 × 100 |
| Solar | 1,522 | numerator / 494,353 × 100 |
| Other renewables: bioenergy and wind | 28,410 | numerator / 494,353 × 100 |
| Steam generation, separately recorded | 334,346 | numerator / 494,353 × 100 |
| Diesel generation, separately recorded | 11,445 | numerator / 494,353 × 100 |

The seven numerators sum exactly to 494,353 GWh. **Steam is not automatically coal**: this table does not provide a complete verified fuel allocation for every steam generator. `coal_share_pct` is therefore unknown. Historical national fuel-share fields also remain unknown, rather than substituting PLN-only fuel shares. The data record labels the reported totals **A**, mix arithmetic **E**, and the mixed metrics separately.

## Electricity tariffs

[PLN's signed July–September 2026 tariff schedule](https://www.pln.co.id/webapi/media/file/webkorp/asset/1fa2814b-6ffd-459b-ac16-d46e515a0b3b.pdf), source **ELEC002**, was retrieved from the [official tariff archive](https://www.pln.co.id/dokumen-tariff-adjustment-id). The original one-page PDF is preserved as `data/raw/evidence/elec_tariff_2026q3.pdf` and was visually inspected.

| Class | Eligibility | Offpeak energy | Peak energy |
|---|---|---:|---|
| B-3 | Medium/high voltage, above 200 kVA | Rp1,035.78/kWh | K × Rp1,035.78/kWh |
| I-3 | Medium voltage, above 200 kVA | Rp1,035.78/kWh | K × Rp1,035.78/kWh |
| I-4 | High voltage, at least 30,000 kVA | Rp996.74/kWh | Rp996.74/kWh |

For B-3/I-3, PLN sets K according to local system load, with 1.4 ≤ K ≤ 2.0. A site's blended rate depends on the peak/offpeak energy split and its contract. The Rp1,114.74 figure in these rows is a **reactive-energy charge per kVArh**, not the offpeak energy charge per kWh. Reactive charges apply if average monthly power factor is below 0.85. The tariff rows preserve this distinction.

The schedule also sets minimum bills based on 40 equivalent operating hours per month multiplied by connected kVA and the specified energy rate. The simple annual model captures the energy component only; it does not model taxes, reactive penalties, minimum bills, connection works, demand/service premiums or negotiated reliability terms. Published premium-service contract rates for a representative Indonesian data center were not verified and remain unknown.

An I-4 rate can be used only as an explicitly hypothetical qualifying high-voltage industrial contract. It is not a nationwide rate paid by all Indonesian data centers. The observed schedule covers 1 July–30 September 2026. No fourth-quarter schedule was verified, so this source supports the latest verified quarter rather than a claim that the rate is effective on 4 October.

## Market capacity anchors and conflicts

[Cushman & Wakefield's H2 2025 release](https://cw-prod-amrgws-a-cd.cushwake.com/en/singapore/news/2026/03/apac-data-centre-development-pipeline-hits-record-in-2025), source **ELEC004**, published 27 March 2026, reports **Greater Jakarta** operational IT capacity of 322 MW, 186 MW under construction and 901 MW planned. Its colocation vacancy is 24.9%. These are industry estimates, class **E**, not metered electricity consumption or an Indonesia census. Vacancy is not equipment utilization. The planned/under-construction observations cannot be treated as operational electricity load.

[Cushman & Wakefield's H1 2026 release](https://cw-prod-amrgws-a-cd.cushwake.com/en/singapore/news/2026/08/apac-dc-h1-2026), source **ELEC006**, published 5 August 2026, updates Jakarta's development pipeline to 1,699 MW including 395 MW under construction. The planned remainder, **1,304 MW = 1,699 − 395**, is a separately labeled derived estimate. The release does not state Jakarta operational capacity, so the dated 322 MW operational observation remains a 2025 baseline; it must not be described as a measured October 2026 total. The earlier 186/901 MW pipeline should not be added to the newer 395/1,304 MW pipeline.

[Komdigi's 22 May 2026 release](https://portal.komdigi.go.id/kanal-publik/berita-kini/10247), source **ELEC005**, reports 185 Indonesian data centers and aggregate capacity of 274 MW, plus a target above 2,000 MW by 2029. It does not disclose IT versus facility power, sample coverage, or the capacity-counting method. The country figure is incompatible with the metropolitan IT estimate if both were interpreted as complete comparable censuses. Preserve the reported statement, class **A**, and target lower bound, class **S**, while excluding them from confirmed IT-capacity modeling.

There is no validated national aggregate metered electricity-consumption observation in these sources. A utilization/PUE calculation using 322 MW is a **dated Greater Jakarta modeled illustration**, not Indonesia's total consumption today. A scenario that activates fractions of the Jakarta construction/planned pipeline is a transparent stress envelope; it is not a probability-weighted forecast or an Indonesia national forecast. Indonesian operator disclosures elsewhere in the repository provide complementary partial coverage, including Batam, and should not be mechanically added to an overlapping metropolitan market total.

## RUPTL outlook and grid constraints

[PLN RUPTL 2025–2034](https://www.pln.co.id/webapi/media/file/webkorp/asset/b967d-ruptl-pln-2025-2034-pub-.pdf), source **ELEC003**, is approved by ministerial decree 188.K/TL.03/MEM.L/2025, dated 26 May 2025. The complete 1,253-page PDF was obtained from an [archived copy of the original Gatrik PDF](https://web.archive.org/web/20260311161557id_/https://gatrik.esdm.go.id/assets/uploads/download_index/files/b967d-ruptl-pln-2025-2034-pub-.pdf); the snapshot stores the retrieved file's SHA-256. The live Gatrik address returned an HTML application during retrieval, and the live PLN PDF endpoint was impractically slow. The archived retrieval is disclosed rather than hidden.

Table 5.67, printed page V-87 / PDF page 323, forecasts PLN sales as follows:

| Year | PLN sales forecast, TWh |
|---|---:|
| 2025 | 323.044 |
| 2026 | 339.974 |
| 2027 | 360.120 |
| 2028 | 377.709 |
| 2029 | 396.065 |
| 2030 | 416.035 |
| 2031 | 440.337 |
| 2032 | 467.876 |
| 2033 | 491.843 |
| 2034 | 510.575 |

These are **S** official forecasts published in 2025, not actual observations. The plan's PLN sales boundary excludes non-PLN consumption; its 2030 forecast must not be labeled national electricity consumption. Modeled future load can be compared with forecast PLN sales and, separately, the explicitly fixed 2025 national-consumption denominator. These comparisons answer different questions.

A full-text review of the PDF found no standalone national data-center electricity-energy forecast. Its Jakarta demand discussion, printed B-6 / PDF page 816, highlights prospective data-center connections in 2027–2029. Its West Java discussion, printed B-37 / PDF page 847, includes large prospective data-center customers in demand projections and discusses generation/transmission/substation preparation. Provincial sales totals include all sectors; their increase cannot be attributed solely to data centers.

Annex E, printed E-25–E-29 / PDF pages 1226–1230, provides specific **apparent connection capacity in MVA**, including STT GDC JKT1-1/JKT1-2 rising to 450 MVA by 2030 and Sinar Mas Land 1/2 at 400 MVA by 2029. The latter plan discusses 150 kV Rasuna Said/Sinarmas supply and a possible 275 kV Sinarmas substation. These examples substantiate concentrated local-grid investment needs. They are planned connection envelopes, not IT MW or measured annual electricity. A MVA-to-real-MW conversion requires a disclosed power-factor assumption; deriving IT MW additionally requires a facility-power boundary/PUE assumption. Do not add these to the C&W IT pipeline or facility capacity inventory.

RUPTL's 1,744 MVA Sumatra/Batam/Bintan prospective high-voltage group mixes industrial users and possible data centers. A 1,500 MVA Bintan entry combines an alumina project and/or possible data-center demand. Neither is a validated data-center-only IT forecast. The plan's roughly 3 GW Batam/Bintan demand discussion concerns regional demand with digital development, rather than 3 GW of data-center IT capacity.

## Figures excluded from modeling

- KPMG's March 2026 report contains a 2030 data-center energy figure of 18,993 GWh, but its displayed source list cites third-party articles rather than an identifiable PLN forecast table. It was not promoted to an official RUPTL forecast.
- Media-reported capacity figures with no confirmed IT/facility boundary or originating primary table were not selected as national IT anchors.
- A media-reported PLN customer energy total of 2,378 GWh did not establish its measurement period. It was not annualized or presented as Indonesia's current annual data-center consumption.
- Generation capacity, grid connection MVA, and construction pipeline are kept separate from actual electricity consumption.

## Reproducibility

All annual GWh values are divided by 1,000 for TWh; MW values by 1,000 for GW. Reported observations retain class **A** after unit conversion. Only the component share arithmetic and planned-pipeline subtraction carry class **E**. Official forecasts/policy targets and analyst pipeline-realization scenarios carry class **S**. Unknown definitions and missing fuel shares remain JSON `null` and processed `NaN`.

Evidence JSON files store URLs, publication/access dates, source/table locators, transcribed values, and PDF hashes where available. They contain short factual paraphrases rather than republishing full research reports. The one-page official tariff schedule is retained so the energy/reactive-charge distinction can be independently checked.
