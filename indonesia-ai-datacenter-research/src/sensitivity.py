"""One-driver sensitivities plus PUE/WUE trade-off combinations at 1 GW IT."""
from copy import deepcopy
import pandas as pd
from config import assumptions, save_table
from scenario_model import evaluate

def run_sensitivity():
    a = assumptions()
    rows = []
    for driver, values in a['sensitivity'].items():
        for val in values:
            b = deepcopy(a)
            if driver in ['electricity_tariff_multiplier', 'water_tariff_multiplier']:
                key = 'electricity_rp_per_kwh' if driver.startswith('electricity') else 'water_rp_per_m3'
                b['tariffs'][key] *= val
            else: b['scenarios']['base'][driver] = val
            row = evaluate(a['sensitivity_capacity_mw'], 'base', b)
            row.update(driver=driver, driver_value=val)
            rows.append(row)
    df = pd.DataFrame(rows)
    save_table(df, 'sensitivity')
    grid = []
    for pue in a['sensitivity']['pue']:
        for wue in a['sensitivity']['wue_l_per_kwh']:
            b = deepcopy(a)
            b['scenarios']['base'].update(pue=pue, wue_l_per_kwh=wue)
            grid.append(evaluate(a['sensitivity_capacity_mw'], 'base', b))
    save_table(pd.DataFrame(grid), 'cooling_tradeoff')
    print(f'{len(df)} one-driver tests; {len(grid)} PUE/WUE combinations. No engineering relationship between PUE and WUE assumed.')
    return df

if __name__ == '__main__': run_sensitivity()
