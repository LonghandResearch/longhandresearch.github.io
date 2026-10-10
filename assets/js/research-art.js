/* Presentation-only index. Images are snapshots of the published research,
   not a second source of report facts. Unknown/new reports keep a text layout. */
(function () {
  'use strict';
  const base = new URL('../../assets/img/research/', document.currentScript.src);
  const records = {
    'coal-in-transition-2026-10-08': ['coal-trade-map.png', 'Export atlas · conceptual links, not vessel routes', 'exhibit'],
    'the-power-behind-ai-update-2026-10-09': ['ai-october-price.png', 'DCII price index · October checkpoint', 'exhibit'],
    'indonesia-ai-power-water-2026-10-05': ['ai-resource-flow.png', 'Power & water · schematic, not measured volumes', 'exhibit'],
    'ihsg-weekly-2026-10-02': ['ihsg-october-close.png', 'IHSG daily closes · week ending 2 October 2026', 'exhibit'],
    'ihsg-weekly-2026-09-25': ['ihsg-september-close.png', 'IHSG daily closes · week ending 25 September 2026', 'exhibit'],
    'the-power-behind-ai-2026-09-24': ['ai-capacity.png', 'Jakarta capacity · published stage comparison', 'exhibit'],
    'us-treasury-update-2026-10-08': ['us-treasury-update-2026-10-08.png', 'Original report · opening page', 'document'],
    'inet-2026-09-27': ['inet-2026-09-27.png', 'Original report · opening page', 'document'],
    'macro-2026-09-24': ['macro-2026-09-24.png', 'Original report · opening page', 'document'],
    'sector-2026-09-24': ['sector-2026-09-24.png', 'Original report · opening page', 'document'],
    'adro-2026-09-03': ['adro-2026-09-03.png', 'Original report · opening page', 'document']
  };
  window.LonghandArt = {
    forReport(report) {
      const entry = records[report.id];
      return entry ? { src: new URL(entry[0], base).href, caption: entry[1], kind: entry[2] } : null;
    }
  };
})();
