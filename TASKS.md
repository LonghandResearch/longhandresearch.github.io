# Shared Task Board

GitHub issues and pull requests remain the detailed record. This file is the
quick handoff board for Codex, Claude, and the repository owner.

| ID | Task | Owner | Branch | Status | Pull request |
| --- | --- | --- | --- | --- | --- |
| RPT-002 | Audit and extend the English IHSG Update with charts, transparent calculations and an FX return lab | Codex | `codex/ihsg-weekly-update` | Done | [PR #22](https://github.com/LonghandResearch/longhandresearch.github.io/pull/22) |
| RPT-003 | Add restrained chart animation to the IHSG Update and publish | Codex | `codex/ihsg-chart-motion` | Done | [PR #23](https://github.com/LonghandResearch/longhandresearch.github.io/pull/23) |
| RPT-004 | Make the IHSG Update easier to read and audit all displayed data | Codex | `codex/ihsg-reading-audit` | Review | [PR #24](https://github.com/LonghandResearch/longhandresearch.github.io/pull/24) |
| RPT-005 | Incorporate primary IDX statistics and BI JISDOR into the IHSG Update | Codex | `codex/ihsg-primary-data` | Done | [PR #25](https://github.com/LonghandResearch/longhandresearch.github.io/pull/25) |
| WEB-001 | Redesign the front page: a photographic 3D Earth to turn by hand, scroll-linked motion and the catalogue in numbers | Claude | `claude/earth-landing` | Done | [PR #26](https://github.com/LonghandResearch/longhandresearch.github.io/pull/26) |
| WEB-002 | Make the front page a single-screen landing: opening screen, reading-size type, contour lines and a sheet-of-paper transition to the next page | Claude | `claude/landing-standalone` | Done | [PR #27](https://github.com/LonghandResearch/longhandresearch.github.io/pull/27) |
| WEB-003 | Review the merged landing (PR #27) on the live site across Safari, Firefox (no view transitions), iOS and Android touch; fix anything off | Codex | `codex/landing-review` | Review | [PR #29](https://github.com/LonghandResearch/longhandresearch.github.io/pull/29) |
| SETUP-001 | Add the Codex-Claude collaboration workflow | Codex | `codex/setup-agent-collaboration` | Done | Direct merge |

## Status values

- **Backlog**: ready to be claimed.
- **In progress**: owned by one agent on the named branch.
- **Review**: pushed and ready for review or merge.
- **Blocked**: needs a decision or external input.
- **Done**: merged into `main`.

## Adding a task

Use the next short ID, describe one clear outcome, assign exactly one owner, and
name its branch before work begins. Add the pull request link when it is opened.
