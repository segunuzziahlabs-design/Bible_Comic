#requires -Version 5.1
Set-StrictMode -Version Latest

function Get-BibleComicToolchain {
    $repository = Split-Path -Parent $PSScriptRoot
    $manifest = Get-Content -LiteralPath (Join-Path $repository 'toolchain.lock.json') -Raw | ConvertFrom-Json
    $installRoot = Join-Path $env:LOCALAPPDATA 'Programs/BibleComicToolchain'
    [PSCustomObject]@{
        Repository = $repository
        Manifest = $manifest
        InstallRoot = $installRoot
        Cache = Join-Path $env:LOCALAPPDATA 'BibleComicToolchain/downloads'
        GodotDirectory = Join-Path $installRoot $manifest.godot.directory
        Godot = Join-Path (Join-Path $installRoot $manifest.godot.directory) $manifest.godot.executable
        BlenderDirectory = Join-Path $installRoot $manifest.blender.directory
        Blender = Join-Path (Join-Path $installRoot $manifest.blender.directory) $manifest.blender.executable
        Templates = Join-Path (Join-Path $env:APPDATA 'Godot/export_templates') $manifest.godot.templateVersion
    }
}
