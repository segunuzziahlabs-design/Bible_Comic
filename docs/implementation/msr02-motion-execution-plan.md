# MSR-02: motion foundation execution plan

20 November 2026. Extends the [motion and guided-routes plan](motion-speech-and-guided-routes-plan.md), using the [MSR-01 browser baseline](../quality-review/motion-speech-and-route-baseline.md).

1. Replace the Jesse/camp end-frame holds with explicit forward gesture timing, a completed pointing gesture and restrained breathing/listener reactions. Keep original voices, cue lengths, interaction count and prop-release frames.
2. Give story David an idle/walk blend driven by actual collision-resolved travel. Preserve existing movement speed, acceleration, camera, jump physics and input. Limit body-turn speed while retaining immediate movement response. Keep one-shot actions and the combat controller separate.
3. Check timing/turn policies, additive-pose restoration, TypeScript and story rules. Build an isolated local candidate; do not change authentication or deployment settings.
4. Use actual browser input to review Jesse, the baggage keeper and Eliab, walking/start/stop/reversal, blocked movement, jump and provision contacts on desktop and portrait/landscape touch layouts. Record screenshots and pose traces; run a fresh full episode regression for shared-animation changes.
5. Record verified results and limitations in an MSR-02 report; update the defect log only from evidence. Show the candidate in the browser for owner review. No new routes, voice recording, commit, push or deployment in this task.

Exit: D01/D02 holds resolved in browser evidence; no new control lock, prop discontinuity, progression regression or console error. Visual naturalness and speech delivery still require owner review; touch emulation is not a physical-device test.
