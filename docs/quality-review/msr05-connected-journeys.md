# MSR-05: connected journeys across the six chapters

20 November 2026. Follows the [execution plan](../implementation/msr05-guided-routes-execution-plan.md), [overall plan](../implementation/motion-speech-and-guided-routes-plan.md) and [MSR-04 pilot](msr04-eliab-to-saul-connection.md). The owner's instruction to proceed authorises this wider rollout; it does not imply acceptance of the earlier outstanding voice/native-lifecycle gates.

**Implemented; all twelve route/layout checks, recovery checks and the fresh six-chapter desktop regression passed. The final loading-error copy checks also passed.** Owner presentation review remains open. No deployment, commit or push.

## Play

[Complete episode](http://127.0.0.1:4221/valley.html). This local production preview uses the local QA save adapter; it does not exercise a live Clerk/Supabase account. Normal saved progress resumes at its canonical checkpoint.

Isolated route previews preserve the normal saved episode:

- [Elah survey → baggage camp](http://127.0.0.1:4221/valley.html?review=1&route=camp).
- [Brothers → challenge overlook](http://127.0.0.1:4221/camp.html?review=1&route=overlook).
- [Pavilion → brook](http://127.0.0.1:4221/preparation.html?review=1&route=brook).
- [Practice bank → battlefield](http://127.0.0.1:4221/preparation.html?review=1&route=battle).
- [Retained Eliab → Saul connection](http://127.0.0.1:4221/challenge.html?review=1&route=saul).

These shortcuts derive an explicit temporary prefix of already completed objectives. They demonstrate routes, not earning earlier chapters. Begin the preview, follow the arrows, and use the existing action at the destination. A browser that blocks connected audio activation retains an Enter action instead of running a silent conversation.

## Resulting journey

| Route | Implemented behaviour | Confirmed save required / arrival action |
| --- | --- | --- |
| **R03 · Elah → camp** | Survey returns David to control. Turn towards the marked camp path; walking to its exit fades to the baggage approach. The connected camp arrival is playable immediately rather than repeating its old automated introduction. David continues carrying the provisions. | `valley.surveyed`; walk to the keeper and choose Deliver. |
| **R05 · Brothers → overlook** | After greeting the brothers, follow the central aisle towards the ranks. A covered page handoff reveals the overlook approach with player control. | `brothers.met`; walk into hearing range and choose Hear the challenge. Arrival grants no challenge objective. |
| **R09 · Pavilion → brook** | After refusing the armour, walk out of the pavilion. A fully covered switch activates the already prepared brook root in the same application/context. The retained voiced brook introduction leads into the playable bank path. | `armour.declined`; reach the stones to trigger their existing automatic animation. No extra pickup key. |
| **R11 · Practice → field** | After a successful practice and readiness exchange, walk along the bank exit. The covered page handoff enters the existing David/Goliath entrance, then restores its existing player-controlled approach and confrontation. | `sling.practised`; no route can skip the entrance, challenge or sword/spear/sling gates. |

The R11 connection finishes at the field entrance. It intentionally adds no second forced arrival walk before Goliath's established cinematic. Its route timing measures the new playable departure; the retained entrance and subsequent encounter approach are separate cinematic/gameplay beats. It does not promise that the entire preparation-to-first-attack sequence takes ten seconds.

Chapter summaries are optional secondary controls after the survey, brothers greeting and practice; Back to the path resumes walking. The pavilion exit has no chapter-complete summary because Chapter 4 is still in progress. Restart keeps an active pavilion departure at its start; reloading its confirmed checkpoint can safely resume at the brook, preserving the previous checkpoint contract.

## Complete route inventory

Authored anchors below are actual implemented coordinates in separate scene-local spaces, not shared world coordinates. Arrow polylines follow the existing collision surfaces. Small original sand paths, limestone edge stones, timber posts and linen/clay-coloured way cloths dress the exits without new external assets or NPC obstacles.

| Route | State after this task | Anchors / protected behaviour |
| --- | --- | --- |
| R01 · Flock → courtyard | Retained | Automatic messenger → player pasture path → automatic courtyard arrival; no Tend requirement. |
| R02 · Courtyard → ridge → Elah | Retained | Jesse Speak, separate Take, carried provisions, existing path/discovery/reveal; first durable save remains the survey. |
| R03 · Survey → camp | New | `(0,8.2)` → `(0,10.5)` → `(-1.8,12.1)`; camp `(0,4.6)` → `(0,2.8)` → `(-2,2.8)` → keeper. |
| R04 · Keeper → brothers | Retained explicit camp aisle | `(-2,1.85)` → `(0,2.8)` → `(1.6,1.1)` → `(2.2,-.8)`; independent delivery/greeting saves. |
| R05 · Brothers → overlook | New | `(2.2,-.8)` → `(0,-.8)` → `(0,-4.8)`; overlook `(0,11.6)` towards `(0,8.2)`. |
| R06 · Overlook → Eliab | Explicit bent guide added | `(0,8.2)` → `(0,10.85)` → `(2.4,10.85)`; skirts the soldier/props instead of drawing a generic direct line. |
| R07 · Eliab → Saul | Retained MSR-04 pilot | Existing departure, validated hint, pavilion approach and one Speak audience. |
| R08 · Saul → armour | Retained short approach | Existing audience/armour marks and Try / Set aside actions; no unnecessary five-second padding. |
| R09 · Pavilion → brook | New departure + retained bank | `(1.1,1.2)` → `(.2,2.7)` → `(.2,4.1)`; bank `(-4.3,3.7)` → `(-3,2.5)` → `(-2.7,1)` → stones. |
| R10 · Stones → practice | Retained | Existing short local approach and practice controls; all five stones still save together. |
| R11 · Practice → field | New departure + retained field entry | `(0,1.55)` → `(2.8,2.7)` → `(4.3,3.6)`; original field entry/entrance and player approach. |
| R12 · Fallen champion → sword → final action | Retained | Explicit player pickup, ready and final action; duplicate-action and battle-checkpoint guards. |
| R13 · Final action → Victory | Retained cinematic handoff | Existing earned transition, retreat, cheering, completion and replay. No extra mandatory walk. |

The preserved routes are audited by the final fresh desktop regression, not claimed as newly rebuilt or newly tested on every physical device.

## Technical changes and recovery

- [Pure route contracts](../../apps/playcanvas/src/gameplay/story-route.ts) define the four routes, canonical ordered prefixes and one-use presentation hints. [Shared departure adapter](../../apps/playcanvas/src/app/story-departure.ts) reuses MSR-04's bounded page/module preparation; the existing chapter owners still control movement, collision, dialogue and saves.
- Departure is enabled **after** the source action successfully saves. Grounded exit, input clearing, opaque cover, single transfer and pause ownership prevent early/duplicate navigation. Backtracking remains playable.
- Page hints are bound to route, fixed destination, run ID, run revision, content version, battle revision when present and review identity. They expire after five minutes and are consumed once. They contain no objectives, positions, credentials or account state. Invalid/unavailable hints use canonical entry.
- Review pages derive their own fixed prefix and correlate only temporary run identity. Review timestamps are independent; they are not copied as a progress save. Normal fresh-run checks compare the real persisted checkpoint across the transfer.
- Connected camp/overlook entries attempt bounded sound activation and skip their redundant automatic arrival scenes. Manual entry remains available when autoplay is blocked. The battle area exposes a small audio-ready hook so a connected entry can check sound while its simulation remains paused; combat calculations are unchanged.
- The same-page brook switch retains shader preparation, wardrobe, automatic collection and interruption recovery. Its root change was captured with transition opacity **1.0**. No second application, extra game iframe or claimed cross-page GPU prewarming was introduced.
- Existing save-error UI now stacks above a transition cover. A real browser storage event from another page during the covered pavilion exit leaves Reload visible/reachable; reloading returns to the confirmed checkpoint.
- The five-button practice-bank footer initially clipped its Chapter summary button in portrait. At widths up to 600 px, footer actions now wrap into readable rows. The final portrait check and visual capture confirm every control is inside the viewport and reachable.
- Camp cinematic footers now show Watch/Pause while movement is owned by a scene, then restore movement hints. Chapter 3's MSR-04 footer remains in place; Preparation also labels its owned cinematic beats accurately.

Authentication, profiles, database schema, reward rules, appearance preferences, twelve objective IDs, content version and the six chapters are unchanged. Original model/voice assets and their licences remain intact. Environmental/footstep audio is reused; across pages teardown can interrupt ambience, so uninterrupted music/audio is not claimed.

## Verification

Local production build: `build/msr05-local`, PlayCanvas **2.24.0**, Chrome **157.0.8103.79**, WebGL 2. [Functional matrix/full-episode hashes](evidence/msr05-2026-11-20/functional-build-manifest.json) and [final review hashes](evidence/msr05-2026-11-20/frozen-build-manifest.json). TypeScript/Vite build, [four-route contract checks](../../apps/playcanvas/tests/story-route-check.cjs), the retained R07 contract checks and `test:story` passed. After the frozen functional run, only five error-message text literals changed to replace the old pavilion-specific wording. No branch, state condition, timing or control changed; affected failure/retry paths passed separate browser checks below.

The [focused route suite](../../apps/playcanvas/tests/msr05-routes-browser.cjs) uses clearly labelled review-prefix fixtures and actual keyboard/CDP touch input. It tests pause, backtracking, restart, optional summaries, visible arrows, UI reachability/overflow, unchanged objectives through travel, normal-save isolation, next actions, automatic pickup and Goliath's walking entrance. It does not pretend these route fixtures earned the full story.

| Combined purposeful walking | Desktop 1280×720 | Portrait 390×844 | Landscape 844×390 |
| --- | --- | --- | --- |
| R03 departure + keeper approach | [7.83 s · PASS](evidence/msr05-2026-11-20/verified/desktop/r03/results.json) | [8.90 s · PASS](evidence/msr05-2026-11-20/verified/portrait/r03/results.json) | [8.64 s · PASS](evidence/msr05-2026-11-20/verified/landscape/r03/results.json) |
| R05 departure + hearing approach | [7.98 s · PASS](evidence/msr05-2026-11-20/verified/desktop/r05/results.json) | [8.57 s · PASS](evidence/msr05-2026-11-20/verified/portrait/r05/results.json) | [8.54 s · PASS](evidence/msr05-2026-11-20/verified/landscape/r05/results.json) |
| R09 departure + bank approach | [6.84 s · PASS](evidence/msr05-2026-11-20/verified/desktop/r09/results.json) | [7.69 s · PASS](evidence/msr05-2026-11-20/verified/portrait/r09/results.json) | [7.69 s · PASS](evidence/msr05-2026-11-20/verified/landscape/r09/results.json) |
| R11 departure to field entry | [5.44 s · PASS](evidence/msr05-2026-11-20/verified/desktop/r11/results.json) | [5.35 s · PASS](evidence/msr05-2026-11-20/verified/portrait/r11/results.json) | [5.36 s · PASS](evidence/msr05-2026-11-20/verified/landscape/r11/results.json) |

Times exclude loading, cinematics, pauses and screenshot capture. All twelve final checks stayed within approximately **5–10 seconds**, with no captured console/page errors or failed HTTP requests. Touch evidence is browser emulation, not Android/iPhone/Safari hardware certification.

Inspected final captures: [camp departure](evidence/msr05-2026-11-20/verified/desktop/r03/path-bend.png), [portrait camp aisle](evidence/msr05-2026-11-20/verified/portrait/r05/path-bend.png), [pavilion exit](evidence/msr05-2026-11-20/verified/desktop/r09/path-bend.png), [fixed portrait practice footer](evidence/msr05-2026-11-20/verified/portrait/r11/path-bend.png), [landscape field entrance](evidence/msr05-2026-11-20/verified/landscape/r11/goliath-entrance.png).

The [recovery suite](../../apps/playcanvas/tests/msr05-recovery-browser.cjs) passed **14 distinct scenarios**:

| Cases | Verified outcome |
| --- | --- |
| R03/R05/R11 failed page preparation, Retry while paused | Opaque error, correct checkpoint, completed retry waits for Resume before navigation. |
| R03 explicit fallback | Opens the correct next preview without a trusted arrival or automatic objective. |
| Persistent camp David GLB failure | Covered error; restoring the asset and Reload recovers; consumed hint falls back safely. |
| R03/R05/R11 expired hints | Ignored/consumed; manual canonical entry and correct objective remain. |
| R03/R05/R09/R11 source reloads | Correct canonical next location/checkpoint; no repeated source action or granted destination objective. |
| R09 failed refusal save, Retry, route restart, airborne exit, paused cover | No departure before save; actual airborne exit waits for landing; pause holds root transfer; resume switches under fully opaque cover; checkpoint reload recovers. |
| R09 cross-tab save conflict during cover | Error/Reload appears above cover, no stuck loading screen, correct checkpoint after Reload. |

Evidence: [initial recovery results](evidence/msr05-2026-11-20/recovery/), [cover/save-conflict checks](evidence/msr05-2026-11-20/recovery-final/). After the initial recovery run, CSS raised save-error stacking; its conflict and root-cover cases were rerun. The later portrait-only footer wrapping was verified across the final route matrix; it does not change these desktop recovery states. Initial HTTP/asset faults are intentional and listed separately from unexpected page errors.

Fresh Chapters 1–6 regression: **PASS**, empty normal desktop session, local save adapter, actual inputs and normal clocks. **All twelve objectives were earned in order**, without a review shortcut, seeded checkpoint, clock change or state repair. New routes retained their confirmed source saves; the full run also checked R07, opening/arrival restart, provisions, dialogue, armour reload, interrupted automatic stones, practice miss/hit, defeat/reload/Retry Battle, actual evasions, sling misses/earned hit, the final player sword sequence, Victory, completion reload and fresh Replay Episode with completed-run history retained. **Two battle attempts, one defeat, zero captured console/page errors or failed HTTP requests.**

Evidence: [results/events](evidence/msr05-2026-11-20/full-episode/desktop/results.json) and [complete episode recording](evidence/msr05-2026-11-20/full-episode/desktop/complete-episode.webm). The [normal-playthrough driver](../../apps/playcanvas/tests/ctrl07-episode-playthrough.cjs) now walks all four connections, retains R07's walk and never clicks the removed forward chapter gates. This is a complete desktop journey plus twelve focused route/layout checks, not three newly repeated full-episode mobile journeys.

Post-run copy-only correction: loading failures for every destination now describe the next location rather than incorrectly saying pavilion. The final build/typecheck passed; R03/R05/R11 page failure/retry and retained R07 module failure/retry checks passed against that build, including an assertion that the message no longer mislabels the destination. [Copy/retry evidence](evidence/msr05-2026-11-20/recovery-copy-final/).

Exploratory test corrections: isolated review destinations generate independent timestamps. An initial test incorrectly compared those timestamps as a persisted normal save. It now checks correlated presentation identity and the independently derived objective prefix; the normal full journey continues to require the actual saved state to match. The first portrait harness tried to drag the intentionally hidden joystick while paused; it now checks that the joystick is hidden and the player stays still, then resumes real touch movement. The separate portrait footer clipping was an actual UI defect and was fixed in CSS. Exploratory results remain in the [investigation folder](evidence/msr05-2026-11-20/investigations/) and earlier capture folders. No gameplay state was repaired to pass a test.

## Remaining review

This is a connected guided journey through existing scenes, not an unrestricted open world or a final art overhaul. Owner judgement of route presentation, motion and intonation remains essential. A first-time player session, real cloud-account regression, matched hardware performance certification and MSR-03's outstanding native lifecycle/listening gates are not implied by these local route tests.

The historical standalone camp/preparation test drivers still describe their older interaction/Continue contracts and are not this task's acceptance evidence. The updated full journey and new route/recovery suites cover the changed contracts. Wider cast gesture/voice work belongs to **MSR-06**; broader release/user validation remains **MSR-07**.
