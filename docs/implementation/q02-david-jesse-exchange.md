# Q02 David and Jesse exchange

9 November 2026 · One **Speak** action runs the 24-second exchange. David listens while Jesse greets him, follows Jesse's point to the bundle, then looks back and nods. The conversation presents a separate **Take** action. David bends, grips the bundle with both hands, lifts it off the table and settles with it against his body. **Reset** restores the table and both actors for another run. [Plan](q02-david-jesse-exchange-plan.md) · [Shot brief](../quality-review/david-jesse-visual-brief.md#blocking-and-shot-beats)

![David holding the provisions at 2.7 m](evidence/q02-exchange-2026-11-09/conversation-carry.png)

| Beat | Gameplay at 5.5 m | Conversation at 2.7 m |
|---|---|---|
| Jesse greets and David listens | [Greeting and listen](evidence/q02-exchange-2026-11-09/gameplay-listen.png) | [Greeting and listen](evidence/q02-exchange-2026-11-09/conversation-listen.png) |
| Jesse points and David looks to the bundle | [Point and glance](evidence/q02-exchange-2026-11-09/gameplay-point.png) | [Point and glance](evidence/q02-exchange-2026-11-09/conversation-point.png) |
| David acknowledges | [Nod](evidence/q02-exchange-2026-11-09/gameplay-nod.png) | [Nod](evidence/q02-exchange-2026-11-09/conversation-nod.png) |
| David takes the provisions | [Grip](evidence/q02-exchange-2026-11-09/gameplay-grip.png) · [Lift](evidence/q02-exchange-2026-11-09/gameplay-lift.png) · [Carry](evidence/q02-exchange-2026-11-09/gameplay-carry.png) | [Grip](evidence/q02-exchange-2026-11-09/conversation-grip.png) · [Lift](evidence/q02-exchange-2026-11-09/conversation-lift.png) · [Carry](evidence/q02-exchange-2026-11-09/conversation-carry.png) |

**Playback and contact.** Godot 4.7.2 verified the complete timeline with two independent animation players, at both measured camera distances. The bundle transferred once at 1.00 s into Take, with less than 0.1 mm of position change at the attachment frame. It rose 19.8 cm, and the supporting wrist stayed within 2.6 mm of its intended grip during the lift. Maximum ankle drift was about 1.8 mm. The Chrome export ran both sequences end to end using the on-screen action button, with 12 captures and zero reported browser errors. [Measurements](evidence/q02-exchange-2026-11-09/result.json) · [Browser playback](evidence/q02-exchange-2026-11-09/browser-review.json)

**Assets and remaining fit.** David's exported model retains 9,819 triangles, its 65-joint rig, one material and the original walk. The new actions are `listen`, `listen_to_provisions`, `acknowledge` and `pickup_provisions`. The two models use vertex colours and the same Godot companion materials as the earlier samples. The reopened Blender file was sampled at 220 authored poses. Some skirt-to-leg and sleeve contact remains during the deepest bend. The close camera makes the nod and grip easier to read. [Clothing measurements](evidence/q02-exchange-2026-11-09/wardrobe.json) · [David walk](q02-david-clothed-sample.md) · [Jesse gestures](q02-jesse-clothed-sample.md)

The rehearsal uses a fixed table and actor positions. Gameplay movement and animation blending follow in Q03. Village placement, player control handoff, the collision-safe camera transition and story-state integration follow in Q04. Physical phone testing and owner art and content review remain open. [Quality implementation plan](animation-quality-improvement-plan.md)

Run `./tools/godot.ps1 --path build/q02-exchange/godot` from the workspace to replay the rehearsal. Select either camera before speaking, or switch during the scene. [Editable Blender source](../../build/q02-exchange/david-acting.blend) · [David GLB](../../build/q02-exchange/godot/david-acting.glb) · [Godot preview project](../../build/q02-exchange/godot/project.godot)
