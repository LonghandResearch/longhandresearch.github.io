/* Meaningful cross-language reconciliation. Run with node tests/test_interactive.cjs. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {calculate} = require('../interactive/model.js');
const d = JSON.parse(fs.readFileSync(path.join(__dirname,'../interactive/data.json'),'utf8'));
let checked=0;
for(const row of d.capacity_fixtures) {
  const r=calculate({capacity:row.it_capacity_mw,utilization:row.utilization,pue:row.pue,wue:row.wue_l_per_kwh,electricityTariff:row.electricity_tariff_rp_per_kwh,waterTariff:row.water_tariff_rp_per_m3,hours:d.hours,nationalTwh:d.national.consumption_twh});
  for(const [key,col] of [['facilityTwh','facility_electricity_twh'],['electricityCost','electricity_cost_rp'],['waterM3','water_m3_per_year'],['waterCost','water_cost_rp']]) assert.ok(Math.abs(r[key]-row[col])<=Math.max(1e-8,Math.abs(row[col])*1e-10),row.case+' '+key);
  checked++;
}
const base={capacity:1000,utilization:.8,pue:1.3,wue:.5,electricityTariff:996.74,waterTariff:21500,hours:8760,nationalTwh:455.001};
assert.equal(calculate({...base,wue:0}).waterM3,0);
assert.equal(calculate({...base,capacity:0}).facilityTwh,0);
assert.throws(()=>calculate({...base,wue:NaN}));
assert.throws(()=>calculate({...base,pue:.9}));
assert.throws(()=>calculate({...base,capacity:-1}));
assert.throws(()=>calculate({...base,electricityTariff:1e308}),/numerical range/);
assert.throws(()=>calculate({...base,waterTariff:1e308}),/numerical range/);
assert.equal(calculate({...base,capacity:0,electricityTariff:1e308,waterTariff:1e308}).electricityCost,0);
console.log('Interactive model reconciles all '+checked+' Python scenarios. Zero and invalid-input checks pass.');
