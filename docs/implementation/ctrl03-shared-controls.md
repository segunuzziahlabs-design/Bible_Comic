# CTRL-03 — shared action controls in the game

16 November 2026 · [Authorised integration plan](../controls/ctrl03-integration-plan.md) · [Approved layout and later mechanics](../controls/player-control-design.md)

**Subsequent CTRL-04 update:** [real jump motion and animation](ctrl04-jump-movement.md) now run on port 4197, with Space Jump / Shift Dodge. This document preserves the CTRL-03 candidate and its historical Space alias.

## Result and current boundaries

The actual playable Chapters 1–5 now share the same input adapter for movement, look/aim and named gameplay actions. Desktop displays functional WASD buttons. Touch defaults to the left thumb stick. The movement gear opens a pause-aware panel for choosing a stick or direction keys and WASD/arrow labels. Preferences use `bible-comic.controls.v1`, separate from episode saves.

The original scene handlers still decide whether an interaction, throw or dodge is valid. The new router does not advance objectives or write story saves. Chapter 6 is an authored conclusion without playable locomotion; its existing cinematic controls remain unchanged. Original modelling, animation, physics, camera and spear behaviour are retained, except for making battle-reset input respect the cinematic state.

| Live action | Input |
| --- | --- |
| Move | WASD/arrows; hold the visible direction buttons or drag the left stick. Diagonals normalised. |
| Look / aim | Mouse/drag; IJKL aim remains available in practice/battle. |
| Contextual action | E or the nearby Speak/Take/Deliver/Inspect action. |
| Sling | F, a mouse click in the aiming view, or Throw. Touch aiming does not automatically throw. |
| Dodge | Shift, Space or Dodge. Space is the compatibility alias until CTRL-04 introduces real Jump. |
| Pause | Escape or Pause; Resume clears previous input. |

Jump and Jump Shot remain CTRL-04/CTRL-06 work. There is no inactive Jump button presented as a working feature. **Goliath retains his spear.** The existing three-evasion sling gate, lethal defeat, Retry Battle and fixed story outcome remain.

## Engineering changes

- [action-router.ts](../../apps/playcanvas/src/gameplay/action-router.ts): named held/actions, independent source ownership, normalised analog/keyboard combination, availability gates and subscriptions. Multiple forward sources do not double speed; releasing one source cannot release another.
- [movement-input.ts](../../apps/playcanvas/src/gameplay/movement-input.ts): keyboard, pointer, stick, visible direction and action-button adapters. Gameplay requests share one route instead of synthetic keyboard events. Edge-triggered keys reject repeats; pointerup/compatibility clicks cannot double-trigger. Cancelled pointer actions cannot fire later after restart. Text fields, select menus, dialogs and browser modifier shortcuts are excluded.
- [player-controls-ui.ts](../../apps/playcanvas/src/app/player-controls-ui.ts) and [CSS](../../apps/playcanvas/src/app/player-controls.css): reusable movement console, key illumination, independent pointer controls, preference validation/defaults, settings focus loop and cancellation. Visible key targets are at least 44 px; right-side actions remain separated from the movement cluster. Input enablement controls visibility during entry, cinematics, pause and results.
- [Chapter 1](../../apps/playcanvas/src/app/valley-main.ts), [Chapter 2](../../apps/playcanvas/src/app/camp-main.ts), [Chapter 3](../../apps/playcanvas/src/app/challenge-main.ts), [Chapter 4](../../apps/playcanvas/src/app/preparation-main.ts) and [Chapter 5](../../apps/playcanvas/src/app/duel-main.ts) register handlers with the shared adapter. Their duplicate keyboard listeners and separate gameplay-button listeners are removed. Sound, start, retry/save and navigation keep their existing roles.
- [movement-area.ts](../../apps/playcanvas/src/world/movement-area.ts): reset enables movement only in a playable battle phase. The duel keeps Dodge available alongside the unlocked sling. Help and touch instructions identify the supported controls.

No dependencies, game assets, cloud services, schemas or production settings were changed. Earlier frozen builds and owner progress remain preserved.

## Verification record

**Final result: PASS.** Production build/typecheck, router checks, story/save rules, four foundation layouts, three chapter interaction cases and three battle layouts passed. CTRL-03 is implemented and technically verified; owner review of the integrated play experience remains separate from the already approved layout.

The [browser harness](../../apps/playcanvas/tests/ctrl03-browser-check.cjs) drives the production browser export with real keyboard, mouse and CDP touch events. Its explicit chapter/practice review fixtures are identified below; it does not seed earned results, advance clocks or repair game state to make actions pass.

| Check | Required evidence |
| --- | --- |
| Build/typecheck | Successful production build, `build/ctrl03-build.log`. Existing large-engine-chunk warning remains. |
| Router and story/save rules | [Router checks](../../apps/playcanvas/tests/action-router-check.cjs) and existing `npm.cmd --prefix apps/playcanvas run test:story`. Source ownership, diagonal/analog combination, disabled action gates, pause, cue/order/save/retry rules. |
| Practice/controls | [Foundation results](evidence/ctrl03-2026-11-16/foundation-results.json): desktop, 390 × 844, 844 × 390 and 320 × 568; physical/virtual ownership, settings focus/preferences, two-thumb movement/aim/throw, one action per tap, cancelled/restarted action, pause and resize/rotation cancellation. Explicit practice review shortcut; no chapter-progress write. |
| Opening/camp/challenge | [Chapter results](evidence/ctrl03-2026-11-16/chapters-results.json): fresh automatic flock/messenger opening, explicit Camp/Challenge review entries, hidden cinematic controls, clean handoff, actual movement, preferences, pause and one accepted contextual interaction in each chapter. |
| Duel | [Battle results](evidence/ctrl03-2026-11-16/battle-results.json): desktop, portrait and landscape; actual approach/challenge, three earned physical evasions, sling lock/readiness, move/throw, miss and verified forehead hit. Desktop also exercises lethal defeat and Retry Battle in the final integration run. Explicit prepared Chapter 5 review fixture. |

The final status of each run is its JSON `status`, not the mere presence of a screenshot. The handover is completed only after the required runs pass. Desktop/portrait/landscape captures in this directory show the actual rendered game and controls. An earlier `portrait-failure.png` is diagnostic history, not final acceptance evidence.

The touch checks found and fixed an inherited CSS rule that kept the practice joystick visible over direction keys. A regression assertion now requires it to be hidden in key mode. Early harness runs also corrected the CDP secondary-contact release convention and waited for the next rendered inspection sample after pause. Those harness failures are not claimed as passing runs. Cancellation was additionally hardened against a held action being released after restart.

One intermediate repeat timed out during the voiced Chapter 5 handoff; the first diagnostic version captured a screenshot but no audio-clock state, so its cause is unconfirmed. The subsequent unchanged-mechanics repeat passed desktop (including actual defeat/Retry Battle), portrait and landscape through real hits. No story time, state repair or automatic recovery was injected. Keep that isolated timeout in the CTRL-07 regression watchlist; it is not a diagnosed or silently repaired audio defect.

These are browser-emulated responsive/input checks, not physical-device performance or a new loading/frame-pacing baseline. This pass does not replace CTRL-07's complete fresh six-chapter/first-time-player regression or establish final visual/animation acceptance. Changing movement mode stores a preference; it does not alter earned progress. Legacy standalone fixtures retain the backward-compatible movement-input API but are not all replayed in this task.

## Review and reproduction

- [Complete episode entry](http://127.0.0.1:4196/episode.html): Begin episode, then Begin Chapter 1. The messenger arrives automatically; controls appear after the summons.
- [Immediate control/practice review](http://127.0.0.1:4196/preparation.html?review=1&practice=1): an explicitly prepared practice fixture that leaves saved episode progress unchanged. Start sling practice, then use the movement gear to switch layouts.
- [Candidate manifest](evidence/ctrl03-2026-11-16/candidate-manifest.json): package file hashes/sizes. File total is an inventory, not measured network transfer.

Both views are open in new in-app browser tabs. The episode is left at Begin Chapter 1, preserving its automatic opening. The practice fixture is already playing with the actual WASD console. Holding its on-screen Move right for 400 ms moved David from `(0, 1.55)` to approximately `(0.87, 1.49)` in the rendered game: [DOM-backed observation](evidence/ctrl03-2026-11-16/in-app-movement.json) · [in-app screenshot](evidence/ctrl03-2026-11-16/in-app-practice-controls.png). Previous owner tabs were not reset or navigated.

```powershell
npm.cmd --prefix apps/playcanvas run preview -- --outDir ../../build/playcanvas-ctrl03 --host 127.0.0.1 --port 4196 --strictPort
```

Run the browser harness with the bundled Playwright module path, origin, evidence directory and suite (`foundation`, `chapters` or `battle`) as arguments. Router tests run with `node apps/playcanvas/tests/action-router-check.cjs`.

Next separate task: **CTRL-04**, real grounded/airborne/landing movement, authored jump clips, obstacle clearance and follow-camera validation. Keep Space's existing Dodge alias until that task switches the complete map and help together. CTRL-05 then validates airborne spear collision, and CTRL-06 adds the cinematic jump shot.
