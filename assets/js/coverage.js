/* Longhand Research: the coverage page.
   Every company with a rating, its current call and the calls before it. */
(function () {
  'use strict';

  const LH = window.Longhand;
  const { $, esc, icon, dateLong, dateShort } = LH.util;

  const listEl = $('[data-coverage]');
  if (!listEl) return;

  const els = {
    folio: $('[data-folio]'),
    empty: $('[data-empty]'),
    note: $('[data-index-note]'),
  };

  /* One entry per company: its reports newest first. Only company reports
     with a ticker and a rating count as coverage. */
  function companies(reports) {
    const byTicker = new Map();
    reports
      .filter((r) => r.ticker && r.rating && LH.COMPANY_CATEGORIES.includes(r.category))
      .forEach((r) => {
        const key = [r.exchange, r.ticker].join(':');
        if (!byTicker.has(key)) byTicker.set(key, []);
        byTicker.get(key).push(r);
      });
    return Array.from(byTicker.values())
      .map((calls) => calls.slice().sort((a, b) => (b.date || '').localeCompare(a.date || '')))
      .sort((a, b) => (b[0].date || '').localeCompare(a[0].date || '') || a[0].ticker.localeCompare(b[0].ticker));
  }

  function renderFolio(list) {
    if (!els.folio) return;
    if (!list.length) { els.folio.hidden = true; return; }
    const count = (rating) => list.filter((calls) => calls[0].rating === rating).length;
    const bits = [`${list.length} ${list.length === 1 ? 'company' : 'companies'}`];
    ['BUY', 'HOLD', 'SELL'].forEach((x) => { const n = count(x); if (n) bits.push(`${n} ${x.charAt(0) + x.slice(1).toLowerCase()}`); });
    bits.push(`Latest call ${dateLong(list[0][0].date)}`);
    els.folio.innerHTML = bits.map(esc).join('<span class="dot" aria-hidden="true">&middot;</span>');
    els.folio.hidden = false;
  }

  const callHtml = (r) => {
    const rows = LH.callRows(r);
    return `<dl class="call">${rows.map((x) => `<div><dt>${esc(x.short || x.label)}</dt><dd${x.cls ? ` class="${x.cls}"` : ''}>${esc(x.value)}</dd></div>`).join('')}</dl>`;
  };

  /* An earlier call, in one line: date, rating and target, and its report */
  function earlierHtml(r) {
    const target = r.targetPrice != null ? `${r.currency} ${LH.util.fmtNum(r.targetPrice)}` : '';
    return `
      <li>
        <time datetime="${esc(r.date)}">${esc(dateShort(r.date))}</time>
        <span class="rating rating-${r.rating.toLowerCase()}">${esc(r.rating)}</span>
        ${target ? `<span>Target ${esc(target)}</span>` : ''}
        <a href="${LH.reportHref(r)}">${esc(r.title)}</a>
      </li>`;
  }

  function rowHtml(calls, i) {
    const r = calls[0];
    const earlier = calls.slice(1);
    const since = earlier.length ? `Call of ${dateLong(r.date)}` : `Since ${dateLong(r.date)}`;
    return `
      <li class="report cover" style="--i:${Math.min(i, 8)}">
        <div class="report-id">
          <span class="report-ticker">${esc(r.ticker)}${r.exchange ? `<span class="report-exch">${esc(r.exchange)}</span>` : ''}</span>
          <time class="report-date" datetime="${esc(r.date)}">${esc(since)}</time>
        </div>
        <div class="report-main">
          <p class="kicker">${esc(r.sector || r.category)}</p>
          <h3 class="report-title cover-company">${esc(r.company || r.ticker)}</h3>
          <p class="cover-latest">${esc(r.category === 'Initiation' ? 'Initiation' : 'Latest update')}: <a href="${LH.reportHref(r)}">${esc(r.title)}</a></p>
          ${earlier.length ? `
          <div class="cover-history">
            <p class="cover-history-label">Earlier ${earlier.length === 1 ? 'call' : 'calls'}</p>
            <ol>${earlier.map(earlierHtml).join('')}</ol>
          </div>` : ''}
        </div>
        <div class="report-call">
          ${callHtml(r)}
          <span class="open-cue" aria-hidden="true">Open report ${icon('arrowRight')}</span>
        </div>
      </li>`;
  }

  function render(reports) {
    const list = companies(reports);
    renderFolio(list);
    listEl.innerHTML = list.map(rowHtml).join('');
    listEl.hidden = !list.length;
    listEl.classList.add('is-arriving');
    setTimeout(() => listEl.classList.remove('is-arriving'), 1400);
    els.empty.hidden = list.length > 0;
    if (els.note) els.note.hidden = !list.length;
    if (!list.length) {
      els.empty.innerHTML = LH.catalogProblem()
        ? `<p class="empty-title">The coverage list could not be loaded.</p>
           <p class="empty-text">Please try again in a little while.</p>`
        : `<p class="empty-title">No company is under coverage yet.</p>
           <p class="empty-text">Companies appear here once a rated report on them is published.</p>`;
    }
  }

  // Coverage is the public record, so drafts never appear here
  render(LH.publishedSorted());
})();
