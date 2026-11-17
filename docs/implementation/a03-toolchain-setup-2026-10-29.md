# A03 toolchain setup and verification

Completed locally on **29 October 2026**. **A03: Complete and verified.** This completes tool setup and the minimal project/import check, not browser gameplay feasibility. **A04: Partially implemented** because a web preset and fixture exports exist; browser execution, representative 3D assets, input/audio and real phones remain unverified.

Related: [implementation plan](implementation-plan.md), [task schedule](../roadmap/technical-task-breakdown.md#schedule-and-ownership), [lightweight requirement](low-end-device-performance-plan.md), [root setup instructions](../../README.md), [version/checksum manifest](../../toolchain.lock.json).

## Scope and installed versions

The existing implementation plan called for locating tools, selecting official versions, installing matching templates and checking a minimal project before gameplay production. No existing Godot or Blender executable was found in the checked locations. The owner authorised implementation and then directed us to proceed with A03.

| Component | Installed/pinned result | Location or reason |
|---|---|---|
| Godot | `4.7.2.stable.official.ed1daf0bf`, standard Windows x64 build | `%LOCALAPPDATA%/Programs/BibleComicToolchain/godot-4.7.2/`; standard GDScript build for the web approach |
| Export templates | `4.7.2.stable`; all eight web template ZIPs plus `version.txt` | `%APPDATA%/Godot/export_templates/4.7.2.stable/`; non-web templates were not installed |
| Blender | `4.5.15 LTS`, build `5afeabba6097` | `%LOCALAPPDATA%/Programs/BibleComicToolchain/blender-4.5.15/blender-4.5.15-windows-x64/`; maintained 4.5 LTS series chosen for this initial asset pipeline |
| Archive cache | Three official archives, 1,766,013,394 bytes total | `%LOCALAPPDATA%/BibleComicToolchain/downloads/`; development downloads, not game payload |

Godot 4.7.2 was listed on the [official Windows download page](https://godotengine.org/download/windows/). Blender 4.5.15 was listed as an active LTS update on the [official releases page](https://www.blender.org/releases/). Exact URLs, SHA-256 values and checksum-source URLs are pinned in the manifest. Downloads matched those hashes before extraction. Godot's main executable also returned a valid Windows Authenticode signature from Prehensile Tales B.V.; this is supplementary provenance evidence, not a gameplay test.

Setup uses portable user-directory installations without PATH changes, registry installation or administrator requirements. It refuses to overwrite an unmanaged destination. A second setup run verified the archive and installed-file hashes and reused the installations. If an interrupted download leaves an invalid `.part` file, setup stops with its exact path; inspect/remove that download before retrying. A partial unmanaged installation directory similarly requires inspection rather than automatic deletion.

## Files and reproducible commands

- [Setup script](../../tools/setup-toolchain.ps1): official pinned downloads, SHA-256 checks, bounded ZIP extraction, installed-file checks and matching web templates.
- [Shared tool paths](../../tools/Toolchain.ps1), [Godot wrapper](../../tools/godot.ps1), [Blender wrapper](../../tools/blender.ps1): resolve this user's pinned tools without relying on global PATH.
- [Verification script](../../tools/check-toolchain.ps1) and [export inspection script](../../tools/inspect-export.gd): local checks with logs and a machine-readable result. A rerun invalidates any old result first so a failed run cannot leave stale pass evidence.
- [Project configuration](../../project.godot), [minimal fixture](../../scenes/proof/toolchain_check.tscn), [web preset](../../export_presets.cfg): root Godot project, a label-only scene, Compatibility rendering and single-thread web export. This fixture has no player, story or 3D world.
- [Git exclusions](../../.gitignore), `docs/.gdignore`, `tools/.gdignore`, and generated `build/.gdignore`: keep builds/caches out of Git and source-only directories out of imports. Export resource selection/exclusions are also explicit.

Run from the repository in PowerShell:

```powershell
.\tools\setup-toolchain.ps1
.\tools\check-toolchain.ps1
```

The check script imports the project headlessly, starts its scene, exports `Web` in debug and release modes and inspects the release PCK through Godot. Editor import is a real engine operation, but no graphical editor or browser was opened during this task. The [official command-line guide](https://docs.godotengine.org/en/stable/tutorials/editor/command_line_tutorial.html) documents these local import/export operations.

## Executed checks and evidence

The final check run exited **0**. Its immutable snapshot is [result.json](evidence/a03-2026-10-29/result.json), with [source fingerprints](evidence/a03-2026-10-29/source-sha256.json) identifying the checked files. Generated working logs remain under `build/verification/a03/`; the snapshot below will not be replaced by future runs.

| Check | Observed result | Evidence |
|---|---|---|
| Engine version | Exact pinned Godot version returned | [Godot version log](evidence/a03-2026-10-29/godot-version.log) |
| Blender version/startup | Exact LTS version returned; background factory startup and Python expression succeeded | [Version](evidence/a03-2026-10-29/blender-version.log), [background startup](evidence/a03-2026-10-29/blender-background.log) |
| Template pairing | Version text matches Godot; all pinned web template files present; both actual export variants succeeded | Manifest, result JSON and export logs |
| Minimal project import | Headless editor import completed with no reported import errors | [Import log](evidence/a03-2026-10-29/godot-import.log) |
| Scene startup | Headless fixture started and exited normally after two iterations | [Startup log](evidence/a03-2026-10-29/godot-headless-scene.log) |
| Debug/release web export | Both commands succeeded; HTML, JS, WASM and PCK files nonempty and hashed | [Debug](evidence/a03-2026-10-29/web-debug-export.log), [release](evidence/a03-2026-10-29/web-release-export.log), result JSON |
| Source exclusion | Release PCK contains the fixture and required Godot metadata; DOCX, docs, tools and toolchain manifest excluded | [PCK contents](evidence/a03-2026-10-29/export-contents.log) |
| Repeat setup | Cached archives and installed file hashes verified; no replacement installation needed | Observed successful second `setup-toolchain.ps1` invocation; no separate transcript saved |

One setup defect was found and fixed: enabling mobile texture export without `rendering/textures/vram_compression/import_etc2_astc` caused a blank configuration-error report. Both desktop and mobile texture import settings are now explicit, and the final exports passed. Blender's version includes `LTS`; the exact-version check accounts for that suffix. These were setup issues, not observed gameplay defects.

The release fixture's `index.wasm` is **39,514,754 bytes uncompressed**, while `index.pck` is 2,692 bytes. The engine dominates this empty fixture. These file sizes are not compressed network transfer measurements, loading-time results or an episode budget. A04 must measure the representative package with actual serving/compression conditions before setting DEC-10 targets; do not infer light-phone performance from a tiny scene.

## Remaining gates and handoff

- A05: representative environment/animated character, rights record and Blender-to-GLB import are not started by this tool check.
- A04/G1: no browser execution, graphics, movement, interaction, touch, animation, audio unlock, orientation or phone-performance evidence yet. The fixture export does not pass G1.
- DEC-05: tool versions and local template pairing are resolved by engineering verification; browser suitability and any fallback decision remain conditional on A04.
- A02 delivery/content details, device models and acceptance thresholds remain open. The approved lightweight product direction is unchanged.
- No commit, push, deployment, paid purchase or source DOCX change occurred. These local tool choices do not approve a delivery-date commitment.

Next practical work: prepare the A05 representative asset with clear rights, then combine it with input/interaction/audio in A04 and test an actual exported browser build, starting with lower-capacity physical devices where available.
