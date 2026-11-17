# Jesse personally sends David from his courtyard

13 November 2026 · [Correction plan](jesse-courtyard-correction-plan.md) · [Asset/voice sources](../assets/jesse-courtyard-assets.md)

**Latest clarification:** [Flock, messenger and audio correction](opening-messenger-audio.md) restores a distinct messenger's summons in the first field scene. The keeper watches the flock; Jesse still gives the errand and the provisions are still collected in his courtyard. This report describes the preceding frozen candidate.

The owner corrected the opening's staging: David meets Jesse to receive his errand and takes the provisions in Jesse's courtyard. This supersedes the earlier messenger-delivered errand and flock-site pickup in the [cinematic engagement candidate](cinematic-engagement.md).

## Revised opening

1. David watches and tends the sheep, as before.
2. The keeper comes to watch the flock and tells David that his father is waiting at home. The keeper does **not** give the provisions errand.
3. The player follows **Speak with Jesse** through the open courtyard entrance. Jesse is the retained grey-bearded, clay-mantled father model, with greeting and pointing clips and added speaking mouth controls.
4. One Speak action starts the automatic, voiced exchange. Jesse greets David; David listens; Jesse gives the grain/loaves/cheeses errand; David accepts; Jesse sends him on his way. The camera alternates between the father, son and provisions. Captions and mouth animation follow the recordings; pause holds the scene and audio together.
5. Control returns with **Take the provisions**. The bundle stays on the low courtyard bench until the conversation finishes. The player must approach and perform this separate action to collect it.
6. David carries the bundle through the rear gate to the ridge discovery, Elah arrival and existing survey checkpoint. The same run then continues to Camp.

The courtyard includes plastered homes on stone footings, flat timber/reed roofs, jars, shade, herbs and open entry/exit routes. This remains stylised scenery. The low bench and Jesse have collision bounds. Pickup alignment stays outside the bench collider. The keeper's reused character has royal accessories hidden. A local prologue shadow-bias correction reduces striping on the new flat walls; the Elah lighting setting is restored on handoff.

## Controls, state and preservation

Desktop: WASD/arrows move; E or the displayed button interacts; Escape/Pause pauses. Touch uses the existing left stick, look drag and contextual action. Destination labels/distance/arrows guide Jesse, the bench, ridge and exit. Repeated input during the conversation cannot replay it or collect provisions early.

The twelve ordered objectives, browser-local save schema, appearance options and Chapters 2–6 are retained. No account, battle or reward system was changed. The new opening remains part of Chapter 1 before its first aggregate checkpoint: reloading an unfinished opening starts Chapter 1 again, as stated at entry. Restart cancels dialogue and resets the conversation/pickup permission.

## Verification

The focused [browser test](../../apps/playcanvas/tests/courtyard-opening-check.cjs) uses actual input from fresh normal episode entries without seeded progress or presentation-clock changes. Evidence: [courtyard results](evidence/jesse-courtyard-2026-11-13/courtyard-results.json).

| Check | Status |
| --- | --- |
| Desktop 1280 × 720: shepherd → keeper → Jesse → pickup → discovery → Elah survey → same-run Camp | Final build passed. No pickup before speaking, bench collision, Jesse/David mouth motion, pause and once-only exchange were checked. |
| Portrait 390 × 844: touch movement, conversation, pickup and Elah arrival; restart during Jesse dialogue | Passed in Chrome touch emulation. Dialogue cancellation, reset permission and no page overflow checked. |
| Landscape 844 × 390: touch courtyard access, conversation, pickup and Elah arrival | Passed in Chrome touch emulation. Input, pickup alignment outside the padded collider and no page overflow checked. |
| Final David reply framing, all three viewport sizes | [Passed](evidence/jesse-courtyard-2026-11-13/reverse-camera-results.json). Another real fresh approach/Speak verifies that David's face stays inside the picture and Jesse's head does not obscure it. Actual screenshots were visually inspected. This check uses viewport changes, not additional touch playthroughs. |
| TypeScript/production build and ordered story/save rules | Passed. The retained Vite engine-chunk warning remains. |
| Asset/provenance checks | Passed: 9,919 triangles, three Jesse meshes, retained clips/mouth targets, final WAV hashes and generator model/voice-bank hashes matching the previously licensed sample. |

The first test-authoring iterations used an exact floating-point position comparison and an approach point outside the real interaction radius; these harness assertions were corrected. They are not reported as gameplay defects or passed runs. The final test additionally checks the corrected pickup position against the padded bench collision boundary.

The three-layout flow run precedes the last reverse-camera position correction; the additional fresh camera check covers that final offset at all three viewports. This follow-up verifies the changed opening and handoff. It does **not** claim another full Chapters 1–6 playthrough or a new episode-wide performance baseline; the earlier complete-run evidence applies to the previous opening candidate. Physical-phone performance and Safari were not tested. Mouth motion remains audio-envelope driven rather than phoneme-aligned.

Representative captures: [Jesse's instruction](evidence/jesse-courtyard-2026-11-13/desktop-jesse-errand.png), [David's corrected reply shot](evidence/jesse-courtyard-2026-11-13/reverse-desktop.png), [portrait reply](evidence/jesse-courtyard-2026-11-13/reverse-portrait.png), [courtyard pickup](evidence/jesse-courtyard-2026-11-13/desktop-pickup.png).

## Browser review

**[Play the corrected episode](http://127.0.0.1:4192/episode.html).** A separate retained in-app browser tab has been walked through the flock/keeper opening to Jesse's courtyard and left with **Speak with Jesse** ready. [Observed browser state](evidence/jesse-courtyard-2026-11-13/browser-courtyard-ready.png). Select it to watch the full exchange; control then returns for the separate pickup. Restart replays the opening.

Ports 4190 and 4191 and their origin-specific saves remain intact. [Candidate hashes](evidence/jesse-courtyard-2026-11-13/candidate-manifest.json) identify **COURTYARD-20261113-01**. The corrected output is `build/playcanvas-jesse-courtyard`, served locally with:

```powershell
npm.cmd --prefix apps/playcanvas run preview -- --outDir ../../build/playcanvas-jesse-courtyard --host 127.0.0.1 --port 4192 --strictPort
```

No deployment, commit or push. Review this scene before moving to another milestone.
