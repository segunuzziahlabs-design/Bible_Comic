# A05 asset and A04 interactive browser proof — execution plan

Prepared 29 October 2026, before implementation. Builds on the [project implementation plan](implementation-plan.md), [verified A03 toolchain](a03-toolchain-setup-2026-10-29.md) and [lightweight requirement](low-end-device-performance-plan.md).

## Scope and order

1. **A05 assets:** create an original economical shepherd stand-in in Blender with a genuine skeleton, skinned mesh and idle/walk/gesture clips. Create a small reusable stone courtyard/gateway module. Keep editable `.blend` sources, a deterministic generation script, GLB exports and a provenance register. These are technical/art samples, not final approved character art. Use no third-party asset downloads or paid assets.
2. **A05 import checks:** inspect GLB mesh/skin/animation data, import through the pinned Godot version, verify the imported scene has a skeleton and playable animation tracks, and record geometry/file size. Document scale, axes, names and repeatable exports.
3. **A04 proof:** build a small courtyard where David can walk, look around, collide with boundaries, speak to Jesse, collect provisions and reach the gate. This short three-step loop is a technical proof using draft text, not the full episode or final story implementation. Add readable contextual prompts, dialogue/objective feedback, a generated sound cue, pause, restart and safe spawn recovery.
4. **Desktop/mobile input:** keyboard movement, mouse-drag camera and interaction key; touch movement/look regions plus explicit interaction controls. Track touch IDs, clear input on cancellation/focus loss, support both orientations and keep HUD/dialogue away from control regions. Cap 3D resolution independently of readable UI; begin with simple materials and restrained lighting.
5. **Export and verification:** preserve the A03 fixture as its own export preset. Export the new proof in single-thread Compatibility mode, serve locally and test actual browser execution. Run targeted state/restart/asset checks plus exported-browser input, viewport, error and loading checks. Record exact browser/renderer and distinguish desktop touch emulation from physical phone evidence.

## Deliverables and acceptance

| Task | Deliverable | Verification/exit |
|---|---|---|
| A05 | Original `.blend`/GLB samples, generator, asset register and import conventions | GLB contains mesh/skin/three animation clips; Godot imports it without errors; exported browser visibly renders and animates it. Owner art review stays open; third-party licensing is not invented. |
| A04 | Interactive local browser proof, export/serve commands, desktop observations and physical-device checklist | Fresh entry → movement → dialogue → pickup → gate → restart works in tested browsers; touch emulation and both layouts checked; audio triggered by user action. G1 remains open until real Android/iPhone and target-device measurements are recorded. |

## Boundaries and evidence

- No full combat, final dialogue approval, accounts, backend, cloud saves, extra episodes, publication, commit or push.
- Local browser testing may use browser automation. Record software-renderer/emulation limits instead of claiming physical GPU/phone performance.
- Only mark executed checks passed. If direct phone access is unavailable, deliver a locally reviewable proof and a concrete owner-run checklist; do not mark A04/G1 fully verified.
- Fix failed checks within this scope, update the roadmap/workbook from actual results and preserve the original DOCX sources and historical A03 evidence.
