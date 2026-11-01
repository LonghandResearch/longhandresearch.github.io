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

test('IDX evaluation file: exit list, per-issuer notices, weights and the 18% weight', () => {
  const ev = read('idx-ihsg-evaluation-2026-10-26');
  assert.equal(ev.announcement.number, 'Peng-00204/BEI.POP/10-2026');
  assert.equal(ev.exitCount, 81);
  assert.deepEqual(ev.exitCodes, hsc.membership.tickers);
  const current = ev.perIssuerNotices.current.map(r => r[0]);
  assert.equal(current.length, 82);
  assert.deepEqual(current.filter(c => !ev.exitCodes.includes(c)), ev.perIssuerNotices.notInExitList);
  assert.deepEqual(ev.perIssuerNotices.notInExitList, ['KING']);
  assert.deepEqual(ev.exitCodes.filter(c => !current.includes(c)), []);
  assert.deepEqual(ev.perIssuerNotices.ended.map(r => r[0]).sort(), ['LUCY', 'MGLV']);
  const w = ev.keyWeights;
  near(w.BBCA.post + w.BBRI.post + w.BMRI.post, 25.12, .001);
  near(w.BBCA.pre + w.BBRI.pre + w.BMRI.pre, 22.38, .001);
  has('25.12%');
  has('22.38%');
  const wc = ev.exitWeightCheck;
  const exitValue = wc.exitStocks.reduce((s, r) => s + r.indexShares * r.close22, 0);
  assert.equal(wc.exitStocks.length, 81);
  assert.deepEqual(wc.exitStocks.map(r => r.code), ev.exitCodes);
  near(exitValue, wc.exitIndexValueIdr, 1);
  near(exitValue / wc.totalIndexValueIdr * 100, wc.exitWeightPct, .005);
  assert.equal(wc.exitWeightPct, 17.51);
  assert.equal(wc.comparedRows, 836);
  assert.ok(wc.maxAbsDiffPct <= 0.005 && wc.rowsOver0006 === 0);
  for (const r of wc.rankedWeights) if (r.code === 'BBCA') assert.equal(r.weightPct, w.BBCA.pre);
  const rank = c => wc.rankedWeights.find(r => r.code === c);
  assert.deepEqual([rank('DCII').rank, rank('BYAN').rank, rank('BREN').rank, rank('DSSA').rank], [5, 7, 11, 15]);
  for (const c of ['DCII', 'BYAN', 'BREN', 'DSSA']) { const e = wc.exitStocks.find(r => r.code === c); near(e.indexShares * e.close22 / wc.totalIndexValueIdr * 100, rank(c).weightPct, .005); has(`${rank(c).weightPct.toFixed(2)}%`); }
  has('17.51%');
  const row = edition.sections.find(s => s.id === 'hsc').blocks.find(b => b.type === 'table').rows.at(-1);
  assert.equal(row[1], '17.51%');
  assert.equal(row[2], '82.49%');
  has('8.75% to 9.00%');
  has('7.93% to 9.00%');
  has('3.35% to 4.15%');
});

test('Third quarter figures in the text match the filings read on IDX', () => {
  const g = (a, b) => ((a / b - 1) * 100).toFixed(2);
  has(`up ${g(45534001, 37730142)}%`);
  has(`up ${g(589675654, 522154915)}%`);
  has(`${(-(2434231644 / 2439921045 - 1) * 100).toFixed(2)}% lower`);
  has(`fell ${(-(14446 / 15031 - 1) * 100).toFixed(2)}%`);
  has(`up ${g(113502, 109617)}%`);
  has(`Rp${(45534001 / 1e6).toFixed(2)}tn`);
  has(`Rp${(14446 / 1e3).toFixed(2)}tn`);
  has(`US$${(589675654 / 1e6).toFixed(1)}m`);
});

test('IDX stock summary cross-check agrees with the database behind the HSC table', () => {
  const chk = read('idx-stock-summary-check-2026-10-30');
  const loss = s => Math.max(0, s.sharesOutstanding * (s.close23 - s.close30)) / 1e12;
  const g = f => hsc.stocks.filter(f);
  const cap = (a, k) => a.reduce((t, s) => t + s.sharesOutstanding * s[k], 0) / 1e12;
  near(cap(g(s => s.hsc), 'close23'), chk.groups.hsc.value23Tn, .01);
  near(cap(g(s => s.hsc), 'close30'), chk.groups.hsc.value30Tn, .01);
  near(cap(g(s => !s.hsc), 'close30'), chk.groups.others.value30Tn, .01);
  near(g(s => s.hsc).reduce((t, s) => t + loss(s), 0), chk.groups.hsc.lossTn, .01);
  near(g(s => !s.hsc).reduce((t, s) => t + loss(s), 0), chk.groups.others.lossTn, .01);
  near(chk.groups.hsc.value30Tn + chk.groups.others.value30Tn, chk.totals.marketValue30Tn, .01);
  near(chk.groups.hsc.value23Tn + chk.groups.others.value23OwnSharesTn, chk.totals.marketValue23Tn, .01);
  assert.ok(Math.abs(chk.totals.marketValue23Tn - chk.totals.idxPublished23Tn) < .5);
  assert.ok(Math.abs(chk.totals.marketValue30Tn - chk.totals.idxPublished30Tn) < .5);
  assert.equal(chk.counts.fell, hsc.stocks.filter(s => s.close30 < s.close23).length);
  assert.equal(chk.counts.rose, hsc.stocks.filter(s => s.close30 > s.close23).length);
  for (const [ticker, closes] of Object.entries(chk.closes)) {
    const s = hsc.stocks.find(x => x.ticker === ticker);
    assert.equal(s.close23, closes['20261023']);
    assert.equal(s.close30, closes['20261030']);
    const f = flow.focus[ticker];
    if (f) {
      const byDate = Object.fromEntries(f.rows.map(r => [r.date.replaceAll('-', ''), r.close]));
      assert.equal(byDate['20261028'], closes['20261028']);
      assert.equal(byDate['20261029'], closes['20261029']);
    }
  }
  const topLoss = hsc.stocks.map(s => [s.ticker, loss(s)]).sort((a, b) => b[1] - a[1]).slice(0, 10).map(r => `${r[0]} ${r[1].toFixed(1)}`);
  assert.deepEqual(topLoss, chk.tenLargestLosses);
  const bbca = chk.spot.BBCA28Oct;
  near((bbca.foreignBuyShares - bbca.foreignSellShares) * chk.closes.BBCA['20261028'] / 1e9, bbca.estimatedNetBn, .06);
});

test('Who sold to whom: the table identities hold and the text and table match', () => {
  const p = raw.investorPairs, sum = (days, k) => days.reduce((s, d) => s + d.valueBn[k], 0);
  for (const wk of [p.thisWeek, p.lastWeek]) {
    assert.equal(wk.length, 5);
  }
  p.thisWeek.forEach((d, i) => near(d.valueBn.DF - d.valueBn.FD, raw.daily[i].officialNetBn, 1.01));
  near(sum(p.thisWeek, 'FF') + sum(p.thisWeek, 'DF'), raw.weeklyForeign.buyIdr / 1e9, 1.01);
  near(sum(p.thisWeek, 'FF') + sum(p.thisWeek, 'FD'), raw.weeklyForeign.sellIdr / 1e9, 1.01);
  near(sum(p.lastWeek, 'FF') + sum(p.lastWeek, 'DF'), prior.weeklyForeign.buyIdr / 1e9, 1.01);
  near(sum(p.lastWeek, 'FF') + sum(p.lastWeek, 'FD'), prior.weeklyForeign.sellIdr / 1e9, 1.01);
  const total = wk => ['FF', 'DF', 'FD', 'DD'].reduce((s, k) => s + sum(wk, k), 0);
  near(total(p.thisWeek), (raw.weekly.marketTotals.RG.valueIdr + raw.weekly.marketTotals.NG.valueIdr + raw.weekly.marketTotals.TN.valueIdr) / 1e9, 2);
  near(total(p.lastWeek), 101683.566631983, 2);
  const change = k => ((sum(p.thisWeek, k) / sum(p.lastWeek, k) - 1) * 100).toFixed(2);
  const flowSec = edition.sections.find(s => s.id === 'flow').blocks;
  const table = flowSec.find(b => b.type === 'table' && b.headers[0] === 'Who sold to whom');
  const keys = ['FD', 'DF', 'DD', 'FF'];
  table.rows.forEach((row, i) => { assert.equal(row[3], change(keys[i]) + '%'); assert.equal(row[1], 'Rp' + (Math.round(sum(p.lastWeek, keys[i]) / 10) / 100).toFixed(2) + 'tn'); assert.equal(row[2], 'Rp' + (Math.round(sum(p.thisWeek, keys[i]) / 10) / 100).toFixed(2) + 'tn'); });
  const changes = keys.map(k => +change(k));
  has(`between ${Math.abs(Math.max(...changes)).toFixed(2)}% and ${Math.abs(Math.min(...changes)).toFixed(2)}%`);
  assert.equal(Math.min(...changes), +change('FD'));
  has(`down ${Math.abs(+change('FD')).toFixed(2)}% to Rp${(Math.round(sum(p.thisWeek, 'FD') / 10) / 100).toFixed(2)}tn`);
  has(`local investors trading among themselves down ${Math.abs(+change('DD')).toFixed(2)}%`.replace('local', 'Local'));
});

test('Auction and MSIN figures in the text agree with their sources', () => {
  const bids = 31.09, prevBids = 64.9;
  has(`down ${((1 - bids / prevBids) * 100).toFixed(1)}% from the Rp64.9tn of 13 October`);
  has('Rp20.65tn');
  has('Rp3.61tn');
  has('7.54%');
  const chk = read('idx-stock-summary-check-2026-10-30');
  const m = chk.msin.days;
  has(`${(-(m['20261022'].close / m['20261021'].close - 1) * 100).toFixed(2)}% on 22 October`);
  has(`${(-(m['20261026'].close / m['20261023'].close - 1) * 100).toFixed(2)}% on 26 October`);
  ['20261027', '20261028', '20261030'].forEach(d => { assert.equal(m[d].volume, 0); assert.equal(m[d].close, 105); });
  assert.ok(m['20261026'].volume > 0);
});
