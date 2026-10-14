import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { resolve } from 'node:path';
const root = resolve(import.meta.dirname, '..');
const read = (p) => readFileSync(resolve(root, p), 'utf8');
const scope = { window: {}, URLSearchParams };
runInNewContext(read('reports/reports.js'), scope);
runInNewContext(read('assets/js/research-graph.js'), scope);
const G = scope.window.LonghandGraph;
const reports = scope.window.LONGHAND_REPORTS;
test('every graph relationship points to a published report, real entity and existing evidence anchor', () => {
  const unique = new Set();
  for (const r of G.relationships) {
    assert.ok(reports.some((p) => p.id === r.reportId), r.reportId);
    assert.ok(G[r.type](r.entityId), `${r.type}:${r.entityId}`);
    assert.ok(['primary', 'material', 'incidental', 'historical'].includes(r.role));
    const key = `${r.reportId}:${r.type}:${r.entityId}`;
    assert.ok(!unique.has(key), key); unique.add(key);
    assert.ok(r.evidence.length);
    for (const e of r.evidence) {
      const u = new URL(e.url, 'https://longhand.test/');
      const file = u.pathname.slice(1);
      assert.ok(existsSync(resolve(root, file)), e.url);
      if (u.hash) assert.ok(read(file).includes(`id="${decodeURIComponent(u.hash.slice(1))}"`), e.url);
      if (file === 'report.html') assert.ok(reports.some((p) => p.id === u.searchParams.get('id')), e.url);
    }
  }
});
test('all published reports stay discoverable and market indices are not company identities', () => {
  assert.equal(G.reportsFor().length, reports.length);
  assert.equal(G.companies.some((c) => c.ticker === 'IHSG'), false);
  assert.equal(G.reportsFor({ country: 'ID' }).length, 11);
  assert.equal(G.reportsFor({ country: 'US' }).length, 2);
  assert.equal(G.contextFor('sector-2026-09-24').countries.length, 0, 'No geography guessed from chip subject');
});
test('country report filters distinguish primary coverage from documented trade context', () => {
  assert.deepEqual(Array.from(G.entitiesFor('country', { primaryCountriesOnly: true }), c => c.id), ['ID', 'US']);
  for (const id of ['CN', 'IN', 'VN']) {
    assert.equal(G.reportsFor({ country: id, primaryCountriesOnly: true }).length, 0);
    assert.equal(G.countryCoverage(id).primary.length, 0);
    assert.deepEqual(Array.from(G.countryCoverage(id).context, r => r.id), id==='VN'?['coal-in-transition-2026-10-08']:['more-nickel-2026-10-15','coal-in-transition-2026-10-08']);
  }
  assert.equal(G.countryCoverage('ID').primary.length, 11);
  assert.equal(G.countryCoverage('US').primary.length, 2);
  assert.equal(G.countryCoverage('unknown').context.length, 0);
  const weekly = G.countryCoverage('ID').primary.find(r => r.id === 'ihsg-weekly-2026-10-09');
  assert.equal(weekly?.page, 'ihsg-weekly.html?week=2026-10-09');
  assert.equal(G.reportsFor({ sector: 'coal-mining', primaryCountriesOnly: true }).length, G.reportsFor({ sector: 'coal-mining' }).length, 'Country scope must not change sector-only discovery');
  assert.deepEqual(Array.from(G.entitiesFor('company', { sector: 'coal-mining', primaryCountriesOnly: true }), c => c.id), Array.from(G.entitiesFor('company', { sector: 'coal-mining' }), c => c.id), 'Material company discussions remain available');
  assert.equal(G.countryCoverage('CN', []).context.length, 0, 'Counts honor the supplied catalogue subset');
});
test('country-sector-company narrowing cannot create a company relationship through a shared sector report', () => {
  assert.equal(G.reportsFor({ country: 'CN', sector: 'coal-mining', company: 'bukit-asam' }).length, 0);
  assert.equal(G.entitiesFor('company', { country: 'CN' }).length, 0);
  const inet = G.reportsFor({ country: 'ID', sector: 'digital-infrastructure', company: 'sinergi-inti-andalan-prima' });
  assert.equal(inet.length, 1); assert.equal(inet[0].id, 'inet-2026-09-27');
  assert.equal(G.reportsFor({ country: 'invalid' }).length, 0);
});
test('listing identity and research geography stay distinct from domicile and private drafts', () => {
  assert.ok(G.listings.every((l) => l.companyId && l.exchange && l.ticker));
  assert.ok(G.companies.every((c) => c.domicileCountryId === null));
  assert.equal(G.reportsFor({}, [...reports, { ...reports[0], isLocal: true }]).length, reports.length);
  assert.equal(G.urlFor('company', 'sinergi-inti-andalan-prima', {country: 'ID', sector: 'digital-infrastructure'}), 'company.html?id=sinergi-inti-andalan-prima&country=ID&sector=digital-infrastructure');
});
