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
| `index.html` | Editorial front page: the Earth, latest research and the publication ledger |
| `library.html` | Every report, with search (press `/`), category filters and catalogue numbers |
| `coverage.html` | Research geography explorer: a functional globe, country list, sectors and reports; the existing rated-company history remains below |
| `country.html?id=ID` | Country or market research and its documented connections |
| `sector.html?id=...` | Sector research, optionally within a country |
| `company.html?id=...` | A company identity, listing and published research history |
| `about.html` | How the reports are built, the rating key and the report types |
| `wire.html` | The Wire: market headlines from the financial press, gathered several times a day |
| `report.html?id=...` | One report: its details, key data and the full PDF read on the page |
| `research.html` | Local owner workspace: saved research projects, source notes, working drafts, review and JSON backups |
| `power-behind-ai-update-2026-10-09.html` | Dated October supplement: cached IDX price paths, capacity definitions and primary project checkpoints |
| `power-behind-ai.html` | The Power Behind AI: an interactive industry report (see below) |
| `coal-in-transition.html` | Coal Still Burns. Trade Is Changing.: an interactive coal sector study, market atlas and illustrative producer economics |
| `more-nickel.html` | More Nickel. Who Makes the Money?: Indonesia industry research, reserves and product-specific export destinations |
| `indonesia-ai-datacenter-research/interactive/index.html` | AI Runs on Power and Water: Indonesia resource scenarios, project atlas and research model |
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
| `assets/js/site.js` | Shared: report data, theme, author mode, the Add report form, publishing and deleting, page transitions |
| `assets/js/research-projects.js` | Versioned research model, validation, atomic saves, revision conflicts, manual review and backups |
| `assets/js/research-backups.js` | Local folder snapshots, permission recovery and backup status in the workspace |
| `assets/js/research-workspace.js` | Local project desk and links to existing library records |
| `assets/js/research-operations.js` | Read-only operations summary, project next actions and approved text handoff |
| `assets/js/research-tasks.js` | Five role deliverables and manual next-action guidance derived from saved project records |
| `assets/js/home.js` | Front page: the stars and the latest report from the catalogue |
| `assets/js/library.js` | Library page: the list, filters and search |
| `assets/js/living-covers.js` | Living covers: wakes covers and moves their own clouds, water, trees and lights |
| `assets/js/living-covers-data.js` | What moves on each living cover |
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

### Nickel research

`more-nickel.html` is **More Nickel. Who Makes the Money?**,
an Indonesia nickel industry study. Nine chapters cover the historical expansion,
reported provincial reserves, selected mine/processing/manufacturing localities,
product-specific export destinations, processing routes, battery chemistry,
domestically retained value and conditional policy cases. It is not an issuer
financial model or an investment recommendation.

The current observations and source register are frozen in
`updates/nickel-indonesia-2026-10-15.json`; `assets/js/nickel/industry-data.js`
is the identical browser wrapper. The original 14 October dataset and wrapper
remain as an unchanged archive. Charts reuse `model.js` and `report.js`; native
SVG maps are rendered by `atlas.js` using Natural Earth public-domain outlines
in `geography.js`. `atlas-hud.js` supplies smooth camera zoom/focus, mouse and
keyboard panning, selected-point reticles and animated relationship lights, with
visibility-aware playback and a map-motion toggle. `nickel-atlas.css` styles the
holographic consoles in both publication themes. Province label anchors and locality markers are approximate;
export links are country relationships, not cargo routes or mine provenance.

`motion.js` keeps native scrolling, a reading-progress line and subtle section
reveals that follow the system reduced-motion preference. There is no separate
scroll-motion switch or opening parallax. The report starts with its title,
summary and three evidence readings, then goes directly into the thesis. Only
the two analytical maps remain: domestic reserves/localities and export customers.
The decorative opening map and repeated question/preamble cards were removed.
The homepage/Library cover is an
original conceptual illustration generated with imagegen after the owner approved
that direction on 15 October. The owner-approved view looks
from sea toward a coastal processing works and inland laterite benches, using
teal/rust ink textures without people or oversized machinery. It depicts no named
operating site, measured process or mine-to-customer connection. The visual note
and `nickel-seaview-art.json` retain its provenance. Existing Longhand typography
supplies the title. The earlier photo montage, material cutouts, vector cover and specimen script
were removed on 24 October because no page used them.

The reader sees six core source groups. All 11 ferronickel destinations and
all five destinations in each of the matte and intermediate tables are selectable.
Shares use the original World export value, including small published values and
explicit source-rounded zeros. Ministry of Finance royalty history and its 2025
royalty summary, plus BPS Southeast Sulawesi exports, deepen the domestic evidence. Supporting documents, detailed methods
and conditional cases expand on request. All 24 source records, individual
observations and locators remain in the evidence download. Deep links open
supporting references automatically and resolve after charts and fonts render.

The owner authorized publication on 15 October after the reader-balance pass
and a complete source recheck. Numerical verification passed 215 comparisons
against publisher originals. Catalogue, sitemap, feed and primary Indonesia
discovery are registered; foreign destinations remain trade context. Work stayed
outside the watched owner checkout. See `audits/RPT-017-nickel-preview.md` and
`audits/RPT-017-nickel-recheck.json` for the historical preview and author QA.

A report can also be its own page instead of a PDF. Give its catalogue entry a `page` (for example `"page": "power-behind-ai.html"`) and leave out `pdfUrl`; the library, the front page and old `report.html?id=` links all open that page. `tags` is an optional list of words the library search also looks at.

**The Power Behind AI** (`power-behind-ai.html`) is built this way. Every number it shows lives in `assets/js/pbai/data.js`, each with a status (actual, announced, under construction, estimate or scenario) and the sources it rests on; the page numbers the sources and lists them in section 13. To correct or update a figure, change it there, not in the page. The prose in the page repeats a few of those figures, so search the page for the old value too.

The October PBAI supplement keeps the original assessment at its existing URL. Its frozen observations and primary source record are in `updates/power-behind-ai-2026-10-09.json`; `assets/js/pbai/update.js` renders prices, capacity stages and project checkpoints. Price changes exclude dividends and costs. Review dates never replace the individual source periods.

## Publish an IHSG weekly edition

The 25 September report remains at its original address. [Its data-only example](https://longhandresearch.github.io/ihsg-weekly.html?week=2026-09-25) demonstrates the reusable layout after this template is deployed; it does not replace the archived report. For a new week:

1. Copy `weekly/2026-09-25.json` to a file named for the **last trading date** of the new week. Replace every date, observation, source description, summary statistic and piece of editorial text with reviewed facts for that week. Do not carry old figures or prose forward by default. The file's `weekEnding` must match its filename and the URL parameter. Remove the optional `canonical` field unless this data edition duplicates an older static page; when present it must name that local `.html` page. The `weekly/` folder sits outside `reports/` so auto publish will not push a draft edition before review.
2. Use the `sections` array to arrange the story. Its blocks can be `paragraph`, `heading`, `callout`, `closes`, `flows`, `sectors`, `stocks`, `fxLab`, or `table`; unused blocks and observation arrays may be omitted. `sources` on a block is a list of keys from the file's `sources` map. They are kept for audits; the page itself lists every source once, at the end, and does not repeat them under each block. A close chart and FX lab derive returns from the observations; do not type those calculations into page code.
3. Add the normal catalogue entry to `reports/reports.js` with `"page": "ihsg-weekly.html?week=YYYY-MM-DD"`. Add that exact URL to `sitemap.xml`. The feed rebuild on `main` will use the same link. These are publication records, not new page code.
4. Read the owner's IDX files with `python -I scripts/extract-ihsg-week.py <folder> weekly/market-YYYY-MM-DD.json --prior-close <last close> --render <scratch folder>`. It records file hashes and the daily and weekly figures, and fails unless the files reconcile with each other (Previous closes, YTD foreign net, daily market tables against the weekly table, buy less sell against the weekly net). Read breadth, sectors and index contributions from the rendered pages, not the text layer.
5. Run `node scripts/check-site.mjs` and `node scripts/build-feed.mjs`, then preview the new URL at desktop and phone width. Review every figure, source and editorial claim using `QA.md` before merging. The checker verifies that the dated data file exists and matches the URL, but it cannot establish whether market facts are correct.

### Optional Flowless stock context

The 16 October edition also demonstrates optional `riskChart` blocks with
`kind: "limits"` or `kind: "valuation"`, and an `exitLab` block. Their explicit
`riskParameters` include the index anchor, proxy multiple, exchange rate,
dated benchmark weight and pre-shock daily turnover. Keep assumptions and
observations distinct. The native model derives curves and interactive readouts
without a new dependency. Price curves are shape-preserving visual guides,
not additional market observations. Earlier weekly editions retain their graphs.

Flowless is the owner's separate IDX Flow & Liquidity Terminal. After its data reaches the week's last trading day, run `python -m idxflow.weekly --week-ending YYYY-MM-DD --edition "<site>/weekly/YYYY-MM-DD.json" --blocks` from that local checkout. The command reads the database without changing it. It adds stock and sector flow data and an IDX Stock Summary source to the edition, prints table blocks for the writer to consider, and reports each day's difference from IDX's official net foreign figure. It does not write the report's narrative. Agents use the data already on the owner's machine; they do not run Flowless's download step.

Flowless covers the regular market and estimates foreign value from share volume times the daily close. Keep IDX Statistics as the source of official all-market totals. Label any Flowless flow table as a regular-market estimate, record the gap in the audit, and use only its large, actively traded shares. The weekly export defaults to at least Rp10tn in market capitalisation and Rp10bn in 20-session average daily value. A report may use a stricter screen; the [2 October snapshot](weekly/flowless-2026-10-02.json) uses Rp50bn in average daily value. Size and liquidity do not make a stock safe.

The export flags unusual stock flows, sectors dominated by one stock, and price moves that disagree with foreign flow. Treat these as questions to investigate. Explain a move only when a dated primary source supports the cause. Otherwise describe the move and say its cause is unknown. Freeze any values used in the report under `weekly/`, cross-check market caps with dated IDX Daily Statistics, recompute rolling fields from Flowless's daily series, and record the source pages and arithmetic in `audits/`. The [2 October audit](audits/RPT-011-2026-10-02.md) shows the method.

The shared renderer and `ihsg-weekly.html` need no edits for a new edition. A missing or invalid week shows a clear unavailable state rather than reusing an older report. The template works when served over HTTP or on GitHub Pages; browsers generally block its JSON request when the file is opened directly from disk.

## Coal sector research

`coal-in-transition.html` reuses the shared masthead, theme and static page
patterns. `assets/js/coal/data.js` freezes the source register and economic
observations; `model.js` contains the independent illustrative scenario
arithmetic, `geography.js` the locally stored Natural Earth outlines, and
`report.js` the charts and controls. `assets/css/coal.css` is page-scoped.
The opening value chain runs an illustrative mine-to-buyer cycle. The atlas
shows moving cargo markers on conceptual links. Motion starts automatically
and follows the system reduced-motion preference.
Atlas arcs are conceptual links, not actual ship routes or a volume scale.
Destination panels show the separate, revised BPS 2025 coal customs series.
A coverage exhibit adds the separately published lignite series without treating
the derived customs sum as equivalent to IEA thermal coal. Bayan and Bukit Asam
case studies preserve issuer accounting, half-year periods and currencies.
Derived unit spreads and cash subtotals remain separate from the simulator.
The 2026-2030 framework has conditional base, upside and downside cases,
without invented price paths or assigned probabilities.
Period-selectable Australian benchmark prices remain separate from
Indonesian selling prices. Forecasts retain their stated vintage; the simulator
uses labelled analyst assumptions. Check `audits/RPT-014-2026-10-08.md` before
changing any data or publishing this report.

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

## Local research workspace

Open `research.html` from localhost, or use **Workspace** in the local site's
footer. It is hidden on the public host, like the other author tools, and is
marked `noindex`. Projects live in the browser's `longhand-research` IndexedDB
database under `research-project:<id>` in the `settings` store. Nothing is
uploaded and nothing syncs across devices.

Each project holds a brief, a source notebook, a reasoning record (thesis,
analysis, assumptions, alternatives, uncertainty and review conditions), a plain
text draft and its review history. Research moves **Draft → In review →
Approved**. Approval is a person's attestation: it needs a checked source, the
core reasoning, a reviewer name, six manual checks and a review note. Editing
the research resets review to Draft and keeps up to five earlier versions.

**Download approved text** exports the reviewed draft for manual PDF preparation.
Publication still goes through the Library's **Add report / Publish** tools, and
linking a project to a Library record never publishes anything. See
[`docs/research-constitution.md`](docs/research-constitution.md) for the rules.

Saves compare revisions, so an older tab cannot overwrite newer work. **Export
backup** and **Import backup** move versioned JSON (up to 5 MB, or per project
with **Export this project**). In Chrome or Edge, **Local folder backup** writes
dated snapshots to a private folder outside the site and Git repository. Each
snapshot ends with `snapshot.json`, and a folder without it is incomplete. PDF
files, browser settings and folder permissions are never included.

Run `node --test tests/*.test.mjs` alongside `node scripts/check-site.mjs`. CI
runs both.

## The Wire

The Wire (`wire.html`) shows headlines on markets, the economy, commodities and crypto. It fills itself: a job on GitHub (`.github/workflows/wire.yml`) reads the sources in `news/feeds.json` and saves the headlines to `news/news.json`. Only headlines and links are kept, and each one opens at its publisher's site. Headlines drop off after four days. The job is scheduled hourly, but GitHub runs scheduled jobs on a best-effort basis and in practice it runs about four to six times a day.

- **Change the sources**: edit `news/feeds.json`. Each source has a `name`, the address of its RSS feed (`url`), a `topic` (`Markets`, `Macro`, `Commodities` or `Crypto`) and, for headlines not in English, a `lang` such as `"id"`.
- **Only market news**: a source that also carries general news is marked `"strict": true`, and its headlines are kept only when they are about shares, rates, currencies, commodities, crypto, company results and deals, or the economy. Sport, celebrities, accidents, promotions and how-to pieces are never kept, from any source. The word lists are at the top of `scripts/fetch-news.mjs`.
- **Gather now**: on GitHub, open **Actions**, then **Gather the wire**, then **Run workflow**.
- **A source stops working**: the job skips it and says so in its log; its older headlines stay until they age out.

Some publishers turn away automated readers (CNBC Indonesia, Kontan and Mining.com did when this was set up), so check a new source by running the job once and reading its log.

Opened straight from the disk, the browser will not read `news/news.json`, so The Wire shows only on the live site (or from `localhost`).

## Longhand V2 public interface

The public experience remains static HTML, CSS and JavaScript with no required
build step. Homepage and Coverage use the dark research palette; Library,
entity pages and reports use the editorial reading palette with the existing
saved theme preference. Newsreader and Libre Franklin remain the typefaces.

`assets/css/v2.css` and `assets/js/v2.js` add the shared public shell, mobile menu,
footer and progressive identity transitions. Page-specific V2 styles keep the
archive, globe and reading layouts separate. Ordinary links and query parameters
remain the navigation layer; unsupported view-transition browsers navigate normally.

The public discovery graph is an additive index over the unchanged catalogue.
See [research graph](docs/research-graph.md) for evidence roles, entity IDs,
count definitions and maintenance. Library search includes abstracts and documented
relationships; country, sector and company filters persist in its address.
The country list remains fully usable if WebGL is unavailable. Country selection
focuses the existing Earth renderer; representative markers are not project sites.

Existing PDFs and specialized reports retain their readers and calculations.
Future text-led reports can use a reviewed JSON `contentUrl` with the existing
`report.html?id=...` template; see [structured reports](docs/structured-reports.md).
No existing publication has been converted to that format. Authoring, local
research storage, RSS, Wire and the publishing workflow remain as documented above.

See [V2 validation](docs/v2-validation.md) for the local implementation checks.

## Living covers

Fifteen covers move a little: clouds drift, water flows and glints, trees sway,
lights breathe, and on two covers the balance pans or a crane and train move. Only
parts already in each picture move. A cover wakes on hover in the Library and on the
Home page, in the middle of the screen on phones, and while visible on a report page.
Reduced motion and Save-Data keep covers still, and the files load only when a cover
first wakes. `assets/js/living-covers.js` is the shared engine and
`assets/js/living-covers-data.js` says what moves on each cover. See
[living covers](assets/img/research/living/README.md) for the files and how the
masks were made. `tests/living-covers.test.mjs` checks every entry and file.

## The front page

The front page follows the selected dark or warm-paper theme. It introduces the publication, links to the Library and Coverage, and displays four recent catalogue entries. The publication ledger derives its counts from the catalogue; it is not a live market feed. The Earth uses NASA imagery: Blue Marble for surface detail, Black Marble for city lights, and a cloud layer. Warm paper uses a subdued relief treatment with sage seas.

- **Turning it.** The homepage globe turns automatically, with no drag, pointer tilt or scroll parallax. Open Coverage for interactive rotation and country selection: drag or swipe sideways, use arrow keys, press Space to pause or resume, or choose World view to reset. A vertical swipe still scrolls the page.
- **Opening.** The heading and report link are available at once while the Earth imagery loads. On narrow screens they come before the globe.
- **Leaving it.** A short zoom and fade carries the landing into the next page, and reverses on return. These are cross-document view transitions (Chrome, Edge, Safari), set in `site.css` and `site.js`.
- **Latest research.** The front page draws publication links, dates and categories from the catalogue. It updates when a report is published. Equal publication dates keep the established title tie-break; catalogue numbers remain chronological identifiers.
- **Behind it.** Seeded stars, drawn once against the dark sky.
- **Settings** at the top of `assets/js/earth.js`: the opening meridian (`START_LON`), rotation speed (`TURN_SECONDS`) and size in its frame (`RADIUS_SHARE`). Arc selections are described in [research graph](docs/research-graph.md).

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
