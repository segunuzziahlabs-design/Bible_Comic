# B04 reusable contextual interaction plan

Prepared 9 November 2026 before implementation, under the owner's explicit request to proceed with B04. Preserve the existing village, original assets and three-objective proof journey. This task does not approve final art, physical-device performance or G1/G2.

## Implementation sequence

1. Add an instanced `Interactable` Node3D with an ID, action/event ID, prompt, range, focus point, optional own collider and per-instance enabled/busy/consumed state. One-shot pickups reserve before dispatch and consume only on acknowledged success. Repeatable characters can be spoken to again without repeating accepted story transitions.
2. Add a reusable `Interactor` component. Configure it with one player and an explicit local target list, without global groups or singleton state. Select the nearest available target using 3D range and line of sight. Recheck immediately on activation; ignore disabled, hidden, freed, queued-for-deletion, busy and consumed targets. Use deterministic tie-breaking and a short input debounce. Allow the target's explicitly designated collider as the first ray hit, but never an intervening wall.
3. Instance targets at existing Jesse/provisions/gate anchors in both village and courtyard. Drive target availability from the proof state: provisions after Jesse, gate after collection. Keep narrative/state changes in the proof controller. Route keyboard, mouse and touch through the same interaction request, clear stale prompts during modal states, and reset target reservations/consumption together on restart.
4. Present the selected target's authored prompt through the existing UI button. Include the desktop E hint and retain touch-sized action buttons. Unavailable/occluded targets have no actionable prompt. Keep broader responsive UI work in B05.
5. Verify generic fixtures and both integrated worlds: range/height boundaries, obstruction including a ray starting inside a wall, an object's own collider, visibility/availability changes, deterministic choice, stale selection, duplicate/reentrant requests, rejected actions, one-shot consumption, repeatable conversations, pause/dialogue and restart. Re-run all existing engine suites and clean-copy export/package checks.
6. Exercise the exported village with Chrome/Edge keyboard/mouse and touch emulation. Add checks for locked actions, prompt disappearance/reappearance, repeated requests and one accepted event per objective. Inspect portrait/landscape prompts and save build identity, logs, source hashes and screenshots. Update task records and workbook without changing baseline dates/estimates or historical evidence.

## Acceptance and ownership

- Components contain no Jesse/provisions/gate-specific rules; adding a configured local target requires no detector edit.
- Only a currently eligible in-range visible target can dispatch. A stale prompt cannot bypass a new wall, state change, movement or pause.
- One activation is reserved before dispatch. Reentrant requests and rapid repeated input cannot duplicate it. Failed/rejected actions remain retryable; successful one-shot actions remain consumed until restart.
- Jesse dialogue, pickup, gate completion and restart work through browser input. Accepted story transitions remain ordered and idempotent.
- Context text and action buttons remain visible/reachable in desktop and emulated phone layouts. Actual phone usability remains unverified until Segun tests physical devices.
- Assistant owns implementation/local verification; Segun owns physical-device usability and acceptance review. Record B04 as Partially implemented while the target-phone criterion/G2 remain open.

## Limits and risks

Use a small explicit target list and simple physics queries appropriate to this village, without adding inventory, a global event bus, quests, backend services or new story content. The owning controller must acknowledge each request; delayed dialogue stays busy until resolved or reset. Target availability is separate from player input state, and the controller must synchronise both before each attempt. A prompt is guidance, not authority to mutate progression.

B04's original 2–3 November baseline has passed; execution is recorded on 9 November. The full-episode candidate needs reforecasting as already recorded for B03. No commit, push or deployment is part of this task.
