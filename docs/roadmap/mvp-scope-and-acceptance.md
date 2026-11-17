# MVP scope and acceptance

This roadmap records the earlier game-only scope and its acceptance history. The [revised PlayCanvas production blueprint](../implementation/playcanvas-production-blueprint.md) adds account, mission and durable save requirements for the production application.

Assessment date: 28 October 2026; owner decisions updated 29 October. Only directions explicitly given by the owner are approved. Detailed content, device baselines, numerical thresholds and date commitments remain open; the confirmed working team is Segun with the assistant.

Approval update, 29 October: the [owner decision record](../implementation/a02-decision-record-2026-10-29.md) approves a 10–15 minute episode as David, fixed outcome, assisted sling aiming, non-graphic ending, illustrated 3D, portrait and landscape play, no login/cloud saves and in-session checkpoints. The [A02 proposal](../implementation/a02-story-and-delivery-proposal.md) retains unapproved details as proposals. Physical laptop/Android/iPhone availability is owner-reported; exact models remain unknown.

Related: [roadmap](development-roadmap.md), [gap analysis](requirements-gap-analysis.md), [tasks](technical-task-breakdown.md), [risks and decisions](risk-and-decision-register.md), [daily report](daily-progress-template.md).

Implementation update, 9 November: [B03 representative village](../implementation/b03-village-2026-11-09.md) is locally playable under the owner’s task authorisation. No new product scope or numerical acceptance threshold is approved by that implementation. Physical-device/G1/G2 and final art/content decisions remain open.

B04 update, 9 November: [reusable interactions](../implementation/b04-interaction-2026-11-09.md) now have local evidence for prompts, range/obstruction and once-only acknowledgement. Target-phone usability, human clarity and full-episode coverage remain open. No acceptance threshold changes.

B05 update, 9 November: [responsive UI and recovery](../implementation/b05-responsive-ui-2026-11-09.md) now have local engine/export evidence, including compact layouts and readable actions. Physical-phone usability and G1/G2 acceptance remain open. No scope or threshold changes.

B06 update, 9 November: [EV18 preparation](../implementation/b06-vertical-slice-2026-11-09.md) freezes the locally tested slice and supplies the [session guide](../testing/b06-session-guide.md). Availability of an Android phone and first-time player is owner-reported; actual observations and G2 disposition are still absent. HTTPS is required for phone delivery. No acceptance threshold changes.

## Sources and authority

- **S**: [Project Specification](../../Bible_Comics_Project_Specification.docx), fully read, including tables and ancillary text. The owner confirmed that this file is the intended boss-facing specification; the requested `_for_Boss` filename is unnecessary.
- **T**: [Technical Implementation Plan](../../Bible_Comics_Technical_Implementation_Plan.docx), fully read, including tables and ancillary text. It governs the proposed engineering approach, subject to validation.
- **U1**: Original roadmap request in this chat: one high-quality episode, assessment only, no implementation or deployment during this task, release decision on 30 November 2026.
- **U2**: Owner's subsequent direction on 28 October: reconcile around players acting as the character, a web app with good mobile responsiveness, and around two weeks of development. This supersedes desktop-first delivery and the documents' longer development schedule.

- **U3**: Owner’s scoped A02 approval and team/device reply on 29 October, recorded in the linked decision record. This approves only the listed choices and confirms Segun working with the assistant; it is not a separate boss sign-off.
- **U4**: Owner's subsequent 29 October instruction: keep the app light and playable on devices with the bare minimum modern capacity. Lower-capacity device suitability is required; specific hardware and numerical thresholds still need evidence. See the [lightweight delivery plan](../implementation/low-end-device-performance-plan.md).

S §4 identifies David as the player character. U2 resolves T §8's conflicting “meet David” journey in favour of **playing as David**. Use conversations with other approved characters; do not implement a separate David NPC or the sample `DAVID_CONVERSATION` state unchanged. U2 also resolves S's mixed mobile wording and T's laptop-first restriction in favour of **responsive desktop and mobile web delivery**. Native mobile apps and special hardware remain outside scope.

The interpretation used for planning is that mobile responsiveness covers the playable experience, not only its landing page: touch input, legible dialogue, reachable controls and suitable browser performance. Portrait and landscape play are approved under U3; supported device models and browser versions remain open in DEC-03–DEC-04. Two weeks is interpreted as ten weekdays, 28 October–10 November, including assessment; the retained 30 November release decision follows validation. DEC-12 records the confirmed team and the still-open date interpretation, daily capacity and delivery commitment. None of these planning dates indicate work already completed.

## Must have

| ID | Scope | Basis and implementation boundary | Acceptance |
|---|---|---|---|
| M01 | One complete David and Goliath episode, played as David | S §§3–6; U2/U3. Approved 10–15 minute target and fixed outcome; final objective/adaptation details and dialogue remain for review. | Opening, exploration, objectives, interactive climax and clear ending form one continuous journey. |
| M02 | Village, connecting route and battlefield | S §6; T §§2,7. Small modular areas are acceptable; no open world. | All three settings serve an objective or meaningful discovery and connect without state repair. |
| M03 | Movement, third-person camera, collision and safe navigation | T §§2,6; S §6. Keyboard/mouse plus touch movement, look and interaction under U2. | A first-time player can reach required locations on each approved device. No required route traps the player. |
| M04 | Character and selected-object interactions | S §§4–6; T §6. Clear contextual prompt, response and once-only event handling. | Approach, interact, leave and re-enter behave correctly, including touch input. |
| M05 | Dialogue, limited choices, objectives and explicit story states | S §6; T §§4,6. Choices may rejoin the same canonical storyline. No large branching tree. | Every allowed transition works; invalid, duplicate and out-of-order triggers cannot skip or block progress. |
| M06 | A playable dramatic encounter and conclusion | S §§4,8; T §8; U3. Assisted sling aiming and non-graphic ending approved; tuning and final text still require implementation/content review. | The player performs an action that affects progression through the encounter, receives feedback, can retry, and reaches an ending. A passive cinematic alone fails. |
| M07 | Coherent environment, character animation, audio and action feedback | S §§5,6,13; T §§6,7. Reuse licensed assets and a small reliable animation set. | Owner reviews the candidate against an approved art reference; actions and locations are understandable in observed sessions. |
| M08 | Responsive web app with desktop and mobile gameplay | U2; S's mobile wording. Touch-usable HUD and dialogue, loading screen, browser entry, resizing and orientation handling. U3 approves playable portrait and landscape layouts; actual compatibility remains subject to early feasibility testing. | No essential control/text clips or becomes unreachable across approved viewport sizes. Keyboard/mouse and touch journeys both complete. |
| M09 | Opening, loading/error guidance, pause, restart and recovery | S §§6,8; T §§4,6. U3 approves in-session checkpoints and excludes cloud saves; cross-session resume remains deferred. | Fresh start, pause/resume, retry, reset and full replay work. Storage denial and load failure give guidance and a valid restart path. |
| M10 | Exported-browser and deployment validation | S §§7–9,13; T §§3,11,13. Godot/tooling and A05 asset pipeline are verified; A04 has an exported local interactive proof. Physical-phone/device suitability and hosting remain unverified. | Build runs from a web server on approved real devices. Final hosted candidate matches the tested package. |
| M11 | Functional, performance and external-user evidence, including lower-capacity devices | S §§8,9,13; T §§11,13; U4. Prioritise low resource use; evidence must name build and environment. A powerful-device run alone does not establish the intended minimum support. | Gates G0–G6 pass, including representative low-capacity device evidence, or release is withheld and remaining work recorded. |
| M12 | Asset rights, operating instructions, known limitations and owner release decision | S §§11–13; T §§7,13. | All shipped assets have recorded source/licence/attribution, handover is usable, owner records go/no-go. |

## Should have

| Item | Recommendation and fallback |
|---|---|
| Same-device resume after closing the browser | Add only after DEC-07; simplify to safe session checkpoints and a clear restart if time or storage behaviour is unreliable. Do not imply cross-device saving. |
| Extra incidental conversations, object details and ambient animation | Add only after the full journey passes G4; retain enough interaction and presentation to meet M04 and M07. |
| Richer spatial sound, transitions and effects | Simplify effects and lighting before sacrificing readability, frame rate or completion. Core sound and feedback remain must-have. |
| Wider browser/device support | Add to the matrix after primary desktop, Android and iOS choices are agreed and tested. Do not advertise untested combinations. |
| Automated export CI | Desirable after the local export is repeatable. A documented, reproducible manual export plus essential logic tests can support this first release. |

## Later or conditional

| Item | MVP treatment |
|---|---|
| Additional episodes, multiplayer, AR/VR, open world, complex combat/crafting/economy | Later, explicitly excluded by S §6 and T §2. |
| Native mobile applications, app-store packaging, gamepads | Later; responsive mobile browser delivery is required now. |
| Login and accounts | Excluded from the first episode by U3 / DEC-06. Implement direct play. Adding login requires a new scope decision and estimate. |
| Cloud persistence, database and backend | Cloud saves excluded by U3 / DEC-07. No backend required by the approved episode. Revisit only for a defined later requirement. |
| React/Next.js shell | Optional T §3. A responsive Godot export entry page can provide a web app; a framework is not required solely because the product runs on the web. Add one only for approved access/product needs. |
| Analytics SDK, CMS, live AI dialogue, extensive administration | Not required by the sources. Use consented observation and a simple feedback route for validation; reconsider services only for a defined requirement. |
| Voice acting and photorealistic/custom animation production | Not required. Recommend text dialogue and a restrained consistent style; protect clear animation and sound already in M07. |

Optional services are not included in the task estimates. A new must-have replaces other work, adds named capacity or changes the date; it is not silently absorbed.

## Proposed quality gates

At assessment, only the review portion of G0 was verified. A03 now verifies the local tools, matching templates and minimal import/export workflow; see [A03 setup and verification](../implementation/a03-toolchain-setup-2026-10-29.md). Subsequent [A05/A04 proof and evidence](../implementation/a05-a04-proof-2026-10-29.md) records local interactive browser checks and measurements. G0/G1 as whole gates remain unpassed because content/device/budget decisions and physical phones are outstanding. Later full-episode gates remain unpassed; source numerical thresholds are still proposals, not boss approvals.

| Gate | Measurable acceptance | Verification and evidence | Decision |
|---|---|---|---|
| G0 Scope and readiness | Role and mobile direction reconciled; story map, baseline devices, browsers, art, staffing and encounter decisions recorded; tools/version/template pair known. | Decision entries with approver/date; tool version output; reviewed state diagram and asset sample. | Required before final content production. Owner directions alone do not complete G0. |
| G1 Browser feasibility | Tiny exported 3D scene loads, movement/look/interaction work, one GLB animation and audio cue play after user input, resize and touch work on the proposed desktop and real mobile matrix. | Export log, package identifier, device/browser/OS versions, browser console/network capture, short recordings and initial load/FPS readings. | 30 Oct stop/go. Missing phone tests mean feasibility remains unverified. |
| G2 Playable foundation | Navigate a representative space, interact with a character/object and see a dialogue/objective response using keyboard/mouse and touch. Prompts disappear correctly and repeated input does not duplicate events. | Scripted manual browser checklist and a first-time-user observation on the slice. | 3 Nov before expanding story content. |
| G3 Story correctness | Approved state graph has a valid path to battlefield; all transitions and guards tested; retries, scene revisits and checkpoints preserve valid state. | Engine-level transition/guard test results plus browser recordings of valid and invalid sequences. | 5 Nov before the complete encounter is integrated. |
| G4 Complete playable candidate | Opening to ending and full restart succeed without developer repair on each primary device; climax requires player action; all essential art/audio/UI are integrated. | Fresh-session end-to-end checklist for each device, replay and recovery results, candidate manifest. | 10 Nov development target; failure triggers replan, not a claim of completion. |
| G5 Quality and user validation | No known critical progression/usability defects; performance and user thresholds below met on the candidate. | Defect closure/retest links, measurement records and participant summaries. | Target 16 Nov, before release recommendation. |
| G6 Release readiness | Final hosted build equals the tested candidate; regression, licensing, instructions, limitations and rollback/re-upload procedure complete; owner records go/no-go. | Build hashes, hosted smoke/playthrough results, release checklist and dated decision. | Final decision 30 Nov. Hosting work here is a future task, not authorisation to deploy during assessment. |

### Performance and device protocol

T §11 proposes aiming for 60 FPS where practical, at least 30 FPS during normal gameplay on the agreed laptop, no persistent severe stutter, no memory growth causing a crash/major slowdown, and no unresolved critical runtime/WebGL/asset-loading errors. These are not observed results. Extending the 30 FPS floor to mobile is a **recommendation requiring DEC-04/DEC-09 approval**; no lower mobile bar is assumed.

Record exact device, CPU/GPU/RAM where known, OS/browser versions, viewport and render resolution, quality settings, power mode and network conditions. Use real phones; desktop emulation cannot establish thermal, touch, GPU or memory behaviour. Under U4, investigate an entry-level integrated-graphics laptop, a budget Android phone and an older/lower-capacity iPhone with maintained browsers and working web capabilities. The [lightweight delivery plan](../implementation/low-end-device-performance-plan.md) proposes initial 4 GB laptop / 2 GB Android test classes, without claiming these are verified minimums. Exact models, versions and minimum generations remain open. Both orientations are approved and must be tested. A low-detail setting must preserve the full journey and readable UI.

For each primary combination, measure cold load and warm load three times, then play through the episode and restart. Log frame time/FPS during navigation, dialogue, transitions and the climax; investigate every sustained sub-30 interval rather than hiding it in an average. Proposed operational definition for approval: a rolling one-second FPS below 30 for more than two consecutive seconds during normal gameplay fails; load transitions are measured separately. Observe three consecutive completion/restart cycles for crashes or accumulating slowdown. Set numeric compressed-download and time-to-interactive budgets by 30 October from the measured network/device baseline (DEC-10); they are currently **TBD**, not zero or passed.  

### Simple external user test plan

Recruit 5–8 people who did not build the game (S §9; T §11). Recommend eight, split across desktop and mobile, with Android and iOS represented; this is directional usability evidence, not a market study. Book sessions in Phase 1. Use a slice pilot by 3 November, complete-episode pilots on 9–10 November where a candidate exists, and the main cohort on 11–13 November. The main evidence must identify the tested build; do not combine incompatible versions into one success rate.

1. Obtain permission for notes/recording. Record participant code, device/browser, prior gaming familiarity, build, date and session length; avoid unnecessary personal data.
2. Ask the participant to open the link and begin without an explanation from the developer. Observe loading, orientation, first input and control discovery.
3. Ask them to explore, speak with a character, inspect a relevant object, work out the next objective and reach the battlefield. Do not provide step-by-step coaching.
4. Ask them to complete the encounter, find the ending and restart. Observe an ordinary pause/resume and recovery attempt where appropriate.
5. Record time to first movement and first meaningful interaction, unaided objective completion, each hesitation/wrong turn, hint requests, touch misses, text problems, stutter, defects and whether developer repair was needed. A facilitated rescue is a failed unaided attempt, even if the participant later finishes.
6. Ask: What were you trying to do? What was unclear? Did your actions feel consequential? What happened in the story? Which moment felt most engaging or least engaging? Would you replay, recommend it or try another episode, and why? What would stop you returning?

Suggested source threshold: at least 80% finish without developer intervention, no critical usability defects remain, and multiple people independently express interest in replay/another episode. At n=5/6/7/8 this means at least 4/5/6/7 unaided completions respectively. Recommend defining “multiple” as at least two people, without leading them; approval remains DEC-09. Report counts and failures by device as well as overall, since a pooled percentage could hide mobile failures. No device may retain a known critical blocker even if the overall percentage passes. Enjoyment ratings and quotes supplement behaviour; they do not replace it.

Participant record template: `participant | build | device/browser | tasks attempted | unaided completion yes/no | interventions | confusion and defect IDs | observed engagement | exact consented feedback | interest in another episode and reason`.

After material fixes, rerun affected scenarios and use new participants for changed onboarding where possible. If only repeat participants are available, state the familiarity limitation. Record actual observations separately from predictions. The original assessment ran no participant/game/performance tests. EV12 subsequently records local proof tests and measurements; **no participant sessions or physical-phone observations** have occurred.

### Defect and evidence policy

Critical: cannot launch on an approved device, cannot progress/finish/restart, needs developer state repair, crashes persistently, or essential mobile controls are unusable. Major: repeatable severe confusion, stutter or presentation failure threatening the quality bar. Minor: non-blocking cosmetic issue. All critical defects must be fixed and retested; unresolved major defects require explicit owner disposition and must not undermine a must-have.

Every evidence entry needs date, tester, build/package hash (commit when available), device/browser, steps, expected result, observed result and linked recording/log/defect. File existence, editor playback, screenshots alone and unexecuted checklists do not establish a passed gameplay gate.
