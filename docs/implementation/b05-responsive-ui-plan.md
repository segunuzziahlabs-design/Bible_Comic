# B05 responsive entry and essential UI plan

Prepared 9 November 2026 before implementation, following the owner's request to proceed with B05. Preserve the village, B04 interactions and approved product scope. This task does not close physical-device/G1/G2 acceptance or approve a device minimum.

## Findings and intended changes

The current UI has fixed-size modal content without a scroll region, no reopenable controls help, and a toolbar whose placement does not account adequately for short/narrow viewports. The existing HTML shell applies safe-area insets but can remain on loading if the engine JavaScript fails before `Engine` is constructed. Its failure text exposes raw technical messages, and slow-start/context-loss recovery is incomplete.

1. Rework the existing Godot UI layout using viewport-derived margins, a wrapping toolbar and a bounded modal with scrollable text and persistent action buttons. Preserve the current visual palette and lightweight rendering. Test candidate layouts at 320×568, 390×844, 568×320, 800×360 and desktop sizes; these are test viewports, not approved hardware/browser support claims.
2. Add a Controls help action available before entry and during play. Opening help suspends movement and world interactions without altering the objective; closing returns to the prior welcome/game state. Keep pause, dialogue, completion and restart clear. Provide visible keyboard focus and release modal focus when returning to gameplay.
3. Keep objectives/context prompts readable and all essential buttons at least 48 CSS pixels high, without toolbar/action overlap. Use short-landscape layouts, wrapping text, and a scrollable modal body so long dialogue cannot move the action buttons off-screen. Preserve both keyboard/mouse and touch operation.
4. Harden the minimal export shell: safe-area-aware sizing, readable scrollable loading/error panels, real loading progress, a slow-start retry option, missing-engine/browser/download failure recovery, no-JavaScript guidance, and graphics-context-loss recovery. Keep detailed errors in diagnostics/console rather than player-facing copy. Do not add a frontend framework, service worker, accounts or backend.
5. Add meaningful engine tests for layout bounds, button overlap, long text, modal actions, help lifecycle and focus. Re-run existing state/movement/village/interaction suites. Validate the actual exported shell with normal launches, injected failed requests/missing features/slow load/context loss, retry, safe-area simulation and responsive layouts. Distinguish injected failures and emulation from physical-device results.
6. Run Chrome/Edge desktop and touch-emulated journeys, including help before/after entry, modal scrolling and orientation changes. Inspect screenshots, retain logs/build fingerprints, and update the task records/workbook without overwriting historical evidence or changing baseline estimates/dates.

## Acceptance and ownership

- Loading either reaches the entry screen or shows an understandable recovery action. Retry reloads a fresh visit; stalled startup must not trap the user behind an indefinite spinner.
- Essential text/action controls fit the tested viewport. Long modal text scrolls independently while action buttons remain reachable; buttons are at least 48 px high.
- Help/pause/dialogue block world input. Help preserves the objective and returns to the correct prior screen. Keyboard/mouse and simultaneous touch movement/look retain B02/B04 behaviour.
- The final web export is tested, including UI and recovery paths, with no normal-path browser/script/request errors. Intentional fault tests record their injected errors separately.
- Existing assets/geometry, original DOCX files, story scope, dependencies and deployment settings remain unchanged. No commit, push or deployment.
- Assistant owns implementation and local checks. Segun owns physical phone/browser-bar/safe-area usability and human acceptance. B05 remains Partially implemented until those checks/G2 are closed.

## Risks and schedule

Godot container minimum sizes can exceed a fixed card unless the text is isolated in a scroll region; verify the rendered export as well as rectangles. Touch scrolling must not leak into player movement. Browser safe-area and context-loss tests are simulations, not Safari/Android certification. Very short viewports may require scrolling, without reducing text to unreadable sizes.

Original B05 dates were 2–3 November; actual execution is recorded on 9 November. The full-episode schedule still needs the previously recorded reforecast. B06 will verify the complete vertical slice with a first-time human participant; B05 automation is not that user study.
