"""Modeled direct on-site consumptive water, not observed withdrawals.

Scenario WUE is L per IT kWh. Reported withdrawal/use benchmarks retain their
original definition in the benchmark dataset; they are not silently relabeled.
Indirect electricity-supply water and non-cooling domestic uses are excluded.
"""
from electricity_model import require_number

def water(it_electricity_kwh, wue_l_per_kwh, tariff_rp_per_m3):
    for name, value in [('IT kWh', it_electricity_kwh), ('WUE L/IT kWh', wue_l_per_kwh),
                         ('water tariff Rp/m3', tariff_rp_per_m3)]:
        require_number(name, value)
    liters = it_electricity_kwh * wue_l_per_kwh
    m3 = liters / 1000
    return dict(water_liters_per_year=liters, water_million_liters_per_year=liters / 1e6,
                water_m3_per_year=m3, water_m3_per_day=m3 / 365,
                water_cost_rp=m3 * tariff_rp_per_m3,
                monthly_water_cost_rp=m3 * tariff_rp_per_m3 / 12,
                actual_water_withdrawal_m3=None, actual_water_consumption_m3=None,
                water_metric='Scenario direct on-site consumption; no observed withdrawals')
