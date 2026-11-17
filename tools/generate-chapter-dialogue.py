"""Generate an editable chapter script using the already licensed local Kokoro model."""
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

root=Path(__file__).resolve().parents[1]
model_dir=Path(sys.argv[1]).resolve()
source=Path(sys.argv[2]).resolve()
spec=json.loads(source.read_text(encoding='utf-8'))
chapter=spec['chapter']
assert re.fullmatch(r'[a-z0-9-]+',chapter)
output=root/'apps/playcanvas/src/assets'/f'{chapter}-dialogue'
output.mkdir(parents=True,exist_ok=True)
engine=Kokoro(str(model_dir/'kokoro-v1.0.onnx'),str(model_dir/'voices-v1.0.bin'))
manifest=[]
for line in spec['lines']:
    assert re.fullmatch(r'[a-z0-9-]+',line['id'])
    audio,rate=engine.create(line['text'],voice=line['voice'],speed=line['speed'],lang='en-gb' if line['voice'].startswith('b') else 'en-us')
    hop,window=rate//30,rate//40
    rms=np.array([np.sqrt(np.mean(audio[i:i+window]**2)) for i in range(0,len(audio),hop)])
    reference=max(.02,float(np.percentile(rms,88)));cues=[]
    for index,value in enumerate(rms):
        opening=float(np.clip((value/reference-.06)/.94,0,1))
        part=audio[index*hop:index*hop+window]
        spectrum=np.abs(np.fft.rfft(part*np.hanning(len(part))))
        freq=np.fft.rfftfreq(len(part),1/rate)
        low=float(spectrum[(freq>150)&(freq<750)].sum())
        full=max(.001,float(spectrum[(freq>150)&(freq<3500)].sum()))
        rounded=opening*float(np.clip((low/full-.38)*2.1,0,.8))
        cues.append([round(index/30,4),round(opening,4),round(rounded,4)])
    cues.append([round(len(audio)/rate,4),0,0])
    destination=output/(line['id']+'.wav');sf.write(destination,audio,rate,subtype='PCM_16')
    manifest.append({**line,'duration':len(audio)/rate,'mouthCues':cues,'sha256':hashlib.sha256(destination.read_bytes()).hexdigest()})
    print(line['id'],round(len(audio)/rate,3),flush=True)
(output/'dialogue.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
provenance=dict(generator='kokoro-onnx',generatorVersion=importlib.metadata.version('kokoro-onnx'),model='Kokoro-82M v1.0',modelLicence='Apache-2.0',runtimeLicence='MIT',checked=str(date.today()),modelCard='https://huggingface.co/hexgrad/Kokoro-82M',source='https://github.com/thewh1teagle/kokoro-onnx',script=source.relative_to(root).as_posix(),modelSha256=hashlib.sha256((model_dir/'kokoro-v1.0.onnx').read_bytes()).hexdigest(),voicesSha256=hashlib.sha256((model_dir/'voices-v1.0.bin').read_bytes()).hexdigest(),mouthTiming='Waveform amplitude and spectral envelopes at 30 Hz, not phoneme alignment',lines=[{k:v for k,v in item.items() if k!='mouthCues'} for item in manifest])
(root/f'docs/assets/{chapter}-voice-provenance.json').write_text(json.dumps(provenance,indent=2)+'\n',encoding='utf-8')
