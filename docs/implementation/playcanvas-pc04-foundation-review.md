# PC-04 · Production foundation review

**10 November 2026 · Passed.** The frozen production candidate passed movement, cue and recovery checks and met all three provisional performance targets. Its eight output files matched PC-03 byte for byte. [Open the courtyard](http://127.0.0.1:4177/movement.html)

| Measure | Plan target | Result |
| --- | ---: | ---: |
| Median cold startup | ≤ 3.50 s | **1.95 s** |
| Compressed cold download | ≤ 2.00 MB | **0.974 MB** |
| Sustained render rate | ≥ 30 FPS over 45 s | **32.00 FPS** |

Cold launches took **1.95, 5.14 and 1.73 s**. Immediate reloads took **0.36, 0.44 and 0.35 s**, with a **0.36 s** median. The slower cold launch spent 3.72 s between the last resource response and the first rendered frame. The corresponding intervals in the other two runs were 1.34 and 1.26 s.

Each cold launch transferred 973,974 gzip body bytes across six files. The engine chunk accounted for 559,691 bytes and David's model for 406,544 bytes. Each immediate reload transferred 951 body bytes with the asset cache warm.

The 45-second run completed five trail-marker cues while alternating between the approach and return route. Browser frame intervals had a p95 of **31.8 ms** and a maximum of **33.5 ms**. Engine frame-end intervals had a p95 of **34.2 ms** and a maximum of **38.0 ms**. There were **zero intervals over 50 ms** in either stream. The lowest rolling one-second render count was **31**.

## Browser acceptance

The production build passed the TypeScript check. In desktop Chrome, keyboard and mouse movement, wall sliding, camera clearance, pause and held-input cancellation passed. The cue respected range and line of sight, started once per accepted interaction, paused and resumed in place, and returned control on completion. Restart discarded the old cue and restored the courtyard entrance. The model load recovered with Retry, and the unsupported WebGL 2 case showed its recovery message.

Chrome emulated touch checks passed at **390 × 844**, **568 × 320** and **320 × 568**. They covered simultaneous move and look, moving through the passage, cue controls and restart, and rotation while holding movement or pausing a cue. Essential buttons met the 48 CSS-pixel height check. [Desktop cue](evidence/playcanvas-pc04/desktop-cue.png) · [Portrait cue](evidence/playcanvas-pc04/cue-390x844.png) · [Landscape cue](evidence/playcanvas-pc04/cue-568x320.png) · [320 px cue](evidence/playcanvas-pc04/cue-320x568.png)

## Measurement setup

The benchmark ran in headless Chrome 157.0.8103.39 on the Windows Intel N150 laptop with Intel Graphics through ANGLE Direct3D 11 and WebGL 2. The desktop viewport was 1280 × 720 and the canvas buffer was 1230 × 544. Each cold launch used a fresh browser process and profile. The profiler served the frozen production files as gzip over loopback, activated Enter immediately when available, and timed the first controllable engine frame from navigation. Frame pacing sampled PlayCanvas frame-end events and browser animation callbacks after one warm-up lap. Touch results establish layout and input behaviour in Chrome emulation.

Candidate SHA-256 `5c17c4dc918466d42efc186f75277b97f9788250fc09b3f40d8ab3744fe8d45d` identifies the sorted artifact manifest. The full results include the file hashes, per-resource timing, frame timestamps and recovery checks. [Performance data](evidence/playcanvas-pc04/profile.json) · [Movement results](evidence/playcanvas-pc04/movement-results.json) · [Cue results](evidence/playcanvas-pc04/cue-results.json)

Build from the repository root with `npm.cmd --prefix apps/playcanvas run build -- --outDir ../../build/playcanvas-pc04`. Run the profiler with a Playwright module path, production directory and output JSON path. [Profiler](../../apps/playcanvas/tests/foundation-profile.cjs) · [Plan targets](playcanvas-implementation-plan.md#foundation-verification)
