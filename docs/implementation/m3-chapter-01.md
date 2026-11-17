# M3 · Chapter 1: The Valley of Elah

11 November 2026. Implemented under the owner's explicit [Chapter 1 authorisation and brief](m3-chapter-01-brief.md), using the accepted [David–Saul presentation](m1-cinematic-sample.md) as the working quality reference. The owner subsequently instructed proceeding, authorising [Chapter 2 production](m3-chapter-02-brief.md). This is permission to advance, not blanket acceptance of final art or release quality. The frozen Chapter 1 candidate below ends at its original review gate; the newer Chapter 2 candidate adds a Continue to the camp action after the survey.

[Play Chapter 1 in review mode](http://127.0.0.1:4183/valley.html?review=1) · [Normal episode entry](http://127.0.0.1:4183/episode.html) · [Asset and voice rights](../assets/valley-opening-assets.md)

## Play and review

1. Select **Begin Chapter 1** to enable sound and play the 36-second opening.
2. Watch David arrive, the opposing ridges and armies, a speaking sentinel, Goliath across the brook, a soldier's reaction and David's resolve.
3. When control returns, walk to the gold overlook marker using WASD/arrows or the touch stick. Drag to look.
4. Select **Survey the valley** once, or press E. The 10-second survey guidance plays automatically and ends at the review gate.
5. Use Pause/Resume, Sound on/off or Restart as needed. Replay opens a fresh review preview.

Review mode uses an isolated in-memory session and preserves the browser's saved episode. Normal episode mode uses the M2 save adapter: the intro alone grants no progress; only the completed owned survey saves `valley.surveyed`. The next objective remains the existing camp outline, but this Chapter 1 scene stops for review rather than playing it automatically. Existing M2 checkpoint schema and objective IDs are retained; the presentation revision is `m3-valley-1`. No published release content pack has been replaced.

## Scene production delivered

| Area | Result |
| --- | --- |
| Camera | Authored arrival, wide geography reveal, sentinel close-up, champion glimpse, soldier reaction and David close-up. The final shot eases to the follow camera. Portrait uses a wider lens. |
| Environment | Ochre/limestone terrain, extra relief on the distant ridges, distinct cloth colours for the opposing camps, shelters, poles, stakes, jars, guard equipment, olive trees, scrub, a shallow brook, an original sky painting, warm sunlight and character shadows. |
| Cast | The existing youthful David and appearance choices; two foreground rigged soldiers; Goliath and his shield-bearer; 48 instanced clothed soldiers in the distant ranks. |
| Activity | Foreground patrol with measured walk-cycle travel, eased turning and idle pauses; speaking/pointing gestures, listener motion and a timed reaction; varied distant stance sway and subtle canvas movement. |
| Speech | Seven locally generated original lines/calls, with narration and distinct David/soldier voices. Visible speakers have waveform-driven mouth movement, blinking and expressions. |
| Sound | Positional voices/calls and footsteps, original wind, canvas/equipment texture and sparse low percussion. Ambience lowers under dialogue. Speaker-oriented equal-power stereo avoids the extra HRTF processing used in an earlier pass. |
| Control and recovery | One cinematic clock for audio, shots, sampled poses and mouths; pause/resume, mute with captions, restart cancellation, range-gated survey, one objective credit and an explicit end-of-chapter review gate. |

The distant soldiers use a **3,416-triangle standing-pose bake**, not dozens of skeletal controllers. The foreground actors retain the accepted full rig/mouth workflow. This keeps the same character style at distance and replaces the block-shaped stand-ins in this scene. [Verified asset manifest](../assets/valley-asset-manifest.json).

The playable approach uses the existing tested ground-height surface; raised distant ridges are presentation geometry outside its walk boundary. Camp props have collision. The champion is visible across the brook; combat rules do not run in this chapter. The treatment is a period-oriented stylised scene, not a claim of photorealism or exact archaeological reconstruction.

## Technical corrections made during review

Visual inspection, beyond code checks, caught an invisible champion despite a loaded model. His animation controller was transitioning before a real first pose was established, leaving collapsed skin bounds. The shared character loader now establishes `goliath_ready` explicitly before returning. The browser check verifies the forehead is above the root, and the actual reveal capture shows the champion.

The sky material now uses an unlit, fog-free emissive texture so terrain fog does not flatten the whole sky. Distant ridges received additional relief, and the shield-bearer/ranks now use the clothed LOD. Speaking gestures are aligned to line onsets and finish once rather than restarting partway through a line.

An initial combined browser run reported an intermittent null-resource error; isolated touch rechecks did not reproduce it. First creation of the shared soldier container was made sequential as a precaution. The subsequent complete cold-launch/touch run recorded no browser errors. Continue watching loading/context recovery during later release stress checks; the exact earlier error's cause was not conclusively isolated.

## Executed checks and evidence

- **TypeScript and production build passed**, including the six browser entries. Vite retains the existing shared-engine chunk warning. Build command: `npm.cmd --prefix apps/playcanvas run build -- --outDir ../../build/playcanvas-m3-ch01`.
- **Story rules passed:** `npm.cmd --prefix apps/playcanvas run test:story` retains the M2 objective, cue ownership, checkpoint, defeat/retry and replay tests.
- **Asset checks passed:** [valley-assets-check.cjs](../../apps/playcanvas/tests/valley-assets-check.cjs) verifies all generated voice hashes, the previously licensed model/voice-bank hashes, and the soldier's triangle/no-skeleton/no-animation budget.
- **Desktop chapter journey passed:** [browser results](evidence/m3-ch01-2026-11-11/browser-results.json). It checks initial champion pose, actual speaking mouth weights, audio/mouth pause, muted captions, return of movement, survey range and duplicate input, interrupted-survey cancellation past its old completion time, Chapter 1-only credit, review isolation and restart.
- **Portrait and landscape touch journeys passed:** [touch results](evidence/m3-ch01-2026-11-11/touch-results.json), Chrome 157.0.8103.39, 390 × 844 and 844 × 390. Each runs the film, pause/resume, touch movement and survey to the review gate. It checks no horizontal overflow, essential 48-pixel controls and preservation of an existing local-storage value.
- **Existing battle regression passed:** [results](evidence/m3-ch01-2026-11-11/battle-regression/results.json) cover the animated challenge, sling, telegraphed spear, audio pause, fall, retreat, defeat and retry on desktop and emulated touch. This verifies the shared Goliath initial-pose correction, not Chapter 2 production.

Sources: [main browser test](../../apps/playcanvas/tests/valley-browser-check.cjs), [touch/profiler](../../apps/playcanvas/tests/valley-touch-profile.cjs).

Representative captures: [arrival](evidence/m3-ch01-2026-11-11/01-arrival.png), [valley reveal](evidence/m3-ch01-2026-11-11/02-valley-reveal.png), [speaking sentinel](evidence/m3-ch01-2026-11-11/03-soldier-speaking.png), [champion](evidence/m3-ch01-2026-11-11/04-goliath-glimpse.png), [David's line](evidence/m3-ch01-2026-11-11/05-david-speaking.png), [player control](evidence/m3-ch01-2026-11-11/06-player-control.png), [review gate](evidence/m3-ch01-2026-11-11/07-chapter-one-complete.png), [portrait](evidence/m3-ch01-2026-11-11/08-portrait-soldier.png), [landscape](evidence/m3-ch01-2026-11-11/08-landscape-soldier.png).

## Measured performance and remaining limits

The final 45-second desktop run on the **Intel N150 / Intel Graphics laptop**, Chrome WebGL 2 through ANGLE Direct3D 11, measured **32.00 FPS**, **35.4 ms p95**, **41.4 ms maximum** and **zero measured intervals over 50 ms**, after excluding 1.5 seconds of playback warm-up. The capture includes the opening and subsequent idle exploration. [Final playback profile](evidence/m3-ch01-2026-11-11/profile-steady.json).

Earlier checks showed frame-pacing variation, including an isolated 1.2-second interval and shorter early-arrival hitches; the final audio-processing pass and playback check above did not reproduce those hitches. The earlier [combined-run profile](evidence/m3-ch01-2026-11-11/profile.json) is retained. This is evidence from this laptop, not a guarantee for every device.

Three earlier fresh Chrome processes took **5.293, 5.514 and 5.571 seconds** to the ready entry screen, median **5.514 seconds**. The final single launch took **6.196 seconds**. Loading remains above the earlier small courtyard's provisional 3.5-second target and needs optimisation before release. The browser measured about **5.22 MB of encoded resource bodies**; fully gzipping the loaded files is estimated at **2.89 MB**, not a measured hosted transfer. The larger scene exceeds the earlier courtyard's 2 MB provisional budget. No target is silently marked met.

These timings use local loopback and fresh browser processes/profiles, without network throttling. Physical Android/iPhone, Safari, thermal/memory limits, a hosted mobile network and unaided participant feedback remain unmeasured. Distant soldiers have a baked pose with stance sway; mouths use audio envelopes rather than phoneme articulation. Those are explicit quality boundaries for review, not claims of finished crowd combat or facial capture.

## Files and handover

- [Scene/environment](../../apps/playcanvas/src/world/valley-opening.ts), [shot definitions](../../apps/playcanvas/src/world/valley-shots.ts), [audio](../../apps/playcanvas/src/world/valley-audio.ts), [browser coordinator](../../apps/playcanvas/src/app/valley-main.ts).
- [Editable soldier bake](../../source-assets/characters/valley_soldier_lod.py), [voice generator](../../tools/generate-valley-dialogue.py), [voice provenance](../assets/valley-voice-provenance.json), [rights record](../assets/valley-opening-assets.md).

The frozen M1 and M2 local previews remain separate. This Chapter 1 delivery performed no deploy, commit, push, Clerk setup or Chapter 2 production. The subsequent owner instruction authorises [the separate Chapter 2 candidate](m3-chapter-02.md); that candidate now connects the survey gate to the camp and has its own creative review.
