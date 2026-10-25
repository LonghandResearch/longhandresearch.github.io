# Living covers

Fifteen portrait covers come alive a little. Only parts that are already in each
picture move: clouds drift, water flows and its painted glints flash, trees and
grass sway, lights that are already lit breathe, the Trust balance pans swing, and
on the NVIDIA cover the crane lifts its load and the valley train rolls on. Nothing
is added to a picture and people stay still. The Memory War keeps its original
static cover.

## When a cover moves

`assets/js/living-covers.js` wakes a cover:

- on hover in the Library and on the Home page (devices with a fine pointer);
- while it sits in the middle third of the screen on touch devices;
- while it is visible on a report page.

A cover narrower than 100 px (the Coverage thumbnails) never wakes. Reduced motion
and Save-Data keep every cover still. The files for a cover load only when it first
wakes, so a Library visit downloads none of them until a reader hovers or scrolls.

## Files

Each folder is named after the cover's artwork (`nvda-road`, `ihsg-trust` and so on)
and holds pieces in the 640 x 960 cover space:

| File | What it is |
| --- | --- |
| `sky.png` | Alpha mask of the sky, feathered at its edges; the sky drifts inside it |
| `flow*` | Water: its pixels, and a data image (red mask, green ripple strength) |
| `sway*` | Trees or grass: pixels, the same with the plants painted out, and a data image (red mask, green sway height, blue reach) |
| `twinkle*` | Lights and water glints: pixels and a data image (red spot, green phase, blue light or glint) |
| `track.webp` | NVIDIA: the strip around the valley track that scrolls forward |
| `sprite-*.webp` | Parts that swing or hang: the Trust pans, the NVIDIA crane load |
| `base.webp` | The cover with those swinging parts painted out (Trust and NVIDIA only) |

`assets/js/living-covers-data.js` lists, per report id, what moves and where. Other
covers reuse the existing `covers/*-art-640.webp` file for their drifting sky.

## How the masks were made

Sky, water, trees and the balance pans were selected with Adobe's select-by-prompt
tool on the 1024 x 1536 artwork. The Plaza trees and the AI Power and Water palms
were selected by leaf colour inside drawn regions, because the tool found no mask.
Lights are small warm points brighter than their dark surroundings, only on the three
dusk and night covers (Power Behind AI, Prices Recovered, Foreign Selling Deepened).
The NVIDIA river, grass, train and crane follow the cover's own living preview.
Everything is presentation only and carries no research data.
