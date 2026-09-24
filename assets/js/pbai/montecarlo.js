/* Longhand Research: The Power Behind AI, Monte Carlo.
   Loaded only when section 10 comes near the screen. Runs the same DCF as the
   rest of the report 10,000 times with inputs drawn from triangular ranges,
   using a seeded generator so a given seed and set of inputs always gives the
   same result. */
(function () {
  'use strict';

  const P = window.PBAI;
  const M = window.PBAI_MODEL;
  if (!P || !M) return;
  const { dcf, esc, nf, niceTicks, roundedCol, bindTips, tableView, responsive } = M;
  const RUNS = 10000;

  // Mulberry32: small, fast, and good enough for reproducible sampling
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  // Triangular draw by inverse CDF
  function tri(u, lo, mode, hi) {
    if (hi <= lo) return lo;
    const c = (mode - lo) / (hi - lo);
    return u < c ? lo + Math.sqrt(u * (hi - lo) * (mode - lo)) : hi - Math.sqrt((1 - u) * (hi - lo) * (hi - mode));
  }

  const VARS = [
    { k: 'growth', label: 'Revenue growth', unit: '% a year' },
    { k: 'margin', label: 'EBITDA margin', unit: '%' },
    { k: 'wacc', label: 'WACC', unit: '%' },
    { k: 'tg', label: 'Terminal growth', unit: '%' },
    { k: 'util', label: 'Utilisation index', unit: '100 = base' },
    { k: 'power', label: 'Power-cost change', unit: '%' },
  ];

  // Default ranges from the bear, base and bull presets; WACC runs the other way
  function ranges(d) {
    const r = {};
    VARS.forEach(({ k }) => {
      const vals = [d.bear[k], d.mid[k], d.bull[k]];
      r[k] = { lo: Math.min(...vals), mode: d.mid[k], hi: Math.max(...vals) };
    });
    return r;
  }

  function simulate(base, rg, capex, seed) {
    const rand = mulberry32(seed);
    const out = new Float64Array(RUNS);
    let redraws = 0;
    for (let i = 0; i < RUNS; i++) {
      let a;
      for (let tries = 0; tries < 50; tries++) {
        a = { capex };
        VARS.forEach(({ k }) => { a[k] = tri(rand(), rg[k].lo, rg[k].mode, rg[k].hi); });
        if (a.wacc - a.tg >= 1) break;
        redraws++;
      }
      out[i] = dcf(base, a).ev;
    }
    const sorted = Array.from(out).sort((x, y) => x - y);
    const q = (p) => sorted[Math.min(RUNS - 1, Math.max(0, Math.round(p * (RUNS - 1))))];
    return { sorted, p10: q(0.1), p25: q(0.25), p50: q(0.5), p75: q(0.75), p90: q(0.9), min: sorted[0], max: sorted[RUNS - 1], redraws };
  }

  function histogram(host, res, unit) {
    const w = Math.max(280, host.clientWidth || 600);
    const h = 252; const padL = 46; const padR = 12; const padT = 44; const padB = 34;
    // Trim the far tails to the 1st to 99th percentile so the body is readable
    const lo = res.sorted[Math.floor(RUNS * 0.01)]; const hi = res.sorted[Math.floor(RUNS * 0.99)];
    const bins = 36; const width = (hi - lo) / bins || 1;
    const counts = new Array(bins).fill(0);
    res.sorted.forEach((v) => { if (v >= lo && v <= hi) counts[Math.min(bins - 1, Math.floor((v - lo) / width))]++; });
    const cmax = Math.max(...counts);
    const ticks = niceTicks(0, cmax, 3);
    const top = ticks[ticks.length - 1];
    const plotW = w - padL - padR; const plotH = h - padT - padB;
    const xs = (v) => padL + ((v - lo) / (hi - lo)) * plotW;
    const ys = (c) => padT + (1 - c / top) * plotH;
    let g = '';
    ticks.forEach((t) => { const y = ys(t); g += `<line class="grid${t === 0 ? ' zero' : ''}" x1="${padL}" x2="${w - padR}" y1="${y}" y2="${y}"/><text class="tick" x="${padL - 6}" y="${y + 4}" text-anchor="end">${nf(t)}</text>`; });
    const bw = plotW / bins;
    counts.forEach((c, i) => {
      if (!c) return;
      const x = padL + i * bw + 1; const y0 = ys(0);
      const a = lo + i * width; const b = a + width;
      g += `<path class="bar s1" d="${roundedCol(x, y0, Math.max(1, bw - 2), y0 - ys(c))}" tabindex="0" data-tip="${esc(`${nf(a)} to ${nf(b)} ${unit}: ${nf(c)} runs (${(c / RUNS * 100).toFixed(1)}%)`)}"></path>`;
    });
    const marks = [['P10', res.p10], ['P25', res.p25], ['P50', res.p50], ['P75', res.p75], ['P90', res.p90]];
    marks.forEach(([n, v], i) => {
      const x = xs(v);
      g += `<line class="pmark${n === 'P50' ? ' p50' : ''}" x1="${x}" x2="${x}" y1="${padT - 4}" y2="${h - padB}"/>`;
      g += `<text class="plab" x="${x}" y="${padT - 8 - (i % 2) * 11}" text-anchor="middle">${n}</text>`;
    });
    const xt = niceTicks(lo, hi, 4).filter((t) => t >= lo && t <= hi);
    xt.forEach((t) => { g += `<text class="tick" x="${xs(t)}" y="${h - padB + 16}" text-anchor="middle">${nf(t)}</text>`; });
    g += `<text class="axis-unit" x="${w - padR}" y="${h - 4}" text-anchor="end">Model enterprise value, ${esc(unit)}</text><text class="axis-unit" x="0" y="10">Runs</text>`;
    host.innerHTML = `<svg viewBox="0 0 ${w} ${h}" width="100%" height="${h}" class="viz">${g}</svg>`;
    bindTips(host);
  }

  window.PBAI_MC = function (box) {
    const tickers = Object.keys(P.DCF);
    let co = tickers[0];
    box.innerHTML = `
      <div class="dcf-top">
        <div class="filters" role="group" aria-label="Choose a company" data-mc-co>${tickers.map((t, i) => `<button type="button" class="filter" data-co="${t}" aria-pressed="${i === 0}">${t}</button>`).join('')}</div>
        <div class="mc-seed"><label for="mc-seed">Seed</label><input class="input input-sm" type="number" id="mc-seed" value="2026" step="1" min="1"><button type="button" class="btn btn-sm" data-mc-run>Run 10,000</button></div>
      </div>
      <div class="table-scroll"><table class="mc-inputs"><caption class="sr-only">Input ranges: low, most likely and high</caption>
        <thead><tr><th scope="col">Input</th><th scope="col">Low</th><th scope="col">Most likely</th><th scope="col">High</th></tr></thead>
        <tbody>${VARS.map((v) => `<tr><th scope="row">${v.label} <span class="muted small">${v.unit}</span></th>${['lo', 'mode', 'hi'].map((p) => `<td><input class="input input-sm" type="number" step="0.25" data-mc-in="${v.k}.${p}" aria-label="${v.label}, ${p === 'lo' ? 'low' : p === 'mode' ? 'most likely' : 'high'}"></td>`).join('')}</tr>`).join('')}</tbody>
      </table></div>
      <p class="calc-hint" data-mc-fixed></p>
      <figure class="pbai-figure">
        <figcaption class="fig-cap"><span class="fig-no">Figure 12.</span> Distribution of model enterprise value, 10,000 runs</figcaption>
        <div class="chart" data-chart="mc" role="img" aria-label="Histogram of simulated enterprise values"></div>
        <dl class="calc-results mc-stats" data-mc-stats aria-live="polite"></dl>
        <p class="fig-src"><span class="tag tag-scenario">Scenario</span> Seeded simulation of the section 08 DCF. Base-year revenue and margin as reported for FY2025; ranges default to the bear, base and bull presets. The chart trims the outer 1% at each end; percentiles use every run.</p>
      </figure>`;
    const fill = () => {
      const rg = ranges(P.DCF[co]);
      VARS.forEach(({ k }) => ['lo', 'mode', 'hi'].forEach((p) => { box.querySelector(`[data-mc-in="${k}.${p}"]`).value = rg[k][p]; }));
      box.querySelector('[data-mc-fixed]').textContent = `Held fixed: capex at ${P.DCF[co].mid.capex}% of revenue, tax at 22%, starting revenue ${P.DCF[co].base.unit === 'USD m' ? 'US$' : 'Rp'}${nf(P.DCF[co].base.revenue, P.DCF[co].base.unit === 'USD m' ? 2 : 0)} ${P.DCF[co].base.unit === 'USD m' ? 'm' : 'bn'} (FY2025, reported).`;
    };
    const read = () => {
      const rg = {};
      VARS.forEach(({ k }) => {
        const v = ['lo', 'mode', 'hi'].map((p) => Number(box.querySelector(`[data-mc-in="${k}.${p}"]`).value));
        const [lo, mode, hi] = v;
        const s = [lo, hi].sort((x, y) => x - y);
        rg[k] = { lo: s[0], hi: s[1], mode: Math.min(s[1], Math.max(s[0], mode)) };
      });
      return rg;
    };
    const run = () => {
      const d = P.DCF[co];
      const seed = Math.max(1, Math.floor(Number(box.querySelector('#mc-seed').value) || 2026));
      const t0 = performance.now();
      const res = simulate(d.base, read(), d.mid.capex, seed);
      const ms = performance.now() - t0;
      const unit = d.base.unit === 'USD m' ? 'US$ m' : 'Rp bn';
      const host = box.querySelector('[data-chart="mc"]');
      responsive(host, () => histogram(host, res, unit));
      const f = (v) => `${d.base.unit === 'USD m' ? 'US$' : 'Rp'}${nf(v)} ${d.base.unit === 'USD m' ? 'm' : 'bn'}`;
      box.querySelector('[data-mc-stats]').innerHTML = [['10th percentile', res.p10], ['25th percentile', res.p25], ['Median', res.p50], ['75th percentile', res.p75], ['90th percentile', res.p90]]
        .map(([n, v]) => `<div><dt>${n}</dt><dd>${f(v)}</dd></div>`).join('') + `<div><dt>Runs, seed, time</dt><dd class="small">${nf(RUNS)} runs · seed ${seed} · ${ms.toFixed(0)} ms${res.redraws ? ` · ${nf(res.redraws)} redraws` : ''}</dd></div>`;
      tableView(host, ['Percentile', `Model EV, ${unit}`], [['P10', nf(res.p10)], ['P25', nf(res.p25)], ['P50', nf(res.p50)], ['P75', nf(res.p75)], ['P90', nf(res.p90)]]);
    };
    box.querySelector('[data-mc-co]').addEventListener('click', (e) => {
      const b = e.target.closest('[data-co]'); if (!b) return;
      co = b.dataset.co;
      box.querySelectorAll('[data-co]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      fill(); run();
    });
    box.querySelector('[data-mc-run]').addEventListener('click', run);
    let timer = 0;
    box.addEventListener('input', (e) => { if (e.target.matches('[data-mc-in], #mc-seed')) { clearTimeout(timer); timer = setTimeout(run, 350); } });
    fill();
    run();
  };
})();
