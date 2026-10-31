import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = name => JSON.parse(readFileSync(new URL(`../weekly/${name}.json`, import.meta.url), 'utf8'));
const raw = read('market-2026-10-30');
const flow = read('flowless-2026-10-30');
const hsc = read('hsc-2026-10-30');
const edition = read('2026-10-30');
const prior = read('market-2026-10-23');
const near = (a, b, tolerance = .000001) => assert.ok(Math.abs(a - b) < tolerance, `${a} != ${b}`);
const text = JSON.stringify(edition.sections) + JSON.stringify(edition.stats) + edition.deck;
const has = fragment => assert.ok(text.includes(fragment), `missing: ${fragment}`);
const pct = (a, b) => ((a / b - 1) * 100).toFixed(2);

test('Five daily market tables reconcile to the weekly totals and the frozen regular-market data', () => {
  const sums = { RG: 0, NG: 0, TN: 0 };
  raw.daily.forEach((day, i) => {
    Object.keys(sums).forEach(k => sums[k] += day.markets[k].valueIdr);
    assert.equal(day.markets.RG.valueIdr, flow.marketDaily[i].valueIdr);
    assert.equal(day.markets.RG.volume, flow.marketDaily[i].volume);
    assert.ok(flow.marketDaily[i].valueMatches && flow.marketDaily[i].volumeMatches);
    assert.equal(day.close, edition.observations.closes[i + 1].close);
    assert.equal(day.officialNetBn, edition.observations.foreignFlow[i].netBn);
    assert.equal(day.biUsdIdr, edition.observations.jisdor[i + 1].rate);
  });
  assert.equal(sums.RG, raw.weekly.marketTotals.RG.valueIdr);
  assert.equal(sums.NG, raw.weekly.marketTotals.NG.valueIdr);
  near(raw.daily.reduce((s, d) => s + d.officialNetBn, 0), -3056.47, .001);
  near((raw.weeklyForeign.buyIdr - raw.weeklyForeign.sellIdr) / 1e9, -3056.470281);
  assert.equal(raw.daily[0].previous, prior.daily.at(-1).close);
  assert.ok(raw.checks.length === 23 && raw.checks.every(c => c.ok));
});

test('Headline weekly figures recompute from the frozen data', () => {
  const close = raw.daily.at(-1).close;
  has(`${pct(close, 5439.258)}%`);
  has(`${pct(close, 5185.105).replace('-', '')}% below`);
  has(`${pct(close, 6093.759).replace('-', '')}%`);
  near(382.208 / 254.153, 1.5, 0.01);
  has(`${(-(raw.weekly.officialNetBn.thisWeek / raw.weekly.officialNetBn.lastWeek - 1) * 100).toFixed(2)}%`);
  has(`${(-raw.weekly.officialNetBn.thisWeek / 97921.62 * 100).toFixed(2)}% of it`);
  const rg = raw.weekly.marketTotals.RG.valueIdr / 5, rgPrior = prior.weekly.marketTotals.RG.valueIdr / 5;
  has(`${(-(rg / rgPrior - 1) * 100).toFixed(2)}% below`);
  const total = x => x.RG.valueIdr + x.NG.valueIdr + x.TN.valueIdr;
  has(`${(raw.weekly.marketTotals.NG.valueIdr / total(raw.weekly.marketTotals) * 100).toFixed(2)}%`);
  const usd = ((close / 5439.258) * (18069 / 18138) - 1) * 100;
  has(`${usd.toFixed(2)}%`);
  assert.ok(edition.stats[3].note.includes(`${usd.toFixed(2)}%`));
  has(`${((18138 / 18069 - 1) * 100).toFixed(2)}% rise`);
  has(`${(100 - 4436.503 / close * 100).toFixed(2)}% below Friday`);
  has(`${(100 - 4907.37 / close * 100).toFixed(2)}% would take IHSG below`.replace('% would', '% would'));
});

test('Breadth uses counts, and typed shares match them', () => {
  const b = raw.weeklyBreadth, n = 963;
  assert.equal(Object.values(b).reduce((x, y) => x + y), n);
  assert.equal(Object.values(raw.fridayBreadth).reduce((x, y) => x + y), n);
  assert.equal(b.downTo2 + b.downBeyond2, 720);
  assert.equal(b.upTo2 + b.upAbove2, 90);
  const rows = edition.sections.find(s => s.id === 'week').blocks.find(x => x.type === 'table').rows;
  const order = ['downBeyond2', 'downTo2', 'flat', 'upTo2', 'upAbove2'];
  rows.forEach((row, i) => { assert.equal(row[1], String(b[order[i]])); assert.equal(row[2], (Math.round(b[order[i]] / n * 10000) / 100).toFixed(2) + '%'); });
  const cap = raw.weeklyBreadthByCapTn, capTotal = Object.values(cap).reduce((x, y) => x + y);
  assert.equal(capTotal, 8795);
  assert.equal(((cap.downTo2 + cap.downBeyond2) / capTotal * 100).toFixed(2), '82.17');
  has('Rp7,227tn');
});

test('Index contributions and the group sums in the text', () => {
  const lag = raw.indexContributions.laggards, lead = raw.indexContributions.leaders;
  const sum = rows => rows.reduce((s, r) => s + r[3], 0);
  near(sum(lag), -184.36, .001);
  near(sum(lead), 21.97, .001);
  has((-sum(lag) / 382.208 * 100).toFixed(2) + '%');
  const pts = t => lag.find(r => r[0] === t)[3];
  near(pts('BYAN') + pts('BREN') + pts('MORA'), -65.82, .001);
  edition.observations.stocks.forEach(s => {
    const row = [...lag, ...lead].find(r => r[0] === s.ticker);
    assert.equal(row[3], s.points);
  });
});

test('Stock-level estimates, focus rows and the state-owned share', () => {
  const sells = flow.freshExport.topSells;
  const five = ['TLKM', 'BMRI', 'BBRI', 'ANTM', 'BBNI'].map(t => sells.find(s => s.ticker === t).netBn);
  near(five.reduce((s, x) => s + x, 0), -3366.05, .005);
  has((-five.reduce((s, x) => s + x, 0) / -flow.freshExport.totals.foreignNetBn * 100).toFixed(2) + '%');
  near(flow.freshExport.totals.foreignNetBn, -3946.55, .005);
  near(flow.freshExport.totals.allStocksForeignNetBn - raw.daily.reduce((s, d) => s + d.officialNetBn, 0), -1000.03, .01);
  near(flow.marketDaily.reduce((s, d) => s + d.officialLessEstimateBn, 0), 1000.03, .01);
  assert.equal(flow.freshExport.universe.stocks, 82);
  for (const [ticker, stock] of Object.entries(flow.focus)) {
    assert.equal(stock.rows.length, 20);
    near(stock.adtv20Bn, Math.round(stock.rows.reduce((s, d) => s + d.value, 0) / 20 / 1e7) / 100, .0051);
    const wk = stock.rows.slice(-5);
    near(stock.weekForeignNetBn, Math.round(wk.reduce((s, d) => s + d.foreignBuy - d.foreignSell, 0) / 1e7) / 100, .0051);
    near(stock.weekValueBn, wk.reduce((s, d) => s + d.value, 0) / 1e9, .0011);
    const fresh = [...flow.freshExport.topSells, ...flow.freshExport.topBuys].find(s => s.ticker === ticker);
    if (fresh) near(stock.weekForeignNetBn, fresh.netBn, .0051);
  }
  const bbca = flow.focus.BBCA, asii = flow.focus.ASII, mora = flow.focus.MORA, dcii = flow.focus.DCII;
  assert.deepEqual(bbca.dailyReturnPct.slice(2, 4), [7.65, -6.35]);
  assert.deepEqual(asii.dailyReturnPct.slice(2, 4), [7.99, -6.2]);
  assert.equal(flow.focus.TLKM.dailyReturnPct[2], -3.27);
  near(bbca.rows.at(-3).foreignBuy / 1e9 - bbca.rows.at(-3).foreignSell / 1e9, 1202.5, .06);
  assert.deepEqual(mora.dailyReturnPct, [-6.79, -6.95, -6.76, -6.87, -6.97]);
  near(mora.weekValueBn, 3.03, .005);
  assert.equal(dcii.rows.at(-3).value, 0);
  near(dcii.rows.at(-1).value / 1e6, 17, .5);
  assert.equal(dcii.rows.at(-1).close, 174975);
});

test('HSC list, group table and Sankey recompute from the frozen inputs', () => {
  assert.equal(hsc.membership.tickers.length, 81);
  assert.equal(new Set(hsc.membership.tickers).size, 81);
  assert.equal(hsc.stocks.length, 963);
  const members = new Set(hsc.membership.tickers);
  hsc.stocks.forEach(s => assert.equal(s.hsc, members.has(s.ticker)));
  const last = read('hsc-2026-10-23').membership.tickers;
  assert.deepEqual([...members].filter(t => !last.includes(t)).sort(), ['FILM', 'TFCO']);
  assert.deepEqual(last.filter(t => !members.has(t)), ['KING']);
  const cap = (g, k) => g.reduce((t, s) => t + s.sharesOutstanding * s[k], 0);
  const value = g => g.reduce((t, s) => t + s.weekRegularValueIdr, 0);
  const groups = [hsc.stocks.filter(s => s.hsc), hsc.stocks.filter(s => !s.hsc)];
  const totalCap = cap(groups[0], 'close23') + cap(groups[1], 'close23');
  const totalValue = value(groups[0]) + value(groups[1]);
  const loss = s => Math.max(0, s.sharesOutstanding * (s.close23 - s.close30)) / 1e12;
  const lossTotal = hsc.stocks.reduce((t, s) => t + loss(s), 0);
  const table = edition.sections.find(s => s.id === 'hsc').blocks.find(b => b.type === 'table').rows;
  const fmt = n => Math.round(n).toLocaleString('en-US');
  groups.forEach((g, i) => {
    const col = i + 1;
    assert.equal(table[0][col], `Rp${fmt(cap(g, 'close30') / 1e12)}tn`);
    assert.equal(table[1][col], `${(cap(g, 'close23') / totalCap * 100).toFixed(2)}%`);
    assert.equal(table[2][col], `${(value(g) / totalValue * 100).toFixed(2)}%`);
    assert.equal(table[3][col], `${pct(cap(g, 'close30'), cap(g, 'close23'))}%`);
    assert.equal(table[4][col], `${(g.reduce((t, s) => t + loss(s), 0) / lossTotal * 100).toFixed(2)}%`);
    assert.equal(table[5][col], `${pct(cap(g, 'close30'), cap(g, 'close16'))}%`);
  });
  near(lossTotal, 764.18, .005);
  const gains = hsc.stocks.reduce((t, s) => t + Math.max(0, s.sharesOutstanding * (s.close30 - s.close23)), 0) / 1e12;
  near(gains - lossTotal, -725.55, .01);
  near(cap(hsc.stocks, 'close30') / 1e12 - 8862, 0, 0.5);
  const sk = edition.observations.sankey;
  near(sk.links.filter(l => l.source.startsWith('g-')).reduce((s, l) => s + l.value, 0), lossTotal, .05);
  near(sk.links.filter(l => l.source === 'g-hsc').reduce((s, l) => s + l.value, 0), hsc.stocks.filter(s => s.hsc).reduce((t, s) => t + loss(s), 0), .05);
  const into = {}, out = {};
  sk.links.forEach(l => { out[l.source] = (out[l.source] || 0) + l.value; into[l.target] = (into[l.target] || 0) + l.value; });
  sk.nodes.filter(n => n.col === 1).forEach(n => near(into[n.id], out[n.id], .06));
  ['BREN', 'BYAN', 'MORA', 'BRPT', 'AMMN', 'TLKM'].forEach(t => {
    const s = hsc.stocks.find(x => x.ticker === t);
    near(into['t-' + t], loss(s), .01);
  });
  const mora = hsc.stocks.find(s => s.ticker === 'MORA');
  has(`${Math.round(mora.sharesOutstanding * (mora.close23 - mora.close30) / mora.weekRegularValueIdr).toLocaleString('en-US')} times`);
  const bar = hsc.stocks.filter(s => ['BREN', 'BRPT', 'CUAN', 'TPIA'].includes(s.ticker));
  has(`${pct(cap(bar, 'close30'), cap(bar, 'close23')).replace('-', '')}%`);
  near(bar.reduce((t, s) => t + loss(s), 0), 131.67, .01);
  near(3.5 / 131.67 * 100, 2.7, .05);
  const fell = hsc.stocks.filter(s => s.close30 < s.close23).length, rose = hsc.stocks.filter(s => s.close30 > s.close23).length;
  assert.equal(fell, 720);
  assert.equal(rose, 90);
});

test('The scorecard table recomputes from closes', () => {
  const rows = edition.sections.find(s => s.id === 'leaders').blocks.filter(b => b.type === 'table')[0].rows;
  rows.forEach(row => {
    const s = hsc.stocks.find(x => x.ticker === row[0]);
    assert.equal(row[1], `${s.close23 >= s.close16 ? '+' : ''}${pct(s.close23, s.close16)}%`);
    assert.equal(row[2], `${s.close30 >= s.close23 ? '+' : ''}${pct(s.close30, s.close23)}%`);
    assert.equal(row[3], `${s.close30 >= s.close16 ? '+' : ''}${pct(s.close30, s.close16)}%`);
  });
});

test('Edition reader text has no semicolons, dashes or stock source lines', () => {
  const all = JSON.stringify(edition.sections) + JSON.stringify(edition.stats) + edition.deck + edition.title + edition.description;
  assert.equal((all.match(/;/g) || []).length, 0);
  assert.equal((all.match(/[–—]/g) || []).length, 0);
  assert.ok(!/\bPDF\b/i.test(all));
  assert.equal(edition.weekEnding, '2026-10-30');
  assert.equal(edition.observations.closes.at(-1).close, raw.daily.at(-1).close);
});
