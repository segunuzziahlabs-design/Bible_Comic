# CTRL-05: aligned spear performances

16 November 2026 · [Implementation plan](../controls/ctrl05-spear-collision-plan.md) · [Technical handover](../implementation/ctrl05-spear-collision.md) · [Checked asset manifest](goliath-spear-collision-manifest.json).

The retained encounter rig's previous thrusts put the head above or beside standing David while a broad ground corridor applied damage. A height filter alone would have made grounded attacks miss. CTRL-05 derives a separate export with visible low, middle and high thrust alignment. The original `goliath-encounter.glb`, earlier speaking exports and source files remain unchanged.

- Source: [goliath_collision.py](../../source-assets/characters/goliath_collision.py), importing the existing encounter GLB and helper functions from `elah_combat.py`.
- Editable output: [goliath-collision.blend](../../source-assets/characters/goliath-collision.blend).
- Runtime output: [goliath-collision.glb](../../apps/playcanvas/src/assets/goliath-collision.glb).
- Measured local offsets: [goliath-collision.json](../../source-assets/characters/goliath-collision.json), in game XYZ, including the retained 1.61 scale.

The four spear clips retain their original duration, anticipation, thrust and recovery structure. Temporary two-bone hand IK aligns the right hand/grip, foot IK preserves the original planted positions, and a small low-thrust pelvis/spine adjustment provides reach. Poses are baked at 24 fps; temporary constraints and targets are removed before export. Ready, speaking, advance and fall clips, meshes, materials and speech morphs are retained. This is a correction to the existing stylised character, not a new realistic character or a visual-quality approval.

| Clip | Head height at frames 41 / 44 / 47, relative to champion root |
| --- | --- |
| Low (`goliath_spear_1`) | 0.413 / 0.373 / 0.429 m |
| Middle (`goliath_spear_2`) | 1.053 / 1.096 / 1.108 m |
| High (`goliath_spear_3`) | 1.581 / 1.496 / 1.556 m |

World-space heights also depend on the terrain under Goliath. The collision code samples the rendered grip and tip every game update; these numbers are asset measurements, not substituted collision planes. Shaft/head radii and length ratios come from the retained mesh construction in `elah_combat.py`. The approach stops 2.45 m away so the actual weapon reaches the threatened capsule; the lane is a warning, not a damage volume.

No external assets, voice recordings, dependencies or new licence terms were introduced. Existing original modifications and Quaternius base-rig notices/provenance remain applicable; see [SC-02](../implementation/playcanvas-sc02-encounter.md), [base-rig probe](../implementation/q02-quaternius-rig-probe.md) and [Chapter 5 assets](duel-assets.md). This derivative adds original animation edits to that retained project asset.

Reproduce from the repository root:

```powershell
.\tools\blender.ps1 --background --factory-startup --python source-assets/characters/goliath_collision.py
node apps/playcanvas/tests/spear-asset-check.cjs
```

Use the pinned Blender 4.5.15 toolchain. Export log: `build/ctrl05-goliath-export.log`. The manifest checks animation-name retention, actual rig markers, joint/mesh/triangle continuity and speaking morphs. Browser captures in the handover provide the visual and collision checks; structure alone cannot establish animation quality.
