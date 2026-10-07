# Research reasoning and review

## Integration with the five-role workflow — 8 October 2026

PR #71's latest task guidance is normally merged into the constitutional
Workspace. A researched draft without core reasoning or linked thesis evidence
routes to the Researcher and the Reasoning record, even if submitted early for
review. Complete evidence and reasoning enable the Editor's submission and the
Director's named six-check approval. Task guidance distinguishes legacy approvals
from reviews carrying the new attribution. Calculation validation remains a
manual responsibility, not an automatically completed task.

Validation: 85 Node tests and the site checker pass (37 scripts, 66 JSON files,
8 catalogue records, 13 sitemap pages and links in 14 pages). A synthetic browser
flow exercised incomplete-review rejection, linked thesis evidence, appended
reasoning, named approval, approved-text/JSON exports and material-edit
invalidation. Earlier reasoning retained its prior approval and source context.
After all 29 World events, exported reasoning, earlier versions and researched
prose matched the pre-run records exactly. No console errors or desktop overflow
were found. A viewport override did not apply in this browser session, so the
combined phone view was not reverified in this pass; the existing responsive CSS
and earlier #71/#72 phone checks are retained.

Relative to PR #72's prior head `a88ada4`, this integration changes 14 task files:
`README.md`, `TASKS.md`, `docs/research-constitution.md`,
`assets/css/research-workspace.css`, `assets/js/research-operations.js`,
`assets/js/research-tasks.js`, `assets/js/research-workspace.js`, `research.html`,
`tests/research-tasks.test.mjs`, `tests/research-workspace.test.mjs`,
`world/README.md`, `world/index.html`, `world/tests/controller.test.mjs` and
`world/world.js`. The task module and its test come from #71; the guide additionally
uses constitutional readiness and labels legacy review. HTML resolves script
order/cache versions; Workspace/CSS preserve both controls; tests cover the
combined handoffs. Documentation records the integration. `news/news.json` is
also inherited from the merged main history, without manual edits. Published
research, PDFs, roster, room artwork and movement are unchanged. Both PRs still
require review before any merge to main or public deployment.

The Research Workspace applies the first operating practices proposed for Longhand's constitution. It uses the existing local projects, source notebook, editorial states, backups and Library handoff. World continues to represent a simulated workflow.

## Connected research

Question → source observations → evidence relationships → interpretation and assumptions → qualified thesis → human review → publication preparation → later revision.

The **reasoning record** stores a thesis, analysis, assumptions, alternatives, uncertainty, time/scope and observable conditions for review. Evidence links refer to stable notebook source IDs with a passage/data locator, relationship and explanation. “Supports”, “qualifies” and “challenges” describe the analyst's assessment, not a software verification result.

Save incomplete reasoning whenever needed. Approval requires a researched draft, at least one manually checked source, a thesis, analysis, uncertainty, review conditions and at least one evidence link. Assumptions, alternatives and horizons should be explained when relevant. Do not invent them merely to populate a field.

“Append reasoning to draft” preserves existing prose and appends the open reasoning record, including recorded source links. It neither marks planning text as researched nor approves it. Reconcile the draft with the latest reasoning before approval.

## Principles in practice

| Practice | Intellectual basis | Workspace application |
| --- | --- | --- |
| Explain the argument | Booth and colleagues, *The Craft of Research* | Separate observations from interpretations; explain how evidence supports the conclusion. |
| Examine assumptions and alternatives | Heuer, *Psychology of Intelligence Analysis*; Pherson/Heuer, *Structured Analytic Techniques* | Record pivotal premises and plausible alternatives; identify evidence that distinguishes them. |
| Explain confidence and updating | Kahneman, *Thinking, Fast and Slow*; Galef, *The Scout Mindset* | Record uncertainty and revision conditions without an arbitrary confidence score. |
| Connect story and model | Damodaran, *Investment Valuation* and the supplied *Numbers and Narrative* slides; Graham/Dodd, *Security Analysis* | Explain drivers, definitions and calculation boundaries where relevant. |
| Make learning an institutional practice | Schein, *Organizational Culture and Leadership*; the available Senge excerpt | Give careful review and revision a visible place in the workflow. |
| Test the experience | Schell, *The Art of Game Design*; the available Alexander scan; Lynch, *The Image of the City* | Make responsibilities and evidence understandable; assess whether the workspace helps people do the work. |

These are Longhand adaptations from selected inspected passages, not claims that the books are unquestionable authorities or were read exhaustively. Source frameworks can illuminate different aspects, scales and horizons of the same inquiry. Record application boundaries rather than forcing agreement or manufacturing opposition.

## Manual review

Save the content, submit it for review, then record six checks:

1. Material claims have support or explicit uncertainty labels.
2. Sources, definitions, dates and independence were examined.
3. Reasoning and calculations follow from evidence and assumptions.
4. Alternatives and qualifying evidence were considered.
5. Confidence, limitations and applicable scope/horizon are explained.
6. Review conditions are observable and the draft matches the current reasoning.

Record a reviewer name and review note. The name is manual attribution, not an authenticated account. Checkboxes attest to a human review; they do not verify truth automatically. Completing them does not publish anything.

Changes to the brief, sources, draft or reasoning clear the current review and reset editorial status. Changes to the existing mock workflow also retain its prior approval-invalidation behavior. Linking a report or saving unchanged content does not invalidate review. A prior approval without the new checklist remains readable and is labelled as legacy approval.

## Earlier reasoning and recovery

Before a material edit to real research, the stored previous brief, sources, draft, reasoning and review attribution are captured together. Each retained position keeps its prior saved time. Historical evidence references use that version's captured notebook. Unchanged saves and mock progress alone do not fill this trail.

The trail retains up to five recent versions within 2 MB. It is a bounded working history, not an unlimited archive. Export a project backup to retain an older baseline. The existing 5 MB backup limit, atomic import, stale-tab protection and confirmed project deletion remain in place. Backups contain current reasoning, review attribution and retained earlier versions; PDFs are separate.

## Publication and future work

Approved-text downloads include the current saved draft, reasoning, evidence links, source notebook and manual review. Unsaved or stale content cannot be downloaded as approved text. PDF preparation, Library publication and live deployment remain separate steps.

Real agent execution, prediction resolution, outcome/lesson records, authenticated permissions and broader durable memory remain future additions. This integration introduces no server, database table, dependency or additional agent.
