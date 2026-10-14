/* Country / sector / company use one public discovery surface and ordinary URLs. */
(function () {
  'use strict';
  const LH = window.Longhand, G = window.LonghandGraph;
  const root = document.querySelector('[data-entity-page]');
  if (!root || !LH || !G) return;
  const { esc, dateLong } = LH.util;
  const type = root.dataset.entityPage;
  const params = new URLSearchParams(location.search);
  const id = params.get('id');
  const entity = id && G[type](id);
  const context = { country: params.get('country') || '', sector: params.get('sector') || '' };
  const plural = { country: 'Countries & markets', sector: 'Sectors', company: 'Companies' }[type];
  const filters = entity ? { ...context, [type]: id } : context;
  const coverage = type === 'country' && entity ? G.countryCoverage(id, G.reportsFor(filters)) : null;
  const contextualCountry = coverage && G.countryCoverage(id).primary.length === 0;
  const arrow = '<span aria-hidden="true">↗</span>';
  const link = (t, e, c = filters) => `<a href="${esc(G.urlFor(t, e.id, c))}">${esc(e.name)}</a>`;
  const bread = [`<a href="coverage.html">World</a>`];
  if (type !== 'country' && G.country(context.country)) bread.push(link('country', G.country(context.country)));
  if (type === 'company' && G.sector(context.sector)) bread.push(link('sector', G.sector(context.sector)));
  bread.push(`<span aria-current="page">${esc(entity?.name || plural)}</span>`);
  const heading = (name, description) => `<header class="entity-mast wrap"><nav class="v2-breadcrumb" aria-label="Breadcrumb">${bread.join('<span aria-hidden="true">›</span>')}</nav><p class="eyebrow">${contextualCountry ? 'Trade context' : esc(type[0].toUpperCase() + type.slice(1)) + ' research'}</p><h1 class="page-title" data-entity-title>${esc(name)}</h1><p class="page-lede">${esc(description)}</p>${contextualCountry ? `<p class="discovery-method">No published report focuses on ${esc(entity.name)}. Trade relationships are documented in the reports below.</p>` : ''}`;
  if (id && !entity) {
    root.innerHTML = `${heading('This research context is unavailable.', 'The address does not match a documented country, sector or company.')}<a class="text-link" href="${type}.html">Browse ${esc(plural.toLowerCase())} →</a></header>`;
    return;
  }
  if (!entity) {
    const list = G.entitiesFor(type, { ...filters, primaryCountriesOnly: type === 'country' });
    root.innerHTML = `${heading(plural, 'Explore the documented subjects and relationships in the published research.')}</header><section class="wrap entity-index" aria-label="${esc(plural)}">${list.map((e) => `<a href="${esc(G.urlFor(type, e.id, filters))}"><small>${G.reportsFor({ ...filters, [type]: e.id, primaryCountriesOnly: type === 'country' }).length} ${type === 'country' ? 'reports on this market' : 'connected reports'} ${arrow}</small><h2>${esc(e.name)}</h2><p>${esc(e.description)}</p></a>`).join('')}${!list.length ? '<p>No documented subjects match this context. Return to the <a href="coverage.html">world overview</a> to broaden the search.</p>' : ''}</section>`;
    return;
  }
  const reports = G.reportsFor(filters);
  const calls = type === 'company' ? reports.filter((r) => r.rating && r.ticker === entity.ticker && (!r.exchange || r.exchange.toUpperCase() === 'IDX')) : [];
  document.title = `${entity.name} · Longhand Research`;
  const listing = G.listings.filter((l) => l.companyId === entity.id);
  const primary = reports.filter((r) => G.contextFor(r)[type === 'country' ? 'countries' : type === 'sector' ? 'sectors' : 'companies'].some((e) => e.id === id && e.role === 'primary')).length;
  const meta = `<div class="entity-meta">${type === 'country' ? `<span><strong>${primary}</strong> ${primary === 1 ? 'report' : 'reports'} on this market</span>${coverage.context.length ? `<span>Discussed in ${coverage.context.length} ${coverage.context.length === 1 ? 'other report' : 'other reports'}</span>` : ''}` : `<span><strong>${reports.length}</strong> connected ${reports.length === 1 ? 'report' : 'reports'}</span><span><strong>${primary}</strong> primary-subject ${primary === 1 ? 'report' : 'reports'}</span>`}${listing.map((l) => `<span>${esc(l.exchange)}: <strong>${esc(l.ticker)}</strong></span>`).join('')}${calls[0] ? `<span>Latest published call <strong>${esc(calls[0].rating)}</strong> · ${esc(dateLong(calls[0].date))}</span>` : ''}</div>`;
  function related(t) {
    if (t === type) return '';
    const items = G.entitiesFor(t, filters);
    return items.length ? `<h2>${{ country: 'Geography', sector: 'Sectors', company: 'Companies' }[t]}</h2><nav aria-label="Connected ${t}">${items.map((e) => `<a href="${esc(G.urlFor(t, e.id, filters))}"><span>${esc(e.name)}</span><small>${t === 'country' ? (G.countryCoverage(e.id, reports).primary.length || 'Trade context') : G.reportsFor({ ...filters, [t]: e.id }).length}</small></a>`).join('')}</nav>` : '';
  }
  root.innerHTML = `${heading(entity.name, entity.description)}${meta}</header>
    <div class="wrap entity-layout"><aside class="entity-rail">${related('country')}${related('sector')}${related('company')}<a class="text-link" href="library.html?${new URLSearchParams(Object.entries(filters).filter(([, v]) => v))}">Search this research →</a></aside>
    <section aria-labelledby="entity-research-title"><div class="section-head"><h2 class="section-label" id="entity-research-title">${contextualCountry ? 'Discussed in other research' : 'Published research'}</h2><span class="section-meta">Newest first</span></div>
    <ol class="entity-report-list">${reports.map((r) => {
      const relationship = G.relationships.find((x) => x.reportId === r.id && x.type === type && x.entityId === id);
      return `<li class="entity-report"><span>${esc(LH.catalogueNo(r))}</span><div><p class="entity-report-meta">${esc(r.category)} · <time datetime="${esc(r.date)}">${esc(dateLong(r.date))}</time> · ${relationship?.role === 'primary' ? 'Primary subject' : type === 'country' ? 'Trade context' : 'Research connection'}</p><h3 data-vt-title="${esc(r.id)}"><a href="${esc(LH.reportHref(r))}">${esc(r.title)}</a></h3><p>${esc(LH.util.editorialText(r.blurb || r.summary))}</p>${r.rating ? `<p>Published rating: ${esc(r.rating)} · ${esc(dateLong(r.date))}</p>` : ''}</div>${arrow}</li>`;
    }).join('')}</ol>${!reports.length ? '<p>No published reports match this combination. Broaden the geography or sector using the links above.</p>' : ''}
    <p class="discovery-method">Relationships describe the scope of published research. Company discussions in sector studies do not imply a rating. Publication dates and the individual reports’ observation periods remain distinct.</p>
    <details class="entity-evidence"><summary>Relationship evidence</summary><ul>${[...new Map(G.relationships.filter((r) => r.type === type && r.entityId === id && reports.some((p) => p.id === r.reportId)).flatMap((r) => r.evidence).map((e) => [e.url, e])).values()].map((e) => `<li><a href="${esc(e.url)}">${esc(e.label.replace(/ \/ /g, ' · '))}</a></li>`).join('')}</ul></details></section></div>`;
})();
