(function () {
  'use strict';
  const G = window.LonghandGraph, LH = window.Longhand;
  if (!G || !LH) return;
  const { esc, dateShort } = LH.util;
  const list = document.querySelector('[data-country-list]'), panel = document.querySelector('[data-coverage-panel]');
  if (!list || !panel) return;
  const primary = G.countries.filter((c) => G.relationships.some((r) => r.type === 'country' && r.entityId === c.id && r.role === 'primary'));
  let selected = new URLSearchParams(location.search).get('country') || '';
  const countryButton = (c) => {
    const count = G.reportsFor({ country: c.id }).length;
    return `<button type="button" data-country="${esc(c.id)}" aria-label="${esc(c.name)}, ${count} connected ${count === 1 ? 'report' : 'reports'}" aria-pressed="${selected === c.id}"><span>${esc(c.name)}</span><small aria-hidden="true">${count}</small></button>`;
  };
  list.innerHTML = `<h2 class="sr-only">Explore by geography</h2><button type="button" data-country="" aria-label="World overview, ${G.reportsFor().length} published reports" aria-pressed="${!selected}"><span>World</span><small aria-hidden="true">${G.reportsFor().length}</small></button>${primary.map(countryButton).join('')}<span data-connected-country></span><details><summary>Other connections</summary><div>${G.countries.filter((c) => !primary.includes(c)).map(countryButton).join('')}</div></details>`;
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
    const connected = list.querySelector('[data-connected-country]');
    const connectedId = c && !primary.includes(c) ? c.id : '';
    if (connected.dataset.country !== connectedId) {
      connected.dataset.country = connectedId;
      connected.innerHTML = connectedId ? countryButton(c) : '';
    }
    list.querySelectorAll('[data-country]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.country === selected)));
    if (selected && !c) { panel.innerHTML = '<h2>Geography unavailable</h2><p>This address does not match a documented research relationship. Choose a country or return to the world overview.</p>'; return; }
    const reports = G.reportsFor(filters), companies = G.entitiesFor('company', filters), sectors = G.entitiesFor('sector', filters);
    const primaryReports = c ? reports.filter((r) => G.contextFor(r).countries.some((x) => x.id === c.id && x.role === 'primary')).length : reports.length;
    const statistic = (count, label, url) => url && count ? `<a href="${esc(url)}"><strong>${count}</strong><span>${label}</span></a>` : `<span><strong>${count}</strong><span>${label}</span></span>`;
    const scope = c ? `${primaryReports} ${primaryReports === 1 ? 'report features' : 'reports feature'} ${c.name} as a primary subject.` : 'Primary geographies identify the central subjects of reports.';
    panel.innerHTML = `<div class="coverage-summary"><p class="eyebrow">${c ? esc(c.region) + (primary.includes(c) ? ' · Primary geography' : ' · Related geography') : 'Research index'}</p><h2 data-entity-title>${esc(c?.name || 'World overview')}</h2><p>${esc(c?.description || 'Follow the connections between places, industries and companies. Each path leads back to published research.')}</p>
      <div class="coverage-numbers">${statistic(reports.length, c ? (reports.length === 1 ? 'Connected report' : 'Connected reports') : 'Publications', `library.html${c ? '?country=' + encodeURIComponent(c.id) : ''}`)}${c ? statistic(sectors.length, sectors.length === 1 ? 'Sector' : 'Sectors', `sector.html?country=${encodeURIComponent(c.id)}`) : statistic(primary.length, 'Primary geographies')}${statistic(companies.length, companies.length === 1 ? 'Company discussed' : 'Companies discussed', `company.html${c ? '?country=' + encodeURIComponent(c.id) : ''}`)}</div>
      <p class="coverage-scope">${esc(scope)}</p>
      ${c ? `<a class="btn" href="${G.urlFor('country', c.id)}">Explore ${esc(c.name)} <span aria-hidden="true">→</span></a>` : '<a class="btn" href="library.html">Browse the full Library →</a>'}
      </div><div class="coverage-latest-index"><h3>${c ? 'Latest connected research' : 'Latest publications'}</h3>${reports.slice(0, 2).map((r) => {
        const cover = window.LonghandArt?.coverHTML(r, { sizes: '58px' }) || '';
        return `<a class="coverage-report${cover ? '' : ' is-text-only'}" href="${esc(LH.reportHref(r))}">${cover}<span class="coverage-report-copy"><span class="coverage-report-meta">${esc(r.category)} · <time datetime="${esc(r.date)}">${esc(dateShort(r.date))}</time></span><strong data-vt-title="${esc(r.id)}">${esc(r.title)}</strong></span></a>`;
      }).join('')}</div><div class="coverage-sector-index"><h3>Follow a sector</h3><nav class="coverage-sectors" aria-label="Research sectors">${sectors.map((s) => `<a href="${G.urlFor('sector', s.id, filters)}"><span>${esc(s.name)}</span><small>${G.reportsFor({ ...filters, sector: s.id }).length} <span aria-hidden="true">↗</span></small></a>`).join('')}</nav></div>`;
  }
  function choose(id, push = true) {
    selected = id;
    if (push) { const u = new URL(location.href); if (id) u.searchParams.set('country', id); else u.searchParams.delete('country'); try { history.pushState(history.state, '', u); } catch (_) {} }
    render(); updateGlobe();
    const status = document.querySelector('[data-coverage-status]');
    if (status) status.textContent = selected ? `${G.country(selected)?.name || 'Unknown geography'} selected. ${G.reportsFor({ country: selected }).length} connected reports.` : 'World overview selected.';
  }
  list.addEventListener('click', (e) => {
    const b = e.target.closest('[data-country]');
    if (!b) return;
    const disclosure = b.closest('details');
    choose(b.dataset.country);
    if (disclosure) {
      disclosure.open = false;
      list.querySelector(`[data-connected-country] [data-country="${b.dataset.country}"]`)?.focus({ preventScroll: true });
    }
  });
  document.addEventListener('longhand:globe-select', (e) => choose(e.detail.id));
  document.addEventListener('longhand:globe-ready', updateGlobe);
  document.querySelector('[data-globe-reset]')?.addEventListener('click', () => choose(''));
  window.addEventListener('popstate', () => choose(new URLSearchParams(location.search).get('country') || '', false));
  render(); updateGlobe();
})();
