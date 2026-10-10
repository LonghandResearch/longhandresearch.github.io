(function () {
  'use strict';
  const LH = window.Longhand;
  if (!LH) return;
  const { esc, dateShort } = LH.util;
  // Abstract printing motifs; these are not charts, observations, or documentary images.
  const motifs = [
    '<path d="M0 100 60 54 130 100 185 42 240 100 300 60 400 100M0 115h400M0 126h400"/><path d="M60 54v46m125-58v58m115-40v40"/>',
    '<path d="M30 130V42h44v88m24 0V22h44v108m24 0V60h44v70m24 0V34h44v96m24 0V12h44v118M0 130h400"/><path d="M36 50h32m36-20h32m36 38h32m36-26h32m36-22h32"/>',
    '<path d="M30 130h340M44 40h312L200 5 44 40Zm18 14v63m45-63v63m46-63v63m46-63v63m46-63v63m46-63v63m45-63v63M44 120h312"/>',
    '<circle cx="158" cy="80" r="56"/><ellipse cx="158" cy="80" rx="24" ry="56"/><path d="M102 80h112m-106-22h100m-100 44h100M248 38h105m-105 20h70m-70 20h90m-90 20h52m-52 20h80"/>'
  ];
  function render() {
    const reports = LH.publishedSorted();
    const ledger = document.querySelector('[data-research-ledger]');
    if (ledger && reports.length) {
      const pdfs = reports.filter((r) => r.pdfUrl).length;
      ledger.innerHTML = `<span class="ledger-label">The research ledger</span><span><strong>${reports.length}</strong> published reports</span><span><strong>${pdfs}</strong> complete PDFs</span><span><strong>${reports.filter((r) => r.page || r.contentUrl).length}</strong> interactive editions</span><span>Latest publication <strong>${esc(dateShort(reports[0].date))}</strong></span>`;
    }
    const list = document.querySelector('[data-home-publications]');
    if (!list) return;
    if (LH.catalogProblem()) { list.innerHTML = '<li>The catalogue is unavailable. Please reload the page or visit the Library.</li>'; return; }
    list.innerHTML = reports.slice(0, 4).map((r, i) => `<li class="publication-tile">
      <div class="publication-art" data-folio="${esc(LH.catalogueNo(r).replace('No.', '').trim())}" aria-hidden="true"><svg viewBox="0 0 400 150" fill="none" stroke="currentColor" stroke-width=".8">${motifs[i]}</svg></div>
      <div class="publication-meta"><span>${esc(r.category)}</span><time datetime="${esc(r.date)}">${esc(dateShort(r.date))}</time></div>
      <h3 data-vt-title="${esc(r.id)}"><a href="${esc(LH.reportHref(r))}">${esc(r.title)}</a></h3>
      <p>${esc(r.blurb || r.company)}</p><span class="publication-arrow" aria-hidden="true">↗</span></li>`).join('');
  }
  render(); document.addEventListener('longhand:changed', render);
})();
