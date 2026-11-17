# PlayCanvas feasibility for the revised scope

11 November 2026. Recommendation for owner review.

**Continue with PlayCanvas, TypeScript, Vite and Blender.** The scope's rendering, character control, animation, camera and browser integration fit the engine. The decision to proceed to full production should follow an owner-approved scene that meets the visual target and measured mobile budget. The existing prototype establishes working mechanics and an asset pipeline. It leaves production art quality and the complete mobile workload to be validated.

## Capability against the scope

| Scope requirement | Assessment | Evidence and remaining work |
| --- | --- | --- |
| Realistic materials, terrain and lighting | Supported by the rendering engine. | PlayCanvas documents physically based materials and environment lighting. Current Elah uses a much simpler terrain and camp presentation. Establish the material, lighting, sky and vegetation budget in the representative scene. |
| Rigged David, Goliath and authored motion | Supported and demonstrated locally. | The app loads skinned GLBs, morph targets, layered sling motion and authored Goliath clips. Production movement, prop contact, facial acting and clothing still require art review. |
| Gameplay and cinematic cameras | Supported and demonstrated in the prototype. | The project has follow, aim, conversation-style and retreat framing on a paused game clock. Author shots and transitions as content so they can be reviewed and edited. |
| Sling, collisions and constrained combat | Supported and locally demonstrated. | Existing tests cover hit, miss, dodge, lethal strike and retry. Keep simple swept queries for bounded gameplay. Evaluate a physics integration if the final terrain or dynamic objects require it. |
| Six connected chapters and objectives | Feasible application work. | Implement the chapter definitions, objective guards, inventory and checkpoints in TypeScript. The engine supplies rendering and entity systems. The current duel is an isolated fixture. |
| Desktop and mobile gameplay | Technically supported, product performance remains conditional. | The engine documents WebGL 2 browser support on desktop, Android and iOS. Current Chrome touch emulation validates layout and input. Validate the representative scene on real baseline phones before multiplying its assets. |
| Landing, profiles, dashboard and settings | Compatible with the browser stack. | Keep the game mounted from the responsive web shell and load its engine bundle only for play. The existing Vite project is a supported standalone workflow. |
| Accounts and persistent progress | Compatible through separate services. | Clerk remains selected. The prior Supabase/Postgres proposal has a documented Clerk integration. Implement and test ownership, permitted progress changes, retries and revisions through the game/save boundary. |
| Future episodes | Feasible through content and service contracts. | Use versioned episode IDs, chapters, asset manifests and run/checkpoint data. New episodes will need their own assets and any new mechanics. |
| Voice, music and cinematic sound | Feasible, content production remains. | Existing effects and caption timing work. Final dialogue, music, licences, recording and mixing require a separate approved audio plan. |

Rendering capabilities are documented in the official [PBR guide](https://developer.playcanvas.com/user-manual/graphics/physical-rendering/) and [environment lighting guide](https://developer.playcanvas.com/user-manual/graphics/physical-rendering/environment-lighting/). Animation transitions and blending are described in the official [state graph documentation](https://developer.playcanvas.com/user-manual/animation/anim-state-graph-assets/).

The official browser matrix establishes engine compatibility. Our supported hardware, memory use, thermal behaviour and scene performance must be established through game tests. [Supported browsers](https://developer.playcanvas.com/user-manual/engine/supported-browsers/)

The engine can be used directly with Vite and TypeScript. A visual editor is available, but the current standalone workflow can continue. Decide on editor participation if an artist needs to author scene layout and lighting directly. [Standalone workflow](https://developer.playcanvas.com/user-manual/engine/standalone/)

## What our existing results establish

The matched local character test on the Intel N150 laptop recorded a 2.10-second median cold-ready time and 1.14 MB of compressed transfer for PlayCanvas. The Unity sample recorded 4.27 seconds and 11.89 MB, and the Godot sample recorded 38.71 seconds and 10.74 MB. The three tests used the same input model and comparable cue. All rendered at roughly 32 frames per second in that setup, which gives limited evidence about spare GPU capacity. The measured workload was one character and a neutral scene. [Matched comparison](stack-comparison-results.md)

The later PC-04 courtyard recorded a 1.95-second median cold-ready time, 0.974 MB compressed transfer and 32 FPS during its sustained run. The SC-02 encounter has browser checks for animation, combat, audio state, retry and retreat. Its functional evidence does not establish that the complete episode or final realistic art meets a phone performance target. [PC-04 evidence](../implementation/playcanvas-pc04-foundation-review.md) · [SC-02 evidence](../implementation/playcanvas-sc02-encounter.md)

These are historical measurements inspected for this planning assessment. This planning task does not report a newly executed performance test.

## Conditions for the visual objective

The owner clarified that the presentation must include spoken conversations, mouth movement, listener reactions and cheering soldiers. PlayCanvas supports animation curves for bones and morph weights, and positional audio. Blender supplies the authored facial controls and motion. TypeScript coordinates the dialogue, actor, crowd and camera events on the game clock. The voice recordings and cheering performances are assets that must be produced or licensed. [Animation clips](https://developer.playcanvas.com/user-manual/animation/clips/) · [Audio components](https://developer.playcanvas.com/user-manual/getting-started/migrating-from-unity/#audio)

The current prototype has captions, a few facial expression shapes, body animation and synthesized effects. It needs speaking mouth/jaw controls, voice assets and authored cheering reactions. The five-day plan includes these as implementation requirements and calls for a short voiced-conversation and reaction review.

The mood board describes an ambitious art and presentation target. A credible browser implementation needs suitable character topology, facial design, authored motion, detailed but economical environment assets, consistent material scale, controlled lighting and intentional shots. Repeated cubes, basic silhouettes and technically correct animation playback will need a production art pass.

Use the approved scene to set foreground character detail and background crowd cost separately. Keep large armies primarily distant, instance repeated props, limit transparent effects and dynamic shadows, bake suitable static lighting and load only the active area's asset packs. Profile expensive materials and animation alongside gameplay. The official tools expose frame, loading and resource costs. [Profiling and optimisation](https://developer.playcanvas.com/user-manual/optimization/)

Preserve one responsive product and provide measured graphics tiers. A lower-capacity phone and a capable desktop will need different render resolutions, shadow distances, vegetation density and post effects. Keep the essential character identity, objectives and shot readability consistent across those tiers.

## Production proof before expanding

Approve one small scene that includes a textured camp and valley backdrop, David at gameplay and conversation distances, one character exchange, a cinematic handoff and a short sling action. Use the same production asset path intended for the episode.

Its evidence must include desktop and baseline-phone captures, cold startup and transfer, sustained frame pacing, peak memory observations, focus loss and restoration, touch aiming, pause, restart and an owner review of art and play. Agree thresholds in the milestone brief rather than applying the old courtyard's figures as a full-game result.

If the scene misses its target, first identify whether the cause is asset weight, material/shadow cost, animation, script work or the engine. Reduce the measured bottleneck and retest. A replacement engine becomes a justified option when a required feature or acceptable scene workload remains blocked after that investigation.

## Supporting application choices

The existing Vite shell can mount Clerk's browser components. The proposed Postgres service can verify Clerk tokens and apply owned, validated save commands. These are documented integration paths. Their implementation, service ownership, costs and release testing remain project work. [Clerk JavaScript SDK](https://clerk.com/docs/js-frontend/getting-started/quickstart) · [Supabase Clerk integration](https://supabase.com/docs/guides/auth/third-party/clerk)

My assessment is that PlayCanvas can deliver this game's intended class of experience. Whether this team can deliver the exact visual finish on the selected phones depends on the approved art resources and the production proof. Keep the engine decision tied to that evidence and the [owner review plan](../roadmap/project-reset-plan.md).
