# MSR-02: Jesse/camp poses and David's movement

20 November 2026. Implementation follows the [scoped execution plan](../implementation/msr02-motion-execution-plan.md) and [overall MSR plan](../implementation/motion-speech-and-guided-routes-plan.md). Comparison baseline: [MSR-01 at `2e96ba6`](motion-speech-and-route-baseline.md).

## Changes

- Jesse completes two forward pointing gestures during his instructions, with a resting beat between them, and returns to idle after his greeting. The former 1.3-second pointing-frame cap is removed.
- David's listening cycle uses its own continuing clock, rather than clamping at the end of someone else's line. Restrained, reversible head/chest breathing and listening nods support the exchanges. These offsets are restored before the next base pose and on restart.
- The baggage keeper's and Eliab's gestures stretch forward across longer lines instead of reaching a static last frame. Short replies retain normal gesture speed. Voices, captions, line lengths, baskets and timed prop actions keep their original ownership and timing.
- Story David has an idle/walk blend driven by actual travel after collision. Starts/stops use the existing acceleration/deceleration; gait phase follows distance at the existing .93 m/s reference cadence. Against an obstacle, the walk weight falls to idle even while movement is held. Body turns use the shortest angle and a 420-degree/second limit, with easing near the target.
- The same story locomotion is used in the opening, camp, challenge and preparation, including practice movement. Authored pickup, delivery, jump and combat actions keep their separate states. Existing movement speeds, routes, six chapters, twelve objective IDs and save format are unchanged.

No new dependencies, models, recordings, authentication changes or deployment changes. The story actor's animation graph is created before the provisions layer; all previous named one-shot clips remain available. Manual animation updates remain the single clock owner. This extends the existing PlayCanvas blend-tree pattern already used by the battle controller.

## Browser evidence and checks

**Implemented and browser-verified; owner visual review pending.** The isolated production candidate is `build/msr02-local`, served at port 4217 with local QA accounts. It does not use or modify the live cloud account. Raw recordings and rig traces are ignored evidence artifacts, not committed assets.

Final candidate evidence: `evidence/msr02-2026-11-20/candidate/`. Earlier captures in the parent directory are exploratory and do not stand in for the final candidate. The read-only observer records rendered bone poses and current story state; tests use real keyboard or CDP touch input, not state writes or clock acceleration.

| Browser check | Result | Evidence |
| --- | --- | --- |
| Desktop, 1280 × 720, keyboard/mouse | PASS | [Assertions](evidence/msr02-2026-11-20/candidate/desktop-results.json), [walking](evidence/msr02-2026-11-20/candidate/desktop-walking.png), [blocked with input held](evidence/msr02-2026-11-20/candidate/desktop-blocked.png) |
| Portrait, 390 × 844, CDP touch | PASS | [Assertions](evidence/msr02-2026-11-20/candidate/portrait-results.json), [walking/controls](evidence/msr02-2026-11-20/candidate/portrait-walking.png), [Jesse](evidence/msr02-2026-11-20/candidate/portrait-jesse-second-gesture.png) |
| Landscape, 844 × 390, CDP touch | PASS | [Assertions](evidence/msr02-2026-11-20/candidate/landscape-results.json), [walking/controls](evidence/msr02-2026-11-20/candidate/landscape-walking.png), [Eliab](evidence/msr02-2026-11-20/candidate/landscape-eliab-late-line.png) |
| Fresh normal desktop episode, Chapters 1–6 | PASS | [Results](evidence/msr02-2026-11-20/full-episode/desktop/results.json), [recorded episode](evidence/msr02-2026-11-20/full-episode/desktop/complete-episode.webm) |

[Desktop/portrait/landscape screenshot comparison](evidence/msr02-2026-11-20/candidate/layout-comparison.png).

All three focused runs exercised the automatic messenger/path/arrival, one complete Jesse exchange, pause/resume, separate Take availability, David's start/stop, reverse/sideways turning, jump/landing, carrying, held movement against the baggage table, delivery and the complete keeper/Eliab conversations. Both camp interactions completed once; no console errors were captured. Screenshots were visually inspected, including the two gestures/rest beat, walking, jump, late-line gestures and touch framing.

The fresh episode used Chrome **157.0.8103.79**, normal clocks and actual input, with all twelve ordered objectives earned from an empty normal local session. It passed arrival restart, checkpoint reloads, automatic stones, a practice miss/hit, battle defeat/retry, physical attack evasion, sling misses and a genuine winning hit, aftermath sword interactions, Victory, reload and replay. No browser errors or failed network requests were recorded. Cloud sign-in was not part of this local regression.

An initial concurrent desktop video export stalled after its assertions passed. That capture runner was stopped; final focused checks were completed without video encoding, including a fresh desktop rerun. The separate full-episode recording completed successfully. Captured frame times under concurrent instrumentation are not a clean performance benchmark.

### Measured pose and contact observations

[Rig-trace summary and method](evidence/msr02-2026-11-20/candidate/motion-summary.json):

| Moment | MSR-01 approximate contiguous body hold | MSR-02 longest sampled hold across the three layouts |
| --- | --- | --- |
| Jesse's provisions instruction | 8.91 s | 0–0.032 s |
| David listening during that instruction | 7.03 s | 0–0.032 s |
| Keeper's directions | 1.56 s | No unchanged consecutive body samples detected |
| Eliab's answer | 1.87 s | No unchanged consecutive body samples detected |

These are sampled local head/chest/right-arm rotations, with a quaternion-component tolerance of 0.00001 and capture gaps above 250 ms excluded. They establish that the reproduced multi-second exact holds are gone; they do not grade acting quality. The instruction's authored duration remains 9.579 seconds. The trace's wall-clock span includes the intentional pause.

The body-turn policy passed shortest-path, no-overshoot and 420-degree/s checks at 20/30/60/120 Hz. Browser traces passed the per-update 21-degree upper bound at the chapter's maximum .05-second update. Frame-end timestamp differences are affected by rendering/capture and are unsuitable for claiming an instantaneous turn rate. The maximum observed carrying hand gap was approximately 34.6 cm and stayed below the test's 36 cm hand-separation check.

The short flat-camp ankle diagnostic ranged approximately **0.07–9.1 cm**; one desktop start/blend window exceeded the proposed 8 cm plant target. It uses an ankle near its observed minimum height, not an actual sole/contact solver. **Formal planted-foot acceptance remains open**, particularly starts/stops, pivots and terrain. The 150 ms input-response target was not formally measured. These limits are retained as MSR-R04, rather than declaring every original motion-quality target passed.

### Executed checks

- Production build, including TypeScript checking: PASS.
- `story-motion-check.cjs`: PASS — bounded/wrapped turns, no overshoot, long-line timing, short replies retaining normal speed, collision idle and intermediate start/stop weights.
- `audience-performance-check.cjs`: PASS — 500 restore cycles without accumulation, finite joints and existing audience timing.
- `jump-motion-check.cjs`: PASS — takeoff/air/landing, roof/ground behaviour and restart cancellation.
- `npm run test:story`: PASS — ordered objectives, cue ownership, saves, failures/retry, aftermath and replay.
- `continuous-battle-saves.cjs`: PASS — local PGlite owner isolation, ordered checkpoints, stale writes, idempotency, server Victory guard and replay.
- `msr02-browser-check.cjs`: PASS — all three final layouts, followed by `msr02-browser-summary.cjs` assertions.
- `ctrl07-episode-playthrough.cjs … desktop --record`: PASS — complete fresh local episode.

Source paths: [story motion policy](../../apps/playcanvas/src/gameplay/story-motion.ts), [story actor](../../apps/playcanvas/src/world/conversation-actor.ts), [opening](../../apps/playcanvas/src/world/shepherd-opening.ts), [camp](../../apps/playcanvas/src/app/camp-main.ts). Reusable QA: [focused browser test](../../apps/playcanvas/tests/msr02-browser-check.cjs), [trace summary](../../apps/playcanvas/tests/msr02-browser-summary.cjs).

## Limits and next work

This is a targeted motion pass using the existing rigs and authored clips. Naturalness is still an owner judgement; eliminating an exact pose hold does not establish production acting quality. Phoneme-specific facial animation, pronunciation and emotional voice delivery are not approved by this pass. Audio input is unavailable to the reviewing agent, so no independent listening judgement is claimed.

Portrait/landscape tests are browser touch emulation, not physical-device certification. Formal planted-foot drift/input-latency targets and device performance remain distinguished from the verified visual/functional fixes. No new pivot clips or foot IK were authored. The existing clips support the improvement, while finer foot planting may require a subsequent targeted motion pass after owner review.

MSR-D03 (missing walking connections), D04 (duel response tail) and D05 (cinematic footer hints) remain assigned to later tasks. See the [defect register](motion-speech-and-route-defects.json). Next planned task is MSR-03's speech/reactions pilot; guided walking connections follow in MSR-04/05.

## Review links

- [Chapter 1: flock, automatic messenger, arrival and Jesse](http://127.0.0.1:4217/valley.html?review=1).
- [Chapter 2: walking, provision delivery and brothers](http://127.0.0.1:4217/camp.html?review=1).

These review entries preserve the owner's normal saved episode. Use W/A/S/D or arrows on desktop and the movement pad on touch; Space/tap Jump; E/tap the contextual action. Speak starts the complete exchange once. Take remains a separate action.
