import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = name => JSON.parse(readFileSync(new URL(`../weekly/${name}.json`, import.meta.url), 'utf8'));
const raw = read('market-2026-10-23');
const flow = read('flowless-2026-10-23');
const edition = read('2026-10-23');
const near = (a, b, tolerance = .000001) => assert.ok(Math.abs(a - b) < tolerance, `${a} != ${b}`);
const text = JSON.stringify(edition);
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
  assert.equal(sums.RG, raw.weekly.marketTotals.RG.valueIdr);
  assert.equal(sums.NG, raw.weekly.marketTotals.NG.valueIdr);
  assert.equal(sums.RG + sums.NG + sums.TN, 101683566631983);
  near(raw.daily.reduce((s, d) => s + d.officialNetBn, 0), -6671.26, .001);
  near((raw.weeklyForeign.buyIdr - raw.weeklyForeign.sellIdr) / 1e9, -6671.263876354);
  assert.ok(raw.checks.every(c => c.ok));
});
test('Breadth uses counts, and typed shares match them', () => {
  const b = raw.weeklyBreadth;
  assert.equal(Object.values(b).reduce((x, y) => x + y), 963);
  assert.equal(Object.values(raw.fridayBreadth).reduce((x, y) => x + y), 963);
  assert.equal(b.upAbove2 + b.upTo2, 651);
  assert.equal(b.downTo2 + b.downBeyond2, 155);
  const cap = raw.weeklyBreadthByCapTn;
  const capTotal = Object.values(cap).reduce((x, y) => x + y);
  assert.equal((Math.round((cap.downTo2 + cap.downBeyond2) / capTotal * 10000) / 100).toFixed(2), '30.66');
  assert.equal((Math.round(b.downBeyond2 / 963 * 10000) / 100).toFixed(2), '11.94');
});
test('Typed weekly figures recompute from the frozen data', () => {
  const close = raw.daily.at(-1).close;
  assert.ok(text.includes(((close / 5185.105 - 1) * 100).toFixed(2) + '%'));
  assert.ok(text.includes(((close / 6093.759 - 1) * 100).toFixed(2).replace('-', '') + '% below'));
  const contributions = Object.fromEntries([...raw.indexContributions.leaders, ...raw.indexContributions.laggards].map(r => [r[0], r[3]]));
  near(['BMRI', 'BBRI', 'TLKM', 'BBNI'].reduce((s, t) => s + contributions[t], 0), 126.51, .001);
  near(raw.indexContributions.leaders.reduce((s, r) => s + r[3], 0), 199.84, .001);
  near((-6671.26 / -3194.57 - 1) * 100, 108.83, .005);
  const usd = ((close / 5185.105) * (18052 / 18069) - 1) * 100;
  assert.ok(edition.stats[3].note.includes(`+${usd.toFixed(2)}%`));
});
test('HSC table cells recompute from the frozen membership and constituent inputs', () => {
  const hsc = read('hsc-2026-10-23');
  assert.equal(hsc.membership.tickers.length, 80);
  assert.equal(new Set(hsc.membership.tickers).size, 80);
  assert.equal(hsc.stocks.length, 963);
  const members = new Set(hsc.membership.tickers);
  hsc.stocks.forEach(s => assert.equal(s.hsc, members.has(s.ticker)));
  const sum = (group, f) => group.reduce((t, s) => t + f(s), 0);
  const groups = [hsc.stocks.filter(s => s.hsc), hsc.stocks.filter(s => !s.hsc)];
  const cap = (g, k) => sum(g, s => s.sharesOutstanding * s[k]);
  const value = g => sum(g, s => s.weekRegularValueIdr);
  const totalCap = cap(groups[0], 'close23') + cap(groups[1], 'close23');
  const totalValue = value(groups[0]) + value(groups[1]);
  near(totalCap / 1e12, raw.daily.at(-1).idxMarketCapTn, 0.5);
  const cells = groups.map(g => [
    `Rp${Math.round(cap(g, 'close23') / 1e12).toLocaleString('en-US')}tn`,
    `${(cap(g, 'close23') / totalCap * 100).toFixed(2)}%`,
    `${(value(g) / totalValue * 100).toFixed(2)}%`,
    `+${((cap(g, 'close23') / cap(g, 'close16') - 1) * 100).toFixed(2)}%`,
    `+${((cap(g, 'close23') / cap(g, 'close19') - 1) * 100).toFixed(2)}%`
  ]);
  const table = edition.sections.find(s => s.id === 'hsc').blocks.find(b => b.type === 'table');
  table.rows.forEach((row, i) => { assert.equal(row[1], cells[0][i]); assert.equal(row[2], cells[1][i]); });
});
test('Focus stocks match daily rows and the fresh export', () => {
  for (const [ticker, stock] of Object.entries(flow.focus)) {
    assert.equal(stock.rows.length, 20);
    near(stock.adtv20Bn, Math.round(stock.rows.reduce((s, d) => s + d.value, 0) / 20 / 1e7) / 100, .0051);
    const fresh = [...flow.freshExport.topSells, ...flow.freshExport.topBuys].find(s => s.ticker === ticker);
    if (fresh) near(stock.weekForeignNetBn, fresh.netBn, .0051);
  }
  const mora = flow.focus.MORA, bbri = flow.focus.BBRI;
  const ratio = (11.67 / mora.weekValueBn) / (39.76 / bbri.weekValueBn);
  assert.ok(ratio > 435 && ratio < 445, `MORA ratio ${ratio}`);
});
