# B02 movement and camera hardening

29 October 2026. Implemented under the owner's explicit B02 request, following the [plan written before implementation](b02-movement-camera-plan.md). B02 remains **Partially implemented**: the local controller work is delivered, while physical-device usability, supported hardware and G1 acceptance are outstanding.

## Changes

- Player input is clamped at the movement boundary. Vector acceleration preserves equal straight/diagonal speed; explicit braking stops within the tested release distance. Grounded movement uses constant slope speed, floor snap and a 45-degree maximum floor angle. There is no new jump or automatic stair-climbing mechanic.
- Disabled movement stops immediately, including during pause/dialogue/completion. Walking animation uses actual displacement, so pressing into a wall returns David to Idle. Reset restores velocity, facing and visibility.
- The reusable [camera scene](../../scenes/player/exploration_camera.tscn) owns orbit angles, portrait/landscape framing and obstruction handling. A 0.22 m sphere protects the camera around wall/roof edges. Retraction is immediate; only outward boom extension is eased. Yaw wraps and pitch stays between 0.15 and 0.85 radians. David's model is hidden below 0.65 m camera distance and restored when clear, avoiding a view inside his head.
- Starting camera overlap is checked separately from the motion cast, which ignores initial overlaps. The fallback collapses the boom at its focus rather than casting through a solid. It cannot repair arbitrary invalid level geometry: future authored spawn points still need collision validation.
- Input deactivation cancels touches and held controls. A secondary mouse-button release no longer ends a left drag; motion without a held left button cancels a missed release. Window exit, resize, focus loss and modal transitions clear controls. No pointer lock is requested, so the browser cursor stays available.
- Recovery and restart reset both player and camera coherently. Collision now includes the existing building roof trim and side-wall caps, whose visible surfaces extended beyond the old collision boxes. No art assets or narrative content were changed.

## Executed verification

Evidence: [result.json](evidence/b02-2026-10-29/result.json), [source fingerprints](evidence/b02-2026-10-29/source-sha256.json) and [saved logs/screenshots](evidence/b02-2026-10-29/).

| Executed verification | Result |
|---|---|
| Fresh copied project | Import, startup, release export and PCK runtime/source-exclusion checks passed without the working `.godot` cache |
| Existing proof / foundation suites | 17 / 24 checks passed |
| Movement/camera fixture suite | 35 checks passed, no errors |
| chrome-desktop / 155.0.8059.85 | 22 checks passed; no captured browser/script/request errors; manifest unchanged during run |
| chrome-touch-emulation / 155.0.8059.85 | 28 checks passed; no captured browser/script/request errors; manifest unchanged during run |
| msedge-desktop / 156.0.4314.50 | 22 checks passed; no captured browser/script/request errors; manifest unchanged during run |
| Source preservation | Original GLB/audio/Blender asset hashes match the earlier snapshot |

Final runs: **76 engine checks and 72 browser checks passed**. The first touch harness run did not register its zero-duration look gesture; the paced, toolbar-clear gesture passed on rerun without a runtime change. Its failed report is retained for traceability.

Physics fixtures cover a flat floor, 20-degree ramp, 60-degree incline, wall/corner, off-centre obstruction, low roof and invalid starting camera overlap. They exercise actual engine physics rather than only inspecting configuration. Straight and diagonal 60-frame travel both measured approximately 2.605 m. Uphill/downhill traversal, idle stability, steep-slope retreat, camera clearance and immediate stopping passed. These fixtures do not guarantee every future terrain mesh or spawn location.

Browser automation sends keyboard/mouse or touch events to the exported canvas and reads diagnostic snapshots; it does not set gameplay state. It checks rear-wall camera retraction, outward recovery, pitch limits, restart, stopping during movement, gesture cancellation/reacquisition and the full Jesse → provisions → gate journey. Browser export identity is checked before/after each run. Screenshots are inspected for unintended presentation changes.

Browser measurements are regression observations on the development host. Touch emulation is not an Android/iPhone test, and short FPS samples are not a low-memory, thermal or final-episode performance baseline. Human comfort, camera sensitivity, touch ergonomics and minimum hardware remain unverified. Original A03, A05/A04 and B01 evidence remains historical and unchanged.

## Reproduce and continue

```powershell
.\tools\check-foundation.ps1 -EvidenceTask b02
.\tools\export-proof.ps1
python .\tools\serve-proof.py
```

```text
node tools/browser-proof-check.cjs <absolute-playwright-module-path> chrome desktop build/verification/b02/browser
node tools/browser-proof-check.cjs <absolute-playwright-module-path> chrome touch build/verification/b02/browser
node tools/browser-proof-check.cjs <absolute-playwright-module-path> msedge desktop build/verification/b02/browser
```

Refresh the local courtyard after export. Walk diagonally and along walls, drag the camera near the rear wall, pause while moving, rotate the phone/emulated viewport and restart. Report actual physical results through the [device checklist](a04-device-test-checklist.md) and [A06 register](../testing/a06-device-and-session-register.md).

The next scheduled coding task is B03's representative village. G1 phone evidence and art/content review remain prerequisites for broader world production. B02's local work does not change schedule estimates, close A02/A04/A06/B01, or establish a release gate. No commit, push or deployment was performed.

API reference used for the collision design: [Godot shape motion and starting-overlap behaviour](https://docs.godotengine.org/en/4.5/classes/class_physicsdirectspacestate3d.html#class-physicsdirectspacestate3d-method-cast-motion). Implementation was executed and tested with the pinned Godot 4.7.2 toolchain.
