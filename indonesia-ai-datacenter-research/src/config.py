"""Shared paths, schemas and configuration. Scripts work from any directory."""
from pathlib import Path
import json
import hashlib
import pandas as pd
import yaml

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / 'data' / 'raw'
PROCESSED = ROOT / 'data' / 'processed'
INTERIM = ROOT / 'data' / 'interim'
TABLES = ROOT / 'outputs' / 'tables'
CHARTS = ROOT / 'outputs' / 'charts'
SOURCE_COLUMNS = 'source_id category organization title url publication_date access_date data_type geography facility metric unit status quality_tier notes'.split()
SCHEMAS = {
    'market_anchors': 'metric value unit geography year capacity_basis status source_id data_class notes'.split(),
    'datacenter_projects': 'company facility location province status operational_mw under_construction_mw committed_mw planned_mw potential_mw power_connection_mva power_connection_mw ai_specific hyperscale investment_usd announcement_date expected_completion source_id data_class notes'.split(),
    'indonesia_electricity': 'year electricity_generation_twh electricity_consumption_twh pln_sales_twh installed_capacity_gw peak_demand_gw coal_share_pct gas_share_pct hydro_share_pct geothermal_share_pct solar_share_pct other_renewables_pct source_id data_class'.split(),
    'electricity_tariffs': 'customer_class voltage_level tariff_rp_per_kwh effective_period notes source_id data_class'.split(),
    'water_tariffs': 'location provider customer_category consumption_band tariff_rp_per_m3 effective_date source_id data_class notes'.split(),
    'climate': 'location year month avg_temperature_c avg_relative_humidity_pct rainfall_mm wet_bulb_c source_id data_class'.split(),
    'pue_benchmarks': 'company facility country pue year source_id data_class notes'.split(),
    'wue_benchmarks': 'company facility country wue_l_per_kwh cooling_type year source_id data_class notes'.split(),
    'ai_hardware': 'hardware tdp_watts typical_server_configuration estimated_server_power_kw rack_density_kw cooling_requirement source_id data_class notes'.split(),
}

def assumptions():
    with (ROOT / 'assumptions.yaml').open(encoding='utf-8') as f:
        return yaml.safe_load(f)

def read_dataset(name):
    return pd.read_csv(PROCESSED / f'{name}.csv')

def save_table(frame, name, processed=True):
    TABLES.mkdir(parents=True, exist_ok=True)
    frame.to_csv(TABLES / f'{name}.csv', index=False, na_rep='NaN', float_format='%.12g')
    if processed:
        PROCESSED.mkdir(parents=True, exist_ok=True)
        frame.to_csv(PROCESSED / f'{name}.csv', index=False, na_rep='NaN', float_format='%.12g')

def write_json(path, obj):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, indent=2, ensure_ascii=False, allow_nan=False) + '\n', encoding='utf-8')

def file_sha256(path):
    """Keep text hashes stable across Git's Windows/Linux line-ending conversion."""
    content = path.read_bytes()
    if path.suffix.lower() in {'.json', '.csv', '.yaml', '.md', '.js', '.html', '.css', '.py', '.txt', '.log'}:
        content = content.replace(b'\r\n', b'\n')
    return hashlib.sha256(content).hexdigest()
