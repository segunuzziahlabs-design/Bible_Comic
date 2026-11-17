# Proof and village asset register

Created 29 October 2026 for the [A05/A04 execution plan](../implementation/a05-a04-execution-plan.md). These original procedural samples demonstrate import, skinning and browser animation. They are not approved final David/Jesse designs or evidence of historical accuracy.

| ID | Runtime file / editable source | Provenance and rights | Verified structural cost | Intended use |
|---|---|---|---|---|
| AP01 | [shepherd.glb](../../assets/proof/shepherd.glb) / [shepherd.blend](../../source-assets/proof/shepherd.blend) | Created locally by the project generator from primitive geometry, original colours and authored bone motion. No downloaded model, texture, motion-capture data or third-party character reference. No third-party attribution requirement identified. Project distribution licence is an owner decision; this record does not assign CC0 or another licence. | 125,236 bytes; 736 triangles; one mesh/skin, 11 joints, six materials; Idle, Walk, Wave clips | David and a scaled Jesse stand-in share one mesh and rig; final character differentiation remains C04/DEC-08 |
| AP02 | [courtyard-gate.glb](../../assets/proof/courtyard-gate.glb) / [courtyard-gate.blend](../../source-assets/proof/courtyard-gate.blend) | Original locally generated stone shapes/materials; no external assets or purchases | 32,624 bytes; 252 triangles; 21 meshes, two materials, no textures or animation | Representative environment import; explicit gameplay colliders live in the proof scene |
| AP03 | [confirmation.wav](../../assets/proof/confirmation.wav) | Original generated sine-tone cue, no sampled recording | Mono 22,050 Hz, 16-bit PCM, 0.24 seconds | Brief interaction feedback; final ambience/music not supplied |
| AP04 | Courtyard geometry/materials in [courtyard.gd](../../scripts/world/courtyard.gd) plus [presentation scenes](../../scenes/world/provisions.tscn) | Original runtime primitives and colours; no external artwork | Actual visible primitives/draw calls are recorded per browser run | Ground, walls, house, table, jars, trees, hills and objective markers |
| AP05 | [Village scene/modules](../../scenes/world/village.tscn), [module builder](../../scripts/world/village_module.gd), [mesh builder](../../scripts/world/village_mesh.gd), [landscape](../../scripts/world/village.gd), [opaque palette](../../assets/village/opaque_palette.tres) | Original locally authored primitive shapes, placements and colours, 9 November 2026. No external models, textures or reference-image copying. Project distribution licence remains an owner decision. | Whole static village: 9,196 triangles / 40 mesh instances / 40 surfaces, including unchanged AP02 and the bundle; excludes actors/UI. Each generated module uses one opaque batched surface. | Four homes, well, stall, olives, walls, path, planting and hills. Non-owned generated geometry is recreated at load. No Blender import required for these modules. Final art/historical portrayal review remains open. |
| AP06 | [Clothed David GLB](../../assets/characters/david.glb) / [editable Blender file](../../source-assets/characters/david.blend) | Q03 runtime candidate from the Q02 clothed David. The tested Quaternius Standard body derivative and walk use the recorded CC0 terms. David's wardrobe and acting were authored for this project. The publisher's original base ZIP remains unverified. [Licence and provenance](../implementation/q02-quaternius-rig-probe.md#licence-and-provenance) | 672,992 bytes, 9,819 triangles, 65 joints, one skinned surface and one vertex-colour material | Player visual in the village. Owner art review remains open. [Q03 verification](../implementation/q03-movement-and-browser.md) |
| AP07 | [Clothed Jesse GLB](../../assets/characters/jesse.glb) / [editable Blender file](../../source-assets/characters/jesse.blend) | Q04 uses the tested Q02 export. The recorded Standard body terms apply. Jesse's outfit, beard and gestures were authored for the project. [Q02 provenance](../implementation/q02-jesse-clothed-sample.md) | 517,020 bytes, 9,847 triangles, 65 joints, one skinned surface and one vertex-colour material | Jesse's village idle, greeting and pointing |
| AP08 | [Packing table and parcel](../../scenes/world/village/provisions_table.tscn) | Original primitive meshes, cloth colour and rope ties assembled for Q04 | Five wooden surfaces and three parcel surfaces. A static collider protects the approach. | The parcel stays on the table until contact, then follows David's hand and stows at his satchel |
| AP09 | [Q05 village modules](../../scripts/world/village_module.gd), [terrain](../../scripts/world/village.gd) and [contact shadows](../../assets/village/contact_shadow.gdshader) | Original procedural stonework, timber, pottery, linen and shadow shader. Museum references informed materials and colour. [Reference notes](../implementation/q05-village-presentation.md) | 13,056 environment triangles and 46 surfaces. Two shared-material shadow planes add four triangles and two draws when visible. | Village presentation and character grounding |

Blender is an authoring tool, not the source of a downloaded asset licence. The Godot default font and engine remain engine-provided components; retain the engine's notices/credits when preparing a distributable release. No asset purchase, public licensing choice or final art sign-off was made in this task.

## Q01 candidate rights and provenance

Assessed 9 November 2026 for the David–Jesse proposal. The entries below are sourcing candidates. Selection, exact archive verification and import are Q02 work. [Visual brief](../quality-review/david-jesse-visual-brief.md)

| Candidate | Source and terms observed | Intended use | Before adoption |
|---|---|---|---|
| Q01-A · Universal Base Characters Standard | Quaternius lists CC0 for this pack, with Standard interchange files and a separate native Source tier. [Publisher listing](https://quaternius.itch.io/universal-base-characters) | Humanoid base and rig. Original clothing, face and silhouette variations authored in Blender. | Confirm exact Standard bodies, archive/version/hash, terms and editable import. |
| Q01-B · Universal Animation Library Standard | Quaternius lists CC0 and publishes an in-place option. [Publisher listing](https://quaternius.itch.io/universal-animation-library) | Curated walk and idle candidates. Original gestures and pickup authored for the scene. | Verify exact clip names, pack terms, rest pose mapping and absence of unwanted root translation. |
| Q01-C · MakeHuman/MPFB core assets | Publisher identifies its core base mesh, targets and skins as CC0. [Publisher's asset terms](https://static.makehumancommunity.org/about/license.html) | Alternate base and rig workflow. | Record core asset versions and exact inputs. Check any add-on asset separately and export only the game-ready derivative. |

Record the exact source and rights alongside every adopted file. Check any terms included in the download against the specific listing before adding an archive or derived asset to the repository. The creator's separate QAL applies to assets released under that licence. [CC0 deed](https://creativecommons.org/publicdomain/zero/1.0/) · [Creator's QAL terms](https://quaternius.com/license.html)

Q02 verified CC0 on the tested Standard motion archive and the preserved licence for the tested Superhero Male derivative. It baked the in-place `Walk_Loop` onto that body and checked the exported GLB in Godot and Chrome. The original base ZIP remains unverified. The body measures 14,318 triangles before clothing, so production selection and simplification remain open. [Q02 provenance and results](../implementation/q02-quaternius-rig-probe.md)

## Reproduction and import conventions

Use the pinned Blender/Godot toolchain. The generator is [create-proof-assets.py](../../tools/create-proof-assets.py); [asset-metrics.json](../../source-assets/proof/asset-metrics.json) records the exported GLB structure. To intentionally regenerate its three runtime outputs and two editable sources:

```powershell
.\tools\create-proof-assets.ps1 -Overwrite
.\tools\blender.ps1 --background source-assets/proof/shepherd.blend --disable-autoexec --python-exit-code 1 --python tools/check-proof-assets.py
.\tools\godot.ps1 --headless --editor --path . --import
.\tools\godot.ps1 --headless --path . --script tests/proof_checks.gd
.\tools\export-proof.ps1
```

Without `-Overwrite`, the wrapper leaves replacement disabled and the generator refuses to replace existing samples. Back up intentional manual `.blend` changes before regeneration; the generator rebuilds its own sources, rather than merging hand edits. The wrapper preserves Blender's Python argument separator. The source `.gdignore` keeps Blender files out of Godot import and web delivery. Import explicit GLB files; retain their `.import` sidecars and script `.uid` files in version control when a commit is later authorised.

- Metres; character about 1.7 m tall; origin at feet. Blender Z-up/front −Y exports as Godot Y-up/front +Z.
- Mesh transforms applied before binding; one skeleton with stable bone names. No root-motion dependency; the gameplay controller moves the character.
- Idle/Walk/Wave are glTF animation actions, retained with Blender fake users so unused clips survive save/reopen. Godot's actor component sets them to loop and blends switches over 0.16 seconds. Locomotion follows actual movement velocity.
- Simple opaque materials and no texture downloads. Sun shadows/post-processing are absent from this proof.
- Collision is deliberately separate from the visual import. Preserve ground scale and test the gate opening after an asset change.
- Re-export, run import/pose tests, then test the release in a browser after any model/animation change. A successful Blender export alone does not establish usable animation.

## Review still required

Segun reviews silhouette, palette, proportions and portrayal under DEC-08. Final episode characters, sling/encounter animations and environment quality remain later tasks. The original runtime evidence and source fingerprints are linked from the [A05/A04 verification record](../implementation/a05-a04-proof-2026-10-29.md). Subsequent [B01 extraction](../implementation/b01-foundation-2026-10-29.md) moves component scripts/geometry without changing the imported GLBs or editable Blender sources.
