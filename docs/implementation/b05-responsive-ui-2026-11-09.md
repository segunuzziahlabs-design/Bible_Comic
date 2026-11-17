# B05 responsive entry and essential UI

9 November 2026. **Partially implemented:** responsive UI and loading recovery are implemented and locally verified. Physical target-phone usability and G2 acceptance remain open. Work follows the owner's request and the [plan written before implementation](b05-responsive-ui-plan.md). No device minimum, G1/G2 approval or full-episode completion is inferred.

## Player-facing changes

- The entry screen offers **Controls** before starting. During play, the same action opens help without losing the current objective. Movement and world interactions stop until help closes; Escape or Back returns to the previous screen.
- The toolbar wraps on compact screens and sits below the objective on narrow portrait screens. Objective text wraps. Essential action buttons remain at least 48 CSS pixels high. Keyboard focus has a visible gold outline.
- Welcome, help, dialogue, pause and completion share a bounded card. Their text scrolls independently of the pinned action buttons. This preserves readable text and reachable actions in short landscape views.
- The lightweight HTML shell keeps safe-area-aware canvas sizing. Slow loading offers a retry after 20 seconds while allowing a delayed download to finish. Failed script/download/startup, missing browser features and graphics-context loss show player-facing guidance and a reload action. JavaScript-disabled browsers show enable-and-reload guidance. Technical details stay in console/diagnostics.
- Reload and restart begin a fresh village visit. This sample still has three objectives; no durable save, additional narrative, login or backend was added.

## Contracts and implementation

| Component | Responsibility and interface |
|---|---|
| [GameUI](../../scripts/ui/game_ui.gd) | Responsive header/toolbar, scrollable modal body and pinned actions. Emits `help_requested` / `help_closed`; exposes `show_help(touch, current_objective)`. Existing presentation/action signals remain. `show_game()` releases modal keyboard focus. |
| [Proof controller](../../scripts/proof/courtyard_proof.gd) | Owns `help_open`, suspends movement and the interactor, clears held input on entry/exit, preserves story stage and returns to welcome or gameplay. Help cannot open over dialogue, pause or completion. Focus loss clears input without dismissing help. |
| [Export shell](../../web/proof-shell.html) | Loads engine JavaScript with failure handling, measures loading progress, offers slow-load retry, checks required browser features and handles actual WebGL context loss. Reload is the recovery action; it does not pretend to restore unsaved progress. |
| [UI fixtures](../../tests/ui_checks.gd) | Bounds, overlap, long-text scrolling and primary focus at five viewports, plus help lifecycle and restart integration. |
| [Browser journey](../../tools/browser-proof-check.cjs) / [shell checks](../../tools/browser-ui-shell-check.cjs) | Exercise the exported game through real browser input. Fault injection is confined to test browser requests/context; no production failure switches or diagnostic state mutation are added. |

The header resizes after wrapped-text minimum sizes settle. The first 320-pixel engine fixture exposed a stale tall minimum; fitting the header after that change fixed it. A Godot `ScrollContainer` clips the modal body, leaving the footer outside the scrolling region; this follows the [official ScrollContainer API](https://docs.godotengine.org/en/stable/classes/class_scrollcontainer.html). UI text remains at CSS-pixel scale when the existing Extra light setting lowers 3D resolution.

## Executed verification

Evidence: [result.json](evidence/b05-2026-11-09/result.json), [source fingerprints](evidence/b05-2026-11-09/source-sha256.json) and [logs/screenshots](evidence/b05-2026-11-09/).

| Executed verification | Result |
|---|---|
| Fresh copied project | Import, startup, release export and package inspection passed without the working cache |
| Existing proof / foundation / movement / village / interaction suites | 17 / 24 / 35 / 26 / 58 checks passed |
| Responsive UI suite | 121 checks passed |
| chrome-desktop / 156.0.8078.80 | 42 checks passed; no captured browser/script/request errors |
| chrome-touch-emulation / 156.0.8078.80 | 59 checks passed; no captured browser/script/request errors |
| msedge-desktop / 157.0.4341.42 | 42 checks passed; no captured browser/script/request errors |
| Shell recovery / 156.0.8078.80 | 24 checks passed across six cases; deliberate faults recorded separately |
| Preservation | Existing runtime assets and both DOCX hashes unchanged; village remains 9,196 triangles / 40 surfaces / 40 meshes |

Final export: **281 engine checks, 143 browser journey checks and 24 shell checks passed**. All final browser reports identify one unchanged build manifest. Focused-button text contrast and modal-only help visibility were refined after initial screenshot review; the final export was rechecked.

| Export file | Bytes | Gzip bytes |
|---|---:|---:|
| index.js | 279,815 | 69,464 |
| index.pck | 140,288 | 100,176 |
| index.wasm | 39,514,754 | 10,263,606 |

Gzip sizes are local package measurements, not network-budget or load-time acceptance. The engine runtime dominates delivery size.

| Local end-of-run samples | FPS range | Draw-call range | 3D scale |
|---|---:|---:|---|
| chrome-desktop | 32–32 | 49–49 | 0.666666686534882 |
| chrome-touch-emulation | 32–32 | 79–79 | 0.75 |
| msedge-desktop | 31–33 | 49–49 | 0.666666686534882 |

These short local observations are not sustained-play benchmarks or a minimum-device performance pass. Any observations below the proposed 30 FPS floor require profiling on the agreed physical baseline. Functional success does not waive performance acceptance.

The five engine layout viewports are 320×568, 390×844, 568×320, 800×360 and 1280×720. The exported touch journey also rotates through 844×390 and 360×800. Simulated safe-area insets exercise a 528×280 canvas inside a 568×320 browser viewport. These measurements establish local layout behaviour, not support certification for any physical phone or Safari version.

The UI suite stresses all five modal types with long body text, then checks help before entry, help during gameplay, blocked world input, focus loss, Escape and restart. Browser journeys verify actual wheel/touch scrolling, entry/back behaviour, frozen gameplay, resized HUD/modals and the existing movement, camera, interaction, audio and complete/restart flow. Shell tests deliberately block the engine script/WASM, substitute a missing-feature response, delay a download, trigger actual graphics-context loss and disable JavaScript. Expected fault observations are recorded separately from successful-path errors.

An initial blocked-WASM test exposed a separate engine promise rejection that did not reject `startGame()`. The slow-load retry remained available, but the explicit failure message did not appear. Boot-only unhandled-rejection/error handlers now route that case to recovery while retaining the original console diagnostics. The initial failed report and harness are retained with the evidence; the final fault test is rerun against the changed shell. Desktop entry also exercises Tab/Enter menu navigation.

The subsequent shell run reached all recovery cases but its generic text locator did not match `noscript` content. Targeting the rendered `noscript p` element and checking its visible guidance corrected that harness assertion; a screenshot confirms the instructions. This selector-only correction and the earlier failed report are retained separately.

Reproduce with the pinned toolchain:

```powershell
.\tools\check-foundation.ps1 -EvidenceTask b05
.\tools\export-proof.ps1
python .\tools\serve-proof.py
```

With Node/Playwright available, run `tools/browser-proof-check.cjs <playwright-module-path> chrome desktop build/verification/b05/browser`, then `chrome touch` and `msedge desktop`. Run `tools/browser-ui-shell-check.cjs <playwright-module-path> build/verification/b05/shell` separately. The latter intentionally causes failure cases. Historical evidence records remain unchanged.

## Remaining acceptance and handover

The task workbook was imported, rendered before/after editing, recalculated and checked for formula errors. Only B05 status/evidence (E19/M19), the latest execution note (P12) and row 19 height changed. All 29 task IDs/owners/statuses match the Markdown schedule; estimates, dates, formulas, table, validation and frozen panes are preserved. Local Markdown links, story identifiers, source fingerprints and exported-file hashes passed [documentation validation](evidence/b05-2026-11-09/documentation-checks.json). The artifact runtime exited nonzero after writing its candidate; the ZIP contents, cell comparison and rendered output were independently verified before replacing the workbook. Native Excel was not opened.

The [local village](http://127.0.0.1:8060/) is available while its local server runs. Segun still needs to assess physical Android/iPhone text, thumb reach, touch scrolling, browser bars/notches, orientation, focus/OS suspension and sustained performance. Local emulation does not close these checks, G1/G2 or the minimum-hardware decision. Native Safari and screen-reader accessibility have not been certified.

Next is **B06 — verify the browser vertical slice**, including a first-time human participant and actual devices. Use the [device/session register](../testing/a06-device-and-session-register.md); automated checks are not human observations. Original B05 dates (2–3 November) and estimate (1–1.5 person-days) remain the baseline; actual execution is 9 November and actual effort was not measured. The full-episode schedule still requires reforecasting from this state.

Original assets/geometry, story scope and both DOCX files are preserved. No dependency, backend, deployment configuration, commit or push is added by B05.
