import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = name => JSON.parse(readFileSync(new URL(`../weekly/${name}.json`, import.meta.url), 'utf8'));
const raw = read('market-2026-11-06');
const flow = read('flowless-2026-11-06');
const month = read('idx-monthly-2026-10');
const edition = read('2026-11-06');
const prior = read('market-2026-10-30');
const oct16 = read('market-2026-10-16');
const near = (a, b, tolerance = .000001) => assert.ok(Math.abs(a - b) < tolerance, `${a} != ${b}`);
const text = JSON.stringify(edition.sections) + JSON.stringify(edition.stats) + edition.deck;
const has = fragment => assert.ok(text.includes(fragment), `missing: ${fragment}`);
const pct = (a, b) => ((a / b - 1) * 100).toFixed(2);
const sumBy = (rows, i) => rows.reduce((s, r) => s + r[i], 0);

test('Daily files reconcile with the weekly file, Flowless and the edition', () => {
  assert.ok(raw.checks.length === 23 && raw.checks.every(c => c.ok));
  assert.equal(raw.daily[0].previous, prior.daily.at(-1).close);
  raw.daily.forEach((day, i) => {
    assert.equal(day.close, edition.observations.closes[i + 1].close);
    assert.equal(day.officialNetBn, edition.observations.foreignFlow[i].netBn);
    assert.equal(day.biUsdIdr, edition.observations.jisdor[i + 1].rate);
    assert.equal(day.markets.RG.valueIdr, flow.marketDaily[i].idxValueIdr);
    assert.ok(flow.marketDaily[i].valueMatches && flow.marketDaily[i].volumeMatches);
  });
  near((raw.weeklyForeign.buyIdr - raw.weeklyForeign.sellIdr) / 1e9, -167.106573);
});

test('Headline weekly figures recompute', () => {
  const close = raw.daily.at(-1).close;
  assert.equal(pct(close, 5057.05), '-0.13');
  has(`${(-(raw.weekly.officialNetBn.thisWeek / raw.weekly.officialNetBn.lastWeek - 1) * 100).toFixed(2)}%`);
  const rg = raw.weekly.marketTotals.RG.valueIdr / 5, rgPrior = prior.weekly.marketTotals.RG.valueIdr / 5;
  has(`down ${(-(rg / rgPrior - 1) * 100).toFixed(2)}%`);
  has(`Rp${(rg / 1e12).toFixed(2)}tn`);
  const total = x => x.RG.valueIdr + x.NG.valueIdr + x.TN.valueIdr;
  has(`${(raw.weekly.marketTotals.NG.valueIdr / total(raw.weekly.marketTotals) * 100).toFixed(2)}%`);
  has(`${pct(4904.287, 5143.582).replace('-', '')}% from that point`);
  const usd = ((close / 5057.05) * (18138 / 18130) - 1) * 100;
  assert.ok(edition.stats[3].note.includes(`${usd.toFixed(2)}%`));
  has(`${pct(18130, 18138).replace('-', '')}% stronger`);
  has(`about ${(-usd).toFixed(2)}%`);
  near(-6.621 - 12.40, -19.021, .0001);
  has(`${((6.621 + 12.40) / 5057.05 * 100).toFixed(2)}%`);
});

test('Breadth uses counts', () => {
  const b = raw.weeklyBreadth, n = 963;
  assert.equal(Object.values(b).reduce((x, y) => x + y), n);
  assert.equal(b.downTo2 + b.downBeyond2, 579);
  assert.equal(b.upTo2 + b.upAbove2, 215);
  const rows = edition.sections.find(s => s.id === 'week').blocks.find(x => x.type === 'table').rows;
  ['downBeyond2', 'downTo2', 'flat', 'upTo2', 'upAbove2'].forEach((k, i) => {
    assert.equal(rows[i][1], String(b[k]));
    assert.equal(rows[i][2], (b[k] / n * 100).toFixed(2) + '%');
  });
  const cap = raw.weeklyBreadthByCapTn, capTotal = Object.values(cap).reduce((x, y) => x + y);
  has(`Rp${(cap.downTo2 + cap.downBeyond2).toLocaleString('en-US')}tn`);
  has(`${((cap.downTo2 + cap.downBeyond2) / capTotal * 100).toFixed(2)}%`);
  has(`${((cap.upTo2 + cap.upAbove2) / capTotal * 100).toFixed(2)}%`);
});

test('Index contributions and the stocks exhibit', () => {
  const { leaders, laggards } = raw.indexContributions;
  near(sumBy(leaders, 3), 80.78, .001);
  near(sumBy(laggards, 3), -46.51, .001);
  edition.observations.stocks.forEach(s => assert.equal([...leaders, ...laggards].find(r => r[0] === s.ticker)[3], s.points));
  Object.entries(raw.sectorIndices.weeklyPct).forEach(([k, v]) => assert.equal(edition.observations.sectors.find(s => s.name === k).weekly, v));
});

test('MKNT figures recompute from the register and the daily rows', () => {
  const k = raw.mknt;
  assert.equal(sumBy(k.holders, 1), k.sharesOutstanding);
  near(k.holders[2][1] * 32 / 1e12, 6.576, .001);
  has(`${((k.holders[0][1] + k.holders[1][1]) / k.sharesOutstanding * 100).toFixed(2)}%`);
  const week = k.daily.filter(r => r[0] >= '2026-11-02');
  has(`Rp${(sumBy(week, 3) / 1e9).toFixed(1)}bn`);
  assert.equal(week.at(-1)[2], 0);
  const steps = k.daily.filter(r => r[0] >= '2026-10-20' && r[0] <= '2026-10-30');
  assert.equal(steps.length, 9);
  steps.forEach((r, i) => assert.equal(r[1], (i ? steps[i - 1][1] : 2) + 1));
  near(pct(32, 11), 190.91, .01);
  const net = flow.focus.MKNT.slice(1).reduce((s, r) => s + r[4] - r[5], 0) / 1e9;
  has(`Rp${net.toFixed(2)}bn`);
});

test('Stock-level estimates in the text', () => {
  const t = flow.freshExport.totals;
  has(`Rp${Math.round(-t.allStocksForeignNetBn)}bn of net selling, Rp${Math.round(-t.allStocksForeignNetBn + raw.weekly.officialNetBn.thisWeek)}bn more`);
  const net = s => flow.focus[s].slice(1).reduce((x, r) => x + r[4] - r[5], 0) / 1e9;
  has(`Rp${Math.round(net('BBCA'))}bn`); has(`Rp${Math.round(net('ASII'))}bn`);
  has(`Rp${Math.round(-net('BBRI'))}bn`); has(`Rp${Math.round(-net('BMRI'))}bn`); has(`Rp${Math.round(-net('TLKM'))}bn`);
});

test('October figures recompute from the monthly file', () => {
  const s = month.tradingSummary;
  assert.equal(pct(s.ihsg.oct2026, s.ihsg.sep2026), '-16.70');
  has(`${(s.ihsg.sep2026 - s.ihsg.oct2026).toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} points`);
  has(`${(-month.foreign.netBn.oct2026 / -month.foreign.ytdNetBn * 100).toFixed(2)}%`);
  has(`${pct(month.foreign.netBn.oct2026, month.foreign.netBn.sep2026)}% more selling`);
  has(`Rp${(s.marketCapTn.sep2026 - s.marketCapTn.oct2026).toLocaleString('en-US')}tn`);
  const lag = month.indexMovers.laggards;
  has(`${(-sumBy(lag, 3)).toFixed(2)} points, ${(-sumBy(lag, 3) / (s.ihsg.sep2026 - s.ihsg.oct2026) * 100).toFixed(2)}%`);
  const usd = ((s.ihsg.oct2026 / s.ihsg.sep2026) * (month.jisdor.sep30 / month.jisdor.oct30) - 1) * 100;
  has(`about ${(-usd).toFixed(2)}%`);
  assert.equal(month.globalMoM.rows.length, 33);
  assert.equal(Math.min(...month.globalMoM.rows.map(r => r[1])), -16.70);
  const d16 = oct16.daily.find(d => d.date === '2026-10-16'), d15 = oct16.daily.find(d => d.date === '2026-10-15');
  has(`${pct(d16.close, d15.close).replace('-', '')}% that day`);
  const fred = raw.usMarketsFred.DJIA;
  has(`${pct(fred.find(r => r[0] === '2026-10-30')[1], fred.find(r => r[0] === '2026-09-30')[1])}%`);
  assert.equal(pct(fred.find(r => r[0] === '2026-10-29')[1], fred.find(r => r[0] === '2026-09-30')[1]), '2.82');
});

test('Global figures recompute', () => {
  const f = raw.usMarketsFred, at = (rows, d) => rows.find(r => r[0] === d)[1];
  has(`${pct(at(f.SP500, '2026-11-05'), at(f.SP500, '2026-11-04')).replace('-', '')}%`);
  has(`${pct(at(f.NASDAQCOM, '2026-11-05'), at(f.NASDAQCOM, '2026-11-04')).replace('-', '')}%`);
  has(`${pct(at(f.DJIA, '2026-11-06'), at(f.DJIA, '2026-10-30')).replace('-', '')}%`);
  has(`${pct(at(f.NASDAQCOM, '2026-11-06'), at(f.NASDAQCOM, '2026-10-30')).replace('-', '')}%`);
  has(`${pct(at(f.NIKKEI225, '2026-11-06'), at(f.NIKKEI225, '2026-11-05')).replace('-', '')}% that day`);
  near(104.77 + 8.66, 113.43, .001);
  has(`${pct(98.32, 113.43).replace('-', '')}%`);
  const us = { 'US S&P 500': pct(raw.sp500Friday.close, at(f.SP500, '2026-10-30')), 'US Nasdaq Composite': pct(at(f.NASDAQCOM, '2026-11-06'), at(f.NASDAQCOM, '2026-10-30')), 'US Dow Jones': pct(at(f.DJIA, '2026-11-06'), at(f.DJIA, '2026-10-30')) };
  edition.observations.globalWeek.forEach(g => assert.ok(us[g.name] ? us[g.name] === g.weekly.toFixed(2) : raw.globalComparison.rows.some(r => r[4] === g.weekly), g.name));
  assert.equal(raw.sp500Friday.previous, at(f.SP500, '2026-11-05'));
  has(`${pct(at(f.NASDAQ100, '2026-11-05'), at(f.NASDAQ100, '2026-11-04')).replace('-', '')}%`);
  const idx = edition.sections.find(s => s.id === 'global').blocks.find(b => b.type === 'table' && b.headers[0] === 'Index').rows;
  const row = name => idx.find(r => r[0] === name);
  assert.equal(row('S&P 500')[2], pct(raw.sp500Friday.close, at(f.SP500, '2026-10-30')) + '%');
  assert.equal(row('S&P 500')[3], pct(at(f.SP500, '2026-10-30'), at(f.SP500, '2026-09-30')) + '%');
  assert.equal(row('Nasdaq 100')[2], pct(at(f.NASDAQ100, '2026-11-06'), at(f.NASDAQ100, '2026-10-30')) + '%');
  assert.equal(row('Nasdaq 100')[3], pct(at(f.NASDAQ100, '2026-10-30'), at(f.NASDAQ100, '2026-09-30')) + '%');
  assert.equal(row('Nasdaq Composite')[3], pct(at(f.NASDAQCOM, '2026-10-30'), at(f.NASDAQCOM, '2026-09-30')) + '%');
  const country = { 'Nikkei 225, Japan': 'Japan', 'KOSPI, Korea': 'Korea', 'TSE Weighted, Taiwan': 'Taiwan', 'Hang Seng, Hong Kong': 'Hong Kong', 'SSE Composite, China': 'China', 'SENSEX, India': 'India', 'Straits Times, Singapore': 'Singapore', 'SET, Thailand': 'Thailand', 'KLCI, Malaysia': 'Malaysia', 'PSEi, Philippines': 'Philippines', 'VN-Index, Vietnam': 'Vietnam', 'IHSG, Indonesia': 'Indonesia', 'FTSE 100, UK, to Thursday': 'UK', 'DAX, Germany, to Thursday': 'Germany', 'CAC 40, France, to Thursday': 'France' };
  const sign = v => (v > 0 ? '+' : '') + v.toFixed(2) + '%';
  Object.entries(country).forEach(([name, c]) => {
    const w = raw.globalComparison.rows.find(r => r[0] === c), mo = month.globalMoM.rows.find(r => r[0] === c);
    assert.equal(row(name)[2], sign(w[4]), name); assert.equal(row(name)[3], sign(mo[1]), name);
  });
  edition.observations.octoberGlobal.forEach(g => assert.ok(month.globalMoM.rows.some(r => r[1] === g.weekly)));
  has(`${(21.04 / 28.56 * 100).toFixed(2)}%`);
});
