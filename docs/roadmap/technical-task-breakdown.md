# Technical task breakdown

Baseline 28 October 2026; updated 9 November. Dates remain proposed, non-resource-levelled windows. The confirmed team is Segun and the assistant; the responsibilities below replace the earlier hypothetical multi-person assignments. A01, A03 and the A05 technical asset proof are complete and verified; actual effort was not measured. A04 is partially implemented: an exported interactive courtyard exists, but physical-phone validation remains outstanding. Final art approval is separate from A05 pipeline verification. A06 now has a prepared device/session register, and B01 has bounded local foundation preparation; both are Partially implemented pending their outstanding prerequisites. B02 local movement/camera hardening is also Partially implemented pending phone/G1 acceptance. Owner-authorised B03 now supplies a locally verified representative village (EV15); art review, physical phones and G2 remain open. Baseline B03 dates were 2–3 November, while actual work is recorded 9 November. Reforecast the 10 November episode candidate; baseline windows below are not current delivery promises. B04 contextual interactions are locally verified (EV16), pending physical-phone usability/G2. B05 responsive UI/recovery has local exported evidence (EV17), with the same physical-device/G2 limitation. B06 preparation/local checks are recorded in EV18; actual device/player observations and G2 remain pending.

Execution update, 29 October: the [implementation plan](../implementation/implementation-plan.md) is written, [A01 revalidated](../implementation/a01-assessment-2026-10-29.md), and A02 product choices approved in the [owner decision record](../implementation/a02-decision-record-2026-10-29.md). A02 remains Requires clarification for detailed content and delivery baselines. Physical devices are owner-reported available; A06 inventory/bookings remain outstanding. [A03 setup and verification](../implementation/a03-toolchain-setup-2026-10-29.md) records passing tool/import/export checks; subsequent [A05/A04 proof and evidence](../implementation/a05-a04-proof-2026-10-29.md) records original animated assets and browser interaction evidence. Physical Android/iPhone, supported minimum hardware, hosting and final episode performance remain unverified.

Related: [roadmap](development-roadmap.md), [scope and quality gates](mvp-scope-and-acceptance.md), [gaps](requirements-gap-analysis.md), [risks and decisions](risk-and-decision-register.md), [task workbook](development-roadmap.xlsx).

One person-day (pd) means six focused delivery hours. Low/high ranges assume experienced contributors, reusable licensed assets, an approximately 10–15 minute single-path episode (length approved under U3), and no accounts/backend. Estimates include the task's local verification; E/F tasks add independent validation, regression and handover. They exclude participant time, waiting for approvals and optional services. Aggregate development A–D: **23.5–41 pd**; entire A–F: **29–51 pd** before contingency. Numeric dates are planning windows, not resource-levelled promises.

## Proposed engineering approach

**U4 performance constraint:** follow the [lightweight delivery plan](../implementation/low-end-device-performance-plan.md) in A04/A05/B05/D04/D05. Start with economical assets, small active areas and low-detail 3D rendering while preserving readable UI and the full story. Investigate entry-level laptop/budget Android/older iPhone classes early; exact device support and numerical budgets remain unverified. These are constraints within the existing tasks, not additional completed work or new parallel capacity.

Follow T §§3–7: Godot 4/GDScript, explicit state and objective services, content separate from mechanics, small reusable subscenes, and Blender-to-GLB assets. Keep a single Godot project at repository root unless the implementation owner has a documented reason for a subfolder; this is a recommendation, not an existing structure. Preserve the root DOCX files. Propose scenes for boot, player, village, route, battlefield, interactables and UI; scripts for input/player, interaction, story and recovery; data for dialogue/objectives; asset, test and documentation directories.

Use one authoritative story state owner. Suggested state labels, subject to the approved script, are INTRO, VILLAGE_OBJECTIVES, ROUTE_ACCESS, BATTLEFIELD_READY, ENCOUNTER and COMPLETE. These are design placeholders, not approved narrative beats. David is the player; do not preserve T's conflicting separate-David conversation state. Define transition prerequisites, emitted event IDs, checkpoint state, completion and reset invariants. Use signals/interfaces to connect interactions and UI. A tiny transition table and reusable interactable component are sufficient; no general-purpose narrative editor or backend is required.

Use the same gameplay actions through keyboard/mouse and touch adapters. Camera and story logic must not depend on the specific input device. Player navigation requires collision and constrained routes; navigation meshes/complex NPC pathfinding are conditional, only if approved character behaviour needs them. A static or simply animated NPC can fulfil an interaction.

The official [Godot web-export documentation](https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_web.html), checked 28 October, supports testing GDScript, Compatibility/WebGL 2 and single-thread export first. Web delivery needs WebAssembly support; C# web export is not supported in the consulted guidance. Threaded export adds cross-origin requirements. Browser input/audio, storage and mobile behaviour require actual export testing. This supports T's proposed spike, not a claim that this project works. Confirm details against the version pinned in A03.

The official [3D format guidance](https://docs.godotengine.org/en/stable/tutorials/assets_pipeline/importing_3d_scenes/available_formats.html) recommends glTF and supports GLB. Direct .blend import calls Blender. Recommend explicit GLB exports with source .blend files retained separately, documented scale/rig/material conventions and licence records, so browser-build dependencies stay predictable.

## Schedule and ownership

9 November quality-plan addendum: [Q01–Q06](../implementation/animation-quality-improvement-plan.md#schedule-and-ownership) is the proposed next execution sequence for improving the existing village. Its table maps quality tasks to these canonical IDs. The quality pass does not complete full-episode C/D work or close physical-device/G2 gaps; original estimates/dates/statuses below remain historical. Avoid double-counting shared asset, dialogue and profiling work when reforecasting.

P0 means essential to the approved episode or to proving its release readiness. P1 improves quality but can be simplified; P2 is deferred/conditional. The baseline tasks below are P0. Optional P1/P2 tasks are listed separately and excluded from totals.

| ID | Phase | Goal | Responsible | Estimate pd | Start | Due | Current status |
|---|---|---|---|---|---|---|---|
| A01 | 1 | Review sources and inspect repository | Assistant | 1–1 | 2026-10-28 | 2026-10-28 | Complete and verified |
| A02 | 1 | Approve the story and delivery decisions | Segun | 0.5–1.5 | 2026-10-28 | 2026-10-29 | Requires clarification |
| A03 | 1 | Locate and pin development tools | Assistant | 0.5–1 | 2026-10-28 | 2026-10-29 | Complete and verified |
| A04 | 1 | Prove desktop and real mobile browser export | Assistant | 1.5–2.5 | 2026-10-29 | 2026-10-30 | Partially implemented |
| A05 | 1 | Prove the asset pipeline and rights record | Assistant; Segun review | 0.5–1 | 2026-10-29 | 2026-10-30 | Complete and verified |
| A06 | 1 | Reserve devices and external testers | Segun + assistant | 0.5–1 | 2026-10-29 | 2026-10-30 | Partially implemented |
| B01 | 2 | Establish minimal scene and interface structure | Assistant | 0.5–1 | 2026-11-02 | 2026-11-02 | Partially implemented |
| B02 | 2 | Implement player, camera, collision and touch input | Assistant | 1.5–2.5 | 2026-11-02 | 2026-11-03 | Partially implemented |
| B03 | 2 | Build the representative village | Assistant; Segun review | 1–2 | 2026-11-02 | 2026-11-03 | Partially implemented |
| B04 | 2 | Implement reusable contextual interaction | Assistant | 1–1.5 | 2026-11-02 | 2026-11-03 | Partially implemented |
| B05 | 2 | Implement responsive entry and essential UI | Assistant | 1–1.5 | 2026-11-02 | 2026-11-03 | Partially implemented |
| B06 | 2 | Verify the browser vertical slice | Segun + assistant | 0.5–1 | 2026-11-03 | 2026-11-03 | Partially implemented |
| C01 | 3 | Implement story state and objectives with tests | Assistant | 1–2 | 2026-11-04 | 2026-11-04 | Not started |
| C02 | 3 | Implement dialogue and limited choices | Assistant | 1–1.5 | 2026-11-04 | 2026-11-05 | Not started |
| C03 | 3 | Build route and battlefield modules | Assistant; Segun review | 1.5–3 | 2026-11-04 | 2026-11-05 | Not started |
| C04 | 3 | Prepare characters, rigs and required animations | Assistant; Segun review | 2–3 | 2026-10-30 | 2026-11-05 | Not started |
| C05 | 3 | Implement checkpoint, restart and recovery | Assistant | 1–1.5 | 2026-11-05 | 2026-11-05 | Not started |
| C06 | 3 | Integrate progression to the battlefield | Assistant | 0.5–1 | 2026-11-05 | 2026-11-05 | Not started |
| D01 | 4 | Build the interactive dramatic encounter | Assistant | 1.5–3 | 2026-11-06 | 2026-11-09 | Not started |
| D02 | 4 | Connect full episode, ending and replay | Assistant | 1–1.5 | 2026-11-09 | 2026-11-10 | Not started |
| D03 | 4 | Integrate essential visual and audio quality | Assistant; Segun review | 2–3 | 2026-11-06 | 2026-11-10 | Not started |
| D04 | 4 | Profile and optimise browser runtime | Assistant | 1–2 | 2026-11-06 | 2026-11-10 | Not started |
| D05 | 4 | Harden mobile layout, touch and device behaviour | Assistant | 1–2 | 2026-11-09 | 2026-11-10 | Not started |
| E01 | 5 | Run complete-path QA and early external pilots | Segun + assistant | 1–1.5 | 2026-11-09 | 2026-11-11 | Not started |
| E02 | 5 | Observe external user validation | Segun + assistant | 1.5–2 | 2026-11-11 | 2026-11-13 | Not started |
| E03 | 5 | Fix and retest critical quality issues | Assistant | 1–3 | 2026-11-12 | 2026-11-16 | Not started |
| F01 | 6 | Freeze and regress the release candidate | Segun + assistant | 1–1.5 | 2026-11-17 | 2026-11-18 | Not started |
| F02 | 6 | Prepare and verify browser hosting and handover build | Assistant | 0.5–1 | 2026-11-19 | 2026-11-20 | Not started |
| F03 | 6 | Prepare release recommendation and owner decision | Segun | 0.5–1 | 2026-11-20 | 2026-11-30 | Not started |

The assistant owns repository implementation, preparation and checks; Segun owns product/content decisions, physical-device execution and participant coordination. Joint QA means shared review, not a dedicated tester or guaranteed concurrent capacity. Original human-effort estimates are retained pending evidence from A03–A05. Execute assistant-owned tasks sequentially; independent owner device/tester work can overlap.

C04 asset preparation may start after A05 and content approval, before the Phase 3 gameplay gate; it is isolated asset work. E01 pilots start only on the available candidate, with final complete-path testing after G4. E03 fixes can start from pilot findings while E02 continues. These overlaps do not waive predecessor acceptance. Same-day dependencies require an explicit within-day handoff; if the predecessor slips, the successor date moves.

## Task definitions

### A01 Review sources and inspect repository

- **Goal:** Read both complete DOCX files, resolve source identity and inspect actual implementation/tool evidence.
- **Priority/status:** P0; Complete and verified. **Prerequisites:** None.
- **Subtasks:** Read narrative and tables; inventory Git and files; check tools without exposing credentials; record U2 overrides.
- **Expected output:** Six linked planning documents and evidence register.
- **Testable completion and evidence:** Source review, inventory and owner confirmation recorded in requirements-gap-analysis.md; this completes assessment only.

### A02 Approve the story and delivery decisions

- **Current evidence, 29 October:** [A02 proposal](../implementation/a02-story-and-delivery-proposal.md), [story draft](../story/david-and-goliath-story-proposal.md) and [owner decision record](../implementation/a02-decision-record-2026-10-29.md). Listed product choices approved; team confirmed as Segun + assistant; physical devices reported available. Detailed content, named devices and delivery thresholds remain open.

### A03 Locate and pin development tools

- **Current evidence, 29 October:** [A03 setup and verification](../implementation/a03-toolchain-setup-2026-10-29.md) and its saved logs/result. Godot 4.7.2, matching web templates and Blender 4.5.15 LTS installed; versions, background startup, headless import/scene, debug/release exports and release PCK exclusions passed. Browser/device compatibility is not claimed.

- **Goal:** Establish a reproducible Godot/GDScript and Blender environment for future implementation.
- **Priority/status:** P0; Complete and verified. **Prerequisites:** A01; DEC-05 toolchain selection resolved, browser suitability pending A04.
- **Subtasks:** Locate or install official releases when implementation begins; pair Godot with export templates; record version commands and tool paths.
- **Expected output:** Tool/version record, web templates and reproducible setup instructions.
- **Testable completion and evidence:** Godot and Blender version commands succeed; matching template is available; minimal project can open without import errors. These checks passed during A03; headless import does not establish graphical/browser rendering.

### A04 Prove desktop and real mobile browser export

- **Current evidence, 29 October:** [A05/A04 proof and evidence](../implementation/a05-a04-proof-2026-10-29.md) supplies the exported three-objective courtyard, original animated GLB, keyboard/mouse and touch controls, audio, pause/restart and targeted tests. Desktop/browser-emulation evidence is recorded separately from physical phones. A04 and G1 remain open for actual Android/Safari testing, target-device measurements and the proceed/replan decision.

- **Goal:** De-risk the browser runtime before building the world.
- **Priority/status:** P0; Partially implemented. **Prerequisites:** A03 (complete); A05 representative asset; DEC-03/04.
- **Subtasks:** Create a tiny scene; verify movement/touch, GLB animation and audio; use local HTTP and proposed HTTPS-host requirements; measure cold/warm load and frame time; set budgets.
- **Expected output:** Export package, settings, device/browser matrix and G1 evidence.
- **Testable completion and evidence:** Tiny scene is usable on each proposed primary real device with expected input/audio/animation; logs and measurements captured; owner/lead records proceed or replan.

### A05 Prove the asset pipeline and rights record

- **Goal:** Make one environment module and rigged character import reproducibly.
- **Priority/status:** P0; Complete and verified for the representative technical assets. **Prerequisites:** A03 (complete); owner explicitly authorised this proof using original samples. No external licence or spend is assumed. Final art selection remains DEC-08.
- **Subtasks:** Source sample assets; record source/licence/attribution; check scale, axes, materials and animations; export explicit GLB from Blender.
- **Expected output:** Representative GLB assets, naming/import convention and asset register. Delivered in [the asset register](../assets/asset-register.md), editable Blender sources and the repeatable generator; see [A05/A04 proof and evidence](../implementation/a05-a04-proof-2026-10-29.md).
- **Testable completion and evidence:** Imported model renders and animation loops correctly in A04 exported build; licence/attribution and re-export steps are recorded.

### A06 Reserve devices and external testers

- **Goal:** Protect validation time while development proceeds.
- **Priority/status:** P0; Partially implemented. **Prerequisites:** DEC-03/04/13; A01. Preparation is in the [A06 device/session register](../testing/a06-device-and-session-register.md); actual phone inventory/results, consent and bookings remain absent.
- **Subtasks:** Book 5–8 non-builders and physical devices; prepare consented observation sheet; reserve pilots, main sessions and retests.
- **Expected output:** Named device access and session booking plan using anonymous participant IDs.
- **Testable completion and evidence:** Devices available for A04; main sessions booked for 11–13 Nov and retest capacity reserved. No invented participants or results.

### B01 Establish minimal scene and interface structure

- **Goal:** Create only the reusable components needed for the first episode.
- **Priority/status:** P0; Partially implemented. **Prerequisites:** G1; A02 remain open. [B01 foundation preparation](../implementation/b01-foundation-2026-10-29.md) extracts the existing courtyard components and named input actions as bounded preparation under the owner's request to continue; this does not pass G1 or authorise broader story expansion.
- **Subtasks:** Define ownership and signals; organise player/world/UI/story/data/assets/tests; record input actions and export steps; propose version-control conventions.
- **Expected output:** Minimal project configuration, reusable subscenes and documented contracts. The [component contracts](../implementation/b01-component-contracts.md) now describe the implemented player, character, input, UI, world anchors and proof controller.
- **Testable completion and evidence:** Clean project opens/exports; state/UI/player contracts support independent work; no secret configuration in browser assets. Source-control actions require later authorisation.

### B02 Implement player, camera, collision and touch input

- **Goal:** Enable responsive third-person exploration on keyboard/mouse and touch.
- **Priority/status:** P0; Partially implemented. **Prerequisites:** B01 local contract is available; G1 remains open. The owner explicitly authorised this bounded controller/camera work. See the [B02 plan](../implementation/b02-movement-camera-plan.md) and [verification](../implementation/b02-movement-camera-2026-10-29.md). Physical-device usability and minimum-hardware acceptance remain outstanding.
- **Subtasks:** Implement movement/gravity, camera limits, collision, safe spawn and input abstraction; touch move/look simultaneously; pause/release pointer capture.
- **Expected output:** Player scene with keyboard/mouse and touch control adapters.
- **Testable completion and evidence:** Player traverses slopes/bounds without falling through or becoming trapped; simultaneous touch move/look works; resizing and pause do not leave stuck input.

### B03 Build the representative village

- **Goal:** Create a small navigable scene that establishes the story setting.
- **Priority/status:** P0; Partially implemented. **Prerequisites:** A05 and B01/B02 local components available. G1 and final A02 art/content decisions remain open. The owner explicitly authorised this representative village. See the [B03 plan](../implementation/b03-village-plan.md) and [verification (EV15)](../implementation/b03-village-2026-11-09.md). Local routes/export pass; art review, physical-device usability and G2 remain outstanding.
- **Subtasks:** Assemble modular village geometry, collision, spawn, NPC/object locations and readable routes; use simple lighting.
- **Expected output:** Village scene and reusable modules.
- **Testable completion and evidence:** B02 can reach every required interaction; no collision trap; visual reference and asset register respected; tested in export at G2.

### B04 Implement reusable contextual interaction

- **Goal:** Support characters and relevant objects with clear mouse/keyboard/touch actions.
- **Priority/status:** P0; Partially implemented. **Prerequisites:** B01/B02 local components available; owner explicitly authorised B04. [Prior plan](../implementation/b04-interaction-plan.md) and [verification (EV16)](../implementation/b04-interaction-2026-11-09.md) record generic target/detector components, obstruction/range/duplicate guards and exported contextual actions. Target-phone usability and G2 acceptance remain open.
- **Subtasks:** Detect available target/range; avoid through-wall prompts; show/hide prompt; debounce repeated input; emit one story event.
- **Expected output:** Interactable component and contextual UI action.
- **Testable completion and evidence:** In-range action fires once; unavailable/blocked/out-of-range actions cannot fire; prompt remains readable and reachable on target phone.

### B05 Implement responsive entry and essential UI

- **Goal:** Make loading, controls, objectives and pause usable across the supported viewports.
- **Priority/status:** P0; Partially implemented. **Prerequisites:** B01/A04 local components available; owner explicitly authorised B05. The [prior plan](../implementation/b05-responsive-ui-plan.md) and [verification (EV17)](../implementation/b05-responsive-ui-2026-11-09.md) record responsive entry/HUD, Controls help, scrollable modals and loading/graphics recovery. Physical-phone/browser-bar/safe-area usability, DEC-04 and G2 remain open. Actual execution: 9 November; original dates remain the baseline.
- **Subtasks:** Create entry/user-gesture start, loading/error/help, objective/dialogue placeholders, pause/restart and responsive anchors; account for safe areas and orientation policy.
- **Expected output:** Responsive game UI and minimal export entry page.
- **Testable completion and evidence:** Essential text/buttons remain visible after resize/orientation; touch targets do not overlap; load failure guides restart; desktop keyboard/mouse still works.

### B06 Verify the browser vertical slice

Use responsive desktop and mobile browser layouts for G2. The owner made physical handset sessions optional. The dated B06 record describes the earlier test matrix. [Current village acceptance plan](../implementation/village-story-presentation-plan.md)

- **Goal:** Prove entry, movement, interaction and objective feedback together.
- **Priority/status:** P0; Partially implemented. **Prerequisites:** B02–B05 local components integrated; physical acceptance remains open. The [prior plan](../implementation/b06-vertical-slice-plan.md) and [EV18 record](../implementation/b06-vertical-slice-2026-11-09.md) identify the frozen candidate, 26 candidate/delivery checks and 42 desktop browser checks. An Android phone and first-time player are owner-reported available; owner chose a laptop-only session. Actual player observations and G2 disposition remain pending; physical Android/iPhone coverage is deferred. Actual preparation: 9 November.
- **Subtasks:** Export immutable candidate; run input/range/pause checks on desktop/mobile; observe a first-time user; record defects.
- **Expected output:** G2 checklist, short recordings and pilot observations.
- **Testable completion and evidence:** User navigates and completes an interaction without developer state repair; failures are fixed/retested before story expansion.

### C01 Implement story state and objectives with tests

- **Goal:** Keep the episode deterministic and resistant to invalid progression.
- **Priority/status:** P0; Not started. **Prerequisites:** G2; A02 approved graph.
- **Subtasks:** Define typed states/event IDs; guard transitions; idempotent objectives; completion/reset invariants; automated transition and prerequisite tests.
- **Expected output:** Story/objective services, data schema and test report.
- **Testable completion and evidence:** All graph edges and forbidden transitions exercised; duplicate/out-of-order events cannot skip requirements; a valid path reaches the ending in logic tests.

### C02 Implement dialogue and limited choices

- **Goal:** Deliver clear conversations with testable choices and progression feedback.
- **Priority/status:** P0; Not started. **Prerequisites:** G2; C01 schema contract; A02 approved text.
- **Subtasks:** Separate content from mechanics; validate references/conditions; implement speaker/text/options/next-state; touch and keyboard navigation; avoid long text blocks.
- **Expected output:** Dialogue data, UI and choice handling.
- **Testable completion and evidence:** All options lead to valid nodes/states; cancellation/re-entry do not trap player; long approved text wraps legibly on primary phone.

### C03 Build route and battlefield modules

- **Goal:** Connect three limited settings around the required journey.
- **Priority/status:** P0; Not started. **Prerequisites:** G2; A05; A02; B03 modules.
- **Subtasks:** Assemble route and battlefield, spawn/transition markers, collision and landmarks; reuse materials/modules and constrain sightlines.
- **Expected output:** Route/battlefield subscenes and transition points.
- **Testable completion and evidence:** Every required route is traversable; transitions preserve player/objective state; target devices load areas without missing assets.

### C04 Prepare characters, rigs and required animations

- **Goal:** Supply a small compatible character/animation set.
- **Priority/status:** P0; Not started. **Prerequisites:** A05 import proof; A02 content/art approval.
- **Subtasks:** Adapt licensed rigs; verify naming/scale; prepare idle/walk/talk/react and approved encounter actions; avoid custom crowd systems; work in isolated assets.
- **Expected output:** Character subscenes and animation/action mapping.
- **Testable completion and evidence:** Required characters animate without broken skeletons/sliding severe enough to obscure actions; representative action plays in exported mobile and desktop builds.

### C05 Implement checkpoint, restart and recovery

- **Goal:** Make normal failures recoverable without developer tools.
- **Priority/status:** P0; Not started. **Prerequisites:** C01 state schema; B05; DEC-07.
- **Subtasks:** Track safe spawn/current objective/events; reset scene and state together; pause/resume; guard storage absence/invalid data; define reload fallback.
- **Expected output:** Recovery service and documented reset/checkpoint semantics.
- **Testable completion and evidence:** Retry and full restart restore valid state; denied/cleared storage and tab return do not create a dead end; optional persistence is not required for the loaded story.

### C06 Integrate progression to the battlefield

- **Goal:** Connect approved story events and verify the first complete sequence.
- **Priority/status:** P0; Not started. **Prerequisites:** C01/C02/C03/C04/C05.
- **Subtasks:** Wire scene triggers once; check choice effects; test revisits, checkpoint recovery and battlefield access; export candidate.
- **Expected output:** G3 evidence and continuous journey to encounter.
- **Testable completion and evidence:** Every required stage to battlefield can be completed with desktop/mobile inputs; forbidden shortcuts and duplicate completion are rejected.

### D01 Build the interactive dramatic encounter

- **Goal:** Deliver the climax as an understandable player action loop.
- **Priority/status:** P0; Not started. **Prerequisites:** G3; DEC-02 encounter approval.
- **Subtasks:** Implement approved action, timing/aim rules only as agreed, reactions, success/failure feedback and retry; integrate Goliath behaviour.
- **Expected output:** Playable encounter and state events.
- **Testable completion and evidence:** Player action is necessary to resolve encounter; success advances once, failure/retry works, touch and mouse controls are usable; no complex combat added.

### D02 Connect full episode, ending and replay

- **Goal:** Make a coherent opening-to-ending experience with replay.
- **Priority/status:** P0; Not started. **Prerequisites:** D01 completion contract; C06; C05; final acceptance after D01.
- **Subtasks:** Integrate opening, objectives, encounter and conclusion; connect ending/restart/feedback route; remove debug-only progression.
- **Expected output:** Feature-complete candidate and full journey checklist.
- **Testable completion and evidence:** Fresh session reaches ending and restarts on primary devices without commands, manual state repair or dead ends.

### D03 Integrate essential visual and audio quality

- **Goal:** Create consistent atmosphere and feedback using a restrained asset set.
- **Priority/status:** P0; Not started. **Prerequisites:** C03/C04; approved art/content; A04 audio proof.
- **Subtasks:** Tune materials/textures/lighting, blend required animations, add licensed ambience and action cues; avoid effects that fail mobile budgets.
- **Expected output:** Polished core path and final asset/attribution register.
- **Testable completion and evidence:** Owner reviews against approved reference; actions are legible; sound starts after user input; missing/harsh transitions and placeholder critical assets resolved.

### D04 Profile and optimise browser runtime

- **Goal:** Meet measured load/frame/memory budgets without removing essential interaction.
- **Priority/status:** P0; Not started. **Prerequisites:** G3 initial profile; D02/D03 final candidate; DEC-09/10.
- **Subtasks:** Profile frame costs and load sizes; reduce excess geometry/materials/shadows/textures; validate animation cost and repeated-play memory; rerun final candidate.
- **Expected output:** Before/after traces and final baseline performance report.
- **Testable completion and evidence:** Agreed desktop/mobile performance gates pass on the final candidate; no critical console/asset errors; load and replay tests include real devices.

### D05 Harden mobile layout, touch and device behaviour

- **Goal:** Make the complete episode usable in real mobile browser conditions.
- **Priority/status:** P0; Not started. **Prerequisites:** B02/B04/B05; D02 integration; DEC-03/04.
- **Subtasks:** Test device safe areas, address-bar resizing, approved orientation, multitouch, suspension/resume and sustained play; fix overlapping controls/text.
- **Expected output:** Mobile checklist and corrected layouts/input behaviour.
- **Testable completion and evidence:** Every required action is achievable on each approved phone; no clipped objective/choice/ending control; resume and orientation behaviour follow approved policy.

### E01 Run complete-path QA and early external pilots

- **Goal:** Find progression and usability problems before the main cohort.
- **Priority/status:** P0; Not started. **Prerequisites:** D02 candidate for complete-path tests; A06; earlier slice may be piloted separately.
- **Subtasks:** Cover keyboard/mouse/touch, all story edges, invalid inputs, load/retry/reset, orientation, audio and browser errors; pilot only available builds.
- **Expected output:** Executed matrix, defect log and pilot notes.
- **Testable completion and evidence:** Each result names build/device/steps; unfinished paths recorded as failures/unavailable, not passed; G4 evidence ready for main sessions.

### E02 Observe external user validation

- **Goal:** Measure comprehension, completion and interest in another episode.
- **Priority/status:** P0; Not started. **Prerequisites:** G4; E01; A06; DEC-09/13.
- **Subtasks:** Run 5–8 non-builder sessions; observe without coaching; record per-device outcomes, interventions, confusion, feedback and independent interest.
- **Expected output:** Participant records and counts with limitations.
- **Testable completion and evidence:** Unaided rate and device-specific failures calculated correctly; recommended 80% threshold and interest evidence assessed, not invented; no incompatible-build pooling.

### E03 Fix and retest critical quality issues

- **Goal:** Close observed blockers while protecting the approved scope.
- **Priority/status:** P0; Not started. **Prerequisites:** E01/E02 findings; final exit after E02.
- **Subtasks:** Reproduce/severity-rank defects; implement targeted fixes; retest affected state/input/device flows; use new users for changed onboarding where practical.
- **Expected output:** Defect closure links and G5 evidence on latest candidate.
- **Testable completion and evidence:** Zero known critical progression/usability defects; performance regressions checked; material changes trigger fresh relevant evidence. No optional features.

### F01 Freeze and regress the release candidate

- **Goal:** Verify the exact candidate to be packaged for release.
- **Priority/status:** P0; Not started. **Prerequisites:** G5; E03.
- **Subtasks:** Freeze scope; run full fresh/replay journeys on all primary devices; check licences/limitations; record immutable package hash.
- **Expected output:** Regression report and frozen candidate manifest.
- **Testable completion and evidence:** G0–G5 evidence is current for candidate, all critical defects fixed/retested, no untested last-minute changes.

### F02 Prepare and verify browser hosting and handover build

- **Goal:** Provide a repeatable release package and verified hosted candidate.
- **Priority/status:** P0; Not started. **Prerequisites:** F01; DEC-11; future deployment authorisation.
- **Subtasks:** Document export/hosting MIME/HTTPS/cache/compression; deploy only in a later authorised execution task; compare hashes; test uncached launch/playthrough and rollback procedure.
- **Expected output:** Release package, operator runbook and hosted-browser evidence.
- **Testable completion and evidence:** Hosted build matches frozen candidate and passes primary-device end-to-end checks. Without authorisation/access, report hosted verification blocked; do not claim G6 passed.

### F03 Prepare release recommendation and owner decision

- **Goal:** Give the boss a clear evidence-based go/no-go and maintainable handover.
- **Priority/status:** P0; Not started. **Prerequisites:** F01/F02; final evidence after any buffer fixes.
- **Subtasks:** Summarise gates, user results, limitations, run/export instructions and deferred backlog; use 23–27 Nov only for required fixes/retests; record owner decision 30 Nov.
- **Expected output:** Release recommendation, limitations/backlog and dated owner decision.
- **Testable completion and evidence:** Owner can review actual candidate and evidence; go/no-go is explicitly recorded; no release claimed merely because the date arrived.

## Parallel work and integration rules

- The assistant sequences engineering and asset integration; Segun owns decisions, physical-device sessions and external tester coordination. These responsibilities replace the earlier hypothetical two-engineer/artist/QA assignments.
- Define input actions, event IDs, state schema, interaction interface and UI signals in B01 before dependent work. Shared root scenes, export settings and state definitions have one editor at a time.
- Keep asset preparation in separate source assets and character/world subscenes. Do not edit imported GLB internals; integrate known asset versions at C06 before verifying the full path.
- Use snapshots/build IDs at B06, C06, D02 and F01. Segun can test a fixed build while the assistant prepares a fix. Rerun affected paths after integration; do not treat evidence from an older build as final acceptance.
- The sequential gameplay chain is A03/A05 → A04/G1 → B01 → B02/B04/B05 plus B03 → B06/G2 → C01/C02/C03/C04/C05 → C06/G3 → D01 → D02/G4 → E02/E03/G5 → F01/F02 → owner G6 decision.
- Segun's A06 device inventory and participant booking can overlap independent assistant preparation. C04 asset work, profiling and documentation are separate work packages, but the confirmed team does not provide simultaneous assistant workers. Final performance checks require the final integrated candidate.
- More contributors do not make one shared story-state or root-scene edit parallel. Replan at the gate if handoffs cannot fit. Do not use weekend work or unconfirmed overtime to conceal a dependency conflict.

## Deferred or conditional tasks

| ID | Priority | Goal and prerequisite | Expected output | Completion condition |
|---|---|---|---|---|
| OPT01 | P1 | Add same-device durable resume only after DEC-07 and G4 | Versioned save format and restart fallback | Reload restores valid state; missing/old/corrupt/denied storage handled; browser matrix tested. Re-estimate before scheduling. |
| OPT02 | P1 | Automate reproducible export after A04/B01 | Pinned CI export/check workflow | Clean runner produces tested package; state tests run; no privileged credentials in output. Manual documented export remains fallback. |
| OPT03 | P1 | Add approved incidental art/dialogue after G4 and spare capacity | Extra content in existing path | No progression/performance regressions; new rights recorded. |
| OPT04 | P2 conditional | Authentication/cloud saves only after DEC-06/07 requirement and new estimate | Minimal access flow, scoped storage and service-failure recovery | Valid/expired sessions, ownership/access controls, unavailable service and save conflicts tested; core story remains usable after loading. |
| OPT05 | P2 conditional | Separate frontend shell only for approved product/access need | Responsive launch shell | Keyboard/touch launch and loading/error flow pass browser tests; no duplicate runtime/state ownership. |
| OPT06 | P2 | Further episodes/native apps/analytics platform | Future backlog only | A separate approved product requirement and capacity plan exist before work begins. |

## Required testing split

Automate the state graph, guards, duplicate events, reset/checkpoint invariants and dialogue references where practical. Use engine test scenes for collision, interaction range and animation events. Browser automation can send inputs through the exported canvas and verify resulting movement/state, entry and loading behavior. It does not establish physical-phone suitability, human touch usability, story comprehension or enjoyment. Perform manual exported-build checks and observed external sessions as specified in [acceptance](mvp-scope-and-acceptance.md). Run targeted regression after fixes and full candidate regression before release.

The original assessment created documentation only. A03 added pinned tools and fixture exports; A05/A04 added representative assets and an interactive local browser proof. Full-episode content, real-device validation and deployment remain incomplete; no CI or backend is implemented. The workbook records A03/A05 verification, A04 partial completion and A06 preparation. B01 now has locally verified scene extraction and contracts; it remains partial while G1/A02 are open. B02 now has movement/slope/camera and input-lifecycle hardening in the existing courtyard, with local verification recorded separately from untested physical phones. B03 now has reusable village modules, walkable required/optional routes and exported browser verification (EV15), pending art/physical-device acceptance. B04 now has locally verified reusable interaction targets/detection and acknowledgement, including exported contextual actions (EV16), pending physical-phone usability/G2. B05 now has locally verified responsive entry/HUD, Controls, modal scrolling and loading/graphics recovery (EV17), pending physical-phone usability/G2. B06 has a frozen candidate and locally verified test delivery/journey (EV18); physical-device and first-time-player observations remain pending. Phase C/full-episode integration remains planned.

