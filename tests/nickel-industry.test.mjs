import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const data=JSON.parse(read('updates/nickel-indonesia-2026-10-15.json'));
const archive=JSON.parse(read('updates/nickel-2026-10-14.json'));

test('industry download equals browser evidence and retains audited historical vintages',()=>{
  const ctx={window:{}};runInNewContext(read('assets/js/nickel/industry-data.js'),ctx);
  assert.equal(JSON.stringify(ctx.window.NICKEL_RESEARCH),JSON.stringify(data));
  for(const k of ['prices','production','trade'])assert.deepEqual(data.datasets[k],archive.datasets[k]);
  assert.equal(data.datasets.companies,undefined);
  assert.equal(data.datasets.prices.monthly.at(-1).period,'2026-09');
});
test('geological table preserves reported totals and its one-tonne rounding difference',()=>{
  const R=data.reserves;
  assert.equal(R.period,'December 2024');
  assert.equal(R.national_metal_reserves_tonnes,62029856);
  assert.equal(R.provinces.reduce((s,r)=>s+r.metal_reserves_tonnes,0),R.national_metal_reserves_tonnes);
  assert.equal(R.provinces.reduce((s,r)=>s+r.ore_reserves_tonnes,0)-R.national_ore_reserves_tonnes,1);
  assert.equal(R.provinces.find(r=>r.name==='Sulawesi Tenggara').metal_reserves_tonnes,20961701);
  assert.ok(R.not_reported.includes('Papua')); // Dashes never become a production claim.
});
test('partner shares use thousand-USD World denominators and separate product categories',()=>{
  const expected={'720260':[14061458.71,94.3],'750110':[3177247.21,61.5],'750120':[3946556.16,99.5]};
  for(const d of data.destinations){
    assert.equal(d.world.trade_value_thousand_usd,expected[d.hs_code][0]);
    const china=d.partners.find(r=>r.partner==='China');
    const share=china.trade_value_thousand_usd/d.world.trade_value_thousand_usd*100;
    assert.equal(Number(share.toFixed(1)),expected[d.hs_code][1]);
    assert.equal(d.year,2024);assert.equal(d.nomenclature,'H0');
    assert.ok(Math.abs(d.partners.reduce((s,r)=>s+r.trade_value_thousand_usd,0)-d.world.trade_value_thousand_usd)<.03);
  }
  const matte=data.destinations.find(d=>d.hs_code==='750110');
  assert.equal(Number((matte.partners.find(r=>r.partner==='Japan').trade_value_thousand_usd/matte.world.trade_value_thousand_usd*100).toFixed(1)),32.3);
});
test('all report claims and locality descriptions link to a registered source',()=>{
  const ids=new Set(data.sources.map(s=>s.id));assert.equal(ids.size,data.sources.length);
  const html=read('more-nickel.html');
  for(const match of html.matchAll(/href="#source-([^"]+)"/g))assert.ok(ids.has(match[1]),match[1]);
  for(const site of data.sites){assert.ok(ids.has(site.source));assert.ok(Number.isFinite(site.lon)&&Number.isFinite(site.lat));}
  assert.ok(html.includes('conditional')||html.includes('Conditional'));
  assert.ok(!html.includes('finance-bridge')&&!html.includes('harita-comparison'));
  assert.ok(html.includes('https://longhandresearch.github.io/more-nickel.html'));
  assert.ok(!html.includes('noindex, nofollow'));
});
