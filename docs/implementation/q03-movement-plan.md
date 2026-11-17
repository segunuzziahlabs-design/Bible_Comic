# Q03 movement implementation plan

Use the clothed David rig and its in-place walk in the village. Measure the planted sandal's rearward travel before setting the playback rate. The Q02 samples put the authored walk near 1.05 m/s. Cap exploration at a brisk 1.8 m/s so the full-speed cycle plays at about 1.7×. Verify that the longer traversal still supports the existing objectives.

1. Add a neutral standing loop to David's editable source, preserve the Q02 acting clips, and export the game asset with the existing vertex-colour material.
2. Blend idle and walk through one AnimationTree. Advance the walk phase from actual horizontal travel so partial touch input slows the cadence and wall contact stops it. Rate-limit facing and reduce the acceleration target during sharp turns.
3. Keep actions and gameplay state separate. Reserve the animation tree for a requested one-shot until it finishes or is cancelled. Clear motion and reset the visual pose when the player respawns or restarts.
4. Check grounded travel, speed, foot motion, camera clearance and cancellation in Godot. Export the village and test keyboard movement and touch emulation, including 90° and 180° changes, wall stops and the existing Jesse–provisions–gate route.
