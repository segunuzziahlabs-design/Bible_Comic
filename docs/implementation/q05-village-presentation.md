# Q05 village lighting, shadows and period details

9 November 2026 · Warmer sunlight reaches the characters from the lane side, with more ambient fill on their shaded faces. Two soft ground shadows follow David and Jesse. The shadows use two small planes and a shared shader. Rough stone foundation courses, narrow timber openings, wooden doors, rounded clay vessels, a plain linen canopy and irregular path stones give the village a more consistent set of materials. The packing-table label sits above the canopy in landscape and below the stacked controls in portrait. Its gold ground marker leads to the front of the table. [Implementation plan](q05-village-presentation-plan.md) · [Shadow shader](../../assets/village/contact_shadow.gdshader)

![Q05 village lane in Chrome](evidence/q05-2026-11-09/after-lane.png)

The house details use the stone and mudbrick materials described in Harvard's later Iron Age reconstruction as a regional reference. Reddish slip and brown ware in Penn's Beth Shean collection informed the clay palette. The timber slats, jars, canopy and gateway flanking stones are original design choices for this stylised village. [Harvard village house](https://hmane.harvard.edu/house) · [Penn ceramic sherd](https://collections.penn.museum/collections/object/266266) · [Penn stirrup vase](https://collections.penn.museum/collections/object/284386)

| Browser view | Q04 | Q05 |
|---|---|---|
| Spawn lane | [Before](evidence/q05-2026-11-09/before-lane.png) | [After](evidence/q05-2026-11-09/after-lane.png) |
| Greeting | [Before](evidence/q05-2026-11-09/before-greeting.png) | [After](evidence/q05-2026-11-09/after-greeting.png) |
| Provisions from the lane | [Before](evidence/q05-2026-11-09/before-provisions-far.png) | [After](evidence/q05-2026-11-09/after-provisions-far.png) |
| Table approach | [Before](evidence/q05-2026-11-09/before-provisions-near.png) | [After](evidence/q05-2026-11-09/after-provisions-near.png) |
| Lift | [Before](evidence/q05-2026-11-09/before-lift.png) | [After](evidence/q05-2026-11-09/after-lift.png) |

The clean Godot village check reported **13,056 environment triangles and 46 surfaces**. Q04 measured 9,768 triangles and 46 surfaces. The result stays within the provisional ceiling of 15,000 triangles and 70 surfaces. David and Jesse add four triangles across the two shadow planes. The final gzip PCK is 683,185 bytes. The WASM hash matches Q04. [Godot village check](evidence/q05-2026-11-09/village-checks.log) · [Q05 manifest](evidence/q05-2026-11-09/build-manifest.json)

## Browser comparison

The same keyboard movement and mouse-look route ran twice per preset in headless Chrome at 1440 × 810 CSS pixels, device scale 1, on the Intel Graphics laptop over loopback. Browser frame callback intervals are a pacing measurement. Godot reports engine FPS and draw calls separately. Each trial changed one option from the 1280 × 720 contact-shadow build. [Browser harness](../../tools/browser-village-visual-check.cjs) · [Q04 report](evidence/q05-2026-11-09/before-review.json)

| Setup | Callback p95 across two runs | Gaps over 50 ms, total | Median engine FPS, range |
|---|---:|---:|---:|
| Q04 default, 1280 × 720 cap | 32.9–61.9 ms | 19 | 31 |
| Q05 contact shadows, 1280 × 720 cap | 62.5–62.9 ms | 53 | 28–29 |
| Q05 directional shadow, 20 m range and 1024 atlas | 63.0–63.1 ms | 100 | 24 |
| Q05 contact shadows and 2× MSAA | 62.6–63.0 ms | 86 | 24–27 |
| Q05 contact shadows, 1152 × 648 cap | 32.0–62.6 ms | 27 | 30–31 |
| Q05 contact shadows, 1440 × 810 cap | 31.6–31.7 ms | 0 | 32 |

The directional trial drew a sharper silhouette, brightened the lit ground and raised median draw calls to 81–82 from 72–74. MSAA softened geometry edges and lowered median engine FPS in these runs. The 1440 × 810 cap kept the tested viewport at 1.0 3D scale and gave the clearest view with the fewest long gaps. It is the selected village default. Extra light remains available with its 854 × 480 cap. [Original-cap report](evidence/q05-2026-11-09/original-cap-review.json) · [Directional screenshot](evidence/q05-2026-11-09/trial-directional.png) · [Directional report](evidence/q05-2026-11-09/directional-review.json) · [MSAA screenshot](evidence/q05-2026-11-09/trial-msaa.png) · [MSAA report](evidence/q05-2026-11-09/msaa-review.json) · [1152 cap report](evidence/q05-2026-11-09/lean-review.json) · [1440 cap trial](evidence/q05-2026-11-09/sharper-review.json)

Both default runs on the packaged desktop build recorded **31.7 ms callback p95, zero gaps over 50 ms and 32 median engine FPS**. Extra light recorded 31.7–33.5 ms callback p95, seven long gaps across its two runs and 32 median engine FPS. The browser reached the table and completed the pickup with zero browser errors. Physical phone pacing and sustained play are part of Q06. [Desktop browser report](evidence/q05-2026-11-09/desktop-review.json) · [Desktop test manifest](evidence/q05-2026-11-09/desktop-build-manifest.json)

Chrome touch emulation passed the complete exchange and pickup at 390 × 844. A separate run on the final export verified the repositioned portrait label from the lane and beside the table, then completed the pickup. Both runs passed nine checks and recorded zero browser errors. [Full portrait exchange](evidence/q05-2026-11-09/portrait-exchange-review.json) · [Final portrait check](evidence/q05-2026-11-09/portrait-marker-review.json) · [Marker from the lane](evidence/q05-2026-11-09/portrait-provisions-far.png) · [Marker beside the table](evidence/q05-2026-11-09/portrait-provisions-near.png)

The local Q05 preview is served at `http://127.0.0.1:8065/`. Rebuild it with `./tools/export-proof.ps1 -OutputFolder q05/preview` and serve it with `python tools/serve-proof.py --preview q05/preview --port 8065`.
