/* Longhand Research: the report page.
   The report's details, and the PDF drawn with pdf.js one page at a time as
   the reader scrolls, so long reports stay light on memory. */
(function () {
  'use strict';

  const LH = window.Longhand;
  const { $, $$, esc, icon, dateLong } = LH.util;

  const root = $('[data-reader]');
  if (!root) return;

  const PDFJS = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/';
  const ZOOMS = [0.5, 0.67, 0.75, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2, 2.5, 3];
  const MAX_CANVAS_PIXELS = 14e6; // below the canvas limit on iPhone and iPad
  const id = (new URLSearchParams(location.search).get('id') || '').trim();

  let view = null;

  async function init() {
    if (view) { view.destroy(); view = null; }
    // A published report is drawn at once, so the page arrives complete and
    // its title can travel in from the page before; drafts need a moment.
    const pub = id ? LH.published().find((x) => x.id === id) : null;
    if (pub && pub.page) { location.replace(pub.page); return; }   // interactive reports live on their own page
    if (pub) { renderReport(pub); return; }
    const r = id ? await LH.findReport(id) : null;
    if (!r) { renderMissing(); return; }
    renderReport(r);
  }

  function setDescription(text) {
    const m = $('meta[name="description"]');
    if (m && text) m.setAttribute('content', text.length > 180 ? `${text.slice(0, 177).replace(/\s+\S*$/, '')}...` : text);
  }

  function renderMissing() {
    document.title = 'Report not found · Longhand Research';
    root.innerHTML = `
      <div class="wrap">
        <a class="back" href="library.html">${icon('arrowLeft')} The library</a>
        <div class="state">
          <h1 class="state-title">This report could not be found.</h1>
          <p class="state-text">${id ? 'The link may be incomplete, or the report may have been moved or withdrawn.' : 'No report was chosen.'} Every published report is listed in the library.</p>
          ${LH.isAuthor && LH.catalogProblem() ? '<p class="state-text">Author note: reports/reports.js could not be read, so no published report can be found. The library page shows where the mistake is.</p>' : ''}
          <div class="hero-actions">
            <a class="btn" href="library.html">Browse the library ${icon('arrowRight', 'icon-arrow')}</a>
          </div>
        </div>
      </div>`;
  }

  function renderReport(r) {
    document.title = `${r.title}${r.ticker ? ` · ${r.ticker}` : ''} · Longhand Research`;
    setDescription(r.blurb || r.summary);

    const url = LH.fileUrl(r);
    const ledger = LH.ledgerHtml(r, 'Key data');
    const company = r.company && r.company !== r.title ? r.company : '';
    const canFs = !!(document.fullscreenEnabled || document.webkitFullscreenEnabled);

    root.innerHTML = `
      <div class="wrap">
        <a class="back" href="library.html" data-back>${icon('arrowLeft')} The library</a>
        <header class="reader-head${ledger ? '' : ' no-side'}">
          <div class="reader-main">
            <p class="kicker">${LH.kickerHtml(r, [esc(LH.tickerLabel(r)), `<time datetime="${esc(r.date)}">${esc(dateLong(r.date))}</time>`, esc(LH.catalogueNo(r))])}</p>
            <h1 class="reader-title">${esc(r.title)}</h1>
            ${company ? `<p class="reader-company">${esc(company)}</p>` : ''}
            ${r.summary ? `<p class="reader-summary">${esc(r.summary)}</p>` : ''}
            <div class="reader-actions">
              <a class="btn" href="${esc(url)}" download="${esc(LH.downloadName(r))}">${icon('download')} Download</a>
              ${canFs ? `<button type="button" class="btn btn-quiet" data-fullscreen>${icon('maximize')} <span data-fs-label>Read full screen</span></button>` : ''}
              ${r.isLocal ? '' : `<button type="button" class="text-link" data-copy-link>${icon('link')} <span data-copy-label>Copy link</span></button>`}
              <span class="file-meta" data-file-meta>${esc(LH.fileMeta(r))}</span>
            </div>
            ${r.isLocal ? `
              <p class="local-note">This draft is saved in this browser only, so only you can see it. Publish it when it is ready.</p>
              <div class="local-tools">
                <button type="button" class="text-link" data-act="publish">Publish</button>
                <button type="button" class="text-link" data-edit>Edit details</button>
                <button type="button" class="text-link tool-danger" data-act="delete">Delete draft</button>
              </div>` : LH.isAuthor ? `
              <div class="local-tools">
                <button type="button" class="text-link tool-danger" data-act="delete">Delete from the site</button>
              </div>` : ''}
          </div>
          ${ledger ? `<aside class="reader-side ledger" aria-label="Key data">${ledger}</aside>` : ''}
        </header>
      </div>

      <section class="viewer" data-viewer aria-label="The full report">
        <div class="viewer-bar">
          <div class="wrap viewer-bar-inner">
            <span class="viewer-title">The full report</span>
            <div class="viewer-controls">
              <span class="viewer-status" data-status>Loading</span>
              <button type="button" class="icon-btn" data-zoom-out aria-label="Zoom out" title="Zoom out">${icon('minus')}</button>
              <button type="button" class="icon-btn viewer-zoom" data-zoom-reset aria-label="Fit to width" title="Fit to width">100%</button>
              <button type="button" class="icon-btn" data-zoom-in aria-label="Zoom in" title="Zoom in">${icon('plus')}</button>
              ${canFs ? `<span class="divider" aria-hidden="true"></span>
              <button type="button" class="icon-btn" data-fullscreen aria-label="Read full screen" title="Full screen">${icon('maximize', 'icon-max')}${icon('minimize', 'icon-min')}</button>` : ''}
            </div>
          </div>
        </div>
        <div class="viewer-scroll">
          <div class="viewer-pages" data-pages></div>
        </div>
      </section>`;

    // Back to the library exactly as it was left (search, filter, scroll),
    // when that is where the reader came from
    $('[data-back]', root).addEventListener('click', (e) => {
      try {
        const ref = document.referrer ? new URL(document.referrer) : null;
        if (ref && ref.origin === location.origin && /\/library(\.html)?$/.test(ref.pathname) && history.length > 1) {
          e.preventDefault();
          history.back();
        }
      } catch (err) { /* follow the link */ }
    });

    // Share: copy a clean link to this report
    const copyBtn = $('[data-copy-link]', root);
    if (copyBtn) {
      copyBtn.addEventListener('click', async () => {
        const link = new URL(LH.reportHref(r), location.href).href;
        const ok = await LH.util.copyText(link);
        const label = $('[data-copy-label]', copyBtn);
        label.textContent = ok ? 'Link copied' : 'Copy failed';
        clearTimeout(copyBtn._t);
        copyBtn._t = setTimeout(() => { label.textContent = 'Copy link'; }, 2200);
      });
    }

    // Author tools: publish or delete (the page follows through when they finish)
    $$('[data-act]', root).forEach((b) => b.addEventListener('click', () => LH.authorAction(b.dataset.act, r)));
    const editBtn = $('[data-edit]', root);
    if (editBtn) {
      editBtn.addEventListener('click', async () => {
        LH.openReportForm({ mode: 'edit', record: (await LH.drafts.get(r.id)) || r });
      });
    }

    view = new PdfView(r, $('[data-viewer]', root));
  }

  /* The PDF viewer */

  class PdfView {
    constructor(r, el) {
      this.r = r;
      this.el = el;
      this.pagesEl = $('[data-pages]', el);
      this.statusEl = $('[data-status]', el);
      this.zoom = 1;
      this.pages = [];
      this.near = new Set();
      this.dead = false;
      this.lastWidth = 0;
      this.built = false;           // true once every page has its placeholder

      this.onScroll = this.onScroll.bind(this);
      this.onFsChange = this.onFsChange.bind(this);

      $('[data-zoom-in]', el).addEventListener('click', () => this.step(1));
      $('[data-zoom-out]', el).addEventListener('click', () => this.step(-1));
      $('[data-zoom-reset]', el).addEventListener('click', () => this.setZoom(1));
      this.fsButtons = $$('[data-fullscreen]', root);
      this.fsButtons.forEach((b) => b.addEventListener('click', () => this.toggleFullscreen()));
      document.addEventListener('fullscreenchange', this.onFsChange);
      document.addEventListener('webkitfullscreenchange', this.onFsChange);
      window.addEventListener('scroll', this.onScroll, { passive: true });
      el.addEventListener('scroll', this.onScroll, { passive: true });

      this.ro = new ResizeObserver(() => {
        clearTimeout(this.resizeTimer);
        this.resizeTimer = setTimeout(() => {
          const w = this.pagesEl.clientWidth;
          if (w && w !== this.lastWidth) { this.lastWidth = w; if (this.built) this.layout(); }
        }, 120);
      });
      this.ro.observe(this.pagesEl);

      this.updateZoomUi();
      this.load();
    }

    async load() {
      const r = this.r;
      if (!r.blob && !r.pdfUrl) { this.error('missing'); return; }
      // Opened straight from the disk: pdf.js cannot read local files, the browser can
      if (!r.blob && location.protocol === 'file:') { this.native(); return; }
      try {
        this.pdfjs = await import(`${PDFJS}pdf.min.mjs`);
        this.pdfjs.GlobalWorkerOptions.workerSrc = `${PDFJS}pdf.worker.min.mjs`;
        const src = r.blob ? { data: new Uint8Array(await r.blob.arrayBuffer()) } : { url: LH.fileUrl(r) };
        this.task = this.pdfjs.getDocument({ ...src, isEvalSupported: false });
        this.doc = await this.task.promise;
      } catch (err) {
        if (this.dead) return;
        console.warn('The PDF could not be loaded', err);
        const name = err && err.name;
        this.error(name === 'MissingPDFException' ? 'missing' : name === 'InvalidPDFException' ? 'invalid' : 'failed');
        return;
      }
      if (this.dead) return;

      for (let n = 1; n <= this.doc.numPages; n++) {
        const page = await this.doc.getPage(n);
        if (this.dead) return;
        const vp = page.getViewport({ scale: 1 });
        this.pages.push({ n, page, w: vp.width, h: vp.height, el: null, canvas: null, text: null, scale: 0, drawn: 0, task: null, taskScale: 0, token: 0 });
      }
      this.build();
      this.built = true;
      this.lastWidth = this.pagesEl.clientWidth;
      this.layout();
      this.observe();
      this.updateStatus();
      this.rememberPages();
    }

    /* Page count is only known once the PDF is open: show it, and keep it with a draft */
    async rememberPages() {
      const n = this.doc.numPages;
      if (this.r.pages === n) return;
      this.r.pages = n;
      const meta = $('[data-file-meta]', root);
      if (meta) meta.textContent = LH.fileMeta(this.r);
      if (this.r.isLocal) {
        const raw = await LH.drafts.get(this.r.id);
        if (raw && raw.pages !== n) { raw.pages = n; LH.drafts.put(raw).catch(() => {}); }
      }
    }

    build() {
      const frag = document.createDocumentFragment();
      this.pages.forEach((p) => {
        const d = document.createElement('div');
        d.className = 'pdf-page is-loading';
        d.dataset.n = String(p.n);
        d.dataset.label = `Page ${p.n}`;
        p.el = d;
        frag.appendChild(d);
      });
      this.pagesEl.replaceChildren(frag);
    }

    isFullscreen() { return (document.fullscreenElement || document.webkitFullscreenElement) === this.el; }

    fitWidth() {
      const cs = getComputedStyle(this.pagesEl);
      const avail = this.pagesEl.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      return Math.max(240, Math.min(avail, this.isFullscreen() ? 1280 : 980));
    }

    /* Size every page for the current width and zoom, keeping the reader's place */
    layout() {
      const anchor = this.anchor();
      const w = Math.round(this.fitWidth() * this.zoom);
      this.pages.forEach((p) => {
        p.scale = w / p.w;
        p.el.style.width = `${w}px`;
        p.el.style.height = `${Math.round(p.h * p.scale)}px`;
        p.el.style.setProperty('--scale-factor', String(p.scale));
      });
      this.restore(anchor);
      this.near.forEach((p) => this.draw(p));
      this.updateZoomUi();
      this.updateStatus();
    }

    readingTop() {
      const bar = $('.viewer-bar', this.el).getBoundingClientRect();
      return Math.max(bar.bottom, 0);
    }

    anchor() {
      const p = this.currentPage();
      if (!p) return null;
      const rect = p.el.getBoundingClientRect();
      const ratio = (this.readingTop() - rect.top) / rect.height;
      return ratio >= 0 ? { p, ratio } : null;
    }

    restore(a) {
      if (!a) return;
      const rect = a.p.el.getBoundingClientRect();
      const delta = rect.top + a.ratio * rect.height - this.readingTop();
      if (Math.abs(delta) < 1) return;
      if (this.isFullscreen()) this.el.scrollTop += delta;
      else window.scrollBy({ top: delta, left: 0, behavior: 'instant' });
    }

    currentPage() {
      if (!this.pages.length) return null;
      const top = this.readingTop();
      const bottom = window.innerHeight;
      let best = null;
      let bestVisible = 0;
      for (const p of this.pages) {
        const r = p.el.getBoundingClientRect();
        if (r.bottom <= top) continue;
        if (r.top >= bottom) break;
        const visible = Math.min(r.bottom, bottom) - Math.max(r.top, top);
        if (visible > bestVisible) { bestVisible = visible; best = p; }
      }
      return best;
    }

    observe() {
      if (this.io) this.io.disconnect();
      this.near.clear();
      this.io = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          const p = this.pages[Number(en.target.dataset.n) - 1];
          if (!p) return;
          if (en.isIntersecting) { this.near.add(p); this.draw(p); } else { this.near.delete(p); this.release(p); }
        });
      }, { root: this.isFullscreen() ? this.el : null, rootMargin: '150% 0px' });
      this.pages.forEach((p) => this.io.observe(p.el));
    }

    async draw(p) {
      if (this.dead || !p.page) return;
      if (p.canvas && p.drawn === p.scale) return;
      if (p.task) {
        if (p.taskScale === p.scale) return;
        p.task.cancel();
        p.task = null;
      }
      const token = ++p.token;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      let out = p.scale * dpr;
      const px = p.w * out * p.h * out;
      if (px > MAX_CANVAS_PIXELS) out *= Math.sqrt(MAX_CANVAS_PIXELS / px);
      const vp = p.page.getViewport({ scale: out });
      const canvas = document.createElement('canvas');
      canvas.width = Math.floor(vp.width);
      canvas.height = Math.floor(vp.height);
      canvas.setAttribute('aria-hidden', 'true');
      const scale = p.scale;
      const task = p.page.render({ canvasContext: canvas.getContext('2d', { alpha: false }), viewport: vp });
      p.task = task;
      p.taskScale = scale;
      try {
        await task.promise;
      } catch (err) {
        if (p.task === task) p.task = null;
        canvas.width = canvas.height = 0;
        if (!err || err.name !== 'RenderingCancelledException') console.warn(`Page ${p.n} could not be drawn`, err);
        return;
      }
      if (p.task === task) p.task = null;
      if (this.dead || token !== p.token) { canvas.width = canvas.height = 0; return; }
      if (p.canvas) { p.canvas.width = p.canvas.height = 0; p.canvas.remove(); }
      p.el.insertBefore(canvas, p.el.firstChild);
      p.canvas = canvas;
      p.drawn = scale;
      p.el.classList.remove('is-loading');
      this.drawText(p);
    }

    /* The text layer follows --scale-factor, so it is built once per page
       and stays right through every zoom. */
    async drawText(p) {
      if (p.text || p.textPending || !this.pdfjs.TextLayer) return;
      p.textPending = true;
      const div = document.createElement('div');
      div.className = 'textLayer';
      p.el.appendChild(div);
      try {
        const layer = new this.pdfjs.TextLayer({
          textContentSource: p.page.streamTextContent(),
          container: div,
          viewport: p.page.getViewport({ scale: p.scale }),
        });
        await layer.render();
        const end = document.createElement('div');
        end.className = 'endOfContent';
        div.appendChild(end);
        p.text = div;
      } catch (err) {
        div.remove();
      } finally {
        p.textPending = false;
      }
    }

    release(p) {
      if (p.task) { p.task.cancel(); p.task = null; }
      p.token++;
      if (p.canvas) { p.canvas.width = p.canvas.height = 0; p.canvas.remove(); p.canvas = null; }
      p.drawn = 0;
      p.el.classList.add('is-loading');
    }

    step(dir) {
      const next = dir > 0
        ? ZOOMS.find((z) => z > this.zoom + 1e-6)
        : [...ZOOMS].reverse().find((z) => z < this.zoom - 1e-6);
      if (next) this.setZoom(next);
    }

    setZoom(z) {
      const clamped = Math.min(ZOOMS[ZOOMS.length - 1], Math.max(ZOOMS[0], z));
      if (Math.abs(clamped - this.zoom) < 1e-6) return;
      this.zoom = clamped;
      if (this.built) this.layout(); else this.updateZoomUi();
    }

    updateZoomUi() {
      const reset = $('[data-zoom-reset]', this.el);
      reset.textContent = `${Math.round(this.zoom * 100)}%`;
      reset.setAttribute('aria-label', `Zoom ${Math.round(this.zoom * 100)} percent. Fit to width`);
      const ready = this.built;
      $('[data-zoom-in]', this.el).disabled = !ready || this.zoom >= ZOOMS[ZOOMS.length - 1];
      $('[data-zoom-out]', this.el).disabled = !ready || this.zoom <= ZOOMS[0];
      reset.disabled = !ready;
    }

    onScroll() {
      if (this.scrollFrame) return;
      this.scrollFrame = requestAnimationFrame(() => { this.scrollFrame = 0; this.updateStatus(); });
    }

    updateStatus() {
      if (!this.built || this.dead) return;
      const n = this.doc.numPages;
      const firstTop = this.pages[0].el.getBoundingClientRect().top;
      const p = firstTop < window.innerHeight * 0.6 ? this.currentPage() : null;
      this.setStatus(p ? `Page ${p.n} of ${n}` : `${n} ${n === 1 ? 'page' : 'pages'}`);

      // How far through the report the reader is, drawn as the gold rule under the bar
      const box = this.pagesEl.getBoundingClientRect();
      const top = this.readingTop();
      const travel = box.height - (window.innerHeight - top);
      const read = travel > 0 ? Math.min(1, Math.max(0, (top - box.top) / travel)) : 0;
      const bar = $('.viewer-bar', this.el);
      if (bar) bar.style.setProperty('--read', read.toFixed(4));
    }

    setStatus(text) { if (this.statusEl.textContent !== text) this.statusEl.textContent = text; }

    toggleFullscreen() {
      if (this.isFullscreen()) {
        const exit = document.exitFullscreen || document.webkitExitFullscreen;
        if (exit) exit.call(document);
        return;
      }
      const req = this.el.requestFullscreen || this.el.webkitRequestFullscreen;
      if (!req) return;
      const res = req.call(this.el);
      if (res && typeof res.catch === 'function') res.catch(() => {});
    }

    onFsChange() {
      if (this.dead) return;
      const fs = this.isFullscreen();
      this.el.classList.toggle('is-fs', fs);
      this.fsButtons.forEach((b) => b.setAttribute('aria-label', fs ? 'Exit full screen' : 'Read full screen'));
      const label = $('[data-fs-label]', root);
      if (label) label.textContent = fs ? 'Exit full screen' : 'Read full screen';
      if (this.built) { this.observe(); this.layout(); }
    }

    hideZoom() {
      $$('[data-zoom-in], [data-zoom-out], [data-zoom-reset]', this.el).forEach((b) => { b.hidden = true; });
    }

    native() {
      this.hideZoom();
      this.setStatus('');
      this.pagesEl.innerHTML = `<iframe class="viewer-frame" src="${esc(LH.fileUrl(this.r))}" title="${esc(this.r.title)}"></iframe>`;
    }

    error(kind) {
      this.hideZoom();
      this.setStatus('');
      // Nothing to show full screen; and a missing file cannot be downloaded either
      this.fsButtons.forEach((b) => { b.hidden = true; });
      const divider = $('.viewer-controls .divider', this.el);
      if (divider) divider.hidden = true;
      if (kind === 'missing') {
        $$('.reader-actions a[download], [data-file-meta]', root).forEach((el) => { el.hidden = true; });
      }
      const url = LH.fileUrl(this.r);
      const text = {
        missing: LH.isAuthor
          ? `The file was not found at <code>${esc(this.r.pdfUrl || '(no path)')}</code>. Check that the PDF is in the reports folder and that the name in <code>reports.js</code> matches it exactly.`
          : 'The file for this report is not available at the moment. Please try again later.',
        invalid: 'The file is damaged or is not a PDF, so it cannot be shown here.',
        failed: 'The viewer could not load. You may be offline, or the file may be unavailable. The report can still be downloaded or opened in your browser.',
      }[kind];
      const links = kind === 'missing'
        ? `<a class="btn" href="library.html">Browse the library ${icon('arrowRight', 'icon-arrow')}</a>`
        : `<a class="btn" href="${esc(url)}" download="${esc(LH.downloadName(this.r))}">${icon('download')} Download</a>
           <a class="text-link" href="${esc(url)}" target="_blank" rel="noopener">Open in a new tab ${icon('external')}</a>`;
      this.pagesEl.innerHTML = `
        <div class="viewer-error wrap">
          <p class="state-title">This report could not be displayed.</p>
          <p class="state-text">${text}</p>
          <div class="hero-actions">${links}</div>
        </div>`;
    }

    destroy() {
      this.dead = true;
      if (this.io) this.io.disconnect();
      this.ro.disconnect();
      clearTimeout(this.resizeTimer);
      window.removeEventListener('scroll', this.onScroll);
      this.el.removeEventListener('scroll', this.onScroll);
      document.removeEventListener('fullscreenchange', this.onFsChange);
      document.removeEventListener('webkitfullscreenchange', this.onFsChange);
      this.pages.forEach((p) => {
        if (p.task) p.task.cancel();
        if (p.canvas) p.canvas.width = p.canvas.height = 0;
      });
      if (this.task) this.task.destroy().catch(() => {});
    }
  }

  // After an edit the page redraws; after publishing it opens the published
  // report; after deleting it goes back to the library
  document.addEventListener('longhand:changed', (e) => {
    const d = e.detail || {};
    if (d.id !== id) return;
    if (d.mode === 'delete') location.href = 'library.html';
    else if (d.mode === 'publish') location.replace(`report.html?id=${encodeURIComponent(d.newId || id)}`);
    else init();
  });
  init();
})();
