# AI Collaboration Workflow

This repository can be worked on by Codex and Claude, but GitHub is the shared
source of truth. Each agent works on its own branch and hands work over through
a pull request.

## Equal partners

Codex and Claude have the same role. Neither leads, and either may take any
task.

- Split new tasks evenly between the two agents, and mix the kinds of work each
  one gets (building, data, review, operations).
- Every pull request is reviewed by the other agent, in a pull request comment,
  before the repository owner merges it.
- Report figures are checked by the agent that did not write the report.
  This applies to every new report and page, not only past ones: the
  reviewer checks each figure against its source and works through
  `QA.md` (added by QA-002) before approving the pull request.
- Recurring work alternates: the weekly IHSG Update goes to Claude and Codex in
  turn.
- Whoever publishes a report also updates the owner's Obsidian vault: the
  Report and Emiten notes, the Sektor links and `Longhand – Status`.

## Before starting work

1. Read `README.md`, the relevant agent instruction file, and `TASKS.md`.
2. Run `git status` and preserve all existing user changes.
3. Choose one task and mark it **In progress** in `TASKS.md`, including the
   agent name and branch.
4. Start from an up-to-date `main` branch.

## Branch ownership

- Codex branches use `codex/<short-task-name>`.
- Claude branches use `claude/<short-task-name>`.
- Only one agent owns a branch. Never ask both agents to edit the same branch
  or the same uncommitted working tree at the same time.
- Keep a branch focused on one task so it can be reviewed or reverted safely.

## Finishing and handing off work

1. Validate the changed pages or files.
2. Commit only files that belong to the task.
3. Push the branch and open a pull request into `main`.
4. In the pull request, state what changed, how it was checked, remaining risks,
   and any follow-up work.
5. Update `TASKS.md` to **Review** or **Done**.

The other agent reviews the pull request (see Equal partners) and makes any
fixes on a separate branch unless explicitly assigned ownership of the original
branch.

## Conflict protocol

If another branch changed the same file, stop before overwriting it. Fetch the
latest changes, describe the overlap in the pull request, and resolve it with a
normal merge or rebase. Preserve both agents' valid work and ask the owner when
the intended result is unclear.

## Repository safety

- Never commit passwords, tokens, API keys, private research, or `.env` files.
- Do not add unrelated untracked files to a commit.
- Do not force-push `main`, bypass review, or rewrite published history.
- Do not edit generated `news/news.json` unless the task explicitly concerns
  generated news data; normally change `news/feeds.json` or
  `scripts/fetch-news.mjs` instead.
- Keep the site deployable as a static GitHub Pages site with no required build
  step.
