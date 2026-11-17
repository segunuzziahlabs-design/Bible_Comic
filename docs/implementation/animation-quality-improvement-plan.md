# Animation and visual quality implementation plan

Prepared 9 November 2026 from the animation and technical review. **Q01 proposal and desktop baseline delivered. The Q02 rig probe, clothed character studies and two-actor exchange passed their desktop checks. Q03 movement and the Q04 village exchange passed Godot and Chrome checks, including emulated touch.** Owner art and content review and physical-phone validation remain open. [Animation and technical review](../quality-review/animation-and-technical-review.md) · [Visual proposal](../quality-review/david-jesse-visual-brief.md) · [Performance baseline](../quality-review/q01-performance-baseline.md) · [Q02 probe](q02-quaternius-rig-probe.md) · [Clothed David](q02-david-clothed-sample.md) · [Clothed Jesse](q02-jesse-clothed-sample.md) · [Two-actor exchange](q02-david-jesse-exchange.md) · [Q03 movement checks](q03-movement-and-browser.md) · [Q04 village exchange](q04-village-exchange.md)

**Deliver one polished village sequence before adding the camp, battlefield or more characters.** The player approaches Jesse as David, starts a clearly acted conversation once, watches it proceed automatically with subtitles, regains control, visibly collects the provisions and completes/restarts the village. The result must remain responsive on desktop and mobile browsers.

Related: [project implementation plan](implementation-plan.md), [existing task schedule](../roadmap/technical-task-breakdown.md#schedule-and-ownership), [approved product choices](a02-decision-record-2026-10-29.md), [story draft](../story/david-and-goliath-story-proposal.md), [performance plan](low-end-device-performance-plan.md), [B06 evidence](b06-vertical-slice-2026-11-09.md).

## Scope and decisions carried forward

- Keep Godot **4.7.2**, matching web templates, GDScript, Blender **4.5.15 LTS**, explicit GLB exports, Compatibility rendering, the single-thread browser build and the existing launch shell. No engine migration or supporting backend is planned.
- Preserve player movement/collision, touch adapters, camera obstruction handling, contextual interactions, guarded story events, responsive UI, pause/restart and export checks. Extend their contracts where the new sequence needs them.
- Keep the approved illustrated 3D direction. “Realistic animation” is interpreted as believable weight, timing and acting; photorealistic rendering has not been approved.
- Cover David, Jesse, their conversation, provisions and the existing village only. Running, full voice acting/lip sync, complex IK, crowds, baked-GI infrastructure and a custom engine build are conditional or later work.
- Automatic dialogue is the owner's requested change. It replaces mandatory repeated advances in the old Jesse draft; it does not automate exploration, provisions collection or the future sling action.
- Reference David's approximate era using the research direction and qualifications in the review. Q01 must distinguish sourced historical references from artistic adaptation. Do not copy Lagos Life's modern setting or assets.
- The frozen **B06-20261109-01** is the comparison baseline. The owner subsequently chose browser responsiveness for mobile acceptance. First-time-player observation is still open.

## Schedule and ownership

The **target is ten working days for this quality sample**, with a credible effort range of **8–15 person-days (48–90 focused hours)**. One person-day is six focused hours. Segun works with the assistant; there is no assumed second developer, artist or QA employee. Estimates include local verification and ordinary corrections, but exclude participant time, approval/access delays and bespoke asset production beyond the selected route.

Illustrative dates assume a **10 November start**, weekdays only, suitable reusable assets and prompt owner review. They are a proposed schedule, not a committed start or delivery date. Recalculate if the actual start/capacity differs.

| Task / priority | Milestone | Target allocation and dates | Effort range | Dependencies | Ownership | Links to existing work |
|---|---|---|---|---|---|---|
| Q01 / Critical | Visual, story and technical baseline settled | Day 1: 10 Nov | 0.5–1 pd | Review | Assistant prepares; Segun reviews sample/content and constraints | A02/A05/A06, D04 |
| Q02 / Critical | Distinct characters and usable animation assets | Days 2–4: 11–13 Nov | 3–5 pd | Q01 asset/rig direction | Assistant asset/integration work; Segun art review | C04 |
| Q03 / Critical | Natural movement and action blending | Day 5: 16 Nov | 1–2 pd | Q02 stable rig and clips | Assistant | B02/C04 |
| Q04 / Critical | Acted conversation, pickup and safe control handoff | Days 6–7: 17–18 Nov | 1.5–3 pd | Q01 script; Q02–03 clips/controller | Assistant; Segun presentation review | B04/B05, bounded C01/C02/C05 work |
| Q05 / Critical | Village lighting, materials and clarity pass | Day 8: 19 Nov | 1–2 pd | Q01 references; representative Q02 assets | Assistant; Segun visual review | B03/D03/D04/D05 |
| Q06 / Critical | New exported candidate and recorded quality decision | Days 9–10: 20 and 23 Nov | 1–2 pd | Q03–05 integrated; device/player access | Assistant technical checks; Segun devices/player observations | A04/B06, D04/D05/E01 |
| Q07 / Important | Sound, ambient movement and secondary polish | After critical acceptance; no fixed date | Re-estimate after Q06 | Measured headroom; assets/rights | Assistant; Segun review | D03 |
| Q08 / Optional | Advanced features only when justified | Deferred | Not included | Explicit need/budget | Owner decision | Later work |

At the upper critical estimate, sequential work reaches **30 November** from this assumed start, even before external delays. Bespoke character/motion production can add **5–10+ person-days**. The ten-day target assumes a suitable asset route, which is not yet established; no purchase or artist is budgeted. If that route fails, revise the estimate in Q01 rather than substituting another placeholder and declaring quality complete.

The target **23 November milestone is a village quality sample, not the full episode**. Preserve 30 November as the release decision; reforecast the remaining episode once the asset route and measured progress are known. Q work partly delivers existing B/C/D tasks, so do not simply add its total to every original estimate or mark those whole-episode tasks complete. Original dates/statuses remain historical in the roadmap/workbook.

Assistant-owned work is sequential. Segun can gather references, review samples and arrange device/player access independently. Conversation data preparation may overlap asset preparation when it does not alter shared scenes; integration waits for the rig/clip contract. There is no parallel editing of the same rig, village scene, player controller or project settings.

## Q01 — establish the quality target and performance baseline

**Objective:** make the next asset and presentation work concrete enough to judge before investing in it.

1. Verify the frozen candidate/source identity against the review; retain the screenshots and old build. Record current source hashes before future changes. Document a reliable Python interpreter/launcher because bare `python` failed on this host; avoid a hard-coded dependency on a temporary runtime version.
2. Prepare a compact art/reference sheet: David and Jesse silhouettes, age distinction, clothing/material palette, face readability, courtyard construction and one conversation composition in portrait and landscape. Trace historical references and label adaptations. Direct Lagos Life character footage remains unavailable; use a supplied accessible clip if one becomes available, without blocking our own measurable quality target or claiming parity.
3. Timebox asset selection to half a day within Q01: assess an available reusable model/rig/motion route, source and redistribution rights, editable source and retargeting effort. No paid acquisition is assumed. If none is suitable, propose a scoped original-art route with a revised estimate and sample deliverable. Do not enlarge the current primitive mesh and call the quality gap resolved.
4. Approve a small clip/rig contract and the draft shot sequence below. Produce a reviewable asset/shot proposal before seeking any necessary art/content/spend decision. Engineering preparation need not wait for decisions unrelated to it.
5. Capture a reproducible laptop baseline: same export, viewport, route and browser/version; default versus Extra light; diagnostics on/off; cold/warm load. Separate frame presentation intervals from Godot process time. Record draws, available memory indicators, network/power conditions and limitations. Use this to propose provisional asset/download/render budgets; do not invent a verified device minimum. Arrange physical-device access early, under the owner's existing access constraints.

**Delivered on 9 November:** character and shot board, asset candidate comparison and rights entries, rig and clip contract, desktop baseline, and conditional estimate. The recommended first Q02 step is a half-day rig and in-place walk probe. [Visual brief](../quality-review/david-jesse-visual-brief.md) · [Asset candidates](../assets/asset-register.md#q01-candidate-rights-and-provenance) · [Measurements](../quality-review/q01-performance-baseline.md)

**Exit:** one concrete art/asset route and scene treatment is selected; technical baseline and unresolved device/budget decisions are recorded. If art selection remains open, proceed only with reversible technical preparation and labelled sample assets.

## Q02 — improve characters, rigs and animation content

**Objective:** supply assets that can support the camera and acting; an AnimationTree cannot repair poor poses or weights.

- Create distinct David and Jesse variants using a compatible skeleton where practical. Improve face/hair silhouette, clothing shape and joint deformation; share materials/rig conventions without making the actors look like scaled copies. Start with readable eyes/head expression, not mandatory facial mocap or lip sync.
- Define metre scale, rest pose/orientation, bone mapping, weighted joints, hand/prop attachment, clip names and loop flags. Provide feet/wrists and shoulder/hip control appropriate to the chosen mesh. Use in-place locomotion with the existing CharacterBody3D owning translation; avoid competing root motion. Import reusable motions into a shared library only where rest-pose mapping actually matches.
- Produce the minimum clip set: relaxed idle, grounded walk, listen, greet, explain/point, acknowledge and reach/lift/settle for provisions. Idle/walk/listen loop; deliberate gestures and pickup play once. Provide start/stop/turn poses or clips only as needed to remove visible popping/pivoting; keep them within this asset budget.
- Review contact/down/passing/up walk poses, knee/elbow bends, weight shift and garment intersections. Calibrate the walk's authored speed. Test save/reopen → GLB → Godot → browser, including two independent actors and retained actions after reimport.

**Likely files:** new production candidates beside `source-assets/proof/` and `assets/proof/`, character wrapper scenes under `scenes/characters/`, import settings and [asset register](../assets/asset-register.md). Keep the original proof assets available for comparison; create directories only when used.

**Exit/evidence:** front/side/three-quarter character views and short browser motion captures show distinct actors, credible joints/foot contact, appropriate loops and reliable attachments. Record triangles, materials, texture dimensions, transfer/memory cost and rights. Review at actual play size and conversation distance, including a phone-size layout; emulation is not physical-device acceptance. Reject assets that pass import checks but still look poor.

## Q03 — connect movement to animation

**Objective:** retain reliable control while making movement feel deliberate.

- Extend `scripts/characters/character_visual.gd` with a small AnimationTree/state-machine wrapper. Drive idle/walk blending and bounded playback rate from actual planar movement, including partial touch input and wall stops. Keep one playback owner per actor; remove unconditional looping of every clip.
- Retain `scripts/player/player_controller.gd` collision and input contracts. Tune acceleration/braking, turning and animation transitions together; avoid instant rotational pivots, a fixed full-speed walk at every joystick magnitude and sliding after release. Add turn/start/stop states only where the reviewed motion needs them. Running remains deferred unless traversal later requires it.
- Provide semantic action requests with start/finish/cancel signals for Q04. Locomotion cannot interrupt a reserved one-shot pickup; gestures cannot leave walking disabled after cancellation. Keep story events out of the visual component.
- Check camera/render pacing with a fixed route. Apply physics interpolation only if measurement and video show a benefit; test reset/teleport and obstruction handling after any change. Preserve current camera collision rather than replacing it with cinematic logic.

**Exit/evidence:** compare standing start, slow/full touch movement, stop, 90°/180° direction changes, wall contact and restart from matching camera views. No obvious skating, loop pops or broken joints; no stuck inputs or camera penetration. Run affected movement/interaction checks and inspect the exported animation visually. Replace placeholder-specific assertions such as “exactly 11 bones” with checks for the new rig's required capabilities.

## Q04 — stage automatic dialogue and object handling

**Objective:** a single Speak action starts an animated exchange, then returns David to the player reliably.

Add a narrow conversation sequencer under `scripts/story/` with a small data resource and a camera-shot component. The proof controller delegates presentation to it; existing state remains authoritative. This is preparation for C01/C02, not a general narrative editor or completion of the full episode state system. Godot's [AnimationTree](https://docs.godotengine.org/en/4.7/tutorials/animation/animation_tree.html) supports the required blending, states and one-shots.

**Proposed first scene, approximately 20–30 seconds; wording/timing remain draft adaptation:**

| Beat | Acting and camera | Subtitle / result |
|---|---|---|
| Speak once | Suspend exploration input, clear held controls and face the actors toward each other; short unobstructed alignment only | Hide world interaction prompts |
| Jesse's request | Medium two-character composition; brief greeting, then explain gesture | “David, take these provisions to your brothers at the camp.” |
| Purpose | Jesse gestures toward the bundle; David listens | “Bring me news of how they are doing.” |
| David responds | Gentle framing change only if it helps readability; David acknowledges | “I will, Father.” |
| Jesse closes | Settle from gesture into idle | “The bundle is ready. Take it before you leave.” |
| Handoff | Ease back to exploration view; clear stale input | Accept `jesse_spoken` once, show provisions objective, restore control |

Use an unobstructed two-character framing fallback if alignment or a preferred shot would clip through geometry. Do not teleport actors through props or add a navigation system just for this scene. Maintain safe-area subtitles, speaker labels and accessible Pause/Skip/Replay controls in portrait and landscape. Auto-advance is the default; pause/read/replay remains available. Start subtitle timing around `max(3 seconds, word_count / 2.5)` per line, then adjust from observed reading comfort; this is a tuning proposal. No mandatory “I am ready” choice or repeated advance presses in this exchange. Voice is optional and must not gate completion.

**Lifecycle contract:** idle → alignment → playing → finishing → idle. Pause/focus loss freezes alignment, camera blend, actor actions, audio and subtitle clocks together. Resume continues the same beat. Normal finish or explicit skip enters one guarded finalisation path; elapsed wall time alone cannot advance the story while paused. Cancel/error releases input/camera/target reservations and leaves an uncompleted objective available to retry. Replay after completion is presentation-only and cannot rewind/duplicate progression. Full restart cancels outstanding callbacks and resets all sequence/prop state. Resize/orientation changes preserve a valid beat and reframe safely.

After the player walks to the provisions and chooses Take, play reach/lift/settle. Attach or visibly stow the prop at the authored contact event, and advance `provisions_collected` only through the existing guarded story owner. Cancellation before acceptance restores the uncollected world bundle; after acceptance, visual recovery restores the carried/stowed state. Repeated input, skip or late callbacks cannot duplicate the object/event. No new inventory system is needed.

**Exit/evidence:** exported normal, skip, replay, pause/resume, focus-loss, restart and interrupted-pickup cases all restore valid controls, camera, props and objectives. Actors remain visible during subtitles. Demonstrate the whole interaction with one initial Speak action. Retain exploration and the gate/restart journey.

## Q05 — improve village presentation within measured cost

**Objective:** make the existing space coherent, grounded and legible without multiplying environments.

- Apply the Q01 reference sheet to one representative courtyard: review the gateway, windows, stall and overly regular surfaces; introduce restrained plaster/stone/wood/cloth variation and purposeful props. Do not claim historical accuracy from an attractive palette alone.
- Add character grounding first. Compare a cheap mesh-based contact shadow and a limited directional shadow setup; generated meshes currently disable casting, so changing only the sun is insufficient. Tune ambient/direct light together. Bakeable UV2/geometry conversion is deferred unless this simpler route fails visibly.
- Compare current resolution caps with 2× MSAA and a measured sharper preset. Change one setting at a time and retain Extra light. [Godot's MSAA guidance](https://docs.godotengine.org/en/4.7/tutorials/3d/3d_antialiasing.html) describes edge-quality benefits and cost. Do not multiply the canvas by unrestricted device pixel ratio or introduce unavailable desktop effects.
- Move/rework the provisions label so the awning cannot obscure essential guidance; inspect near/far and portrait views. Keep UI text clear independently of 3D resolution. Tune the return to play and gate feedback for continuity.

**Exit/evidence:** same-view before/after screenshots plus moving-camera captures; actors visibly grounded, clear objectives, readable materials and accepted visual direction. Record cost per option on the same route before choosing a default. Geometry, shadow and texture increases must fit provisional budgets or prompt a documented tradeoff.

## Q06 — verify the improved browser candidate

**Objective:** decide from exported gameplay and actual observations whether story expansion can resume.

- Give the new runtime its own build identity, export/asset manifest and evidence directory. Preserve the old candidate. Adapt existing test/candidate tooling labels where needed: the current foundation wrapper accepts only B01–B05 evidence labels; do not overwrite or mislabel old evidence as a new quality run. Reuse packaging/hash protections and the restricted static server.
- Run targeted tests as systems change, then the integrated engine/browser regression once at the quality candidate. Extend tests for sequencer lifecycle, interruption, event idempotency and pickup ownership. Verify asset reimport and PCK exclusions. Existing passing checks do not substitute for new visual review.
- Check desktop play and mobile responsiveness in a browser. Use touch emulation in narrow portrait and landscape, including resize during the scene, subtitle legibility, simultaneous move/look and reaching the objectives. Physical handsets are optional under the owner's updated acceptance criterion. Use the laptop for timing, sustained play, sound and interruption checks.
- Evaluate the existing proposed floor of 30 FPS with the owner; the operational proposal is rolling one-second FPS below 30 for more than two consecutive seconds during normal play fails. Record load transitions separately. Aim for 60 FPS where feasible. Exact hardware, mobile threshold and numeric load/download/memory budgets remain unapproved; no universal-device claim. [Web-export guidance](https://docs.godotengine.org/en/4.7/tutorials/export/exporting_for_web.html) supports this Compatibility/WebGL 2 testing approach, not a guarantee for our build.
- Have at least one consenting first-time non-builder complete the village without coaching, then restart. Record actual time, hints/rescue, unclear controls, missed objectives, subtitle pace, camera comfort, perceived animation quality and whether they want to continue. Ask why. Unaided and assisted results remain separate; one pilot does not replace the later full-episode study.

**Exit:** the export launches, required controls and actions work, interruptions preserve progression, and the mobile browser layout passes in portrait and landscape. Record owner acceptance of the visual sample and the first-time-player observation. The owner's feedback calls for a lived-in village around 1000 BCE and an editable animated exchange. [Village story presentation plan](village-story-presentation-plan.md)

## Important and optional follow-up

**Q07 — Important:** add footstep contact cues, restrained location ambience, modest idle variation and occasional foliage/cloth movement only after Q06 establishes headroom. Verify audibly: cue timing, levels, mute, no double playback, pause/resume and browser audio startup. Record sound provenance. Finish interpreter/setup documentation and prepare a focused CI/version-control proposal for later authorisation. These improvements have no assumed completion date or hidden allowance inside the critical total.

**Q08 — Optional:** voice-over/lip sync, complex foot IK, running, advanced post-processing, baked-lightmap pipeline, custom WASM compilation or engine comparison. Add only when a concrete unresolved need warrants the cost. The current WASM payload dominates loading; mesh reduction does not solve that transfer cost. A custom template or alternative engine requires a measured loading/performance case, new maintenance/testing estimates and an explicit scope decision.

## Risks, decisions and fallback rules

| Issue | Required action / owner | Trigger and response |
|---|---|---|
| Suitable production asset route not established | Assistant prepares rights/quality/cost comparison; Segun selects art and any spend | No viable route within Q01: revise scope/time for original work or obtain a concrete artist quote; do not claim 3–5-day bespoke art is assured |
| Reference and historical/art decisions | Assistant prepares sourced examples and adapted scene; Segun/content reviewer reviews | No close-up Lagos Life access: retain comparison limitation. Period disputes: label adaptation and resolve before polishing affected assets |
| Script and voice scope | Segun reviews proposed original lines; assistant implements selected sequence | Default candidate uses timed subtitles and gestures. Voice/lip sync does not block the essential interaction |
| Mobile browser layouts and acceptance thresholds | Assistant verifies viewport and touch behavior. Segun reviews the scene and accepts thresholds. | Use local desktop and mobile browser emulation. |
| Added asset/render cost | Assistant measures after Q02 and each Q05 change | Sustained stalls or budget increase: isolate cause; reduce the costly option before adding scenery. Do not blame GDScript without a profile |
| Cutscene/pickup state bugs | Assistant owns lifecycle tests and recovery | Duplicate event, held-input leak or trapped control: block candidate acceptance until normal/skip/cancel/restart cases pass |
| Capacity and 30 November | Segun and assistant reforecast at Q01 exit and Q03 midpoint | Slippage consumes the quality window first; no silent removal of mobile, testing or the full story ending to preserve a date |

Only product/art/content, paid sourcing, access changes and delivery commitments need their relevant owner decision. Routine reversible engineering within the selected plan should proceed under the existing development authorisation; do not request repeated blanket permission. This turn prepares the plan and does not begin implementation.

## Evidence and handover

For every Q task, record actual start/finish, changed components, captured demonstration, checks executed/results, unresolved defects and the next gate. Use new evidence folders under `docs/implementation/evidence/`; keep observed results separate from proposed thresholds. Owner visual acceptance is distinct from technical import success. Update the [daily report](../roadmap/daily-progress-template.md) with demonstrable results, not file counts.

At Q06, deliver the new local candidate, comparison captures/recordings where possible, device and player observations, defect disposition, revised component/asset contracts and remaining episode forecast. Do not deploy, commit or push as part of this quality plan without the existing required authorisation.

The frozen Q05 candidate passed the laptop browser journey and provisional sustained performance floor. Web-only vertex lighting cut median first launch from 43.51 to 9.41 seconds in a separate export. The next visual review covers the revised village and editable exchange. [Q06 verification](q06-candidate-verification.md) · [Startup diagnosis and retest](q06-startup-profile.md) · [Village scene draft](village-story-presentation-plan.md)
