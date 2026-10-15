import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const data=JSON.parse(readFileSync(new URL('../updates/nickel-2026-10-14.json',import.meta.url),'utf8'));
const context={};
runInNewContext(readFileSync(new URL('../assets/js/nickel/model.js',import.meta.url),'utf8'),context);
const M=context.NickelModel;
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} differs from ${b}`);

test('small export shares remain distinct from source-rounded zero and missing values',()=>{
  assert.equal(M.destinationShareLabel(302092.86,14061458.71),'2.15%');
  assert.equal(M.destinationShareLabel(52.35,14061458.71),'0.000372%');
  assert.equal(M.destinationShareLabel(2.51,3177247.21),'0.000079%');
  assert.equal(M.destinationShareLabel(.01,3946556.16),'<0.000001%');
  assert.equal(M.destinationShareLabel(0,3946556.16),'0.00% reported');
  assert.equal(M.destinationShareLabel(null,3946556.16),'Unavailable');
  assert.equal(M.destinationShareLabel(10,0),'Unavailable');
});

test('site data and download preserve the same frozen observations',()=>{
  const ctx={window:{}};
  runInNewContext(readFileSync(new URL('../assets/js/nickel/data.js',import.meta.url),'utf8'),ctx);
  assert.equal(JSON.stringify(ctx.window.NICKEL_RESEARCH),JSON.stringify(data));
  assert.equal(data.datasets.prices.monthly.length,129);
  assert.equal(new Set(data.datasets.prices.monthly.map(r=>r.period)).size,129);
  assert.equal(data.datasets.prices.monthly.at(-1).period,'2026-09');
});
test('annual benchmark means reproduce source-derived values without annualising 2026',()=>{
  const means=M.annualPrices(data.datasets.prices.monthly);
  for(const row of means){const frozen=data.datasets.prices.annual_means.find(r=>r.year===row.year);near(row.mean,frozen.mean);assert.equal(row.months,frozen.months);}
  assert.equal(means.at(-1).months,9);
  const price=y=>means.find(r=>r.year===y).mean;
  near(M.change(price(2025),price(2021)),-17.88699341095767);
  near(M.change(price(2025),price(2022)),-41.30887789268595);
});
test('trade values use product tonnes, not contained nickel; missing data stays unavailable',()=>{
  const products=data.datasets.trade.selected_hs6_products;
  const f=products.find(r=>r.hs_code==='720260');
  const c=M.tradeComparison(f);
  near(c.weight,19.5211969711671);near(c.value,16.52474025107038);near(c.unit,-2.5070504613667888);
  near(M.unitValue({fob_usd:2000,net_product_weight_kg:1000}),2000);
  assert.equal(M.unitValue({fob_usd:2000,net_product_weight_kg:null}),null);
  assert.equal(M.change(null,100),null);assert.equal(M.change(100,0),null);
  const missing=M.tradeComparison({observations:[{year:2024,fob_usd:1000,net_product_weight_kg:1000},{year:2025,fob_usd:null,net_product_weight_kg:null}]});
  assert.equal(missing.weight,null);assert.equal(missing.value,null);assert.equal(missing.unit,null);
});
test('consolidated financial bridge reconciles original USD and does not substitute parent loss or cash interest',()=>{
  const f=data.datasets.companies.nic_group_financial_bridge.usd;
  assert.equal(f.results_from_operating_activities-f.net_financial_expense,f.loss_before_income_tax);
  assert.equal(f.loss_before_income_tax-f.income_tax_expense,f.loss_for_year);
  assert.equal(f.loss_for_year,-41166969);
  assert.notEqual(f.parent_attributable_loss,f.loss_for_year);
  assert.notEqual(f.cash_interest_paid_classified_financing,f.net_financial_expense);
});
test('counter-evidence keeps gross profit and parent-attributable profit separate',()=>{
  const r=data.datasets.companies.harita_financial_history.records;
  const a=r.find(r=>r.period==='1H2025'),b=r.find(r=>r.period==='1H2026');
  near(M.change(b.gross_profit,a.gross_profit),-10.886075949367086);
  near(M.change(b.patmi,a.patmi),41.735738664066315);
});
