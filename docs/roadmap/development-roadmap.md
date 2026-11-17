# David and Goliath development roadmap

The [11 November project reset plan](project-reset-plan.md) is the current proposal for owner review. It records the full-scope desktop-and-mobile direction, approval gates and proposed later schedule. The roadmap below is retained as the earlier planning and implementation history.

Planning baseline: 28 October 2026. Aim for one complete playable candidate after roughly two development weeks, **10 November 2026**, then validate, fix and prepare the **30 November release decision**. The owner has changed the product to a responsive desktop-and-mobile web app in which the player acts as David. These directions supersede the conflicting mobile/player-role wording in the original documents.

Execution update, 29 October: [A03 setup and verification](../implementation/a03-toolchain-setup-2026-10-29.md) is complete. Godot 4.7.2, matching web templates and Blender 4.5.15 LTS are installed; the minimal fixture imports and exports successfully. The subsequent [A05/A04 proof and evidence](../implementation/a05-a04-proof-2026-10-29.md) verifies a representative original asset pipeline and an interactive exported courtyard. A05 is technically verified; A04 remains partial pending real Android/iPhone and supported-device measurements. Final art review is still open. Subsequent [B01 foundation preparation](../implementation/b01-foundation-2026-10-29.md) verifies reusable courtyard components without adding content, and the [A06 device/session register](../testing/a06-device-and-session-register.md) prepares validation logistics. B01/A06 remain partial; physical testing and bookings are not inferred. Owner-authorised [B02 hardening](../implementation/b02-movement-camera-2026-10-29.md) improves movement/camera and input lifecycle in the same courtyard; B02 remains partial pending phones/G1. This is still a conditional plan, not a guaranteed two-week delivery. The product specification remains the vision/quality authority; the technical plan supplies the engineering approach, with the owner's later instructions taking precedence.

Execution update, 9 November: [B03 village](../implementation/b03-village-2026-11-09.md) is locally verified after explicit owner authorisation, with art/physical-device/G2 acceptance open. Original B03 dates were 2–3 November. With only one further weekday until the 10 November candidate and C/D work still outstanding, that full-episode target is no longer a credible commitment. Segun and the assistant must reforecast from actual capacity and physical-device results. Preserve the original windows below as the baseline; 30 November remains the release decision date.

## Read the plan

Quality planning update, 9 November: follow the [Q01–Q06 improvement plan](../implementation/animation-quality-improvement-plan.md) for the existing David–Jesse village before extending the episode. Its illustrative ten-working-day target is 23 November if started 10 November; the 8–15 person-day range and asset/access uncertainty can extend it to 30 November or later. This is a quality sample, not the full episode. Reforecast remaining work after asset selection and measured progress; retain the original milestone table as historical baseline and 30 November as the release decision. No existing gate/task status is changed by writing this plan.

| Document | Purpose |
|---|---|
| [Project implementation plan](../implementation/implementation-plan.md) | Execution sequence for A01–F03, proposed architecture, component contracts and verification workflow |
| [A02 story and delivery proposal](../implementation/a02-story-and-delivery-proposal.md) | Approved product choices and remaining content/device/delivery decisions; includes dated owner decision record |
| [Requirements gap analysis](requirements-gap-analysis.md) | Actual repository/tool evidence and requirement statuses |
| [MVP scope and acceptance](mvp-scope-and-acceptance.md) | Must/should/later scope, source reconciliation, gates and user-test protocol |
| [Technical task breakdown](technical-task-breakdown.md) | Task goals, prerequisites, outputs, estimates, dates and completion evidence |
| [Risk and decision register](risk-and-decision-register.md) | Ranked threats, resolved directions, open approvals and owners |
| [Daily progress template](daily-progress-template.md) | Short evidence-based update for the boss |
| [Roadmap workbook](development-roadmap.xlsx) | Editable task tracker using the same task IDs and estimates |

Source documents: [Project Specification](../../Bible_Comics_Project_Specification.docx) and [Technical Implementation Plan](../../Bible_Comics_Technical_Implementation_Plan.docx). The owner confirmed the first file is the intended boss-facing specification. Neither source has been modified.

## Dates, capacity and feasibility

Owner update U4, 29 October: keep the app lightweight and playable on lower-capacity modern devices. The [performance plan](../implementation/low-end-device-performance-plan.md) applies this to A04/A05/B05/D04/D05 and their gates. Investigate weak hardware early; no extra features or automatic schedule change are introduced. Reforecast from actual results rather than promising universal device support.

There are **10 weekdays** from 28 October through 10 November, and **24 weekdays** through 30 November, inclusive. Weekends are not assumed available. One person-day means six focused delivery hours; the rest of a working day covers coordination and routine overhead. Leave, holidays and individual availability have not been supplied. A01 includes assessment in this window, so the full ten days are not ten additional implementation days.

Team update, 29 October: **Segun working with the assistant**, with physical laptop/Android/iPhone availability reported by the owner; see the [owner decision record](../implementation/a02-decision-record-2026-10-29.md). This supersedes the earlier two-engineer, artist and part-time QA assumption. The table retains the original human-effort estimates and role categories for comparison, not as available staffing or measured assistant productivity. The 10–15 minute length, assisted sling encounter, illustrated 3D, both orientations, no login/cloud saves and session checkpoints are now approved. Daily availability and device specifications remain unknown.

| Work / role | Low–high effort, pd | Interpretation |
|---|---|---|
| Phase 1 assessment and feasibility | 4.5–8 | Includes assessment, owner decisions, tooling, assets and booking |
| Phase 2 foundation | 5.5–9.5 | Desktop and touch input/UI both included |
| Phase 3 story systems and content | 7–12 | Includes early isolated character preparation |
| Phase 4 complete episode | 6.5–11.5 | Includes mobile hardening and profiling |
| Initial development total | **23.5–41** | Across contributors during the ten-weekday window |
| Phase 5 validation and fixes | 3.5–6.5 | Initial build is not automatically release quality |
| Phase 6 regression and handover | 2–3.5 | Includes future hosted verification and owner review |
| Full plan total | **29–51** | Before contingency; participant time and waiting excluded |
| Engineer 1, full plan | 8–15 | Assessment, player/state/recovery, encounter and fixes |
| Engineer 2, full plan | 8.5–14.5 | Web/mobile UI, interaction/dialogue, integration, optimisation/hosting |
| Artist, full plan | 7–12 | Modular assets, rigs, animation and essential polish |
| QA, full plan | 4.5–7 | Devices/bookings, slice, pilot, main cohort and regression |
| Owner/content review, full plan | 1–2.5 | Decisions, content approval and final review |

The earlier hypothetical team already needed lower-range effort to meet 10 November: engineering was estimated at 15–25.5 pd and art at 7–12 pd. With the confirmed user-and-assistant arrangement, that parallel-capacity model no longer applies. Retain estimates rather than invent an AI speed multiplier. Reforecast after the A03/A05/A04 proof and again at G2, including owner testing/review turnaround and contingency.

The task dates remain baseline stretch handoff windows, **not an executable resource-levelled commitment for the confirmed team**. The assistant sequences implementation and asset integration; Segun can supply device details, review content and arrange testers while independent technical work proceeds. Protect shared scene/config edits; no additional staff or weekend overtime is assumed.

A complete polished mobile-and-desktop episode in two weeks is not yet supported by measured delivery evidence. Keep 10 November as a stretch complete-candidate target and 30 November as the release decision baseline. If the proof shows the full episode cannot fit, recommend a technical slice milestone and an explicitly revised full-episode date. A slice is not completion of the requested episode. Do not cut mobile play, the climax, meaningful interaction or external validation silently. DEC-12 still needs a capacity-based date commitment; no new delivery date is invented here.

## Milestone calendar

| Phase | Proposed window | Priority | Milestone and exit |
|---|---|---|---|
| 1 Assessment and technical validation | 28–30 Oct | P0 | G0 decisions and G1 desktop/mobile feasibility |
| 2 Playable foundation | 2–3 Nov | P0 | G2 browser-playable vertical slice |
| 3 Story and interaction systems | 4–5 Nov | P0 | G3 continuous progression to battlefield |
| 4 Complete episode | 6–10 Nov | P0 | G4 opening-to-ending playable candidate |
| 5 Quality and user validation | 11–16 Nov | P0 | G5 required quality and observed user outcomes |
| 6 Release readiness and handover | 17–30 Nov | P0 | Regression 17–18, hosted candidate 19–20, protected fixes/retest 23–27, G6 decision 30 Nov |

Approved isolated character preparation may start 30 October (C04); participant recruitment starts in Phase 1. Candidate pilots/QA begin 9–10 November where a complete build exists, before the formal validation phase. These bounded overlaps preserve the gameplay gates. No dependent phase expands on a failed predecessor. Safe independent preparation may continue, with its status stated accurately.

## Phase 1 Assessment and technical validation

**Objective:** establish the true starting point and prove that the chosen browser stack can deliver the intended desktop/mobile experience before producing the world.

**Tasks:** A01 fully review sources and environment (completed by this assessment). A02 approve a concise story map, action loop, art reference and device/support scope. A03 tool/version/import verification is complete; use the pinned setup and evidence record. A05 import one licensed environment module and animated character. A04 build/export a tiny 3D proof with movement/look, touch interaction, one dialogue/objective response, animation, audio and loading guidance. A06 book real devices and external testers. Use generic approved placeholders while narrative decisions are pending; do not produce final story content without approval.

**Deliverables:** reconciled scope/gaps, decision entries, tool versions, asset sample/licence record, repeatable export settings, device matrix, initial frame/load observations, agreed numeric loading budget and a go/replan decision.

**Dependencies:** source review; owner availability; tool installation rights in a later implementation task; physical phones/laptop; representative asset rights; DEC-02 through DEC-13 as applicable. No engine or prototype exists yet.

**Priority, effort and dates:** P0, 4.5–8 pd across roles, 28–30 October. This phase itself is tight; the browser proof is the first major scheduling test.

**Acceptance and verification:** G0/G1 in [acceptance](mvp-scope-and-acceptance.md). Record real device/browser versions, exported build ID, animation/input/audio observations, console/network errors and measurements. Editor playback or desktop responsive emulation alone fails the mobile proof.

**Risks/blockers:** unverified real-device access and browser rendering/audio, incompatible rigs, unresolved content, device details and daily capacity. Tools are installed, but this does not resolve browser feasibility. If proof fails by 30 October, stop expansion and present an explicit stack/scope/date choice.

**Exit before Phase 2:** approved minimum story/scope, named baseline matrix, representative desktop/mobile export working and feasibility decision recorded. The no-login baseline is approved under U3; it does not complete the remaining scope/device/tool gates.

## Phase 2 Playable foundation

**Objective:** make a small representative place that a first-time user can enter, navigate and interact with on both input types.

**Tasks:** B01 agree component contracts and ownership. B02 implement movement, camera, collision, safe spawn and touch adapters. B03 assemble the limited village. B04 implement reusable interaction detection with clear prompts and once-only events. B05 build responsive entry/loading/help/dialogue/objective/pause UI. B06 integrate and test the slice in exported browsers and observe a first-time user. This is a small validated foundation, not a generic game framework.

**Deliverables:** player and interaction components, village subscene, responsive HUD, exportable slice, pilot observations and corrected critical slice defects.

**Dependencies:** G1, approved content sample and B01 contracts. The assistant sequences player, UI and asset integration in separate components; Segun supplies content review and device feedback. One editor owns integration scenes.

**Priority, effort and dates:** P0, 5.5–9.5 pd, 2–3 November. The two-day window requires lower-range effort and reused assets. If it slips, revise the candidate date at once.

**Acceptance and verification:** G2 requires a player to move, approach a character or object, see a prompt and get a dialogue or objective response. Test keyboard and mouse, touch emulation, portrait and landscape, reachability, repeated input and pause. Record browser layouts and first-time-player observations. Physical handsets are optional under the owner's updated responsiveness criterion.

**Risks/blockers:** touch controls obscuring the world, camera/collision problems, UI clipping, costly village assets or shared scene conflicts.

**Exit before Phase 3:** an exported slice passes the responsive browser checks and the core interactions. Record first-time play and owner review of the Iron Age village presentation. [Village story presentation plan](../implementation/village-story-presentation-plan.md)

## Phase 3 Story and interaction systems

**Objective:** give actions narrative meaning through explicit objectives, dialogue, guarded transitions and recoverable progress.

**Tasks:** C01 implement state/guard/objective logic and tests. C02 load approved dialogue/choices separately from scripts. C03 connect route and battlefield. C04 prepare the small compatible character animation set, beginning isolated asset work earlier where approved. C05 implement session checkpoints, reset and recovery. C06 wire and export continuous progression to the battlefield, including revisits and invalid-trigger checks.

**Deliverables:** tested state graph, dialogue/objective data, route/battlefield scenes, character actions and safe recovery. The story portrays David as player; T's separate-David state is replaced.

**Dependencies:** G2, approved script/map/encounter and input/state contracts. C01 schema precedes dependent dialogue/checkpoint integration. C06 requires all character/route/progression inputs; it cannot be declared done from isolated scenes.

**Priority, effort and dates:** P0, 7–12 pd; main integration 4–5 November, with approved C04 preparation 30 October–5 November counted once in this phase.

**Acceptance and verification:** G3. Exercise every allowed edge and denied transition, duplicate event, revisit, checkpoint and reset. Combine script-level results with a desktop/mobile browser journey to the battlefield. Record failed cases and subsequent retests.

**Risks/blockers:** narrative changes, dangling dialogue references, state duplication, imported rig problems and storage assumptions. Durable saving remains conditional; recovery is required regardless.

**Exit before Phase 4:** G3 passes, required data/character actions are available, and encounter design is approved. No production story path depends on debug controls.

## Phase 4 Complete David and Goliath episode

**Objective:** connect all essential content into a complete, interactive and coherent playable candidate by the end of the two-week build window.

**Tasks:** D01 implement the approved encounter with meaningful player action, feedback and retry. D02 integrate opening through ending and replay. D03 finish essential animation, environmental detail, material/lighting and audio integration. D04 profile and optimise load/frame/memory costs on actual devices. D05 harden touch controls, safe areas, orientation and tab-resume behaviour. Begin E01 pilot checks on a complete candidate as soon as one exists; do not record incomplete builds as full-episode passes.

**Deliverables:** G4 candidate export, complete journey/replay evidence, final core asset register, current performance traces and mobile usability checklist.

**Dependencies:** G3, approved encounter and animation availability. Final profiling follows full integration, even when early profiling runs in parallel. Ending work may follow the encounter event contract before final encounter polish, but acceptance requires both together.

**Priority, effort and dates:** P0, 6.5–11.5 pd across roles, 6–10 November (three weekdays). No extra episodes, backend or incidental branching enters this window.

**Acceptance and verification:** G4 and preliminary performance checks. Complete and restart from a fresh exported session on each primary device without manual state repair. The climax must involve the player; coherent presentation is reviewed against the approved reference. Capture the exact build tested and defects for Phase 5.

**Risks/blockers:** encounter too complex, passive sequence substituted for gameplay, late assets, mobile memory/performance failure and insufficient integration time.

**Exit before main Phase 5 cohort:** a complete candidate meets G4 and has no known critical blocker that would prevent meaningful user sessions. If G4 misses 10 November, report the miss and revised date; do not call an unfinished prototype complete. No new optional feature development after this target.

## Phase 5 Quality, performance and user validation

**Objective:** establish whether independent users can understand, enjoy and complete the actual browser episode, and correct observed failures.

**Tasks:** E01 execute the functional/device matrix and pilot sessions. E02 run 5–8 non-builder sessions, recording unaided completion, confusion, mobile control problems, story understanding and interest in returning. E03 prioritise/reproduce/fix/retest critical defects and confirm performance on the updated candidate. Follow the detailed participant protocol in [acceptance](mvp-scope-and-acceptance.md).

**Deliverables:** executed test matrix, consented observations, per-device completion counts, defect/retest records, updated performance evidence and G5 assessment. Assumed engagement is never reported as observed engagement.

**Dependencies:** G4, A06 bookings, approved thresholds and participant availability. Early pilots may be on earlier versions, but results must identify versions and cannot be pooled misleadingly.

**Priority, effort and dates:** P0, 3.5–6.5 pd, 11–16 November; E01 starts earlier on available candidates, E03 can begin with initial findings. This period includes corrective work, not new product features.

**Acceptance and verification:** G5, using source proposals pending approval: 5–8 external participants, at least 80% unaided completion, no critical usability defects and multiple independent expressions of interest. Also pass agreed device performance and story-flow checks. Every primary device must be usable even if the pooled completion percentage passes.

**Risks/blockers:** late sessions, coached completion, unrepresentative or missing mobile devices, substantial onboarding changes and lack of retest time.

**Exit before Phase 6:** critical issues closed/retested, candidate meets agreed thresholds, owner sees actual evidence and remaining limitations. If thresholds fail, recommend targeted improvements and delay rather than adding content.

## Phase 6 Release readiness and handover

**Objective:** present a reproducible, verified release candidate and an evidence-based recommendation for 30 November.

**Tasks:** F01 freeze and regress the candidate on 17–18 November. F02 prepare export/hosting instructions and, in a separately authorised implementation/release task, verify the hosted candidate on 19–20 November. F03 prepare the release recommendation, known limitations, asset attribution, controls/run/export instructions and future backlog. Reserve 23–27 November for required fixes/retests; any changed candidate invalidates affected earlier evidence. Hold the final owner decision on 30 November.

**Deliverables:** frozen package/hash, regression results, hosted build checks, operator handover, release recommendation, deferred backlog and dated go/no-go record.

**Dependencies:** G5, hosting/access decision, complete licence register and owner availability. This roadmap neither deploys nor supplies deployment authorisation. Missing future permission/access is reported as a blocked hosted gate.

**Priority, effort and dates:** P0, 2–3.5 pd of planned work across 17–30 November; the elapsed window includes review/buffer time, not thirteen days of assumed new engineering. Defect contingency is additional, drawn from remaining capacity and re-estimated when known.

**Acceptance and verification:** G6. Fresh hosted-browser playthroughs/restarts pass on agreed desktop/mobile devices; the served package matches the candidate; critical defects are absent and retested; limitations and user evidence are available. Owner makes the release decision explicitly.

**Risks/blockers:** stale caches, host export settings, last-minute content edits, missing rights, inaccessible devices and treating the calendar date as approval.

**Exit:** owner records release, limited further testing or no-go with next actions. A no-go with honest evidence is preferable to a false completion claim. Future enhancements remain outside the first-episode gate.

## Critical path and immediate development order

The critical path is agreed story/device scope → tools and representative asset → desktop/mobile export proof → touch-usable exploration/interaction slice → guarded story progression/recovery → playable encounter and ending → external validation and fixes → frozen hosted candidate → owner decision. Asset sourcing and test booking must start early in parallel, but cannot replace these steps.

Next five actions after the A05/A04 local proof:

1. **A04/A06:** run the [physical-device checklist](../implementation/a04-device-test-checklist.md) on the weakest available Android/iPhone and record actual versions/results.
2. **A02/DEC-08:** review the delivered art sample and remaining detailed story text; the pipeline proof does not approve final portrayal.
3. **A04/DEC-09/10/12:** use desktop and phone evidence to agree practical budgets and reforecast capacity/dates before G1. The small proof does not establish full-episode cost.
4. **A06:** fill the prepared device/session register with real details and coordinate non-builder participants/retest times; blank slots are not bookings.
5. **B01–B03:** review the locally verified foundation and representative village, collect phone feedback and close G1/A02 prerequisites. The owner authorised B03 implementation; local tests do not waive physical-device/content gates. B04 reusable contextual interaction is now locally verified (EV16), with target-phone/G2 acceptance outstanding. B05 responsive entry, Controls, scrollable menus and loading/graphics recovery are locally verified ([EV17](../implementation/b05-responsive-ui-2026-11-09.md)), pending physical-phone usability/G2. B06 now has a frozen candidate and local verification ([EV18](../implementation/b06-vertical-slice-2026-11-09.md)); physical-device/player observations and G2 remain pending. Story expansion does not follow from a prepared checklist.

Send the [daily update](daily-progress-template.md) with build evidence, device coverage, current gate, next result and decisions. Do not count documentation, file creation or editor playback as completed gameplay. The original assessment created documentation only. Subsequent authorised A03/A05/A04 execution added tools, assets and the proof. No Git commit/push or deployment has been performed.

## Assessment verification and remaining limits

The six Markdown documents have valid local links. All 29 workbook task IDs, owners, dates, statuses, estimates, dependencies, outputs and acceptance entries were checked against the task data and Markdown schedule. Totals reconcile to 29–51 pd overall and 23.5–41 pd for initial development. Workbook formula recalculation was checked by changing and restoring an estimate; saved values, typed dates, formulas, filters, validation and frozen panes were read back from the exported file. The rendered workbook was visually inspected. Native Microsoft Excel was not opened, so native-application behaviour is not claimed. Both DOCX SHA-256 fingerprints remain unchanged.

Execution update after B06 slice preparation: engine/templates, animated asset import, reusable scene/input contracts, village routes/modules, reusable contextual interactions ([B04 evidence](../implementation/b04-interaction-2026-11-09.md)), responsive entry/help/modal/recovery UI ([B05 evidence](../implementation/b05-responsive-ui-2026-11-09.md)), fresh-copy import/export and browser regression evidence are recorded. B06 adds a separately frozen candidate and checked delivery, with actual phone/first-time-player observations still pending. Unfinished work includes real-phone gameplay/performance, the complete episode, hosting verification and external-user validation. Capacity, final narrative/art, supported device matrix, numerical budgets and hosting remain open. Login/cloud saves remain excluded by owner approval. These limitations are explicit future work, not passed gates.
