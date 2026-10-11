# Longhand V2 mobile audit

11 October 2026. Codex author QA in the external `codex/mobile-qa` worktree,
based on public `main` at `a0ee4ce`. The owner requested checking the published
update across phones. Repairs and publication follow the continuing owner
authorization and temporary takeover workflow in `AI_COLLABORATION.md`.
This is not independent Claude review.

## Scope

Chromium/Edge 155.0.4283.45 was used with fresh browser contexts, touch/coarse
pointer emulation and saved light/dark preferences. These are viewport families,
not certifications of named physical phones or of mobile Safari. Reader traffic
analytics were suppressed in the test contexts.

| Viewport family | CSS viewport | Device pixel ratio | Touch |
| --- | --- | --- | --- |
| Small phone | 320 × 568 | 2 | Yes |
| Compact Android-sized phone | 360 × 800 | 2 | Yes |
| Phone | 375 × 667 | 2 | Yes |
| Phone | 390 × 844 | 3 | Yes |
| Large Android-sized phone | 412 × 915 | 2.625 | Yes |
| Large phone | 430 × 932 | 3 | Yes |
| Phone landscape | 844 × 390 | 3 | Yes |
| Tablet portrait | 768 × 1024 | 2 | Yes |
| Tablet landscape | 1024 × 768 | 2 | Yes |
| Desktop regression | 1440 × 900 | 1 | No |

Nineteen routes cover Home, Coverage, Library, Country, Sector, Company, About,
Wire and every one of the eleven published reports. The initial matrix inspected
380 combinations on the real public origin. The weekly template's JSON loading
state was initially sampled too early in two visits; the final harness waits for
the populated heading before evaluating the page. Local author controls are
expected locally; they are checked as hidden on the public origin.

## Repair

Several touch fields remained at 11–15px: Library search and entity filters,
Wire search in wide orientations, the October report's selects, and numeric
fields/selects in the two infrastructure studies. Library's later narrow CSS
overrode its earlier 16px search rule. A width-only rule also missed landscape
phones and tablets.

Shared styles now set search/filter fields to 16px when the primary pointer is
coarse. Report numeric fields, selects and textareas retain at least 16px in
the same condition. This improves legibility and addresses the sub-16px field
pattern associated with focus zoom in iOS; an actual iOS zoom correction is not
claimed as physically verified. Fine-pointer desktop field sizes remain as before.
The shared stylesheet/script versions were refreshed in all fifteen importing HTML pages.
Research prose, figures, datasets, catalogue, PDFs, JavaScript calculations and
deployment/publishing workflows were not changed.

## Home and Coverage globe entrance

The owner reported a stuttering globe when navigating from Home to Coverage.
An instrumented 4x CPU-throttled reproduction captured the incoming transition
at 342ms while the globe's first frame arrived at 916ms. A separately named
globe snapshot was therefore empty, while the rebuilt scene started its own
1.6-second opening turn underneath the navigation animation.

The first repair in PR #89 used the directional page entrance rather than
morphing two WebGL canvases. The owner subsequently clarified that the spatial
globe flight should be retained; [the continuity repair](transition-qa.md)
supersedes that entrance with a carried, painted frame and matching surface pose.
The canvas and geographic labels appear together once ready, without a second
opening turn. City lights are
loaded with the small initial day map so the first frame is already illuminated.
Clouds, the water mask and the sharper day texture load after an active page
transition finishes. A failed night texture still permits the day scene to render.
Ordinary links, research identity/report-title transitions, globe dragging,
country selection and reduced motion remain available.

The public navigation script is render-blocking, using the existing deferred
script pattern, so its transition listeners register before the incoming
snapshot. Home's shared script now follows the same pattern as Coverage and
Library. This prevents an early Home snapshot before the heading/globe stage
has been parsed. These flags do not wait for the asynchronous WebGL scene or
large textures. See the primary [Chrome cross-document transition documentation](https://developer.chrome.com/docs/web-platform/view-transitions/cross-document).

Eighteen navigation checks covered Home to Coverage, Coverage to Home and Home
to Library across desktop, phone and tablet profiles in both themes. Phone and
tablet runs used 4x CPU throttling. There were no page errors, root overflow,
premature optional texture requests or retained transition classes. A further
four throttled phone navigations verified both headings and globe stages exist
at snapshot readiness after the render-blocking repair. This addresses the
reproduced entrance conflict; it is not a certification of physical GPU frame
rates. Screenshots and timing observations are outside Git under `globe-*`.

## Verification after the repair

The complete 380-combination matrix was repeated locally. Every route rendered
its populated heading and saved theme without root horizontal overflow,
unexpected page errors or failed same-origin requests. No visible, enabled
touch input/select/textarea in the sampled pages remained below 16px. Local
author controls remained available. Representative phone, landscape and tablet
screenshots were inspected.

Fourteen Playwright MCP touch assertions passed at 390 × 844 with DPR 3,
including an actual viewport rotation to 844 × 390 and back. They check menu
opening and outside-tap dismissal, search and field size, PDF canvas rendering,
return to the filtered archive, geography selection, vertical scrolling over
the globe, horizontal globe dragging and clean release, orientation without
overflow, landscape Wire search size and theme switching. No page errors were
observed.

Additional fallback checks passed: with WebGL unavailable the Coverage globe
hides and country selection still works; without JavaScript the 320px Library
keeps navigation and eleven direct publication links without overflow; reduced-
motion mode retains the globe and the research link.
The no-WebGL, no-JavaScript and reduced-motion checks were repeated after the
navigation repair. Aborting the night texture also retained a usable globe
and working country selection without page errors.

`node --check` passes for both changed JavaScript files. All 131 existing Node
tests pass. `node scripts/check-site.mjs` passes for 59 scripts, 67 JSON files, 11 catalogue
entries, 16 sitemap pages and links in 19 pages. Diff whitespace checks pass.
Evidence and the browser harness are outside Git under
`C:/Users/user/.codex/tooling/longhand-mcp/v2-qa/phone-*`.

## Limits

Playwright Firefox 156 and WebKit 26.6 were downloaded outside the repository
to extend engine coverage. Firefox fails to start with `spawn UNKNOWN`.
WebKit's Windows host validation reports dependency issues and its process
closes on startup when validation is skipped for a diagnostic attempt. No
security settings or operating-system configuration were changed to bypass
these failures. Neither engine is counted as tested.

Physical Android/iPhone devices, Safari on iOS/macOS, Firefox rendering, virtual
keyboard behavior, notch safe areas and real mobile GPU/frame performance remain
unverified. Emulation and successful layout checks do not guarantee every phone,
OS version or network condition. The previous cold-load font and hardware-
dependent WebGL limitations remain. Post-merge public verification is recorded
in the publication pull request.
