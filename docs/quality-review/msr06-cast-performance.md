# MSR-06: remaining character motion and speech

20 November 2026 · Implemented and browser verified; owner performance/listening review pending.

This pass follows the [execution plan](../implementation/msr06-cast-performance-execution-plan.md) and [overall MSR plan](../implementation/motion-speech-and-guided-routes-plan.md). It extends the accepted David–Saul performance treatment to the remaining staged conversations. It retains the six chapters, twelve objective IDs, appearance options, existing account/save contracts and MSR-04/05 guided connections. No deployment, commit or push is part of this task.

## Changes and retained work

| Chapter | Changes in this pass | Retained behaviour |
| --- | --- | --- |
| 1 · Flock, messenger and Jesse | Messenger completes an eased 0.9-second turn as he stops; restrained, filtered mouths; staggered blinks and listener nods; staged dialogue uses the cinematic voice bus. | Automatic messenger, player-led pasture path, automatic courtyard arrival, Jesse's two instruction gestures, separate Speak/Take, provisions contacts and the road/reveal. |
| 2 · Camp | Restrained mouths, staggered blinks/listener beats and cinematic delivery/greeting voices. | MSR-02's sustained keeper/Eliab gestures; authoritative basket carry/set-down; independent delivery/greeting checkpoints and the two connected routes. |
| 3 · Challenge and Eliab | Small restored head/chest reactions in owned conversations; restrained faces and staggered blinks; forward speech fitting where a line exceeds its clip; cinematic main dialogue. | Existing Goliath entrance and appropriate alarm gestures; authored exchange/camera windows, player approaches and R07 departure. No long all-joint speech freeze was reproduced for Eliab or Goliath in the new baseline, so their performances were not replaced. |
| 4 · Preparation | No further voice, rig or contact edits in MSR-06. | MSR-03's directed David/Saul takes, audience score and restrained faces; armour, five automatic stone pickups, practice and MSR-05 routes. |
| 5 · Confrontation | David's speaking clip now advances forward across the complete faith response; one directed same-cast/same-word take; filtered mouths; spectator speech/reaction beats and blinks; cinematic main voices. | Entrance, weapon/stone release and collision, all combat clocks, free movement, continued spear attacks during aiming, defeat/retry, staged fall and deliberate final sword interactions. No additive head/chest offsets were added to combat David or Goliath. |
| 6 · Victory | Eased retreat turns; staggered distant cheers/rests within the existing crowd; foreground soldier speaks, cheers in three complete bursts and listens during the conclusion. His mouth follows his own spatial chant. The foreground call and chant now use the same existing voice identity. | Existing eight crowd calls, music, 24 retreating/24 cheering instances, nine baked pose groups, 38-second conclusion, completion/reload and replay. |

All additive reactions restore the previous pose before sampling/reset. Blinks use existing morphs on supported rigs; this pass does not add missing facial controls to other models. Prop actions, alarm clips and physical combat animations are excluded from generic speech retiming. Goliath's passive battle pose retains its existing single-owner sampling arrangement; changing it to a second blended writer would risk the combat rig.

## Reproduced findings and measurements

The [baseline](evidence/msr06-2026-11-20/baseline/) is the actual MSR-05 local browser build, captured before these edits. The [first candidate](evidence/msr06-2026-11-20/candidate/) was an exploratory capture; it led to slowing the messenger's remaining fast turn before freezing the final build. These are normal-clock rendered rigs and WebAudio observations, screenshots and recordings, not conclusions drawn from code alone.

| Measured issue | MSR-05 baseline | Final desktop candidate |
| --- | --- | --- |
| David faith response: late one-second sampled-joint excursion | 0.434°; early window 13.133° | 4.130°; early window 13.393°. The expressive tail now continues. |
| David faith response: longest near-static sampled run while audio runs | 0.540 s | 0 s under this diagnostic's 0.1° threshold; deliberate Pause excluded. |
| Messenger: largest observed root-turn step | 82.0° | 12.93° after the final 0.9-second eased turn. |
| Victory foreground retreat: largest observed root-turn step | 174.41° | 30.78° across the observed interval; the pivot is distributed over 0.85 s. |
| Foreground cheering mouth open without its own voice emitter | 45 / 85 sampled frames | 0 / 84 sampled frames. |
| Maximum observed `SpeakOpen` across the five scenes | 1.0 | At most 0.72, with filtered opening/closure. |

[Before summary](evidence/msr06-2026-11-20/baseline/cast-summary.json) · [Final desktop summary](evidence/msr06-2026-11-20/final/cast-summary.json). The Challenge baseline also captured Goliath's voice emitter approximately **7.91 m** behind his arrived position. The final main voice path contains no PannerNode, so that captured starting position no longer attenuates/pans the confrontation.

The [portrait](evidence/msr06-2026-11-20/final/portrait-summary.json) and [landscape](evidence/msr06-2026-11-20/final/landscape-summary.json) traces reproduce the sustained faith gesture and zero sampled foreground crowd-mouth ownership errors. David's first observed post-faith mouth samples are closed at **70.6 / 9.7 / 12.6 ms** after the recording ends in desktop/portrait/landscape. Those are sampled audio-clock observations inside the proposed 150 ms window, not physical output latency or phoneme-alignment measurements.

Joint excursions compare matched one-second early/late recording windows, sampling Head, spine and right arm joints. They are diagnostics of sustained movement, not acting-quality scores or whole-body freeze claims. Root-turn samples are approximately 70–100 ms apart; explicit restart resets and gaps over 250 ms are excluded. Speech-hold analysis excludes paused/suspended audio. Foreground crowd-mouth ownership checks the 15.1–23-second crowd window and actual emitter positions.

The baseline voice observer used duration matching; the final observer also identifies decoded recording URLs. Ambient camp calls with coincident durations are therefore excluded from baseline dialogue-position claims. The baseline opening capture omitted the courtyard recording inventory: its rig/visual capture is usable, but a matched Jesse audio-path comparison is not claimed. Still capture times are documented by their traces; not every before/after screenshot is the identical instant.

## Voice and audio

David's original faith response remains available. The revised take is **6.019 seconds**, compared with **5.888 seconds** originally, with a short thought pause and slower phrase delivery. It uses the same synthetic `am_puck` voice and every original word. The existing 9.5-second cue, next line at 16.5 seconds and 28-second confrontation remain unchanged. [Asset settings, provenance, licence sources and originals](../assets/msr06-battle-performance.md).

Main staged dialogue now takes the existing opt-in cinematic bus, avoiding distance/pan changes at camera edits and moving-actor entrances. Wind, animals, footsteps, equipment and background crowd calls retain their spatial paths. Actual final browser voice graphs verify this separation. Nonzero captured output and gain checks establish that audio is produced and mute works; they do not establish pronunciation, emotional delivery or perceived loudness on the owner's speakers.

Mouth movement still uses the final recordings' waveform/spectral envelopes and each rig's available mouth morphs: primarily `SpeakOpen`, with `SpeakRound` where supported. It is restrained and paused with the owning audio clock. It is not phoneme-specific lip sync. No new voice service, engine, runtime dependency, character model or crowd renderer was introduced.

## Browser and regression verification

Local frozen production build: `build/msr06-frozen`, served at **http://127.0.0.1:4223/**, PlayCanvas **2.24.0**, WebGL 2, local account mode. [Build hashes](evidence/msr06-2026-11-20/frozen-build-manifest.json). This is local save/progression QA; this pass does not recertify live Clerk/Supabase sign-in or physical-phone performance.

| Verification | Result and evidence |
| --- | --- |
| Five revised performances on desktop 1280×720 | PASS — [desktop captures](evidence/msr06-2026-11-20/final/desktop/) |
| The same five in portrait 390×844, actual emulated touch inputs | PASS — [portrait captures](evidence/msr06-2026-11-20/final/portrait/) |
| The same five in landscape 844×390, actual emulated touch inputs | PASS — [landscape captures](evidence/msr06-2026-11-20/final/landscape/) |
| Pause/resume, actual voice-path mute/unmute, finite joints and restrained mouths | PASS in all fifteen cases; Victory restart in all three layouts. [Matrix](evidence/msr06-2026-11-20/verification-matrix.json) |
| Fresh normal Chapters 1–6 with real controls and normal clocks | PASS — twelve ordered objectives, all guided handoffs, checkpoint/reload, armour/automatic stones/practice, two genuine battle misses, defeat/retry, actual winning forehead hit, player sword aftermath, Victory and completed-save reload/replay. [Results](evidence/msr06-2026-11-20/full-episode/desktop/results.json) · [Recording](evidence/msr06-2026-11-20/full-episode/desktop/complete-episode.webm) |
| Console/HTTP errors and storage isolation | None captured in the passing focused cases/full journey; all review cases left normal episode storage unchanged. |
| TypeScript/Vite, cast/voice checks, additive restoration, audience, motion, routes and story rules | PASS for the executed checks listed below. |

The full run earned every objective without seeded normal progress, clock acceleration, manual state repair or direct navigation around the new routes. It ended completed with **two battle attempts / one defeat** and replay retained the completed run in history.

The focused runner uses isolated chapter reviews and real keyboard/CDP touch input at normal clocks. It observes rendered joints, mouths, cameras and actual WebAudio sources without writing game clocks/progression. Each revised scene checks frozen actor/audio state on Pause, continuing the same recording on Resume, zero voice-path gain on Mute and unmuting without replay. Victory also restarts mid-performance without granting its objective. Review runs must leave normal episode storage unchanged. Touch captures check caption bounds and page overflow; action targets are checked before actual taps.

Screenshots, recordings and trace JSON are in the repository's existing ignored `docs/**/evidence/` local archive. The written report, test drivers and voice provenance are the durable source documents; no evidence or application was uploaded by this task.

An initial control probe asserted resume after a fixed 140 ms and failed while Chrome was still resuming audio. The final harness waits for the observed running audio clock. No game change was made for that probe, and it is not counted as a passing run. The earlier attempts remain separate from the final evidence. Browser suites run sequentially on this laptop.

The relevant unit checks cover 500 additive restore cycles, finite joints, forward speech timing, bounded turns, staggered blinks/cheer rests, unchanged voice cast/words, real PCM durations/hashes/cues, and the original confrontation window. Existing audience, route, story and TypeScript checks are retained. Build warnings about existing large chunks and Clerk's `use client` directive remain; they are not new runtime errors.

Executed checks: `audience-performance-check.cjs`, `story-motion-check.cjs`, `cast-performance-check.cjs`, `saul-performance-check.cjs`, `story-route-check.cjs`, `pavilion-route-check.cjs`, `npm run test:story`, `npm run typecheck` and the local-mode production build. The final story run exercises battle integration; this pass does not claim a fresh exhaustive four-direction combat-physics matrix or live authentication test.

The full recorded desktop journey measured frame-interval median **31.20 ms**, p95 **37.70 ms**, worst **148.30 ms**, with **0** intervals above 250 ms. MSR-05's similarly recorded run measured p95 **38.90 ms** (-3.1% change). These are observed capture results, not an accepted clean performance gate. The observed p95 does not exceed the proposed 10% regression trigger; MSR-07 still owns controlled cold/warm and device-budget validation.

The largest sampled audio output peak across the final fifteen cases was **0.818**. No sampled peak reached 1.0; this is not an exhaustive clipping or subjective mix assessment. Crowd instance totals remain 24+24 within the same nine baked groups. Frozen output hashes were rechecked after all browser runs.

Recordings and rig/audio sampling add overhead. Their frame gaps cannot certify the proposed 30 FPS or 250 ms transition gate, nor minimum-phone capacity. Distant cheers still use the existing economical baked poses; this pass adds variation, not a new fully skeletal crowd or higher-detail art direction.

The [build inventory comparison](evidence/msr06-2026-11-20/asset-budget-comparison.json) confirms the same **18 GLB hashes**. Complete raw output grows by **14,311 bytes**, from 36,427,975 to 36,442,286 bytes. This totals every built page/asset; it is not a first-page download or compressed transfer measurement.

## Review and next step

Use the isolated local previews: [flock → Jesse](http://127.0.0.1:4223/valley.html?review=1), [camp](http://127.0.0.1:4223/camp.html?review=1), [Challenge/Eliab](http://127.0.0.1:4223/challenge.html?review=1), [David's faith response and battle](http://127.0.0.1:4223/duel.html?review=1), [Victory](http://127.0.0.1:4223/victory.html?review=1). Press Begin/Enter to unlock sound. For the complete normal story use [the episode page](http://127.0.0.1:4223/episode.html).

Owner listening/visual acceptance remains open, including the new faith take and the earlier David–Saul takes. The earlier native tab-away/return check and formal planted-foot/input-latency thresholds are still recorded in the [defect register](motion-speech-and-route-defects.json); these are not silently approved by a cast polish pass. No new blocking defect is inferred from those existing open gates.

After reviewing this result, the next planned phase is **MSR-07: Full integration and player review**, including performance/load checks and an unaided first-time session. MSR-08 is the review build and handover. No later phase is started by this report.
