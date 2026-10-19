/* Shared renderer for data-only IHSG weekly editions. Never supplies market facts. */
(async function () {
  'use strict';
  const main = document.getElementById('main');
  const week = new URLSearchParams(location.search).get('week');
  let refined = false;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const number = (value, places = 2) => Number(value).toLocaleString('en-US', { minimumFractionDigits: places, maximumFractionDigits: places });
  const signed = (value, places = 2) => `${value < 0 ? '−' : value > 0 ? '+' : ''}${number(Math.abs(value), places)}`;
  const percent = value => `${signed(value)}%`;
  const positive = value => Number.isFinite(value) && value > 0;
  const finite = value => typeof value === 'number' && Number.isFinite(value);
  const date = value => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
  const requireField = (condition, message) => { if (!condition) throw new Error(message); };
  const table = (headers, rows, caption = '') => {
    const numeric = headers.map((_, i) => i > 0 && rows.every(row => /^(?:[+−-]?(?:Rp\s*)?[\d,.]+(?:\s*(?:%|bn|tn))?(?:\s*\/\s*\d+)?|Less than [\d.]+%|Starting point)$/.test(String(row[i]).trim())));
    const cellClass = i => refined ? ` class="${numeric[i] ? 'weekly-table-numeric' : 'weekly-table-text'}"` : '';
    return `<div class="market-table-wrap${refined && headers.length <= 3 ? ' weekly-table-short' : ''}" role="region" aria-label="${esc(caption || headers.join(' and '))} table, scroll horizontally" tabindex="0"><table class="market-table">${caption ? `<caption>${esc(caption)}</caption>` : ''}<thead><tr>${headers.map((h, i) => `<th scope="col"${cellClass(i)}>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${row.map((cell, i) => i === 0 ? `<th scope="row"${cellClass(i)}>${esc(cell)}</th>` : `<td${cellClass(i)}>${esc(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  };

  function dataTable(headers, rows, caption = '') {
    return `<details class="weekly-data-detail"><summary>View exact observations</summary>${table(headers, rows, caption)}</details>`;
  }

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
        requireField(['paragraph', 'heading', 'callout', 'closes', 'flows', 'sectors', 'stocks', 'fxLab', 'table', 'riskChart', 'exitLab'].includes(block.type), `Unknown block type: ${block.type}`);
        if (block.sources) requireField(Array.isArray(block.sources) && block.sources.every(key => data.sources[key]), `Unknown source in ${section.id}.`);
        if (block.type === 'riskChart') requireField(window.IHSGWeeklyRisk && ['limits', 'valuation'].includes(block.kind) && data.riskParameters, 'Risk chart assumptions are missing.');
        if (block.type === 'exitLab') requireField(window.IHSGWeeklyRisk && data.riskParameters && positive(data.riskParameters.preShockAdtvTn) && positive(data.riskParameters.fx) && positive(data.riskParameters.weightPct), 'Sale-capacity assumptions are missing.');
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

  // Block sources stay in the data file for audits; the page lists every source once, at the end.
  function figure(data, block, body) {
    return `<figure class="research-figure"><figcaption><span class="figure-label">${esc(block.label || 'DATA')}</span><h3>${esc(block.title || '')}</h3></figcaption>${body}${block.note ? `<p class="figure-note">${esc(block.note)}</p>` : ''}</figure>`;
  }

  function standardClosingFigure(data, block) {
    const rows = data.observations.closes;
    const values = rows.map(r => r.close);
    const low = Math.floor((Math.min(...values) - 20) / 50) * 50;
    const high = Math.ceil((Math.max(...values) + 20) / 50) * 50;
    const x = i => 60 + i * 630 / Math.max(1, rows.length - 1);
    const y = value => 225 - (value - low) / (high - low) * 180;
    const points = rows.map((r, i) => `${x(i)},${y(r.close)}`).join(' ');
    const ticks = [low, (low + high) / 2, high];
    const svg = `<div class="chart-scroll"><svg viewBox="0 0 750 300" role="img" aria-labelledby="weekly-close-title weekly-close-desc"><title id="weekly-close-title">${esc(block.title || 'IHSG closes')}</title><desc id="weekly-close-desc">Daily closes from ${esc(rows[0].date)} to ${esc(rows.at(-1).date)}. The scale runs from ${number(low, 0)} to ${number(high, 0)}, not from zero. The exact values are in the table below.</desc>${ticks.map(v => `<line class="chart-rule" x1="60" x2="690" y1="${y(v)}" y2="${y(v)}"/><text class="chart-axis" x="49" y="${y(v) + 4}" text-anchor="end">${number(v, 0)}</text>`).join('')}<line class="chart-baseline" x1="60" x2="690" y1="${y(rows[0].close)}" y2="${y(rows[0].close)}"/><polyline class="index-line" points="${points}"/>${rows.map((r, i) => `<circle class="index-point" cx="${x(i)}" cy="${y(r.close)}" r="4.5"/><text class="chart-axis" x="${x(i)}" y="282" text-anchor="middle">${esc(r.label || r.date.slice(5))}</text>`).join('')}</svg></div>`;
    const math = window.IHSGWeeklyMath;
    const body = svg + table(['Date', 'IHSG close', 'Change on the day'], rows.map((r, i) => [r.date, number(r.close, 3), i ? percent(math.change(r.close, rows[i - 1].close)) : 'Starting point'])) + `<p class="figure-note">Change over the week: (${number(rows.at(-1).close, 3)} ÷ ${number(rows[0].close, 3)} − 1) × 100 = ${percent(math.change(rows.at(-1).close, rows[0].close))}. The scale does not start at zero, and the line joins daily closes only, not moves during the day.</p>`;
    return figure(data, block, body);
  }

  function standardBarFigure(data, block, kind) {
    const observations = data.observations;
    const rows = kind === 'flows' ? observations.foreignFlow : kind === 'sectors' ? observations.sectors : observations.stocks;
    const value = r => kind === 'flows' ? r.netBn : kind === 'sectors' ? r.weekly : r.points;
    const maximum = Math.max(...rows.map(r => Math.abs(value(r))), 1);
    const unit = kind === 'flows' ? 'Rp bn' : kind === 'sectors' ? '%' : 'IHSG points';
    const bars = rows.map(r => `<div class="liquidity-row"><span>${esc(kind === 'flows' ? r.label || r.date : kind === 'stocks' ? r.ticker : r.name)}</span><div class="liquidity-track" aria-hidden="true"><span class="${value(r) < 0 ? 'loss' : ''}" style="width:${Math.abs(value(r)) / maximum * 100}%"></span></div><strong>${signed(value(r))}${kind === 'sectors' ? '%' : ''}</strong></div>`).join('');
    const raw = rows.map(r => [kind === 'flows' ? r.date : kind === 'stocks' ? r.ticker : r.name, signed(value(r)) + (kind === 'sectors' ? '%' : '')]);
    let calculation = '';
    if (kind === 'flows') calculation = `The daily figures add up to ${rows.map(r => signed(r.netBn)).join(' + ')} = ${signed(rows.reduce((sum, r) => sum + r.netBn, 0))} Rp bn. Net purchase means foreign purchases minus foreign sales. A negative total means net selling, while a positive total means net buying. This does not measure money leaving Indonesia.`;
    if (kind === 'stocks') calculation = `Together these stocks account for ${signed(rows.reduce((sum, r) => sum + r.points, 0))} IHSG points. The rest of the index's move came from other stocks.`;
    return figure(data, block, `<div class="market-template-bars">${bars}</div>${table([kind === 'flows' ? 'Date' : kind === 'stocks' ? 'Ticker' : 'Sector', unit], raw)}${calculation ? `<p class="figure-note">${esc(calculation)}</p>` : ''}`);
  }

  function closingFigure(data, block) {
    if (!refined) return standardClosingFigure(data, block);
    const rows = data.observations.closes;
    const values = rows.map(r => r.close);
    const low = Math.floor((Math.min(...values) - 20) / 50) * 50;
    const high = Math.ceil((Math.max(...values) + 20) / 50) * 50;
    const x = i => 100 + i * 590 / Math.max(1, rows.length - 1);
    const y = value => 225 - (value - low) / (high - low) * 180;
    const points = rows.map((r, i) => `${x(i)},${y(r.close)}`).join(' ');
    const ticks = [low, (low + high) / 2, high];
    const curvePath = data.riskParameters ? window.IHSGWeeklyRisk.curve(rows.map((r, i) => [x(i), y(r.close)])) : null;
    const math = window.IHSGWeeklyMath;
    const weekReturn = math.change(rows.at(-1).close, rows[0].close);
    const svg = `<div class="chart-scroll weekly-price-plot"><svg viewBox="0 0 750 300" role="img" aria-labelledby="weekly-close-title weekly-close-desc"><title id="weekly-close-title">${esc(block.title || 'IHSG closes')}</title><desc id="weekly-close-desc">Daily closes from ${esc(rows[0].date)} to ${esc(rows.at(-1).date)}. The scale runs from ${number(low, 0)} to ${number(high, 0)}, not from zero. Exact values are available in the expandable data table.</desc><defs><linearGradient id="weekly-price-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="currentColor" stop-opacity=".18"/><stop offset="1" stop-color="currentColor" stop-opacity="0"/></linearGradient></defs>${ticks.map(v => `<line class="chart-rule" x1="100" x2="690" y1="${y(v)}" y2="${y(v)}"/><text class="chart-axis" x="90" y="${y(v) + 4}" text-anchor="end">${number(v, 0)}</text>`).join('')}${curvePath ? `<path class="weekly-price-area" d="${curvePath} L ${x(rows.length - 1)} 225 L ${x(0)} 225 Z"/>` : `<polygon class="weekly-price-area" points="${x(0)},225 ${points} ${x(rows.length - 1)},225"/>`}<line class="chart-baseline" x1="100" x2="690" y1="${y(rows[0].close)}" y2="${y(rows[0].close)}"/>${curvePath ? `<path class="index-line" vector-effect="non-scaling-stroke" d="${curvePath}"/>` : `<polyline class="index-line" points="${points}"/>`}${rows.map((r, i) => `<circle class="index-point ${i === rows.length - 1 ? 'selected' : ''}" data-close-point="${i}" cx="${x(i)}" cy="${y(r.close)}" r="4.5"/><text class="chart-axis" x="${x(i)}" y="282" text-anchor="middle">${esc(r.label || r.date.slice(5))}</text>`).join('')}</svg></div>`;
    const buttons = `<div class="chart-buttons weekly-close-buttons" role="group" aria-label="Select a daily close">${rows.map((r, i) => `<button type="button" data-close-index="${i}" aria-pressed="${i === rows.length - 1}" aria-label="IHSG close for ${esc(r.date)}">${esc(r.label || r.date.slice(5))}</button>`).join('')}</div>`;
    const readout = `<div class="weekly-close-readout" aria-live="polite"><span data-close-date>${esc(rows.at(-1).date)}</span><strong data-close-value>${number(rows.at(-1).close, 3)}</strong><small data-close-change>${percent(math.change(rows.at(-1).close, rows.at(-2).close))} on the day</small><div class="weekly-return"><span>Over the week</span><strong class="${weekReturn < 0 ? 'negative' : weekReturn > 0 ? 'positive' : ''}">${percent(weekReturn)}</strong></div></div>`;
    const event = block.event ? `<div class="weekly-chart-event"><span>${esc(block.event.label)}</span><small>${esc(block.event.note)}</small></div>` : '';
    const body = `${event}<div class="weekly-price-layout"><div>${svg}${buttons}</div>${readout}</div>${dataTable(['Date', 'IHSG close', 'Change on the day'], rows.map((r, i) => [r.date, number(r.close, 3), i ? percent(math.change(r.close, rows[i - 1].close)) : 'Starting point']))}<p class="figure-note">Week-on-week return: (${number(rows.at(-1).close, 3)} ÷ ${number(rows[0].close, 3)} − 1) × 100 = ${percent(weekReturn)}. The dotted line marks the previous Friday's close. The scale does not start at zero. The line joins closing observations and does not show intraday moves.</p>`;
    return figure(data, block, body);
  }

  function barFigure(data, block, kind) {
    if (!refined) return standardBarFigure(data, block, kind);
    const observations = data.observations;
    const rows = kind === 'flows' ? observations.foreignFlow : kind === 'sectors' ? observations.sectors : observations.stocks;
    const value = r => kind === 'flows' ? r.netBn : kind === 'sectors' ? r.weekly : r.points;
    const maximum = Math.max(...rows.map(r => Math.abs(value(r))), 1);
    const unit = kind === 'flows' ? 'Rp bn' : kind === 'sectors' ? '%' : 'IHSG points';
    const flowRange = Math.max(...rows.map(r => Math.max(value(r), 0))) + Math.max(...rows.map(r => Math.max(-value(r), 0))) || 1;
    const zero = 14 + Math.max(...rows.map(r => Math.max(value(r), 0))) / flowRange * 66;
    const bars = kind === 'flows'
      ? `<div class="weekly-flow-chart" style="--flow-zero:${zero}%" role="img" aria-label="Official daily foreign net flow, Rp bn. ${rows.map(r => `${esc(r.date)}: ${signed(value(r))}`).join('; ')}. Positive bars indicate buying; negative bars indicate selling."><span class="weekly-flow-zero" aria-hidden="true">0</span>${rows.map(r => {
        const height = Math.abs(value(r)) / flowRange * 66;
        const labelTop = value(r) < 0 ? zero + height + 3 : zero - height - 10;
        return `<div class="weekly-flow-column"><span class="weekly-flow-value ${value(r) < 0 ? 'negative' : 'positive'}" style="top:${labelTop}%">${signed(value(r))}</span><span class="weekly-flow-bar ${value(r) < 0 ? 'loss' : 'gain'}" style="height:${height}%;top:${value(r) < 0 ? zero : zero - height}%" aria-hidden="true"></span><span class="weekly-flow-date">${esc(/^\d{2}-\d{2}$/.test(r.label || '') ? new Date(`${r.date}T00:00:00Z`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', timeZone: 'UTC' }) : r.label || r.date.slice(5))}</span></div>`;
      }).join('')}</div><div class="weekly-flow-key"><span>Above zero: net buying</span><span>Below zero: net selling</span><span>Rp bn</span></div>`
      : `<div class="market-template-bars">${rows.map(r => `<div class="liquidity-row"><span>${esc(kind === 'stocks' ? r.ticker : r.name)}</span><div class="liquidity-track" aria-hidden="true"><span class="${value(r) < 0 ? 'loss' : ''}" style="width:${Math.abs(value(r)) / maximum * 100}%"></span></div><strong>${signed(value(r))}${kind === 'sectors' ? '%' : ''}</strong></div>`).join('')}</div>`;
    const raw = rows.map(r => [kind === 'flows' ? r.date : kind === 'stocks' ? r.ticker : r.name, signed(value(r)) + (kind === 'sectors' ? '%' : '')]);
    let calculation = '';
    if (kind === 'flows') calculation = `The ${rows.length} rounded daily readings sum to ${signed(rows.reduce((sum, r) => sum + r.netBn, 0))} Rp bn. Net flow is foreign purchases less sales. It measures trading activity and does not measure capital leaving Indonesia.`;
    if (kind === 'stocks') calculation = `Together these stocks account for ${signed(rows.reduce((sum, r) => sum + r.points, 0))} IHSG points. The rest of the index's move came from other stocks.`;
    const context = data.riskParameters ? (kind === 'flows'
      ? `<div class="weekly-flow-summary"><div><span>Weekly net selling, rounded daily sum</span><strong>${signed(rows.reduce((sum, r) => sum + r.netBn, 0) / 1000)}<small> Rp tn</small></strong></div><p>Daily purchases less sales<br>Official figures across all stock markets</p></div>`
      : `<div class="weekly-bar-axis"><span>${kind === 'stocks' ? 'Contribution to the fall' : 'Weekly price decline'}</span><span>0</span><span>${number(maximum)} ${unit}</span></div>`) : '';
    return figure(data, block, `${context}${bars}${dataTable([kind === 'flows' ? 'Date' : kind === 'stocks' ? 'Ticker' : 'Sector', unit], raw)}${calculation ? `<p class="figure-note">${esc(calculation)}</p>` : ''}`);
  }

  function fxLab(data, block) {
    const observed = data.observations;
    const math = window.IHSGWeeklyMath;
    const equity = math.change(observed.closes.at(-1).close, observed.closes[0].close);
    const fx = math.change(observed.jisdor.at(-1).rate, observed.jisdor[0].rate);
    const id = 'weekly-fx-lab';
    const body = `<div id="${id}" class="return-lab"><p class="figure-label">TRY YOUR OWN NUMBERS</p><h3>${esc(block.title || 'The return in dollars')}</h3><p>${esc(block.note || 'Move either slider to try a different assumption. JISDOR is a reference rate, not a price anyone could trade at when the stock market closed.')}</p><div class="lab-layout"><div class="lab-controls"><label for="weekly-equity">Return on Indonesian shares in rupiah <output id="weekly-equity-output" for="weekly-equity"></output></label><input id="weekly-equity" type="range" min="-30" max="30" step="any" value="${equity}"><label for="weekly-fx">Change in the dollar against the rupiah <output id="weekly-fx-output" for="weekly-fx"></output></label><input id="weekly-fx" type="range" min="-20" max="20" step="any" value="${fx}"><button type="button" id="weekly-fx-reset" class="research-button">Back to this week's figures</button></div><div class="lab-result" aria-live="polite"><span>Rough return in dollars, without a currency hedge</span><strong id="weekly-usd-result"></strong><p id="weekly-usd-wealth"></p></div></div><div class="formula-box"><span>R<sub>USD</sub> = (1 + R<sub>IDR</sub>) / (1 + ΔUSD/IDR) − 1</span><p id="weekly-fx-formula"></p></div>${table(['JISDOR date', 'Rp per USD'], observed.jisdor.map(r => [r.date, number(r.rate, 0)]))}<p class="figure-note">Change in JISDOR over the week: (${number(observed.jisdor.at(-1).rate, 0)} ÷ ${number(observed.jisdor[0].rate, 0)} − 1) × 100 = ${percent(fx)}. That makes the rough return in dollars ${percent(math.usdReturn(equity, fx))}, before dividends, fees, taxes, hedging and tracking costs.</p></div>`;
    return body;
  }

  function renderBlock(data, block) {
    switch (block.type) {
      case 'paragraph': return `<p${block.lede ? ' class="market-lede"' : refined ? '' : ' class=""'}>${esc(block.text)}</p>`;
      case 'heading': return `<h3>${esc(block.text)}</h3>`;
      case 'callout': return `<div class="market-callout"><span class="market-callout-label">${esc(block.label || 'Assessment')}</span><p>${esc(block.text)}</p></div>`;
      case 'closes': return closingFigure(data, block);
      case 'flows': case 'sectors': case 'stocks': return barFigure(data, block, block.type);
      case 'fxLab': return fxLab(data, block);
      case 'table': return table(block.headers, block.rows, block.caption);
      case 'riskChart': return riskFigure(data, block);
      case 'exitLab': return exitLab(data, block);
      default: return '';
    }
  }

  function lineFigure(data, block) {
    const values = block.series.flatMap(s => s.values);
    const low = block.zero ? 0 : Math.floor(Math.min(...values) / 1000) * 1000;
    const high = block.zero ? 100 : Math.ceil(Math.max(...values) / 1000) * 1000;
    const x = i => 90 + i * 570 / (block.labels.length - 1);
    const y = v => 245 - (v - low) / (high - low) * 205;
    const step = block.zero ? 25 : 1000;
    const ticks = Array.from({length: Math.round((high - low) / step) + 1}, (_, i) => low + i * step);
    const colors = ['var(--weekly-sage, var(--chart-line))', 'var(--chart-down)', 'var(--weekly-ochre, var(--gold-ink))'];
    const initial = block.kind === 'valuation' ? block.labels.indexOf('100') : block.labels.length - 1;
    const baseline = block.zero ? 100 : data.riskParameters?.index;
    const svg = `<div class="chart-scroll weekly-model-scroll"><svg viewBox="0 0 750 295" role="img" aria-label="${esc(block.title)}. ${esc(block.unit || '')}. ${block.zero ? 'Scale includes zero.' : 'Scale does not start at zero.'} Exact values follow in the data table.">${ticks.map(v => `<line class="chart-rule" x1="90" x2="660" y1="${y(v)}" y2="${y(v)}"/><text class="chart-axis" x="75" y="${y(v) + 4}" text-anchor="end">${number(v, 0)}</text>`).join('')}${baseline ? `<line class="weekly-model-baseline" x1="90" x2="660" y1="${y(baseline)}" y2="${y(baseline)}"/>` : ''}<line data-line-guide class="weekly-model-guide" x1="${x(initial)}" x2="${x(initial)}" y1="34" y2="245"/>${block.series.map((s, j) => `<path class="weekly-model-line" fill="none" vector-effect="non-scaling-stroke" stroke="${colors[j % 3]}" stroke-width="2.5" ${j ? `stroke-dasharray="${j === 1 ? '8 5' : '2 6'}"` : ''} d="${window.IHSGWeeklyRisk.curve(s.values.map((v, i) => [x(i), y(v)]))}"/>${s.values.map((v, i) => `<circle class="weekly-model-point" data-line-series="${j}" data-line-index="${i}" fill="${colors[j % 3]}" cx="${x(i)}" cy="${y(v)}" r="${i === initial ? 6 : 2.5}"/>`).join('')}`).join('')}${block.labels.map((label, i) => `<text class="chart-axis" x="${x(i)}" y="274" text-anchor="middle">${esc(label)}</text>`).join('')}</svg></div><p class="weekly-model-axis-title">${esc(block.xTitle || '')}</p>`;
    const readout = `<div class="weekly-model-readouts" style="--series-count:${block.series.length}" aria-live="polite">${block.series.map((s, j) => `<div style="--series-color:${colors[j % 3]}"><span><i style="border-top-style:${j === 1 ? 'dashed' : j === 2 ? 'dotted' : 'solid'}"></i>${esc(s.name)}</span><strong data-line-value="${j}">${number(s.values[initial], block.decimals ?? 0)}</strong><small data-line-return="${j}">${percent((s.values[initial] / baseline - 1) * 100)} ${block.zero ? 'from the start' : 'from 16 October'}</small></div>`).join('')}</div>`;
    const controls = `<div class="weekly-model-control"><span>${esc(block.kind === 'limits' ? 'Inspect session' : 'Inspect yield change')}</span><div class="chart-buttons" role="group" aria-label="${esc(block.xTitle)}">${block.labels.map((label, i) => `<button type="button" data-line-select="${i}" aria-pressed="${i === initial}">${esc(label)}${block.kind === 'valuation' ? ' bp' : ''}</button>`).join('')}</div></div>`;
    return figure(data, block, `<div data-line-exhibit data-line-values="${esc(JSON.stringify(block.series.map(s => s.values)))}" data-line-baseline="${baseline}" data-line-decimals="${block.decimals ?? 0}">${readout}${svg}${controls}</div>` + dataTable([block.xTitle || 'Observation', ...block.series.map(s => s.name)], block.labels.map((label, i) => [label, ...block.series.map(s => number(s.values[i], block.decimals ?? 2))])));
  }

  function riskFigure(data, block) {
    const model = window.IHSGWeeklyRisk;
    const p = data.riskParameters;
    if (block.kind === 'limits') return lineFigure(data, {
      ...block, zero: true, labels: ['0', '1', '2', '3', '4', '5'], xTitle: 'Consecutive sessions at the assumed lower limit', unit: 'Starting wealth = 100', decimals: 2,
      series: [{name: '7% daily limit', values: model.limitPath(7)}, {name: '15% daily limit', values: model.limitPath(15)}]
    });
    const shifts = [-50, 0, 50, 100, 150, 200, 250];
    return lineFigure(data, {
      ...block, labels: shifts.map(String), xTitle: 'Change in earnings yield, basis points', unit: 'Illustrative IHSG level', decimals: 0,
      series: [0, -10, 5].map(eps => ({name: `Earnings ${eps > 0 ? '+' : ''}${eps}%`, values: shifts.map(bps => model.valuation(p.index, p.multiple, eps, bps).level)}))
    });
  }

  function exitLab(data, block) {
    return figure(data, block, `<div class="weekly-exit-lab" data-exit-lab><p>Change the hypothetical assets and share of daily trading. The September weight stays fixed for this sensitivity.</p><div class="lab-layout"><div class="lab-controls"><label for="exit-aum">Hypothetical EM index-tracking assets <output data-exit-aum></output></label><input id="exit-aum" data-exit-input="aum" type="range" min="0.1" max="1.5" step="0.05" value="1"><label for="exit-participation">Share of regular daily turnover <output data-exit-participation></output></label><input id="exit-participation" data-exit-input="participation" type="range" min="5" max="25" step="1" value="10"><button type="button" class="research-button" data-exit-reset>Reset assumptions</button></div><div class="lab-result" aria-live="polite"><span>Market-wide turnover equivalents</span><strong data-exit-sessions></strong><p data-exit-sale></p></div></div><p class="formula-box" data-exit-formula></p></div>`);
  }

  function render(data) {
    refined = data.presentation === 'refined';
    main.classList.toggle('weekly-edition', refined);
    main.classList.toggle('weekly-risk-edition', Boolean(data.riskParameters));
    const sectionLinks = data.sections.map((section, i) => `<a href="#${esc(section.id)}">${String(i + 1).padStart(2, '0')} <span>${esc(section.nav || section.title)}</span></a>`).join('');
    const sections = data.sections.map((section, i) => `<section id="${esc(section.id)}" class="market-section"><p class="market-number">${String(i + 1).padStart(2, '0')} ${esc(section.nav || section.title)}</p><h2>${esc(section.title)}</h2>${section.blocks.map(block => renderBlock(data, block)).join('')}</section>`).join('');
    const sourceNav = refined ? 'Sources' : 'Sources and method';
    const sourceTitle = refined ? 'Key references' : 'Where the numbers come from';
    const sourceIntro = refined ? (data.sourceIntro || `Primary sources, checked ${new Date(`${data.reviewed || data.published}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })}.`) : `Figures checked on ${data.reviewed || data.published}. Calculations are shown beside the relevant charts. On the source sites you may need to pick the report for the right date.`;
    const sourceMethod = data.displayMethod || data.method;
    const sources = refined && data.sourceGroups ? data.sourceGroups.map(group => `<li><strong>${esc(group.label)}</strong>: ${group.links.map(link => `<a href="${esc(data.sources[link.source].url)}" target="_blank" rel="noopener">${esc(link.label)}</a>`).join(', ')}. ${esc(group.note || '')}</li>`).join('') : Object.values(data.sources).filter(s => s.display !== false).map(s => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)}</a>${s.note ? `. ${esc(s.note)}` : ''}</li>`).join('');
    const heading = data.titleLead && data.titleEmphasis ? `${esc(data.titleLead)}<br><em>${esc(data.titleEmphasis)}</em>` : esc(data.title);
    main.innerHTML = `<header class="market-hero"><p class="market-kicker"><span class="cat">Update</span> IHSG Weekly Market Update</p><h1>${heading}</h1><p class="market-deck">${esc(data.deck)}</p><p class="market-meta"><time datetime="${esc(data.published)}">${esc(data.published)}</time><span>Trading week</span>${esc(data.period)}</p><div role="group" class="market-stats" aria-label="Weekly market summary">${data.stats.map(s => `<div><span class="market-stat-label">${esc(s.label)}</span><strong>${esc(s.value)}</strong><small>${esc(s.note)}</small></div>`).join('')}</div></header><div class="market-grid"><aside class="market-rail"><p class="market-rail-title">In this report</p>${sectionLinks}<a href="#sources">${String(data.sections.length + 1).padStart(2, '0')} <span>${esc(sourceNav)}</span></a></aside><article class="market-content">${sections}<section id="sources" class="market-section market-sources"><p class="market-number">${String(data.sections.length + 1).padStart(2, '0')} ${esc(sourceNav)}</p><h2>${esc(sourceTitle)}</h2><p>${esc(sourceIntro)}</p><ul class="source-list">${sources}</ul>${sourceMethod ? `<p class="market-method">${esc(sourceMethod)}</p>` : ''}</section></article></div>`;
    document.title = `${data.title} · IHSG Weekly Market Update · Longhand Research`;
    document.querySelector('meta[name="description"]').content = data.description || data.deck;
    document.querySelector('meta[property="og:title"]').content = `${data.title} · IHSG Weekly Market Update`;
    document.querySelectorAll('[data-line-exhibit]').forEach(exhibit => {
      const series = JSON.parse(exhibit.dataset.lineValues);
      const baseline = Number(exhibit.dataset.lineBaseline);
      exhibit.querySelectorAll('[data-line-select]').forEach(button => button.addEventListener('click', () => {
        const index = Number(button.dataset.lineSelect);
        series.forEach((values, j) => {
          exhibit.querySelector(`[data-line-value="${j}"]`).textContent = number(values[index], Number(exhibit.dataset.lineDecimals));
          const output = exhibit.querySelector(`[data-line-return="${j}"]`);
          output.textContent = `${percent((values[index] / baseline - 1) * 100)} ${baseline === 100 ? 'from the start' : 'from 16 October'}`;
        });
        const point = exhibit.querySelector(`[data-line-series="0"][data-line-index="${index}"]`);
        exhibit.querySelector('[data-line-guide]').setAttribute('x1', point.getAttribute('cx'));
        exhibit.querySelector('[data-line-guide]').setAttribute('x2', point.getAttribute('cx'));
        exhibit.querySelectorAll('[data-line-index]').forEach(p => p.setAttribute('r', Number(p.dataset.lineIndex) === index ? '6' : '2.5'));
        exhibit.querySelectorAll('[data-line-select]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
      }));
    });
    document.querySelectorAll('[data-exit-lab]').forEach(lab => {
      const aum = lab.querySelector('[data-exit-input="aum"]');
      const participation = lab.querySelector('[data-exit-input="participation"]');
      const update = () => {
        const p = data.riskParameters;
        const result = window.IHSGWeeklyRisk.exitCapacity(Number(aum.value), p.weightPct, p.fx, p.preShockAdtvTn, Number(participation.value));
        lab.querySelector('[data-exit-aum]').textContent = `$${number(aum.value)}tn`;
        lab.querySelector('[data-exit-participation]').textContent = `${number(participation.value, 0)}%`;
        lab.querySelector('[data-exit-sessions]').textContent = `${number(result.sessions, 1)} sessions`;
        lab.querySelector('[data-exit-sale]').textContent = `$${number(result.saleBnUsd)}bn becomes Rp${number(result.saleTnIdr)}tn of hypothetical sales.`;
        lab.querySelector('[data-exit-formula]').textContent = `Rp${number(result.saleTnIdr, 4)}tn ÷ (Rp${number(p.preShockAdtvTn, 4)}tn × ${number(participation.value, 0)}%) = ${number(result.sessions, 1)} sessions. This is a turnover ratio, not a liquidation timetable.`;
      };
      aum.addEventListener('input', update);
      participation.addEventListener('input', update);
      lab.querySelector('[data-exit-reset]').addEventListener('click', () => { aum.value = '1'; participation.value = '10'; update(); });
      update();
    });
    if (data.canonical) {
      let canonical = document.querySelector('link[rel="canonical"]');
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.rel = 'canonical';
        document.head.append(canonical);
      }
      canonical.href = new URL(data.canonical, location.href).href;
    }
    document.querySelectorAll('[data-close-index]').forEach(button => {
      button.addEventListener('click', () => {
        const index = Number(button.dataset.closeIndex);
        const rows = data.observations.closes;
        const row = rows[index];
        const scope = button.closest('.research-figure');
        scope.querySelector('[data-close-date]').textContent = row.date;
        scope.querySelector('[data-close-value]').textContent = number(row.close, 3);
        scope.querySelector('[data-close-change]').textContent = index ? `${percent(window.IHSGWeeklyMath.change(row.close, rows[index - 1].close))} on the day` : 'Previous Friday: comparison base';
        scope.querySelectorAll('[data-close-index]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
        scope.querySelectorAll('[data-close-point]').forEach(p => p.classList.toggle('selected', Number(p.dataset.closePoint) === index));
      });
    });
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
