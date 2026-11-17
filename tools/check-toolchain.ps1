#requires -Version 5.1
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'Toolchain.ps1')
$toolchain = Get-BibleComicToolchain
$buildRoot = Join-Path $toolchain.Repository 'build'
$logRoot = Join-Path $buildRoot 'verification/a03'
$releaseRoot = Join-Path $buildRoot 'web'
$debugRoot = Join-Path $buildRoot 'web-debug'
New-Item -ItemType Directory -Force -Path $logRoot, $releaseRoot, $debugRoot | Out-Null
Set-Content -LiteralPath (Join-Path $buildRoot '.gdignore') -Value '' -Encoding ASCII
$resultPath = Join-Path $logRoot 'result.json'
# Invalidate an older pass before running checks so a failed rerun cannot leave stale success evidence.
@{ task = 'A03'; status = 'started'; checkedAt = (Get-Date).ToUniversalTime().ToString('o') } |
    ConvertTo-Json | Set-Content -LiteralPath $resultPath -Encoding UTF8

function Invoke-ToolCheck([string]$Name, [string]$Executable, [string[]]$Arguments) {
    if (-not (Test-Path -LiteralPath $Executable)) { throw "Pinned tool missing: $Executable. Run tools/setup-toolchain.ps1." }
    $lines = @(& $Executable @Arguments 2>&1 | ForEach-Object { $_.ToString() })
    $code = $LASTEXITCODE
    $lines | Set-Content -LiteralPath (Join-Path $logRoot ($Name + '.log')) -Encoding UTF8
    if ($code -ne 0) { throw "$Name failed (exit $code). See build/verification/a03/$Name.log" }
    if ($lines -match '(^|\s)(SCRIPT ERROR:|ERROR:)') { throw "$Name reported an error. See build/verification/a03/$Name.log" }
    Write-Host "PASS: $Name"
    return ($lines -join "`n")
}

$godotVersion = Invoke-ToolCheck 'godot-version' $toolchain.Godot @('--version')
if (-not $godotVersion.Trim().StartsWith($toolchain.Manifest.godot.templateVersion + '.official.')) { throw 'Godot version does not match pin.' }
$blenderVersion = Invoke-ToolCheck 'blender-version' $toolchain.Blender @('--version')
if (($blenderVersion -split "`n")[0].Trim() -ne ('Blender ' + $toolchain.Manifest.blender.version + ' LTS')) { throw 'Blender version does not match pin.' }
foreach ($name in $toolchain.Manifest.templates.files) {
    if (-not (Test-Path -LiteralPath (Join-Path $toolchain.Templates $name))) { throw "Missing template: $name" }
}
$templateVersion = (Get-Content -LiteralPath (Join-Path $toolchain.Templates 'version.txt') -Raw).Trim()
if ($templateVersion -ne $toolchain.Manifest.godot.templateVersion) { throw 'Export template version mismatch.' }
Write-Host 'PASS: matching web templates'

$null = Invoke-ToolCheck 'blender-background' $toolchain.Blender @('--background', '--factory-startup', '--disable-autoexec', '--python-expr', 'import bpy; print("A03_BLENDER_READY=" + bpy.app.version_string)')
$null = Invoke-ToolCheck 'godot-import' $toolchain.Godot @('--headless', '--path', $toolchain.Repository, '--editor', '--import')
$null = Invoke-ToolCheck 'godot-headless-scene' $toolchain.Godot @('--headless', '--path', $toolchain.Repository, '--scene', 'res://scenes/proof/toolchain_check.tscn', '--quit-after', '2')
$null = Invoke-ToolCheck 'web-debug-export' $toolchain.Godot @('--headless', '--path', $toolchain.Repository, '--export-debug', 'Web', (Join-Path $debugRoot 'index.html'))
$null = Invoke-ToolCheck 'web-release-export' $toolchain.Godot @('--headless', '--path', $toolchain.Repository, '--export-release', 'Web', (Join-Path $releaseRoot 'index.html'))
$packListing = Invoke-ToolCheck 'export-contents' $toolchain.Godot @('--headless', '--path', $releaseRoot, '--main-pack', (Join-Path $releaseRoot 'index.pck'), '--script', (Join-Path $PSScriptRoot 'inspect-export.gd'))
if ($packListing -notmatch 'A03_PACK_FILES=') { throw 'Export content inspection produced no file listing.' }
$files = @()
foreach ($variant in @('web', 'web-debug')) {
    foreach ($name in @('index.html', 'index.js', 'index.wasm', 'index.pck')) {
        $file = Get-Item -LiteralPath (Join-Path (Join-Path $buildRoot $variant) $name)
        if ($file.Length -eq 0) { throw "Empty export file: $($file.FullName)" }
        $files += [PSCustomObject]@{ path = "$variant/$name"; bytes = $file.Length; sha256 = (Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash.ToLowerInvariant() }
    }
}
[PSCustomObject]@{
    checkedAt = (Get-Date).ToUniversalTime().ToString('o')
    task = 'A03'
    status = 'passed'
    godotVersion = $godotVersion.Trim()
    blenderVersion = ($blenderVersion -split "`n")[0].Trim()
    templateVersion = $templateVersion
    rendererConfigured = 'gl_compatibility'
    webThreadSupport = $false
    checks = @('versions', 'matching web templates', 'Blender background startup', 'Godot headless import', 'headless scene startup', 'debug export', 'release export', 'export source exclusions')
    notVerified = @('graphical editor rendering', 'browser execution', '3D asset import', 'gameplay', 'real mobile devices', 'performance', 'hosting')
    artifacts = $files
} | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $resultPath -Encoding UTF8
Write-Host 'A03 checks passed. Browser/device feasibility remains A04. Evidence: build/verification/a03/result.json'
