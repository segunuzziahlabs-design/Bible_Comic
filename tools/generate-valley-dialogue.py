"""Generate original Chapter 1 lines with the existing licensed local Kokoro pipeline."""
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
output = root / 'apps/playcanvas/src/assets/valley-dialogue'
output.mkdir(parents=True, exist_ok=True)
engine = Kokoro(str(model_dir / 'kokoro-v1.0.onnx'), str(model_dir / 'voices-v1.0.bin'))
lines = [
    ('valley', 'Narrator', 'bm_george', .94, 'On the hills above the Valley of Elah, two armies face one another.'),
    ('sentinel', 'Soldier', 'am_michael', .94, 'Keep to the path, young shepherd. The Philistines hold the far ridge.'),
    ('champion', 'Narrator', 'bm_george', .94, 'Across the brook stands Goliath, the Philistine champion. His challenge has troubled Israel for forty days.'),
    ('david', 'David', 'am_puck', .94, 'My brothers are here. I must find them.'),
    ('survey', 'Soldier', 'am_michael', .94, 'You can see their ranks beyond the brook. Bring your provisions to the baggage keeper.'),
    ('hold', 'Distant soldier', 'am_michael', 1.0, 'Hold the line.'),
    ('ready', 'Distant soldier', 'bm_george', 1.0, 'Stand ready.'),
]
manifest = []
for name, speaker, voice, speed, text in lines:
    audio, sample_rate = engine.create(text, voice=voice, speed=speed, lang='en-gb' if voice.startswith('b') else 'en-us')
    hop, window = sample_rate // 30, sample_rate // 40
    rms = np.array([np.sqrt(np.mean(audio[i:i+window] ** 2)) for i in range(0, len(audio), hop)])
    reference = max(.02, float(np.percentile(rms, 88)))
    cues = []
    for index, value in enumerate(rms):
        opening = float(np.clip((value / reference - .06) / .94, 0, 1))
        part = audio[index * hop:index * hop + window]
        spectrum = np.abs(np.fft.rfft(part * np.hanning(len(part))))
        frequencies = np.fft.rfftfreq(len(part), 1 / sample_rate)
        low = float(spectrum[(frequencies > 150) & (frequencies < 750)].sum())
        full = max(.001, float(spectrum[(frequencies > 150) & (frequencies < 3500)].sum()))
        rounded = opening * float(np.clip((low / full - .38) * 2.1, 0, .8))
        cues.append([round(index / 30, 4), round(opening, 4), round(rounded, 4)])
    cues.append([round(len(audio) / sample_rate, 4), 0, 0])
    path = output / (name + '.wav')
    sf.write(path, audio, sample_rate, subtype='PCM_16')
    manifest.append(dict(id=name, speaker=speaker, voice=voice, speed=speed, text=text,
        duration=len(audio)/sample_rate, mouthCues=cues, sha256=hashlib.sha256(path.read_bytes()).hexdigest()))
    print(name, round(len(audio) / sample_rate, 3), flush=True)
(output / 'dialogue.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
provenance = dict(generator='kokoro-onnx', generatorVersion=importlib.metadata.version('kokoro-onnx'),
    model='Kokoro-82M v1.0', modelLicence='Apache-2.0', runtimeLicence='MIT', checked='2026-11-11',
    modelCard='https://huggingface.co/hexgrad/Kokoro-82M', source='https://github.com/thewh1teagle/kokoro-onnx',
    modelSha256=hashlib.sha256((model_dir / 'kokoro-v1.0.onnx').read_bytes()).hexdigest(),
    voicesSha256=hashlib.sha256((model_dir / 'voices-v1.0.bin').read_bytes()).hexdigest(),
    mouthTiming='Actual waveform amplitude and spectral envelopes at 30 Hz; not phoneme alignment',
    lines=[{k:v for k,v in line.items() if k != 'mouthCues'} for line in manifest])
(root / 'docs/assets/valley-voice-provenance.json').write_text(json.dumps(provenance, indent=2) + '\n', encoding='utf-8')
