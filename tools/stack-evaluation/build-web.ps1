# Run from the repository root after build-david.py.
# The official pinned PlayCanvas browser build and both exports stay under build/.
param([string]$Output = 'build/stack-evaluation/matched')
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot '../Toolchain.ps1')
$toolchain = Get-BibleComicToolchain
$directory = (Resolve-Path -LiteralPath $Output).Path
$asset = Join-Path $directory 'david.glb'
$engine = Join-Path $directory 'playcanvas.min.mjs'
if (-not (Test-Path -LiteralPath $asset)) { throw 'Run build-david.py first.' }
if (-not (Test-Path -LiteralPath $engine)) {
    & curl.exe -fsSL --max-time 30 'https://cdn.jsdelivr.net/npm/playcanvas@2.24.0/build/playcanvas.min.mjs' -o $engine
    if ($LASTEXITCODE) { throw 'Could not download PlayCanvas.' }
}
$project = Join-Path $directory 'godot-project'
$godotWeb = Join-Path $directory 'web/godot'
$playcanvasWeb = Join-Path $directory 'web/playcanvas'
New-Item -ItemType Directory -Force $project,$godotWeb,$playcanvasWeb | Out-Null

Copy-Item -Path (Join-Path $PSScriptRoot 'godot/*') -Destination $project -Force
Copy-Item -LiteralPath $asset -Destination $project -Force
$base = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'shell.html') -Raw
$godot = @'
<script src="$GODOT_URL"></script>
<script type="module">
import './cue.js';
const engine = new Engine($GODOT_CONFIG);
engine.startGame().catch(error => window.stack.fail(error));
</script>
'@
$playcanvas = @'
<script type="module">
import './cue.js';
import './playcanvas.js';
</script>
'@
$utf8 = [System.Text.UTF8Encoding]::new($false)
[IO.File]::WriteAllText((Join-Path $project 'shell.html'), $base.Replace('<!-- ENGINE -->', $godot), $utf8)
[IO.File]::WriteAllText((Join-Path $playcanvasWeb 'index.html'), $base.Replace('<!-- ENGINE -->', $playcanvas), $utf8)

foreach ($destination in @($godotWeb, $playcanvasWeb)) {
    Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'cue.js'),(Join-Path $PSScriptRoot 'shell.css') -Destination $destination -Force
}
Copy-Item -LiteralPath $engine,$asset,(Join-Path $PSScriptRoot 'playcanvas.js') -Destination $playcanvasWeb -Force

& $toolchain.Godot --headless --path $project --editor --import
if ($LASTEXITCODE) { throw 'Godot import failed.' }
& $toolchain.Godot --headless --path $project --export-release Web (Join-Path $godotWeb 'index.html')
if ($LASTEXITCODE) { throw 'Godot browser export failed.' }
