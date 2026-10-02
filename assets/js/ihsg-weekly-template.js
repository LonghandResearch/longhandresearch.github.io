/* Shared renderer for data-only IHSG weekly editions. Never supplies market facts. */
(async function () {
  'use strict';
  const main = document.getElementById('main');
  const week = new URLSearchParams(location.search).get('week');
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const number = (value, places = 2) => Number(value).toLocaleString('en-US', { minimumFractionDigits: places, maximumFractionDigits: places });
  const signed = (value, places = 2) => `${value < 0 ? '−' : value > 0 ? '+' : ''}${number(Math.abs(value), places)}`;
  const percent = value => `${signed(value)}%`;
  const positive = value => Number.isFinite(value) && value > 0;
  const finite = value => typeof value === 'number' && Number.isFinite(value);
  const date = value => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
  const requireField = (condition, message) => { if (!condition) throw new Error(message); };
  const table = (headers, rows, caption = '') => `<div class="market-table-wrap" role="region" aria-label="${esc(caption || headers.join(' and '))} table, scroll horizontally" tabindex="0"><table class="market-table">${caption ? `<caption>${esc(caption)}</caption>` : ''}<thead><tr>${headers.map(h => `<th scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${row.map((cell, i) => i === 0 ? `<th scope="row">${esc(cell)}</th>` : `<td>${esc(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;

  function validate(data) {
    requireField(data && data.schemaVersion === 1, 'Unsupported weekly data version.');
    requireField(data.weekEnding === week && date(data.weekEnding), 'The report week does not match its data file.');
    requireField(date(data.published) && typeof data.period === 'string' && typeof data.title === 'string' && typeof data.deck === 'string', 'Report metadata is incomplete.');
    requireField(!data.canonical || (/^[\w./-]+\.html$/.test(data.canonical) && !data.canonical.split('/').includes('..')), 'The canonical report address is invalid.');
    requireField(Array.isArray(data.stats) && data.stats.length === 4 && data.stats.every(s => s.label && s.value && s.note), 'Four summary statistics are required.');
    requireField(data.sources && typeof data.sources === 'object' && Object.values(data.sources).every(s => s.label && /^https:\/\//.test(s.url)), 'Source links are incomplete.');
    requireField(Array.isArray(data.sections) && data.sections.length > 0, 'Report sections are missing.');
    const sectionIds = new Set();
    for (const section of data.sections) {
      requireField(/^[a-z][a-z0-9-]*$/.test(section.id) && !sectionIds.has(section.id) && section.title && Array.isArray(section.blocks), 'A section is incomplete or has a repeated id.');
      sectionIds.add(section.id);
      for (const block of section.blocks) {
        requireField(['paragraph', 'heading', 'callout', 'closes', 'flows', 'sectors', 'stocks', 'fxLab', 'table'].includes(block.type), `Unknown block type: ${block.type}`);
        if (block.sources) requireField(Array.isArray(block.sources) && block.sources.every(key => data.sources[key]), `Unknown source in ${section.id}.`);
      }
    }
    const observed = data.observations || {};
    const need = new Set(data.sections.flatMap(s => s.blocks.map(b => b.type)));
    if (need.has('closes') || need.has('fxLab')) requireField(Array.isArray(observed.closes) && observed.closes.length >= 2 && observed.closes.every(r => date(r.date) && positive(r.close)), 'Closing observations are incomplete.');
    if (need.has('flows')) requireField(Array.isArray(observed.foreignFlow) && observed.foreignFlow.length > 0 && observed.foreignFlow.every(r => date(r.date) && finite(r.netBn)), 'Foreign-flow observations are incomplete.');
    if (need.has('sectors')) requireField(Array.isArray(observed.sectors) && observed.sectors.length > 0 && observed.sectors.every(r => r.name && finite(r.weekly)), 'Sector observations are incomplete.');
    if (need.has('stocks')) requireField(Array.isArray(observed.stocks) && observed.stocks.length > 0 && observed.stocks.every(r => r.ticker && finite(r.points)), 'Stock-contribution observations are incomplete.');
    if (need.has('fxLab')) requireField(Array.isArray(observed.jisdor) && observed.jisdor.length >= 2 && observed.jisdor.every(r => date(r.date) && positive(r.rate)), 'JISDOR observations are incomplete.');
  }

  function citations(data, keys) {
    if (!keys || !keys.length) return '';
    return `<span class="market-citations">${keys.map(key => `<a href="${esc(data.sources[key].url)}" target="_blank" rel="noopener">${esc(data.sources[key].label)}</a>`).join(' · ')}</span>`;
  }

  function figure(data, block, body) {
    return `<figure class="research-figure"><figcaption><span class="figure-label">${esc(block.label || 'DATA')}</span><h3>${esc(block.title || '')}</h3></figcaption>${body}${block.note ? `<p class="figure-note">${esc(block.note)}</p>` : ''}${citations(data, block.sources)}</figure>`;
  }

  function closingFigure(data, block) {
    const rows = data.observations.closes;
    const values = rows.map(r => r.close);
    const low = Math.floor((Math.min(...values) - 20) / 50) * 50;
    const high = Math.ceil((Math.max(...values) + 20) / 50) * 50;
    const x = i => 60 + i * 630 / Math.max(1, rows.length - 1);
    const y = value => 225 - (value - low) / (high - low) * 180;
    const points = rows.map((r, i) => `${x(i)},${y(r.close)}`).join(' ');
    const ticks = [low, (low + high) / 2, high];
    const svg = `<div class="chart-scroll"><svg viewBox="0 0 750 265" role="img" aria-labelledby="weekly-close-title weekly-close-desc"><title id="weekly-close-title">${esc(block.title || 'IHSG closes')}</title><desc id="weekly-close-desc">Closing observations from ${esc(rows[0].date)} to ${esc(rows.at(-1).date)}. Vertical scale is truncated to ${number(low, 0)}-${number(high, 0)}. Exact values follow in a table.</desc>${ticks.map(v => `<line class="chart-rule" x1="60" x2="690" y1="${y(v)}" y2="${y(v)}"/><text class="chart-axis" x="49" y="${y(v) + 4}" text-anchor="end">${number(v, 0)}</text>`).join('')}<line class="chart-baseline" x1="60" x2="690" y1="${y(rows[0].close)}" y2="${y(rows[0].close)}"/><polyline class="index-line" points="${points}"/>${rows.map((r, i) => `<circle class="index-point" cx="${x(i)}" cy="${y(r.close)}" r="4.5"/><text class="chart-axis" x="${x(i)}" y="255" text-anchor="middle">${esc(r.label || r.date.slice(5))}</text>`).join('')}</svg></div>`;
    const math = window.IHSGWeeklyMath;
    const body = svg + table(['Date', 'IHSG close', 'Session return'], rows.map((r, i) => [r.date, number(r.close, 3), i ? percent(math.change(r.close, rows[i - 1].close)) : 'Baseline'])) + `<p class="figure-note">Week: (${number(rows.at(-1).close, 3)} ÷ ${number(rows[0].close, 3)} − 1) × 100 = ${percent(math.change(rows.at(-1).close, rows[0].close))}. The vertical scale is truncated; the line is not an intraday range.</p>`;
    return figure(data, block, body);
  }

  function barFigure(data, block, kind) {
    const observations = data.observations;
    const rows = kind === 'flows' ? observations.foreignFlow : kind === 'sectors' ? observations.sectors : observations.stocks;
    const value = r => kind === 'flows' ? r.netBn : kind === 'sectors' ? r.weekly : r.points;
    const maximum = Math.max(...rows.map(r => Math.abs(value(r))), 1);
    const unit = kind === 'flows' ? 'Rp bn' : kind === 'sectors' ? '%' : 'IHSG points';
    const bars = rows.map(r => `<div class="liquidity-row"><span>${esc(kind === 'flows' ? r.label || r.date : kind === 'stocks' ? r.ticker : r.name)}</span><div class="liquidity-track" aria-hidden="true"><span class="${value(r) < 0 ? 'loss' : ''}" style="width:${Math.abs(value(r)) / maximum * 100}%"></span></div><strong>${signed(value(r))}${kind === 'sectors' ? '%' : ''}</strong></div>`).join('');
    const raw = rows.map(r => [kind === 'flows' ? r.date : kind === 'stocks' ? r.ticker : r.name, signed(value(r)) + (kind === 'sectors' ? '%' : '')]);
    let calculation = '';
    if (kind === 'flows') calculation = `Sum of daily foreign net purchases: ${rows.map(r => signed(r.netBn)).join(' + ')} = ${signed(rows.reduce((sum, r) => sum + r.netBn, 0))} Rp bn. This is not a venue-specific split or a measure of capital leaving Indonesia.`;
    if (kind === 'stocks') calculation = `Selected stock contributions sum to ${signed(rows.reduce((sum, r) => sum + r.points, 0))} IHSG points; they are not the whole index move.`;
    return figure(data, block, `<div class="market-template-bars">${bars}</div>${table([kind === 'flows' ? 'Date' : kind === 'stocks' ? 'Ticker' : 'Sector', unit], raw)}${calculation ? `<p class="figure-note">${esc(calculation)}</p>` : ''}`);
  }

  function fxLab(data, block) {
    const observed = data.observations;
    const math = window.IHSGWeeklyMath;
    const equity = math.change(observed.closes.at(-1).close, observed.closes[0].close);
    const fx = math.change(observed.jisdor.at(-1).rate, observed.jisdor[0].rate);
    const id = 'weekly-fx-lab';
    const body = `<div id="${id}" class="return-lab"><p class="figure-label">JISDOR BASELINE AND SCENARIOS</p><h3>${esc(block.title || 'The unhedged dollar return')}</h3><p>${esc(block.note || 'Move either input to test a different assumption. JISDOR is a reference rate, not an executable equity-close FX quote.')}</p><div class="lab-layout"><div class="lab-controls"><label for="weekly-equity">Local equity return <output id="weekly-equity-output" for="weekly-equity"></output></label><input id="weekly-equity" type="range" min="-30" max="30" step="any" value="${equity}"><label for="weekly-fx">USD/IDR change <output id="weekly-fx-output" for="weekly-fx"></output></label><input id="weekly-fx" type="range" min="-20" max="20" step="any" value="${fx}"><button type="button" id="weekly-fx-reset" class="research-button">Reset to observations</button></div><div class="lab-result" aria-live="polite"><span>Indicative unhedged USD price return</span><strong id="weekly-usd-result"></strong><p id="weekly-usd-wealth"></p></div></div><div class="formula-box"><span>R<sub>USD</sub> = (1 + R<sub>IDR</sub>) / (1 + ΔUSD/IDR) − 1</span><p id="weekly-fx-formula"></p></div>${table(['JISDOR date', 'Rp per USD'], observed.jisdor.map(r => [r.date, number(r.rate, 0)]))}<p class="figure-note">Observed endpoints: (${number(observed.jisdor.at(-1).rate, 0)} ÷ ${number(observed.jisdor[0].rate, 0)} − 1) × 100 = ${percent(fx)}. The indicative USD price return is ${percent(math.usdReturn(equity, fx))}; it excludes dividends, fees, taxes, hedging and tracking costs.</p>${citations(data, block.sources)}</div>`;
    return body;
  }

  function renderBlock(data, block) {
    switch (block.type) {
      case 'paragraph': return `<p class="${block.lede ? 'market-lede' : ''}">${esc(block.text)}</p>${citations(data, block.sources)}`;
      case 'heading': return `<h3>${esc(block.text)}</h3>`;
      case 'callout': return `<div class="market-callout"><span class="market-callout-label">${esc(block.label || 'Assessment')}</span><p>${esc(block.text)}</p>${citations(data, block.sources)}</div>`;
      case 'closes': return closingFigure(data, block);
      case 'flows': case 'sectors': case 'stocks': return barFigure(data, block, block.type);
      case 'fxLab': return fxLab(data, block);
      case 'table': return table(block.headers, block.rows, block.caption) + citations(data, block.sources);
      default: return '';
    }
  }

  function render(data) {
    const sectionLinks = data.sections.map((section, i) => `<a href="#${esc(section.id)}">${String(i + 1).padStart(2, '0')} <span>${esc(section.nav || section.title)}</span></a>`).join('');
    const sections = data.sections.map((section, i) => `<section id="${esc(section.id)}" class="market-section"><p class="market-number">${String(i + 1).padStart(2, '0')} / ${esc(section.nav || section.title)}</p><h2>${esc(section.title)}</h2>${section.blocks.map(block => renderBlock(data, block)).join('')}</section>`).join('');
    const sources = Object.values(data.sources).map(s => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)} source</a>${s.note ? `. ${esc(s.note)}` : ''}</li>`).join('');
    const heading = data.titleLead && data.titleEmphasis ? `${esc(data.titleLead)}<br><em>${esc(data.titleEmphasis)}</em>` : esc(data.title);
    main.innerHTML = `<header class="market-hero"><p class="market-kicker"><span class="cat">Update</span> IHSG Weekly Market Update</p><h1>${heading}</h1><p class="market-deck">${esc(data.deck)}</p><p class="market-meta"><time datetime="${esc(data.published)}">${esc(data.published)}</time><span>·</span>Trading week: ${esc(data.period)}<span>·</span>Indonesia</p><div class="market-stats" aria-label="Weekly market summary">${data.stats.map(s => `<div><span class="market-stat-label">${esc(s.label)}</span><strong>${esc(s.value)}</strong><small>${esc(s.note)}</small></div>`).join('')}</div></header><div class="market-grid"><aside class="market-rail"><p class="market-rail-title">In this report</p>${sectionLinks}<a href="#sources">${String(data.sections.length + 1).padStart(2, '0')} <span>Sources & methods</span></a></aside><article class="market-content">${sections}<section id="sources" class="market-section market-sources"><p class="market-number">${String(data.sections.length + 1).padStart(2, '0')} / SOURCES & METHODS</p><h2>Sources and scope</h2><p>Reviewed ${esc(data.reviewed || data.published)}. Figures and calculations appear beside the relevant charts and tables. Source pages may require selecting the dated publication.</p><ul class="source-list">${sources}</ul>${data.method ? `<p class="market-method">${esc(data.method)}</p>` : ''}</section></article></div>`;
    document.title = `${data.title} · IHSG Weekly Market Update · Longhand Research`;
    document.querySelector('meta[name="description"]').content = data.description || data.deck;
    document.querySelector('meta[property="og:title"]').content = `${data.title} · IHSG Weekly Market Update`;
    if (data.canonical) {
      let canonical = document.querySelector('link[rel="canonical"]');
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.rel = 'canonical';
        document.head.append(canonical);
      }
      canonical.href = new URL(data.canonical, location.href).href;
    }
    document.querySelectorAll('#weekly-fx-lab').forEach(lab => {
      const math = window.IHSGWeeklyMath;
      const equity = lab.querySelector('#weekly-equity');
      const fx = lab.querySelector('#weekly-fx');
      const initial = [equity.value, fx.value];
      const update = () => {
        const local = Number(equity.value), change = Number(fx.value), usd = math.usdReturn(local, change);
        lab.querySelector('#weekly-equity-output').textContent = percent(local);
        lab.querySelector('#weekly-fx-output').textContent = percent(change);
        lab.querySelector('#weekly-usd-result').textContent = percent(usd);
        lab.querySelector('#weekly-usd-result').className = usd < 0 ? 'negative' : 'positive';
        lab.querySelector('#weekly-usd-wealth').textContent = `$100 becomes $${number(100 + usd)} before costs and dividends.`;
        lab.querySelector('#weekly-fx-formula').textContent = `(1 + ${number(local, 4)} / 100) ÷ (1 + ${number(change, 4)} / 100) − 1 = ${percent(usd)} in USD.`;
      };
      equity.addEventListener('input', update);
      fx.addEventListener('input', update);
      lab.querySelector('#weekly-fx-reset').addEventListener('click', () => { [equity.value, fx.value] = initial; update(); });
      update();
    });
  }

  try {
    requireField(week && /^\d{4}-\d{2}-\d{2}$/.test(week), 'Choose a published week from the Library.');
    const response = await fetch(`weekly/${week}.json`);
    requireField(response.ok, `No weekly data found for ${week}.`);
    const data = await response.json();
    requireField(window.IHSGWeeklyMath, 'The calculation module did not load.');
    validate(data);
    render(data);
  } catch (error) {
    main.innerHTML = `<section class="market-error"><h1>Report unavailable</h1><p>${esc(error.message)}</p><a href="library.html">Browse the library</a></section>`;
  }
})();
