# Separate pasture and courtyard arrival

16 November 2026 · [Plan written before implementation](../controls/pasture-courtyard-transition-plan.md) · [Previous encounter/route candidate](encounter-and-route-polish.md).

## Implemented flow

1. David tends the flock and the messenger arrives automatically, as before. Jesse, the houses and provisions are hidden in this pasture scene.
2. Control returns for a player walk along the pasture path. Route arrows lead to its exit. No interaction action is available or needed to start the arrival.
3. Reaching the exit while grounded starts the automatic arrival once. David walks out of the pasture; an opaque transition switches locations; he then walks through Jesse's household gate. Movement and interaction controls are hidden, while Pause and Restart remain available.
4. The camera eases into the follow view, then control returns near Jesse. Speak with Jesse and Take provisions remain the existing separate actions. The carried road journey, discovery, Elah survey and first checkpoint retain their order.

The arrival's authored duration is 7.1 seconds, excluding pauses. The guided player walk measured **6.433 s desktop, 6.451 s portrait and 6.406 s landscape** with the recorded inputs. Players can still stop or explore.

## Implementation boundaries

The [world factory](../../apps/playcanvas/src/world/shepherd-world.ts) now owns separate `Flock pasture scene` and `Jesse household scene` roots with location-specific collision bounds. Only one cast/prop group is active. The inexpensive rural landscape and existing character assets are reused; no second engine or new downloads are required. The household has a short approach path through its actual gate. The flock/trough/keeper/messenger are absent from the courtyard, and recurring sheep sounds stop there.

[courtyard-arrival.ts](../../apps/playcanvas/src/gameplay/courtyard-arrival.ts) defines the exit, opaque hold and bounded automatic walking path. [shepherd-opening.ts](../../apps/playcanvas/src/world/shepherd-opening.ts) coordinates `pasture_path` and `courtyard_arrival` stages using the existing paused audio clock, distance-matched imported walk cycle and camera. Scene coordinates change only behind the opaque transition. The [Chapter 1 coordinator](../../apps/playcanvas/src/app/valley-main.ts) supplies appropriate walking/automatic-arrival instructions.

Arrival clears held movement rather than replaying it when control returns. Restart resets the location, fade, arrival count, input and jump state to the pasture. Existing character appearance, dialogue, provisions, six chapters, objective IDs and save schema are unchanged. Chapter 1's first durable checkpoint remains the Elah survey; this scene transition does not silently create a new checkpoint.

## Verified results

**PASS:** production build/typecheck; arrival timeline, story/save and shared-input rule checks; actual Chrome desktop and emulated portrait/landscape browser tests.

- [Desktop results](evidence/pasture-arrival-2026-11-16/desktop-results.json): guided path, automatic movement without Interact, imported rig deformation, pause on both sides of the scene switch, restart from an incoming courtyard shot, no held-W leakage, Jesse's one-action errand and provisions pickup. The normal run continues through the road, discovery, Elah introduction and survey, saves `valley.surveyed`, enters Chapter 2 and reloads the same saved run.
- [Mobile results](evidence/pasture-arrival-2026-11-16/mobile-results.json): real CDP touch-stick movement at 390 × 844 and 844 × 390; route arrows, automatic arrival, pause/resume, actual walking animation, control return, Jesse and carried provisions. Portrait additionally restarts from the pasture path. Isolated review mode leaves normal saves unchanged.
- Mobile frame traces in the individual [portrait](evidence/pasture-arrival-2026-11-16/portrait-result.json) and [landscape](evidence/pasture-arrival-2026-11-16/landscape-result.json) records verify that both locations are never visible together, the incoming location first appears under opacity 1, and David's head/feet remain in the camera during the revealed arrival walk.
- [Arrival rules](../../apps/playcanvas/tests/courtyard-arrival-check.cjs) verify the opaque hold, exact destination, monotonic bounded walk, physical gate opening and sampling at 120/60/30/20 Hz. Existing episode/save and action-router checks passed.

[Browser runner](../../apps/playcanvas/tests/pasture-arrival-browser.cjs) uses real inputs and normal clocks with no seeded checkpoint or runtime state repair. [Frozen export hashes](evidence/pasture-arrival-2026-11-16/candidate-manifest.json).

Actual captures: [pasture without courtyard](evidence/pasture-arrival-2026-11-16/desktop-separate-pasture.png), [guided path](evidence/pasture-arrival-2026-11-16/desktop-guided-path.png), [automatic gate arrival](evidence/pasture-arrival-2026-11-16/desktop-automatic-gate-arrival.png), [portrait arrival](evidence/pasture-arrival-2026-11-16/portrait-automatic-gate-arrival.png), [returned control](evidence/pasture-arrival-2026-11-16/portrait-courtyard-control-return.png), [Chapter 2 save/reload](evidence/pasture-arrival-2026-11-16/desktop-camp-save-reload.png).

This pass verifies the changed opening through Chapter 2 entry. It does not claim a new complete six-chapter regression or physical-phone GPU performance; the earlier full episode results remain recorded against the prior candidate. The old 4199 opening runner describes the former contiguous map. Use this arrival runner for the revised Chapter 1 flow. Creative approval remains separate from technical verification.

## Review

[Play the revised opening](http://127.0.0.1:4200/valley.html?review=1), leaving saved episode progress unchanged. Select Begin, watch the messenger, then follow the arrows. Arrival starts automatically at the end of the pasture path; Speak with Jesse appears after it finishes.

```powershell
npm.cmd --prefix apps/playcanvas run preview -- --outDir ../../build/playcanvas-pasture-arrival --host 127.0.0.1 --port 4200 --strictPort
```

No external assets, dependencies, deployment, commit or push. The previous 4199 candidate remains intact.
