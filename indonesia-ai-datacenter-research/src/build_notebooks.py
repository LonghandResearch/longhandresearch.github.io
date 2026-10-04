"""Create and optionally execute four notebooks using the same model/data paths."""
import argparse
import sys
import nbformat as nb
from nbclient import NotebookClient
from config import ROOT

INTRO = '''from pathlib import Path
import sys
root = Path.cwd().resolve()
while not (root / 'assumptions.yaml').exists():
    if root == root.parent: raise FileNotFoundError('Run from within the research repository')
    root = root.parent
sys.path.insert(0, str(root / 'src'))
import pandas as pd
from IPython.display import display, Image
from config import read_dataset, assumptions
'''

BOOKS = {
 '01_data_review': ('Source and coverage review', [
    "display(pd.read_csv(root / 'sources.csv')[['source_id','organization','title','quality_tier','geography']])",
    "projects = read_dataset('datacenter_projects')\ndisplay(projects[['company','facility','status','operational_mw','planned_mw','capacity_basis','include_in_inventory','source_id','data_class']])\ndisplay(projects.isna().sum().to_frame('missing_count'))",
    "display(read_dataset('indonesia_electricity'))\nfrom validate_data import validate\nissues = validate()\ndisplay(pd.DataFrame(issues))",
    "display(read_dataset('climate'))\ndisplay(Image(filename=str(root / 'outputs/charts/01_capacity_by_status.png')))"
 ]),
 '02_electricity_analysis': ('Electricity, costs and national comparison', [
    "from electricity_model import electricity, mva_to_mw\ndisplay(pd.DataFrame([electricity(1000, .8, 1.3, assumptions()['tariffs']['electricity_rp_per_kwh'])]))\nprint('100 MVA at the configured power factor is connection MW, not IT MW:', mva_to_mw(100, assumptions()['power_factor']['base']))",
    "display(read_dataset('electricity_tariffs'))\ndisplay(read_dataset('additional_1gw')[['case','utilization','pue','it_electricity_gwh','facility_electricity_twh','electricity_cost_rp','share_national_consumption_pct','share_pln_sales_pct']])",
    "display(Image(filename=str(root / 'outputs/charts/03_electricity_trend.png')))\ndisplay(Image(filename=str(root / 'outputs/charts/04_facility_electricity.png')))"
 ]),
 '03_water_analysis': ('Water boundary, local tariffs and trade-offs', [
    "display(read_dataset('wue_benchmarks'))\ndisplay(read_dataset('water_tariffs'))",
    "from water_model import water\nbase = read_dataset('additional_1gw').query('case == \"base\"').iloc[0]\ndisplay(pd.DataFrame([water(base.it_electricity_kwh, base.wue_l_per_kwh, base.water_tariff_rp_per_m3)]))\nassert base.water_m3_per_year == base.it_electricity_kwh * base.wue_l_per_kwh / 1000",
    "grid = read_dataset('cooling_tradeoff')\ndisplay(grid.pivot(index='pue', columns='wue_l_per_kwh', values='total_resource_cost_rp'))\ndisplay(Image(filename=str(root / 'outputs/charts/06_water_consumption.png')))"
 ]),
 '04_scenario_analysis': ('Expansion cases, sensitivity and 2030–2032', [
    "display(read_dataset('additional_1gw'))\ndisplay(read_dataset('outlook_2030_2032')[['outlook_case','year','it_capacity_mw','facility_electricity_twh','water_m3_per_year','share_national_consumption_pct','scenario_share_national_consumption_pct','data_class']])",
    "from copy import deepcopy\nfrom scenario_model import evaluate\na = deepcopy(assumptions())\na['scenarios']['base']['pue'] = 1.4\noriginal = evaluate(1000, 'base')\nchanged = evaluate(1000, 'base', a)\nassert changed['facility_electricity_gwh'] > original['facility_electricity_gwh']\nassert changed['water_m3_per_year'] == original['water_m3_per_year']\ndisplay(pd.DataFrame([original, changed])[['pue','facility_electricity_gwh','water_m3_per_year','total_resource_cost_rp']])",
    "display(read_dataset('sensitivity')[['driver','driver_value','facility_electricity_gwh','electricity_cost_rp','water_m3_per_year','water_cost_rp']])\ndisplay(Image(filename=str(root / 'outputs/charts/11_scenario_comparison.png')))"
 ])}

def build(execute=False):
    for name, (title, code) in BOOKS.items():
        book = nb.v4.new_notebook()
        book.metadata.kernelspec = {'display_name':'Python 3', 'language':'python', 'name':'python3'}
        book.cells = [nb.v4.new_markdown_cell(f'# {title}\n\nIndonesia only. A/E/B/S labels and source boundaries remain in datasets. These calculations are scenarios, not metered national data-center electricity or water. See docs/methodology.md.'), nb.v4.new_code_cell(INTRO)]
        book.cells += [nb.v4.new_code_cell(c) for c in code]
        if execute:
            # Explicit kernel command uses the currently executing environment.
            from jupyter_client import KernelManager
            km = KernelManager(kernel_name='python3')
            km.kernel_spec.argv = [sys.executable, '-m', 'ipykernel_launcher', '-f', '{connection_file}']
            NotebookClient(book, timeout=120, km=km, resources={'metadata':{'path':str(ROOT)}}).execute()
        nb.validate(book)
        nb.write(book, ROOT / 'notebooks' / f'{name}.ipynb')
        print(f'{name}: created' + (' and executed' if execute else ''))

if __name__ == '__main__':
    p = argparse.ArgumentParser(description=__doc__); p.add_argument('--execute', action='store_true')
    build(p.parse_args().execute)
