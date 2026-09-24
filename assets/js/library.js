/* Longhand Research: the library page.
   Every report, newest first, with category filters and search. */
(function () {
  'use strict';

  const LH = window.Longhand;
  const { $, esc, icon, dateLong, dateShort } = LH.util;

  const listEl = $('[data-list]');
  if (!listEl) return;

  const els = {
    folio: $('[data-folio]'),
    filters: $('[data-filters]'),
    searchBox: $('.search'),
    search: $('[data-search]'),
    clear: $('[data-search-clear]'),
    count: $('[data-count]'),
    empty: $('[data-empty]'),
    note: $('[data-index-note]'),
  };

  const state = { all: [], cat: 'All', q: '' };

  /* Filters and search live in the address, so a reload or a shared link
     keeps them. */
  (function readUrl() {
    const p = new URLSearchParams(location.search);
    state.q = (p.get('q') || '').slice(0, 80);
    const c = (p.get('cat') || '').toLowerCase();
    state.cat = LH.CATEGORIES.find((x) => x.toLowerCase() === c) || 'All';
  })();

  let urlTimer = 0;
  function writeUrl() {
    clearTimeout(urlTimer);
    urlTimer = setTimeout(() => {
      const p = new URLSearchParams(location.search);
      if (state.q) p.set('q', state.q); else p.delete('q');
      if (state.cat !== 'All') p.set('cat', state.cat); else p.delete('cat');
      const qs = p.toString();
      try { history.replaceState(history.state, '', location.pathname + (qs ? `?${qs}` : '') + location.hash); } catch (e) { /* file: URLs */ }
    }, 250);
  }

  /* Search */

  const fold = (s) => String(s || '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
  const tokenize = (q) => fold(q).split(/[\s,]+/).map((t) => t.trim()).filter(Boolean);
  const haystack = (r) => fold([r.ticker, r.exchange, r.company, r.title, r.sector, r.category].join(' '));
  const matches = (r, tokens) => { const h = haystack(r); return tokens.every((t) => h.includes(t)); };

  /* Wrap the matched words in <mark>, escaping everything else. */
  function highlight(text, tokens) {
    const raw = String(text || '');
    if (!tokens.length || !raw) return esc(raw);
    const low = fold(raw);
    if (low.length !== raw.length) return esc(raw); // accents changed the length; skip marking
    const ranges = [];
    tokens.forEach((t) => {
      let i = low.indexOf(t);
      while (t && i !== -1) { ranges.push([i, i + t.length]); i = low.indexOf(t, i + t.length); }
    });
    if (!ranges.length) return esc(raw);
    ranges.sort((a, b) => a[0] - b[0]);
    const merged = [ranges[0].slice()];
    ranges.slice(1).forEach(([s, e]) => {
      const last = merged[merged.length - 1];
      if (s <= last[1]) last[1] = Math.max(last[1], e); else merged.push([s, e]);
    });
    let out = '';
    let pos = 0;
    merged.forEach(([s, e]) => { out += esc(raw.slice(pos, s)) + '<mark>' + esc(raw.slice(s, e)) + '</mark>'; pos = e; });
    return out + esc(raw.slice(pos));
  }

  /* The line under the page title: how much is in the library */
  function renderFolio() {
    if (!els.folio) return;
    const total = state.all.length;
    if (!total) { els.folio.hidden = true; return; }
    const latest = state.all.find((r) => r.date);
    const bits = [`${total} ${total === 1 ? 'report' : 'reports'} in the library`];
    const markets = new Set(state.all.map((r) => r.exchange).filter(Boolean));
    if (markets.size > 1) bits.push(`${markets.size} markets`);
    if (latest) bits.push(`Latest ${dateLong(latest.date)}`);
    els.folio.innerHTML = bits.map(esc).join('<span class="dot" aria-hidden="true">&middot;</span>');
    els.folio.hidden = false;
  }

  /* Index */

  function renderFilters(searched) {
    const inLibrary = LH.CATEGORIES.filter((c) => state.all.some((r) => r.category === c));
    if (state.cat !== 'All' && !inLibrary.includes(state.cat)) state.cat = 'All';
    const count = (c) => (c === 'All' ? searched.length : searched.filter((r) => r.category === c).length);
    // Redrawing the buttons must not throw away the keyboard focus
    const focused = els.filters.contains(document.activeElement) ? document.activeElement.dataset.cat : null;
    els.filters.hidden = state.all.length === 0;
    els.filters.innerHTML = ['All', ...inLibrary].map((c) => `
      <button type="button" class="filter" data-cat="${c}" aria-pressed="${state.cat === c}">
        ${c}<span class="sr-only">,</span><span class="filter-n">${count(c)}</span>
      </button>`).join('');
    if (focused) {
      const again = els.filters.querySelector(`[data-cat="${focused}"]`);
      if (again) again.focus();
    }
  }

  function rowHtml(r, tokens, i) {
    const call = LH.callRows(r, { withPrice: false });
    const blurb = r.blurb || r.summary;
    const company = r.company && r.company !== r.title ? r.company : '';
    const no = LH.catalogueNo(r);
    return `
      <li class="report${r.isLocal ? ' is-draft' : ''}" style="--i:${Math.min(i, 8)}">
        <div class="report-id">
          ${no ? `<span class="report-no">${esc(no)}</span>` : ''}
          <span class="report-ticker${r.ticker ? '' : ' is-category'}">${highlight(LH.subjectOf(r), tokens)}${r.ticker && r.exchange ? `<span class="report-exch">${highlight(r.exchange, tokens)}</span>` : ''}</span>
          <time class="report-date" datetime="${esc(r.date)}">${esc(dateShort(r.date))}</time>
        </div>
        <div class="report-main">
          <p class="kicker">${LH.kickerHtml(r, [company ? highlight(company, tokens) : ''], { category: !!r.ticker })}</p>
          <h3 class="report-title" data-vt-title="${esc(r.id)}"><a href="${LH.reportHref(r)}">${highlight(r.title, tokens)}</a></h3>
          ${blurb ? `<p class="report-blurb">${esc(blurb)}</p>` : ''}
        </div>
        <div class="report-call">
          ${call.length ? `<dl class="call">${call.map((x) => `<div><dt>${esc(x.short || x.label)}</dt><dd${x.cls ? ` class="${x.cls}"` : ''}>${esc(x.value)}</dd></div>`).join('')}</dl>` : '<span></span>'}
          <span class="open-cue" aria-hidden="true">Open report ${icon('arrowRight')}</span>
        </div>
        ${LH.isAuthor ? `
        <div class="author-tools" role="group" aria-label="Author tools for ${esc(r.title)}">
          ${r.isLocal ? `<span class="author-note">Only you can see this draft</span>
          <button type="button" class="tool" data-act="publish" data-id="${esc(r.id)}">Publish</button>` : ''}
          <button type="button" class="tool tool-danger" data-act="delete" data-id="${esc(r.id)}">Delete</button>
        </div>` : ''}
      </li>`;
  }

  function renderIndex({ arriving = false } = {}) {
    const tokens = tokenize(state.q);
    const searched = state.all.filter((r) => matches(r, tokens));
    renderFilters(searched);
    const shown = searched.filter((r) => state.cat === 'All' || r.category === state.cat);

    listEl.innerHTML = shown.map((r, i) => rowHtml(r, tokens, i)).join('');
    listEl.hidden = shown.length === 0;
    if (arriving) {
      listEl.classList.add('is-arriving');
      setTimeout(() => listEl.classList.remove('is-arriving'), 1400);
    }

    // The count only speaks up when the list has been narrowed; the line
    // under the page title already says how many reports there are.
    const total = state.all.length;
    const noun = (n) => (n === 1 ? 'report' : 'reports');
    els.count.textContent = !total || shown.length === total ? '' : `${shown.length} of ${total} ${noun(total)}`;

    els.clear.hidden = !state.q;
    els.searchBox.classList.toggle('has-value', !!state.q);
    els.empty.hidden = shown.length > 0;
    if (els.note) els.note.hidden = !shown.some((r) => r.targetPrice != null || r.price != null);
    if (!shown.length) {
      const what = [state.q ? `“${esc(state.q)}”` : '', state.cat !== 'All' ? `in ${esc(state.cat)}` : ''].filter(Boolean).join(' ');
      const example = (state.all.find((r) => r.ticker) || {}).ticker || 'ADRO';
      els.empty.innerHTML = !total && LH.catalogProblem()
        ? `<p class="empty-title">The report list could not be loaded.</p>
           <p class="empty-text">Please try again in a little while.</p>`
        : !total
        ? `<p class="empty-title">Nothing has been published yet.</p>
           <p class="empty-text">The first report will appear here as soon as it is added to the catalogue.</p>`
        : `<p class="empty-title">No reports match ${what}.</p>
           <p class="empty-text">Try a ticker such as ${esc(example)}, a company name or a word from a title.
           <button type="button" class="text-link" data-reset>Clear the search and filters</button></p>`;
    }
  }

  /* A note for the author when reports.js has a typo or an incomplete entry */
  function renderCatalogNote() {
    const el = $('[data-catalog-note]');
    if (!el) return;
    const problem = LH.catalogProblem();
    const issues = LH.catalogIssues();
    if (!LH.isAuthor || (!problem && !issues.length)) { el.hidden = true; return; }
    let body;
    if (problem && problem.kind === 'syntax') {
      const msg = String(problem.message || '').replace(/^Uncaught\s+/, '');
      body = `<p class="catalog-note-title">reports/reports.js has a mistake${problem.line ? ` near line ${problem.line}` : ''}, so readers see no reports.</p>
        <p>${msg ? `${esc(msg)}. ` : ''}Look for a missing comma at the end of the line before it, or a missing quote or bracket.</p>`;
    } else if (problem) {
      body = `<p class="catalog-note-title">reports/reports.js could not be read, so readers see no reports.</p>
        <p>Check that the file is in the reports folder, starts with <code>window.LONGHAND_REPORTS = [</code> and ends with <code>];</code>. A missing comma between entries causes this too.</p>`;
    } else {
      body = `<p class="catalog-note-title">reports/reports.js needs attention.</p>
        <ul>${issues.map((m) => `<li>${esc(m)}</li>`).join('')}</ul>`;
    }
    el.innerHTML = `${body}<p class="catalog-note-foot">Only you see this note, because the site is open in author mode.</p>`;
    el.hidden = false;
  }

  /* Events */

  els.search.value = state.q;
  els.search.addEventListener('input', () => {
    state.q = els.search.value.slice(0, 80);
    renderIndex();
    writeUrl();
  });
  els.search.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && els.search.value) { e.preventDefault(); resetSearch(); }
  });
  els.clear.addEventListener('click', () => { resetSearch(); els.search.focus(); });

  function resetSearch() {
    els.search.value = '';
    state.q = '';
    renderIndex();
    writeUrl();
  }

  els.filters.addEventListener('click', (e) => {
    const b = e.target.closest('[data-cat]');
    if (!b) return;
    state.cat = b.dataset.cat;
    renderIndex();
    writeUrl();
  });

  // Author tools on a row: publish a draft, or delete a report
  listEl.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const r = state.all.find((x) => x.id === b.dataset.id);
    if (r) LH.authorAction(b.dataset.act, r);
  });

  els.empty.addEventListener('click', (e) => {
    if (!e.target.closest('[data-reset]')) return;
    state.cat = 'All';
    resetSearch();
    els.search.focus();
  });

  // "/" jumps to the search box, as on most reading sites
  document.addEventListener('keydown', (e) => {
    if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
    const t = e.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    if (document.querySelector('dialog[open]')) return;
    e.preventDefault();
    els.search.focus();
    els.search.select();
  });

  function show(list, opts) {
    state.all = list;
    renderFolio();
    renderIndex(opts);
    renderCatalogNote();
  }

  // Published reports are drawn at once, so the page arrives complete.
  // Drafts saved in this browser join them once any page transition is over,
  // and the list is only redrawn if there are drafts to show (or were).
  show(LH.publishedSorted(), { arriving: true });
  const hasDrafts = (list) => list.some((r) => r.isLocal);
  function withDrafts({ now = false } = {}) {
    return Promise.all([LH.allReports(), now ? null : LH.afterTransition()]).then(([list]) => {
      // after an edit, publish or delete the list is always redrawn
      if (now || hasDrafts(list) || hasDrafts(state.all)) show(list);
    });
  }
  if (LH.isAuthor) withDrafts();
  document.addEventListener('longhand:changed', () => withDrafts({ now: true }));
  // Coming back with the Back button can restore a stale page from cache
  window.addEventListener('pageshow', (e) => { if (e.persisted && LH.isAuthor) withDrafts(); });
})();
