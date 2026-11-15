import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = name => JSON.parse(readFileSync(new URL(`../weekly/${name}.json`, import.meta.url), 'utf8'));
const raw = read('market-2026-11-13');
const hsc = read('idx-hsc-2026-11-13');
const edition = read('2026-11-13');
const prior = read('market-2026-11-06');
const priorEdition = read('2026-11-06');
const near = (a, b, tolerance = .000001) => assert.ok(Math.abs(a - b) < tolerance, `${a} != ${b}`);
const text = JSON.stringify(edition.sections) + JSON.stringify(edition.stats) + edition.deck;
const has = fragment => assert.ok(text.includes(fragment), `missing: ${fragment}`);
const pct = (a, b) => ((a / b - 1) * 100).toFixed(2);
const share = (a, b) => (a / b * 100).toFixed(2);
const fmt = (v, d = 2) => v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
const total = m => m.RG.valueIdr + m.TN.valueIdr + m.NG.valueIdr;

test('Daily files reconcile with the weekly file and the edition', () => {
  assert.ok(raw.checks.length === 23 && raw.checks.every(c => c.ok));
  assert.equal(raw.daily[0].previous, prior.daily.at(-1).close);
  raw.daily.forEach((day, i) => {
    assert.equal(day.close, edition.observations.closes[i + 1].close);
    assert.equal(day.officialNetBn, edition.observations.foreignFlow[i].netBn);
    assert.equal(day.biUsdIdr, edition.observations.jisdor[i + 1].rate);
  });
  assert.deepEqual(raw.jisdor.rates.map(r => r[1]), edition.observations.jisdor.map(r => r.rate));
  near((raw.weeklyForeign.buyIdr - raw.weeklyForeign.sellIdr) / 1e9, 462.725591);
});

test('Headline figures recompute', () => {
  const close = raw.daily.at(-1).close, start = prior.daily.at(-1).close;
  assert.equal(pct(close, start), '5.82');
  has(fmt(close - start, 3) + ' points');
  const usd = ((close / start) / (18218 / 18130) - 1) * 100;
  has(`${usd.toFixed(2)}%`);
  has(`${pct(18218, 18130)}% weaker`);
  const thuFri = raw.daily[3].change + raw.daily[4].change;
  has(`${fmt(thuFri, 3)} points, ${share(thuFri, close - start)}% of the week`);
  assert.ok(priorEdition.sections.some(s => JSON.stringify(s).includes('5,488')));
  has(`5,488, ${pct(5488, close)}% away`);
  has(`${((5488 - close) / 5488 * 100).toFixed(2)}% below 5,488`);
});

test('Five leaders and the rebuilt contributions', () => {
  const leaders = [['BBRI', 42.10], ['BBCA', 28.22], ['ASII', 25.28], ['TLKM', 20.83], ['BMRI', 18.93]];
  const printed = Object.fromEntries(raw.indexContributions.leadersAsPrinted.map(r => [r[0], r[3]]));
  leaders.forEach(([t, p]) => assert.equal(printed[t], p));
  const top5 = leaders.reduce((s, r) => s + r[1], 0);
  has(`${top5.toFixed(2)} points, ${share(top5, 293.977)}% of the gain`);
  const pc = hsc.pointContributions;
  pc.dailyCheck.rows.forEach(r => near(r[2], r[3], .0015));
  near(pc.weekTotal, 293.977, .001);
  pc.top.slice(0, 5).forEach(([t, p], i) => near(p, leaders[i][1], .011));
  const drags = pc.bottom.slice(-10).reduce((s, r) => s + r[1], 0);
  near(drags, pc.bottomTenSumExact, .01);
  has(`took ${(-pc.bottomTenSumExact).toFixed(2)} points`);
  const p = t => pc.top.find(r => r[0] === t)[1].toFixed(2);
  has(`BUMI added ${p('BUMI')} points, VKTR ${p('VKTR')} and BRMS ${p('BRMS')}`);
  assert.ok(pc.named.PANI < 0 && pc.named.NCKL < 0);
  assert.ok(hsc.prices.PANI['20261113'] > hsc.prices.PANI['20261106'] && hsc.prices.NCKL['20261113'] > hsc.prices.NCKL['20261106']);
});

test('Breadth uses counts', () => {
  const b = raw.weeklyBreadth, n = 945;
  assert.equal(Object.values(b).reduce((x, y) => x + y), n);
  const rows = edition.sections.find(s => s.id === 'week').blocks.find(x => x.type === 'table').rows;
  ['upAbove2', 'upTo2', 'flat', 'downTo2', 'downBeyond2'].forEach((k, i) => {
    assert.equal(rows[i][1], String(b[k]));
    assert.equal(rows[i][2], share(b[k], n) + '%');
  });
  const cap = raw.weeklyBreadthByCapTn, capTotal = Object.values(cap).reduce((x, y) => x + y);
  has(`Rp${(cap.upAbove2 + cap.upTo2).toLocaleString('en-US')}tn rose, ${share(cap.upAbove2 + cap.upTo2, capTotal)}%`);
});

test('Index membership, value and weights', () => {
  const { stay, leave } = hsc.groups;
  assert.equal(stay.n, 522); assert.equal(leave.n, 296);
  assert.equal(hsc.constituentsWithIndexShares['20261112'], 818);
  assert.equal(hsc.constituentsWithIndexShares['20261113'], 522);
  near(Math.round(stay.fullValueTn['20261113']), raw.daily[4].ihsgMarketCapTn, .01);
  near(Math.round(stay.fullValueTn['20261112'] + leave.fullValueTn['20261112']), raw.daily[3].ihsgMarketCapTn, .01);
  near(Math.round(stay.countedFreeFloatTn['20261113']), raw.daily[4].ihsgFreeFloatCapTn, .01);
  const full12 = stay.fullValueTn['20261112'] + leave.fullValueTn['20261112'];
  const ff12 = stay.countedFreeFloatTn['20261112'] + leave.countedFreeFloatTn['20261112'];
  near(Math.round(ff12), raw.daily[3].ihsgFreeFloatCapTn, .01);
  has(`Rp${fmt(leave.fullValueTn['20261112'])}tn, ${share(leave.fullValueTn['20261112'], full12)}%`);
  has(`Rp${fmt(leave.countedFreeFloatTn['20261112'])}tn of theirs, ${share(leave.countedFreeFloatTn['20261112'], ff12)}%`);
  has(`Only ${share(leave.countedFreeFloatTn['20261112'], leave.fullValueTn['20261112'])}%`);
  has(`against ${share(stay.countedFreeFloatTn['20261112'], stay.fullValueTn['20261112'])}%`);
  has(`grew to Rp${fmt(stay.countedFreeFloatTn['20261113'])}tn`);
  has(`${stay.weekChangeFullValuePct.toFixed(2)}%`); has(`${leave.weekChangeFullValuePct.toFixed(2)}%`);
  has(`at ${leave.thursdayChangeFullValuePct.toFixed(2)}% against ${stay.thursdayChangeFullValuePct.toFixed(2)}%`);
  const h = hsc.hsc;
  assert.equal(h.count, 383); assert.equal(h.new, 300);
  assert.equal(h.newNotLeavingIhsg.length, 4);
  assert.ok(Object.values(h.newNotLeavingWeight12Nov).every(w => w === 0));
  has(`${share(383, raw.daily[4] ? 945 : 0)}% of the 945 listed`);
  const w = hsc.weights.top10;
  has(`five largest stocks now make up ${w.slice(0, 5).reduce((s, r) => s + r[4], 0).toFixed(2)}%`);
  has(`three banks ${w.slice(0, 3).reduce((s, r) => s + r[4], 0).toFixed(2)}%`);
  w.slice(0, 5).forEach(r => near(r[4] / r[3], 1.064, .001));
  const sk = edition.observations.sankey.links;
  near(sk.find(l => l.source === 'leave' && l.target === 'counted').value, leave.countedFreeFloatTn['20261112'], .001);
  near(sk.find(l => l.source === 'stay' && l.target === 'counted').value, stay.countedFreeFloatTn['20261112'], .001);
  near(sk.find(l => l.source === 'leave' && l.target === 'uncounted').value, leave.fullValueTn['20261112'] - leave.countedFreeFloatTn['20261112'], .006);
  // The frozen values are rounded to two decimals. Unrounded, the difference is 3,725.547.
  near(sk.find(l => l.source === 'stay' && l.target === 'uncounted').value, stay.fullValueTn['20261112'] - stay.countedFreeFloatTn['20261112'], .011);
  assert.ok(hsc.mkntIndexShares['20261106'] > 0 && hsc.mkntIndexShares['20261109'] === 0);
});

test('Turnover without the ADRO and AADI transfers', () => {
  const n = hsc.negotiated10Nov, neg = n.ADRO.nonRegularValue + n.AADI.nonRegularValue;
  has(`Rp${(neg / 1e12).toFixed(2)}tn`);
  has(`Rp${(n.ADRO.nonRegularValue / 1e12).toFixed(2)}tn in ADRO and Rp${(n.AADI.nonRegularValue / 1e12).toFixed(2)}tn in AADI`);
  const day = raw.daily[1].markets; has(`${share(neg, total(day))}% of all value traded that day`);
  const week = total(raw.weekly.marketTotals), priorWeek = total(prior.weekly.marketTotals);
  const ex = (week - neg) / 5;
  has(`Rp${(ex / 1e12).toFixed(2)}tn a day, ${(-(ex / (priorWeek / 5) - 1) * 100).toFixed(2)}% less`);
  has(`${pct(raw.weekly.avgDailyValueBn.thisWeek, raw.weekly.avgDailyValueBn.lastWeek)}%`);
  has(`Rp${(raw.weekly.marketTotals.RG.valueIdr / 1e12).toFixed(2)}tn, down ${(-(raw.weekly.marketTotals.RG.valueIdr / prior.weekly.marketTotals.RG.valueIdr - 1) * 100).toFixed(2)}%`);
  has(`Rp${(raw.weekly.marketTotals.RG.valueIdr / 5e12).toFixed(2)}tn a day`);
  const t = raw.adroAadiTransfer; near(t.rows.reduce((s, r) => s + r[1], 0), t.adroTotalPct, 1e-9);
  near((22781 + 22318) / (2 * 118491) * 100, 19.03, .01);
  const exForeign = (22781 + 22318) / (2 * (118491 - neg / 1e9)) * 100;
  near(exForeign, 43.63, .01);
  has(`about ${Math.round(exForeign)}% of trading`);
  assert.equal(raw.delistings.rows.length, 18);
  has(`Rp${(raw.delistings.rows.reduce((s, r) => s + r[5], 0) / 1e12).toFixed(2)}tn together`);
});

test('Foreign flow figures', () => {
  const daily = raw.daily.map(d => d.officialNetBn);
  near(daily.reduce((s, v) => s + v, 0), 462.73, .001);
  has(`${share(daily[3], 462.73)}% of it`);
  has(`Rp${fmt(-raw.daily[4].ytdNetBn / 1000)}tn`);
  const f = hsc.foreign;
  has(`Rp${fmt(f.allStocksNetBn)}bn, Rp${fmt(f.allStocksNetBn - 462.73)}bn more`);
  has(`Among ${f.screenCount} liquid`);
  ['BBCA', 'ASII', 'BBRI', 'BMRI', 'TLKM', 'BRPT'].forEach(c => {
    const v = f.stocks[c].netBn; has((v < 0 ? '−' : '+') + fmt(Math.abs(v)));
  });
  has(`estimated Rp${f.stocks.BBRI.dailyNetBn[3].toFixed(2)}bn`);
  has(`estimated Rp${(-f.stocks.RAJA.netBn).toFixed(2)}bn`);
});

test('Global, rates and the bond auction', () => {
  const fr = raw.usMarketsFred;
  [['SP500', 'S&P 500'], ['NASDAQ100', 'Nasdaq 100']].forEach(([k, name]) => {
    const s = fr[k]; const v = pct(s.at(-1)[1], s[0][1]);
    assert.equal(edition.observations.globalWeek.find(r => r.name === `US ${name}`).weekly.toFixed(2), v);
  });
  has(`fell ${(-(fr.NIKKEI225[4][1] / fr.NIKKEI225[3][1] - 1) * 100).toFixed(2)}%`);
  assert.equal(raw.globalComparison.rows.length, 32);
  const ranked = [...raw.globalComparison.rows].sort((a, b) => b[5] - a[5]);
  assert.equal(ranked[2][1], 'Indonesia');
  const a = raw.sunAuction;
  has(`rose ${pct(a.bidsTn, a.priorBidsTn)}% to Rp${a.bidsTn}tn`);
  has(`${Math.round((a.fr0111.yieldPct - a.fr0111.priorYieldPct) * 100)} basis points higher`);
  has(`+${(fr.DGS10.at(-1)[1] - fr.DGS10[0][1]).toFixed(2)} points`);
  has(`+${(fr.DGS2.at(-1)[1] - fr.DGS2[0][1]).toFixed(2)} points`);
});
