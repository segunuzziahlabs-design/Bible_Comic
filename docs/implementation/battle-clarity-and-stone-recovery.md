# Battle clarity and individual stone recovery

24 November 2026. **Implemented and browser-verified within the limits below.** Implementation of the [approved plan](battle-clarity-and-stone-recovery-plan.md). This extends Chapter 5; the six-chapter structure, authentication, profiles, chapter checkpoints and final sword action are retained. Portable result data and runtime source hashes: [verification JSON](battle-clarity-verification.json).

## Player-facing changes

- **Clearer aiming:** brighter ivory stone and trail, larger trajectory beads and a contrasting forehead marker. Beads turn green for a calculated forehead trajectory. These are display aids; the projectile speed, gravity and forehead collision radius are unchanged. Incorrect throws still miss.
- **More time to react:** spear flight increased from 1.25 to **2.1 seconds**. The ballistic arc is time-scaled to keep its former shape; drawing and swept collision use the same sample. During sling combat Goliath now recovers for **4.8 seconds** between attacks, following the existing warning and throw states. He continues attacking during aiming, throwing and stone collection.
- **Five physical stone identities:** each released stone moves from held to airborne, then to a ground drop on a miss. Its landing is retained. Obstructed impacts settle to nearby reachable ground; the arena boundary catches outward misses so stones do not become permanently inaccessible. The winning stone becomes spent only on genuine forehead contact.
- **Collect stones / R:** available whenever missed stones are on the field, including with a partially full pouch. It toggles route arrows to the nearest drop. David is never walked there automatically. Stop within **0.88 m** for a **0.95-second** pickup using the existing animation. Movement, Jump, Dodge or throwing interrupts collection without awarding the stone. Pick up one and immediately throw, or recover all five. Inventory cannot exceed five; the automatic five-stone brook refill is removed from the current cinematic battle.
- **Camera and layout fixes found during testing:** the battle camera retains room at arena boundaries and rises over hillside soldiers. Late-flight framing uses the new spear duration. Landscape Jump Shot and Collect stones no longer overlap; portrait shows ammunition in the combat stage label without a duplicate counter over the aiming panel. Route labels have a bounded, readable width.
- **Loading instead of a combat hitch:** profiling located a 269 ms graphics-program link during a spear warning. Chapter 5 now warms off-screen render variants and the recovery props behind the entry loader, restoring their culling/visibility before play without advancing the paused battle clock. The active route also stays mounted rather than being hidden/shown each frame.

## Engineering changes

| Area | Implementation |
| --- | --- |
| Stone rules | [battle-stones.ts](../../apps/playcanvas/src/gameplay/battle-stones.ts): stable IDs, settling, nearest drop selection, interruptible pickup, reachable landing and obstacle-aware route calculation. |
| Combat integration | [elah-battle.ts](../../apps/playcanvas/src/gameplay/elah-battle.ts): deduct on release, retain real misses, recover after lethal collision resolution, retain required sword/spear stages and earned-hit ending. |
| Presentation | [recoverable-stones.ts](../../apps/playcanvas/src/world/recoverable-stones.ts): five reusable stone/ring pairs; no per-frame entity creation. Existing pickup clip, route guide, camera and projectile renderer are extended. |
| Controls/UI | Shared action router adds R. Collection button uses the existing keyboard/touch routing, remains independent of movement/aiming, and highlights an empty pouch. Controls help explains recovery and its risks. |
| Save boundary | Ammunition and drops remain attempt-local, as ammunition was previously. Reload/Retry restores the existing battle checkpoint with five held stones. Confirmed aftermath and victory checkpoints retain their existing save events and formats. No database migration, new dependency or new downloaded art/audio is introduced. |

## Verification

Only actual executed checks are recorded here. Production browser testing uses a reducer-built prepared Chapter 5 checkpoint followed by ordinary keyboard/mouse or emulated multi-touch input and normal game clocks. It does not write runtime battle state, force hits, disable attacks or accelerate animations.

The final frozen candidate is `build/battle-recovery-local07/`, served on [localhost:4240](http://127.0.0.1:4240/duel.html?review=1). All three final gameplay reruns passed. Raw screenshots, state captures and result JSON are in `evidence/battle-stones-2026-11-24/final07/` (desktop/portrait), `final07-landscape-rerun/` and `final07-profile/` on the testing workspace; evidence and build directories are Git-ignored. Earlier folders remain diagnostic history.

| Check | Result / evidence |
| --- | --- |
| TypeScript and production build | Passed through `npm run build` for candidate 07. |
| Focused rules regression | Passed `battle-stones-check`, `cinematic-battle-rules-check`, `ranged-spear-rules-check`, `spear-airborne-rules-check`, `spear-sequence-rules-check`, `battle-ending-rules-check`, `action-router-check` and `episode-rules-check`. Includes inventory conservation, duplicate protection, partial/all recovery, cancellation, real misses, no cinematic bulk refill, landing/route obstruction, defeat/retry, required-stage guards, physical contact at 120/60/30/20 Hz, and ordered story/save rules. |
| Portrait, 390 × 844 | Passed full battle/recovery journey on final candidate 07: five misses, arrow-guided collection, active-pickup pause and Dodge interruption, one recovered stone thrown, all five recovered, genuine forehead hit, player-driven final sword action, saved victory gate and reload. 1,063 audited spear flight frames, no cropped head/shaft centres in those samples; max flight sample 2.0985 s. No browser console errors. |
| Landscape, 844 × 390 | Passed the same journey on final candidate 07. 846 audited spear flight frames; max sample 2.099 s; no cropped centres or browser console errors. All five action buttons are at least 44 px high, inside the viewport, unobscured at their centres and pairwise non-overlapping. |
| Desktop, 1280 × 800 | Passed the full journey on final candidate 07, including a genuine spear defeat after a miss, Retry clearing its old drop, keyboard R, recovering/throwing one stone, collecting all five, actual winning contact, final sword action and saved-gate reload. 1,104 audited spear flight frames, max sample 2.0991 s, no cropped head/shaft centres or browser console errors. Action targets also pass size, centre coverage and pairwise overlap checks. |
| Pickup animation/loading | All three browser runs captured the active `pickup_provisions` pose during a paused pickup, then verified frozen progress and a player Dodge cancelling it without a stone award. Example: `final07/desktop-automatic-pickup-paused.png`. They also checked that loading warm-up leaves exactly five held stones and no visible recovery props. |
| Sustained frame pacing | Candidate 07 passed a clean 45-second laptop run with all five missed stones and their markers enabled, active guidance and five directional spear dodges. Chrome 157.0.8103.79, 1366 × 768, Intel N150 / Intel Graphics: **31.97 FPS**, median gap **31.3 ms**, p95 **35.3 ms**, largest **67.3 ms**, **0 gaps >250 ms**, minimum rolling one-second rate **30.72 FPS**, **0 seconds below 30 FPS**, no long tasks or console errors in that interval. This is the heavier recovery-enabled case; it is not a matched comparison with the previous one-miss, no-recovery profile. Headroom above the provisional 30 FPS floor is limited. |

The first candidate exposed a camera crop near the arena perimeter. Visual inspection also found soldiers blocking the raised edge camera and overlapping landscape controls; both were corrected and checked in subsequent browser runs. Candidate 06's repeated recovery stress profiles averaged 31.7–31.8 FPS but contained single 316–354 ms frames. A WebGL trace attributed the repeated frame to `getProgramParameter` blocking for 269 ms during rendering; candidate 07's loading warm-up removed that in the measured run. Intermediate harness issues were checking route visibility before the next render frame, reading a flight audit after a reload cleared it, and inspecting a route target after the final stone completed between browser reads. The driver now waits for the rendered guide, retains its audit before reloading and rechecks completion before asserting a remaining target. Earlier failure artifacts are historical; the final `*-results.json` files identify completed reruns.

## Reproduce the checks

Use the project's existing Node 24 environment and bundled Playwright path. From the repository root:

```powershell
node apps/playcanvas/tests/battle-stones-check.cjs
node apps/playcanvas/tests/cinematic-battle-rules-check.cjs
node apps/playcanvas/tests/ranged-spear-rules-check.cjs

# PLAYWRIGHT_PATH is the installed Playwright module directory, not a credential.
node apps/playcanvas/tests/battle-stones-browser.cjs PLAYWRIGHT_PATH http://127.0.0.1:4240 docs/implementation/evidence/battle-stones-review desktop
node apps/playcanvas/tests/battle-stones-browser.cjs PLAYWRIGHT_PATH http://127.0.0.1:4240 docs/implementation/evidence/battle-stones-review portrait
node apps/playcanvas/tests/battle-stones-browser.cjs PLAYWRIGHT_PATH http://127.0.0.1:4240 docs/implementation/evidence/battle-stones-review landscape
node apps/playcanvas/tests/battle-stones-profile.cjs PLAYWRIGHT_PATH http://127.0.0.1:4240 docs/implementation/evidence/battle-stones-profile
```

Run performance profiling without other active browser tests or recordings. The [30 FPS working goal](motion-speech-and-guided-routes-plan.md) is a provisional measured-baseline target, not a guarantee for every device.

## Limits of this verification

These are local production-browser checks. Mobile layouts use Chromium touch emulation on the Intel N150 laptop; physical phones, Safari and Firefox were not tested in this pass. Live Clerk/Supabase and the other chapters, including the Chapter 6 cinematic, were not re-run because their implementations and save formats were unchanged; the Chapter 6 handoff gate, local real checkpoint writes/reload and the story reducer were checked. The prior [QA report](../qa/DAVID_AND_GOLIATH_IMPROVEMENT_REPORT.md) remains historical evidence for its own build, not a claim that all earlier checks were repeated here. No commit, push or deployment is included in this task.
