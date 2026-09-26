/* Longhand Research: The Power Behind AI, the interactive parts.
   Everything is drawn from assets/js/pbai/data.js. The Monte Carlo module is
   loaded only when its section comes near the screen. */
(function () {
  'use strict';

  const root = document.querySelector('[data-pbai]');
  const P = window.PBAI;
  if (!root || !P) return;

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const MINUS = '−';

  const nf = (n, d = 0) => (n == null || !Number.isFinite(n) ? 'n/a'
    : (n < 0 ? MINUS : '') + Math.abs(n).toLocaleString('en-GB', { minimumFractionDigits: d, maximumFractionDigits: d }));
  const pct = (n, d = 1) => (n == null || !Number.isFinite(n) ? 'n/a' : `${n > 0 ? '+' : n < 0 ? MINUS : ''}${Math.abs(n).toFixed(d)}%`);
  const unitLabel = (u) => (u === 'USD m' ? 'US$ m' : 'Rp bn');
  const money = (v, u, d = 0) => (v == null || !Number.isFinite(v) ? 'n/a' : `${u === 'USD m' ? 'US$' : 'Rp'}${nf(v, d)}${u === 'USD m' ? ' m' : ' bn'}`);

  /* Sources: numbered in registry order */
  const SRC = new Map(P.SOURCES.map((s, i) => [s.id, { ...s, n: i + 1 }]));
  const cite = (id) => {
    const s = SRC.get(id);
    return s ? `<a class="cite" href="#src-${esc(id)}" title="${esc(`${s.publisher}: ${s.title}`)}">[${s.n}]</a>` : '';
  };
  const cites = (ids) => (ids || []).filter(Boolean).map(cite).join(' ');

  function initCites() {
    $$('.cite[data-cite]', root).forEach((a) => {
      const s = SRC.get(a.dataset.cite);
      if (!s) return;
      a.textContent = `[${s.n}]`;
      a.title = `${s.publisher}: ${s.title}`;
    });
    const list = $('[data-sources]', root);
    if (list) {
      list.innerHTML = P.SOURCES.map((s) => {
        const internal = !/^https?:/i.test(s.url);
        return `<li id="src-${esc(s.id)}" value="${SRC.get(s.id).n}">
          <p class="src-head"><span class="src-pub">${esc(s.publisher)}</span>. <a href="${esc(s.url)}"${internal ? '' : ' target="_blank" rel="noopener noreferrer"'}>${esc(s.title)}</a>. ${esc(s.date)}.</p>
          <p class="src-claim">Used for: ${esc(s.claim)}</p>
        </li>`;
      }).join('');
    }
    const acc = $('[data-accessed]', root);
    if (acc) acc.textContent = P.ACCESSED;
  }

  /* Tooltip shared by every chart */
  const tip = document.createElement('div');
  tip.className = 'viz-tip';
  tip.setAttribute('role', 'tooltip');
  tip.hidden = true;
  document.body.appendChild(tip);
  function showTip(html, x, y) {
    tip.innerHTML = html;
    tip.hidden = false;
    const r = tip.getBoundingClientRect();
    let left = x + 14;
    let top = y - r.height - 10;
    if (left + r.width > window.innerWidth - 8) left = x - r.width - 14;
    if (top < 8) top = y + 16;
    tip.style.left = `${Math.max(8, left)}px`;
    tip.style.top = `${top}px`;
  }
  const hideTip = () => { tip.hidden = true; };
  function bindTips(svg) {
    $$('[data-tip]', svg).forEach((el) => {
      el.addEventListener('pointermove', (e) => showTip(el.dataset.tip, e.clientX, e.clientY));
      el.addEventListener('pointerleave', hideTip);
      el.addEventListener('focus', () => { const b = el.getBoundingClientRect(); showTip(el.dataset.tip, b.left + b.width / 2, b.top); });
      el.addEventListener('blur', hideTip);
    });
  }
  window.addEventListener('scroll', hideTip, { passive: true });

  /* Data-table view under each chart, so nothing is colour or hover only */
  function tableView(host, head, rows) {
    let d = host.nextElementSibling;
    if (!d || !d.classList.contains('viz-table')) {
      d = document.createElement('details');
      d.className = 'viz-table';
      host.after(d);
    }
    const open = d.open;
    d.innerHTML = `<summary>Show the data</summary><div class="table-scroll"><table><thead><tr>${head.map((h) => `<th scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c, i) => (i ? `<td>${esc(c)}</td>` : `<th scope="row">${esc(c)}</th>`)).join('')}</tr>`).join('')}</tbody></table></div>`;
    d.open = open;
  }

  /* Horizontal bar chart. items: [{label, value, display, tip, series}] */
  function hbar(host, items, { unit = '', max = null, height = 30 } = {}) {
    const w = Math.max(260, host.clientWidth || 600);
    const longest = (key) => Math.max(...items.map((i) => String(i[key] || '').length));
    // label and value columns sized from their longest text, so nothing spills past the chart
    // On narrow screens each label sits above its bar instead of beside it
    const stacked = w < 480 || longest('label') * 6.6 + 10 > w * 0.36;
    const labelW = stacked ? 0 : Math.max(60, longest('label') * 6.6 + 10);
    const valueW = Math.min(Math.round(w * 0.45), Math.max(48, longest('display') * 6.4 + 14));
    const plotW = Math.max(40, w - labelW - valueW);
    const rowH = stacked ? height + 16 : height;
    const top = 22;   // room for the unit label above the plot
    const h = top + items.length * rowH + 22;
    const vmax = max || Math.max(...items.map((i) => Math.abs(i.value || 0)), 1);
    const ticks = niceTicks(0, vmax, stacked ? 3 : 4);
    const xs = (v) => labelW + (v / ticks[ticks.length - 1]) * plotW;
    let g = '';
    ticks.forEach((t) => {
      const x = xs(t);
      g += `<line class="grid" x1="${x}" x2="${x}" y1="${top}" y2="${h - 18}"/><text class="tick" x="${x}" y="${h - 4}" text-anchor="${t === 0 && stacked ? 'start' : 'middle'}">${nf(t)}</text>`;
    });
    items.forEach((it, i) => {
      const y = top + i * rowH + (stacked ? 20 : 6);
      const bh = Math.min(20, height - 10);
      const bw = Math.max(2, xs(it.value || 0) - labelW);
      g += stacked
        ? `<text class="lab" x="0" y="${y - 6}">${esc(it.label)}</text>`
        : `<text class="lab" x="${labelW - 10}" y="${y + bh / 2 + 4}" text-anchor="end">${esc(it.label)}</text>`;
      g += `<path class="bar s${it.series || 1}" d="${roundedBar(labelW, y, bw, bh)}" tabindex="0" data-tip="${esc(it.tip || `${it.label}: ${it.display}`)}"><title>${esc(`${it.label}: ${it.display}`)}</title></path>`;
      g += `<text class="val" x="${labelW + bw + 8}" y="${y + bh / 2 + 4}">${esc(it.display)}</text>`;
    });
    g += `<text class="axis-unit" x="${w}" y="11" text-anchor="end">${esc(unit)}</text>`;
    host.innerHTML = `<svg viewBox="0 0 ${w} ${h}" width="100%" height="${h}" class="viz" aria-hidden="false">${g}</svg>`;
    bindTips(host);
  }
  const roundedBar = (x, y, w, h) => {
    const r = Math.min(4, w / 2, h / 2);
    return `M${x},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h - r}Q${x + w},${y + h} ${x + w - r},${y + h}H${x}Z`;
  };
  const roundedCol = (x, y0, w, h) => {
    // grows up from baseline y0 when h > 0, down when h < 0; rounded at the data end
    if (h === 0) return '';
    const r = Math.min(4, w / 2, Math.abs(h));
    if (h > 0) { const y = y0 - h; return `M${x},${y0}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y0}Z`; }
    const y = y0 - h; return `M${x},${y0}V${y - r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y - r}V${y0}Z`;
  };
  function niceTicks(lo, hi, n) {
    const span = hi - lo || 1;
    const step0 = span / n;
    const mag = 10 ** Math.floor(Math.log10(step0));
    const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= step0) || 10 * mag;
    const start = Math.floor(lo / step) * step;
    const out = [];
    for (let v = start; v <= hi + step * 0.999; v += step) out.push(Math.round(v * 1e6) / 1e6);
    if (out[out.length - 1] < hi) out.push(out[out.length - 1] + step);
    return out;
  }

  /* Column chart for a few categories; values may be negative or missing */
  function columns(host, cats, values, { unit = '', fmt = (v) => nf(v), series = 1, h = 180, tipPrefix = '' } = {}) {
    const w = Math.max(220, host.clientWidth || 320);
    const padL = 44; const padR = 8; const padT = 18; const padB = 26;
    const vals = values.filter((v) => v != null && Number.isFinite(v));
    let lo = Math.min(0, ...vals); let hi = Math.max(0, ...vals);
    if (lo === hi) hi = 1;
    const ticks = niceTicks(lo, hi, 3);
    lo = Math.min(lo, ticks[0]); hi = ticks[ticks.length - 1];
    const plotH = h - padT - padB;
    const ys = (v) => padT + (1 - (v - lo) / (hi - lo)) * plotH;
    const band = (w - padL - padR) / cats.length;
    const bw = Math.min(24, band * 0.5);
    let g = '';
    ticks.forEach((t) => { const y = ys(t); g += `<line class="grid${t === 0 ? ' zero' : ''}" x1="${padL}" x2="${w - padR}" y1="${y}" y2="${y}"/><text class="tick" x="${padL - 6}" y="${y + 4}" text-anchor="end">${esc(fmt(t))}</text>`; });
    cats.forEach((c, i) => {
      const cx = padL + band * i + band / 2;
      const v = values[i];
      g += `<text class="tick" x="${cx}" y="${h - 8}" text-anchor="middle">${esc(c)}</text>`;
      if (v == null || !Number.isFinite(v)) {
        g += `<text class="na" x="${cx}" y="${ys(0) - 6}" text-anchor="middle">n/a</text>`;
        return;
      }
      const y0 = ys(0);
      const hh = y0 - ys(v);
      g += `<path class="bar s${series}" d="${roundedCol(cx - bw / 2, y0, bw, hh)}" tabindex="0" data-tip="${esc(`${tipPrefix}${c}: ${fmt(v)}`)}"><title>${esc(`${c}: ${fmt(v)}`)}</title></path>`;
      const ly = v >= 0 ? ys(v) - 5 : ys(v) + 13;
      g += `<text class="val" x="${cx}" y="${ly}" text-anchor="middle">${esc(fmt(v))}</text>`;
    });
    if (unit) g += `<text class="axis-unit" x="${padL}" y="11">${esc(unit)}</text>`;
    host.innerHTML = `<svg viewBox="0 0 ${w} ${h}" width="100%" height="${h}" class="viz">${g}</svg>`;
    bindTips(host);
  }

  /* Redraw charts when their width changes */
  const redraws = new Map();
  const ro = 'ResizeObserver' in window ? new ResizeObserver((entries) => entries.forEach((e) => {
    const f = redraws.get(e.target);
    const w = Math.round(e.contentRect.width);
    if (f && f.w !== w) { f.w = w; f.fn(); }
  })) : null;
  function responsive(host, fn) {
    fn();
    if (ro) { redraws.set(host, { fn, w: host.clientWidth }); ro.observe(host); }
  }

  /* Contents: highlight the section in view, and a drop-down on phones */
  function initToc() {
    const nav = $('[data-toc]', root);
    if (!nav) return;
    const links = $$('.pbai-toc-list a', nav);
    const current = $('[data-toc-current]', nav);
    const toggle = $('[data-toc-toggle]', nav);
    const setOpen = (open) => { nav.classList.toggle('is-open', open); toggle.setAttribute('aria-expanded', String(open)); };
    toggle.addEventListener('click', () => setOpen(!nav.classList.contains('is-open')));
    links.forEach((a) => a.addEventListener('click', () => setOpen(false)));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && nav.classList.contains('is-open')) { setOpen(false); toggle.focus(); } });
    const sections = links.map((a) => document.getElementById(a.hash.slice(1))).filter(Boolean);
    const mark = (id) => {
      links.forEach((a) => {
        const on = a.hash === `#${id}`;
        a.classList.toggle('is-current', on);
        if (on) { a.setAttribute('aria-current', 'location'); if (current) current.textContent = a.textContent.trim(); } else a.removeAttribute('aria-current');
      });
    };
    const onScroll = () => {
      const line = window.innerHeight * 0.28;
      let id = sections[0] && sections[0].id;
      sections.forEach((s) => { if (s.getBoundingClientRect().top <= line) id = s.id; });
      mark(id);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* 02: the chain */
  function initChain() {
    const host = $('[data-chain]', root);
    if (!host) return;
    host.innerHTML = `
      <ol class="chain-nodes" role="list">${P.CHAIN.map((c, i) => `
        <li><button type="button" class="chain-node" data-node="${c.id}" aria-pressed="${i === 0}" aria-controls="chain-panel">
          <span class="chain-i">${String(i + 1).padStart(2, '0')}</span><span class="chain-name">${esc(c.name)}</span>
        </button></li>`).join('')}
      </ol>
      <div class="chain-panel" id="chain-panel" data-chain-panel aria-live="polite"></div>`;
    const panel = $('[data-chain-panel]', host);
    const show = (id) => {
      const c = P.CHAIN.find((x) => x.id === id);
      $$('.chain-node', host).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.node === id)));
      panel.innerHTML = `
        <h3 class="chain-title">${esc(c.name)}</h3>
        <p class="chain-expl">${esc(c.explanation)}</p>
        <dl class="chain-dl">
          <div><dt>Economic role</dt><dd>${esc(c.role)}</dd></div>
          <div><dt>Major bottleneck</dt><dd>${esc(c.bottleneck)}</dd></div>
          <div><dt>Listed companies</dt><dd>${c.companies.length ? c.companies.map((t) => `<button type="button" class="ticker-link" data-open-co="${t}">${t}</button>`).join(' ') + ' ' : ''}<span class="muted">${esc(c.companyNote)}</span></dd></div>
          <div><dt>Sources</dt><dd>${cites(c.sources)}</dd></div>
        </dl>`;
    };
    host.addEventListener('click', (e) => {
      const b = e.target.closest('[data-node]');
      if (b) show(b.dataset.node);
    });
    host.addEventListener('keydown', (e) => {
      const b = e.target.closest('[data-node]');
      if (!b || !['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(e.key)) return;
      const all = $$('[data-node]', host);
      const i = all.indexOf(b) + (e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1);
      if (all[i]) { e.preventDefault(); all[i].focus(); show(all[i].dataset.node); }
    });
    show(P.CHAIN[0].id);
  }

  /* 03: Jakarta capacity and the project timeline */
  function initMarket() {
    const host = $('[data-chart="jakarta"]', root);
    if (host) {
      const items = [
        { label: 'Operating, H1 2026', value: 322, display: '322 MW', series: 1, tip: 'Operating capacity, H1 2026: 322 MW (industry estimate)' },
        { label: 'Under construction, H1 2026', value: 395, display: '395 MW', series: 1 },
        { label: 'Planned, H1 2026', value: 1304, display: '1,304 MW', series: 1, tip: 'Planned, H1 2026: 1,304 MW (pipeline less under construction)' },
        { label: 'Pipeline total, H1 2025', value: 709, display: '709 MW', series: 2 },
        { label: 'Pipeline total, H1 2026', value: 1699, display: '1,699 MW', series: 2 },
      ];
      responsive(host, () => {
        hbar(host, items, { unit: 'MW' });
        host.insertAdjacentHTML('beforeend', '<p class="legend"><span class="key s1"></span>By stage, H1 2026 <span class="key s2"></span>Total development pipeline</p>');
      });
      tableView(host, ['Measure', 'MW', 'Status'], [
        ['Operating, H1 2026', '322', 'Estimate'], ['Under construction, H1 2026', '395', 'Under construction'], ['Planned, H1 2026', '1,304', 'Estimate (derived)'],
        ['Pipeline total, H1 2025', '709', 'Estimate'], ['Pipeline total, H1 2026', '1,699', 'Estimate'],
      ]);
    }

    const tl = $('[data-timeline]', root);
    const detail = $('[data-timeline-detail]', root);
    if (!tl) return;
    const lanes = [['actual', 'Operational'], ['construction', 'Under construction'], ['announced', 'Announced']];
    const x0 = 2020; const x1 = 2029.6;
    const pos = (y) => ((y - x0) / (x1 - x0)) * 100;
    const years = []; for (let y = 2020; y <= 2029; y++) years.push(y);
    // Dots closer than about three months share a lane in stacked rows, so none hides another
    const stackLane = (k) => {
      const items = P.PROJECTS.map((p, i) => [p, i]).filter(([p]) => p.status === k).sort((a, b) => a[0].year - b[0].year);
      const ends = [];
      const placed = items.map(([p, i]) => {
        let row = ends.findIndex((e) => p.year - e >= 0.3);
        if (row < 0) { row = ends.length; ends.push(p.year); } else ends[row] = p.year;
        return [p, i, row];
      });
      return placed.map((x) => [...x, ends.length]);
    };
    const laneRows = (k) => { const s = stackLane(k); return s.length ? s[0][3] : 1; };
    tl.innerHTML = `<div class="tl-scroll" tabindex="-1"><div class="tl-inner">
      <div class="tl-axis" aria-hidden="true">${years.map((y) => `<span style="left:${pos(y)}%">${y}</span>`).join('')}</div>
      ${lanes.map(([k, name]) => `<div class="tl-lane" data-lane="${k}" style="--rows:${laneRows(k)}"><p class="tl-lane-name">${name}</p><div class="tl-track">${years.map((y) => `<span class="tl-tick" style="left:${pos(y)}%"></span>`).join('')}
        ${stackLane(k).map(([p, i, row, rows]) => `<button type="button" class="tl-dot shape-${k}" style="left:${pos(p.year)}%;top:${((row + 1) / (rows + 1) * 100).toFixed(1)}%" data-project="${i}" aria-label="${esc(`${p.name}, ${p.who}, ${name}, ${p.when}${p.mw ? `, ${p.mw} MW` : ''}`)}"></button>`).join('')}
      </div></div>`).join('')}
    </div></div>
    <details class="viz-table"><summary>Show as a list</summary><div class="table-scroll"><table>
      <thead><tr><th scope="col">Project</th><th scope="col">Who</th><th scope="col">Status</th><th scope="col">When</th><th scope="col">MW</th><th scope="col">Where</th></tr></thead>
      <tbody>${P.PROJECTS.map((p) => `<tr><th scope="row">${esc(p.name)}</th><td>${esc(p.who)}</td><td>${esc(lanes.find((l) => l[0] === p.status)[1])}</td><td>${esc(p.when)}</td><td>${p.mw ? nf(p.mw) : 'n/a'}</td><td>${esc(p.place)}</td></tr>`).join('')}</tbody>
    </table></div></details>`;
    const statusTag = { actual: '<span class="tag tag-actual">Operational</span>', construction: '<span class="tag tag-construction">Under construction</span>', announced: '<span class="tag tag-announced">Announced</span>' };
    const show = (i) => {
      const p = P.PROJECTS[i];
      $$('.tl-dot', tl).forEach((d) => d.classList.toggle('is-on', Number(d.dataset.project) === i));
      detail.innerHTML = `<p class="tl-d-head">${statusTag[p.status]} <strong>${esc(p.name)}</strong> · ${esc(p.who)}</p>
        <p>${esc(p.when)} · ${esc(p.place)}${p.mw ? ` · ${nf(p.mw)} MW` : ' · capacity not given in the sources'}</p>
        <p class="muted">${esc(p.detail)} ${cites(p.sources)}</p>`;
    };
    tl.addEventListener('click', (e) => { const d = e.target.closest('[data-project]'); if (d) show(Number(d.dataset.project)); });
    const filters = $('[data-timeline-filters]', root);
    filters.addEventListener('click', (e) => {
      const b = e.target.closest('[data-status]');
      if (!b) return;
      $$('[data-status]', filters).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      $$('.tl-lane', tl).forEach((l) => { l.hidden = b.dataset.status !== 'all' && l.dataset.lane !== b.dataset.status; });
    });
    show(P.PROJECTS.findIndex((p) => p.status === 'construction'));
  }

  /* 04: the power calculator and the 2030 scenarios */
  const H = 8760;
  function power({ mw, utilisation, pue, price }) {
    const avgFacility = mw * (utilisation / 100) * pue;
    const mwh = avgFacility * H;
    return { avgFacility, mwh, gwh: mwh / 1000, costRp: mwh * 1000 * price, peak: mw * pue };
  }
  function initCalc() {
    const form = $('[data-calc-form]', root);
    if (!form) return;
    const D = P.DEFAULTS;
    const fields = { mw: $('#c-mw'), utilisation: $('#c-util'), pue: $('#c-pue'), price: $('#c-price'), fx: $('#c-fx') };
    const setDefaults = () => { fields.mw.value = D.mw; fields.utilisation.value = D.utilisation; fields.pue.value = D.pue; fields.price.value = D.price; fields.fx.value = D.fx; };
    const read = () => ({
      mw: clamp(+fields.mw.value, 1, 1000), utilisation: clamp(+fields.utilisation.value, 10, 100), pue: clamp(+fields.pue.value, 1.05, 2.2),
      price: clamp(+fields.price.value || D.price, 100, 5000), fx: clamp(+fields.fx.value || D.fx, 1000, 50000),
    });
    const sens = $('[data-chart="sensitivity"]', root);
    const update = () => {
      const v = read();
      $('[data-out="mw"]', form).textContent = `${nf(v.mw)} MW`;
      $('[data-out="utilisation"]', form).textContent = `${nf(v.utilisation)}%`;
      $('[data-out="pue"]', form).textContent = v.pue.toFixed(2);
      const r = power(v);
      const res = (k, html) => { $(`[data-res="${k}"]`, root).innerHTML = html; };
      res('gwh', `${nf(r.gwh, r.gwh < 100 ? 1 : 0)} <span>GWh a year</span>`);
      res('cost', `Rp${nf(r.costRp / 1e9, 0)} <span>bn a year · about US$${nf(r.costRp / v.fx / 1e6, 1)} m</span>`);
      res('peak', `${nf(r.peak, 0)} <span>MW</span>`);
      res('share', `${(r.gwh / 1000 / 317.69 * 100).toFixed(2)}<span>% of 317.69 TWh</span>`);
      const base = r.costRp;
      const bump = (k, f) => { const w = { ...v }; w[k] = v[k] * f; return (power(w).costRp - base) / 1e9; };
      const items = [['Capacity', 'mw'], ['Utilisation', 'utilisation'], ['PUE', 'pue'], ['Price', 'price']].map(([label, k]) => ({ label, up: bump(k, 1.1), down: bump(k, 0.9) }));
      if (sens) responsive(sens, () => tornado(sens, items));
    };
    Object.values(fields).forEach((f) => f.addEventListener('input', update));
    $('[data-calc-reset]', root).addEventListener('click', () => { setDefaults(); update(); });
    setDefaults();
    update();
  }
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, Number.isFinite(v) ? v : lo));

  function tornado(host, items) {
    const w = Math.max(260, host.clientWidth || 360);
    const labelW = 84; const padR = 10; const rowH = 28; const top = 18;
    const h = top + items.length * rowH + 22;
    const m = Math.max(...items.map((i) => Math.max(Math.abs(i.up), Math.abs(i.down))), 1);
    const plotW = w - labelW - padR;
    const cx = labelW + plotW / 2;
    const xs = (v) => cx + (v / m) * (plotW / 2 - 6);
    let g = `<line class="grid zero" x1="${cx}" x2="${cx}" y1="${top - 6}" y2="${h - 20}"/>`;
    g += `<text class="tick" x="${labelW + 4}" y="${top - 6}">−10%</text><text class="tick" x="${w - padR}" y="${top - 6}" text-anchor="end">+10%</text>`;
    items.forEach((it, i) => {
      const y = top + i * rowH + 4; const bh = 16;
      g += `<text class="lab" x="${labelW - 8}" y="${y + 12}" text-anchor="end">${esc(it.label)}</text>`;
      [['down', 3], ['up', 1]].forEach(([k, s]) => {
        const v = it[k]; const x = xs(Math.min(0, v)); const bw = Math.abs(xs(v) - cx);
        if (bw < 0.5) return;
        const d = v >= 0 ? roundedBar(cx, y, bw, bh) : `M${cx},${y}H${x + 4}Q${x},${y} ${x},${y + 4}V${y + bh - 4}Q${x},${y + bh} ${x + 4},${y + bh}H${cx}Z`;
        g += `<path class="bar s${s}" d="${d}" tabindex="0" data-tip="${esc(`${it.label} ${k === 'up' ? '+10%' : '−10%'}: ${v >= 0 ? '+' : MINUS}Rp${nf(Math.abs(v))} bn a year`)}"></path>`;
      });
    });
    g += `<text class="axis-unit" x="${cx}" y="${h - 4}" text-anchor="middle">Change in annual cost, Rp bn</text>`;
    host.innerHTML = `<svg viewBox="0 0 ${w} ${h}" width="100%" height="${h}" class="viz">${g}</svg>
      <p class="legend"><span class="key s1"></span>Input +10% <span class="key s3"></span>Input −10%</p>`;
    bindTips(host);
    tableView(host, ['Input', '+10%, Rp bn', '−10%, Rp bn'], items.map((i) => [i.label, nf(i.up), nf(i.down)]));
  }

  function initPowerScen() {
    const S = P.POWER_SCENARIOS;
    const rows = ['bear', 'base', 'bull'].map((k) => {
      const s = S[k];
      const mw2030 = S.base2026 * (1 + s.growth / 100) ** 4;
      const r = power({ mw: mw2030, utilisation: s.utilisation, pue: s.pue, price: s.price });
      return { k, s, mw2030, twh: r.gwh / 1000, costTn: r.costRp / 1e12, share: r.gwh / 1000 / 317.69 * 100 };
    });
    const tbl = $('[data-power-scen]', root);
    tbl.innerHTML = `<div class="table-scroll"><table class="scen-mini">
      <thead><tr><th scope="col">Scenario</th><th scope="col">IT capacity growth, a year</th><th scope="col">Utilisation</th><th scope="col">PUE</th><th scope="col">Tariff, Rp/kWh</th><th scope="col">IT capacity 2030, MW</th><th scope="col">Energy, TWh</th><th scope="col">Cost, Rp tn</th></tr></thead>
      <tbody>${rows.map((r) => `<tr><th scope="row">${r.s.label}</th><td>${r.s.growth}%</td><td>${r.s.utilisation}%</td><td>${r.s.pue.toFixed(2)}</td><td>${nf(r.s.price)}</td><td>${nf(r.mw2030)}</td><td>${r.twh.toFixed(1)}</td><td>${r.costTn.toFixed(1)}</td></tr>`).join('')}</tbody>
    </table></div><p class="muted small">${rows.map((r) => `<strong>${r.s.label}.</strong> ${esc(r.s.note)}`).join(' ')}</p>`;
    const host = $('[data-chart="powerscen"]', root);
    // Bear, base and bull keep the same colour in every chart of the report
    const slot = { bear: 3, base: 1, bull: 2 };
    responsive(host, () => hbar(host, rows.map((r) => ({ label: r.s.label, value: r.twh, display: `${r.twh.toFixed(1)} TWh · ${r.share.toFixed(1)}% of 2025 sales`, series: slot[r.k] })), { unit: 'TWh a year' }));
  }

  /* 05: the money-flow framework and capex per MW */
  function initMoney() {
    const host = $('[data-moneyflow]', root);
    if (host) {
      const flows = [
        { name: 'Compute', what: 'Accelerators, servers, storage, network gear', who: 'Global chip and server makers; owned by cloud and AI tenants', listed: 'No listed Indonesian supplier identified in this research' },
        { name: 'Data centre', what: 'Building, fit-out, security, operations', who: 'Operators and developers', listed: 'DCII; TLKM (NeutraDC); ISAT (BDx Indonesia stake); DSSA (Jakarta site under construction)' },
        { name: 'Cooling and electrical', what: 'Chillers, liquid cooling, switchgear, UPS, generators', who: 'Equipment makers and contractors', listed: 'No listed Indonesian supplier identified in this research' },
        { name: 'Power', what: 'Electricity bought every month for the life of the site', who: 'PLN, and generators selling to PLN', listed: 'PGEO, PTBA, KIJA (as generators); PLN is not listed' },
        { name: 'Grid', what: 'Connection, substations, transmission', who: 'PLN', listed: 'None' },
        { name: 'Land', what: 'Plots with power, water and fibre nearby', who: 'Industrial estates', listed: 'DMAS, KIJA' },
        { name: 'Connectivity', what: 'Fibre, cable landings, cross-connects', who: 'Telecom and tower companies', listed: 'TLKM, MTEL, ISAT, EXCL' },
      ];
      host.innerHTML = `<div class="mf-source"><p class="mf-dollar">US$1</p><p>of data-centre spending</p></div>
        <ul class="mf-list">${flows.map((f) => `<li class="mf-item"><p class="mf-name">${esc(f.name)}</p><p class="mf-what">${esc(f.what)}</p><p class="mf-who"><span>Captured by</span> ${esc(f.who)}</p><p class="mf-listed"><span>Listed in Indonesia</span> ${esc(f.listed)}</p></li>`).join('')}</ul>`;
    }
    const cm = $('[data-chart="capexmw"]', root);
    if (cm) {
      const items = P.CAPEX_PER_MW.map((p) => ({ label: p.name, value: p.usdbn * 1000 / p.mw, display: `US$${(p.usdbn * 1000 / p.mw).toFixed(1)} m`, tip: `${p.name}: US$${p.usdbn} bn for ${p.mw} MW = US$${(p.usdbn * 1000 / p.mw).toFixed(1)} m per MW` }));
      responsive(cm, () => hbar(cm, items, { unit: 'US$ m per MW' }));
      tableView(cm, ['Project', 'Announced investment, US$ bn', 'Planned MW', 'US$ m per MW'], P.CAPEX_PER_MW.map((p) => [p.name, p.usdbn.toFixed(1), nf(p.mw), (p.usdbn * 1000 / p.mw).toFixed(1)]));
    }
  }

  /* 06: exposure map and company panels */
  function initExposure() {
    const t = $('[data-exposure]', root);
    if (!t) return;
    const cols = [['business', 'Business exposure'], ['dcExposure', 'Data-centre exposure'], ['powerExposure', 'Power exposure'], ['assets', 'Relevant assets'], ['capexNote', 'Capex'], ['revenueExposure', 'Revenue exposure'], ['risks', 'Key risks']];
    t.insertAdjacentHTML('beforeend', `<thead><tr><th scope="col">Company</th>${cols.map(([, n]) => `<th scope="col">${n}</th>`).join('')}</tr></thead>
      <tbody>${P.COMPANIES.map((c) => `<tr>
        <th scope="row"><button type="button" class="co-open" data-open-co="${c.ticker}"><span class="co-ticker">${c.ticker}</span><span class="co-name">${esc(c.name)}</span><span class="co-more">Financials</span></button></th>
        ${cols.map(([k]) => `<td>${esc(c[k])}</td>`).join('')}
      </tr>`).join('')}</tbody>`);
  }

  const sheet = $('[data-company-sheet]', root);
  function openCompany(ticker) {
    const c = P.COMPANIES.find((x) => x.ticker === ticker);
    if (!c || !sheet) return;
    $('[data-cs-kicker]', sheet).textContent = `${c.ticker} · figures in ${unitLabel(c.unit)}`;
    $('[data-cs-title]', sheet).textContent = c.name;
    const rows = [
      ['Revenue', 'revenue'], ['EBITDA', 'ebitda'], ['Operating profit', 'operatingProfit'], ['Net income', 'netIncome'], ['Operating cash flow', 'cfo'], ['Capex', 'capex'],
      ['Free cash flow', 'fcf'], ['Net debt', 'netDebt'], ['Equity', 'equity'],
    ].filter(([, k]) => k !== 'operatingProfit' || c.operatingProfit);
    const val = (k, i) => {
      if (k === 'fcf') return c.cfo[i] != null && c.capex[i] != null ? c.cfo[i] - c.capex[i] : null;
      return (c[k] || [])[i];
    };
    const dec = c.unit === 'USD m' ? 1 : 0;
    const cell = (k, i) => {
      const v = val(k, i);
      if (v == null) return '<td class="na">Data unavailable</td>';
      const d = c.derived && c.derived[`${k}.${i}`];
      return `<td>${nf(v, dec)}${d ? `<span class="flag" title="${esc(d)}">Derived</span>` : ''}</td>`;
    };
    const derivedNotes = Object.entries(c.derived || {}).map(([k, v]) => { const [m, i] = k.split('.'); return `<li><strong>${esc(c.years[+i])} ${esc(m === 'netDebt' ? 'net debt' : m.toUpperCase() === 'EBITDA' ? 'EBITDA' : m)}</strong>: ${esc(v)}</li>`; });
    $('[data-cs-body]', sheet).innerHTML = `
      <p>${esc(c.business)}</p>
      <div class="table-scroll"><table class="fin">
        <caption class="sr-only">${esc(c.name)} financial history, ${esc(unitLabel(c.unit))}</caption>
        <thead><tr><th scope="col">${esc(unitLabel(c.unit))}</th>${c.years.map((y) => `<th scope="col">${y}</th>`).join('')}</tr></thead>
        <tbody>${rows.map(([n, k]) => `<tr><th scope="row">${n}</th>${c.years.map((_, i) => cell(k, i)).join('')}</tr>`).join('')}
          <tr><th scope="row">ROE</th><td class="na" colspan="${c.years.length}">Data unavailable: consistent average equity not collected</td></tr>
          <tr><th scope="row">ROIC</th><td class="na" colspan="${c.years.length}">Data unavailable: invested capital not collected</td></tr>
        </tbody>
      </table></div>
      <p class="muted small">All figures reported unless marked Derived. Sources by year: ${c.years.map((y, i) => `${y} ${cite(c.yearSources[i]) || 'n/a'}`).join('; ')}.</p>
      ${derivedNotes.length ? `<ul class="notes">${derivedNotes.join('')}</ul>` : ''}
      ${(c.notes || []).length ? `<ul class="notes">${c.notes.map((n) => `<li>${esc(n)}</li>`).join('')}</ul>` : ''}
      <div class="cs-charts">
        <figure><figcaption class="fig-cap small">Revenue, ${esc(unitLabel(c.unit))}</figcaption><div class="chart chart-xs" data-cs-chart="revenue"></div></figure>
        <figure><figcaption class="fig-cap small">EBITDA, ${esc(unitLabel(c.unit))}</figcaption><div class="chart chart-xs" data-cs-chart="ebitda"></div></figure>
        <figure><figcaption class="fig-cap small">Net income, ${esc(unitLabel(c.unit))}</figcaption><div class="chart chart-xs" data-cs-chart="netIncome"></div></figure>
      </div>
      <dl class="cs-dl">
        <div><dt>Data-centre exposure</dt><dd>${esc(c.dcExposure)}</dd></div>
        <div><dt>Power exposure</dt><dd>${esc(c.powerExposure)}</dd></div>
        <div><dt>Relevant assets</dt><dd>${esc(c.assets)}</dd></div>
        <div><dt>Capex</dt><dd>${esc(c.capexNote)}</dd></div>
        <div><dt>Key risks</dt><dd>${esc(c.risks)}</dd></div>
        <div><dt>Sources</dt><dd>${cites(c.sources)}</dd></div>
      </dl>`;
    const fmt = (v) => nf(v, c.unit === 'USD m' ? 0 : 0);
    if (typeof sheet.showModal === 'function') sheet.showModal(); else sheet.setAttribute('open', '');
    $$('[data-cs-chart]', sheet).forEach((h) => columns(h, c.years.map((y) => y.replace('FY', '')), c[h.dataset.csChart], { fmt, h: 150 }));
  }
  if (sheet) {
    sheet.addEventListener('click', (e) => {
      if (e.target.closest('[data-close]')) sheet.close();
      else if (e.target === sheet) { const r = sheet.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) sheet.close(); }
    });
    sheet.addEventListener('click', (e) => { const a = e.target.closest('a.cite'); if (a) sheet.close(); });
  }
  root.addEventListener('click', (e) => { const b = e.target.closest('[data-open-co]'); if (b) openCompany(b.dataset.openCo); });

  /* 07: financial analysis */
  const METRICS = [
    { id: 'revg', name: 'Revenue growth', fmt: (v) => pct(v), unit: '% a year', calc: (s, i) => growth(s.revenue, i) },
    { id: 'ebitdag', name: 'EBITDA growth', fmt: (v) => pct(v), unit: '% a year', calc: (s, i) => growth(s.ebitda, i) },
    { id: 'margin', name: 'EBITDA margin', fmt: (v) => `${v.toFixed(1)}%`, unit: '% of revenue', calc: (s, i) => (s.ebitda[i] != null && s.revenue[i] ? s.ebitda[i] / s.revenue[i] * 100 : null) },
    { id: 'capex', name: 'Capex', fmt: null, unit: 'reporting currency', calc: (s, i) => s.capex[i] },
    { id: 'fcf', name: 'Free cash flow', fmt: null, unit: 'reporting currency', calc: (s, i) => (s.cfo[i] != null && s.capex[i] != null ? s.cfo[i] - s.capex[i] : null) },
    { id: 'netdebt', name: 'Net debt', fmt: null, unit: 'reporting currency', calc: (s, i) => s.netDebt[i] },
  ];
  const growth = (arr, i) => (i > 0 && arr[i] != null && arr[i - 1] ? (arr[i] / arr[i - 1] - 1) * 100 : null);
  function series5(c) {
    // FY2021..FY2025; prior holds FY2021 and FY2022 where verified
    const pr = c.prior || {};
    const pick = (k) => [...(pr[k] || [null, null]), ...(c[k] || [null, null, null])];
    return { years: ['FY2021', 'FY2022', ...c.years], revenue: pick('revenue'), ebitda: pick('ebitda'), netIncome: pick('netIncome'), capex: pick('capex'), cfo: pick('cfo'), netDebt: pick('netDebt'), equity: pick('equity') };
  }
  function initFinancials() {
    const grid = $('[data-fin-grid]', root);
    if (!grid) return;
    const mBox = $('[data-fin-metric]', root);
    const pBox = $('[data-fin-period]', root);
    const note = $('[data-fin-note]', root);
    let metric = METRICS[0]; let period = 3;
    mBox.innerHTML = METRICS.map((m, i) => `<button type="button" class="filter" data-metric="${m.id}" aria-pressed="${i === 0}">${m.name}</button>`).join('');
    const draw = () => {
      let shown = 0;
      grid.innerHTML = P.COMPANIES.map((c) => `<figure class="fin-card"><figcaption><span class="co-ticker">${c.ticker}</span> <span class="muted">${esc(metric.fmt ? metric.unit : unitLabel(c.unit))}</span></figcaption><div class="chart chart-xs" data-fin-co="${c.ticker}"></div></figure>`).join('');
      P.COMPANIES.forEach((c) => {
        const s = series5(c);
        const from = period === 5 ? 0 : 2;
        const years = s.years.slice(from);
        const vals = years.map((_, j) => metric.calc(s, j + from));
        if (vals.some((v) => v != null)) shown++;
        const fmt = metric.fmt || ((v) => nf(v, c.unit === 'USD m' ? 0 : 0));
        const host = $(`[data-fin-co="${c.ticker}"]`, grid);
        responsive(host, () => columns(host, years.map((y) => y.replace('FY', '')), vals, { fmt, h: 150, tipPrefix: `${c.ticker} ` }));
      });
      note.textContent = `${shown} of ${P.COMPANIES.length} companies have data for this measure${period === 5 ? ' over five years' : ''}.`;
    };
    mBox.addEventListener('click', (e) => {
      const b = e.target.closest('[data-metric]'); if (!b) return;
      metric = METRICS.find((m) => m.id === b.dataset.metric);
      $$('[data-metric]', mBox).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      draw();
    });
    pBox.addEventListener('click', (e) => {
      const b = e.target.closest('[data-period]'); if (!b) return;
      period = Number(b.dataset.period);
      $$('[data-period]', pBox).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      draw();
    });
    draw();
  }

  /* 08: valuation table */
  function initValuation() {
    const t = $('[data-valuation]', root);
    if (!t) return;
    const last = (arr) => (arr ? arr[arr.length - 1] : null);
    t.insertAdjacentHTML('beforeend', `<thead><tr>
      <th scope="col">Company</th><th scope="col">Method</th><th scope="col">Price, Rp</th><th scope="col">Shares</th><th scope="col">Market value</th><th scope="col">P/E</th><th scope="col">P/B</th><th scope="col">EV/EBITDA</th><th scope="col">EV/Revenue</th>
    </tr></thead><tbody>${P.COMPANIES.map((c) => {
      const usd = c.unit === 'USD m';
      return `<tr data-val-row="${c.ticker}">
        <th scope="row"><span class="co-ticker">${c.ticker}</span></th>
        <td><span class="methods">${c.methods.map(esc).join(', ')}</span><span class="muted small block">${esc(c.methodNote)}</span></td>
        <td>${!c.shares ? '<span class="na">Share count not verified</span>' : `<input class="input input-sm" type="number" inputmode="numeric" min="1" step="1" aria-label="Price for ${c.ticker}, rupiah" data-price="${c.ticker}" value="${c.price || ''}" placeholder="Enter">${c.price ? `<span class="flag" title="${esc(c.priceNote)}">24 Sep 2026</span> ${cite(c.priceSource)}` : ''}${usd ? `<span class="muted small block">Converted at Rp${nf(P.DEFAULTS.fx)}/US$ ${cite(P.DEFAULTS.fxSource)}</span>` : ''}`}</td>
        <td>${c.shares ? `${(c.shares / 1e9).toFixed(2)} bn ${cite(c.sharesSource)}` : '<span class="na">Data unavailable</span>'}</td>
        <td data-v="mcap"></td><td data-v="pe"></td><td data-v="pb"></td><td data-v="evebitda"></td><td data-v="evrev"></td>
      </tr>`;
    }).join('')}</tbody>`);
    const compute = (c) => {
      const row = $(`[data-val-row="${c.ticker}"]`, t);
      const input = $('[data-price]', row);
      const price = input ? Number(input.value) : null;
      const set = (k, v) => { $(`[data-v="${k}"]`, row).innerHTML = v; };
      if (!input || !price || price <= 0) {
        ['mcap', 'pe', 'pb', 'evebitda', 'evrev'].forEach((k) => set(k, '<span class="na">Needs a price</span>'));
        if (!input) ['mcap', 'pe', 'pb', 'evebitda', 'evrev'].forEach((k) => set(k, '<span class="na">n/a</span>'));
        return;
      }
      const usd = c.unit === 'USD m';
      const mcapRp = price * c.shares / 1e9; // Rp bn
      // US$ reporters: convert market value to US$ m so it matches their accounts
      const mcap = usd ? mcapRp * 1000 / P.DEFAULTS.fx : mcapRp;
      const ni = last(c.netIncome); const eq = last(c.equity); const eb = last(c.ebitda); const rev = last(c.revenue); const nd = last(c.netDebt);
      const x = (v) => `${v >= 100 ? nf(v, 0) : v.toFixed(1)}x`;
      set('mcap', usd ? `Rp${nf(mcapRp / 1000, 1)} tn<span class="muted small block">US$${nf(mcap / 1000, 2)} bn</span>` : `Rp${nf(mcap / 1000, 1)} tn`);
      set('pe', ni > 0 ? x(mcap / ni) : `<span class="na">${ni < 0 ? 'Loss year' : 'n/a'}</span>`);
      set('pb', eq ? x(mcap / eq) : '<span class="na">Equity n/a</span>');
      if (nd != null) { const ev = mcap + nd; set('evebitda', eb ? x(ev / eb) : '<span class="na">EBITDA not reported</span>'); set('evrev', x(ev / rev)); } else {
        set('evebitda', '<span class="na">Net debt n/a</span>');
        set('evrev', `<span class="na">Net debt n/a</span>`);
      }
    };
    P.COMPANIES.forEach(compute);
    t.addEventListener('input', (e) => { const i = e.target.closest('[data-price]'); if (i) compute(P.COMPANIES.find((c) => c.ticker === i.dataset.price)); });
  }

  /* 08: valuation history, year-end multiples from year-end prices and reported figures */
  function initValHistory() {
    const grid = $('[data-vh-grid]', root);
    if (!grid) return;
    const mBox = $('[data-vh-metric]', root);
    const note = $('[data-vh-note]', root);
    const VM = [
      { id: 'pe', name: 'P/E', calc: (mc, s, i) => (s.netIncome[i] > 0 ? mc / s.netIncome[i] : null) },
      { id: 'pb', name: 'P/B', calc: (mc, s, i) => (s.equity[i] > 0 ? mc / s.equity[i] : null) },
      { id: 'ev', name: 'EV/EBITDA', calc: (mc, s, i) => (s.netDebt[i] != null && s.ebitda[i] > 0 ? (mc + s.netDebt[i]) / s.ebitda[i] : null) },
    ];
    let metric = VM[0];
    const cos = P.COMPANIES.filter((c) => c.priceHistory);
    const fxEnd = P.DEFAULTS.fxYearEnd || {};
    const sharesAt = (c, y) => (c.sharesHistory && c.sharesHistory[y] != null ? c.sharesHistory[y] : (c.sharesConstant ? c.shares : null));
    mBox.innerHTML = VM.map((m, i) => `<button type="button" class="filter" data-vh="${m.id}" aria-pressed="${i === 0}">${m.name}</button>`).join('');
    const draw = () => {
      let shown = 0;
      grid.innerHTML = cos.map((c) => `<figure class="fin-card"><figcaption><span class="co-ticker">${c.ticker}</span> <span class="muted">${metric.name}, times</span></figcaption><div class="chart chart-xs" data-vh-co="${c.ticker}"></div></figure>`).join('');
      cos.forEach((c) => {
        const s = series5(c);
        const vals = s.years.map((y, i) => {
          const px = c.priceHistory[y]; const sh = sharesAt(c, y);
          if (!px || !sh) return null;
          // US$ reporters: convert the year-end market value at that year's closing rate
          if (c.unit === 'USD m') return fxEnd[y] ? metric.calc(px * sh / 1e9 * 1000 / fxEnd[y], s, i) : null;
          return metric.calc(px * sh / 1e9, s, i);
        });
        if (vals.some((v) => v != null)) shown++;
        const host = $(`[data-vh-co="${c.ticker}"]`, grid);
        responsive(host, () => columns(host, s.years.map((y) => y.replace('FY', '')), vals, { fmt: (v) => `${v >= 100 ? nf(v, 0) : v.toFixed(v > 0 && v < 1 ? 2 : 1)}x`, h: 150, tipPrefix: `${c.ticker} ${metric.name} ` }));
      });
      note.textContent = `${shown} of ${cos.length} companies have the inputs for ${metric.name} in at least one year. Years without them are left blank${metric.id === 'pe' ? '; a loss year has no P/E' : ''}.`;
    };
    mBox.addEventListener('click', (e) => {
      const b = e.target.closest('[data-vh]'); if (!b) return;
      metric = VM.find((m) => m.id === b.dataset.vh);
      $$('[data-vh]', mBox).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      draw();
    });
    draw();
  }

  /* The DCF engine, shared with the scenarios and the Monte Carlo module */
  const TAX = 0.22;
  function dcf(base, a) {
    const w = a.wacc / 100; const g = a.tg / 100;
    const margin = a.margin - (base.powerShare || 0) * (a.power || 0) / 100;
    let pv = 0; const flows = [];
    let rev = base.revenue;
    for (let t = 1; t <= 5; t++) {
      rev = base.revenue * (1 + a.growth / 100) ** t * (a.util / 100);
      const ebitda = rev * margin / 100;
      const capex = rev * a.capex / 100;
      const fcf = (ebitda - capex) * (1 - TAX);
      flows.push({ t, rev, ebitda, capex, fcf });
      pv += fcf / (1 + w) ** t;
    }
    const last = flows[flows.length - 1];
    const tv = w > g ? last.fcf * (1 + g) / (w - g) : NaN;
    const pvTv = tv / (1 + w) ** 5;
    const ev = pv + pvTv;
    return { flows, pv, tv, pvTv, ev, margin, rev2030: last.rev, ebitda2030: last.ebitda, fcf2030: last.fcf };
  }
  window.PBAI_MODEL = { dcf, esc, nf, niceTicks, roundedCol, bindTips, tableView, responsive, cite };

  const DCF_FIELDS = [
    { k: 'growth', label: 'Revenue growth', unit: '% a year', min: -10, max: 80, step: 0.5 },
    { k: 'margin', label: 'EBITDA margin', unit: '%', min: 10, max: 95, step: 0.5 },
    { k: 'wacc', label: 'WACC', unit: '%', min: 5, max: 20, step: 0.25 },
    { k: 'tg', label: 'Terminal growth', unit: '%', min: 0, max: 7, step: 0.25 },
    { k: 'capex', label: 'Capex', unit: '% of revenue', min: 0, max: 90, step: 1 },
    { k: 'util', label: 'Utilisation index', unit: '(100 = base)', min: 50, max: 130, step: 1 },
    { k: 'power', label: 'Power-cost change', unit: '%', min: -30, max: 50, step: 1 },
  ];
  function initDcf() {
    const box = $('[data-dcf]', root);
    if (!box) return;
    const coBox = $('[data-dcf-company]', box); const scBox = $('[data-dcf-scen]', box);
    const form = $('[data-dcf-form]', box); const out = $('[data-dcf-results]', box); const chart = $('[data-chart="dcf"]', box);
    const tickers = Object.keys(P.DCF);
    let co = tickers[0];
    coBox.innerHTML = tickers.map((t, i) => `<button type="button" class="filter" data-co="${t}" aria-pressed="${i === 0}">${t}</button>`).join('');
    form.innerHTML = DCF_FIELDS.map((f) => `<div class="calc-field"><label for="d-${f.k}">${f.label} <output data-dout="${f.k}"></output></label>
      <input type="range" id="d-${f.k}" name="${f.k}" min="${f.min}" max="${f.max}" step="${f.step}"></div>`).join('') + `
      <div class="calc-field"><label for="d-nd">Net debt, <span data-nd-unit></span></label><input class="input" type="number" id="d-nd" name="netDebt" step="1" inputmode="decimal"><p class="calc-hint" data-nd-hint></p></div>`;
    const load = (scen) => {
      const s = P.DCF[co][scen];
      DCF_FIELDS.forEach((f) => { form.elements[f.k].value = s[f.k]; });
      $$('[data-scen]', scBox).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.scen === scen)));
    };
    const setCo = (t) => {
      co = t;
      $$('[data-co]', coBox).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.co === t)));
      const b = P.DCF[co].base;
      $('[data-nd-unit]', form).textContent = unitLabel(b.unit);
      form.elements.netDebt.value = b.netDebt != null ? b.netDebt : '';
      $('[data-nd-hint]', form).textContent = b.netDebt != null ? 'Borrowings, bonds and leases less cash at 31 December 2025, from the audited statements.' : 'Not verified in the sources reviewed. Left blank, the model shows enterprise value only.';
      load('mid');
      update();
    };
    const update = () => {
      const b = P.DCF[co].base;
      const a = {}; DCF_FIELDS.forEach((f) => { a[f.k] = Number(form.elements[f.k].value); $(`[data-dout="${f.k}"]`, form).textContent = `${a[f.k]}${f.k === 'util' ? '' : '%'}`; });
      const r = dcf(b, a);
      const ndRaw = form.elements.netDebt.value; const nd = ndRaw === '' ? null : Number(ndRaw);
      const eq = nd == null ? null : r.ev - nd;
      const c = P.COMPANIES.find((x) => x.ticker === co);
      const shares = b.shares;
      const perShare = eq != null && shares && b.unit === 'IDR bn' ? eq * 1e9 / shares : null;
      const u = b.unit;
      let implied = '';
      if (c && c.price && shares && b.unit === 'IDR bn') {
        const target = c.price * shares / 1e9 + (nd || 0);
        const g = solveGrowth(b, a, target);
        implied = `<div><dt>Growth the market price implies</dt><dd>${g == null ? 'beyond 150% a year' : `${g.toFixed(1)}<span>% a year for five years, other inputs held</span>`}</dd></div>`;
      }
      out.innerHTML = `
        <div><dt>Enterprise value</dt><dd>${money(r.ev, u)}</dd></div>
        <div><dt>Equity value</dt><dd>${eq == null ? '<span class="na small">Needs net debt</span>' : money(eq, u)}</dd></div>
        <div><dt>Implied value per share</dt><dd>${perShare == null ? `<span class="na small">${shares ? 'Needs net debt' : 'Share count not verified'}</span>` : `Rp${nf(perShare)}`}</dd></div>
        <div><dt>Terminal value share of EV</dt><dd>${Number.isFinite(r.pvTv / r.ev) ? `${(r.pvTv / r.ev * 100).toFixed(0)}%` : 'n/a'}</dd></div>
        ${implied}`;
      responsive(chart, () => columns(chart, r.flows.map((f) => `Y${f.t}`), r.flows.map((f) => f.fcf), { fmt: (v) => nf(v, u === 'USD m' ? 0 : 0), h: 160, unit: `Free cash flow, ${unitLabel(u)}` }));
    };
    coBox.addEventListener('click', (e) => { const b = e.target.closest('[data-co]'); if (b) setCo(b.dataset.co); });
    scBox.addEventListener('click', (e) => { const b = e.target.closest('[data-scen]'); if (b) { load(b.dataset.scen); update(); } });
    form.addEventListener('input', () => { $$('[data-scen]', scBox).forEach((b) => b.setAttribute('aria-pressed', 'false')); update(); });
    setCo(co);
  }
  function solveGrowth(base, a, targetEv) {
    let lo = -20; let hi = 150;
    const f = (g) => dcf(base, { ...a, growth: g }).ev - targetEv;
    if (f(hi) < 0) return null;
    if (f(lo) > 0) return lo;
    for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (f(m) > 0) hi = m; else lo = m; }
    return (lo + hi) / 2;
  }

  /* 09: scenario table and chart */
  function initScenarios() {
    const t = $('[data-scen-table]', root);
    if (!t) return;
    const names = { bear: 'Bear', mid: 'Base', bull: 'Bull' };
    const rows = [];
    Object.entries(P.DCF).forEach(([tk, d]) => ['bear', 'mid', 'bull'].forEach((k) => {
      const a = d[k]; const r = dcf(d.base, a);
      rows.push({ tk, k, a, r, u: d.base.unit, base: d.base });
    }));
    t.insertAdjacentHTML('beforeend', `<thead><tr><th scope="col">Company</th><th scope="col">Scenario</th><th scope="col">Growth</th><th scope="col">Utilisation index</th><th scope="col">Power cost</th><th scope="col">Capex, % rev.</th><th scope="col">EBITDA margin</th><th scope="col">WACC</th><th scope="col">Revenue 2030</th><th scope="col">EBITDA 2030</th><th scope="col">FCF 2030</th><th scope="col">Model EV</th></tr></thead>
      <tbody>${rows.map((x) => `<tr><th scope="row">${x.tk}</th><td>${names[x.k]}</td><td>${x.a.growth}%</td><td>${x.a.util}</td><td>${pct(x.a.power, 0)}</td><td>${x.a.capex}%</td><td>${x.r.margin.toFixed(1)}%</td><td>${x.a.wacc}%</td>
        <td>${money(x.r.rev2030, x.u)}</td><td>${money(x.r.ebitda2030, x.u)}</td><td>${money(x.r.fcf2030, x.u)}</td><td>${money(x.r.ev, x.u)}</td></tr>`).join('')}</tbody>`);
    const host = $('[data-chart="scen"]', root);
    const items = [];
    Object.keys(P.DCF).forEach((tk) => {
      const set = rows.filter((x) => x.tk === tk);
      const mid = set.find((x) => x.k === 'mid').r.ev;
      set.forEach((x) => items.push({ label: `${tk} ${names[x.k]}`, value: x.r.ev / mid * 100, display: (x.r.ev / mid * 100).toFixed(0), series: x.k === 'bear' ? 3 : x.k === 'mid' ? 1 : 2, tip: `${tk}, ${names[x.k]}: model EV ${money(x.r.ev, x.u)} (index ${(x.r.ev / mid * 100).toFixed(0)})` }));
    });
    responsive(host, () => {
      hbar(host, items, { unit: 'Index, base = 100', height: 26 });
      host.insertAdjacentHTML('beforeend', '<p class="legend"><span class="key s3"></span>Bear <span class="key s1"></span>Base <span class="key s2"></span>Bull</p>');
    });
  }

  /* 10: Monte Carlo, loaded on approach */
  function initMonteCarlo() {
    const box = $('[data-mc]', root);
    if (!box) return;
    let loaded = false;
    const load = () => {
      if (loaded) return; loaded = true;
      const s = document.createElement('script');
      s.src = `assets/js/pbai/montecarlo.js?v=${window.PBAI_VERSION || ''}`;
      s.onload = () => { if (window.PBAI_MC) window.PBAI_MC(box); };
      s.onerror = () => { box.innerHTML = '<p class="na">The simulation could not be loaded.</p>'; };
      document.body.appendChild(s);
    };
    if (!('IntersectionObserver' in window)) { load(); return; }
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { io.disconnect(); load(); } }, { rootMargin: '600px 0px' });
    io.observe(box);
    // Fallback: load anyway once the page is idle, so a fast jump never leaves the section empty
    setTimeout(load, 4000);
  }

  /* 11: risk map */
  function initRisks() {
    const t = $('[data-riskmap]', root);
    if (!t) return;
    const detail = $('[data-risk-detail]', root);
    t.innerHTML = `<caption class="sr-only">Risks by chain link. A mark means the risk acts on that link.</caption>
      <thead><tr><th scope="col">Risk</th>${P.CHAIN.map((c) => `<th scope="col">${esc(c.name)}</th>`).join('')}</tr></thead>
      <tbody>${P.RISKS.map((r, i) => `<tr><th scope="row"><button type="button" class="risk-open" data-risk="${r.id}" aria-pressed="${i === 0}">${esc(r.name)}</button></th>
        ${P.CHAIN.map((c) => `<td>${r.layers.includes(c.id) ? `<span class="rm-dot" role="img" aria-label="${esc(r.name)} acts on ${esc(c.name)}"></span>` : '<span class="sr-only">No</span>'}</td>`).join('')}</tr>`).join('')}</tbody>`;
    const show = (id) => {
      const r = P.RISKS.find((x) => x.id === id);
      $$('[data-risk]', t).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.risk === id)));
      detail.innerHTML = `<h3 class="chain-title">${esc(r.name)}</h3><p>${esc(r.description)}</p>
        <dl class="chain-dl">
          <div><dt>Evidence</dt><dd>${esc(r.evidence)} ${cites(r.sources)}</dd></div>
          <div><dt>Mechanism</dt><dd>${esc(r.mechanism)}</dd></div>
          <div><dt>What to monitor</dt><dd>${esc(r.monitor)}</dd></div>
        </dl>`;
    };
    t.addEventListener('click', (e) => { const b = e.target.closest('[data-risk]'); if (b) show(b.dataset.risk); });
    show(P.RISKS[0].id);
  }

  /* 12: what to watch */
  function initWatch() {
    const host = $('[data-watch]', root);
    if (!host) return;
    host.innerHTML = P.WATCH.map((w) => `<article class="watch-card">
      <h3 class="watch-name">${esc(w.name)}</h3>
      <p class="watch-latest"><span class="watch-k">Latest</span> ${esc(w.latest)} ${cites(w.sources)}</p>
      <dl>
        <div><dt>Why it matters</dt><dd>${esc(w.why)}</dd></div>
        <div><dt>Frequency</dt><dd>${esc(w.frequency)}</dd></div>
        <div><dt>Source</dt><dd>${esc(w.source)}</dd></div>
      </dl>
    </article>`).join('');
  }

  /* In-page links land below the sticky header */
  root.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || a.hash.length < 2) return;
    const target = document.getElementById(decodeURIComponent(a.hash.slice(1)));
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'start' });
    history.replaceState(history.state, '', a.hash);
    if (target.matches('li, section')) { target.setAttribute('tabindex', '-1'); target.focus({ preventScroll: true }); }
  });

  initCites();
  initToc();
  initChain();
  initMarket();
  initCalc();
  initPowerScen();
  initMoney();
  initExposure();
  initFinancials();
  initValuation();
  initValHistory();
  initDcf();
  initScenarios();
  initMonteCarlo();
  initRisks();
  initWatch();
  initCites(); // links added by the components above
})();
