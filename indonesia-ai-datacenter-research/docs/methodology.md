# Methodology

## Evidence and scope

Only Indonesian sites, electricity statistics, tariffs, climate and market projections determine country infrastructure quantities. Technical parameters may use clearly labeled foreign benchmarks when a comparable Indonesian disclosure is absent. Raw observation files retain numbers, original units, status, definitions and source locators. Sources are registered with organization, quality tier, publication/access dates and geography. `collect_data.py` creates hashes and optionally archives exact live response bytes without overwriting historical evidence. Offline reproduction uses committed curated observations; it does not promise that today's websites will expose an identical table.

Every numerical source row and calculated row carries A/E/B/S. Column-level classifications take precedence over the general row classification when a row contains reported and converted values. A covers a reported project announcement even if the capacity is planned; it is not evidence of operating capacity. E conversions retain their source and assumptions. Design PUE/WUE are distinguished from measured values. No duplicate campus/phase quantity enters the documented capacity total.

## Definitions and equations

Capacity is a stock of power in MW. Energy is a flow accumulated over hours. IT power excludes cooling and facility distribution losses. Facility power includes that overhead. Connection MVA is apparent power, not real MW and not usable IT capacity.

```
connection real MW = apparent MVA × power factor                       [E]
IT MWh/year = IT MW × utilization × hours/year                         [S/E]
IT GWh/year = IT MWh/year / 1,000
IT TWh/year = IT MWh/year / 1,000,000
facility MWh/year = IT MWh/year × PUE
facility kWh/year = facility MWh/year × 1,000
electricity charge Rp/year = facility kWh/year × tariff Rp/kWh
modeled consumptive liters/year = IT kWh/year × consumptive WUE L/kWh
modeled consumptive m3/year = liters/year / 1,000
modeled consumptive million liters/year = liters/year / 1,000,000
water charge Rp/year = modeled consumptive m3/year × local tariff Rp/m3
electricity cost share = electricity charge / total resource charges
water cost share = water charge / total resource charges
national consumption share % = facility TWh / national consumption TWh × 100
PLN sales share % = facility TWh / PLN sales TWh × 100
average delivered facility GW = facility TWh × 1,000 / hours/year
annual-energy-equivalent generation GW = delivered GW / generation capacity factor
full IT nameplate facility MW = IT MW × PUE
```

The modeled utilization parameter is an **average electrical load factor**, not commercial occupancy, CPU utilization or GPU activity. The standard 8,760-hour convention represents a steady-state non-leap annual run rate. Capacity in an outlook year is in-service/run-rate capacity, not average commissioned capacity during that year. Monthly outputs equal annual outputs / 12; no seasonal or calendar-month profile is implied. The continuous generation comparison is average power delivered, not reserve-secured installed capacity. Generation capacity factor, national denominator growth and future resource intensities are analyst scenarios.

## Water boundary

Withdrawals measure intake; consumption measures water not returned to the source. WUE publications can use intake, withdrawal, consumption, or an unspecified water-use boundary. Those observations remain separate in `wue_benchmarks.csv` with notes/definition fields. The water model specifically applies a **scenario consumptive WUE** per IT kWh, rather than substituting facility energy. It excludes indirect electricity-production water, sanitary/domestic water and upstream hardware manufacturing water.

A municipal bill ordinarily measures withdrawal/delivered water. Charging modeled consumption at a published tariff is an explicit cost approximation. Actual billed intake can be higher because of blowdown or other returned flows. With consumptive WUE zero, modeled cooling consumption and its tariff-valued proxy are zero; that is not a claim of zero facility withdrawals or an actual zero bill. Daily water is annual average / 365, not a seasonal maximum. Supply diligence requires dry-season peak demand and utility allocation data not available here.

## Capacity inventory and current baseline

An included inventory row must have a clearly identified IT capacity basis. Ambiguous facility MW, connection MVA, portfolio-only headline numbers, ultimate campus overlaps and historical conflicting versions are retained but excluded. Unknown operational capacity is NaN, not zero. Operational commissioning evidence governs status; announced completion dates do not automatically roll into operating assets. Pipeline/status figures are not multiplied by 8,760 as current consumption.

The inventory is a partial disclosure sample, not a market census. A separately sourced metro market IT estimate provides a dated comparison baseline; it is never added to facility rows. Current baseline consumption is E because energy is inferred from a source capacity estimate using assumed utilization, existing-fleet PUE and consumptive WUE. No national current measured total is claimed. Current-fleet PUE settings are separate from efficient new-build expansion assumptions.

## Outlook and sensitivity

Three 2030–2032 capacity/resource cases retain Indonesia-specific official/industry anchors in `market_anchors.csv` and the source IDs/rationale in `assumptions.yaml`. Anchor definition and date are preserved. Deviations and interpolation/extrapolation are S, not official projections. When an official forecast describes energy or connection power, any implied IT MW conversion is explicitly E/S and does not change the source's own forecast. The model preserves anchors rather than labeling arbitrary extrapolation as an official forecast.

National shares against the latest actual consumption year are comparison ratios. A separate future-national-consumption scenario is labeled S and includes its CAGR; no future national denominator is silently treated as actual. PLN shares use PLN-group sales, whose scope differs from national consumption.

One-driver sensitivity uses the requested PUE, WUE, load-factor and tariff grids with other drivers held at base. PUE affects facility electricity but not IT-denominator water at a fixed IT load. WUE affects water but not electricity in this simplified model. Load factor changes both. The two-dimensional PUE/WUE table explores possible parameter combinations rather than predicting a cooling design curve. Real engineering trade-offs require a climate/site/design model.

## Cost scope, validation and reproducibility

Electricity costs are energy charges before demand/minimum-bill rules, reactive charges, time-of-use changes, taxes, service premiums and backup generation fuel. The tariff database preserves peak/off-peak, contract eligibility, reactive-energy exclusions and historical effective periods. Water tariffs retain local provider/customer/band dates; Jakarta is explicitly a local scenario proxy. Resource costs are nominal rupiah without FX, inflation, capex or investment returns. No operator valuation or investment recommendation is inferred.

Validation checks required schemas, provenance IDs, dates, duplicates, nonnegative tariffs/capacities, climate bounds, PUE ≥1, MVA conversion, operational status and model algebra. Warnings retain incomplete data and uncertainties. Independent tests check 1 MW × 8,760 hours, factors of 1,000, IT water denominator, zero/bad inputs, linear scaling and changes to assumptions. Input and processed-file hashes are logged. Notebook executions use the same functions and tables. Excel formulas mirror the Python algebra and source assumptions; initial formula caches are generated from the corresponding Python results, with automatic recalculation requested on open. Document any independent formula-engine verification separately rather than claiming native Excel testing.
