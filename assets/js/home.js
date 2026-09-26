/* Longhand Research: the front page.
   The night plate (its stars, the catalogue in four numbers, the masthead over
   it), the titles strip beneath it, and under those the newest report in the
   library, set as a lead story. The Earth itself is drawn by earth.js. */

/* The night plate and the titles strip */
(function () {
  'use strict';

  const LH = window.Longhand;
  const hero = document.querySelector('[data-hero]');
  if (!LH || !hero) return;
  const { $, $$, esc, dateShort } = LH.util;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* Stars, drawn once to the size of the plate. The generator is seeded, so
     they keep their places from one visit to the next. */
  const sky = $('[data-stars]', hero);
  let skyW = 0, skyH = 0;
  function drawStars() {
    const w = hero.clientWidth;
    const h = hero.clientHeight;
    if (!sky || !w || !h || (w === skyW && Math.abs(h - skyH) < 40)) return;
    skyW = w;
    skyH = h;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    sky.width = Math.round(w * dpr);
    sky.height = Math.round(h * dpr);
    const ctx = sky.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    let seed = 20260926;
    const rand = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
    const n = Math.round((w * h) / 2400);
    for (let i = 0; i < n; i++) {
      const x = rand() * w;
      const y = rand() * h;
      const bright = rand() < 0.06;
      const r = bright ? 0.85 + rand() * 0.75 : 0.3 + rand() * 0.55;
      const a = bright ? 0.65 + rand() * 0.35 : 0.14 + rand() * 0.5;
      const hue = rand();
      ctx.fillStyle = hue < 0.12 ? `rgba(255, 214, 160, ${a})` : hue > 0.9 ? `rgba(190, 212, 255, ${a})` : `rgba(242, 240, 234, ${a})`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /* A number that rolls up like an odometer the first time it is seen */
  const odo = (n) => {
    const digits = String(n).split('').map((d) => `<span class="odo-digit"><span class="odo-strip" data-to="${d}">${'0123456789'.split('').map((k) => `<span>${k}</span>`).join('')}</span></span>`).join('');
    return `<span class="sr-only">${n}</span><span class="odo" aria-hidden="true">${digits}</span>`;
  };
  function roll(root) {
    const strips = $$('.odo-strip', root);
    const set = () => strips.forEach((s) => { s.style.transform = `translateY(calc(var(--odo-h) * -${s.dataset.to}))`; });
    if (reduce.matches || !('IntersectionObserver' in window)) {
      strips.forEach((s) => { s.style.transition = 'none'; });
      set();
      return;
    }
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      requestAnimationFrame(() => requestAnimationFrame(set));
    }, { threshold: 0.4 });
    io.observe(root);
  }

  /* The catalogue in four numbers, from the published reports */
  const ledger = $('[data-ledger]', hero);
  function renderLedger(list) {
    if (!ledger) return;
    if (!list.length) { ledger.hidden = true; return; }
    const kinds = [...new Set(list.map((r) => r.category).filter(Boolean))];
    const markets = [...new Set(list.map((r) => r.exchange).filter(Boolean))];
    const cell = (label, value, note) => `<div><dt>${esc(label)}</dt><dd>${value}${note ? `<span class="ledger-note">${esc(note)}</span>` : ''}</dd></div>`;
    ledger.innerHTML = [
      cell('Reports', odo(list.length)),
      cell('Kinds of study', odo(kinds.length), kinds.join(', ')),
      cell('Markets', odo(markets.length), markets.length ? markets.join(', ') : 'Sector and macro studies only'),
      cell('Latest', `<time datetime="${esc(list[0].date)}">${esc(dateShort(list[0].date))}</time>`),
    ].join('');
    ledger.hidden = false;
    roll(ledger);
  }

  /* The titles strip: each report's catalogue number and title, run together */
  const strip = $('[data-index-strip]');
  const track = strip && $('[data-index-track]', strip);
  function renderStrip(list) {
    if (!strip || !track) return;
    if (!list.length) { strip.hidden = true; return; }
    const item = (r, copy) => `<span class="index-item${copy ? ' is-copy' : ''}"><span class="index-no">${esc(LH.catalogueNo(r))}</span>${esc(r.title)}</span>`;
    // the list is repeated so it still fills the widest screen at the end of its run
    const once = list.map((r) => item(r, false)).join('');
    const copies = list.map((r) => item(r, true)).join('');
    track.innerHTML = once + copies + copies;
    $('.sr-only', strip).textContent = `Browse all ${list.length} ${list.length === 1 ? 'report' : 'reports'} in the library`;
    strip.hidden = false;
  }

  /* Scroll: the masthead is clear while it sits over the plate; the headline
     lifts a little faster than the page, the stars move slower, and the
     titles strip drifts sideways as it passes */
  const mast = $('.masthead');
  let ticking = false;
  function update() {
    ticking = false;
    const top = hero.getBoundingClientRect();
    if (mast) mast.classList.toggle('is-over-night', top.bottom > mast.offsetHeight);
    if (reduce.matches) {
      hero.style.removeProperty('--lift');
      hero.style.removeProperty('--stars-y');
      if (strip) strip.style.removeProperty('--strip-x');
      return;
    }
    const p = Math.max(0, Math.min(1, -top.top / (top.height || 1)));
    hero.style.setProperty('--lift', `${(-p * 56).toFixed(1)}px`);
    hero.style.setProperty('--stars-y', `${(p * top.height * 0.3).toFixed(1)}px`);
    if (strip && !strip.hidden) {
      const r = strip.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const q = Math.max(0, Math.min(1, (vh - r.top) / (vh + r.height)));
      const run = Math.min(Math.max(0, track.scrollWidth - strip.clientWidth), strip.clientWidth * 0.9);
      strip.style.setProperty('--strip-x', `${(-q * run).toFixed(1)}px`);
    }
  }
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  };

  /* Content below the plate rises into view as the page reaches it
     (after the scroll-reveal recipe in nexu-io/motion-anything, Apache-2.0) */
  function reveal() {
    const els = $$('[data-reveal]');
    if (reduce.matches || !('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('is-in'));
      return;
    }
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      io.unobserve(e.target);
    }), { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    els.forEach((el) => io.observe(el));
  }

  function render() {
    // newest first, and within a day in reverse catalogue order, so the numbers run down evenly
    const list = LH.publishedSorted().sort((a, b) => (b.date || '').localeCompare(a.date || '') || b.id.localeCompare(a.id));
    renderLedger(list);
    renderStrip(list);
    onScroll();
  }
  render();
  drawStars();
  reveal();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  window.addEventListener('pageshow', onScroll);
  new ResizeObserver(() => requestAnimationFrame(drawStars)).observe(hero);
  document.addEventListener('longhand:changed', render);
  if (reduce.addEventListener) reduce.addEventListener('change', onScroll);
})();

/* The latest report */
(function () {
  'use strict';

  const LH = window.Longhand;
  const { $, esc, icon, dateLong } = LH.util;

  const section = $('[data-latest-section]');
  const body = $('[data-latest]');
  if (!section || !body) return;

  function render(list) {
    const r = list[0];
    if (!r) { section.hidden = true; return; }
    section.hidden = false;
    const href = LH.reportHref(r);
    // A lighter version of the report page's header: the short blurb and just the call
    const ledger = LH.ledgerHtml(r, 'The call', { extra: false });
    const company = r.company && r.company !== r.title ? r.company : '';
    const text = r.blurb || r.summary;
    body.innerHTML = `
      <div class="lead${ledger ? '' : ' no-side'}">
        <div class="lead-main">
          <p class="kicker">${LH.kickerHtml(r, [esc(LH.tickerLabel(r)), `<time datetime="${esc(r.date)}">${esc(dateLong(r.date))}</time>`])}</p>
          <h3 class="lead-title" data-vt-title="${esc(r.id)}"><a href="${href}">${esc(r.title)}</a></h3>
          ${company ? `<p class="lead-company">${esc(company)}</p>` : ''}
          ${text ? `<p class="lead-summary">${esc(text)}</p>` : ''}
          <div class="lead-actions">
            <a class="btn" href="${href}">Read the report ${icon('arrowRight', 'icon-arrow')}</a>
            ${r.pdfUrl || r.blob ? `<a class="text-link" href="${esc(LH.fileUrl(r))}" download="${esc(LH.downloadName(r))}">${icon('download')} Download</a>` : ''}
            <span class="file-meta">${esc(LH.fileMeta(r))}</span>
          </div>
        </div>
        ${ledger ? `<aside class="lead-side ledger" aria-label="The call">${ledger}</aside>` : ''}
      </div>`;
  }

  // Published reports are drawn straight away. Drafts in this browser follow
  // once any page transition is over, and only if one is now the latest.
  let current = LH.publishedSorted();
  render(current);
  function withDrafts({ now = false } = {}) {
    return Promise.all([LH.allReports(), now ? null : LH.afterTransition()]).then(([list]) => {
      if (now || (list[0] && list[0].id) !== (current[0] && current[0].id) || list.some((r) => r.isLocal)) {
        current = list;
        render(list);
      }
    });
  }
  if (LH.isAuthor) withDrafts();
  document.addEventListener('longhand:changed', () => withDrafts({ now: true }));
  window.addEventListener('pageshow', (e) => { if (e.persisted && LH.isAuthor) withDrafts(); });
})();
