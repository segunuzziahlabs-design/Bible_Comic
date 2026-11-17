# SET-01 · Verified PlayCanvas baseline

**10 November 2026 · Passed.** A clean locked install, TypeScript check, Vite production build and the existing browser smoke check passed. The current local preview serves the same four files byte for byte. [Open the preview](http://127.0.0.1:4173/)

The workspace was on an initial `master` branch with no Git commit. Identify this baseline by the package lock and output hashes. The build used Node 24.14.1, npm 11.11.0, PlayCanvas 2.24.0, TypeScript 7.0.2 and Vite 8.3.7. The David GLB is 1,060,996 bytes with SHA-256 `be2f2d2d4d91dd79a57187b3638e077db52b7cf45281dc675ef29e952b34ab7f`. [Build manifest](evidence/playcanvas-set01/build-manifest.json)

## Reproduce

Use the existing app's install, build and preview commands with the browser check. On Windows, an open Vite server can hold the native Rolldown binding during `npm ci`. For this run, the locked install was performed in an isolated copy of the package and source under `build/set01-app/`. The command used Node's Windows certificate store and preferred the local npm cache. The build output went to `build/playcanvas-set01/` and was tested at loopback port 4174. Package files removed by the first install attempt were restored from the clean install. The working package then passed `npm ls --depth=0` and `npm run typecheck`. [Local run instructions](playcanvas-pc01-bootstrap.md#run-locally) · [Browser check](../../apps/playcanvas/tests/browser-check.cjs)

## Acceptance results

| Check | Expected | Observed |
| --- | --- | --- |
| Build and render | Locked install, successful type check and production build, and David drawn through WebGL 2 | Passed in Chrome 157.0.8103.39 on Intel Graphics. The served model matches the source hash and has six animation clips. |
| Animation | Walk and acknowledgement advance and can hold a stable reference pose | Both passed on desktop. |
| Appearance | The four controls change the rendered model, survive animation changes and reload, and reset to default | All passed. |
| Responsive layout | The preview controls fit on small screens and the appearance editor works in both orientations | Passed with emulated touch at 390 × 844, 568 × 320 and 320 × 568. The animation controls measured 44 CSS pixels high. PC-04 will check essential gameplay controls against its 48 CSS-pixel target. |
| Recovery | Missing model recovers after retry. WebGL 2 unavailable shows guidance. | Both simulated cases passed. Normal execution reported zero browser errors, failed requests or off-origin requests. |

The build produced the existing Vite large-chunk warning. The main script is about 565 kB gzipped in the build report. Startup and frame pacing remain PC-04 measurements. [Browser results](evidence/playcanvas-set01/results.json) · [SET-02 foundation contracts](playcanvas-set02-contracts.md)
