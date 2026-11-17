# PC-02 · Playable movement

**10 November 2026 · Passed.** The WebGL 2 production build has a playable courtyard with a narrow passage and an L-shaped corner. It uses the teenage David model and the saved appearance from the animation preview. [Open the movement test](http://127.0.0.1:4175/movement.html)

Select **Enter courtyard**. Use WASD or the arrow keys to move and drag the view with the mouse to look. On touch, use the left stick and drag the view with a second finger. **Pause** or Escape pauses play. **Reset position** returns David to the entrance.

David accelerates and brakes, faces his resolved movement and blends between idle and walk based on actual travel. Swept wall checks stop him before contact and retain motion along the wall. The follow camera uses the same wall bounds, pulls in immediately when blocked and eases back when clear.

## Verification

The TypeScript check, Vite build, movement browser check and existing animation preview check passed in Chrome 157.0.8103.39. A separate collision check covered a long movement step, sliding, moving away, a corner and a blocked camera segment.

| Check | Observed |
| --- | --- |
| Desktop movement | WASD and arrows moved David. His walk advanced while moving and blended back to idle on stopping. He crossed the passage, stopped outside the wall, slid along it, stopped at both faces of the corner and moved away. |
| Follow camera | Dragging toward the wall shortened the horizontal camera arm to about 0.10 m without entering the wall. It returned beyond 3.3 m once clear. |
| Touch and layout | Two simultaneous touches moved and turned David and a single stick input crossed the passage at 390 × 844, 568 × 320 and 320 × 568. Controls fit without scrolling. The footer buttons measured 48 CSS pixels high. |
| Input recovery | Pause froze David. Pause, window blur, touch cancellation and a portrait-to-landscape resize cleared held input. |
| Animation preview | The original walk and acknowledgement, appearance persistence, responsive layouts, asset retry and WebGL 2 error checks passed after sharing the loader. |

Mobile checks used Chrome touch and viewport emulation. PC-04 will measure startup and frame pacing. [Browser results](evidence/playcanvas-pc02/results.json) · [Desktop passage](evidence/playcanvas-pc02/desktop-passage.png) · [Camera at the wall](evidence/playcanvas-pc02/desktop-camera-clearance.png) · [Portrait](evidence/playcanvas-pc02/touch-390x844.png) · [Landscape](evidence/playcanvas-pc02/touch-568x320.png) · [320 px layout](evidence/playcanvas-pc02/touch-320x568.png)

## Reproduce locally

From the repository root after the locked install, build and start the preview on a free loopback port.

```powershell
npm.cmd --prefix apps/playcanvas run build -- --outDir ../../build/playcanvas-pc02
npm.cmd --prefix apps/playcanvas run preview -- --outDir ../../build/playcanvas-pc02 --host 127.0.0.1 --port 4175 --strictPort
```

The movement verifier takes the preview origin, a Playwright module path and an output directory. [Movement verifier](../../apps/playcanvas/tests/movement-check.cjs) · [Implementation plan](playcanvas-implementation-plan.md#milestones)
