"""Check candidate integrity guards and the actual loopback candidate delivery."""
import argparse
import gzip
import hashlib
import http.client
import importlib.util
import json
from pathlib import Path
import shutil
import uuid

ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('candidate',ROOT/'tools/prepare-slice-candidate.py')
candidate=importlib.util.module_from_spec(spec);spec.loader.exec_module(candidate)
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('candidate',nargs='?',default='B06-20261109-01')
parser.add_argument('--port',type=int,default=8061)
args=parser.parse_args()
match=candidate.CANDIDATE_ID.fullmatch(args.candidate)
if not match:parser.error('Invalid candidate identifier')
out=ROOT/'build/verification'/match[1].lower();out.mkdir(parents=True,exist_ok=True)
fixture=out/('fixture-'+uuid.uuid4().hex);fixture.mkdir()
checks=[]
def check(ok,label):
    checks.append({'label':label,'passed':bool(ok)})
    if not ok:raise AssertionError(label)
def rejected(action,label):
    try:action()
    except (ValueError,OSError,KeyError):check(True,label)
    else:check(False,label)
source=fixture/'source';source.mkdir()
files=[]
for name in ['index.html','index.js','index.wasm','index.pck']:
    data=('fixture '+name).encode();(source/name).write_bytes(data)
    packed=gzip.compress(data);(source/(name+'.gz')).write_bytes(packed)
    files.append({'file':name,'bytes':len(data),'gzipBytes':len(packed),'sha256':hashlib.sha256(data).hexdigest()})
(source/'build-manifest.json').write_text(json.dumps({'builtAt':'fixture','files':files}))
base=fixture/'frozen';candidate.freeze(source,base,'B06-20261109-99')
check(candidate.verify(base)['candidateId']=='B06-20261109-99','Untouched candidate verifies')
rejected(lambda:candidate.freeze(source,base,'B06-20261109-99'),'Existing candidate cannot be overwritten')
rejected(lambda:candidate.freeze(source,fixture/'bad-id','../escape'),'Invalid candidate ID is rejected')
for case in ['raw','gzip','extra','missing','manifest-path','record-hash']:
    target=fixture/case;shutil.copytree(base,target)
    if case=='raw':(target/'index.pck').write_bytes(b'tampered')
    elif case=='gzip':(target/'index.js.gz').write_bytes(gzip.compress(b'wrong'))
    elif case=='extra':(target/'private.txt').write_text('fixture only')
    elif case=='missing':(target/'index.wasm').rename(target/'missing.wasm')
    elif case=='manifest-path':
        m=candidate.read_json(target/'build-manifest.json');m['files'][0]['file']='../outside.html';(target/'build-manifest.json').write_text(json.dumps(m))
    else:
        m=candidate.read_json(target/'candidate.json');m['sha256']['index.js']='0'*64;(target/'candidate.json').write_text(json.dumps(m))
    rejected(lambda:candidate.verify(target),'Rejects '+case+' candidate alteration')

real=ROOT/'build/candidates'/args.candidate;record=candidate.verify(real)
check((real/'build-manifest.json').read_bytes()==(ROOT/record['priorEvidence']/'build-manifest.json').read_bytes(),'Candidate retains the exact tested manifest')
def request(path,encoding='identity'):
    connection=http.client.HTTPConnection('127.0.0.1',args.port,timeout=30)
    connection.request('GET',path,headers={'Accept-Encoding':encoding})
    response=connection.getresponse();data=response.read();headers=dict(response.getheaders());status=response.status;connection.close()
    return status,headers,data
for name in ['index.html','index.js','index.wasm','index.pck']:
    status,headers,data=request('/'+name)
    check(status==200 and hashlib.sha256(data).hexdigest()==record['sha256'][name],'Delivered '+name+' matches frozen bytes')
    status,headers,data=request('/'+name,'gzip')
    check(status==200 and headers.get('Content-Encoding')=='gzip' and gzip.decompress(data)==(real/name).read_bytes(),'Compressed '+name+' matches frozen bytes')
    if name=='index.wasm':check(headers.get('Content-Type')=='application/wasm','WASM MIME is correct')
for path in ['/../project.godot','/%2e%2e/project.godot','/docs/roadmap/development-roadmap.xlsx','/.env','/candidate.json/../index.html']:
    check(request(path)[0]==404,'Server refuses non-manifest route '+path)
status,headers,data=request('/candidate.json')
check(status==200 and json.loads(data)['candidateId']==record['candidateId'],'Delivered candidate identity is readable')
check(candidate.verify(real)==record,'Candidate remains unchanged after delivery tests')
result={'result':'passed','candidateId':record['candidateId'],'checks':checks,'notVerified':['physical devices','first-time player','G2 acceptance']}
(out/'candidate-checks.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps({'result':'passed','checks':len(checks)}))
