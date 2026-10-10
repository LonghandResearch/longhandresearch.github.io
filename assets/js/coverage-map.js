(function () {
  'use strict';
  const G = window.LonghandGraph, LH = window.Longhand;
  if (!G || !LH) return;
  const { esc, dateShort } = LH.util;
  const list = document.querySelector('[data-country-list]'), panel = document.querySelector('[data-coverage-panel]');
  if (!list || !panel) return;
  const primary = G.countries.filter((c) => G.relationships.some((r) => r.type === 'country' && r.entityId === c.id && r.role === 'primary'));
  let selected = new URLSearchParams(location.search).get('country') || '';
  const countryButton = (c) => `<button type="button" data-country="${esc(c.id)}" aria-pressed="${selected === c.id}"><span>${esc(c.name)}</span><small>${G.reportsFor({ country: c.id }).length}</small></button>`;
  list.innerHTML = `<h2>Explore by geography</h2><button type="button" data-country="" aria-pressed="${!selected}"><span>World overview</span><small>↗</small></button>${primary.map(countryButton).join('')}<details${selected && !primary.some((c) => c.id === selected) ? ' open' : ''}><summary>Other research connections</summary><div>${G.countries.filter((c) => !primary.includes(c)).map(countryButton).join('')}</div></details>`;
  function updateGlobe() {
    const earth = window.LonghandEarth;
    if (!earth) return;
    const c = G.country(selected);
    earth.setMarkers(c && !primary.includes(c) ? [...primary, c] : primary);
    if (c) earth.focus(c); else earth.reset();
  }
  function render() {
    const c = G.country(selected), filters = c ? { country: c.id } : {};
    document.querySelectorAll('[data-path]').forEach((link) => {
      const type = link.dataset.path;
      if (type === 'country') link.href = c ? G.urlFor('country', c.id) : 'country.html';
      if (type === 'sector' || type === 'company') link.href = `${type}.html${c ? '?country=' + encodeURIComponent(c.id) : ''}`;
      if (type === 'report') link.href = `library.html${c ? '?country=' + encodeURIComponent(c.id) : ''}`;
      if ((c && type === 'country') || (!c && type === 'world')) link.setAttribute('aria-current', 'step'); else link.removeAttribute('aria-current');
    });
    list.querySelectorAll('[data-country]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.country === selected)));
    if (selected && !c) { panel.innerHTML = '<h2>Geography unavailable</h2><p>This address does not match a documented research relationship. Choose a country or return to the world overview.</p>'; return; }
    const reports = G.reportsFor(filters), companies = G.entitiesFor('company', filters), sectors = G.entitiesFor('sector', filters);
    const primaryReports = c ? reports.filter((r) => G.contextFor(r).countries.some((x) => x.id === c.id && x.role === 'primary')).length : reports.length;
    panel.innerHTML = `<div class="coverage-summary"><p class="eyebrow">${c ? 'World / ' + esc(c.region) : 'The research geography'}</p><h2 data-entity-title>${esc(c?.name || 'A connected view.')}</h2><p>${esc(c?.description || 'Follow the connections between places, industries and companies. Each path leads back to published research.')}</p>
      <div class="coverage-numbers"><span><strong>${reports.length}</strong>${c ? (reports.length === 1 ? 'connected report' : 'connected reports') : 'published reports'}</span><span><strong>${c ? primaryReports : primary.length}</strong>${c ? (primaryReports === 1 ? 'primary-subject report' : 'primary-subject reports') : 'primary geographies'}</span><span><strong>${companies.length}</strong>companies discussed</span></div>
      ${c ? `<a class="btn" href="${G.urlFor('country', c.id)}">Explore ${esc(c.name)} <span aria-hidden="true">→</span></a>` : '<a class="btn" href="library.html">Browse the full Library →</a>'}
      </div><div class="coverage-sector-index"><h3>Follow a sector</h3><nav class="coverage-sectors" aria-label="Research sectors">${sectors.map((s) => `<a href="${G.urlFor('sector', s.id, filters)}"><span>${esc(s.name)}</span><small>${G.reportsFor({ ...filters, sector: s.id }).length} ↗</small></a>`).join('')}</nav>
      </div><div class="coverage-latest-index"><h3>Latest connected research</h3>${reports.slice(0, 2).map((r) => `<a class="coverage-report" href="${esc(LH.reportHref(r))}"><span>${esc(r.category)} · ${esc(dateShort(r.date))}</span><strong data-vt-title="${esc(r.id)}">${esc(r.title)}</strong></a>`).join('')}</div>`;
  }
  function choose(id, push = true) {
    selected = id;
    if (push) { const u = new URL(location.href); if (id) u.searchParams.set('country', id); else u.searchParams.delete('country'); try { history.pushState(history.state, '', u); } catch (_) {} }
    render(); updateGlobe();
    const status = document.querySelector('[data-coverage-status]');
    if (status) status.textContent = selected ? `${G.country(selected)?.name || 'Unknown geography'} selected. ${G.reportsFor({ country: selected }).length} connected reports.` : 'World overview selected.';
  }
  list.addEventListener('click', (e) => { const b = e.target.closest('[data-country]'); if (b) choose(b.dataset.country); });
  document.addEventListener('longhand:globe-select', (e) => choose(e.detail.id));
  document.addEventListener('longhand:globe-ready', updateGlobe);
  document.querySelector('[data-globe-reset]')?.addEventListener('click', () => choose(''));
  window.addEventListener('popstate', () => choose(new URLSearchParams(location.search).get('country') || '', false));
  render(); updateGlobe();
})();
