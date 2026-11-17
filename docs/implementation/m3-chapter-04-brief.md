# M3 · Chapter 4: Preparation

11 November 2026. The owner explicitly authorised David's audience with Saul, trying and declining the armour, gathering five stones and sling practice, with a browser review before moving on. This brief records the scoped implementation order before gameplay changes.

Implementation, playable route, actual checks and measured limits: [Chapter 4 handover](m3-chapter-04.md).

## Player journey

1. Enter Saul's pavilion, approach and select Speak once. Retain the accepted 40-second voiced David–Saul conversation, acting and camera treatment. Commit only `saul.audience` at the owned cue's end.
2. Approach the equipment and select Try the armour. Show a fitted loaned coat/helmet, fitting gestures, an awkward trial walk, speech and equipment sound. Save `armour.inspected` after the performance. David remains visibly armoured until the separate refusal.
3. Select Set aside the armour. Play David's voiced refusal and removal, restore the equipment to the stand, and commit `armour.declined`. A short authored transition leads to the brook.
4. Collect five distinct smooth stones through individual contextual actions and a crouch/reach/put-away performance. Track the count and exclude duplicate collection. The existing save contract commits `stones.gathered` after all five; unfinished partial collection repeats on Restart/reload. Do not claim per-stone durable saves or silently change the schema.
5. Approach a woven practice target, aim with drag or I/J/K/L, and throw with Space or the touch button. Use the existing authored sling action with visible cord/pouch/projectile, hit/miss feedback and sound. Misses allow another attempt without defeat. A confirmed practice hit and its closing beat commit `sling.practised`.
6. End at the Chapter 4 review gate with actual preparation earned. Do not automatically enter the duel or produce Chapter 5.

## Engineering and production order

- Preserve existing source models, frozen previews, ordered objectives, cue ownership and local async save adapter. A new `preparation.html` scene owns the five existing Chapter 4 objectives and uses isolated review mode with only the first three chapters seeded.
- Reuse the accepted pavilion and dialogue assets. Add separate David preparation assets/animations and original fitted/stand armour geometry; keep the adolescent proportions and saved appearance choices.
- Build a small original brook area with limestone, shallow water, vegetation, five pickup objects and a woven target. Toggle owned scene roots/lights at the area transition rather than loading a combat scene.
- Use the shared speech clock for shots, animation, wardrobe/prop events and pause. Generate only the additional original lines through the previously rights-checked local voice pipeline. Keep voices/captions clear and no reward system.
- Keep audience, fitting, refusal, complete stone collection and practice as separate checkpoint commits. Reload restores the corresponding area and armour/inventory state; failed writes preserve the prior checkpoint and offer retry.
- Add an earned handoff from Chapter 3 to this scene in the new build. The standalone Saul sample remains available.

The story basis is 1 Samuel 17:32–40. The target/practice exercise is an explicit game adaptation, not an event claimed to be in the passage. Fitting/removal are stylised authored performances, not cloth simulation or physical dressing. No provider spend, deployment, commit, push, authentication work or later-chapter production is included.

## Verification and review gate

Inspect actual browser renders of the audience, worn armour and joints at conversation/gameplay distances, trial movement, removal, hand/stone contact and the sling/projectile. Exercise ordered interactions, range/collision, one credit per cue, pause/resume, restart cancellation, save failure/retry, armour/area reload, five distinct pickups, miss/retry/hit and final preparation flags. Test portrait/landscape touch controls, actual Chapter 3 handoff, loading and frame pacing; retain evidence and report unmeasured phone performance. Open the tested scene for owner review before Chapter 5.
