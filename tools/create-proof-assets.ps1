#requires -Version 5.1
param([switch]$Overwrite)
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'Toolchain.ps1')
$toolchain = Get-BibleComicToolchain
if (-not (Test-Path -LiteralPath $toolchain.Blender)) { throw 'Run tools/setup-toolchain.ps1 first.' }
# Keep the Python argument separator in a native argument array. PowerShell may
# otherwise consume a bare -- when invoking another PowerShell script.
$blenderArguments = @('--background', '--factory-startup', '--disable-autoexec', '--python-exit-code', '1', '--python', (Join-Path $PSScriptRoot 'create-proof-assets.py'), '--')
if ($Overwrite) { $blenderArguments += '--overwrite' }
& $toolchain.Blender @blenderArguments
if ($LASTEXITCODE -ne 0) { throw "Proof asset generation failed (exit $LASTEXITCODE)." }
