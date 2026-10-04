"""Capacity scenarios, dated baseline estimates and source-anchored outlook."""
import pandas as pd
from copy import deepcopy
from config import assumptions, read_dataset, save_table
from electricity_model import electricity
from water_model import water

def evaluate(capacity_mw, case, settings=None):
    a = settings or assumptions()
    d = a['scenarios'][case]
    e_tariff = a['tariffs']['electricity_rp_per_kwh']
    w_tariff = a['tariffs']['water_rp_per_m3']
    e = electricity(capacity_mw, d['utilization'], d['pue'], e_tariff, a['hours_per_year'])
    w = water(e['it_electricity_kwh'], d['wue_l_per_kwh'], w_tariff)
    total = e['electricity_cost_rp'] + w['water_cost_rp']
    return dict(case=case, it_capacity_mw=capacity_mw, it_capacity_gw=capacity_mw / 1000,
                utilization=d['utilization'], pue=d['pue'], wue_l_per_kwh=d['wue_l_per_kwh'],
                electricity_tariff_rp_per_kwh=e_tariff, water_tariff_rp_per_m3=w_tariff,
                **e, **w, total_resource_cost_rp=total,
                electricity_cost_share_pct=e['electricity_cost_rp'] / total * 100 if total else None,
                water_cost_share_pct=w['water_cost_rp'] / total * 100 if total else None,
                source_id='MODEL001', data_class='S',
                assumptions_source_ids=';'.join(a['assumptions_source_ids']),
                notes='Annual steady-state run rate. Energy charges only; water tariff is an explicit local proxy.')

def run_scenarios():
    a = assumptions()
    df = pd.DataFrame([evaluate(mw, case, a) for mw in a['capacity_scenarios_mw'] for case in a['scenarios']])
    save_table(df, 'capacity_scenarios')
    current_settings = deepcopy(a)
    current_settings['scenarios'] = a['current_resource_scenarios']
    baseline = pd.DataFrame([dict(**evaluate(a['baseline']['it_capacity_mw'], case, current_settings),
                                   baseline_date=a['baseline']['observation_date'],
                                   capacity_source_id=a['baseline']['source_id'],
                                   capacity_class=a['baseline']['data_class'],
                                   capacity_scope=a['baseline']['scope'], consumption_class='E')
                             for case in a['scenarios']])
    baseline['data_class'] = 'E'
    save_table(baseline, 'current_baseline_estimates')
    projects = read_dataset('datacenter_projects')
    mask = projects.get('include_in_inventory', pd.Series(True, index=projects.index)).astype(str).str.lower().eq('true')
    if 'capacity_basis' in projects:
        mask &= projects['capacity_basis'].str.lower().isin(['it', 'it_mw', 'it load'])
    inventory_mw = pd.to_numeric(projects.loc[mask, 'operational_mw'], errors='coerce').sum(min_count=1)
    partial = pd.DataFrame([dict(**evaluate(float(inventory_mw), case, current_settings), scope='Partial documented operational IT inventory; NOT Indonesia total')
                            for case in a['scenarios']])
    partial['data_class'] = 'E'
    save_table(partial, 'documented_inventory_estimates')
    outlook = []
    for name, cfg in a['outlook'].items():
        for year, mw in cfg['capacity_mw'].items():
            outlook.append(dict(**evaluate(mw, cfg['resource_case'], a), outlook_case=name, year=int(year),
                                capacity_anchor_source_id=cfg['anchor_source_id'],
                                capacity_anchor_note=cfg['rationale'], capacity_data_class='S'))
    save_table(pd.DataFrame(outlook), 'outlook_2030_2032')
    print(f'Calculated {len(df)} capacity cases, 3 dated baseline estimates and {len(outlook)} outlook cases.')
    return df

if __name__ == '__main__': run_scenarios()
