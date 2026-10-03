# QA Checklist

The reviewer of a pull request that adds or changes a report, or a page that
shows figures, works through this list before approving. The reviewer is the
agent that did not write the work (see `AI_COLLABORATION.md`). Tick each item
in the review comment, or say why it does not apply. The items under
"After merge" are checked once the pull request is merged, not before
approval.

## Figures

- [ ] Every figure shown on the site (catalogue entry, key data, summary,
      blurb, charts, tables) matches the report or the named source.
- [ ] Price, target and upside or downside agree with each other and with the
      report. Dates are the report's own dates.
- [ ] Units and currency are stated and consistent (Rp, US$, bn, tn, %).
- [ ] No figure was changed or rounded differently from the report without a
      note in the pull request.
- [ ] Every number typed into the page's prose (shares, sums, differences,
      "third week in a row") is recomputed from the data file. The site check
      does not see these.
- [ ] Stock and sector foreign-flow figures from flowless are called regular-market
      estimates on the page, are not added to or compared with IDX's official totals
      as if they were the same measure, and match a fresh run of
      `python -m idxflow.weekly` for the same week.
- [ ] A run of weeks or days is checked against each period's own source,
      not only the "last week" column of the latest one.
- [ ] The source list names the document and page each figure came from,
      and the audit record in `audits/` says where it was read.

## Catalogue and discovery

- [ ] The "Check the site" check on the pull request passes (it covers the
      catalogue loading, ids, dates, file paths, sitemap and links).
- [ ] The entry has the right `category`, `rating` and `date` for the report.
- [ ] The report file or page exists at that path and opens.
- [ ] `feed.xml` will pick it up (run `node scripts/build-feed.mjs` if in doubt).
- [ ] A rated company report shows correctly on `coverage.html`.

## Page

- [ ] Previewed in a browser at desktop and phone width: no horizontal scroll,
      no console errors.
- [ ] Reader-facing text is in English, with no em or en dashes and no "PDF"
      wording.

## After merge

- [ ] The publisher has updated the Obsidian vault: Report and Emiten notes,
      Sektor links and `Longhand – Status`.
