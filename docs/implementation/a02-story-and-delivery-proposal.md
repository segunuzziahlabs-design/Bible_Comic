# A02 story and delivery proposal

Version 1.1 — 29 October 2026. **Story/product choices approved; remaining content and delivery details open.** A02 remains **Requires clarification**. The [owner decision record](a02-decision-record-2026-10-29.md) captures the exact approval, confirmed user-and-assistant team and owner-reported physical devices. No runtime gate has passed.

Related: [detailed story, objectives and dialogue](../story/david-and-goliath-story-proposal.md), [implementation plan](implementation-plan.md), [decision register](../roadmap/risk-and-decision-register.md), [task schedule](../roadmap/technical-task-breakdown.md#schedule-and-ownership), [scope and acceptance](../roadmap/mvp-scope-and-acceptance.md).

## Recommended product direction

Deliver a **10–15 minute, third-person episode played as David**, using a coherent illustrated 3D style. The journey is home preparation → camp discovery → Saul and preparation → stream → an assisted sling encounter → a clear non-graphic ending. Use one fixed narrative outcome, short original dialogue, meaningful object/character interactions and a full replay option. The [story proposal](../story/david-and-goliath-story-proposal.md) supplies eight objectives, a state graph, recovery rules and draft dialogue for review.

Offer direct browser play with keyboard/mouse and touch controls. Provide the approved **playable portrait and landscape layouts**, with landscape suggested for a wider view but no mandatory rotation block. Keep accounts, cloud storage, full voice acting and a separate frontend framework outside the initial build. Provide session checkpoints and retry; closing/reloading the page starts a new run unless durable saving is later approved.

The owner approved the 10–15 minute target as David, fixed outcome, assisted sling aiming, non-graphic ending, illustrated 3D, portrait and landscape play, no login/cloud saves and in-session checkpoints on 29 October. The detailed story map/dialogue, input tuning, palette/sample, numerical thresholds and delivery particulars below remain proposals where not explicitly settled. See the [owner decision record](a02-decision-record-2026-10-29.md).

## Story and content decisions

| Proposal | Recommendation | Rationale and limit |
|---|---|---|
| P01 Story boundaries and length | Home errand through the immediate aftermath of the encounter; target 10–15 minutes excluding download | Fits the three required settings and one complete journey. Not a promise of measured play time. |
| P02 Player agency and climax | Explore, handle supplies, discover context, prepare and use assisted aim/release; one successful throw resolves the encounter | Keeps the climax interactive without a complex combat system. A timing-prompt fallback requires an explicit change decision. |
| P03 Dialogue and portrayal | Original short adaptation dialogue; faith context retained; fixed outcome; no graphic death depiction | Proposed core lines and omissions are visible in the story document. No Bible translation is selected for verbatim production use. |
| P04 Audience and presentation | General audience, including families; respectful tension and simple language | Editorial tone only. No certification or formal age rating is claimed. |

The approval covers the product choices listed in the decision record, not blanket approval of P01–P04 or every draft line. Review the objective order, adaptation boundaries and final dialogue before final content production. Generic engine/input/export work can proceed independently.

## Visual and audio direction

The owner approved **illustrated 3D**. The proposed refinement is stylised art with believable human proportions. Use readable silhouettes, textured-looking but economical materials, warm daylight and restrained shadows. The intended mood is an inhabited historical setting; avoid a toy-like character treatment or an attempt at photorealism within this first build.

| Element | Concrete direction |
|---|---|
| Palette | Sand `#D8C39A`, limestone `#E6DDC8`, earth `#926A4B`, muted olive `#747A55`, indigo accent `#48556A`; proposed reference colours, not locked materials |
| David | Youthful shepherd silhouette, simple clothing and visible sling/pouch; character remains recognisable in the small mobile view |
| Other characters | Compatible rig family where possible; differentiate role through silhouette, clothing and posture rather than many bespoke facial systems |
| Environment | Limited courtyard, path/stream modules, camp shelter and valley shapes; composition and landmarks matter more than map size |
| Camera | Third-person exploration; readable over-shoulder encounter framing; avoid camera shake required for gameplay comprehension |
| Animation | Locomotion, idle, conversation gesture, object interaction, sling action and encounter reaction; blend a small reliable set |
| Audio | Light ambience and focused interaction/encounter cues; independent volume/mute controls; all essential information also visible |
| Dialogue | Speaker-labelled text at the player's pace; no full voice-over dependency |

This written brief is the initial quality reference. A05 should produce one character/environment sample for review before the whole world is dressed. Asset selection remains conditional on rights and actual import/performance checks. Recommend existing assets with clear redistribution terms or original placeholders for proof; **no paid asset purchase is authorised by this proposal**. A free asset is not automatically reusable without checking its licence.

## Desktop and mobile delivery proposal

| Area | Proposed choice | Evidence still required |
|---|---|---|
| Game runtime | Godot 4/GDScript; start with Compatibility and single-thread web export | A03 pins tested engine/templates; A04 proves the runtime |
| Web entry | Minimal responsive HTML/CSS launch page around the export; loading/progress/error guidance | Real touch/mouse/keyboard launch and audio-start checks |
| Desktop controls | WASD/arrows, mouse look, contextual interact action, pause/help | Collision/camera/input tests in exported browsers |
| Mobile controls | Left-thumb movement area, right-thumb look/aim, explicit contextual Interact/Throw and Pause buttons | Simultaneous touch, finger release/cancel, safe areas and accidental-input checks |
| Orientation | Playable portrait and landscape; adapt HUD/dialogue and camera framing | Test both on actual phones; do not silently replace portrait play with a rotation screen |
| Access | Direct play, no login for first episode — approved 29 Oct | Verify direct entry in the exported build; no account implementation required |
| Progress | In-session safe checkpoints, encounter retry and full restart; page reload starts fresh | Clear user wording and recovery tests; no cross-session/cross-device promise |
| Supporting services | No database, cloud-save API, analytics SDK or separate React/Next.js application in the baseline | Re-estimate if a concrete requirement introduces one |
| Network | Online launch; design gameplay to avoid service calls after assets load | No offline/PWA guarantee; test relevant failures rather than assuming offline support |
| Feedback | Facilitated notes during tests; optional end-of-episode feedback route once chosen | Owner selects destination before an external link/form is enabled |

Portrait and landscape play are **approved by the owner on 29 October**. This supersedes the earlier unapproved landscape-with-portrait-guidance recommendation. A04/B05 must expose layout/camera effort early. If feasibility or schedule requires a change, present the tradeoff rather than silently dropping portrait support.

The [official Godot web-export guidance](https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_web.html), checked 29 October, supports early Compatibility/WebGL 2 and single-thread testing, while noting mobile and browser-specific constraints. This is the reason for a real-device feasibility gate; the project has not passed it.

## Proposed device and layout matrix

**U4 update, 29 October:** the owner requires lightweight play on lower-capacity modern devices. Apply the [lightweight delivery plan](low-end-device-performance-plan.md): use economical assets and rendering, investigate entry-level hardware early and preserve full gameplay on low detail. This strengthens the matrix below; the inspected 16 GB host alone cannot establish the intended minimum. Specific models and quantitative performance support remain unverified.

The owner reports having the physical laptop, Android phone and iPhone. Exact models, OS/browser versions, test access and minimum supported hardware remain unconfirmed. This is availability reported by the owner, not device validation. Do not request purchases before inventorying the available devices.

| Test ID | Proposed primary platform | Initial candidate / missing information | Required coverage |
|---|---|---|---|
| DEV01 | Windows laptop, Chrome and Edge | Candidate: inspected Windows 11 / Intel N150 / approximately 16 GB RAM / integrated Intel Graphics host. Confirm direct-device browser access and whether it represents the intended baseline. | Keyboard/mouse, window resizing, full journey, load/frame measurements; remote-display effects identified |
| DEV02 | Android phone, Chrome | Physical Android phone reported available; model, RAM if known, Android/browser versions and test access **to be supplied** | Touch, portrait/landscape, browser-bar resize, pause/resume, sustained play and whole episode |
| DEV03 | iPhone, Safari | Physical iPhone reported available; model, iOS/Safari version and test access **to be supplied** | Same mobile cases, especially audio start, memory, touch and tab return |

Record exact browser versions on the test date; do not invent version numbers or claim every device is supported. A launch browser family can be approved now, while minimum supported models remain unverified until identified and tested. Firefox, macOS desktop and tablets are additional coverage if capacity permits, not substitutes for either primary phone family.

Suggested layout test sizes in CSS pixels: 360×800 and 390×844 portrait, their landscape equivalents, and 1280×720 desktop. These are design test cases, not hardware performance claims. Proposed UI targets are at least 48×48 CSS-pixel-equivalent touch areas and 18-pixel-equivalent dialogue body text at the smallest test viewport; confirm practical sizing after Godot UI scaling is implemented. Keep objectives and choices readable without precision tapping. Use labels/shapes as well as colour for state feedback.

## Proposed release quality thresholds

| Measure | Recommendation | Source or next evidence |
|---|---|---|
| Completion and restart | Every required story stage works; fresh playthrough and replay succeed on each primary device; zero critical blockers | Source specification and roadmap gates; no results yet |
| Frame rate | Aim for 60 FPS where practical, with a 30 FPS floor on agreed baseline devices during normal play | Laptop target comes from T §11; applying it to phones is a recommendation requiring agreement |
| Sustained stutter | Investigate/fail a rolling one-second FPS below 30 for more than two consecutive seconds during normal gameplay | Proposed operational definition from the roadmap; separate loading transitions from normal-play samples |
| Load budget | Numeric cold/warm time-to-interactive and compressed-download limits set after A04 measurements | **TBD** until device/network baseline is known; no invented seconds or MB |
| Stability | Complete the episode and restart three consecutive times without crash, lost progression or accumulating severe slowdown | Proposed repeated-play check; not measured |
| External validation | Target eight non-builders, minimum five; at least 80% unaided completion; zero critical usability defects; at least two independent expressions of interest in another episode | Source proposes 5–8 people, 80% and multiple interested users; count of two makes the last criterion concrete for approval |
| Device balance | If eight users are available: four desktop and four mobile, with Android and iOS represented | Proposed recruitment mix. Record counts by device and do not hide a mobile blocker in the pooled completion rate. |

Completion counts required at n=5/6/7/8 are 4/5/6/7 respectively. This is initial usability evidence, not a market study. Pilot observations and results from materially different builds must remain distinguishable. Ratings or favourable comments do not erase failed gameplay tasks.

## Hosting and delivery

Recommend **local browser testing first**, then evaluate **GitHub Pages as the first static-host candidate** because the repository already exists there. GitHub describes Pages as repository-backed static hosting; availability depends on repository/account conditions. This is a candidate, not a configured or verified deployment. [GitHub Pages documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages).

A04/F02 must verify HTTPS, export file paths, MIME types, payload/loading behaviour, caching, audio/input and the exact built package on the chosen host. Confirm visibility and account eligibility before publishing; a preview URL must not be assumed private. If host constraints fail, select another suitable static host explicitly. No custom domain, paid hosting, public upload or repository publication change is authorised by approving the product direction alone.

## Capacity and dates

- Retain 10 November as the **stretch playable-candidate date** and 30 November as the release decision, with validation and necessary fixes between them. Two weeks currently refers to the initial build, not a fully validated release.
- There are nine weekdays from 29 October through 10 November inclusive. The source assessment has consumed part of the original window.
- The original initial-development estimate remains 23.5–41 person-days. Its two-engineer, artist and part-time QA assumption is superseded: **the owner confirmed it is Segun working with the assistant**. The estimate is a historical human-effort baseline, not a measured forecast of this collaboration.
- The assistant prepares implementation, asset integration and checks; Segun supplies content decisions, physical-device sessions and tester coordination. Daily availability remains unknown. Sequence assistant-owned work and re-estimate from the browser/asset proof; the original parallel schedule is not a capacity commitment.
- If capacity or feasibility is insufficient, recommend a playable technical slice by 10 November and a revised full-episode forecast. Do not silently redefine the requested complete episode as a successful slice or erase the 30 November review.

No extra stories, cosmetic branches, backend or paid-asset work should enter the initial build while the complete path remains unproven. A06 booking and device confirmation remain separate execution tasks; this proposal has not booked anyone or sent messages.

## Decision sheet for the owner

The following table distinguishes the actual 29 October approval from unresolved recommendations. The [owner decision record](a02-decision-record-2026-10-29.md) is the evidence; no separate boss sign-off is implied.

| Decision | Proposed resolution / information needed | What approval would settle | Status |
|---|---|---|---|
| DEC-02 | 10–15 minutes as David, fixed outcome, assisted sling aiming, non-graphic ending | These product choices are settled; exact objective map, adaptation details and dialogue remain draft | Product approved 29 Oct; content review open |
| DEC-03 | Windows Chrome/Edge, Android Chrome and iPhone Safari as primary families | Initial browser coverage; exact versions still recorded during testing | Pending owner review |
| DEC-04 | Portrait and landscape; physical devices reported available | Orientation settled; exact models, OS/browser versions, input tuning and support baseline still needed | Orientation approved 29 Oct; device baseline open |
| DEC-05 | Godot 4.7.2 / Blender 4.5.15 LTS and matching web templates | Tool versions, background/headless startup and fixture exports verified in [A03](a03-toolchain-setup-2026-10-29.md); browser suitability still open | Local toolchain verified; A04 runtime evidence pending |
| DEC-06 | Direct play with no login | No first-release account requirement; minimal export page remains the engineering recommendation | No login approved 29 Oct |
| DEC-07 | In-session checkpoints and no cloud saves | Session recovery baseline; no durable or cross-device promise | Approved 29 Oct; exact recovery implementation still to test |
| DEC-08 | Illustrated 3D | Style settled; detailed brief/sample, individual assets, rights and spending remain separate | Style approved 29 Oct; sample/rights open |
| DEC-09 | Proposed functional/performance/user thresholds above | Evaluation rules, not a claim that results pass | Pending owner review |
| DEC-10 | Set load budgets after first measured export on named devices/network | Measurement approach; numeric thresholds remain open | Measurements pending |
| DEC-11 | Evaluate GitHub Pages first after local proof | Hosting investigation only; deployment, visibility and access need their own resolution | Pending owner review and host verification |
| DEC-12 | Segun working with the assistant; original stretch dates retained | Staffing arrangement confirmed; daily capacity, schedule interpretation and commitment still require evidence/reforecast | Team confirmed 29 Oct; delivery commitment open |
| DEC-13 | Physical laptop/Android/iPhone reported available; external participant plan proposed | Device availability is reported; models, access, bookings, consent and thresholds still open | Availability reported 29 Oct; A06 coordination outstanding |

Approval recorded on 29 October from the owner’s scoped response: see the [owner decision record](a02-decision-record-2026-10-29.md). Keep any later decision changes dated and attributable.

The received product approval does not approve unknown devices, numerical thresholds, detailed dialogue, asset purchases, hosting or delivery commitments. Staffing and device availability came from the separate owner reply; exact device details remain unknown. A02 stays open for the remaining decisions while independent technical work proceeds.

## A02 work performed and handoff

Prepared the story map, eight objective definitions, state graph, recovery/encounter design, draft core dialogue, art/audio brief, delivery/device recommendations and decision sheet. Reviewed the scriptural reference and current official browser-export/hosting guidance. Checked document references and state/objective coverage. No gameplay, model, export, performance or user test was performed by this proposal task.

Subsequent execution update: [A03 toolchain setup](a03-toolchain-setup-2026-10-29.md) is complete. Next are the A05 sample asset and A04 browser proof; only fixture export preparation exists for A04. Use the approved product baseline; resolve remaining draft-content choices before final narrative production.
