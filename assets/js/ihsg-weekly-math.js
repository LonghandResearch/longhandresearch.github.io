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
    const rebound = c[3] - c[2];
    const reversal = c[3] - c[5];
    const unitValuePrior = data.weeklyTotals.prior.value / data.weeklyTotals.prior.volume;
    const unitValueCurrent = data.weeklyTotals.current.value / data.weeklyTotals.current.volume;
    const foreignNet = data.foreignFlow.reduce((sum, row) => sum + row.netBn, 0);
    const fxWeekly = change(data.jisdor.at(-1).rate, data.jisdor[0].rate);
    const weekly = change(c[5], c[0]);
    const laggardPoints = data.indexLaggards.reduce((sum, row) => sum + row.points, 0);
    return {
      weekly, points: c[5] - c[0],
      recovery: change(c[0], c[5]), postBI: change(c[5], c[3]),
      rebound, reversal, giveback: reversal / rebound * 100,
      unitValuePrior, unitValueCurrent, unitValueChange: change(unitValueCurrent, unitValuePrior),
      foreignNet, threeWeekNetBn: data.prior2WeekNetBn + data.priorWeekNetBn + foreignNet,
      thursdayFlowShare: data.foreignFlow[3].netBn / foreignNet * 100,
      fxWeekly, usdProxy: usdReturn(weekly, fxWeekly),
      laggardPoints, laggardShare: laggardPoints / (c[5] - c[0]) * 100,
      policyGapBps: (data.policy.bi - (data.policy.fedLow + data.policy.fedHigh) / 2) * 100
    };
  };
  const math = { change, usdReturn, metrics };
  root.IHSGWeeklyMath = math;
  if (typeof module !== 'undefined' && module.exports) module.exports = math;
})(typeof window !== 'undefined' ? window : globalThis);
