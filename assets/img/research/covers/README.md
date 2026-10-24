# Longhand portrait editorial covers

## 25 October 2026: an IDX plaza cover for the 23 October edition

`ihsg-plaza-art.webp` is the cover for No. 015, "Local Money Bought the Bounce.
Foreign Money Sold It." Codex generated it with the built-in imagegen tool after
several owner revisions in chat (commit `b4a24e2`, PR #123). It shows a bright
afternoon in a landscaped plaza beneath twin office towers inspired by the IDX
building, with pedestrians, a cyclist and a coffee cart. There is no bull,
balloon or lettering. The full prompt history and source hash are in
`ihsg-plaza-art.json`. The 640 and 320 pixel versions keep the same 2:3 frame.

The upper third is bright sky, so the website sets the title in dark ink
`#14262b` with the existing paper wash (`cover-tone-paper`) at 9.4cqw, three
lines above the tower crowns. Earlier drafts made in Canva were rejected by the
owner and are not in the repository.

## 19 October 2026: a unique cover for the market-trust edition

The owner requested a distinct cover instead of the initially reused October
city artwork. `ihsg-trust-art.webp` is a new 1024 by 1536 illustration generated
with the built-in imagegen tool. A brass balance on a fractured stone pedestal
represents the weight of market trust. Glass blocks, a rough stone and a small
distant skyline are conceptual details, not documentary exchange imagery.

The 320 and 640 pixel versions retain the same 2:3 composition. No cropping or
semantic retouching was applied. The exact prompt and generation method are in
`ihsg-trust-art.json`. Longhand typesets No. 014, 19 October 2026 and the existing
catalogue title on the website. Earlier editions retain their original covers.

Ten original conceptual illustrations were generated with the built-in imagegen
tool on 10 October 2026. The owner selected reference #3, requested portrait
artwork, retained The Memory War's existing three-character anime cover and
asked that people not appear on every new illustration. Human figures remain
only in INET, the power/water study and the September IHSG cover. The seven other
new illustrations focus on infrastructure, architecture and industrial objects.

All finished covers use a 2:3 portrait frame. `*-art.webp` files are illustrations
without lettering. The website typesets titles, dates and catalogue numbers over them. The earlier
`*-cover.jpg` exports were removed on 24 October because no page used them.
The existing Memory War PNG remains unchanged and is contained in the portrait
frame without cropping its artwork, company marks or headline.

The website typesets the covers using `assets/js/research-art.js` and
`assets/css/covers.css`, rather than relying on generated lettering. Typography
uses the existing Newsreader and Libre Franklin families. Titles, dates and issue
numbers come from the catalogue. The layout ignores preset title line breaks
when they no longer match the current title. Exported JPGs are dated presentation
snapshots and should be regenerated after a relevant catalogue change.

The 11 October visual refinement adds a subtle paper wash behind dark headlines.
The JPG exports were regenerated from the full-resolution artwork and current
website typesetting. The original illustrations and Memory War source PNG are
unchanged. Ten illustrations now also have 320 × 480 and 640 × 960 WebP versions;
Memory War has a 320 × 452 preview that retains its original aspect ratio. Live
`srcset` and `sizes` select an appropriate image for Covers or Compact mode.
The ten 320-pixel illustrations total 420,728 bytes, compared with 5,463,914 bytes
for their originals. High-density screens may still select larger versions.

Illustrations do not document a named operating facility, quantitative network,
measured flow or price chart. No invented financial numbers, graphs or ratings
were added. The report reader retains its original publication capture. Existing
research exhibits and PDF captures in the parent directory remain available.

| No. | Catalogue title | Publication date | Illustration |
| --- | --- | --- | --- |
| 001 | The Smelter Is the Whole Thesis | 2026-09-03 | [Smelter](smelter-art.webp) |
| 002 | Dovish or Hawkish? | 2026-09-24 | [Rates](rates-art.webp) |
| 003 | The Memory War | 2026-09-24 | [Original anime cover](../sector-2026-09-24.png) |
| 004 | The Power Behind AI | 2026-09-24 | [Power and computing](ai-power-art.webp) |
| 005 | Foreign Selling Persisted. The Rebound Failed. | 2026-09-26 | [September IHSG](ihsg-september-art.webp) |
| 006 | Priced for a Network Nobody Has Paid For Yet | 2026-09-27 | [INET](inet-art.webp) |
| 007 | Foreign Selling Deepened. Technology Led the Fall. | 2026-10-03 | [October IHSG](ihsg-october-art.webp) |
| 008 | AI Runs on Power and Water | 2026-10-05 | [Power and water](ai-resource-art.webp) |
| 009 | Higher Yields, Uneven Effects | 2026-10-08 | [Treasury](treasury-art.webp) |
| 010 | Coal Still Burns. Trade Is Changing. | 2026-10-09 | [Coal trade](coal-trade-art.webp) |
| 011 | The Power Behind AI: October Checkpoint | 2026-10-09 | [October campus](ai-october-art.webp) |
| 015 | Local Money Bought the Bounce. Foreign Money Sold It. | 2026-10-25 | [IDX plaza](ihsg-plaza-art.webp) |

## Final prompt set

Shared art direction: original 2:3 portrait vintage editorial comic illustration,
mid-century black ink, crosshatching, restrained halftone and warm paper grain;
muted mineral navy/teal, ochre and cream. Full bleed, quiet upper third for live
serif typesetting, narrative detail below. No text, letters, numbers, labels,
logos, watermarks, price graphs, charts or invented financial figures. Conceptual
architecture rather than a named documentary facility. No photorealistic, glossy
3D rendering. User references guide the visual language, not the research facts.

- **Smelter:** tropical aluminium smelter halls, steel infrastructure, industrial
  equipment and materials; dark navy sky and ochre detail; no people.
- **Rates:** conceptual central-bank architecture with Indonesian tropical urban
  context, cream sky, blue engraved clouds and subdued greenery; no people.
- **Power behind AI:** blue-hour tropical server campus, grid pylons and electrical
  substation; deep navy and ochre; no people.
- **September IHSG:** a thoughtful market researcher at an office desk, unmarked
  papers and city exchange district; muted brick red, cream and charcoal.
- **INET:** a telecom engineer in a white hardhat overlooking an Indonesian
  coastal archipelago, antenna tower and network infrastructure; pale aqua/teal.
- **October IHSG:** an urban exchange district, terrace and greenery at dusk;
  orange-red sky and charcoal buildings; no people, screens or market numbers.
- **Power/water:** tropical server campus, cooling-water basin and pipes,
  electricity infrastructure and an engineer; navy/teal, cream and ochre.
- **Treasury:** US Capitol architecture, autumn trees and city street paving;
  cream, navy and ochre; no people, signals or investment arrows.
- **Coal:** coal stockpiles, excavator, work truck, bulk carrier, port cranes and
  tropical sea; mineral teal, ochre and charcoal; no people.
- **October checkpoint:** tropical data-center campus, construction, grid lines,
  landscaped paths and plants; navy, cream and ochre; no people.

The no-people revisions removed figures from the generated illustrations while
preserving their portrait format, palette, print style and unaffected scenery.
The final selected assets were encoded as WebP without cropping or retouching.
Cover lettering and JPG exports were rendered from the actual website layout.

## 12 October 2026 local preview: IHSG recovery cover

The owner supplied `Jakarta Markets at Golden Hour.png` for the 5–9 October
IHSG edition. The built-in imagegen edit preserves its sunset city, highway and
terrace composition, removes lettering and the decorative market figures/logo,
and extends it to the existing 2:3 portrait format. It is conceptual artwork,
not a documentary exchange image or a market-data exhibit. The supplied file
remains unchanged in Downloads.

`ihsg-recovery-art.webp` is the 1024 × 1536 clean illustration. Responsive
320 × 480 and 640 × 960 versions use the same composition. Website typography
comes from the current catalogue: No. 012, 11 October 2026,
“Prices Recovered. Foreign Selling Persisted.” The 1024 × 1536
`ihsg-weekly-2026-10-09-cover.jpg` is exported from that same HTML/CSS typesetting.
The owner approved publication of the reviewed cover on 12 October 2026.


## 15 October 2026: archived nickel photographic cover

The owner requested the vintage print treatment and depth of the existing covers,
retaining the earlier no-generative-image instruction. `nickel-industry-art.webp`
and its 320/640 variants are a non-generative photographic editorial montage.
It replaces the earlier flat vector cover in the public cover system. Existing
Newsreader/Libre Franklin typesetting supplies the title, No. 013, date and signature.

- “Big Yellow”, Mirwanto Muda (Kolong), 1 August 2019, [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Big_Yellow.jpg), [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).
- “Weda Bay Nickel site”, Muhammad ECTOR Prasetyo, 15 March 2006, [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Weda_Bay_Nickel_site.jpg), [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/).

Changes: resize, crop, manual polygon mask, composition of separate photographs,
tonal/colour mapping, photographic edge treatment and deterministic paper grain.
No generative fill, image model, fabricated smelter or invented port is used.
The montage is not a single documentary scene or a 2026 operating photograph.
It carries no production or mine-to-customer claim. Source originals/hashes and
the reusable preparation script remain in the local research folder.
`nickel-industry-credits.json` retains the public attribution and source hashes.
The adapted artwork and image variants are distributed under CC BY-SA 4.0.
This asset licence does not purport to relicense the website's independent code
or report text. A Credits link on the cover opens the report's visual note.

## 15 October 2026: archived nickel daylight panorama

The owner explicitly approved generative illustration in Coal’s print language,
then requested a distinct composition and less artificial light. The selected
`nickel-panorama-art.webp` uses pale overcast daylight, rust-red laterite, muted
olive vegetation and gray industrial halls in an asymmetric coastal composition.
Equipment is small landscape detail. The earlier two teal/gold panorama drafts
were not published. Built-in imagegen created the artwork; only proportional
resizing and WebP encoding followed. No lettering is baked into the asset.

The final exact revision prompt, generation method, source hash and dimensions
are recorded in `nickel-panorama-art.json`. The picture is conceptual, not a named
facility, documentary site photograph, process diagram or evidence of any cargo
flow. Report facts and the Natural Earth opening map are unchanged. The prior
photographic artwork and its separate credits/licence remain archived, not loaded.

## 15 October 2026: approved nickel sea-view cover

The owner supplied coast, material and factory photographs as visual references,
selected the earlier teal/rust engraved texture, then requested removal of the
hand and a viewpoint from sea toward land. They approved that preview. The new
`nickel-seaview-art.webp` and its 320/640 variants preserve the approved artwork
without cropping or retouching. Existing live typography uses cream on teal.
The factory sits on shore, inland workings behind it and water in the foreground.
No hand, person, specimen, oversized truck or brightly glowing lights appear.

Built-in imagegen created the conceptual scene. It is not a named real facility,
exact location or verified supply route, and the supplied photographs are not
treated as report evidence. `nickel-seaview-art.json` retains the final edit prompt,
generation method, source hash and dimensions. Previous artwork/provenance remains
archived. The report opening, data and research argument are unchanged.
