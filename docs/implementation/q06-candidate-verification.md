# Q06 browser candidate verification

9 November 2026. **Laptop verification complete. Overall Q06 gate remains open.** Sustained play passed the provisional floor and first launch showed a repeatable delay.

## Implementation plan

1. Freeze the final Q05 preview export as `Q06-20261109-01`. Compare it with the recorded Q05 manifest and verify the packaged files and their hashes. Serve the candidate on laptop loopback for review.
2. Rerun the browser journey on the frozen candidate, including the automatic Jesse exchange, separate pickup, gate completion, restart and interrupted interactions. Run the engine checks on a clean project copy and inspect the frozen pack.
3. Measure three fresh-context loads and three same-context reloads with diagnostics disabled. Measure at least 15 minutes of active play with diagnostics enabled at the Q05 desktop comparison viewport. Include three complete journeys and restarts, and record callback timing, stalls and browser errors.
4. Publish the measurements, verified scope and remaining gate work in this record. Apply the roadmap’s provisional performance threshold and retain physical-device and first-time-player checks as separate evidence.

[Quality improvement plan](animation-quality-improvement-plan.md) · [Q05 village presentation](q05-village-presentation.md)

## Frozen export

`Q06-20261109-01` contains the exact final Q05 preview export (`Q05-village-v1`, built 9 November 2026 at 16:24 UTC). The candidate has a separate directory and ZIP under `build/candidates/`. The game pack SHA-256 is `9d583083986acec9fbf320d1186b5cb9c05184dde427b15632fa8a9c7032ebfa`. The WASM is 10,263,606 bytes and the game pack is 683,185 bytes when served with gzip. The build covers the village through the gate and restart. All 15 export files still matched their hashes after testing, and the ZIP contents matched the candidate. The preview is [available on laptop loopback](http://127.0.0.1:8070/).

[Candidate inventory](evidence/q06-2026-11-09/candidate.json) · [Q05 export manifest](evidence/q06-2026-11-09/build-manifest.json) · [ZIP checksum](evidence/q06-2026-11-09/archive.sha256)

## Regression results

| Check | Observed result | Evidence |
| --- | --- | --- |
| Candidate integrity and delivery | 15 files verified. All 26 checks passed, including raw and gzip delivery, manifest equality, WASM MIME, rejection of unlisted paths and refusal to overwrite a frozen candidate. The earlier B06 candidate also verified. | [Delivery checks](evidence/q06-2026-11-09/candidate-checks.json) |
| Godot 4.7.2 clean regression and frozen pack | 10 steps passed in a clean project copy, including asset reimport, gameplay and UI checks, startup and release export. A separate inspection of the frozen pack found the required dependencies and no source-only files. | [Interaction checks](evidence/q06-2026-11-09/interaction-checks.log) · [UI checks](evidence/q06-2026-11-09/ui-checks.log) · [Frozen pack inventory](evidence/q06-2026-11-09/frozen-pack.log) |
| Chrome 156.0.8078.80 desktop and portrait emulation | 29 checks passed with zero browser errors. Desktop completed Speak → Take → Leave → Restart. Speak played the exchange automatically, returning movement control before the separate Take action. Recovery covered held movement, focus loss, skip, replay and restart on both sides of pickup contact. At 390 × 844, emulated touch completed Speak and Take with subtitle controls inside the viewport. | [Browser regression](evidence/q06-2026-11-09/exchange-review.json) · [Desktop greeting](evidence/q06-2026-11-09/desktop-greeting.png) · [Desktop pickup](evidence/q06-2026-11-09/desktop-lift.png) · [Portrait pickup](evidence/q06-2026-11-09/portrait-lift.png) |

## Measurement setup

- Intel N150 laptop with four cores, 15.8 GiB RAM, Windows 11 Pro build 26200, Intel Graphics driver 32.0.101.7088 and Balanced power mode. Headless Chrome used a 1440 × 810 CSS-pixel viewport at device scale 1. Assets were served over loopback with gzip and no artificial network throttling.
- The first loading series used fresh Playwright contexts in one Chrome process. The second used a separate Chrome process and profile for each pair. Each warm sample reloaded the same page immediately afterward. OS caches were left as they were. Timing starts at navigation and ends when the engine starts and dismisses the loading overlay. Diagnostics were disabled for loading samples.
- The sustained run used default detail with diagnostics enabled and an active tab. Each lap exercised walking, turns, a mouse-look sweep, the unskipped conversation, the animated pickup, gate completion and restart. Timing began after entry. Browser animation-frame callbacks estimate frame pacing. Godot diagnostics independently report engine FPS and draw counts. The provisional floor checks rolling one-second callback counts every 100 ms, flagging dips under 30 lasting more than two seconds.

[Measurement harness](../../tools/browser-q06-performance.cjs)

## Loading results

| Launch condition | Runs in order, seconds | Median, seconds |
| --- | --- | --- |
| Fresh contexts in one Chrome process | 43.51, 4.75, 4.47 | 4.75 |
| Immediate reload after each fresh context | 4.04, 4.34, 5.01 | 4.34 |
| First navigation in three separate Chrome processes | 44.62, 43.09, 43.18 | 43.18 |
| Immediate reload in each separate process | 4.53, 4.58, 4.09 | 4.53 |

The fresh-process repeat reproduced the slow first navigation. WASM resource timing on those cold launches was 0.70–1.16 s, with the same WASM transfer size on the warm reloads. A startup trace is needed to locate the rest of the time. These loopback measurements have no approved load-time threshold and do not represent download time on an external network.

[Same-process load and sustained results](evidence/q06-2026-11-09/performance-review.json) · [Fresh-process load results](evidence/q06-2026-11-09/process-cold-review.json)

## Sustained play results

The default-detail run measured **15 minutes 30.2 seconds**, with **17 complete journeys and restarts** and zero captured browser errors. Chrome used ANGLE with Intel Graphics over Direct3D 11 at a 3D scale of 1.0.

| Metric | Observed |
| --- | --- |
| Browser animation-frame callback rate | 32.0 FPS mean. Rolling one-second counts ranged from 31 to 33. |
| Browser callback intervals | Median 31.3 ms, p95 31.7 ms, max 33.4 ms. Zero gaps over 50 ms. |
| Provisional 30 FPS floor | Passed on this setup. Zero periods below 30 FPS in the rolling samples. |
| Browser main-thread long tasks | One 52 ms task. |
| Godot diagnostics | Median 32 FPS, median 52 draw calls, peak 75 draw calls. Startup FPS samples were below 30 in the first 0.85 s of capture. The next diagnostic read 32 FPS, and subsequent samples stayed at or above 30. |

Chrome reported 10.6 MB of used JavaScript heap before capture and 14.8 MB after it, including the measurement instrumentation. These two snapshots do not quantify total browser, WASM or graphics memory. Thermal readings were not collected.

[Timing report](evidence/q06-2026-11-09/performance-review.json) · [Raw capture](evidence/q06-2026-11-09/sustained-samples.json.gz)

## Gate decision

The village completes and restarts on the tested laptop and passes the provisional sustained performance floor. A later trace found that shader linking dominated the slow first launch. In matched Chrome runs a separate fixed export cut median first launch from 43.51 s to 9.41 s. The figures above describe the original frozen build. [Startup diagnosis and retest](q06-startup-profile.md)

The owner has since chosen responsive browser testing in portrait and landscape for mobile acceptance. An unaided first-time-player session and owner review of the visual direction and thresholds remain open. [Current village presentation and acceptance plan](village-story-presentation-plan.md)

## Reproduction

Use the existing candidate folder and a new output directory for each browser run. Keep other browser and editor tests separate from the timing run.

```powershell
python tools/prepare-slice-candidate.py Q06-20261109-01 --verify-only
python tools/serve-proof.py --candidate Q06-20261109-01 --port 8070
```

With the server running, invoke these commands from another terminal using the installed Playwright module path.

```powershell
python tools/check-slice-candidate.py Q06-20261109-01 --port 8070
node tools/browser-exchange-check.cjs $playwright http://127.0.0.1:8070 build/q06/recheck-exchange all
node tools/browser-q06-performance.cjs $playwright http://127.0.0.1:8070 build/q06/recheck-performance
node tools/browser-q06-performance.cjs $playwright http://127.0.0.1:8070 build/q06/recheck-cold-process process-cold
```
