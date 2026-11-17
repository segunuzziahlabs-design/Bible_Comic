# B04 reusable contextual interactions

9 November 2026. **Partially implemented:** reusable interaction components are integrated and locally verified. Physical target-phone usability and G2 acceptance remain open. This work follows the owner's explicit request and the [implementation plan written first](b04-interaction-plan.md). G1, final art/content and full-episode acceptance are not inferred.

## Result

Jesse, the provisions and the gate now use instanced interaction targets. Prompts come from each target, including `E · Speak to Jesse` on desktop and `Speak to Jesse` on touch. A target outside range, hidden behind solid geometry, disabled, busy or already consumed offers no actionable prompt. The existing disabled “Follow the marker” guidance remains when no action is available.

The detector rechecks the target at activation, so movement or a changed obstacle cannot leave a stale prompt that bypasses validation. Requests reserve the target before dispatch; repeated input is debounced for 0.25 seconds. Pickups consume only after the story controller accepts the event. Jesse remains repeatable, with the first completed dialogue advancing the story once. Restart clears pending dialogue, consumption, request counts and story state together.

The village layout, original assets and three-objective sample remain the same. This task adds reusable interaction, not the full dialogue/quest engine or additional narrative.

## Component contracts

| Component | Responsibility | Public interface |
|---|---|---|
| [interactable.tscn](../../scenes/interaction/interactable.tscn) / [script](../../scripts/interaction/interactable.gd) | Target identity, authored prompt/range/focus point, enabled/busy/consumed state, optional explicitly designated own collider | `is_available()`, `focus_position()`, `own_collider()`, `begin_interaction()`, `finish_interaction(accepted)`, `reset_interaction()` |
| [interactor.tscn](../../scenes/interaction/interactor.tscn) / [script](../../scripts/interaction/interactor.gd) | Nearest eligible local target, 3D range, line of sight, input debounce and request dispatch | `configure(player, candidates) -> bool`, `step(delta)`, `refresh()`, `attempt() -> bool`, `suspend()`, `reset_interactions()`, `interaction_requested(target)` signal |
| [Proof controller](../../scripts/proof/courtyard_proof.gd) | Availability by story stage, narrative responses, accepted story events, modal lifecycle and target acknowledgement | Synchronise availability before detection/request; acknowledge pickup/gate immediately, Jesse after dialogue; reset with story state |
| [Village](../../scenes/world/village.tscn) / [courtyard](../../scenes/world/courtyard.tscn) | Editable target placements at existing anchors | `interaction_targets()` returns local anchor children; detector filters for the interactable script |
| [Existing UI](../../scripts/ui/game_ui.gd) | Display selected prompt and enable/disable action button; keyboard/mouse/touch presentation | Existing `set_context` and action/continue signals; wider UI work remains B05 |

No target ID or biblical-story rule is embedded in the detector or target component. Equal-distance targets use stable ID ordering. Range is measured between actor/target origins in 3D metres, with an inclusive boundary. Ray endpoints use configurable local focus offsets. Physics layer 1 blocks by default; the actor's own collider is excluded. The target's explicitly designated collider may be the first hit, but an intervening wall still blocks. `hit_from_inside` is enabled for solid shapes as documented in the [official Godot ray-query API](https://docs.godotengine.org/en/stable/classes/class_physicsrayqueryparameters3d.html).

Configuration rejects empty/duplicate target IDs and ignores unrelated nodes. It fails closed with no candidates on a duplicate. Freed, deletion-queued, hidden and other-physics-world targets cannot activate. Targets are local instances; there is no global registry or singleton story state.

### Adding a target

1. Instance `scenes/interaction/interactable.tscn` under the world's `Anchors`, or supply it through that world's local target list. Set a unique `interaction_id`, authored prompt, range and focus point. Place its origin at the interaction location. Keep character/object visuals independent as needed.
2. If the ray must end on its own solid body, assign `own_collider_path` relative to the target. Do not designate unrelated occluding geometry. Hide/disable the target when its visual or action is unavailable; hiding only a separate model does not automatically disable an anchor.
3. Let the owning story/controller set availability and handle the request. Its `event_id` is data for that owner, not an event the detector automatically applies. Every handler must call `finish_interaction(true/false)` exactly once, immediately or after its modal/async operation. Unknown actions are rejected by the proof controller. An unresolved request deliberately stays busy until acknowledged or reset.
4. Register added targets through `configure`, check its return value and rerun range/obstruction plus exported gameplay checks. Configure a detector per player/session; sharing a target between multiple players is outside this single-player contract.

## Executed verification

Evidence: [result.json](evidence/b04-2026-11-09/result.json), [source fingerprints](evidence/b04-2026-11-09/source-sha256.json) and [saved logs/screenshots](evidence/b04-2026-11-09/).

| Executed verification | Result |
|---|---|
| Fresh copied project | Import, startup, release export and PCK dependencies/source exclusions passed without the working cache |
| Proof / foundation / movement-camera suites | 17 / 24 / 35 checks passed |
| Reusable interaction suite | 58 checks passed |
| Village suite | 26 checks passed; 5272 physics steps; no sampled camera overlaps |
| chrome-desktop / 156.0.8078.80 | 35 checks passed; no captured browser/script/request errors; build manifest unchanged during run |
| chrome-touch-emulation / 156.0.8078.80 | 41 checks passed; no captured browser/script/request errors; build manifest unchanged during run |
| msedge-desktop / 157.0.4341.42 | 35 checks passed; no captured browser/script/request errors; build manifest unchanged during run |
| Source preservation | Original GLB/audio/Blender and both DOCX hashes unchanged |

Final passing runs: **160 engine checks and 111 browser checks passed**.

First touch run read the quality-toggle diagnostics too early after a fixed 400 ms delay. Its final state and screenshot already show Extra light / 0.75 scale. Changed only that assertion to await its predicate. Runtime/build unchanged. Chrome desktop passed before this wait change; touch and Edge used the updated harness. Failed touch report, screenshot and earlier harness are retained.

| Export file | Bytes | Gzip bytes |
|---|---:|---:|
| index.js | 279,815 | 69,464 |
| index.pck | 136,688 | 96,642 |
| index.wasm | 39,514,754 | 10,263,606 |

Gzip file sizes are local package measurements, not load-time or network-budget acceptance. The unchanged engine runtime dominates delivery size.

| Local end-of-run samples | FPS range | Draw-call range | 3D scale |
|---|---:|---:|---|
| chrome-desktop | 32–32 | 47–47 | 0.666666686534882 |
| chrome-touch-emulation | 32–32 | 77–77 | 0.75 |
| msedge-desktop | 27–32 | 47–47 | 0.666666686534882 |

These short end-of-run observations are not a sustained-play benchmark or a performance gate pass. Screenshots taken earlier can show different instantaneous FPS/quality settings. Desktop observations below the proposed 30 FPS floor require profiling on the agreed physical baseline; a passed functional journey does not waive that requirement.

[Interaction fixtures](../../tests/interaction_checks.gd) cover arbitrary targets without story rules, closest/tie selection, range/height, hidden/disabled targets, walls and inside-wall rays, own-collider handling, stale position/availability, reservation/reentrancy, rejection, duplicate acknowledgement, one-shot/repeatable behaviour, suspension, freed targets, separate physics worlds and duplicate IDs. Integration checks run the ordered story flow and modal/reset cases in both worlds. The existing village route suite still walks the actual player; its manually stepped fixture now also advances the interaction debounce clock.

The browser harness uses actual keyboard/mouse/touch-emulated input. It verifies locked provisions/gate, out-of-range input, prompt appearance/disappearance, readable action/button bounds, ordered accepted events, repeated pickup rejection and reset, alongside previous movement/camera/route/audio checks. Generic obstruction cases execute in engine fixtures; they are not claimed as separate real-phone or browser-obstacle sessions. Browser diagnostics are read-only observations, not gameplay shortcuts.

Reproduce with:

```powershell
.\tools\check-foundation.ps1 -EvidenceTask b04
.\tools\export-proof.ps1
python .\tools\serve-proof.py
```

With Node and Playwright available: `tools/browser-proof-check.cjs <playwright-module-path> chrome desktop build/verification/b04/browser`, then `chrome touch` and `msedge desktop`. Package inspection explicitly requires both interaction scenes/scripts. Historical B03 and earlier evidence is unchanged.

## Remaining acceptance and handover

Review the [local browser sample](http://127.0.0.1:8060/) while the server runs. Physical Android/iPhone prompt legibility, reachable actions, browser bars/safe areas and human understanding still need Segun's device sessions. Automated emulation does not establish those results or a minimum-hardware performance pass. B05 remains responsible for broader responsive entry/help/loading/error/pause UI.

Original B04 dates (2–3 November) and estimates remain the planning baseline; actual execution is 9 November. The previously recorded full-episode schedule reforecast is still required. No assets were regenerated, and no commit, push or deployment was performed.
