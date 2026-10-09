(function () {
  'use strict';
  const root = document.querySelector('[data-pbai-update]');
  if (!root) return;
  const M = window.PBAIUpdateMath;
  const $ = (selector) => root.querySelector(selector);
  const esc = (value) => String(value).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
  const num = (value, digits = 0) => Number(value).toLocaleString('en-US', {
    minimumFractionDigits: digits, maximumFractionDigits: digits
  });
  const pct = (value) => `${value >= 0 ? '+' : ''}${num(value, 2)}%`;
  const date = (value) => new Date(`${value}T00:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC'
  });
  const change = (stock) => M.priceChange(stock.observations[0].close, stock.observations.at(-1).close);

  function render(data) {
    const sources = new Map(data.sources.map((source) => [source.id, source]));
    const cite = (id) => `<a class="cite" href="#src-${esc(id)}">${esc(sources.get(id).publisher)}</a>`;
    const ranked = data.stocks.slice().sort((a, b) => change(b) - change(a));
    const declines = data.stocks.filter((stock) => change(stock) < 0).length;
    $('[data-market-summary]').textContent = `${declines} of ${data.stocks.length} names closed below their ${date(data.baselineDate)} prices. ${ranked[0].ticker} had the largest gain (${pct(change(ranked[0]))}); ${ranked.at(-1).ticker} had the largest decline (${pct(change(ranked.at(-1)))}). These movements alone do not show that AI project news caused the repricing.`;
    $('[data-fx]').textContent = `Rp${num(data.fx.idrPerUsd)} per US$1`;
    $('[data-fx-date]').textContent = `BI JISDOR, ${date(data.fx.date)}`;
    const table = $('[data-stock-rows]');
    function drawTable() {
      const stocks = $('[data-price-sort]').value === 'return' ? ranked : data.stocks;
      table.innerHTML = stocks.map((stock) => `<tr><th scope="row">${esc(stock.ticker)}</th><td>${esc(stock.exposure)}</td><td>${num(stock.observations[0].close)}</td><td>${num(stock.observations.at(-1).close)}</td><td>${pct(change(stock))}</td></tr>`).join('');
    }
    drawTable();
    $('[data-price-sort]').addEventListener('change', drawTable);
    const select = $('[data-stock-select]');
    select.innerHTML = data.stocks.map((stock) => `<option value="${esc(stock.ticker)}">${esc(stock.ticker)} · ${esc(stock.name)}</option>`).join('');
    function drawHistory() {
      const stock = data.stocks.find((item) => item.ticker === select.value);
      const observations = stock.observations;
      const base = observations[0].close;
      const values = observations.map((item) => item.close / base * 100);
      const lo = Math.floor(Math.min(...values, 100) - 1);
      const hi = Math.ceil(Math.max(...values, 100) + 1);
      const x = (i) => 60 + i / (values.length - 1) * 610;
      const y = (v) => 235 - (v - lo) / (hi - lo) * 195;
      const points = values.map((v, i) => `${x(i)},${y(v)}`).join(' ');
      const title = `${stock.ticker}: price index, ${date(data.baselineDate)} = 100`;
      $('[data-history-caption]').textContent = `${stock.ticker}: Rp${num(base)} to Rp${num(observations.at(-1).close)} (${pct(change(stock))}). Price index: ${date(data.baselineDate)} = 100.`;
      $('[data-price-chart]').innerHTML = `<svg viewBox="0 0 720 285" role="img" aria-label="${esc(title)}"><line x1="60" x2="670" y1="${y(100)}" y2="${y(100)}" class="update-baseline"/><text x="48" y="${y(100) + 4}" text-anchor="end">100</text><text x="48" y="44" text-anchor="end">${hi}</text><text x="48" y="239" text-anchor="end">${lo}</text><polyline points="${points}" class="update-price-line"/>${values.map((v, i) => `<circle cx="${x(i)}" cy="${y(v)}" r="3" class="update-price-dot"><title>${date(observations[i].date)}: Rp${num(observations[i].close)}; index ${num(v, 2)}</title></circle>`).join('')}<text x="60" y="270">24 Sep</text><text x="670" y="270" text-anchor="end">8 Oct 2026</text></svg>`;
      $('[data-history-rows]').innerHTML = observations.map((item) => `<tr><th scope="row">${date(item.date)}</th><td>${num(item.close)}</td><td>${num(item.close / base * 100, 2)}</td></tr>`).join('');
    }
    drawHistory();
    select.addEventListener('change', drawHistory);
    const scale = Math.max(...data.markets.map((market) => market.pipelineMW));
    $('[data-pipeline]').innerHTML = data.markets.map((market) => {
      const planned = M.plannedCapacity(market);
      return `<div class="update-pipeline-row"><p><strong>${esc(market.period)}</strong> · ${num(market.pipelineMW)} MW development pipeline</p><div class="update-pipeline-track" aria-hidden="true"><span class="update-construction" style="width:${market.constructionMW / scale * 100}%"></span><span class="update-planned" style="width:${planned / scale * 100}%"></span></div><p class="viz-note">${num(market.constructionMW)} MW under construction · ${num(planned)} MW planned${market.plannedMW === null ? ' (calculated remainder)' : ''} · ${cite(market.source)}</p></div>`;
    }).join('');
    $('[data-capacity-rows]').innerHTML = data.markets.map((market) => `<tr><th scope="row">${esc(market.period)}</th><td>${market.operationalMW === null ? 'Not supplied' : num(market.operationalMW)}</td><td>${num(market.constructionMW)}</td><td>${num(M.plannedCapacity(market))}${market.plannedMW === null ? ' (derived)' : ''}</td><td>${num(market.pipelineMW)}</td></tr>`).join('');
    const previous = data.markets[0], latest = data.markets.at(-1);
    $('[data-capacity-summary]').textContent = `The development pipeline rose by ${num(latest.pipelineMW - previous.pipelineMW)} MW (${num(M.priceChange(previous.pipelineMW, latest.pipelineMW), 1)}%) between these source periods. Under-construction capacity rose by ${num(latest.constructionMW - previous.constructionMW)} MW. This is a comparison of market snapshots, not proof that specific sites advanced through each stage.`;
    $('[data-projects]').innerHTML = data.projects.map((project) => {
      const source = sources.get(project.source);
      return `<article class="update-project"><p class="kicker">${esc(project.location)}</p><h3>${esc(project.name)}</h3><p class="update-project-capacity">${num(project.capacityMW)} <span>MW</span></p><p class="viz-note">${esc(project.capacityBasis)}</p><p><span class="tag tag-announced">${esc(project.stage)}</span></p><dl class="chain-dl"><div><dt>Published target</dt><dd>${esc(project.target)}</dd></div><div><dt>Next evidence</dt><dd>${esc(project.checkpoint)}</dd></div></dl><p class="viz-note">Announcement: ${date(source.date)} · ${cite(project.source)}</p></article>`;
    }).join('');
    $('[data-update-sources]').innerHTML = data.sources.map((source) => `<li id="src-${esc(source.id)}"><a href="${esc(source.url)}" target="_blank" rel="noopener">${esc(source.publisher)}: ${esc(source.title)}</a><p>${date(source.date)}. ${esc(source.locator)} ${esc(source.note)}</p></li>`).join('');
    $('[data-load-status]').hidden = true;
    $('[data-loaded]').hidden = false;
    root.querySelectorAll('[data-update-control]').forEach((control) => { control.disabled = false; });
  }
  fetch('updates/power-behind-ai-2026-10-09.json').then((response) => {
    if (!response.ok) throw new Error('Update data unavailable');
    return response.json();
  }).then(render).catch(() => {
    $('[data-load-status]').textContent = 'The dated data could not be loaded. Reload this page or open the source data linked below.';
  });
})();
