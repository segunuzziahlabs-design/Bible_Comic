# A02 owner decision record — 29 October 2026

Source: the project owner's two replies to the scoped A02 questions in this chat. This records owner approval, not a separate boss sign-off or a runtime test result.

Related: [A02 proposal](a02-story-and-delivery-proposal.md), [story draft](../story/david-and-goliath-story-proposal.md), [decision register](../roadmap/risk-and-decision-register.md), [task schedule](../roadmap/technical-task-breakdown.md#schedule-and-ownership).

## Approved story and product baseline

The question explicitly listed the following choices. The owner answered: **“Approve these story and product choices.”**

| Choice | Recorded resolution | Decision |
|---|---|---|
| Player and length | Play as David; target a 10–15 minute episode | DEC-02; length is a design target, not measured play time |
| Narrative outcome | One fixed story outcome | DEC-02 |
| Encounter | Assisted sling aiming | DEC-02; detailed tuning remains implementation work |
| Ending | Non-graphic presentation | DEC-02; exact dialogue and depiction remain draft content |
| Art | Illustrated 3D | DEC-08; palette, asset sample, individual licences and spending are not approved by this choice |
| Orientation | Playable portrait and landscape | DEC-04; physical-device compatibility remains unverified |
| Access | No login in the first episode | DEC-06 |
| Persistence | No cloud saves; in-session checkpoints | DEC-07; no durable or cross-device saving promised |

The complete eight-objective map, exact dialogue, adaptation details and art sample were not included in the approval question. They remain reviewable drafts under the approved direction. Do not request approval of the choices above again unless a material change is proposed.

## Team and devices

Asked which physical laptop/Android/iPhone were available and whether there were other developers or artists, the owner answered: **“me working with you, i have all physical device with me”.**

- **Confirmed arrangement:** Segun working with the assistant. No additional engineer, artist or dedicated QA person is confirmed.
- **Owner-reported availability:** a physical laptop, Android phone and iPhone. Exact models, OS/browser versions and suitability as minimum supported hardware remain unknown. Availability is not evidence of a successful test or of assistant access to the phones.
- **Working responsibilities:** the assistant prepares engineering changes, documentation, asset integration and executable checks within available tools; Segun supplies product/content decisions, performs physical-device sessions with guidance and coordinates external participants. Review and defect triage are shared. These are responsibilities within one collaboration, not parallel human staffing or guaranteed daily capacity.
- **Capacity still unknown:** daily focused availability, asset-production speed and device-test turnaround. External participants are not yet booked. Real-device results must identify the build, device and observations supplied or actually observed.

## Delivery impact and remaining decisions

### Additional owner direction — lightweight delivery

When asked for exact device models, the owner directed: **“ensure it's light and can play on the bearest minimum modern devices capacity”.** Record this as U4: prioritise low resource use and playability on lower-capacity modern devices. The [lightweight delivery plan](low-end-device-performance-plan.md) translates it into candidate test classes and implementation constraints. It does not supply device models or approve numerical budgets; actual support remains to be measured. No repeat device question is required before independent setup work.

Retain 10 November as the stretch playable-candidate target and 30 November as the release decision baseline. Neither date became a delivery commitment through this approval. The earlier estimates assumed separate engineering, art and QA contributors; that parallel staffing assumption is superseded.

Keep the original 23.5–41 person-day development estimate and 29–51 person-day full-plan estimate as historical estimating baselines, not a prediction of assistant speed or available capacity. Reforecast after A03 tooling, A05 representative asset work and A04 exported-browser measurements. Sequence assistant-owned work; Segun can identify devices and arrange testers while technical preparation continues. If the complete episode cannot fit, present the measured scope/date tradeoff; a technical slice must not be labelled a completed episode.

Still open: detailed story content; exact browser/device support; art sample and asset rights; performance, loading and user-test thresholds; hosting/access; actual capacity and delivery commitment; external tester recruitment. These do not require reopening the approved product choices.

## Status and next action

**A02: Requires clarification — product choices approved, delivery/content details still open.** Proposal preparation and this decision record are complete; the whole A02 acceptance condition is not yet satisfied. At the time of this A02 approval, A01 was the only completed task. [A03 subsequently completed](a03-toolchain-setup-2026-10-29.md); the subsequent [A05/A04 proof](a05-a04-proof-2026-10-29.md) now records original assets and an interactive local browser sample. A04 remains partial for physical devices; final art approval remains open. A06 is now Partially implemented through the [prepared register](../testing/a06-device-and-session-register.md). Device availability is owner-reported; actual inventory, reservations and participant coordination remain incomplete.

A03 toolchain work was authorised by the existing implementation direction and subsequently verified. Next prove a small representative asset and browser scene before expanding the episode. Independent tool setup does not need to wait for final dialogue or performance budgets. No game/browser/device test, commit, push, purchase or deployment is recorded by this decision update.
