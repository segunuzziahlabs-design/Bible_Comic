# Q02 clothed Jesse gesture sample

9 November 2026 · Jesse has a broad, planted stance, a grey beard and receding hairline, and a clay-coloured mantle over an undyed tunic. The **9,847-triangle** GLB uses one skinned surface, one material, vertex colours and no textures. It contains 65 joints and weighs 517,020 bytes raw or 225,977 bytes gzip. The sample reuses David's compatible skeleton and fitted base tunic with new clothes, hair and gesture clips. [Export measurements](evidence/q02-jesse-2026-11-09/result.json) · [David sample](q02-david-clothed-sample.md) · [Rig and licence evidence](q02-quaternius-rig-probe.md)

![Jesse greeting from the conversation camera](evidence/q02-jesse-2026-11-09/conversation-greeting-2.png)

| Clip | Gameplay at 5.5 m | Conversation at 2.7 m |
|---|---|---|
| Relaxed idle, 2.0 s loop | Wide stance and the diagonal mantle are legible. [Gameplay idle](evidence/q02-jesse-2026-11-09/gameplay-idle-1.png) | The beard and layered clothing read clearly. Subtle breathing and weight shift keep the pose from being static. [Conversation idle](evidence/q02-jesse-2026-11-09/conversation-idle-1.png) |
| Greeting, 1.75 s | The raised hand separates from the silhouette. [Gameplay greeting](evidence/q02-jesse-2026-11-09/gameplay-greeting-2.png) | The open palm is visible and the elbow bends while the feet stay planted. [Conversation greeting](evidence/q02-jesse-2026-11-09/conversation-greeting-2.png) |
| Explain and point, 2.5 s | The arm and nearby prop indicate the target. The index finger is subtle at this scale. [Gameplay point](evidence/q02-jesse-2026-11-09/gameplay-pointing-2.png) | The turned head and extended index point toward the provisions. [Conversation point](evidence/q02-jesse-2026-11-09/conversation-pointing-2.png) |

**Verification.** Godot 4.7.2 imported and sampled all three clips. The ankles were 36.6 cm apart with less than 1.2 mm of maximum measured drift. The Compatibility Web export played all six clip and camera combinations in desktop Chrome. Both gestures returned to idle automatically, and the browser run captured 12 poses with zero reported errors. Physical-device performance and the two-actor exchange remain open. [Godot measurements](evidence/q02-jesse-2026-11-09/result.json) · [Browser playback](evidence/q02-jesse-2026-11-09/browser-review.json)

**Clothing limits.** Blender reopened the editable file and checked 153 authored poses. After adjusting the mantle clearance, the sampled checks found no mantle contact with the neck, beard or gesturing arm, and no skirt contact with the lower legs. The mantle still intersects the tunic in places, with small breaks near the shoulder and belt visible in the close view. Check those areas again when Jesse is staged beside David. [Deformation measurements](evidence/q02-jesse-2026-11-09/deform.json)

The GLB uses the same Godot vertex-colour companion material setup as David. To play the preview locally, run `./tools/godot.ps1 --path build/q02-jesse/godot` from the workspace. Use **1–2** to switch cameras and **I / G / P** for idle, greeting and pointing. The preview is isolated from the village. The frozen B06 candidate and David sample matched their recorded hashes. [Editable Blender source](../../build/q02-jesse/jesse-q02.blend) · [GLB](../../build/q02-jesse/godot/jesse-q02.glb) · [Godot palette](../../build/q02-jesse/godot/jesse-palette.tres) · [Preview project](../../build/q02-jesse/godot/project.godot)

Next, author David's listening, acknowledgement and provisions pickup, then test both actors together. [Quality implementation plan](animation-quality-improvement-plan.md)
