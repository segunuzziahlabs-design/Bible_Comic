# David's CTRL-04 jump performances

16 November 2026 · [Implementation plan](../controls/ctrl04-jump-plan.md)

The new performances use the existing teenage David skeleton and the project's [CC0-derived asset lineage](../implementation/q02-quaternius-rig-probe.md). No new third-party model, recording or animation pack was downloaded. The existing character meshes, materials, wardrobe and appearance morphs are retained.

- Authoring script: [david_jump.py](../../source-assets/characters/david_jump.py).
- Editable source: [david-jump.blend](../../source-assets/characters/david-jump.blend), created from the existing `david-adventure.glb` and saved separately.
- Export: [david-jump.glb](../../apps/playcanvas/src/assets/david-jump.glb), an animation-only resource: 65 bones, three clips, no new character geometry. Export size: 161,592 bytes.
- [Authoring metadata](../../source-assets/characters/david-jump.json) records the retained rig and clip samples. [Manifest](david-jump-manifest.json) records exact hashes and GLB structure.

| Clip | Authored samples | Performance |
| --- | --- | --- |
| `jump_takeoff` | Frames 0–6 at 30 fps | Short crouch, planted-foot preparation, arm drive and extension. |
| `jump_air` | Frames 0–20 at 30 fps | Asymmetric knee/calf tuck, balancing arms, then extension for contact. |
| `jump_land` | Frames 0–8 at 30 fps | Planted-foot compression, torso absorption and recovery to idle. |

The authoring script bakes the existing rig's leg IK for takeoff/landing and removes temporary constraints/targets before export. It keys the skeleton and local pelvis compression, with no travelling actor/root translation. The runtime motor supplies the physical root height once. Clip time is sampled against the physical phase, rather than using a second animated root arc. Facial and appearance morphs remain on the original models.

`loadJumpAnimations` loads this shared resource once per PlayCanvas application. Both conversation-style David controllers and the battle locomotion graph use these tracks. No second David mesh is instantiated. Throwing, interaction and Dodge wait for jump recovery in this phase; the dedicated jump-shot animation remains CTRL-06.

Rebuild from the repository root:

```powershell
.\tools\blender.ps1 --background --factory-startup --python source-assets/characters/david_jump.py
```

The existing `.blend` sources and original model exports are not overwritten. Browser recordings and stage captures, including actual rig deformation and camera framing, belong to the [CTRL-04 handover](../implementation/ctrl04-jump-movement.md). These are authored game-animation candidates for owner review, not motion capture, cloth simulation or a claim of final cinematic art acceptance.
