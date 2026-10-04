# Model verification

Review date: 4 October 2026. This review checked the Python formulas, their tests, the saved validation records and the documented source decisions. It confirms the arithmetic and the treatment of missing data. It does not independently reverify every source publication or establish an observed national data center total.

## Numerical checks

All 25 tests passed with `python -m unittest discover -s tests -v`. The tests include an independent 1 MW calculation over 8,760 hours, energy and water unit conversions, invalid inputs, zero capacity, zero consumptive WUE and proportional scaling. Temporary corruption fixtures check whether validation rejects duplicated projects, planned capacity classified as operational, missing source references, future source dates, invalid PUE and a wrong water denominator. The fixtures never change the research observations.

The base additional 1 GW case uses 80% average electrical load, PUE 1.3 and consumptive WUE 0.5 L per IT kWh. Its results reconcile as follows.

| Calculation | Result |
| --- | ---: |
| IT electricity | 7.008 TWh per year |
| Total facility electricity | 9.1104 TWh per year |
| Electricity energy charge at Rp996.74 per kWh | Rp9.080700096 trillion per year |
| Direct cooling consumption | 3,504,000 m3 per year |
| Annual average cooling consumption | 9,600 m3 per day |
| Water cost proxy at Rp21,500 per m3 | Rp75.336 billion per year |
| Facility electricity divided by 2025 national consumption | 2.0022813% |

Water uses IT electricity before PUE. Using total facility electricity would overstate a WUE defined per IT kWh. Connection MVA is converted to real MW only with an explicit power-factor assumption. That conversion does not establish IT capacity. Reported grid MW remains separate from an alternative model conversion.

## Evidence boundaries

The saved validation log contains no errors and 14 warnings. The warnings preserve missing values, overlapping announcements and incompatible source definitions. They are research limits, not instructions to replace unknown values with zero.

The 322 MW baseline is a dated Greater Jakarta market estimate. The 283.6 MW operator subtotal is a separate, incomplete set of disclosed operational IT capacity. Adding them would count overlapping facilities twice. Current consumption estimates apply assumptions to those capacity observations. They are not metered national consumption.

The 2030 to 2032 outlook activates a documented subset of disclosed capacity. Its mixed observation dates, commissioning assumptions and incomplete country coverage are explicit. Future national electricity growth is an analyst scenario. Official RUPTL PLN sales forecasts retain their narrower scope.

The electricity rate is the verified third quarter 2026 I-4 energy tariff applied to a hypothetical qualifying contract. It is not a confirmed fourth quarter rate or an all-in operator bill. The water price is a Jakarta marginal tariff proxy. Utilities normally bill delivered or withdrawn water, which can exceed modeled consumption.

The low PUE 1.2 and zero WUE pair is an exploratory bound. It does not validate an Indonesian cooling design or establish zero facility withdrawals. Foreign benchmarks remain labeled B. EDGE1 and EDGE2's published WUE value of 1.082 is retained separately, with standardized L per kWh missing because its unit is unverified.

## Reproduction record

`outputs/run_manifest.json` records the Python environment and hashes of inputs and processed datasets. `outputs/validation.log` records the data checks. Workbook calculation checks are recorded separately in `outputs/workbook_validation.json` and explained in `workbook_notes.md`. Local grid headroom, dry season supply, negotiated tariffs and facility operating performance require additional evidence.
