# Separate pasture and Jesse courtyard scenes

16 November 2026. Owner requests a guided player walk out of the flock area, followed by automatic movement showing David arrive at Jesse's courtyard. [Previous candidate](../implementation/encounter-and-route-polish.md) remains frozen on port 4199.

## Scoped implementation order

1. Separate the pasture cast/props and Jesse household into independently activated scene roots. Reuse the existing landscape/rig resources; never render the flock and household together. Switch collision bounds with the location. Keep courtyard and onward road coordinates local to their existing scene so dialogue, provisions and the Elah journey need no rewrite.
2. After the automatic messenger exchange, return control for a roughly 5–10 second walk along the visible pasture path. Route arrows lead to a path exit, not directly to Jesse. Entering the exit radius while grounded starts arrival automatically; there is no interaction key or queued Speak action.
3. Author a short arrival timeline: David walks off the pasture path, an opaque transition switches the scene, then he walks through the household gate towards Jesse. Reuse the distance-matched walk cycle, camera easing and normal audio clock. Hide movement/interaction during the performance; retain Pause and Restart. Return control only after the arrival and camera handoff. Keep Speak with Jesse and Take provisions as separate existing actions.
4. Reset location, transition opacity, transient arrival/input/jump state and props on restart. Pause must freeze the arrival and fade. Preserve the automatic flock/messenger opening, courtyard errand, carried provisions, road discovery, six chapters and existing first-survey checkpoint/save schema.
5. Freeze a separate production export on port 4200. Verify in actual Chrome desktop and emulated portrait/landscape: distinct visible areas, route arrows and walking duration, automatic arrival without E/tap, actual root movement through the gate, pause/resume across transition, no held-input leakage, restart from both locations, and the complete courtyard/road/Elah survey plus normal save/reload into Chapter 2. Run build/typecheck and existing story/input rules. Capture both scenes, arrival and result records.

No new voices, external assets, dependencies, backend, deployment, commit or push. Browser results and limitations belong in a separate handover; source inspection alone does not verify the arrival performance.
