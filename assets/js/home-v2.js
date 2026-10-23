(function () {
  'use strict';
  const LH = window.Longhand;
  if (!LH) return;
  const { esc, dateShort } = LH.util;
  function render() {
    const reports = LH.publishedSorted();
    const ledger = document.querySelector('[data-research-ledger]');
    if (ledger && reports.length) {
      const pdfs = reports.filter((r) => r.pdfUrl).length;
      ledger.innerHTML = `<span class="ledger-label">Longhand<br><em>The research ledger</em></span><span><strong>${String(reports.length).padStart(2, '0')}</strong><small>Published reports</small></span><span><strong>${String(pdfs).padStart(2, '0')}</strong><small>Print editions</small></span><span><strong>${String(reports.filter((r) => r.page || r.contentUrl).length).padStart(2, '0')}</strong><small>Interactive editions</small></span><span class="ledger-date"><small>Latest publication</small><strong>${esc(dateShort(reports[0].date))}</strong><a href="feed.xml">Follow the journal ↗</a></span>`;
    }
    const list = document.querySelector('[data-home-publications]');
    if (!list) return;
    if (LH.catalogProblem()) { list.innerHTML = '<li>The catalogue is unavailable. Please reload the page or visit the Library.</li>'; return; }
    list.innerHTML = reports.slice(0, 4).map((r, i) => {
      const art = window.LonghandArt?.forReport(r);
      const sizes = i === 0 ? '(max-width: 600px) calc(100vw - 40px), (max-width: 1000px) 280px, (max-width: 1400px) 25vw, 350px' : '(max-width: 600px) 96px, (max-width: 1000px) calc((100vw - 110px) / 3), 112px';
      const cover = window.LonghandArt?.coverHTML(r, { sizes });
      return `<li class="publication-tile">
        ${cover || (art ? `<figure class="publication-art is-${art.kind}"><img src="${esc(art.src)}" alt="${esc(art.caption)}" loading="lazy" decoding="async" width="680" height="370"><figcaption>${esc(art.caption)}</figcaption></figure>` : '')}
        <div class="publication-copy"><div class="publication-meta"><span class="publication-no">${esc(LH.catalogueNo(r))}</span><span>${esc(r.category)}</span><time datetime="${esc(r.date)}">${esc(dateShort(r.date))}</time></div>
        ${i === 0 && r.company && r.company !== r.title ? `<p class="publication-subject">${esc(r.company)}</p>` : ''}
        <h3 data-vt-title="${esc(r.id)}"><a href="${esc(LH.reportHref(r))}">${esc(r.title)}</a></h3>
        <p>${esc(LH.util.editorialText(r.blurb || r.company))}</p><span class="publication-arrow" aria-hidden="true">Read the research ↗</span></div></li>`;
    }).join('');
  }
  render(); document.addEventListener('longhand:changed', render);
})();
