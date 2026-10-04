# Indonesian data-center inventory: research decisions

Research cutoff: **4 October 2026**. The inventory is a partial public-disclosure ledger, not a national census. It contains operating facilities, construction milestones, committed grid connections, future plans, potential developments, and retained historical or contradictory observations. It records 67 observations supported by 44 sources.

## What can be added

Only rows with `include_in_inventory=true` contribute to numerical inventory totals. Only capacity explicitly described as IT load enters the five status-specific IT columns. A reported MW number without a clear IT definition stays in `reported_capacity_mw`; grid MW/MVA stays in the connection columns. A missing operating capacity is unknown, not zero.

The initial disclosed operating IT subtotal is **283.6 MW**. This combines public observations with different dates and omits material operators whose actual IT load is not explicitly defined. It is a disclosed minimum coverage subtotal, not a claim that Indonesia consumes electricity at 283.6 MW continuously. Neither contracted capacity, availability-zone counts, floor space, cabinet counts nor investment commitments establish actual electricity demand. Applying utilization/PUE to this subtotal produces an estimate, never measured national demand.

Do not add this subtotal to a metropolitan market estimate: the operator facilities are substantially inside the same market definition. Do not infer AI-only power from an AI-ready building. `ai_specific=true` denotes explicit AI-oriented design, inference, training or high-density positioning; it does not quantify the actual workload mix.

## Scope and overlap

Campus totals are counted once. DCI H1 includes JK1, JK2, JK3, JK5 and JK6; H2 combines its two buildings. BDx CGK3/3A is a combined site. NeutraDC's three enterprise facilities are represented by a disclosed aggregate and unallocated location rows. Their individual capacities are not invented.

Historical individual-facility observations are retained with `include_in_inventory=false`. Cloud-region entries for AWS, Alibaba, Google and Microsoft are also retained but excluded from physical capacity/count aggregates. A cloud region can span several owned and leased facilities and can overlap colocation facilities already counted.

Ultimate campus capacity cannot be added to a phase of that campus. Where an operating legacy phase has undisclosed MW, subtracting an under-construction building from a campus ceiling does not give a defensible remaining planned capacity. BDx CGK4 is therefore represented by an unknown legacy operating phase, the explicitly under-construction building and an excluded ultimate-campus observation. The balance remains unallocated.

Digital Edge CGK's full four-building IT plan is put in planned capacity; CGK1's construction milestone is retained separately without numeric capacity. This avoids claiming the entire campus ceiling is physically under construction. BW NDP1 follows the same conservative treatment where exact delivered and construction-phase MW are not disclosed.

## Definitions and discrepancies retained

| Issue | Treatment | Evidence |
| --- | --- | --- |
| DCI current site cards versus banner | Live campus IT totals sum to 133 MW; banner says 132 MW shell. The units/definitions differ and are preserved. | DC001 |
| DCI H2 historical versus current | Older combined IT capacity differs from current card. Current card selected; historical observation retained outside totals. | DC001, DC003 |
| DCI H1 scalability | Homepage and dedicated data-center page provide different ceilings. Potential residual uses the dedicated page, explicitly classified E. | DC001 |
| STT Jakarta 1 | Current card states 18 MW IT versus historical launch up to 19.5 MW. Current card controls the snapshot; alternative preserved. | DC023, DC025 |
| BDx CGK4 | Undated card labels operational beside 640 MW IT. Dated September 2026 release establishes new-building construction and phased 2027 commissioning. Full 640 MW is excluded from live totals. | DC007, DC008 |
| DayOne Nongsa | Corporate timeline delivered capacity differs materially from JLL's operating number. Definitions/dates not reconciled; numeric IT remains missing. | DC011, DC012, DC039 |
| NeutraDC Batam | FY2025 20-F operating language conflicts with newer June 2026 scheduled-opening language. Conservative construction classification retained. | DC016, DC017, DC018 |
| BW NDP1 | Current operator page and corporate newsletter provide 120 MW versus 144 MW IT designs and differing launch schedules. Alternate observation retained; no commissioning inferred. | DC036, DC037 |
| NTT Jakarta 3 | Initial commissioned block is separated from rounded future campus capacity and the planned brochure's 45.6 MW. | DC020, DC021 |
| NTT Jakarta 2/2A | Overview describes a 12 MW target; specification contains a 12W typo. Operational IT MW remains unknown. | DC022 |

A current website can change after an announcement. Undated pages have missing `publication_date`, and their evidence is the cutoff access snapshot rather than an invented release date. DCI news pages were migrated in 2026 while body text describes earlier launches; event dates and webpage publication dates are kept distinct.

## MVA, power factor and redundant feeds

DayOne Kabil's 511 MVA PPA is described by the operator as approximately 450 MW of **grid** capacity. This is a reported conversion with an implied power factor distinct from a model's adjustable 0.95 assumption. Both observations are retained; an analyst may calculate an alternative estimate separately. Neither conversion establishes IT MW.

Digital Edge's agreement has two independent 725 MVA feeds, described in marketing as 1.45 GW. The record stores **725 MVA per feed** and `connection_feed_count=2`. The marketed MW number is preserved separately in `reported_power_connection_mw`, not used as usable IT capacity. Engineering redundancy can mean either feed must carry the same load; adding redundant feeds would overstate firm simultaneous capacity.

BW's two 60 MVA feeds follow the same approach. NeutraDC's 90 MVA Batam connection is a campus development connection, not the IT capacity of the first building.

A configurable MVA-to-MW estimate should use:

```text
estimated connection MW = reported connection MVA × assumed power factor
```

Classify that output E and retain source MVA unchanged. Estimating IT from connection MW would additionally need the facility's design PUE, reserve headroom, topology and commissioned scope; this ledger makes no such inference.

## Investment, water and electricity

Announced investment amounts are programme/campus commitments. AWS's programme spans construction and operations; Microsoft's commitment spans national cloud/AI development. They are not realized project capex, revenue or resource operating costs. Do not divide them by unknown MW to manufacture unit capex.

None of the sources in this ledger establishes measured facility electricity consumption or measured Indonesian facility WUE. Cooling readiness, hydropower ambitions, renewable-energy certificates and proximity to a reservoir do not establish zero water consumption or continuous carbon-free power. Those require separate, explicitly sourced modeling and utility datasets.

Batam/Bintan commitments deserve location-specific analysis: connection agreements do not by themselves establish generation adequacy, source-water yield, seasonal reliability or permitting readiness. A national generation percentage cannot resolve an island's local feeder or water-treatment constraint.

## Update protocol

1. Save new evidence and observations under new filenames; retain these cutoff records.
2. Verify an operator announcement or official utility disclosure, then identify whether power is IT, facility or connection capacity.
3. Confirm commissioning with actual opening/RFS evidence rather than a target date.
4. Reconcile a new campus number with earlier buildings, acquisitions and operator names.
5. Preserve conflicting definitions and put excluded alternatives in separate rows.
6. If a cloud region's physical hosting becomes identifiable, link it to the host facility; do not create additive duplicate capacity.
7. Rerun validation and numerical inventory totals. A source can be Tier 1 and still leave a capacity definition ambiguous.

The JSON includes short paraphrased evidence under `data/raw/evidence/dc_*.json`; each record has the URL, observation date, source locator and interpretation. DC008's indexed official release text was inspectable, but a subsequent direct request returned HTTP 404. That access limitation is retained; it must not be silently replaced with invented page content.

## Source index

- **DC001** — [DCI Indonesia: DCI Platform Data Centers](https://dci-indonesia.com/data-centers). Undated; cutoff snapshot. Tier 1.
- **DC002** — [DCI Indonesia: DCI Indonesia Launches AI-Ready JK6 with 36 MW Capacity](https://dci-indonesia.com/news/dci-indonesia-launches-ai-ready-jk6-with-36-mw-capacity). 2026-04-21. Tier 1.
- **DC003** — [DCI Indonesia: DCI and Salim Group inaugurate H2-02](https://dci-indonesia.com/news/dci-indonesia-and-salim-group-inaugurate-second-data-center-in-karawang-pioneering-the-first-solar-powered-data-center-in-indonesia). 2026-01-07. Tier 1.
- **DC004** — [BDx Data Centers: CGK1 Central Jakarta](https://www.bdxworld.com/locations/cgk1/). Undated; cutoff snapshot. Tier 1.
- **DC005** — [BDx Data Centers: CGK2 South Tangerang](https://www.bdxworld.com/locations/cgk2/). Undated; cutoff snapshot. Tier 1.
- **DC006** — [BDx Data Centers: CGK3/3A AI Campus 1](https://www.bdxworld.com/locations/cgk3a/). Undated; cutoff snapshot. Tier 1.
- **DC007** — [BDx Data Centers: CGK4 AI Campus 2 Jatiluhur](https://www.bdxworld.com/locations/cgk4/). Undated; cutoff snapshot. Tier 1.
- **DC008** — [BDx Data Centers: BDx Breaks Ground on 640MW AI Data Center in West Java, Backed by 845MVA of Secured Grid Power](https://www.bdxworld.com/bdx-breaks-ground-on-640mw-ai-data-center-in-west-java-backed-by-845mva-of-secured-grid-power/). 2026-09-22. Tier 1.
- **DC009** — [BDx Data Centers: BDx Data Centers launches first phase of 500MW renewable-powered AI campus](https://staging.bdxworld.com/press-release/bdx-data-centers-launches-first-phase-of-500mw-renewable-powered-ai-campus-in-indonesia/). Undated; cutoff snapshot. Tier 1.
- **DC010** — [BDx Data Centers: CGK5 AI Campus 3 Suryacipta](https://www.bdxworld.com/locations/cgk5/). Undated; cutoff snapshot. Tier 1.
- **DC011** — [DayOne: Batam strategic regional core](https://dayonedc.com/market/batam). Undated; cutoff snapshot. Tier 1.
- **DC012** — [DayOne: About us and corporate milestones](https://dayonedc.com/about-us). Undated; cutoff snapshot. Tier 1.
- **DC013** — [DayOne: DayOne Signs Indonesia's Largest 511MVA (~450MW) PPA](https://dayonedc.com/markets/dayone-signs-indonesias-largest-511mva-450mw-ppa-to-expand-hyperscale-data-center-platform-in-batam). 2026-04-17. Tier 1.
- **DC014** — [DAMAC Group / EDGNEX: EDGNEX announces USD2.3bn AI-focused data center in Jakarta](https://www.damacgroup.com/ar-ru/d-hub/press-releases/edgnex-data-centers-by-damac-announces-2-3-billion-ai-focused-data-center-in-jakarta-indonesia/). Undated; cutoff snapshot. Tier 1.
- **DC015** — [Ministry of Communication and Digital: Komdigi welcomes EDGNEX investment to strengthen national data infrastructure](https://portal.komdigi.go.id/kanal-publik/berita-kini/9428). 2025-06-19. Tier 1.
- **DC016** — [Telkom Indonesia: FY2025 Form 20-F](https://www.telkom.co.id/minio/show/data/lampiran/1778861459016_original_PERUSAHAAN-PERSEROAN-PERSERO-PT-TELEKOMUNIKASI-INDONESIA-TBK-20260515-20-F-EDGAR.pdf). 2026-05-15. Tier 1.
- **DC017** — [Telkom Indonesia: TelkomGroup positions Batam as AI hyperscale center through NeutraDC Nxera](https://www.telkom.co.id/sites/berita/id_ID/news/telkomgroup-jadikan-batam-sebagai-pusat-hyperscale-data-center-berbasis-ai-melalui-neutradc-nxera-batam-3401). 2025-11-04. Tier 1.
- **DC018** — [Telkom Indonesia: Data center fully secured before operation: Telkom accelerates NeutraDC Batam expansion](https://www.telkom.co.id/sites/berita/id_ID/news/data-center-terisi-penuh-sebelum-beroperasi-telkom-percepat-ekspansi-kapasitas-neutradc-di-batam-3797). 2026-06-05. Tier 1.
- **DC019** — [NeutraDC: About NeutraDC](https://www.neutradc.com/about-us). Undated; cutoff snapshot. Tier 1.
- **DC020** — [NTT: NTT Launches Hyperscale Data Center in Jakarta](https://services.global.ntt/en-us/newsroom/ntt-launches-hyperscale-data-center-in-jakarta). Undated; cutoff snapshot. Tier 1.
- **DC021** — [NTT: Indonesia Data Center brochure](https://services.global.ntt/-/media/ntt/global/products-and-services/data-centers/colocation/brochure_data_center_location_indonesia.pdf). Undated; cutoff snapshot. Tier 1.
- **DC022** — [NTT DATA: Jakarta 2 Annex Data Center](https://services.global.ntt/en-id/services-and-products/global-data-centers/global-locations/asia-pacific/jakarta-2a-data-center). Undated; cutoff snapshot. Tier 1.
- **DC023** — [ST Telemedia Global Data Centres: Indonesia data center portfolio](https://www.sttgdc.com/id-en). Undated; cutoff snapshot. Tier 1.
- **DC024** — [ST Telemedia Global Data Centres: STT GDC Accelerates Jakarta Campus Expansion](https://www.sttgdc.com/newsroom/stt-gdc-accelerates-jakarta-campus-expansion-power-indonesia-ai-and-digital-ambitions). 2026-06-10. Tier 1.
- **DC025** — [ST Telemedia Global Data Centres: STT Jakarta1 launch](https://www.sttgdc.com/id-en/newsroom/st-telemedia-global-data-centres-launches-stt-jakarta-1). 2023-06-21. Tier 1.
- **DC026** — [Digital Edge: EDGE2 Jakarta specification sheet](https://www.digitaledgedc.com/wp-content/uploads/2023/07/EDGE2_Specsheet_DE-S.pdf). Undated; cutoff snapshot. Tier 1.
- **DC027** — [Digital Edge Indonesia: EDGE2 23MW data center ready for service](https://id.digitaledgedc.com/resource/news). 2024-02-28. Tier 1.
- **DC028** — [Digital Edge Indonesia: Digital Edge tops out CGK1 and secures single-campus PLN power deal](https://id.digitaledgedc.com/news/digital-edge-tops-out-cgk1-secures-largest-indonesia-power-deal). 2026-06-08. Tier 1.
- **DC029** — [Equinix: Equinix Unveils First AI-Ready Jakarta Data Center](https://equinix.mediaroom.com/2025-05-15-Equinix-Unveils-Its-First-AI-Ready-Data-Center-with-Dense-Ecosystem-in-Jakarta). 2025-05-15. Tier 1.
- **DC030** — [Amazon Web Services: AWS Launches Region in Indonesia](https://press.aboutamazon.com/2021/12/aws-launches-region-in-indonesia). 2021-12-14. Tier 1.
- **DC031** — [Alibaba Cloud: Alibaba Cloud Global Locations](https://www.alibabacloud.com/en/global-locations?_p_lc=1). Undated; cutoff snapshot. Tier 1.
- **DC032** — [Alibaba Cloud: Alibaba Cloud plans third Indonesian data center](https://www.alibabacloud.com/th/press-room/alibaba-cloud-launch-third-data-centre-indonesia-early-2021?_p_lc=1). 2020-07-02. Tier 1.
- **DC033** — [Google: Google Cloud Platform Region now present in Jakarta](https://indonesia.googleblog.com/2020/06/google-cloud-platform-region-kini-hadir.html). 2020-06-24. Tier 1.
- **DC034** — [Microsoft: Microsoft opens first Indonesian cloud region](https://news.microsoft.com/id-id/2025/05/27/microsoft-opens-indonesia-central/). 2025-05-27. Tier 1.
- **DC035** — [BP Batam: BP Batam oversees Equator Gate System AI data-center investment](https://ptsp.bpbatam.go.id/en/bp-batam-kawal-investasi-rp88-triliun-ai-data-centre-untuk-transformasi-digital-batam/). 2026-05-26. Tier 1.
- **DC036** — [BW Digital: BW Digital Campus at Nongsa Digital Park](https://www.bw-digital.com/projects/bw-digital-campus-at-ndp/). Undated; cutoff snapshot. Tier 1.
- **DC037** — [BW Group: World Horizon second half2025 newsletter](https://production-bworldcms12.bwoffshore.com/globalassets/documents/wh-h2-digital-2025.pdf). Undated; cutoff snapshot. Tier 1.
- **DC038** — [SOS Limited: SOS framework memorandum for planned500 MW Indonesian AI data-center platform](https://www.prnewswire.com/news-releases/sos-limited-announces-framework-memorandum-for-planned-500-megawatt-ai-data-center-platform-in-indonesia-302883250.html). 2026-09-18. Tier 1.
- **DC039** — [JLL: Batam Data Centre Market Dynamics H1 2025](https://www.jll.com/en-sea/insights/market-dynamics/batam-data-centre). 2025-10-14. Tier 2.
- **DC040** — [Princeton Digital Group: Where We Operate portfolio](https://princetondg.com/where-we-operate/). Undated; cutoff snapshot. Tier 1.
- **DC041** — [Princeton Digital Group: PDG launches22 MW Greater Jakarta facility](https://princetondg.com/press-releases/princeton-digital-group-launches-its-22mw-hyperscale-data-center-in-greater-jakarta-2/). 2023-09-25. Tier 1.
- **DC042** — [Princeton Digital Group: PDG breaks ground on USD1bn120 MW Greater Jakarta campus](https://princetondg.com/press-releases/princeton-digital-group-breaks-ground-on-milestone-usd-1-billion-120-mw-greater-jakarta-campus/). 2025-11-19. Tier 1.
- **DC043** — [Princeton Digital Group: PDG acquires240 MW powered land for JC4](https://princetondg.com/press-releases/pdg-acquires-240-mw-of-powered-land-in-jakarta-advancing-its-rapid-expansion-across-asia/). 2026-04-30. Tier 1.
- **DC044** — [Digital Edge Indonesia: US$4.5 billion CGK AI-ready hyperscale campus investment](https://id.digitaledgedc.com/news/digital-edge-4-5b-cgk-500mw-ai-ready-hyperscale-campus-indonesia). 2026-01-28. Tier 1.
