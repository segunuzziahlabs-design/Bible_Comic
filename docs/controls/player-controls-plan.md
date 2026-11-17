# Automatic opening and David control design

16 November 2026. Owner instruction: the messenger arrives automatically while David tends the flock; player control begins for the walk to Jesse's courtyard. Research and design visible movement, jump, dodge and cinematic sling controls. The owner's latest correction **retains Goliath's spear**, superseding the earlier arrow selection.

## This implementation pass

1. **Automatic opening:** remove the required Tend interaction. Begin Chapter 1 plays the field establishment, David's tending performance and the messenger's arrival/summons on one pause-aware timeline. The messenger walks in while David tends the lamb. After the exchange, clear held inputs and hand control to the player for the courtyard route. Keep Jesse's one-action conversation, separate courtyard pickup, existing audio recovery, objective order and local saves.
2. **Research and specification:** inspect the actual input/controller/battle foundation; use primary accessibility and touch-layout sources to propose action mapping, placement, feedback, cancellation and cinematic handoff rules. Record implemented facts separately from proposed mechanics.
3. **Interactive control review:** build a separate browser design page with desktop/portrait/landscape layouts, a visible WASD/arrow console, touch stick, contextual actions, attack warning, Jump, Dodge, Sling and Jump Shot. Demonstrate button/readiness/input feedback. Label it a UI simulation; do not present simulated jumping as implemented game physics.
4. **Verification:** real browser run from Begin with no movement/Tend input until automatic control handoff; inspect animation/arrival, voices, pause/restart and subsequent courtyard pickup/Elah progress. Exercise the proposed UI with keyboard, pointer and multiple touch contacts, reduced space and cancellation. Keep older builds and owner progress intact.

## Boundary before combat integration

The existing game uses Space for Dodge, has no jump clip/vertical player motion, and checks spear hits in the ground plane. This pass does not silently remap the shipped battle or add a decorative Jump button to it. The separate proposal will define the input-router, animation, airborne collision and cinematic-release tasks needed for a real jump/jump-shot implementation after design review. Weapon: spear retained. No commit, push, deployment, new episode or service work.

Deliverables: [control design and integration order](player-control-design.md), browser control preview, automatic-opening implementation/evidence, and a fresh browser entry for owner review.
