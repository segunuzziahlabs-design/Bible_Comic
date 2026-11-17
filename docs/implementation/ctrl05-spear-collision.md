# CTRL-05 — airborne spear collision

16 November 2026 · [Plan prepared before implementation](../controls/ctrl05-spear-collision-plan.md) · [Approved control order](../controls/player-control-design.md) · [CTRL-04 baseline](ctrl04-jump-movement.md) · [Asset derivation](../assets/goliath-spear-collision.md).

**Subsequent owner request:** [Encounter and route polish](encounter-and-route-polish.md) replaces live Chapter 5's close thrusts with a wider ballistic spear throw and adds Q Jump Shot, directional route arrows and automatic stones. It retains this swept shaft/head and airborne capsule foundation. Port 4198 and the evidence below remain the historical CTRL-05 candidate.

## Behaviour and scope

**Space / Jump now provides physical clearance from a low spear thrust when correctly timed. Shift / Dodge remains the sideways defence.** Goliath retains his spear. Touching its head or shaft is lethal even while airborne. There are no jump/dodge invulnerability frames.

The three existing attack slots now have visibly aligned low, middle and high performances. A successful, registered jump over a threatening low thrust counts as one of the three evasions before the sling becomes available. A jump that lands too early, starts too late, or passes outside an unrelated attack earns no credit. Higher thrusts can hit airborne David; the UI recommends Dodge for these. Input registration alone supplies neither safety nor progress. Existing ground movement, grounded sling throws, miss/refill behaviour and forehead-hit victory remain.

Damage occurs only during the complete active thrust interval. A swept capsule follows David's actual absolute feet position, including terrain and jump height. The moving head and whole shaft come from the displayed rig's `Spear grip` and `Spear tip` markers. The ground warning lane is guidance, not an invisible damage corridor. The active attack index stays locked through recovery even after its evasion increments the counter.

Pause freezes motion and collision history. Retry Battle clears prior samples, transient jump/evasion/contact state, restores five stones and keeps the confirmed preparation objectives. A lethal airborne contact cancels the motor and lets the visible body fall from its impact height instead of snapping immediately to the ground. Save schema and objective order are unchanged.

This task does not introduce arrows, ranged spear throws, CTRL-06's cinematic Jump Shot, new chapters, authentication or deployment. Earlier frozen candidates and owner progress are retained.

## Necessary animation correction

Sampling the previous asset showed thrust heads above or beside David while the old broad XZ lane applied lethal damage. Adding a height filter without changing the visible poses would have made grounded attacks miss. The new derivative aligns the existing spear clips with three physical heights and uses a 2.45 m approach stop instead of 3.05 m. The warning reach is 2.75 m; it does not determine contact. Anticipation, active duration (0.28 s), recovery times and three-evasion gate are retained.

The [asset record](../assets/goliath-spear-collision.md) documents the original retained GLB, new Blender source/export, baked hand/foot IK, measured endpoints and provenance. No external art or new licence dependency was introduced. This is alignment of the current stylised asset, not acceptance of final cinematic art quality.

## Implementation

- [spear-collision.ts](../../apps/playcanvas/src/gameplay/spear-collision.ts): engine-independent finite-segment distance and continuous relative-motion subdivision for a moving vertical capsule versus moving shaft/head segments. Uses the existing 0.28 m player radius and 1.66 m standing height, scaled spear dimensions from its source mesh and a 6 mm conservative margin. Grazing and between-frame contacts are included.
- [elah-battle.ts](../../apps/playcanvas/src/gameplay/elah-battle.ts): samples all of the active interval, including its first/last frame and overflow, records actual contact, checks a grounded projection before awarding jump clearance, and resets history on a fresh attempt. Existing `dodges` counter name is retained internally for compatibility; it now counts these physical evasions.
- [elah-area.ts](../../apps/playcanvas/src/world/elah-area.ts) and [goliath-character.ts](../../apps/playcanvas/src/world/goliath-character.ts): one per-update pose cache supplies collision and rendering with the same actual weapon pose. There is no analytic fallback weapon in production. The challenge's existing director retains ownership during its dialogue.
- [movement-area.ts](../../apps/playcanvas/src/world/movement-area.ts): passes the rendered pose sampler, registers accepted motor jumps, preserves airborne contact height for the defeat presentation, and provides height-aware warnings. [duel-presentation.ts](../../apps/playcanvas/src/world/duel-presentation.ts) loads the derivative in the live Chapter 5 scene.
- [Help](../../apps/playcanvas/src/app/sling-controls-ui.ts) and [battle UI](../../apps/playcanvas/src/app/duel-main.ts): consistent Space Jump / Shift Dodge vocabulary, low/higher-thrust advice and explicit lack of immunity.

## Verification

**PASS:** the production build/typecheck, seven geometry/rules/asset checks and the complete battle matrix passed. The candidate is served locally from `build/playcanvas-ctrl05` on port **4198**. [Battle results](evidence/ctrl05-2026-11-16/final/browser-results.json), [rebuilt-candidate checks](evidence/ctrl05-2026-11-16/final/smoke-results.json) and [executed unit/asset outputs](evidence/ctrl05-2026-11-16/verification-results.json) record the actual outcomes. The complete battle matrix preceded a one-character encoding correction in its success message; after rebuilding, all three layouts again passed timed jump clearance, pause/resume, middle/high Dodges, sling readiness, correct success text and camera/marker correspondence. Collision mechanics and assets were unchanged by that text correction.

The test uses an isolated browser context and a reducer-built valid retry checkpoint with the first ten objectives confirmed. All subsequent battle actions use actual keyboard or CDP touch input, real animation/clock and normal save/retry. It does not alter runtime battle state or owner saves. It is a focused battle regression, not a fresh six-chapter release run.

| Executed check | Method / evidence |
| --- | --- |
| TypeScript and production export | `npm --prefix apps/playcanvas run build -- --outDir ../../build/playcanvas-ctrl05`; known large-bundle warning remains. |
| Geometry | [spear-collision-check.cjs](../../apps/playcanvas/tests/spear-collision-check.cjs): crossing, parallel and degenerate segments, low clearance, airborne higher hits, shaft contact, grazing, separated near miss, fast player/weapon crossings and 100 deterministic moving paths compared with dense samples. |
| Physical battle rules | [spear-airborne-rules-check.cjs](../../apps/playcanvas/tests/spear-airborne-rules-check.cjs): actual jump motor, registration versus clearance, early/late hits, airborne middle contact, unrelated jump and reset at 120/60/30/20 Hz; explicit first/last active boundary checks with 0.05 s updates. Synthetic weapon is explicitly confined to unit tests. |
| Retained systems | Existing spear sequence, jump motor, action router and episode/save rule checks: three gates, no-input/blocked outcomes, no duplicate credit, grounded actions, retries, input ownership and ordered objectives. |
| Asset continuity | [Manifest](../assets/goliath-spear-collision-manifest.json): 11,785 triangles, 68 joints, 12 meshes, all nine prior clips, speaking face and actual spear/forehead markers retained. |
| Browser battle | [Harness](../../apps/playcanvas/tests/ctrl05-spear-browser.cjs): portrait 390 × 844, landscape 844 × 390, desktop 1280 × 720; grounded hit, early/late jumps, low clearance, middle/high airborne contacts, five clean retries per layout, paused airborne active strike, Jump plus two real Dodges, sling forehead hit and saved objective eleven. |

Earlier diagnostic runs are retained separately. The first identified a marginally late automated touch jump; the second completed collision/evasion checks but its test tapped the canvas instead of dragging the aim, so its ordinary throw missed. The harness now performs the actual drag-to-aim gesture. These are recorded test-input corrections; no game immunity, timing shortcut or state repair was added to make them pass.

The [sampled contact record](evidence/ctrl05-2026-11-16/collision-observations.json) shows positive low-thrust clearance margins of approximately 0.11–0.17 m in the completed, paused/resumed cases. Middle/high lethal contacts occurred with David's feet approximately 0.62–0.77 m above his local ground. These are measured outcomes for the recorded inputs and terrain, not guarantees for every jump timing or position. The rebuilt-candidate audit also confirms that the visible rig's grip/tip exactly match the collision samples and that David's head/foot remain in the follow camera in all three layouts.

Captures: [portrait clearance](evidence/ctrl05-2026-11-16/final/portrait-low-clearance.png), [landscape clearance](evidence/ctrl05-2026-11-16/final/landscape-low-clearance.png), [airborne high hit](evidence/ctrl05-2026-11-16/final/portrait-high-airborne-hit.png), [landscape victory](evidence/ctrl05-2026-11-16/final/landscape-battle-won.png). These are actual Chrome renders; the JSON includes the contact positions that a still image cannot establish.

## Limits and review

The collision envelope is a conservative full standing capsule translated with the feet, not per-triangle skin collision or a smaller invulnerable tucked-leg shape. Endpoint trajectories interpolate within each update; live delta is capped at 0.05 s and the small margin covers ballistic chord error at that limit. Unit sweeps cover grazing and fast crossings; they do not prove arbitrary animation curves between all sampled frames.

Browser mobile tests establish responsive controls and collision behaviour in emulated portrait/landscape. They do not establish physical-phone GPU performance, Safari coverage, owner visual acceptance or first-time-player enjoyment. The earlier large engine bundle/loading work remains outside this focused collision change. CTRL-06's Jump Shot and CTRL-07's complete episode/control validation remain separate gates.

## Local review

[Battle preview](http://127.0.0.1:4198/duel.html?review=1): prepared Chapter 5 review, leaving saved episode progress unchanged. Watch the entrance, approach Goliath and hear the exchange. Time Jump late in the low-thrust warning, or use Dodge; use Dodge for the middle/high thrusts. Land, aim for his forehead and throw after three evasions. [Full episode entry](http://127.0.0.1:4198/episode.html) uses normal local progression.

[Candidate inventory and hashes](evidence/ctrl05-2026-11-16/candidate-manifest.json): 147 files, 28,655,662 bytes across the full multi-page export. That sum is not the Chapter 5 network download. Earlier port 4197 remains unchanged. The Codex preview-opening request returned **queued**; this does not constitute an observed in-app playthrough. Actual Chrome tests and captures above provide the browser verification.

```powershell
npm.cmd --prefix apps/playcanvas run preview -- --outDir ../../build/playcanvas-ctrl05 --host 127.0.0.1 --port 4198 --strictPort
```

No deployment, commit or push. Review this physical defence before authorising CTRL-06's jump-sling performance.
