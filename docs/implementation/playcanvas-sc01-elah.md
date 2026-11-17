# SC-01 · Valley of Elah blockout

The player enters as the existing teenage David, follows a track downhill, crosses a shallow stony brook and approaches Goliath and his shield-bearer. The opening view places the camps on separate ridges, one to each side of the encounter. This local scene is the layout and camera review for the first battle.

## Period reference sheet

| Reference | Place and period | Application to the scene |
| --- | --- | --- |
| [1 Samuel 17:1–7, 40–54](https://bible.usccb.org/bible/1samuel/17) | The account places the armies in the Valley of Elah, between Socoh and Azekah. The game uses an approximate 1000 BC setting. | Use opposing hills, a brook, Goliath's bronze-coloured helmet and scale armour, a shaft with a dark iron-coloured head and a separate shield-bearer ahead of him. David's stone gathering, sling and encounter belong to the later playable beats. |
| [Ashkelon 7 · The Iron Age I](https://hmane.harvard.edu/publications/ashkelon-7-iron-age-i) | Ashkelon on the southern Levantine coast. The report includes twelfth- and eleventh-century BC material. | Use the excavated material culture to inform the Philistine camp's later props. The low shelters and fabric colours in this layout are design choices. |
| [Philistine cooking ware](https://www.levantineceramics.org/wares/158-philistine-cooking-ware) | Southern Coastal Plain and Shephelah, with Iron Age examples. | Use round cooking vessels with a short neck and a loop handle when detailing the camp. |
| [Harvard Museum of the Ancient Near East · Village house](https://hmane.harvard.edu/house) | Reconstruction of a later Iron Age house in the region. | A regional material reference for the later Bethlehem scene. Use rough stone footings and earth walls in the next village art pass. |

The layout compresses walking distances for play. The path, vegetation, lighting, exact camp locations, clothing colours and the roughly three-metre Goliath stand-in are choices for the adaptation. Terrain, shelters and stand-ins use original geometry generated in PlayCanvas. David uses the existing project GLB and saved appearance options.

## Scene card

| Point | Position in metres (x, z) | Purpose |
| --- | --- | --- |
| `battle.entry` | (0, 8.5) | Start behind David facing downhill. Both camps and the champion group share the opening view. Restart returns here. |
| Brook | Around z = −2.8 | Stones and a dip across the track. The ground mesh and David's footing use the same surface. |
| `battle.approach` | (0, −5.6) | Crossing this line changes the objective to “Battlefield reached.” David retains movement and camera control. |
| Goliath and shield-bearer | (0.28, −10.5) and (−1.45, −9.8) | Posed figures establish scale and spacing. Collision keeps David from walking through them. |
| `battle.aftermath` | (2.6, −12.4) | Grounded anchor to stage the later retreat and conclusion. |

David's existing idle and walk clips, movement, orbit, pause and restart run in both the courtyard and Elah. The Elah page loads its scene geometry on demand. [Scene development plan](playcanvas-scene-development-plan.md) · [SET-02 contracts](playcanvas-set02-contracts.md)

## Preview and verification

From the PlayCanvas app directory, build and serve the scene, then open [Valley of Elah](http://127.0.0.1:4178/elah.html).

```powershell
npm.cmd run build -- --outDir ../../build/playcanvas-sc01
npm.cmd run preview -- --outDir ../../build/playcanvas-sc01 --host 127.0.0.1 --port 4178 --strictPort
```

Click **Enter valley**. Use **WASD** or **arrows** to walk down the track, or hold the touch stick forward. Drag the view to orbit.

The browser test checks the production entry view, keyboard and touch traversal, terrain following, desktop pause and Goliath collision, and restart. It captures a screenshot at entry and after crossing the approach line in each layout. Run `tests/elah-check.cjs` against the preview with the local Playwright module. Screenshots and test results are written to `build/sc01-evidence/`.

The production build and Elah checks passed in Chrome 157 on 10 November 2026. The layouts were desktop at 1280 × 720 and emulated touch at 390 × 844, 568 × 320 and 320 × 568. Both camps and the champion group were in frame at entry. The spear tip was in frame at the approach. The courtyard movement and timed cue regression suites also passed.

## Next scene work

SAVE-02 uses the approach line and entry anchor for the opening exchange, sling and spear mechanics, and local retry. SC-02 replaces the stand-ins and stages the encounter with animation and sound. [Playable battle and test results](playcanvas-save02-battle.md) · [Implementation order](playcanvas-implementation-plan.md#milestones)
