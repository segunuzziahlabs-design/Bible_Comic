# SC-02 · Animated Elah encounter

## Implementation plan

1. Build a distinct adult Goliath from the project's existing weighted character rig in Blender. Fit the bronze helmet, layered scale armour and spear to the skeleton. Export the character and named combat clips as one Web GLB.
2. Add David's sling action to his existing teenage rig. Keep movement on the locomotion layer and sample the sling pose on the upper body. Align the stone launch with the hand and pouch at the release frame.
3. Drive Goliath's challenge, advance, spear wind-up, strike, recovery, recoil and fall from the existing battle states. Keep strike timing, the warning lane, aim, outcomes and retry on the same paused clock.
4. Add original effects for the wind, footsteps, armour, sling, spear, impact and retreat. Unlock audio after **Enter valley**, provide a sound toggle and retain captions.
5. After the fall, show the shield-bearer and Philistine ranks fleeing. Keep the conclusion non-graphic and present the replay action after the retreat.
6. Build a separate production preview. Verify the complete encounter, sound, pauses, retry, both endings and portrait and landscape layout. Review screenshots and rerun the earlier movement and cue checks.

## Character and sound assets

| Asset | Authoring and runtime use | Export |
| --- | --- | --- |
| Goliath | Broadened adult rig with original scale armour, cheek guards, greaves and beard. The spear attaches to the hand rig. The forehead marker follows the animated head and drives the sling target. The five clips cover ready, challenge, advance, spear attack and fall. | 68 joints, 11,711 triangles, 814,956 bytes raw and 304,175 bytes gzip |
| David | Existing teenage rig and appearance slots with a new `sling_throw` clip. The upper-body rotation curves layer over locomotion. Frame 13 at 24 fps supplies the stone's release position from the animated right hand and pouch. | 65 joints, 9,819 triangles, 1,103,148 bytes raw and 412,438 bytes gzip |
| Sound | Original synthesized wind, distant ranks, sand steps, armour, spear, sling, stone impacts and retreat. A sound toggle controls the mix. The exchange and retreat use captions. | Generated as mono buffers in the browser |

The figures use the project's existing weighted base and its recorded CC0 provenance. The Goliath armour, spear, beard and combat poses are project-authored additions. [Base rig provenance](q02-quaternius-rig-probe.md)

The shipped David SHA-256 is `62d72ff675b1c25fe921bb5432bf095c389cecf70f6f8b3c19535ec6ae4aaf3f`. The Goliath SHA-256 is `df009695ada0a094d77d5e313bcaf5edb629ab7f38072062daa1b453679dbe0e`.

### Rebuild the character exports

Run from the repository root with the pinned Blender installation. The scripts write to a scratch directory before the GLBs are copied into the PlayCanvas assets.

```powershell
. ./tools/Toolchain.ps1
$elahBlender = (Get-BibleComicToolchain).Blender
$elahGoliathArgs = @('--background', 'source-assets/characters/david.blend', '--python-exit-code', '1', '--python', 'source-assets/characters/elah_combat.py', '--', 'build/sc02/goliath')
$elahDavidArgs = @('--background', 'source-assets/characters/david.blend', '--python-exit-code', '1', '--python', 'tools/stack-evaluation/build-david.py', '--', 'build/sc02/david', '--teen', '--sling')
& $elahBlender @elahGoliathArgs
& $elahBlender @elahDavidArgs
```

## Play and verify

Open the [animated Elah encounter](http://127.0.0.1:4180/elah.html), select **Enter valley** and cross the brook. Drag or use **I/J/K/L** to aim at Goliath's forehead. Press **Space** or tap **Throw**. Step sideways when he raises the spear. After a winning hit, the camera follows the fleeing shield-bearer and ranks, then shows **Play again**. After a lethal strike, **Retry Battle** restores David at the entrance with his preparation and five stones.

Build from the PlayCanvas app directory.

```powershell
npm.cmd run build -- --outDir ../../build/playcanvas-sc02
npm.cmd run preview -- --outDir ../../build/playcanvas-sc02 --host 127.0.0.1 --port 4180 --strictPort
```

Run `tests/battle-check.cjs` with the preview origin and local Playwright module. The final run collects browser assertions, rig positions, audio buffer and pause checks, and screenshots in `build/sc02-final-evidence/`.

## Verification

The final production build passed the encounter in Chrome 157 on 10 November 2026.

| Run | Verified |
| --- | --- |
| Desktop, 1280 × 720 | Challenge and control handoff, pauses during the challenge, flight and retreat, one missed throw, a dodge, a lethal thrust, clean retry, and a winning throw. The joint checks saw David lift the sling, the spear move forward during the strike, Goliath reach the ground and the spear settle with him. Replay returned the fleeing actors to their starting positions. |
| Emulated touch, 390 × 844 | Drag and tap, miss, touch dodge, defeat, **Retry Battle**, a muted mix and a readable portrait retreat. |
| Emulated touch, 320 × 568 and 568 × 320 | Combat controls fit after resizing. Landscape drag and tap produced one hit and reached the retreat and result. |
| Audio | Chrome started the ambience after entry, suspended audio on pause and resumed it on return. Combat and retreat sources contained non-silent buffers. The touch run completed with the mix muted and captions visible. |

The Elah entry, courtyard movement, courtyard cue and character appearance suites passed in the SC-02 candidate before the final fall and pouch revisions. The complete encounter suite was rerun after those revisions.

[Scene development plan](playcanvas-scene-development-plan.md) · [Verified battle fixture](playcanvas-save02-battle.md) · [Episode design](../story/david-and-goliath-episode-design.md)
