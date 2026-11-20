"""One MSR-06 directed take; existing model/runtime, original WAV retained.
Run: build/voice-tools/venv/Scripts/python.exe tools/generate-battle-performance.py build/voice-tools
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
spec_path = root / 'source-assets/audio/battle-performance.json'
spec = json.loads(spec_path.read_text(encoding='utf-8'))
prior = json.loads((root / 'docs/assets/msr03-saul-voice-provenance.json').read_text(encoding='utf-8'))
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
assert sha(model_dir / 'kokoro-v1.0.onnx') == prior['modelSha256']
assert sha(model_dir / 'voices-v1.0.bin') == prior['voicesSha256']
engine = Kokoro(str(model_dir / 'kokoro-v1.0.onnx'), str(model_dir / 'voices-v1.0.bin'))
out = root / 'apps/playcanvas/src/assets/battle-performance-dialogue'
out.mkdir(parents=True, exist_ok=True)
words = lambda text: re.findall(r"[a-z]+(?:'[a-z]+)?", text.lower())
manifest = []
for line in spec['lines']:
    assert words(line['text']) == words(' '.join(p['text'] for p in line['phrases']))
    chunks, phrases, cursor = [], [], 0
    for phrase in line['phrases']:
        audio, rate = engine.create(phrase['text'], voice=line['voice'], speed=phrase['speed'], lang='en-us')
        audio = np.asarray(audio, dtype=np.float32).copy()
        assert rate == 24000 and np.isfinite(audio).all()
        fade = min(round(rate * .008), len(audio) // 2)
        audio[:fade] *= np.linspace(0, 1, fade)
        audio[-fade:] *= np.linspace(1, 0, fade)
        phrases.append({**phrase, 'start': cursor / rate, 'end': (cursor + len(audio)) / rate})
        silence = np.zeros(round(rate * phrase['pauseAfter']), dtype=np.float32)
        chunks.extend([audio, silence])
        cursor += len(audio) + len(silence)
    pcm = np.concatenate(chunks)
    duration = len(pcm) / rate
    assert duration <= line['maxDuration'], f'Take exceeds existing dialogue window: {duration:.3f}s'
    if np.max(np.abs(pcm)) > .94:
        pcm *= .94 / np.max(np.abs(pcm))
    file = out / (line['id'] + '.wav')
    sf.write(file, pcm, rate, subtype='PCM_16')
    pcm, rate = sf.read(file, dtype='float32')
    hop, window = rate // 30, rate // 40
    rms = np.array([np.sqrt(np.mean(pcm[i:i+window] ** 2)) for i in range(0, len(pcm), hop)])
    reference = max(.02, float(np.percentile(rms, 88)))
    cues = []
    for i, value in enumerate(rms):
        opening = float(np.clip((value / reference - .06) / .94, 0, 1))
        part = pcm[i*hop:i*hop+window]
        spectrum = np.abs(np.fft.rfft(part * np.hanning(len(part))))
        freq = np.fft.rfftfreq(len(part), 1 / rate)
        low = float(spectrum[(freq > 150) & (freq < 750)].sum())
        full = max(.001, float(spectrum[(freq > 150) & (freq < 3500)].sum()))
        rounded = opening * float(np.clip((low / full - .38) * 2.1, 0, .8))
        cues.append([round(i/30, 4), round(opening, 4), round(rounded, 4)])
    cues.append([round(duration, 4), 0, 0])
    manifest.append({**line, 'phrases': phrases, 'duration': duration, 'mouthCues': cues, 'sha256': sha(file)})
    print(line['id'], round(duration, 3), 'seconds', flush=True)
(out / 'dialogue.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
provenance = {'task': 'MSR-06', 'checked': str(date.today()), 'generator': 'kokoro-onnx',
              'generatorVersion': importlib.metadata.version('kokoro-onnx'), 'model': 'Kokoro-82M v1.0',
              'modelLicence': 'Apache-2.0', 'runtimeLicence': 'MIT',
              'modelCard': 'https://huggingface.co/hexgrad/Kokoro-82M',
              'runtimeLicenceSource': 'https://raw.githubusercontent.com/thewh1teagle/kokoro-onnx/main/LICENSE',
              'modelSha256': prior['modelSha256'], 'voicesSha256': prior['voicesSha256'],
              'script': str(spec_path.relative_to(root)).replace('\\', '/'),
              'generatorScript': 'tools/generate-battle-performance.py',
              'processing': 'Complete sentence takes, phrase pace, explicit pause, 8 ms edge fades; no pitch shifting, cloning or time stretching',
              'mouthTiming': 'Final PCM amplitude/spectral envelopes at 30 Hz; not phoneme alignment',
              'originalRetained': 'apps/playcanvas/src/assets/duel-dialogue/david-faith.wav',
              'originalSha256': sha(root / 'apps/playcanvas/src/assets/duel-dialogue/david-faith.wav'), 'lines': manifest}
(root / 'docs/assets/msr06-battle-voice-provenance.json').write_text(json.dumps(provenance, indent=2) + '\n', encoding='utf-8')
