# M3 · Chapter 5: David and Goliath

Subsequent update: [12 November controls polish](m3-controls-polish.md) introduces direct mouse aim/click, F to throw, Space to dodge and simultaneous touch actions. Use its port 4188 links for the current review. The frozen port 4187 evidence below retains the original controls and performance measurements.

Later on 12 November, the owner authorised [Chapter 6 — Victory](m3-chapter-06.md). The new port 4189 candidate retains the revised controls, adds Continue to Victory at the confirmed battle gate and resumes the aftermath at the produced conclusion. Earlier frozen builds retain their historical gates.

12 November 2026. Implemented under Segun's explicit instruction to connect Preparation to the voiced confrontation and playable sling battle, including defeat and Retry Battle, then show the browser result before moving on. [Scoped implementation plan](m3-chapter-05-brief.md) · [Current production plan](../roadmap/project-reset-plan.md). **Owner creative acceptance is open. Chapter 6 production has not started.**

[Play Chapter 5 in isolated review](http://127.0.0.1:4187/duel.html?review=1) · [Updated Preparation with Face Goliath](http://127.0.0.1:4187/preparation.html?review=1) · [Normal episode entry](http://127.0.0.1:4187/episode.html).

## Play and review

1. Select **Begin Chapter 5**. Walk down the track across the brook and approach Goliath. In the updated connected candidate, **Face Goliath** appears after actual Chapter 4 sling practice.
2. The approximately **28-second** confrontation plays automatically once per approach. Goliath addresses David, David answers in faith, and a soldier reacts. Authored shots, generated voices, body gestures, listener reactions, waveform-driven mouths and captions lead back to the shoulder camera.
3. Control returns to David. Move with WASD/arrows or the touch stick. Drag or use I/J/K/L to aim; press Space or **Throw**. The reticle highlights aim assistance near Goliath's animated forehead. The visible sling releases a flying stone at its authored hand/pouch position.
4. Misses continue the same attempt. Step sideways when Goliath raises his spear and the warning lane appears. Only his lethal strike causes defeat. After five misses, back away to the brook for another five-stone supply; exhaustion itself is not a defeat condition.
5. **Retry Battle** restores battle entry, the champion, five stones and all prior preparation. It resets the projectile, aim and unfinished action/audio. The new attempt repeats the voiced confrontation; it does not replay Preparation.
6. An actual forehead impact saves the battle outcome once, plays the existing non-graphic fall and stops at **The champion has fallen**, the Chapter 5 review gate. **Replay Chapter 5** opens an isolated preview. The victory/retreat chapter remains ahead.

Pause/Resume holds both audio contexts, the cinematic, player, spear and projectile. Sound controls both voice and effects mixes; captions remain available when muted. Restart checkpoint cancels the current action and returns to battle entry without granting progress. Visibility loss pauses the scene.

## What changed

| Area | Result |
| --- | --- |
| Scene | New `duel.html` entry and dedicated chapter coordinator/CSS. Reuses the established Elah sky, terrain, shelters, trees, instanced ranks, shield-bearer and two foreground soldiers. Playable height/collision remain aligned; only distant ridges are exaggerated. |
| Characters | Retains the teenage speaking David, his saved appearance choices, speaking adult Goliath and original sling/spear/fall clips. No character model was replaced or overwritten. |
| Voiced confrontation | Five original paraphrases in the existing standard David, Goliath and soldier voices. Non-overlapping scheduling at 1.4, 6, 9.5, 16.5 and 22.2 seconds. Shot changes and speaking/listening poses follow the same pause-aware voice clock. |
| Combat | Reuses the proven simulation: finite stones, repeat-safe throw input, visible flight, forehead assistance, missed throw, advance, telegraphed spear, evade and lethal defeat. An optional presentation setting supplies the longer exchange and stops after the fall. Earlier fixture defaults remain intact. |
| Integration | Preparation gains **Face Goliath**. The actual ordered ten-objective prefix, run/revision, appearance and preparation enter Chapter 5 on the same candidate origin. The existing content/save contract remains `m2-outline-1`; presentation is `m3-duel-1`. |
| Checkpoints | Defeat saves only the permitted reason. Retry increments the attempt and preserves earlier objectives. A confirmed hit commits only `goliath.struck`, leaving the run active at the eleven-objective prefix. `victory.witnessed` is not earned here. |
| Outcome recovery | Reload after the hit restores a canonical fallen-champion pose and the review gate, without requiring another win or completing the episode. Current routing holds that checkpoint in Chapter 5 until Chapter 6 is produced. |
| Save protection | Failed retry/outcome writes pause the scene and retain the confirmed checkpoint. Retry save continues the same pending write; another tab's newer progress forces reload. |

Review mode explicitly seeds a ten-objective prefix in memory. Normal mode never seeds preparation. The normal-save integration test starts from a labelled **nine-objective fixture**, earns the actual final practice, follows Face Goliath and plays the battle. It is not a claim that Chapters 1–5 were freshly replayed in that test. Browser storage is origin-specific: the older frozen port 4186 and this port 4187 have separate normal saves.

## Correction found by browser testing

The first battle replay exposed conflicting pose owners: the short fixture challenge and the new speaking presentation both tried to drive Goliath in the same frame. Interrupting those transitions caused an animation-controller error and an incomplete reset. The produced exchange now exclusively owns Goliath's challenge pose; combat resumes ownership when the fight begins. Subsequent full desktop, touch, retry and legacy-fixture checks pass without page errors.

The first build also exposed a Windows-default text encoding in the new HTML; it was corrected to valid UTF-8 before the browser candidate was tested. Two test-harness failures were corrected separately: synthesized four-second noise buffers were initially counted as voice recordings, and multiple installed runtime paths were mistakenly passed as positional arguments to the old fixture test. These were verification issues, not recorded gameplay successes. The evidence linked below comes from the successful reruns.

## Executed verification

| Check | Result and evidence |
| --- | --- |
| TypeScript and production export | **Passed**, ten browser entries in `build/playcanvas-m3-ch05`. Vite retains the shared engine's large-chunk warning. |
| Ordered story/save rules | **Passed** using `npm.cmd --prefix apps/playcanvas run test:story`. Includes no skipped objectives, permitted lethal defeat, preparation-preserving retry, duplicate/stale/failed writes, aftermath and the produced chapter routes. [Rules test](../../apps/playcanvas/tests/episode-rules-check.cjs). |
| Assets and voice provenance | **Passed**. [Asset manifest](../assets/duel-asset-manifest.json), [test](../../apps/playcanvas/tests/duel-assets-check.cjs). Verifies retained speaking/combat rigs, source text, actual WAV hashes/durations, non-silent mouth envelopes and unchanged licensed model/voice-bank hashes. |
| Full desktop journey | **Passed**, Chrome 157.0.8103.52, 1280 × 720. [Results](evidence/m3-ch05-2026-11-12/browser-results.json), [test](../../apps/playcanvas/tests/duel-browser-check.cjs). Actual mouths, authored shots, locked cinematic controls, pause, repeated-input prevention, miss, dodge, lethal defeat, retry, hit, eleven-objective gate and preview isolation. |
| Portrait/landscape touch | **Passed**, emulated 390 × 844 and 844 × 390. [Results](evidence/m3-ch05-2026-11-12/touch-results.json), [test](../../apps/playcanvas/tests/duel-touch-check.cjs). Actual touch movement, drag aim, pause, mute, miss and hit in both layouts; portrait also exercises lethal defeat and Retry Battle. Essential controls are at least 48 pixels and no viewport overflow was detected. |
| Earned handoff and recovery | **Passed**. [Results](evidence/m3-ch05-2026-11-12/recovery-results.json), [test](../../apps/playcanvas/tests/duel-recovery-check.cjs). Actual final Chapter 4 practice and same-run handoff, cancelled exchange, saved-defeat reload, failed retry write/recovery, failed hit write/recovery, confirmed outcome reload and another-tab stale protection. |
| Actual audio output | **Passed**. [Results](evidence/m3-ch05-2026-11-12/audio-results.json), [test](../../apps/playcanvas/tests/duel-audio-check.cjs). Meters fork the outgoing voice and effects masters. Both become silent when muted, sound returns, captions/clock continue, and Pause suspends both contexts. No microphone was used. |
| Earlier battle fixture | **Passed** on the same new export. [Results](evidence/m3-ch05-2026-11-12/fixture-regression/results.json), [test](../../apps/playcanvas/tests/battle-check.cjs). Desktop/touch challenge, sling, spear, audio, dodge, defeat/retry, fall, retreat, replay and the smaller 320 × 568 / 568 × 320 layouts retain their prior behaviour. The fixture retreat does not grant Chapter 6 production credit. |

The normal recovery run ends at an **active eleven-objective prefix**, attempt 2 after one lethal defeat, with delivered provisions, armour declined, five gathered stones and sling readiness. The durable gathered count remains five while the live battle pouch counts available throws; this is the existing inventory contract. No reward or additional failure condition was added.

Representative actual renders: [Goliath speaks](evidence/m3-ch05-2026-11-12/01-goliath-contempt.png), [David answers](evidence/m3-ch05-2026-11-12/02-david-faith.png), [soldier response](evidence/m3-ch05-2026-11-12/03-soldiers-watch.png), [control returns](evidence/m3-ch05-2026-11-12/04-player-control.png), [spear anticipation](evidence/m3-ch05-2026-11-12/05-spear-warning.png), [defeat](evidence/m3-ch05-2026-11-12/06-defeat.png), [confirmed hit](evidence/m3-ch05-2026-11-12/07-confirmed-hit.png), [fall](evidence/m3-ch05-2026-11-12/16-champion-falls.png), [review gate](evidence/m3-ch05-2026-11-12/08-chapter-complete.png), [portrait](evidence/m3-ch05-2026-11-12/09-portrait-goliath.png), [landscape aiming](evidence/m3-ch05-2026-11-12/12-landscape-aim.png), [earned handoff](evidence/m3-ch05-2026-11-12/14-earned-preparation-handoff.png).

## Performance and limits

[Exclusive profile](evidence/m3-ch05-2026-11-12/profile.json) · [Loaded resources/renderer](evidence/m3-ch05-2026-11-12/profile-resources.json) · [Profile source](../../apps/playcanvas/tests/duel-profile.cjs). Existing Intel N150 / Intel Graphics laptop, Chrome 157.0.8103.52, WebGL 2 through ANGLE Direct3D 11. Other automated test browsers were closed. Each frame sample excludes 1.5 seconds of warm-up. The fall screenshot was taken after frame collection stopped, so its capture cost is not included.

| Measurement | Observed |
| --- | --- |
| Three fresh Chrome processes to entry ready | 4.822, 5.407 and 4.724 s; median **4.822 s** |
| Approach, voiced exchange and actual winning throw | **38.24 s**, **31.77 FPS**, p95 **35.4 ms**, maximum **303.1 ms** |
| Whole-sample gaps above 50 ms | **2**; causes not conclusively isolated |
| Voiced confrontation alone | **26.43 s**, **32.01 FPS**, p95 **35.3 ms**, maximum **41.2 ms**, **0 gaps over 50 ms** |
| Loaded encoded resource bodies | **5,161,465 bytes**, about 5.16 MB |
| Estimated gzip bodies from loaded files | **2,756,551 bytes**, about 2.76 MB; not measured hosted transfer |

These samples meet a proposed 30 FPS **average** floor on this laptop, with little margin. They do not meet the recommended 60 FPS desktop goal or establish a guaranteed 30 FPS minimum. The 303 ms hitch remains a profiling/optimisation follow-up. The earlier small-courtyard 3.5-second startup and 2 MB download proposals remain unmet. Loading was unthrottled over loopback; fresh processes do not flush OS/driver caches. Functional startup observations under other test loads are retained in their own result files.

The whole-journey sample includes only brief active combat. It is not a sustained battle or mobile GPU stress measurement. The profile also checks that the actual fall animation reaches the ground at the review gate. Do not treat successful engineering verification as final performance/art acceptance.

The environment and actors retain the project's stylised art. This step does not establish photorealism, phoneme-aligned lip sync, simulated cloth or individually animated distant crowds. Physical-phone GPU/memory/heat, Safari, hosted loading and unaided player feedback remain unmeasured. The touch results verify responsive layout/input in desktop Chrome emulation. Owner assessment of voice performance, visual finish, camera pacing and enjoyment remains required.

Ammo refill remains the existing battle rule. This chapter's desktop/touch journeys exercise misses followed by retry or a hit; they do not newly verify five consecutive misses and an actual brook refill. The original source behaviour was retained, not relabelled as a fresh browser test.

## Reproduce and hand over

```powershell
npm.cmd --prefix apps/playcanvas run build -- --outDir ../../build/playcanvas-m3-ch05
npm.cmd --prefix apps/playcanvas run preview -- --outDir ../../build/playcanvas-m3-ch05 --host 127.0.0.1 --port 4187 --strictPort
```

Run the chapter's `duel-*-check.cjs` scripts with a single installed Playwright module path as their first argument. The legacy `battle-check.cjs` instead takes origin, module path and output directory. Profile only after other automated test browsers close.

- [Chapter coordinator](../../apps/playcanvas/src/app/duel-main.ts), [presentation and shots](../../apps/playcanvas/src/world/duel-presentation.ts), [reused area](../../apps/playcanvas/src/world/movement-area.ts), [combat](../../apps/playcanvas/src/gameplay/elah-battle.ts), [story/save boundaries](../../apps/playcanvas/src/gameplay/episode-rules.ts).
- [Editable dialogue and licensing/provenance](../assets/duel-assets.md), [script](../../source-assets/audio/chapter-05-lines.json).
- Candidate **M3-CH05-20261112-01**, [file/hash manifest](evidence/m3-ch05-2026-11-12/candidate-manifest.json), separate from earlier frozen previews.

No deployment, commit, push, authentication/backend work, rewards or Chapter 6 production was performed. Review Chapter 5 in the browser before authorising the victory chapter.
