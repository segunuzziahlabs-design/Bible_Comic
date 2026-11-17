# Stage the isolated project, then build it with the activated pinned Unity Editor.
param(
    [string]$Output = 'build/stack-evaluation/matched',
    [string]$EditorPath = (Join-Path $env:LOCALAPPDATA 'Programs/BibleComicToolchain/unity-6000.3.19f1/Editor/Unity.exe'),
    [switch]$PrepareOnly
)
$ErrorActionPreference = 'Stop'
$directory = (Resolve-Path -LiteralPath $Output).Path
$asset = Join-Path $directory 'david.glb'
if (-not (Test-Path -LiteralPath $asset)) { throw 'Run build-david.py first.' }
$project = Join-Path $directory 'unity-project'
$template = Join-Path $project 'Assets/WebGLTemplates/StackComparison'
$unityWeb = Join-Path $directory 'web/unity'
New-Item -ItemType Directory -Force $project,$template,$unityWeb | Out-Null

Copy-Item -Path (Join-Path $PSScriptRoot 'unity/*') -Destination $project -Recurse -Force
Copy-Item -LiteralPath $asset -Destination $project -Force
$base = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'shell.html') -Raw -Encoding UTF8
$loader = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'unity-loader.html') -Raw -Encoding UTF8
[IO.File]::WriteAllText((Join-Path $template 'index.html'), $base.Replace('<!-- ENGINE -->', $loader), [Text.UTF8Encoding]::new($false))
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'cue.js'),(Join-Path $PSScriptRoot 'shell.css') -Destination $template -Force

if ($PrepareOnly) {
    Get-FileHash -LiteralPath (Join-Path $project 'david.glb') -Algorithm SHA256
    exit
}
if (-not (Test-Path -LiteralPath $EditorPath)) { throw "Unity Editor missing at $EditorPath" }
$support = Join-Path (Split-Path -Parent $EditorPath) 'Data/PlaybackEngines/WebGLSupport'
if (-not (Test-Path -LiteralPath $support -PathType Container)) { throw 'Install Web Build Support for this Unity Editor.' }

$log = Join-Path $directory 'unity-export.log'
$arguments = "-batchmode -nographics -quit -projectPath `"$project`" -buildTarget WebGL -executeMethod BuildComparison.Run -logFile `"$log`""
$process = Start-Process -FilePath $EditorPath -ArgumentList $arguments -WindowStyle Hidden -PassThru
$process.WaitForExit()
$complete = (Test-Path -LiteralPath $log) -and (Select-String -LiteralPath $log -SimpleMatch 'Matched Unity Web export complete:' -Quiet)
if ($process.ExitCode -or -not $complete -or -not (Test-Path -LiteralPath (Join-Path $unityWeb 'index.html'))) {
    Get-Content -LiteralPath $log -Tail 35 -ErrorAction SilentlyContinue
    throw "Unity Web export exited $($process.ExitCode). See $log"
}
Get-Item -LiteralPath (Join-Path $unityWeb 'index.html')
