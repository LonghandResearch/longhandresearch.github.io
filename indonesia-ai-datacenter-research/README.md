# Indonesia AI and data-center resource research

A reproducible Python research repository for electricity, direct water consumption, resource costs and infrastructure diligence in **Indonesia**. Research cutoff: **4 October 2026**. This project is separate from the parent static website; running it does not publish or change the report catalogue.

The analytical question is how much demand today's documented capacity could produce, how demand could expand by 2030–2032, and what an additional **1 GW of IT capacity** would require. Metered national data-center electricity and water totals are unavailable in the reviewed evidence. The repository distinguishes that gap from dated market estimates, a partial facility inventory and conditional resource scenarios.

## Reproduce the project

Requires Python 3.12 (tested); Python 3.11+ should work. No API keys, paid data services or live internet are required to rerun the committed evidence. Use a virtual environment:

```bash
python -m venv .venv
# Windows PowerShell: .\.venv\Scripts\Activate.ps1
# Linux/macOS: source .venv/bin/activate
python -m pip install -r requirements.txt
python src/pipeline.py
python -m unittest discover -s tests -v
```

The pipeline collects the curated source registry, cleans data, validates inputs, calculates models, checks conversions, generates 13 PNG/SVG charts, exports Excel, writes the research summary and exports the interactive page inputs. It also records input and output hashes. Calculations are deterministic. Chart rendering and XLSX ZIP timestamps may vary across operating systems. `requirements-lock.txt` records the complete tested environment. Install it for a matching transitive dependency set.

Individual steps:

```bash
python src/collect_data.py
python src/clean_data.py
python src/validate_data.py
python src/scenario_model.py
python src/sensitivity.py
python src/national_impact.py
python src/charts.py
python src/export_excel.py
python src/research_summary.py
python src/export_interactive.py
```

Run `python src/pipeline.py --skip-excel` for a tables/charts-only run. From any working directory, use absolute script paths. Notebooks discover the project root and must be run with a kernel containing the requirements. To execute and save all four notebooks with the current Python interpreter:

```bash
python src/build_notebooks.py --execute
```

## Repository and data flow

```text
assumptions.yaml             Editable parameters, sources and scenario rationale
sources.csv                  Generated source registry with quality tiers
data/raw/observations/       Immutable curated numerical source observations
data/raw/evidence/           Source locators, paraphrases and selected source images
data/interim/                Input hashes, validation and collection logs
data/processed/              Standardized source datasets and calculated datasets
src/                        Collection, validation, models, charts and Excel exporter
notebooks/                  Data, electricity, water and scenario analysis notebooks
outputs/charts/              13 charts, each in PNG and SVG
outputs/tables/              Reproducible calculation tables
outputs/indonesia_ai_datacenter_model.xlsx
outputs/summary.md           Conclusions generated only after calculations
outputs/run_manifest.json   Tested versions and source/output hashes
interactive/index.html      Interactive resource calculator, flow diagram and project map
interactive/data.json       Browser model inputs generated from processed data and YAML
docs/                       Methodology, dictionary, limits and source research notes
tests/                      Independent physical/unit/validation checks
```

Raw JSON stores source facts and definitions rather than scraper-dependent final tables. `collect_data.py` reads those committed observations in offline mode and creates `sources.csv`. Optional `python src/collect_data.py --fetch` archives live URLs in content-addressed `data/raw/downloads/`. Timestamped collection logs record access failures. Live scraping **does not alter curated facts**. Download archives and full source PDFs are ignored by Git to avoid republishing complete publications. Numerical evidence, locators and selected tariff images are committed. Locally retained full PDFs are optional working copies and are excluded from the distributed evidence manifest.

## Source hierarchy and classification

Tier 1: PLN, ESDM/Gatrik, BMKG/BPS, water utilities, government agencies and operator disclosures. Tier 2: recognized research organizations and data-center market specialists. Tier 3: reputable media when a primary source cannot be obtained. Foreign benchmarks are permitted only for missing technical parameters; Indonesian market forecasts remain Indonesia-specific.

Every processed table has `data_class`: **A** reported observation (including a reported project announcement), **E** estimate derived from source facts, **B** external benchmark, **S** scenario. Additional column-level classification fields resolve mixed rows. A reported plan is an actual *announcement*, not an operational asset. An operator design PUE is a scenario/design parameter, not a measured actual. The model does not turn global withdrawal WUE into Indonesian consumption.

## Model and scenario controls

Edit `assumptions.yaml` to change utilization, PUE, consumptive WUE, tariffs, power factor, capacity cases, outlooks and national denominators. Parameter rationale and source IDs accompany the settings. Re-run the pipeline to update all tables, charts, Excel and conclusions. The default tariff applications are explicit contract/location assumptions, not a claim that every Indonesian operator pays them.

Expansion low/base/high scenarios apply to 10, 50, 100, 500, 1,000 and 2,000 IT MW. Separate current-fleet scenarios recognize legacy PUE. Forecast scenarios distinguish capacity and energy anchors, source date, IT versus facility load, and analyst deviations. The future national denominator is a separately labeled scenario; the model also shows demand relative to the latest actual national consumption. The 1 GW answer is in `outputs/tables/additional_1gw.csv` and the Excel executive view.

IT MWh = IT MW × average load factor × annual hours. Facility MWh = IT MWh × PUE. Electricity charge = facility MWh × 1,000 × Rp/kWh. Modeled on-site consumptive water m3 = IT MWh × WUE L/IT kWh. Water cost = m3 × Rp/m3. Grid connection MW = MVA × configured power factor and is **never** added to IT MW. Full formulas and boundaries are in `docs/methodology.md`.

The Excel workbook contains all 15 requested worksheets, editable case assumptions, formula-based calculation rows, source IDs, filters, frozen headings and units. Python-generated initial formula values are caches; Excel is configured to recalculate on opening. A cache does not establish native Excel behavior. Workbook checks and any engine limitations are documented in `outputs/workbook_validation.json`.

## Interactive visual research

Open `interactive/index.html` in a browser. It works from local files or any static host and has no build step. The calculator changes IT capacity, electrical loading, PUE, consumptive WUE and prices. Annual and monthly costs share the same calculation. The resource diagram follows those inputs. Project filters preserve undisclosed IT capacity and keep connection MVA separate. The outlook view uses the fixed research assumptions and is labeled separately from the calculator.

The original isometric illustration is authored in `interactive/flow-design.svg` and embedded by the data exporter. It fits the screen by default and has an optional enlarged view. The project atlas uses selectable regional callouts, keyboard controls and regional focus. Record counts describe evidence coverage rather than national facility totals. Greater Jakarta and West Java form one navigation group, including Bandung. The group does not replace the narrower Greater Jakarta market baseline.

The outlook chart uses a grid and visible data points for the three fixed research cases. Select a year on the chart or in the adjacent panel to compare electricity, cost and cooling consumption. Chart year controls also accept Enter, Space and left/right arrows. Selecting a case in the legend emphasizes its line and panel. Commentary sits inside the section it explains, with one-column reading on small screens. Invalid calculator inputs clear all dependent readings, including the resource diagram. Small electricity volumes use GWh, MWh or kWh rather than rounding to zero TWh.

Browser inputs are exported from the Python datasets and `assumptions.yaml`. They contain no live requests. Natural Earth supplies the public-domain Indonesia outline. Approximate region markers are navigation aids, not facility coordinates. `node tests/test_interactive.cjs` checks the JavaScript calculations against all 18 Python capacity scenarios, including zero values and invalid inputs.

The institutional newsletter narration is edited in `docs/newsletter_copy.md`. Numerical placeholders resolve against the Python model exports so the discussion cannot silently retain outdated base-case costs. It discusses the research base case, while the calculator supplies a separate sensitivity. Seven essential reader-facing sources support the main observations and technical assumptions. The full registry and facility source links preserve the remaining evidence. Access checks are in `docs/key_source_access.md`.

Manifest hashes normalize Windows text line endings to LF so a Git clone has the same text-content hashes. Binary evidence is hashed without conversion. SVG chart IDs use a fixed seed and omit export timestamps. Font rendering can still vary across environments.

## Update and extend

1. Add a **new dated** observation JSON/evidence file; never overwrite a historical raw source record. Preserve conflicting announcements and explain changes in `docs/*_research.md`.
2. Assign a unique source ID and project ID; record source/publication/access dates, definition, status, units and quality tier. Include undisclosed facilities with null capacity rather than inventing estimates.
3. For projects, identify IT MW, facility MW, connection MVA and campus/phase overlap. Set `include_in_inventory` deliberately. Do not mark a scheduled project operational without commissioning evidence.
4. Add or revise national yearly data only after validating coverage, consumption versus generation and PLN group boundary. Source references can be provided per metric.
5. Change the explicit current/outlook assumptions and their rationale if new sources justify them; do not let a scraper silently replace analytical judgments.
6. Run the pipeline, inspect `outputs/validation.log`, compare the tables, review the Excel formulas and charts, and record source conflicts before committing.

## Important limitations

The facility inventory is incomplete. Announced campuses are not current usable power. Current national IT capacity and metered electricity/water demand cannot be inferred reliably from inconsistent market/official MW headlines. Utilization is not occupancy. Private power and water contracts, peak-load profiles, local grid headroom, permits, dry-season supply and facility cooling designs are largely undisclosed. Direct cooling water excludes indirect electricity-generation water and domestic/non-cooling consumption. Climate observations contextualize conditions rather than calibrate a cooling engineering model. See `docs/limitations.md` before applying the outputs to a specific site or investment.
