# Chapter 4 · Preparation assets and speech

11 November 2026. Uses the accepted [David–Saul asset/voice pipeline](saul-generated-voices.md), [pavilion presentation](../implementation/m1-cinematic-sample.md) and existing [CC0-derived rig pipeline](../implementation/q02-quaternius-rig-probe.md). Original character assets and earlier frozen previews remain separate.

## Character and equipment pipeline

The separate `david-preparation.glb` retains the youthful David mesh, facial controls, saved appearance options and every original animation at the same duration. Original added geometry supplies a loaned bronze/leather coat, helmet and sheathed sword; added performances supply fitting, removal, a stiff trial walk and a grounded stone pickup. The sheathed weapon is a costume detail, not a new combat mechanic.

The character totals **11,385 triangles** including the optional equipment and is **1,453,472 bytes**. The **1,492-triangle / 48,156-byte** loose equipment GLB is an unskinned bake used on the stand and during the authored handoff. Its parts are baked from the evaluated rig with a shared group origin; measured bone-space attachment offsets align the handoff with the worn coat and helmet. The original body and appearance assets are not overwritten.

[Editable Blender source](../../source-assets/characters/preparation_assets.py) · [Verified hashes, geometry, clip continuity and contact measurements](preparation-asset-manifest.json) · [Runtime attachment offsets](../../apps/playcanvas/src/assets/preparation-armour.json) · [Asset check](../../apps/playcanvas/tests/preparation-assets-check.cjs).

Pickup IK is baked into ordinary joint keys; solver targets do not ship. The measured contact frame retains planted ankles, brings the wrist close to the stone's upper surface and places the palm near the pebble. Runtime alignment uses those measurements; rendered browser evidence checks the actual hand position. A small stone attaches near the fingers after contact and is put away before the next action. This is a stylised authored grasp, not finger simulation or physics-driven dressing. Tunic folds and extreme knee/hip deformation remain limited by the existing skinned garment.

The first rendered pass exposed three defects: water faces pointing downward, loose helmet pieces using inconsistent export origins, and the held stone intersecting the wrist. Winding, evaluated prop baking/attachment offsets and the palm offset/pebble size were corrected. The final [chapter evidence](../implementation/m3-chapter-04.md) records the candidate actually inspected.

## Environments and sound

The pavilion reuses original canopy/carpet textures, equipment, lighting and the accepted Saul character. One foreground guard retains a rigged reaction; the other uses the existing 3,416-triangle standing bake. The separate brook is original project geometry/textures: shallow stream, stones, limestone, scrub, olive trees, painted sky and a woven target. Scene roots own their geometry and lights, so the pavilion and brook are enabled separately. No Goliath/combat scene is loaded for preparation.

The target texture is an original concentric straw weave with an ochre centre. Target practice is an explicit game adaptation, not an event claimed to appear in 1 Samuel 17. The armour, environment and characters retain the existing stylised visual direction; they are not archaeological or photorealistic reconstruction claims.

Wind, water, steps, equipment, pickup and target impact sounds are original Web Audio synthesis. Pause suspends their common context; mute includes the water layer. The accepted three David–Saul recordings and their timing are reused, with eight additional original lines for fitting/refusal, the brook, collection and practice completion.

## Generated voices and rights

The additional lines use the same already rights-checked **Kokoro-82M v1.0** model, standard `am_puck` (David) and `am_michael` (Saul) voices, and **kokoro-onnx 0.6.1** runtime. Model and voice-bank hashes match the accepted pipeline. [New script, settings, durations and WAV hashes](preparation-voice-provenance.json) · [Editable lines](../../source-assets/audio/chapter-04-lines.json) · [Generation tool](../../tools/generate-chapter-dialogue.py).

The [official model card](https://huggingface.co/hexgrad/Kokoro-82M) supplies Apache-2.0 terms and production/commercial-use guidance; [kokoro-onnx](https://github.com/thewh1teagle/kokoro-onnx/blob/main/LICENSE) is MIT. The existing [licence copies](licences/) and this chapter's notice ship with the candidate. No new paid service, cloned voice, named performer imitation, reference-film audio or imported effects pack was used. This continues the documented permission check; it does not assert exclusive rights in a synthetic voice or creative acceptance of a performance.

The audience, refusal and five-stone story context follow [1 Samuel 17:32–40](https://www.bible.com/bible/1/1SA.17.KJV), adapted in original paraphrases. Mouths use waveform envelopes at 30 Hz rather than phoneme alignment. Only recordings and small timing data ship; model/voice generation tools remain in ignored local build storage.
