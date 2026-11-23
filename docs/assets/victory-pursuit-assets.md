# Victory pursuit asset — 23 November 2026

Extends the [existing soldier/voice provenance](victory-assets.md). The retained soldier comes from the documented Quaternius CC0 workflow. No new downloaded art, voice recording or external sound pack is used.

[`victory_pursuit.py`](../../source-assets/characters/victory_pursuit.py) reads the retained `build/m3-ch06/victory-soldier.blend` in pinned Blender 4.5.15 LTS. It exports the separate [`victory-pursuit.glb`](../../apps/playcanvas/src/assets/victory-pursuit.glb): six green-clothed running poses, five spear-strike poses and six brown-clothed collapse poses. The original `victory-crowd.glb`, foreground rigs and all preceding chapter models remain unchanged.

Each new pose is 1,744–1,746 triangles; [generated triangle counts](../../apps/playcanvas/src/assets/victory-pursuit.json). One material per pose, no crowd skeletons, no crowd shadows, at most 24 instances per pose. Pairs share converging routes and staged contact timing; defeated soldiers remain on the terrain. This is cinematic choreography with discrete distant poses, not independently simulated combat AI.

Verified export: **789,232 bytes**, SHA-256 `936e25788e23214b84437461b6f0644404e837019e5f32d5f09f9817d6f038db`. Blender’s final export completed without mesh-validation warnings after removing degenerate faces during the bake.

The runtime reuses existing spatial footsteps, equipment and set-down impact synthesis, and all existing licensed Chapter 6 voices. It adds no voice imitation, blood, wound geometry or separated body parts.

Rebuild from repository root after sourcing `tools/Toolchain.ps1`:

```powershell
$toolchain = Get-BibleComicToolchain
& $toolchain.Blender --background build/m3-ch06/victory-soldier.blend --python source-assets/characters/victory_pursuit.py -- apps/playcanvas/src/assets/victory-pursuit.glb
```

The ignored source blend is the previous asset pipeline's local output; regenerate it with `victory_soldiers.py` and its documented source if working on a fresh checkout. The committed GLB needs no Blender installation to play.
