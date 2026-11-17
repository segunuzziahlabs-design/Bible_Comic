# CTRL-07 — six-chapter integration

16 November 2026 · [Execution plan](../controls/ctrl07-episode-integration-plan.md) · [Control sequence](../controls/player-control-design.md) · [Previous opening candidate](pasture-courtyard-arrival.md).

**Engineering regression: PASS.** Desktop, portrait and landscape each completed all twelve objectives, conclusion reload and fresh replay with no unexpected browser/resource errors. Human comprehension/creative acceptance and the documented transition hitch remain separate follow-ups.

## Candidate and scope

The production candidate is `build/playcanvas-ctrl07`, served locally on port 4201. [Enter the complete episode](http://127.0.0.1:4201/episode.html). It uses the normal local saved run; Replay starts a fresh run after completion. The six chapters, twelve ordered objectives, existing local save schema, cast, dialogue and combat mechanics are retained.

The [new canonical full-playthrough runner](../../apps/playcanvas/tests/ctrl07-episode-playthrough.cjs) starts each layout with empty browser storage. It earns progress through real keyboard/mouse or CDP touch gestures, normal audio/game clocks and UI navigation. It does not seed checkpoints, invoke review fixtures, mutate gameplay state or repair progress. The [input driver](../../apps/playcanvas/tests/ctrl07-browser-driver.cjs) shares physical controls across tests. The older encounter runner remains historical evidence for its earlier candidate.

## Corrections

- Episode-entry instructions now describe the pasture arrows and automatic arrival at Jesse's courtyard.
- The post-pickup route previously ran diagonally into the provisions bench. The first desktop regression stopped at its collision boundary (`x=0.4754, z=-7.5693`), with no browser error. The route now leads around the bench via `(0,-7.1)` before passing through the courtyard gate. Collision and the pickup animation are preserved. The full runner follows that same unobstructed route. [Original diagnostic](evidence/ctrl07-2026-11-16/run1/desktop/failure.json).
- At 844 × 390, the opening instructions pushed Begin below the visible card. A change confined to `@media(max-height:500px)` in [valley.css](../../apps/playcanvas/src/app/valley.css) widens and compacts the card. Begin is now fully visible without scrolling; its 48 px height remains. [Before](evidence/ctrl07-2026-11-16/run3/landscape/failure.png) · [After](evidence/ctrl07-2026-11-16/final-layout/landscape-entry.png).
- The final summary Replay button was also clipped on short screens. A matching rule in [episode.css](../../apps/playcanvas/src/app/episode.css) keeps it visible. [Before](evidence/ctrl07-2026-11-16/run5/landscape/failure.png) / [After](evidence/ctrl07-2026-11-16/final-layout2/landscape-completed-replay.png).
- Test readiness was corrected separately: touch taps wait for temporarily disabled audio-start buttons to enable, and route checks allow up to three seconds for the camera transition to reveal chevrons. These changes do not mutate gameplay state or grant progress. The earlier timing failures remain in the evidence folders.

## Verification

| Journey | Input and viewport | Result / evidence |
| --- | --- | --- |
| Desktop | Keyboard/mouse, 1280 × 720 | PASS — [all twelve objectives, completion and replay](evidence/ctrl07-2026-11-16/run2/desktop/results.json) |
| Portrait | CDP touch stick, drag aim and buttons, 390 × 844 | PASS — [all twelve objectives, completion and replay](evidence/ctrl07-2026-11-16/run3/portrait/results.json) |
| Landscape | CDP touch stick, drag aim and buttons, 844 × 390 | PASS - [all twelve objectives, completion and replay](evidence/ctrl07-2026-11-16/run6/landscape/results.json) |

The journeys exercise the automatic flock/messenger opening; guided path, automatic separate arrival, pause and control return; Jesse and supply pickup; road/discovery/Elah; delivery and brothers; challenge and Eliab; Saul and armour; automatic five-stone collection; sling practice; ranged confrontation; victory, retreat and cheers. Every objective must match the twelve source-defined IDs in order.

Recovery checks cover desktop restart during arrival, no held movement leaking after the cinematic, airborne interaction gating, pause during arrival and jump shot, delivery and worn-armour reload, interruption of unconfirmed stone collection, actual practice miss/hit, lethal spear contact, persisted defeat and Retry Battle. Retry retains preparation, resets the battle to five stones/zero evasions and increments attempt. Three actual evasions unlock the sling; incorrect ordinary and cinematic throws miss. Desktop wins with an ordinary aimed throw; mobile layouts use an aimed Jump Shot. Completion reload preserves the run, and Replay archives it and starts a new run.

**Final entry and Replay checks: PASS** on all three viewports. Begin and Replay are fully visible and usable without card scrolling. Fresh entry has no page overflow; Replay creates a new run and retains history. The isolated completed-save UI check imports the actually earned desktop completed run and is labelled as a recovery fixture; it is not counted as a fresh full journey. Computed paragraph styles confirm the new short-height rule applies to landscape only. [Results](evidence/ctrl07-2026-11-16/final-layout2/results.json) · [Runner](../../apps/playcanvas/tests/ctrl07-final-layout-check.cjs).

**CPU stress and live rotation: PASS.** A fresh normal opening with actual touch input under 4× CPU throttling completed airborne pause/resume, grounded recovery, portrait/landscape resizing, the real pasture path and automatic arrival. It arrived once, returned control with no active jump/fade and did not start Jesse prematurely. This stress check used the intermediate arrival-card candidate; its gameplay and valley page are unchanged by the later summary-card CSS correction. Observed median frame interval 18.7 ms, p95 23.5 ms (2,239 recorded frames). This is not a fixed low-FPS cap. [Results](evidence/ctrl07-2026-11-16/lower-rate/results.json) · [Runner](../../apps/playcanvas/tests/ctrl07-lower-rate-check.cjs).

**Rules and build: PASS.** Typecheck/production build and story/save, shared input, jump motion, arrival timeline and ranged spear/route rule checks were executed. Arrival/collision rules include 120/60/30/20 Hz sampling. [Command record](evidence/ctrl07-2026-11-16/rule-checks.json). The pre-existing large-chunk build warning remains.

## Candidate provenance and performance

Desktop and portrait full journeys passed before the final short-screen CSS correction. The final landscape journey covers all six chapters with that correction; final entry smoke tests cover desktop and portrait. All **34 emitted JavaScript files** match between the two builds after normalising only hashed JS/CSS resource URLs. Gameplay logic is unchanged. This report does not claim byte-identical exports across all three full runs. [JavaScript comparison](evidence/ctrl07-2026-11-16/javascript-equivalence.json) · [Earlier frozen hashes](evidence/ctrl07-2026-11-16/gameplay-candidate-manifest.json) · [Intermediate arrival-card hashes](evidence/ctrl07-2026-11-16/arrival-layout-candidate-manifest.json) / [Final frozen hashes](evidence/ctrl07-2026-11-16/candidate-manifest.json) · [Test revisions](evidence/ctrl07-2026-11-16/test-revisions.json).

[Verified summary and frame observations](evidence/ctrl07-2026-11-16/verified-summary.json) / [Run-to-candidate matrix](evidence/ctrl07-2026-11-16/run-matrix.json). Chrome 157.0.8103.52 on this laptop, Intel Graphics via ANGLE/D3D11. These are instrumented local browser observations.

| Layout | Local episode entry to Chapter 1 ready | Active frame median range | Per-chapter p95 range |
| --- | --- | --- | --- |
| Desktop | 5.017 s | 19.2-20.0 ms | 21.7-33.9 ms |
| Portrait | 3.617 s | 19.4-19.6 ms | 21.9-22.4 ms |
| Landscape | 3.593 s | 19.3-19.7 ms | 21.8-22.5 ms |

Intervals exclude paused periods and mode boundaries by segment; long frames within active segments remain. Resource observations total approximately 26.81 MB of unique encoded bodies across the whole journey; this is not a fresh internet transfer benchmark. Local chapter handoff ready times are retained in the summary. The final uncompressed export contains 148 files / 29,901,521 bytes.

| Guided walk | Desktop | Portrait touch | Landscape touch |
| --- | --- | --- | --- |
| Pasture path to automatic arrival | 6.78 s | 6.65 s | 6.66 s |
| Courtyard supplies to ridge | 9.38 s | 9.59 s | 9.32 s |
| Ridge to Elah | 5.67 s | 5.43 s | 5.49 s |
| Camp supply delivery | 4.11 s | 4.32 s | 4.29 s |
| Delivery to brothers | 6.00 s | 5.94 s | 5.88 s |
| Brook approach to automatic collection | 5.07 s | 5.30 s | 5.37 s |

These are observed guided walks with normal test input, excluding deliberate pauses and dialogue. They are not forced arrival timers; players can stop or explore. Camp delivery is a shorter approximately four-second route.


The first activation of Elah produced an approximately two-second frame gap in all three completed traces. Progress continued without state loss, but this hitch remains an optimisation item and is not described as smooth performance. Its exact cause was not profiled in this integration pass. Long frames are retained in the evidence, rather than discarded from the measurements.

## Remaining acceptance boundaries

Portrait/landscape checks use desktop Chrome's mobile viewport and actual emulated touch input. They establish layout and touch-input behaviour, not physical-phone GPU or Safari compatibility. CPU throttling is a stress proxy, not a minimum-device certification. Frame samples are local observations, not a universal frame-rate promise.

An unaided first-time participant session and owner creative acceptance require actual observations. The [participant checklist](../testing/ctrl07-first-time-player.md) is prepared; automation does not establish enjoyment or control comprehension. No new accounts/backend work, deployment, commit or push is part of CTRL-07.

## Run locally

```powershell
npm.cmd --prefix apps/playcanvas run build -- --outDir ../../build/playcanvas-ctrl07
npm.cmd --prefix apps/playcanvas run preview -- --outDir ../../build/playcanvas-ctrl07 --host 127.0.0.1 --port 4201 --strictPort

$runtime = Get-AppxPackage '*CodexPrimaryRuntime*' | Sort-Object Version -Descending | Select-Object -First 1
$pw = Join-Path $runtime.InstallLocation 'dependencies/node/node_modules/playwright'
node apps/playcanvas/tests/ctrl07-episode-playthrough.cjs $pw http://127.0.0.1:4201 docs/implementation/evidence/ctrl07-local all
node apps/playcanvas/tests/ctrl07-final-layout-check.cjs $pw http://127.0.0.1:4201 docs/implementation/evidence/ctrl07-local/final-layout docs/implementation/evidence/ctrl07-local/desktop/results.json
node apps/playcanvas/tests/ctrl07-lower-rate-check.cjs $pw http://127.0.0.1:4201 docs/implementation/evidence/ctrl07-local/lower-rate
```

Run the lower-rate check after the journeys so the two browser processes do not compete for the GPU during measurements. Use a new evidence directory for a rerun; do not overwrite a diagnostic failure.
