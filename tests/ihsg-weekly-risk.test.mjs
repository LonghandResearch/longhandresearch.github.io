import { createRequire } from 'node:module';
import test from 'node:test';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const { limitPath, valuation, exitCapacity, curve } = require('../assets/js/ihsg-weekly-risk.js');
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-8, `${a} != ${b}`);
test('Compounding preserves multi-session losses and recovery asymmetry', () => {
  near(limitPath(7)[2], 86.49);
  near(limitPath(7)[5], 69.56883693);
  near(limitPath(15)[1], 85);
  assert.ok(limitPath(7)[3] < 85);
  assert.throws(() => limitPath(100));
});
test('Valuation sensitivity respects the price equals earnings times multiple identity', () => {
  near(valuation(5185.105, 11.03, 0, 0).level, 5185.105);
  const stress = valuation(5185.105, 11.03, -10, 200);
  near(stress.level, 5185.105 * .9 / (1 + 11.03 * .02));
  assert.ok(stress.multiple < 11.03 && stress.returnPct < -10);
  assert.throws(() => valuation(5185.105, 11.03, 0, -1000));
});
test('Sale capacity converts trillion dollar assets to billion dollars then trillion rupiah', () => {
  const sale = exitCapacity(1, .43, 18052, 10, 10);
  near(sale.saleBnUsd, 4.3);
  near(sale.saleTnIdr, 77.6236);
  near(sale.sessions, 77.6236);
  near(exitCapacity(1, .43, 18052, 10, 20).sessions, sale.sessions / 2);
  near(exitCapacity(0, .43, 18052, 10, 10).sessions, 0);
  assert.throws(() => exitCapacity(1, .43, 18052, 10, 0));
});
test('Visual curves pass through observations without creating intervening extrema', () => {
  const points = [[0, 20], [2, 60], [3, 58], [8, 100]];
  const path = curve(points);
  const segments = path.match(/C ([^C]+)/g).map(s => s.slice(2).split(/[,\s]+/).filter(Boolean).map(Number));
  segments.forEach((s, i) => {
    near(s[4], points[i + 1][0]);
    near(s[5], points[i + 1][1]);
    for (let j = 0; j <= 100; j++) {
      const t = j / 100, a = 1 - t;
      const y = a ** 3 * points[i][1] + 3 * a ** 2 * t * s[1] + 3 * a * t ** 2 * s[3] + t ** 3 * s[5];
      assert.ok(y >= Math.min(points[i][1], points[i + 1][1]) - 1e-10 && y <= Math.max(points[i][1], points[i + 1][1]) + 1e-10);
    }
  });
  assert.throws(() => curve([[0, 1], [0, 2]]));
});
