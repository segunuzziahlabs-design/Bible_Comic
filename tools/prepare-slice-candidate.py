"""Freeze and verify an already-tested web export without rebuilding gameplay."""
import argparse
import datetime
import gzip
import hashlib
import json
from pathlib import Path
import re
import shutil
import zipfile

ROOT = Path(__file__).resolve().parents[1]
WEB_SUFFIXES = {'.html', '.js', '.wasm', '.pck', '.png'}
CANDIDATE_ID = re.compile(r'(B06|Q06)-[0-9]{8}-[0-9]{2}')
EXPORTS = {
    'B06': ('proof', 'B05-village-v1', 'b05-2026-11-09'),
    'Q06': ('q05/preview', 'Q05-village-v1', 'q05-2026-11-09'),
}

def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def read_json(path):
    return json.loads(path.read_text(encoding='utf-8-sig'))

def export_files(directory):
    manifest = read_json(directory / 'build-manifest.json')
    names = ['build-manifest.json']
    seen = set()
    for entry in manifest['files']:
        name = entry['file']
        if not isinstance(name, str) or not re.fullmatch(r'[A-Za-z0-9_.-]+', name) or Path(name).suffix not in WEB_SUFFIXES or name in seen:
            raise ValueError('Invalid or duplicate manifest file')
        seen.add(name)
        raw, compressed = directory / name, directory / (name + '.gz')
        if raw.is_symlink() or compressed.is_symlink() or not raw.is_file() or not compressed.is_file():
            raise ValueError('Missing or linked export file: ' + name)
        data = raw.read_bytes()
        if len(data) != entry['bytes'] or digest(raw) != entry['sha256']:
            raise ValueError('Export hash/size mismatch: ' + name)
        if compressed.stat().st_size != entry['gzipBytes'] or gzip.decompress(compressed.read_bytes()) != data:
            raise ValueError('Compressed export mismatch: ' + name)
        names += [name, name + '.gz']
    if not {'index.html', 'index.js', 'index.wasm', 'index.pck'} <= seen:
        raise ValueError('Incomplete playable export')
    return manifest, names

def verify(directory):
    directory = Path(directory)
    record = read_json(directory / 'candidate.json')
    manifest, names = export_files(directory)
    expected = set(names + ['candidate.json'])
    if set(p.name for p in directory.iterdir()) != expected:
        raise ValueError('Candidate contains missing or unlisted files')
    if set(record['sha256']) != set(names):
        raise ValueError('Candidate hash inventory differs from export')
    for name in names:
        if (directory / name).is_symlink() or digest(directory / name) != record['sha256'][name]:
            raise ValueError('Candidate hash mismatch: ' + name)
    if record['sourceBuiltAt'] != manifest['builtAt']:
        raise ValueError('Candidate build identity mismatch')
    return record

def freeze(source, destination, candidate_id):
    match = CANDIDATE_ID.fullmatch(candidate_id)
    if not match:
        raise ValueError('Candidate ID must start with B06 or Q06 and end with YYYYMMDD-NN')
    _, game_build, prior_evidence = EXPORTS[match[1]]
    source, destination = Path(source), Path(destination)
    manifest, names = export_files(source)
    destination.mkdir(parents=True, exist_ok=False)
    for name in names:
        shutil.copy2(source / name, destination / name)
    record = {
        'candidateId': candidate_id,
        'preparedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
        'sourceBuiltAt': manifest['builtAt'],
        'gameBuild': game_build,
        'scope': 'Jesse, provisions, gate and restart; not the complete episode',
        'priorEvidence': f'docs/implementation/evidence/{prior_evidence}/',
        'sha256': {name: digest(destination / name) for name in names},
    }
    (destination / 'candidate.json').write_text(json.dumps(record, indent=2) + '\n', encoding='utf-8')
    verify(destination)
    return record

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('candidate', help='B06-YYYYMMDD-NN or Q06-YYYYMMDD-NN')
    parser.add_argument('--verify-only', action='store_true')
    args = parser.parse_args()
    match = CANDIDATE_ID.fullmatch(args.candidate)
    if not match:
        parser.error('Invalid candidate identifier')
    target = ROOT / 'build/candidates' / args.candidate
    if args.verify_only:
        record = verify(target)
    else:
        if target.with_suffix('.zip').exists():
            parser.error('Candidate archive already exists')
        export_folder, _, prior_evidence = EXPORTS[match[1]]
        source = ROOT / 'build' / export_folder
        if match[1] == 'Q06':
            reference = ROOT / 'docs/implementation/evidence' / prior_evidence / 'build-manifest.json'
            if (source / reference.name).read_bytes() != reference.read_bytes():
                parser.error('Q06 source differs from the recorded Q05 export')
        record = freeze(source, target, args.candidate)
        archive = target.with_suffix('.zip')
        with zipfile.ZipFile(archive, 'x', compression=zipfile.ZIP_DEFLATED) as bundle:
            for item in sorted(target.iterdir()):
                bundle.write(item, item.name)
        print('Archive SHA-256: ' + digest(archive))
    print(json.dumps({'candidateId': record['candidateId'], 'directory': str(target), 'verifiedFiles': len(record['sha256']), 'pckSha256': record['sha256']['index.pck']}, indent=2))

if __name__ == '__main__':
    main()
