# Independent water and technical-parameter audit

Review date: 2026-10-04. Reviewer scope: generated summary, its generator, methodology, limitations, YAML numerical selections, raw/processed water, PUE, climate and hardware records. Review occurred during the final pipeline refresh. No model/source files were changed by this audit.

**Assessment:** the water algebra and principal boundaries are defensible for explicitly conditional scenarios. No observed Indonesian national electricity or water total is inferred from the water benchmarks. Two wording improvements are recommended before delivery; a known pending processed-data refresh must also complete.

## Findings requiring editorial correction

### W1 — Make the joint low-case caveat visible in the standalone summary

Location: `src/research_summary.py:47`, immediately below the additional 1 GW low/base/high table.

The YAML correctly says PUE 1.20/WUE 0 is exploratory and not a validated joint engineering design. The standalone summary explains the zero-cooling-water boundary and independent trade-off table, but does not explicitly repeat the joint-pair qualification. A reader can reasonably read the low row as an attainable Indonesian dry-cooled design at 60% IT loading.

Neither the EDGE2 full-load design PUE nor the cooling benchmarks establish that joint operating point in Indonesia. [Digital Edge 2025](https://www.digitaledgedc.com/wp-content/uploads/2025/04/ESG_2025_Report_APR28.pdf) (WB009,p11) supplies a 1.24 design at 100% load. [Microsoft's engineering discussion](https://www.microsoft.com/en-us/microsoft-cloud/blog/2024/12/09/sustainable-by-design-next-generation-datacenters-consume-zero-water-for-cooling/) (WB015) explains that avoiding evaporative heat rejection can increase electrical cooling demand. It gives no Indonesian numeric penalty.

Suggested sentence: **“PUE and WUE are independent analytical inputs; the low PUE 1.2/WUE 0 pair is an exploratory resource bound, not a validated Indonesian cooling design.”** Also applicable to the low current-baseline row. No numerical change is required if the case remains an expressly conditional bound.

### W2 — Describe tariff-valued consumption consistently, without calling it an actual bill

Locations: `docs/methodology.md:24`, `:40`; `src/research_summary.py:99`.

The formula is consumption times a withdrawal/delivered-supply tariff. The surrounding text already recognizes blowdown and withdrawals. However, the methodology's “its bill are zero” and summary's “modest bill” weaken that correct distinction. Actual cooling and other metered supply can have a nonzero bill even when modeled evaporative consumption is zero.

Suggested terms: **“tariff-valued consumption proxy”**, **“modeled water-cost proxy”**, and **“small share of the modeled resource-cost proxy.”** Retain the existing note that actual supply/withdrawal bills need intake, returned flows, fees, treatment and local contracts. [PAM JAYA's schedule](https://pelanggan.pamjaya.co.id/pdf/tarif_air_minum.pdf) (WB001,PDF p2) supports the published price, not a measured facility withdrawal or total bill.

### W3 — Complete the already-planned raw-to-processed refresh

At review time `data/processed/wue_benchmarks.csv` still contained EDGE1/2's 1.082 in its standardized L/kWh column. The latest raw JSON correctly stores 1.082 in `reported_wue_value` and makes `wue_l_per_kwh` null because the webpage does not publish a unit, year or denominator. Regenerate processed data and the Excel benchmark sheets before delivery. This is a stale output identified during an active refresh, not a new model defect.

## Checks that passed

| Topic | Result |
| --- | --- |
| Water algebra | IT kWh multiplied by consumptive L/IT kWh, divided by 1,000; PUE is not multiplied into an IT-denominator WUE. |
| Reproducible 1 GW base | At 80% load, 7.008 IT TWh and PUE 1.3 produce 9.1104 facility TWh; WUE 0.5 produces 3.504 million m3/year and 9,600 m3/day. Rp21,500/m3 produces Rp75.336 billion of tariff-valued consumption. |
| WUE boundaries | Google 1.15 is explicit freshwater consumption (WB016); AWS 0.12 is withdrawal (WB014); Microsoft water use remains unspecified (WB013). All are external B, and none is silently used as Indonesian metered consumption. |
| Indonesian PUE | EDGE2/CGK design 1.24/1.25 are S. Historical PDG 1.79-1.95 are A with 2021 dates. Undated website EDGE1/2 specifications are conservatively S. |
| Scenario calibration | Expansion 1.2/1.3/1.5 and consumption 0/0.5/1.5 are S; current PUE 1.25/1.7/1.95 are separately selected stresses. High expansion 1.5 is expressly not a legacy maximum. |
| Tariff geography | Rp21,500 is a Jakarta large-industry >20 m3 marginal-band proxy, not a national tariff. Historical Batam schedules and missing Karawang/Bekasi scalar rates remain distinct. |
| Baseline scope | 322 MW is labeled a dated Greater Jakarta market estimate; derived consumption does not become a measured national total. Operator inventory is separate and incomplete. |
| Hardware | All ten rows are B. GPU TDP, server maxima and 120 kW GB200 rack rating are separate; estimated average server power remains null. B300 HGX 1100 W and GB300 NVL72 1400 W are distinct configurations. |
| Climate | 24 actual monthly rows cover 2024 Jakarta/Batam stations. Cikarang/Karawang/Bintan gaps are numeric nulls. Wet bulb is null everywhere; weather is contextual and does not drive an invented cooling model. |
| Local constraints | National TWh shares do not assert site/interconnection or island headroom. Water permits, dry-season allocations and local supply are diligence questions rather than fabricated available capacity. |

The numerical comparison independently checked the published water inputs and unit conversions, not electricity tariffs, national electricity statistics, project pipeline overlaps or Excel recalculation. Those remain the respective reviewers' responsibilities.

## Post-refresh acceptance

Verify that standardized EDGE1/2 WUE cells are missing while `reported_wue_value=1.082` remains visible with boundary notes; hardware rows retain B and their separate maximum-rating fields; all wet-bulb cells remain missing; and generated summary carries the joint low-case qualification. If those checks and the two wording edits are applied, no remaining substantive water-model issue was identified in this review.
