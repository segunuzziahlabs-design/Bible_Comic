# M3 · Final episode integration

12 November 2026 · Candidate **M3-INTEGRATION-20261112-01** · Engineering integration checks passed. Owner creative/usability acceptance remains open.

[Play the complete episode locally](http://127.0.0.1:4190/episode.html) · [Scoped implementation plan](m3-final-integration-brief.md) · [Main production plan](../roadmap/project-reset-plan.md)

## Result and changes

All six produced chapters are connected through the normal local-save route. A new Chrome context earned every one of the twelve objectives, watched the cinematics at normal speed, recovered confirmed checkpoints, lost one battle, retried, won, completed Victory and replayed the episode. The fresh journey used no injected saves, review shortcuts or altered game clocks.

- Replaced the obsolete M2 outline launcher with a lightweight entry/continue/completed-summary screen. Removed its unreachable outline gameplay path and the resulting unnecessary engine/model imports. The six produced chapter coordinators and ordered story/save contract remain in use.
- Replaced normal handoff copy that said development stopped for chapter review. The next chapter is now explicit. Chapter replays in Chapters 1–4 are labelled **Preview** to distinguish them from normal saved progression; isolated previews remain available.
- Restored canvas focus after Resume in Chapters 1–3, matching Preparation and the duel. The browser test waits for asynchronous audio resume before checking focus.
- Added a shared sound preference. Sound off/on now survives reload and navigation through all six chapters. It is stored separately as `bible-comic.episode.sound-muted.v1`; preference-storage failure keeps the current page playable and does not alter the confirmed story checkpoint.
- Preserved the existing direct movement/aim/throw/dodge controls, five-stone preparation, lethal-strike-only defeat, battle-entry retry, non-graphic conclusion and no-reward policy. No asset, voice, chapter architecture, account service or dependency was replaced.

Chapter cards retain a deliberate **Continue** and **Begin/Resume** action on the next page so sound starts from an explicit browser gesture. This is a connected episode with chapter loading, rather than a seamless single-document world.

## Verification

| Check | Actual evidence |
| --- | --- |
| Fresh normal Chapters 1–6 | [Compact journey summary](evidence/m3-integration-2026-11-12/journey-summary.json), [full input-run/resource/frame record](evidence/m3-integration-2026-11-12/fresh-journey-results.json), [test](../../apps/playcanvas/tests/integration-fresh-journey.cjs). One run ID, twelve earned objectives, zero uncaught/console errors and zero failed required resources. |
| Handoffs | Same run, revision and prefix across Valley → Camp → Challenge → Preparation → Duel → Victory. Actual handoff readiness: 3.428, 1.222, 1.399, 1.148 and 1.306 seconds in this cache-warm loopback journey. |
| Checkpoints | Delivery stays delivered after reload; worn armour is restored; declining it persists; partial stone collection resets to the last aggregate checkpoint; all five stones and practice readiness reach the duel. |
| Player controls and recovery | Actual practice movement/miss/hit; battle miss, telegraphed spear, directional dodge, lethal defeat, defeated-state reload, Retry Battle with five stones and the same preparation, then an actual winning hit. |
| Completion/replay | Twelve objectives, status completed, **2 attempts / 1 defeat**. Reload preserves completion. Replay from the episode summary creates a different run ID with no earned objectives and archives the prior result. |
| Mobile input | [Touch results](evidence/m3-integration-2026-11-12/controls/touch-results.json): 390 × 844 and 844 × 390, independent movement/aim/action contacts, exactly one throw per tap, dodge, practice leave/re-entry, miss/hit and portrait defeat/retry. |
| Early chapter mobile flow | [Results](evidence/m3-integration-2026-11-12/early-chapters-layout-results.json): Chapters 1–3 in both orientations, captions/action bounds, pause/resume and real joystick movement after each film. |
| Small screens | [Results](evidence/m3-integration-2026-11-12/small-layout-results.json): 320 × 568 and 568 × 320, launcher and every chapter entry, scroll-reachable entry buttons, 48 px footer actions and no page overflow. These small sizes are layout checks; full combat input is verified at the larger sizes above. |
| Conclusion and sound | [Victory layouts](evidence/m3-integration-2026-11-12/victory/touch-results.json), [actual output meters](evidence/m3-integration-2026-11-12/victory/audio-results.json), [six-chapter sound continuity](evidence/m3-integration-2026-11-12/sound-continuity-results.json). Voice/crowd and music mute to zero and resume; captions remain. Restored Sound off keeps all observed chapter output masters below 0.000001 gain. |
| Failed/stale writes | [Results](evidence/m3-integration-2026-11-12/recovery/recovery-results.json): a clearly labelled prepared-prefix fixture earns the battle hit and full ending, recovers a deliberately failed completion write, reloads the confirmed result, performs actual replay in a second tab and blocks the stale first tab. This supplemental fixture is separate from the fresh full journey. |
| Cancel/repeat guards | [Results](evidence/m3-integration-2026-11-12/controls/cancellation-results.json): cancelled mouse press cannot fire on resume; held movement does not leak through pause; repeated F is one action; restart cancels an unfinished practice throw. |
| Static/story checks | TypeScript and production build passed after the source changes. `npm.cmd --prefix apps/playcanvas run test:story` passed for order, cue ownership, duplicate/cancelled/stale/failed saves, actual preparation, defeat/retry, completion and replay. Vite still warns about the shared engine chunk size. |

The fresh run ID is `5501561c-1e18-4f3a-b005-243eab3c448e`. Its first checkpoint was recorded at 16:51:34 UTC and completion at 16:59:32 UTC. This automated duration includes intentional interruptions, reloads and a defeat; it is not a measured unaided human playtime or evidence of enjoyment. Early test-authoring assertions were corrected before this passed run; the previous assertion trace is retained separately as `prior-harness-assertion.json`.

Actual renders: [opening](evidence/m3-integration-2026-11-12/01-valley-opening.png), [delivery](evidence/m3-integration-2026-11-12/03-provisions-delivery.png), [challenge](evidence/m3-integration-2026-11-12/04-goliath-challenge.png), [Saul](evidence/m3-integration-2026-11-12/05-before-saul.png), [practice](evidence/m3-integration-2026-11-12/07-practice-player-control.png), [battle](evidence/m3-integration-2026-11-12/10-player-aim.png), [Victory](evidence/m3-integration-2026-11-12/11-victory-cheers.png), [completion](evidence/m3-integration-2026-11-12/12-complete-episode.png).

## Loading and performance

Intel N150 / Intel Graphics laptop, Windows, Chrome **157.0.8103.52**, WebGL 2 via ANGLE Direct3D 11. [Fresh-process loading](evidence/m3-integration-2026-11-12/loading-profile.json), [blank-page/rendering diagnostic](evidence/m3-integration-2026-11-12/pacing-diagnostic.json), [uninterrupted sustained sample](evidence/m3-integration-2026-11-12/sustained-profile.json).

| Measurement | Observed |
| --- | --- |
| New entry ready, three fresh Chrome processes | 292 / 305 / 195 ms; median **292 ms** |
| Opening 3D ready after Begin episode | 4.779 / 4.982 / 4.614 s; median **4.779 s** |
| Entry plus opening, excluding human hesitation | Median **5.080 s** |
| Entry script/style resource bodies | **6,281 bytes**, versus **579,461 bytes** for the prior frozen launcher; approximately **98.9% less** in this local measurement |
| Opening encoded resource bodies | **5,213,403 bytes** (about 5.21 MB), excluding the HTML document |
| 45-second Chapter 3 sample | **31.98 FPS**, p95 **33.5 ms**, maximum **65.9 ms**, **1** interval over 50 ms; lowest one-second count **30** |
| Visible Chrome Victory diagnostic | **31.99 FPS**, p95 **34.8 ms**, maximum **40.3 ms** over a seven-second measured segment; median CPU update+render **5.7 ms**, measured GPU **10.1 ms** |

The sustained sample covers Goliath's voiced challenge, actual movement to Eliab and the next exchange, with no deliberate pause or screenshot. Its two-second initial warmup is excluded. It meets the provisional 30 FPS average floor in this sample, with limited margin and one measured hitch. It does not establish a guaranteed minimum or achieve the 60 FPS desktop goal.

Both blank-page requestAnimationFrame and Victory ran around 32 FPS in sequential headless and visible Chrome diagnostics. Temporarily disabling rendering or using 640 × 360 also stayed around 32 FPS. The broader functional journey varied approximately 31–51 FPS; its raw gaps include intentional pauses, capture and save waits. These results show that a simple resolution reduction did not improve the measured pacing in this environment; they do not identify a specific OS/browser setting or exclude every possible rendering bottleneck. Diagnostic mutations existed only in test memory. Production rendering quality was retained, and superseded local preview tabs were closed before the final profiling pass.

The older small-courtyard **3.5-second startup / 2 MB download** proposals are not met by the produced opening scene. The entry-screen reduction does not reduce the chapter's required art/audio payload. The full frozen build is 21.61 MB on disk across 121 files, including all chapter and retained preview entries; that is not an initial download measurement. Loading was unthrottled loopback, and fresh Chrome processes do not flush OS/driver caches. Hosted transfer, real mobile GPU/memory/heat and Safari remain unverified.

## Candidate, operation and remaining gate

[Candidate manifest](evidence/m3-integration-2026-11-12/candidate-manifest.json) identifies the separate frozen `build/playcanvas-m3-integration` directory. Previous candidates and original project DOCX files were preserved. Local saves are origin-specific: this port's fresh review does not alter prior ports' checkpoints.

```powershell
npm.cmd --prefix apps/playcanvas run build -- --outDir ../../build/playcanvas-m3-integration
npm.cmd --prefix apps/playcanvas run preview -- --outDir ../../build/playcanvas-m3-integration --host 127.0.0.1 --port 4190 --strictPort
```

Use **Begin episode**, then **Begin Chapter 1**. Continue at each chapter card. Keyboard/mouse: WASD/arrows, E to interact, mouse aim and click/F to throw, Space to dodge, Escape to pause. Touch: left stick, drag to aim/look, and the displayed interaction/Throw/Dodge buttons. Reload returns to the last confirmed objective, not an unfinished action.

Segun should now play the complete normal episode and judge controls, voice performance, visual finish, transitions and pacing. The existing stylised assets and audio-envelope mouth animation remain; this integration does not claim photorealistic final art or unaided-player acceptance. M4's Clerk/account/profile/dashboard/cloud-save work and later production release checks are still separate milestones. No deployment, commit, push, new episode, reward system or online-service provisioning was performed.
