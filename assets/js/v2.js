/* Shared public chrome. No writes to research or publishing state. */
(function () {
  'use strict';
  const body = document.body;
  // The standalone resource study retains its calculator and existing theme
  // handler. Share only the reader's preference with the public publication.
  if (!body.classList.contains('v2-page') && body.hasAttribute('data-report-publication')) {
    const standaloneTheme = document.getElementById('theme');
    if (standaloneTheme) {
      let saved;
      try { saved = localStorage.getItem('longhand-theme'); } catch (_) {}
      document.documentElement.dataset.theme = saved === 'dark' ? 'dark' : 'light';
      const describe = () => {
        standaloneTheme.setAttribute('aria-label', document.documentElement.dataset.theme === 'dark' ? 'Switch to warm paper theme' : 'Switch to dark theme');
      };
      describe();
      standaloneTheme.addEventListener('click', () => {
        try { localStorage.setItem('longhand-theme', document.documentElement.dataset.theme); } catch (_) {}
        describe();
      });
    }
  }
  if (!body.classList.contains('v2-page')) return;
  const ownScript = document.currentScript;
  const base = ownScript ? new URL('../../', ownScript.src) : new URL('./', location.href);
  const path = (file) => new URL(file, base).href;
  const mast = document.querySelector('.masthead');
  const nav = mast?.querySelector('.site-nav');
  const theme = mast?.querySelector('[data-theme-toggle]');
  if (theme) {
    // Keep the two-theme control available without opening the mobile menu.
    mast.querySelector('.masthead-inner').append(theme);
    const label = document.createElement('span'); label.className = 'theme-label'; theme.append(label);
    const describeTheme = () => {
      const dark = document.documentElement.dataset.theme === 'dark';
      label.textContent = dark ? 'Warm paper' : 'Dark';
      theme.setAttribute('aria-label', dark ? 'Switch to warm paper theme' : 'Switch to dark theme');
      theme.title = dark ? 'Switch to warm paper theme' : 'Switch to dark theme';
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.content = dark ? '#05090b' : '#e8e3d7';
    };
    document.addEventListener('longhand:theme', describeTheme); describeTheme();
  }
  if (nav) {
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'v2-menu-button';
    button.textContent = 'Menu +';
    nav.id ||= 'publication-navigation';
    button.setAttribute('aria-controls', nav.id);
    button.setAttribute('aria-expanded', 'false');
    const close = () => { mast.classList.remove('menu-open'); button.setAttribute('aria-expanded', 'false'); button.textContent = 'Menu +'; };
    button.addEventListener('click', () => {
      const open = button.getAttribute('aria-expanded') !== 'true';
      mast.classList.toggle('menu-open', open); button.setAttribute('aria-expanded', String(open)); button.textContent = open ? 'Close −' : 'Menu +';
    });
    mast.querySelector('.masthead-inner').insertBefore(button, nav);
    mast.classList.add('has-v2-menu');
    mast.addEventListener('keydown', (e) => { if (e.key === 'Escape' && button.getAttribute('aria-expanded') === 'true') { close(); button.focus(); } });
    document.addEventListener('click', (e) => { if (!mast.contains(e.target)) close(); });
    nav.addEventListener('click', (e) => { if (e.target.closest('a')) close(); });
    window.addEventListener('pageshow', close);
  }
  const footer = document.querySelector('.site-footer > .wrap');
  if (footer && !footer.querySelector('.footer-signature')) {
    const signature = document.createElement('div'); signature.className = 'footer-signature';
    const identity = document.createElement('div'); identity.className = 'footer-identity';
    const brand = document.createElement('a'); brand.className = 'footer-brand'; brand.href = path('index.html'); brand.innerHTML = 'Longhand <span>Research</span>'; brand.setAttribute('aria-label', 'Longhand Research, front page');
    const statement = document.createElement('p'); statement.className = 'footer-statement'; statement.textContent = 'Independent research. Published in full.';
    const links = document.createElement('nav'); links.className = 'footer-links'; links.setAttribute('aria-label', 'Publication');
    [['Explore', [['Library', 'library.html'], ['Coverage', 'coverage.html'], ['Wire', 'wire.html']]], ['Publication', [['About Longhand', 'about.html'], ['Follow by RSS', 'feed.xml']]]].forEach(([label, items]) => {
      const group = document.createElement('div'); group.className = 'footer-link-group';
      const heading = document.createElement('p'); heading.textContent = label; group.append(heading);
      items.forEach(([text, href]) => { const a = document.createElement('a'); a.textContent = text; a.href = path(href); group.append(a); });
      links.append(group);
    });
    identity.append(brand, statement); signature.append(identity, links); footer.prepend(signature);
  }
  /* Name only one selected identity. The browser restores document/scroll state on Back. */
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  /* Carry one already-painted Earth between documents. The square crop has
     the same surface/halo proportions at both ends, so it cannot stretch or
     shrink when the live renderer takes over. It contains no research data. */
  const globeStage = document.querySelector('[data-globe-stage]');
  const globePlate = globeStage?.closest('[data-globe]');
  const handoffKey = 'longhand-globe-handoff';
  let globeBridge = null, bridgeFinished = false;
  let outgoingDocument = false, bridgeTimer = 0, finishFlight = null;
  const globePair = (from, to) => {
    try {
      const a = new URL(from, location.href), b = new URL(to, location.href);
      const home = (u) => /\/(?:index\.html)?$/.test(u.pathname);
      const coverage = (u) => /\/coverage\.html$/.test(u.pathname);
      return a.origin === location.origin && b.origin === a.origin &&
        ((home(a) && coverage(b)) || (coverage(a) && home(b)));
    } catch (_) { return false; }
  };
  const sizeBridge = () => {
    if (!globeBridge) return;
    const radius = Math.min(globeStage.clientWidth, globeStage.clientHeight) * (body.classList.contains('page-home') ? .46 : .4);
    globeBridge.style.width = globeBridge.style.height = `${radius * 2.34}px`;
  };
  const clearBridge = () => {
    clearTimeout(bridgeTimer);
    finishFlight?.(); finishFlight = null; window.LONGHAND_GLOBE_FLIGHT = null;
    globeBridge?.remove(); globeBridge = null;
    globeStage?.classList.remove('has-globe-continuity');
    window.LONGHAND_GLOBE_HANDOFF = null;
  };
  const finishBridge = () => {
    if (!globeBridge || !bridgeFinished) return;
    finishFlight?.(); finishFlight = null;
    globeBridge.style.viewTransitionName = 'none';
    if (globeBridge.classList.contains('is-released')) return;
    if (!globePlate.classList.contains('is-ready') && !globePlate.classList.contains('is-unavailable')) return;
    globeStage.classList.remove('has-globe-continuity');
    globeBridge.classList.add('is-released');
    window.LONGHAND_GLOBE_HANDOFF = null;
    window.LonghandEarth?.releaseNavigation();
    bridgeTimer = setTimeout(clearBridge, reduced.matches ? 0 : 240);
  };
  const showBridge = (picture) => {
    clearBridge();
    window.LONGHAND_GLOBE_FLIGHT = new Promise((resolve) => { finishFlight = resolve; });
    globeBridge = document.createElement('div'); globeBridge.className = 'globe-continuity';
    globeBridge.setAttribute('aria-hidden', 'true'); globeBridge.append(picture);
    globeStage.append(globeBridge); globeStage.classList.add('has-globe-continuity');
    bridgeFinished = false; sizeBridge();
  };
  function incomingGlobe() {
    if (!globeStage || reduced.matches) return Promise.resolve();
    let record;
    try {
      const saved = sessionStorage.getItem(handoffKey);
      sessionStorage.removeItem(handoffKey);
      record = JSON.parse(saved);
    } catch (_) { return Promise.resolve(); }
    const quaternion = (q) => Array.isArray(q) && q.length === 4 && q.every(Number.isFinite) && Math.abs(q.reduce((sum, n) => sum + n * n, 0) - 1) < .01;
    if (!record || !Number.isFinite(record.time) || record.to !== location.href || !globePair(record.from, record.to) ||
        record.theme !== document.documentElement.dataset.theme || Date.now() - record.time > 15000 || record.time > Date.now() + 1000 ||
        !quaternion(record.pose?.world) || !quaternion(record.pose?.spin) || !Number.isFinite(record.pose?.cloudShift) || !Number.isFinite(record.pose?.connectionTime) ||
        typeof record.image !== 'string' || record.image.length > 2000000 || !record.image.startsWith('data:image/png;base64,')) return Promise.resolve();
    const earth = window.LonghandEarth;
    let picture;
    if (earth && globePlate.classList.contains('is-ready')) {
      // A restored document already has a renderer: draw the carried pose
      // synchronously, without waiting to decode a new image during Back.
      earth.holdNavigation(record.pose);
      picture = earth.captureNavigationFrame()?.picture;
    }
    if (picture) {
      showBridge(picture); window.LONGHAND_GLOBE_HANDOFF = record.pose;
      return Promise.resolve();
    }
    picture = new Image(); picture.src = record.image;
    showBridge(picture); window.LONGHAND_GLOBE_HANDOFF = record.pose;
    const arrivingBridge = globeBridge;
    // The outgoing painted snapshot makes the flight. Decoding its copy for
    // the landing need not delay or interrupt the incoming first paint.
    return picture.decode().catch(() => {
      if (globeBridge !== arrivingBridge) return;
      window.LONGHAND_VT?.skipTransition();
      clearBridge(); window.LonghandEarth?.releaseNavigation();
    });
  }
  incomingGlobe();
  document.addEventListener('longhand:globe-rendered', finishBridge);
  document.addEventListener('longhand:theme', () => { if (globeBridge && !window.LONGHAND_VT) { clearBridge(); window.LonghandEarth?.releaseNavigation(); } });
  if (globePlate) new MutationObserver(finishBridge).observe(globePlate, { attributes: true, attributeFilter: ['class'] });
  window.addEventListener('resize', sizeBridge);
  // Reveal publication furniture once, without hiding content before JavaScript
  // or animating research figures. Newly filtered catalogue rows also opt in.
  const motionSelector = '.hero-copy, .publication-tile, .home-coverage-intro, .home-coverage-links > a, .report-list > .report, .entity-index > a, .entity-report, .coverage-summary, .coverage-sector-index, .coverage-latest-index, .report-related-list > a, .footer-signature';
  const seenMotion = new WeakSet(), activeMotion = new Set();
  if ('IntersectionObserver' in window && Element.prototype.animate) {
    const reveal = new IntersectionObserver((entries) => {
      let stagger = 0;
      entries.forEach(({ target, isIntersecting }) => {
        if (!isIntersecting) return;
        reveal.unobserve(target);
        // The page transition already introduces everything in its snapshot.
        // Only later scroll/filter reveals need an additional local entrance.
        if (reduced.matches || document.hidden || window.LONGHAND_VT) return;
        const animation = target.animate([
          { opacity: .65, transform: 'translateY(16px)' },
          { opacity: 1, transform: 'translateY(0)' }
        ], { duration: 560, delay: Math.min(stagger++, 3) * 55, easing: 'cubic-bezier(.2,.7,.2,1)' });
        activeMotion.add(animation);
        animation.finished.then(() => activeMotion.delete(animation), () => activeMotion.delete(animation));
      });
    }, { threshold: .12 });
    const registerMotion = (root) => {
      const candidates = [...root.querySelectorAll(motionSelector)];
      if (root.matches?.(motionSelector)) candidates.unshift(root);
      candidates.forEach((el) => { if (!seenMotion.has(el)) { seenMotion.add(el); reveal.observe(el); } });
    };
    registerMotion(document);
    const main = document.querySelector('main');
    if (main) new MutationObserver((records) => records.forEach((record) => {
      if (record.target.closest?.('[data-viewer], .chart, .viewer-pages')) return;
      record.addedNodes.forEach((node) => { if (node.nodeType === 1) registerMotion(node); });
      record.removedNodes.forEach((node) => {
        if (node.nodeType !== 1) return;
        if (node.matches(motionSelector)) reveal.unobserve(node);
        node.querySelectorAll(motionSelector).forEach((el) => reveal.unobserve(el));
      });
    })).observe(main, { childList: true, subtree: true });
    const stopMotion = () => { activeMotion.forEach((animation) => animation.cancel()); activeMotion.clear(); };
    reduced.addEventListener('change', () => { if (reduced.matches) stopMotion(); });
    window.addEventListener('pagehide', stopMotion);
  }
  if (body.hasAttribute('data-report-publication') && mast) {
    const progress = document.createElement('div'); progress.className = 'reading-progress'; progress.setAttribute('aria-hidden', 'true'); mast.append(progress);
    let pending = false;
    const updateProgress = () => {
      pending = false;
      const height = document.documentElement.scrollHeight - innerHeight;
      progress.style.transform = `scaleX(${height > 0 ? Math.min(1, Math.max(0, scrollY / height)) : 0})`;
    };
    const queueProgress = () => { if (!pending) { pending = true; requestAnimationFrame(updateProgress); } };
    window.addEventListener('scroll', queueProgress, { passive: true });
    window.addEventListener('resize', queueProgress); window.addEventListener('pageshow', queueProgress); updateProgress();
  }
  let activatedLink = null;
  document.addEventListener('click', (e) => {
    if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
    activatedLink = e.target.closest?.('a[href]') || null;
  }, true);
  const onScreen = (el) => { const r = el.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; };
  function clearIdentity() { document.querySelectorAll('[data-v2-transition]').forEach((el) => { el.style.viewTransitionName = ''; el.removeAttribute('data-v2-transition'); }); }
  function identityFor(href) {
    try {
      const u = new URL(href, location.href);
      if (u.origin !== location.origin) return null;
      const file = u.pathname.split('/').pop();
      if (['country.html', 'sector.html', 'company.html'].includes(file)) return { name: 'research-identity', entity: file };
      const report = window.Longhand?.published().find((r) => new URL(window.Longhand.reportHref(r), base).href === u.href);
      return report ? { name: 'report-title', report } : null;
    } catch (_) { return null; }
  }
  window.addEventListener('pageswap', (e) => {
    if (!e.viewTransition || reduced.matches) return;
    const href = e.activation?.entry?.url;
    outgoingDocument = true;
    try {
      sessionStorage.removeItem(handoffKey);
      const bounds = globeStage?.getBoundingClientRect();
      if (globePair(location.href, href) && bounds && bounds.bottom > 0 && bounds.top < innerHeight) {
        const frame = window.LonghandEarth?.captureNavigationFrame();
        if (frame) {
          sessionStorage.setItem(handoffKey, JSON.stringify({ from: location.href, to: href, time: Date.now(),
            theme: document.documentElement.dataset.theme, pose: frame.pose, image: frame.picture.toDataURL('image/png') }));
          showBridge(frame.picture);
          window.LonghandEarth.holdNavigation();
        }
      }
    } catch (_) { /* Storage/readback unavailable: keep ordinary page navigation. */ }
    let link = activatedLink; activatedLink = null;
    const id = identityFor(href); if (!id) return;
    clearIdentity();
    if (!link?.isConnected || link.href !== href || !onScreen(link)) link = [...document.querySelectorAll('a[href]')].find((a) => a.href === href && onScreen(a));
    if (!link) return;
    const countryTitle = id.entity === 'country.html' ? link.closest('.coverage-panel')?.querySelector('h2') : null;
    const title = (countryTitle && onScreen(countryTitle) ? countryTitle : null) || link.querySelector('[data-vt-title], h2, h3') || link.closest('[data-vt-title]') || link.querySelector(':scope > span:not([aria-hidden])') || link;
    document.querySelectorAll('[data-vt-title], .reader-title').forEach((el) => { el.style.viewTransitionName = 'none'; });
    title.style.viewTransitionName = id.name; title.dataset.v2Transition = '';
  });
  window.addEventListener('pagereveal', (e) => {
    const vt = e.viewTransition;
    if (outgoingDocument) {
      clearBridge(); window.LonghandEarth?.releaseNavigation();
      incomingGlobe(); outgoingDocument = false;
    }
    if (!vt) { bridgeFinished = true; finishBridge(); return; }
    const root = document.documentElement;
    window.LONGHAND_VT = vt;
    root.classList.add('publication-nav-vt');
    const activation = window.navigation?.activation;
    if (activation?.navigationType === 'traverse' && activation.from && activation.entry && activation.entry.index < activation.from.index) root.dataset.nav = 'back';
    const finish = () => {
      root.classList.remove('publication-nav-vt');
      if (window.LONGHAND_VT === vt) { window.LONGHAND_VT = null; delete root.dataset.nav; }
      bridgeFinished = true; finishBridge();
    };
    vt.finished.then(finish, finish);
    if (reduced.matches) return;
    // A data-only report may still be fetching its edition. Retain its loading
    // UI instead of animating an empty shared title that will jump later.
    if (body.hasAttribute('data-report-publication') && !document.querySelector('main h1')) { vt.skipTransition(); return; }
    const file = location.pathname.split('/').pop();
    if (body.hasAttribute('data-report-publication') && !document.querySelector('.reader-title')) {
      const title = document.querySelector('main h1');
      if (title) { title.style.viewTransitionName = 'report-title'; title.dataset.v2Transition = ''; }
    }
    if (['country.html', 'sector.html', 'company.html'].includes(file)) {
      const title = document.querySelector('[data-entity-title], h1');
      if (title) { title.style.viewTransitionName = 'research-identity'; title.dataset.v2Transition = ''; }
    }
    e.viewTransition.finished.then(clearIdentity, clearIdentity);
  });
  window.addEventListener('pageshow', () => {
    activatedLink = null;
    clearIdentity();
    // Also finish if the browser revealed the document before this deferred
    // script registered its pagereveal listener. Never strand the renderer.
    if (globeBridge && !bridgeFinished) {
      const finish = () => { bridgeFinished = true; finishBridge(); };
      const vt = window.LONGHAND_VT;
      if (vt) vt.finished.then(finish, finish); else finish();
    }
  });
})();
