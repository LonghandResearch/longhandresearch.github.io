# Editorial paragraph layout QA

Owner: Codex. Task: WEB-027. Branch: `codex/editorial-paragraphs`.

The owner requested tidy, justified paragraphs, using the Coal report's market
atlas methodology paragraph as the example. This is a reading-layout change;
research wording, figures, sources, dates, data, PDFs and font families are unchanged.

## Treatment

- Long reading copy uses justification with a natural final line and automatic
  English hyphenation where the browser has a dictionary.
- Existing reading measures and paragraph spacing are retained. At small phone
  widths, primary prose scales from 16px to 18px with a 1.75 line height to reduce
  stretched spaces. The existing 15px resource-report commentary is retained.
- About's opening drop-cap paragraph keeps its natural alignment and scales to
  23px on narrow phones. Body paragraphs are justified.
- AI report finding numbers sit beside their headings on phones; explanatory
  paragraphs use the whole column below them.
- Navigation, chart labels, source labels, metadata, cards, headlines and PDF
  canvases are not targeted by the new paragraph rules. Shared CSS cache URLs
  are updated in all 15 public HTML consumers.

## Validation

- 144 reading-layout cases passed: eight page/template families, light/dark,
  320/390/1280px, and Edge, WebKit and the isolated Firefox runtime documented
  in `mobile-report-qa.md`. Every rendered word rectangle remained inside its
  paragraph; no viewport overflow or JavaScript page errors occurred.
- 228 reflow cases passed across all 19 discovery/report routes: two themes,
  normal and expanded accessibility text spacing at 320px, with all main data
  disclosures opened, in the same three engines.
- After the final finding-layout refinement, six additional 320px AI-report
  cases passed with expanded text spacing, covering both themes in all engines.
- Browser screenshots were inspected for the Coal example on desktop and
  narrow phones, About at 320px, AI findings at 320/390px, and resource commentary.
- All 15 changed HTML files were compared with the base revision byte for byte
  after normalizing line endings and reversing the stylesheet cache URL change.
  No text or other HTML changes were present.
- The site checker passed: 59 scripts, 67 JSON files, 11 catalogue entries,
  16 sitemap pages and links in 19 pages. JavaScript and JSON are not changed.

QA scripts and screenshots are outside Git in the existing Longhand tooling
directory. These are browser and responsive-emulation checks; physical Android
and iPhone devices, branded Safari and assistive-technology sessions remain
unverified. Browser dictionaries can produce slightly different line breaks.

Final QA, merge and publication follow the owner's continuing temporary Codex
takeover authorization in `AI_COLLABORATION.md`; this is Codex author QA.
