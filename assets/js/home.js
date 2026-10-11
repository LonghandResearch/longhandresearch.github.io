/* Longhand Research: the front page.
   The Earth is drawn by earth.js. This file draws the quiet star field and
   places the newest published report beside the introduction. */
(function () {
  'use strict';

  const LH = window.Longhand;
  const hero = document.querySelector('[data-hero]');
  if (!LH || !hero) return;
  const { $, esc, dateShort } = LH.util;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* Stars, drawn once to the size of the plate. The generator is seeded, so
     they keep their places from one visit to the next. */
  const sky = $('[data-stars]', hero);
  let skyW = 0, skyH = 0;
  function drawStars(force = false) {
    const w = hero.clientWidth;
    const h = hero.clientHeight;
    if (!sky || !w || !h || (!force && w === skyW && Math.abs(h - skyH) < 40)) return;
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
    const paper = document.documentElement.dataset.theme === 'light';
    const n = Math.round((w * h) / 6000);
    for (let i = 0; i < n; i++) {
      const x = rand() * w;
      const y = rand() * h;
      const bright = rand() < 0.09;
      const r = bright ? 0.80 + rand() * 0.35 : 0.30 + rand() * 0.40;
      const a = bright ? 0.55 + rand() * 0.25 : 0.20 + rand() * 0.38;
      ctx.fillStyle = paper ? `rgba(78, 101, 82, ${a})` : `rgba(234, 232, 221, ${a})`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /* A real publication gives the opening screen its point of view. */
  const latest = $('[data-latest]', hero);
  function renderLatest() {
    if (!latest) return;
    const report = LH.publishedSorted()[0];
    if (!report) { latest.hidden = true; return; }
    const details = [report.ticker, report.category].filter(Boolean).join(' · ');
    latest.innerHTML = `
      <p class="home-latest-label">Latest report <time datetime="${esc(report.date)}">${esc(dateShort(report.date))}</time></p>
      <a class="home-latest-title" href="${esc(LH.reportHref(report))}">${esc(report.title)}</a>
      ${details ? `<p class="home-latest-meta">${esc(details)}</p>` : ''}`;
    latest.hidden = false;
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

  renderLatest();
  drawStars();
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  window.addEventListener('pageshow', onScroll);
  new ResizeObserver(() => requestAnimationFrame(drawStars)).observe(hero);
  document.addEventListener('longhand:changed', renderLatest);
  document.addEventListener('longhand:theme', () => drawStars(true));
  if (reduce.addEventListener) reduce.addEventListener('change', onScroll);
})();
