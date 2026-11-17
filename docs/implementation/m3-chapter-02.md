# M3 · Chapter 2: David Arrives

11 November 2026. Implemented after the owner's instruction to proceed from the Chapter 1 browser delivery, under the [Chapter 2 brief](m3-chapter-02-brief.md) and [current plan](../roadmap/project-reset-plan.md). Uses the accepted [David–Saul cinematic](m1-cinematic-sample.md) as the working presentation reference. The owner subsequently explicitly authorised [Chapter 3 production](m3-chapter-03.md). This permission to advance is not blanket final-art/release acceptance. The frozen Chapter 2 build below retains its original gate; the newer Chapter 3 candidate adds Continue to the challenge after the earned greeting.

[Play Chapter 2 in review mode](http://127.0.0.1:4184/camp.html?review=1) · [Chapter 1 with the camp handoff](http://127.0.0.1:4184/valley.html?review=1) · [Normal episode entry](http://127.0.0.1:4184/episode.html) · [Assets and voice rights](../assets/camp-arrival-assets.md)

## Play and review

1. Select **Begin Chapter 2**. David enters the baggage area carrying a basket during an eight-second arrival shot.
2. Move to the gold marker beside the keeper's table. Select **Deliver provisions** once, or press E. The approximately 30-second sequence plays automatically: David explains his errand, the keeper answers, David places the basket on the table and asks for directions.
3. Control returns with David's hands empty. Walk to the next marker and select **Greet your brothers** once. Eliab and David speak during a 26-second exchange, with two other brothers nearby.
4. The scene ends at **An errand completed**, the Chapter 2 review gate. Replay opens another isolated preview. Pause/Resume, Sound and Restart remain available during play.

WASD/arrows or the touch stick move; dragging changes the view. Preview mode seeds only the Chapter 1 prefix in memory and leaves the browser's actual episode save unchanged. Normal play requires an earned Chapter 1 checkpoint. Both delivery and greeting are earned through completed, owned interactions. The arrival alone grants no progress.

## What changed

| Area | Delivered behaviour |
| --- | --- |
| Environment | Focused Israelite baggage camp with six woven shelters, shade, table and linen, grain sacks, clay vessels, spears, provisions, limestone horizon and the opening's painted afternoon atmosphere. Warm light, character shadows and cloth motion support the existing style. |
| Cast | Existing youthful David with saved appearance options; keeper and Eliab adapted from the existing adult conversation rig; six cheaper baked background figures, including two brothers. Two actors share each conversation shot. |
| Carry and delivery | New original `deliver_provisions` action exported through Blender to GLB. A filtered upper-body layer holds the basket while the legs walk. At the authored set-down frame, the basket switches from the hand midpoint to a measured table contact position; David withdraws his hands. |
| Performance | Eight original generated lines with distinct David, keeper and Eliab voices; waveform-driven mouth movement, blinking, speaking gestures and listening reactions. Authored two-shots, close-ups, delivery detail and follow-camera handoffs. |
| Sound | Positional dialogue and distant camp calls; original wind, cloth, steps and basket set-down. One pause-aware audio clock drives acting, shots, captions and prop timing. |
| Progress | Delivery and greeting save separately through the existing async adapter and cue ownership. Reload after delivery restores the basket on the table and targets the brothers. Restart cancels unfinished work and retains only confirmed progress. Failed saves preserve the checkpoint and offer Retry save. |
| Integration | The current build's completed Chapter 1 survey offers **Continue to the camp**, preserving the actual run. `episodePage` routes both Chapter 2 objectives to `camp.html`. The chapter ends at its review gate. |

The new David GLB has **9,893 triangles**, the same mesh budget as the accepted dialogue character, and is **1,262,092 bytes**. Its existing rig, actions and appearance morphs are retained; the source dialogue model is not overwritten. [Verified manifest](../assets/camp-asset-manifest.json).

The original first visual pass exposed patterned striping in the ground/ridges. The procedural grain now uses deterministic noise instead of the interfering sine pattern. The camp also uses the Chapter 1 sky treatment and horizon relief around the conversation views. These are scoped scene corrections, not changes to the earlier frozen builds.

## Executed engineering checks

- **TypeScript and production build passed:** `npm.cmd --prefix apps/playcanvas run build -- --outDir ../../build/playcanvas-m3-ch02`. Seven entry pages are included. The existing large shared-engine chunk warning remains.
- **Story rules passed:** `npm.cmd --prefix apps/playcanvas run test:story`. Added assertions that the earned survey and delivery-only checkpoint route to the produced camp; ordered progression, cancellation, stale/failed saves, battle retry and replay remain covered.
- **Asset checks passed:** [camp-assets-check.cjs](../../apps/playcanvas/tests/camp-assets-check.cjs) checks generated WAV hashes, voice/model source continuity, mouth envelopes, retained character geometry and required clips. [Provenance](../assets/camp-voice-provenance.json) records the actual eight recordings, scripts and standard voice IDs.
- **Desktop journey and recovery passed:** [browser results](evidence/m3-ch02-2026-11-11/browser-results.json), [test source](../../apps/playcanvas/tests/camp-browser-check.cjs). Actual movement, shelter collision, interaction range, duplicate-input exclusion, all three speaking mouths, audio/mouth/prop pause, table/palm contact, muted captions, independent objective commits, preview isolation, cancelled-cue timeout, storage failure/retry and delivery-only reload were exercised. Normal recovery tests use an explicitly labelled typed Chapter 1 checkpoint fixture; they are not claimed as a fresh Chapter 1 playthrough.
- **Touch journeys:** [results](evidence/m3-ch02-2026-11-11/touch-results.json), [test/profile source](../../apps/playcanvas/tests/camp-touch-profile.cjs). Chrome touch emulation at 390 × 844 and 844 × 390 uses the actual stick/buttons through both exchanges, pause/resume and the Chapter 2 gate. It checks preserved saved data, no horizontal overflow and 48-pixel essential controls. The corrected capture timing waits for the new cue mode rather than reading the previous arrival's elapsed time.
- **Earned cross-chapter handoff:** [results](evidence/m3-ch02-2026-11-11/handoff-results.json), [test source](../../apps/playcanvas/tests/camp-handoff-check.cjs). Starts from normal episode entry, plays Chapter 1, earns the survey with movement/interaction and enters the camp with the same run, revision and objective prefix. This check does not seed progress.

The rendered release capture verifies hands at the basket, with the basket base resting on the table. The browser contact assertion uses a 1 mm table tolerance and 25 mm palm-to-prop tolerance. This is prop alignment evidence, not a claim of finger-level grasp animation.

Representative captures: [David and provisions](evidence/m3-ch02-2026-11-11/02-david-delivers.png), [keeper](evidence/m3-ch02-2026-11-11/03-keeper-response.png), [set-down contact](evidence/m3-ch02-2026-11-11/04-basket-contact.png), [Eliab](evidence/m3-ch02-2026-11-11/05-eliab-greeting.png), [David's reply](evidence/m3-ch02-2026-11-11/06-david-with-brothers.png), [review gate](evidence/m3-ch02-2026-11-11/07-chapter-two-complete.png), [portrait](evidence/m3-ch02-2026-11-11/08-portrait-delivery.png), [landscape](evidence/m3-ch02-2026-11-11/08-landscape-delivery.png). Desktop conversation captures preceded the final grain/sky correction; final contact and touch captures show that correction. Contact is frozen with only the pause overlay temporarily hidden for inspection, not a running-motion claim.

## Measured performance and limits

[Fresh-process profile](evidence/m3-ch02-2026-11-11/profile.json), Chrome 157.0.8103.39 on the existing Intel N150 / Intel Graphics laptop, WebGL 2 through ANGLE Direct3D 11:

| Measurement | Observed |
| --- | --- |
| Three fresh Chrome processes to ready screen | 5.004, 4.909 and 4.577 seconds; median **4.909 seconds** |
| Continuous unpaused sample | **45 seconds** of exploration after the delivery |
| Steady average | **32.00 FPS** |
| Steady p95 / maximum frame interval | **36.5 / 43.8 ms** |
| Steady intervals above 50 ms | **0** |
| Loaded encoded resource bodies | **4,609,504 bytes** (about 4.61 MB) |
| Estimated gzip bodies | **2,739,715 bytes** (about 2.74 MB), computed from loaded files; not a hosted transfer measurement |

The profile also retains raw intervals during an arrival/approach/voiced-delivery journey, including a deliberate pause for the contact capture. Its uninterrupted 45-second sample is reported separately so that pause is not mislabelled as a frame stall. The scene clears a proposed 30 FPS floor on this laptop; the recommended 60 FPS desktop goal is not met here. Cold start exceeds the earlier small-courtyard 3.5-second proposal, and the loaded scene exceeds its 2 MB proposal. No network throttling or hosted connection was measured.

Portrait/landscape emulation establishes layout and touch behaviour, not physical Android/iPhone GPU, memory, Safari or thermal performance. Those remain unmeasured. Mouths use audio envelopes rather than phonemes. Background figures use a baked pose with stance sway. The cast still uses the accepted stylised character candidates, not bespoke realistic final models. Finger gripping, facial nuance, cloth simulation, new music and fully animated camp routines are outside this scoped chapter pass and remain quality decisions.

## Source and handover

- [Camp page](../../apps/playcanvas/camp.html), [browser coordinator](../../apps/playcanvas/src/app/camp-main.ts), [environment](../../apps/playcanvas/src/world/camp-arrival.ts), [shots](../../apps/playcanvas/src/world/camp-shots.ts).
- [Carry layer](../../apps/playcanvas/src/world/provisions-carry.ts), [editable Blender performance](../../source-assets/characters/camp_delivery.py), [speech clock](../../apps/playcanvas/src/world/scene-speech.ts), [chapter audio/timing](../../apps/playcanvas/src/world/camp-audio.ts).
- [Editable dialogue](../../source-assets/audio/chapter-02-lines.json), [generation tool](../../tools/generate-chapter-dialogue.py), [rights and sources](../assets/camp-arrival-assets.md).

The local candidate is `build/playcanvas-m3-ch02`, served on loopback port 4184. Earlier M1/M2/Chapter 1 candidates remain separate. This Chapter 2 step performed no deployment, commit, push, Clerk configuration or Chapter 3 production. The subsequent explicit instruction authorises [the separate Chapter 3 candidate](m3-chapter-03.md), with its own review gate.
