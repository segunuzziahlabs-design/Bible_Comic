# B01 foundation preparation plan

29 October 2026, written before the changes in this step. The owner has asked to proceed after reviewing the A04 courtyard screenshot. This authorises local implementation; it does not establish phone test results, approve final art or waive a release gate.

## Intended result

Keep the same playable courtyard and turn its existing parts into reusable, editor-visible scenes. The next village and story tasks should be able to reuse David, character presentation, input and UI without copying a monolithic proof controller. Use explicit local references and signals; do not add a general narrative framework or unused services.

## Sequence and affected files

1. Extract the existing courtyard geometry/lighting into `scenes/world/courtyard.tscn` and its script. Name the spawn, Jesse, provisions and exit anchors in the scene. Keep the current layout/collision and original GLB assets.
2. Create character and player scenes under `scenes/characters/` and `scenes/player/`. Put the character model and player collider in the scene hierarchy. Move the existing actor/player scripts with their UID sidecars so references remain traceable.
3. Create input and UI scenes, move the current scripts, and declare movement/interact/pause bindings in Godot's Input Map. Keep one adapter for mouse/keyboard and touch, with explicit held-input reset on pause/focus loss. Route action requests through signals to the courtyard controller.
4. Compose those instances in the existing courtyard root. Keep its three-step draft story state isolated under `scripts/proof/`; no full-episode state or dialogue approval is implied. Move the existing bundle and objective marker into small presentation scenes.
5. Document scene ownership, action/signal contracts, export commands and proposed Git conventions. Prepare A06's device/session register with unknown and unbooked entries, linking the existing device checklist. Send no invitations and invent no participants/results.
6. Verify scene instances have independent state, required nodes/assets exist, input bindings/reset work, and the ordered courtyard/restart is unchanged. Run headless checks, import/export/package checks and the actual browser journey after refactoring. Save new evidence separately from A05/A04 history.
7. Update the roadmap and workbook together. B01 remains **Partially implemented** while G1/A02 prerequisites are open, even if its local structure and regression checks pass. A06 preparation is partial until actual inventory/bookings exist.

## Dependencies and boundaries

- A03 tools and A05 technical assets are verified. A04 desktop/touch-emulation proof exists; physical Android/iPhone and numerical baselines are still missing.
- This is bounded, reversible foundation preparation under the implementation plan's permission for independent preparation. Broader village/story expansion remains behind G1. No full episode, new environments, combat, backend, deployment, commit or push in this step.
- The user's screenshot establishes that the courtyard renders in their browser. It does not verify movement, interactions, phone compatibility, performance or final art approval.
- Preserve current visuals/controls where possible. The screenshot's small control hints are noted for B05; this is not a visual redesign.

## Acceptance for this preparation

The existing entry → Jesse → provisions → gate → restart loop works from a release browser export after component extraction. The player/actor/world/input/UI are inspectable subscenes with documented ownership, without shared mutable instance state or story logic inside player/visual components. Named input bindings and touch actions reach the same controller callbacks. Export inspection loads all required new dependencies and excludes source-only files. Evidence explicitly retains phone, full-episode and final-art limitations.
