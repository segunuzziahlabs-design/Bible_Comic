# CTRL-04 — jump motion and performance

16 November 2026. Owner authorises real David jumping, takeoff/airborne/landing animation, Space Jump / Shift Dodge, and browser movement/camera checks in portrait and landscape. [Control design](player-control-design.md) · [CTRL-03 baseline](../implementation/ctrl03-shared-controls.md).

## Implementation order

1. Author three original in-place performances on the existing teenage David skeleton in Blender: anticipation/push-off, airborne tuck/extension and landing/recovery. Export a shared animation resource; retain the existing models, appearance slots and story clips. Save editable source and inspect the result in the actual browser.
2. Add one reusable jump motor: grounded → takeoff → airborne → landing → grounded, gravity/root height, single request per press, no mid-air repeat. Preserve directional movement with modest air control. Use terrain grounding, existing solid wall/boundary collision and explicit overhead clearance; do not introduce climbing or jumping across episode boundaries. Physics supplies root height exactly once. Pause freezes the arc; restart/cinematic handoff/defeat reset transient jump state without changing saves.
3. Integrate the motor and clips with Chapters 1–5's actual playable controllers and follow cameras. Gate interactions, dodging and ordinary throwing while the jump performance is active; the authored jump shot remains CTRL-06. Keep captions, carry props, existing animation/camera transitions and grounded battle rules intact.
4. Switch the complete live input map and help together: Space Jump, Shift Dodge. Add the actual contextual Jump button to the approved right-side layout, with readiness driven by the motor. Keep independent touch movement/aim/action ownership. Do not offer jump controls during cinematic/paused/result states.
5. Build a separate local candidate. Test standing/moving jumps, one request while held, recovery, wall/roof clearance, uneven ground, cancellation, pause/restart and follow-camera framing. Test keyboard/mouse and real emulated multiple touch contacts in portrait/landscape and small layouts; capture animation stages and video where practical. Recheck Shift Dodge and the existing sling flow.

## Acceptance and boundaries

- David visibly anticipates, leaves the ground, changes airborne pose and lands with recovery in the actual game. Imported tracks animate the existing skeleton; a root-height change alone is insufficient evidence.
- Exactly one physical arc per accepted press; no double jump, repeated jump while holding Space, wall escape or head-through-roof behaviour. Ground/landing returns without a developer repairing state.
- Camera follows smoothly and retains David in portrait and landscape, without doubling vertical motion or clipping into a roof. Movement remains available during the flight, with controlled turning.
- Pause/resume preserves the same arc; restart/transition/defeat cancel it. Jump does not complete objectives, consume stones or alter saved checkpoints.
- Space never dodges, Shift never jumps; on-screen Jump uses the same action and availability gate as Space. Browser layouts retain at least 44 px targets and separate left/right controls.
- Typecheck/build, focused motor/router tests, story rules and browser checks pass, with real screenshots and honest limitations.

CTRL-05's swept 3D spear/capsule collision is separate. In this pass, the retained conservative spear hit rule still applies to an airborne David: jumping grants no immunity, safe-jump promise or evasion credit. Shift Dodge remains the supported spear defence. No new battle choreography, Jump Shot, episode, authentication, deployment, commit or push.

**Outcome:** implemented and technically verified. [Handover, actual browser recordings and results](../implementation/ctrl04-jump-movement.md). Owner review remains pending.
