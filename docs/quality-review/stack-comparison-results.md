# David browser stack comparison

This test compares the same character, animation sequence and interface in Godot 4.7.2 Compatibility, PlayCanvas 2.24.0 and Unity 6.3.19f1 with URP 17.3. All use WebGL 2. The production village remains the reference for existing gameplay behavior. The comparison uses a neutral floor and light so the same poses are easy to inspect.

## Test asset and method

The editable David file produced one shared **9,819-triangle GLB** with the existing 65-joint rig and six body clips. The sample adds UVs, colour and normal maps for cloth, skin and leather, separate roughness settings, and blink, brow-lift and smile shapes. The shared cue blends the existing walk, idle and acknowledgement clips, turns David during travel, and moves the camera in for the facial cue before returning control. The sample demonstrates the pipeline at two camera distances. It still needs refined face and hair geometry, eyelids and more authored acting for production.

All three versions use the same browser shell and cue, asset bytes at input, camera coordinates, render resolution, directional shadow budget and test inputs. Godot imports the GLB into its game pack, with vertex colour multiplication enabled on the imported materials. PlayCanvas loads the GLB directly. Unity imports the GLB with glTFast 6.19.0 and packages the resulting prefab, materials and animation clips into its Web player. Lighting values were set separately because the renderers interpret their light settings differently. The PlayCanvas build uses the pinned minified standalone module, so the measured payload includes that module. TypeScript and Vite are proposed for production.

The benchmark runs on the Windows Intel N150 laptop in headless Chrome. It serves both builds with gzip over loopback. Each cold sample uses a fresh Chrome process and profile, with an immediate warm reload. Readiness requires enabled controls and two engine draw callbacks. Sustained measurements run the repeated animation cue after one warm-up cycle, at 1280 × 720 with matching canvas resolution. The harness checks actual clip time and facial weights for the matched stills, and uses keyboard and emulated touch to start, pause and resume the cue.

## Browser results

| Measure | Godot 4.7.2 Compatibility | PlayCanvas 2.24.0 | Unity 6.3.19f1 URP |
| --- | ---: | ---: | ---: |
| Cold launch to rendered and ready, median of three | 38.71 s | **2.10 s** | 4.27 s |
| Immediate reload to ready, median of three | 2.30 s | **0.36 s** | 3.11 s |
| Compressed resources transferred at cold launch | 10.74 MB | **1.14 MB** | 11.89 MB |
| Mean engine draw callbacks per second, 45 seconds | 31.71 | 32.00 | 32.00 |
| p95 browser frame interval | 32.0 ms | 31.8 ms | 31.7 ms |
| Frame intervals over 50 ms | 8, longest 187.2 ms | **0**, longest 33.0 ms | **0**, longest 33.0 ms |
| Lowest rolling one-second render count | 20 | 31 | 31 |
| Completed animation cues during the sustained run | 10 | 10 | 10 |
| Desktop keyboard, pause, resume and completion | Passed | Passed | Passed |
| Emulated touch, rotation, pause, resume and completion | Passed | Passed | Passed |
| Captured browser errors | 0 | 0 | 0 |

Unity ran in a later session with the same laptop, Chrome 157.0.8103.39, Intel Graphics through ANGLE Direct3D 11, benchmark shell and GLB checksum. Cold launches were 37.96, 39.39 and 38.71 seconds for Godot, 2.11, 1.95 and 2.10 seconds for PlayCanvas, and 4.45, 4.27 and 4.10 seconds for Unity. On immediate reload Chrome fetched Godot's 10.19 MB WASM and Unity's 8.69 MB WASM again. PlayCanvas's module and GLB came from cache under the same local server policy. The previous 9.41-second Godot result used the village's cheaper vertex lighting configuration. This test used per-pixel lighting with the textured asset. [Godot and PlayCanvas measurements](evidence/stack-comparison-2026-11-10/comparison.json) · [Unity measurements](evidence/stack-comparison-unity-2026-11-10/comparison.json) · [Earlier Godot startup profile](../implementation/q06-startup-profile.md)

All three rendered the sample around 32 FPS on this setup. These rates provide limited evidence about GPU headroom. The stalls were observed during one 45-second run per engine, with no causal trace. A full level will introduce more animation, geometry, lighting and gameplay code. Transfer and readiness times are local laptop measurements.

## Visual and responsive review

All three renders show the same body poses and framing, visible cloth weave, separate skin and leather shading, and a directional ground shadow. The Unity and PlayCanvas captures have similar color and cloth detail. Unity shows faint bright edges around the face at close range. Godot has more saturated skin and deeper facial shadows under the tested lighting values. The close-ups also reveal stylized hair geometry and a strap seam, and the wide view shows minor skin clipping at the tunic during the walk. These are shared asset issues.

| Matched capture | Godot | PlayCanvas | Unity |
| --- | --- | --- | --- |
| Full figure, walk at 0.42 s | [Full figure](evidence/stack-comparison-2026-11-10/godot-wide.png) | [Full figure](evidence/stack-comparison-2026-11-10/playcanvas-wide.png) | [Full figure](evidence/stack-comparison-unity-2026-11-10/unity-wide.png) |
| Close-up, acknowledgement at 0.58 s | [Close-up](evidence/stack-comparison-2026-11-10/godot-face.png) | [Close-up](evidence/stack-comparison-2026-11-10/playcanvas-face.png) | [Close-up](evidence/stack-comparison-unity-2026-11-10/unity-face.png) |
| Same close-up, blink applied | [Blink](evidence/stack-comparison-2026-11-10/godot-blink.png) | [Blink](evidence/stack-comparison-2026-11-10/playcanvas-blink.png) | [Blink](evidence/stack-comparison-unity-2026-11-10/unity-blink.png) |
| 390 × 844 portrait | [Full figure](evidence/stack-comparison-2026-11-10/godot-portrait-wide.png) · [Close-up](evidence/stack-comparison-2026-11-10/godot-portrait.png) | [Full figure](evidence/stack-comparison-2026-11-10/playcanvas-portrait-wide.png) · [Close-up](evidence/stack-comparison-2026-11-10/playcanvas-portrait.png) | [Full figure](evidence/stack-comparison-unity-2026-11-10/unity-portrait-wide.png) · [Close-up](evidence/stack-comparison-unity-2026-11-10/unity-portrait.png) |
| 568 × 320 landscape | [Full figure](evidence/stack-comparison-2026-11-10/godot-landscape.png) · [Close-up](evidence/stack-comparison-2026-11-10/godot-landscape-close.png) | [Full figure](evidence/stack-comparison-2026-11-10/playcanvas-landscape.png) · [Close-up](evidence/stack-comparison-2026-11-10/playcanvas-landscape-close.png) | [Full figure](evidence/stack-comparison-unity-2026-11-10/unity-landscape.png) · [Close-up](evidence/stack-comparison-unity-2026-11-10/unity-landscape-close.png) |

All three builds kept all three controls in view, at least 44 CSS pixels high, with no page scrolling at 390 × 844, 568 × 320 and 320 × 568. The cue kept running through rotation and paused and resumed on tap. Emulation verified the layout and touch path in Chrome. Physical phone performance and Safari behavior remain unmeasured.

## Unity reference checks before the matched run

**Unity 6.3 LTS with URP remains a viable candidate.** Timeline gives artists an editor for sequencing animation and audio. Cinemachine adds authored camera cuts and blends. Those tools could reduce the work of maintaining the game's cinematic sequences. For the browser player, Unity 6.3 documents WebGL 2 support on desktop and support for iOS Safari and Android Chrome. A custom Web template can reuse the comparison shell and set the canvas to one render pixel per CSS pixel. [Timeline](https://docs.unity3d.com/Packages/com.unity.timeline@1.8/manual/index.html) · [Cinemachine](https://docs.unity3d.com/Packages/com.unity.cinemachine@3.1/manual/index.html) · [Unity 6.3 browser support](https://docs.unity.com/en-us/engine/6000.3/manual/platform-specific/webgl/intro/browsercompatibility) · [Web canvas configuration](https://docs.unity.com/en-us/engine/6000.0/manual/platform-specific/webgl/develop/canvas-size)

| Local Chrome check | Outcome |
| --- | --- |
| Exact textured David GLB in the Piglet Unity 2021.3.2f1 WebGL 2 viewer | The importer stopped at the first texture with an index error. Repackaging the PNGs as inline images reached the same failure. Removing the texture references in a diagnostic copy got past that stage, then failed at the first mesh. Khronos glTF Validator reported zero errors and nine warnings for the original GLB. The warnings concern generated tangents and skinned mesh hierarchy. This result applies to the older viewer and its importer. |
| Earlier David GLB in the same viewer | The rig rendered and all six body clips imported. The acknowledgement clip played in the viewer. This asset predates the textures and facial morphs used in the matched comparison. |
| Public Unity 6.3.19f1 URP WebGL 2 demo | On the Intel N150 with local delivery, the demo reported ready at 1.35, 5.51 and 1.60 seconds in three fresh Chrome launches. It transferred 8.01 MB of encoded resources including a repeat request for its data bundle. This is the demo's loader milestone and a different scene. |
| Unity 6.3 demo in emulated portrait and landscape | Its canvas resized at 390 × 844 and 568 × 320 without document overflow. The demo used two render pixels per CSS pixel. The David touch controls, camera framing and timed cue remain untested in Unity 6.3. |

Both public builds were served locally, with off-machine browser requests blocked. [Piglet viewer source](https://github.com/AwesomesauceLabs/piglet-viewer) · [Exact import failure](evidence/unity-follow-up-2026-11-10/exact-asset-import.png) · [Earlier David playback](evidence/unity-follow-up-2026-11-10/earlier-david.png) · [glTF validation](evidence/unity-follow-up-2026-11-10/gltf-validation.json) · [Unity 6.3 URP demo](https://deml.io/experiments/unity-webgl/6000.3.19f1-urp-minsize-webgl2/) · [Unity 6.3 demo measurements](evidence/unity-follow-up-2026-11-10/urp-reference.json)

## Unity setup and import

Unity Hub 3.22.6, Unity 6.3.19f1 and the corresponding Web Build Support were installed and the Editor accepted the activated license. The isolated test project used a shorter Windows path and restored missing URP Editor files from Unity's 6.3 source branch after the installer hit a path length limit. Unity's package manager used a process-local copy of the Windows CA certificates to complete dependency resolution. [Unity license activation](https://docs.unity.com/en-us/hub/manage-license) · [Unity's Windows path diagnosis](https://discussions.unity.com/t/errors-when-creating-a-new-unity-6-3-urp-project-the-type-or-namespace-name-materialreferencechanger-could-not-be-found/1701487/31)

The first exported close-up exposed a facial deformation caused by the adapter assuming 100 was the full blend shape weight. glTFast authored the full pose at 1. The corrected adapter reads the imported frame weight and scales the same normalized cue accordingly. Unity compiled the corrected player with WebGL 2 and WebAssembly optimization. [Unity fixture](../../tools/stack-evaluation/unity/Assets/StackFixture.cs) · [glTFast feature support](https://github.com/Unity-Technologies/com.unity.cloud.gltfast/blob/main/Packages/com.unity.cloud.gltfast/Documentation~/features.md)

## Stack recommendation

Use **PlayCanvas + TypeScript + Vite**, with **Blender → GLB** for models and animation and **HTML/CSS** for the browser interface. Keep **WebGL 2** as the production baseline. PlayCanvas and Unity both handled the character and sustained cue smoothly. PlayCanvas transferred roughly one tenth of Unity's payload and reached the controls in about half the time. Unity remains a credible option if the value of Timeline and Cinemachine outweighs that delivery cost. The existing Godot proof provides the behavior to preserve during the port. [PlayCanvas standalone setup](https://developer.playcanvas.com/user-manual/engine/standalone/) · [Timeline](https://docs.unity3d.com/Packages/com.unity.timeline@1.8/manual/index.html) · [Cinemachine](https://docs.unity3d.com/Packages/com.unity.cinemachine@3.1/manual/index.html)

Before scene work, build one PlayCanvas foundation test with the player controller and collision, the following camera, touch controls and a single timed animation that returns control. The GLB, Blender sources and browser behavior checks can carry forward. Godot's player, camera and interaction code need a port. Recheck startup and frame pacing once those runtime costs are present, and continue refining David's facial acting and cloth deformation in Blender.

## Reproduce

From the repository root with the pinned Blender and Godot toolchain and a local Playwright installation:

```powershell
. ./tools/Toolchain.ps1
$toolchain = Get-BibleComicToolchain
& $toolchain.Blender -b source-assets/characters/david.blend --python-exit-code 1 --python tools/stack-evaluation/build-david.py '--' build/stack-evaluation/matched
& ./tools/stack-evaluation/build-web.ps1
node tools/stack-evaluation/compare.cjs playwright build/stack-evaluation/matched
```

To rebuild and test Unity on this machine, use the existing short path to the benchmark directory and the activated Editor with Web Build Support.

```powershell
$env:NODE_EXTRA_CA_CERTS = (Resolve-Path 'build/stack-evaluation/unity-install/windows-ca.pem').Path
& ./tools/stack-evaluation/build-unity.ps1 -Output "$env:USERPROFILE/bc-u63-bench"
node tools/stack-evaluation/compare.cjs playwright build/stack-evaluation/matched --engine=unity
```

Use `--unity` in place of `--engine=unity` to run all three in one session. The Unity project template lives with the comparison tools. Keep the Editor and project paths short on a new Windows installation. The CA bundle is needed on this machine for Unity Package Manager downloads.

The editable comparison model, GLB and browser builds are generated under `build/stack-evaluation/matched/`. The benchmark writes its measurements and screenshots to the `results/` subdirectory. [Comparison tools](../../tools/stack-evaluation/)
