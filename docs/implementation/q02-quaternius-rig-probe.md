# Q02 Quaternius licence and rig probe

9 November 2026 · The technical probe passed with one Quaternius Superhero Male body and the Standard library's in-place `Walk_Loop`. Blender exported one animated GLB, which imported and looped in Godot and in a local Web export. [Playback evidence](evidence/q02-2026-11-09/browser-playback.json)

## Licence and provenance

Both official Standard listings identify their assets as **CC0 1.0 Universal**. Quaternius also publishes QAL for assets released under that separate licence. The terms for the specific files used in the probe come from the pack listings and licence files below. [Base pack](https://quaternius.itch.io/universal-base-characters) · [Animation pack](https://quaternius.itch.io/universal-animation-library) · [QAL](https://quaternius.com/license.html) · [CC0 deed](https://creativecommons.org/publicdomain/zero/1.0/)

| Input | Verification |
|---|---|
| Universal Animation Library Standard, June 2026 release | Retrieved an intact archive from the pinned Ludots-Assets mirror. Its 15,904,933 bytes and SHA-256 matched the mirror's upstream-download manifest. ZIP integrity passed. The archive contains CC0 in `License.txt` and names `Unreal-Godot/UAL1_Standard.glb` as the variant with root motion disabled. The selected clip is `Walk_Loop`. [Pinned archive manifest](https://github.com/MightyBubble/Ludots-Assets/blob/fab331eff1cb9c552c60399ea10186ef675cd460/manifest.animations.json) · [Bundled motion licence](evidence/q02-2026-11-09/motion-license.txt) |
| Superhero Male from Universal Base Characters Standard | Used the pinned avatar repository's repackaged GLB. Its provenance identifies `Base Characters/Godot - UE/Superhero_Male_FullBody.gltf` as the source and describes retaining the mesh and rig while replacing the material. The exact repackaged file was hashed, and its preserved Standard licence copy states CC0. [Pinned body provenance](https://github.com/programasweights/avatar/blob/a488723e3a93d73d5c562d88f8a85353c37bc721/ASSETS.md) · [Preserved base licence](evidence/q02-2026-11-09/base-license.txt) |

The official free download flow opened for both packs, but neither ZIP appeared locally and the direct download-page request returned HTTP 429. The animation archive came from the checksum-matched mirror. The publisher's original **base ZIP** was unavailable for independent inspection, so its hash and contents remain unverified here. The body licence conclusion applies to the tested derivative, supported by the creator's listing and the preserved pack terms. Check the exact archive and terms for any different body or outfit selected later. [File hashes](evidence/q02-2026-11-09/result.json)

## Pipeline and results

| Step | Evidence |
|---|---|
| Blender 4.5.15 LTS import | Both rigs had the same 65 joint names and parents. The largest difference in rest-axis orientation was 12.76°. The bake maps each source rotation delta into the target bone's rest axes and transfers pelvis motion in proportion to pelvis height. The character's feet face Blender −Y and export toward Godot +Z. |
| In-place bake | Sampled 33 poses across the 1.333-second clip at 24 FPS. The source root showed 0.000 m horizontal drift across the samples. The target keeps the root fixed and retains the pelvis and limb motion. The first and last sampled foot-joint positions matched. |
| Editable save and GLB | The saved Blender file reopened with one armature, the `walk_forward` action and a changing toe pose. The GLB contains one skin, 65 joints, three mesh surfaces, one material, no texture images and one animation. |
| Fresh Godot 4.7.2 import | The headless check passed. Two cycles showed 0.000 m horizontal root drift, 0.810 m of left toe fore/aft travel and 0.191 m of toe lift range. Advancing either instance left the other's sampled pose and playback state independent. |
| Local Web export | Chrome ran the Compatibility export. Seventeen browser samples confirmed both instances cycled and kept different phases. The check captured zero script, console or failed-request errors. The screenshots show the same rig at two phases and viewing angles. [Pose A](evidence/q02-2026-11-09/walk-phase-1.png) · [Pose B](evidence/q02-2026-11-09/walk-phase-4.png) |

The scratch preset initially omitted the scripted GLB dependency when exporting selected scenes. Exporting the scratch project's resources with the headless check script excluded included the GLB and passed playback. [Godot test output](evidence/q02-2026-11-09/godot.log) · [Final export output](evidence/q02-2026-11-09/web-export.log)

## Production implications

The 14,318-triangle base exceeds Q01's 8,000–10,000 triangle working target per clothed actor. The baked GLB is 866,400 bytes raw and about 324 KiB when gzip-compressed in isolation. The scratch Web PCK is about 420 KiB gzip. These costs cover one shared untextured asset. Re-measure after adding the two period outfits and their scene-specific clips. The isolated browser playback did not measure village performance or foot sliding while a player controller translates the body. [Q01 guardrails](../quality-review/q01-performance-baseline.md)

Proceed with a clothed test variant using this rig and walk route. Remove body geometry hidden by clothing and check elbow, knee and foot deformation at the gameplay and conversation distances. The current stock body has exaggerated proportions, so the David and Jesse silhouettes and the scene gestures remain separate production work. [Visual and shot brief](../quality-review/david-jesse-visual-brief.md)

## Local handoff

- Editable sample and exported file. [Blender source](../../build/q02/quaternius-walk-probe.blend) · [GLB](../../build/q02/godot/quaternius-walk-probe.glb)
- Scratch scene and local test tools. [Godot project](../../build/q02/godot/project.godot) · [Bake script](../../build/q02/bake_walk.py) · [Godot playback check](../../build/q02/godot/check_walk.gd) · [Browser check](../../build/q02/check_web.cjs)
- Status and integrity. The probe is complete and the remainder of Q02 is pending. The verifier matched the 88 recorded project files, both original DOCX hashes and the 15 frozen candidate files. [Machine-readable results](evidence/q02-2026-11-09/result.json)
