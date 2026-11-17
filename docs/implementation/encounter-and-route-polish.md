# Ranged encounter, jump shot and automatic story actions

16 November 2026 · [Implementation order](../controls/ranged-battle-and-route-plan.md) · [Retained CTRL-05 baseline](ctrl05-spear-collision.md) · [New throw asset/provenance](../assets/goliath-ranged.md).

**Subsequent opening change:** [Separate pasture and courtyard arrival](pasture-courtyard-arrival.md) replaces the contiguous flock-to-household walk with a guided pasture exit and automatic courtyard arrival. Port 4200 is that review candidate; the 4199 results below remain its earlier baseline.

## Changes

Chapter 5 now begins combat at approximately **9.5 m**, replacing its close melee thrusts with a visible, ballistic spear throw. Goliath's original walking entrance remains before the voiced confrontation; Retry Battle returns directly to combat. A red circle marks the locked landing point during the warning. The spear leaves his actual animated grip/tip, travels for approximately **1.25 s**, and remains visible through its landing. A brighter head and short translucent trail aid tracking.

David can move forward, backward, left or right, or hold one of those directions and use **Shift / Dodge** for a quick step. Moving away from a genuinely threatening throw can earn an evasion without pressing Dodge. The actual shaft/head still use the swept 3D capsule collision; neither Jump nor Dodge grants invulnerability. Three successful evasions still ready the sling. Combat framing now includes David and the locked landing point and eases further out when they separate, addressing a real portrait visibility failure found during testing.

**F / Throw** retains the ordinary sling. **Q / Jump Shot** performs one coordinated takeoff, airborne sling release, landing and tracking camera sequence. It combines the retained authored jump clips with the existing upper-body sling performance; actual gravity supplies root motion once. Movement, reticle and combat actions are hidden during that short performance, Pause remains available, and an unsuccessful shot returns control. The stone releases from the animated hand/pouch at its actual airborne height. One action consumes one stone. The player's aim is captured when throwing; the projectile no longer retargets to the forehead during windup. The readiness ring uses the physical hit radius. Incorrect ordinary and cinematic throws can miss; only a confirmed forehead hit triggers Goliath's fall and the retained biblical conclusion.

The shared objective guide now draws directional chevrons along walking routes, with an arrow and destination label. Explicit polylines show the open courtyard gates, road bends, camp aisle and brook approach. Existing short, unobstructed approaches use direct chevrons. Gold markers remain supplementary. The arrows are presentation derived from the current objective, not another progression/save system. Camera guidance and movement remain player-controlled. Camp pacing is slightly slower; the final road leg and brook approach are tuned for brief travel. Nearby object approaches are not padded to meet a minimum time, and players can still stop or explore.

Reaching the stones while grounded now automatically starts one continuous five-stone performance. The player does not press Interact or control each bend/pickup. Existing authored approach, bend, palm-contact and bag actions chain through all five stones under one cue owner. Only completing the chain confirms `stones.gathered`; interruption/reload before that confirmation safely restarts the uncommitted collection. The last shot eases into the follow camera before control returns, with the next objective pointing to sling practice. Captions/help explain that collection is automatic.

## Scope retained

All six chapters, their twelve objective IDs/order, save schema/content version, confirmed preparation, appearance choices, normal sling practice, stone refill, pause, battle-only retry and completion/replay remain. No extra episode, account/backend, deployment, dependency replacement, commit or push was introduced. Earlier candidates, including port 4198, remain intact. Chapter 5 opts into the ranged controller; the isolated earlier melee fixture remains available for its historical tests.

The new Goliath export retains all prior clips, speech shapes, 11,785 triangles and 68 joints. Splitting the held shaft from the clothing adds one mesh; one original overarm throw clip is added. [Exact hashes and checks](../assets/goliath-ranged-manifest.json). No new third-party art or recordings were downloaded.

## Verification records

The local production export is `build/playcanvas-encounter-polish`, served on **4199**. Tests use actual Chrome rendering and keyboard/CDP touch input at normal game time. Repeated battle and mobile pickup cases use clearly labelled, reducer-built valid checkpoints in isolated contexts; they do not modify owner saves or repair runtime state. The fresh journey uses an initially empty context and earns its objectives through the real UI.

| Requirement | Browser evidence |
| --- | --- |
| Wider battle, thrown spear, lethal contact and retry | [Final battle matrix](evidence/encounter-polish-2026-11-16/final-presentation/battle-results.json): desktop 1280 × 720, portrait 390 × 844 and landscape 844 × 390. Preparation survives defeat; Retry restores five stones. |
| Directional movement and visibility | Matrix uses forward, backward and left quick steps. [Visibility/right-movement audit](evidence/encounter-polish-2026-11-16/final-touch2/visibility-results.json) additionally uses normal touch-stick movement to the right without Shift. Both orientations keep a rendered head/shaft in the viewport at every sampled active flight frame. |
| Ordinary miss / cinematic miss / cinematic hit | Battle matrix checks all three, actual raised release position, exactly one stone per throw, pause/resume during the airborne action, control return after a miss, one real forehead hit and objective eleven. Ordinary correctly aimed victory is also part of the fresh journey. |
| Automatic five-stone chain | [Final mobile pickup checks](evidence/encounter-polish-2026-11-16/final-touch2/stones-results.json): actual touch approach, visible route arrows, no interaction action, authored bend/palm contact, all five pickups, paused cue, one objective confirmation and durable reload. Approach: 5.095 s portrait / 4.954 s landscape. |
| Routes, entrances, handoffs and saves | [Fresh six-chapter journey](evidence/encounter-polish-2026-11-16/final-journey/fresh-journey-results.json): authoritative result record is written only if the complete run passes. It checks automatic messenger, Jesse errand/courtyard supply pickup, carried road journey, camp, challenge, Saul/armour, interrupted automatic stones, practice miss/hit, walking Goliath entrance, defeat/reload/retry, ordinary winning hit, Victory, completion reload and replay/history. |

**Final result: PASS.** The final battle matrix, both mobile pickup cases, both continuous-flight visibility cases, the fresh six-chapter journey, eight unit/asset checks and production build/typecheck passed. The fresh run earned all twelve objectives, retained preparation through a lethal spear defeat, retried once, won with an ordinary correctly aimed throw, completed Victory, reloaded completion and archived the completed run on Replay. No checkpoint was injected into that fresh run. The separate targeted cases use the labelled checkpoint fixtures described above.

| Guided walking leg in the final fresh run | Measured elapsed time |
| --- | --- |
| Flock → Jesse's courtyard | 6.148 s |
| Courtyard → ridge | 8.407 s |
| Ridge → valley | 5.668 s |
| Camp entry → provisions | 4.501 s, approximately five seconds |
| Camp → brothers | 6.194 s |
| Brook → automatic stones | 5.345 s; interruption/recovery approach 5.438 s |

These timings include actual test input and turning overhead, exclude dialogue/cinematics, and describe following the route. Nearby object interactions and the short final overlook approach are shorter; free exploration is not forced onto a timer.

[Executed unit/asset outputs](evidence/encounter-polish-2026-11-16/verification-results.json) · [Exact frozen build inventory/hashes](evidence/encounter-polish-2026-11-16/candidate-manifest.json). The full multi-page export contains 148 files totalling 29,897,576 bytes; this is not a Chapter 5 network download measurement. The full journey, mobile pickup and continuous-flight audits preceded a final cinematic HUD display change. The rebuilt candidate then passed the complete three-layout battle matrix again, including explicit checks that the reticle/combat buttons hide during Jump Shot and return after a miss. Mechanics, objective logic, timing and assets were unchanged by that display correction. No source/build changes followed this last verification.

Selected actual browser captures: [wider battle and spear](evidence/encounter-polish-2026-11-16/final-presentation/landscape-visible-flight.png), [airborne sling release](evidence/encounter-polish-2026-11-16/final-presentation/portrait-jump-shot-hit-release.png), [route to the stones](evidence/encounter-polish-2026-11-16/final-touch2/landscape-stone-route.png), [automatic bend/pickup](evidence/encounter-polish-2026-11-16/final-touch2/portrait-automatic-pickup.png), [Goliath's actual entrance](evidence/encounter-polish-2026-11-16/final-journey/fresh-07-champion-entrance.png), [completed episode](evidence/encounter-polish-2026-11-16/final-journey/12-complete-episode.png).

Supplementary checks: TypeScript/production build, [ranged trajectory/rules/route geometry](../../apps/playcanvas/tests/ranged-spear-rules-check.cjs), retained spear geometry and airborne rules, action router, jump motor, episode/save rules and [asset continuity](../../apps/playcanvas/tests/ranged-asset-check.cjs). Unit tests supplement actual browser play; passing legacy melee rules alone does not verify the new ranged encounter.

Earlier diagnostic failures are retained separately. A missed jump-shot test initially took its aim projection while the return camera was still moving; the harness now waits for that handoff and aims manually. The first fresh-run harness kept steering after automatic pickup had already taken control; it now stops walking at that state transition. A separate portrait flight audit found a genuine camera crop during rightward movement; combat framing was corrected and that audit passed again. None of these corrections grants automatic aim, immunity or progress.

## Practical limits

Collision uses the retained conservative standing capsule translated by actual feet height, not per-triangle clothing collision. Ballistic motion is sampled and swept over capped updates with the retained small geometric margin. Browser touch emulation establishes responsive layout and input behaviour; physical-phone GPU performance and Safari coverage are not claimed. Walking timings describe following the guided route, with normal test input/turning overhead, not a timer forcing players to arrive. Existing large-bundle build warnings remain; no new minimum-device or loading-performance claim is made. Final art quality, battle balance and owner creative acceptance remain review decisions.

## Review locally

- [Play the episode](http://127.0.0.1:4199/episode.html).
- [Prepared Chapter 5 review](http://127.0.0.1:4199/duel.html?review=1), leaving saved episode progress unchanged.
- [Prepared Chapter 4 review](http://127.0.0.1:4199/preparation.html?review=1): audience/armour lead to the automatic brook pickup and practice.

```powershell
npm.cmd --prefix apps/playcanvas run preview -- --outDir ../../build/playcanvas-encounter-polish --host 127.0.0.1 --port 4199 --strictPort
```

Controls: WASD/arrows or left touch controls move; Space / Jump is the normal jump; hold a direction + Shift / Dodge for a quick step; F / Throw and Q / Jump Shot use your current aim. Point the mouse or drag to aim. Watch the locked red landing circle and the actual spear, then aim at the forehead after three evasions.

The Codex browser preview was requested; the app reported the opening as queued. Verification above uses actual Chrome renders and inputs, not an assumed in-app playthrough.
