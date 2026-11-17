# Elah transition and David Saul cinematic

**Review ready.** The full desktop episode regression and the final desktop/portrait/landscape cinematic and brook checks passed. M4 remains outside this change.

17 November 2026. [Implementation plan](elah-saul-cinematic-polish-plan.md) / [Previous CTRL-07 candidate](ctrl07-episode-integration.md).

[Play David before Saul](http://127.0.0.1:4202/preparation.html?review=1&cinematic=1). Select **Play David before Saul** to unlock sound and start the audience. This existing Chapter 4 review uses temporary episode state and leaves normal saved progress unchanged. [Play the complete episode](http://127.0.0.1:4202/episode.html). The earlier export remains on port 4201.

## Elah diagnosis and correction

The frozen CTRL-07 build was profiled through a fresh normal Chapter 1 journey using actual controls and unchanged story clocks. Two long transition frames measured **2,118.7 ms** and **1,434.2 ms**. Their render work measured 2,086.5 ms and 1,419.8 ms, while scene updates were about 3.6–3.8 ms. CPU sampling identified `getProgramParameter` inside `WebglShader.finalize` → `activateShader` → drawing. The two largest program checks consumed about **3,186 ms** combined. Installed Engine 2.24.0 checks `gl.LINK_STATUS` there: first-use shader linking, rather than hierarchy animation or the audio clock, was the main measured cause.

[Baseline measurements](evidence/elah-saul-2026-11-17/baseline-profile/results.json) / [CPU self times](evidence/elah-saul-2026-11-17/baseline-profile/cpu-self-times.json) / [Chrome CPU profile](evidence/elah-saul-2026-11-17/baseline-profile/transition.cpuprofile).

Chapter 1 now renders three representative Elah views behind an opaque entry screen before Begin becomes available. The actual scene/material/instancing variants are prepared; both speech clocks remain suspended, no objective is granted and the pasture view is restored before play. The normal handoff then uses the prepared programs.

| Measurement | Observation |
| --- | --- |
| Former transition, CPU-sampled run | 2,118.7 ms largest gap; another 1,434.2 ms gap |
| Prepared transition, matched CPU-sampled retest | 58.0 ms largest gap; former long program checks absent |
| Final candidate, separate fresh Chrome process without CPU sampling | 42.1 ms largest gap |
| Entry ready, baseline | 5.279 s |
| Entry ready, first prepared diagnostic run | 10.866 s |
| Entry ready, separate final repeat | 7.546 s |

This removes a large stall from the playing story by doing the work during initial preparation. It does **not** make shader compilation free or establish a faster overall cold start. Startup cost remains visible and variable. [Prepared CPU retest](evidence/elah-saul-2026-11-17/warmed-profile/results.json) / [Final normal retest](evidence/elah-saul-2026-11-17/final-transition/results.json). The warm-up-only CPU retest predates the pavilion visual changes; final normal/regression checks use the integrated candidate.

## Pavilion to brook regression correction

The first integrated desktop run completed all twelve objectives, but its unfiltered transition trace exposed a **1,754.2 ms** gap from armour refusal to the brook. The richer pavilion and the brook use different light/material variants. Chapter 4 now prepares the brook views before Begin and restores the pavilion and original player pose. Speech stays suspended and no progress is committed during preparation.

A targeted normal-save recovery test restored the **actual seven-objective checkpoint** earned in that full run. It confirmed that preparation leaves the saved run unchanged, then declined the armour through the real UI. The decline-to-brook gap measured **32.7 ms**, the brook returned control, and the next objective was five stones with eight confirmed objectives. Entry preparation took **6.011 s**. This is a recovery fixture, not an invented fresh whole-episode result. [Targeted results](evidence/elah-saul-2026-11-17/brook-handoff/results.json).

## David and Saul presentation

- Added explicit neutral tone mapping, warmer entrance illumination, a cooler facial fill and rim, and a shadow-casting canopy. One sun supplies the shadow map; the added fill lights do not add shadow maps or fullscreen post-processing passes.
- Refined linen weave and sand texture, hanging embroidery, a portable campaign seat and field tents visible beyond the entrance. New textures and geometry are original procedural work; character models, voices and their existing licences are retained. The seat has collision bounds.
- Reframed the wide shot, over-shoulder view, Saul's concern, David's answer, guard reaction and blessing. David/Saul dialogue angles retain a consistent eyeline, with restrained camera movement and portrait headroom.
- Added small breathing/head reactions over the existing authored clips, a listening nod and a softer blessing expression. Additive offsets restore before each new pose so they do not accumulate, survive restart or alter later armour/locomotion poses.
- David's voiced answer continues and returns his existing gesture instead of freezing on the last clip frame. Existing timed mouth envelopes remain tied to the paused voice clock.
- A direct review link starts the audience with one Play action. During the scene the hint says to watch and pause; normal movement and the armour objective return afterward. Normal Chapter 4 still requires its existing Speak action.

The first orange-heavy lighting trial was rejected after viewing captures; the retained treatment raises David's facial fill and balances the linen/daylight colour. These changes improve presentation within the current character art style; they do not supply new facial anatomy, phoneme-specific lip sync or photorealistic replacement models.

## Browser verification

**PASS:** a fresh normal desktop run earned all twelve ordered objectives, played the revised audience and armour steps, recovered saved checkpoints, gathered stones automatically, practised sling misses/hits, suffered lethal defeat, retried battle, won, saved completion and started a fresh replay. [Full normal results](evidence/elah-saul-2026-11-17/final-episode/desktop/results.json) / [silent automated browser recording](evidence/elah-saul-2026-11-17/final-episode/desktop/complete-episode.webm).

**PASS:** the final review link completed the 40-second audience in all three layouts with actual keyboard/touch input, five pause/resume beats, finite moving head joints, nonzero mouth movement, restart during the cue without early progress, and returned control at the armour objective. Review mode left normal episode storage untouched. Final brook checks used an actually earned checkpoint and verified the saved prefix remained unchanged during preparation.

| Final layout | Cinematic | Frame median / p95 | Brook handoff |
| --- | --- | --- | --- |
| Desktop | PASS | 20.5 / 23.8 ms | 13.0 ms |
| Portrait | PASS | 20.8 / 23.7 ms | 27.7 ms |
| Landscape | PASS | 20.3 / 23.6 ms | 26.9 ms |

[Summary](evidence/elah-saul-2026-11-17/verification-summary.json) / [Desktop scene](evidence/elah-saul-2026-11-17/review-ready/desktop/results.json) / [Portrait scene](evidence/elah-saul-2026-11-17/review-ready/portrait/results.json) / [Landscape scene](evidence/elah-saul-2026-11-17/review-ready/landscape/results.json). Build/typecheck and the episode/save, arrival and 500-cycle additive-pose restoration checks passed. No console, shader or asset-load errors were reported by the cinematic/full-episode runners.

The recorded full regression predates only the final adjustment centring David's temporary warm-up pose on the practice target for portrait rendering. Final startup, cue and brook recovery checks cover that change in all layouts; active story, camera, animation and controls are unchanged. [Recorded-regression export hashes](evidence/elah-saul-2026-11-17/regression-manifest.json) / [Final review export/source hashes](evidence/elah-saul-2026-11-17/candidate-manifest.json).

Inspected captures: [before Saul](evidence/elah-saul-2026-11-17/visible-before/saul-concern.png), [after Saul](evidence/elah-saul-2026-11-17/review-ready/desktop/saul-concern.png), [wide](evidence/elah-saul-2026-11-17/review-ready/desktop/wide.png), [portrait David](evidence/elah-saul-2026-11-17/review-ready/portrait/david-answer.png), [landscape blessing](evidence/elah-saul-2026-11-17/review-ready/landscape/blessing.png). Baseline desktop audience pacing was median 20.4 ms / p95 23.5 ms; the final values above are comparable local observations, not a claimed frame-rate improvement.


Comparison screenshots freeze the real scene with Pause and hide only the pause notice during capture so its blur does not obscure the image. They are intentionally different visual treatments, not a claim of pixel-identical output. Review fixtures are not counted as fresh complete-episode runs.

## Scope and remaining acceptance

The six-chapter story, objectives, save schema, character customisation, sling rules and Retry Battle are retained. M4 has not started. No dependencies/plugin installation, deployment, commit or push.

Desktop performance observations use this laptop and Chrome; portrait/landscape use touch emulation. They do not certify phone GPU or Safari performance. Final aesthetic acceptance remains Segun's review. Initial entry preparation and the existing large-chunk build warning remain optimisation items.

## References

Applied the reviewed [PlayCanvas skills revision](https://github.com/playcanvas/skills/tree/8fd2b2679cf1e8716e1113fd10b51ef2fe8d2857): [runtime inspection](https://github.com/playcanvas/skills/blob/8fd2b2679cf1e8716e1113fd10b51ef2fe8d2857/skills/inspect-runtime/SKILL.md), [lighting](https://github.com/playcanvas/skills/blob/8fd2b2679cf1e8716e1113fd10b51ef2fe8d2857/skills/light-scene/SKILL.md), [animation](https://github.com/playcanvas/skills/blob/8fd2b2679cf1e8716e1113fd10b51ef2fe8d2857/skills/configure-animation/SKILL.md), [first-use shader preparation](https://github.com/playcanvas/skills/blob/8fd2b2679cf1e8716e1113fd10b51ef2fe8d2857/skills/add-effects/SKILL.md), and [visual comparisons](https://github.com/playcanvas/skills/blob/8fd2b2679cf1e8716e1113fd10b51ef2fe8d2857/skills/verify-pixels/SKILL.md), checked against the installed Engine rather than installing the plugin or executing its scripts.
