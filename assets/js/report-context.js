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
    addContents();
    addRelated(r, ctx);
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
    const hero = main.querySelector('.reader-head, .pbai-hero, .market-hero, .coal-hero, .hero');
    if (hero) hero.after(details); else main.querySelector('[data-report-context]').after(details);
    // Existing desktop rails remain in charge of the specialized page layout.
    if (main.querySelector('.pbai-toc, .market-rail, .coal-nav, .update-links')) details.classList.add('report-contents-mobile');
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
