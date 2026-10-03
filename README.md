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
| `index.html` | The front page: the Earth, a direct introduction and the latest published report |
| `library.html` | Every report, with search (press `/`), category filters and catalogue numbers |
| `coverage.html` | Every rated company: its current call and the calls before it, built from the catalogue |
| `about.html` | How the reports are built, the rating key and the report types |
| `wire.html` | The Wire: market headlines from the financial press, gathered every hour |
| `report.html?id=...` | One report: its details, key data and the full PDF read on the page |
| `power-behind-ai.html` | The Power Behind AI: an interactive industry report (see below) |
| `ihsg-weekly-2026-09-25.html` | IHSG Weekly Market Update for 21–25 September 2026 |
| `ihsg-weekly.html?week=YYYY-MM-DD` | Shared page for future data-driven IHSG weekly editions; the date is the last trading day |

## Files

| Path | What it is |
| --- | --- |
| `reports/reports.js` | The catalogue: one entry per published report |
| `QA.md` | The checklist every report or page with figures goes through before merge |
| `feed.xml` | RSS feed of published reports |
| `reports/*.pdf` | The report PDFs |
| `assets/css/site.css` | Shared styling: light and dark themes, page transitions |
| `assets/css/home-editorial.css` | Front-page layout and latest-report treatment |
| `assets/js/site.js` | Shared: report data, theme, author mode, the Add report form, publishing and deleting, page transitions |
| `assets/js/home.js` | Front page: the stars and the latest report from the catalogue |
| `assets/js/library.js` | Library page: the list, filters and search |
| `assets/js/coverage.js` | Coverage page: groups rated Initiation and Update reports by ticker |
| `assets/js/reader.js` | Report page: the PDF reader |
| `assets/js/earth.js` | The Earth on the front page (three.js) |
| `assets/img/earth/` | NASA imagery for the Earth: day, city lights, clouds and a water mask |
| `assets/js/pbai/data.js` | The Power Behind AI: every figure, its status and its sources |
| `assets/js/pbai/report.js` | The Power Behind AI: charts, calculator, company panels, valuation and DCF |
| `assets/js/pbai/montecarlo.js` | The Power Behind AI: the seeded Monte Carlo simulation, loaded on demand |
| `assets/css/pbai.css` | Styles for the interactive report |
| `assets/css/market.css` | IHSG weekly report layout and responsive charts |
| `assets/js/ihsg-weekly-data.js` | Source-linked IDX market observations and BI JISDOR rates |
| `assets/js/ihsg-weekly-math.js` | Pure index, foreign-flow, turnover and currency calculations |
| `assets/js/ihsg-weekly.js` | Native charts and the FX return lab |
| `assets/js/ihsg-weekly-template.js` | Shared renderer for data-driven weekly editions |
| `weekly/YYYY-MM-DD.json` | One week's source-linked observations, editorial text and display metadata |
| `assets/js/wire.js` | The Wire page |
| `news/feeds.json` | The sources gathered into The Wire |
| `news/news.json` | The gathered headlines (written by the hourly job; do not edit) |
| `scripts/fetch-news.mjs` | Reads the sources and writes `news/news.json` |
| `.github/workflows/wire.yml` | Runs the gathering on GitHub every hour |
| `scripts/build-feed.mjs` | Builds `feed.xml` from the report catalogue |
| `scripts/check-site.mjs` | Checks the site before a merge (see [Checks](#checks)) |
| `scripts/auto-publish-control.ps1` | Installs or stops the stable Windows background publisher |
| `.github/workflows/checks.yml` | Runs those checks on every pull request |
| `.github/workflows/reports-feed.yml` | Refreshes the feed when the catalogue changes on `main` |

## Publish a new report

1. Press **Add report** on the site. It checks the details and saves the report in your browser as a draft. A draft is marked **Draft**, and only you can see it: it lives in your browser, not on the site.
2. Open the draft to see exactly how it will look, then press **Publish**.
3. The first time, choose the site folder (the one with `index.html` in it). The PDF is copied into `reports`, its entry is added to `reports/reports.js`, and its page is added to `sitemap.xml` so search engines find it, all for you.
4. Push the change to Git, or upload the folder again. With [auto publish](#auto-publish) on, this happens by itself. Readers see the report once it is online.

Publishing in one step works in Chrome and Edge. In other browsers, **Publish** shows the same two steps to do by hand: copy the PDF into `reports`, and paste the ready-made entry into `reports.js`.

To do it all by hand:

1. Put the PDF in the `reports` folder.
2. Open `reports/reports.js` and add an entry. Copy the ADRO entry as a template; the fields are explained at the top of the file. Any market works: set `ticker`, `exchange` (for example `NYSE`) and `currency` (for example `USD`).
3. Add a line for the report to `sitemap.xml`, copying the one for ADRO and changing the `id` and the date.
4. Upload the folder again.

If `reports.js` has a mistake, such as a missing comma, the library page tells you which line to look at (in author mode only). Readers just see that the list could not be loaded.

Catalogue numbers (No. 001, No. 002 and so on) are given in order of publication date, oldest first. Adding a report with an earlier date than ones already published moves the later numbers up by one.

## Follow new reports

Subscribe to [the RSS feed](feed.xml) in any feed reader. It lists every published report, newest first. When `reports/reports.js` changes on `main`, GitHub Actions rebuilds and commits `feed.xml`, then requests a GitHub Pages build. To refresh it by hand, run `node scripts/build-feed.mjs`.

## Checks

Every pull request is checked on GitHub by `scripts/check-site.mjs`, and so is every push to `main` apart from the hourly wire and the feed rebuild. The check fails, with a note naming the file, when:

- a script does not parse, or a JSON file is not valid;
- `reports/reports.js` does not load, or an entry has no id, a repeated id, an invalid date, category or rating, or a file or page that does not exist;
- `sitemap.xml` is missing a report, or lists one that is not in the catalogue;
- a link or file named in a page leads nowhere, or to a report id that does not exist.

Paths are matched letter for letter, because GitHub Pages treats `Report.pdf` and `report.pdf` as different files even though Windows does not. Run it on your own computer with `node scripts/check-site.mjs`. It checks the structure only; figures are checked by the other agent against `QA.md`.

## Interactive reports

A report can also be its own page instead of a PDF. Give its catalogue entry a `page` (for example `"page": "power-behind-ai.html"`) and leave out `pdfUrl`; the library, the front page and old `report.html?id=` links all open that page. `tags` is an optional list of words the library search also looks at.

**The Power Behind AI** (`power-behind-ai.html`) is built this way. Every number it shows lives in `assets/js/pbai/data.js`, each with a status (actual, announced, under construction, estimate or scenario) and the sources it rests on; the page numbers the sources and lists them in section 13. To correct or update a figure, change it there, not in the page. The prose in the page repeats a few of those figures, so search the page for the old value too.

## Publish an IHSG weekly edition

The 25 September report remains at its original address. [Its data-only example](https://longhandresearch.github.io/ihsg-weekly.html?week=2026-09-25) demonstrates the reusable layout after this template is deployed; it does not replace the archived report. For a new week:

1. Copy `weekly/2026-09-25.json` to a file named for the **last trading date** of the new week. Replace every date, observation, source description, summary statistic and piece of editorial text with reviewed facts for that week. Do not carry old figures or prose forward by default. The file's `weekEnding` must match its filename and the URL parameter. Remove the optional `canonical` field unless this data edition duplicates an older static page; when present it must name that local `.html` page. The `weekly/` folder sits outside `reports/` so auto publish will not push a draft edition before review.
   Foreign flow by stock and sector comes from flowless, the owner's IDX Flow & Liquidity Terminal (a separate private tool on the owner's computer; ask the owner where it is). After its daily update has run for the week's last trading day, run `python -m idxflow.weekly --week-ending YYYY-MM-DD --edition "<this folder>/weekly/YYYY-MM-DD.json" --blocks` there. It adds the data and an IDX Stock Summary source to the edition and prints ready-made tables to place in `sections`. These figures cover the regular market only, and foreign value is estimated as shares times the close, so they will not add up to IDX's official net foreign total. Keep IDX's statistics for the totals, say in the text that the stock and sector figures are regular-market estimates, and record the gap the command prints in the audit. Agents read the flowless database; they do not run its download step. Use flowless only for the IHSG and Indonesian-market reports, and only its liquid large caps (by default a market value of at least Rp10tn and average daily trading of at least Rp10bn). The command also reads each sector and stock: whether the price move had foreign buying behind it, sectors that are really one stock, standout stocks whose foreign flow was unusual for them, and days the IHSG rose while foreigners sold. Treat these as pointers. For each story, give the most logical explanation: one that fits both the flow data and a dated source such as an IDX announcement, a company disclosure or a commodity price. Prefer a mechanical cause when there is one (a rule change, a thin free float, an index event), say plainly when a rise had no foreign buying behind it, and say when no source explains a move instead of guessing.
2. Use the `sections` array to arrange the story. Its blocks can be `paragraph`, `heading`, `callout`, `closes`, `flows`, `sectors`, `stocks`, `fxLab`, or `table`; unused blocks and observation arrays may be omitted. `sources` on a block is a list of keys from the file's `sources` map. A close chart and FX lab derive returns from the observations; do not type those calculations into page code.
3. Add the normal catalogue entry to `reports/reports.js` with `"page": "ihsg-weekly.html?week=YYYY-MM-DD"`. Add that exact URL to `sitemap.xml`. The feed rebuild on `main` will use the same link. These are publication records, not new page code.
4. Run `node scripts/check-site.mjs` and `node scripts/build-feed.mjs`, then preview the new URL at desktop and phone width. Review every figure, source and editorial claim using `QA.md` before merging. The checker verifies that the dated data file exists and matches the URL, but it cannot establish whether market facts are correct.

The shared renderer and `ihsg-weekly.html` need no edits for a new edition. A missing or invalid week shows a clear unavailable state rather than reusing an older report. The template works when served over HTTP or on GitHub Pages; browsers generally block its JSON request when the file is opened directly from disk.

## Delete a report

Every delete asks first.

- **A draft**: press **Delete** on it in the library, or **Delete draft** on its page. It only ever existed in your browser.
- **A published report**: press **Delete** in the library, or **Delete from the site** on its page. In Chrome and Edge this takes its entry out of `reports.js` and `sitemap.xml`, and its PDF out of `reports`. Push the change to Git (auto publish does it by itself) and it is gone from the site. Other browsers show the two steps to do by hand.

## Auto publish

`auto-publish.ps1` sends published and deleted reports to GitHub by itself. `install-auto-publish.bat` turns it on: it copies the script to `%LOCALAPPDATA%\LonghandResearch\AutoPublish\auto-publish.ps1`, starts that fixed copy, and makes the Windows Startup shortcut run that copy at every login. The shortcut passes the site folder as an argument, so the script version does not change when this folder switches branches. `stop-auto-publish.bat` stops this site's publisher and removes the shortcut, but keeps the installed copy for recovery. It runs hidden and keeps a log in `%LOCALAPPDATA%\LonghandAutoPublish.log`.

It watches `reports` and `sitemap.xml` only. Once they have stopped changing for 10 seconds, the changes go to `main` on GitHub and a notice says the website updates in about a minute. Everything else still goes with `publish.bat` or a pull request.

- **The folder is on `main`**: the changes are committed there and pushed.
- **The folder is on another branch**, such as a Codex or Claude branch with work in progress: the changes are committed straight onto `main` and pushed, without switching branch and without touching that branch, its files or anything staged. Nothing but `main` is pushed. The published files stay in the folder as uncommitted changes, and they are already on `main`, so leave them out of the branch's commits. Before switching the folder back to `main`, set them aside with `git stash push --include-untracked -- reports sitemap.xml`; once `main` is checked out and pulled, that stash can be dropped.
- **Offline**: it tries again every minute.
- **A clash**: if the reports on GitHub changed in the same place since the branch was made (another report added to the catalogue, for example), nothing is sent and a notice says so. Publish again once the folder is on `main`.
- **A rebase or merge under way** in the folder: it waits until it is finished.

On another branch, a delete that takes `reports` and `sitemap.xml` back to exactly what the branch has (publishing one report and deleting it again, for example) looks just like tidying up with git, so it is not sent and that report stays online. Delete it again once the folder is back on `main`.

After an update to `auto-publish.ps1` is merged, run `install-auto-publish.bat` again from the site folder to refresh the fixed copy and restart it. Merely switching branches or logging in does not update the installed script. To disable it, run `stop-auto-publish.bat`.

## Author mode

**Add report**, **Publish** and **Delete** are tools for you, not for readers. They appear only when the site is opened from your computer (double-clicking `index.html`, or `localhost`). The live site never shows them, to anyone, and never shows drafts, not even in the browser that saved them.

Readers never see your drafts, and they cannot change the site: publishing and deleting only write to the folder on your computer, and the site changes when you push it.

## The Wire

The Wire (`wire.html`) shows headlines on markets, the economy, commodities and crypto. It fills itself: every hour a job on GitHub (`.github/workflows/wire.yml`) reads the sources in `news/feeds.json` and saves the headlines to `news/news.json`. Only headlines and links are kept, and each one opens at its publisher's site. Headlines drop off after four days.

- **Change the sources**: edit `news/feeds.json`. Each source has a `name`, the address of its RSS feed (`url`), a `topic` (`Markets`, `Macro`, `Commodities` or `Crypto`) and, for headlines not in English, a `lang` such as `"id"`.
- **Only market news**: a source that also carries general news is marked `"strict": true`, and its headlines are kept only when they are about shares, rates, currencies, commodities, crypto, company results and deals, or the economy. Sport, celebrities, accidents, promotions and how-to pieces are never kept, from any source. The word lists are at the top of `scripts/fetch-news.mjs`.
- **Gather now**: on GitHub, open **Actions**, then **Gather the wire**, then **Run workflow**.
- **A source stops working**: the job skips it and says so in its log; its older headlines stay until they age out.

Some publishers turn away automated readers (CNBC Indonesia, Kontan and Mining.com did when this was set up), so check a new source by running the job once and reading its log.

Opened straight from the disk, the browser will not read `news/news.json`, so The Wire shows only on the live site (or from `localhost`).

## The front page

The front page is a night plate that stays dark in both themes. It introduces the library immediately, shows the latest published report from the catalogue, and keeps a photographic Earth as its one visual feature. The Earth is drawn with three.js from NASA imagery: Blue Marble for the day side, Black Marble for the city lights and a cloud layer that drifts a little ahead of the ground.

- **Turning it.** Drag the Earth in any direction; on a touch screen, swipe sideways (an upward swipe still scrolls the page). Click it or press Space to stop or start it, and double-click it or press Home to set it straight. Arrow keys turn it too. Left alone, it settles back onto its axis.
- **Opening.** The heading and report link are available at once while the Earth imagery loads. On narrow screens they come before the globe.
- **Leaving it.** A short zoom and fade carries the landing into the next page, and reverses on return. These are cross-document view transitions (Chrome, Edge, Safari), set in `site.css` and `site.js`.
- **Latest report.** The front page draws its link, date, ticker and category from the newest published catalogue entry. It does not need a manual edit after publication.
- **Behind it.** Seeded stars, drawn once against the dark sky.
- **Settings** at the top of `assets/js/earth.js`: the meridian it opens on (`START_LON`), how fast it turns (`TURN_SECONDS`), how far the sun moves on scroll (`SUN_SWEEP`) and the Earth's size in its frame (`RADIUS_SHARE`).

Motion follows the restraint rules of [motion-anything](https://github.com/nexu-io/motion-anything): one ambient loop per screen (the Earth's turn), and nothing that moves for visitors who ask their system for reduced motion. There the Earth stands still at its opening view and pages change without the zoom.

The imagery is NASA's (Visible Earth; public domain), cut down for the web: a 1024 px day map loads first and a 2048 or 4096 px one replaces it once the page is up.

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

three.js, the fonts and the PDF reader load from public CDNs (jsDelivr and Google Fonts), so an internet connection is needed. If the Earth cannot be drawn (no WebGL, or Data Saver is on), the front page keeps its night plate and headline without it.

## Notes

- Page transitions (the Earth settling into the library emblem, a report title carried into its page, the theme spreading from the switch) run in current Chrome, Edge and Safari. Other browsers simply change page.
- Everything that moves stays still for visitors who ask their system for reduced motion.
- Opened straight from the disk, the report page uses the browser's own PDF viewer. Online it uses the built-in reader with zoom, page count, full screen, selectable text and a reading-progress rule.
- Scripts and stylesheets are linked with a version tag (for example `site.js?v=2026-09-24j`) so browsers pick up changes at once instead of keeping an old copy for about ten minutes. After editing a file in `assets/css` or `assets/js`, change that tag in the HTML pages (one find-and-replace).
- The reader starts downloading pdf.js as soon as the page opens, shows the download percentage for large files, and draws the first page before the rest have been read.
