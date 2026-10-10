/* Shared public chrome. No writes to research or publishing state. */
(function () {
  'use strict';
  const body = document.body;
  if (!body.classList.contains('v2-page')) return;
  const ownScript = document.currentScript;
  const base = ownScript ? new URL('../../', ownScript.src) : new URL('./', location.href);
  const path = (file) => new URL(file, base).href;
  const mast = document.querySelector('.masthead');
  const nav = mast?.querySelector('.site-nav');
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
    const statement = document.createElement('p'); statement.className = 'footer-statement'; statement.textContent = 'Independent research. Published in full.';
    const links = document.createElement('nav'); links.className = 'footer-links'; links.setAttribute('aria-label', 'Publication');
    [['Library', 'library.html'], ['Coverage', 'coverage.html'], ['Wire', 'wire.html'], ['About', 'about.html'], ['RSS', 'feed.xml']].forEach(([label, href]) => { const a = document.createElement('a'); a.textContent = label; a.href = path(href); links.append(a); });
    signature.append(statement, links); footer.prepend(signature);
  }
  /* Name only one selected identity. The browser restores document/scroll state on Back. */
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
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
