# CTRL-04 — David's jump movement and animations

16 November 2026 · [Plan written before implementation](../controls/ctrl04-jump-plan.md) · [Animation source/provenance](../assets/david-jump.md) · [CTRL-03 baseline](ctrl03-shared-controls.md)

**Subsequent change:** [CTRL-05](ctrl05-spear-collision.md) supersedes this build's conservative ground-plane spear rule. The new candidate on port 4198 uses actual 3D spear/capsule collision and credits a physically clear, timed low-thrust jump. The port 4197 results below remain the historical CTRL-04 baseline.

## Implemented behaviour

**Space jumps. Shift dodges.** The live game no longer uses Space as a Dodge alias. The on-screen Jump button uses the same named action and availability gate as Space. It appears only when the player has control and becomes unavailable during takeoff, flight and landing recovery. Existing touch movement remains independent of the action thumb.

One shared motor handles grounded → takeoff → airborne → landing → grounded. David can steer during flight with lower acceleration, without a double jump or repeated jumps from a held key. Existing solid walls and episode boundaries remain solid through the arc. Terrain grounding uses absolute feet height and substepped gravity. Conservative overhead bounds come from the active scene's actual roofs, beams, lintels and baggage shade; low cover limits the rise.

Current tuning is a review candidate: 0.16 s takeoff, 4.65 m/s launch speed, 14 m/s² gravity, approximately 0.77 m unobstructed rise and 0.22 s landing recovery. The normal flight is approximately 0.66 s. These are implementation values, not owner-approved balance/performance results. They do not introduce climbing or parkour.

Three original Blender clips provide planted-foot preparation, airborne tuck/balance and landing absorption. The motor supplies the actor's root motion once; local pose compression does not supply another travelling arc. The existing David model, teenage proportions, hair/skin/clothing choices and story performances remain. [Animation-only GLB and source](../assets/david-jump.md).

Jump is integrated into the field/courtyard journey, Elah exploration, camp, challenge, preparation/practice and duel controllers. Pausing freezes the arc. Restart and battle/story handoff cancel transient jump state. Interaction, ordinary throwing and Dodge wait for jump recovery; there is no queued action that automatically executes on landing. Jumping does not grant objective credit, consume stones or alter the save schema.

**Spear defence remains conservative.** CTRL-05's swept 3D spear/capsule test is not implemented here. The existing ground-plane spear rule still applies while David is airborne: jumping grants no immunity or evasion credit. Shift Dodge remains the supported defence. CTRL-06's cinematic jump shot is also not implemented. Goliath retains his spear.

## Camera and controls

Follow cameras track a filtered portion of the jump height and keep movement/look input available. Camera height respects overhead clearance. The practice view now frames the full character with a longer portrait arm and lower focus, addressing a real landing-frame failure caught by the browser test. The duel's unlocked-sling view uses a slightly longer arm and wider lens to retain David through a moving jump. Authored story shots are retained.

The right-side Jump target is at least 64 × 56 px. Small portrait layouts stack it above Throw and place Leave practice/Dodge higher so they cannot overlap. The left stick/direction-key preference and labels remain separate from episode saves. Help, prompts and the production battle shortcut text have switched together to Space Jump / Shift Dodge.

## Engineering record

- [jump-motion.ts](../../apps/playcanvas/src/gameplay/jump-motion.ts): reusable state/gravity/ground/ceiling motor.
- [character-jump.ts](../../apps/playcanvas/src/world/character-jump.ts): active overhead bounds, scene grounding, animation sampling and camera offsets.
- [jump-animations.ts](../../apps/playcanvas/src/world/jump-animations.ts), [David loader](../../apps/playcanvas/src/world/david-character.ts) and [conversation actor](../../apps/playcanvas/src/world/conversation-actor.ts): shared clips, retained rigs and per-app resource cache.
- [Router](../../apps/playcanvas/src/gameplay/action-router.ts), [input adapter](../../apps/playcanvas/src/gameplay/movement-input.ts), [control UI](../../apps/playcanvas/src/app/player-controls-ui.ts) and [styles](../../apps/playcanvas/src/app/player-controls.css): real Jump action, availability refresh, touch layout and new bindings.
- Actual chapter controllers and [battle movement](../../apps/playcanvas/src/world/movement-area.ts): physical root placement, locomotion/jump blending, grounded action gates, pause/restart and camera handoff. Airborne horizontal motion does not create walking footstep sounds.

No dependencies, service configuration, schemas, dialogue, new chapter content, deployment, commit or push. Earlier frozen builds and owner progress are retained.

## Verification evidence

**Final result: PASS.** Production build/typecheck, story/save rules, motor/router checks, asset structure validation and all 16 browser cases passed: four practice layouts, six story-environment cases, three battle layouts and three focused pavilion/airborne-defeat cases. Owner review of the actual animation and play experience remains separate from technical verification.

The [browser harness](../../apps/playcanvas/tests/ctrl04-jump-browser.cjs) uses the production export, real keyboard/mouse/touch input and the existing DOM inspection interface. Review/checkpoint fixtures are explicit; game clocks and state are not advanced or repaired to obtain successful outcomes.

| Check | Evidence |
| --- | --- |
| Build/typecheck and story/save rules | `build/ctrl04-build.log`; existing `test:story` command. |
| Motor and input map | [Motor checks](../../apps/playcanvas/tests/jump-motion-check.cjs) and [router checks](../../apps/playcanvas/tests/action-router-check.cjs): arc/landing, differing time steps, repeat rejection, roof limit, terrain grounding, reset, Space Jump and Shift Dodge. |
| Practice/animation/camera | [Practice results](evidence/ctrl04-2026-11-16/practice-results.json): desktop, 390 × 844, 844 × 390 and 320 × 568. Actual bone deformation, all three clips, visible root lift, head/foot framing, one jump while held, moving jump, pause/resume, two-thumb ownership, grounded throw gate and restart. Explicit prepared practice fixture. |
| Story environments and clearance | [Chapter results](evidence/ctrl04-2026-11-16/chapters-results.json): portrait/landscape field, Camp and Challenge; real courtyard wall and baggage-shade clearance. Landscape also completes the fresh Jesse conversation, courtyard pickup, carried journey and Elah entry before testing that follow camera. |
| Battle | [Battle results](evidence/ctrl04-2026-11-16/battle-results.json): three layouts; approach jump, confrontation handoff, jump distinct from Dodge, retained lethal strike, Retry Battle, three actual Shift/touch evasions, moving jump and grounded forehead hit. Explicit prepared Chapter 5 review fixture. |
| Pavilion and mid-air defeat | [Additional results](evidence/ctrl04-2026-11-16/extra-results.json): pavilion camera in both orientations and a reducer-built retry-checkpoint fixture for an actual late-windup airborne hit and clean Retry Battle. |

The JSON status records determine which checks actually passed. An earlier portrait failure capture records the pre-fix camera crop and is diagnostic history. Videos and stage captures are actual browser output. Responsive touch emulation establishes layout/input behaviour; it does not establish physical-phone GPU performance. No new loading/frame-pacing baseline, full six-chapter release regression, or owner acceptance of animation quality is claimed.

## Local review

- [Immediate jump/practice review](http://127.0.0.1:4197/preparation.html?review=1&practice=1): Start sling practice, then Space or Jump. Use the movement gear to change layout. This review fixture leaves saved episode progress unchanged.
- [Episode from the beginning](http://127.0.0.1:4197/episode.html): automatic field opening; Jump appears when the messenger exchange returns control.
- [Candidate manifest](evidence/ctrl04-2026-11-16/candidate-manifest.json): exact local build inventory/hashes; file total is not a network-loading measurement.
- [Desktop recording](evidence/ctrl04-2026-11-16/desktop-jump.webm), [portrait recording](evidence/ctrl04-2026-11-16/portrait-jump.webm), [landscape recording](evidence/ctrl04-2026-11-16/landscape-jump.webm).

The practice preview was requested in the Codex browser panel; the app reported that opening as **queued**, so no claim of an observed in-app playthrough is made for this pass. The actual Chrome browser tests, recordings and captures above provide the verification. Use the immediate-review link to enter and try the controls.

```powershell
npm.cmd --prefix apps/playcanvas run preview -- --outDir ../../build/playcanvas-ctrl04 --host 127.0.0.1 --port 4197 --strictPort
```

Next separate task is CTRL-05: evaluate and test physical spear/capsule trajectories against airborne David. It must preserve fair telegraphing, lethal defeat and Retry Battle before CTRL-06 introduces the animated jump shot.
