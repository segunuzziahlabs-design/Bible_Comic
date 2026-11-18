# Continuous combat and interactive aftermath

18 November 2026. Extends baseline `3e79be0`; implementation follows [the plan](continuous-combat-aftermath-plan.md). No framework replacement, dependency addition, deployment, commit or push is part of this change.

## Implemented behaviour

### Fight while aiming

The existing sword → two spear evasions → sling progression remains. Unlocking the sling now keeps the ranged attack scheduler running instead of entering the inactive `exposed` state. Goliath holds his battlefield position during the counterattack, locks each new throw onto David's position during its warning, and repeats after a 3.2-second recovery. The final windup is 1.85 seconds and the physical flight remains 1.25 seconds: approximately 6.3 seconds between throws once the sling is ready. Aim mode never suspends that clock.

WASD/arrows or the movement stick remain active with the aiming controls, F/Throw and direction + Shift/Dodge. Q/Jump Shot also preserves held movement during its physical jump. The warning lane, landing circle, projectile shaft/head/trail, incoming-attack message and separate position/angle feedback remain visible during sling use. Touch movement, aim dragging and action buttons use independent pointers. Pause still suspends combat and presentation.

The same swept spear head/shaft collision against David's moving, height-aware capsule determines damage; dodging and jumping provide no immunity. The same gravity-based stone path and swept forehead contact determine hits. Wrong shots remain misses. A confirmed physical forehead hit cancels the active spear and future attacks before the earned replay; a pressed Throw button alone cannot win.

### Staged fall

After the retained, labelled decisive-shot replay, Goliath performs an additional six-second authored impact/balance/stagger performance: recoil, alternating steps, one deliberate full turn, then yielding knees. A separate 2.67-second heavy collapse follows. These are new clips on the existing weighted rig, rather than entity rotation or position teleports. The camera frames the champion during the staged reaction. Original synthesized nonverbal groans, animated mouth reactions, heavy steps, armour and ground impact support the sequence.

### Player's final sword action

After the fall is confirmed, the player receives **Take Goliath's sword** and a route arrow. David must walk to it and press **Take sword / E**. The pickup clip lifts the single sword prop. After that checkpoint is confirmed, the player walks to the fallen champion, presses **Ready sword**, and deliberately presses **Finish battle** to initiate the final 2.5-second performance. Waiting at the ready prompt never performs the action automatically. Walking is never automated in this sequence.

The finishing swing communicates the biblical beheading through a cutaway to David, restrained sound and caption; blade contact is off-screen. There is no blood, wound or detached-head mesh. Chapter 6's existing retreat, cheering and conclusion begin only after the final action and its save are confirmed.

## State and persistence

The added phases are `stagger → fall → fall_checkpoint → retrieve → pickup → sword_checkpoint → finish_approach → finish_ready → execution → finish_checkpoint → victory`. Every interaction checks the current phase, distance and sword ownership. Leaving the ready area returns to approach. During pickup/execution, input cannot start another interaction. The save phases wait for confirmation and retain the existing Retry save / Reload checkpoint recovery UI.

An optional, versioned `Run.battle` checkpoint progresses `combat → fallen → sword_taken → finished`, with its own revision. The original twelve objective IDs and run-revision formula remain. `goliath.struck` saves after the completed fall; subsequent semantic commands save the pickup and final action. Reloading the fall preserves a defeated Goliath; reloading after pickup restores the held sword. Restart checkpoint after the fall reloads the confirmed checkpoint. Battle defeat still retries the combat section, preserving Chapters 1–4.

Old runs without the optional field remain valid, including completed runs and their chapter access. New battles opt in before play. Dashboard routing, direct Victory entry, local rules and the server all prevent an opted-in unfinished battle from skipping to Victory.

[Additive SQL migration](../../apps/playcanvas/supabase/migrations/202611180001_battle_aftermath.sql) adds an authenticated semantic RPC and a Victory guard to the existing JSON/receipts model. It was tested against local PostgreSQL WASM and applied only to the dedicated **bible-comic-dev** development database over verified TLS. Profile/run counts and existing saved-state digests were unchanged by migration. Writes remain owned, revision checked and idempotent; there is no silent local fallback for cloud saves.

## Assets and scope

[Asset manifest](../assets/continuous-battle-manifest.json) records hashes, geometry, clips and checks. `goliath-continuous.glb`: 11,859 triangles / 70 joints / 1,633,972 bytes. `david-aftermath.glb`: 9,893 triangles / 65 joints / 1,542,120 bytes. Existing geometry, speech morphs, appearance vertex colours, animations and underlying licences remain. The combined increase over the two previous duel character files is approximately 401 kB, before transfer compression.

[Blender source](../../source-assets/characters/continuous_battle.py) reproduces the added performances using pinned Blender 4.5.15. [Provenance notice](../../apps/playcanvas/public/licences/continuous-battle.txt) covers the original poses, sword prop design and procedural sounds. No new external media, character, voice provider or app dependency was introduced. Source changes are confined to battle presentation/controller, required save/access integration and verification/documentation.

## Executed verification

Evidence is kept locally in ignored `docs/implementation/evidence/continuous-battle-2026-11-18/`.

| Check | Result and evidence |
| --- | --- |
| Production builds and TypeScript | Passed for separate local and normal cloud candidates. Existing Clerk directive / large-chunk build warnings remain. |
| Desktop 1280×800 | Passed real-input combat and aftermath; `results.json`, desktop captures. |
| Laptop 1366×768 | Passed real-input combat and aftermath; `results.json`, laptop captures. |
| Portrait touch 390×844 | Passed actual CDP touch movement/aim/throw/dodge and sword interactions; controls reachable without overflow. |
| Landscape touch 844×390 | Passed the same encounter and control geometry checks. |
| Continued danger | On all four layouts: a moving, aimed throw during a live spear warning, physical miss, continued spear release, lethal spear hit during sling mode, and Retry Battle. |
| Earned fall / aftermath | On all four layouts: real forehead hit, staged reaction, measured authored turn approximately 360°, collapse, pause, fall reload, distance-gated pickup, held-sword reload, ready-without-auto-strike, player-initiated final action, and Victory gate. No captured console/page errors. |
| Actual development services | Passed real Clerk QA sign-in, hosted lethal defeat/retry, owned fall/pickup/finish saves, reload of both aftermath checkpoints, direct Victory redirect, Chapter 6 completion to all twelve objectives, completion reload, unchanged profile settings and sign-out access protection. Setup used ordered semantic commands on an isolated QA account to prepare Chapter 5; it is separate from a fresh full journey. `hosted/results.json`. |
| Save/rules regressions | Passed `continuous-battle-saves.cjs`, existing episode rules/session checks and existing local SQL suite: stage order, old saves, revision rules, stale tabs, lost-response retries, anonymous/other-owner denial, server Victory guard, history, settings and replay. |
| Existing physics | Passed cinematic battle rules, ranged spear rules, airborne spear rules and original spear sequence checks, including 120/60/30/20 Hz collision cases. |
| Asset resources | Passed retained geometry/rig/clip/vertex-colour checks and manifest generation. |
| Fresh six-chapter journey | Passed on desktop from an empty normal session through Chapters 1–6, all twelve objectives, lethal defeat/retry, ordinary and jump-shot misses, continued-spear evasions, earned hit, player sword sequence, completion reload and a fresh Replay Episode. No seeded checkpoint, review mode, altered clock or state repair; no captured console errors or failed requests. `full-episode/desktop/results.json`. |
| Final audio/action audit | Passed on the final local export: three 1.3-second non-silent groan sources (peak 0.377), Goliath mouth weight reaching 0.650, one measured full turn, duplicate pickup input ignored, and complete fall/sword/final-action flow. `final-verification/results.json` and `final-verification/desktop-groans.json`. |

The four-layout suite starts from an explicitly reducer-built prepared battle checkpoint and then uses real keyboard/mouse/CDP touch input and normal game clocks. It does not alter combat state to dodge or win. Captures were visually inspected, including combined combat controls, turn/collapse, pickup and the non-graphic cutaway. A final desktop pass covers the later controls-help clarification and initial sword-prop visibility guard; the fresh six-chapter regression and hosted pass used the same combat/checkpoint behaviour before those two small refinements.

## Practical limits

Mobile checks are Chromium viewport/touch emulation, not physical Android/iPhone GPU or Safari certification. Groans are original synthesized nonverbal effects, not a new recorded actor performance; listening and subjective timing/balance feedback remain useful. The beheading is implied through the player-triggered swing and cutaway, with no graphic body alteration. Existing art direction and environment assets are retained; this change does not claim film-quality character assets or animation. No Vercel deployment has been made by this task.

Local review candidate: `http://127.0.0.1:4215/duel.html?review=1` (isolated Chapter 5 preview). Normal Clerk/cloud candidate: `http://127.0.0.1:4214/`.
