"""MSR-03 phrase-directed takes using the project's existing local voice runtime.

Run with build/voice-tools/venv/Scripts/python.exe and the model directory.
The original saul-dialogue recordings are retained for comparison.
"""
from datetime import date
import hashlib
import importlib.metadata
import json
from pathlib import Path
import re
import sys

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

root = Path(__file__).resolve().parents[1]
model_dir = Path(sys.argv[1]).resolve()
script = root / "source-assets/audio/saul-performance.json"
spec = json.loads(script.read_text(encoding="utf-8"))
output = root / "apps/playcanvas/src/assets/saul-performance-dialogue"
output.mkdir(parents=True, exist_ok=True)
engine = Kokoro(str(model_dir / "kokoro-v1.0.onnx"), str(model_dir / "voices-v1.0.bin"))
manifest = []

def words(text):
    return re.findall(r"[a-z]+(?:'[a-z]+)?", text.lower())

for line in spec["lines"]:
    assert words(line["text"]) == words(" ".join(p["text"] for p in line["phrases"])), "Delivery must preserve the dialogue's words"
    chunks, phrases, cursor = [], [], 0
    for phrase in line["phrases"]:
        audio, rate = engine.create(phrase["text"], voice=line["voice"], speed=phrase["speed"], lang="en-us")
        audio = np.asarray(audio, dtype=np.float32).copy()
        assert rate == 24000 and np.isfinite(audio).all()
        # Gentle edge fades prevent clicks between complete sentence takes.
        fade = min(int(rate * .008), len(audio) // 2)
        audio[:fade] *= np.linspace(0, 1, fade)
        audio[-fade:] *= np.linspace(1, 0, fade)
        phrases.append({**phrase, "start": cursor / rate, "end": (cursor + len(audio)) / rate})
        chunks.append(audio)
        silence = np.zeros(round(rate * phrase["pauseAfter"]), dtype=np.float32)
        chunks.append(silence)
        cursor += len(audio) + len(silence)
    final = np.concatenate(chunks)
    # Only attenuate an exceptional peak; never compress or pitch-shift the cast.
    peak = float(np.max(np.abs(final)))
    if peak > .94:
        final *= .94 / peak
    destination = output / (line["id"] + ".wav")
    sf.write(destination, final, rate, subtype="PCM_16")
    # Derive cues from the actual final PCM that will be decoded in the browser.
    final, rate = sf.read(destination, dtype="float32")
    hop, window = rate // 30, rate // 40
    rms = np.array([np.sqrt(np.mean(final[i:i + window] ** 2)) for i in range(0, len(final), hop)])
    reference = max(.02, float(np.percentile(rms, 88)))
    cues = []
    for frame, value in enumerate(rms):
        opening = float(np.clip((value / reference - .06) / .94, 0, 1))
        part = final[frame * hop:frame * hop + window]
        spectrum = np.abs(np.fft.rfft(part * np.hanning(len(part))))
        freq = np.fft.rfftfreq(len(part), 1 / rate)
        low = float(spectrum[(freq > 150) & (freq < 750)].sum())
        full = max(.001, float(spectrum[(freq > 150) & (freq < 3500)].sum()))
        rounded = opening * float(np.clip((low / full - .38) * 2.1, 0, .8))
        cues.append([round(frame / 30, 4), round(opening, 4), round(rounded, 4)])
    cues.append([round(len(final) / rate, 4), 0, 0])
    manifest.append({**line, "phrases": phrases, "duration": len(final) / rate, "mouthCues": cues,
                     "sha256": hashlib.sha256(destination.read_bytes()).hexdigest()})
    print(line["id"], round(len(final) / rate, 3), "seconds", flush=True)

(output / "dialogue.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
provenance = {
    "task": "MSR-03", "checked": str(date.today()), "generator": "kokoro-onnx",
    "generatorVersion": importlib.metadata.version("kokoro-onnx"), "model": "Kokoro-82M v1.0",
    "modelLicence": "Apache-2.0", "runtimeLicence": "MIT",
    "modelCard": "https://huggingface.co/hexgrad/Kokoro-82M",
    "runtimeLicenceSource": "https://github.com/thewh1teagle/kokoro-onnx/blob/main/LICENSE",
    "modelSha256": hashlib.sha256((model_dir / "kokoro-v1.0.onnx").read_bytes()).hexdigest(),
    "voicesSha256": hashlib.sha256((model_dir / "voices-v1.0.bin").read_bytes()).hexdigest(),
    "script": script.relative_to(root).as_posix(), "generatorScript": "tools/generate-saul-performance.py",
    "mouthTiming": "Final PCM amplitude/spectral envelopes at 30 Hz; not phoneme alignment",
    "processing": "Complete sentence takes, directed punctuation/pace, explicit pauses, 8 ms edge fades; no pitch shifting or cloning",
    "acceptance": "Candidate for owner listening review; measurements do not approve intonation or acting",
    "lines": [{k: v for k, v in line.items() if k != "mouthCues"} for line in manifest],
}
(root / "docs/assets/msr03-saul-voice-provenance.json").write_text(json.dumps(provenance, indent=2) + "\n", encoding="utf-8")
