# MSR-07: integrated validation and release decision

20 November 2026 · Engineering verification complete; human acceptance pending. This report follows the [completion execution plan](../implementation/msr07-08-completion-execution-plan.md) and feeds the [MSR-08 handover](../implementation/motion-speech-and-guided-routes.md).

## Candidate and method

Final local PlayCanvas production candidate: `build/msr-final-local` at port 4225. Account-integrated production export: `build/msr-final-cloud` at port 4224. MSR-06 at port 4223 and MSR-05 at 4221 are retained comparison builds. Chrome 157.0.8103.79, WebGL 2, Intel N150, Intel graphics through ANGLE/D3D11, approximately 15.78 GiB system RAM. Viewports: 1280×720 desktop, 1366×768 laptop combat, 390×844 portrait and 844×390 landscape. Touch uses actual CDP touch events on this laptop; physical-phone performance is not claimed.

GPU/browser suites run sequentially. Clean timing probes avoid recording, screenshots and per-frame skeletal inspection. Cold trials use fresh Chrome profiles/processes; warm trials reload the same page with the preview server's actual cache headers. OS/driver caches are not flushed. Loopback byte/time measurements are not hosted mobile-network promises. The six-chapter functional runs use normal clocks and real input; explicitly seeded checkpoint/review fixtures are reserved for recovery/combat stress cases and labelled as such.

| Check | Result / evidence |
| --- | --- |
| Fresh desktop Chapters 1–6, actual Clerk UI and hosted Supabase | PASS — all twelve ordered objectives, checkpoint reloads, actual battle misses/hit, one defeat/two attempts, final sword actions, completion and replay. New dedicated QA identity; owner account untouched. [Hosted run](evidence/msr07-2026-11-20/hosted-episode/desktop/results.json) |
| Fresh portrait 390×844 and landscape 844×390 with actual emulated touch | PASS — both complete normal journeys, all twelve objectives and reload/retry/replay. [Portrait](evidence/msr07-2026-11-20/full-episode/portrait/results.json) · [Landscape](evidence/msr07-2026-11-20/full-episode/landscape/results.json) |
| Fresh Edge sign-in and existing hosted checkpoint | PASS — 157.0.4341.60, correct canonical page, no copied Chrome cookies and no checkpoint modification. [Result](evidence/msr07-2026-11-20/edge-resume/results.json) |
| Laptop 1366×768 continuous combat / aftermath stress | PASS — simultaneous movement/aim/throw, continuing spear danger, defeat/retry, staged turn/fall, fallen/sword checkpoint reloads and deliberate final action. Prepared fixture explicitly labelled. [Result](evidence/msr07-2026-11-20/combat-laptop/results.json) |
| All five connected routes: interruption, failure/retry/fallback, stale hints, reload and save conflict | PASS — 21 deliberate recovery cases; expected HTTP faults separated from unexpected runtime errors. [Four-route cases](evidence/msr07-2026-11-20/recovery-r03-r05-r09-r11/) · [R07 cases](evidence/msr07-2026-11-20/recovery-r07/) |
| Victory blocked/rejected audio and retry | PASS — all six layout/fault cases, one successful start after retry, late completion ignored, normal save unchanged. |
| Motion, voice provenance/cues, input, jump/spear/combat rules and SQL persistence | PASS — 15 executed checks including local PostgreSQL owner isolation, stale/idempotent commands and ordered aftermath saves. [Check log](evidence/msr07-2026-11-20/checks/unit-checks.json) |
| TypeScript, local/cloud Vite exports and frozen hashes | PASS — both final exports built; hashes rechecked after browser runs. Same 18 GLB hashes. [Committed manifest](../implementation/msr-review-build-manifest.json) |

Passing full journeys captured no unexpected console/page/HTTP errors. No normal journey used a seeded checkpoint, review shortcut, accelerated clock or manual state repair. Existing MSR-03/06 speech/rig comparisons remain evidence for unchanged performances; final full journeys and the targeted Victory checks cover the integration repair. [Complete matrix](evidence/msr07-2026-11-20/final-validation-matrix.json).

## Integration repair: Victory audio startup

The normal-clock standalone profiles had two startup timeouts. Their underlying platform cause was not established, so no audio-driver diagnosis is claimed. Code inspection then identified a concrete recovery omission: Victory awaited `AudioContext.resume()` without a deadline or recovery handler. A separate controlled browser test held that platform Promise and reproduced Begin remaining disabled after 9.2 seconds, with no way to retry.

Victory now uses the same eight-second bounded startup helper as the other chapters. Failed/rejected startup cancels the pending cue/audio, preserves all confirmed progress and returns a visible **Try again** action. A start guard disables competing starts, and the old playing clock is paused while restart awaits audio. Late completion of an expired request cannot start a second scene.

All six hold/rejection cases passed on desktop and both touch orientations. Removing the platform fault and pressing Try again started one real, running audio clock and one conclusion; normal episode storage stayed unchanged. These are labelled fault-injection tests, not claims about the frequency/cause of real device failures. [Baseline lock](evidence/msr07-2026-11-20/victory-audio-baseline/baseline.json) · [Six recovery cases](evidence/msr07-2026-11-20/victory-audio-recovery/).

## Loading, frame pacing and motion thresholds

- Clean 45-second Challenge/walk/Eliab samples: **31.98 / 32.00 / 32.00 FPS** for desktop/portrait/landscape, with p95 **35.2 / 35.3 / 35.4 ms**. No sampled gap above 250 ms. The comparison MSR-05 desktop sample was about 32 FPS. These samples precede only the final Victory startup guard; Challenge/render/model code is unchanged.
- Final unrecorded Victory: **31.99 FPS**, p95 **35.3 ms**, worst **41.8 ms**. [Final Victory profile](evidence/msr07-2026-11-20/victory-performance-final/desktop.json).
- The first three-trial loading sample suggested a >10% opening regression. Three alternating before/after pairs did **not reproduce it**: median cold entry **9512 ms before / 9507 ms after** (-0.05%). Individual trials vary considerably, including a 22-second before-build outlier. Do not turn that comparison into a universal startup guarantee. [Paired trials](evidence/msr07-2026-11-20/loading-paired/).
- Reference per-page trials measured the small episode shell at roughly 0.42 s cold; other chapter entries around 3.6–5.7 s, with the opening heavier. Those initial trials used the MSR-06 export; final paired opening and normal final-build entries verify the integration candidate. Local preview transfers roughly 10.75 MB of opening resources before first entry; cache reloads transfer far fewer bytes. Compression/CDN/mobile-network timings require hosted measurements. [Reference loading](evidence/msr07-2026-11-20/loading/loading-profile.json).
- Trusted input to actual rendered-root response: **4.4–29.9 ms** across eighteen final-build keyboard/touch trials, inside the proposed local 150 ms target. Start/stop/reversal, carrying, pivot and jump traces are retained. [Rendered-root probes](evidence/msr07-2026-11-20/motion-rendered/).
- Recorded Elah/brook frame boundaries were **25.9–45.0 ms** across the three fresh journeys, inside the proposed 250 ms target. These are same-page adjacent-frame intervals; separate page loading is verified by cover/recovery tests, not treated as one continuous frame. Captures add overhead. [Boundary values](evidence/msr07-2026-11-20/final-validation-matrix.json).

An initial standalone touch probe and Victory probe timed out and are not counted as passes; the platform cause was not established. The passing probes use the established user-gesture autoplay policy and actual native audio clocks. The separate injected audio test established and verified the recovery fix described above. No device, shader or network cause is invented from these timeouts.

The proposed 30 FPS floor and 10% regression trigger are engineering targets from the plan. The 8 cm planted-foot and 150 ms input targets were proposed, not owner-approved universal hardware guarantees. Input diagnostics measure trusted browser event to observed root movement; they do not measure physical input-to-photon latency. Bone-height contact windows remain a diagnostic unless actual sole contact is established.

## Human acceptance and remaining issues

**Engineering recommendation: ready for owner/player review and the requested GitHub handover. Unconditional release approval remains pending.** No confirmed outstanding P0/P1 implementation blocker remains from the executed matrix; the Chapter 6 liveness defect was repaired. The following acceptance items are open:

| Item | Status |
| --- | --- |
| MSR-A01 · No first-time player is available today; unaided understanding/completion/engagement was not observed. | Pending participant |
| MSR-A02 · Owner has not reviewed the latest motion/speech; subjective intonation and presentation approval remains open. | Pending owner |
| MSR-A03 · Regular-Chrome native tab-away/return needs the prepared manual check; the earlier stopped Windows automation was not bypassed. | Pending manual check |
| MSR-A04 · Actual planted-sole drift within 8 cm across start/stop, pivots and terrain is not established by ankle/ball proxies. Local browser input response is measured separately. | Not certified |
| MSR-A05 · Opening cold preparation remains variable and relatively long; no hosted-network startup budget or minimum-phone performance has been approved. | Measured / budget decision |

The bone traces do not establish a planted-sole/contact solver. MSR-02's earlier 9.1 cm ankle-proxy window remains a diagnostic, not a certified pass against 8 cm. No foot IK or new pivot assets were silently introduced. The measured browser response closes the local event-to-root question while leaving physical device/input latency distinct.

On 20 November, the owner confirmed that **no first-time participant is available today** and **the latest motion/speech previews have not been reviewed**. The [unaided-player task sheet and observation form](msr07-player-review.md) are prepared. No satisfaction, completion rate, speech-naturalness approval or first-time understanding is inferred from automated play.

The earlier native regular-Chrome lifecycle check remains manual. Windows UI automation previously stopped because the current URL could not be established; this pass does not retry or bypass that stopped action. Synthetic visibility events/headless focus are not counted as native behaviour. Known rig limits, economical crowd poses and page-boundary ambient continuity are documented in the handover.

## Reproduction and evidence

QA drivers were run with Node 24.14.1 and use native TypeScript imports. Use the existing Playwright module path as the first argument to browser scripts in `apps/playcanvas/tests`. Sources: `ctrl07-episode-playthrough.cjs`, `msr04-recovery-browser.cjs`, `msr05-recovery-browser.cjs`, `continuous-battle-browser.cjs` and the `msr07-*` load, sustained, Victory, motion, audio-recovery, live sign-in and Edge test drivers. Run browser suites sequentially.

`node tests/run-msr-checks.cjs <output-directory>` runs the fifteen local contract/asset/SQL checks. Full journeys accept `desktop`, `portrait`, `landscape` and optional `--record`. Hosted journeys additionally require the private dedicated development configuration, a real QA sign-in state, `BIBLE_TEST_STORAGE_STATE` and `--live-cloud`.

On this Windows machine, Node backend requests failed certificate-chain verification. `node --use-system-ca` resolved the Clerk test-runner request using the existing system trust store, with HTTPS validation enabled. Use that flag for live-service QA here. No game/provider TLS setting or production authentication setting changed. [Runner diagnostic](evidence/msr07-2026-11-20/live-account/runner-tls-diagnostic.json).

Both complete build inventories were frozen and rechecked. The compact [source/build/model manifest](../implementation/msr-review-build-manifest.json) is committed; raw inventories/captures remain local.

Raw traces, screenshots, recordings and private development QA state remain in ignored local artifacts. The written report, test sources and voice provenance are the reviewable source deliverables. Backend credentials and generated test passwords are never copied into this report. The dedicated test identity is separate from the owner's account; no owner save is reset for QA.

The owner requested a GitHub push after the remaining engineering/handover work. That push does not constitute acceptance of the pending human gates or an unconditional production release decision.
