# David–Saul sample: generated voice rights and provenance

Checked 11 November 2026, before generating and importing the recordings. The owner authorised generated character voices with usage rights checked.

The three original paraphrases were generated locally with **hexgrad/Kokoro-82M v1.0**, through **kokoro-onnx 0.6.1**. David uses the supplied `am_puck` voice; Saul uses `am_michael`. These are standard synthetic voice offerings. No recordings of a named actor, voice cloning, paid account or external generation service were used.

## Published permissions checked

- [Official Kokoro model card](https://huggingface.co/hexgrad/Kokoro-82M) declares **Apache-2.0**, explicitly describes production use and welcomes commercial deployments. The [saved model declaration](licences/kokoro-model-declaration.json) records its repository revision. The [Apache licence text](licences/kokoro-apache-2.0.txt) is preserved from apache.org.
- [kokoro-onnx runtime licence](https://github.com/thewh1teagle/kokoro-onnx/blob/main/LICENSE) is **MIT**, permitting use, modification and distribution subject to its notice. A [local copy](licences/kokoro-onnx-mit.txt) is preserved.
- ONNX model and supplied voice bank were obtained from the runtime maintainer's [model-files-v1.0 release](https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.0). Exact file hashes are in the provenance record.

These published permissions support use of the generated standard-voice recordings in the browser game. This check records the actual sources and permissions; it does not assert an exclusive copyright in a synthetic voice or guarantee that a performance meets the owner's creative standard.

## Reproduction and files

See [saul-voice-provenance.json](saul-voice-provenance.json) for original text, voice IDs, speed settings, clip durations and SHA-256 hashes. The source is [generate-saul-dialogue.py](../../tools/generate-saul-dialogue.py). Its local Python environment and the 325 MB generator model remain under ignored `build/voice-tools/`; only the three **24 kHz mono PCM WAV** recordings and their small mouth-cue manifest ship to the browser.

| Clip | Voice | Duration |
| --- | --- | --- |
| Saul's concern | am_michael, speed 0.94 | 2.901 s |
| David's resolve | am_puck, speed 1.01 | 6.229 s |
| Saul's blessing | am_michael, speed 0.94 | 1.984 s |

Dialogue adapts 1 Samuel 17:32–37 in original paraphrase, as set out in the [sample brief](../implementation/m1-cinematic-review-brief.md). It is not an imported recording or a copied modern Bible translation. The sample's quiet wind is original runtime noise synthesis. No third-party music or soldier audio is included; these soldiers listen and react before the battle.

The mouth animation follows amplitude and spectral-band envelopes from each final waveform at 30 Hz, with explicit silent closures. **It is not phoneme-aligned lip sync.** The scene mixes jaw opening and lip rounding with authored body gestures, blinking and expression controls. More detailed articulation and dramatic voice direction remain quality improvements.

The models derive from the project's existing [Quaternius CC0 rig pipeline](../implementation/q02-quaternius-rig-probe.md), with original wardrobe and facial controls added by [saul_conversation.py](../../source-assets/characters/saul_conversation.py). No new unverified character asset was downloaded.
