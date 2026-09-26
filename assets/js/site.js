/* Longhand Research: shared code for every page.
   Report data, formatting, theme, author mode and the add/edit report dialog. */
(function () {
  'use strict';

  const LH = (window.Longhand = window.Longhand || {});

  /* Helpers */

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const num = (v) => {
    if (v === null || v === undefined || typeof v === 'boolean') return null;
    const s = String(v).replace(/[,\s]/g, '').replace(/\u2212/g, '-');
    if (s === '' || s === '-' || s === '+') return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  };

  const MINUS = '\u2212';
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const parseISO = (d) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(d || ''));
    if (!m) return null;
    const dt = new Date(+m[1], +m[2] - 1, +m[3]);
    return dt.getMonth() === +m[2] - 1 ? dt : null;
  };
  // Dates are held together with no-break spaces, so "3 September 2026" never splits across lines
  const NBSP = String.fromCharCode(160);
  const dateLong = (d) => { const x = parseISO(d); return x ? [x.getDate(), MONTHS[x.getMonth()], x.getFullYear()].join(NBSP) : ''; };
  const dateShort = (d) => { const x = parseISO(d); return x ? [x.getDate(), MONTHS[x.getMonth()].slice(0, 3), x.getFullYear()].join(NBSP) : ''; };
  const todayISO = () => {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
  };
  const fmtNum = (n) => (n == null ? '' : Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 }));
  const fmtPct = (n) => (n == null ? '' : (n > 0 ? '+' : n < 0 ? MINUS : '') + Math.abs(n).toFixed(1) + '%');
  const fmtBytes = (b) => (!b ? '' : b < 1048576 ? Math.max(1, Math.round(b / 1024)) + ' KB' : (b / 1048576).toFixed(1) + ' MB');
  const slug = (s) => String(s || '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);

  const ICONS = {
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    arrowRight: '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
    arrowLeft: '<path d="M19 12H5"/><path d="m11 18-6-6 6-6"/>',
    download: '<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/>',
    maximize: '<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>',
    minimize: '<path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M21 8h-3a2 2 0 0 1-2-2V3"/><path d="M3 16h3a2 2 0 0 1 2 2v3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/>',
    plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
    minus: '<path d="M5 12h14"/>',
    external: '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    fileUp: '<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5Z"/><path d="M14 2v5a1 1 0 0 0 1 1h5"/><path d="M12 18v-6"/><path d="m9 15 3-3 3 3"/>',
  };
  const icon = (name, cls = '') => `<svg class="icon ${cls}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${ICONS[name] || ''}</svg>`;

  const CURRENCY_KEY = 'longhand-currency';   // the last currency used in "Add report"
  const storage = {
    get(k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* storage blocked */ } },
    del(k) { try { window.localStorage.removeItem(k); } catch (e) { /* storage blocked */ } },
  };

  /* Report model */

  const CATEGORIES = ['Initiation', 'Update', 'Sector', 'Macro'];
  const COMPANY_CATEGORIES = ['Initiation', 'Update'];
  const RATINGS = ['BUY', 'HOLD', 'SELL'];
  const CURRENCIES = ['IDR', 'USD', 'EUR', 'GBP', 'JPY', 'CNY', 'HKD', 'SGD', 'MYR', 'THB', 'PHP', 'VND', 'INR', 'KRW', 'TWD', 'AUD', 'CAD', 'CHF'];
  const EXCHANGES = ['IDX', 'NYSE', 'NASDAQ', 'LSE', 'HKEX', 'SGX', 'TSE', 'SSE', 'SZSE', 'KRX', 'TWSE', 'ASX', 'NSE', 'BSE', 'Bursa', 'SET', 'PSE', 'Euronext', 'XETRA', 'SIX', 'TSX'];

  const normCategory = (c) => {
    const s = String(c || '').trim().toLowerCase();
    return CATEGORIES.find((x) => x.toLowerCase() === s) || 'Update';
  };

  function normalize(r, source) {
    const price = num(r.price);
    const targetPrice = num(r.targetPrice ?? r.target);
    let upside = num(r.upside);
    if (upside == null && price && targetPrice != null) upside = Math.round((targetPrice / price - 1) * 1000) / 10;
    const rating = RATINGS.includes(String(r.rating || '').trim().toUpperCase()) ? String(r.rating).trim().toUpperCase() : null;
    const pdfUrl = String(r.pdfUrl || r.file || '').trim();
    // An interactive report is its own page rather than a PDF in the reader
    const page = /^[\w./-]+\.html$/.test(String(r.page || '').trim()) ? String(r.page).trim() : '';
    const category = normCategory(r.category || r.type);
    const ticker = String(r.ticker || '').trim().toUpperCase();
    const date = parseISO(r.date) ? String(r.date) : '';
    const out = {
      id: String(r.id || '').trim(),
      ticker,
      exchange: String(r.exchange || '').trim(),
      company: String(r.company || '').trim(),
      sector: String(r.sector || '').trim(),
      category,
      title: String(r.title || '').trim() || 'Untitled report',
      date,
      blurb: String(r.blurb || '').trim(),
      page,
      tags: Array.isArray(r.tags) ? r.tags.map((t) => String(t).trim()).filter(Boolean) : [],
      summary: String(r.summary || r.blurb || '').trim(),
      rating,
      currency: String(r.currency || 'IDR').trim().toUpperCase(),
      price,
      targetPrice,
      upside,
      pdfUrl,
      fileName: String(r.fileName || '').trim() || decodeURIComponentSafe(pdfUrl.split(/[\\/]/).pop() || ''),
      fileSize: num(r.fileSize),
      pages: num(r.pages),
      extra: Array.isArray(r.extra)
        ? r.extra.filter((x) => Array.isArray(x) && x.length >= 2 && String(x[0]).trim()).map((x) => [String(x[0]), String(x[1])])
        : [],
      isLocal: source === 'local',
      blob: source === 'local' ? r.blob || null : null,
    };
    if (!out.id) out.id = [slug(ticker || category), date].filter(Boolean).join('-') || slug(out.title);
    return out;
  }

  function decodeURIComponentSafe(s) { try { return decodeURIComponent(s); } catch (e) { return s; } }

  const subjectOf = (r) => r.ticker || r.category;
  const money = (r, v) => (v == null ? '' : `${r.currency} ${fmtNum(v)}`);
  const reportHref = (r) => r.page || `report.html?id=${encodeURIComponent(r.id)}`;
  const downloadName = (r) => r.fileName || `${subjectOf(r)}_${r.category}_${r.date || 'report'}.pdf`.replace(/\s+/g, '_');

  /* Relative paths in reports.js are written the way a person would type
     them; encode the characters that would otherwise break the address. */
  const safePath = (u) => (!u ? '' : /^([a-z][a-z0-9+.-]*:|\/\/)/i.test(u) ? u : u.replace(/[ #?]/g, (c) => encodeURIComponent(c)));

  const blobUrls = new Map();
  function fileUrl(r) {
    if (r.blob) {
      if (!blobUrls.has(r.id)) blobUrls.set(r.id, URL.createObjectURL(r.blob));
      return blobUrls.get(r.id);
    }
    return safePath(r.pdfUrl);
  }

  /* The call on a report: rating, target, price and upside where present */
  function callRows(r, { withPrice = true } = {}) {
    const rows = [];
    if (r.rating) rows.push({ label: 'Rating', value: r.rating, cls: `rating rating-${r.rating.toLowerCase()}` });
    if (r.targetPrice != null) rows.push({ label: 'Target price', short: 'Target', value: money(r, r.targetPrice) });
    if (withPrice && r.price != null) rows.push({ label: 'Price', short: 'Price', value: money(r, r.price) });
    if (r.upside != null) rows.push({ label: r.upside < 0 ? 'Downside' : 'Upside', value: fmtPct(r.upside) });
    return rows;
  }

  function fileMeta(r) {
    const bits = [];
    if (r.pages) bits.push(`${r.pages} ${r.pages === 1 ? 'page' : 'pages'}`);
    if (r.fileSize) bits.push(fmtBytes(r.fileSize));
    return bits.join(', ');
  }

  /* The small line above a title: category, then ticker, company or date.
     A no-break space ties each dot to the word before it, so a wrapped line
     never starts with a stray dot. */
  function kickerHtml(r, parts, { draft = r.isLocal, category = true } = {}) {
    const items = [category ? `<span class="cat">${esc(r.category)}</span>` : '', ...parts].filter(Boolean);
    const line = items.map((p, i) => (i ? `&nbsp;<span class="dot" aria-hidden="true">&middot;</span> ${p}` : p)).join('');
    return `${line}${draft ? ' <span class="draft-tag" title="Saved in this browser only">Draft</span>' : ''}`;
  }

  /* "IDX: ADRO", the way a listing is written in research, or just the ticker */
  const tickerLabel = (r) => (r.ticker && r.exchange ? `${r.exchange}: ${r.ticker}` : r.ticker);

  /* Key-data ledger. The report page shows it all; the front page only the call. */
  function ledgerHtml(r, label = 'Key data', { extra = true } = {}) {
    const rows = [...callRows(r, { withPrice: extra }), ...(extra ? r.extra.map(([l, v]) => ({ label: l, value: v })) : [])];
    if (!rows.length) return '';
    const sub = [r.ticker ? r.exchange : '', r.sector].filter(Boolean).join(' · ');
    return `
      <p class="ledger-label">${esc(label)}</p>
      <p class="ledger-ticker">${esc(subjectOf(r))}</p>
      ${sub ? `<p class="ledger-sector">${esc(sub)}</p>` : ''}
      <dl>
        ${rows.map((x) => `<div class="ledger-row"><dt>${esc(x.label)}</dt><dd${x.cls ? ` class="${x.cls}"` : ''}>${esc(x.value)}</dd></div>`).join('')}
      </dl>`;
  }

  /* Catalogue numbers, the way a library numbers its holdings: in order of
     publication, oldest first. Drafts have no number until they are published. */
  let numbers = null;
  function catalogueNo(r) {
    if (!r || r.isLocal) return '';
    if (!numbers) {
      numbers = new Map();
      published().slice()
        .sort((a, b) => (a.date || '').localeCompare(b.date || '') || a.id.localeCompare(b.id))
        .forEach((x, i) => numbers.set(x.id, i + 1));
    }
    const n = numbers.get(r.id);
    return n ? `No.${NBSP}${String(n).padStart(3, '0')}` : '';
  }

  /* Storage: published catalogue + drafts saved in this browser */

  /* reports.js is edited by hand, so it is checked as it is read. Problems
     are kept in catalogIssues() and shown to the author on the library page. */
  let issues = null;
  function published() {
    const list = Array.isArray(window.LONGHAND_REPORTS) ? window.LONGHAND_REPORTS : [];
    const seen = new Set();
    const out = [];
    const found = [];
    list.forEach((raw, i) => {
      const where = `Entry ${i + 1}${raw && raw.title ? ` (“${raw.title}”)` : ''}`;
      if (!raw || typeof raw !== 'object') { found.push(`${where} is not a report entry.`); return; }
      const r = normalize(raw, 'published');
      if (seen.has(r.id)) { found.push(`${where} uses the id “${r.id}”, which is already taken; it is not shown.`); return; }
      if (!raw.title) found.push(`${where} has no title.`);
      if (!parseISO(raw.date)) found.push(`${where}: write the date as YYYY-MM-DD, for example 2026-09-03.`);
      if (!r.pdfUrl && !r.page) found.push(`${where} has no pdfUrl, so there is no PDF to open.`);
      if (raw.category && !CATEGORIES.includes(raw.category)) found.push(`${where}: the category should be Initiation, Update, Sector or Macro.`);
      seen.add(r.id);
      out.push(r);
    });
    if (!issues) {
      issues = found;
      found.forEach((m) => console.warn(`reports.js: ${m}`));
    }
    return out;
  }

  function catalogProblem() {
    const err = window.LONGHAND_CATALOG_ERROR;
    if (err) return { kind: 'syntax', message: err.message, line: err.line };
    if (!Array.isArray(window.LONGHAND_REPORTS)) return { kind: 'missing' };
    return null;
  }
  function catalogIssues() { if (!issues) published(); return issues || []; }

  const DB_NAME = 'longhand-research';
  const STORE = 'reports';        // drafts, with their PDFs
  const SETTINGS = 'settings';    // small things this browser remembers, such as the site folder
  let dbPromise = null;
  function openDb() {
    if (!('indexedDB' in window)) return Promise.reject(new Error('IndexedDB is not available'));
    if (!dbPromise) {
      dbPromise = new Promise((resolve, reject) => {
        let req;
        try { req = indexedDB.open(DB_NAME, 2); } catch (e) { reject(e); return; }
        req.onupgradeneeded = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' });
          if (!db.objectStoreNames.contains(SETTINGS)) db.createObjectStore(SETTINGS, { keyPath: 'key' });
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
        req.onblocked = () => reject(new Error('IndexedDB is blocked'));
      });
      dbPromise.catch(() => { dbPromise = null; });
    }
    return dbPromise;
  }
  async function tx(mode, fn, store = STORE) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const t = db.transaction(store, mode);
      const req = fn(t.objectStore(store));
      t.oncomplete = () => resolve(req ? req.result : undefined);
      t.onerror = () => reject(t.error);
      t.onabort = () => reject(t.error || new Error('The browser cancelled the save'));
    });
  }
  const drafts = {
    all: () => tx('readonly', (s) => s.getAll()).then((rows) => rows || []).catch(() => []),
    get: (id) => tx('readonly', (s) => s.get(id)).catch(() => undefined),
    put: (rec) => tx('readwrite', (s) => s.put(rec)),
    remove: (id) => tx('readwrite', (s) => s.delete(id)),
  };
  const settings = {
    get: (key) => tx('readonly', (s) => s.get(key), SETTINGS).then((row) => row && row.value).catch(() => undefined),
    set: (key, value) => tx('readwrite', (s) => s.put({ key, value }), SETTINGS),
  };

  const byDateDesc = (a, b) =>
    (b.date || '').localeCompare(a.date || '') ||
    (a.isLocal === b.isLocal ? 0 : a.isLocal ? -1 : 1) ||
    a.title.localeCompare(b.title);

  /* Published reports only, newest first, available at once so a page can
     be drawn before the browser's draft store has answered. */
  const publishedSorted = () => published().sort(byDateDesc);

  /* Drafts and the author tools exist only on this computer (the site opened
     as a file or from localhost), never on the live site. */
  const onThisComputer = location.protocol === 'file:' || /^(localhost|127\.0\.0\.1|\[::1\]|0\.0\.0\.0)$/.test(location.hostname);

  /* Every report, newest first. A draft whose id has since been published
     is hidden, so a report never shows twice. */
  async function allReports() {
    const pub = published();
    if (!onThisComputer) return pub.sort(byDateDesc);
    const ids = new Set(pub.map((r) => r.id));
    const local = (await drafts.all()).map((r) => normalize(r, 'local')).filter((r) => r.id && !ids.has(r.id));
    return [...local, ...pub].sort(byDateDesc);
  }

  async function findReport(id) {
    const pub = published().find((r) => r.id === id);
    if (pub || !onThisComputer) return pub || null;
    const rec = await drafts.get(id);
    return rec ? normalize(rec, 'local') : null;
  }

  async function uniqueId(base) {
    const taken = new Set([...published().map((r) => r.id), ...(await drafts.all()).map((r) => r.id)]);
    let id = base || 'report';
    let i = 2;
    while (taken.has(id)) id = `${base}-${i++}`;
    return id;
  }

  /* The catalogue entry for a draft: pasted into reports/reports.js by hand,
     or written there by "Publish" */
  function entryFor(raw) {
    return JSON.stringify(entryObject(raw), null, 2).replace(/^/gm, '  ').concat(',');
  }
  function entryObject(raw) {
    const r = normalize(raw, 'local');
    const entry = {
      id: r.id,
      ticker: r.ticker,
      exchange: r.exchange || undefined,
      company: r.company,
      category: r.category,
      title: r.title,
      date: r.date,
      summary: r.summary,
      rating: r.rating,
      currency: COMPANY_CATEGORIES.includes(r.category) ? r.currency : undefined,
      price: r.price,
      targetPrice: r.targetPrice,
      upside: r.upside,
      pdfUrl: `reports/${r.fileName}`,
    };
    if (r.pages) entry.pages = r.pages;
    if (r.fileSize) entry.fileSize = r.fileSize;
    return JSON.parse(JSON.stringify(entry));   // drops the fields left undefined
  }

  /* Theme */

  const THEME_KEY = 'longhand-theme';
  const currentTheme = () => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');
  function applyTheme(t) {
    document.documentElement.dataset.theme = t;
    const meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', t === 'dark' ? '#15130f' : '#f3efe7');
    const next = t === 'dark' ? 'light' : 'dark';
    $$('[data-theme-toggle]').forEach((b) => {
      b.setAttribute('aria-label', `Switch to ${next} theme`);
      b.title = `Switch to ${next} theme`;
    });
    document.dispatchEvent(new CustomEvent('longhand:theme', { detail: { theme: t } }));
  }
  /* The new colours spread out in a circle from the switch that was pressed */
  function switchTheme(t, from) {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!document.startViewTransition || reduce || !from || document.querySelector('dialog[open]')) { applyTheme(t); return; }
    const box = from.getBoundingClientRect();
    const x = box.left + box.width / 2;
    const y = box.top + box.height / 2;
    const r = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
    const root = document.documentElement;
    root.classList.add('theme-vt');
    let vt;
    try { vt = document.startViewTransition(() => applyTheme(t)); } catch (e) { root.classList.remove('theme-vt'); applyTheme(t); return; }
    vt.updateCallbackDone.catch(() => {});
    vt.finished.catch(() => {});
    vt.ready.then(() => {
      root.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
        { duration: 620, easing: 'cubic-bezier(0.2, 0.7, 0.1, 1)', pseudoElement: '::view-transition-new(root)' },
      );
    }).catch(() => {});
    const done = () => root.classList.remove('theme-vt');
    vt.finished.then(done, done);
  }

  function initTheme() {
    applyTheme(currentTheme());
    $$('[data-theme-toggle]').forEach((b) => b.addEventListener('click', () => {
      const t = currentTheme() === 'dark' ? 'light' : 'dark';
      storage.set(THEME_KEY, t);
      switchTheme(t, b);
    }));
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const follow = (e) => { if (!storage.get(THEME_KEY)) applyTheme(e.matches ? 'dark' : 'light'); };
    if (mq.addEventListener) mq.addEventListener('change', follow); else if (mq.addListener) mq.addListener(follow);
    // A page brought back by the Back button may have been left in the other theme
    window.addEventListener('pageshow', (e) => {
      if (!e.persisted) return;
      const saved = storage.get(THEME_KEY);
      const t = saved === 'dark' || saved === 'light' ? saved : mq.matches ? 'dark' : 'light';
      if (t !== currentTheme()) applyTheme(t);
    });
  }

  /* Author mode
     Add report, and Publish and Delete on each report, are tools for the
     author, not for readers. They only exist when the site is opened from
     this computer (file or localhost); the live site never shows them. */

  function initAuthor() {
    storage.del('longhand-author'); // an older switch that let the live site show them
    LH.isAuthor = onThisComputer;
    document.documentElement.classList.toggle('is-author', LH.isAuthor);
    $$('[data-add-report]').forEach((b) => {
      b.hidden = !LH.isAuthor;
      b.addEventListener('click', () => openReportForm({ mode: 'add' }));
    });
  }

  /* Dialogs */

  function makeDialog(className, html, { backdropCloses = true } = {}) {
    const d = document.createElement('dialog');
    d.className = className;
    d.innerHTML = html;
    document.body.appendChild(d);
    if (backdropCloses) {
      // Only a press that starts and ends on the backdrop closes the dialog,
      // so dragging a text selection out of a field never does.
      const onBackdrop = (e) => {
        if (e.target !== d) return false;
        const r = d.getBoundingClientRect();
        return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
      };
      let pressedOutside = false;
      d.addEventListener('pointerdown', (e) => { pressedOutside = onBackdrop(e); });
      d.addEventListener('click', (e) => { if (pressedOutside && onBackdrop(e)) d.close('cancel'); pressedOutside = false; });
    }
    d.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) d.close('cancel'); });
    return d;
  }

  // The page behind a dialog stops scrolling through CSS (html:has(dialog[open]))
  function openModal(d) {
    if (typeof d.showModal === 'function') d.showModal(); else d.setAttribute('open', '');
  }

  // A small question (or, with cancel: null, a notice). `html` is trusted markup built here.
  function confirmDialog({ title, text = '', html = '', confirm = 'Confirm', danger = false, cancel = 'Cancel' }) {
    return new Promise((resolve) => {
      const d = makeDialog('sheet confirm', `
        <div class="sheet-head"><h2 class="sheet-title" id="cf-title">${esc(title)}</h2></div>
        <div class="sheet-body">${html || `<p>${esc(text)}</p>`}</div>
        <div class="sheet-foot">
          ${cancel ? `<button type="button" class="btn btn-quiet" data-close>${esc(cancel)}</button>` : ''}
          <button type="button" class="btn ${danger ? 'btn-danger' : 'btn-solid'}" data-ok>${esc(confirm)}</button>
        </div>`);
      d.setAttribute('aria-labelledby', 'cf-title');
      $('[data-ok]', d).addEventListener('click', () => d.close('ok'));
      d.addEventListener('close', () => { resolve(d.returnValue === 'ok'); d.remove(); }, { once: true });
      openModal(d);
      ($('[data-close]', d) || $('[data-ok]', d)).focus();
    });
  }

  async function copyText(text, container) {
    try {
      if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(text); return true; }
    } catch (e) { /* fall through */ }
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none;';
    (container || document.body).appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    ta.remove();
    return ok;
  }

  /* Add / edit report */

  const MAX_BYTES = 100 * 1048576;

  const FORM_HTML = `
    <form class="report-form" novalidate data-form>
      <div class="sheet-head">
        <div>
          <h2 class="sheet-title" id="rf-heading" data-heading>Add a report</h2>
          <p class="sheet-sub" data-sub>Fields marked * are required. The report is kept in this browser until you publish it.</p>
          <p class="sheet-sub" data-restored hidden>What you entered earlier has been kept. <button type="button" class="text-link" data-clear-form>Clear the form</button></p>
        </div>
        <button type="button" class="icon-btn sheet-close" data-close aria-label="Close">${icon('x')}</button>
      </div>
      <div class="sheet-body">
        <div class="field" data-file-field>
          <span class="field-label" id="rf-file-label" data-file-label>Report PDF *</span>
          <div class="file-drop" data-drop>
            ${icon('fileUp')}
            <span class="file-drop-text" data-file-text><strong>Choose a PDF</strong> or drop it here</span>
            <input type="file" id="rf-file" accept="application/pdf,.pdf" aria-labelledby="rf-file-label" aria-describedby="rf-file-err">
          </div>
          <span class="field-error" id="rf-file-err" data-err="file"></span>
        </div>

        <div class="form-grid" style="margin-top:20px">
          <div class="field span-2">
            <label for="rf-title">Title *</label>
            <input class="input" id="rf-title" name="title" maxlength="160" autocomplete="off" aria-describedby="rf-title-err">
            <span class="field-error" id="rf-title-err" data-err="title"></span>
          </div>
          <div class="field">
            <label for="rf-category">Category *</label>
            <select class="input" id="rf-category" name="category">
              ${CATEGORIES.map((c) => `<option>${c}</option>`).join('')}
            </select>
          </div>
          <div class="field">
            <label for="rf-date">Publication date *</label>
            <input class="input" type="date" id="rf-date" name="date" aria-describedby="rf-date-err">
            <span class="field-error" id="rf-date-err" data-err="date"></span>
          </div>
          <div class="field span-2">
            <label for="rf-company" data-company-label>Company *</label>
            <input class="input" id="rf-company" name="company" maxlength="120" autocomplete="off" aria-describedby="rf-company-err">
            <span class="field-error" id="rf-company-err" data-err="company"></span>
          </div>
          <div class="field">
            <label for="rf-ticker" data-ticker-label>Ticker *</label>
            <input class="input upper" id="rf-ticker" name="ticker" maxlength="12" autocomplete="off" spellcheck="false" aria-describedby="rf-ticker-err">
            <span class="field-error" id="rf-ticker-err" data-err="ticker"></span>
          </div>
          <div class="field">
            <label for="rf-exchange">Exchange <span class="opt">(optional)</span></label>
            <input class="input" id="rf-exchange" name="exchange" maxlength="16" autocomplete="off" spellcheck="false" list="rf-exchanges" placeholder="IDX, NYSE, HKEX" aria-describedby="rf-exchange-err">
            <datalist id="rf-exchanges">${EXCHANGES.map((x) => `<option value="${x}"></option>`).join('')}</datalist>
            <span class="field-error" id="rf-exchange-err" data-err="exchange"></span>
          </div>
          <div class="field span-2">
            <label for="rf-summary">Summary *</label>
            <textarea class="input" id="rf-summary" name="summary" rows="4" maxlength="1500" aria-describedby="rf-summary-hint rf-summary-err"></textarea>
            <span class="hint" id="rf-summary-hint">Two to four sentences: the call, the valuation and the main risk.</span>
            <span class="field-error" id="rf-summary-err" data-err="summary"></span>
          </div>
        </div>

        <fieldset class="fieldset" data-call>
          <legend>The call</legend>
          <div class="form-grid-call">
            <div class="field">
              <label for="rf-rating">Rating</label>
              <select class="input" id="rf-rating" name="rating">
                <option value="">None</option>${RATINGS.map((r) => `<option>${r}</option>`).join('')}
              </select>
            </div>
            <div class="field">
              <label for="rf-currency">Currency</label>
              <select class="input" id="rf-currency" name="currency">
                ${CURRENCIES.map((c) => `<option>${c}</option>`).join('')}
              </select>
            </div>
            <div class="field">
              <label for="rf-price">Price</label>
              <input class="input" id="rf-price" name="price" inputmode="decimal" autocomplete="off" aria-describedby="rf-price-err">
              <span class="field-error" id="rf-price-err" data-err="price"></span>
            </div>
            <div class="field">
              <label for="rf-target">Target</label>
              <input class="input" id="rf-target" name="targetPrice" inputmode="decimal" autocomplete="off" aria-describedby="rf-target-err">
              <span class="field-error" id="rf-target-err" data-err="targetPrice"></span>
            </div>
            <div class="field">
              <label for="rf-upside">Upside %</label>
              <input class="input" id="rf-upside" name="upside" inputmode="decimal" autocomplete="off" placeholder="Auto" aria-describedby="rf-upside-hint rf-upside-err">
              <span class="field-error" id="rf-upside-err" data-err="upside"></span>
            </div>
          </div>
          <p class="hint" id="rf-upside-hint" data-upside-hint style="margin-top:10px">Leave upside empty and it is worked out from the price and the target.</p>
        </fieldset>

        <p class="field-error" data-err="form" role="alert" style="margin-top:16px"></p>
      </div>
      <div class="sheet-foot">
        <button type="button" class="btn btn-quiet" data-close>Cancel</button>
        <button type="submit" class="btn btn-solid" data-submit>Add to library</button>
      </div>
    </form>

    <div class="report-done" data-done hidden>
      <div class="sheet-head">
        <div>
          <h2 class="sheet-title" id="rf-done-heading" data-done-heading tabindex="-1">Saved in this browser</h2>
          <p class="sheet-sub" data-done-sub></p>
        </div>
        <button type="button" class="icon-btn sheet-close" data-close aria-label="Close">${icon('x')}</button>
      </div>
      <div class="sheet-body">
        <div class="publish-now" data-publish-block>
          <p class="field-label">Publish it in one step</p>
          <p class="hint">Copies the PDF into your site folder and adds the report to reports/reports.js. Push to Git afterwards and it is online.</p>
          <button type="button" class="btn btn-solid" data-publish-now>Publish to site folder</button>
        </div>
        <details class="by-hand" data-by-hand>
        <summary data-by-hand-label>Or publish it by hand</summary>
        <ol class="done-steps">
          <li>Copy the PDF into the <code>reports</code> folder as <code data-done-file></code>.</li>
          <li>Open <code>reports/reports.js</code> and paste this entry on the line after <code>window.LONGHAND_REPORTS = [</code>. Then push the folder to Git or upload it.
            <pre class="entry" data-entry></pre>
            <div class="copy-row">
              <button type="button" class="btn btn-sm btn-quiet" data-copy>Copy entry</button>
              <span class="copy-status" data-copy-status aria-live="polite"></span>
            </div>
          </li>
        </ol>
        </details>
      </div>
      <div class="sheet-foot">
        <button type="button" class="btn btn-quiet" data-close>Close</button>
        <a class="btn" data-open-saved href="#">Open report ${icon('arrowRight', 'icon-arrow')}</a>
      </div>
    </div>`;

  let formDlg = null;
  let doneRecord = null; // the draft shown in the "saved" panel
  let formCtx = null;  // { mode, record, file, saved }
  let unsaved = null;  // what was typed into "Add a report" before it was closed unsaved
  let saving = false;  // a save is in progress; the dialog stays open until it ends

  function formDialog() {
    if (formDlg) return formDlg;
    const d = makeDialog('sheet', FORM_HTML, { backdropCloses: false });
    d.setAttribute('aria-labelledby', 'rf-heading');
    const form = $('[data-form]', d);
    const fileInput = $('#rf-file', d);
    const drop = $('[data-drop]', d);

    fileInput.addEventListener('change', () => onFile(fileInput.files[0] || null));
    ['dragenter', 'dragover'].forEach((t) => drop.addEventListener(t, () => drop.classList.add('is-over')));
    ['dragleave', 'drop'].forEach((t) => drop.addEventListener(t, () => drop.classList.remove('is-over')));

    $('#rf-category', d).addEventListener('change', syncCategory);
    ['#rf-price', '#rf-target'].forEach((s) => $(s, d).addEventListener('input', syncUpside));
    $('#rf-ticker', d).addEventListener('input', (e) => {
      const el = e.target;
      const pos = el.selectionStart;
      el.value = el.value.toUpperCase().replace(/[^A-Z0-9.:\-]/g, '');
      try { el.setSelectionRange(pos, pos); } catch (err) { /* not a text field */ }
    });
    // Clear a field's error as soon as it is edited
    form.addEventListener('input', (e) => {
      const name = e.target.name || (e.target.id === 'rf-file' ? 'file' : '');
      if (name) setError(name, '');
    });
    form.addEventListener('submit', onSubmit);

    $('[data-copy]', d).addEventListener('click', async () => {
      const ok = await copyText($('[data-entry]', d).textContent, d);
      $('[data-copy-status]', d).textContent = ok ? 'Copied to the clipboard.' : 'Select the text above and copy it.';
    });
    // Publish the draft just saved, straight into the site folder
    $('[data-publish-now]', d).addEventListener('click', async () => {
      if (!doneRecord) return;
      const ok = await authorAction('publish', normalize(doneRecord, 'local'), { ask: false });
      if (ok) d.close();
    });
    $('[data-clear-form]', d).addEventListener('click', () => {
      unsaved = null;
      openReportForm({ mode: 'add', reopen: true });
    });
    d.addEventListener('cancel', (e) => { if (saving) e.preventDefault(); });   // Esc waits for a save
    d.addEventListener('close', () => {
      const ctx = formCtx;
      formCtx = null;
      if (!ctx) return;
      // Keep an unfinished new report, so closing by accident loses nothing
      if (ctx.mode === 'add' && !ctx.saved && !$('[data-form]', d).hidden) {
        const v = readForm();
        const typed = ctx.file || v.title || v.company || v.ticker || v.summary || v.price || v.targetPrice;
        unsaved = typed ? { values: v, file: ctx.file } : null;
      }
    });
    formDlg = d;
    return d;
  }

  function setError(name, msg) {
    const d = formDlg;
    const err = $(`[data-err="${name}"]`, d);
    if (err) err.textContent = msg || '';
    const field = name === 'file' ? $('[data-drop]', d) : $(`[name="${name}"]`, d);
    if (field) {
      if (msg) field.setAttribute('aria-invalid', 'true'); else field.removeAttribute('aria-invalid');
    }
  }

  function syncCategory() {
    const d = formDlg;
    const cat = $('#rf-category', d).value;
    const company = COMPANY_CATEGORIES.includes(cat);
    $('[data-call]', d).hidden = !company;
    $('[data-company-label]', d).textContent = company ? 'Company *' : 'Subject *';
    $('[data-ticker-label]', d).innerHTML = company ? 'Ticker *' : 'Ticker <span class="opt">(optional)</span>';
    if (!company) setError('ticker', '');
  }

  function syncUpside() {
    const d = formDlg;
    const price = num($('#rf-price', d).value);
    const target = num($('#rf-target', d).value);
    const up = $('#rf-upside', d);
    up.placeholder = price > 0 && target > 0 ? `Auto ${fmtPct(Math.round((target / price - 1) * 1000) / 10)}` : 'Auto';
  }

  function showFile(file) {
    const d = formDlg;
    $('[data-drop]', d).classList.add('has-file');
    $('[data-file-text]', d).innerHTML = `<strong>${esc(file.name)}</strong> &middot; ${fmtBytes(file.size)} &middot; choose again to replace`;
  }

  async function onFile(file) {
    const d = formDlg;
    const ctx = formCtx;
    if (!ctx) return;
    ctx.file = null;
    const text = $('[data-file-text]', d);
    const drop = $('[data-drop]', d);
    if (!file) {
      drop.classList.remove('has-file');
      text.innerHTML = ctx.mode === 'edit'
        ? `<strong>Keep the current PDF</strong> or choose a new one`
        : `<strong>Choose a PDF</strong> or drop it here`;
      return;
    }
    const problem = await checkPdf(file);
    if (formCtx !== ctx) return; // the dialog was closed while the file was being checked
    if (problem) {
      setError('file', problem);
      drop.classList.remove('has-file');
      text.innerHTML = `<strong>Choose a PDF</strong> or drop it here`;
      $('#rf-file', d).value = '';
      return;
    }
    setError('file', '');
    ctx.file = file;
    showFile(file);
  }

  async function checkPdf(file) {
    const looksPdf = /\.pdf$/i.test(file.name) || file.type === 'application/pdf';
    if (!looksPdf) return 'That file is not a PDF.';
    if (file.size === 0) return 'That file is empty.';
    if (file.size > MAX_BYTES) return 'That PDF is larger than 100 MB. Compress it and try again.';
    try {
      const head = new Uint8Array(await file.slice(0, 1024).arrayBuffer());
      const text = String.fromCharCode.apply(null, head);
      if (!text.includes('%PDF-')) return 'That file does not look like a valid PDF.';
    } catch (e) { /* unreadable header: let the reader report it later */ }
    return '';
  }

  function openReportForm({ mode = 'add', record = null, reopen = false } = {}) {
    const d = formDialog();
    const form = $('[data-form]', d);
    formCtx = { mode, record, file: null, saved: null };
    const restore = mode === 'add' && !reopen ? unsaved : null;
    form.hidden = false;
    $('[data-done]', d).hidden = true;
    d.setAttribute('aria-labelledby', 'rf-heading');
    form.reset();
    $$('[data-err]', d).forEach((e) => { e.textContent = ''; });
    $$('[aria-invalid]', d).forEach((e) => e.removeAttribute('aria-invalid'));
    $('[data-drop]', d).classList.remove('has-file', 'is-over');

    const editing = mode === 'edit' && record;
    $('[data-heading]', d).textContent = editing ? 'Edit report details' : 'Add a report';
    $('[data-submit]', d).textContent = editing ? 'Save changes' : 'Add to library';
    $('[data-file-label]', d).textContent = editing ? 'Report PDF' : 'Report PDF *';
    onFile(null);

    const v = editing ? record : restore ? restore.values : { category: 'Initiation', date: todayISO() };
    $('#rf-title', d).value = v.title || '';
    $('#rf-category', d).value = CATEGORIES.includes(v.category) ? v.category : 'Initiation';
    $('#rf-date', d).value = v.date || todayISO();
    $('#rf-date', d).max = todayISO();
    $('#rf-company', d).value = v.company || '';
    $('#rf-ticker', d).value = v.ticker || '';
    $('#rf-exchange', d).value = v.exchange || '';
    $('#rf-summary', d).value = v.summary || '';
    $('#rf-rating', d).value = v.rating || '';
    const lastCurrency = storage.get(CURRENCY_KEY);
    const cur = String(v.currency || lastCurrency || 'IDR').toUpperCase();
    const curSelect = $('#rf-currency', d);
    if (!CURRENCIES.includes(cur) && !$(`option[value="${cur}"]`, curSelect) && /^[A-Z]{3}$/.test(cur)) {
      curSelect.insertAdjacentHTML('beforeend', `<option value="${cur}">${cur}</option>`);
    }
    curSelect.value = /^[A-Z]{3}$/.test(cur) ? cur : 'IDR';
    $('#rf-price', d).value = v.price ?? '';
    $('#rf-target', d).value = v.targetPrice ?? '';
    $('#rf-upside', d).value = editing ? (v.upside != null && v.upsideManual ? v.upside : '') : v.upside || '';
    if (restore && restore.file) { formCtx.file = restore.file; showFile(restore.file); }
    $('[data-restored]', d).hidden = !restore;
    syncCategory();
    syncUpside();
    if (!d.open) openModal(d);
    (editing ? $('#rf-title', d) : $('#rf-file', d)).focus();
  }

  function readForm() {
    const d = formDlg;
    const val = (s) => $(s, d).value.trim();
    return {
      title: val('#rf-title').replace(/\s+/g, ' '),
      category: val('#rf-category'),
      date: val('#rf-date'),
      company: val('#rf-company').replace(/\s+/g, ' '),
      ticker: val('#rf-ticker').toUpperCase(),
      exchange: val('#rf-exchange').replace(/\s+/g, ' '),
      summary: val('#rf-summary').replace(/[ \t]+/g, ' '),
      rating: val('#rf-rating'),
      currency: val('#rf-currency') || 'IDR',
      price: val('#rf-price'),
      targetPrice: val('#rf-target'),
      upside: val('#rf-upside').replace('%', ''),
    };
  }

  function validate(v) {
    const e = {};
    const company = COMPANY_CATEGORIES.includes(v.category);
    if (formCtx.mode === 'add' && !formCtx.file) e.file = 'Choose the report PDF.';
    if (!v.title) e.title = 'Give the report a title.';
    if (!v.company) e.company = company ? 'Name the company.' : 'Name the subject, for example "Asian banks" or "US rates".';
    if (!v.date) e.date = 'Add the publication date.';
    else if (!parseISO(v.date)) e.date = 'Use a real date.';
    else if (v.date > todayISO()) e.date = 'The date is in the future.';
    if (company && !v.ticker) e.ticker = 'Add the ticker, for example ADRO or AAPL.';
    else if (v.ticker && !/^[A-Z0-9][A-Z0-9.:\-]{0,11}$/.test(v.ticker)) e.ticker = 'Use the ticker as it is listed, for example ADRO, AAPL or 0700.HK.';
    if (v.exchange && !/^[\p{L}\p{N}][\p{L}\p{N} &.\-]{0,15}$/u.test(v.exchange)) e.exchange = 'Use the exchange name or code, for example IDX or NYSE.';
    if (!v.summary) e.summary = 'Add a short summary.';
    else if (v.summary.length < 40) e.summary = 'Write at least a full sentence.';
    if (company) {
      const price = num(v.price);
      const target = num(v.targetPrice);
      if (v.price && (price == null || price <= 0)) e.price = 'Enter a price above zero.';
      if (v.targetPrice && (target == null || target <= 0)) e.targetPrice = 'Enter a target above zero.';
      if (v.upside && num(v.upside) == null) e.upside = 'Enter a number, for example 22.4.';
      if (v.rating && !v.targetPrice && !e.targetPrice) e.targetPrice = 'A rating needs a target price.';
    }
    return e;
  }

  async function onSubmit(e) {
    e.preventDefault();
    const d = formDlg;
    const v = readForm();
    const errors = validate(v);
    ['file', 'title', 'company', 'date', 'ticker', 'exchange', 'summary', 'price', 'targetPrice', 'upside', 'form']
      .forEach((k) => setError(k, errors[k] || ''));
    const firstBad = Object.keys(errors)[0];
    if (firstBad) {
      const el = firstBad === 'file' ? $('#rf-file', d) : $(`[name="${firstBad}"]`, d);
      if (el) el.focus();
      return;
    }

    const company = COMPANY_CATEGORIES.includes(v.category);
    const price = company ? num(v.price) : null;
    const targetPrice = company ? num(v.targetPrice) : null;
    const manualUpside = company && v.upside ? num(v.upside) : null;
    if (company) storage.set(CURRENCY_KEY, v.currency);
    const meta = {
      title: v.title,
      company: v.company,
      ticker: v.ticker,
      exchange: v.exchange,
      category: v.category,
      date: v.date,
      summary: v.summary,
      rating: company ? v.rating || null : null,
      currency: company ? v.currency : null,
      price,
      targetPrice,
      upside: manualUpside,
      upsideManual: manualUpside != null,
      updatedAt: new Date().toISOString(),
    };

    // While the save is running the dialog cannot be closed, and everything
    // below works on this form's own context, never on a newer one.
    const ctx = formCtx;
    const submit = $('[data-submit]', d);
    const closers = $$('[data-form] [data-close]', d);
    const label = submit.textContent;
    saving = true;
    submit.disabled = true;
    submit.textContent = 'Saving';
    closers.forEach((b) => { b.disabled = true; });
    const finish = () => {
      saving = false;
      submit.disabled = false;
      submit.textContent = label;
      closers.forEach((b) => { b.disabled = false; });
    };
    let rec;
    try {
      if (ctx.mode === 'edit' && ctx.record) {
        const old = (await drafts.get(ctx.record.id)) || {};
        rec = { ...old, ...meta, id: ctx.record.id };
      } else {
        const base = [slug(v.ticker || v.category), v.date].filter(Boolean).join('-');
        rec = { ...meta, id: await uniqueId(base), createdAt: meta.updatedAt };
      }
      if (ctx.file) {
        rec.blob = ctx.file;
        rec.fileName = ctx.file.name.replace(/\s+/g, '_');
        rec.fileSize = ctx.file.size;
        rec.pages = null;
      }
      await drafts.put(rec);
    } catch (err) {
      console.warn('Save failed', err);
      finish();
      setError('form', 'This browser could not save the report. Private windows often block storage; try a normal window.');
      return;
    }
    finish();
    const blobKey = blobUrls.get(rec.id);
    if (blobKey && ctx.file) { URL.revokeObjectURL(blobKey); blobUrls.delete(rec.id); }
    if (ctx.mode === 'add') unsaved = null;
    ctx.saved = normalize(rec, 'local');
    document.dispatchEvent(new CustomEvent('longhand:changed', { detail: { id: rec.id, mode: ctx.mode } }));
    if (formCtx === ctx) showPublishSteps(rec, ctx.mode === 'edit' ? 'Changes saved' : 'Saved in this browser');
  }

  /* The "how to publish" panel, shown after saving and from a draft's page */
  function showPublishSteps(rec, heading = 'Publish this report') {
    const d = formDialog();
    if (!formCtx) formCtx = { mode: 'view', record: rec, file: null, saved: null };
    const r = normalize(rec, 'local');
    $('[data-form]', d).hidden = true;
    const done = $('[data-done]', d);
    done.hidden = false;
    d.setAttribute('aria-labelledby', 'rf-done-heading');
    $('[data-done-heading]', d).textContent = heading;
    $('[data-done-sub]', d).textContent = `“${r.title}” is a draft in this browser, so only you can see it. Readers see it once it is published.`;
    $('[data-done-file]', d).textContent = r.fileName;
    $('[data-entry]', d).textContent = entryFor(rec);
    $('[data-copy-status]', d).textContent = '';
    // One-step publishing where the browser can write to the site folder;
    // elsewhere the by-hand steps are shown open
    doneRecord = rec;
    const oneStep = canWriteFolder() && !!rec.blob;
    $('[data-publish-block]', d).hidden = !oneStep;
    $('[data-by-hand]', d).open = !oneStep;
    $('[data-by-hand-label]', d).textContent = oneStep ? 'Or publish it by hand' : 'Publish it by hand';
    const open = $('[data-open-saved]', d);
    open.href = reportHref(r);
    open.hidden = /\/report(\.html)?$/.test(location.pathname) && new URLSearchParams(location.search).get('id') === r.id;
    if (!d.open) openModal(d);
    $('[data-done-heading]', d).focus();
  }

  /* Author tools: publish and delete, straight in the site folder.
     A static site cannot change its own files from a browser, but Chrome and
     Edge can be given access to a folder on this computer. The author picks
     the site folder once. Publishing then copies a draft's PDF into reports/
     and writes its entry into reports.js; deleting takes both out again.
     The change goes online when the folder is pushed to Git or uploaded.
     Other browsers get the same steps written out to do by hand. */

  const canWriteFolder = () => typeof window.showDirectoryPicker === 'function';
  const fileOf = (pdfUrl) => decodeURIComponentSafe(String(pdfUrl || '').split('/').pop());
  const changed = (detail) => document.dispatchEvent(new CustomEvent('longhand:changed', { detail }));

  // The site folder and its reports folder, chosen before or chosen now.
  // The site folder itself is kept too, so sitemap.xml can be kept up to date.
  const reportsIn = async (site) => {
    const dir = await site.getDirectoryHandle('reports');
    await dir.getFileHandle('reports.js');
    return dir;
  };
  async function siteFolders() {
    const saved = await settings.get('siteDir');
    if (saved) {
      try {
        let perm = await saved.queryPermission({ mode: 'readwrite' });
        if (perm !== 'granted') perm = await saved.requestPermission({ mode: 'readwrite' });
        if (perm === 'granted') return { site: saved, dir: await reportsIn(saved) };
      } catch (e) { /* the folder has moved, or the browser forgot it: ask again */ }
    }
    const picked = await window.showDirectoryPicker({ id: 'longhand-site', mode: 'readwrite' });
    let dir = null;
    try { dir = await reportsIn(picked); } catch (e) { dir = null; }
    if (!dir) throw new Error('That folder has no reports/reports.js in it. Choose the site folder, the one that holds index.html.');
    await settings.set('siteDir', picked).catch(() => {});
    return { site: picked, dir };
  }

  async function readCatalogue(dir) {
    const fh = await dir.getFileHandle('reports.js');
    const text = await (await fh.getFile()).text();
    let list;
    try {
      // eslint-disable-next-line no-new-func
      list = new Function('window', `${text}\n;return window.LONGHAND_REPORTS;`)({});
    } catch (e) {
      throw new Error(`reports/reports.js has a mistake in it (${e.message}). Fix it first, then try again.`);
    }
    if (!Array.isArray(list)) throw new Error('reports/reports.js does not hold a list of reports.');
    return { fh, list };
  }

  const CATALOGUE_HEADER = `/*
  Longhand Research: the report catalogue.

  Every published report is one entry in the list below. The site sorts
  them by date, so the order here does not matter.

  To publish a new report:
    1. Put the PDF in this folder (reports/).
    2. Add an entry below. "Add report" on the site (author mode) writes
       the entry for you, or publishes it straight into this folder.

  Fields
    id           unique, used in the report's web address
    ticker       the ticker as listed, for example "ADRO", "AAPL" or "0700.HK";
                 leave "" for sector or macro notes
    exchange     optional, for example "IDX", "NYSE" or "HKEX"
    company      company name, or the subject of a sector or macro note
    sector       optional, shown on the report page
    category     "Initiation", "Update", "Sector" or "Macro"
    title        the report headline
    date         publication date, YYYY-MM-DD
    blurb        one or two sentences for the report list
    summary      the longer abstract shown on the report page
    rating       "BUY", "HOLD", "SELL" or null
    currency     the currency of the prices, for example "IDR", "USD" or "HKD"
    price        closing price used in the report, or null
    targetPrice  target price, or null
    upside       % to target; worked out from price and target if left out
    pdfUrl       path to the PDF, for example "reports/My_Report.pdf"
    page         optional: an interactive report that is its own page, for example
                 "power-behind-ai.html"; used instead of a PDF
    tags         optional list of words the library search also looks at
    pages        optional, number of pages
    fileSize     optional, size of the PDF in bytes
    extra        optional list of [label, value] pairs for the key data panel
*/
`;

  async function writeCatalogue(fh, list) {
    const body = JSON.stringify(list, null, 2)
      // label and value pairs in "extra" read better on one line each
      .replace(/\[\n\s+("(?:[^"\\]|\\.)*"),\n\s+("(?:[^"\\]|\\.)*")\n\s+\]/g, '[$1, $2]');
    const w = await fh.createWritable();
    await w.write(`${CATALOGUE_HEADER}window.LONGHAND_REPORTS = ${body};\n`);
    await w.close();
    // the page carries on with the new catalogue, no reload needed
    window.LONGHAND_REPORTS = list;
    window.LONGHAND_CATALOG_ERROR = null;
    issues = null;
    numbers = null;
  }

  /* sitemap.xml lists the pages and every published report, so search
     engines find a new report without waiting to crawl the library. The
     site address is taken from the first entry already in the file. */
  async function writeSitemap(site, list) {
    try {
      const fh = await site.getFileHandle('sitemap.xml');
      const m = /<loc>\s*([^<\s]+)\s*<\/loc>/.exec(await (await fh.getFile()).text());
      if (!m) return;
      const base = new URL('./', m[1]).href;
      const reports = list.map((x) => normalize(x || {}, 'published')).filter((r) => r.id).sort(byDateDesc);
      const urls = [
        ...['', 'library.html', 'wire.html', 'about.html'].map((p) => `  <url><loc>${base}${p}</loc></url>`),
        ...reports.map((r) => `  <url><loc>${esc(base + reportHref(r))}</loc>${r.date ? `<lastmod>${r.date}</lastmod>` : ''}</url>`),
      ];
      const w = await fh.createWritable();
      await w.write(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`);
      await w.close();
    } catch (e) {
      console.warn('sitemap.xml was not updated', e);   // the report itself is published
    }
  }

  async function publishDraft(id) {
    const rec = await drafts.get(id);
    if (!rec) throw new Error('This draft is no longer in this browser.');
    if (!rec.blob) throw new Error('This draft has no PDF attached. Edit it and choose the PDF again.');
    const { site, dir } = await siteFolders();
    const { fh, list } = await readCatalogue(dir);
    const entry = entryObject(rec);
    // the id must be free in the published catalogue
    const ids = new Set(list.map((x) => normalize(x || {}, 'published').id));
    const base = entry.id;
    for (let i = 2; ids.has(entry.id); i++) entry.id = `${base}-${i}`;
    // so must the file name, unless it already is this report's own file
    const used = new Set(list.map((x) => fileOf(x && x.pdfUrl)));
    const wanted = rec.fileName || `${entry.id}.pdf`;
    const dot = wanted.lastIndexOf('.');
    const stem = dot > 0 ? wanted.slice(0, dot) : wanted;
    const ext = dot > 0 ? wanted.slice(dot) : '.pdf';
    let name = wanted;
    for (let i = 2; used.has(name); i++) name = `${stem}-${i}${ext}`;
    entry.pdfUrl = `reports/${name}`;
    const pdf = await dir.getFileHandle(name, { create: true });
    const w = await pdf.createWritable();
    await w.write(rec.blob);
    await w.close();
    list.unshift(entry);
    await writeCatalogue(fh, list);
    await writeSitemap(site, list);
    await drafts.remove(id);
    return entry.id;
  }

  async function deletePublished(id) {
    const { site, dir } = await siteFolders();
    const { fh, list } = await readCatalogue(dir);
    const i = list.findIndex((x) => x && normalize(x, 'published').id === id);
    if (i < 0) throw new Error('This report is not in reports/reports.js any more. It may have been removed already.');
    const [gone] = list.splice(i, 1);
    const file = fileOf(gone.pdfUrl);
    const shared = list.some((x) => fileOf(x && x.pdfUrl) === file);
    await writeCatalogue(fh, list);
    await writeSitemap(site, list);
    // the PDF goes too, unless another entry still points at it
    if (file && !shared && /^reports\//.test(String(gone.pdfUrl))) {
      try { await dir.removeEntry(file); } catch (e) { /* already gone */ }
    }
  }

  /* One entry point for the buttons: confirm, do it, and say what happened */
  async function authorAction(kind, r, { ask = true } = {}) {
    try {
      if (kind === 'delete' && r.isLocal) {
        const ok = await confirmDialog({
          title: 'Delete this draft?',
          text: `“${r.title}” will be deleted from this browser. Nothing on the site changes.`,
          confirm: 'Delete draft',
          danger: true,
        });
        if (!ok) return false;
        await drafts.remove(r.id);
        changed({ id: r.id, mode: 'delete' });
        notify('Draft deleted.');
        return true;
      }
      if (kind === 'publish') {
        if (!canWriteFolder()) { showPublishSteps((await drafts.get(r.id)) || r); return false; }
        const ok = !ask || await confirmDialog({
          title: 'Publish this report?',
          text: `The PDF of “${r.title}” is copied into the reports folder and the report is added to reports/reports.js. The first time, your browser asks you to choose the site folder, the one that holds index.html. Readers see the report once you push the change to Git or upload the folder.`,
          confirm: 'Publish',
        });
        if (!ok) return false;
        const newId = await publishDraft(r.id);
        changed({ id: r.id, newId, mode: 'publish' });
        notify('Published to your site folder. Push it to Git to put it online.');
        return true;
      }
      if (kind === 'delete') {
        const file = fileOf(r.pdfUrl);
        if (!canWriteFolder()) {
          await confirmDialog({
            title: 'Delete this report by hand',
            html: `<p>Open <code>reports/reports.js</code> and remove the entry with <code>"id": "${esc(r.id)}"</code>, then delete <code>reports/${esc(file)}</code>. Push the change to Git or upload the folder, and the report is gone from the site.</p><p>This browser cannot change files by itself; Chrome and Edge can.</p>`,
            confirm: 'OK',
            cancel: null,
          });
          return false;
        }
        const ok = await confirmDialog({
          title: 'Delete this report from the site?',
          text: `“${r.title}” and its PDF (reports/${file}) will be removed from your site folder. The first time, your browser asks you to choose the site folder. Readers stop seeing the report once you push the change to Git or upload the folder.`,
          confirm: 'Delete report',
          danger: true,
        });
        if (!ok) return false;
        await deletePublished(r.id);
        changed({ id: r.id, mode: 'delete' });
        notify('Deleted from your site folder. Push it to Git to update the site.');
        return true;
      }
    } catch (err) {
      if (err && err.name === 'AbortError') return false;   // the folder picker was closed
      console.warn(err);
      await confirmDialog({ title: 'That did not work', text: String((err && err.message) || err), confirm: 'OK', cancel: null });
    }
    return false;
  }

  /* A short note at the foot of the screen after an action */
  let noteTimer = 0;
  function notify(text) {
    let el = $('.toast');
    if (!el) {
      el = document.createElement('p');
      el.className = 'toast';
      el.setAttribute('role', 'status');
      document.body.appendChild(el);
    }
    el.textContent = text;
    requestAnimationFrame(() => el.classList.add('is-on'));
    clearTimeout(noteTimer);
    noteTimer = setTimeout(() => el.classList.remove('is-on'), 5200);
  }

  /* Page chrome */

  function initChrome() {
    $$('[data-year]').forEach((el) => { el.textContent = String(new Date().getFullYear()); });

    // A hairline appears under the masthead once the page has moved
    const mast = $('.masthead');
    if (mast) {
      const onScroll = () => mast.classList.toggle('is-scrolled', window.scrollY > 4);
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
    }

    // Section rules are drawn across as their section comes into view
    const heads = $$('.section-head');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !('IntersectionObserver' in window)) {
      heads.forEach((h) => h.classList.add('is-in'));
    } else {
      const io = new IntersectionObserver((entries) => entries.forEach((en) => {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-in');
        io.unobserve(en.target);
      }), { rootMargin: '0px 0px -6% 0px' });
      heads.forEach((h) => io.observe(h));
    }
  }

  /* Page transitions (Chrome, Edge and Safari; other browsers simply change page).
     The report title that was clicked travels to the heading of the next page.
     Which way the motion runs is set by the small script in each page's head,
     because the arriving page is the one that styles the whole transition. */
  const reportIdOf = (url) => {
    try {
      const u = new URL(url, location.href);
      return /\/report(\.html)?$/.test(u.pathname) ? u.searchParams.get('id') : null;
    } catch (e) { return null; }
  };
  function nameTitle(id) {
    const titles = $$('[data-vt-title]');
    titles.forEach((el) => { el.style.viewTransitionName = ''; });
    if (!id) return;
    const el = titles.find((x) => x.dataset.vtTitle === id);
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (r.bottom > 0 && r.top < window.innerHeight) el.style.viewTransitionName = 'report-title';
  }
  // A transition is skipped when the tab is hidden; that is not an error
  const quiet = (vt) => { ['ready', 'finished', 'updateCallbackDone'].forEach((k) => { if (vt[k]) vt[k].catch(() => {}); }); };
  // Keep the Earth on its own page during the landing's camera transition.
  const toHome = (e) => {
    try { return !!(e.activation && e.activation.entry && /\/(index\.html)?$/.test(new URL(e.activation.entry.url).pathname)); } catch (err) { return false; }
  };
  window.addEventListener('pageshow', () => { $$('.page-emblem, .plate-stage').forEach((el) => { el.style.viewTransitionName = ''; }); });
  window.addEventListener('pageswap', (e) => {
    if (!e.viewTransition) return;
    quiet(e.viewTransition);
    if (document.body.classList.contains('page-home') || toHome(e)) $$('.page-emblem, .plate-stage').forEach((el) => { el.style.viewTransitionName = 'none'; });
    nameTitle(e.activation && e.activation.entry ? reportIdOf(e.activation.entry.url) : null);
  });
  window.addEventListener('pagereveal', (e) => {
    nameTitle(null);
    if (!e.viewTransition) return;
    // The page transition is the entrance; the list's own settling-in steps aside
    $$('.is-arriving').forEach((el) => el.classList.remove('is-arriving'));
    const act = window.navigation && window.navigation.activation;
    nameTitle(act && act.from ? reportIdOf(act.from.url) : null);
    // Use the landing's focused zoom when leaving the front page.
    let fromHome = false;
    try { fromHome = !!(act && act.from && /\/(index\.html)?$/.test(new URL(act.from.url).pathname)) && !document.body.classList.contains('page-home'); } catch (err) { /* no URL */ }
    document.documentElement.classList.toggle('from-home', fromHome);
    // The Earth appears with the returning front page, not as a separate element.
    const home = document.body.classList.contains('page-home');
    if (home) $$('.plate-stage').forEach((el) => { el.style.viewTransitionName = 'none'; });
    const done = () => {
      nameTitle(null);
      document.documentElement.classList.remove('from-home');
      if (home) $$('.plate-stage').forEach((el) => { el.style.viewTransitionName = ''; });
    };
    e.viewTransition.finished.then(done, done);
  });

  /* Drafts are drawn in only after any page transition has finished:
     redrawing a list mid-transition would replace the travelling title and
     cut the transition short. */
  function afterTransition() {
    return new Promise((resolve) => {
      requestAnimationFrame(() => {
        const vt = window.LONGHAND_VT;
        if (vt) vt.finished.then(resolve, resolve); else resolve();
      });
    });
  }

  /* Public API */

  Object.assign(LH, {
    util: { $, $$, esc, num, icon, parseISO, dateLong, dateShort, fmtNum, fmtPct, fmtBytes, slug, storage, copyText },
    CATEGORIES,
    COMPANY_CATEGORIES,
    normalize,
    published,
    publishedSorted,
    afterTransition,
    catalogueNo,
    tickerLabel,
    catalogProblem,
    catalogIssues,
    drafts,
    allReports,
    findReport,
    reportHref,
    fileUrl,
    downloadName,
    subjectOf,
    callRows,
    fileMeta,
    kickerHtml,
    ledgerHtml,
    entryFor,
    confirmDialog,
    openReportForm,
    showPublishSteps,
    authorAction,
    canWriteFolder,
    notify,
  });

  const boot = () => { initTheme(); initAuthor(); initChrome(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
