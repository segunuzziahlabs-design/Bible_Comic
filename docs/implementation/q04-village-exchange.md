# Q04 David and Jesse in the village

9 November 2026 · **Speak to Jesse** starts the 24-second exchange with no extra confirmation. Jesse greets and points, David looks toward the provisions and nods, and control returns with the new objective. The player walks to the packing table beside the stall and selects **Take provisions**. David takes a short, collision-checked step to the pickup mark, then reaches, lifts and stows the bundle at his satchel. The gate unlocks when the pickup finishes. [Q04 plan](q04-village-exchange-plan.md) · [Q02 rehearsal](q02-david-jesse-exchange.md)

![David and Jesse talking in the village](evidence/q04-2026-11-09/desktop-greeting.png)

The conversation camera uses David's approach position and the existing collision sweep. It widens for portrait and returns to the exploration view after the last beat. Pause freezes the subtitle, animation and camera. Skip completes the same conversation path, while Replay preserves the accepted story event. The input adapter clears held movement when the scene starts and ends. [Sequence and pickup](../../scripts/story/village_exchange.gd) · [Camera](../../scripts/player/exploration_camera.gd)

Take keeps the objective pending during alignment and wrist contact. The same parcel moves from the table into David's hands and then stows. A blocked approach leaves Take available. An interrupted pickup restores the parcel at the table, and Restart clears the pending action and objective history. [Packing table](../../scenes/world/village/provisions_table.tscn) · [Integration checks](evidence/q04-2026-11-09/interaction-checks.log)

| View | Exchange | Pickup |
|---|---|---|
| Desktop | [Greeting](evidence/q04-2026-11-09/desktop-greeting.png) · [Point](evidence/q04-2026-11-09/desktop-point.png) · [Nod](evidence/q04-2026-11-09/desktop-nod.png) | [Reach](evidence/q04-2026-11-09/desktop-reach.png) · [Lift](evidence/q04-2026-11-09/desktop-lift.png) |
| Portrait touch emulation | [Greeting](evidence/q04-2026-11-09/portrait-greeting.png) · [Point](evidence/q04-2026-11-09/portrait-point.png) · [Nod](evidence/q04-2026-11-09/portrait-nod.png) | [Reach](evidence/q04-2026-11-09/portrait-reach.png) · [Lift](evidence/q04-2026-11-09/portrait-lift.png) |

Chrome completed the desktop route through the gate and the portrait route through pickup. The full run passed 29 checks with zero browser errors, including held input, focus loss, pause, skip, replay, and restart before and after pickup contact. The portrait framing was widened after that run and checked separately in the final export. Touch was tested with Chrome emulation. [Full browser run](evidence/q04-2026-11-09/exchange-review.json) · [Portrait rerun](evidence/q04-2026-11-09/portrait-review.json) · [Godot village checks](evidence/q04-2026-11-09/preview-village-checks.log)

The browser build is served locally at `http://127.0.0.1:8064/`. Rebuild it with `./tools/export-proof.ps1 -OutputFolder q04/release` and serve it with `python tools/serve-proof.py --preview q04/release --port 8064`. [Browser test](../../tools/browser-exchange-check.cjs) · [Desktop build manifest](evidence/q04-2026-11-09/desktop-build-manifest.json) · [Final build manifest](evidence/q04-2026-11-09/build-manifest.json)
