/* Public discovery metadata only. The catalogue remains the publication record.
   Every relationship is curated from an existing report; mentions are not ratings.
   See docs/research-graph.md for scope and maintenance. No fetch: works on file:. */
(function () {
  'use strict';
  const countries = [
    { id: 'ID', name: 'Indonesia', lat: -2, lon: 116, region: 'Asia', description: 'Company research, market updates and the infrastructure behind an industrial economy.' },
    { id: 'US', name: 'United States', lat: 39, lon: -98, region: 'Americas', description: 'Treasury repricing, monetary policy and their effects across the economy.' },
    { id: 'CN', name: 'China', lat: 35, lon: 104, region: 'Asia', description: 'Coal demand and product-specific nickel destinations in Indonesia’s export research.' },
    { id: 'IN', name: 'India', lat: 23, lon: 79, region: 'Asia', description: 'Coal demand, import substitution and a recorded Indonesian ferronickel destination.' },
    { id: 'PH', name: 'Philippines', lat: 13, lon: 122, region: 'Asia', description: 'A recorded destination in the coal study’s BPS export series.' },
    { id: 'KR', name: 'South Korea', lat: 36, lon: 128, region: 'Asia', description: 'A recorded destination in Indonesian coal and selected nickel-product trade.' },
    { id: 'MY', name: 'Malaysia', lat: 4, lon: 102, region: 'Asia', description: 'A recorded coal destination, with distinct buyer and delivery requirements.' },
    { id: 'JP', name: 'Japan', lat: 37, lon: 138, region: 'Asia', description: 'Coal procurement and a significant recorded destination for Indonesian nickel matte.' },
    { id: 'NL', name: 'Netherlands', lat: 52.1, lon: 5.3, region: 'Europe', description: 'A recorded destination for Indonesian ferronickel and nickel matte in 2024; not proof of final consumption.' },
    { id: 'NO', name: 'Norway', lat: 61, lon: 9, region: 'Europe', description: 'A recorded destination for Indonesian nickel matte in 2024; not mine-level shipment provenance.' },
    { id: 'TW', name: 'Taiwan', lat: 24, lon: 121, region: 'Asia', description: 'A purchasing market reported separately in the BPS destination statistics.' },
    { id: 'TH', name: 'Thailand', lat: 15, lon: 101, region: 'Asia', description: 'A recorded ASEAN destination in the coal study’s export series.' },
    { id: 'HK', name: 'Hong Kong', lat: 22, lon: 114, region: 'Asia', description: 'A statistical destination kept separate, following the BPS source definition.' },
    { id: 'ES', name: 'Spain', lat: 40, lon: -4, region: 'Europe', description: 'A small recorded European outlet in the coal export study.' },
    { id: 'VN', name: 'Viet Nam', lat: 16, lon: 106, region: 'Asia', description: 'Regional coal-demand context. The report does not assign a bilateral BPS volume.' },
  ];
  const sectors = [
    { id: 'ai-infrastructure', name: 'AI infrastructure', description: 'Data centres, delivery milestones and the physical resources required by compute.' },
    { id: 'digital-infrastructure', name: 'Digital infrastructure', description: 'Networks, telecom operators, towers and the economics of connectivity.' },
    { id: 'power-utilities', name: 'Power & utilities', description: 'Electricity, grid access and water as operating constraints.' },
    { id: 'industrial-land', name: 'Industrial land', description: 'Industrial estates and the role of land in infrastructure delivery.' },
    { id: 'coal-mining', name: 'Coal & mining', description: 'Demand, trade, producer economics and the investment case for industrial assets.' },
    { id: 'nickel-industry', name: 'Nickel industry', description: 'Mining, processing, export destinations, battery materials and domestically retained value.' },
    { id: 'rates-macro', name: 'Rates & macro', description: 'Monetary policy, financial conditions, currency and equity-market observations.' },
    { id: 'memory-semiconductors', name: 'Memory & semiconductors', description: 'DRAM, NAND and HBM through the memory cycle and AI demand.' },
  ];
  const company = (id, name, ticker, sectorIds, description, evidence) => ({ id, name, ticker, countryIds: ['ID'], sectorIds, domicileCountryId: null, description, evidence });
  const pbaiEvidence = [{ url: 'power-behind-ai.html#s06', label: 'Listed company exposure / September assessment' }];
  const companies = [
    company('sinergi-inti-andalan-prima', 'Sinergi Inti Andalan Prima Tbk', 'INET', ['digital-infrastructure'], 'Internet and network infrastructure, examined in the published company initiation.', [{ url: 'report.html?id=inet-2026-09-27', label: 'INET initiation / catalogue and full report' }]),
    company('alamtri-resources-indonesia', 'Alamtri Resources Indonesia Tbk', 'ADRO', ['coal-mining'], 'Metallurgical coal, mining services and aluminium, as described in the company initiation.', [{ url: 'report.html?id=adro-2026-09-03', label: 'ADRO initiation / catalogue and full report' }]),
    company('dci-indonesia', 'DCI Indonesia', 'DCII', ['ai-infrastructure'], 'Colocation data-centre operator, examined in the infrastructure assessment and October checkpoint.', pbaiEvidence),
    company('telkom-indonesia', 'Telkom Indonesia', 'TLKM', ['digital-infrastructure', 'ai-infrastructure'], 'Telecom group with network, tower and data-centre businesses examined in the infrastructure research.', pbaiEvidence),
    company('indosat-ooredoo-hutchison', 'Indosat Ooredoo Hutchison', 'ISAT', ['digital-infrastructure', 'ai-infrastructure'], 'Telecom operator with joint-venture data-centre and AI-platform exposure examined in the research.', pbaiEvidence),
    company('xlsmart-telecom-sejahtera', 'XLSMART Telecom Sejahtera', 'EXCL', ['digital-infrastructure'], 'Mobile and fixed connectivity. The September study identifies no disclosed data-centre campus.', pbaiEvidence),
    company('dayamitra-telekomunikasi', 'Dayamitra Telekomunikasi (Mitratel)', 'MTEL', ['digital-infrastructure'], 'Towers and fibre. The September study describes indirect connectivity exposure.', pbaiEvidence),
    company('puradelta-lestari', 'Puradelta Lestari', 'DMAS', ['industrial-land'], 'Industrial land at Kota Deltamas, examined as one part of the infrastructure chain.', pbaiEvidence),
    company('kawasan-industri-jababeka', 'Kawasan Industri Jababeka', 'KIJA', ['industrial-land', 'power-utilities'], 'Industrial estates and Bekasi Power, examined in the infrastructure research.', pbaiEvidence),
    company('pertamina-geothermal-energy', 'Pertamina Geothermal Energy', 'PGEO', ['power-utilities'], 'Geothermal power generation. The September study identifies no data-centre supply contract.', pbaiEvidence),
    company('bukit-asam', 'Bukit Asam', 'PTBA', ['coal-mining', 'power-utilities'], 'Coal and power interests, with a separate operating and cash-flow case in the coal study.', pbaiEvidence),
    company('dian-swastatika-sentosa', 'Dian Swastatika Sentosa', 'DSSA', ['coal-mining', 'digital-infrastructure', 'ai-infrastructure'], 'A diversified group spanning coal, energy and digital infrastructure in the published assessment.', pbaiEvidence),
    company('bayan-resources', 'Bayan Resources', '', ['coal-mining'], 'A producer case study comparing operating prices, costs and cash economics.', [{ url: 'coal-in-transition.html#bayan-heading', label: 'Bayan Resources / company evidence' }]),
  ];
  // A listing is a distinct identity. No domicile is inferred from the exchange.
  const listings = companies.filter((c) => c.ticker).map((c) => ({ id: `IDX:${c.ticker}`, companyId: c.id, ticker: c.ticker, exchange: 'IDX', countryId: 'ID', evidence: c.evidence }));
  const relationships = [];
  function link(reportId, type, entityIds, role, url, label) {
    entityIds.forEach((entityId) => relationships.push({ reportId, type, entityId, role, evidence: [{ url, label }] }));
  }
  const pbai = 'the-power-behind-ai-2026-09-24';
  const update = 'the-power-behind-ai-update-2026-10-09';
  const coal = 'coal-in-transition-2026-10-08';
  const power = 'indonesia-ai-power-water-2026-10-05';
  const catalogue = (id) => `report.html?id=${encodeURIComponent(id)}`;
  [pbai, update].forEach((id) => {
    const url = id === pbai ? 'power-behind-ai.html#s06' : 'power-behind-ai-update-2026-10-09.html#prices';
    link(id, 'country', ['ID'], 'primary', url, 'Indonesia infrastructure assessment');
    link(id, 'sector', ['ai-infrastructure'], 'primary', url, 'AI infrastructure research');
    link(id, 'sector', ['digital-infrastructure', 'power-utilities', 'industrial-land', 'coal-mining'], 'material', url, 'Company exposures within the infrastructure study');
    link(id, 'company', companies.slice(2, 12).map((c) => c.id), 'material', url, 'Company examination in a sector study; no recommendation');
  });
  link(coal, 'country', ['ID'], 'primary', 'coal-in-transition.html#indonesia', 'Indonesia export position');
  link(coal, 'country', ['CN', 'IN', 'PH', 'KR', 'MY', 'JP', 'TW', 'TH', 'HK', 'ES', 'VN'], 'material', 'coal-in-transition.html#atlas', 'Export destinations and regional context, following the report’s definitions');
  link(coal, 'sector', ['coal-mining'], 'primary', 'coal-in-transition.html#research-letter', 'Coal sector study');
  link(coal, 'company', ['bayan-resources', 'bukit-asam'], 'material', 'coal-in-transition.html#company-evidence', 'Company evidence cases; no rating');
  link('more-nickel-2026-10-15', 'country', ['ID'], 'primary', 'more-nickel.html#thesis', 'Indonesia nickel industry study');
  link('more-nickel-2026-10-15', 'country', ['CN', 'IN', 'KR', 'JP', 'NL', 'NO'], 'material', 'more-nickel.html#trade', '2024 WITS recorded product destinations, not final consumption or cargo routes');
  link('more-nickel-2026-10-15', 'sector', ['nickel-industry'], 'primary', 'more-nickel.html#chain', 'Nickel processing and domestic industrial value; no issuer rating');
  link(power, 'country', ['ID'], 'primary', 'indonesia-ai-datacenter-research/interactive/index.html', 'Indonesia resource study');
  link(power, 'sector', ['ai-infrastructure', 'power-utilities'], 'primary', 'indonesia-ai-datacenter-research/interactive/index.html', 'Electricity, water and data-centre resource scenarios');
  [['inet-2026-09-27', 'sinergi-inti-andalan-prima', 'digital-infrastructure'], ['adro-2026-09-03', 'alamtri-resources-indonesia', 'coal-mining']].forEach(([id, companyId, sectorId]) => {
    link(id, 'country', ['ID'], 'primary', catalogue(id), 'Company initiation / Indonesia research');
    link(id, 'company', [companyId], 'primary', catalogue(id), 'Published company initiation');
    link(id, 'sector', [sectorId], 'primary', catalogue(id), 'Sector identified in the catalogue');
  });
  ['ihsg-weekly-2026-09-25', 'ihsg-weekly-2026-10-02', 'ihsg-weekly-2026-10-09', 'ihsg-weekly-2026-10-16'].forEach((id) => {
    link(id, 'country', ['ID'], 'primary', catalogue(id), 'Indonesia equity-market update');
    link(id, 'sector', ['rates-macro'], 'primary', catalogue(id), 'Market and currency observations; IHSG is an index, not a company');
  });
  link('us-treasury-update-2026-10-08', 'country', ['US'], 'primary', catalogue('us-treasury-update-2026-10-08'), 'US Treasury and economic-activity study');
  link('us-treasury-update-2026-10-08', 'sector', ['rates-macro'], 'primary', catalogue('us-treasury-update-2026-10-08'), 'Rates and financial conditions');
  link('macro-2026-09-24', 'country', ['ID', 'US'], 'primary', catalogue('macro-2026-09-24'), 'Bank Indonesia and Federal Reserve policy in the published abstract');
  link('macro-2026-09-24', 'sector', ['rates-macro'], 'primary', catalogue('macro-2026-09-24'), 'Rates, currency and equities');
  link('sector-2026-09-24', 'sector', ['memory-semiconductors'], 'primary', catalogue('sector-2026-09-24'), 'DRAM, NAND and HBM in the published abstract');

  const collections = { country: countries, sector: sectors, company: companies };
  const active = (r, allRoles) => allRoles || r.role === 'primary' || r.role === 'material';
  const inScope = (r, filters) => active(r, filters.allRoles) && (!filters.primaryCountriesOnly || r.type !== 'country' || r.role === 'primary');
  const published = () => window.Longhand ? window.Longhand.publishedSorted() : (window.LONGHAND_REPORTS || []).slice().sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  const find = (type, id) => collections[type]?.find((entity) => entity.id === id) || null;
  function contextFor(reportOrId, { allRoles = false } = {}) {
    const id = typeof reportOrId === 'string' ? reportOrId : reportOrId?.id;
    const result = { countries: [], sectors: [], companies: [] };
    const plurals = { country: 'countries', sector: 'sectors', company: 'companies' };
    relationships.filter((r) => r.reportId === id && active(r, allRoles)).forEach((r) => {
      const entity = find(r.type, r.entityId);
      if (entity) result[plurals[r.type]].push({ ...entity, role: r.role, evidence: r.evidence });
    });
    return result;
  }
  function reportsFor(filters = {}, reports = published()) {
    const selectedCompany = filters.company ? find('company', filters.company) : null;
    if (selectedCompany && ((filters.country && !selectedCompany.countryIds.includes(filters.country)) || (filters.sector && !selectedCompany.sectorIds.includes(filters.sector)))) return [];
    return reports.filter((report) => !report.isLocal && ['country', 'sector', 'company'].every((type) => !filters[type] || relationships.some((r) => r.reportId === report.id && r.type === type && r.entityId === filters[type] && inScope(r, filters))));
  }
  function entitiesFor(type, filters = {}, reports = published()) {
    const ids = new Set(reportsFor(filters, reports).map((r) => r.id));
    return (collections[type] || []).filter((entity) => {
      if (type === 'company' && ((filters.country && !entity.countryIds.includes(filters.country)) || (filters.sector && !entity.sectorIds.includes(filters.sector)))) return false;
      if (type === 'sector' && filters.company && !find('company', filters.company)?.sectorIds.includes(entity.id)) return false;
      if (type === 'country' && filters.company && !find('company', filters.company)?.countryIds.includes(entity.id)) return false;
      return relationships.some((r) => ids.has(r.reportId) && r.type === type && r.entityId === entity.id && inScope(r, filters));
    });
  }
  function urlFor(type, id, context = {}) {
    if (!collections[type] || !find(type, id)) return 'coverage.html';
    const p = new URLSearchParams({ id });
    if (type !== 'country' && find('country', context.country)) p.set('country', context.country);
    if (type === 'company' && find('sector', context.sector)) p.set('sector', context.sector);
    return `${type}.html?${p}`;
  }
  function counts(filters = {}, reports = published()) {
    return { reports: reportsFor(filters, reports).length, countries: entitiesFor('country', filters, reports).length, sectors: entitiesFor('sector', filters, reports).length, companies: entitiesFor('company', filters, reports).length };
  }
  function countryCoverage(id, reports = published()) {
    const primary = reportsFor({ country: id, primaryCountriesOnly: true }, reports);
    const ids = new Set(primary.map((r) => r.id));
    return { primary, context: reportsFor({ country: id }, reports).filter((r) => !ids.has(r.id)) };
  }
  function freeze(value) { if (value && typeof value === 'object' && !Object.isFrozen(value)) { Object.values(value).forEach(freeze); Object.freeze(value); } return value; }
  window.LonghandGraph = freeze({ version: 2, countries, sectors, companies, listings, relationships, country: (id) => find('country', id), sector: (id) => find('sector', id), company: (id) => find('company', id), reportsFor, countryCoverage, contextFor, entitiesFor, urlFor, counts });
})();
