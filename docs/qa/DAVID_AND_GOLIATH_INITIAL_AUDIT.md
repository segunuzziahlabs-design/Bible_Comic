# Initial communication, motion and presentation audit

23 November 2026. Baseline `ce244a8277b77615e35371302cc6a8900786e4ee`. The owner's supplied improvement requirements are the implementation scope, including all six improvement groups and the complete game DVP&R workbook. No gameplay, story or account redesign is proposed.

## Verified baseline

The project is PlayCanvas 2.24.0, TypeScript and Vite with WebGL 2. Six chapters, guided routes, keyboard/touch controls, real sword/spear/sling combat, final sword control, Clerk and Supabase already exist. The working tree was clean before this task. The previous production export is retained at local port 4226 for comparison.

The existing David–Saul production-browser review was executed before changes. Five camera/speech beats, pause/resume and returned player control passed. Its desktop frame-gap median was 31.2 ms and p95 37.3 ms. This is an isolated audience review, not a full-game test. Baseline screenshots and frame samples are in `docs/qa/evidence/communication-2026-11-23/baseline-saul/`.

## Findings and corrective approach

| ID | Finding and evidence | Relevant implementation | Approach |
| --- | --- | --- | --- |
| QA-D01 | The speaking opening is visibly below David's original mouth line. In the exported model, its neutral centre is at Y 1.43193 m; the original lip crease is near 1.447–1.448 m. Saul and Goliath show the same coordinate mismatch, scaled differently. The added mouth is not a second full character, and no separate jaw bone was found. | `saul_conversation.py`, `challenge_performances.py`, `jesse_courtyard.py`; retained speaking GLBs | Align the added mouth/rim/teeth to each existing lip seam, constrain their opening and match the jaw deformation. Preserve the rig, UVs, skins and non-facial animation data. Hide interior/teeth at neutral. Verify rendered close-ups. |
| QA-D02 | `loadDavid` stores only one morph instance per target name, overwriting other surfaces. A spoken face needs the skin, lip rim and interior to receive the same intended speech weights. `loadConversationActor` already uses arrays. | `david-character.ts`, `conversation-actor.ts`, `goliath-character.ts` | One shared facial adapter collects every instance, owns speech/expression weights and resets neutral consistently. Keep the existing audio-clock envelopes. |
| QA-D03 | Existing audience reactions apply tiny periodic Head/spine rotations, without a partner target or eye tracking. Eye geometry is joined into static skinned surfaces; Jesse's eyes are part of the combined palette mesh. | `audience-performance.ts`, `cast-performance.ts`, character GLBs | Extend the current reaction controller with bounded partner-relative gaze, faster eyes and slower head/torso response, brief lookaways, blinking and listener reactions. Add lightweight eyes attached to the retained head joints, preserving placements and art style. |
| QA-D04 | Expressions mainly use positive Smile/BrowLift and blinking. They do not yet distinguish all requested emotions. | shared actor `face()` methods and chapter call sites | Contextual surprise, anger, fear, confidence, sadness, determination and happiness using restrained facial/brow/eye adjustments; keep the speech channel separate. |
| QA-D05 | Most routes already use actual-distance walk timing, smoothing and collision. Several authored transitions still sample a walk directly; idles and shoulders/hands have limited variation. | `story-motion.ts`, `character-jump.ts`, `conversation-actor.ts`, `shepherd-opening.ts`, chapter entrypoints | Retain locomotion architecture; improve blend/heading/stop policy and restrained additive posture/shoulder/hand motion. Avoid changing roots or collision through gaze and expressions. Test planted feet and actual travel. |
| QA-D06 | Wide, medium, close and reaction shots exist. Long replies have limited coverage; over-the-shoulder coverage and response-aware transitions can improve clarity. | `preparation-shots.ts`, `camp-shots.ts`, `challenge-shots.ts`, `duel-presentation.ts`, chapter framing helpers | Improve the existing shot sequences, add shoulder/reaction coverage and smooth FOV/moves; retain player camera ownership outside cinematics. |
| QA-D07 | Environments already have terrain, original grain/weave textures, fog, shadows, vegetation and moving flags. Light and material treatment vary between worlds; the valley appears flat in some views. | `elah-area.ts`, `valley-opening.ts`, `saul-pavilion.ts`, `preparation-world.ts`, `shepherd-world.ts` | Tune current lights/materials, shadow bias and depth; improve procedural texture contrast and restrained environmental movement/atmosphere within the laptop performance budget. No new art direction or post-processing dependency. |
| QA-D08 | Dialogue timelines already reject overlapping main lines and use a paused Web Audio clock. Lip cues are waveform/spectral envelopes at 30 Hz, not phoneme alignment. Scene speech/effects have existing cancellation paths. | `scene-speech.ts`, `speech-face-motion.ts`, chapter audio modules | Retain the voice recordings and rights, verify onset/offset/pause/neutral, remove conflicting controllers, and test duplicates/restarts. Profile real production rendering and loading before claiming improvement. |

## Implementation and verification order

1. Capture baseline close-ups and save geometry/rig diagnostics; prepare this audit before code changes.
2. Correct mouth geometry and shared face ownership; test neutral, opening, rounding and pause.
3. Extend the existing audience controller for partner gaze, eyes, emotion and body reactions. Integrate each conversation and the battle cast.
4. Improve existing locomotion transitions and cinematic coverage, followed by lighting/material/environment detail and loading/processing efficiency.
5. Build a separate production candidate. Inspect close-ups and moving scenes in desktop and touch layouts; capture screenshots and recordings; retest any defects.
6. Execute fresh six-chapter regression, combat/save tests, browser/layout checks and loading/frame/memory measurements. Keep live cloud and physical-device results separate from local/emulated checks.
7. Produce `David_and_Goliath_Complete_Game_DVPR.xlsx` with at least 60 traceable cases, genuine execution history, defects/evidence and formula-driven totals. Unexecuted cases remain Not Run; unavailable environments are Blocked with reasons. Render every worksheet and check exported formulas/features.
8. Publish the improvement report and local preview. Do not commit, push or deploy without a new instruction.

## Scope and verification boundaries

Preserve the six chapters, current story/cast, routes, player appearance, controls, collision/ballistics, continuous attacks, final sword action, authentication, profiles and checkpoint schemas. Do not infer that a prior passing test proves a new build. No physical-device, Safari, live identity or cloud-save pass will be recorded unless executed in the stated environment. Owner judgement of acting quality and immersion is distinct from automated geometric/timing checks.
