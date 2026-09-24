/* Longhand Research: The Wire.
   Headlines from the financial press, gathered every hour into
   news/news.json by .github/workflows/wire.yml. The wire page lists them by
   day with topic filters and search; the front page shows the latest few.
   Only headlines and links are shown: every story opens at its source. */
(function () {
  'use strict';

  const LH = window.Longhand;
  const { $, esc, icon, dateLong } = LH.util;

  const page = $('[data-wire]');
  const brief = $('[data-wire-brief]');
  if (!page && !brief) return;

  const TOPICS = ['Markets', 'Macro', 'Commodities', 'Crypto'];
  const BRIEF_COUNT = 6;

  /* Times are shown in the reader's own time zone */
  const pad = (n) => String(n).padStart(2, '0');
  const isoDay = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const clock = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  function dayName(d) {
    const today = new Date();
    const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
    if (isoDay(d) === isoDay(today)) return 'Today';
    if (isoDay(d) === isoDay(yesterday)) return 'Yesterday';
    return '';
  }
  const shortStamp = (d) => (dayName(d) === 'Today' ? clock(d) : `${d.getDate()} ${d.toLocaleString('en-GB', { month: 'short' })}`);

  async function load() {
    const res = await fetch(`news/news.json?v=${Math.floor(Date.now() / 60000)}`, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return (Array.isArray(data.items) ? data.items : [])
      .filter((x) => x && x.title && /^https?:\/\//i.test(x.url) && !Number.isNaN(Date.parse(x.time)))
      .map((x) => ({
        title: String(x.title),
        url: String(x.url),
        source: String(x.source || ''),
        topic: TOPICS.includes(x.topic) ? x.topic : 'Markets',
        lang: /^[a-z]{2}$/.test(x.lang || '') ? x.lang : '',
        date: new Date(x.time),
      }))
      .sort((a, b) => b.date - a.date);
  }

  // The last word and the arrow stay together, so the arrow never sits on a line of its own
  function titleHtml(x) {
    const cut = x.title.lastIndexOf(' ');
    const head = cut > 0 ? x.title.slice(0, cut + 1) : '';
    const tail = cut > 0 ? x.title.slice(cut + 1) : x.title;
    return `${esc(head)}<span class="wire-tail">${esc(tail)}${icon('external')}</span><span class="sr-only"> (opens at ${esc(x.source || 'its source')})</span>`;
  }

  function itemHtml(x, stamp, i) {
    return `
      <li class="wire-item" style="--i:${Math.min(i, 10)}">
        <time class="wire-time" datetime="${esc(x.date.toISOString())}">${esc(stamp)}</time>
        <div class="wire-main">
          <p class="kicker"><span class="cat">${esc(x.topic)}</span>&nbsp;<span class="dot" aria-hidden="true">&middot;</span> ${esc(x.source)}</p>
          <p class="wire-title"${x.lang ? ` lang="${x.lang}"` : ''}><a href="${esc(x.url)}" target="_blank" rel="noopener noreferrer">${titleHtml(x)}</a></p>
        </div>
      </li>`;
  }

  /* Front page: the latest few */

  if (brief) {
    const section = brief.closest('[data-wire-section]');
    load().then((items) => {
      if (!items.length || !section) return;
      brief.innerHTML = items.slice(0, BRIEF_COUNT).map((x, i) => itemHtml(x, shortStamp(x.date), i)).join('');
      section.hidden = false;
    }).catch(() => { /* the front page simply goes without */ });
  }

  if (!page) return;

  /* Wire page */

  const els = {
    folio: $('[data-folio]'),
    filters: $('[data-filters]'),
    searchBox: $('.search'),
    search: $('[data-search]'),
    clear: $('[data-search-clear]'),
    count: $('[data-count]'),
    empty: $('[data-empty]'),
  };
  const state = { all: [], topic: 'All', q: '', loaded: false, failed: false };

  (function readUrl() {
    const p = new URLSearchParams(location.search);
    state.q = (p.get('q') || '').slice(0, 80);
    const t = (p.get('topic') || '').toLowerCase();
    state.topic = TOPICS.find((x) => x.toLowerCase() === t) || 'All';
  })();

  let urlTimer = 0;
  function writeUrl() {
    clearTimeout(urlTimer);
    urlTimer = setTimeout(() => {
      const p = new URLSearchParams(location.search);
      if (state.q) p.set('q', state.q); else p.delete('q');
      if (state.topic !== 'All') p.set('topic', state.topic.toLowerCase()); else p.delete('topic');
      const qs = p.toString();
      try { history.replaceState(history.state, '', location.pathname + (qs ? `?${qs}` : '') + location.hash); } catch (e) { /* file: URLs */ }
    }, 250);
  }

  const fold = (s) => String(s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '');
  const tokens = () => fold(state.q).split(/[\s,]+/).filter(Boolean);
  const matches = (x, ts) => { const h = fold(`${x.title} ${x.source} ${x.topic}`); return ts.every((t) => h.includes(t)); };

  function renderFolio() {
    if (!els.folio) return;
    if (!state.all.length) { els.folio.hidden = true; return; }
    const sources = new Set(state.all.map((x) => x.source).filter(Boolean)).size;
    const latest = state.all[0].date;
    const bits = [
      `${state.all.length} headlines`,
      `${sources} ${sources === 1 ? 'source' : 'sources'}`,
      `Latest ${dayName(latest) === 'Today' ? clock(latest) : `${dateLong(isoDay(latest))}, ${clock(latest)}`}`,
    ];
    els.folio.innerHTML = bits.map(esc).join('<span class="dot" aria-hidden="true">&middot;</span>');
    els.folio.hidden = false;
  }

  function renderFilters(searched) {
    const present = TOPICS.filter((t) => state.all.some((x) => x.topic === t));
    if (state.topic !== 'All' && !present.includes(state.topic)) state.topic = 'All';
    const count = (t) => (t === 'All' ? searched.length : searched.filter((x) => x.topic === t).length);
    const focused = els.filters.contains(document.activeElement) ? document.activeElement.dataset.topic : null;
    els.filters.hidden = !state.all.length;
    els.filters.innerHTML = ['All', ...present].map((t) => `
      <button type="button" class="filter" data-topic="${t}" aria-pressed="${state.topic === t}">
        ${t}<span class="sr-only">,</span><span class="filter-n">${count(t)}</span>
      </button>`).join('');
    if (focused) {
      const again = els.filters.querySelector(`[data-topic="${focused}"]`);
      if (again) again.focus();
    }
  }

  function render({ arriving = false } = {}) {
    const ts = tokens();
    const searched = state.all.filter((x) => matches(x, ts));
    renderFilters(searched);
    const shown = searched.filter((x) => state.topic === 'All' || x.topic === state.topic);

    // One block per day, newest first
    const days = [];
    shown.forEach((x) => {
      const key = isoDay(x.date);
      if (!days.length || days[days.length - 1].key !== key) days.push({ key, date: x.date, items: [] });
      days[days.length - 1].items.push(x);
    });
    let n = 0;
    page.innerHTML = days.map((d) => {
      const name = dayName(d.date);
      const long = dateLong(d.key);
      return `
        <section class="wire-day" aria-label="${esc(name || long)}">
          <h3 class="wire-day-label">${name ? `${esc(name)} <span>${esc(long)}</span>` : esc(long)}</h3>
          <ol class="wire-list">${d.items.map((x) => itemHtml(x, clock(x.date), n++)).join('')}</ol>
        </section>`;
    }).join('');
    page.hidden = !shown.length;
    if (arriving) {
      page.classList.add('is-arriving');
      setTimeout(() => page.classList.remove('is-arriving'), 1400);
    }

    const total = state.all.length;
    els.count.textContent = !total || shown.length === total ? '' : `${shown.length} of ${total} headlines`;
    els.clear.hidden = !state.q;
    els.searchBox.hidden = !total;
    els.searchBox.classList.toggle('has-value', !!state.q);
    els.empty.hidden = shown.length > 0;
    if (shown.length) return;
    if (state.failed) {
      els.empty.innerHTML = location.protocol === 'file:'
        ? `<p class="empty-title">The wire is shown on the live site.</p>
           <p class="empty-text">Opened straight from the disk, the browser will not read the headlines file. Open the site online, or from localhost, to see them.</p>`
        : `<p class="empty-title">The headlines could not be loaded.</p>
           <p class="empty-text">You may be offline. Please try again in a little while.</p>`;
    } else if (!total) {
      els.empty.innerHTML = `<p class="empty-title">The first headlines are on their way.</p>
        <p class="empty-text">The wire is gathered every hour. Please look back shortly.</p>`;
    } else {
      const what = [state.q ? `“${esc(state.q)}”` : '', state.topic !== 'All' ? `in ${esc(state.topic)}` : ''].filter(Boolean).join(' ');
      els.empty.innerHTML = `<p class="empty-title">No headlines match ${what}.</p>
        <p class="empty-text">Try a company, a commodity or a source.
        <button type="button" class="text-link" data-reset>Clear the search and filters</button></p>`;
    }
  }

  /* Events */

  els.search.value = state.q;
  els.search.addEventListener('input', () => { state.q = els.search.value.slice(0, 80); render(); writeUrl(); });
  els.search.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && els.search.value) { e.preventDefault(); resetSearch(); }
  });
  els.clear.addEventListener('click', () => { resetSearch(); els.search.focus(); });
  function resetSearch() {
    els.search.value = '';
    state.q = '';
    render();
    writeUrl();
  }
  els.filters.addEventListener('click', (e) => {
    const b = e.target.closest('[data-topic]');
    if (!b) return;
    state.topic = b.dataset.topic;
    render();
    writeUrl();
  });
  els.empty.addEventListener('click', (e) => {
    if (!e.target.closest('[data-reset]')) return;
    state.topic = 'All';
    resetSearch();
    els.search.focus();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
    const t = e.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    if (document.querySelector('dialog[open]')) return;
    e.preventDefault();
    els.search.focus();
    els.search.select();
  });

  els.filters.hidden = true;
  els.searchBox.hidden = true;
  load()
    .then((items) => { state.all = items; })
    .catch(() => { state.failed = true; })
    .then(() => { renderFolio(); render({ arriving: true }); });
})();
