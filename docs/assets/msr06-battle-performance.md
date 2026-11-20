# MSR-06: David's faith response

20 November 2026. One directed take uses the existing standard synthetic **am_puck** voice. Every word remains the same. The original [duel recording](../../apps/playcanvas/src/assets/duel-dialogue/david-faith.wav) is retained; the [new recording](../../apps/playcanvas/src/assets/battle-performance-dialogue/david-faith.wav) adds a deliberate thought between the weapons and David's statement of faith.

Actual original/revised durations: **5.888 / 6.019 seconds**. The cue still starts at **9.5 seconds** and ends before the next line at **16.5 seconds**; the 28-second confrontation and combat timings are unchanged. The existing gesture is fitted forward to the actual take, and mouth envelopes come from the final 24 kHz mono PCM16. These are waveform/spectral controls, not phoneme-specific lips.

The intended delivery is quiet conviction. The local generator supports phrase pace/punctuation and pauses, not full acting directions. The first exploratory take was shorter than intended; the final uses speeds **0.86 / 0.84** and a **0.28-second** thought pause. No pitch shifting, voice cloning or post-generation time stretching was used. Artistic improvement and intonation require the owner's listening review.

The [official model card](https://huggingface.co/hexgrad/Kokoro-82M) was checked on 20 November 2026 and declares Apache-2.0; the [official runtime licence](https://raw.githubusercontent.com/thewh1teagle/kokoro-onnx/main/LICENSE) declares MIT. Model/voice-bank hashes match the existing MSR-03 production record. Existing Apache/MIT notices remain in the application licence directory. The model/runtime stay outside the browser build; no new service, dependency or subscription was introduced.

Direction: [battle-performance.json](../../source-assets/audio/battle-performance.json). Generator: [generate-battle-performance.py](../../tools/generate-battle-performance.py). Exact settings, phrase boundaries, model/output/original hashes and declared licensing sources: [provenance](msr06-battle-voice-provenance.json).

```powershell
& build/voice-tools/venv/Scripts/python.exe tools/generate-battle-performance.py build/voice-tools
node apps/playcanvas/tests/cast-performance-check.cjs
```
