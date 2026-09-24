# Longhand Research

An independent research library: company initiations and updates, sector studies and macro notes, each published in full as a PDF.
A static website with no server code and no build step. Open `index.html` in a browser, or upload the folder to any static host.

## Pages

| Page | What it is |
| --- | --- |
| `index.html` | The front page: the globe and the latest report |
| `library.html` | Every report, with search (press `/`), category filters and catalogue numbers |
| `about.html` | How the reports are built, the rating key and the report types |
| `report.html?id=...` | One report: its details, key data and the full PDF read on the page |

## Files

| Path | What it is |
| --- | --- |
| `reports/reports.js` | The catalogue: one entry per published report |
| `reports/*.pdf` | The report PDFs |
| `assets/css/site.css` | All styling: light and dark themes, page transitions |
| `assets/js/site.js` | Shared: report data, theme, author mode, the Add report form, page transitions |
| `assets/js/home.js` | Front page: the latest report |
| `assets/js/library.js` | Library page: the list, filters and search |
| `assets/js/reader.js` | Report page: the PDF reader |
| `assets/js/globe.js` | The globe on the front page |

## Publish a new report

1. Put the PDF in the `reports` folder.
2. Open `reports/reports.js` and add an entry. Copy the ADRO entry as a template; the fields are explained at the top of the file. Any market works: set `ticker`, `exchange` (for example `NYSE`) and `currency` (for example `USD`).
3. Upload the folder again.

The easier way is **Add report** on the site. It checks the details, saves the report in your browser as a draft so you can see exactly how it will look, and then gives you the entry to paste into `reports.js`, ready to copy.

If `reports.js` has a mistake, such as a missing comma, the library page tells you which line to look at (in author mode only). Readers just see that the list could not be loaded.

Catalogue numbers (No. 001, No. 002 and so on) are given in order of publication date, oldest first. Adding a report with an earlier date than ones already published moves the later numbers up by one.

## Author mode

**Add report** is a tool for you, not for readers, so it is hidden on the live site.

- It is always on when the site is opened from your computer (double-clicking `index.html`, or `localhost`).
- On the live site, visit it once with `?author=1` at the end of the address, for example `https://example.com/?author=1`. That browser remembers it.
- On the live site, `?author=0` turns it off again.

Drafts live only in the browser where you added them. They are marked **Draft** and nobody else can see them.

## The globe

It turns slowly on its tilted axis. Drag it in any direction to see it from every side; click it (or press Space) to stop or start it. Left alone, the view drifts back to its opening angle. Settings are at the top of `assets/js/globe.js`: the meridian it opens on (`START_LON`), how fast it turns (`TURN_SECONDS`), and `HIGHLIGHT` to pick out one country in gold (for example `'360'` for Indonesia).

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
