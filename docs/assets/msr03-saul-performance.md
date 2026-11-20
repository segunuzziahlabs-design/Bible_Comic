# MSR-03 David–Saul intonation sample

20 November 2026. Owner direction: “No, just improve the intonation.” This revision retains the existing cast and every word of the biblical paraphrases. It changes sentence phrasing, punctuation supplied to synthesis, sentence-specific pace and explicit thought pauses. The old [Saul recordings and generation record](saul-generated-voices.md) remain available; they are not overwritten.

| Line | Intended delivery | Original duration | Revised duration |
| --- | --- | --- | --- |
| Saul's concern | Measured concern; a thought between David's youth and Goliath's experience | 2.901 s | 3.504 s |
| David's answer | Matter-of-fact experience, then quiet conviction; no shouting | 6.229 s | 6.067 s |
| Saul's blessing | Firm permission followed by an unhurried benediction | 1.984 s | 2.691 s |

These descriptions are **direction and intended effect**, not an independent listening verdict. The local generator does not accept full acting/emotion instructions: the JSON delivery notes document intent, while punctuation, sentence takes, pace and pauses are the actual synthesis controls. Segun's listening review is required to accept the intonation. No emotion recognition, pitch-range statistic or timing check substitutes for that review.

## Production and provenance

- David remains standard synthetic `am_puck`; Saul remains `am_michael`. No named-person imitation or voice cloning.
- Existing Kokoro-82M v1.0 model and voice-bank hashes match the [original provenance](saul-voice-provenance.json). The local generator/runtime remain outside the browser build. No new service, package or subscription was introduced.
- The [official model card](https://huggingface.co/hexgrad/Kokoro-82M) was rechecked on 20 November and declares Apache-2.0. The [runtime's licence](https://github.com/thewh1teagle/kokoro-onnx/blob/main/LICENSE) was rechecked and declares MIT. The project's existing licence notices are retained. This records the declared permissions; it is not a guarantee of artistic suitability or exclusive rights in a synthetic voice.
- Complete sentence takes receive 8 ms edge fades and explicit pauses; exceptional peaks are only attenuated. No pitch shifting, time stretching or dynamic compression was applied. All outputs are 24 kHz mono PCM16.
- Mouth envelopes are regenerated from the **final quantised PCM**, including inserted silence, at 30 Hz. They are amplitude/spectral controls, not phoneme-specific lip sync. The audience's restrained face filter runs on the paused audio clock.

Editable direction: [saul-performance.json](../../source-assets/audio/saul-performance.json). Generator: [generate-saul-performance.py](../../tools/generate-saul-performance.py). Exact phrase boundaries/settings, clip lengths and SHA-256 hashes: [msr03-saul-voice-provenance.json](msr03-saul-voice-provenance.json).

```powershell
& build/voice-tools/venv/Scripts/python.exe tools/generate-saul-performance.py build/voice-tools
node apps/playcanvas/tests/saul-performance-check.cjs
```

Current canonical Chapter 4 imports `apps/playcanvas/src/assets/saul-performance-dialogue/`; the historical `saul.html` showcase continues to use the original recordings. Compare the [MSR-02 scene](http://127.0.0.1:4217/preparation.html?review=1&cinematic=1) and [MSR-03 sample](http://127.0.0.1:4218/preparation.html?review=1&cinematic=1). Both review entries leave normal saved progress unchanged.

The [MSR-03 verification report](../quality-review/msr03-speech-and-reactions.md) records actual browser timing, routing, lifecycle evidence and remaining acceptance.
