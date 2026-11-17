#requires -Version 5.1
param([ValidateSet('b01','b02','b03','b04','b05','q03','q04','q05','q06')][string]$EvidenceTask = 'b05')
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'Toolchain.ps1')
$toolchain = Get-BibleComicToolchain
$checkRoot = Join-Path $toolchain.Repository ('build/verification/' + $EvidenceTask + '/clean-' + [guid]::NewGuid().ToString('N'))
$cleanProject = Join-Path $checkRoot 'project'
$cleanExport = Join-Path $checkRoot 'web'
New-Item -ItemType Directory -Path $cleanProject,$cleanExport -Force | Out-Null
# Copy only runtime sources and tests into a fresh directory; never delete a user's cache.
foreach ($name in @('project.godot','export_presets.cfg','scenes','scripts','assets','tests','web')) {
    Copy-Item -LiteralPath (Join-Path $toolchain.Repository $name) -Destination $cleanProject -Recurse
}
function Invoke-FoundationCheck([string]$Name, [string[]]$Arguments) {
    $lines = @(& $toolchain.Godot @Arguments 2>&1 | ForEach-Object { $_.ToString() })
    $code = $LASTEXITCODE
    $lines | Set-Content -LiteralPath (Join-Path $checkRoot ($Name + '.log')) -Encoding UTF8
    if ($code -ne 0 -or $lines -match '(SCRIPT ERROR:|ERROR:)') { throw "$Name failed; see $checkRoot" }
    Write-Host "PASS: $Name"
}
Invoke-FoundationCheck 'clean-import' @('--headless','--path',$cleanProject,'--editor','--import')
Invoke-FoundationCheck 'proof-checks' @('--headless','--path',$cleanProject,'--script','tests/proof_checks.gd')
Invoke-FoundationCheck 'foundation-checks' @('--headless','--path',$cleanProject,'--script','tests/foundation_checks.gd')
Invoke-FoundationCheck 'movement-camera-checks' @('--headless','--path',$cleanProject,'--script','tests/movement_camera_checks.gd')
Invoke-FoundationCheck 'village-checks' @('--headless','--path',$cleanProject,'--fixed-fps','60','--script','tests/village_checks.gd')
Invoke-FoundationCheck 'interaction-checks' @('--headless','--path',$cleanProject,'--fixed-fps','60','--script','tests/interaction_checks.gd')
Invoke-FoundationCheck 'ui-checks' @('--headless','--path',$cleanProject,'--fixed-fps','60','--script','tests/ui_checks.gd')
Invoke-FoundationCheck 'startup' @('--headless','--path',$cleanProject,'--quit-after','10')
Invoke-FoundationCheck 'release-export' @('--headless','--path',$cleanProject,'--export-release','ProofWeb',(Join-Path $cleanExport 'index.html'))
Invoke-FoundationCheck 'export-contents' @('--headless','--path',$cleanExport,'--main-pack',(Join-Path $cleanExport 'index.pck'),'--script',(Join-Path $PSScriptRoot 'inspect-proof-export.gd'))
$result = [pscustomobject]@{checkedAt=(Get-Date).ToUniversalTime().ToString('o');task=$EvidenceTask.ToUpper();localChecks='passed';root=$checkRoot;cleanProject=$cleanProject;cleanExport=$cleanExport;notVerified=@('physical phones','G1 approval','full episode')}
$result | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $checkRoot 'result.json') -Encoding UTF8
$result | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $toolchain.Repository ('build/verification/' + $EvidenceTask + '/latest.json')) -Encoding UTF8
Write-Host "Foundation checks: $checkRoot"
