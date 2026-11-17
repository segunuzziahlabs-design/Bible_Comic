# Q06 first launch profile

10 November 2026. The fixed export reduced median first launch from **43.51 s to 9.41 s** on the Q06 laptop, a 78% reduction.

## Plan

1. Trace the frozen candidate from navigation to the welcome screen in a fresh Chrome process, then compare the same phases on reload.
2. Use a focused experiment to isolate the longest phase. Put any fix in a separate local export and preserve the frozen baseline for comparison.
3. Time three fresh Chrome processes per build using the same browser settings. Verify the corrected export through the playable village route and document any remaining limits.

## Cause

On the frozen build, Chrome reached the welcome screen in 43.07 seconds. Calls to `getProgramParameter` accounted for 38.41 seconds. The eight slowest were `LINK_STATUS` checks on lit 3D programs. They took 4.10–5.78 seconds each and all compiled with the default positional light limits. The same program queries took 0.11 seconds total on immediate reload. WebAssembly instantiation took 0.69 seconds cold and 0.69 seconds on reload. The initial browser main thread task containing the shader work lasted 41.59 seconds.

Godot's Compatibility renderer checks shader link status synchronously. The village has a directional sun and uses separate contact shadow meshes. The scene has no positional lights, but the default lit shader variants still compile code for them. [Godot shader linking implementation](https://github.com/godotengine/godot/blob/4.7.2-stable/drivers/gles3/shader_gles3.cpp) · [Godot positional light settings](https://docs.godotengine.org/en/4.7/classes/class_projectsettings.html#class-projectsettings-property-rendering-limits-opengl-max-lights-per-object)

## Fix

The web export now computes lighting at mesh vertices and interpolates it over each face. This is one WebGL-specific project setting. It reduces the work the browser does when it links shaders. The frozen Q06 baseline still verifies. The fixed export is [on laptop loopback](http://127.0.0.1:8073/). Its PCK SHA-256 is `33971e072309092576d77992381cdecba819abd6eca39c88a58f1d5ac3dc201a`. The engine WASM and JavaScript hashes match the frozen build. [Project setting](../../project.godot) · [Fixed export manifest](evidence/q06-startup-2026-11-10/build-manifest.json) · [Godot vertex lighting reference](https://docs.godotengine.org/en/4.7/classes/class_projectsettings.html#class-projectsettings-property-rendering-shading-overrides-force-vertex-shading)

| Traced configuration | Cold navigation to ready | Total program query time |
| --- | ---: | ---: |
| [Frozen Q06](evidence/q06-startup-2026-11-10/frozen-shaders.json) | 43.07 s | 38.41 s |
| [Lower positional light limits](evidence/q06-startup-2026-11-10/fix-shaders.json) | 35.14 s | 30.45 s |
| [Vertex lighting and lower limits](evidence/q06-startup-2026-11-10/vertex-shaders.json) | 7.71 s | 3.34 s |
| [Selected fix, vertex lighting with default light limits](evidence/q06-startup-2026-11-10/fixed-shaders.json) | 8.61 s | 4.52 s |

The selected fix keeps the default positional light limits for later levels. Side-by-side village captures show darker character highlights and slightly more visible shading facets on Jesse's mantle. The poses, staging and contact shadows are still visible. [Frozen conversation](evidence/q06-2026-11-09/desktop-point.png) · [Fixed conversation](evidence/q06-startup-2026-11-10/desktop-point.png) · [Fixed portrait pickup](evidence/q06-startup-2026-11-10/portrait-lift.png)

## Fresh Chrome processes

Each pair used a fresh headless Chrome 157.0.8103.39 process and profile on the Intel N150 laptop, followed by an immediate reload. Both builds used the same 1440 × 810 viewport, loopback gzip delivery, and no startup instrumentation or artificial throttling. Timing ran from navigation to the loading overlay being dismissed. These measurements exclude opening the browser itself.

| Build | First launch in seconds | Median | Immediate reload in seconds | Median |
| --- | --- | ---: | --- | ---: |
| Frozen Q06 | 43.70, 43.51, 39.91 | 43.51 s | 4.11, 3.92, 4.10 | 4.10 s |
| Fixed export | 9.58, 9.41, 8.94 | 9.41 s | 4.60, 3.10, 4.09 | 4.09 s |

The traced fixed build still recorded a 7.60 s main-thread task during cold startup. These measurements apply to this laptop and local delivery. [Frozen measurements](evidence/q06-startup-2026-11-10/frozen-loads.json) · [Fixed measurements](evidence/q06-startup-2026-11-10/performance-review.json) · [Startup profiling tool](../../tools/browser-startup-profile.cjs)

## Playable build check

The release export passed the runtime pack inspection. The browser suite passed all 29 checks with zero captured browser errors. Desktop covered the automatic Jesse exchange, separate animated pickup, gate, restart and interruption recovery. Portrait touch emulation covered the exchange and pickup. Physical phone testing and owner visual sign-off are still open. [Browser journey](evidence/q06-startup-2026-11-10/exchange-review.json)
