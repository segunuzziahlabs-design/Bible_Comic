# Lightweight web delivery and lower-capacity devices

29 October 2026. **Owner requirement recorded; engineering targets proposed; runtime support unverified.**

The owner's instruction is to keep the experience light and playable on devices with the bare minimum modern capacity. This makes lower-capacity hardware a design priority, rather than treating a powerful development laptop or a flagship phone as sufficient evidence. It does not identify a particular device or guarantee every modern browser/device combination.

Related: [owner decisions](a02-decision-record-2026-10-29.md), [implementation plan](implementation-plan.md), [acceptance gates](../roadmap/mvp-scope-and-acceptance.md), [task breakdown](../roadmap/technical-task-breakdown.md), [decision register](../roadmap/risk-and-decision-register.md).

## Candidate test baseline

These are **proposed engineering test classes**, not published minimum requirements or approved numerical acceptance thresholds. Choose actual physical examples in A06 and record their CPU/GPU, RAM where known, OS and browser version when testing. RAM alone does not establish browser performance or compatibility.

| Class | Initial target for investigation | Required evidence |
|---|---|---|
| Entry-level laptop | 4 GB total system RAM, integrated graphics, a maintained browser with working WebGL 2 and WebAssembly | Full exported journey and restart on the actual device; an inspection-host run alone is insufficient |
| Budget Android phone | Investigate a 2 GB total RAM device first, if available, with a maintained Chrome version and working WebGL 2/WebAssembly | Touch, both orientations, sustained gameplay, load, memory pressure and tab-return checks |
| Older/lower-capacity iPhone | Oldest available physical iPhone that can use a maintained Safari/iOS combination and required web capabilities; investigate the low-memory class where available | Independent Safari testing; Android or desktop results cannot establish iPhone support |

Godot's published baseline for a simple exported web project lists 4 GB RAM for desktop and 2 GB for mobile, and explicitly says actual requirements depend on the project and require low-end testing. These are system RAM figures, **not a browser memory allowance**. The native-export examples are not a supported-device list for this web app. [Godot system requirements](https://docs.godotengine.org/en/stable/about/system_requirements.html).

Godot 4 web export requires WebAssembly and WebGL 2 through the Compatibility renderer. Browser/driver support must actually work on the device; a recent model name is insufficient. Begin with the single-thread export path, then measure its cost. [Godot web export guidance](https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_web.html).

The owner reports having a laptop, Android phone and iPhone, but their specifications are unknown. If they are all powerful devices, record the lower-capacity test gap. Browser CPU/network throttling helps diagnose problems but does not reproduce a weak phone GPU, thermal behaviour or OS memory limits. A03 setup and representative local work can proceed without repeatedly requesting model names; collect them when physical testing starts.

## Implementation constraints

1. **Low-detail mode is the starting point.** Build the illustrated 3D style from strong silhouettes and composition. Begin without expensive post-processing, real-time global illumination, dense particles or multiple shadow-casting lights. Prefer simple materials, economical authored lighting and restrained effects; verify any baking workflow against the pinned renderer.
2. **Keep the active world small.** Separate village, route and battlefield into manageable areas. Keep only the needed area and shared resources resident where practical; release unused resources between transitions. Scene changes do not automatically guarantee a smaller download, so measure download and runtime memory separately.
3. **Control asset cost at import.** Use low-complexity meshes and simple collision. As an initial authoring guideline, prefer 512–1024 px textures for ordinary assets, increasing only where visible quality warrants it. Reuse materials and rigs, limit simultaneous animated characters, and reduce distant decoration. Review visible geometry, draw calls and texture memory before multiplying assets. Final numerical scene budgets follow A04 profiling.
4. **Separate 3D cost from UI readability.** Start by testing a 3D render target no larger than approximately 1280×720 landscape or 720×1280 portrait, preserving aspect ratio and never enlarging a smaller viewport. Allow a lower 3D setting if needed while keeping dialogue and touch controls crisp and usable. Confirm the implementation method in the pinned Godot version; a high-density screen must not automatically multiply the rendering workload.
5. **Keep sound and delivery economical.** Use short compressed cues and restrained ambience; no full voice-over or video dependency. Export only required content, inspect the package, and test server compression/caching. Begin with a normal reproducible export; custom engine compilation is conditional on a measured payload problem and its schedule cost.
6. **Keep services out of the gameplay path.** Retain the approved no-login/no-cloud-save baseline and a minimal responsive launch page. Avoid additional frameworks, trackers or background requests without a defined requirement.
7. **Preserve the complete episode.** Lower-detail settings may reduce resolution, effects or decoration, not objectives, interactions, readable text, portrait play, the sling encounter or the ending. Provide useful launch/retry guidance if required browser capabilities are unavailable; do not misrepresent an unsupported device as playable.

These are implementation recommendations within the lightweight requirement, not completed features. Godot's optimisation guidance supports limiting transparency and real-time lighting, using suitable detail levels and controlling animated-model cost. [Godot 3D performance guidance](https://docs.godotengine.org/en/stable/tutorials/performance/optimizing_3d_performance.html).

## Measurement and release gates

- **A04/G1:** export a representative small scene containing David's movement/camera, animated character, interaction, touch UI and audio. Record exact device/build/settings, cold and warm launch times, transferred bytes, frame times and observable stability. Use the lowest-capacity available devices early; a cube-only proof is insufficient for asset-cost decisions.
- **Working performance goal:** stable 30 FPS on the candidate lower-capacity devices; 60 FPS is optional headroom, not a reason to raise minimum hardware. The existing proposed sustained-stutter rule and mobile floor still need acceptance confirmation in DEC-09. Do not label a favourable average as a pass while ignoring stalls.
- **D04/G5:** repeat measurements on the complete episode, including portrait/landscape, the busiest scene, tab return and three completion/restart cycles. Check progressive slowdown, crashes, browser reloads and device heating. Record available memory indicators and their limitations; JavaScript heap alone is not total browser/WASM/GPU memory.
- **Download and memory:** record actual compressed transfer size, launch/decode time and usable memory observations first. Set practical numerical budgets with the owner after the first representative proof; MB/seconds/process-memory caps remain TBD under DEC-10, not invented results. Include a documented slower-network test and a cold-cache run.
- **Failure response:** reduce decorative and rendering costs, retest the same build path and preserve gameplay quality. If the complete approved experience still cannot run acceptably, present the measured scope/engine/date tradeoff before expanding content; do not silently raise minimum hardware or claim universal modern-device support.

The [A05/A04 record](a05-a04-proof-2026-10-29.md) now supplies small-scene desktop and browser-emulation measurements. No physical-phone, low-memory or full-episode performance test has run. This requirement strengthens A04/A05/B05/D04/D05 and the release gates; it adds no new episode or supporting service. Task statuses now reflect the local proof. Original estimates remain a baseline; physical-phone results and actual capacity are still needed for a defensible reforecast.
