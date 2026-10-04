"""Write research conclusions only from completed calculations and source registry."""
import re
import pandas as pd
from config import ROOT, read_dataset, assumptions

def editorial_note(value):
    """Render assumption notes as sentences without changing the saved notes."""
    text = str(value).replace(';', '.').strip().rstrip('.')
    text = re.sub(r'(^|[.!?]\s+)([a-z])',
                  lambda match: match.group(1) + match.group(2).upper(), text)
    if text.startswith('PLN '):
        text = 'The model uses the ' + text
    elif text.startswith('PAM JAYA '):
        text = 'The model uses the ' + text
    text = text.replace('. Qualifying ', '. A qualifying ')
    text = text.replace(' industrial connection assumed', ' industrial connection is assumed')
    text = text.replace('. Energy charges only', '. The calculation includes energy charges only')
    text = text.replace('. Explicit local price proxy', '. This is an explicit local price proxy')
    return text.replace('. Excludes ', '. It excludes ')

def markdown_table(df, columns, digits=3):
    head = '| ' + ' | '.join(columns) + ' |\n| ' + ' | '.join(['---'] * len(columns)) + ' |\n'
    rows = []
    for _, r in df.iterrows():
        vals = []
        for c in columns:
            v = r[c]
            vals.append('Not disclosed' if pd.isna(v) else (f'{v:,.{digits}f}' if isinstance(v, (float, int)) else str(v)))
        rows.append('| ' + ' | '.join(vals) + ' |')
    return head + '\n'.join(rows)

def write_summary():
    a = assumptions()
    one = read_dataset('additional_1gw')
    base = one[one['case'].eq('base')].iloc[0]
    current = read_dataset('current_baseline_estimates')
    inv = read_dataset('documented_inventory_estimates')
    outlook = read_dataset('outlook_2030_2032')
    electricity = read_dataset('indonesia_electricity')
    latest = electricity[electricity.year.eq(a['national_denominator']['year'])].iloc[0]
    t = one[['case','utilization','pue','wue_l_per_kwh','it_electricity_twh','facility_electricity_twh','electricity_cost_rp','water_m3_per_year','water_cost_rp','share_national_consumption_pct']].copy()
    t['electricity_cost_rp'] /= 1e12; t['water_cost_rp'] /= 1e9
    t.columns = ['Case','Utilization','PUE','WUE L/IT kWh','IT TWh/yr','Facility TWh/yr','Electricity Rp tn/yr','Water m3/yr','Water Rp bn/yr','National share %']
    o = outlook[['outlook_case','year','it_capacity_mw','facility_electricity_twh','electricity_cost_rp','water_m3_per_year','water_cost_rp','share_national_consumption_pct','scenario_share_national_consumption_pct']].copy()
    o.electricity_cost_rp /= 1e12; o.water_cost_rp /= 1e9
    o.columns = ['Outlook','Year','IT MW','Facility TWh/yr','Electricity Rp tn/yr','Water m3/yr','Water Rp bn/yr','Share of latest actual %','Share of scenario future %']
    sources = pd.read_csv(ROOT / 'sources.csv')
    refs = '\n'.join(f"- **{r.source_id}**: [{r.title}]({r.url}) ({r.organization}). Published {r.publication_date if pd.notna(r.publication_date) else 'date not disclosed'}. Accessed {r.access_date}." for _, r in sources.iterrows() if pd.notna(r.url))
    text = f'''# Electricity and water consumption of AI and data centers in Indonesia

Research cutoff: {a['research_cutoff']}. This summary is generated from processed datasets by `src/research_summary.py` after the model runs. Costs are in nominal Indonesian rupiah. A means reported, E means derived estimate, B means external benchmark and S means scenario. A reported project announcement does not by itself establish an operating asset.

## 1. Executive Summary

An extra 1 GW of data center IT capacity would use **{base.facility_electricity_twh:.3f} TWh/year** in the base expansion scenario. This assumes average electrical utilization of {base.utilization:.0%}, PUE of {base.pue:.2f} and on-site consumptive WUE of {base.wue_l_per_kwh:.2f} L/IT kWh. Electricity energy charges would be **Rp{base.electricity_cost_rp / 1e12:.3f} trillion/year**. Modeled direct water consumption would be **{base.water_m3_per_year:,.0f} m3/year**. Valuing that consumption at a Jakarta industrial marginal tariff gives a water cost proxy of **Rp{base.water_cost_rp / 1e9:.3f} billion/year**.

The facility electricity would equal **{base.share_national_consumption_pct:.2f}%** of {int(latest.year)} national electricity consumption and {base.share_pln_sales_pct:.2f}% of PLN sales. These calculations describe a scenario. They do not measure electricity or water used by Indonesian AI workloads.

The reviewed sources do not provide a complete, current national census of IT capacity or facility consumption. The dated market estimate covers **{a['baseline']['it_capacity_mw']:,.0f} MW IT**. Its recorded scope is **{editorial_note(a['baseline']['scope'])}**. The observation is dated {a['baseline']['observation_date']} and comes from {a['baseline']['source_id']}. It cannot establish national actual consumption. The separate operator inventory documents {inv.it_capacity_mw.iloc[0]:,.1f} MW of explicit operational IT capacity and is incomplete.

## 2. Key Findings

{markdown_table(t, list(t.columns))}

All numerical results above are S. The published tariff observations are A, while their application to an unidentified facility is S.

The low case assumes zero consumptive water for cooling. It excludes sanitary use and indirect water associated with electricity generation. It does not guarantee that a facility with liquid cooling uses no water. The joint PUE 1.20 and zero WUE pair is an exploratory demand bound. This project has not validated an Indonesian cooling design for that combination. The high case tests expansion demand under higher resource intensities. It is not an upper bound for inefficient existing facilities.

## 3. Indonesia Data Center Market

`data/processed/datacenter_projects.csv` separates operational, construction, committed, planned and potential capacity. It keeps IT MW, facility MW and connection MVA distinct. Inventory charts include only selected rows with a confirmed IT capacity basis.

Campus ultimate capacity and initial phases have separate records or exclusions to avoid counting the same capacity twice. Conflicting records remain available. Cloud regions with undisclosed capacity remain unknown. A region launch or investment announcement does not establish MW. The operator inventory is incomplete and is kept separate from the market estimate.

The current consumption estimates below use PUE assumptions for the current fleet. These differ from the assumptions for efficient expansion:

{markdown_table(current, ['case','it_capacity_mw','pue','facility_electricity_twh','water_m3_per_year','electricity_cost_rp'])}

These E estimates apply assumed electrical load factors and water intensities to a dated capacity observation. They do not establish metered use for Indonesia or an operator. The calculations are saved in `current_baseline_estimates.csv` and `documented_inventory_estimates.csv`.

## 4. Electricity Demand

The model calculates annual electricity as follows:

```text
IT MWh/year = IT MW × utilization × {a['hours_per_year']}
Facility MWh/year = IT MWh/year × PUE
GWh = MWh / 1,000
TWh = MWh / 1,000,000
```

Utilization is average real IT load divided by IT nameplate power. It is distinct from commercial occupancy or GPU compute utilization. Monthly electricity is annual run rate / 12 and does not represent seasonal demand.

The base 1 GW case uses {base.it_electricity_twh:.3f} IT TWh and {base.facility_electricity_twh:.3f} total facility TWh. The difference includes cooling, electrical losses and other facility overhead. It is not cooling electricity alone.

## 5. Electricity Cost

Electricity Rp/year = facility MWh × 1,000 × Rp/kWh. The default energy rate is {a['tariffs']['electricity_rp_per_kwh']:,.2f} Rp/kWh. {editorial_note(a['tariffs']['electricity_rationale'])}.

B-3 and I-3 use peak and off-peak rates. Reactive energy charges in Rp/kVArh are distinct from active energy rates in Rp/kWh. The tariff dataset preserves both. Contract premiums, time-of-use pricing, demand or minimum bills, negotiated services, taxes and penalties can change the total bill. Operators are not assumed to pay a uniform tariff.

## 6. Water Consumption

```text
Direct modeled consumptive liters = IT kWh × consumptive WUE L/IT kWh
m3 = liters / 1,000
```

Consumption is water not returned to the source. Withdrawal is intake, including water that may be returned. Each benchmark keeps its reported boundary, whether consumption, withdrawal or unspecified use. Global benchmarks are B and do not establish Indonesian actual consumption. The project does not invent metered facility consumption. Daily modeled volume is an annual average and does not establish peak supply requirements in the dry season.

## 7. Water Cost

Water Rp/year = modeled consumptive m3 × Rp/m3. The default price proxy is {a['tariffs']['water_rp_per_m3']:,.0f} Rp/m3. {editorial_note(a['tariffs']['water_rationale'])}.

A utility normally bills withdrawn or delivered water. Applying that tariff to modeled consumption is an approximation. Intake and cooling tower blowdown may make billed volume greater. The calculation excludes fixed charges, tariff band allocations, recycling treatment and private estate contracts. Historical Batam and other local schedules remain separate because their effective dates and applicability are uncertain. The Jakarta rate is a local cost proxy, not a national tariff.

## 8. AI Power Density

`ai_hardware.csv` separates accelerator TDP, maximum server power and rack designs. Maximum server power includes the host CPU, memory, networking and power supplies. Multiplying GPU TDP by GPU count does not capture that total. Global manufacturer specifications are B.

Traditional enterprise, cloud and AI racks have different power densities. The project does not infer Indonesia's installed fleet mix or its AI share. The grid model starts from IT MW, so adding GPU power to that total would count demand twice. At fixed IT MW, higher rack density changes cooling and connection design. It does not automatically increase annual energy.

## 9. Cooling Technology

Evaporative towers can reduce compressor electricity while consuming water. Dry air heat rejection avoids tower evaporation but can require more fan or compressor energy in hot, humid conditions. Chilled water systems can use either dry or evaporative heat rejection.

Direct-to-chip cooling moves heat into a coolant loop. Water consumption depends on how that heat is ultimately rejected outdoors. A closed coolant loop can still use evaporative towers. Liquid cooling therefore does not by itself establish zero water use.

`cooling_tradeoff.csv` varies PUE and WUE independently as S. It is not a physical design curve. The climate data provides context on heat, humidity and rainfall. It does not drive an uncalibrated cooling model. Missing wet-bulb observations remain NaN.

## 10. National Grid Impact

The latest comparison year is {int(latest.year)}, when national consumption was {latest.electricity_consumption_twh:.3f} TWh and PLN sales were {latest.pln_sales_twh:.3f} TWh. Their scopes are documented in `indonesia_electricity.csv`.

The base additional 1 GW case would draw an average facility load of {base.equivalent_continuous_generation_gw:.3f} GW. Demand at full IT load would be {base.full_it_load_facility_mw / 1000:.3f} GW. At an assumed generation capacity factor of {a['generation_capacity_factor']:.0%}, its annual energy corresponds to {base.generation_capacity_gw_at_assumed_capacity_factor:.3f} GW of generation capacity. This annual energy comparison excludes grid losses, reserve margin, outages and hourly adequacy.

National annual percentages do not establish available capacity at a Cikarang substation or on an island grid. PLN-only peak demand and national installed capacity also have different scopes.

## 11. 2030 to 2032 Scenarios

{markdown_table(o, list(o.columns))}

Every outlook case is S. It covers a **documented nationwide subset**, consisting of dated Greater Jakarta market evidence and non-overlapping disclosed components in Surabaya, Batam and Bintan. This is not a complete country census. `assumptions.yaml` and `market_anchors.csv` record the source anchors, capacity basis and deviations.

The figures are annual steady-state run rates at capacity in service. They are not annual averages during commissioning. Shares of the latest actual national consumption are comparisons, not forecasts. Future national shares use a separate {a['national_denominator']['outlook_consumption_cagr']:.1%} annual consumption growth scenario. That assumption does not replace an official national forecast.

The RUPTL PLN-only sales forecasts are retained separately in `outlook_2030_2032.csv` and used for `share_official_pln_sales_forecast_pct`. Forecast PLN sales are never substituted for national consumption.

The capacity bridge combines observations from different dates. It includes operating capacity of 331 MW (Greater Jakarta 322 plus Surabaya 9), construction capacity of 413 MW (Jakarta 395 plus Batam 18) and planned capacity of 2,424 MW (Jakarta 1,304 plus Bintan 1,000 plus Batam 120). These source-defined components are not added to the operator metro inventory.

The aggressive case activates this disclosed subset by 2030. The conservative and base cases apply the explicit realization assumptions in YAML. None is an exhaustive national forecast or a prediction of demand beyond the identified pipeline.

## 12. Infrastructure Constraints

Power diligence should check local transformer and substation capacity, transmission routes and connection queue timing. It should also verify reliable dual feeds, the difference between redundant contracted MVA and usable IT MW, dispatchable supply and backup arrangements.

Water diligence should check dry season utility allocations, intake permits, groundwater restrictions, treatment and reuse infrastructure. Local climate conditions also affect the design. Annual national or Java-Bali energy figures do not establish constraints in Batam or Bintan. The project does not include a local load-flow, reservoir-yield or permit-allocation study. It cannot establish available headroom.

## 13. Key Risks

Capacity estimates depend on commissioning timing and avoiding duplicated campus announcements. Ambiguous IT, facility or connection definitions can change the results. Operating estimates also depend on real electrical load factors, legacy PUE and AI fleet composition. Peak and off-peak billing, water consumption boundaries and contracted water availability add uncertainty.

Electricity accounts for {base.electricity_cost_share_pct:.2f}% of modeled base resource costs. Water accounts for {base.water_cost_share_pct:.2f}%. Water is a small share of modeled resource costs in this case. Local supply and environmental constraints can still affect whether a project proceeds. That depends on availability and permits as well as price.

## 14. Data Limitations

The reviewed sources do not establish comprehensive national metered data center electricity or water consumption, or a verified national total for AI capacity. Negotiated premium tariffs and facility cooling configurations are not available. Climate series do not cover all target locations.

Missing values remain NaN. Design targets, global water-use averages and historical operator values do not establish current Indonesian actuals. Coverage gaps and conflicting observations remain visible in `docs/limitations.md`, the raw evidence locators and `outputs/validation.log`.

## 15. Conclusion

The additional 1 GW calculations can be reproduced from the stated assumptions. Public sources do not establish today's national metered data center totals. Electricity dominates the modeled resource costs. Water still requires local supply and environmental diligence even where its modeled cost is small. Use the low, base and high cases as calculations under stated assumptions. Update the source observations and assumptions before applying them to a specific investment or grid connection.

## Source registry

{refs}
'''
    (ROOT / 'outputs' / 'summary.md').write_text(text, encoding='utf-8')
    print('Wrote source-linked research summary from completed model outputs.')

if __name__ == '__main__': write_summary()
