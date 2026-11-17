# Jesse courtyard assets

13 November 2026 · [Correction plan](../implementation/jesse-courtyard-correction-plan.md) · [Exact manifest](jesse-courtyard-manifest.json)

**Latest staging:** the [distinct messenger](opening-messenger-assets.md) summons David from the flock. Jesse and the courtyard pickup below are retained; the keeper-only summons is superseded.

This correction reuses the original [Q02 Jesse](../implementation/q02-jesse-clothed-sample.md): broad stance, receding grey hair/beard, undyed tunic and clay-coloured mantle. It does not substitute a soldier model for David's father.

- **Model:** [jesse-courtyard.glb](../../apps/playcanvas/src/assets/jesse-courtyard.glb), 9,919 triangles, 829,508 bytes, three render meshes. The shared-palette body is merged for the browser; separate small lip/mouth surfaces supply `SpeakOpen` and `SpeakRound`. The retained face/beard gets a restrained jaw deformation. The source greeting, explanation/pointing and relaxed idle clips are preserved.
- **Authoring:** [jesse_courtyard.py](../../source-assets/characters/jesse_courtyard.py) reads the unchanged [Jesse Blender source](../../source-assets/characters/jesse.blend), exports the variant and saves a new editable blend under ignored `build/jesse-courtyard/`. The original model and Godot project are preserved.
- **Rights:** same retained Quaternius CC0 mesh/rig basis and original project wardrobe/animation as the documented Q02 asset. No new downloaded character or asset service was introduced.
- **Dialogue:** seven original lines in [courtyard-lines.json](../../source-assets/audio/courtyard-lines.json). Keeper uses `am_michael`, David uses `am_puck`, Jesse uses `bm_lewis`. The same retained local Kokoro-82M v1.0 / kokoro-onnx pipeline generated the recordings. [Provenance](courtyard-voice-provenance.json) includes actual final WAV hashes, source script, voice IDs and model/voice-bank hashes; both generator asset hashes match the [previously checked licensed sample](saul-generated-voices.md). No named actor was cloned or external voice service provisioned.
- **Mouth timing:** final-waveform amplitude/spectral envelopes, not phoneme alignment. Jesse's greeting and pointing are existing authored body clips; detailed facial expressions remain limited by the retained asset.
- **Environment:** original [courtyard source](../../apps/playcanvas/src/world/jesse-courtyard.ts): open earth court, plastered homes with stone footings and flat timber/reed roofs, jars, work shade, herbs and a low provisions bench. The front and rear entrances have tested walking routes. This is a stylised Iron Age household interpretation, not an archaeological reconstruction.
- **Story:** Jesse personally gives the provisions errand. The keeper only directs David home and watches the flock. Courtyard location and dialogue staging are creative presentation; the underlying provisions errand/keeper follow 1 Samuel 17. The three spear exchanges remain labelled creative gameplay.

Reproduce from the repository with the pinned Blender:

```powershell
. ./tools/Toolchain.ps1
$courtyardBlender = (Get-BibleComicToolchain).Blender
& $courtyardBlender --background source-assets/characters/jesse.blend --python-exit-code 1 --python source-assets/characters/jesse_courtyard.py -- build/jesse-courtyard
Copy-Item -LiteralPath build/jesse-courtyard/jesse-courtyard.glb -Destination apps/playcanvas/src/assets/jesse-courtyard.glb
& build/voice-tools/venv/Scripts/python.exe tools/generate-chapter-dialogue.py build/voice-tools source-assets/audio/courtyard-lines.json
```

Runtime licence/provenance notice: [jesse-courtyard.txt](../../apps/playcanvas/public/licences/jesse-courtyard.txt). The generator/runtime/model stay in ignored development tooling; they are not shipped with the game.
