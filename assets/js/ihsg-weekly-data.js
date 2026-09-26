/* Snapshot for the week ending 25 September 2026. Dates and scopes are deliberate.
   Prices retain the precision published by each source. No live data requests. */
(function (root) {
  'use strict';
  const sources = {
    weekly: { label: 'Pasardana: BEI weekly summary, 25 Sep', url: 'https://pasardana.id/news/2026/9/25/data-sepekan-perdagangan-bei-kapitalisasi-pasar-mencapai-rp10-905-triliun-merosot-3-20-dibanding-pekan-sebelumnya' },
    mon: { label: 'KabarBursa: Monday close', url: 'https://www.kabarbursa.com/market-hari-ini/ihsg-dan-rupiah-kompak-melemah-bursa-asia-terdongkrak-saham-teknologi' },
    tue: { label: 'MetroTV: Tuesday close (RTI)', url: 'https://www.metrotvnews.com/read/bzGCeopg-selasa-sore-ihsg-ditutup-ke-level-6-277' },
    wed: { label: 'Katadata: Wednesday sectors and close', url: 'https://databoks.katadata.co.id/pasar/statistik/6ab39d356f85e/semua-sektor-saham-naik-barang-baku-memimpin-rabu-23-september-2026' },
    thu: { label: 'Katadata: Thursday sectors and close', url: 'https://databoks.katadata.co.id/pasar/statistik/6ab4ee039c0f9/semua-sektor-saham-turun-barang-baku-jatuh-paling-dalam-kamis-24-september-2026' },
    fri: { label: 'Katadata: Friday sectors and breadth (RTI)', url: 'https://databoks.katadata.co.id/pasar/statistik/6ab6400ad9347/semua-sektor-saham-turun-industri-paling-bawah-jumat-25-september-2026' },
    banks: { label: 'IDXChannel: bank foreign flows, published 25 Sep', url: 'https://www.idxchannel.com/amp/market-news/saham-bank-besar-jadi-sasaran-jual-asing-ada-apa' },
    fed: { label: 'Federal Reserve: 16 Sep FOMC decision', url: 'https://www.federalreserve.gov/newsevents/pressreleases/monetary20260916a.htm' },
    bi: { label: 'Bank Indonesia: 23 Sep policy decision', url: 'https://www.bi.go.id/id/publikasi/ruang-media/news-release/Pages/sp_2819326.aspx' },
    calendar: { label: 'BI Indonesian publication calendar', url: 'https://www.bi.go.id/id/publikasi/Kalender/Default.aspx' }
  };
  const data = {
    period: '21–25 September 2026', reviewed: '2026-09-26', sources,
    closes: [
      { date: '2026-09-18', label: '18 Sep', close: 6441.159, source: 'weekly', note: 'Previous Friday baseline' },
      { date: '2026-09-21', label: 'Mon 21', close: 6384.73, source: 'mon', note: 'First session of the week' },
      { date: '2026-09-22', label: 'Tue 22', close: 6277.044, source: 'tue', note: 'Before the BI decision' },
      { date: '2026-09-23', label: 'Wed 23', close: 6374.91, source: 'wed', note: 'BI held the policy rate' },
      { date: '2026-09-24', label: 'Thu 24', close: 6298.61, source: 'thu', note: 'Selling resumed' },
      { date: '2026-09-25', label: 'Fri 25', close: 6241.892, source: 'weekly', note: 'Week-end close' }
    ],
    // All sector returns are daily percentages, never weekly totals.
    sectors: [
      { name: 'Financials', wed: 0.56, fri: -0.45 },
      { name: 'Healthcare', wed: 0.01, fri: -0.77 },
      { name: 'Basic materials', wed: 3.47, fri: -0.97 },
      { name: 'Consumer cyclicals', wed: 2.49, fri: -1.03 },
      { name: 'Energy', wed: 2.59, fri: -1.18 },
      { name: 'Property', wed: 1.99, fri: -1.26 },
      { name: 'Consumer non-cyclicals', wed: 0.62, fri: -1.37 },
      { name: 'Technology', wed: 0.55, fri: -1.73 },
      { name: 'Transport & logistics', wed: 1.02, fri: -1.84 },
      { name: 'Infrastructure', wed: 1.26, fri: -2.22 },
      { name: 'Industrials', wed: 2.21, fri: -2.52 }
    ],
    breadth: { up: 118, down: 558, unchanged: 117, date: '2026-09-25', source: 'fri' },
    activity: [
      { key: 'value', label: 'Daily traded value', unit: 'Rp tn', prior: 15.22, current: 11.98, reportedPct: -21.32 },
      { key: 'volume', label: 'Daily share volume', unit: 'bn shares', prior: 28.61, current: 29.20, reportedPct: 2.04 },
      { key: 'frequency', label: 'Daily trade count', unit: 'mn trades', prior: 1.89, current: 1.82, reportedPct: -3.95 },
      { key: 'cap', label: 'Market capitalisation', unit: 'Rp tn', prior: 11266, current: 10905, reportedPct: -3.20 }
    ],
    bankFlows: [ { ticker: 'BMRI', netBn: -886.53 }, { ticker: 'BBRI', netBn: -645.12 }, { ticker: 'BBCA', netBn: -242.36 } ],
    flowScope: 'Source-reported one-week window ending 24 September; starting date and venue split unspecified.',
    fridayNetBn: -559.16, ytdNetTn: -77.52,
    policy: { bi: 5.75, fedLow: 3.75, fedHigh: 4.00, fedHikeBps: 25 }
  };
  root.IHSGWeeklyData = data;
  if (typeof module !== 'undefined' && module.exports) module.exports = data;
})(typeof window !== 'undefined' ? window : globalThis);
