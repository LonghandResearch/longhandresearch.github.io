# Shared Task Board

GitHub issues and pull requests remain the detailed record. This file is the
quick handoff board for Codex, Claude, and the repository owner.

| ID | Task | Owner | Branch | Status | Pull request |
| --- | --- | --- | --- | --- | --- |
| RPT-002 | Audit and extend the English IHSG Update with charts, transparent calculations and an FX return lab | Codex | `codex/ihsg-weekly-update` | Done | [PR #22](https://github.com/LonghandResearch/longhandresearch.github.io/pull/22) |
| RPT-003 | Add restrained chart animation to the IHSG Update and publish | Codex | `codex/ihsg-chart-motion` | Done | [PR #23](https://github.com/LonghandResearch/longhandresearch.github.io/pull/23) |
| RPT-004 | Make the IHSG Update easier to read and audit all displayed data | Codex | `codex/ihsg-reading-audit` | Done | [PR #24](https://github.com/LonghandResearch/longhandresearch.github.io/pull/24) |
| RPT-005 | Incorporate primary IDX statistics and BI JISDOR into the IHSG Update | Codex | `codex/ihsg-primary-data` | Done | [PR #25](https://github.com/LonghandResearch/longhandresearch.github.io/pull/25) |
| WEB-001 | Redesign the front page: a photographic 3D Earth to turn by hand, scroll-linked motion and the catalogue in numbers | Claude | `claude/earth-landing` | Done | [PR #26](https://github.com/LonghandResearch/longhandresearch.github.io/pull/26) |
| WEB-002 | Make the front page a single-screen landing: opening screen, reading-size type, contour lines and a sheet-of-paper transition to the next page | Claude | `claude/landing-standalone` | Done | [PR #27](https://github.com/LonghandResearch/longhandresearch.github.io/pull/27) |
| WEB-003 | Review the merged landing (PR #27) on the live site across Safari, Firefox (no view transitions), iOS and Android touch; fix anything off | Codex | `codex/landing-review` | Done | [PR #29](https://github.com/LonghandResearch/longhandresearch.github.io/pull/29) |
| WEB-004 | Refine landing navigation motion and simplify the Earth presentation | Codex | `codex/landing-motion` | Done | [PR #30](https://github.com/LonghandResearch/longhandresearch.github.io/pull/30) |
| SETUP-001 | Add the Codex-Claude collaboration workflow | Codex | `codex/setup-agent-collaboration` | Done | Direct merge |
| OPS-001 | Make auto publish send report changes to `main` whichever branch the site folder is on | Claude | `claude/auto-publish-main` | Done | [PR #31](https://github.com/LonghandResearch/longhandresearch.github.io/pull/31) |
| RPT-006 | Add DSSA to The Power Behind AI: FY2021-FY2025 financials, prices, valuation history | Claude | `claude/pbai-data-refresh` | Done | [PR #32](https://github.com/LonghandResearch/longhandresearch.github.io/pull/32) |
| RPT-007 | Update the Power Behind AI library summary to ten companies | Claude | `claude/pbai-catalogue-ten` | Done | [PR #33](https://github.com/LonghandResearch/longhandresearch.github.io/pull/33) |
| RPT-008 | Put source context inline and remove the weekly CSV download | Codex | `codex/ihsg-inline-sources` | Done | [PR #34](https://github.com/LonghandResearch/longhandresearch.github.io/pull/34) |
| RPT-009 | Publish the INET initiation (SELL, target Rp175) | Claude | `claude/inet-initiation` | Done | [PR #35](https://github.com/LonghandResearch/longhandresearch.github.io/pull/35) |
| WEB-005 | Add a Coverage page: every rated company, its current call and its call history | Claude | `claude/coverage-page` | Done | [PR #37](https://github.com/LonghandResearch/longhandresearch.github.io/pull/37) |
| WEB-006 | Add an RSS feed of published reports, kept in step with `reports/reports.js` | Codex | `codex/reports-feed` | Done | [PR #38](https://github.com/LonghandResearch/longhandresearch.github.io/pull/38) |
| WEB-007 | Keep Coverage calls together when exchange is missing or case-varied | Codex | `codex/coverage-grouping` | Done | [PR #39](https://github.com/LonghandResearch/longhandresearch.github.io/pull/39) |

## Next tasks, split evenly

Four for each agent. Figures are always checked by the agent that did not
write the report, and the weekly IHSG Update alternates owner each week.

| ID | Task | Owner | Branch | Status | Pull request |
| --- | --- | --- | --- | --- | --- |
| QA-001 | Audit every figure the site shows against the report or source it comes from, and fix errors. One pull request per stage, each Done when merged: (1) catalogue entries, Library, report pages and key data; (2) Coverage and the RSS feed; (3) The Power Behind AI; (4) the front page numbers. Pages Codex wrote go to QA-002 instead | Codex | `codex/site-audit-power-behind-ai` | Done (all four stages merged) | [PR #44](https://github.com/LonghandResearch/longhandresearch.github.io/pull/44), [PR #46](https://github.com/LonghandResearch/longhandresearch.github.io/pull/46), [PR #47](https://github.com/LonghandResearch/longhandresearch.github.io/pull/47), [PR #48](https://github.com/LonghandResearch/longhandresearch.github.io/pull/48) |
| QA-002 | Audit the pages Codex wrote (the IHSG Update) against IDX and BI sources and fix errors, then extend `QA.md` with anything the audits show is missing | Claude | `claude/site-audit-checklist` | Done || [PR #50](https://github.com/LonghandResearch/longhandresearch.github.io/pull/50) |
| OPS-002 | Add a GitHub check on every pull request: `node --check` on all scripts, parse all JSON, load `reports/reports.js`, and confirm `sitemap.xml` and internal links match the catalogue | Claude | `claude/pr-checks` | Done | [PR #41](https://github.com/LonghandResearch/longhandresearch.github.io/pull/41) |
| OPS-003 | Run auto publish from a fixed copy outside the working folder, so its version no longer depends on the branch checked out at login. Also look at telling a real publish apart from agent edits (27 Sep: edits made on a Codex branch in the site folder reached `main` unreviewed, see PR #44) | Codex | `codex/auto-publish-stable` | Done | [PR #45](https://github.com/LonghandResearch/longhandresearch.github.io/pull/45) |
| WEB-009 | Make the IHSG Update a reusable weekly template: one data file per week, so a new edition needs no new page code | Codex | `codex/ihsg-weekly-template` | Done | [PR #43](https://github.com/LonghandResearch/longhandresearch.github.io/pull/43) |
| RPT-010 | Publish the IHSG Update for 28 September to 2 October 2026 after the 2 October close: on the WEB-009 template if it is merged by then, otherwise on the current page pattern, moved to the template later | Claude | `claude/ihsg-weekly-2026-10-02` | Backlog | |
| WEB-008 | Audit accessibility and loading speed (keyboard, contrast, screen readers, image sizes) and fix what is found. One pull request per stage, each Done when merged: (1) shared layout and the front page; (2) Library, Coverage and report pages; (3) The Power Behind AI, the IHSG Update and The Wire. Hold if a site redesign is in progress | Codex | `codex/a11y-speed` | In progress (stage 1: 319 px author-mode Add report overflow logged) | |
| WEB-011 | Make the front page clearer and more editorial, with the latest report visible without an opening screen | Codex | `codex/home-editorial` | Review | [PR #53](https://github.com/LonghandResearch/longhandresearch.github.io/pull/53) |
| WEB-012 | Remove the unused front-page loader, night-ledger and odometer rules from `assets/css/site.css` after WEB-011 merges; keep the report ledger and PDF loading styles | Codex | `codex/home-css-cleanup` | Backlog | |
| OBS-001 | Fill `Sumber/` in the Obsidian vault: one note per primary source (IDX statistics, BI JISDOR, annual reports), linked from each Report and Emiten note | Claude | Vault, no branch | Done | |
| OWN-001 | Write the author bio and contact details for the About page | Owner | | Blocked | |
| OWN-002 | Create the GoatCounter account so the counter already in the pages starts counting | Owner | | Blocked | |

## Status values

- **Backlog**: ready to be claimed.
- **In progress**: owned by one agent on the named branch.
- **Review**: pushed and ready for review or merge.
- **Blocked**: needs a decision or external input.
- **Done**: merged into `main`.

## Adding a task

Use the next short ID, describe one clear outcome, assign exactly one owner, and
name its branch before work begins. Add the pull request link when it is opened.
