# Water, climate and efficiency research

Research cutoff and access date: 2026-10-04. Scope: Indonesia. Foreign observations below are explicitly **benchmarks (B)**; they are not an Indonesian fleet census. Curated source records and observations are in `data/raw/observations/water_benchmarks.json`.

## Definitions that determine the result

PUE is total facility electricity divided by IT electricity. Site WUE for this project's consumption scenarios is liters of water **consumed** per IT kWh. Water consumed is water not returned to the relevant water system, principally evaporated cooling water. Withdrawal is water drawn from a utility, river or aquifer; some may be returned as blowdown or other discharge. A provider's undefined "water use" figure does not establish either numerator.

Use `water_measure`, `denominator`, `scope` and `measurement_status` before comparing WUE values. The project's scenario algebra is:

```text
IT electricity [kWh/year] = IT capacity [MW] × 1,000 × 8,760 × utilization
Facility electricity [kWh/year] = IT electricity × PUE
On-site consumed water [m3/year] = IT electricity × consumptive WUE [L/IT kWh] / 1,000
Illustrative water value [Rp/year] = consumed water × local water-price proxy [Rp/m3]
```

For fixed IT capacity, utilization and WUE, changing PUE changes electricity demand but does not change this direct water result. Multiplying facility kWh by a WUE defined per IT kWh would overstate water consumption by PUE. Source water associated with electricity generation, sanitary use, commissioning fill, leaks and supply-chain water are outside this cooling consumption calculation unless explicitly added.

The price proxy gives the value of the modeled consumption at a local supply tariff. A utility actually bills metered supply/withdrawal, which can exceed consumptive evaporation because of cooling-tower blowdown. Thus this calculation is not a complete purchased-water bill or cooling operating-cost estimate. A site investment model needs metered withdrawal, return flows, water treatment, wastewater charges and negotiated supply terms.

## Indonesian tariffs

[PAM JAYA's official schedule](https://pelanggan.pamjaya.co.id/pdf/tarif_air_minum.pdf) (WB001, PDF p2) preserves small, medium and large industrial/commercial categories and all three monthly volume blocks. The large industrial category is Rp12,550 for the first 10 m3, Rp17,500 for the next 10, and Rp21,500 for the remaining monthly volume. [The provider confirms January 2025 implementation](https://www.pamjaya.co.id/bacapage/terapkan-tarif-baru-pam-jaya-pastikan-tarif-berkeadilan-dan-peningkatan-pelayanan-itW5e) (WB002). Commercial agreements have no disclosed scalar rate.

The model's base Rp21,500/m3 is **S**, a Jakarta large-user marginal price proxy. It is not a national Indonesian industrial tariff, not proof of data center classification, and not a negotiated contract. At very large modeled withdrawals the first two monthly blocks are a small share, but a real bill should apply the blocks and applicable fees.

[Air Batam's official historical table](https://hilir.airbatam.com/index.php?dua=tabel-tarif&satu=berita&tiga=1000) (WB003) was posted February 2021 under BP Batam regulation 24/2020. The preserved schedule includes large industry Rp10,500/m3 and Batamindo industrial Rp13,000/m3 across five bands. The original table image is archived. Its effective date and applicability to a 2026 contract are unverified. The [newer tariff page](https://hilir.airbatam.com/tarif-pelanggan) (WB029) did not expose readable numeric rates in this retrieval.

Bekasi's [utility-hosted historical republication](https://tirtabhagasasi.co.id/empat-tahun-tidak-naik-pdam-tirta-bhagasasi-bekasi-segera-lakukan-penyesuaian-tarif-air-bersih/) (WB004) gives a historical industrial range without a complete band schedule. The scalar rate stays null. A current Karawang industrial schedule was not retrieved from [Tirta Tarum](https://www.tirtatarum.co.id) (WB005). These gaps prevent claiming that one tariff covers Jakarta, Cikarang, Karawang and Batam.

## Evidence and assumptions for PUE

Historical reported 2021 PUE for five Indonesian PDG facilities is 1.79-1.95 ([PDG 2021 report](https://princetondg.com/wp-content/uploads/2022/04/PDG-Sustainability-Report-2021.pdf), WB011, pp10-11; A). The report's explanatory sentence reverses the usual ratio, while the numerical table is consistent with conventional PUE. That source issue is retained. These old observations do not establish today's fleet average.

Newer Indonesian design disclosures are lower: EDGE2 design 1.24 at 100% load ([Digital Edge 2025](https://www.digitaledgedc.com/wp-content/uploads/2025/04/ESG_2025_Report_APR28.pdf), WB009, p11; S), CGK1 design 1.25 ([Digital Edge 2026](https://www.digitaledgedc.com/wp-content/uploads/2026/04/digital_edge_esg_report_2026.pdf), WB010, p16; S), and JC2 design ceiling 1.4 ([PDG announcement](https://princetondg.com/press-releases/epi-awarded-pdg-cibitung-dcs-tia-942-rated-3-design-certifications/), WB012; S).

The [undated Digital Edge country page](https://www.digitaledgedc.com/products-services/data-centers/indonesia/) (WB008) publishes EDGE1 annual PUE 1.7 and EDGE2 annual PUE 1.25. Their year and measurement/design status are unidentified; the dataset conservatively classifies them S as unverified specifications. The 1.25 country value and 1.24 historical design value remain separate records.

Low/base/high PUE 1.2/1.3/1.5 are **scenario judgments (S)** informed by these design disclosures, not measured national PUE. Low 1.2 is an efficient expansion case below the disclosed Indonesian examples. Base 1.3 is near those designs with allowance for operating differences. High 1.5 is an expansion stress case; it is **not an upper bound** for legacy facilities, as the PDG history demonstrates. PUE depends on loading, cooling, climate, redundancy and boundaries.

## Evidence and assumptions for consumptive WUE

[Google's technical paper](https://services.google.com/fh/files/misc/measuring_the_environmental_impact_of_delivering_ai_at_google_scale.pdf) (WB016, section3.3,p6; B) reports freshwater consumption 1.15 L/IT kWh in 2023 and 2024 for LLM-serving data centers. It subtracts returned water from input. It supplies a clearly consumptive external anchor, not an Indonesian observation.

[LBNL's US model](https://eta-publications.lbl.gov/sites/default/files/2024-12/us_data_center_energy_usage_report_lbnl-2001637_0.pdf) (WB017, pp44-48; B) gives approximate site consumptive WUE just above 0.36 for 2023 and future modeled 0.45-0.48. These are US model outputs.

Digital Edge's historical WUE ambition 1.0-1.5 ([2025 report](https://www.digitaledgedc.com/wp-content/uploads/2025/04/ESG_2025_Report_APR28.pdf), WB009,p18) lacks a clearly consumptive boundary. Its country webpage publishes annual 1.082 for EDGE1/2 without explicit unit, denominator or year. The published1.082 is retained in reported_wue_value; the standardized L/kWh column stays null because its unit is unverified. Do not call it observed Indonesian evaporation.

Low/base/high consumptive WUE 0/0.5/1.5 L/IT kWh are **S**, an explicit technology and water stress bracket:

- Low 0 represents no on-site evaporative cooling demand, with other water categories excluded.
- Base 0.5 rounds above LBNL's future modeled range to provide an illustrative central workload case.
- High 1.5 stresses water demand above the Google consumptive anchor and near the upper end of the historical Indonesian operator's water-use design ambition.

This calibration is judgment, not a statistical confidence interval or measurement of Indonesia today. PUE and WUE values paired in scenarios are independent analytical inputs; their combination does not certify an achievable engineered cooling design.

Other external WUE records demonstrate why definitions matter: [AWS](https://sustainability.aboutamazon.com/products-services/aws-cloud?energy=true) (WB014; B) explicitly reports **withdrawal** 0.12 L/IT kWh for 2025. [Microsoft](https://datacenters.microsoft.com/sustainability/efficiency/) (WB013; B) reports Asia Pacific FY25 water-use WUE 0.25 L/IT kWh, without explicitly separating withdrawal and consumption. Neither is used as observed Indonesian consumptive water.

For illustration, 1 GW IT at 80% utilization produces 7.008 TWh/year IT electricity. With PUE 1.3 and WUE 0.5, facility electricity is 9.1104 TWh/year and on-site cooling consumption is 3.504 million m3/year, or 9,600 m3/day using 365 days. Valued at Rp21,500/m3, the illustrative annual water amount is Rp75.336 billion. Every input is an assumption; these are reproducible scenario calculations.

## Climate evidence and cooling constraints

Monthly 2024 weather is preserved for BMKG Hang Nadim, Batam ([BPS Batam 2025](https://batamkota.bps.go.id/id/publication/2025/02/28/a5735c3be81a8a72f8a1e9f0/kota-batam-dalam-angka-2025.html), WB006, tables 1.2.1/1.2.2/1.2.5) and BMKG Kemayoran, Jakarta ([BPS DKI 2025](https://jakarta.bps.go.id/id/publication/2025/02/28/30874e042a98939928603ee5/provinsi-dki-jakarta-dalam-angka-2025.html), WB007, table 1.2.2). These are A station observations, not campus microclimates. Batam's rainfall table header says mm/year despite monthly rows; that ambiguity is documented without changing the reported numbers.

Cikarang, Karawang and Bintan remain explicit numeric-null gaps associated with the [BMKG portal](https://dataonline.bmkg.go.id/dataonline-home) (WB018). No wet-bulb temperature was invented. Monthly average temperature and humidity cannot produce reliable hourly design wet bulb or simultaneous peak cooling conditions. The model currently treats climate as contextual evidence, not a quantified PUE/WUE weather response.

Cooling technology describes two different stages: heat transport inside the server/building and final rejection to the environment. Direct-to-chip liquid cooling can still reject heat through wet towers; recirculating chilled water or closed loops do not alone establish zero evaporative consumption. Air-cooled heat rejection can avoid cooling evaporation while increasing electrical cooling demand. [Microsoft's engineering discussion](https://www.microsoft.com/en-us/microsoft-cloud/blog/2024/12/09/sustainable-by-design-next-generation-datacenters-consume-zero-water-for-cooling/) (WB015; B) supports this trade-off without supplying a numeric Indonesian PUE penalty.

For an Indonesian site, diligence should obtain utility connection and dry-season supply capacity, raw-water quality/treatment needs, permitted abstraction and discharge, cooling tower concentration/blowdown, redundancy, and competing demand. [Tirta Bhagasasi's July 2025 discussion](https://tirtabhagasasi.co.id/perda-spam-dan-dukungan-bupati-jadi-kunci-penguatan-perumda-tirta-bhagasasi/) (WB028) supports institutional and connection constraints. Its proposals must not be represented as enacted groundwater restrictions.

## Hardware ratings and analytical limits

All NVIDIA records are external benchmarks B, with GPU component, whole-server and rack quantities kept separate. The model does not infer average server power by adding GPU TDP. H100 SXM/H200 SXM up to 700 W and H200 NVL 600 W are product-specific component ratings (WB019/WB020). The [DGX H100/H200 guide](https://docs.nvidia.com/dgx/dgxh100-user-guide/introduction-to-dgxh100.html) (WB021) specifies 10.2 kW maximum whole-server power.

[The Blackwell technical brief](https://dam-cdn.nvd.orangelogic.com/AssetLink/gl2l4l4812s5fw0p614s6i8bv6mi3vx5.pdf) (WB023,Table 3,p26) distinguishes B200 1000 W and HGX B300 1100 W GPU TDP. [DGX B200](https://docs.nvidia.com/dgx/dgxb200-user-guide/introduction-to-dgxb200.html) (WB022) maximum system power is 14.3 kW. [DGX B300](https://docs.nvidia.com/dgx/dgxb300-user-guide/introduction-to-dgxb300.html) (WB024) lists 15 kW maximum separately from a 14.5 kW physical-specification power-consumption entry.

[NVIDIA's MGX discussion](https://developer.nvidia.com/blog/?p=100010) (WB025) identifies 120 kW GB200 NVL72 rack energy demand. [Its OCP design article](https://developer.nvidia.com/blog/nvidia-contributes-nvidia-gb200-nvl72-designs-to-open-compute-project/) (WB026) confirms 72 GPUs and direct liquid cooling. The 120 kW rack rating is neither a single GPU TDP nor a measured annual electricity total. [Blackwell Ultra specifications](https://dam-cdn.nvd.orangelogic.com/AssetLink/1k0p832eq8r5ca0u5383ie5o4tp3bst1.pdf) (WB027,p5) give 1400 W per GB300 NVL72 GPU, a distinct configuration from 1100 W HGX B300.

Electrical design ratings require workload/load factors, host/network overhead, redundancy, and rack configuration before becoming annual energy estimates. AI-ready power and cooling claims do not prove a particular GPU fleet or measured utilization. Existing average rack capacity cannot establish compatibility with a 120 kW liquid-cooled rack.

## Reproducibility and unresolved gaps

The JSON records preserve published numbers, source IDs, local scope, class and missing values; cleaning should never substitute zero for null. The evidence manifest supplies source locators and short paraphrases. No current national metered data center water total, reliable national consumptive WUE, all-site wet-bulb series or complete site water billing schedules was established in this audit. Consequently national water and cost totals built from these inputs remain estimates/scenarios, and investment conclusions require site diligence.
