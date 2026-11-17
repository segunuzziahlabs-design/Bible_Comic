# Chapter 2 · Camp arrival assets and speech

11 November 2026. Reuses the accepted [David–Saul pipeline](saul-generated-voices.md) and [Chapter 1 soldier and environment sources](valley-opening-assets.md).

## Characters, props and animation

The adolescent David mesh, rig, facial controls and appearance morphs remain unchanged. The separate `david-camp.glb` adds the original `deliver_provisions` action and retains the existing performances. [Blender authoring source](../../source-assets/characters/camp_delivery.py) works on the prepared `build/m1/characters/david-dialogue.blend`. It exports GLB and hand-contact measurements; runtime sampling and a filtered upper-body layer hold the basket while the legs walk. The basket changes from hand-following to a measured table position during the set-down. This is an authored prop handoff, not a physics simulation or finger-level grasp solver.

The keeper and Eliab reuse the prepared CC0-derived adult rig, with royal crown/mantle hidden, adjusted cloth colours, and a beard for the keeper. They are provisional cast treatments for creative review. Six background soldiers reuse the 3,416-triangle baked standing mesh. Their stance sway is cheaper than full skeletal animation; the other two brothers are background cast rather than new speaking rigs.

Shelters, cloth textures, limestone ridges, jars, grain sacks, table, basket and provisions are original procedural geometry/textures. Period-oriented stylisation is not a claim of archaeological reconstruction. [Verified asset manifest](camp-asset-manifest.json).

## Voices and sound

Eight original script lines were generated locally with the previously verified **Kokoro-82M v1.0** model and supplied standard voices: `am_puck` (David), `bm_george` (keeper), `am_michael` (Eliab). The model and voice-bank hashes match the accepted sample's licensed files. [Provenance, exact dialogue and hashes](camp-voice-provenance.json) · [Editable script](../../source-assets/audio/chapter-02-lines.json) · [Generator](../../tools/generate-chapter-dialogue.py).

The [official model card](https://huggingface.co/hexgrad/Kokoro-82M) supplies Apache-2.0 terms and production/commercial-use guidance. The [kokoro-onnx runtime](https://github.com/thewh1teagle/kokoro-onnx/blob/main/LICENSE) is MIT. This chapter uses the same rights-checked model/voices and retains the [local licence notices](licences/), which ship in the browser build. No voice cloning, named performer imitation, paid provider or new external asset was used.

The script adapts the provisions/greeting context of 1 Samuel 17:17–22. It is original game dialogue, not a verbatim quotation. The words and performances remain subject to owner creative review. Mouths follow waveform envelopes at 30 Hz; they are not phoneme-aligned facial animation.

Wind, cloth, footsteps and the basket set-down sound are original Web Audio effects. Two already-generated Chapter 1 soldier calls are reused. The scene's AudioContext clock controls dialogue, shots, mouths and prop timing; Pause freezes them together, Restart cancels queued lines, and mute preserves captions. Only WAVs/timing data ship; the voice-generation model and Python environment do not.
