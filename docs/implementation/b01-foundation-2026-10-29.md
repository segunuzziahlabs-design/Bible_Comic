# B01 foundation preparation and A06 handoff

29 October 2026. The owner asked to proceed after seeing the courtyard. Work followed the [B01 plan](b01-foundation-plan.md), prepared before implementation. This step organises and verifies the existing proof; it does not add village/story content or approve final artwork.

## Delivered

- Editor-visible component scenes for David, the shepherd model, courtyard/anchors, input, UI, objective marker and provisions. The existing geometry generator now belongs to the world component.
- Physical-key bindings in Godot's Input Map, with one input adapter that emits interaction/pause requests and clears held input on lifecycle changes. Player logic remains independent of keyboard/touch devices.
- A composition root that wires signals/references and owns one proof state per visit. UI setters keep controller logic away from layout internals; player/actor/world instances do not own story transitions.
- World-space spawn/target anchors and recovery that respects a translated courtyard. The existing three-objective journey, keyboard/mouse/touch paths and visual assets are preserved.
- [Component ownership/contracts](b01-component-contracts.md), proposed Git conventions and a fresh-copy verification command. Original source DOCX, GLB, audio and Blender asset contents are unchanged.
- [A06 device/session register](../testing/a06-device-and-session-register.md) with owner-reported availability, unknown details and anonymous unassigned booking slots. No invitations, consent, phone results or confirmed bookings are implied.

## Executed verification

Final evidence is in [evidence/b01-2026-10-29](evidence/b01-2026-10-29/); [result.json](evidence/b01-2026-10-29/result.json) records build identity, checks and limitations. The earlier A05/A04 evidence remains a historical record; moved script paths are not expected to match that older source snapshot.

| Executed verification | Result |
|---|---|
| Fresh copied project | Import, startup, release export and actual PCK dependency/source-exclusion checks passed without using the working `.godot` cache |
| Existing proof suite | 17 passed, no failures |
| Foundation suite | 24 passed, no failures: named/remapped input, alternate-key release, normalisation, action signals, instance isolation, world anchors and coherent restart/recovery |
| chrome-desktop / 155.0.8059.85 | 13 checks passed; no captured browser/script/request errors; export manifest unchanged during run |
| chrome-touch-emulation / 155.0.8059.85 | 21 checks passed; no captured browser/script/request errors; export manifest unchanged during run |
| msedge-desktop / 156.0.4314.50 | 13 checks passed; no captured browser/script/request errors; export manifest unchanged during run |
| Source preservation | Original GLB/audio/Blender asset hashes and the four moved script UID sidecars match the previous snapshot |

The browser checks total **47**; engine suites total **41**. Portrait playthrough and 844×390, 360×800 and 800×360 layout checks use desktop touch emulation. They are not physical Android/iPhone observations. Screenshots were inspected for unintended presentation changes.

The fresh-copy test starts without `.godot` or generated imports. It copies only runtime source, web shell and tests into a new ignored directory, imports with the pinned engine, runs the suites, starts the scene, exports and loads required resources from the exported PCK. It leaves the working cache and existing files intact.

Browser checks send actual automated keyboard/mouse or touch events through the exported canvas. They confirm the ordered loop, completion/restart, animation, pause, mute, quality controls and applicable focus/orientation behavior, without a state-setting shortcut. The browser report fetches the export manifest before and after its run to detect a changed build. This is automation evidence on the development host, not a human usability study or a physical phone result.

These runs establish regression coverage for the refactor, not a new performance baseline. No claim is made that small-scene FPS, cached launch behavior or desktop-emulated touch proves lower-capacity mobile suitability. The prior [A04 loading and hardware limits](a05-a04-proof-2026-10-29.md) still apply.

## Task status and remaining work

| Task / gate | Current status | What remains |
|---|---|---|
| B01 | Partially implemented; local foundation preparation verified | Close A02/G1 prerequisites and accept the foundation for broader episode integration |
| A06 | Partially implemented; register/checklist prepared | Actual device models/versions, phone execution, confirmed non-builder sessions and retest bookings |
| A04 / G1 | Still open | Physical Android/iPhone, device/performance budgets and recorded proceed/replan decision |
| B02–B06 | Not started as complete task implementations | Player/camera edge cases, representative village, reusable interaction, responsive UI refinements and full slice verification |

The current proof still uses draft dialogue and three hard-coded proof events. Camera and interaction detection remain in its controller; no generic narrative framework, reusable B04 interaction system or full C01 episode state is claimed. UI construction remains scripted inside its component. The screenshot's very small bottom control hint is retained as a B05 usability follow-up. Final art/content, minimum devices and hosting remain open decisions.

The original schedule dates/estimates are retained as planning baselines; this preparation happened on 29 October and does not imply all Phase B work or the two-week candidate is finished. No commit, push, deployment or production setting change was made.

## Continue locally

```powershell
.\tools\check-foundation.ps1
.\tools\export-proof.ps1
python .\tools\serve-proof.py
```

Refresh `http://127.0.0.1:8060/` while the server is running. The courtyard should look familiar; this step changes its structure and input contracts. For browser regression with an available Playwright installation:

```text
node tools/browser-proof-check.cjs <absolute-playwright-module-path> chrome desktop build/verification/b01/browser
node tools/browser-proof-check.cjs <absolute-playwright-module-path> chrome touch build/verification/b01/browser
node tools/browser-proof-check.cjs <absolute-playwright-module-path> msedge desktop build/verification/b01/browser
```

The next development item is B02 controller/camera hardening. Physical-phone validation and the remaining G1 decision must accompany the foundation handoff before broader world/story expansion. Segun can supply actual device/tester availability using the prepared A06 register.
