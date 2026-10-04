"""Independent boundary and unit tests for accuracy-critical research formulas."""
import sys
import unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'src'))
from electricity_model import electricity, mva_to_mw
from water_model import water
from scenario_model import evaluate
from config import assumptions

class UnitTests(unittest.TestCase):
    def test_one_mw_continuous_and_conversions(self):
        x = electricity(1, 1, 1, 1000)
        self.assertEqual(x['it_electricity_mwh'], 8760)
        self.assertEqual(x['facility_electricity_gwh'], 8.76)
        self.assertEqual(x['facility_electricity_twh'], .00876)
        self.assertEqual(x['electricity_cost_rp'], 8760000000)

    def test_water_uses_it_denominator(self):
        e = electricity(1000, .8, 1.3, 996.74)
        w = water(e['it_electricity_kwh'], .5, 21500)
        self.assertEqual(w['water_m3_per_year'], 3504000)
        self.assertEqual(w['water_cost_rp'], 75336000000)
        self.assertEqual(e['facility_electricity_gwh'], 9110.4)

    def test_connection_is_not_it_load(self):
        self.assertEqual(mva_to_mw(100, .95), 95)
        self.assertNotEqual(mva_to_mw(100, .95), 100)

    def test_zero_capacity_and_water(self):
        self.assertEqual(electricity(0, .8, 1.3, 1000)['electricity_cost_rp'], 0)
        self.assertEqual(water(1000000, 0, 21500)['water_cost_rp'], 0)

    def test_invalid_inputs_fail(self):
        for args in [(-1,.8,1.3,1000),(1,1.01,1.3,1000),(1,.8,.9,1000),(1,.8,1.3,-1),(float('nan'),.8,1.3,1000)]:
            with self.assertRaises(ValueError): electricity(*args)
        with self.assertRaises(ValueError): mva_to_mw(100, 1.1)
        with self.assertRaises(ValueError): water(1, -.1, 1)

    def test_linear_scaling_and_cost_shares(self):
        a = assumptions()
        x, y = evaluate(50, 'base', a), evaluate(1000, 'base', a)
        self.assertAlmostEqual(y['facility_electricity_gwh'], x['facility_electricity_gwh'] * 20)
        self.assertAlmostEqual(y['electricity_cost_share_pct'] + y['water_cost_share_pct'], 100)

if __name__ == '__main__': unittest.main()
