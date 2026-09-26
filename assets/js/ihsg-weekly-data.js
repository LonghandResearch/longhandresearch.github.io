/* Primary-source snapshot for the week ending 25 September 2026.
   IDX statistics classify foreign investors by trading-system domicile.
   JISDOR is a daily BI reference rate, not an equity-market closing FX quote. */
(function (root) {
  'use strict';
  const idxArchive = 'https://www.idx.id/en/market-data/statistical-reports/statistics';
  const sources = {
    weekly: { label: 'IDX Weekly Statistics, 21–25 Sep', url: idxArchive },
    prior: { label: 'IDX Weekly Statistics, 14–18 Sep', url: idxArchive },
    prior2: { label: 'IDX Weekly Statistics, 7–11 Sep', url: idxArchive },
    daily: { label: 'IDX Daily Statistics, 18 and 21–25 Sep', url: idxArchive },
    jisdor: { label: 'Bank Indonesia: JISDOR daily reference rates', url: 'https://www.bi.go.id/en/statistik/informasi-kurs/jisdor/Default.aspx' },
    fed: { label: 'Federal Reserve: 16 Sep FOMC decision', url: 'https://www.federalreserve.gov/newsevents/pressreleases/monetary20260916a.htm' },
    bi: { label: 'Bank Indonesia: 23 Sep policy decision', url: 'https://www.bi.go.id/id/publikasi/ruang-media/news-release/Pages/sp_2819326.aspx' },
    calendar: { label: 'BI Indonesian publication calendar', url: 'https://www.bi.go.id/id/publikasi/Kalender/Default.aspx' }
  };
  const data = {
    period: '21–25 September 2026', reviewed: '2026-09-26', sources,
    closes: [
      { date: '2026-09-18', label: '18 Sep', close: 6441.159, source: 'daily', note: 'Previous Friday baseline' },
      { date: '2026-09-21', label: 'Mon 21', close: 6384.726, source: 'daily', note: 'First session of the week' },
      { date: '2026-09-22', label: 'Tue 22', close: 6277.044, source: 'daily', note: 'Before the BI decision' },
      { date: '2026-09-23', label: 'Wed 23', close: 6374.912, source: 'daily', note: 'BI held the policy rate' },
      { date: '2026-09-24', label: 'Thu 24', close: 6298.607, source: 'daily', note: 'Selling resumed' },
      { date: '2026-09-25', label: 'Fri 25', close: 6241.892, source: 'daily', note: 'Week-end close' }
    ],
    // Weekly sector-index returns, not daily snapshots or IHSG-point contributions.
    sectors: [
      { name: 'Consumer cyclicals', weekly: 0.02 },
      { name: 'Healthcare', weekly: -2.37 },
      { name: 'Financials', weekly: -2.41 },
      { name: 'Transport & logistics', weekly: -2.47 },
      { name: 'Basic materials', weekly: -2.59 },
      { name: 'Energy', weekly: -2.94 },
      { name: 'Property', weekly: -2.95 },
      { name: 'Consumer non-cyclicals', weekly: -3.50 },
      { name: 'Technology', weekly: -3.96 },
      { name: 'Infrastructure', weekly: -4.10 },
      { name: 'Industrials', weekly: -5.48 }
    ],
    foreignFlow: [
      { date: '2026-09-21', label: 'Mon 21', netBn: -510.06 },
      { date: '2026-09-22', label: 'Tue 22', netBn: -131.71 },
      { date: '2026-09-23', label: 'Wed 23', netBn: -460.78 },
      { date: '2026-09-24', label: 'Thu 24', netBn: -1493.37 },
      { date: '2026-09-25', label: 'Fri 25', netBn: -559.16 }
    ],
    weeklyNetBn: -3155.08,
    priorWeekNetBn: -2946.84,
    prior2WeekNetBn: -3360.70,
    // Stock trading value in IDR by venue. These are NOT venue-specific foreign flows.
    venues: { regular: 53659791964200, cash: 271008000, negotiated: 6230181663685, total: 59890244635885 },
    // Reported average-daily levels. Exact weekly totals below own ratio calculations.
    activity: [
      { key: 'value', label: 'Daily traded value', unit: 'Rp tn', prior: 15.223, current: 11.978, reportedPct: -21.32 },
      { key: 'volume', label: 'Daily share volume', unit: 'bn shares', prior: 28.613, current: 29.198, reportedPct: 2.04 },
      { key: 'frequency', label: 'Daily trade count', unit: 'mn trades', prior: 1.892, current: 1.817, reportedPct: -3.95 },
      { key: 'cap', label: 'Market capitalisation', unit: 'Rp tn', prior: 11266, current: 10905, reportedPct: -3.20 }
    ],
    weeklyTotals: {
      prior: { volume: 143062869137, value: 76116894876030, frequency: 9457514 },
      current: { volume: 145988173060, value: 59890244635885, frequency: 9083906 }
    },
    indexLaggards: [
      { ticker: 'BYAN', pricePct: -12.48, points: -28.09 },
      { ticker: 'BBRI', pricePct: -4.83, points: -23.33 },
      { ticker: 'BMRI', pricePct: -4.23, points: -14.68 }
    ],
    jisdor: [
      { date: '2026-09-18', rate: 17745 },
      { date: '2026-09-21', rate: 17813 },
      { date: '2026-09-22', rate: 17883 },
      { date: '2026-09-23', rate: 17803 },
      { date: '2026-09-24', rate: 17898 },
      { date: '2026-09-25', rate: 17917 }
    ],
    policy: { bi: 5.75, fedLow: 3.75, fedHigh: 4.00, fedHikeBps: 25 }
  };
  root.IHSGWeeklyData = data;
  if (typeof module !== 'undefined' && module.exports) module.exports = data;
})(typeof window !== 'undefined' ? window : globalThis);
