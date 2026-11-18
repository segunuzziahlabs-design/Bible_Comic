# Cinematic battle implementation plan

18 November 2026. Scope: Chapter 5 only, plus shared components where the chapter opts in. Preserve six chapters, Clerk/profile gates, server-confirmed objectives, prior preparation, defeat/retry and Victory. No deployment, commit, push or dependency upgrade is part of this change. The pending public `.env.example`/hosting edits are preserved.

## Inspection

The existing `elah-battle.ts` controls entrance/challenge/combat, three spear evasions and a straight-line stone projectile. `movement-area.ts` already owns keyboard/touch movement, physical jump/dodge, aiming and follow camera. `elah-area.ts` samples the actual animated weapon joints for swept collision and renders the spear. `duel-presentation.ts` supplies voiced scenes, soldiers and cinematic framing. `duel-main.ts` confirms the existing `goliath.struck` objective after the fall and writes lethal defeat/retry through the existing account save adapter.

Retain these boundaries. The ranged Goliath GLB contains walk, ready, speech, spear throw and fall, but no sword draw/strike. Add those performances and a sword to a separate derivative asset using the existing Blender pipeline; retain the original assets for other scenes.

## Implementation order

| Step | Implementation and output | Completion evidence |
| --- | --- | --- |
| CB-01 | Add deterministic sword sweep and ballistic stone helpers; extend the existing encounter with an opt-in sword → spear → sling stage gate. | Geometry/state tests: actual contacts, four escape directions, stage order, no early throw, retry resets and one projectile per release. |
| CB-02 | Author sword draw, overhead strike and impact reaction on the existing Goliath rig. Sample real blade markers; synchronize warnings and impacts with the clip clock. | Blender/GLB validation and actual browser captures of draw, strike, miss and lethal contact. |
| CB-03 | Integrate controller, camera, concise stage warnings, independent position/aim guidance, forehead marker and ballistic trajectory preview. | Desktop and portrait/landscape keyboard/touch cases; position and aiming changes produce calculated feedback. |
| CB-04 | Add an earned finishing replay, enabled only by a confirmed forehead collision; preserve the verified shot path, then play impact/fall and existing Victory handoff. | Misses never enter the replay; hit enters it once; pause/resume and mission confirmation remain ordered. |
| CB-05 | Build a separate production candidate; test lethal sword/spear hits, all dodge directions, misses and accurate shots, retry/reload, normal story integration and hosted persistence. Document limits and expose the local review link. | Browser results/captures, typecheck/build, rules/SQL regression and saved objective/defeat/retry evidence. |

## Combat decisions within the requested scope

- One successfully evaded sword strike, followed by two successfully evaded spear throws, unlocks the sling. Warnings lock the intended strike/landing location; David is never automatically displaced to safety. Ordinary movement can evade; Shift/touch Dodge remains an optional faster step. Actual lethal contact retains the existing Goliath-defeat rule.
- Sword approach closes the gap for a readable overhead chop. The spear stage restores the existing roughly 9.5 m separation. A brief establishing angle ends during the warning, leaving reaction time and uninterrupted control.
- Stones use fixed launch speed and gravity. Pointer/drag/aim keys choose direction; neither preview nor release retargets to the forehead. Swept projectile contact earns the hit. Range guidance is advice calculated from distance and trajectory, not an invisible rule invalidating a physical hit.
- Misses retain control and allow another shot; the existing brook refill prevents ammunition soft locks. Retry restarts this battle's required stages and preserves all earlier preparation. The existing save schema is unchanged; an interrupted unfinished battle resumes from its entrance rather than persisting transient projectiles/stages.
- The post-hit jump/sling presentation is explicitly a **cinematic replay** of the earned decisive throw, not a second gameplay stone or a second opportunity to change the result. Its stone follows the recorded successful ballistic path. Impact reaction and the retained fall lead into Chapter 6. No replay, fall or objective confirmation occurs from pressing Throw alone.
- Existing generated dialogue and sound beds are reused. Extend the existing procedural weapon/ground sound system and use bounded reusable impact/trajectory geometry; do not add unlicensed media or another physics/rendering framework.

## Verification and limits

Use isolated browser contexts and clearly labelled reducer-built prepared checkpoints for repeatable battle cases; do not alter the owner's saves. Test the new production export, not only Vite/editor state. Test responsive desktop/laptop, portrait and landscape layouts with real keyboard/CDP touch input. An actual complete episode run is separate from a prepared battle fixture. Hosted save verification uses only the existing dedicated development services/test identities; it is distinct from the local engine test candidate. Do not claim physical-phone/Safari performance from Chromium layout emulation.

Raw screenshots, recordings and detailed results belong under ignored `docs/implementation/evidence/cinematic-battle-2026-11-18/`; summarize the executed results and any failures in `cinematic-battle.md` at completion.

PlayCanvas references checked for this implementation: [animation layers/state graph and rebind](https://api.playcanvas.com/engine/classes/AnimComponent.html), [camera projection and screen/world conversion](https://api.playcanvas.com/engine/classes/CameraComponent.html). Use the installed 2.24.0 APIs and existing manual paused-clock animation sampling; no engine upgrade is needed.
