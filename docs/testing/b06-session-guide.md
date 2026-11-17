# B06 device and first-time-player session

Prepared 9 November 2026. Candidate **B06-20261109-01**, game build **B05-village-v1**. The frozen candidate retains the B05 export; this is a three-objective village sample, not the complete David and Goliath episode.

Use the [session record](b06-session-record.md) for actual outcomes and the [implementation plan](../implementation/b06-vertical-slice-plan.md) for scope. Segun reports one Android phone and a first-time player available. Their availability is not test evidence. The owner subsequently chose **laptop-only testing for this session**. Android and iPhone coverage is deferred; no temporary HTTPS link was authorised.

## Access and identity

- Laptop: [frozen local candidate](http://127.0.0.1:8061/), while its server runs. The development preview on port 8060 is a separate mutable export; use 8061 for this session.
- Phone: deferred by the owner for this session; no HTTPS test URL exists. For a later phone session, use a trusted HTTPS route once explicitly authorised and verified. **Do not enter the laptop's localhost URL on the phone. Plain HTTP on its Wi-Fi address is also unsuitable:** the shipped engine requires a secure context even with threading disabled.
- Compare `/candidate.json` with candidate ID above. PCK SHA-256: `7325c07318d2af668be6b95a83dffc9bdc5cb9354def503833097797fef96f7e`. A changed candidate requires a separate result record.
- Do not ask the first-time player to inspect diagnostics or read the developer solution/checklist before their first attempt. Use the normal URL without `?diagnostics=1` for that attempt.

## First attempt — read only this brief to the player

Ask whether they are happy for anonymous usability notes to be taken. Recording is optional and needs separate permission; do not record by default. Use participant code **B06-P01**, not a name or contact details.

> This is a small interactive story sample. Please open it, explore as David, work out what to do, and try to reach the end of the visit. Afterwards, try starting again. You can use anything the game offers. Tell me when something is unclear. We are testing the game, not you.

Observe for up to ten minutes as a practical pilot timebox, not an approved release threshold. Do not tell them the route, keys, target locations or puzzle solution. Reading the game's Controls and prompts counts as unaided play. A human hint, pointing at a target, taking over, editing state or restarting for them must be logged as assistance. Allow them to stop at any time.

Record elapsed time to first movement, first successful interaction and completion. Note hesitation, wrong turns, missed taps, unread text, requests for help and the exact point at which any assistance occurred. Record observed behaviour separately from your interpretation. If they cannot progress, keep the original unaided outcome and record the rescue/retest separately.

After the attempt, ask neutrally:

1. What did you think you were supposed to do? What made that clear or unclear?
2. How did movement, looking and interacting feel?
3. Which moment felt most or least engaging? Did acting as David feel interactive?
4. Would you want to try the complete episode? Why or why not?

Do not turn one pilot into a percentage-based acceptance claim. Later full-episode validation still needs the proposed 5–8 non-builders and agreed thresholds.

## Facilitator-only checks — after the unaided attempt

The intended flow is enter → approach Jesse → speak/continue → collect provisions beside the stall → reach the gate → restart. Check both keyboard/mouse and the available phone's touch controls; an unavailable device remains Not tested.

For the owner's current **laptop-only** session, execute laptop-applicable checks and mark phone/touch/orientation cases Not tested. Do not infer them from resizing the desktop window. Phone testing is a later session.

| Case | Action and expected result |
|---|---|
| D01 Entry | Fresh visit launches, no missing assets; controls legible and entry reachable. Record device model, OS/browser version, network, orientation and quality. |
| D02 Move/look | Move and turn; on phone use two fingers simultaneously, release independently and cancel a gesture. David stops when input ends; no stuck camera/input. |
| D03 Help/pause | Open Controls, scroll, go Back; pause/resume. No movement or interaction behind a modal; objective preserved; actions remain reachable. |
| D04 Interaction guards | Walk out of range; try provisions/gate early; repeat an accepted pickup. Prompts disappear and neither invalid order nor repeated input skips objectives. |
| D05 Complete/restart | Finish and restart three times. First objective, spawn, bundle and controls reset without developer repair. Record attempts separately. |
| D06 Orientation/UI | Rotate portrait ↔ landscape during movement, help, dialogue and pause; scroll long help; expand/collapse browser bars. Check notches/safe areas, reachable actions and aligned touch controls. |
| D07 Audio | After a user gesture, listen for cues; mute/unmute. Distinguish phone volume/mute state from app failure; a running audio context alone is insufficient. |
| D08 Interruptions | Switch apps/tabs briefly, then return after one minute and five minutes. Record pause, recovery, eviction/reload and state outcome. Reload deliberately begins again. |
| D09 Load/performance | Separately record three cold and three warm loads, network conditions and actionable-entry time. Use a fresh private session/cleared site data for cold loads; do not erase unrelated browser history. Observe ten minutes per orientation with both detail settings; record stalls, heat, crashes and minimum/typical diagnostic FPS. Unknown values stay unknown. |
| D10 Recovery | After the first attempt, interrupt a load/network and use retry. Record message and whether a fresh visit starts. Do not bypass browser security warnings. |

For assisted performance readings only, append `?diagnostics=1`. The laptop 30 FPS floor comes from the technical proposal; mobile thresholds and minimum devices remain unapproved. A high-spec Android pass would not establish a low-end minimum. Stop and report any critical launch/progression/control failure; preserve build and steps before a fix.

## Send observations back

Copy and fill this compact record; `not tested` is a valid result:

```text
Candidate: B06-20261109-01
Device / OS / browser / network / orientation / quality:
Participant B06-P01: first-time yes/no; notes consent yes/no; recording none/consented
First movement / first interaction / completion times:
Reached Jesse / collected provisions / reached ending / restarted:
Unaided or assisted (exact hints, timing and state repair if any):
Confusion, missed taps, unread text, stalls or errors (steps and expected/actual):
Facilitator D01–D10: passed/failed/not tested, with observations:
Player feedback and interest in complete episode, with reason:
```

The assistant will record evidence as owner-reported observations unless directly witnessed, identify gaps/defects, and recommend the G2 disposition. Segun's acceptance is recorded separately. No unreturned field is a pass.
