# Messenger summons at the flock

13 November 2026 · [Owner correction/plan](../implementation/opening-messenger-audio-plan.md) · [Exact manifest](opening-messenger-assets.json)

The field scene remains first. A **distinct messenger** walks from the courtyard entrance to David and says that Jesse is calling. He does not give the grain/loaves/cheeses errand. A separate keeper stays with the flock. David then walks to Jesse's courtyard for the retained father–son exchange and separate pickup.

Both field actors instantiate the existing `challenge-soldier.glb` rig/mesh resource with independent animation and clothing tint. Messenger cloth is blue-grey; keeper cloth is earth-toned. Royal accessories are hidden. Existing walk/speaking/listening clips and mouth controls are reused. No new downloaded model, library or service was introduced. Jesse's [clay mantle/grey beard model](jesse-courtyard-assets.md) and David's teenage appearance are retained.

Three original paraphrased lines were generated locally with the same retained Kokoro-82M v1.0 / kokoro-onnx tooling and voice bank as the [previous rights check](saul-generated-voices.md):

| Speaker / line | Standard voice | Duration |
| --- | --- | --- |
| Messenger: Jesse is calling | `am_michael` | 5.227 s |
| David: leave the sheep with their keeper | `am_puck` | 4.288 s |
| Keeper: go to your father | `bm_daniel` | 3.072 s |

[Editable script](../../source-assets/audio/messenger-lines.json) · [Generated voice provenance](messenger-voice-provenance.json). Final WAV hashes and the complete model/voice-bank hashes were checked; both generator asset hashes match the retained licensed sample. No named actor was cloned or reference-film audio used. Mouth timing remains waveform-envelope driven, not phoneme alignment.

The messenger's summons and courtyard staging are creative presentation. Jesse personally gives the underlying biblical provisions errand. Runtime notice: [opening-messenger-audio.txt](../../apps/playcanvas/public/licences/opening-messenger-audio.txt). Earlier candidate assets/evidence remain preserved.
