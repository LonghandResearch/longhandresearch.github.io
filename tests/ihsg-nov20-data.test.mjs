import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
const read = name => JSON.parse(readFileSync(new URL(`../weekly/${name}.json`, import.meta.url), 'utf8'));
const raw = read('market-2026-11-20');
const st = read('idx-stocks-2026-11-20');
const fl = read('flowless-2026-11-20');
const edition = read('2026-11-20');
const prior = read('market-2026-11-13');
const priorEdition = read('2026-11-13');
const priorHsc = read('idx-hsc-2026-11-13');
const near = (a, b, tolerance = .000001) => assert.ok(Math.abs(a - b) < tolerance, `${a} != ${b}`);
const text = JSON.stringify(edition.sections) + JSON.stringify(edition.stats) + edition.deck;
const has = fragment => assert.ok(text.includes(fragment), `missing: ${fragment}`);
const pct = (a, b) => ((a / b - 1) * 100).toFixed(2);
const share = (a, b) => (a / b * 100).toFixed(2);
const fmt = (v, d = 2) => v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
const total = m => m.RG.valueIdr + m.TN.valueIdr + m.NG.valueIdr;
const section = id => edition.sections.find(s => s.id === id);
const pts = st.pointContributions.points;
const close = raw.daily.at(-1).close, start = prior.daily.at(-1).close;

test('Daily files reconcile with the weekly file and the edition', () => {
  assert.ok(raw.checks.length === 23 && raw.checks.every(c => c.ok));
  assert.equal(raw.daily[0].previous, start);
  raw.daily.forEach((day, i) => {
    assert.equal(day.close, edition.observations.closes[i + 1].close);
    assert.equal(day.officialNetBn, edition.observations.foreignFlow[i].netBn);
    assert.equal(day.biUsdIdr, edition.observations.jisdor[i + 1].rate);
  });
  assert.deepEqual(raw.jisdor.rates.map(r => r[1]), edition.observations.jisdor.map(r => r.rate));
  near((raw.weeklyForeign.buyIdr - raw.weeklyForeign.sellIdr) / 1e9, -2608.568049);
  // Investor pairs: foreign buys are D-F plus F-F, sells F-D plus F-F, and the net is each day's official figure.
  const pairs = raw.investorPairs.rows;
  pairs.forEach((r, i) => near(r[2] - r[3], raw.daily[i].officialNetBn, 0.7));
  const T = [1, 2, 3, 4].map(i => pairs.reduce((s, r) => s + r[i], 0));
  assert.equal(T[1] + T[0], raw.investorComposition.foreignBuyBn);
  near(T[2] + T[0], raw.investorComposition.foreignSellBn, 1.01);
  assert.equal(T[3] + T[2], raw.investorComposition.domesticBuyBn);
  assert.equal(T[3] + T[1], raw.investorComposition.domesticSellBn);
  near(T.reduce((s, v) => s + v, 0), total(raw.weekly.marketTotals) / 1e9, 1);
  // The rebuilt index changes match IDX each day, and the stock summary's totals match IDX's printed values.
  st.indexCheck.rows.forEach((r, i) => { near(r[1], raw.daily[i].change, 1e-9); near(r[2], r[1], .0015); });
  st.indexCheck.rows.forEach((r, i) => {
    near(Math.round(r[3]), raw.daily[i].ihsgFreeFloatCapTn, .01);
    near(Math.round(r[4]), raw.daily[i].ihsgMarketCapTn, .01);
  });
  near(st.indexCheck.weekTotal, close - start, .001);
});

test('Headline figures recompute', () => {
  assert.equal(pct(close, start), '-3.71');
  has(fmt(start - close, 3) + ' points');
  has(`${share(start - close, 293.977)}% of the previous week's gain`);
  near(prior.daily.at(-1).close - priorEdition.observations.closes[0].close, 293.977, 1e-9);
  const usd = ((close / start) / (18278 / 18218) - 1) * 100;
  has(`USD return −${(-usd).toFixed(2)}%`);
  has(`IHSG lost about ${(-usd).toFixed(2)}%`);
  has(`${pct(18278, 18218)}% weaker`);
  raw.daily.forEach(d => has(`${Math.abs(d.changePct).toFixed(2)}%`));
  has(`${pct(raw.daily[1].high, raw.daily[1].previous)}% and ${pct(raw.daily[2].high, raw.daily[2].previous)}% at the high`);
  // Every day traded above the previous close at some point and closed below it.
  raw.daily.forEach(d => assert.ok(d.high > d.previous && d.close < d.previous, d.date));
  assert.ok(raw.daily[1].close < raw.daily[1].previous && raw.daily[2].close < raw.daily[2].previous);
  assert.equal(Math.max(...raw.daily.map(d => d.high)), 5385.138);
  assert.equal(Math.min(...raw.daily.map(d => d.low)), 5094.892);
  has(`A rise of ${pct(start, close)}% gets back to ${fmt(start, 3)}`);
  assert.ok(priorEdition.sections.some(s => JSON.stringify(s).includes('5,488')));
  assert.ok(priorEdition.sections.some(s => JSON.stringify(s).includes('5,027.964')));
  assert.ok(Math.min(...raw.daily.map(d => d.close)) > 5027.964);
  // Lowest close since the weekly began: none of the published closes is below 4,904.287.
  const closes = readdirSync(new URL('../weekly/', import.meta.url)).filter(f => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
    .flatMap(f => read(f.replace('.json', '')).observations.closes || []);
  assert.equal(Math.min(...closes.map(c => c.close)), 4904.287);
  assert.equal(closes.find(c => c.close === 4904.287).date, '2026-11-03');
  near(raw.pressFigures.technozBi.ihsgAfterDecision / raw.daily[2].previous * 100 - 100, 0.51, .006);
});

test('Contributions: miners, the ten drags and the leaders', () => {
  const ic = raw.indexContributions;
  const lag = ic.laggardsAsPrinted, lead = ic.leadersAsPrinted;
  // IDX's printed points agree with our rebuild to within 0.011 point in both lists.
  [...lag, ...lead].forEach(r => near(r[3], pts[r[0]], .011));
  // The printed lists are the true top ten each way this week (no members changed).
  const sorted = Object.entries(pts).sort((a, b) => a[1] - b[1]);
  assert.deepEqual(sorted.slice(0, 10).map(x => x[0]), lag.map(r => r[0]));
  assert.deepEqual(sorted.slice(-10).reverse().map(x => x[0]), lead.map(r => r[0]));
  assert.ok(st.indexCheck.sameMembersAllWeek && st.indexCheck.membersPerDay === 522);
  const lagSum = lag.reduce((s, r) => s + r[3], 0);
  has(`${(-lagSum).toFixed(2)} points, ${share(-lagSum, start - close)}%`);
  const four = ['AMMN', 'BRMS', 'MDKA', 'EMAS'];
  const fourPrinted = four.reduce((s, c) => s + lag.find(r => r[0] === c)[3], 0);
  near(fourPrinted, four.reduce((s, c) => s + pts[c], 0), .01);
  has(`took ${(-fourPrinted).toFixed(2)} points off IHSG, ${share(-fourPrinted, start - close)}% of the fall`);
  has(`Together the four took ${(-fourPrinted).toFixed(2)} points`);
  assert.equal(edition.stats[2].value, `−${(-fourPrinted).toFixed(2)} points`);
  const seven = fourPrinted + pts.ANTM + pts.TINS + pts.INCO;
  has(`these seven miners took ${(-seven).toFixed(2)} points, ${share(-seven, start - close)}% of the fall`);
  // The edition's chart uses IDX's five largest drags and five largest gains, as printed.
  const chart = edition.observations.stocks;
  assert.deepEqual(chart.slice(0, 5).map(r => [r.ticker, r.points]), lag.slice(0, 5).map(r => [r[0], r[3]]));
  assert.deepEqual(chart.slice(5).map(r => [r.ticker, r.points]), lead.slice(0, 5).reverse().map(r => [r[0], r[3]]));
  has(`BBCA added ${lead[0][3].toFixed(2)} points and EXCL, up ${lead[1][1].toFixed(2)}%, added ${lead[1][3].toFixed(2)}`);
  // Ten drags table: price change and points as printed, foreign side from the frozen estimate.
  const rows = section('miners').blocks.find(b => b.type === 'table').rows;
  rows.forEach((row, i) => {
    const [code, chg, , p] = lag[i];
    assert.equal(row[0], code);
    assert.equal(row[1], `−${Math.abs(chg).toFixed(2)}%`);
    assert.equal(row[2], `−${Math.abs(p).toFixed(2)}`);
    const f = st.foreign.stocks[code].netBn;
    assert.equal(row[3], (f < 0 ? '−' : '+') + fmt(Math.abs(f)));
  });
  // Monday's moves quoted in the competing-explanations table.
  const mon = c => Math.abs((st.prices[c]['20261116'] / st.prices[c]['20261113'] - 1) * 100);
  const ach = section('miners').blocks.filter(b => b.type === 'table')[1].rows;
  const monRow = ach[1].join(' ');
  const metal = ['AMMN', 'BRMS', 'MDKA', 'EMAS', 'ANTM', 'TINS', 'INCO'].map(mon);
  assert.equal(Math.min(...metal).toFixed(2), '4.62'); assert.equal(Math.max(...metal).toFixed(2), '6.90');
  assert.ok(monRow.includes('metal miners fell 4.62% to 6.90%'));
  [['HRUM', 6.25], ['AADI', 4.91], ['PTBA', 0.63]].forEach(([c, v]) => { near(mon(c), v, .0051); assert.ok(monRow.includes(c) && monRow.includes(`${v.toFixed(2)}%`), `${c} ${v}`); });
  assert.equal(st.prices.ITMG['20261116'], st.prices.ITMG['20261113']);
  // Most of the four miners' fall came after Monday.
  ['AMMN', 'BRMS', 'MDKA', 'EMAS'].forEach(c => assert.ok(mon(c) < Math.abs(pct(st.prices[c]['20261120'], st.prices[c]['20261113'])) / 2, c));
  // AMMN: foreign selling early in the week, buying later, and a similar fall in each half.
  const am = st.foreign.stocks.AMMN.dailyNetBn, ap = st.prices.AMMN;
  has(`sold an estimated Rp${fmt(-(am[0] + am[1]))}bn of it on Monday and Tuesday and bought back Rp${fmt(am[2] + am[3] + am[4])}bn from Wednesday`);
  [pct(ap['20261117'], ap['20261113']), pct(ap['20261120'], ap['20261117'])].forEach(v => assert.equal((+v).toFixed(1), '-7.3'));
  const msci = ach[2].join(' ');
  [['BRPT', 22.36], ['BRMS', 20.11]].forEach(([c, v]) => assert.equal(pct(st.prices[c]['20261120'], st.prices[c]['20261113']), `-${v.toFixed(2)}`));
  assert.ok(msci.includes(`Rp${fmt(-st.foreign.stocks.BRMS.netBn)}bn and Rp${fmt(-st.foreign.stocks.BRPT.netBn)}bn`) && msci.includes('20.11% and 22.36%'));
  assert.deepEqual(raw.pressFigures.kontanMsci.deletedFromStandard, ['BRPT', 'BRMS']);
});

test('Breadth uses counts', () => {
  const b = raw.weeklyBreadth, n = Object.values(b).reduce((x, y) => x + y);
  assert.equal(n, 945);
  assert.equal(n, Object.values(raw.lastDayBreadth).filter(v => typeof v === 'number').reduce((x, y) => x + y));
  const rows = section('week').blocks.find(x => x.type === 'table').rows;
  ['upAbove2', 'upTo2', 'flat', 'downTo2', 'downBeyond2'].forEach((k, i) => {
    assert.equal(rows[i][1], String(b[k]));
    assert.equal(rows[i][2], share(b[k], n) + '%');
  });
  const fell = b.downBeyond2 + b.downTo2;
  has(`${fell} of ${n} stocks fell, ${share(fell, n)}%, and ${b.downBeyond2} of them`);
  const cap = raw.weeklyBreadthByCapTn, capTotal = Object.values(cap).reduce((x, y) => x + y);
  has(`Rp${(cap.downBeyond2 + cap.downTo2).toLocaleString('en-US')}tn fell, ${share(cap.downBeyond2 + cap.downTo2, capTotal)}%`);
});

test('Foreign flow, official and estimated', () => {
  const daily = raw.daily.map(d => d.officialNetBn);
  near(daily.reduce((s, v) => s + v, 0), -2608.57, .001);
  assert.ok(daily.every(v => v < 0));
  has(`Friday's Rp${fmt(-daily[4])}bn was ${share(daily[4], -2608.57).replace('-', '')}% of the week`);
  has(`Rp${fmt(-raw.daily[4].ytdNetBn / 1000)}tn`);
  assert.ok(raw.daily[4].ytdNetBn < -100000 && raw.daily[3].ytdNetBn > -100000);
  // Heaviest week of selling since the week to 30 October.
  const nov06 = read('market-2026-11-06'), oct30 = read('market-2026-10-30');
  assert.ok(nov06.weekly.officialNetBn.thisWeek > -2608.57 && prior.weekly.officialNetBn.thisWeek > -2608.57);
  assert.ok(oct30.weekly.officialNetBn.thisWeek < -2608.57);
  assert.equal(edition.stats[1].value, `−Rp${Math.round(2608.57).toLocaleString('en-US')}bn`);
  const f = st.foreign;
  near(f.officialNetBn, -2608.57, 1e-9);
  has(`Rp${fmt(-f.allStocksNetBn)}bn of net selling, Rp${fmt(f.allStocksNetBn - f.officialNetBn)}bn less`);
  has(`Among ${f.screenCount} liquid`);
  assert.equal(f.screen.length, f.screenCount);
  assert.equal(f.screen.filter(c => f.stocks[c].netBn < 0).length, f.screenSold);
  assert.equal(f.screen.filter(c => f.stocks[c].netBn > 0).length, f.screenBought);
  has(`foreigners sold ${f.screenSold} and bought ${f.screenBought}`);
  f.screen.forEach(c => { const s = f.stocks[c]; near(s.dailyNetBn.reduce((a, v) => a + v, 0), s.netBn, .03); assert.ok(s.fullValueTn20Nov >= 10 && s.avgRegularValueBn >= 10); });
  const banks = ['BBCA', 'BBRI', 'BMRI'].reduce((s, c) => s + f.stocks[c].netBn, 0);
  has(`estimated Rp${fmt(-banks)}bn of BBCA, BBRI and BMRI`);
  ['BBCA', 'BBRI', 'BMRI'].forEach(c => assert.ok(st.prices[c]['20261120'] >= st.prices[c]['20261113']));
  const rows = section('flow').blocks.find(b => b.type === 'table').rows;
  rows.forEach(([c, net, chg]) => {
    const v = f.stocks[c].netBn; assert.equal(net, (v < 0 ? '−' : '+') + fmt(Math.abs(v)));
    const p = (st.prices[c]['20261120'] / st.prices[c]['20261113'] - 1) * 100;
    assert.equal(chg, (p < 0 ? '−' : p > 0 ? '+' : '') + fmt(Math.abs(p)) + '%');
  });
  const gaps = f.dailyAllNetBn.map((v, i) => v - f.officialDailyNetBn[i]);
  gaps.forEach((g, i) => near(g, raw.estimateDailyGapBn.gaps[i], .006));
  has(`single days miss by up to Rp${fmt(Math.max(...gaps.map(Math.abs)))}bn`);
  has(`foreigners bought an estimated Rp${fmt(f.stocks.ASII.netBn)}bn`);
  has(`Rp${fmt(-f.stocks.TLKM.netBn)}bn`);
  // The separate flow export gives the same stock figures and all-stock total.
  near(fl.totals.allStocksForeignNetBn, f.allStocksNetBn, .005);
  const common = [...fl.topSells, ...fl.topBuys].filter(s => f.stocks[s.ticker]);
  assert.ok(common.length >= 15);
  common.forEach(s => near(s.netBn, f.stocks[s.ticker].netBn, .005));
  // Of the five largest stocks foreigners bought only ASII.
  ['BBCA', 'BBRI', 'BMRI', 'TLKM'].forEach(c => assert.ok(f.stocks[c].netBn < 0));
  assert.ok(f.stocks.ASII.netBn > 0);
  const w = st.weights.pct;
  has(`BBCA made up ${w.BBCA[1].toFixed(2)}% of IHSG and BBRI ${w.BBRI[1].toFixed(2)}%`);
  has(`whose three largest names are ${(w.BBCA[1] + w.BBRI[1] + w.BMRI[1]).toFixed(2)}% of the index`);
  has(`With the three largest banks now ${(w.BBCA[1] + w.BBRI[1] + w.BMRI[1]).toFixed(2)}% of the index`);
});

test('Turnover and the one-off trades', () => {
  const t = st.negotiated.trades;
  const three = ['HRUM', 'WIFI', 'INET'].reduce((s, c) => s + t[c].valueBn, 0);
  const ng = raw.weekly.marketTotals.NG.valueIdr / 1e9;
  has(`came to Rp${(three / 1000).toFixed(2)}tn, ${share(three, ng)}% of all negotiated value`);
  near(st.negotiated.weekTotalBn, ng, .01);
  ['HRUM', 'WIFI', 'INET', 'AUTO'].forEach(c => near(t[c].shares * t[c].priceRp / 1e9, t[c].valueBn, .01));
  assert.equal((t.HRUM.shares / t.HRUM.listedShares * 100).toFixed(2), '50.00');
  near(t.INET.shares / t.INET.listedShares * 100, t.INET.buyerAfterPct, .005);
  near(t.WIFI.shares / t.WIFI.listedShares * 100, t.WIFI.sellerBeforePct, .0005);
  assert.equal(t.HRUM.priceRp, t.HRUM.previousClose);
  assert.equal(st.prices.HRUM['20261118'], 660);
  has(`Rp${fmt(t.WIFI.priceRp, 0)}, ${(t.WIFI.priceRp / t.WIFI.close).toFixed(2)} times its close`);
  const o = t.WIFI.oct19Check; near(1415652000 * 2870 + 3500000 * 1100, o.nonRegularValueRp, 1e-3); assert.equal(1415652000 + 3500000, o.nonRegularShares);
  const rows = section('turnover').blocks.find(b => b.type === 'table').rows;
  rows.forEach(([c, , shares, price, cl, value, what]) => {
    assert.equal(shares, t[c].shares.toLocaleString('en-US'));
    assert.equal(price, t[c].priceRp.toLocaleString('en-US'));
    assert.equal(cl, t[c].close.toLocaleString('en-US'));
    assert.equal(value, (t[c].valueBn / 1000).toFixed(2));
  });
  assert.ok(rows[1][6].includes(`${t.WIFI.sellerBeforePct}%`) && rows[2][6].includes(`${t.INET.buyerAfterPct}%`) && rows[3][6].includes(`${t.AUTO.buyerAfterPct}%`));
  const rg = raw.weekly.marketTotals.RG.valueIdr, prg = prior.weekly.marketTotals.RG.valueIdr;
  has(`Rp${(rg / 1e12).toFixed(2)}tn, Rp${(rg / 5e12).toFixed(2)}tn a day and ${(-(rg / prg - 1) * 100).toFixed(2)}% less`);
  has(`down ${(-raw.weekly.avgDailyFromPage1.valueChangePct).toFixed(2)}% to Rp${(raw.weekly.avgDailyValueBn.thisWeek / 1000).toFixed(2)}tn a day`);
  near(pct(raw.weekly.avgDailyValueBn.thisWeek, raw.weekly.avgDailyValueBn.lastWeek), -47.90, .001);
  const transfer = priorHsc.negotiated10Nov.ADRO.nonRegularValue + priorHsc.negotiated10Nov.AADI.nonRegularValue;
  has(`Rp${(transfer / 1e12).toFixed(2)}tn ADRO and AADI transfer`);
  const fb = raw.weeklyForeign.buyIdr, fs = raw.weeklyForeign.sellIdr, all = total(raw.weekly.marketTotals);
  assert.equal(Math.round((fb + fs) / (2 * all) * 100), 33);
  assert.equal(raw.investorComposition.foreignSharePct.thisWeek, 33);
  assert.equal(Math.round((fb + fs) / (2 * (all - three * 1e9)) * 100), 39);
  // Correction to last week: part of the ADRO and AADI transfer was booked between foreign accounts.
  const cor = raw.priorWeekForeignShareCorrection, pp = prior.investorPairs.rows, d10 = pp.find(r => r[0] === '2026-11-10');
  assert.deepEqual([d10[1], d10[2], d10[3], d10[4]], [cor.pairs10Nov['F-F'], cor.pairs10Nov['D-F'], cor.pairs10Nov['F-D'], cor.pairs10Nov['D-D']]);
  near(cor.transferBn, transfer / 1e9, .01);
  assert.ok(d10[4] < transfer / 1e9);
  const others = pp.filter(r => r[0] !== '2026-11-10').map(r => r[1]);
  assert.ok(others.every(v => v < 2000));
  const excess = d10[1] - others.reduce((a, v) => a + v, 0) / others.length;
  const fb0 = prior.investorComposition.foreignBuyBn, fs0 = prior.investorComposition.foreignSellBn, all0 = total(prior.weekly.marketTotals) / 1e9;
  const corrected = (fb0 + fs0 - 2 * excess) / (2 * (all0 - transfer / 1e9)) * 100;
  near(corrected, cor.corrected, .01);
  has(`local-to-local trading of Rp${d10[4].toLocaleString('en-US')}bn, less than the Rp${Math.round(transfer / 1e9).toLocaleString('en-US')}bn transfer`);
  has(`jumped to Rp${d10[1].toLocaleString('en-US')}bn`);
  has(`about ${Math.round(corrected)}%, close to the ${prior.investorComposition.foreignSharePct.lastWeek}% of the week before`);
  // The three trades had no foreign side: each stock's foreign shares that day are far smaller than the trade.
  // Sankey: pairs from IDX page 2, the one-off trades split out of local to local, balanced in the middle.
  const s = edition.observations.sankey.links, P = raw.investorPairs.rows;
  const sum = i => P.reduce((a, r) => a + r[i], 0) / 1000;
  const v = (a, b) => s.find(l => l.source === a && l.target === b).value;
  near(v('fsell', 'ff'), sum(1), 1e-9); near(v('dsell', 'df'), sum(2), 1e-9); near(v('fsell', 'fd'), sum(3), 1e-9);
  near(v('dsell', 'dd1'), three / 1000, 1e-9); near(v('dsell', 'dd1') + v('dsell', 'dd'), sum(4), 1e-9);
  ['ff', 'fd', 'df', 'dd1', 'dd'].forEach(id => near(s.filter(l => l.target === id).reduce((a, l) => a + l.value, 0), s.filter(l => l.source === id).reduce((a, l) => a + l.value, 0), 1e-9));
  has(`Foreigners sold Rp${sum(3).toFixed(2)}tn to locals and bought Rp${sum(2).toFixed(2)}tn from them`);
});

test('Global markets, the US week and rates', () => {
  const rows = [...raw.globalComparison.rows];
  assert.equal(rows.length, 32);
  const ranked = rows.sort((a, b) => b[5] - a[5]);
  assert.equal(ranked.findIndex(r => r[1] === 'Indonesia') + 1, 14);
  rows.forEach(r => near(+pct(r[4], r[3]), r[5], .006));
  const asia = raw.globalComparison.rows.filter(r => ['ASEAN', 'Asia Pacific'].includes(r[0]));
  assert.deepEqual(asia.filter(r => r[5] > 0).map(r => r[1]), ['India']);
  const g = Object.fromEntries(edition.observations.globalWeek.map(r => [r.name, r.weekly]));
  [['Taiwan TSE Weighted', 'Taiwan'], ['Korea KOSPI', 'Korea'], ['Japan Nikkei 225', 'Japan'], ['Indonesia IHSG', 'Indonesia'], ['India SENSEX', 'India'], ['US Dow Jones', 'US']]
    .forEach(([name, country]) => assert.equal(g[name], raw.globalComparison.rows.find(r => r[1] === country)[5]));
  const fr = raw.usMarketsFred;
  // IDX's US row runs from Friday 13 to Thursday 19 November. The S&P 500 and Nasdaq 100 rows use the same dates.
  assert.equal(raw.globalComparison.rows.find(r => r[1] === 'US')[3], fr.DJIA[0][1]);
  assert.equal(raw.globalComparison.rows.find(r => r[1] === 'US')[4], fr.DJIA[4][1]);
  assert.equal(g['US S&P 500'].toFixed(2), pct(fr.SP500[4][1], fr.SP500[0][1]));
  assert.equal(g['US Nasdaq 100'].toFixed(2), pct(fr.NASDAQ100[4][1], fr.NASDAQ100[0][1]));
  // Friday to Friday, with the index providers' 20 November closes.
  const fri = raw.usMarketsFriday;
  const us = section('global').blocks.find(b => b.type === 'table').rows;
  const series = [['SP500', fri.SP500.close], ['NASDAQCOM', fri.NASDAQCOM.close], ['NASDAQ100', fri.NASDAQ100.close], ['DJIA', fr.DJIA[5][1]]];
  series.forEach(([k, last], i) => {
    assert.equal(us[i][1], fmt(fr[k][0][1])); assert.equal(us[i][2], fmt(fr[k][4][1])); assert.equal(us[i][3], fmt(last));
    assert.equal(us[i][4], `−${(-(last / fr[k][0][1] - 1) * 100).toFixed(2)}%`);
  });
  has(`the S&P 500 fell ${(-(fri.SP500.close / fr.SP500[0][1] - 1) * 100).toFixed(2)}% over the week and the Nasdaq 100 ${(-(fri.NASDAQ100.close / fr.NASDAQ100[0][1] - 1) * 100).toFixed(2)}%`);
  near((fri.SP500.close / fr.SP500[4][1] - 1) * 100, fri.SP500.dayPct, .005);
  has(`The S&P 500 fell ${(-(fri.SP500.close / fr.SP500[4][1] - 1) * 100).toFixed(2)}% and the Nasdaq 100 ${(-(fri.NASDAQ100.close / fr.NASDAQ100[4][1] - 1) * 100).toFixed(2)}%`);
  // Friday was the worst US day of the week for the S&P 500.
  const spDays = [...fr.SP500.map(r => r[1]), fri.SP500.close].map((v, i, a) => i ? v / a[i - 1] - 1 : 0).slice(1);
  assert.equal(Math.min(...spDays), spDays.at(-1));
  has(`ten-year to ${fr.DGS10[4][1].toFixed(2)}% on Thursday from ${fr.DGS10[0][1].toFixed(2)}%`);
  has(`rose from ${fr.VIXCLS[0][1].toFixed(2)} to ${fr.VIXCLS[4][1].toFixed(2)}`);
  const rates = section('rates').blocks.find(b => b.type === 'table').rows;
  assert.equal(rates[2][3], `−${(fr.DGS10[0][1] - fr.DGS10[4][1]).toFixed(2)} points`);
  assert.equal(rates[3][3], `−${(fr.DGS2[0][1] - fr.DGS2[4][1]).toFixed(2)} points`);
  assert.equal(rates[4][3], `+${(fr.VIXCLS[4][1] - fr.VIXCLS[0][1]).toFixed(2)} points`);
  const bi = raw.biRate;
  assert.equal(rates[0][3], `+${(bi.biRatePct - bi.priorBiRatePct).toFixed(2)} points`);
  has(`raised the BI-Rate by 25 basis points to ${bi.biRatePct.toFixed(2)}%`);
  has(`deposit facility at ${bi.depositFacilityPct.toFixed(2)}% and the lending facility at ${bi.lendingFacilityPct.toFixed(2)}%`);
  assert.equal(raw.pressFigures.technozRupiah.consensusBiRatePct, bi.priorBiRatePct);
  // Indonesia was sixth of thirteen Asian markets in IDX's table.
  const asiaSorted = [...asia].sort((a, b) => b[5] - a[5]);
  assert.equal(asiaSorted.length, 13); assert.equal(asiaSorted.findIndex(r => r[1] === 'Indonesia') + 1, 6);
  ['Philippines', 'Singapore', 'Hong Kong'].forEach(c => assert.ok(asia.find(r => r[1] === c)[5] < -3.71));
  has('sixth of thirteen Asian markets');
  has(`expected a hold at ${bi.priorBiRatePct.toFixed(2)}%`);
  const n = raw.usMarketsFred.NIKKEI225; near((n[5][1] / n[4][1] - 1) * 100, raw.pressFigures.cnbciAsia.nikkei20NovPct, .006);
});

test('Rupiah records, the balance of payments and the signposts', () => {
  const rates = raw.jisdor.rates;
  let max = raw.jisdorRecord.maxTo13Nov.rate; const records = [];
  rates.slice(1).forEach(([d, r]) => { assert.ok(r > raw.jisdorRecord.maxTo13Nov.rate); if (r > max) { records.push(d); max = r; } });
  assert.deepEqual(records, ['2026-11-16', '2026-11-17', '2026-11-19', '2026-11-20']);
  has(`old record of ${raw.jisdorRecord.maxTo13Nov.rate.toLocaleString('en-US')} from 12 November`);
  assert.equal(prior.jisdorRecord.max.rate, raw.jisdorRecord.maxTo13Nov.rate);
  has('US$2.0bn in the third quarter, 0.5% of GDP, from US$12.6bn');
  has(`US$${raw.biRate.equityOutflowQ4UsdBn}bn leaving the stock market`);
  const [paths, signTable] = section('ahead').blocks.filter(b => b.type === 'table');
  const sign = signTable.rows;
  assert.equal(paths.rows.length, 3);
  assert.ok(paths.rows[1][3].includes('5,027.964') && paths.rows[2][3].includes('4,904.287'));
  has(`the market trades at ${raw.daily[4].marketPer.toFixed(2)} times earnings`);
  has(`come within Rp${fmt(st.foreign.allStocksNetBn - st.foreign.officialNetBn)}bn of the official total for the week but miss single days by up to Rp99.33bn`);
  assert.ok(sign[5][0] === "MSCI's decision");
  const mb = raw.pressFigures.bloombergMsci; assert.equal(mb.callDate, '2026-11-10'); assert.equal(mb.finalDecisionBy, '2027-06-30');
  has('on a 10 November call arranged by Ray Dalio'); has('by the end of June 2027'); has('two steps down, from emerging to standalone');
  assert.ok(sign[0][1].includes('18,278'));
  assert.ok(sign[1][1].includes('Rp2,608.57bn'));
  assert.ok(sign[3][1].includes(`VIX ${raw.usMarketsFred.VIXCLS[4][1].toFixed(2)}`));
  has('foreign selling of BBCA, BBRI and BMRI');
});
