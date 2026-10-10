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
        if (reduced.matches || document.hidden) return;
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
  function clearIdentity() { document.querySelectorAll('[data-v2-transition]').forEach((el) => { el.style.viewTransitionName = ''; el.removeAttribute('data-v2-transition'); }); }
  function identityFor(href) {
    try {
      const u = new URL(href, location.href);
      if (u.origin !== location.origin) return null;
      const file = u.pathname.split('/').pop();
      if (['country.html', 'sector.html', 'company.html'].includes(file)) return { name: 'research-identity', selector: '[data-entity-title], h1' };
      const report = window.Longhand?.published().find((r) => new URL(window.Longhand.reportHref(r), base).href === u.href);
      return report ? { name: 'report-title', report } : null;
    } catch (_) { return null; }
  }
  window.addEventListener('pageswap', (e) => {
    if (!e.viewTransition || reduced.matches) return;
    const href = e.activation?.entry?.url;
    // Carry the same geographic object between the front page and the map.
    try {
      const target = new URL(href).pathname.split('/').pop();
      if ((body.classList.contains('page-home') && target === 'coverage.html') || (body.classList.contains('page-coverage') && (target === 'index.html' || !target))) {
        const globe = document.querySelector('.plate-stage'); if (globe) globe.style.viewTransitionName = 'globe';
      }
    } catch (_) {}
    const id = identityFor(href); if (!id) return;
    clearIdentity();
    let link = [...document.querySelectorAll('a[href]')].find((a) => a.href === href && a.getBoundingClientRect().top >= 0 && a.getBoundingClientRect().bottom < innerHeight);
    if (!link) return;
    let title = (id.name === 'research-identity' ? link.closest('.coverage-panel')?.querySelector('h2') : null) || link.querySelector('[data-vt-title], h2, h3') || (link.closest('[data-vt-title]')) || link;
    document.querySelectorAll('[data-vt-title], .reader-title').forEach((el) => { el.style.viewTransitionName = 'none'; });
    title.style.viewTransitionName = id.name; title.dataset.v2Transition = '';
  });
  window.addEventListener('pagereveal', (e) => {
    if (!e.viewTransition || reduced.matches) return;
    const file = location.pathname.split('/').pop();
    if (body.classList.contains('page-home') || body.classList.contains('page-coverage')) {
      const globe = document.querySelector('.plate-stage'); if (globe) globe.style.viewTransitionName = 'globe';
    }
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
  window.addEventListener('pageshow', clearIdentity);
})();
