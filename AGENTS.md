# Codex Instructions

These instructions apply to the entire repository.

## Required context

Before changing files, read:

1. `README.md` for the site architecture and publishing workflow.
2. `AI_COLLABORATION.md` for branch ownership and handoff rules.
3. `TASKS.md` for current ownership and status.

## Working rules

- Use a `codex/<short-task-name>` branch for Codex work.
- Preserve user changes and never include unrelated files in a commit.
- Keep changes small and compatible with a static GitHub Pages deployment.
- Reuse the existing HTML, CSS, and JavaScript patterns before adding new
  dependencies or tooling.
- Keep public URLs, filenames, and links case-correct.
- Treat report facts, financial figures, dates, and sources as accuracy-critical.
  Do not invent or silently change research claims.
- Follow the shared workflow in `AI_COLLABORATION.md` when handing work to
  Claude or requesting review.

## Validation

- Preview affected pages in a browser when layout or interaction changes.
- Run `node --check` on changed JavaScript files.
- Parse changed JSON files before committing them.
- Check `git diff` and `git status` so only task-related files are committed.
