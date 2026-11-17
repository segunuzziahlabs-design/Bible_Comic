# M3 · Chapter 6: Victory

12 November 2026. Segun explicitly authorises the Philistine retreat, Israelite soldiers cheering and story conclusion, followed by browser review. This is the scoped implementation plan. It retains the approved non-graphic ending and the revised Chapter 4/5 controls.

[Implementation, actual browser evidence and review route](m3-chapter-06.md).

## Player experience and order

1. Connect the confirmed Chapter 5 outcome to **Continue to Victory** and a separate `victory.html` page. Normal entry requires the actual eleven-objective prefix. Review mode seeds that prefix in isolated memory; it does not modify a normal run.
2. Open with the fallen champion and a short recognition beat. The shield-bearer and Philistine ranks turn and flee with staggered starts, visible running motion, retreat calls and equipment/footstep sound.
3. Show Israelite foreground soldiers lifting their arms/shields and reacting, backed by cheaper crowd groups. Add original generated cheering layers, mouths and timed reactions. Use the existing licensed local voice model and existing character pipeline; do not import reference-film audio or external art.
4. Close on youthful David's response, a restrained original musical cue and narration communicating the story's faith/courage meaning. Verse 51 retains the prior approved family-safe, non-graphic treatment: camera attention follows the armies and David's reaction. No new graphic action or combat mechanic.
5. Finish the approximately 35–40-second sequence before accepting `victory.witnessed`. Chapter and episode completion commit in the existing atomic save. Show factual completion, all six chapters and existing attempts/defeats; no XP, stars, rewards or invented achievements.
6. Offer replay of the conclusion without changing a completed run and **Replay episode**, which uses the existing session API to preserve the prior result in history and create a fresh run. Return links use the existing episode entry; no unbuilt dashboard/authentication claim.

## Engineering and asset work

- Dedicated victory coordinator, shot timeline, audio wrapper and world activity. Reuse established Elah terrain, teenage David/appearance, fallen Goliath and clothed army assets.
- Author separate soldier cheering/running clips and inexpensive baked crowd poses where needed, preserving earlier GLBs. Foreground actors receive detailed animation; distant ranks share instanced poses with varied timing.
- Share a pause-aware audio clock for recorded lines, cheers, music, animation and camera. Pause/mute/restart and visibility loss must stop/resume consistently. Restart cancels the old sequence and grants no early credit.
- Preserve `m2-outline-1`, ordered objectives, cue ownership, revision checks and save recovery. Failed completion writes pause at the ending and offer retry/reload; stale tabs cannot overwrite newer progress.
- Keep earlier frozen builds. Produce a new local candidate on port 4189. No deployment, commit/push, auth/backend work, extra episode or reward system.

## Shot proposal

| Time (proposed) | Visual and audio |
| --- | --- |
| 0–3 s | Quiet fallen-champion/army recognition beat. |
| 3–12 s | Shield-bearer turns; staggered Philistine running groups, retreat call and footsteps. |
| 12–22 s | Israelite cheer rises, foreground arm/shield gestures and group cheering, David looks toward his people. |
| 22–30 s | David's response, listener reaction and musical resolution. |
| 30–38 s | Closing narration, wide Elah/David frame and episode-complete result. |

Final line timings follow the generated recordings and will be recorded in the implementation handover.

## Verification/exit gate

Production build/rules and actual browser captures must establish moving retreat actors, real cheering poses and non-silent voice/crowd/score output. Verify pause/mute/restart, no duplicate cheering after restart, no completion before the end, real Chapter 5 handoff, normal completion/reload/replay/history, failed/stale save recovery and preview isolation. Exercise portrait and landscape touch layouts; record a representative exclusive laptop startup/frame sample and its limits. Emulation is not physical-phone/Safari performance evidence. Show the browser result for owner creative review before further product work.

[Current plan](../roadmap/project-reset-plan.md) · [Chapter 5](m3-chapter-05.md) · [Latest controls](m3-controls-polish.md)
