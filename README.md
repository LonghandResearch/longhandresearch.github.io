# Longhand Research

An independent research library: company initiations and updates, sector studies and macro notes, each published in full as a PDF.
A static website with no server code and no build step. Open `index.html` in a browser, or upload the folder to any static host.

## Codex and Claude collaboration

Both agents use GitHub as the shared source of truth and work on separate
branches. Read `AI_COLLABORATION.md` for the workflow, `TASKS.md` for current
ownership, and the agent-specific `AGENTS.md` or `CLAUDE.md` before making
changes. Work is handed over through pull requests rather than by sharing an
uncommitted branch.

## Pages

| Page | What it is |
| --- | --- |
| `index.html` | The front page: the globe and the latest report |
| `library.html` | Every report, with search (press `/`), category filters and catalogue numbers |
| `about.html` | How the reports are built, the rating key and the report types |
| `wire.html` | The Wire: market headlines from the financial press, gathered every hour |
| `report.html?id=...` | One report: its details, key data and the full PDF read on the page |
| `power-behind-ai.html` | The Power Behind AI: an interactive industry report (see below) |

## Files

| Path | What it is |
| --- | --- |
| `reports/reports.js` | The catalogue: one entry per published report |
| `reports/*.pdf` | The report PDFs |
| `assets/css/site.css` | All styling: light and dark themes, page transitions |
| `assets/js/site.js` | Shared: report data, theme, author mode, the Add report form, publishing and deleting, page transitions |
| `assets/js/home.js` | Front page: the latest report |
| `assets/js/library.js` | Library page: the list, filters and search |
| `assets/js/reader.js` | Report page: the PDF reader |
| `assets/js/globe.js` | The globe on the front page |
| `assets/js/pbai/data.js` | The Power Behind AI: every figure, its status and its sources |
| `assets/js/pbai/report.js` | The Power Behind AI: charts, calculator, company panels, valuation and DCF |
| `assets/js/pbai/montecarlo.js` | The Power Behind AI: the seeded Monte Carlo simulation, loaded on demand |
| `assets/css/pbai.css` | Styles for the interactive report |
| `assets/js/wire.js` | The Wire page, and the latest headlines on the front page |
| `news/feeds.json` | The sources gathered into The Wire |
| `news/news.json` | The gathered headlines (written by the hourly job; do not edit) |
| `scripts/fetch-news.mjs` | Reads the sources and writes `news/news.json` |
| `.github/workflows/wire.yml` | Runs the gathering on GitHub every hour |

## Publish a new report

1. Press **Add report** on the site. It checks the details and saves the report in your browser as a draft. A draft is marked **Draft**, and only you can see it: it lives in your browser, not on the site.
2. Open the draft to see exactly how it will look, then press **Publish**.
3. The first time, choose the site folder (the one with `index.html` in it). The PDF is copied into `reports`, its entry is added to `reports/reports.js`, and its page is added to `sitemap.xml` so search engines find it, all for you.
4. Push the change to Git, or upload the folder again. Readers see the report once it is online.

Publishing in one step works in Chrome and Edge. In other browsers, **Publish** shows the same two steps to do by hand: copy the PDF into `reports`, and paste the ready-made entry into `reports.js`.

To do it all by hand:

1. Put the PDF in the `reports` folder.
2. Open `reports/reports.js` and add an entry. Copy the ADRO entry as a template; the fields are explained at the top of the file. Any market works: set `ticker`, `exchange` (for example `NYSE`) and `currency` (for example `USD`).
3. Add a line for the report to `sitemap.xml`, copying the one for ADRO and changing the `id` and the date.
4. Upload the folder again.

If `reports.js` has a mistake, such as a missing comma, the library page tells you which line to look at (in author mode only). Readers just see that the list could not be loaded.

Catalogue numbers (No. 001, No. 002 and so on) are given in order of publication date, oldest first. Adding a report with an earlier date than ones already published moves the later numbers up by one.

## Interactive reports

A report can also be its own page instead of a PDF. Give its catalogue entry a `page` (for example `"page": "power-behind-ai.html"`) and leave out `pdfUrl`; the library, the front page and old `report.html?id=` links all open that page. `tags` is an optional list of words the library search also looks at.

**The Power Behind AI** (`power-behind-ai.html`) is built this way. Every number it shows lives in `assets/js/pbai/data.js`, each with a status (actual, announced, under construction, estimate or scenario) and the sources it rests on; the page numbers the sources and lists them in section 13. To correct or update a figure, change it there, not in the page. The prose in the page repeats a few of those figures, so search the page for the old value too.

## Delete a report

Every delete asks first.

- **A draft**: press **Delete** on it in the library, or **Delete draft** on its page. It only ever existed in your browser.
- **A published report**: press **Delete** in the library, or **Delete from the site** on its page. In Chrome and Edge this takes its entry out of `reports.js` and `sitemap.xml`, and its PDF out of `reports`. Push the change to Git and it is gone from the site. Other browsers show the two steps to do by hand.

## Author mode

**Add report**, **Publish** and **Delete** are tools for you, not for readers. They appear only when the site is opened from your computer (double-clicking `index.html`, or `localhost`). The live site never shows them, to anyone, and never shows drafts, not even in the browser that saved them.

Readers never see your drafts, and they cannot change the site: publishing and deleting only write to the folder on your computer, and the site changes when you push it.

## The Wire

The Wire (`wire.html`, and **From the wire** on the front page) shows headlines on markets, the economy, commodities and crypto. It fills itself: every hour a job on GitHub (`.github/workflows/wire.yml`) reads the sources in `news/feeds.json` and saves the headlines to `news/news.json`. Only headlines and links are kept, and each one opens at its publisher's site. Headlines drop off after four days.

- **Change the sources**: edit `news/feeds.json`. Each source has a `name`, the address of its RSS feed (`url`), a `topic` (`Markets`, `Macro`, `Commodities` or `Crypto`) and, for headlines not in English, a `lang` such as `"id"`.
- **Only market news**: a source that also carries general news is marked `"strict": true`, and its headlines are kept only when they are about shares, rates, currencies, commodities, crypto, company results and deals, or the economy. Sport, celebrities, accidents, promotions and how-to pieces are never kept, from any source. The word lists are at the top of `scripts/fetch-news.mjs`.
- **Gather now**: on GitHub, open **Actions**, then **Gather the wire**, then **Run workflow**.
- **A source stops working**: the job skips it and says so in its log; its older headlines stay until they age out.

Some publishers turn away automated readers (CNBC Indonesia, Kontan and Mining.com did when this was set up), so check a new source by running the job once and reading its log.

Opened straight from the disk, the browser will not read `news/news.json`, so The Wire shows only on the live site (or from `localhost`).

## The globe

The ball turns slowly on its tilted axis while the stand and the brass ring stay still. Drag the ball in any direction to see it from every side; click it (or press Space) to stop or start it, and double-click it (or press Home) to set it straight. Left alone for a few seconds, it settles back onto its axis and carries on turning. Settings are at the top of `assets/js/globe.js`: the meridian it opens on (`START_LON`), how fast it turns (`TURN_SECONDS`), and `HIGHLIGHT` to pick out one country in gold (for example `'360'` for Indonesia).

## Change the name

The publication is called **Longhand Research**. To use your own name, change the visible text:

- In each HTML page: the `<title>`, the `description` meta tag where it names Longhand, the masthead `brand-name` and its `aria-label`, and the footer.
- In `index.html`: the two `og:` lines (`og:site_name` and `og:title`).
- In `about.html`: the first sentence of the introduction.
- In `assets/js/reader.js`: the two page titles that end in `Longhand Research`.

Leave code names such as `window.Longhand` and `LONGHAND_REPORTS` as they are.

## Put it online

Any static host works. Two free options:

- **Netlify Drop**: drag the whole folder onto app.netlify.com/drop.
- **GitHub Pages**: push the folder to a repository and turn on Pages in the repository settings.

The globe, the fonts and the PDF reader load from public CDNs (jsDelivr and Google Fonts), so an internet connection is needed. If the globe cannot load, the front page falls back to a text-only header.

## Notes

- Page transitions (the globe settling into the library emblem, a report title carried into its page, the theme spreading from the switch) run in current Chrome, Edge and Safari. Other browsers simply change page.
- Everything that moves stays still for visitors who ask their system for reduced motion.
- Opened straight from the disk, the report page uses the browser's own PDF viewer. Online it uses the built-in reader with zoom, page count, full screen, selectable text and a reading-progress rule.
- Scripts and stylesheets are linked with a version tag (for example `site.js?v=2026-09-24j`) so browsers pick up changes at once instead of keeping an old copy for about ten minutes. After editing a file in `assets/css` or `assets/js`, change that tag in the HTML pages (one find-and-replace).
- The reader starts downloading pdf.js as soon as the page opens, shows the download percentage for large files, and draws the first page before the rest have been read.
