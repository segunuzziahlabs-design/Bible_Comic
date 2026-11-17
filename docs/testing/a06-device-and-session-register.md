# A06 device access and participant preparation

29 October 2026. **Partially implemented: preparation only.** Segun reports access to a laptop, Android phone and iPhone. Physical-device results, exact models/versions, test times and participant bookings have not been supplied. No invitations were sent and no participants were invented.

Related: [physical-device test sheet](../implementation/a04-device-test-checklist.md), [acceptance/user-test protocol](../roadmap/mvp-scope-and-acceptance.md), [B01 preparation plan](../implementation/b01-foundation-plan.md), [task ownership](../roadmap/technical-task-breakdown.md#schedule-and-ownership).

B06 update, 9 November: the owner reports one Android phone and a first-time player available now. Model/OS/browser and consent/observations are not recorded; an iPhone is not available for this session. Use the [B06 guide](b06-session-guide.md) and [observation record](b06-session-record.md). The owner subsequently chose a laptop-only B06 pilot; Android/iPhone tests are deferred. These replies do not populate the main-study bookings below.

## Device register

| ID | Device / availability evidence | Model / OS / browser | Required next evidence | Status / owner |
|---|---|---|---|---|
| DEV-HOST | Development host used for automated browser proof | Windows 11 Pro 10.0.26200, Intel N150, about 15.8 GiB RAM, Intel Graphics; exact Chrome/Edge versions in each build report | Keep build/settings with each run; this does not establish a 4 GB laptop baseline | Desktop proof recorded; assistant |
| DEV-L | Laptop available, reported by Segun; relationship to DEV-HOST not confirmed | Not recorded | Run uncoached proof, record model/version and input/audio/load results; user screenshot confirms rendering only | Available per owner; session not booked; Segun |
| DEV-A | Android phone available, reported by Segun | Not recorded | Prefer weakest available phone; execute both orientations, simultaneous touch, audio, tab return, cold/warm load and sustained play | Available per owner; not tested/booked; Segun |
| DEV-I | iPhone available, reported by Segun | Not recorded | Safari-specific entry, touch, rotation, audio, safe areas, memory/suspension observations | Available per owner; not tested/booked; Segun |
| DEV-LOW | Lower-capacity coverage across the proposed device classes | No verified device | Determine whether existing devices represent the low-capacity target; record the gap if not | Unconfirmed; Segun + assistant |

Record exact versions at the test, rather than guessing support from a model name. Owner direction prioritises light operation; it does not approve numerical device/load thresholds. Physical access and actual results remain necessary for A04/G1.

## Booking slots — not actual participants

Use anonymous participant IDs in this repository. Keep contact details and scheduling messages outside the project. Do not count an unassigned slot, builder test or coached demonstration as an external validation session.

| Slot | Desired coverage, subject to available people/devices | Consent | Session date/time | Booking / observation status |
|---|---|---|---|---|
| P01 | Non-builder, Android portrait/landscape | Not obtained | Unassigned | Unassigned; no observations |
| P02 | Non-builder, iPhone portrait/landscape | Not obtained | Unassigned | Unassigned; no observations |
| P03 | Non-builder, laptop keyboard/mouse | Not obtained | Unassigned | Unassigned; no observations |
| P04 | Non-builder, lower-capacity device if available | Not obtained | Unassigned | Unassigned; no observations |
| P05 | Non-builder, first-time controls/onboarding | Not obtained | Unassigned | Unassigned; no observations |
| P06 | Additional coverage if practical | Not obtained | Unassigned | Unassigned; no observations |
| P07 | Additional coverage if practical | Not obtained | Unassigned | Unassigned; no observations |
| P08 | Additional coverage if practical | Not obtained | Unassigned | Unassigned; no observations |

The source proposal is 5–8 external participants; final thresholds remain DEC-09/13. No demographic mix or individual availability is assumed. Proposed main sessions remain 11–13 November, with retest time in the 12–16 November window only where calendars permit. These are planning windows, not bookings. Early pilots can use a usable slice; full-episode validation requires the complete candidate.

## Practical handoff

1. Segun runs the existing courtyard checklist on the available phones and supplies device/version/build details with actual outcomes. The loopback URL works only on the development laptop; the linked test sheet explains deliberate private-network testing. No public deployment is implied.
2. The assistant reproduces reported failures, records affected builds and updates A04/G1. An unavailable device case remains not tested.
3. Segun confirms non-builder availability, consented notes and actual dates. Record only confirmed anonymous bookings in the table.
4. After G4, run the agreed uncoached full-episode tasks. Record completion, time, assistance, confusion, enjoyment and return-interest responses using the existing protocol. Retest changed flows without silently pooling coached/repeat sessions.

**A06 exit remains outstanding:** actual device inventory/access for A04 plus confirmed main-session and retest bookings. This prepared register does not satisfy that exit condition.
