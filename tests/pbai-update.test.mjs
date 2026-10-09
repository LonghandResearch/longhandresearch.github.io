import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const math = require('../assets/js/pbai/update-math.js');
const data = JSON.parse(readFileSync(new URL('../updates/power-behind-ai-2026-10-09.json', import.meta.url), 'utf8'));

test('price changes use the starting price and reject absent or invalid observations', () => {
  assert.ok(Math.abs(math.priceChange(200, 180) + 10) < 1e-10);
  assert.ok(Math.abs(math.priceChange(100, 125) - 25) < 1e-10);
  for (const invalid of [0, -1, null, undefined, NaN, Infinity]) {
    assert.throws(() => math.priceChange(invalid, 100));
    assert.throws(() => math.priceChange(100, invalid));
  }
});

test('the October series retain the archived September baseline and dated coverage', () => {
  const context = { window: {} };
  runInNewContext(readFileSync(new URL('../assets/js/pbai/data.js', import.meta.url), 'utf8'), context);
  const archive = context.window.PBAI.COMPANIES;
  assert.equal(data.stocks.length, archive.length);
  assert.equal(new Set(data.stocks.map((s) => s.ticker)).size, data.stocks.length);
  for (const stock of data.stocks) {
    const old = archive.find((company) => company.ticker === stock.ticker);
    assert.equal(stock.observations[0].close, old.price);
    assert.equal(stock.observations[0].date, data.baselineDate);
    assert.equal(stock.observations.at(-1).date, data.priceDate);
    assert.equal(stock.observations.length, 11);
    assert.equal(new Set(stock.observations.map((r) => r.date)).size, 11);
    for (let i = 0; i < stock.observations.length; i++) {
      const row = stock.observations[i];
      assert.ok(row.close > 0 && Number.isFinite(row.close));
      assert.equal(row.adjFactor, 1, 'A split inside the comparison window needs a reviewed adjustment');
      if (i > 0) assert.ok(row.date > stock.observations[i - 1].date);
    }
  }
  assert.ok(data.priceDate <= data.reviewDate && data.reviewDate <= data.publicationDate);
  assert.equal(data.fx.date, data.priceDate);
});

test('construction stays inside the pipeline and unknown operating capacity stays unknown', () => {
  assert.equal(math.plannedCapacity(data.markets[0]), 901);
  assert.equal(math.plannedCapacity(data.markets[1]), 1304);
  assert.equal(data.markets[0].operationalMW, 322);
  assert.equal(data.markets[1].operationalMW, null);
  assert.equal(data.markets[1].plannedMW, null, 'The newer planned remainder is derived, not a reported value');
  assert.throws(() => math.plannedCapacity({ pipelineMW: 10, constructionMW: 11 }));
  assert.throws(() => math.plannedCapacity({ pipelineMW: null, constructionMW: 0 }));
});

test('every project and market observation resolves to a dated source', () => {
  const ids = new Set(data.sources.map((s) => s.id));
  assert.equal(ids.size, data.sources.length);
  for (const source of data.sources) {
    assert.ok(source.date <= data.reviewDate);
    assert.ok(source.locator && source.note && source.url.startsWith('https://'));
  }
  for (const item of [...data.projects, ...data.markets, data.fx]) assert.ok(ids.has(item.source));
});
