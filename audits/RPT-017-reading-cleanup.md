# Nickel reading cleanup, 16 October 2026

The owner identified the decorative opening map as redundant beside the two
analytical maps and asked to remove unimportant interface elements. Removed the
opening map and caption, Scroll motion control and associated parallax, status
badges, repeated opening question/three cards, duplicate start link and rail
tagline. The opening is now title, deck, date and three source-linked readings,
followed directly by the thesis and one chapter navigation. No replacement
decorative illustration or new control was added. The approved Library cover
remains unchanged.

The reserve/locality and export-customer maps remain, including their selections,
source records and accessible tables. Native scrolling, a reading-progress line
and subtle reveals remain; reduced motion follows the system preference. Removed
map and toggle dependencies from motion.js, preventing null-element failures.
The removed SVG remains an unused archived asset.

All nine research chapters match the previous publication byte-for-byte except
the obsolete opening-map provenance sentence. Data, calculations and sources are
unchanged. The report date stays 15 October; this is a presentation revision.

Codex author QA: JavaScript syntax and the site checker pass; all ten existing
nickel tests pass. Ten browser checks pass: exactly two data maps/no removed
controls, province selection, matte/Japan selection, source deep link, and opening
layout at 1280/390/320 pixels in both themes. Phone chapter spacing was tightened
after visual inspection. No physical-device or new cross-engine test performed.
Viewport override reset. Publication uses the owner's continuing authorization
and temporary takeover exception, not independent Claude review.
