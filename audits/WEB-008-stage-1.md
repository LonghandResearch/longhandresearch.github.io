# WEB-008, stage 1: shared layout and front page

## Logged finding — 27 September 2026

At a **319 CSS px** viewport, the **Add report** control overflows horizontally in author mode. This was found during the QA-001 stage-4 front-page review (PR #47).

- **Scope:** local author mode only; readers of the published site do not see the control.
- **Affected area:** the shared masthead/layout, so it belongs to WEB-008 stage 1 rather than the front-page figure audit.
- **Status:** logged for the stage-1 accessibility and responsive-layout pass. The audit has not yet selected a layout fix.

The eventual stage-1 fix should keep the masthead usable without horizontal scrolling at 319 CSS px, while preserving the control's visible label and keyboard access.
