/* Presentation-only art. Original document captures remain available to the
   reading rail. Editorial illustrations are conceptual, never research data. */
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
  const covers = {
    'adro-2026-09-03': ['smelter', '#ead7ae', 11.2, 'The Smelter|Is the Whole|Thesis', 'A tropical aluminium smelter and industrial infrastructure'],
    'macro-2026-09-24': ['rates', '#14262b', 12.2, 'Dovish or|Hawkish?', 'Conceptual central-bank architecture illustrated in vintage ink'],
    'the-power-behind-ai-2026-09-24': ['ai-power', '#ead7ae', 12.2, 'The Power|Behind AI', 'A data-center campus connected to electrical infrastructure'],
    'ihsg-weekly-2026-09-25': ['ihsg-september', '#f0ddbb', 10.1, 'Foreign Selling|Persisted.|The Rebound Failed.', 'A market researcher reviewing unmarked papers in an exchange district'],
    'inet-2026-09-27': ['inet', '#143536', 10.2, 'Priced for a|Network Nobody|Has Paid For Yet', 'An engineer inspecting telecommunications infrastructure across an Indonesian coastline'],
    'ihsg-weekly-2026-10-02': ['ihsg-october', '#f0ddbb', 10.1, 'Foreign Selling|Deepened.|Technology Led|the Fall.', 'A city exchange district in muted red and charcoal'],
    'indonesia-ai-power-water-2026-10-05': ['ai-resource', '#ead7ae', 11.5, 'AI Runs on|Power and|Water', 'A tropical data-center campus with electricity and cooling-water infrastructure'],
    'us-treasury-update-2026-10-08': ['treasury', '#14262b', 12.2, 'Higher Yields,|Uneven Effects', 'US Capitol architecture and an urban street in an editorial engraving'],
    'coal-in-transition-2026-10-08': ['coal-trade', '#142b2b', 11.2, 'Coal Still Burns.|Trade Is|Changing.', 'Coal stockpiles, port equipment and a bulk carrier, conceptually illustrated'],
    'the-power-behind-ai-update-2026-10-09': ['ai-october', '#ead7ae', 8.8, 'The Power|Behind AI:|October Checkpoint', 'A tropical data-center campus and ongoing construction']
  };
  function originalForReport(report) {
      const entry = records[report.id];
      return entry ? { src: new URL(entry[0], base).href, caption: entry[1], kind: entry[2] } : null;
  }
  window.LonghandArt = {
    originalForReport,
    forReport(report) {
      const entry = !report.isLocal && covers[report.id];
      return entry ? { src: new URL(`covers/${entry[0]}-art.webp?v=2026-10-10final`, base).href, caption: `Editorial illustration · ${entry[4]}`, kind: 'illustration' } : originalForReport(report);
    },
    coverHTML(report) {
      const LH = window.Longhand;
      const entry = !report.isLocal && covers[report.id];
      if (!LH || (!entry && report.id !== 'sector-2026-09-24')) return '';
      const { esc, dateShort } = LH.util;
      if (!entry) {
        const art = originalForReport(report);
        return `<figure class="research-cover cover-original" data-report-cover="${esc(report.id)}"><img src="${esc(art.src)}" alt="${esc(report.title)} — original anime cover with three memory companies" width="637" height="900" loading="lazy" decoding="async"></figure>`;
      }
      // Line breaks are presentation hints only. Refuse stale typesetting if a
      // future catalogue revision changes the title.
      const title = entry[3].replaceAll('|', ' ') === report.title ? entry[3].split('|').map(esc).join('<br>') : esc(report.title);
      const art = this.forReport(report);
      return `<figure class="research-cover${entry[1] === '#ead7ae' ? ' cover-tone-navy' : ''}" data-report-cover="${esc(report.id)}" style="--cover-ink:${entry[1]};--cover-title-size:${entry[2]}cqw">
        <img src="${esc(art.src)}" alt="${esc(art.caption)}" width="1024" height="1536" loading="lazy" decoding="async">
        <figcaption class="cover-type" aria-hidden="true"><div class="cover-edition"><span>${esc(LH.catalogueNo(report))}<b>${esc(report.ticker || report.category)}</b><time datetime="${esc(report.date)}">${esc(dateShort(report.date))}</time></span><span class="cover-subject">${esc(report.category)} / ${esc(report.company)}</span></div><strong class="cover-headline">${title}</strong><span class="cover-signature">Longhand <small>Research</small></span></figcaption>
      </figure>`;
    }
  };
})();
