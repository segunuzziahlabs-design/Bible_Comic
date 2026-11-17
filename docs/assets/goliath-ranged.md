# Goliath's ranged spear performance

16 November 2026 · [Adjustment plan](../controls/ranged-battle-and-route-plan.md) · [Checked export manifest](goliath-ranged-manifest.json).

This is an original animation and weapon-separation derivative of the retained [CTRL-05 rig](goliath-spear-collision.md). It introduces no external artwork, audio, paid service or additional licence dependency. The project's existing original modifications and Quaternius base-rig provenance/notices continue to apply; see [SC-02](../implementation/playcanvas-sc02-encounter.md) and the [base-rig probe](../implementation/q02-quaternius-rig-probe.md). Earlier GLB and Blender exports remain intact.

- [Authoring script](../../source-assets/characters/goliath_ranged.py).
- [Editable Blender output](../../source-assets/characters/goliath-ranged.blend).
- [Chapter 5 runtime export](../../apps/playcanvas/src/assets/goliath-ranged.glb).
- [Structural verification](../../apps/playcanvas/tests/ranged-asset-check.cjs).

The added `goliath_throw` contains anticipation, overarm preparation, a release at 1.0 s in the animation, follow-through and recovery. Gameplay maps the retained warning duration to that release pose; the projectile then leaves the actual tip/grip markers. Existing entrance, speech, ready, thrust and non-graphic fall animations remain. The mesh's spear shaft previously shared its material and skinned mesh with clothing. Only faces fully weighted to `Spear grip` were split into a separate held shaft, so the head and shaft can disappear from his hand at release while his clothes remain visible.

The export retains 11,785 triangles and 68 joints; mesh count changes from 12 to 13 for that separation. It adds one clip to the prior nine. The runtime projectile uses the retained scaled shaft/head dimensions and the same samples as physical collision. A short translucent trail and a brighter iron head support tracking against the sky. This is still the existing stylised character; the change does not establish final cinematic art approval.

```powershell
.\tools\blender.ps1 --background --factory-startup --python source-assets/characters/goliath_ranged.py
node apps/playcanvas/tests/ranged-asset-check.cjs
```

Pinned Blender: 4.5.15. Export log: `build/goliath-ranged-export.log`. The manifest records source/output hashes, retained clips and geometry. Browser evidence in the implementation handover establishes actual playback and gameplay; the structural check alone does not.
