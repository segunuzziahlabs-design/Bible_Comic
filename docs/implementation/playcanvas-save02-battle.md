# SAVE-02 · Elah battle fixture

## Implementation plan

1. Keep the SC-01 entrance and terrain. Trigger a short, captioned exchange when David crosses the approach line. Lock movement during the exchange and return it before Goliath can strike.
2. Put an aim guide in the follow view. Use pointer drag or I/J/K/L to adjust it, and **Throw** or Space to release. Launch a visible stone, resolve contact with Goliath's forehead in flight and leave the encounter active on a miss.
3. Give Goliath one spear attack with a fixed direction, a visible wind-up and a recovery. David can leave the marked strike area using normal movement. Only contact during the strike can end the attempt in defeat.
4. Seed the local fixture with the completed preparation and five stones. Restore the entry pose and preparation on **Retry Battle**, including a clean cue, input and combat state. Use the aftermath anchor after one confirmed hit and show the fall before the result.
5. Build and test through the browser on desktop and emulated touch. Cover cue handoff, pause, a miss, a dodge, a lethal strike, retry, and one hit and fall. Rerun the courtyard checks where controls are shared.

The encounter uses the SC-01 stand-ins and draft captions. SC-02 owns the final rig, authored attack and sling animations, voice, sound, and the retreat.

## Play the fixture

Open [Valley of Elah battle](http://127.0.0.1:4179/elah.html), select **Enter valley**, and follow the track over the brook. The exchange starts at the approach line and returns control automatically.

- Move with **WASD**, the arrow keys or the touch stick. Drag the view or use **I/J/K/L** to move the aim guide over Goliath's forehead. The guide changes shape and colour within the assisted aim window.
- Press **Space** or select **Throw** to wind up and release. Each release spends one stone. A miss keeps the same attempt active. If all five stones are spent, move back to the brook to replenish the pouch.
- When Goliath raises his spear, step sideways out of the marked lane. His strike follows the direction he chose at the start of the wind-up. A hit on David during the thrust shows a non-graphic defeat.
- Select **Retry Battle** to return to the entrance with five stones and the seeded preparation. A fresh attempt clears held inputs, aim, in-flight stones and the current spear attack. A winning shot plays one fall and sets the local checkpoint to `battle.aftermath`.

The active fight, captions and projectile share the paused game clock. The aim window is sampled when the player presses Throw. An assisted shot is aimed at Goliath's forehead on release, and the stone still has to reach it in flight. The fixture uses a short, straight flight with a swept contact check. The result and checkpoint are in memory.

## Build and browser checks

Run from the PlayCanvas app directory.

```powershell
npm.cmd run build -- --outDir ../../build/playcanvas-save02
npm.cmd run preview -- --outDir ../../build/playcanvas-save02 --host 127.0.0.1 --port 4179 --strictPort
```

Run `tests/battle-check.cjs` against the preview with the local Playwright module. Screenshots and the test report are written to `build/save02-evidence/`. The movement, cue and Elah entry suites cover the shared controller and the earlier preview routes.

The battle suite passed in Chrome 157 on 10 November 2026.

| Run | Verified result |
| --- | --- |
| Desktop, 1280 × 720 | The challenge blocked movement and throwing, pause froze its clock, and control returned at the end. Pause also froze an in-flight stone. A miss kept the attempt active. One dodge avoided a strike. The next strike caused defeat. Retry cleared the held movement key and restored the entry pose, preparation and five stones. A new throw produced one hit, one fall and the aftermath checkpoint. |
| Emulated touch, 390 × 844 | Drag aiming and a tap produced one miss. Touch movement avoided the first thrust, and the second caused defeat. The Retry Battle tap restored the entry pose and five stones. |
| Emulated touch, 320 × 568 and 568 × 320 | Combat controls fit after resizing. Landscape drag and tap produced one hit and victory in the retried attempt. |

The Elah entry, courtyard movement and courtyard cue regression suites also passed on the production build.

[Scene development plan](playcanvas-scene-development-plan.md) · [SET-02 contracts](playcanvas-set02-contracts.md)
