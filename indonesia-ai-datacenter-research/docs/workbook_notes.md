# Workbook use and verification

The analyst workbook is `outputs/indonesia_ai_datacenter_model.xlsx`. It contains 15 worksheets covering the source datasets, assumptions, scenarios, sensitivity, outlook and national comparisons. The Executive Summary links to the model sheets. Source observations retain their dates, geography, units and A/E/B/S classifications.

## Changing assumptions

Use the blue input cells on the Assumptions worksheet. They control electrical load, PUE, consumptive WUE, tariffs, capacity cases, outlook assumptions, power factor and the comparison year. Linked formulas are green and local calculations are black. Changing an assumption updates the linked calculation without rewriting reported source observations.

Blank inputs are treated as missing. They do not silently become zero. Zero WUE is an allowed cooling consumption scenario, so it produces zero modeled cooling consumption and zero associated water cost proxy. Other water uses and actual utility withdrawals can still be positive.

The comparison year selects the matching reported national consumption and PLN sales observations. An unreported year or a blank source value produces `Missing input`. It does not keep a previous year's denominator. Changing power factor updates derived connection MW while preserving reported MVA and any separately reported real MW.

The workbook requests automatic full recalculation when opened. After editing inputs in Microsoft Excel, ensure calculation is automatic or choose Calculate Now. Excel edits do not change `assumptions.yaml`. To reproduce those changes in Python charts, notebooks and the research summary, enter the same assumptions in YAML and rerun the pipeline.

## Verification completed

The workbook retains Excel formulas. Python independently calculates initial results and inserts their Open XML cached values so saved outputs can be inspected without a spreadsheet calculation engine. Reopening those cached values was checked. All 18 capacity cases reconcile with the corresponding processed Python results.

An additional check imported a disposable copy into the bundled Artifact Tool calculation engine. All 24 recorded checks passed. These covered the base 1 GW energy, electricity cost, water consumption and water cost, the disclosed inventory subtotal, denominator selection, missing inputs, editable PUE, zero WUE, power factor and the 2032 capacity response. Inputs were restored after the checks. The original workbook was not overwritten by that engine. Its formula error scan found no matches.

The preview record identifies the worksheet ranges rendered for visual review. Those are layout checks of selected ranges, not proof that every source row was reviewed visually. The definitive record is `outputs/workbook_validation.json`.

**Native Microsoft Excel recalculation was not performed.** The initial cache check and independent Artifact Tool calculations do not constitute a test in Microsoft Excel. This limitation remains recorded in the validation file.

## Interpreting results

Electricity cost represents the energy component at the selected rate. It excludes contract premiums, minimum bills, taxes, reactive charges and backup fuel. Water cost values modeled consumption at a local tariff. It is not a complete purchased-water bill, which needs metered withdrawal, returns, treatment, fees and contract terms.

The 322 MW Greater Jakarta baseline, the 283.6 MW disclosed operator subtotal and the future capacity cases answer different questions. Neither capacity total establishes current national metered electricity or water consumption. The national percentage compares annual energy with a documented annual denominator. It does not establish available power or water at a particular site.
