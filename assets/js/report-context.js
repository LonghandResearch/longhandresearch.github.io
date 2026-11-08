/* Publication context for the PDF reader and existing interactive reports.
   Research bodies and their individual chart controllers remain independent. */
(function () {
  'use strict';
  const script = document.currentScript;
  const base = new URL('../../', script.src);
  const at = (path) => new URL(path, base).href;
  const main = document.querySelector('main');
  if (!main || !document.body.hasAttribute('data-report-publication')) return;
  const catalogue = () => window.Longhand ? window.Longhand.publishedSorted() : (window.LONGHAND_REPORTS || []).slice().sort((a, b) => b.date.localeCompare(a.date));
  const href = (r) => at(r.page || `report.html?id=${encodeURIComponent(r.id)}`);
  let observer;

  function currentReport() {
    const id = new URLSearchParams(location.search).get('id');
    return catalogue().find((r) => {
      if (id && /\/report\.html$/.test(location.pathname)) return r.id === id;
      if (!r.page) return false;
      const page = new URL(r.page, base);
      if (page.pathname !== location.pathname) return false;
      return [...page.searchParams].every(([k, v]) => new URLSearchParams(location.search).get(k) === v);
    });
  }
  function link(label, url) {
    const a = document.createElement('a');
    a.textContent = label;
    a.href = url;
    // Return to the archive as the reader left it, including its search,
    // filters and scroll position. Modified clicks still open that archive URL.
    if (url === at('library.html')) {
      try {
        const ref = new URL(document.referrer);
        if (ref.origin === location.origin && ref.pathname === new URL(at('library.html')).pathname) {
          a.href = ref.href;
          const arrivedFrom = window.navigation?.activation?.from?.url;
          if (arrivedFrom) {
            const archive = new URL(arrivedFrom);
            const withoutAnchor = new URL(archive); withoutAnchor.hash = '';
            if (withoutAnchor.href === ref.href) a.href = archive.href;
          }
          a.addEventListener('click', (e) => {
            if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || history.length < 2) return;
            const from = window.navigation?.activation?.from;
            const current = window.navigation?.currentEntry;
            const origin = from?.url ? new URL(from.url) : null;
            if (origin) origin.hash = ''; // Referrer URLs omit their fragment.
            // In-report anchors can add history entries after arrival.
            // Traverse past those entries to the actual originating archive.
            if (origin?.href === ref.href && current && from.index >= 0 && from.index < current.index) {
              e.preventDefault();
              history.go(from.index - current.index);
            } else if (!window.navigation && !location.hash) {
              e.preventDefault();
              history.back();
            }
          });
        }
      } catch (_) { /* Direct entry retains the full Library destination. */ }
    }
    return a;
  }
  function enhance(report) {
    if (!main.querySelector('h1')) return;
    const r = report || currentReport();
    if (!r) return;
    main.dataset.reportId = r.id;
    const graph = window.LonghandGraph;
    const ctx = graph ? graph.contextFor(r) : { countries: [], sectors: [], companies: [] };
    if (!main.querySelector('[data-report-context]')) {
      const nav = document.createElement('nav');
      nav.className = 'report-context wrap';
      nav.dataset.reportContext = '';
      nav.setAttribute('aria-label', 'Research context');
      nav.append(link('Library', at('library.html')));
      [['country', ctx.countries], ['sector', ctx.sectors], ['company', ctx.companies]].forEach(([type, entities]) => {
        // A breadcrumb represents an unambiguous path, not every mention.
        if (!entities || entities.length !== 1) return;
        const entity = entities[0];
        const sep = document.createElement('span');
        sep.textContent = '›';
        sep.setAttribute('aria-hidden', 'true');
        nav.append(sep, link(entity.name, at(graph.urlFor(type, entity.id))));
      });
      const label = document.createElement('span');
      label.className = 'report-context-current';
      label.textContent = window.Longhand ? window.Longhand.catalogueNo(r) : r.category;
      label.setAttribute('aria-current', 'page');
      nav.append(label);
      main.prepend(nav);
    }
    addReadingRail(r);
    addOpener(r);
    addContents();
    addRelated(r, ctx);
  }

  /* One opening for every web publication, the same as a PDF report's page:
     jacket, kicker, title, subject, summary, actions and a Key data column.
     The text comes from the catalogue, so it matches the Library. The key
     figures are read from the page's own opening, which stays in the page
     (folded away, not deleted) so nothing is written twice and a page
     without JavaScript still shows its original opening. */
  const OPENERS = [
    { hero: 'header.market-hero', fold: ['.market-kicker', 'h1', '.market-deck', '.market-meta', '.market-stats'],
      row: '.market-stats > div', label: '.market-stat-label', value: 'strong', note: 'small' },
    { hero: 'header.pbai-hero', fold: ['.kicker', '.pbai-title', '.pbai-sub', '.pbai-meta', 'dl.pbai-keys'],
      row: 'dl.pbai-keys > div', label: 'dt', value: 'dd:not(.pbai-key-note)', note: 'dd.pbai-key-note' },
    { hero: 'header.coal-hero', fold: ['.hero-copy'] },
    { hero: '.nickel-cover', fold: ['.hero-grid', '.hero-ledger'],
      row: '.hero-ledger .ledger-item', label: 'p', value: 'strong', note: 'small' },
    { hero: 'section.hero', fold: ['.hero-copy'] },
  ];
  const clean = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '');
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

  function addOpener(r) {
    if (document.body.classList.contains('page-report') || main.querySelector('[data-publication-opener]')) return;
    const recipe = OPENERS.find((o) => main.querySelector(o.hero));
    if (!recipe) return;
    const hero = main.querySelector(recipe.hero);
    const LH = window.Longhand;
    const rows = recipe.row ? [...hero.querySelectorAll(recipe.row)].map((el) => ({
      label: clean(el.querySelector(recipe.label)), value: clean(el.querySelector(recipe.value)), note: clean(el.querySelector(recipe.note)),
    })).filter((x) => x.label && x.value) : [];
    const date = LH ? LH.util.dateLong(r.date) : new Date(`${r.date}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
    const no = LH ? LH.catalogueNo(r) : '';
    const kickerParts = [`<time datetime="${esc(r.date)}">${esc(date)}</time>`, esc(no)].filter(Boolean);
    const kicker = LH ? LH.kickerHtml(r, kickerParts) : [esc(r.category), ...kickerParts].join(' &middot; ');
    const subject = r.company && r.company !== r.title ? r.company : '';
    const summary = r.summary ? (LH ? LH.util.editorialText(r.summary) : r.summary) : '';
    const cover = window.LonghandArt?.coverHTML(r, { sizes: '176px' });
    const opener = document.createElement('section');
    opener.className = `pub-opener wrap${cover ? '' : ' no-cover'}${rows.length ? '' : ' no-side'}`;
    opener.dataset.publicationOpener = '';
    opener.setAttribute('aria-label', 'Publication');
    opener.innerHTML = `
      ${cover ? `<div class="pub-cover">${cover}</div>` : ''}
      <div class="pub-main">
        <p class="kicker">${kicker}</p>
        <h1 class="pub-title">${esc(r.title)}</h1>
        ${subject ? `<p class="pub-subject">${esc(subject)}</p>` : ''}
        ${summary ? `<p class="pub-summary">${esc(summary)}</p>` : ''}
        <div class="pub-actions"><button type="button" class="text-link" data-pub-copy><span data-pub-copy-label aria-live="polite">Copy link</span></button></div>
      </div>
      ${rows.length ? `<aside class="pub-side ledger" aria-label="Key data">
        <p class="ledger-label">Key data</p>
        <dl>${rows.map((x) => `<div class="ledger-row"><dt>${esc(x.label)}</dt><dd>${esc(x.value)}</dd>${x.note ? `<dd class="ledger-note">${esc(x.note)}</dd>` : ''}</div>`).join('')}</dl>
      </aside>` : ''}`;
    const anchor = main.querySelector('[data-report-context]');
    if (anchor) anchor.after(opener); else main.prepend(opener);
    const copy = opener.querySelector('[data-pub-copy]');
    copy.addEventListener('click', async () => {
      const text = new URL(href(r), location.href).href;
      let ok = false;
      try { await navigator.clipboard.writeText(text); ok = true; } catch (_) { ok = LH ? await LH.util.copyText(text) : false; }
      const label = copy.querySelector('[data-pub-copy-label]');
      label.textContent = ok ? 'Link copied' : 'Copy failed';
      clearTimeout(copy._t);
      copy._t = setTimeout(() => { label.textContent = 'Copy link'; }, 2200);
    });
    // Fold the page's own opening away, keeping whatever else it holds.
    recipe.fold.forEach((sel) => hero.querySelectorAll(sel).forEach((el) => el.classList.add('pub-folded')));
    if ([...hero.children].every((el) => el.classList.contains('pub-folded'))) hero.classList.add('pub-folded');
    else hero.classList.add('pub-hero-rest');
  }

  function addReadingRail(r) {
    if (!document.body.classList.contains('page-report') || main.querySelector('.reading-rail')) return;
    const head = main.querySelector('.reader-head');
    const documentView = main.querySelector('[data-viewer], [data-structured-report]');
    if (!head || !documentView) return;
    head.id ||= 'publication-overview';
    documentView.id ||= 'publication-document';
    main.classList.add('has-reading-rail');
    const aside = document.createElement('aside'); aside.className = 'reading-rail';
    aside.setAttribute('aria-label', 'Publication navigation');
    const inner = document.createElement('div'); inner.className = 'reading-rail-inner';
    const rubric = document.createElement('p'); rubric.className = 'reading-rubric'; rubric.textContent = 'Publication';
    inner.append(rubric);
    const cover = window.LonghandArt?.coverHTML(r, { sizes: '176px' });
    if (cover) {
      const jacket = document.createElement('div'); jacket.className = 'reading-jacket';
      jacket.innerHTML = cover;
      inner.append(jacket);
    } else {
      const title = document.createElement('h2'); title.textContent = r.title;
      inner.append(title);
    }
    const meta = document.createElement('p'); meta.className = 'reading-meta';
    meta.textContent = `${r.category} · ${window.Longhand ? window.Longhand.util.dateLong(r.date) : r.date}`;
    const nav = document.createElement('nav');
    const overviewLink = link('Overview', `#${head.id}`);
    const documentLink = link('Full report', `#${documentView.id}`);
    overviewLink.setAttribute('aria-current', 'location');
    nav.append(overviewLink, documentLink, link('← Library', at('library.html')));
    inner.append(meta, nav);
    aside.append(inner); main.prepend(aside);
    if ('IntersectionObserver' in window) {
      const position = new IntersectionObserver(() => {
        if (!aside.isConnected) { position.disconnect(); return; }
        const inDocument = documentView.getBoundingClientRect().top <= innerHeight * .4;
        [overviewLink, documentLink].forEach((a, i) => {
          if (i === (inDocument ? 1 : 0)) a.setAttribute('aria-current', 'location');
          else a.removeAttribute('aria-current');
        });
      }, { rootMargin: '-20% 0px -60% 0px', threshold: 0 });
      position.observe(head); position.observe(documentView);
    }
  }

  function addContents() {
    if (main.querySelector('[data-report-contents]') || main.querySelector('[data-reader]')) return;
    // The PDF gets its own genuine document outline from reader.js.
    if (main.hasAttribute('data-reader') && !main.querySelector('.structured-body')) return;
    const targets = [...main.querySelectorAll('section[id]')].filter((section) => section.querySelector('h2') && !section.closest('[data-related-research]'));
    if (targets.length < 2) return;
    const details = document.createElement('details');
    details.className = 'report-contents wrap';
    details.dataset.reportContents = '';
    const summary = document.createElement('summary');
    summary.textContent = 'In this report';
    const nav = document.createElement('nav');
    nav.setAttribute('aria-label', 'Report contents');
    const list = document.createElement('ol');
    targets.forEach((section) => {
      const li = document.createElement('li');
      const title = section.querySelector('h2').textContent.replace(/\s+/g, ' ').trim();
      const a = link(title, `#${encodeURIComponent(section.id)}`);
      a.addEventListener('click', () => { details.open = false; });
      li.append(a);
      list.append(li);
    });
    nav.append(list);
    details.append(summary, nav);
    const hero = main.querySelector('[data-publication-opener], .reader-head, .pbai-hero, .market-hero, .coal-hero, .hero');
    if (hero) hero.after(details); else main.querySelector('[data-report-context]').after(details);
    // Existing desktop rails remain in charge of the specialized page layout.
    if (main.querySelector('.pbai-toc, .market-rail, .coal-nav, .update-links, .chapter-rail, .section-nav')) details.classList.add('report-contents-mobile');
  }

  function addRelated(r, ctx) {
    if (main.querySelector('[data-related-research]')) return;
    const graph = window.LonghandGraph;
    if (!graph) return;
    const keys = ['companies', 'sectors', 'countries'];
    const weighted = catalogue().filter((other) => other.id !== r.id).map((other) => {
      const context = graph.contextFor(other);
      const score = keys.reduce((total, key, i) => total + ((ctx[key] || []).some((entity) => (context[key] || []).some((x) => x.id === entity.id)) ? [9, 3, 1][i] : 0), 0);
      return { report: other, score };
    }).filter((x) => x.score > 0).sort((a, b) => b.score - a.score || b.report.date.localeCompare(a.report.date)).slice(0, 3);
    if (!weighted.length) return;
    const section = document.createElement('section');
    section.className = 'report-related wrap';
    section.dataset.relatedResearch = '';
    const heading = document.createElement('h2');
    heading.textContent = 'Continue the research';
    const note = document.createElement('p');
    note.className = 'report-related-note';
    note.textContent = 'Reports connected by documented subjects and geography.';
    const list = document.createElement('div');
    list.className = 'report-related-list';
    weighted.forEach(({ report }) => {
      const a = link('', href(report));
      a.dataset.reportId = report.id;
      const meta = document.createElement('span');
      meta.className = 'report-related-meta';
      meta.textContent = `${report.category} · ${report.date}`;
      const title = document.createElement('h3');
      title.textContent = report.title;
      const arrow = document.createElement('span');
      arrow.className = 'report-related-arrow';
      arrow.textContent = '↗';
      arrow.setAttribute('aria-hidden', 'true');
      a.append(meta, title, arrow);
      list.append(a);
    });
    section.append(heading, note, list);
    main.append(section);
  }

  // Charts and tables may overflow only at phone widths or after a data redraw.
  // Make those regions reachable with a keyboard, without adding desktop stops.
  const scrollSelector = '.chart-scroll, .table-scroll, .structured-table-scroll';
  const scrollRegions = new WeakMap();
  function fitScrollRegion(region) {
    const state = scrollRegions.get(region);
    if (!state) return;
    const scrolls = region.clientWidth > 0 && region.scrollWidth > region.clientWidth + 1;
    if (scrolls) {
      region.tabIndex = 0;
      if (state.role) region.setAttribute('role', 'region');
      if (state.label) region.setAttribute('aria-label',
        (region.closest('figure')?.querySelector('figcaption')?.textContent || region.querySelector('caption')?.textContent ||
          (region.matches('.chart-scroll') ? 'Scrollable research chart' : 'Scrollable research table')).replace(/\s+/g, ' ').trim().slice(0, 180));
    } else {
      region.removeAttribute('tabindex');
      if (state.role) region.removeAttribute('role');
      if (state.label) region.removeAttribute('aria-label');
    }
  }
  const scrollResize = 'ResizeObserver' in window ? new ResizeObserver((entries) => entries.forEach(({ target }) => fitScrollRegion(target))) : null;
  function registerScrollRegion(region) {
    if (!scrollRegions.has(region)) {
      // Preserve regions whose own report controller already manages focus.
      if (region.hasAttribute('tabindex')) return;
      scrollRegions.set(region, { role: !region.hasAttribute('role'), label: !region.hasAttribute('aria-label') && !region.hasAttribute('aria-labelledby') });
    }
    scrollResize?.observe(region);
    fitScrollRegion(region);
  }
  main.querySelectorAll(scrollSelector).forEach(registerScrollRegion);
  new MutationObserver((records) => records.forEach((record) => {
    const parent = record.target.closest?.(scrollSelector);
    if (parent) registerScrollRegion(parent);
    record.addedNodes.forEach((node) => {
      if (node.nodeType !== 1) return;
      if (node.matches(scrollSelector)) registerScrollRegion(node);
      node.querySelectorAll(scrollSelector).forEach(registerScrollRegion);
    });
    record.removedNodes.forEach((node) => {
      if (node.nodeType !== 1) return;
      if (node.matches(scrollSelector)) scrollResize?.unobserve(node);
      node.querySelectorAll(scrollSelector).forEach((region) => scrollResize?.unobserve(region));
    });
  })).observe(main, { childList: true, subtree: true });
  if (!scrollResize) window.addEventListener('resize', () => main.querySelectorAll(scrollSelector).forEach(registerScrollRegion));

  // Weekly editions arrive asynchronously; observe only until their body exists.
  function start() {
    enhance();
    if (!main.querySelector('h1')) {
      observer = new MutationObserver(() => {
        if (!main.querySelector('h1')) return;
        observer.disconnect();
        enhance();
      });
      observer.observe(main, { childList: true, subtree: true });
    }
  }
  document.addEventListener('longhand:report-ready', (e) => enhance(e.detail.report));
  document.addEventListener('longhand:structured-ready', () => enhance());
  start();
})();
