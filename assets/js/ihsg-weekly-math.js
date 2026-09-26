/* Pure arithmetic. Inputs/outputs are percentage points unless noted. */
(function (root) {
  'use strict';
  const change = (end, start) => {
    if (!Number.isFinite(end) || !Number.isFinite(start) || start <= 0) throw new RangeError('Positive starting value required.');
    return (end / start - 1) * 100;
  };
  const usdReturn = (equityPct, usdIdrPct) => {
    if (!Number.isFinite(equityPct) || !Number.isFinite(usdIdrPct) || equityPct <= -100 || usdIdrPct <= -100) throw new RangeError('Returns must exceed -100%.');
    return ((1 + equityPct / 100) / (1 + usdIdrPct / 100) - 1) * 100;
  };
  const metrics = data => {
    const c = data.closes.map(row => row.close);
    const a = data.activity;
    const breadth = data.breadth;
    const rebound = c[3] - c[2];
    const reversal = c[3] - c[5];
    const unitValuePrior = a[0].prior / a[1].prior * 1000;
    const unitValueCurrent = a[0].current / a[1].current * 1000;
    return {
      weekly: change(c[5], c[0]), points: c[5] - c[0],
      recovery: change(c[0], c[5]), postBI: change(c[5], c[3]),
      rebound, reversal, giveback: reversal / rebound * 100,
      unitValuePrior, unitValueCurrent, unitValueChange: change(unitValueCurrent, unitValuePrior),
      declinerShare: breadth.down / (breadth.up + breadth.down) * 100,
      breadthTotal: breadth.up + breadth.down + breadth.unchanged,
      advanceDecline: breadth.up / breadth.down,
      policyGapBps: (data.policy.bi - (data.policy.fedLow + data.policy.fedHigh) / 2) * 100
    };
  };
  const math = { change, usdReturn, metrics };
  root.IHSGWeeklyMath = math;
  if (typeof module !== 'undefined' && module.exports) module.exports = math;
})(typeof window !== 'undefined' ? window : globalThis);
