# Interactive report review

Reviewed 5 October 2026. The research cutoff remains 4 October 2026. Source observations, scenario assumptions, Python outputs and the Excel workbook are unchanged by this layout revision.

## Placement and visual changes

The capacity, geography and pipeline commentaries previously sat in separate sections with a 330-pixel desktop left margin. They now belong to their corresponding sections. A shared commentary row aligns the heading on the left and paragraphs on the right, then switches to one column below 780 pixels. The pipeline discussion follows the outlook comparison and precedes the infrastructure constraint cards.

The outlook follows the supplied grid-and-points reference. It uses a dark plotting panel, solid scenario lines, prominent circular observations and a distinct orange base case. The three observed scenario years remain 2030, 2031 and 2032. Intermediate grid lines do not add modeled observations. Endpoint labels explicitly refer to 2032. The comparison panel reports the selected year. Legend controls emphasize a case, and year controls support mouse and keyboard use.

Chapter links and reloads with a fragment now position the requested heading consistently. Programmatic section focus does not draw an unrelated box. Keyboard focus remains visible on interactive controls. Asset query versions prevent a browser from retaining an earlier stylesheet or script after this revision.

## Calculator fixes

- Blank, invalid or numerically overflowing inputs clear the bills, comparisons and diagram values instead of leaving earlier results visible.
- Finite inputs that produce an infinite result are rejected. A valid selected case remains usable when a different comparison case exceeds the numerical range.
- Capacity and slider values stay synchronized for values such as 1,001 MW and decimal inputs.
- Small electricity volumes use appropriate units. The 1 MW base case displays 9.11 GWh and 3,504 cubic meters annually. Water chart labels adapt to the volume scale and include the selected WUE.
- Energy component values remain readable outside the bar on small screens. Zero charges are described directly instead of producing a misleading cost percentage.

## Validation

The browser review covered the natural desktop viewport, 820-pixel tablet width and 390/320-pixel phone widths. No horizontal page or text overflow was found at those widths. The three section commentaries retain their intended reading order and collapse to one column on phones. Light and dark themes were inspected.

Selecting 2031 with Enter displayed 21.13 TWh for the base case. Moving right to 2032 displayed 24.45 TWh and retained keyboard focus. Selecting the base case legend dimmed the other two lines and marked the corresponding comparison card. A second selection cleared that emphasis. Blank capacity cleared the diagram and showed its input warning. Reset restored the model. The fresh browser review captured no console warnings or errors.

`node --check` validates the changed JavaScript. `node tests/test_interactive.cjs` reconciles all 18 Python capacity fixtures and checks invalid, zero and overflowing calculations. The structured record is in `outputs/browser_validation.json`. Screenshots are in `outputs/outlook_preview.jpg` and `outputs/paragraph_layout_preview.jpg`.
