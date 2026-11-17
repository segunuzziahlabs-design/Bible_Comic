# Chapter 5: assets, dialogue and rights

12 November 2026. [Scoped plan](../implementation/m3-chapter-05-brief.md). Reuses the accepted youthful David, speaking Goliath, clothed soldier rigs and Elah presentation. No new external art was downloaded and no previous character export was overwritten.

## Source assets

- `apps/playcanvas/src/assets/david-dialogue.glb`: existing teenage proportions, appearance choices, speech/listening and sling clips from the accepted Saul pipeline.
- `goliath-speaking.glb`: existing adult armour, spear, speaking face, advance, thrust and non-graphic fall from Chapter 3/SC-02.
- `challenge-soldier.glb` and `soldier-standing-lod.glb`: two foreground rigged reactions plus cheaper instanced clothed ranks, retained from the Elah chapters.
- Elah environment, terrain, painted sky, woven shelters, limestone, olive trees and scrub are existing original project work. Chapter 5 keeps the playable ground/collision surface aligned while retaining the more distant ridges. Combat props are selectively restored; the old fixture dressing remains hidden.

[Base rig provenance](../implementation/q02-quaternius-rig-probe.md) · [Goliath/combat source](../implementation/playcanvas-sc02-encounter.md) · [Speaking character source](challenge-assets.md) · [Saul pipeline](saul-generated-voices.md).

## New recordings

Five original paraphrases adapt [1 Samuel 17:41–50](https://www.bible.com/bible/1/1SA.17.KJV). The staff is context in Goliath's words; gameplay uses the sling. The telegraphed thrust, aim assistance and refill are game adaptations, not a literal reconstruction of every verse. The fall remains non-graphic.

| Recording | Speaker / standard voice | Duration |
| --- | --- | --- |
| goliath-contempt | Goliath / am_fenrir | 3.861 s |
| goliath-threat | Goliath / am_fenrir | 2.496 s |
| david-faith | David / am_puck | 5.888 s |
| david-battle | David / am_puck | 4.651 s |
| soldier-watch | Soldier / bm_george | 2.283 s |

The [Kokoro model card](https://huggingface.co/hexgrad/Kokoro-82M) and [kokoro-onnx licence](https://github.com/thewh1teagle/kokoro-onnx/blob/main/LICENSE) were checked again on 12 November. The model declaration remains Apache-2.0 and the runtime MIT. This is the same locally stored model/bank as the earlier generated voices; hashes are compared by the asset check. Existing saved model/runtime notices ship with the new chapter notice. Standard supplied synthetic voices were used; there was no voice cloning, named-actor imitation, paid provider or imported reference-film recording. These permissions support the recorded use; they do not establish exclusive rights to a synthetic voice or creative acceptance of its acting.

[Editable script](../../source-assets/audio/chapter-05-lines.json) · [Generator](../../tools/generate-chapter-dialogue.py) · [Exact provenance](duel-voice-provenance.json) · [Checked asset hashes](duel-asset-manifest.json) · [Browser notice](../../apps/playcanvas/public/licences/duel.txt).

Reproduction from the repository root:

```powershell
& build/voice-tools/venv/Scripts/python.exe tools/generate-chapter-dialogue.py build/voice-tools source-assets/audio/chapter-05-lines.json
node apps/playcanvas/tests/duel-assets-check.cjs
```

The 28-second exchange schedules voices at 1.4, 6, 9.5, 16.5 and 22.2 seconds, with no line overlap. Body poses and captions follow that audio clock. Mouth motion uses 30 Hz waveform amplitude/spectral envelopes; it is not phoneme-aligned articulation. Wind, steps, spear, sling and impacts are retained original runtime synthesis. Chapter 6 cheering/retreat production is intentionally outside this step.
