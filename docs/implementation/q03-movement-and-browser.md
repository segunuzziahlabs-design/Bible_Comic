# Q03 David's walk and browser movement

9 November 2026 · The village now uses the clothed David rig. His walk advances with actual horizontal travel, including movement after a collision. His standing pose blends into the walk as he accelerates and back to idle when he releases input or stops at a wall. Sharp direction changes reduce the target speed while he turns. [Implementation plan](q03-movement-plan.md) · [David's animation graph](../../scripts/characters/david_visual.gd) · [Player controller](../../scripts/player/player_controller.gd)

![David turning across the village path in the Q03 browser build](evidence/q03-2026-11-09/desktop-turn.png)

The 1.333-second source walk measures about 1.05 m/s from the planted sandal travel. The exploration cap changed from 2.8 to 1.8 m/s so the walk stays near a brisk 1.71× cadence. The clean Godot test measured about 4.4 cm of world-space ankle movement over a planted portion of the left step on flat ground. Some residual slide remains during the planted step. [Blender sandal samples](evidence/q03-2026-11-09/walk-soles.json) · [Godot movement checks](evidence/q03-2026-11-09/movement-camera-checks.log)

| Browser movement | Chrome result |
|---|---|
| Keyboard start and sustained walk | Idle and walk blended on start. Full input held 1.80 m/s and 1.71×. [Walking capture](evidence/q03-2026-11-09/desktop-walk.png) |
| 90° turn and 180° reversal | Both reached the new heading and turned at most 10° per 60 Hz physics step. |
| Touch emulation | A partial drag held about 0.64 m/s and 0.61×. A full drag reached the keyboard pace. [Portrait capture](evidence/q03-2026-11-09/touch-partial-walk.png) |
| Release, wall and reset | Both input modes settled at zero cadence. The wall halted the walk with input still held, and Restart restored spawn and walk phase. [Wall capture](evidence/q03-2026-11-09/desktop-wall.png) |

The movement run reported zero browser errors. A separate Chrome run passed 42 checks, including the existing Jesse, provisions and gate route, camera retraction, pause and focus loss. The clean Godot suite also passed interaction, camera, reset and export checks. A reserved one-shot blocks player movement and reports completion or cancellation once. Village dialogue and prop handling are the Q04 integration. Touch evidence comes from Chrome emulation. [Browser measurements](evidence/q03-2026-11-09/movement-review.json) · [Full village run](evidence/q03-2026-11-09/chrome-desktop.json) · [Foundation and action checks](evidence/q03-2026-11-09/foundation-checks.log)

The Q03 gameplay pack is 400,928 bytes gzip, up 300,752 bytes from the frozen B06 build. The compressed engine was 10.26 MB in the Q03 export. David retains 9,819 triangles and one skinned surface, and his editable file includes the walk and acting clips. Physical phone performance is still unmeasured. [Q03 build manifest](evidence/q03-2026-11-09/build-manifest.json) · [Editable David](../../source-assets/characters/david.blend) · [Runtime GLB](../../assets/characters/david.glb)

The local Q03 export is served at `http://127.0.0.1:8063/`. Use **WASD** or the arrow keys. Rebuild from the repository with `./tools/export-proof.ps1 -OutputFolder q03/web` and serve it with `python tools/serve-proof.py --preview q03/web --port 8063`. [Browser movement check](../../tools/browser-movement-check.cjs)
