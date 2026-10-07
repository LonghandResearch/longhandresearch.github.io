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
| `state.js` | DOM-free agent/task model, ordered handoffs, validated reducer and bounded journal |
| `movement.js` | DOM-free waypoint behavior, independent of event production |
| `mock-events.js` | Deterministic five-stage research pipeline and repeating event source |
| `sprites.js` | Five professional pixel sprites; visual configuration keyed by agent ID |
| `world.js` | Rendering, selection, simulation clock and adapter surface |
| `tests/state.test.mjs` | Independent state, event and movement invariant tests |
| `tests/controller.test.mjs` | Timer, animation, pause, restart and reduced-motion regression tests |

The six rooms are Main Hall, Library, Research Office, Data Lab, Editor Office and
Director Office. The active roster is defined centrally in `State.INITIAL_AGENTS`.
Exactly five staff have distinct professional sprites and roles:

| Agent | Identity | Initial room | Work |
| --- | --- | --- | --- |
| Research Director | Male | Director Office | Leadership, strategy, review and directing |
| Researcher | Male | Library | Reading, source analysis and investigation |
| Data Analyst | Female | Data Lab | Quantitative analysis, data processing and validation |
| Editor | Male | Editor Office | Writing, review and publication preparation |
| Research Associate | Female | Main Hall | Source collection, research support and coordination |

The renderer, selection, movement membership and reset all derive from this
roster. Removed IDs are rejected by the existing event reducer without changing
state or the activity journal. Every character and staff list entry is a native
button. Selecting either updates the same staff dossier:
name, role, status, last confirmed location, destination when moving, current
task, stage progress, current activity and the latest event's local timestamp.
All five begin IDLE at 0%, awaiting the same simulated team task.

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
48 × 80 sprite canvas, map size, shading and walking animation. The Data Analyst
reuses the existing female analyst appearance under the stable `analyst` ID,
giving the five-person team three men and two women. The other four retained
sprite outputs, including the Director, are unchanged. The Researcher carries
a source book; the Analyst uses a dashboard and stylus; the Editor carries
article proofs and review marks; the Associate has a laptop and shared notes.

The agent model holds `id`, `name`, `role`, `location`, `status`, `currentTask`,
`taskId`, `progress` and `lastActivity`, plus a description, `destination` and
`currentActivity`. `lastActivityText` records the latest journal event; arrivals
update that history without replacing the agent's ongoing research activity.
Locations are room IDs; their display names live in `State.ROOMS`. Statuses are
`IDLE`, `WORKING`, `THINKING`, `DIRECTING`, `READING`, `MEETING`, `REVIEWING`, `COMPLETED` and
`ERROR`. Walking is visual behavior rather than an additional task status.
`DIRECTING` uses the existing stationary meeting behavior. The Director stays
first in the staff list and starts in Director Office. The mock workflow takes
him through Main Hall, Research Office and Data Lab before returning for review.
Department visits use the existing status/location contract.

`State.TASK_DEFINITION` defines one mock task, **Analyze AI infrastructure market
trends**, and its five ordered owners. The store's task snapshot contains `id`,
`title`, `assignedAgentId`, `status`, confirmed `location`, `currentActivity`,
`stage`, `completedStages`, `startedAt` and `completedAt`. Its overall status is
IDLE before the first stage, WORKING during the pipeline and COMPLETED only after
the Director's final review. Agent statuses describe work within each stage.
The first start records the task timestamp; handoffs preserve it, and final
completion records a completion timestamp. Snapshots copy the task record.

## Event contract

Task → Agent → Agent Event → World State → Character Behavior

All producers dispatch the same plain object through `LonghandWorld.dispatch`:

```js
LonghandWorld.dispatch({
  type: 'agent.started_task',
  agentId: 'associate',
  taskId: 'ai-infrastructure-trends',
  task: 'Analyze AI infrastructure market trends',
  location: 'library',
  progress: 5,
  activity: 'Collecting relevant primary sources'
});
```

Supported events:

| Event | Required payload | Effect |
| --- | --- | --- |
| `agent.started_task` | `agentId`, `task` | New task, default WORKING status and 0% progress |
| `agent.changed_status` | `agentId`, `status` | Change status, applying optional validated progress |
| `agent.moved` | `agentId`, `location` | Request travel to a room |
| `agent.completed_task` | `agentId` | COMPLETED and 100% progress |
| `agent.error` | `agentId` | ERROR and a readable error activity |
| `agent.progress` | `agentId`, `progress` | Update validated progress in 0–100 |
| `agent.arrived` | `agentId`, `location` | Behavior-generated acknowledgment of the current destination |

Optional `location` on a task, status, completion or error event requests movement.
Optional `activity` supplies a short readable activity and journal entry. A
started task can also supply `status` and `progress`. Unknown event types,
agent IDs, rooms, statuses, invalid progress and empty/oversized task or activity strings are
rejected with `false` and no state mutation. Dispatch returns `true` when accepted.
An arrival for an obsolete destination is rejected. Journal history is bounded to
12 events, with the latest four shown; snapshots are independent copies.

Events with `taskId` participate in the team pipeline. Starts must use the
known task title and the next stage's owner; other linked events must come from
the active, incomplete stage's owner. Premature handoffs, unknown task IDs,
duplicate starts and duplicate completions are rejected before timestamps,
state, journal or subscribers change. Existing untagged events remain supported;
an untagged replacement start cannot detach an active owner from its incomplete
team stage. Behavior-generated arrivals remain untagged and update the task's
confirmed location only for its current owner. Late arrivals from previous
owners cannot overwrite the next stage's activity or location.

The default mock source runs its first event after four seconds, then one every
11 seconds. Pause stops both events and travel; Next event advances once, with
an immediate arrival in manual mode.
Restart restores the agents and sequence, preserving selection and pause choice.
Hidden pages suspend timers and animation. Reduced motion starts in manual mode
and always uses immediate arrival rather than animated travel.

The 29-event mock script performs one shared research task:

| Stage | Owner | Simulated work |
| --- | --- | --- |
| 1 | Research Associate | Collect sources, check dates and relevance, prepare the source pack |
| 2 | Researcher | Read, think, analyze sources and structure findings |
| 3 | Data Analyst | Process mock data, cross-check calculations and validate findings |
| 4 | Editor | Read findings, write/edit the narrative and review publication readiness |
| 5 | Research Director | Consider the work, direct/discuss the argument and conduct final review |

Each stage reaches COMPLETED before handing off. Event 24 completes the overall
task; the last five events return every agent to IDLE while preserving that
result. The next cycle starts a fresh task record with new timestamps, while
Restart also clears the journal and restores all initial agent states. Stage
progress belongs to the selected agent, and a small team-task line distinguishes
active work, pending handoff and overall completion. The source cursor, movement
algorithm, core staff stations and controller timing remain unchanged. No backend
is connected and no report is published.

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
`world/`. The core workflow implementation changes World files only.

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

Checked on 7 October 2026:

- All 29 state, event, movement and controller tests pass, including ordered
  handoffs, owner validation, timestamps, final completion, cleanup, repeat/reset,
  snapshot isolation, arrival/activity separation and rejected events with no
  mutation. Existing checks cover all 180
  agent/room-pair doorway routes, interrupted travel, simultaneous arrivals,
  one animation loop, pause/restart, hidden-page suspension and reduced motion.
  Both complete mock cycles keep every colleague's sprite center outside other
  staff hitboxes at the floor plan's minimum 700 pixel width.
- The shared site checker passes script parsing, all existing JSON, catalogue,
  sitemap and exact-case links, including the new nested World page.
- Browser preview confirms six rooms, all ten map/staff-list selections, matching
  dossiers, Enter/Space selection, the complete 29-event pipeline, each stage's
  states/progress, overall COMPLETED, all-five IDLE cleanup, next-cycle restart,
  animated travel and arrival, manual Next event and pause/restart.
- Direct HTTP `world/` and `world/index.html` load; refresh works. Artwork loads
  locally, and World links resolve to the existing research pages. No World
  console errors were observed.
- At 1280, 1024, 768, 390 and 320 pixel viewport widths, the page, staff list,
  controls, dossier and long pending-handoff summary fit the screen. Narrow
  layouts scroll only the floor plan;
  all five map selections work at 320 pixels. Map sprites remain 36 × 60 pixels.
- The preview browser allows HTTP/HTTPS only, so direct `file://` behavior was
  inspected in code but could not be browser-tested. No live deployment or
  cross-browser suite was performed.

The complete V0.1 PR touches only `world/` and the task-board row. No existing
public page, shared asset, research fact, catalogue, sitemap or deployment workflow changed.

The core workflow pass changes exactly `state.js`, `mock-events.js`, `world.js`,
`world.css`, `index.html`, `tests/state.test.mjs`, `tests/controller.test.mjs`
and this README. It adds no files or dependencies. The CSS change styles only
the small team-task summary; controller changes render it and current activity.
Sprites, movement, room/city artwork, parent pages and `TASKS.md` remain unchanged.

Regressions verify exactly five active identities, the three male / two female
appearance mix, rejection of removed IDs without state/feed mutation, all five
working dossiers and ordered task handoffs through repeated cycles and reset.
Browser QA confirms five characters/cards throughout the cycle, a journal
containing only core staff, animated travel and office return. No page overflow
or World console errors were observed. The parent homepage and Library render
correctly with their research links. JavaScript syntax checks and the shared
site checker pass.
