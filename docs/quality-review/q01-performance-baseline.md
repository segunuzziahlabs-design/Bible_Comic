# Q01 browser performance baseline

9 November 2026 · Frozen candidate **B06-20261109-01**, game build **B05-village-v1**. PCK SHA-256 `7325c07318d2af668be6b95a83dffc9bdc5cb9354def503833097797fef96f7e`. [Candidate verification and source fingerprints](../implementation/evidence/q01-2026-11-09/verification.json)

## Measurement conditions

- Windows 11 Pro build 26200 on Intel N150, four cores, 15.8 GiB visible RAM, Intel Graphics driver 32.0.101.7088 and Balanced power scheme. Chrome **156.0.8078.80** ran headless at 1280 × 720 CSS pixels and device scale 1. The game reported ANGLE on Intel Graphics with Direct3D 11. The local server used gzip over loopback with no artificial throttling.
- Three runs per combination of Low detail and Extra light, with diagnostics on and off. Each run used a fresh browser context and a two-second settle after entering and choosing the detail setting. In the spawn lane, automated keyboard input held W for 850 ms, S for 850 ms, D for 550 ms and A for 550 ms, then idled for 800 ms. The route repeated three times. With diagnostics enabled, sampled player positions confirmed movement. The camera and nearby animated characters stayed in the same part of the village.
- Browser `requestAnimationFrame` intervals measure callback pacing. Godot separately reports FPS, process time, draws and visible primitives with diagnostics enabled. The run records browser long tasks and V8 heap readings. Actual display presentation intervals, GPU timing and total browser/WASM/GPU memory remain unmeasured. The desktop route does not cover the new dialogue, phone thermal behaviour or first-time usability.
- For startup, each repetition measured a fresh context with diagnostics off and a warm reload in that context after its route. The endpoint was the launch shell's engine-ready signal. The HTTP cache can be cold while the browser process and operating system remain warm. [Raw runs and resource timing](../implementation/evidence/q01-2026-11-09/browser-baseline.json)

## Measured results

Callback percentiles show the range across three repetitions per configuration. The gap column totals intervals over 50 ms across those three runs.

| Preset | Diagnostics | Callback p50 | Callback p95 | Gaps >50 ms | Worst callback gap | Godot median FPS | Median draw calls |
|---|---|---:|---:|---:|---:|---:|---:|
| Low detail | Off | 31.2–31.3 ms | 31.7–31.8 ms | 0 | 36.6 ms | — | — |
| Low detail | On | 31.2 ms | 31.7–31.8 ms | 1 | 62.0 ms | 32 | 74 |
| Extra light | Off | 31.2–31.3 ms | 31.8–32.1 ms | 12 | 63.2 ms | — | — |
| Extra light | On | 31.3 ms | 31.9–32.1 ms | 12 | 62.9 ms | 31–32 | 74 |

The browser recorded one main-thread long task across 135 seconds of sampled route time. Godot reported 12,840–12,842 visible primitives at the median. Its process-time medians were 16.6–32.1 ms and per-run p95 values were 18.0–48.1 ms. These sampled engine values cannot distinguish CPU, GPU or compositor limits. V8 used-heap readings spanned 10.1–13.6 MiB.

The same route showed similar median callback pacing with diagnostics on or off. At 1280 × 720, Low detail used 1.00 3D scale and Extra light used 0.67. Extra light had more long callback gaps here despite its smaller render target. Keep Low detail as the comparison default and retain Extra light for Q06 device checks. The route gives no reliable basis for attributing the difference to fill rate or selecting a mobile default.

[Low detail capture](../implementation/evidence/q01-2026-11-09/route-plain-low-detail.png) · [Extra light capture](../implementation/evidence/q01-2026-11-09/route-plain-extra-light.png)

| Cache setup | Engine-ready samples | Median | JS + PCK + WASM transfer bytes | WASM transfer bytes |
|---|---|---:|---:|---:|
| Cold context | 23.03 s, 2.81 s, 2.79 s | 2.81 s | 10434146 | 10263906 |
| Warm reload | 2.96 s, 2.79 s, 3.07 s | 2.96 s | 10264506 | 10263906 |

The WASM gzip body is 10,263,606 bytes. The local server revalidates cacheable resources, and all three warm reloads transferred the WASM body again. The first launch of the controlled Chrome process took **23.03 seconds**, with the WASM request completing in about 0.64 seconds. The earlier instrument check showed the same pattern, with **26.35 seconds** to engine-ready and about 0.67 seconds for WASM transfer. Later samples in each process took roughly three seconds. Capture first-session startup separately in Q06 and trace the time between resource delivery and engine-ready to identify the delay.

## Guardrails for Q02–Q06

| Cost or quality | Provisional first-pass guardrail |
|---|---|
| Geometry and rig | Aim for **8,000–10,000 triangles per clothed actor**, up to 20,000 combined including hair and props worn on the body. Start with at most four skin influences per vertex. Compare deformation at knees, elbows and feet before removing topology. |
| Materials | Start with up to two opaque materials per actor and a shared colour atlas up to 1024 × 1024 where a texture is needed. Reuse the palette and remove hidden body geometry. Add maps only after a visual comparison and cost check. |
| Transfer | Start with a **1 MiB incremental gzip PCK allowance** for the two actors, their selected clips and associated material assets. Compare with the 100,176-byte baseline gzip PCK. Keep the WASM byte count separate. This is an authoring budget, not an approved load-time or download threshold. |
| Render cost | Recheck the same route after the first two-actor import. Investigate a repeatable callback p95 increase of over 10% or recurring gaps above 50 ms relative to the same preset. Report draw calls, primitive counts, and sustained FPS together. Measure an additional dialogue shot when it exists. |
| Real devices | Confirm hardware and browsers, startup conditions and sustained play with actual phones in Q06. The proposed 30 FPS floor and numeric device budgets remain open. The current laptop-only test access constraint still applies. |

## Reproduction

Use the Node, Playwright module and Python interpreter paths provided by the Codex workspace dependency tool, or use locally installed equivalents. On this host the bare `python` and `python3` commands resolve to Store aliases. Call the full path of a working Python 3 interpreter. In a separate shell, serve the verified candidate on the existing loopback port if it is idle. The output JSON path must be new, and a new directory keeps the route screenshots together.

```powershell
& $q01Python tools/prepare-slice-candidate.py B06-20261109-01 --verify-only
& $q01Python -u tools/serve-proof.py --candidate B06-20261109-01 --port 8061
# In a second shell after the server is ready
& $q01Node tools/q01-browser-baseline.cjs $q01PlaywrightModule build/q01/recheck/baseline.json
```

The harness collects resource timing and the fixed route. Save the same environment details with later candidate comparisons. [Browser baseline harness](../../tools/q01-browser-baseline.cjs) · [Visual and shot brief](david-jesse-visual-brief.md)
