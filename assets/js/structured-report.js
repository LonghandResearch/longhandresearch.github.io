/* Optional, data-only report format. Existing PDFs and bespoke pages are unchanged.
   Text is escaped; there is no HTML, script or formula execution in this format. */
(function (scope) {
  'use strict';
  const esc = (value) => String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const text = (value) => typeof value === 'string' && value.trim().length > 0;
  const validId = (value) => typeof value === 'string' && /^[a-z][a-z0-9-]{0,99}$/.test(value);
  function safeUrl(value) {
    if (!text(value) || /[\u0000-\u0020\\]/.test(value) || value.startsWith('//')) return false;
    return /^https:\/\/[^/]+/i.test(value) || (!/^[a-z][a-z0-9+.-]*:/i.test(value) && !value.startsWith('/'));
  }
  function validate(data, reportId) {
    const errors = [];
    const fail = (message) => errors.push(message);
    if (!data || typeof data !== 'object' || Array.isArray(data)) return ['The report must be a JSON object.'];
    if (data.schemaVersion !== 1) fail('Unsupported schemaVersion.');
    if (!text(data.reportId) || (reportId && data.reportId !== reportId)) fail('reportId must match the catalogue.');
    if (!Array.isArray(data.sources) || !data.sources.length) fail('At least one source is required.');
    const sources = new Set();
    (Array.isArray(data.sources) ? data.sources : []).forEach((source, i) => {
      if (!source || !validId(source.id) || sources.has(source.id)) { fail(`Source ${i + 1} needs a unique id.`); return; }
      sources.add(source.id);
      if (!text(source.title) || !safeUrl(source.url)) fail(`Source ${source.id} needs a title and safe URL.`);
    });
    if (!Array.isArray(data.sections) || !data.sections.length || data.sections.length > 100) fail('Use between 1 and 100 sections.');
    const ids = new Set(['sources']);
    (Array.isArray(data.sections) ? data.sections : []).forEach((section, i) => {
      if (!section || !validId(section.id) || (ids.has(section.id) || section.id.startsWith('source-'))) { fail(`Section ${i + 1} needs a unique anchor id.`); return; }
      ids.add(section.id);
      if (!text(section.title)) fail(`Section ${section.id} needs a title.`);
      if (!Array.isArray(section.blocks) || !section.blocks.length) { fail(`Section ${section.id} needs content blocks.`); return; }
      section.blocks.forEach((block) => {
        if (!block || !['paragraph', 'list', 'callout', 'table', 'line-chart'].includes(block.type)) { fail(`Unsupported block in ${section.id}.`); return; }
        if (block.type === 'paragraph' && !text(block.text)) fail('Paragraph text is required.');
        if (block.type === 'callout' && (!text(block.title) || !text(block.text))) fail('Callouts need a title and text.');
        if (block.type === 'list' && (!Array.isArray(block.items) || !block.items.length || !block.items.every(text))) fail('Lists need text items.');
        if (block.sources && (!Array.isArray(block.sources) || !block.sources.every((id) => sources.has(id)))) fail('A block refers to an unknown source.');
        if (block.type === 'table' || block.type === 'line-chart') {
          if (!text(block.title) || !text(block.period) || !text(block.unit) || !text(block.status)) fail('Figures need a title, period, unit and evidence status.');
          if (!Array.isArray(block.sources) || !block.sources.length) fail('Figures need source references.');
        }
        if (block.type === 'table') {
          if (!Array.isArray(block.columns) || !block.columns.length || !block.columns.every(text)) fail('Table columns need labels.');
          if (!Array.isArray(block.rows) || !block.rows.length || !block.rows.every((row) => Array.isArray(row) && row.length === (block.columns || []).length && row.every((cell) => typeof cell === 'string' || (typeof cell === 'number' && Number.isFinite(cell))))) fail('Table rows must match the columns and contain text or finite numbers.');
        }
        if (block.type === 'line-chart') {
          if (!Array.isArray(block.points) || block.points.length < 2 || block.points.length > 60 || !block.points.every((point) => point && text(point.label) && typeof point.value === 'number' && Number.isFinite(point.value))) fail('Line charts need 2–60 labeled finite values.');
        }
      });
    });
    return errors;
  }
  const sourceNote = (block) => block.sources && block.sources.length ? `<p class="structured-source-note">Sources: ${block.sources.map((id) => `<a href="#source-${esc(id)}">${esc(id)}</a>`).join(', ')}</p>` : '';
  function table(columns, rows) {
    return `<div class="structured-table-scroll" role="region" aria-label="Figure data" tabindex="0"><table class="structured-table"><thead><tr>${columns.map((x) => `<th scope="col">${esc(x)}</th>`).join('')}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map((x, i) => i === 0 ? `<th scope="row">${esc(x)}</th>` : `<td>${esc(x)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }
  function chart(block) {
    const values = block.points.map((p) => p.value);
    const lo = Math.min(0, ...values);
    const peak = Math.max(0, ...values);
    const hi = peak === lo ? lo + 1 : peak;
    const span = hi - lo || 1;
    const x = (i) => 70 + i / (values.length - 1) * 640;
    const y = (value) => 250 - (value - lo) / span * 220;
    const ticks = [lo, lo + span / 2, hi];
    const display = (value) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 4 }).format(value);
    return `<svg class="structured-chart" viewBox="0 0 760 300" role="group" aria-label="${esc(block.title)}. Values are available in the data table below.">${ticks.map((value) => `<line class="chart-grid" x1="70" x2="710" y1="${y(value)}" y2="${y(value)}"/><text x="60" y="${y(value) + 4}" text-anchor="end">${esc(display(value))}</text>`).join('')}<path class="chart-line" d="${block.points.map((p, i) => `${i ? 'L' : 'M'}${x(i)},${y(p.value)}`).join(' ')}"/>${block.points.map((p, i) => `<circle cx="${x(i)}" cy="${y(p.value)}" r="4" tabindex="0" role="img" aria-label="${esc(p.label)}: ${esc(display(p.value))} ${esc(block.unit)}" data-chart-label="${esc(p.label)}: ${esc(display(p.value))} ${esc(block.unit)}"><title>${esc(p.label)}: ${esc(display(p.value))} ${esc(block.unit)}</title></circle>`).join('')}<text x="70" y="280">${esc(block.points[0].label)}</text><text x="710" y="280" text-anchor="end">${esc(block.points[block.points.length - 1].label)}</text></svg>`;
  }
  function renderBlock(block) {
    if (block.type === 'paragraph') return `<p>${esc(block.text)}</p>${sourceNote(block)}`;
    if (block.type === 'list') { const tag = block.ordered ? 'ol' : 'ul'; return `<${tag}>${block.items.map((x) => `<li>${esc(x)}</li>`).join('')}</${tag}>${sourceNote(block)}`; }
    if (block.type === 'callout') return `<aside class="structured-callout"><h3>${esc(block.title)}</h3><p>${esc(block.text)}</p>${sourceNote(block)}</aside>`;
    const data = block.type === 'line-chart'
      ? chart(block) + `<output class="structured-chart-readout" aria-live="polite">Select an observation to inspect its value.</output><details><summary>Read the figure data</summary>${table(['Period', block.unit], block.points.map((p) => [p.label, p.value]))}</details>`
      : table(block.columns, block.rows);
    return `<figure class="structured-figure"><figcaption><h3>${esc(block.title)}</h3><p class="structured-figure-meta">${esc(block.unit)} · ${esc(block.period)} · ${esc(block.status)}</p></figcaption>${data}${block.caption ? `<p class="structured-source-note">${esc(block.caption)}</p>` : ''}${sourceNote(block)}</figure>`;
  }
  function render(data, reportId) {
    const errors = validate(data, reportId);
    if (errors.length) throw new Error(errors.join(' '));
    return `<article class="structured-body">${data.sections.map((section) => `<section class="structured-section" id="${esc(section.id)}"><h2>${esc(section.title)}</h2>${section.blocks.map(renderBlock).join('')}</section>`).join('')}<section class="structured-section structured-sources" id="sources"><h2>Sources and method</h2>${data.methodology ? `<p>${esc(data.methodology)}</p>` : ''}<ol>${data.sources.map((source) => `<li id="source-${esc(source.id)}"><a href="${esc(source.url)}" target="_blank" rel="noopener">${esc(source.title)}</a>${source.note ? `<br>${esc(source.note)}` : ''}${source.accessed ? `<br>Accessed ${esc(source.accessed)}` : ''}</li>`).join('')}</ol></section></article>`;
  }
  function load(report, element) {
    const controller = new AbortController();
    let dead = false;
    async function read() {
      element.innerHTML = '<p class="state-text" role="status">Loading the research…</p>';
      try {
        const url = new URL(report.contentUrl, scope.location.href);
        if (url.origin !== scope.location.origin || !/\.json$/.test(url.pathname)) throw new Error('The report data must be a JSON file on this site.');
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) throw new Error(`Report request failed (${response.status}).`);
        const json = await response.text();
        if (json.length > 5 * 1024 * 1024) throw new Error('The report data exceeds the 5 MB limit.');
        const data = JSON.parse(json);
        if (dead) return;
        element.innerHTML = render(data, report.id);
        const readPoint = (event) => {
          const point = event.target.closest('[data-chart-label]');
          if (point) point.closest('figure').querySelector('.structured-chart-readout').textContent = point.dataset.chartLabel;
        };
        element.addEventListener('focusin', readPoint, { signal: controller.signal });
        element.addEventListener('pointerover', readPoint, { signal: controller.signal });
        document.dispatchEvent(new CustomEvent('longhand:structured-ready', { detail: { report } }));
        if (location.hash && /^#[a-z0-9-]+$/i.test(location.hash)) {
          const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
          if (target) target.scrollIntoView({ behavior: 'instant' });
        }
      } catch (error) {
        if (dead || error.name === 'AbortError') return;
        element.innerHTML = '<div class="structured-error" role="status"><h2>The research could not be loaded.</h2><p>The report data may be unavailable or incomplete. Its catalogue details remain above.</p><button type="button" class="btn" data-retry-report>Try again</button></div>';
        element.querySelector('[data-retry-report]').addEventListener('click', read, { once: true });
        console.warn('Structured report unavailable:', error.message);
      }
    }
    read();
    return { destroy() { dead = true; controller.abort(); } };
  }
  scope.LonghandStructured = Object.freeze({ validate, render, load, safeUrl });
})(typeof window !== 'undefined' ? window : globalThis);
