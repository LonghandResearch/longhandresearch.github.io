# QA-001, stage 4: front-page figures

Checked on 27 September 2026 against the published catalogue in `reports/reports.js` and the rendered `index.html` ledger. The front-page renderer in `assets/js/home.js` uses `Longhand.publishedSorted()`, so local draft reports do not contribute to these figures.

| Ledger field | Expected from published catalogue | Rendered value | Result |
| --- | --- | --- | --- |
| Reports | Six unique published entries | 6 | Match |
| Kinds of study | Initiation, Update, Macro, Sector | 4; all four labels | Match |
| Markets | One distinct, nonempty exchange: IDX | 1; IDX | Match |
| Latest | INET, dated 2026-09-27 | 27 Sep 2026; *Priced for a Network Nobody Has Paid For Yet* | Match |

The Reports link opens `library.html`; the Latest link opens `report.html?id=inet-2026-09-27`. Browser console showed no errors. No number or research claim needed correction. This audit is a snapshot: publishing another report will change the ledger automatically.

At a 319 px local author-mode viewport, the **Add report** control makes the masthead horizontally wider than the screen. That control is available only on localhost/file author mode; it is not one of the public ledger figures audited here. It is a separate layout issue if narrow author-mode support is required.
