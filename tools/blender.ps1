#requires -Version 5.1
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'Toolchain.ps1')
$toolchain = Get-BibleComicToolchain
if (-not (Test-Path -LiteralPath $toolchain.Blender)) { throw 'Pinned Blender not installed. Run tools/setup-toolchain.ps1.' }
& $toolchain.Blender @args
exit $LASTEXITCODE
