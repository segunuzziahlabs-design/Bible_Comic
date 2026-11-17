# B02 movement and camera implementation plan

29 October 2026. Written before implementation. The owner explicitly requested B02 after the [B01 foundation](b01-foundation-2026-10-29.md). This authorises local controller/camera work; physical-phone results and the G1 release decision remain outstanding.

## Result and scope

Strengthen third-person movement, collision and mouse/touch camera control in the existing courtyard. Preserve its three-objective flow and original art. No new story, village expansion, jumping, sprinting, camera settings screen, backend, deployment, commit or push is planned.

## Implementation sequence

1. Keep the B01 player/input contracts. Clamp movement at the controller boundary, configure grounded slope handling, use vector acceleration/deceleration, and derive walk animation from actual displacement. Stop movement immediately when disabled; resets restore facing and clear velocity.
2. Extract a reusable camera scene/script. Own yaw/pitch and viewport framing there. Sweep a small sphere from the player focus to the camera, retract immediately at obstructions, and ease only the safe boom length outward. Test initial overlap explicitly because a motion cast ignores starting overlaps. Hide David's visual only when the camera is too close; restore it on clearance/reset. Reuse query objects; avoid new visual effects.
3. Tighten input ownership: clearing/deactivating input cancels every gesture, releasing another mouse button must not cancel a held left-button look, and a mouse move with no left button must end stale look. Clear movement/look on window exit, focus loss, resize, modal transitions and recovery. Keep both touch fingers independently usable.
4. Wire the rig into the proof controller; keep read-only diagnostics for input, velocity, grounding, pitch and camera obstruction. Restart/recovery snap the camera to the safe spawn immediately. Add collider coverage for solid architectural trim where its visible dimensions exceed existing collision.
5. Add a headless physics fixture suite for equal diagonal speed, camera-relative travel, acceleration/stopping, walkable slopes and steep rejection, wall sliding/corner escape, camera corner clearance and immediate retraction, reset and touch/mouse lifecycle cases. Retain existing state/foundation suites.
6. Run clean-copy import, suites, startup, release export and PCK inspection. Exercise the actual exported build using keyboard/mouse and touch emulation: ordered journey/restart, camera pitch limits/wall approach, pause during movement, resize/focus/cancel and control reacquisition. Inspect screenshots. Save dated logs, build identity and source hashes separately from B01 evidence.
7. Update task records and the workbook consistently. B02 is partial until physical keyboard/mouse/touch usability and target-device/G1 acceptance are recorded; automated local checks do not establish minimum mobile support.

## Acceptance and dependencies

- B01's local scenes/contracts and pinned Godot 4.7.2 are available. G1/device baselines remain open; work stays within the authorised courtyard.
- At 60 Hz, full diagonal input must not outrun straight movement; the player must traverse a representative 20-degree ramp in both directions, remain still on it without input, reject a 60-degree incline, slide along walls and escape a concave corner by reversing input. These are engineering fixture cases, not a promise for every future terrain mesh.
- Pausing/disabling, lost focus, resize and recovery must leave no stale movement/look; independent move/look touches must recover after cancellation.
- The camera stays outside solid fixture walls/roof/corners at both framing modes, obeys pitch limits and restores its normal distance after leaving an obstruction. Camera rotation is bounded numerically and reset is coherent with spawn.
- The exported courtyard still completes from entry through Jesse, provisions, gate and restart. Browser tests must name the exact export and use input events rather than a gameplay state-setting API.
- Original DOCX, GLB, Blender and audio assets remain unchanged. Historical evidence remains intact. No performance/minimum-device or human-usability claim is made from desktop emulation.

## Verification record

Results will be recorded in `b02-movement-camera-2026-10-29.md` and `evidence/b02-2026-10-29/` after execution. Numerical movement/camera tuning remains adjustable after real-device playtesting.

The camera query follows the documented [Godot shape-cast overlap limitation](https://docs.godotengine.org/en/4.5/classes/class_physicsdirectspacestate3d.html#class-physicsdirectspacestate3d-method-cast-motion); actual behavior will be tested with the pinned engine.
