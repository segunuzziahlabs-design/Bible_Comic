# MSR-03: David–Saul speech and reactions pilot

20 November 2026. Follows the [execution plan](../implementation/msr03-speech-execution-plan.md) and [overall MSR plan](../implementation/motion-speech-and-guided-routes-plan.md). Owner clarification: **“No, just improve the intonation.”** This is the canonical Chapter 4 pilot, not a claim that every character's voice has been revised.

**Implementation, core browser checks and a fresh six-chapter regression are ready for review. Intonation acceptance and native tab-away/resume remain pending.** No deployment, commit or push.

## Play and listen

[Play the revised David before Saul](http://127.0.0.1:4218/preparation.html?review=1&cinematic=1). Select **Play David before Saul** to enable sound. Speak plays the complete exchange once during normal Chapter 4. This review entry uses temporary progress and preserves the normal saved episode.

[Previous MSR-02 performance](http://127.0.0.1:4217/preparation.html?review=1&cinematic=1) remains available for comparison. Original WAVs and the historical `saul.html` showcase are retained. Exact generation settings and licensing sources: [voice production record](../assets/msr03-saul-performance.md), [provenance/hashes](../assets/msr03-saul-voice-provenance.json).

## Findings and changes

| Baseline evidence | Resulting change |
| --- | --- |
| All 67 existing recordings matched their WAV duration metadata exactly; no invalid mouth-cue data or sustained near-silent mouth openings were detected by the technical audit. | Preserve the working envelope sampler. No invented pronunciation fault, wholesale rerecording or phoneme-alignment claim. |
| Owner requested better intonation without identifying a particular faulty line. | Three new sentence-directed takes, with the same words and standard synthetic cast: measured Saul concern, David's quiet conviction, and a considered blessing. The descriptions are intended direction; owner listening decides whether the delivery is better. |
| Actual browser trace: David's voice emitter remained about **2.15 m** behind his settled speaking position. | Opt-in cinematic dialogue bus for this audience. Camera edits and David's approach no longer change the voice's distance attenuation. Environmental sounds retain their spatial route, and all buses follow the existing mute/pause owner. Other chapters retain their default mix. |
| David's speech had **29 sampled backward gesture steps**; the guard's acknowledgement reset/repeated once. | Forward-only speech timing, one complete guard reaction, recording-derived listener beats and one David acknowledgement after the blessing. |
| Existing close-ups exposed large jaw openings at waveform peaks. | Pilot-only restrained jaw/rounding with a short attack/release filter on the audio clock. No new facial rig or character model. |
| The former 40-second audience had fixed camera/reaction times independent of future voice revisions. | One recording-derived score owns voice starts, reactions, camera cuts and completion. The current audience is **30 seconds**, within the original 30–45-second sample window. |

The new takes retain `am_puck` for David and `am_michael` for Saul. Actual durations: **3.504 / 6.067 / 2.691 seconds**. Voice starts are approximately **8.000 / 12.304 / 22.171 seconds**. Complete sentence takes use directed punctuation/pace, explicit thought pauses and short edge fades. No pitch shifting or paid voice service was introduced. New mouth cues come from the final quantised PCM, including silence.

The local generator does not implement full acting-direction controls. We changed real synthesis inputs and cadence, but do not claim independently verified emotional naturalness. Audio input is unavailable to the reviewing agent; the owner must listen to approve intonation, pronunciation and overall delivery.

Saul's brow/response develops from concern to acceptance; David listens and acknowledges the final blessing; the guard reacts once after David's answer. Movements use the existing authored clips and restored additive head/chest offsets. The 25 ms attack / 30 ms release mouth filter is limited to the audience; its paused clock and reset prevent the face running ahead or retaining the previous performance.

## Verification and evidence

| Check | Result / evidence |
| --- | --- |
| Three voice files, exact durations/hashes, unchanged words/cast, finite ordered mouth cues, silent sentence gaps | PASS — `saul-performance-check.cjs` |
| Face freeze/reset, finite weights and closure within 150 ms at 20/30/60/120 Hz | PASS — `saul-performance-check.cjs` |
| Additive restoration / existing story rules / build and TypeScript | PASS |
| Desktop 1280 × 720: one full restarted audience, pause/resume, mute, correct speaker/captions, completed lines, return of movement | Core pass; [results](evidence/msr03-2026-11-20/core-desktop/results.json) |
| Portrait 390 × 844 and landscape 844 × 390 with actual CDP touch | PASS — [portrait](evidence/msr03-2026-11-20/final/portrait/results.json), [landscape](evidence/msr03-2026-11-20/final/landscape/results.json) |
| Captured Web Audio output, actual decoded-source routing, rendered mouth/rig traces | [Technical summary and method](evidence/msr03-2026-11-20/final/speech-summary.json); [desktop browser audio](evidence/msr03-2026-11-20/core-desktop/browser-output-0.webm) |
| Fresh normal Chapters 1–6, saved checkpoints, defeat/retry, Victory/replay | PASS — [full results](evidence/msr03-2026-11-20/full-episode/desktop/results.json), [recorded complete episode](evidence/msr03-2026-11-20/full-episode/desktop/complete-episode.webm) |
| Native tab-away/resume | **Unverified**; see limitation below |
| Subjective intonation / emotional delivery | **Owner listening review required** |

The focused traces found a best mouth-envelope lag of approximately **10–20 ms**, within the proposed 100 ms technical target. This is a fit against the final PCM-derived amplitude envelope; it does not establish phoneme timing, speaker latency or perceived lip sync. Authored sentence gaps closed the mouth within the tested 150 ms window. Only the active speaker's mouth opened. Muting silenced the measured output bus, not just its UI flag. Restart cancelled the first three scheduled voices; exactly one subsequent set of three completed. David's speech had no backward steps, and the guard gesture did not repeat.

The tested dialogue sources have no PannerNode and retain the same base gain across cuts; their amplitude still varies naturally with the recording. This verifies routing stability, not constant loudness or a subjective listening judgement. Existing spatial footsteps/equipment and the later brook mix are retained. No render asset, schema, authentication setting or combat calculation changed.

The fresh normal run earned all twelve ordered objectives through actual input at normal clocks. It covered the automatic opening/arrival, separate Speak/Take, provision delivery and brothers, Goliath/Eliab, the revised audience, armour save/reload, automatic stones, practice misses/hit, battle defeat/retry and actual evasion, genuine sling hit/miss, final sword interactions, Victory, completed-save reload and replay. No console errors or failed requests were captured. This is local account/save QA, not a new live Clerk/Supabase sign-in test or physical-phone test. Capture instrumentation is not a clean performance benchmark.

Baseline audit artifacts: [recording inventory](evidence/msr03-2026-11-20/baseline/recording-inventory.json), [silence audit](evidence/msr03-2026-11-20/baseline/silence-audit.json), [browser trace](evidence/msr03-2026-11-20/baseline/audit.json). [Export manifest](evidence/msr03-2026-11-20/build-manifest.json) records the local build. The updated public licence notice was copied into the export after the full run started; game JS/models/audio stayed unchanged throughout verification.

### Native lifecycle limitation

The optional native probe did not establish trusted visibility/focus events and suspended audio. Inspection of the installed Playwright runtime confirmed that it normally forces pages to appear focused/visible; attempting to disable that override did not establish a native pass. Those unsuccessful probes are retained in [native-tab-attempt](evidence/msr03-2026-11-20/native-tab-attempt/status.json), separately from the passing core assertions. They are not reported as successful native tab tests.

A regular Chrome check was then attempted with the [Computer Use skill](C:/Users/Segun/.codex/plugins/cache/openai-bundled/computer-use/26.1111.21308/skills/computer-use/SKILL.md). Automatic approval review stopped the **new-tab action** because it could not determine the current browser URL confidently enough to enforce policy. The skill requires “stop issuing app input” when Computer Use ends; no native UI automation continued. Manual tab-away/return during David's reply remains necessary to close this gate.

## Remaining scope and next step

Owner listening/visual acceptance and the native lifecycle gate remain open. MSR-02's formal planted-foot/input-latency target remains open as recorded; this speech pass does not close it. Duel speech-tail work (MSR-D04), other cast performances, inaccurate footer hints outside this pilot (MSR-D05), and guided walking connections (MSR-D03) retain their later assignments. No wider voice rollout is assumed approved by this pilot.

After this sample's listening review, MSR-04 is the planned **Eliab → guided walk → Saul audience** connection. The six-chapter story, twelve objective IDs, saved-progress format, appearance options and existing armour/stone/practice/combat actions are preserved.
