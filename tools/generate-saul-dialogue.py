"""Generate the three M1 lines locally with Kokoro and write audio-driven mouth cues."""
import hashlib
import importlib.metadata
import json
from pathlib import Path
import sys

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro


root = Path(__file__).resolve().parents[1]
model_dir = Path(sys.argv[1]).resolve()
output = root / "apps/playcanvas/src/assets/saul-dialogue"
output.mkdir(parents=True, exist_ok=True)
kokoro = Kokoro(str(model_dir / "kokoro-v1.0.onnx"), str(model_dir / "voices-v1.0.bin"))

lines = [
    ("saul-concern", "Saul", "am_michael", .94, "You are young. Goliath has fought for years."),
    ("david-answer", "David", "am_puck", 1.01,
     "I have guarded my father's sheep. The Lord who delivered me from lions and bears will help me face him."),
    ("saul-blessing", "Saul", "am_michael", .94, "Go. May the Lord be with you."),
]
manifest = []
for name, speaker, voice, speed, text in lines:
    audio, sample_rate = kokoro.create(text, voice=voice, speed=speed, lang="en-us")
    # Use the actual waveform to close the mouth in pauses and follow the syllable envelope.
    hop = sample_rate // 30
    window = sample_rate // 40
    rms = np.array([np.sqrt(np.mean(audio[i:i + window] ** 2))
                    for i in range(0, len(audio), hop)])
    reference = max(.02, float(np.percentile(rms, 88)))
    cues = []
    for frame, value in enumerate(rms):
        opening = float(np.clip((value / reference - .06) / .94, 0, 1))
        segment = audio[frame * hop:frame * hop + window]
        spectrum = np.abs(np.fft.rfft(segment * np.hanning(len(segment))))
        frequencies = np.fft.rfftfreq(len(segment), 1 / sample_rate)
        low = float(spectrum[(frequencies > 150) & (frequencies < 750)].sum())
        full = max(.001, float(spectrum[(frequencies > 150) & (frequencies < 3500)].sum()))
        rounded = opening * float(np.clip((low / full - .38) * 2.1, 0, .8))
        cues.append([round(frame / 30, 4), round(opening, 4), round(rounded, 4)])
    cues.append([round(len(audio) / sample_rate, 4), 0, 0])
    destination = output / (name + ".wav")
    sf.write(destination, audio, sample_rate, subtype="PCM_16")
    manifest.append({
        "id": name, "speaker": speaker, "voice": voice, "speed": speed, "text": text,
        "duration": len(audio) / sample_rate, "mouthCues": cues,
        "sha256": hashlib.sha256(destination.read_bytes()).hexdigest(),
    })
    print(name, round(len(audio) / sample_rate, 2), "seconds", flush=True)

(output / "dialogue.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
provenance = {
    "generator": "kokoro-onnx",
    "generatorVersion": importlib.metadata.version("kokoro-onnx"),
    "model": "Kokoro-82M v1.0", "modelLicence": "Apache-2.0",
    "modelCard": "https://huggingface.co/hexgrad/Kokoro-82M",
    "runtimeLicence": "MIT",
    "source": "https://github.com/thewh1teagle/kokoro-onnx",
    "modelSha256": hashlib.sha256((model_dir / "kokoro-v1.0.onnx").read_bytes()).hexdigest(),
    "voicesSha256": hashlib.sha256((model_dir / "voices-v1.0.bin").read_bytes()).hexdigest(),
    "mouthTiming": "Waveform amplitude and spectral-band envelopes, sampled at 30 Hz",
    "lines": [{key: value for key, value in line.items() if key != "mouthCues"} for line in manifest],
}
(root / "docs/assets/saul-voice-provenance.json").write_text(
    json.dumps(provenance, indent=2) + "\n", encoding="utf-8")
