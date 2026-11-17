# M3 · Chapter 6: Victory

12 November 2026. Implemented under Segun's explicit request for the Philistine retreat, Israelite soldiers cheering and story conclusion, followed by browser review. [Scoped plan](m3-chapter-06-brief.md) · [Current production plan](../roadmap/project-reset-plan.md). **Owner creative acceptance remains open.** This completes the produced chapter sequence; it does not establish that the entire web application, M4 services or release gates are complete.

[Watch Victory in isolated review](http://127.0.0.1:4189/victory.html?review=1) · [Battle with Continue to Victory](http://127.0.0.1:4189/duel.html?review=1) · [Normal episode entry](http://127.0.0.1:4189/episode.html).

## What to watch

Select **Begin Chapter 6**. The approximately **38-second** sequence plays automatically, with Pause/Resume, Sound and Restart conclusion available throughout.

| Scene time | Presentation |
| --- | --- |
| 0–3.0 s | Goliath lies fallen; a quiet recognition beat establishes the aftermath. |
| 3.0–7.0 s | A voiced retreat call and the shield-bearer's turn into a curved running route around the champion. |
| 7.0–12.1 s | The camera follows the fleeing Philistine ranks toward their ridge; starts are staggered and feet/arms change through running poses. |
| 12.1–16.6 s | A foreground Israelite raises his arms and shield, speaks and cheers; the ranks react behind him. |
| 16.6–22.5 s | Wider Israelite cheering, with eight authored voice layers and varied crowd gestures. |
| 22.5–28.5 s | David's closing response, mouth/gesture animation and acknowledgement. |
| 28.5–38.0 s | Wide Elah/David frame, original plucked-note musical resolution and closing narration. |

The main recordings begin at 3.2, 12.4, 23.0 and 29.2 seconds; the narration ends around 36.2 seconds, followed by a short closing hold. The music and cheers share the same pause-aware audio clock as the animation and camera.

The ending carries forward the previously approved non-graphic treatment. It follows [1 Samuel 17:50–53](https://www.bible.com/bible/1/1SA.17.KJV) through original game paraphrases and a closing reflection. The camera follows the retreat, Israel's response and David without introducing a new graphic action. No reward, XP, stars or achievement is awarded.

## Delivered work

| Area | Implemented behaviour |
| --- | --- |
| Chapter handoff | The updated Chapter 5 result has **Continue to Victory**. A normal run carries the actual eleven-objective prefix, run ID and revision. Episode routing resumes `victory.witnessed` at `victory.html`. |
| World and characters | Retains the established Elah landscape, youthful David/appearance and fallen Goliath. Two existing soldier roles use the new rigged performance variant. Earlier GLBs and frozen candidates remain unchanged. |
| Retreat | One foreground shield-bearer runs around the fallen champion. Twenty-four Philistines turn and flee with staggered timing, six baked running poses and terrain-following placement. |
| Cheering | A detailed foreground cheering clip lifts the actual hand above the head and moves the attached shield/spear. Twenty-four Israelites use three cheaper baked gesture poses with varied timing. |
| Audio | Seven new original generated recordings; eight crowd-voice layers; existing synthesized wind/equipment/steps; an original runtime plucked-note cue. Mouth envelopes follow recorded speech. [Assets/rights/source record](../assets/victory-assets.md). |
| Control consistency | Victory is a cinematic conclusion with pause, mute and restart. The revised practice and battle controls are retained in this candidate. Restart cancels the old schedule before creating a new sequence. |
| Completion | The sequence reaches its end before accepting `victory.witnessed`. One existing save write commits the twelfth objective and episode-completed state together. A failed write retains the eleven-objective checkpoint and offers retry/reload. |
| Results and replay | Results show six chapters and the run's actual attempt/defeat counts. Reload opens the completed result without replaying or re-crediting the ending. Replay conclusion preserves that result. Replay episode uses the existing API to archive its summary and start a new run. |
| Return path | Normal results can open the existing episode summary. This does not introduce or claim a finished account dashboard. Review mode keeps normal browser progress unchanged. |

The content/save contract remains `m2-outline-1`; presentation is `m3-victory-1`. Completion is retained as the current run. Its summary enters history when **Replay episode** creates the next run, matching the existing save contract. Conclusion replay does not add history or a second completion.

## Visual corrections from actual rendering

The first rendered route crossed the fallen champion. The shield-bearer's path now curves around him and the camera follows that direction. The first crowd bake also multiplied source palette albedo by material albedo, making distant figures too dark. The bake now writes one material colour per vertex, with separate faction cloth colours and a neutral runtime tint. The actual cheering hand/head positions and final browser captures were inspected after these corrections.

One early asset assertion used an inappropriate absolute three-metre hand height. It was corrected to compare the actual hand with the soldier's actual head; the observed raised hand is roughly 0.31 m above that joint. The passed evidence below comes from the corrected checks, not that failed attempt.

## Verification and evidence

- **TypeScript, production build and story/save rules passed.** Eleven browser entries are exported. Rules verify ordered progress, actual preparation, permitted defeat/retry, cue cancellation, failed/stale/duplicate writes, the Victory route and replay/history. Vite retains its existing large shared-engine chunk warning.
- **Asset checks passed:** [manifest](../assets/victory-asset-manifest.json), [test](../../apps/playcanvas/tests/victory-assets-check.cjs). New clips and speaking morphs, nine unskinned coloured crowd poses under 1,900 triangles each, actual WAV hashes/envelopes and the unchanged licensed generator/voice-bank hashes are checked.
- **Desktop cinematic passed:** [results](evidence/m3-ch06-2026-11-12/browser-results.json), [test](../../apps/playcanvas/tests/victory-browser-check.cjs), Chrome 157.0.8103.52, 1280 × 720. Actual fleeing positions, foreground hand elevation, mouths/voice sources, crowd gestures, David/narration, pause, completion timing, preview isolation and restart without old cheering schedules.
- **Portrait/landscape touch passed:** [results](evidence/m3-ch06-2026-11-12/touch-results.json), [test](../../apps/playcanvas/tests/victory-touch-audio-check.cjs), 390 × 844 and 844 × 390. Full conclusion, touch pause/resume, readable captions, accessible result buttons at least 48 pixels high, no viewport overflow and preview isolation. These are desktop Chrome emulations.
- **Actual output mute passed:** [audio results](evidence/m3-ch06-2026-11-12/audio-results.json). Meters fork the outgoing speech/crowd and music masters; both are non-silent, mute to zero and resume while captions remain. Pausing holds the shared audio clock. No microphone is used.
- **Earned handoff, durable completion and recovery passed:** [results](evidence/m3-ch06-2026-11-12/recovery-results.json), [test](../../apps/playcanvas/tests/victory-recovery-check.cjs). An explicitly labelled ten-objective preparation fixture earns the actual Chapter 5 winning hit, follows Continue to Victory with the same run/revision, watches the ending, recovers a failed completion write and reloads the completed result. A second tab performs actual Replay episode, creating a fresh run with the prior completed summary in history; the stale first tab cannot overwrite it.

The integration fixture is not a claim of a newly replayed full Chapters 1–6 journey. Earlier chapters have their own evidence. The final desktop/touch passes use the corrected crowd asset. The recovery/handoff run exercised the same progression logic before the final crowd-colour correction.

Actual renders: [aftermath](evidence/m3-ch06-2026-11-12/01-after-the-giant.png), [shield-bearer](evidence/m3-ch06-2026-11-12/02-shield-bearer-retreat.png), [fleeing ranks](evidence/m3-ch06-2026-11-12/03-ranks-flee.png), [foreground cheer](evidence/m3-ch06-2026-11-12/04-israelite-cheering.png), [cheering ranks](evidence/m3-ch06-2026-11-12/05-ranks-celebrate.png), [David](evidence/m3-ch06-2026-11-12/06-david-thanks.png), [closing story](evidence/m3-ch06-2026-11-12/07-closing-story.png), [results](evidence/m3-ch06-2026-11-12/08-episode-complete.png), [earned handoff](evidence/m3-ch06-2026-11-12/09-earned-battle-handoff.png), [portrait cheer](evidence/m3-ch06-2026-11-12/12-portrait-cheer.png), [landscape results](evidence/m3-ch06-2026-11-12/14-landscape-results.png).

## Performance and remaining boundaries

[Exclusive fresh-process profile](evidence/m3-ch06-2026-11-12/profile.json) · [Profile source](../../apps/playcanvas/tests/victory-profile.cjs). Chrome 157.0.8103.52 on the existing Intel N150 / Intel Graphics laptop, WebGL 2 through ANGLE Direct3D 11. Other automated test browsers were closed; the first 1.5 seconds are excluded from frame measurements.

| Measurement | Observed |
| --- | --- |
| Three fresh Chrome processes to entry ready | 4.637, 4.596 and 4.697 s; median **4.637 s** |
| Whole conclusion sample | **36.53 s**, **32.00 FPS**, p95 **38.3 ms**, maximum **45.4 ms** |
| Frame gaps over 50 ms | **0** in this sample |
| Retreat / cheering / closing averages | **32.00 / 32.03 / 31.99 FPS** |
| Loaded encoded resource bodies | **5,640,735 bytes**, about 5.64 MB |
| Estimated gzip bodies from loaded files | **3,053,967 bytes**, about 3.05 MB; not a measured hosted transfer |

The sample meets the proposed 30 FPS average floor on this laptop with limited margin. It does not establish a guaranteed minimum or meet the recommended 60 FPS desktop goal. The earlier small-courtyard 3.5-second startup and 2 MB download proposals remain unmet. The absence of a long gap in this conclusion is not a claim that every scene or device is hitch-free. Loopback loading was unthrottled; fresh browser processes do not flush OS/driver caches. Causes of the roughly 32 FPS pacing are not conclusively isolated here.

The cast and landscape remain the project's stylised assets. Foreground actors have smooth rigged clips; distant ranks use discrete baked poses. Mouth animation uses waveform envelopes rather than phonemes. The score is synthesized, not a recorded historical instrument/crowd. Owner judgement of voice performance, visual finish and pacing remains required.

Physical-phone GPU/memory/heat, Safari, hosted transfer, unaided player feedback, a fresh full six-chapter regression and the M4 account/dashboard/cloud-save work remain outside this step's verified outcome. The local completed episode is not a production release recommendation.

## Source and handover

- [Chapter page](../../apps/playcanvas/victory.html), [coordinator](../../apps/playcanvas/src/app/victory-main.ts), [world/crowd](../../apps/playcanvas/src/world/victory-world.ts), [shots](../../apps/playcanvas/src/world/victory-shots.ts), [audio/score](../../apps/playcanvas/src/world/victory-audio.ts).
- [Blender source script](../../source-assets/characters/victory_soldiers.py), [editable dialogue](../../source-assets/audio/chapter-06-lines.json), [asset/rights notes](../assets/victory-assets.md).
- Candidate **M3-CH06-20261112-01**, `build/playcanvas-m3-ch06`, loopback port 4189, [file/hash manifest](evidence/m3-ch06-2026-11-12/candidate-manifest.json). Earlier candidates remain frozen. Normal saves are origin-specific.

```powershell
npm.cmd --prefix apps/playcanvas run build -- --outDir ../../build/playcanvas-m3-ch06
npm.cmd --prefix apps/playcanvas run preview -- --outDir ../../build/playcanvas-m3-ch06 --host 127.0.0.1 --port 4189 --strictPort
```

No deployment, commit, push, reward system, extra episode or account/backend implementation was performed. Review the Chapter 6 browser sequence before proceeding to subsequent product work.
