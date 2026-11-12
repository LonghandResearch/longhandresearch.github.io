/* Longhand Research: the opening scene.
   Plays the growing-tree film once (landscape or portrait, night or day to
   match the theme), then a four-second loop of the grown tree. Reduced motion,
   Save-Data, a blocked autoplay or a failed load all show the grown tree as a
   still instead (a background set in home-grove.css). */
(function () {
  'use strict';
  const grove = document.querySelector('[data-grove]');
  if (!grove) return;
  const film = grove.querySelector('[data-grove-film]');
  const loop = grove.querySelector('[data-grove-loop]');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const tall = window.matchMedia('(max-aspect-ratio: 4/5)');
  const saveData = navigator.connection && navigator.connection.saveData;
  const VERSION = '2026-11-13detail';

  /* The newest publication, from the catalogue */
  const LH = window.Longhand;
  const latest = grove.querySelector('[data-grove-latest]');
  const count = grove.querySelector('[data-grove-count]');
  function renderLatest() {
    if (!LH || !latest) return;
    const reports = LH.publishedSorted();
    const report = reports[0];
    if (!report) { latest.hidden = true; return; }
    latest.href = LH.reportHref(report);
    latest.innerHTML = `<span>The newest report</span><b>${LH.util.esc(report.title)}</b>`;
    latest.hidden = false;
    /* The real size of the library, counted from the catalogue */
    const first = LH.util.parseISO(reports[reports.length - 1].date);
    if (count && first) {
      const since = first.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
      count.textContent = `${reports.length} reports since ${since}: company initiations, sector studies and a weekly read of the Indonesian market.`;
    }
  }
  renderLatest();
  document.addEventListener('longhand:changed', renderLatest);

  const kind = tall.matches ? 'portrait' : 'land';
  const day = () => document.documentElement.dataset.theme === 'light';
  const filmSrc = (isLoop) => `assets/video/tree-${kind}${day() ? '-day' : ''}${isLoop ? '-loop' : ''}.mp4?v=${VERSION}`;

  function unload(v) { v.pause(); v.removeAttribute('src'); v.load(); }
  function still() {
    grove.classList.remove('is-motion', 'is-playing', 'is-looping', 'is-grown');
    grove.classList.add('is-still');
    film.removeEventListener('error', still);
    grove.querySelectorAll('video').forEach(unload);
  }
  if (!film || !loop || reduce.matches || saveData || !film.canPlayType('video/mp4')) { still(); return; }

  grove.classList.add('is-motion');
  film.src = filmSrc(false);
  film.preload = 'auto';
  film.addEventListener('error', still);

  /* After the growth, a four-second loop: the leaves move in the air and, at
     night, the lantern flickers and the fireflies drift. Its first frame
     follows the growth film's last, so the hand-over cannot be seen. If it
     fails, the grown tree simply rests. */
  let onScreen = true;
  function playLoop() { if (onScreen && !reduce.matches) loop.play().catch(() => {}); }
  film.addEventListener('playing', () => {
    grove.classList.add('is-playing');
    if (loop.getAttribute('src')) return;
    loop.src = filmSrc(true);
    loop.preload = 'auto';
    loop.load();
  }, { once: true });
  film.addEventListener('ended', () => { grove.classList.add('is-grown'); playLoop(); });
  loop.addEventListener('playing', () => {
    grove.classList.add('is-looping');
    /* Fetch the other theme's grown tree now, so a switch shows it at once */
    const other = `assets/img/landing/tree-${kind}${day() ? '' : '-day'}-end.webp?v=${VERSION}`;
    new Image().src = other;
  });
  loop.addEventListener('error', () => grove.classList.remove('is-looping'));
  /* No motion off screen: the loop rests while the opening is scrolled away */
  if ('IntersectionObserver' in window) new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
    if (!grove.classList.contains('is-looping')) return;
    if (onScreen) loop.play().catch(() => {}); else loop.pause();
  }).observe(grove);

  /* A theme switch changes the time of day: the grown tree of the new theme
     shows at once (the switch's reveal captures it), then its loop takes over */
  document.addEventListener('longhand:theme', () => {
    if (grove.classList.contains('is-still')) return;
    film.removeEventListener('error', still);
    unload(film);
    grove.classList.remove('is-playing', 'is-looping');
    grove.classList.add('is-grown');
    loop.src = filmSrc(true);
    loop.load();
    playLoop();
  });

  const started = film.play();
  if (started && started.catch) started.catch(still);
  reduce.addEventListener?.('change', (e) => { if (e.matches) still(); });
})();
