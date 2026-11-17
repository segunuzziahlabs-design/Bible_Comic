# CTRL-07 — complete episode integration

Owner instruction, 16 November 2026: update the full-playthrough test for the separate pasture/courtyard arrival, test Chapters 1–6 on desktop and in portrait/landscape, fix defects and show the complete episode. [Current opening](../implementation/pasture-courtyard-arrival.md) · [Control order](player-control-design.md).

## Execution

1. Establish a current production candidate in `build/playcanvas-ctrl07`, on loopback port 4201. Retain ports 4199/4200 and their frozen evidence. Clarify the episode entry copy for the automatic courtyard arrival. Keep the six chapters, assets, save schema, objective IDs and chosen stack.
2. Update the previous full journey into a current CTRL-07 runner with common browser/input helpers. Desktop uses actual keyboard/mouse; portrait (390 × 844) and landscape (844 × 390) use actual CDP touch-stick, drag-to-aim and action-button input. Each run starts with empty storage, earns all twelve objectives at normal game time, and never injects progress or repairs runtime state.
3. Cover automatic flock/messenger, guided pasture exit, opaque scene switch and automatic gate arrival; held-input clearing, pause/restart; Jesse and provisions; road/discovery/Elah; delivery/brothers; challenge/Eliab; Saul/armour; automatic stones and interrupted collection reload; practice miss/hit; Goliath entrance and ranged battle; defeat/save/reload/Retry Battle; three physical evasions, misses and ordinary/cinematic winning shots; retreat, cheers, completion reload and replay/history.
4. Capture meaningful browser frames, route timings, ordered save receipts, errors/failed resources, control/layout geometry and per-chapter frame samples. Inspect actual screenshots. Treat full-journey frame measurements as observations, not a physical-device performance guarantee. Add a focused lower-frame-rate check where useful, with its limits stated.
5. Fix actual issues in the smallest relevant system, distinguishing game defects from outdated test gestures/timing. Preserve diagnostic failures. Rebuild a separate candidate after source changes and rerun affected journeys. For the short-screen CSS-only correction found during this pass, rerun all six chapters in landscape and smoke-check the final desktop/portrait entry; retain their full gameplay results from the unchanged game code and record both frozen candidates explicitly. A gameplay change requires rerunning affected gameplay journeys. Do not repeat unrelated passed suites.
6. Document the final verified behaviour, defects/corrections, exact build hashes, remaining limitations and a brief first-time-player checklist. Show the normal episode entry in the browser; do not seed the owner's progress or present a chapter fixture as the complete run.

## Exit gate

All three fresh journeys reach completion through the real UI with twelve ordered objectives, correct defeat/retry and durable save/replay behaviour, no progression blockers, reachable controls and no unexpected browser/resource errors. Build/typecheck and relevant story/input/physics/arrival checks pass. Reports identify which build each result used. Physical-phone/Safari performance, owner creative acceptance and an actual unaided participant session are not inferred from automation.

This scope completes the engineering integration portion of CTRL-07. First-time-player observations remain a separate human validation gate unless a participant actually supplies results. No Clerk/backend work, service provisioning, new episode, deployment, commit or push.
