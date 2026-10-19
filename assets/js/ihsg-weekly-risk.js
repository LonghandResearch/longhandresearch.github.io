/* Conditional arithmetic, not an econometric forecast or an execution model. */
(function (root) {
  'use strict';
  const valid = (...values) => values.every(Number.isFinite);
  function limitPath(limitPct, sessions = 5) {
    if (!valid(limitPct, sessions) || limitPct <= 0 || limitPct >= 100 || !Number.isInteger(sessions) || sessions < 0 || sessions > 100) throw new RangeError('Invalid price-limit assumptions.');
    return Array.from({ length: sessions + 1 }, (_, day) => 100 * (1 - limitPct / 100) ** day);
  }
  function valuation(index, initialMultiple, earningsPct, yieldBps) {
    if (!valid(index, initialMultiple, earningsPct, yieldBps) || index <= 0 || initialMultiple <= 0 || earningsPct <= -100 || 1 / initialMultiple + yieldBps / 10000 <= 0) throw new RangeError('Invalid valuation assumptions.');
    const multiple = 1 / (1 / initialMultiple + yieldBps / 10000);
    const level = index * (1 + earningsPct / 100) * multiple / initialMultiple;
    return { multiple, level, returnPct: (level / index - 1) * 100 };
  }
  function exitCapacity(aumTnUsd, weightPct, fx, dailyValueTn, participationPct) {
    if (!valid(aumTnUsd, weightPct, fx, dailyValueTn, participationPct) || aumTnUsd < 0 || weightPct < 0 || weightPct > 100 || fx <= 0 || dailyValueTn <= 0 || participationPct <= 0 || participationPct > 100) throw new RangeError('Invalid sale-capacity assumptions.');
    const saleBnUsd = aumTnUsd * 1000 * weightPct / 100;
    const saleTnIdr = saleBnUsd * fx / 1000;
    return { saleBnUsd, saleTnIdr, sessions: saleTnIdr / (dailyValueTn * participationPct / 100) };
  }
  // Shape-preserving cubic guides through observations. Harmonic-mean tangents
  // flatten at turning points and avoid inventing extrema between closes.
  function curve(points) {
    if (!Array.isArray(points) || points.length < 2 || points.some((p, i) => !Array.isArray(p) || p.length !== 2 || !valid(...p) || (i && p[0] <= points[i - 1][0]))) throw new RangeError('Curve points need increasing finite x coordinates.');
    const h = points.slice(1).map((p, i) => p[0] - points[i][0]);
    const slopes = points.slice(1).map((p, i) => (p[1] - points[i][1]) / h[i]);
    const tangents = points.map((_, i) => {
      if (i === 0) return slopes[0];
      if (i === points.length - 1) return slopes.at(-1);
      if (slopes[i - 1] * slopes[i] <= 0) return 0;
      const w1 = 2 * h[i] + h[i - 1], w2 = h[i] + 2 * h[i - 1];
      return (w1 + w2) / (w1 / slopes[i - 1] + w2 / slopes[i]);
    });
    let path = `M ${points[0][0]} ${points[0][1]}`;
    for (let i = 0; i < points.length - 1; i++) {
      const [x0, y0] = points[i], [x1, y1] = points[i + 1];
      const dx = h[i] / 3;
      path += ` C ${x0 + dx} ${y0 + tangents[i] * dx}, ${x1 - dx} ${y1 - tangents[i + 1] * dx}, ${x1} ${y1}`;
    }
    return path;
  }
  root.IHSGWeeklyRisk = { limitPath, valuation, exitCapacity, curve };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.IHSGWeeklyRisk;
})(typeof window !== 'undefined' ? window : globalThis);
