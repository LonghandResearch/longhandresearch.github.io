# Longhand World V0.1

A self-contained, simulated high-rise research headquarters. This page creates no research,
calls no AI service and publishes nothing. All tasks and agent activity are mock
data. Existing research stays in the parent site's library.

## Open it

Open `world/index.html` from the repository root, including directly from disk.
On GitHub Pages the relative URL is `world/` or `world/index.html`. Both have a real
index document and support direct navigation and refresh without server routing.
The page uses relative local asset paths and `../` links to the existing site, so
it also works beneath a static host's project subpath. There are no root-absolute
asset paths, requests, imports, build steps or new dependencies.

For HTTP preview, serve the **repository root**, for example:

```powershell
python -m http.server 18765 --bind 127.0.0.1
```

Then visit `http://127.0.0.1:18765/world/index.html`. The existing Wire and weekly
pages need HTTP to fetch their data. World itself uses classic deferred scripts
and local SVG, so it also supports `file://`.

## Files and boundaries

| File | Responsibility |
| --- | --- |
| `index.html` | Accessible page structure and links back to Longhand Research |
| `world.css` | World-only editorial styling, small-screen layout and pixel characters |
| `assets/institution.svg` | Original 960 × 620 pixel-art floor plan and furnishings |
| `assets/city-outlook.svg` | Original 960 × 240 panoramic high-rise glazing and city view |
| `state.js` | DOM-free agent model, validated event reducer and bounded journal |
| `movement.js` | DOM-free waypoint behavior, independent of event production |
| `mock-events.js` | Deterministic, repeating prototype event source |
| `sprites.js` | Eleven original professional pixel sprites; visual configuration keyed by agent ID |
| `world.js` | Rendering, selection, simulation clock and adapter surface |
| `tests/state.test.mjs` | Independent state, event and movement invariant tests |
| `tests/controller.test.mjs` | Timer, animation, pause, restart and reduced-motion regression tests |

The six rooms are Main Hall, Library, Research Office, Data Lab, Editor Office and
Director Office. Eleven staff have distinct professional sprites, roles and initial
tasks: the Research Director / Founder & Research Lead; Researcher I, Researcher II and Female
Researcher; Data Analyst I, Data Analyst II and Female Data Analyst; Editor I,
Editor II and Female Editor; and a female Research Associate.
Every character and staff
list entry is a native button. Selecting either updates the same staff dossier:
name, role, status, last confirmed location, destination when moving, current
task, progress and timestamped last activity.

The environment is original architectural SVG pixel art of a modern skyscraper
floor: a substantial panoramic city outlook, cool glazing, glass partitions,
warm stone and wood, varied workstations and a furnished executive office.
The outlook remains at least 170 CSS pixels high on small screens. The floor's
decorative ceiling strip is cropped together with its entire character wrapper;
the 960 × 620 coordinates, six-room geometry, corridor and door gaps are retained.
Room identity comes from work cues inside the existing furniture footprints:

| Room | Work cues |
| --- | --- |
| Library | Indexed reference cards, a digital source terminal and research shelves |
| Research Office | Source notes, working papers and an evidence board |
| Data Lab | Trend/comparison charts, a matrix dashboard and a scatter display |
| Editor Office | Two-column publication layouts, a review screen and marked proofs |
| Director Office | Research briefings, strategy notes and a decision folio |
| Main Hall | Shared briefing cards, reference material and collaboration notes |

Appearance lives separately from state in `Visual.DESIGNS`; each design specifies
hair, clothing, skin tone and a work accessory. The Director has an average male
silhouette, natural medium brown skin, glasses, black center-parted hair, a charcoal
smart-casual jacket and a research folio. These follow the founder's supplied
appearance description; no photo is embedded. To refine that identity, edit
`DESIGNS.director` and its drawing details in `createSprite`. All staff use the same
48 × 80 sprite canvas, map size, shading and walking animation. All eleven
appearance configurations and the Director's complete sprite are preserved in
the identity polish. Research staff carry source books, citation notes and a
source-reading laptop; analysts use dashboards, charts and styluses; editors
carry article proofs and review marks; the Associate has a laptop and shared notes.

The model holds `id`, `name`, `role`, `location`, `status`, `currentTask`, `progress`
and `lastActivity`, plus a description, `destination` and readable activity text.
Locations are room IDs; their display names live in `State.ROOMS`. Statuses are
`IDLE`, `WORKING`, `THINKING`, `DIRECTING`, `READING`, `MEETING`, `REVIEWING`, `COMPLETED` and
`ERROR`. Walking is visual behavior rather than an additional task status.
`DIRECTING` uses the existing stationary meeting behavior. The Director stays
first in the staff list and starts in Director Office. The mock workflow takes
him through Main Hall, Research Office and Data Lab before returning for review.
Department visits and an idle return use the existing status/location contract.

## Event contract

Real AI Agent → Agent Event → World State → Character Behavior

All producers dispatch the same plain object through `LonghandWorld.dispatch`:

```js
LonghandWorld.dispatch({
  type: 'agent.started_task',
  agentId: 'researcher',
  task: 'Review the requested evidence',
  location: 'research',
  progress: 0
});
```

Supported events:

| Event | Required payload | Effect |
| --- | --- | --- |
| `agent.started_task` | `agentId`, `task` | New task, default WORKING status and 0% progress |
| `agent.changed_status` | `agentId`, `status` | Change to a known task status |
| `agent.moved` | `agentId`, `location` | Request travel to a room |
| `agent.completed_task` | `agentId` | COMPLETED and 100% progress |
| `agent.error` | `agentId` | ERROR and a readable error activity |
| `agent.progress` | `agentId`, `progress` | Update validated progress in 0–100 |
| `agent.arrived` | `agentId`, `location` | Behavior-generated acknowledgment of the current destination |

Optional `location` on a task, status, completion or error event requests movement.
Optional `activity` supplies a short readable journal entry. A started task can
also supply `status` and `progress`. Unknown event types, agent IDs, rooms,
statuses, invalid progress and empty/oversized task or activity strings are
rejected with `false` and no state mutation. Dispatch returns `true` when accepted.
An arrival for an obsolete destination is rejected. Journal history is bounded to
12 events, with the latest four shown; snapshots are independent copies.

The default mock source runs its first event after four seconds, then one every
11 seconds. It demonstrates task starts, reading, thinking, meetings, walking,
working, review, progress, completion, idle and a recoverable mock error. The
sequence repeats without publishing a final report. Pause stops both events and
travel; Next event advances once, with an immediate arrival in manual mode.
Restart restores the agents and sequence, preserving selection and pause choice.
Hidden pages suspend timers and animation. Reduced motion starts in manual mode
and always uses immediate arrival rather than animated travel.

The identity polish refines the existing mock script into 43 events, adjusting
task text, destinations and ordering with brief handoffs and home-department work for all eleven
professionals. Researchers move between source reading and drafting; analysts
bring checks to Research and return to Data; editors review with researchers
and return to Editorial; the Director discusses strategy and reviews at home;
the Associate organizes references before the Main Hall handoff. The source,
reducer, waypoint algorithm, stations, controller and timer behavior are unchanged.
Visit ordering preserves separate selectable staff positions at the minimum map
width. No backend is connected and no report is published.

Movement uses clear room exits and one corridor, with a few waypoints. It supports
replacement destinations during a walk and emits arrivals only after reaching
the target. Small per-agent station offsets keep visiting colleagues separate.
This is a compact prototype, not a collision engine or general pathfinder.
Work accessories are part of each professional silhouette; walking has a quiet
two-frame step. Statuses remain readable in the operations panel and staff list,
without game-style rings or overhead status indicators.
Only active travel requests animation frames. State changes trigger DOM updates.

To connect a future service, replace the mock producer in `world.js` with an
event adapter calling the same dispatcher and remove the mock timer. Authentication,
transport, ordering/replay and authorization belong in that future adapter, not
in the renderer. `LonghandWorld.getSnapshot()` provides read-only-by-copy inspection.
V0.1 does not implement a request submission flow, storage or real agent execution.

## Isolation and validation

World loads no parent site JavaScript, stylesheet, catalogue, analytics or CDN.
Its typography follows the parent's serif/sans editorial language using system
fallbacks, with charcoal, muted navy, steel and a restrained amber accent. Parent HTML navigation is
unchanged because it is repeated across pages; World is independently accessible.
The initial World addition changes only the `TASKS.md` ownership/review row outside
`world/`. This identity polish changes World files only.

Run from the repository root:

```powershell
node --test world/tests/*.test.mjs
node scripts/check-site.mjs
```

The shared checker validates tracked JavaScript/JSON and exact-case HTML paths.
New World files must be staged or committed before it can include them. The World
test has no packages and uses Node's built-in test/assert/VM APIs. No World JSON
files are introduced. Browser QA additionally covers direct URLs/refresh, map and
staff selection, controls, movement, journal/status updates, keyboard use,
small-screen overflow and links back to existing pages.

Remaining limits: simulated tasks only, session state resets on reload, simple
waypoints, no real AI backend and no persistence. Deployment follows the existing
PR review and GitHub Pages process; this addition does not alter that workflow.

### V0.1 verification record

Checked on 5 October 2026:

- All 22 state, event, movement and controller tests pass, including all 396
  agent/room-pair doorway routes, interrupted travel, simultaneous arrivals,
  one animation loop, pause/restart, hidden-page suspension and reduced motion.
  Both complete mock cycles keep every colleague's sprite center outside other
  staff hitboxes at the floor plan's minimum 700 pixel width.
- The shared site checker passes script parsing, all existing JSON, catalogue,
  sitemap and exact-case links, including the new nested World page.
- Browser preview confirms six rooms, all 22 map/staff-list selections, matching
  dossiers, Enter/Space selection, the complete 43-event mock cycle including ERROR and
  COMPLETED, animated travel and arrival, manual Next event and pause/restart.
- Direct HTTP `world/` and `world/index.html` load; refresh works. Artwork loads
  locally, and World links resolve to the existing research pages. No World
  console errors were observed.
- At 1280, 1024, 768, 390 and 320 pixel viewport widths, the page, staff list,
  controls and dossier fit the screen. Narrow layouts scroll only the floor plan;
  all eleven map selections work at 320 pixels. Map sprites remain 36 × 60 pixels.
- Existing homepage/globe/latest report, Library search, Coverage, Wire headlines,
  About, INET's 24-page PDF reader, The Power Behind AI, both IHSG layouts and the
  Indonesia resource research page load without observed console errors. The
  existing interactive model's 18 scenario/zero/invalid-input checks also pass.
- The preview browser allows HTTP/HTTPS only, so direct `file://` behavior was
  inspected in code but could not be browser-tested. No live deployment or
  cross-browser suite was performed.

Diff review confirms only `world/` additions and the task-board row. No existing
public page, shared asset, research fact, catalogue, sitemap or workflow changed.

The current character and room identity polish changes exactly `index.html`,
`sprites.js`, `mock-events.js`, `assets/institution.svg`, `tests/state.test.mjs`
and this README. It adds no files or dependencies. All eleven appearance
configurations and the Director sprite output are unchanged. New work cues stay
within existing furniture and screen footprints; room geometry and routes are
unchanged. Initial staff records, state, movement, controller, CSS, city artwork,
controller tests, parent pages and `TASKS.md` remain unchanged in this pass.

The workflow test verifies participation by all eleven professionals and the
knowledge, research, analysis, editorial, strategy and collaboration handoffs.
Browser QA confirms animated Director travel from Main Hall to Research Office,
arrival in the shared meeting posture, Data Lab review and return to Director
Office. No page overflow or World console errors were observed. JavaScript
syntax checks and the shared site checker pass.
