# Chapters 4–5: direct player controls

Subsequent update: Segun explicitly authorised [Chapter 6 — Victory](m3-chapter-06.md). Its newer port 4189 candidate retains these revised controls and connects the confirmed battle outcome to the produced conclusion. The earlier port 4188 controls candidate below remains frozen.

12 November 2026. Segun asked to polish sling practice and the duel because the actions were difficult to discover and David did not feel directly controllable. [Scoped plan](m3-controls-polish-brief.md). Chapter 6 remains on hold for the owner's review.

[Try sling practice immediately](http://127.0.0.1:4188/preparation.html?review=1&practice=1) · [Play Chapter 5](http://127.0.0.1:4188/duel.html?review=1) · [Full Chapter 4](http://127.0.0.1:4188/preparation.html?review=1).

## Player controls

| Action | Desktop | Touch |
| --- | --- | --- |
| Move David | WASD or arrows | Left movement stick |
| Aim during practice/fight | Point the mouse at the target; no held drag required | Drag the game view with the other thumb |
| Throw | Primary click in the game view, F or Throw button | Throw button, including while holding the stick |
| Dodge in battle | Space, or Dodge button; hold a movement direction to choose the dodge | Hold a stick direction and tap Dodge |
| Dodge without a direction | Short sidestep right | Short sidestep right |
| Help | Controls; Back to game returns to play | Same |
| Practice exit | Leave practice; Start sling practice re-enters | Same |

I/J/K/L remain optional keyboard aim adjustments. **Space now dodges in Chapter 5; F throws in both produced chapters.** Earlier frozen fixtures retain their original controls. Clicking interface buttons does not fire a stone, dragging the mouse does not release one, and a touch aiming gesture does not automatically shoot.

## Problems addressed

Actual inspection of the older browser preview found the player at the brook with all five stones, a camera facing away from the target, a five-metre “follow the marker” instruction and no immediate practice action. The practice script also read movement input without moving David, and hid the movement stick. A separate shared-input defect cleared held keys/stick state whenever UI code repeated `setEnabled(true)`.

The changes address those behaviours:

- **Practice discovery:** once five stones are confirmed, Start sling practice is available anywhere in the brook area. It no longer requires finding a narrow interaction radius. The guidance explicitly tells the player to select that action.
- **Practice framing:** entering places David at the safe training position, faces him toward the woven target and centres the initial aim. The shoulder view follows him while he moves around the practice area.
- **Movement and throwing together:** practice now applies movement input to David, including during the sling wind-up and flight. Held input survives ordinary UI/throw-button refreshes. Clear operations remain explicit on reset, disable, blur, cancellation and visibility change.
- **Consistent aiming:** produced practice and battle enable direct mouse pointing and click-to-throw, with F/button alternatives. Touch retains relative aim dragging and independent movement. Primary mouse clicks are queued into the update; a drag exceeding six pixels does not become a shot.
- **Battle agency:** Chapter 5 exploration speed increases from 1.35 to 1.8 m/s and fight movement to 2.1 m/s. The target-facing shoulder view retains forward/back/strafe control. David can move while throwing.
- **Dedicated evasion:** Space/Dodge performs a brief directional sidestep, with a 1.05-second cooldown and visible feedback. It moves through the existing wall/character collision and spear-lane rules. There are no invulnerability frames, extra health or new failure conditions. Its body lean is procedural movement layered over the existing locomotion, not a newly authored roll animation.
- **Touch actions:** Throw/Dodge respond to secondary-finger release while the first finger holds movement. The following synthesized click is suppressed so one tap creates one action. Buttons remain at least 48 pixels high and practice exit/action placement has a gap.
- **Help and feedback:** both scenes have the same Controls card, which pauses play and returns focus to the game. Practice displays the current aiming/wind-up/miss state; the duel explains the raised-spear response. The footer changes to the current control mode.
- **Keyboard focus after Resume:** a further browser check found that Preparation left focus on its Resume button, causing F to be ignored. Resume now returns focus to the canvas. Cancelled mouse presses cannot become shots after resuming.

The short automatic positioning at practice entry and the voiced confrontation remain cinematic. The practice and battle actions after those handoffs are player controlled. The design retains assisted forehead aiming and the fixed story outcome; it does not introduce melee combat or a different game genre.

## Progress and scope protection

The practice shortcut is available **only with review mode**. It explicitly seeds the nine-objective prefix in an isolated memory adapter so the owner can test this interaction directly. It does not change normal saves, credit an unearned normal objective or bypass normal preparation. A successful practice hit still earns `sling.practised`; Face Goliath then leads to the duel. Normal scenes continue to require actual earned progress.

Practice can be left/re-entered without losing confirmed stones or falsely earning readiness. A real battle impact alone earns `goliath.struck`; a lethal spear alone records defeat. Retry restores the actual earlier preparation and resets the projectile, dodge and attempt state. The run stops active at the eleven-objective review gate; Chapter 6 is not credited.

The episode/save schema and `m2-outline-1` content contract are unchanged. Existing voices, models, clothing, environments and story order are retained. No deployment, commit, push, account/backend changes or Chapter 6 production was performed.

## Verification

| Check | Executed result |
| --- | --- |
| TypeScript, production build and ordered story rules | **Passed.** Ten browser entries, unchanged story/save contract and existing Vite shared-engine chunk warning. |
| Desktop controls | **Passed**, Chrome 157.0.8103.52, 1280 × 720. [Results](evidence/controls-polish-2026-11-12/desktop-results.json), [test](../../apps/playcanvas/tests/controls-polish-desktop.cjs). Practice movement, mouse point/click and F, moving during throws, no drag-to-shoot, help pause, leave/re-entry, miss/hit and preview isolation. Duel movement/throw, physical directional dodge, cooldown and pause, successful evasion, lethal defeat, preparation-preserving Retry Battle, failed outcome save/recovery and reload at the eleven-objective gate. The durable battle test begins from an explicitly labelled ten-objective fixture. |
| Two-finger touch | **Passed**, emulated 390 × 844 and 844 × 390. [Results](evidence/controls-polish-2026-11-12/touch-results.json), [test](../../apps/playcanvas/tests/controls-polish-touch.cjs). Actual concurrent stick + second-finger aim + action in practice and battle; exactly one throw per tap; physical directional dodge, miss/hit, help and practice re-entry. Portrait also exercises defeat/retry. Controls are at least 48 pixels high, action areas do not overlap, and no viewport overflow was detected. |
| Input cancellation/repeat | **Passed.** [Results](evidence/controls-polish-2026-11-12/cancellation-results.json), [test](../../apps/playcanvas/tests/controls-polish-cancellation.cjs). Pausing between mouse-down/up cancels the shot; held movement does not leak through pause; F repeat produces one throw; restart clears the unfinished action without granting readiness. This check exposed and verified the Resume-focus fix. |
| Complete Preparation regression | **Passed** on the controls candidate. [Results](evidence/controls-polish-2026-11-12/preparation-regression/browser-results.json), [test](../../apps/playcanvas/tests/preparation-browser-check.cjs). Full audience, fitting/refusal, five individual pickups/contact checks, practice miss/hit, pause, actual preparation flags, preview isolation and explicit save/cancellation/reload recovery fixtures. Optional origin/output arguments and `--direct-controls` let the existing test exercise the new candidate without overwriting its historical evidence. |
| Original battle fixture | **Passed** on the controls candidate. [Results](evidence/controls-polish-2026-11-12/fixture-regression/results.json), [test](../../apps/playcanvas/tests/battle-check.cjs). Desktop and emulated touch retain the earlier challenge, sling, telegraph, dodge, lethal defeat/retry, fall, retreat and replay; includes 320 × 568 and 568 × 320 layouts. Optional produced-chapter controls do not replace fixture defaults. |

Actual captures: [practice ready](evidence/controls-polish-2026-11-12/01-practice-ready.png), [moving after a miss](evidence/controls-polish-2026-11-12/02-practice-moving-miss.png), [Controls card](evidence/controls-polish-2026-11-12/03-shared-controls-help.png), [spear warning](evidence/controls-polish-2026-11-12/05-fight-spear-warning.png), [directional dodge](evidence/controls-polish-2026-11-12/06-player-dodge.png), [portrait practice](evidence/controls-polish-2026-11-12/09-portrait-practice.png), [simultaneous landscape play](evidence/controls-polish-2026-11-12/10-landscape-simultaneous-practice.png), [touch dodge](evidence/controls-polish-2026-11-12/11-portrait-dodge.png), [landscape battle aim](evidence/controls-polish-2026-11-12/12-landscape-fight-aim.png).

The first desktop practice test initially read a stale `practiceReady` flag after re-entry; it now waits for both the practice mode and readiness. The initial multi-touch test driver ended the movement contact instead of the secondary contact. Actual pointer-event inspection identified that harness error; the corrected tests retain the movement finger throughout aim/action and release only the second finger. These failed attempts were not counted as passed gameplay checks.

The final candidate includes a last practice-guidance text update and the Resume-focus correction; the desktop and cancellation checks were rerun after that build. The full Preparation/touch/fixture runs exercised the same control mechanics before those final text/focus changes. Those changes do not alter the character assets or combat simulation.

This step does **not** claim a new sustained performance benchmark or a fix for Chapter 5's earlier roughly 32 FPS laptop sample and 303 ms hitch. [Prior measured limits](m3-chapter-05.md#performance-and-limits) remain performance follow-up work. More responsive input and faster movement are distinct from higher render frame rate.

Engineering checks establish working input and progression, not that a first-time player will find the controls intuitive. Segun's browser playthrough is the next usability/creative gate. No unaided new-player session or physical-phone/Safari/GPU test is claimed.

## Source and evidence

- [Shared movement input](../../apps/playcanvas/src/gameplay/movement-input.ts): explicit aim mode, normalized pointer coordinates, click queue, drag/cancel guards and transition-aware enable.
- [Shared help/action binding](../../apps/playcanvas/src/app/sling-controls-ui.ts), [responsive controls](../../apps/playcanvas/src/app/sling-controls.css).
- [Preparation coordinator](../../apps/playcanvas/src/app/preparation-main.ts), [battle coordinator](../../apps/playcanvas/src/app/duel-main.ts), [movement/camera/dodge](../../apps/playcanvas/src/world/movement-area.ts).
- [Candidate manifest](evidence/controls-polish-2026-11-12/candidate-manifest.json). Candidate **M3-CONTROLS-20261112-01**, in `build/playcanvas-controls-polish`, served on loopback port 4188. Earlier ports/builds remain frozen; use the new links for the revised controls. Normal browser saves remain origin-specific.

Review the updated practice and fight before proceeding with Chapter 6.
