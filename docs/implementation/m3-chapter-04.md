# M3 · Chapter 4: Preparation

Subsequent update: [12 November controls polish](m3-controls-polish.md) makes practice readily available after five stones, allows movement while throwing and introduces direct mouse aim/click/F with simultaneous touch input. Use its port 4188 links for the current review; the earlier frozen evidence below retains its original controls.

11 November 2026. Implemented under the owner's explicit request for the audience with Saul, trying/declining the armour, gathering five stones and sling practice, followed by browser review. [Scoped implementation brief](m3-chapter-04-brief.md) · [Current plan](../roadmap/project-reset-plan.md). On 12 November the owner explicitly authorised [Chapter 5](m3-chapter-05.md). Its newer candidate adds Face Goliath to Preparation; this frozen Chapter 4 build retains its original gate. Permission to advance does not imply blanket final-art/release acceptance.

[Play Preparation in review mode](http://127.0.0.1:4186/preparation.html?review=1) · [Chapter 3 with the Saul handoff](http://127.0.0.1:4186/challenge.html?review=1) · [Normal episode entry](http://127.0.0.1:4186/episode.html) · [Assets, voices and rights](../assets/preparation-assets.md)

## Play and review

1. Select **Begin Chapter 4**, approach Saul and choose **Speak to Saul** once. The accepted 40-second voiced audience plays automatically, with speaker/listener acting, guard reaction, mouths, captions and authored shots.
2. Walk to the equipment and choose **Try the armour**. An 18-second sequence shows the loaned coat and helmet moving from the stand onto David, fitting gestures, stiff trial steps and David's response. The equipment stays visibly worn after this checkpoint.
3. Choose **Set aside the armour** separately. David refuses the unfamiliar equipment; a 16-second removal sequence returns it to the stand, followed by a seven-second transition at the brook.
4. Follow the gold marker and collect **five individual smooth stones**. Each action plays one crouch/reach/put-away performance. The count advances once per distinct stone. Collection saves after all five; Restart/reload repeats an unfinished collection from that checkpoint.
5. Approach the woven target and choose **Practise with the sling**. Drag to aim or use I/J/K/L; press Space or use **Throw**. A miss permits another throw. A hit plays the closing response and saves actual sling readiness.
6. The scene ends at **Ready to face the champion**, the Chapter 4 review gate. It does not automatically enter the duel. Replay opens an isolated preview.

WASD/arrows or the touch stick move David; dragging looks during exploration and aims during practice. Pause/Resume holds the common clock, animation and projectile. Sound toggles voices, ambience and water while preserving captions and play time. Restart returns to the confirmed objective and cancels unfinished actions.

## Delivered scene and architecture

| Area | Result |
| --- | --- |
| Saul audience | Retains the accepted three recordings, line onsets, 40-second treatment, youthful David and Saul presentation. One foreground guard has a rigged reaction; a cheaper background guard shares the existing soldier bake. |
| Armour | Original bronze/leather coat, helmet and costume sheath; fitted and loose versions; authored fitting/removal gestures and stiff trial walk. Evaluated prop baking and measured bone-space offsets align loose equipment with its worn form. The sheath adds no combat mechanic. |
| Brook | Separate original bank, shallow water, limestone, olive trees, scrub, sky, pickup objects and woven target, with water/wind and movement sounds. The area owns its geometry and lights. A combat scene is not loaded for preparation. |
| Pickups | Five distinct objects, range-gated interaction, baked grounded reach, measured hand contact, held pebble, count and aggregate checkpoint. A repeated or held action cannot collect a second object inside the same cue. |
| Sling practice | Existing authored upper-body sling action, visible cord/pouch, release-point projectile and flight, aim feedback, target reaction, miss/retry and a confirmed hit. Practice does not deplete the five story stones, grant rewards or introduce defeat. |
| Speech and UI | Eight additional original generated lines plus the three accepted audience clips; waveform-driven mouths, captions, contextual prompts, keyboard/touch controls and responsive portrait/landscape framing. |
| Persistence | Existing ordered objectives and async cue ownership. Audience, fitting, refusal, all five stones and practice each commit separately. Reload restores worn equipment or the brook/inventory state. Failed writes preserve the prior checkpoint and offer retry. |
| Integration | All five existing Chapter 4 objectives route to `preparation.html`. The new candidate's Chapter 3 gate offers **Continue to Saul** with the actual earned run. `m2-outline-1` remains the save/content contract; presentation is `m3-preparation-1`. |

Review mode seeds only the five-objective prefix from Chapters 1–3 in an isolated memory adapter. It does not modify the browser's normal episode save. Normal mode requires that prefix. Local preview ports have separate browser storage; the verified normal handoff stays on this candidate's origin.

The story context is [1 Samuel 17:32–40](https://www.bible.com/bible/1/1SA.17.KJV), adapted in original dialogue. Target practice is explicitly a game adaptation. The new character variant is **11,385 triangles / 1,453,472 bytes**, including optional equipment; the loose kit is **1,492 triangles / 48,156 bytes**. Existing character assets and appearance choices are retained. [Source/rights record and manifest](../assets/preparation-assets.md).

## Corrections from actual browser inspection

The first rendered pass exposed downward-facing water, separated loose helmet pieces and a held stone intersecting the wrist. The water winding, evaluated prop bake/shared origin, bone-space attachment offsets and pebble size/palm placement were corrected. Pickup framing now shows the reach from the front side.

Repeated pickup/pause checks also caught the fifth crouch blending away from its intended contact pose. The scripted reach now samples its authored pose directly from the audio clock instead of blending that action through the movement controller. The focused replay and subsequent full journeys verify all five contacts. This was an actual animation correction, not acceptance of a file's existence as proof of contact.

## Executed checks and evidence

- **TypeScript and production build passed:** `npm.cmd --prefix apps/playcanvas run build -- --outDir ../../build/playcanvas-m3-ch04`. Nine browser entries are emitted. Vite retains the existing large shared-engine chunk warning.
- **Story rules passed:** `npm.cmd --prefix apps/playcanvas run test:story`. Added assertions cover every Preparation resume point and the battle route only after actual sling readiness. Ordered progress, cue cancellation, stale/failed writes, defeat/retry and replay remain covered.
- **Asset checks passed:** [manifest](../assets/preparation-asset-manifest.json), [test](../../apps/playcanvas/tests/preparation-assets-check.cjs). Checks voice/model hash continuity, original animation durations, new clips, retained facial/appearance shapes, coherent unskinned equipment, measured attachment offsets and planted ankles at contact.
- **Final full desktop and recovery run passed:** [results](evidence/m3-ch04-2026-11-11/browser-results.json), [test](../../apps/playcanvas/tests/preparation-browser-check.cjs). Exercises the voiced audience, fitting and worn trial, separate refusal, actual five pickups, contact measurements, pause, miss/retry/hit, review isolation and all four resulting preparation flags. It also tests cancelled removal beyond the former finish time, worn-armour reload, storage failure/retry, brook reload, partial collection reset and complete five-stone reload. Recovery starts from explicitly labelled typed checkpoints, not a claimed fresh Chapters 1–4 run.
- **Focused repeated contact replay passed:** [results](evidence/m3-ch04-2026-11-11/contact-results.json), [test](../../apps/playcanvas/tests/preparation-contact-check.cjs). All five pickups, each paused/resumed, put the wrist within 25 mm horizontally of its original stone and the palm within 50 mm vertically. Captures use the actual pickup event so a later hand-withdrawal pose is not mistaken for contact.
- **Complete portrait and landscape touch journeys passed:** [results](evidence/m3-ch04-2026-11-11/touch-results.json), [test/profile source](../../apps/playcanvas/tests/preparation-touch-profile.cjs). Chrome at 390 × 844 and 844 × 390 uses the actual touch stick and buttons through the audience, fitting/removal, transition, five pickups, drag aiming, a miss, retry and hit. Both layouts retain 48-pixel essential controls, no horizontal overflow, no defeat and unchanged normal saves in review mode.
- **Actual outgoing audio mute passed:** [results](evidence/m3-ch04-2026-11-11/audio-results.json), [test](../../apps/playcanvas/tests/preparation-audio-check.cjs). Waveform meters fork the outgoing master and water branches. Both become silent when muted; captions remain, the scene clock continues and audio returns when unmuted. No microphone or external recording is used.
- **Earned Chapter 3 handoff passed:** [results](evidence/m3-ch04-2026-11-11/handoff-results.json), [test](../../apps/playcanvas/tests/preparation-handoff-check.cjs). Starts from a labelled Chapter 2 prefix, earns the challenge and Eliab exchange by actual play, then enters the pavilion with the same run/revision and no audience/equipment credit granted early.

The final review run ends at the ten-objective prefix with `armourDeclined=true`, `stonesGathered=5`, `slingReady=true`, an active run and zero defeats. The underlying save still has one aggregate five-stone objective; partial pickup counts are intentionally in-session, not advertised as per-stone durable saves.

Representative renders: [Saul](evidence/m3-ch04-2026-11-11/01-saul-audience.png), [David](evidence/m3-ch04-2026-11-11/02-david-resolve.png), [worn armour](evidence/m3-ch04-2026-11-11/05-unfamiliar-armour.png), [trial walk](evidence/m3-ch04-2026-11-11/04-armoured-trial.png), [removal](evidence/m3-ch04-2026-11-11/07-armour-removed.png), [brook](evidence/m3-ch04-2026-11-11/08-brook-arrival.png), [contact](evidence/m3-ch04-2026-11-11/09-stone-contact.png), [aiming](evidence/m3-ch04-2026-11-11/12-practice-aim.png), [sling action](evidence/m3-ch04-2026-11-11/13-sling-release.png), [completion](evidence/m3-ch04-2026-11-11/14-preparation-complete.png), [portrait](evidence/m3-ch04-2026-11-11/16-portrait-armour.png), [landscape](evidence/m3-ch04-2026-11-11/20-landscape-sling-aim.png). The contact capture freezes the scene with only its pause overlay hidden for inspection; it is not a recording of continuous motion.

## Measured performance and boundaries

[Exclusive fresh-process profile](evidence/m3-ch04-2026-11-11/profile.json), Chrome 157.0.8103.39 on the existing Intel N150 / Intel Graphics laptop, WebGL 2 through ANGLE Direct3D 11. No other automated test browser ran during these measurements. Each sample excludes 1.5 seconds of warm-up and has no deliberate pause.

| Measurement | Observed |
| --- | --- |
| Three fresh Chrome processes to ready | 4.982, 3.987 and 4.191 s; median **4.191 s** |
| Pavilion: approach, audience, fitting, worn trial and exploration | **64.49 s**, **46.36 FPS**, p95 **33.3 ms**, maximum **117.3 ms** |
| Pavilion gaps above 50 ms | **1**, about 20.2 s into the capture; cause not conclusively isolated |
| Brook: arrival, five pickups and active aiming | **53.49 s**, **52.21 FPS**, p95 **21.5 ms**, maximum **31.8 ms** |
| Brook gaps above 50 ms | **0** |
| Loaded encoded resource bodies | **5,236,360 bytes**, about 5.24 MB |
| Estimated gzip bodies from loaded files | **3,152,762 bytes**, about 3.15 MB; not a measured hosted transfer |

The final desktop functional run took 9.947 s to ready while another test browser was running; an earlier isolated functional run took 3.886 s. These observations are retained rather than presenting the median as a guarantee. Fresh processes do not flush OS or driver caches. Loopback loading was not network-throttled.

The measured samples clear a proposed 30 FPS average floor on this laptop, but the recommended 60 FPS desktop goal, earlier 3.5-second startup proposal and 2 MB small-courtyard download proposal remain unmet. The pavilion hitch remains a performance follow-up; do not label the scene uniformly hitch-free. Physical-phone GPU/memory, Safari, heat, a hosted mobile connection and unaided player feedback remain unmeasured.

Fitting/removal are stylised authored equipment handoffs, not cloth simulation. Fingers and extreme tunic/knee deformation retain limitations of the existing rigged character. Mouths follow audio envelopes rather than phonemes. The brook and costume are original stylised production candidates, not a claim of final photorealistic or archaeological reconstruction. Their creative quality is for the owner's review.

## Source and handover

- [Page](../../apps/playcanvas/preparation.html), [coordinator](../../apps/playcanvas/src/app/preparation-main.ts), [areas/equipment](../../apps/playcanvas/src/world/preparation-world.ts), [shots](../../apps/playcanvas/src/world/preparation-shots.ts), [audio](../../apps/playcanvas/src/world/preparation-audio.ts), [responsive practice UI](../../apps/playcanvas/src/app/preparation.css).
- [Blender authoring](../../source-assets/characters/preparation_assets.py), [additional dialogue](../../source-assets/audio/chapter-04-lines.json), [voice provenance](../assets/preparation-voice-provenance.json), [asset/rights notes](../assets/preparation-assets.md).

Candidate **M3-CH04-20261111-01** is in `build/playcanvas-m3-ch04`, served on loopback port 4186. [File/hash manifest](evidence/m3-ch04-2026-11-11/candidate-manifest.json). Earlier candidates and the standalone Saul sample remain available separately. No deployment, commit, push, authentication work or Chapter 5 production was performed. Review Preparation before advancing to **M3 Chapter 5 — David and Goliath**.
