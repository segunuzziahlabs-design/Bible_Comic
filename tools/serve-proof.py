"""Serve only the generated proof directory. Loopback by default; no deployment."""
import argparse, functools, importlib.util, mimetypes, os, re
from pathlib import Path
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import unquote, urlsplit

ROOT=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--bind',default='127.0.0.1')
parser.add_argument('--port',type=int,default=8060)
parser.add_argument('--debug',action='store_true')
parser.add_argument('--uncompressed',action='store_true',help='Diagnose delivery without precompressed responses')
parser.add_argument('--candidate',help='Serve a verified frozen B06- or Q06-YYYYMMDD-NN candidate')
parser.add_argument('--preview',help='Serve a local export folder under build, for example q03/web')
args=parser.parse_args()
directory=(ROOT/'build'/('proof-debug' if args.debug else 'proof')).resolve()
allowed_files=None
if args.preview:
    if args.debug or args.candidate or not re.fullmatch(r'[a-z0-9-]+(?:/[a-z0-9-]+)*', args.preview):
        parser.error('Use a build-relative preview folder without --debug or --candidate.')
    build_root = (ROOT / 'build').resolve()
    directory = (build_root / args.preview).resolve()
    if not directory.is_relative_to(build_root):
        parser.error('Preview path escaped build.')
if args.candidate:
    if args.debug or not re.fullmatch(r'(?:B06|Q06)-[0-9]{8}-[0-9]{2}',args.candidate):
        parser.error('Use a valid candidate identifier without --debug')
    directory=(ROOT/'build/candidates'/args.candidate).resolve()
    if directory.parent != (ROOT/'build/candidates').resolve():
        parser.error('Candidate path escaped its directory')
    spec=importlib.util.spec_from_file_location('slice_candidate',ROOT/'tools/prepare-slice-candidate.py')
    candidate_module=importlib.util.module_from_spec(spec)
    spec.loader.exec_module(candidate_module)
    try:
        candidate_record=candidate_module.verify(directory)
        if candidate_record['candidateId'] != args.candidate:
            raise ValueError('Candidate ID differs from its directory')
    except (ValueError,OSError,KeyError) as error:
        parser.error('Candidate verification failed: '+str(error))
    allowed_files=set(candidate_record['sha256'])|{'candidate.json'}
if not (directory/'index.html').is_file():
    parser.error('Export first with tools/export-proof.ps1.')

class Handler(SimpleHTTPRequestHandler):
    protocol_version='HTTP/1.1'
    def send_head(self):
        route=unquote(urlsplit(self.path).path).lstrip('/') or 'index.html'
        target=(directory/route).resolve()
        if not target.is_relative_to(directory) or not target.is_file() or target.is_symlink() or target.suffix not in ('.html','.js','.wasm','.pck','.png','.json') or (allowed_files is not None and route not in allowed_files):
            self.send_error(404); return None
        use_gzip=not args.uncompressed and 'gzip' in self.headers.get('Accept-Encoding','') and Path(str(target)+'.gz').is_file()
        selected=Path(str(target)+'.gz') if use_gzip else target
        modified=self.date_time_string(selected.stat().st_mtime)
        cacheable=target.suffix not in ('.html','.json')
        if cacheable and self.headers.get('If-Modified-Since')==modified:
            self.send_response(304);self.send_header('Vary','Accept-Encoding');self.end_headers();return None
        stream=selected.open('rb')
        self.send_response(200)
        content_type={'.wasm':'application/wasm','.pck':'application/octet-stream','.js':'text/javascript'}.get(target.suffix,mimetypes.guess_type(target)[0] or 'application/octet-stream')
        self.send_header('Content-Type',content_type)
        self.send_header('Content-Length',str(selected.stat().st_size))
        self.send_header('Last-Modified',modified)
        self.send_header('Vary','Accept-Encoding')
        # Revalidate unchanged assets so rebuilding stable local filenames cannot serve stale code.
        self.send_header('Cache-Control','no-cache' if cacheable else 'no-store')
        self.send_header('X-Content-Type-Options','nosniff')
        if use_gzip:self.send_header('Content-Encoding','gzip')
        self.end_headers()
        return stream

server=ThreadingHTTPServer((args.bind,args.port),functools.partial(Handler,directory=str(directory)))
print(f'{args.candidate or "Village proof"}: http://{args.bind}:{args.port}/ (PID {os.getpid()})',flush=True)
try:server.serve_forever()
except KeyboardInterrupt:pass
finally:server.server_close()
