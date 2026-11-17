# CTRL-03 — shared controls integration

16 November 2026. The owner approved the control layout and authorised CTRL-03, including browser verification in portrait and landscape. [Approved design](player-control-design.md) · [Previous opening handover](../implementation/automatic-opening-and-control-design.md).

## Scope and sequence

1. Introduce a named-action router beneath the existing movement-input API. Keep physical keys, virtual direction buttons and analog stick sources independent. Combine and normalise movement once; release one source without cancelling another. Edge-trigger actions and clear sources on pause, blur, visibility, resize, pointer cancellation, restart and cinematic handoff.
2. Route production Chapters 1–5 movement, aim, contextual interaction, sling, dodge and pause through the shared input adapter. Reuse current scene handlers and availability checks. Keep original chapter/session/save and weapon behaviour. Preserve legacy fixture callers of the movement-input API.
3. Mount one reusable on-screen control component in the playable chapters. Desktop defaults to functional WASD keys; touch defaults to the existing left stick, with optional direction keys and WASD/arrow labels. Store these preferences separately from episode saves. Use independent pointers for movement, aiming and action buttons. Hide movement during cinematic/paused/entry/result states. Provide a pause-aware movement settings panel.
4. Keep existing contextual actions right of the scene and preserve throw/dodge readiness. Shift becomes a Dodge shortcut; Space remains its compatibility alias until CTRL-04 implements real Jump. Update player help accordingly. Do not expose Jump or Jump Shot before they work.
5. Build a new local candidate without replacing earlier builds or owner progress. Verify actual character movement and actions, keyboard/virtual source ownership, input cancellation, settings focus, cinematic handoff, pause/restart, simultaneous movement/aim/throw and dodge/retry. Inspect responsive captures in portrait and landscape, including compact layouts.

## Acceptance and evidence

- Movement console visibly moves David in the actual rendered game; diagonal movement remains normalised. Physical W survives virtual W release. Pointer cancellation cannot leave a direction held.
- Two real emulated touch contacts can hold movement and aim/throw or Dodge independently. Each action executes once per tap; releasing the action does not release movement.
- Control preferences survive reload/chapter changes without altering chapter progress. Select fields, dialogs and browser shortcuts do not drive David.
- Cinematics hide the movement console and reject gameplay input; control returns without stale movement or a queued action. Pause/resume/restart and Retry Battle clear input.
- Production build/typecheck, focused router tests, story rules and browser checks pass. Record screenshots/results and limitations. Emulation establishes responsive controls, not physical-phone performance.

No deployment, commit, push, new story content, jump physics, new animations, ranged weapon changes or authentication work. CTRL-04 remains the next separate task after this integration review.

**Outcome, 16 November:** implemented and technically verified. [Handover, browser results and current review links](../implementation/ctrl03-shared-controls.md). Owner acceptance of the integrated experience remains pending.
