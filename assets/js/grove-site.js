/* Longhand Research: the hill at the head of the inner pages, in the wind.
   The still picture (a background in grove-site.css) shows first. A
   four-second loop rendered in Blender, the leaves and the grass moving and
   the small tree leaning with the gusts, takes over once it plays. Its first
   frame is the still, so the change cannot be seen. Reduced motion, Save-Data
   or a failed load keep the still. The loop rests while it is off screen. */
(function () {
  'use strict';
  const VERSION = '2026-11-13hamlet';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const saveData = navigator.connection && navigator.connection.saveData;
  const script = document.currentScript;
  const base = script ? new URL('../video/', script.src) : new URL('assets/video/', document.baseURI);
  const src = () => new URL(`horizon-wind-${document.documentElement.dataset.theme === 'light' ? 'day' : 'night'}.mp4?v=${VERSION}`, base).href;

  let video = null, head = null, onScreen = true;
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
    if (!video) return;
    if (onScreen) play(); else video.pause();
  }) : null;

  function still() {
    if (head) head.classList.remove('is-windy');
    if (video) { video.pause(); video.removeAttribute('src'); video.load(); }
  }
  function start() {
    if (!video || reduce.matches || saveData) return still();
    video.src = src();
    video.load();
    play();
  }
  // A refused play (a tab in the background, a blocked autoplay) leaves the
  // still in place and tries again when the page is seen
  function play() {
    if (video?.getAttribute('src') && onScreen && !document.hidden) video.play().catch(() => {});
  }
  document.addEventListener('visibilitychange', play);
  let hill = null;
  function attach() {
    const h = document.querySelector('body.grove-site :is(.page-head, .entity-mast)');
    if (!h || h === head) return;
    if (io && head) io.unobserve(head);
    head = h;
    hill = document.createElement('div');
    hill.className = 'grove-hill';
    hill.setAttribute('aria-hidden', 'true');
    head.appendChild(hill);
    head.classList.add('has-hill');
    if (!video) {
      video = document.createElement('video');
      video.className = 'grove-horizon';
      video.muted = true; video.loop = true; video.playsInline = true;
      video.preload = 'auto'; video.tabIndex = -1;
      video.setAttribute('aria-hidden', 'true');
      video.addEventListener('playing', () => head && head.classList.add('is-windy'));
      video.addEventListener('error', still);
    }
    if (!video.canPlayType('video/mp4')) return;
    hill.appendChild(video);
    if (io) io.observe(head);
    start();
  }
  // Leaving for another page: a hill scrolled out of sight should not fly in
  // from off screen, so it leaves with the page instead of being carried
  window.addEventListener('pageswap', (e) => {
    if (!e.viewTransition || !hill) return;
    const r = hill.getBoundingClientRect();
    if (r.bottom < 0 || r.top > window.innerHeight) hill.style.viewTransitionName = 'none';
  });

  attach();
  // The coverage pages draw their heading after the catalogue loads
  const main = document.getElementById('main');
  if (main) new MutationObserver(attach).observe(main, { childList: true });
  // A theme switch: hide the loop at once, so the reveal never shows the
  // other time of day's frame, and let the new loop take over when it plays
  document.addEventListener('longhand:theme', () => {
    if (!video?.getAttribute('src')) return;
    head?.classList.remove('is-windy');
    start();
  });
  reduce.addEventListener?.('change', (e) => { if (e.matches) still(); else start(); });
})();
