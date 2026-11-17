# M3 · Chapter 3: The Challenge

11 November 2026. Implemented under the owner's explicit instruction to produce Goliath's voiced challenge, soldier reactions and David's exchange with Eliab, then show the result before moving on. [Scoped brief](m3-chapter-03-brief.md) · [Current production plan](../roadmap/project-reset-plan.md). Uses the accepted David–Saul presentation and the existing youthful David. The owner subsequently explicitly authorised [Chapter 4 production](m3-chapter-04.md). This permission to advance does not imply blanket final-art/release acceptance. The frozen Chapter 3 build below keeps its original gate; the newer Chapter 4 candidate adds Continue to Saul after the earned exchange.

[Play Chapter 3 in review mode](http://127.0.0.1:4185/challenge.html?review=1) · [Chapter 2 with the challenge handoff](http://127.0.0.1:4185/camp.html?review=1) · [Normal episode entry](http://127.0.0.1:4185/episode.html) · [Asset/voice rights and sources](../assets/challenge-assets.md)

## Player journey

1. Select **Begin Chapter 3**. An eight-second shot establishes David at the Israelite line, then returns movement.
2. Reach the gold overlook marker. Select **Hear the challenge** once, or press E. Goliath calls for a champion, states the terms and defies Israel. The 30-second sequence cuts between his speaking performance, staggered rank reactions, a foreground soldier's backward step and warning, fear in the line and David standing firm.
3. Control returns after `challenge.heard` is saved. Walk to the second marker and select **Speak with Eliab** once. The 28-second exchange shows David questioning the defiance against the living God's army, Eliab's rebuke, David's answer and a soldier's intention to report his words to Saul.
4. The completed owned exchange saves `eliab.answered` and ends at **A voice of courage**, the Chapter 3 review gate. Replay opens another isolated preview. The gate does not automatically enter Saul's scene.

WASD/arrows or the touch stick move David; dragging changes the view. Pause/Resume holds voices and motion, Sound toggles audio while keeping captions, and Restart cancels the current unearned scene and restores the last confirmed objective.

## Production delivered

| Area | Result |
| --- | --- |
| World and cast | Reuses the Valley of Elah geography, tents, brook, equipment, painted sky, warm lighting, shadows, vegetation, opposing ranks and shield-bearer. Repurposes the two existing foreground adult rigs as Eliab and an alarmed soldier, retaining David's appearance choices. |
| Goliath | Separate GLB with a speaking mouth, lip rounding, jaw/beard movement and an authored eight-second speech gesture. Three distinct voiced lines use timed gestures, medium/close shots and clear captions. The original battle asset remains separate. |
| Soldier reactions | Staggered turning/leaning across the instanced Israelite ranks; foreground backward step and approximately 0.85 m retreat; delayed Eliab flinch; speaking warning and fear; synchronised original foot/equipment sounds. Distant ranks remain cheaper baked figures. |
| David and Eliab | Authored approach, two-shot, speaker close-ups, Eliab's new rebuke gesture, David's speaking/listening reactions and a soldier reporting beat. Shots finish by easing back to the follow camera. |
| Speech and sound | Nine locally generated original lines with four standard voice identities. Waveform-driven mouths, blinking, positional voices, wind, cloth and original movement/equipment effects. One AudioContext clock drives cue timing. |
| Progress and recovery | Separate challenge/exchange commits through the existing async save adapter and owned cue tokens. Review mode seeds only the earned Chapter 2 prefix in memory, leaving the actual save unchanged. Normal mode requires delivery and greeting. Reload after hearing resumes at Eliab. Failed saves preserve the prior checkpoint and offer retry. |
| Integration | `episodePage` routes both Chapter 3 objectives to `challenge.html`. The new candidate's Chapter 2 gate offers **Continue to the challenge**, preserving the normal run. Presentation revision is `m3-challenge-1`; the objective/schema contract remains `m2-outline-1`. |

The original adaptation follows the challenge and reaction context of [1 Samuel 17:8–11 and 23–31](https://www.bible.com/bible/1/1SA.17.KJV). It compresses geography/dialogue without introducing rewards or a new failure rule. The words are game paraphrases, not reference-film audio or a copied modern translation. [Editable script](../../source-assets/audio/chapter-03-lines.json).

Rendered review caught poor mouth readability against Goliath's beard and a rear-facing recoil shot. The separate mouth surface's placement/opening/contrast and the reaction camera were corrected before the verified journey. The final captures show the champion's speaking mouth and the soldier's face/backward step.

## Executed verification

- **TypeScript and production build passed**, including all eight browser entries: `npm.cmd --prefix apps/playcanvas run build -- --outDir ../../build/playcanvas-m3-ch03`. Vite retains its existing large shared-engine chunk warning.
- **Story rules passed:** `npm.cmd --prefix apps/playcanvas run test:story`. New assertions check that both Chapter 3 checkpoints route to the produced scene, then advance toward the existing Saul entry. The original ordered progress, cue ownership, failed/stale saves, defeat/retry and replay checks remain passing.
- **Asset checks passed:** [manifest](../assets/challenge-asset-manifest.json), [test](../../apps/playcanvas/tests/challenge-assets-check.cjs). All nine WAV hashes and source model/voice-bank hashes match provenance. Goliath retains every original battle clip at identical duration and gains speaking controls; the adult variant retains existing dialogue clips and adds alarm/rebuke performances.
- **Desktop journey and recovery passed:** [results](evidence/m3-ch03-2026-11-11/browser-results.json), [test source](../../apps/playcanvas/tests/challenge-browser-check.cjs). Exercises range/duplicate input, visible mouth weights for the four speakers, foreground/rank reactions, voice/mouth/prop-motion pause, muted captions, movement and Eliab collision, both independent cue commits, preview isolation, restart cancellation beyond the former end time, storage failure/retry, challenge-only reload and the Chapter 3 gate. Progress ends at the five-objective prefix, with the run active and no defeat/reward granted. Normal recovery begins from a labelled Chapter 2 checkpoint fixture; it is not claimed as a fresh Chapters 1–3 playthrough.
- **Portrait and landscape touch journeys passed:** [results](evidence/m3-ch03-2026-11-11/touch-results.json), [touch/profiler source](../../apps/playcanvas/tests/challenge-touch-profile.cjs). Chrome emulation at 390 × 844 and 844 × 390 exercises the actual touch stick and actions through both cinematics, pause/reaction freeze and the Chapter 3 gate. Both layouts preserve the existing save, avoid horizontal overflow and retain 48-pixel essential controls.
- **Earned Chapter 2 handoff passed:** [results](evidence/m3-ch03-2026-11-11/handoff-results.json), [test source](../../apps/playcanvas/tests/challenge-handoff-check.cjs). Begins from an explicitly labelled Chapter 1 fixture, earns both delivery and greeting through normal movement and timed exchanges in this build, then continues to Chapter 3 with the same run, revision and objective prefix. This also exercises Chapter 2 with the shared speech defaults.
- **Existing battle regression passed:** [results](evidence/m3-ch03-2026-11-11/battle-regression/results.json), [test source](../../apps/playcanvas/tests/battle-check.cjs). The current build's default battle still passes animated challenge, sling, telegraphed spear, audio pause, fall, retreat, defeat and retry on desktop and emulated touch. This checks the shared-loader changes against the original Goliath asset; it does not claim Chapter 4 production.

Representative rendered captures: [Goliath speaking](evidence/m3-ch03-2026-11-11/02-goliath-speaks.png), [rank reaction](evidence/m3-ch03-2026-11-11/03-ranks-react.png), [foreground recoil](evidence/m3-ch03-2026-11-11/04-soldier-recoil.png), [fear](evidence/m3-ch03-2026-11-11/05-soldier-fear.png), [Goliath's defiance](evidence/m3-ch03-2026-11-11/06-goliath-defiance.png), [David's question](evidence/m3-ch03-2026-11-11/08-david-questions.png), [Eliab](evidence/m3-ch03-2026-11-11/09-eliab-rebukes.png), [report to Saul](evidence/m3-ch03-2026-11-11/11-soldier-reports.png), [review gate](evidence/m3-ch03-2026-11-11/12-chapter-three-complete.png), [portrait](evidence/m3-ch03-2026-11-11/13-portrait-goliath.png), [landscape](evidence/m3-ch03-2026-11-11/13-landscape-goliath.png), [earned handoff](evidence/m3-ch03-2026-11-11/18-earned-camp-handoff.png).

## Measured performance and limits

[Fresh-process profile](evidence/m3-ch03-2026-11-11/profile.json), Chrome 157.0.8103.39, Intel N150 / Intel Graphics laptop, WebGL 2 through ANGLE Direct3D 11:

| Measurement | Observed |
| --- | --- |
| Three fresh Chrome processes/profiles to ready | 5.297, 5.353 and 5.209 seconds; median **5.297 seconds** |
| Earlier first functional launch | **9.467 seconds**; retained in the desktop results |
| Unpaused measured journey | **45.50 seconds**, after excluding 1.5 seconds of warm-up; arrival, actual movement, full voiced challenge/reactions and exploration |
| Average frame rate | **52.55 FPS** |
| p95 / maximum interval | **20.6 / 27.1 ms** |
| Intervals above 50 ms | **0** |
| Loaded encoded resource bodies | **5,906,055 bytes**, about 5.91 MB |
| Estimated gzip bodies | **3,393,807 bytes**, about 3.39 MB; estimated from loaded files, not a hosted transfer measurement |

These later fresh processes do not flush the operating system or graphics driver's caches; they do not erase the earlier 9.467-second result. Loopback loading was not network-throttled. The measured journey clears the proposed 30 FPS floor on this laptop, while the recommended 60 FPS desktop goal remains unmet. Startup and loaded bodies remain above the small-courtyard proposals of 3.5 seconds and 2 MB. No acceptance target is silently revised or marked passed from these figures.

Chrome touch emulation can establish responsive layout and input, not physical-phone GPU/memory, Safari compatibility or thermal performance. Those remain unmeasured. Mouths follow audio envelopes rather than phoneme articulation. Distant formations turn/lean using baked meshes rather than full skeletal crowd reactions; two foreground adults have the detailed performance. The environment and characters retain the accepted stylised candidates. Dramatic voice direction, facial nuance and final realistic-art acceptance remain creative review items.

## Source and handover

- [Page](../../apps/playcanvas/challenge.html), [scene coordinator](../../apps/playcanvas/src/app/challenge-main.ts), [world/cast setup](../../apps/playcanvas/src/world/challenge-world.ts), [camera shots](../../apps/playcanvas/src/world/challenge-shots.ts), [audio/timing](../../apps/playcanvas/src/world/challenge-audio.ts).
- [Editable character authoring](../../source-assets/characters/challenge_performances.py), [voice generator](../../tools/generate-chapter-dialogue.py), [voice provenance](../assets/challenge-voice-provenance.json), [rights/sources](../assets/challenge-assets.md).

The shared Goliath loader, Elah builder and valley builder accept narrow optional scene inputs; their defaults keep the original assets, clips and background behaviour. This chapter's voice-distance setting is opt-in; Chapter 2 keeps the existing default. No broad rewrite or engine change was required.

The local candidate is **M3-CH03-20261111-01**, in `build/playcanvas-m3-ch03`, served on loopback port 4185. A [file/hash manifest](evidence/m3-ch03-2026-11-11/candidate-manifest.json) identifies the reviewable build. Earlier candidates remain separate. This Chapter 3 step performed no deployment, commit, push, authentication setup or Chapter 4 production. The owner's subsequent Chapter 4 instruction and its separate candidate are recorded in the [Preparation handover](m3-chapter-04.md).
