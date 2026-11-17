# PC-01 · PlayCanvas animation preview

PC-01 creates the standalone browser app in [apps/playcanvas](../../apps/playcanvas/) using PlayCanvas 2.24.0, TypeScript 7.0.2 and Vite 8.3.7. The package lock fixes the build inputs. The app is excluded from Godot's asset scan and writes the production bundle to the ignored `build/playcanvas/` directory.

The preview uses a neutral floor, one directional light and two camera positions. **Walk** shows the in-place loop at full-figure distance. **Acknowledge** plays the gesture at conversation distance, with a brow lift and smile. **Reference pose** holds the selected animation at its benchmark frame. The shell provides loading, entry and retry controls, including a message when WebGL 2 is unavailable.

## Run locally

From the repository root, using Node 24:

```powershell
npm.cmd --prefix apps/playcanvas ci
npm.cmd --prefix apps/playcanvas run build
npm.cmd --prefix apps/playcanvas run preview -- --host 127.0.0.1 --port 4173 --strictPort
```

Open [the local preview](http://127.0.0.1:4173/) and select **Enter preview**. For development, use `npm.cmd --prefix apps/playcanvas run dev`. If Node cannot validate the npm registry certificate on a managed Windows machine, run npm through Node with `--use-system-ca` so it trusts the Windows certificate store.

## Teenage David and appearance choices

The PlayCanvas preview portrays David at about 15 with a shorter build, narrower shoulders, slimmer limbs and a softer lower face. **Customize** opens the editor in close-up. Players can choose skin tone, short or full curls, hair colour and tunic colour. The browser remembers the look locally, and **Reset look** restores the defaults.

The [current GLB](../../apps/playcanvas/src/assets/david.glb) is 1,060,996 bytes. It keeps the benchmark mesh count of 9,819 triangles, the 65-joint rig and six body clips. The three facial shapes carry forward. The fuller curls use a fourth shape on the same rig. SHA-256 is `be2f2d2d4d91dd79a57187b3638e077db52b7cf45281dc675ef29e952b34ab7f`.

To regenerate the current model from the editable source, run the benchmark export command below with `build/david-teen --teen` as the arguments after `'--'`. Review the exported `david.glb` before copying it to `apps/playcanvas/src/assets/david.glb`. [Teenage shape adjustments](../../source-assets/characters/david_teen.py)

The production build passed the WebGL 2 browser check. Each of the four controls visibly changed the model at a held pose. The selected look survived a switch between animations and a page reload. Reset restored the original look. The editor was checked in emulated portrait and landscape layouts. [Full figure](evidence/david-teen-appearance/desktop-walk.png) · [Custom look](evidence/david-teen-appearance/desktop-custom-look.png) · [Portrait editor](evidence/david-teen-appearance/portrait-custom-look.png) · [Landscape editor](evidence/david-teen-appearance/landscape-custom-look.png) · [Browser results](evidence/david-teen-appearance/results.json)

## Benchmark asset provenance

- The original comparison GLB was 1,002,552 bytes, SHA-256 `191d821006ee5b639bb9c76e3aa4d76a15bc023306728936c068819decb86f21`. [Matched engine comparison](../quality-review/stack-comparison-results.md)
- Editable source: [david.blend](../../source-assets/characters/david.blend) and the [benchmark export script](../../tools/stack-evaluation/build-david.py). See [asset register entry AP06](../assets/asset-register.md) for the underlying rig, animation and licence provenance.
- Asset inventory: 9,819 triangles, 65 joints, six body clips (`idle_relaxed`, `walk_forward`, `acknowledge`, `listen`, `listen_to_provisions`, `pickup_provisions`) and three face shapes (`Blink`, `BrowLift`, `Smile`).

To regenerate the matched asset for comparison, run this from the repository root with the installed project Blender:

```powershell
. ./tools/Toolchain.ps1
$bibleToolchain = Get-BibleComicToolchain
& $bibleToolchain.Blender -b source-assets/characters/david.blend --python-exit-code 1 --python tools/stack-evaluation/build-david.py '--' build/stack-evaluation/matched
```

## Verification procedure

After building, open the preview in Chrome with the network limited to the preview origin. Verify WebGL 2, the served model hash, animation playback, reference poses at **0.42 s** (walk) and **0.58 s** (acknowledgement), and touch controls in portrait and landscape. Check the retry path by blocking and then restoring the GLB request. Check the unsupported renderer message with WebGL 2 deliberately disabled. A repeatable [Chrome smoke check](../../apps/playcanvas/tests/browser-check.cjs) accepts the preview URL, a path to an installed Playwright module and an output directory.

## Original PC-01 verification result

**PC-01 passed.** A clean `npm ci`, strict TypeScript check and Vite production build succeeded on Windows with Node 24.14.1 and npm 11.11.0. The preview served one model whose SHA-256 matched the original, plus the HTML, CSS and JavaScript. The Vite reporter flagged the 2.19 MB minified JavaScript bundle (564 kB gzip). Measure browser transfer and startup with the interactive slice in PC-04.

Chrome 157.0.8103.39 opened the production build on Intel Graphics through WebGL 2. Both animations changed between rendered frames and held a stable reference pose. The captures reproduced the benchmark's raised foot at full-figure distance and downward glance at conversation distance, with visible cloth detail and the ground shadow. The existing tunic clipping and strap seam are visible in the matched asset. Keyboard and touch controls worked. At 390 × 844, 568 × 320 and 320 × 568 the controls fit without scrolling and kept 44 CSS-pixel button height. These were Chrome layout emulations.

The normal run had no browser errors, failed requests or requests outside the local origin. A deliberately blocked GLB recovered on Retry once restored. Disabling WebGL 2 showed the expected message and left the animation controls disabled.

| Evidence | Walk | Acknowledge |
| --- | --- | --- |
| Desktop | [Full figure](evidence/pc01-2026-11-10/desktop-walk.png) | [Close-up](evidence/pc01-2026-11-10/desktop-acknowledge.png) |
| Portrait | [Full figure](evidence/pc01-2026-11-10/portrait-walk.png) | [Close-up](evidence/pc01-2026-11-10/portrait-acknowledge.png) |
| Landscape | [Full figure](evidence/pc01-2026-11-10/landscape-walk.png) | [Close-up](evidence/pc01-2026-11-10/landscape-acknowledge.png) |

[320 px preview](evidence/pc01-2026-11-10/narrow-walk.png) · [Browser check output](evidence/pc01-2026-11-10/results.json). PC-02 movement, collision and follow camera remain the next implementation milestone.
