# Chapter 3 · Challenge assets, performances and speech

11 November 2026. Uses the existing [CC0-derived character pipeline](../implementation/q02-quaternius-rig-probe.md), [valley environment](valley-opening-assets.md) and [accepted conversation/voice workflow](saul-generated-voices.md). No replacement asset pack, paid provider or reference-film audio was imported.

## Character variants

| Runtime asset | Source and additions | Verified size |
| --- | --- | --- |
| `goliath-speaking.glb` | Existing `build/sc02/goliath/goliath.blend`; original speaking-mouth geometry, jaw/beard deformation and eight-second `goliath_speak` gesture. Original ready, challenge, advance, spear and fall clips retained at identical duration. | 11,785 triangles; 953,108 bytes |
| `challenge-soldier.glb` | Prepared `build/m1/characters/saul.blend`; original `react_alarm` backward step and `speak_rebuke` performance. Runtime hides royal/beard parts for the soldier and Eliab, as in earlier chapters. | 10,563 triangles; 1,254,564 bytes before hidden parts |
| David | Existing adolescent dialogue model and appearance choices; listening, speaking, walking and idle performances retained. | Existing asset; no new mesh variant |
| Distant ranks | Chapter 1 standing-soldier bake, shared through GPU instancing. Israelite ranks receive staggered turning/leaning; foreground actors carry the detailed skeletal retreat and reaction. | Existing 3,416-triangle bake per shared mesh |

[Editable Blender authoring script](../../source-assets/characters/challenge_performances.py) · [Hash/clip/geometry manifest](challenge-asset-manifest.json) · [Automated asset checks](../../apps/playcanvas/tests/challenge-assets-check.cjs).

The original Goliath, Saul and David assets are preserved. This scene reuses the valley's terrain, shelters, equipment, original grain/weave/sky textures, lighting, shadows, vegetation, brook and shield-bearer. The distant army does not become dozens of full skeletal actors. This is a stylised real-time production pass using the accepted candidates, not a claim of photorealism, facial capture, cloth simulation or archaeological reconstruction.

## Generated dialogue and rights

Nine original lines were generated locally from [the editable script](../../source-assets/audio/chapter-03-lines.json), using the previously licensed **Kokoro-82M v1.0** and supplied standard voice bank. Goliath uses `am_fenrir`, David `am_puck`, Eliab `am_michael`, and the soldier `bm_george`. The model and voice-bank SHA-256 values match the accepted David–Saul pipeline. [Exact script, voice IDs, settings, durations and WAV hashes](challenge-voice-provenance.json).

Before this chapter's delivery, the [official model card](https://huggingface.co/hexgrad/Kokoro-82M) was checked again: the weights are Apache-2.0 and the published guidance describes production/commercial deployment. The [official voice list](https://huggingface.co/hexgrad/Kokoro-82M/blob/main/VOICES.md) includes the selected standard voices. The [kokoro-onnx runtime licence](https://github.com/thewh1teagle/kokoro-onnx/blob/main/LICENSE) is MIT. Existing [local licence copies](licences/) and the new chapter notice accompany the browser build. No cloning or imitation of a named performer was requested or used. Generated performances still need the owner's creative judgement; the licence check does not imply exclusive rights in a synthetic voice.

The challenge's terms, Israel's fear, David's question, Eliab's anger and the report to Saul follow [1 Samuel 17:8–11 and 23–31](https://www.bible.com/bible/1/1SA.17.KJV). The game uses original paraphrases and compresses the exchanges. It omits the reward discussion in line with the current no-rewards scope. These recordings are not verbatim modern-translation quotations or recordings from the reference film.

Only 24 kHz mono PCM WAVs and small 30 Hz mouth-envelope data ship. The model, voice bank and Python generator environment stay in ignored build tooling. [Generation tool](../../tools/generate-chapter-dialogue.py).

## Sound, timing and limits

The shared Web Audio scene clock drives voices, body poses, facial weights, cameras and the reaction beats. Equal-power positional panners retain browser performance. This chapter uses a larger seven-metre voice reference distance to keep the champion intelligible across cutaways; other chapters retain the three-metre default. Wind, cloth, steps and equipment movement are original runtime synthesis. Explicit soldier lines replace random camp calls during the challenge. Pause holds the clock and motion, mute leaves captions active, and Restart stops scheduled sources.

Mouth movement uses waveform amplitude/spectral envelopes and two lip shapes, not phoneme alignment. The first render showed poor mouth readability against Goliath's beard; the separate mouth surface was brought forward and its opening/contrast increased. The recoil camera was moved to the soldier's front so his face and backward step are visible. Rendered browser captures, beyond animation-file inspection, are linked from the [chapter handover](../implementation/m3-chapter-03.md).
