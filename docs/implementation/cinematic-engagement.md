# Cinematic storytelling and engagement handover

13 November 2026 · Local candidate **CINEMATIC-20261113-01** · [Implementation plan](cinematic-engagement-plan.md) · [Owner's complete brief](sources/cinematic-engagement-2026-11-13.md)

**Subsequent correction:** the owner requires Jesse personally to give the errand, with pickup in his courtyard. [The corrected opening and current browser review](jesse-courtyard-correction.md) supersede this candidate's messenger/flock pickup. This report and its full recording remain evidence of the earlier frozen version.

The updated episode completed a fresh, normal-speed browser journey through Chapters 1–6, including the new opening, a lethal failed dodge, Retry Battle, three earned evasions, an actual sling hit and Victory. All twelve objectives were earned in one run without seeded progress or developer state repair. This establishes connected working behaviour; creative acceptance and unaided-player usability remain for review.

**Play:** [complete episode](http://127.0.0.1:4191/episode.html). Use Begin episode, then Begin Chapter 1. The earlier port-4190 build and its origin-specific progress are preserved. Nothing was deployed, committed or pushed.

## Story and presentation changes

| Placement | Implemented experience | Story purpose |
| --- | --- | --- |
| Chapter 1, before Elah | Peaceful establishing shots, eight wandering/grazing sheep, player movement to a lamb and one tending interaction. David bends and reaches toward it; birds, wind, bleat-like sounds and restrained music accompany the scene. | Introduces David as a caring shepherd before introducing the armies. |
| Chapter 1, the errand | A messenger visibly approaches with Jesse's voiced instruction. A keeper takes responsibility for the flock. David acknowledges the errand; control returns for a separate provisions pickup. | Makes the reason for David's departure clear through acting and interaction. |
| Chapter 1, the journey | David carries the bundle along a short playable path. A marked ridge triggers a wide valley/camp discovery and distant horns before the existing Elah arrival and survey. Narration runs once. | Builds anticipation and geographical context without a long empty walk. |
| Chapter 3, the challenge | Goliath walks out of the ranks with heavy footstep/equipment beats, a moving shield-bearer, soldier alarm and low/tracking framing. The earlier Chapter 1 view keeps him hidden. | Gives the champion a deliberate first reveal and visible physical presence. |
| Chapter 5, the commitment | A staged entrance includes soldiers' concern, David's voiced commitment and a short forward walk. The camera then returns the approach to the player before the retained confrontation. | Makes David's decision voluntary and emotionally legible. |
| Chapter 5, combat | Three animated spear exchanges precede sling use. The camera stays wider during defence and eases closer for aiming after the third success. Existing throw, fall and Chapter 6 retreat/cheering/conclusion follow the confirmed hit. | Connects cinematic tension to actions the player must perform. |

The messenger and three defensive spear exchanges are **creative staging**, expressly identified in the entry's story note. The provisions errand, keeper and underlying encounter follow the biblical story; the approved fixed victory and non-graphic presentation are retained. See the [story and asset source record](../assets/cinematic-engagement-assets.md).

## Controls and guidance

One reusable guide now projects each actual destination with a label, distance and off-screen arrow. Existing ground markers remain. It covers the lamb, provisions, ridge, departure, camp delivery, brothers, challenge overlook, Eliab, armour, stones, practice and battle approach. Empty battle ammunition points back to the brook. Cinematic footers explicitly say **Watch the scene** rather than suggesting an unavailable interaction.

- **Desktop:** WASD/arrows move; mouse drag looks/aims; E performs the displayed interaction; click/F throws when the sling is available; Space dodges; Escape pauses.
- **Touch:** left stick moves; right-side drag looks/aims; the displayed action performs the interaction. The Dodge button shows the recommended direction. A simultaneous stick direction can override it. Throw appears after the three evasions.
- Without a movement direction, pressing Dodge uses the displayed safe-side recommendation. David never dodges without input. The recommendation accounts for nearby boundaries; a chosen direction can still fail if it does not physically clear the spear.
- Pause/resume, Restart checkpoint, chapter Continue and the next chapter's explicit Begin/Resume remain. The entry explains that the first durable checkpoint follows the Elah survey; reloading the unfinished new opening starts Chapter 1 again.

## Three-spear rules

| Attack | Initial recommended side | Warning time | Distinction |
| --- | --- | --- | --- |
| Right-hand thrust | Left | 2.35 s | First lateral threat and the longest reaction window. |
| Angled return | Right | 2.05 s | Opposing angle, changed body twist and timing. |
| Overhead final thrust | Left | 1.85 s | Shorter warning and wider lethal lane before the sling opportunity. |

Warnings show the attack, direction, progress bar and completed count. A successful dodge requires a registered player dodge during the warning, more than 0.55 m of actual displacement and physical clearance of the lethal spear lane. Standing still, pressing repeatedly or moving into the spear provides no invulnerability. Walking clear without a dodge can survive but does not earn the required credit. Safe failures to earn credit repeat the current stage; lethal contact opens the existing defeat screen.

The controller provides a short dash with authored crouch/sidestep/recovery animation, then returns movement. Sling input is rejected before three successes. Afterwards Goliath remains exposed so the player has time to aim. A miss is not defeat; five misses reveal the marked brook refill. Retry Battle returns directly to combat with all earlier preparation, five stones and zero earned dodges, without replaying the entrance and dialogue. The original isolated battle fixture keeps its earlier immediate-sling contract.

## Issues found and corrected

- Manual animation cuts at zero delta could leave PlayCanvas blend state referencing an empty clip, causing runtime errors on reset. Flush the transition before sampling the requested pose; repeated restart/retry tests now pass.
- Tending framing initially cropped David's head, arm contact needed adjustment, and the provisions bundle sat too high. Reframed the shot, baked arm IK and corrected the grip offset.
- Re-entering the valley discovery could restart the journey narration. Queue discovery until the single narration finishes and retain its once-only guard.
- A browser stall could advance voice playback further than the opening's accumulated frame clock. Presentation now samples the active audio clock. A real 280 ms main-thread stall and pause/resume recovered without clock drift.
- Hardened Goliath's arrival-distance tolerance at the strike boundary. An early third-warning wait timed out without enough captured state to prove its cause; it did not recur in the subsequent repeated browser cases. The tolerance change is a safeguard, not a proven diagnosis of that timeout.
- The empty-ammunition HUD asked for a refill while the destination still pointed at Goliath. Both now direct the player to the brook. Unchanged text also avoids repeated live-region DOM mutations.
- Sound verification now distinguishes suspended preloaded contexts from audible running contexts. The former are silent even if a scheduled gain has not advanced; every running master must still mute to zero.

## Executed verification

Evidence is retained under [cinematic-engagement-2026-11-13](evidence/cinematic-engagement-2026-11-13/).

| Check | Result and evidence |
| --- | --- |
| Fresh Chapters 1–6 | **PASS.** [Compact summary](evidence/cinematic-engagement-2026-11-13/fresh-journey-summary.json), [full input/frame/resource record](evidence/cinematic-engagement-2026-11-13/fresh-journey-results.json), [test](../../apps/playcanvas/tests/cinematic-fresh-journey.cjs). Empty Chrome context, all twelve objectives, one run ID, one lethal defeat, successful second attempt, completion reload and replay/history. Zero captured errors or failed required resources. |
| Complete browser demonstration | [Normal-speed full recording](evidence/cinematic-engagement-2026-11-13/complete-episode.webm), 960 × 540, about nine minutes. **The recording is silent** because the browser video recorder does not capture system audio; the running game contains dialogue/music/effects. It shows real UI/keyboard play, not a montage of fixtures. |
| Repeated spear failures/recovery | **PASS.** [Results](evidence/cinematic-engagement-2026-11-13/spear-repetition-results.json). Explicit prepared-prefix retry fixtures exercise lethal failure at stages 1, 2 and 3, a wrong-way dodge, distinct reaction delays, duplicate input, physical movement, preserved preparation and reset. These supplement rather than replace the fresh journey. |
| Ammo and failed save | **PASS.** [Results](evidence/cinematic-engagement-2026-11-13/ammo-recovery-results.json). Three actual evasions, five misses, brook return/refill without repeating dodges, actual winning hit, forced quota-write failure, Retry Save and confirmed reload. Prepared-prefix fixture is labelled. |
| Touch input | **PASS in Chrome emulation.** [Results](evidence/cinematic-engagement-2026-11-13/touch-results.json). Actual joystick/taps through the new opening, messenger pause, pickup, discovery and entrance; two-finger stick-plus-Dodge, three evasions and actual aimed hit. Portrait/landscape at 390 × 844 / 844 × 390, with later combat at 320 × 568 / 568 × 320. Restart during tending/dodge cancels the former action. |
| Small entry layouts | **PASS.** [Results](evidence/cinematic-engagement-2026-11-13/small/small-layout-results.json). Launcher and six chapter entries at 320 × 568 / 568 × 320, reachable scroll/actions and no page overflow. |
| Final opening clock/handoff | **PASS.** [Results](evidence/cinematic-engagement-2026-11-13/opening-clock-results.json). Another fresh normal Chapter 1, actual frame stall, pause, once-only narration, survey checkpoint and same-run Camp handoff. |
| Sound continuity | **PASS.** [Results](evidence/cinematic-engagement-2026-11-13/sound/sound-continuity-results.json). Off/on preferences across all six chapters; running output masters mute below 0.000001 gain. Preloaded inactive contexts remain suspended. |
| Retained battle fixture | **PASS.** [Results](evidence/cinematic-engagement-2026-11-13/legacy/results.json). Desktop/touch challenge, sling, spear, sound, fall, retreat, defeat and retry retain the original fixture contract. |
| TypeScript/build and rules | **PASS.** [Static checks](evidence/cinematic-engagement-2026-11-13/static-checks.json). Production build/typecheck, ordered story/save/replay checks and focused three-stage battle rules. Vite still warns about the shared engine chunk size. |

The recorded fresh run is `e5958091-a1ea-4223-a0bd-374e10da04dd`, from 10:46:22 to 10:55:27 UTC. Automated duration includes test pauses, reloads and defeat; it is not human completion/enjoyment evidence. [Recorded build hashes](evidence/cinematic-engagement-2026-11-13/recorded-build-manifest.json) precede the final audio-clock, empty-ammo guide and identical-text safeguards. Those final changes received the targeted checks above, including another fresh normal Chapter 1 and handoff. The [final candidate hashes](evidence/cinematic-engagement-2026-11-13/candidate-manifest.json) identify the build currently served. The complete nine-minute video is not claimed to be a second full playthrough of those final small changes.

Representative renders: [tending](evidence/cinematic-engagement-2026-11-13/fresh-02-tending.png), [messenger](evidence/cinematic-engagement-2026-11-13/fresh-03-messenger.png), [valley discovery](evidence/cinematic-engagement-2026-11-13/fresh-05-valley-discovery.png), [David's commitment](evidence/cinematic-engagement-2026-11-13/fresh-08-david-commitment.png), [portrait spear warning](evidence/cinematic-engagement-2026-11-13/portrait-spear-2.png), [completion](evidence/cinematic-engagement-2026-11-13/12-complete-episode.png).

## Measured performance and remaining limits

Intel N150 / Intel Graphics laptop, Windows, Chrome 157.0.8103.52, WebGL 2 via ANGLE Direct3D 11. [Profile and resources](evidence/cinematic-engagement-2026-11-13/performance.json).

| Measurement | Observed |
| --- | --- |
| Shepherd chapter entry ready, three fresh Chrome processes | 3.266 / 3.225 / 3.268 s; median **3.266 s**. Direct chapter navigation to its ready entry, excluding the launcher and human clicks. |
| 45.10 s uninterrupted walking among animated sheep | **50.07 FPS**, p95 **22.8 ms**, maximum **26.2 ms**, zero measured intervals over 50 ms after warmup. |
| Median CPU update / render / draw calls | **1.6 ms / 1.9 ms / 163**. These CPU values do not measure total GPU cost. |
| Initial chapter resource bodies | **8,590,784 bytes**, about **8.59 MB**, excluding HTML. The new world/voice/character content increases the earlier opening's approximately 5.21 MB. |
| Entire frozen directory | **26,472,438 bytes across 136 files**, including retained previews and all chapters. This is not the initial download. |

The opening sample exceeds the provisional 30 FPS average floor but does not achieve the 60 FPS desktop goal. It is one scene on one laptop, not a guaranteed episode-wide minimum. Fresh processes do not clear OS/driver caches; loopback timings do not establish hosted-network startup. The earlier 2 MB download proposal remains unmet. Shepherd and Elah assets currently preload together; staged chapter loading and compressed audio are possible future measured optimisations, not silently introduced architecture changes.

The art remains stylised: procedural sheep, simplified vegetation, retained character meshes and audio-envelope mouths rather than phoneme lip sync. Animal ambience is synthesized rather than natural recordings. New gestures, entrance staging and varied spear poses improve the existing presentation; they do not establish film-quality acting or owner acceptance. No slow motion or camera takeover interrupts the three controlled dodges.

Physical mobile GPU/memory/heat, Safari, hosted transfer and an unaided first-time player's reaction times/clarity remain unverified. Touch emulation establishes layout/input behaviour only. Authentication, profiles, dashboard and cloud saves were not present to preserve; they remain M4 work. Existing browser-local checkpoints, appearance options, chapter order, completion and replay are retained without a save-schema migration.

## Run and review

```powershell
npm.cmd --prefix apps/playcanvas run preview -- --outDir ../../build/playcanvas-cinematic-engagement --host 127.0.0.1 --port 4191 --strictPort
```

This serves the frozen output. Rebuilding that directory changes its candidate identity, so preserve the manifest/build before further changes. Authoring source remains in the PlayCanvas app and [performance/asset sources](../assets/cinematic-engagement-assets.md); original DOCX documents and earlier candidates are unchanged.

The updated normal episode is open in a separate, retained in-app browser tab. It was started from the fresh launcher and left paused in the shepherd opening; select **Resume** to continue. [Observed review state](evidence/cinematic-engagement-2026-11-13/browser-review-opening.png). This handoff did not navigate or reset the owner's port-4190 Camp tab.

The next practical action is Segun's complete fresh playthrough on port 4191, concentrating on the shepherd-to-battlefield pacing, destinations and three warning/dodge reactions. Record creative revisions before moving to another implementation milestone.
