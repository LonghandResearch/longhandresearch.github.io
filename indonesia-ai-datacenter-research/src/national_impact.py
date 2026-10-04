"""Ratios use consumption and sales separately; future denominator assumptions explicit."""
import pandas as pd
from config import assumptions, read_dataset, save_table

def national_impact(frame, outlook=False):
    a = assumptions()
    elec = read_dataset('indonesia_electricity')
    year = a['national_denominator']['year']
    match = elec[elec.year.eq(year)]
    if len(match) != 1: raise ValueError(f'Expected exactly one national denominator row for {year}')
    den = match.iloc[0]
    for col in ['electricity_consumption_twh', 'pln_sales_twh']:
        if pd.isna(den[col]) or den[col] <= 0: raise ValueError(f'Missing/invalid {year} {col}; do not substitute generation')
    out = frame.copy()
    out['national_denominator_year'] = year
    out['national_consumption_twh'] = den.electricity_consumption_twh
    out['pln_sales_twh'] = den.pln_sales_twh
    out['national_denominator_source_id'] = den.source_id
    out['denominator_data_class'] = 'A'
    out['share_national_consumption_pct'] = out.facility_electricity_twh / out.national_consumption_twh * 100
    out['share_pln_sales_pct'] = out.facility_electricity_twh / out.pln_sales_twh * 100
    # This is average delivered power, not installed generation requirement.
    out['equivalent_continuous_generation_gw'] = out.facility_electricity_twh * 1e3 / a['hours_per_year']
    out['generation_capacity_gw_at_assumed_capacity_factor'] = out.equivalent_continuous_generation_gw / a['generation_capacity_factor']
    if outlook:
        cagr = a['national_denominator']['outlook_consumption_cagr']
        out['scenario_national_consumption_twh'] = den.electricity_consumption_twh * (1 + cagr) ** (out.year - year)
        out['scenario_share_national_consumption_pct'] = out.facility_electricity_twh / out.scenario_national_consumption_twh * 100
        out['future_denominator_class'] = 'S'
        out['future_denominator_cagr'] = cagr
        anchors = read_dataset('market_anchors')
        forecast = anchors[anchors.metric.eq('pln_sales_forecast_gwh')].set_index('year')
        out['official_pln_sales_forecast_twh'] = out.year.map(forecast.value) / 1000
        out['share_official_pln_sales_forecast_pct'] = out.facility_electricity_twh / out.official_pln_sales_forecast_twh * 100
        out['official_pln_forecast_source_id'] = out.year.map(forecast.source_id)
        out['official_pln_forecast_class'] = 'S'
    return out

def run_national_impact():
    df = national_impact(read_dataset('capacity_scenarios'))
    save_table(df, 'national_impact')
    save_table(df[df.it_capacity_mw.eq(1000)], 'additional_1gw')
    save_table(national_impact(read_dataset('outlook_2030_2032'), True), 'outlook_2030_2032')
    save_table(national_impact(read_dataset('current_baseline_estimates')), 'current_baseline_estimates')
    print('National impact and additional 1 GW tables generated; denominators remain scope-labeled.')

if __name__ == '__main__': run_national_impact()
