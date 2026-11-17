# B06 browser vertical-slice verification plan

Prepared 9 November 2026 before B06 implementation, following the owner's request. B06 verifies the existing three-objective village; it does not add episode content or approve G1/G2 automatically. One physical phone and a first-time player are owner-reported available now; the phone platform, model, browser and actual observations are not yet known.

## Findings and sequence

1. Freeze the B05 release that already has local engine/browser evidence. Verify every manifest file and compressed representation, preserve its original build identity, and create a separately named, hash-identified B06 candidate. Do not rebuild or silently replace that candidate during sessions.
2. Add a small reproducible candidate preparation/verification tool and let the existing restricted local server select a validated candidate. Serve only manifest-listed browser files, never project sources or session notes. Keep the existing development preview available. Test hash tampering, invalid paths and actual HTTP delivery. This is test tooling, not a new game/backend system.
3. Check the frozen candidate through the exported desktop journey. Reuse dated B05 checks only after matching hashes, clearly identifying them as prior evidence. No repeated engine suite is needed for unchanged gameplay. A new candidate is required if a real defect causes runtime changes.
4. Resolve physical-phone access through a trusted HTTPS test route. The shipped engine explicitly requires a secure context even with threads disabled; plain HTTP on a laptop LAN address will not run this export. Inspect existing private Tailscale availability first. Do not weaken browser checks, bypass certificate warnings, install a trust root, open a public tunnel, change firewall/router settings, enrol devices or deploy to a hosting service as an inferred workaround. Any access/hosting choice beyond existing authorised private testing needs the owner's concrete decision.
5. Prepare a short neutral first-time-player brief, observer record, device checks and G2 decision sheet. Run the unaided attempt before showing a solution checklist. Record actual consent, assistance, confusion, completion/restart, device/browser/build and defects. Use anonymous participant IDs; no automatic recording, invitations or invented observations.
6. Ask Segun to operate the available physical phone and observe the first-time player. The assistant can verify the local browser/test transport and analyse returned observations, but cannot claim a physical test or human observation without evidence. An unavailable second phone stays Not tested; owner testing is separate from first-time-player evidence.
7. Update roadmap/gap/register/workbook consistently, retaining original estimates/dates. Mark B06 Partially implemented until required physical coverage, user observations and G2 disposition are recorded. Fix/retest demonstrated blockers before story expansion.

## Acceptance and evidence

- Candidate files and their delivered bytes match the saved manifest; compressed files decompress to the same bytes. Preparation refuses an existing candidate destination, and verification detects changed/missing/unlisted files.
- Desktop and physical-device records identify this exact candidate, URL/transport, device/OS/browser, orientation, quality and tester. Host/emulation observations never stand in for a phone or unaided human trial.
- A player can enter, move/look, interact with Jesse and the provisions, understand objective feedback, finish the village and restart without developer state repair. Range, repeated actions, pause/help, scrolling, rotation and input cancellation remain correct.
- At least one first-time non-builder attempt records real behaviour and feedback. A hint or rescue makes completion assisted. One pilot cannot establish the later 5–8-person full-episode enjoyment/return-interest threshold.
- Zero unresolved critical progression/usability defects on the tested candidate; affected cases retested after fixes. Performance is recorded against proposed targets, not silently approved.
- G1/G2 remain open if phone coverage, meaningful progress, device baseline or required decision evidence is missing. A candidate, checklist or screenshot alone is not a passed gate.

## Ownership and schedule

Assistant: candidate/tooling, local transport/browser checks, evidence/defect analysis and records. Segun: phone access/operation, voluntary player participation, observation notes and gate decision. Actual execution starts 9 November; baseline B06 date remains 3 November and estimate remains 0.5–1 person-day. Waiting for devices/observations is not measured development effort. The full-episode schedule still needs reforecasting.

Related: [B05 evidence](b05-responsive-ui-2026-11-09.md), [task and ownership](../roadmap/technical-task-breakdown.md#b06-verify-the-browser-vertical-slice), [G2 criteria](../roadmap/mvp-scope-and-acceptance.md#proposed-quality-gates), [device/session register](../testing/a06-device-and-session-register.md).
