/* Longhand Research: the front page.
   Under the globe, the newest report in the library, set as a lead story. */
(function () {
  'use strict';

  const LH = window.Longhand;
  const { $, esc, icon, dateLong } = LH.util;

  const section = $('[data-latest-section]');
  const body = $('[data-latest]');
  if (!section || !body) return;

  function render(list) {
    const r = list[0];
    if (!r) { section.hidden = true; return; }
    section.hidden = false;
    const href = LH.reportHref(r);
    // A lighter version of the report page's header: the short blurb and just the call
    const ledger = LH.ledgerHtml(r, 'The call', { extra: false });
    const company = r.company && r.company !== r.title ? r.company : '';
    const text = r.blurb || r.summary;
    body.innerHTML = `
      <div class="lead${ledger ? '' : ' no-side'}">
        <div class="lead-main">
          <p class="kicker">${LH.kickerHtml(r, [esc(LH.tickerLabel(r)), `<time datetime="${esc(r.date)}">${esc(dateLong(r.date))}</time>`])}</p>
          <h3 class="lead-title" data-vt-title="${esc(r.id)}"><a href="${href}">${esc(r.title)}</a></h3>
          ${company ? `<p class="lead-company">${esc(company)}</p>` : ''}
          ${text ? `<p class="lead-summary">${esc(text)}</p>` : ''}
          <div class="lead-actions">
            <a class="btn" href="${href}">Read the report ${icon('arrowRight', 'icon-arrow')}</a>
            <a class="text-link" href="${esc(LH.fileUrl(r))}" download="${esc(LH.downloadName(r))}">${icon('download')} Download PDF</a>
            <span class="file-meta">${esc(LH.fileMeta(r))}</span>
          </div>
        </div>
        ${ledger ? `<aside class="lead-side ledger" aria-label="The call">${ledger}</aside>` : ''}
      </div>`;
  }

  // Published reports are drawn straight away. Drafts in this browser follow
  // once any page transition is over, and only if one is now the latest.
  let current = LH.publishedSorted();
  render(current);
  function withDrafts({ now = false } = {}) {
    return Promise.all([LH.allReports(), now ? null : LH.afterTransition()]).then(([list]) => {
      if (now || (list[0] && list[0].id) !== (current[0] && current[0].id) || list.some((r) => r.isLocal)) {
        current = list;
        render(list);
      }
    });
  }
  if (LH.isAuthor) withDrafts();
  document.addEventListener('longhand:changed', () => withDrafts({ now: true }));
  window.addEventListener('pageshow', (e) => { if (e.persisted && LH.isAuthor) withDrafts(); });
})();
