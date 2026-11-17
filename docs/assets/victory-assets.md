# Victory: characters, crowd, audio and provenance

12 November 2026. [Chapter plan](../implementation/m3-chapter-06-brief.md). Retains the existing teenage David/appearance choices, Goliath and Elah environment. No external character pack, reference-film media, paid provider or replacement rig was introduced.

## Characters and crowd

The existing prepared soldier source is `build/m3-ch03/challenge-soldier.blend`, derived from the documented [Quaternius CC0 pipeline](../implementation/q02-quaternius-rig-probe.md) and [Chapter 3 character work](challenge-assets.md). [New authoring script](../../source-assets/characters/victory_soldiers.py) exports separate assets under ignored `build/m3-ch06`; preceding GLBs are preserved.

- `victory-soldier.glb` retains speaking morphs and the existing clips, removes the hidden royal accessories, adds a shield/spear attached through the rig, a three-second `victory_cheer` and a two-thirds-second `retreat_run`. One foreground soldier cheers and the shield-bearer turns/runs; the bearer's route curves around the fallen champion.
- `victory-crowd.glb` contains **six running poses and three cheer poses**, each **1,744–1,746 exported triangles**, with baked material/vertex colours and no skeletons. Each pose is a single mesh/material. At runtime, each group draws only the instances assigned to that current pose; setting actual instance counts avoids drawing hidden zero-scale copies.
- Twenty-four Philistines flee with staggered starts; twenty-four Israelites raise their arms/shields in staggered pose cycles. Foreground rigs carry smooth detailed motion. Distant animation deliberately uses discrete baked poses; it is not 48 independently simulated skeletal actors.
- Existing David dialogue/listening/acknowledgement clips supply the closing response. Goliath is posed at the established non-graphic fallen state. The shared earlier Elah dressing/crowds are hidden where the new cast replaces them.

The first rendered crowd appeared too dark because palette albedo was multiplied by material albedo. The bake now writes a single material colour per vertex, with faction cloth colours baked separately and neutral runtime tint. Source textures are simplified for the distant tier. This is a stylised game asset treatment, not an archaeological or photorealistic reconstruction.

[Exact checked file hashes, triangles and clip checks](victory-asset-manifest.json) · [Asset verification](../../apps/playcanvas/tests/victory-assets-check.cjs).

## Recorded voices and rights

Seven original game lines come from the [editable Chapter 6 script](../../source-assets/audio/chapter-06-lines.json). [Exact voice IDs, durations and WAV/model/bank hashes](victory-voice-provenance.json). Same local **Kokoro-82M v1.0 / kokoro-onnx 0.6.1** as previous chapters; the generator model and voice-bank hashes are compared with Chapter 5.

The [official model card](https://huggingface.co/hexgrad/Kokoro-82M), [published voice list](https://huggingface.co/hexgrad/Kokoro-82M/blob/main/VOICES.md) and [runtime licence](https://github.com/thewh1teagle/kokoro-onnx/blob/main/LICENSE) were checked on 12 November before production. The model is Apache-2.0, the runtime MIT; existing notices accompany the [new chapter notice](../../apps/playcanvas/public/licences/victory.txt). Standard supplied voices are used, without cloning or named-performer imitation. These permissions support this use; they do not imply exclusive ownership of a synthetic voice or creative approval of its acting.

| Clip | Standard voice | Duration |
| --- | --- | --- |
| Retreat call | am_fenrir | 2.667 s |
| Israelite recognition | bm_george | 2.581 s |
| Israel cheer | bm_george | 1.280 s |
| Victory cheer | am_michael | 1.835 s |
| David cheer | am_liam | 1.237 s |
| David's response | am_puck | 2.880 s |
| Closing narration | bm_george | 7.019 s |

Mouth weights use 30 Hz amplitude/spectral envelopes, not phoneme alignment. The cheering mix layers the three short recordings at eight authored onsets with moderate positional/pitch variations. Restart cancels scheduled speech and music before a fresh sequence. Muting covers voice/crowd and the separate music output.

The restrained score is original Web Audio triangle/plucked-note synthesis, with no imported melody, SoundFont or recording. Wind, steps and equipment are existing original project synthesis. The sound is a production candidate for owner review, not a claim of a recorded live crowd or historical-instrument authenticity.

## Story treatment and reproduction

The ending draws on [1 Samuel 17:50–53](https://www.bible.com/bible/1/1SA.17.KJV), with original paraphrases and a closing reflection. The previously approved non-graphic treatment carries forward: attention follows the fleeing Philistines, Israel's response and David, rather than introducing a new graphic action. The choreography, camera compression and dialogue are game adaptations. No reward/achievement is awarded.

```powershell
. ./tools/Toolchain.ps1
$victoryBlender=(Get-BibleComicToolchain).Blender
$victoryArgs=@('--background','build/m3-ch03/challenge-soldier.blend','--python-exit-code','1','--python','source-assets/characters/victory_soldiers.py','--','build/m3-ch06')
& $victoryBlender @victoryArgs
Copy-Item -LiteralPath build/m3-ch06/victory-soldier.glb,build/m3-ch06/victory-crowd.glb -Destination apps/playcanvas/src/assets
& build/voice-tools/venv/Scripts/python.exe tools/generate-chapter-dialogue.py build/voice-tools source-assets/audio/chapter-06-lines.json
node apps/playcanvas/tests/victory-assets-check.cjs
```
