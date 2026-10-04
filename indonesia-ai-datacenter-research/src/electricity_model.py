"""Annual run-rate electricity and energy-charge cost; capacity is IT MW."""
import math
from numbers import Real

def require_number(name, value, minimum=0, maximum=None):
    if isinstance(value, bool) or not isinstance(value, Real) or not math.isfinite(value):
        raise ValueError(f'{name} must be a finite number')
    if value < minimum or (maximum is not None and value > maximum):
        raise ValueError(f'{name} outside allowed interval [{minimum}, {maximum}]')

def mva_to_mw(mva, power_factor):
    require_number('MVA', mva)
    require_number('power factor', power_factor, 0, 1)
    if power_factor == 0: raise ValueError('power factor must be positive')
    return mva * power_factor

def electricity(capacity_mw, utilization, pue, tariff_rp_per_kwh, hours_per_year=8760):
    for name, val in [('IT MW', capacity_mw), ('tariff Rp/kWh', tariff_rp_per_kwh)]:
        require_number(name, val)
    require_number('utilization', utilization, 0, 1)
    require_number('PUE', pue, 1)
    require_number('hours/year', hours_per_year, 1, 8784)
    it_mwh = capacity_mw * utilization * hours_per_year
    facility_mwh = it_mwh * pue
    annual_cost = facility_mwh * 1000 * tariff_rp_per_kwh
    return dict(it_electricity_mwh=it_mwh, it_electricity_gwh=it_mwh / 1000,
                it_electricity_twh=it_mwh / 1e6, it_electricity_kwh=it_mwh * 1000,
                facility_electricity_mwh=facility_mwh, facility_electricity_gwh=facility_mwh / 1000,
                facility_electricity_twh=facility_mwh / 1e6,
                facility_electricity_kwh=facility_mwh * 1000,
                monthly_electricity_gwh=facility_mwh / 12000,
                electricity_cost_rp=annual_cost, monthly_electricity_cost_rp=annual_cost / 12,
                electricity_cost_rp_per_mw_it=annual_cost / capacity_mw if capacity_mw else math.nan,
                average_facility_load_mw=capacity_mw * utilization * pue,
                full_it_load_facility_mw=capacity_mw * pue)
