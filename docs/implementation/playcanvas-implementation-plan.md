# PlayCanvas implementation plan

The [11 November reset plan](../roadmap/project-reset-plan.md) now governs proposed implementation order and owner approvals. The tasks below record the earlier prototype programme. Agree the new milestone brief before resuming production.

**10 November 2026 · Scenes first**

**SC-02 passed its encounter checks.** Review the animated Elah battle, then connect Bethlehem, the road, camp and brook to it. Develop and review the scenes with local checkpoints. Clerk and durable saves follow the scene acceptance gate. [Animated encounter and browser results](playcanvas-sc02-encounter.md) · [Scene development plan](playcanvas-scene-development-plan.md) · [PC-04 review](playcanvas-pc04-foundation-review.md) · [Production blueprint](playcanvas-production-blueprint.md)

The episode portrays David facing Goliath in an illustrated southern Levant setting around 1000 BC. Only Goliath killing David ends a mission in failure. A missed throw leaves the fight active. **Retry Battle** starts at the battlefield entrance with earlier progress intact. Rewards are deferred. [Episode design](../story/david-and-goliath-episode-design.md) · [Mission rules](playcanvas-production-blueprint.md#mission-design-and-outcomes)

## Scope and technical decisions

- **App.** Continue in the existing `apps/playcanvas/` package with strict TypeScript, the pinned PlayCanvas engine, Vite and WebGL 2. Keep generated builds in `build/playcanvas/`. Split the account shell and play route so the dashboard can load before the engine. Run acceptance against a served production build. [Package manifest](../../apps/playcanvas/package.json)
- **Assets.** Reuse the teenage David GLB, its existing body clips, the new sling clip and the four appearance controls. Keep the Blender source, export command and model hash recorded. Publish versioned runtime packs with stable asset IDs and load only the active area. Bring in village art and audio with PC-05. [PC-01 asset notes](playcanvas-pc01-bootstrap.md#teenage-david-and-appearance-choices) · [Asset register](../assets/asset-register.md)
- **Runtime boundaries.** A small bootstrap owns loading, entry, resize and teardown. An input adapter normalizes movement and look across keyboard, mouse and touch. A player controller owns motion and collision, a camera rig owns framing and obstruction, and the character layer blends clips based on actual travel speed. A guarded interaction state owns objective changes. The cue runner drives animation, camera and subtitles from one clock, with the DOM shell displaying controls and state. Start with direct module calls and a single owner for each state.
- **World queries.** Start with a flat floor and simple static collision volumes. Resolve horizontal movement with swept collision and sliding, then query those same volumes for camera clearance and interaction line of sight. Clamp long frame steps and clear held input on focus loss or state changes. If the representative route needs collision features that exceed this small implementation, compare a supported physics integration against the collision and payload checks before widening the dependency set. [Godot movement and camera acceptance](b02-movement-camera-plan.md) · [PlayCanvas physics](https://developer.playcanvas.com/user-manual/physics/)
- **Content and presentation.** Preserve the edited Jesse exchange as data with ordered beat times, shot IDs, subtitles and actor cues. Use a single directional shadow light and a capped render buffer. Start with one render pixel per CSS pixel, capped at 1280 × 720 in landscape or 720 × 1280 in portrait. Keep DOM text and touch controls at CSS size. Use Elah to prove the fight before bringing the full route together. [Existing Jesse beat data](../../assets/story/jesse_errand.tres) · [Village presentation](village-story-presentation-plan.md)

## Milestones

PC-01 through PC-04 and SET-01 have acceptance evidence. SET-02 records the game, input and checkpoint contracts. Record the build, browser, viewport, result and open blockers for each subsequent review. [SET-01 baseline](playcanvas-set01-baseline.md) · [SET-02 contracts](playcanvas-set02-contracts.md)

### Phase 0 · Baseline and contracts

| Task | Needs | Steps | Done when |
| --- | --- | --- | --- |
| **SET-01 · Reproduce PC-01** | Existing preview | Record workspace status and tool versions. From the package, run the locked install, type check and production build. Serve it on loopback and run the existing browser check. Record the David asset hash and any baseline defects. The workspace currently has no Git commit, so identify the baseline by the package lock, asset hash and tested build. | A repeatable local run shows David's walk, acknowledgement and appearance controls. Record results and a local review URL. |
| **SET-02 · Define the first contracts** | SET-01 | Write a short implementation contract for shell-to-game mounting, keyboard and touch input, mission events and the save adapter. Pin the fixture's episode, mission and `battle.entry` IDs. Write examples for a hit, a nonlethal miss, defeat, retry and resume. Record the local checkpoint boundary. | Both tracks can use the same IDs and fixtures. The mission events, checkpoint contents and acceptance cases are reviewable. |

### Phase 1 · Verified playable foundation

| Task | Needs | Steps | Done when |
| --- | --- | --- | --- |
| **PC-02 · Playable movement** | SET-02 | Normalize keyboard, mouse and touch input. Add acceleration and braking, movement-driven walk/idle blending and simple wall collision. Add a follow camera that pulls in around obstacles. Use a floor, one corner and a narrow passage. Clear held input when paused, blurred, resized or cancelled. | David moves and stops predictably, slides along walls and stays visible at corners. Touch can move and look together. Test the production build in both orientations. |
| **PC-03 · Interaction and cue** | PC-02 | Add one target, prompt and short cue. Gate interaction by range and line of sight. Give each cue an instance ID. One action plays the cue and returns camera and input control. Add pause, resume and local restart. | Out-of-range, occluded and duplicate actions have no effect. Pause holds the cue and animation. Restart restores the initial state and stale callbacks have no effect. |
| **PC-04 · Foundation review** | PC-03 | Build and serve the local candidate. Test control cancellation, rotation, camera framing and the cue. Measure startup, transfer and frame pacing using the verification procedure below. | The browser and performance gate passes, or a measured blocker is fixed and retested before moving on. |

### Phase 2 · Playable Elah encounter

| Task | Needs | Steps | Done when |
| --- | --- | --- | --- |
| **SC-01 · Elah reference and layout** | PC-04 | Assemble the period reference sheet. Block out the battlefield entrance, valley floor, opposing ridges and combat space. Place David and a Goliath stand-in, with named entry and aftermath anchors. | A browser walk makes the route, scale and sightlines readable from David’s camera in portrait and landscape. |
| **SAVE-02 · Local battle fixture** | SC-01, SET-02 | Add the approach, cue handoff, aim and deliberate sling release. Resolve hit and miss and one telegraphed Goliath attack. Use a local checkpoint at `battle.entry`. | A miss leaves the fight active. Only a lethal attack by Goliath produces defeat. Retry starts at the entrance with preparation intact. A hit triggers one impact and fall. |
| **SC-02 · Representative encounter** | SAVE-02 | Rig Goliath, add the sling and spear props, animate the fight and retreat, and stage the camera, captions and sound. | Review a playable encounter from the battlefield entrance to the retreat in a production browser build. |

**Exit gate.** Review the encounter with the owner before expanding the route. Use the scene plan to assess player control, period direction and the quality of the fight. [Detailed scene steps](playcanvas-scene-development-plan.md#build-order-and-review-points)

### Phase 3 · Bethlehem and village handoff

| Task | Needs | Steps | Done when |
| --- | --- | --- | --- |
| **PC-05 · Village parity** | SC-02, PC-04 | Port the walkable route, Jesse, provisions and gate using the Godot timing, camera beats and audio as the reference. Keep Speak and Take separate. Commit pickup on cue completion. Load a placeholder road entry before committing the local gate checkpoint. | Skip, replay, interrupted pickup and local restart preserve the correct objective. The gate opens the route after pickup, and Jesse’s errand remains active until delivery at camp. |
| **PC-06 · Village review** | PC-05 | Check three completion and restart cycles on the production build. Exercise keyboard and emulated touch. Observe an unaided playthrough and record clarity, visual and performance findings. | The village matches the reference interaction and recovery behaviour. Record the safe handoff, issues and revised estimates for the full episode. |

**Exit gate.** The player can play the opening, return to a safe local point and reach the road with the right equipment and story state. [Jesse exchange reference](q04-village-exchange.md) · [Village staging](village-story-presentation-plan.md)

### Phase 4 · Connect the complete episode

| Task | Needs | Steps | Done when |
| --- | --- | --- | --- |
| **EP-01 · Road and camp delivery** | PC-06 | Build the road and camp entry, reveal the opposing ridges and connect the village handoff to the guarded supply delivery. | Delivery commits once to the local run and unlocks preparation. |
| **EP-02 · Challenge and preparation** | EP-01 | Stage the challenge, Eliab, Saul and armour cues, then the brook. Connect each objective and carry the sling, pouch and five stones into the battlefield checkpoint. | David reaches Elah with valid preparation, which survives battle retry. |
| **EP-03 · Integrate the encounter and conclusion** | SC-02, EP-02 | Connect the prepared arrival to the reviewed Elah encounter. Carry the hit, non-graphic fall and retreat to one completion result. | The fight uses the same rules as the reviewed scene. Retry restores the battlefield entrance. A successful throw advances the story once. |
| **EP-04 · Full local playthrough** | EP-03 | Play from Bethlehem through the retreat on desktop and touch. Interrupt, retry, finish and replay through the normal game entry. | The full episode plays and replays through the local game shell. Earlier preparation and objectives survive the recovery cases. |

**Exit gate.** Capture a continuous local production playthrough and the recovery cases. [Episode beats](../story/david-and-goliath-episode-design.md)

### Phase 5 · Scene acceptance

| Task | Needs | Steps | Done when |
| --- | --- | --- | --- |
| **QA-01 · Presentation and usability** | EP-04 | Polish the busiest areas, animation contact, scene transitions and sound. Verify captions with sound off, keyboard focus, touch targets and clear result feedback. Observe first-time players and fix progression or usability blockers. | Players can understand the controls, complete the episode and recover from defeat. Record first-play time against the 10–15 minute target. |
| **QA-02 · Browser and performance** | EP-04, QA-01 candidate | Run the agreed browser and viewport matrix. Profile cold entry, first playable load, the heaviest encounter and area handoffs. Check asset loading and resource release. Rebuild and retest material fixes. | The production candidate meets the agreed browser and performance budgets. Emulated layout and measured hardware performance are reported separately. |

**Exit gate.** The owner reviews the complete episode for period atmosphere, battle feel and readiness. Record first-time player feedback, desktop and touch recovery checks and performance from the busiest scene. [Scene acceptance gate](playcanvas-scene-development-plan.md#scene-acceptance-gate)

### Phase 6 · Deferred account and save integration

After scene acceptance, use the existing game contracts to connect Clerk, Postgres and cross-browser saves.

| Task | Needs | Steps | Done when |
| --- | --- | --- | --- |
| **APP-01 · Clerk entry** | Scene acceptance, development Clerk access | Add the public landing and Clerk's prebuilt sign-in and sign-up. Protect dashboard and play routes. Restore the session on reload, validate return paths and clear the game and cached user data on sign-out. | Sign-up, verification, sign-in, sign-out and recovery for the chosen Clerk method work. A signed-out deep link returns safely after sign-in. |
| **APP-02 · Profile ownership** | APP-01, development database access | Add migrations for profiles and preferences. Configure the Data API to verify Clerk session tokens. Map the verified text subject to one internal player ID. Set grants and ownership policies. Add an idempotent profile load/create command and a settings update command. | Two Clerk users can read and update only their own profiles and settings. Signed-out and cross-account requests are rejected. |
| **APP-03 · Dashboard and profile** | APP-02 | Show episode availability, the player profile and saved appearance and accessibility settings. Implement the lazy play route with a session mount and teardown. Use a labelled development fixture until the mission API is connected. | The account journey works through normal routes. The dashboard loads independently of the game and the player's selected look is restored in the preview. |
| **SAVE-01 · Content and progress schema** | SET-02, APP-02 | Add versioned episode, mission and objective definitions. Add runs, attempts, checkpoints, completion summaries and command receipts. Seed one placeholder battle and a prior completion for recovery tests. Validate content and anchor IDs. | Migrations run on a fresh development database. The battle manifest pins the entry anchor and allowed transitions. Invalid ownership, IDs and version combinations are rejected. |
| **SAVE-03 · Durable mission commands** | SAVE-01, SAVE-02, APP-03 | Implement start, resume, checkpoint, resolve and retry operations. Validate permitted transitions on the server. Write outcomes, progress and the command receipt in one transaction. Use request IDs and expected revisions. Connect dashboard actions and show saving, confirmed, retry-save and conflict states. | One terminal result per attempt. A failed attempt remains in history and **Retry Battle** creates a new attempt from the saved entry. Duplicate requests return the existing result. A stale tab cannot overwrite the current save. |
| **SAVE-04 · Cross-browser proof** | SAVE-03, EP-04 | With a Clerk test user, start, leave, and resume on a clean browser context. Test miss, lethal defeat, a reload on the defeat screen, retry and success. Repeat a terminal request and interrupt a save. Check another account cannot see the run. | All cases pass through the real routes. Earlier completion and preparation survive defeat and retry. The restored scene and attempt history match the confirmed server state. |

**Exit gate.** Sign-in, ownership and durable resume work with the verified episode and preserve its outcomes. [Account and save design](playcanvas-production-blueprint.md#account-profile-and-player-journey)

### Phase 7 · Staging and release decision

| Task | Needs | Steps | Done when |
| --- | --- | --- | --- |
| **REL-01 · Staging and recovery** | QA-02, SAVE-04, staging access | Build from the locked package, apply reviewed migrations, and publish matching versioned content to staging. Verify Clerk verification and recovery, data isolation, the full episode and cross-browser saves. Drill backup restore and rollback with an existing save. | Record the build, schema and manifest versions. Hosted checks pass and the previous candidate can read a supported save. |
| **REL-02 · Go or no-go** | REL-01, owner review | Present the release checklist, known issues, support owner, data retention decisions and rollback steps. Record the release decision. If release is approved, use the tested candidate and run hosted smoke checks after publishing. | The decision and supporting evidence are recorded. A published release has verified hosted entry, sign-in and resume. |

**Exit gate.** The staged candidate has a recorded release decision and reproducible evidence. [Release controls](playcanvas-production-blueprint.md#security-data-and-operations)

## Effort and working order

Size the art and animation work from the Elah blockout. Use the playable encounter and village review to forecast the remaining scenes. Keep the earlier account and save estimates as planning inputs for Phase 6. [Production phases](playcanvas-production-blueprint.md#development-phases-and-dependencies)

## Foundation verification

1. **Build and launch.** Plan for `npm ci`, `npm run typecheck`, `npm run build` and `npm run preview` from `apps/playcanvas/`. Use a production build for browser checks. Start timing at navigation and end when the first controllable frame is rendered. Record compressed bytes, request failures and three cold and three immediate reloads. Verify loading and the WebGL 2 error path.
2. **Interaction and responsive layout.** Use Playwright to exercise the cue and restart on desktop and with touch emulation at 390 × 844, 568 × 320 and 320 × 568. Rotate during movement and during the cue. Check simultaneous movement and look, safe cancellation, action reachability, text readability and a minimum height of 48 CSS pixels for essential touch buttons. Record the browser and viewport. Physical handset sessions are optional and can establish performance beyond what emulation measures.
3. **Performance.** Compare against the Intel N150 benchmark of 2.10 seconds median cold startup, 1.14 MB compressed and 32 FPS. Use **3.5 seconds median cold startup and 2.0 MB compressed** as provisional local foundation targets, with **30 FPS sustained** during a 45-second movement and cue run. Inspect p95 frame intervals and gaps over 50 ms, and investigate rolling FPS below 30 for more than two consecutive seconds. Archive the build ID, device/browser configuration and measurements. These targets apply to the first playable area. The village and release budgets follow the representative journey measurements. [Benchmark data](../quality-review/stack-comparison-results.md#browser-results) · [Performance and delivery decisions](../roadmap/risk-and-decision-register.md#decision-register)

If PC-04 misses the targets, profile first-load asset requests, shader and animation work, then camera and collision cost. Fix the measured bottleneck and rerun the gate before expanding the area.
