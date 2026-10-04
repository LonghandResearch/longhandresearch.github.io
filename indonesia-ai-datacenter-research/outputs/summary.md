# Electricity and water consumption of AI and data centers in Indonesia

Research cutoff: 2026-10-04. This summary is generated from processed datasets by `src/research_summary.py` after the model runs. Costs are in nominal Indonesian rupiah. A means reported, E means derived estimate, B means external benchmark and S means scenario. A reported project announcement does not by itself establish an operating asset.

## 1. Executive Summary

An extra 1 GW of data center IT capacity would use **9.110 TWh/year** in the base expansion scenario. This assumes average electrical utilization of 80%, PUE of 1.30 and on-site consumptive WUE of 0.50 L/IT kWh. Electricity energy charges would be **Rp9.081 trillion/year**. Modeled direct water consumption would be **3,504,000 m3/year**. Valuing that consumption at a Jakarta industrial marginal tariff gives a water cost proxy of **Rp75.336 billion/year**.

The facility electricity would equal **2.00%** of 2025 national electricity consumption and 2.87% of PLN sales. These calculations describe a scenario. They do not measure electricity or water used by Indonesian AI workloads.

The reviewed sources do not provide a complete, current national census of IT capacity or facility consumption. The dated market estimate covers **322 MW IT**. Its recorded scope is **Greater Jakarta operational IT market estimate, H2 2025. It excludes unknown national and island capacity**. The observation is dated 2025-12-31 and comes from ELEC004. It cannot establish national actual consumption. The separate operator inventory documents 283.6 MW of explicit operational IT capacity and is incomplete.

## 2. Key Findings

| Case | Utilization | PUE | WUE L/IT kWh | IT TWh/yr | Facility TWh/yr | Electricity Rp tn/yr | Water m3/yr | Water Rp bn/yr | National share % |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| low | 0.600 | 1.200 | 0.000 | 5.256 | 6.307 | 6.287 | 0.000 | 0.000 | 1.386 |
| base | 0.800 | 1.300 | 0.500 | 7.008 | 9.110 | 9.081 | 3,504,000.000 | 75.336 | 2.002 |
| high | 0.950 | 1.500 | 1.500 | 8.322 | 12.483 | 12.442 | 12,483,000.000 | 268.385 | 2.744 |

All numerical results above are S. The published tariff observations are A, while their application to an unidentified facility is S.

The low case assumes zero consumptive water for cooling. It excludes sanitary use and indirect water associated with electricity generation. It does not guarantee that a facility with liquid cooling uses no water. The joint PUE 1.20 and zero WUE pair is an exploratory demand bound. This project has not validated an Indonesian cooling design for that combination. The high case tests expansion demand under higher resource intensities. It is not an upper bound for inefficient existing facilities.

## 3. Indonesia Data Center Market

`data/processed/datacenter_projects.csv` separates operational, construction, committed, planned and potential capacity. It keeps IT MW, facility MW and connection MVA distinct. Inventory charts include only selected rows with a confirmed IT capacity basis.

Campus ultimate capacity and initial phases have separate records or exclusions to avoid counting the same capacity twice. Conflicting records remain available. Cloud regions with undisclosed capacity remain unknown. A region launch or investment announcement does not establish MW. The operator inventory is incomplete and is kept separate from the market estimate.

The current consumption estimates below use PUE assumptions for the current fleet. These differ from the assumptions for efficient expansion:

| case | it_capacity_mw | pue | facility_electricity_twh | water_m3_per_year | electricity_cost_rp |
| --- | --- | --- | --- | --- | --- |
| low | 322.000 | 1.250 | 2.116 | 0.000 | 2,108,643,339,600.000 |
| base | 322.000 | 1.700 | 3.836 | 1,128,288.000 | 3,823,673,255,810.000 |
| high | 322.000 | 1.950 | 5.225 | 4,019,526.000 | 5,208,349,048,810.000 |

These E estimates apply assumed electrical load factors and water intensities to a dated capacity observation. They do not establish metered use for Indonesia or an operator. The calculations are saved in `current_baseline_estimates.csv` and `documented_inventory_estimates.csv`.

## 4. Electricity Demand

The model calculates annual electricity as follows:

```text
IT MWh/year = IT MW × utilization × 8760
Facility MWh/year = IT MWh/year × PUE
GWh = MWh / 1,000
TWh = MWh / 1,000,000
```

Utilization is average real IT load divided by IT nameplate power. It is distinct from commercial occupancy or GPU compute utilization. Monthly electricity is annual run rate / 12 and does not represent seasonal demand.

The base 1 GW case uses 7.008 IT TWh and 9.110 total facility TWh. The difference includes cooling, electrical losses and other facility overhead. It is not cooling electricity alone.

## 5. Electricity Cost

Electricity Rp/year = facility MWh × 1,000 × Rp/kWh. The default energy rate is 996.74 Rp/kWh. The model uses the PLN Q3 2026 I-4 high-voltage energy rate. A qualifying >=30 MVA industrial connection is assumed. The calculation includes energy charges only. Published schedule is a dated observation, not a verified October private contract.

B-3 and I-3 use peak and off-peak rates. Reactive energy charges in Rp/kVArh are distinct from active energy rates in Rp/kWh. The tariff dataset preserves both. Contract premiums, time-of-use pricing, demand or minimum bills, negotiated services, taxes and penalties can change the total bill. Operators are not assumed to pay a uniform tariff.

## 6. Water Consumption

```text
Direct modeled consumptive liters = IT kWh × consumptive WUE L/IT kWh
m3 = liters / 1,000
```

Consumption is water not returned to the source. Withdrawal is intake, including water that may be returned. Each benchmark keeps its reported boundary, whether consumption, withdrawal or unspecified use. Global benchmarks are B and do not establish Indonesian actual consumption. The project does not invent metered facility consumption. Daily modeled volume is an annual average and does not establish peak supply requirements in the dry season.

## 7. Water Cost

Water Rp/year = modeled consumptive m3 × Rp/m3. The default price proxy is 21,500 Rp/m3. The model uses the PAM JAYA 2025 industrial-large >20 m3 marginal band for Jakarta. This is an explicit local price proxy, not a national tariff. Actual purchased withdrawals may exceed modeled consumption.

A utility normally bills withdrawn or delivered water. Applying that tariff to modeled consumption is an approximation. Intake and cooling tower blowdown may make billed volume greater. The calculation excludes fixed charges, tariff band allocations, recycling treatment and private estate contracts. Historical Batam and other local schedules remain separate because their effective dates and applicability are uncertain. The Jakarta rate is a local cost proxy, not a national tariff.

## 8. AI Power Density

`ai_hardware.csv` separates accelerator TDP, maximum server power and rack designs. Maximum server power includes the host CPU, memory, networking and power supplies. Multiplying GPU TDP by GPU count does not capture that total. Global manufacturer specifications are B.

Traditional enterprise, cloud and AI racks have different power densities. The project does not infer Indonesia's installed fleet mix or its AI share. The grid model starts from IT MW, so adding GPU power to that total would count demand twice. At fixed IT MW, higher rack density changes cooling and connection design. It does not automatically increase annual energy.

## 9. Cooling Technology

Evaporative towers can reduce compressor electricity while consuming water. Dry air heat rejection avoids tower evaporation but can require more fan or compressor energy in hot, humid conditions. Chilled water systems can use either dry or evaporative heat rejection.

Direct-to-chip cooling moves heat into a coolant loop. Water consumption depends on how that heat is ultimately rejected outdoors. A closed coolant loop can still use evaporative towers. Liquid cooling therefore does not by itself establish zero water use.

`cooling_tradeoff.csv` varies PUE and WUE independently as S. It is not a physical design curve. The climate data provides context on heat, humidity and rainfall. It does not drive an uncalibrated cooling model. Missing wet-bulb observations remain NaN.

## 10. National Grid Impact

The latest comparison year is 2025, when national consumption was 455.001 TWh and PLN sales were 317.692 TWh. Their scopes are documented in `indonesia_electricity.csv`.

The base additional 1 GW case would draw an average facility load of 1.040 GW. Demand at full IT load would be 1.300 GW. At an assumed generation capacity factor of 80%, its annual energy corresponds to 1.300 GW of generation capacity. This annual energy comparison excludes grid losses, reserve margin, outages and hourly adequacy.

National annual percentages do not establish available capacity at a Cikarang substation or on an island grid. PLN-only peak demand and national installed capacity also have different scopes.

## 11. 2030 to 2032 Scenarios

| Outlook | Year | IT MW | Facility TWh/yr | Electricity Rp tn/yr | Water m3/yr | Water Rp bn/yr | Share of latest actual % | Share of scenario future % |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Conservative | 2,030.000 | 640.750 | 4.041 | 4.028 | 0.000 | 0.000 | 0.888 | 0.664 |
| Conservative | 2,031.000 | 692.375 | 4.367 | 4.353 | 0.000 | 0.000 | 0.960 | 0.677 |
| Conservative | 2,032.000 | 744.000 | 4.693 | 4.677 | 0.000 | 0.000 | 1.031 | 0.686 |
| Base Case | 2,030.000 | 1,956.000 | 17.820 | 17.762 | 6,853,824.000 | 147.357 | 3.916 | 2.927 |
| Base Case | 2,031.000 | 2,319.600 | 21.132 | 21.064 | 8,127,878.400 | 174.749 | 4.644 | 3.274 |
| Base Case | 2,032.000 | 2,683.200 | 24.445 | 24.365 | 9,401,932.800 | 202.142 | 5.373 | 3.573 |
| Aggressive AI Boom | 2,030.000 | 3,168.000 | 39.546 | 39.417 | 39,546,144.000 | 850.242 | 8.691 | 6.495 |
| Aggressive AI Boom | 2,031.000 | 3,168.000 | 39.546 | 39.417 | 39,546,144.000 | 850.242 | 8.691 | 6.127 |
| Aggressive AI Boom | 2,032.000 | 3,168.000 | 39.546 | 39.417 | 39,546,144.000 | 850.242 | 8.691 | 5.780 |

Every outlook case is S. It covers a **documented nationwide subset**, consisting of dated Greater Jakarta market evidence and non-overlapping disclosed components in Surabaya, Batam and Bintan. This is not a complete country census. `assumptions.yaml` and `market_anchors.csv` record the source anchors, capacity basis and deviations.

The figures are annual steady-state run rates at capacity in service. They are not annual averages during commissioning. Shares of the latest actual national consumption are comparisons, not forecasts. Future national shares use a separate 6.0% annual consumption growth scenario. That assumption does not replace an official national forecast.

The RUPTL PLN-only sales forecasts are retained separately in `outlook_2030_2032.csv` and used for `share_official_pln_sales_forecast_pct`. Forecast PLN sales are never substituted for national consumption.

The capacity bridge combines observations from different dates. It includes operating capacity of 331 MW (Greater Jakarta 322 plus Surabaya 9), construction capacity of 413 MW (Jakarta 395 plus Batam 18) and planned capacity of 2,424 MW (Jakarta 1,304 plus Bintan 1,000 plus Batam 120). These source-defined components are not added to the operator metro inventory.

The aggressive case activates this disclosed subset by 2030. The conservative and base cases apply the explicit realization assumptions in YAML. None is an exhaustive national forecast or a prediction of demand beyond the identified pipeline.

## 12. Infrastructure Constraints

Power diligence should check local transformer and substation capacity, transmission routes and connection queue timing. It should also verify reliable dual feeds, the difference between redundant contracted MVA and usable IT MW, dispatchable supply and backup arrangements.

Water diligence should check dry season utility allocations, intake permits, groundwater restrictions, treatment and reuse infrastructure. Local climate conditions also affect the design. Annual national or Java-Bali energy figures do not establish constraints in Batam or Bintan. The project does not include a local load-flow, reservoir-yield or permit-allocation study. It cannot establish available headroom.

## 13. Key Risks

Capacity estimates depend on commissioning timing and avoiding duplicated campus announcements. Ambiguous IT, facility or connection definitions can change the results. Operating estimates also depend on real electrical load factors, legacy PUE and AI fleet composition. Peak and off-peak billing, water consumption boundaries and contracted water availability add uncertainty.

Electricity accounts for 99.18% of modeled base resource costs. Water accounts for 0.82%. Water is a small share of modeled resource costs in this case. Local supply and environmental constraints can still affect whether a project proceeds. That depends on availability and permits as well as price.

## 14. Data Limitations

The reviewed sources do not establish comprehensive national metered data center electricity or water consumption, or a verified national total for AI capacity. Negotiated premium tariffs and facility cooling configurations are not available. Climate series do not cover all target locations.

Missing values remain NaN. Design targets, global water-use averages and historical operator values do not establish current Indonesian actuals. Coverage gaps and conflicting observations remain visible in `docs/limitations.md`, the raw evidence locators and `outputs/validation.log`.

## 15. Conclusion

The additional 1 GW calculations can be reproduced from the stated assumptions. Public sources do not establish today's national metered data center totals. Electricity dominates the modeled resource costs. Water still requires local supply and environmental diligence even where its modeled cost is small. Use the low, base and high cases as calculations under stated assumptions. Update the source observations and assumptions before applying them to a specific investment or grid connection.

## Source registry

- **ELEC001**: [Handbook of Energy and Economic Statistics of Indonesia 2025](https://www.esdm.go.id/assets/media/content/content-handbook-of-energy-and-economic-statistics-of-indonesia-2025.pdf) (Ministry of Energy and Mineral Resources (ESDM)). Published 2026-08-12. Accessed 2026-10-04.
- **ELEC002**: [Penetapan Penyesuaian Tarif Tenaga Listrik Juli-September 2026](https://www.pln.co.id/webapi/media/file/webkorp/asset/1fa2814b-6ffd-459b-ac16-d46e515a0b3b.pdf) (PT PLN (Persero)). Published 2026-07-01. Accessed 2026-10-04.
- **ELEC003**: [Rencana Usaha Penyediaan Tenaga Listrik 2025-2034](https://www.pln.co.id/webapi/media/file/webkorp/asset/b967d-ruptl-pln-2025-2034-pub-.pdf) (PT PLN (Persero); Ministry of Energy and Mineral Resources). Published 2025-05-26. Accessed 2026-10-04.
- **ELEC004**: [APAC Data Centre Development Pipeline Hits Record in 2025](https://cw-prod-amrgws-a-cd.cushwake.com/en/singapore/news/2026/03/apac-data-centre-development-pipeline-hits-record-in-2025) (Cushman & Wakefield). Published 2026-03-27. Accessed 2026-10-04.
- **ELEC005**: [Indonesia Kejar Posisi Ekonomi Digital Terbesar Asia Lewat AI](https://portal.komdigi.go.id/kanal-publik/berita-kini/10247) (Ministry of Communication and Digital Affairs (Komdigi)). Published 2026-05-22. Accessed 2026-10-04.
- **ELEC006**: [APAC Data Centre Development Pipeline Sets New Record in H1 2026](https://cw-prod-amrgws-a-cd.cushwake.com/en/singapore/news/2026/08/apac-dc-h1-2026) (Cushman & Wakefield). Published 2026-08-05. Accessed 2026-10-04.
- **DC001**: [DCI Platform Data Centers](https://dci-indonesia.com/data-centers) (DCI Indonesia). Published date not disclosed. Accessed 2026-10-04.
- **DC002**: [DCI Indonesia Launches AI-Ready JK6 with 36 MW Capacity](https://dci-indonesia.com/news/dci-indonesia-launches-ai-ready-jk6-with-36-mw-capacity) (DCI Indonesia). Published 2026-04-21. Accessed 2026-10-04.
- **DC003**: [DCI and Salim Group inaugurate H2-02](https://dci-indonesia.com/news/dci-indonesia-and-salim-group-inaugurate-second-data-center-in-karawang-pioneering-the-first-solar-powered-data-center-in-indonesia) (DCI Indonesia). Published 2026-01-07. Accessed 2026-10-04.
- **DC004**: [CGK1 Central Jakarta](https://www.bdxworld.com/locations/cgk1/) (BDx Data Centers). Published date not disclosed. Accessed 2026-10-04.
- **DC005**: [CGK2 South Tangerang](https://www.bdxworld.com/locations/cgk2/) (BDx Data Centers). Published date not disclosed. Accessed 2026-10-04.
- **DC006**: [CGK3/3A AI Campus 1](https://www.bdxworld.com/locations/cgk3a/) (BDx Data Centers). Published date not disclosed. Accessed 2026-10-04.
- **DC007**: [CGK4 AI Campus 2 Jatiluhur](https://www.bdxworld.com/locations/cgk4/) (BDx Data Centers). Published date not disclosed. Accessed 2026-10-04.
- **DC008**: [BDx Breaks Ground on 640MW AI Data Center in West Java, Backed by 845MVA of Secured Grid Power](https://www.bdxworld.com/bdx-breaks-ground-on-640mw-ai-data-center-in-west-java-backed-by-845mva-of-secured-grid-power/) (BDx Data Centers). Published 2026-09-22. Accessed 2026-10-04.
- **DC009**: [BDx Data Centers launches first phase of 500MW renewable-powered AI campus](https://staging.bdxworld.com/press-release/bdx-data-centers-launches-first-phase-of-500mw-renewable-powered-ai-campus-in-indonesia/) (BDx Data Centers). Published date not disclosed. Accessed 2026-10-04.
- **DC010**: [CGK5 AI Campus 3 Suryacipta](https://www.bdxworld.com/locations/cgk5/) (BDx Data Centers). Published date not disclosed. Accessed 2026-10-04.
- **DC011**: [Batam strategic regional core](https://dayonedc.com/market/batam) (DayOne). Published date not disclosed. Accessed 2026-10-04.
- **DC012**: [About us and corporate milestones](https://dayonedc.com/about-us) (DayOne). Published date not disclosed. Accessed 2026-10-04.
- **DC013**: [DayOne Signs Indonesia's Largest 511MVA (~450MW) PPA](https://dayonedc.com/markets/dayone-signs-indonesias-largest-511mva-450mw-ppa-to-expand-hyperscale-data-center-platform-in-batam) (DayOne). Published 2026-04-17. Accessed 2026-10-04.
- **DC014**: [EDGNEX announces USD2.3bn AI-focused data center in Jakarta](https://www.damacgroup.com/ar-ru/d-hub/press-releases/edgnex-data-centers-by-damac-announces-2-3-billion-ai-focused-data-center-in-jakarta-indonesia/) (DAMAC Group / EDGNEX). Published date not disclosed. Accessed 2026-10-04.
- **DC015**: [Komdigi welcomes EDGNEX investment to strengthen national data infrastructure](https://portal.komdigi.go.id/kanal-publik/berita-kini/9428) (Ministry of Communication and Digital). Published 2025-06-19. Accessed 2026-10-04.
- **DC016**: [FY2025 Form 20-F](https://www.telkom.co.id/minio/show/data/lampiran/1778861459016_original_PERUSAHAAN-PERSEROAN-PERSERO-PT-TELEKOMUNIKASI-INDONESIA-TBK-20260515-20-F-EDGAR.pdf) (Telkom Indonesia). Published 2026-05-15. Accessed 2026-10-04.
- **DC017**: [TelkomGroup positions Batam as AI hyperscale center through NeutraDC Nxera](https://www.telkom.co.id/sites/berita/id_ID/news/telkomgroup-jadikan-batam-sebagai-pusat-hyperscale-data-center-berbasis-ai-melalui-neutradc-nxera-batam-3401) (Telkom Indonesia). Published 2025-11-04. Accessed 2026-10-04.
- **DC018**: [Data center fully secured before operation: Telkom accelerates NeutraDC Batam expansion](https://www.telkom.co.id/sites/berita/id_ID/news/data-center-terisi-penuh-sebelum-beroperasi-telkom-percepat-ekspansi-kapasitas-neutradc-di-batam-3797) (Telkom Indonesia). Published 2026-06-05. Accessed 2026-10-04.
- **DC019**: [About NeutraDC](https://www.neutradc.com/about-us) (NeutraDC). Published date not disclosed. Accessed 2026-10-04.
- **DC020**: [NTT Launches Hyperscale Data Center in Jakarta](https://services.global.ntt/en-us/newsroom/ntt-launches-hyperscale-data-center-in-jakarta) (NTT). Published date not disclosed. Accessed 2026-10-04.
- **DC021**: [Indonesia Data Center brochure](https://services.global.ntt/-/media/ntt/global/products-and-services/data-centers/colocation/brochure_data_center_location_indonesia.pdf) (NTT). Published date not disclosed. Accessed 2026-10-04.
- **DC022**: [Jakarta 2 Annex Data Center](https://services.global.ntt/en-id/services-and-products/global-data-centers/global-locations/asia-pacific/jakarta-2a-data-center) (NTT DATA). Published date not disclosed. Accessed 2026-10-04.
- **DC023**: [Indonesia data center portfolio](https://www.sttgdc.com/id-en) (ST Telemedia Global Data Centres). Published date not disclosed. Accessed 2026-10-04.
- **DC024**: [STT GDC Accelerates Jakarta Campus Expansion](https://www.sttgdc.com/newsroom/stt-gdc-accelerates-jakarta-campus-expansion-power-indonesia-ai-and-digital-ambitions) (ST Telemedia Global Data Centres). Published 2026-06-10. Accessed 2026-10-04.
- **DC025**: [STT Jakarta1 launch](https://www.sttgdc.com/id-en/newsroom/st-telemedia-global-data-centres-launches-stt-jakarta-1) (ST Telemedia Global Data Centres). Published 2023-06-21. Accessed 2026-10-04.
- **DC026**: [EDGE2 Jakarta specification sheet](https://www.digitaledgedc.com/wp-content/uploads/2023/07/EDGE2_Specsheet_DE-S.pdf) (Digital Edge). Published date not disclosed. Accessed 2026-10-04.
- **DC027**: [EDGE2 23MW data center ready for service](https://id.digitaledgedc.com/resource/news) (Digital Edge Indonesia). Published 2024-02-28. Accessed 2026-10-04.
- **DC028**: [Digital Edge tops out CGK1 and secures single-campus PLN power deal](https://id.digitaledgedc.com/news/digital-edge-tops-out-cgk1-secures-largest-indonesia-power-deal) (Digital Edge Indonesia). Published 2026-06-08. Accessed 2026-10-04.
- **DC029**: [Equinix Unveils First AI-Ready Jakarta Data Center](https://equinix.mediaroom.com/2025-05-15-Equinix-Unveils-Its-First-AI-Ready-Data-Center-with-Dense-Ecosystem-in-Jakarta) (Equinix). Published 2025-05-15. Accessed 2026-10-04.
- **DC030**: [AWS Launches Region in Indonesia](https://press.aboutamazon.com/2021/12/aws-launches-region-in-indonesia) (Amazon Web Services). Published 2021-12-14. Accessed 2026-10-04.
- **DC031**: [Alibaba Cloud Global Locations](https://www.alibabacloud.com/en/global-locations?_p_lc=1) (Alibaba Cloud). Published date not disclosed. Accessed 2026-10-04.
- **DC032**: [Alibaba Cloud plans third Indonesian data center](https://www.alibabacloud.com/th/press-room/alibaba-cloud-launch-third-data-centre-indonesia-early-2021?_p_lc=1) (Alibaba Cloud). Published 2020-07-02. Accessed 2026-10-04.
- **DC033**: [Google Cloud Platform Region now present in Jakarta](https://indonesia.googleblog.com/2020/06/google-cloud-platform-region-kini-hadir.html) (Google). Published 2020-06-24. Accessed 2026-10-04.
- **DC034**: [Microsoft opens first Indonesian cloud region](https://news.microsoft.com/id-id/2025/05/27/microsoft-opens-indonesia-central/) (Microsoft). Published 2025-05-27. Accessed 2026-10-04.
- **DC035**: [BP Batam oversees Equator Gate System AI data-center investment](https://ptsp.bpbatam.go.id/en/bp-batam-kawal-investasi-rp88-triliun-ai-data-centre-untuk-transformasi-digital-batam/) (BP Batam). Published 2026-05-26. Accessed 2026-10-04.
- **DC036**: [BW Digital Campus at Nongsa Digital Park](https://www.bw-digital.com/projects/bw-digital-campus-at-ndp/) (BW Digital). Published date not disclosed. Accessed 2026-10-04.
- **DC037**: [World Horizon second half2025 newsletter](https://production-bworldcms12.bwoffshore.com/globalassets/documents/wh-h2-digital-2025.pdf) (BW Group). Published date not disclosed. Accessed 2026-10-04.
- **DC038**: [SOS framework memorandum for planned500 MW Indonesian AI data-center platform](https://www.prnewswire.com/news-releases/sos-limited-announces-framework-memorandum-for-planned-500-megawatt-ai-data-center-platform-in-indonesia-302883250.html) (SOS Limited). Published 2026-09-18. Accessed 2026-10-04.
- **DC039**: [Batam Data Centre Market Dynamics H1 2025](https://www.jll.com/en-sea/insights/market-dynamics/batam-data-centre) (JLL). Published 2025-10-14. Accessed 2026-10-04.
- **DC040**: [Where We Operate portfolio](https://princetondg.com/where-we-operate/) (Princeton Digital Group). Published date not disclosed. Accessed 2026-10-04.
- **DC041**: [PDG launches22 MW Greater Jakarta facility](https://princetondg.com/press-releases/princeton-digital-group-launches-its-22mw-hyperscale-data-center-in-greater-jakarta-2/) (Princeton Digital Group). Published 2023-09-25. Accessed 2026-10-04.
- **DC042**: [PDG breaks ground on USD1bn120 MW Greater Jakarta campus](https://princetondg.com/press-releases/princeton-digital-group-breaks-ground-on-milestone-usd-1-billion-120-mw-greater-jakarta-campus/) (Princeton Digital Group). Published 2025-11-19. Accessed 2026-10-04.
- **DC043**: [PDG acquires240 MW powered land for JC4](https://princetondg.com/press-releases/pdg-acquires-240-mw-of-powered-land-in-jakarta-advancing-its-rapid-expansion-across-asia/) (Princeton Digital Group). Published 2026-04-30. Accessed 2026-10-04.
- **DC044**: [US$4.5 billion CGK AI-ready hyperscale campus investment](https://id.digitaledgedc.com/news/digital-edge-4-5b-cgk-500mw-ai-ready-hyperscale-campus-indonesia) (Digital Edge Indonesia). Published 2026-01-28. Accessed 2026-10-04.
- **WB001**: [Tarif Air Minum - Keputusan Gubernur No. 730 Tahun 2024](https://pelanggan.pamjaya.co.id/pdf/tarif_air_minum.pdf) (PAM JAYA). Published 2024. Accessed 2026-10-04.
- **WB002**: [Terapkan Tarif Baru, PAM JAYA Pastikan Tarif Berkeadilan dan Peningkatan Pelayanan](https://www.pamjaya.co.id/bacapage/terapkan-tarif-baru-pam-jaya-pastikan-tarif-berkeadilan-dan-peningkatan-pelayanan-itW5e) (PAM JAYA). Published 2025-02-13. Accessed 2026-10-04.
- **WB003**: [Tabel Tarif - Peraturan Kepala BP Batam No. 24 Tahun 2020](https://hilir.airbatam.com/index.php?dua=tabel-tarif&satu=berita&tiga=1000) (Air Batam Hilir / BP Batam). Published 2021-02-24. Accessed 2026-10-04.
- **WB004**: [Empat Tahun Tidak Naik, PDAM Tirta Bhagasasi Bekasi Segera Lakukan Penyesuaian Tarif Air Bersih](https://tirtabhagasasi.co.id/empat-tahun-tidak-naik-pdam-tirta-bhagasasi-bekasi-segera-lakukan-penyesuaian-tarif-air-bersih/) (Perumdam Tirta Bhagasasi Bekasi). Published 2018-08-09. Accessed 2026-10-04.
- **WB005**: [Official utility website](https://www.tirtatarum.co.id) (Perumdam Tirta Tarum). Published date not disclosed. Accessed 2026-10-04.
- **WB006**: [Kota Batam Dalam Angka 2025](https://batamkota.bps.go.id/id/publication/2025/02/28/a5735c3be81a8a72f8a1e9f0/kota-batam-dalam-angka-2025.html) (BPS Kota Batam / BMKG Hang Nadim). Published 2025-02-28. Accessed 2026-10-04.
- **WB007**: [Provinsi DKI Jakarta Dalam Angka 2025](https://jakarta.bps.go.id/id/publication/2025/02/28/30874e042a98939928603ee5/provinsi-dki-jakarta-dalam-angka-2025.html) (BPS DKI Jakarta / BMKG Kemayoran). Published 2025-02-28. Accessed 2026-10-04.
- **WB008**: [Indonesia data center products and efficiency specifications](https://www.digitaledgedc.com/products-services/data-centers/indonesia/) (Digital Edge). Published date not disclosed. Accessed 2026-10-04.
- **WB009**: [ESG Report 2025](https://www.digitaledgedc.com/wp-content/uploads/2025/04/ESG_2025_Report_APR28.pdf) (Digital Edge). Published 2025-04. Accessed 2026-10-04.
- **WB010**: [ESG Report 2026](https://www.digitaledgedc.com/wp-content/uploads/2026/04/digital_edge_esg_report_2026.pdf) (Digital Edge). Published 2026-04. Accessed 2026-10-04.
- **WB011**: [Sustainability Report 2021](https://princetondg.com/wp-content/uploads/2022/04/PDG-Sustainability-Report-2021.pdf) (Princeton Digital Group). Published 2022-04. Accessed 2026-10-04.
- **WB012**: [EPI Awarded PDG Cibitung DCs TIA-942 Rated-3 Design Certifications](https://princetondg.com/press-releases/epi-awarded-pdg-cibitung-dcs-tia-942-rated-3-design-certifications/) (Princeton Digital Group). Published 2022-03-08. Accessed 2026-10-04.
- **WB013**: [Datacenter efficiency - Power and water usage effectiveness](https://datacenters.microsoft.com/sustainability/efficiency/) (Microsoft). Published date not disclosed. Accessed 2026-10-04.
- **WB014**: [AWS Cloud sustainability - water and energy](https://sustainability.aboutamazon.com/products-services/aws-cloud?energy=true) (Amazon Web Services). Published date not disclosed. Accessed 2026-10-04.
- **WB015**: [Sustainable by design: Next-generation datacenters consume zero water for cooling](https://www.microsoft.com/en-us/microsoft-cloud/blog/2024/12/09/sustainable-by-design-next-generation-datacenters-consume-zero-water-for-cooling/) (Microsoft). Published 2024-12-09. Accessed 2026-10-04.
- **WB016**: [Measuring the environmental impact of delivering AI at Google Scale](https://services.google.com/fh/files/misc/measuring_the_environmental_impact_of_delivering_ai_at_google_scale.pdf) (Google). Published 2025-08. Accessed 2026-10-04.
- **WB017**: [2024 United States Data Center Energy Usage Report](https://eta-publications.lbl.gov/sites/default/files/2024-12/us_data_center_energy_usage_report_lbnl-2001637_0.pdf) (Lawrence Berkeley National Laboratory / US DOE). Published 2024-12. Accessed 2026-10-04.
- **WB018**: [Data Online BMKG](https://dataonline.bmkg.go.id/dataonline-home) (BMKG). Published date not disclosed. Accessed 2026-10-04.
- **WB019**: [NVIDIA H100 Tensor Core GPU](https://www.nvidia.com/en-in/data-center/h100/) (NVIDIA). Published date not disclosed. Accessed 2026-10-04.
- **WB020**: [NVIDIA H200 Tensor Core GPU](https://www.nvidia.com/en-us/data-center/h200/) (NVIDIA). Published date not disclosed. Accessed 2026-10-04.
- **WB021**: [DGX H100/H200 User Guide - Introduction](https://docs.nvidia.com/dgx/dgxh100-user-guide/introduction-to-dgxh100.html) (NVIDIA). Published date not disclosed. Accessed 2026-10-04.
- **WB022**: [DGX B200 User Guide - Introduction](https://docs.nvidia.com/dgx/dgxb200-user-guide/introduction-to-dgxb200.html) (NVIDIA). Published date not disclosed. Accessed 2026-10-04.
- **WB023**: [NVIDIA Blackwell Architecture Technical Brief v2.1](https://dam-cdn.nvd.orangelogic.com/AssetLink/gl2l4l4812s5fw0p614s6i8bv6mi3vx5.pdf) (NVIDIA). Published date not disclosed. Accessed 2026-10-04.
- **WB024**: [DGX B300 User Guide - Introduction](https://docs.nvidia.com/dgx/dgxb300-user-guide/introduction-to-dgxb300.html) (NVIDIA). Published date not disclosed. Accessed 2026-10-04.
- **WB025**: [Building the Modular Foundation for AI Factories with NVIDIA MGX](https://developer.nvidia.com/blog/?p=100010) (NVIDIA). Published 2025-05-16. Accessed 2026-10-04.
- **WB026**: [NVIDIA Contributes NVIDIA GB200 NVL72 Designs to Open Compute Project](https://developer.nvidia.com/blog/nvidia-contributes-nvidia-gb200-nvl72-designs-to-open-compute-project/) (NVIDIA). Published 2024-10-15. Accessed 2026-10-04.
- **WB027**: [Blackwell Ultra Datacenter Product Lineup datasheet](https://dam-cdn.nvd.orangelogic.com/AssetLink/1k0p832eq8r5ca0u5383ie5o4tp3bst1.pdf) (NVIDIA). Published date not disclosed. Accessed 2026-10-04.
- **WB028**: [Perda SPAM dan Dukungan Bupati Jadi Kunci Penguatan Perumda Tirta Bhagasasi](https://tirtabhagasasi.co.id/perda-spam-dan-dukungan-bupati-jadi-kunci-penguatan-perumda-tirta-bhagasasi/) (Perumdam Tirta Bhagasasi Bekasi). Published 2025-07-24. Accessed 2026-10-04.
- **WB029**: [Tarif pelanggan](https://hilir.airbatam.com/tarif-pelanggan) (Air Batam Hilir). Published 2023-10-05. Accessed 2026-10-04.
