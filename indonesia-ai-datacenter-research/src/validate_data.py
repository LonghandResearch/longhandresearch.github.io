"""Schema, provenance, physical bounds, capacity status and conversion checks.

Errors stop the pipeline. Warnings identify incomplete coverage/definitions;
uncertain observations are retained rather than silently 'repaired'.
"""
import json
import math
import re
import pandas as pd
from config import ROOT, PROCESSED, INTERIM, SCHEMAS, SOURCE_COLUMNS, assumptions, write_json

def validate():
    issues = []
    def issue(level, dataset, message):
        issues.append(dict(level=level, dataset=dataset, message=message))
    sources = pd.read_csv(ROOT / 'sources.csv')
    ids = set(sources.source_id)
    for col in SOURCE_COLUMNS:
        if col not in sources: issue('ERROR', 'sources', f'Missing {col}')
    if sources.source_id.duplicated().any(): issue('ERROR', 'sources', 'Duplicate source_id')
    cutoff = pd.Timestamp(assumptions()['research_cutoff'])
    a = assumptions()
    for ref in a['assumptions_source_ids'] + [a['baseline']['source_id'], a['national_denominator']['source_id']]:
        if ref not in ids: issue('ERROR', 'assumptions', f'Unknown source ID {ref}')
    for cfg in a['outlook'].values():
        for ref in cfg['anchor_source_id'].split(';'):
            if ref not in ids: issue('ERROR', 'assumptions', f'Unknown outlook source ID {ref}')
    for _, row in sources.iterrows():
        if row.source_id != 'MODEL001' and (pd.isna(row.url) or not str(row.url).startswith('http')):
            issue('ERROR', 'sources', f'{row.source_id}: missing usable URL')
        if pd.notna(row.publication_date):
            pub = pd.to_datetime(row.publication_date, errors='coerce')
            if pd.isna(pub): issue('WARNING', 'sources', f'{row.source_id}: publication date not exact: {row.publication_date}')
            elif pub > cutoff: issue('ERROR', 'sources', f'{row.source_id}: publication after research cutoff')
    for name, cols in SCHEMAS.items():
        path = PROCESSED / f'{name}.csv'
        if not path.exists():
            issue('ERROR', name, 'Dataset absent'); continue
        df = pd.read_csv(path)
        absent = [col for col in cols if col not in df]
        for col in absent: issue('ERROR', name, f'Missing column: {col}')
        if absent: continue
        if df.empty: issue('WARNING', name, 'No reported observations available')
        if df.duplicated().any(): issue('ERROR', name, 'Duplicate complete rows')
        for _, row in df.iterrows():
            if row.data_class not in ['A', 'E', 'B', 'S']:
                issue('ERROR', name, 'Invalid/missing data_class')
            refs = re.split(r'[;|]', str(row.source_id))
            for ref in refs:
                if ref not in ids: issue('ERROR', name, f'Unknown source ID {ref}')
        missing = df.isna().sum()
        issue('WARNING', name, 'Missing values retained: ' + ', '.join(f'{c}={n}' for c, n in missing.items() if n))
        if name == 'datacenter_projects':
            if 'project_id' in df and df.project_id.duplicated().any(): issue('ERROR', name, 'Duplicated project_id / announcement')
            capacity_cols = ['operational_mw', 'under_construction_mw', 'committed_mw', 'planned_mw', 'potential_mw']
            for col in capacity_cols + ['power_connection_mva', 'power_connection_mw', 'investment_usd']:
                vals = pd.to_numeric(df[col], errors='raise')
                if (vals < 0).any(): issue('ERROR', name, f'Negative {col}')
            if ((df.status != 'operational') & (df.operational_mw.fillna(0) > 0)).any():
                issue('ERROR', name, 'Non-operational row classified as operational MW')
            for _, row in df.iterrows():
                if row.get('capacity_basis') not in ['IT', 'IT_MW', 'IT load', 'it'] and any(pd.notna(row[c]) and row[c] > 0 for c in capacity_cols):
                    issue('WARNING', name, f"{row.facility}: capacity basis not confirmed IT; excluded from numeric inventory")
                if row.get('connection_data_class') == 'E':
                    expected = row.power_connection_mva * row.conversion_power_factor
                    if not math.isclose(row.power_connection_mw, expected, rel_tol=1e-9):
                        issue('ERROR', name, f'{row.facility}: MVA to MW mismatch')
            issue('WARNING', name, 'Operator announcements overlap and are not a complete Indonesia census. Source-date and definitions may differ.')
        elif name in ['electricity_tariffs', 'water_tariffs']:
            col = 'tariff_rp_per_kwh' if name == 'electricity_tariffs' else 'tariff_rp_per_m3'
            if (pd.to_numeric(df[col], errors='raise') < 0).any(): issue('ERROR', name, f'Negative {col}')
            issue('WARNING', name, 'Published rates may exclude contract premiums, fixed charges, taxes and site-specific conditions.')
        elif name == 'pue_benchmarks':
            if (pd.to_numeric(df.pue, errors='raise') < 1).any(): issue('ERROR', name, 'PUE below 1')
        elif name == 'wue_benchmarks':
            if (pd.to_numeric(df.wue_l_per_kwh, errors='raise') < 0).any(): issue('ERROR', name, 'Negative WUE')
            issue('WARNING', name, 'Consumption, withdrawal and unspecified use definitions are not interchangeable.')
        elif name == 'climate':
            for col, low, high in [('month', 1, 12), ('avg_relative_humidity_pct', 0, 100), ('avg_temperature_c', -10, 60)]:
                v = pd.to_numeric(df[col], errors='raise')
                if ((v < low) | (v > high)).any(): issue('ERROR', name, f'Impossible {col}')
            if (pd.to_numeric(df.rainfall_mm, errors='raise') < 0).any(): issue('ERROR', name, 'Negative rain')
        elif name == 'indonesia_electricity':
            if df.year.duplicated().any(): issue('ERROR', name, 'Duplicate annual electricity rows')
            for col in cols[1:-2]:
                v = pd.to_numeric(df[col], errors='raise')
                if (v < 0).any(): issue('ERROR', name, f'Negative {col}')
                if col.endswith('_pct') and (v > 100).any(): issue('ERROR', name, f'{col} >100')
            issue('WARNING', name, 'Generation, national electricity consumption and PLN sales use distinct boundaries. Do not substitute one for another.')
    # Model algebra invariants catch factors of 1,000 and energy/capacity mixups.
    for name in ['capacity_scenarios', 'sensitivity', 'additional_1gw', 'outlook_2030_2032', 'current_baseline_estimates', 'documented_inventory_estimates', 'cooling_tradeoff', 'national_impact']:
        path = PROCESSED / f'{name}.csv'
        if not path.exists(): continue
        df = pd.read_csv(path)
        if not df.data_class.isin(['E','S']).all(): issue('ERROR', name, 'Model results incorrectly classified as actual/benchmark')
        if not df.source_id.isin(ids).all(): issue('ERROR', name, 'Unknown model source_id')
        for col, low, high in [('it_capacity_mw',0,None), ('pue',1,None), ('utilization',0,1),
                               ('wue_l_per_kwh',0,None), ('electricity_tariff_rp_per_kwh',0,None), ('water_tariff_rp_per_m3',0,None)]:
            values = df[col]
            if not values.map(math.isfinite).all() or (values < low).any() or (high is not None and (values > high).any()):
                issue('ERROR', name, f'Invalid model {col}')
        checks = [
            (df.it_electricity_mwh, df.it_capacity_mw * df.utilization * a['hours_per_year'], 'load-hours'),
            (df.it_capacity_mw, df.it_capacity_gw * 1000, 'MW/GW'),
            (df.it_electricity_mwh, df.it_electricity_gwh * 1000, 'MWh/GWh'),
            (df.it_electricity_kwh, df.it_electricity_mwh * 1000, 'IT MWh/kWh'),
            (df.facility_electricity_kwh, df.facility_electricity_mwh * 1000, 'facility MWh/kWh'),
            (df.facility_electricity_gwh, df.facility_electricity_twh * 1000, 'GWh/TWh'),
            (df.facility_electricity_mwh, df.it_electricity_mwh * df.pue, 'PUE'),
            (df.electricity_cost_rp, df.facility_electricity_kwh * df.electricity_tariff_rp_per_kwh, 'Rp/kWh'),
            (df.water_m3_per_year, df.it_electricity_kwh * df.wue_l_per_kwh / 1000, 'L/m3'),
            (df.water_cost_rp, df.water_m3_per_year * df.water_tariff_rp_per_m3, 'water Rp'),
        ]
        for left, right, label in checks:
            if not all(math.isclose(x, y, rel_tol=1e-8, abs_tol=1e-8) for x, y in zip(left, right)):
                issue('ERROR', name, f'{label} conversion/reconciliation failure')
    write_json(INTERIM / 'validation_report.json', issues)
    (ROOT / 'outputs' / 'validation.log').write_text('\n'.join(f"{x['level']} [{x['dataset']}] {x['message']}" for x in issues) + '\n', encoding='utf-8')
    errors = [i for i in issues if i['level'] == 'ERROR']
    print(f"Validation: {len(errors)} errors, {len(issues)-len(errors)} warnings (see outputs/validation.log)")
    if errors: raise ValueError('\n'.join(i['message'] for i in errors))
    return issues

if __name__ == '__main__': validate()
