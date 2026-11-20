# MSR-04: Eliab → Saul guided connection

20 November 2026. Implements R07 from the [MSR plan](../implementation/motion-speech-and-guided-routes-plan.md), following the [execution plan](../implementation/msr04-guided-route-execution-plan.md). This is the first connected travel sample, with the existing MSR-02 movement and MSR-03 audience retained. **Implementation, three-layout route/recovery checks and an isolated fresh six-chapter desktop regression passed. Owner review remains pending.**

## Play the connection

[Walk from Eliab to Saul](http://127.0.0.1:4220/challenge.html?review=1&route=saul). Select **Walk from Eliab to Saul**, follow the camp arrows, then walk into the pavilion and choose **Speak**. This shortcut uses a temporary review run with the first five objectives already present; it does not demonstrate earning those objectives or change your normal saved game.

[Play Chapter 3 from its beginning](http://127.0.0.1:4220/challenge.html?review=1) to hear Goliath and Eliab before the connection. [Start the full episode](http://127.0.0.1:4220/valley.html) uses the normal local QA save adapter in this preview. These are local production builds, not a Vercel deployment or a live Clerk/Supabase test.

## What changed

- After Eliab's exchange **successfully saves** `eliab.answered`, David returns to player control. The objective changes to **Walk to Saul’s pavilion**, arrows show a short camp bend, and the relevant north exit opens. The other collision boundaries and obstacles stay in place.
- Timber, linen, red cloth, a worn path and waystones dress the departure. The destination uses the same pavilion palette. The follow camera gives the route more clearance; Eliab turns towards the departure at the end of the exchange.
- At the exit, David must be grounded. Input clears, the scene fades fully under an opaque cover and one page navigation occurs. The target HTML/module is checked while walking; this is network preparation, **not** destination scene execution or GPU/shader prewarming.
- A short, one-use arrival hint connects the two pages. The destination starts David outside the pavilion with arrows and player control. Dialogue does not start automatically. One **Speak** starts the existing audience; only its successful finish earns `saul.audience`.
- The former automatic chapter-end dialog is now an optional **Chapter summary**, with **Back to the path**. Chapter 3’s footer displays Watch/Pause during cinematics and movement instructions when control returns.

The connection is a short playable departure and approach with a covered page handoff. It is not an uninterrupted, single-world map or a new story chapter. R03, R05, R09 and R11 remain separate MSR-05 work.

## Saves, interruption and recovery

The six chapters, twelve objective IDs, account/profile infrastructure, save schema and combat rules remain unchanged. The route carries no objective list, position, credentials or account state. Its hint contains presentation identity only: route/destination, run ID, revision, content version, battle revision when present, review flag and creation time. It expires after five minutes and is consumed once.

Normal entry validates the hint against the confirmed session. Missing, malformed, stale, mismatched or inaccessible session storage falls back to the canonical checkpoint outside the pavilion. Review entry derives its existing fixed objective prefix; it correlates only the temporary run ID and cannot import normal account progress from a hint.

Page/module preparation has a ten-second timeout, with **Retry entering the pavilion** and a checkpoint fallback. Failure remains covered, and finishing a retry while paused does not navigate. Destination asset failure retains the opaque loading entry and existing Reload action. Source reload after the confirmed Eliab answer resumes the canonical Preparation checkpoint. Back/forward cache restoration uses the existing reload guard.

Destination entry automatically resumes the walk when its audio context can run. Browser autoplay restrictions retain a visible **Enter the pavilion** action to provide a fresh sound gesture; no guaranteed autoplay across all browsers is claimed. Pause, restart, sound preference and safe input clearing remain available. Restart at the pavilion clears the short reveal cover instead of leaving a black screen.

## Verification and evidence

Production build: `build/msr04-local`, local account mode, Chrome **157.0.8103.79**, WebGL 2. [Frozen build hashes](evidence/msr04-2026-11-20/frozen-build-manifest.json). TypeScript and Vite build passed. [Route contract checks](../../apps/playcanvas/tests/pavilion-route-check.cjs) and the existing `test:story` suite passed. These cover ordered progression, cue ownership and save/retry rules, plus route identity/expiry/one-use/blocked-storage validation and collision passage checks.

The focused [browser driver](../../apps/playcanvas/tests/msr04-route-browser.cjs) begins from an explicit **normal local checkpoint fixture at `challenge.heard`**, earns Eliab's answer through the actual conversation, walks both sides with keyboard or CDP touch input and completes one audience. It checks visible arrows, optional summary, pause/restart, unchanged progress through travel, no leaked held movement, no early audience and exactly one earned audience. All three layouts passed on the frozen build with no captured console/page errors or failed HTTP requests.

| Layout | Purposeful departure + approach | Result |
| --- | --- | --- |
| Desktop 1280×720 | 5.437 + 2.498 = **7.935 s** | [PASS](evidence/msr04-2026-11-20/frozen/desktop/results.json) |
| Portrait 390×844, touch emulation | 3.865 + 2.805 = **6.670 s** | [PASS](evidence/msr04-2026-11-20/frozen/portrait/results.json) |
| Landscape 844×390, touch emulation | 3.846 + 2.803 = **6.649 s** | [PASS](evidence/msr04-2026-11-20/frozen/landscape/results.json) |

Walking time excludes destination loading, cinematics, screenshot pauses and deliberate pause/restart checks. It includes normal acceleration, bends and stopping, so it is not a theoretical distance/speed calculation. The target is approximately 5–10 seconds for the combined connection. Mobile evidence is browser emulation, not physical-phone or iOS Safari certification.

Inspected browser captures: [desktop camp path](evidence/msr04-2026-11-20/frozen/desktop/camp-path.png), [portrait arrival](evidence/msr04-2026-11-20/frozen/portrait/pavilion-arrival.png), [landscape arrival](evidence/msr04-2026-11-20/frozen/landscape/pavilion-arrival.png), [audience after the walk](evidence/msr04-2026-11-20/frozen/desktop/audience.png).

The [recovery browser driver](../../apps/playcanvas/tests/msr04-recovery-browser.cjs) uses labelled checkpoint/review fixtures and injected failures. These cases passed on the frozen build:

| Case | Verified result |
| --- | --- |
| Page 503; module 503 | Covered error; Retry succeeds; completed retry waits for Resume before navigation; checkpoint retained. |
| Explicit fallback | Opens the correct pavilion checkpoint without an arrival hint or an automatic audience. |
| Persistent David GLB failure | Opaque loading error; Reload after restoring the asset recovers to the correct checkpoint. |
| Expired hint | Ignored and consumed; normal entry remains available outside the pavilion. |
| Source reload at confirmed Eliab checkpoint | Redirects to Preparation without replaying Eliab or granting the audience. |
| Airborne exit and review isolation | Entering the actual exit radius while airborne does not transfer; landing allows transfer; hint consumes once; restart clears the reveal; normal saved run remains identical. |

Evidence: [recovery results](evidence/msr04-2026-11-20/recovery-final/). Expected injected HTTP/asset errors are recorded separately from unexpected page errors. No unexpected page errors were recorded in passing recovery cases.

Fresh full episode regression: **PASS**, desktop 1280×720, empty normal browser session with the local save adapter. All **12 ordered objectives** were earned with real controls and normal clocks, without review mode, seeded progress, clock changes or state repair. It verified opening/arrival restart, Jesse and provisions, camp reload, Goliath/Eliab, the new route, the Saul audience, armour/reload, interrupted automatic stone collection, practice miss/hit, battle defeat/reload/Retry, physical evasions, sling misses and earned hit, the player sword interaction, Victory, completion reload and fresh episode replay. Result: **2 battle attempts, 1 defeat**, preserved completed-run history and no captured console/page errors or failed HTTP requests. Ten UI layout checkpoints also passed. This is a complete desktop journey plus focused touch route checks, not three newly repeated full-episode layouts or a new physical-device certification.

Full-run R07 walking: **3.917 s departure + 3.019 s approach = 6.936 s**. Evidence: [results/events](evidence/msr04-2026-11-20/full-episode-isolated/desktop/results.json), [full recording](evidence/msr04-2026-11-20/full-episode-isolated/desktop/complete-episode.webm), [Chapter 3's corrected cinematic footer](evidence/msr04-2026-11-20/full-episode-isolated/desktop/07-goliath-challenge.png). [Updated full-playthrough driver](../../apps/playcanvas/tests/ctrl07-episode-playthrough.cjs) now walks R07 instead of clicking Continue to Preparation; historical Chapter 3 test expectations also use the new departure state. The historical standalone Chapter 3 suites were updated but not separately rerun; the focused R07 and fresh full-episode suites supply this task's browser evidence.

Test-harness corrections: the first asset fault was transient and PlayCanvas automatically recovered; the final test blocks that asset until Reload. A read racing the intentional page navigation originally failed in the driver; navigation-aware movement now waits for the real destination rather than treating destroyed source-page context as a game defect. The first full run timed out at Chapter 1's survey (9.54 of its 10 audio-clock seconds) while another browser suite was running. This suggests resource contention; the isolated rerun passed that point and all six chapters without changing gameplay or relaxing that timeout. Earlier exploratory/failing results are retained in [investigations](evidence/msr04-2026-11-20/investigations/), [initial recovery work](evidence/msr04-2026-11-20/recovery/) and [first full attempt](evidence/msr04-2026-11-20/full-episode/desktop/failure.json).

## Limits and next gate

This task does not replace the models/environment or claim final cinematic art quality. The camp/pavilion connection and motion still need the owner's visual review. No new voice generation, dependencies, engine changes, authentication work, deployment, commit or push were performed.

MSR-03's subjective intonation approval and native tab-away/resume check remain open. MSR-02's formal planted-foot/input-latency thresholds remain open. The route tests are not substitutes for those earlier acceptance gates, cloud-save certification, hardware performance measurements or an unaided first-time player session.

Review this R07 sample before MSR-05 applies the pattern to the other four missing connections. MSR-D03 is partially addressed by this task; it must not be marked fully resolved. MSR-D05 is addressed in Chapter 3 only; Chapter 2's footer remains in the later cast/presentation pass.
