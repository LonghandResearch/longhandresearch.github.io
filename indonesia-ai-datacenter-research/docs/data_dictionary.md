# Data dictionary

CSV missing numeric data is written `NaN`; source JSON uses null. Boolean attributes are true/false only when known; unknown is null. Strings such as `Not disclosed` describe nonnumeric metadata. Each table contains `source_id` and `data_class`; additional per-field classification/source columns preserve mixed definitions.

| Dataset | Grain and key | Quantities and important definitions |
| --- | --- | --- |
| sources.csv | One source; source_id | Source organization, title, URL, date, type, geography, facility, metric, unit, status, tier and caveats. MODEL001 is an analyst assumption record, not a publication. |
| datacenter_projects.csv | One included project/phase or excluded conflicting observation; project_id | Status-separated IT operational/construction/committed/planned/potential MW. Separate connection MVA/MW. Reported ambiguous MW may be in reported_capacity_mw. capacity_basis and include_in_inventory govern aggregation. Investment is announced US dollars, not spent capex or energy cost. |
| indonesia_electricity.csv | Calendar year | National generation/consumption and PLN-group sales in TWh; installed national capacity and reported peak scope in GW. Fuel shares are percentages in 0–100 units with scope in notes. No sum or missing-technology zero is assumed. |
| electricity_tariffs.csv | Contract class and billing component/effective period | Active energy in Rp/kWh; time-of-use/eligibility/exclusions in notes. Reactive Rp/kVArh must remain separate and is not multiplied by facility kWh. Negotiated premium rate missing means unknown, not zero. |
| water_tariffs.csv | Local provider/customer/band/effective schedule | Rp/m3 delivered water; geographic, customer/band applicability and historical-date caveats. Not a national schedule. |
| climate.csv | Weather station/location and year/month, where available | Degrees C, RH percentage, rainfall mm; missing wet-bulb C remains NaN. Station data does not become a nearby city's measured observation. |
| pue_benchmarks.csv | Operator/site or benchmark/year | Dimensionless PUE; observed versus design, country and year explicit. Design targets S; external observations B. |
| wue_benchmarks.csv | Operator/site/benchmark/year | Liters per denominator kWh; water measure and IT/facility denominator explicit. Consumption, withdrawal and unspecified water use are separate. |
| ai_hardware.csv | Accelerator/server/rack specification | Accelerator TDP W, server maximum power kW, rack density kW and cooling requirements. External manufacturer specifications B; calculated server/rack estimates E. |
| market_anchors.csv | Source-defined country/metro current or outlook metric | Values, units, year, geography, IT/facility/unknown basis and status. Official unspecified MW is not an operational IT estimate. |
| capacity_scenarios.csv | IT MW × low/base/high | All modeled annual quantities S: IT/facility MWh/GWh/TWh/kWh, monthly averages, annual/monthly Rp, consumptive water liters/million liters/m3/day, resource cost shares. |
| current_baseline_estimates.csv | Dated sourced market baseline × current-resource case | E modeled consumption; capacity scope/date/source separately visible. Includes national comparison percentages, not measured national DC energy. |
| documented_inventory_estimates.csv | Partial explicit operational IT inventory × current-resource case | E source-capacity-to-consumption estimate. Partial census not a full-country total. |
| sensitivity.csv | Driver × requested value | One driver varies at the configured IT MW; other settings base. Tariff multipliers are dimensionless. S. |
| cooling_tradeoff.csv | PUE × WUE grid | Independent parameters at base load factor; engineering relationship uncalibrated. S. |
| national_impact.csv | Capacity scenario plus national denominator | Facility TWh / actual national consumption or PLN sales ×100; energy-equivalent GW. Denominator year/source retained. Scenario rows S, denominator A. |
| additional_1gw.csv | Three 1,000 IT MW cases | Final required low/base/high resource calculation and national shares. S. |
| outlook_2030_2032.csv | Outlook case × in-service year | S IT MW, resources and costs, anchors, ratios versus latest actual, and separate future-national-growth assumption. |

Numeric annual results are unrounded internally. Display rounding in the report/charts/Excel does not alter model calculations. A percentage field ending `_pct` stores a percentage in 0–100 units unless explicitly documented otherwise; `utilization` and CAGR are fractions 0–1. All costs are nominal Rp. `actual_water_withdrawal_m3` and `actual_water_consumption_m3` are intentionally null in modeled outputs because no actual metered quantity is inferred.

Input/output manifest hashes identify exact committed data/settings used by the run. Validation logs contain warnings that require analyst review; they do not silently change data.
