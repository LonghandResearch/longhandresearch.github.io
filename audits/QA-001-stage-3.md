# QA-001, stage 3: The Power Behind AI (in progress)

This stage is **not complete** and should not be merged as a finished figure audit. This log records the source checks made on 27 September 2026 and the remaining work.

| Item | Evidence checked | Result |
| --- | --- | --- |
| Global data-centre electricity | [IEA executive summary](https://www.iea.org/reports/energy-and-ai/executive-summary) | 415 TWh / about 1.5% in 2024 and about 945 TWh by 2030 match. |
| Default PUE | [Uptime Institute 2025 survey](https://datacenter.uptimeinstitute.com/rs/711-RIA-145/images/2025.Annual.Survey.Report.pdf?version=0) | 1.54 is the reported 2025 average. The report explicitly names the survey year; this is a model input, not a claim about every new Indonesian hall. |
| PLN capacity and load | [Detik's report of PLN's statement](https://finance.detik.com/energi/d-8675431/pln-perkuat-infrastruktur-hadapi-lonjakan-listrik-data-center-di-2034) | The reported 580 MW (2026), 3.5 GW (2030), 25,297 MW (2034), 159 customers, about 1,990 MVA connected and 99% in Java-Madura-Bali match. A direct PLN release for this forum statement was not located; this remains secondary-source verification. IT MW and connected MVA are different measures and must not be added. |
| Digital Edge CGK | [Developer announcement](https://www.digitaledgedc.com/resources/newsroom/digital-edge-4-5b-cgk-500mw-ai-ready-hyperscale-campus-indonesia/) | US$4.5bn, 500 MW, and Q4 2026 / Q1 2027 / Q2 2027 building targets match. The source registry incorrectly dated the announcement 2025; corrected to 28 January 2026. |
| PDG JC3 and JC4 | [JC3 announcement](https://princetondg.com/press-releases/princeton-digital-group-breaks-ground-on-milestone-usd-1-billion-120-mw-greater-jakarta-campus/), [JC4 announcement](https://princetondg.com/press-releases/pdg-acquires-240-mw-of-powered-land-in-jakarta-advancing-its-rapid-expansion-across-asia/) | JC3 US$1bn / 120 MW and Q4 2026 first-phase target match. JC4 240 MW, four 60 MW buildings and construction status match. |
| Derived power cost | Calculator defaults in `assets/js/pbai/data.js` | 100 MW × 70% × 1.54 × 8,760 h × Rp997/kWh = about Rp941.5bn/year, consistent with the page's rounded Rp941bn. 3,500 MW × 70% × 1.5 × 8,760 h = 32.2 TWh/year, consistent with the rounded 32 TWh claim. |

## Still required before review

- Verify the Cushman & Wakefield Jakarta-specific 1,699 MW and 395 MW against the original H1 2026 report. Its public press page confirms the APAC total but not those city figures. The linked interactive report was not text-extractable in this pass.
- Check every project milestone and capacity against its cited announcement, including whether the DayOne NDP1 opening date and operational status are supported by a dated source.
- Obtain the company annual and interim filings behind the ten company panels. Many registry entries link to a generic IDX filing index, not to a specific document, so their five-year financial series and valuation multiples are not yet independently verified.
- Check all remaining derived chart, table, DCF and Monte Carlo outputs, source links and the page at desktop and phone widths. Run the full QA checklist before marking this stage Review.
