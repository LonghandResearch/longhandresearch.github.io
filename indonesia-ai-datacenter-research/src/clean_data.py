"""Standardize curated observations without guessing undisclosed values."""
import json
import pandas as pd
from config import RAW, PROCESSED, SCHEMAS, assumptions

def clean():
    datasets = {}
    numeric_lineage = []
    for path in sorted((RAW / 'observations').glob('*.json')):
        payload = json.loads(path.read_text(encoding='utf-8-sig'))
        for name, rows in payload['datasets'].items():
            datasets.setdefault(name, []).extend(rows)
    for name, rows in datasets.items():
        df = pd.DataFrame(rows)
        required = SCHEMAS.get(name, ['source_id', 'data_class'])
        for col in required:
            if col not in df: df[col] = pd.NA
        df = df[required + [c for c in df if c not in required]]
        if name == 'indonesia_electricity' and 'other_renewables_share_pct' in df:
            # Equivalent source field name; retain original alias, never relabel steam as coal.
            df['other_renewables_pct'] = df['other_renewables_pct'].where(df['other_renewables_pct'].notna(), df['other_renewables_share_pct'])
            for metric in ['gas_share_pct','hydro_share_pct','geothermal_share_pct','solar_share_pct',
                           'other_renewables_pct','other_renewables_share_pct','steam_share_pct','diesel_share_pct']:
                df[f'{metric}_data_class'] = df['mix_data_class']
        if name == 'datacenter_projects':
            pf = assumptions()['power_factor']['base']
            mva = pd.to_numeric(df['power_connection_mva'], errors='raise')
            reported = pd.to_numeric(df['power_connection_mw'], errors='raise')
            # A connection estimate is never added to IT capacity.
            df['power_connection_mw'] = reported.where(reported.notna(), mva * pf)
            df['connection_data_class'] = ['E' if pd.isna(v) and pd.notna(m) else ('A' if pd.notna(v) else None)
                                            for v, m in zip(reported, mva)]
            df['conversion_power_factor'] = [pf if pd.isna(v) and pd.notna(m) else None for v, m in zip(reported, mva)]
            df['power_connection_mw_data_class'] = df['connection_data_class']
            df['conversion_power_factor_data_class'] = ['S' if pd.notna(v) else None for v in df['conversion_power_factor']]
        for idx, row in df.iterrows():
            for col in df.select_dtypes(include='number').columns:
                value = row[col]
                if pd.isna(value): continue
                kind = row.get(f'{col}_data_class', row['data_class'])
                if pd.isna(kind): kind = row['data_class']
                if col.endswith('_mw') and col != 'power_connection_mw' and 'capacity_numeric_class' in row:
                    kind = row['capacity_numeric_class']
                numeric_lineage.append(dict(dataset=name, record_id=row.get('project_id', idx),
                                            metric=col, value=value, source_id=row['source_id'], data_class=kind))
        PROCESSED.mkdir(parents=True, exist_ok=True)
        df.to_csv(PROCESSED / f'{name}.csv', index=False, na_rep='NaN')
        print(f'{name}: {len(df)} records; absent inputs remain NaN.')
    missing = set(SCHEMAS) - set(datasets)
    if missing: raise ValueError(f'Missing required datasets: {sorted(missing)}')
    pd.DataFrame(numeric_lineage).to_csv(PROCESSED / 'source_numeric_observations.csv', index=False, na_rep='NaN')

if __name__ == '__main__': clean()
