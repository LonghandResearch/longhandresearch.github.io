import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
const scope = { window: {} };
runInNewContext(readFileSync(new URL('../assets/js/structured-report.js', import.meta.url), 'utf8'), scope);
const R = scope.window.LonghandStructured;
// Synthetic test-only observations. Never included in the public catalogue.
const data = () => ({ schemaVersion: 1, reportId: 'test', sources: [{ id: 'example', title: 'Test source', url: 'https://example.com' }], sections: [{ id: 'thesis', title: 'Test section', blocks: [{ type: 'paragraph', text: 'Test text' }, { type: 'line-chart', title: 'Test figure', period: 'Test period', unit: 'units', status: 'scenario', sources: ['example'], points: [{label: 'A', value: 0}, {label: 'B', value: 0}] }] }] });
test('structured report keeps source, units, period, evidence status and exact data available', () => {
  const html = R.render(data(), 'test');
  for (const text of ['Test period', 'units', 'scenario', 'href="#source-example"', 'Read the figure data', '<td>0</td>']) assert.ok(html.includes(text), text);
  assert.ok(!html.includes('NaN') && !html.includes('Infinity'));
});
test('invalid observations and broken evidence fail closed instead of rendering a figure', () => {
  for (const value of [NaN, Infinity, '3', null]) {
    const d = data(); d.sections[0].blocks[1].points[0].value = value;
    assert.throws(() => R.render(d, 'test'));
  }
  const d = data(); d.sections[0].blocks[1].sources = ['missing']; assert.throws(() => R.render(d, 'test'));
  assert.throws(() => R.render(data(), 'different-report'));
});
test('report content is text and source URLs cannot execute script', () => {
  const d = data(); d.sections[0].blocks[0].text = '<img src=x onerror=alert(1)>';
  assert.ok(R.render(d, 'test').includes('&lt;img'));
  for (const url of ['javascript:alert(1)', 'data:text/html,x', '//example.com', 'https://example.com\n']) {
    d.sources[0].url = url; assert.throws(() => R.render(d, 'test'));
  }
});
test('duplicate or reserved anchors and ragged tables are rejected', () => {
  const d = data(); d.sections[0].id = 'source-example'; assert.throws(() => R.render(d));
  d.sections[0].id = 'thesis'; d.sections.push(d.sections[0]); assert.throws(() => R.render(d));
  const t = data(); t.sections[0].blocks[1] = { ...t.sections[0].blocks[1], type: 'table', columns: ['A', 'B'], rows: [[1]] }; assert.throws(() => R.render(t));
});
