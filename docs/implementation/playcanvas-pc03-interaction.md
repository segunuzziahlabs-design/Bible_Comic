# PC-03 · Courtyard interaction and timed cue

**10 November 2026.** Follow the stones through the gap to the teal trail marker. Press **E** or select **Inspect marker** when the prompt appears. David turns toward the marker and plays a 2.4-second inspection with a gesture, a camera shot and two captions. The follow camera and movement return when it finishes. [Open the courtyard](http://127.0.0.1:4176/movement.html)

The prompt requires range and an unobstructed line to the marker. Each accepted interaction creates one cue instance. **Pause** freezes the cue clock, animation and camera together. **Resume** continues that instance. **Restart** discards it and restores David, the camera and the prompt to their starting state.

The TypeScript check and Vite production build passed. The cue and movement regression checks passed in Chrome 157.0.8103.39 through WebGL 2.

| Check | Observed |
| --- | --- |
| Range and visibility | The prompt stayed hidden at the entrance and from an in-range position on the other side of the wall. Pressing E in either spot started no cue. |
| Once per interaction | Two extra presses during the first cue left its instance ID and start count unchanged. A fresh interaction after completion started a new instance. |
| Pause and resume | A pause at about 0.27 seconds held the rendered frame, camera and clock for 2.6 seconds. Resume advanced the same gesture, and the second caption appeared. |
| End and restart | The follow camera and input returned on completion. Held movement stayed cleared. Restart during the next paused cue restored the entrance, cleared the caption and prompt, and produced no delayed completion. |
| Touch | Tap, pause, resume and restart passed at 390 × 844, 568 × 320 and 320 × 568 in Chrome emulation. Resizing from portrait to landscape during a pause preserved the cue. |

[Browser results](evidence/playcanvas-pc03/results.json) · [Desktop prompt](evidence/playcanvas-pc03/desktop-prompt.png) · [Desktop cue](evidence/playcanvas-pc03/desktop-cue.png) · [Portrait cue](evidence/playcanvas-pc03/cue-390x844.png) · [Landscape cue](evidence/playcanvas-pc03/cue-568x320.png)

From the repository root after the locked install, build and serve the preview.

```powershell
npm.cmd --prefix apps/playcanvas run build -- --outDir ../../build/playcanvas-pc03
npm.cmd --prefix apps/playcanvas run preview -- --outDir ../../build/playcanvas-pc03 --host 127.0.0.1 --port 4176 --strictPort
```

The cue verifier takes the preview origin, a Playwright module path and an output directory. [Cue verifier](../../apps/playcanvas/tests/cue-check.cjs) · [Implementation plan](playcanvas-implementation-plan.md#milestones)
