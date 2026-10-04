"""Independent corruption tests for the research validation boundary.

Tests build tiny temporary datasets; they never mutate committed observations,
processed research outputs, sources, assumptions, or validation logs.
"""
import contextlib
import io
import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'src'))
import validate_data
from config import SCHEMAS, SOURCE_COLUMNS, assumptions
from electricity_model import electricity
from water_model import water


class ValidationTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.processed = self.root / 'data' / 'processed'
        self.interim = self.root / 'data' / 'interim'
        self.processed.mkdir(parents=True)
        self.interim.mkdir(parents=True)
        (self.root / 'outputs').mkdir()
        settings = assumptions()
        settings['assumptions_source_ids'] = ['TEST001']
        settings['baseline']['source_id'] = 'TEST001'
        settings['national_denominator']['source_id'] = 'TEST001'
        for case in settings['outlook'].values():
            case['anchor_source_id'] = 'TEST001'
        patches = patch.multiple(validate_data, ROOT=self.root,
                                 PROCESSED=self.processed, INTERIM=self.interim,
                                 assumptions=lambda: settings)
        patches.start()
        self.addCleanup(patches.stop)
        sources = []
        for sid in ['TEST001', 'MODEL001']:
            row = {c: None for c in SOURCE_COLUMNS}
            row.update(source_id=sid, title='Isolated validation fixture',
                       organization='Test fixture', url='https://example.org/fixture',
                       publication_date='2025-01-01', access_date='2026-10-04',
                       quality_tier='Tier 1')
            sources.append(row)
        pd.DataFrame(sources).to_csv(self.root / 'sources.csv', index=False)

        # Schema-complete fixtures use reported unknowns for irrelevant metrics.
        values = {
            'market_anchors': dict(metric='operational_it_capacity_mw', value=10,
                unit='MW', geography='Jakarta', year=2025, capacity_basis='IT',
                status='operational'),
            'datacenter_projects': dict(company='Fixture operator', facility='A',
                location='Jakarta', province='DKI Jakarta', status='operational',
                operational_mw=10, capacity_basis='IT', project_id='FIXTURE-A',
                power_connection_mva=20, power_connection_mw=19,
                connection_data_class='E', conversion_power_factor=.95),
            'indonesia_electricity': dict(year=2025, electricity_consumption_twh=455.001,
                pln_sales_twh=317.692, electricity_generation_twh=494.353,
                installed_capacity_gw=107.49889, peak_demand_gw=65.134),
            'electricity_tariffs': dict(customer_class='I-4', voltage_level='TT',
                tariff_rp_per_kwh=996.74, effective_period='2026-07-01/2026-09-30'),
            'water_tariffs': dict(location='Jakarta', provider='Fixture utility',
                customer_category='industry', consumption_band='>20 m3',
                tariff_rp_per_m3=21500, effective_date='2025-01-01'),
            'climate': dict(location='Jakarta', year=2025, month=1,
                avg_temperature_c=28, avg_relative_humidity_pct=80, rainfall_mm=100),
            'pue_benchmarks': dict(company='Fixture operator', facility='A',
                country='Indonesia', pue=1.3, year=2025),
            'wue_benchmarks': dict(company='Fixture operator', facility='A',
                country='Indonesia', wue_l_per_kwh=.5, cooling_type='fixture', year=2025),
            'ai_hardware': dict(hardware='Fixture accelerator', tdp_watts=700),
        }
        for name, columns in SCHEMAS.items():
            row = {c: None for c in columns}
            row.update(values[name], source_id='TEST001', data_class='A', notes='Test only')
            rows = [row]
            if name == 'datacenter_projects':
                second = dict(row, project_id='FIXTURE-B', facility='B',
                              status='planned', operational_mw=None, planned_mw=20,
                              power_connection_mva=None, power_connection_mw=None,
                              connection_data_class=None, conversion_power_factor=None)
                rows.append(second)
            pd.DataFrame(rows).to_csv(self.processed / f'{name}.csv', index=False)

        energy = electricity(10, .8, 1.3, 996.74)
        water_use = water(energy['it_electricity_kwh'], .5, 21500)
        model = dict(it_capacity_mw=10, it_capacity_gw=.01, utilization=.8, pue=1.3,
                     wue_l_per_kwh=.5, electricity_tariff_rp_per_kwh=996.74,
                     water_tariff_rp_per_m3=21500, source_id='MODEL001', data_class='S',
                     year=2030, **energy, **water_use)
        for name in ['capacity_scenarios', 'sensitivity', 'additional_1gw', 'outlook_2030_2032']:
            pd.DataFrame([model]).to_csv(self.processed / f'{name}.csv', index=False)

    def change(self, name, edit):
        path = self.processed / f'{name}.csv'
        frame = pd.read_csv(path)
        edit(frame)
        frame.to_csv(path, index=False)

    def run_validation(self):
        with contextlib.redirect_stdout(io.StringIO()):
            return validate_data.validate()

    def rejects(self, message):
        with self.assertRaisesRegex(ValueError, message):
            self.run_validation()
        report = json.loads((self.interim / 'validation_report.json').read_text())
        self.assertTrue(any(x['level'] == 'ERROR' for x in report))

    def test_valid_fixture_preserves_missing_observations_as_warnings(self):
        report = self.run_validation()
        self.assertFalse(any(x['level'] == 'ERROR' for x in report))
        self.assertTrue(any('Missing values retained' in x['message'] for x in report))

    def test_planned_capacity_cannot_be_operational(self):
        self.change('datacenter_projects', lambda d: d.loc.__setitem__((0, 'status'), 'planned'))
        self.rejects('Non-operational row classified as operational MW')

    def test_duplicate_project_identity_rejected_even_with_different_rows(self):
        self.change('datacenter_projects', lambda d: d.loc.__setitem__((1, 'project_id'), 'FIXTURE-A'))
        self.rejects('Duplicated project_id')

    def test_pue_below_one_rejected(self):
        self.change('pue_benchmarks', lambda d: d.loc.__setitem__((0, 'pue'), .99))
        self.rejects('PUE below 1')

    def test_unknown_source_reference_rejected(self):
        self.change('datacenter_projects', lambda d: d.loc.__setitem__((0, 'source_id'), 'MISSING999'))
        self.rejects('Unknown source ID MISSING999')

    def test_negative_electricity_tariff_rejected(self):
        self.change('electricity_tariffs', lambda d: d.loc.__setitem__((0, 'tariff_rp_per_kwh'), -1))
        self.rejects('Negative tariff_rp_per_kwh')

    def test_negative_water_tariff_rejected(self):
        self.change('water_tariffs', lambda d: d.loc.__setitem__((0, 'tariff_rp_per_m3'), -1))
        self.rejects('Negative tariff_rp_per_m3')

    def test_factor_of_thousand_energy_error_rejected(self):
        self.change('capacity_scenarios', lambda d: d.loc.__setitem__(
            (0, 'facility_electricity_twh'), d.loc[0, 'facility_electricity_twh'] * 1000))
        self.rejects('GWh/TWh conversion/reconciliation failure')

    def test_mva_is_not_silently_treated_as_mw(self):
        self.change('datacenter_projects', lambda d: d.loc.__setitem__((0, 'power_connection_mw'), 20))
        self.rejects('MVA to MW mismatch')

    def test_water_cannot_use_facility_kwh_denominator(self):
        def corrupt(d):
            d.loc[0, 'water_m3_per_year'] = d.loc[0, 'facility_electricity_kwh'] * .5 / 1000
            d.loc[0, 'water_cost_rp'] = d.loc[0, 'water_m3_per_year'] * 21500
        self.change('additional_1gw', corrupt)
        self.rejects('L/m3 conversion/reconciliation failure')

    def test_duplicate_national_year_rejected(self):
        path = self.processed / 'indonesia_electricity.csv'
        frame = pd.read_csv(path)
        second = frame.iloc[0].copy()
        second['pln_sales_twh'] += 1
        pd.concat([frame, second.to_frame().T], ignore_index=True).to_csv(path, index=False)
        self.rejects('Duplicate annual electricity rows')

    def test_source_published_after_cutoff_rejected(self):
        path = self.root / 'sources.csv'
        frame = pd.read_csv(path)
        frame.loc[0, 'publication_date'] = '2027-01-01'
        frame.to_csv(path, index=False)
        self.rejects('publication after research cutoff')

    def test_missing_required_dataset_rejected(self):
        (self.processed / 'climate.csv').unlink()
        self.rejects('Dataset absent')

    def test_coherently_rescaled_energy_still_rejects_wrong_load_hours(self):
        def corrupt(d):
            # Scaling all energy and cost fields preserves every unit ratio.
            # A capacity/load/hour identity must nevertheless reject the row.
            for col in d.columns:
                if ('electricity_' in col and col != 'electricity_tariff_rp_per_kwh') or col in [
                        'water_m3_per_year', 'water_cost_rp']:
                    d[col] = d[col] * 1000
        self.change('capacity_scenarios', corrupt)
        self.rejects('load-hours conversion/reconciliation failure')

    def test_unknown_model_source_rejected(self):
        self.change('capacity_scenarios', lambda d: d.loc.__setitem__(
            (0, 'source_id'), 'UNKNOWN-MODEL'))
        self.rejects('Unknown model source_id')

    def test_model_output_cannot_be_labeled_actual(self):
        self.change('capacity_scenarios', lambda d: d.loc.__setitem__((0, 'data_class'), 'A'))
        self.rejects('Model results incorrectly classified')

    def test_invalid_model_parameters_rejected(self):
        for column, invalid in [('pue', .99), ('utilization', 1.1),
                                ('electricity_tariff_rp_per_kwh', -1),
                                ('water_tariff_rp_per_m3', -1),
                                ('wue_l_per_kwh', -.01)]:
            with self.subTest(parameter=column):
                path = self.processed / 'sensitivity.csv'
                original = pd.read_csv(path)
                changed = original.copy()
                changed.loc[0, column] = invalid
                changed.to_csv(path, index=False)
                self.rejects(f'Invalid model {column}')
                original.to_csv(path, index=False)

    def test_infinite_pue_rejected_even_with_matching_infinite_energy(self):
        def corrupt(d):
            d.loc[0, 'pue'] = float('inf')
            for column in ['facility_electricity_mwh', 'facility_electricity_kwh',
                           'facility_electricity_gwh', 'facility_electricity_twh',
                           'electricity_cost_rp']:
                d.loc[0, column] = float('inf')
        self.change('capacity_scenarios', corrupt)
        self.rejects('Invalid model pue')

    def test_missing_schema_column_returns_recorded_validation_error(self):
        self.change('pue_benchmarks', lambda d: d.drop(columns=['source_id'], inplace=True))
        self.rejects('Missing column: source_id')


if __name__ == '__main__':
    unittest.main()
