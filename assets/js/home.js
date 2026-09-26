/* Longhand Research: the front page.
   A single screen: the night plate with its stars, the catalogue in four
   numbers along its foot, and the masthead over it. The Earth itself is drawn
   by earth.js. Every way on leads to another page, where the headline and the
   Earth carry over in the page transition. */
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

  /* A number that rolls up like an odometer when the page opens */
  const odo = (n) => {
    const digits = String(n).split('').map((d) => `<span class="odo-digit"><span class="odo-strip" data-to="${d}">${'0123456789'.split('').map((k) => `<span>${k}</span>`).join('')}</span></span>`).join('');
    return `<span class="sr-only">${n}</span><span class="odo" aria-hidden="true">${digits}</span>`;
  };
  function roll(root) {
    const strips = $$('.odo-strip', root);
    const set = () => strips.forEach((s) => { s.style.transform = `translateY(calc(var(--odo-h) * -${s.dataset.to}))`; });
    if (reduce.matches) {
      strips.forEach((s) => { s.style.transition = 'none'; });
      set();
      return;
    }
    // after the headline has risen, so the eye meets one movement at a time
    const go = () => setTimeout(() => requestAnimationFrame(set), 650);
    if (document.documentElement.classList.contains('is-loading')) document.addEventListener('longhand:loaded', go, { once: true });
    else go();
  }

  /* The catalogue in four numbers; the first and the last are ways in */
  const ledger = $('[data-ledger]', hero);
  function renderLedger() {
    if (!ledger) return;
    const list = LH.publishedSorted();
    if (!list.length) { ledger.hidden = true; return; }
    const kinds = [...new Set(list.map((r) => r.category).filter(Boolean))];
    const markets = [...new Set(list.map((r) => r.exchange).filter(Boolean))];
    const latest = list[0];
    const cell = (label, value, note, href, aria) => `<div><dt>${esc(label)}</dt><dd>${href ? `<a class="ledger-link" href="${esc(href)}" aria-label="${esc(aria)}">${value}</a>` : value}${note ? `<span class="ledger-note">${esc(note)}</span>` : ''}</dd></div>`;
    ledger.innerHTML = [
      cell('Reports', odo(list.length), 'All in the library', 'library.html', `${list.length} reports: browse the library`),
      cell('Kinds of study', odo(kinds.length), kinds.join(', ')),
      cell('Markets', odo(markets.length), markets.length ? markets.join(', ') : 'Sector and macro studies only'),
      cell('Latest', `<time datetime="${esc(latest.date)}">${esc(dateShort(latest.date))}</time>`, latest.title, LH.reportHref(latest), `Latest report: ${latest.title}`),
    ].join('');
    ledger.hidden = false;
    roll(ledger);
  }

  /* The masthead is clear over the plate and turns to smoked glass once the
     page moves (on a phone the plate is taller than the screen) */
  const mast = $('.masthead');
  let ticking = false;
  function update() {
    ticking = false;
    const box = hero.getBoundingClientRect();
    if (mast) mast.classList.toggle('is-over-night', box.bottom > mast.offsetHeight);
    if (reduce.matches) { hero.style.removeProperty('--stars-y'); return; }
    const p = Math.max(0, Math.min(1, -box.top / (box.height || 1)));
    hero.style.setProperty('--stars-y', `${(p * box.height * 0.3).toFixed(1)}px`);
  }
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  };

  /* The opening screen, once per visit: the name, a count and a gold rule that
     follow the Earth's imagery as it arrives, then the screen lifts away.
     It never waits longer than four seconds. */
  const root = document.documentElement;
  const loader = $('[data-loader]');
  if (loader && root.classList.contains('is-loading')) {
    const count = $('[data-loader-count]', loader);
    const bar = $('[data-loader-bar]', loader);
    const start = performance.now();
    let target = 0, shown = 0, finished = false, last = start;
    document.addEventListener('longhand:earth-progress', (e) => { target = Math.max(target, e.detail.done / e.detail.total); });
    const finish = () => {
      if (finished) return;
      finished = true;
      try { sessionStorage.setItem('longhand-loaded', '1'); } catch (e) { /* private mode */ }
      loader.classList.add('is-leaving');
      root.classList.remove('is-loading');
      document.dispatchEvent(new Event('longhand:loaded'));
      const gone = () => loader.remove();
      loader.addEventListener('transitionend', gone, { once: true });
      setTimeout(gone, 1600);
    };
    const tick = (now) => {
      const t = now - start;
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const goal = t > 4000 ? 1 : target;
      // eased by time, not by frames, so a slow machine counts at the same pace
      shown += (goal - shown) * (1 - Math.exp(-dt * 7));
      if (goal - shown < 0.006) shown = goal;
      count.textContent = String(Math.round(shown * 100));
      bar.style.transform = `scaleX(${shown})`;
      if (shown >= 1 && t > 1300) setTimeout(finish, 180);
      else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  } else if (loader) loader.remove();

  renderLedger();
  drawStars();
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  window.addEventListener('pageshow', onScroll);
  new ResizeObserver(() => requestAnimationFrame(drawStars)).observe(hero);
  document.addEventListener('longhand:changed', renderLedger);
  if (reduce.addEventListener) reduce.addEventListener('change', onScroll);
})();
