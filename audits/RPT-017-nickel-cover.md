# Nickel editorial cover, 15 October 2026

## Current revision: daylight panorama

After rejecting the truck-dominated cover below, the owner explicitly approved
generative illustration in the Coal cover style. Two teal/gold drafts were then
rejected as too similar and too brightly illuminated. The selected revision uses
overcast daylight, gray halls, muted olive vegetation and red laterite, with an
asymmetric elevated view. Small equipment is landscape detail. Built-in imagegen
created the image; encoding and proportional resizing are the only subsequent
image operations. The exact final revision prompt, source hash and dimensions
are retained in `assets/img/research/covers/nickel-panorama-art.json`.

The scene is conceptual, not a named operating site, measured process or proof of
shipments. This distinction and the generation method are disclosed in the
expandable visual note. Old photo assets and their licence/credits remain archived.
The cover keeps the site's live title, edition, date and Longhand signature.
Only the visual-note paragraph changes in the report. Research prose outside
that paragraph and all report data/calculations remain identical.

Codex author QA: all 143 automated tests pass, the site checker passes, changed
JavaScript passes `node --check`, and the new JSON parses. Thirteen browser checks
pass: desktop Homepage and Library, artwork-note navigation, Compact handling,
both themes on Homepage and Library at 390px and 320px, and ordinary image-click
navigation. The complete cover was inspected beside the existing editions.
Viewport overrides were reset. No new physical-device or other-engine testing
was performed. Publication follows the owner's continuing authorization and
temporary takeover exception; this is not independent Claude review.

## Archived revision: photographic montage, PR #102

The following record describes the superseded photographic artwork and the
instructions in force at that time. It is not the current cover's provenance.

The owner rejected the flat map cover after asking Codex to examine the existing
Coal, Power Behind AI and IHSG samples. They then asked to combine the vintage
editorial treatment and the landscape depth/lighting. The earlier instruction
against generative imagery remains in force. This revision changes presentation
and artwork provenance only. Research data, calculations and conclusions do not
change.

The new cover is a non-generative photographic montage. Foreground mining
equipment comes from “Big Yellow”, Mirwanto Muda (Kolong), dated 1 August 2019,
under CC BY-SA 4.0. The coastal background comes from “Weda Bay Nickel site”,
Muhammad ECTOR Prasetyo, dated 15 March 2006, under CC BY 2.0. The original Commons
pages, licences, dates, descriptions and original images were inspected. Hashes
and attribution are retained in `assets/img/research/covers/nickel-industry-credits.json`.
The source originals and preparation script are retained outside Git in the
owner's local nickel research folder.

The treatment uses manual cropping/masking, photographic composition, navy/teal
and ochre tonal mapping, real photographic edge treatment and deterministic
paper grain. No image model or generative fill is used. No smelter, port or other
facility is fabricated. The two images are not represented as a single location
or a current operational scene. The artwork is not evidence for production,
facility output or mine-to-customer provenance. Adapted artwork and its three
WebP variants retain CC BY-SA 4.0 terms. Website code and independent report text
are not purportedly relicensed.

The title, No. 013, date and signature use the existing live Longhand cover system.
The published report opening remains the Natural Earth vector map. A small Credits
link on the cover opens the report's expandable visual note, which names both
photographers, dates, source pages, licences and alterations. The credits JSON and
the cover asset README preserve the same information. Earlier material/vector
cover assets remain as unused archives.

Validation: 143 automated tests and the site checker pass. Browser checks verify
all thirteen cover records render, six desktop/390px/320px theme combinations,
compact-mode handling and credits navigation from both Homepage and Library.
All eleven recorded checks pass, with no captured page console errors. The cover
was visually inspected beside the existing Longhand publications. QA caught
the card's stretched title link intercepting the new credit link. The cover's
stacking context now allows its small credit link to receive pointer input,
while other points continue to pass through to the report link. Viewport overrides
were reset. Physical devices and other engines were not newly tested.

Publication follows the owner's existing authorization and temporary Codex
takeover while Claude is unavailable. Validation is Codex author QA, not an
independent Claude review.
