#requires -Version 5.1
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'Toolchain.ps1')
$toolchain = Get-BibleComicToolchain
if (-not [Environment]::Is64BitOperatingSystem -or $env:OS -ne 'Windows_NT') {
    throw 'This pinned setup supports Windows x64 only.'
}
Add-Type -AssemblyName System.IO.Compression.FileSystem
New-Item -ItemType Directory -Force -Path $toolchain.Cache, $toolchain.InstallRoot | Out-Null

function Get-VerifiedArchive($Package) {
    $path = Join-Path $toolchain.Cache $Package.archive
    if (-not (Test-Path -LiteralPath $path)) {
        $partial = $path + '.part'
        if (-not (Test-Path -LiteralPath $partial)) {
            Write-Host "Downloading $($Package.archive)"
            & curl.exe --fail --location --retry 2 --connect-timeout 30 --max-time 1800 --silent --show-error --output $partial $Package.url
            if ($LASTEXITCODE -ne 0) { throw "Download failed: $($Package.archive). An incomplete .part file may remain in $($toolchain.Cache)." }
        }
        $actual = (Get-FileHash -LiteralPath $partial -Algorithm SHA256).Hash
        if ($actual -ne $Package.sha256) { throw "Checksum mismatch: $partial. No archive was installed. Inspect/remove this incomplete download before retrying." }
        Move-Item -LiteralPath $partial -Destination $path
    }
    if ((Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash -ne $Package.sha256) {
        throw "Checksum mismatch: $path. No archive was installed."
    }
    Write-Host "Verified SHA-256: $($Package.archive)"
    return $path
}

function Install-Archive($ArchivePath, $Package, $Destination, [switch]$WebTemplates) {
    $marker = Join-Path $Destination '.bible-comic-install.json'
    if (Test-Path -LiteralPath $Destination) {
        if (-not (Test-Path -LiteralPath $marker)) { throw "Existing directory is unmanaged; refusing to overwrite: $Destination" }
        $installed = Get-Content -LiteralPath $marker -Raw | ConvertFrom-Json
        if ($installed.sha256 -ne $Package.sha256) { throw "Installed archive differs from the pin: $Destination" }
        foreach ($file in $installed.files) {
            $existing = Join-Path $Destination $file.path
            if (-not (Test-Path -LiteralPath $existing) -or (Get-FileHash -LiteralPath $existing -Algorithm SHA256).Hash -ne $file.sha256) {
                throw "Installed file missing or changed: $existing"
            }
        }
        Write-Host "Verified existing installation: $Destination"
        return
    }
    $zip = [IO.Compression.ZipFile]::OpenRead($ArchivePath)
    try {
        $prefix = [IO.Path]::GetFullPath($Destination).TrimEnd([IO.Path]::DirectorySeparatorChar) + [IO.Path]::DirectorySeparatorChar
        $entries = @($zip.Entries)
        if ($WebTemplates) {
            $entries = @($toolchain.Manifest.templates.files | ForEach-Object {
                $entry = $zip.GetEntry('templates/' + $_)
                if ($null -eq $entry) { throw "Missing web template entry: $_" }
                $entry
            })
        }
        # Validate every destination before extracting anything.
        foreach ($entry in $entries) {
            $relative = if ($WebTemplates) { $entry.Name } else { $entry.FullName }
            $target = [IO.Path]::GetFullPath((Join-Path $Destination $relative))
            if (-not $target.StartsWith($prefix, [StringComparison]::OrdinalIgnoreCase)) { throw "Unsafe archive path: $relative" }
        }
        New-Item -ItemType Directory -Path $Destination | Out-Null
        $installedFiles = @()
        foreach ($entry in $entries) {
            $relative = if ($WebTemplates) { $entry.Name } else { $entry.FullName }
            $target = Join-Path $Destination $relative
            if ($entry.FullName.EndsWith('/')) { New-Item -ItemType Directory -Force -Path $target | Out-Null; continue }
            New-Item -ItemType Directory -Force -Path (Split-Path -Parent $target) | Out-Null
            [IO.Compression.ZipFileExtensions]::ExtractToFile($entry, $target, $false)
            $installedFiles += [PSCustomObject]@{ path = $relative; sha256 = (Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash.ToLowerInvariant() }
        }
        [PSCustomObject]@{ archive = $Package.archive; sha256 = $Package.sha256; files = $installedFiles } |
            ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $marker -Encoding UTF8
        Write-Host "Installed: $Destination"
    } finally { $zip.Dispose() }
}

$godotArchive = Get-VerifiedArchive $toolchain.Manifest.godot
Install-Archive $godotArchive $toolchain.Manifest.godot $toolchain.GodotDirectory
$templateArchive = Get-VerifiedArchive $toolchain.Manifest.templates
Install-Archive $templateArchive $toolchain.Manifest.templates $toolchain.Templates -WebTemplates
if ((Get-Content -LiteralPath (Join-Path $toolchain.Templates 'version.txt') -Raw).Trim() -ne $toolchain.Manifest.godot.templateVersion) {
    throw 'Installed export template version does not match the pinned engine.'
}
$blenderArchive = Get-VerifiedArchive $toolchain.Manifest.blender
Install-Archive $blenderArchive $toolchain.Manifest.blender $toolchain.BlenderDirectory
Write-Host 'Setup complete. Run tools/check-toolchain.ps1 for version, import and export checks.'
