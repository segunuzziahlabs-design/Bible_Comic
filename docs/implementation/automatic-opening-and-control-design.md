# Automatic messenger opening and player control proposal

16 November 2026 · [Plan written before implementation](../controls/player-controls-plan.md) · [Control design and integration order](../controls/player-control-design.md)

**Subsequent CTRL-03 integration:** the owner approved the layout; [shared action controls and actual WASD/touch movement](ctrl03-shared-controls.md) now run on port 4196. This document preserves the earlier opening/preview candidate. Jump and Jump Shot remain future mechanics.

**Owner decision: retain Goliath's spear.** This supersedes the earlier arrow selection. The updated opening is implemented; the proposed Jump and Jump Shot controls are a separate interface simulation for review. No new combat physics or live battle remapping is claimed.

## What changed in the game

Begin Chapter 1 starts David beside the lamb. The opening runs automatically, with no Tend prompt or required movement:

| Opening time | Performance |
| --- | --- |
| 0.7 s | Opening narration begins over the flock. |
| 4.2 s | David begins the existing care-for-lamb performance, sampled more slowly. |
| 6.4–10.0 s | The distinct messenger walks in while David tends the lamb; the keeper stays with the flock. |
| 6.6–9.779 s | David's existing gentle line plays; it finishes before the summons. |
| 10.2 s onward | Messenger summons, David's answer and keeper's response play automatically. |
| After the exchange, approximately 24 s | Movement returns. The player follows the marker to Jesse's courtyard. |

One Speak action starts Jesse's retained conversation. The provisions remain in the courtyard and require a separate Take action after Jesse gives the errand. Ridge discovery, Elah survey, earned Camp handoff, local save boundaries and sound recovery are retained. Held inputs clear when control changes. Pause suspends the scene's audio clock, so animation and arrival do not continue behind the menu. Restart cancels the previous scheduled lines and starts the field scene again.

Changed production sources: [shepherd-opening.ts](../../apps/playcanvas/src/world/shepherd-opening.ts), [shepherd-world.ts](../../apps/playcanvas/src/world/shepherd-world.ts), [valley-main.ts](../../apps/playcanvas/src/app/valley-main.ts) and [episode-main.ts](../../apps/playcanvas/src/app/episode-main.ts). Existing assets and recordings were reused.

## Proposed controls, separate from the live battle

The [interactive preview](http://127.0.0.1:4195/) uses a capture of the existing battle with a functional HTML control layout. Try WASD/arrows, the visible keys, a touch stick, Jump, Dodge and Sling; the phase selector also allows direct review of exploration and cinematic layouts. Three Dodge previews unlock the sling opportunity. Aim at the forehead to enable the optional Jump Shot demonstration. These actions show input/readiness feedback over a static backdrop.

Recommended map: WASD/arrows Move, E Interact, Space Jump, Shift Dodge, F/click Sling, Q Jump Shot, Escape Pause. On touch, movement sits left and actions right, with a thumb stick as the default and optional direction buttons. Cinematics hide gameplay controls. The proposal follows primary Microsoft control/touch guidance and W3C target-size guidance, linked with the specific design implications in the [design report](../controls/player-control-design.md#research-translated-into-this-design).

**The actual game still uses Space to Dodge.** Jump requires authored takeoff/air/landing clips, vertical motion, collision and camera work. Jump Shot requires a real animated hand release and verified forehead hit. The preview does not establish those mechanics, animation quality, battle balance or player comprehension. Review the proposed bindings/layout before integrating CTRL-03 through CTRL-07. The retained spear thrust remains the initial weapon behaviour; a ranged spear throw is a separate proposed extension.

## Verification performed

| Actual check | Result / evidence |
| --- | --- |
| TypeScript and production build | Passed. Frozen output `build/playcanvas-auto-opening-controls`; build log `build/automatic-opening-build.log`. The existing large-engine-chunk warning remains. |
| Fresh opening, no Tend input, courtyard conversation/pickup and Elah journey | Passed on desktop 1280 × 720 and emulated portrait 390 × 844 / landscape 844 × 390. [Three-layout results](evidence/automatic-opening-2026-11-16/automatic-opening-results.json). Desktop also reaches the same-run Camp delivery. |
| Automatic arrival pause, resume, real frame hitch and restart | Passed. Scene time, David's care pose and messenger position stay frozen while paused; restart cancels old speech and the subsequent automatic handoff occurs once. [Targeted results](evidence/automatic-opening-2026-11-16/automatic-pause-results.json). |
| Story/save rules | Passed `npm.cmd --prefix apps/playcanvas run test:story`: objective order, cue ownership, idempotency, save failure/staleness, preparation, defeat/retry, completion and replay. |
| Separate control preview | Passed desktop keyboard/pointer, simultaneous two-contact touch, 390 × 844, 844 × 390 and 320 × 568. Checks include independent held-input ownership, one action per press, pause/cinematic cancellation, aim gating, minimum 44 px targets and no horizontal overflow. [Results](evidence/control-design-2026-11-16/preview-results.json). |

Visual evidence: [David tending while the messenger arrives](evidence/automatic-opening-2026-11-16/desktop-automatic-messenger-arrival.png), [control returned](evidence/automatic-opening-2026-11-16/desktop-control-returned.png), [desktop control proposal](evidence/control-design-2026-11-16/desktop-jump-shot.png), [portrait](evidence/control-design-2026-11-16/portrait-combat.png) and [landscape](evidence/control-design-2026-11-16/landscape-combat.png).

These checks used real browser inputs and measured game audio output. They are responsive-layout/input evidence, not physical-phone performance or confirmation of sound reaching the owner's speakers. Chapters 2–6 were not fully replayed in this pass; their earlier full-journey results remain historical. No new startup/frame-pacing baseline, production release acceptance or new jump mechanics are claimed.

## Local review and reproduction

- [Play the updated opening](http://127.0.0.1:4194/episode.html). Begin episode, then Begin Chapter 1. Watch the tending and messenger, then walk to Jesse when control returns.
- [Try the proposed controls](http://127.0.0.1:4195/). The page identifies itself as an interface prototype.
- [Game candidate manifest](evidence/automatic-opening-2026-11-16/candidate-manifest.json) and [preview manifest](evidence/control-design-2026-11-16/preview-manifest.json) record file sizes and SHA-256 hashes. The sum of files is a package inventory, not measured network transfer or startup size.

Both are open in new in-app browser tabs. The game is left at **Begin Chapter 1**, preserving the complete first scene for the owner. The preview is showing Sling opportunity with the proposed key console and combat actions; Jump Shot correctly requires forehead aim. [Opening ready in-app](evidence/automatic-opening-2026-11-16/in-app-ready.png) · [Complete control review in-app](evidence/control-design-2026-11-16/in-app-control-review.png). Earlier owner tabs were not navigated or reset.

Run each server in its own terminal if it is no longer running:

```powershell
npm.cmd --prefix apps/playcanvas run preview -- --outDir ../../build/playcanvas-auto-opening-controls --host 127.0.0.1 --port 4194 --strictPort
```

```powershell
npm.cmd --prefix apps/playcanvas run preview -- --outDir ../../docs/controls/preview --host 127.0.0.1 --port 4195 --strictPort
```

Test entry points: [automatic opening](../../apps/playcanvas/tests/automatic-opening-check.cjs), [automatic pause/restart](../../apps/playcanvas/tests/automatic-intro-pause-check.cjs) and [control preview](../../apps/playcanvas/tests/control-design-preview-check.cjs). Pass the bundled Playwright module path and local origin as arguments. [Capture script](../../tools/capture-controls-scene.cjs) records the existing battle backdrop, hiding the old HUD in that capture session only.

Earlier frozen builds and owner progress are preserved. No commit, push, deployment or service changes. Next practical task after control review: CTRL-03, the shared action router and functional movement console in the actual game, before integrating real jump animation and collision.
