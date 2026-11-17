#requires -Version 5.1
param([switch]$DebugBuild, [ValidatePattern('^[a-z0-9-]+(/[a-z0-9-]+)*$')][string]$OutputFolder)
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'Toolchain.ps1')
$toolchain = Get-BibleComicToolchain
$output = Join-Path $toolchain.Repository $(if ($DebugBuild) { 'build/proof-debug' } else { 'build/proof' })
if ($OutputFolder) { $output = Join-Path $toolchain.Repository ('build/' + $OutputFolder) }
New-Item -ItemType Directory -Force -Path $output | Out-Null
Set-Content -LiteralPath (Join-Path $toolchain.Repository 'build/.gdignore') -Value '' -Encoding ASCII
$importLog = @(& $toolchain.Godot --headless --path $toolchain.Repository --editor --import 2>&1 | ForEach-Object { $_.ToString() })
$importCode = $LASTEXITCODE
$importLog | Set-Content -LiteralPath (Join-Path $output 'import.log') -Encoding UTF8
if ($importCode -ne 0 -or $importLog -match '(SCRIPT ERROR:|ERROR:)') { throw "Godot import failed; see $output/import.log" }
$exportFlag = if ($DebugBuild) { '--export-debug' } else { '--export-release' }
$exportLog = @(& $toolchain.Godot --headless --path $toolchain.Repository $exportFlag ProofWeb (Join-Path $output 'index.html') 2>&1 | ForEach-Object { $_.ToString() })
$exportCode = $LASTEXITCODE
$exportLog | Set-Content -LiteralPath (Join-Path $output 'export.log') -Encoding UTF8
if ($exportCode -ne 0 -or $exportLog -match '(SCRIPT ERROR:|ERROR:)') { throw "Proof export failed; see $output/export.log" }
$packLog = @(& $toolchain.Godot --headless --path $output --main-pack (Join-Path $output 'index.pck') --script (Join-Path $PSScriptRoot 'inspect-proof-export.gd') 2>&1 | ForEach-Object { $_.ToString() })
$packCode = $LASTEXITCODE
$packLog | Set-Content -LiteralPath (Join-Path $output 'pack-check.log') -Encoding UTF8
if ($packCode -ne 0 -or $packLog -match '(SCRIPT ERROR:|ERROR:)' -or -not ($packLog -match 'PROOF_PACK_FILES=')) { throw "Exported runtime dependency check failed; see $output/pack-check.log" }
$files = @()
foreach ($file in Get-ChildItem -LiteralPath $output -File | Where-Object { $_.Extension -in @('.wasm','.js','.pck','.html','.png') }) {
    $inputStream = [IO.File]::OpenRead($file.FullName)
    $compressedStream = [IO.File]::Create($file.FullName + '.gz')
    $gzip = [IO.Compression.GZipStream]::new($compressedStream, [IO.Compression.CompressionLevel]::Optimal)
    try { $inputStream.CopyTo($gzip) } finally { $gzip.Dispose(); $compressedStream.Dispose(); $inputStream.Dispose() }
    $files += [PSCustomObject]@{file=$file.Name; bytes=$file.Length; gzipBytes=(Get-Item -LiteralPath ($file.FullName+'.gz')).Length; sha256=(Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash.ToLowerInvariant()}
}
[PSCustomObject]@{builtAt=(Get-Date).ToUniversalTime().ToString('o');preset='ProofWeb';debug=[bool]$DebugBuild;files=$files} |
    ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $output 'build-manifest.json') -Encoding UTF8
Write-Host "Proof exported: $output"
