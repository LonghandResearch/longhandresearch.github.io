import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = name => JSON.parse(readFileSync(new URL(`../weekly/${name}.json`, import.meta.url), 'utf8'));
const raw = read('market-2026-10-16');
const flow = read('flowless-2026-10-16');
const edition = read('2026-10-16');
const near = (a, b, tolerance = .000001) => assert.ok(Math.abs(a - b) < tolerance, `${a} != ${b}`);
test('Five supplied daily market tables reconcile to weekly exact totals and frozen regular data', () => {
  const sums = { RG: 0, NG: 0, TN: 0 };
  raw.daily.forEach((day, i) => {
    Object.keys(sums).forEach(k => sums[k] += day.markets[k].valueIdr);
    assert.equal(day.markets.RG.valueIdr, flow.marketDaily[i].valueIdr);
    assert.equal(day.markets.RG.volume, flow.marketDaily[i].volume);
    assert.equal(day.close, edition.observations.closes[i + 1].close);
    assert.equal(day.officialNetBn, edition.observations.foreignFlow[i].netBn);
    assert.equal(day.biUsdIdr, edition.observations.jisdor[i + 1].rate);
  });
  assert.equal(sums.RG, 67402367394800);
  assert.equal(sums.NG, 13670961445438);
  assert.equal(sums.TN, 23666200);
  assert.equal(sums.RG + sums.NG + sums.TN, 81073352506438);
  near(raw.daily.reduce((s, d) => s + d.officialNetBn, 0), -3194.58);
  near((raw.weeklyForeign.buyIdr - raw.weeklyForeign.sellIdr) / 1e9, -3194.572939441);
});
test('Displayed breadth uses counts and each focus stock meets the retained screen', () => {
  assert.equal(Object.values(raw.weeklyBreadth).reduce((a, b) => a + b), 963);
  assert.equal(raw.weeklyBreadth.downTo2 + raw.weeklyBreadth.downBeyond2, 807);
  assert.equal(Object.values(raw.fridayBreadth).reduce((a, b) => a + b), 963);
  for (const stock of flow.focus) {
    assert.equal(stock.observations.length, 20);
    assert.equal(stock.zeroVolumeSessions, 0);
    near(stock.adtv20Bn, stock.observations.reduce((s, d) => s + d.valueIdr, 0) / 20 / 1e9);
    near(stock.netBn, stock.observations.filter(d => d.date >= '2026-10-12').reduce((s, d) => s + d.foreignBuyEstimateIdr - d.foreignSellEstimateIdr, 0) / 1e9);
    assert.ok(stock.marketCapTn >= 100 && stock.adtv20Bn >= 50);
    near(stock.returnPct, (stock.close / stock.previousClose - 1) * 100);
    const fresh = [...flow.freshExport.topSells, ...flow.freshExport.topBuys].find(s => s.ticker === stock.ticker);
    assert.ok(fresh);
    near(stock.netBn, fresh.netBn, .0051);
  }
});
test('Published scenario endpoints preserve explicit assumptions and their dated anchors', () => {
  const p = edition.riskParameters;
  assert.equal(p.weightDate, '2026-09-30');
  assert.equal(p.fx, 18052);
  near(p.preShockAdtvTn, raw.daily.slice(0, 4).reduce((s, d) => s + d.markets.RG.valueIdr, 0) / 4e12);
  for (const scenario of p.scenarios) {
    scenario.levels.forEach((level, i) => near(level, 5185.105 * (1 + scenario.earningsPct[i] / 100) / (1 + 11.03 * scenario.yieldBps[i] / 10000)));
    assert.ok(scenario.levels[0] <= scenario.levels[1]);
  }
  near(edition.observations.stocks.reduce((s, d) => s + d.points, 0), -263.45);
  assert.ok(edition.stats[2].note.includes('-15.70%'));
});
