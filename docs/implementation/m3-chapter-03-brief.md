# M3 · Chapter 3: The Challenge

11 November 2026. Authorised by the owner's explicit request to produce Goliath's voiced challenge, soldier reactions and David's exchange with Eliab, then present the result in the browser before moving on. Uses the accepted David–Saul cinematic reference and the existing chapter/save contracts.

Implementation and actual verification: [Chapter 3 handover](m3-chapter-03.md).

## Player journey and production order

1. Enter the overlook area in an eight-second establishing shot. Keep David's youthful proportions, appearance choices and the existing Elah geography.
2. Walk to the marker and select **Hear the challenge** once. A 30-second automatic sequence shows Goliath calling for a champion, his terms and defiance, and Israelite soldiers recoiling/retreating. Give Goliath a speaking mouth and longer authored speech gestures; use a fully rigged foreground reaction and cheaper staggered motion for distant ranks. Do not begin battle or grant combat preparation.
3. Save only `challenge.heard` after its owned cue completes. Return control. Select **Speak with Eliab** separately for a 28-second automatic exchange: David questions the defiance against the living God's army, Eliab rebukes him, David answers, and a soldier indicates that Saul should hear his words. These cue durations were tightened from the initial 36/32-second estimates after generating the actual recordings, without removing story beats.
4. Save `eliab.answered` and stop at the Chapter 3 review gate. Chapter 4 production and automatic entry to Saul are outside this step.

The original adaptation follows the challenge/reaction context of 1 Samuel 17:8–11, 23–31. It compresses geography and dialogue for gameplay. It does not introduce rewards, choices that change the biblical outcome, or a new defeat condition. Dialogue is editable original paraphrase, not copied reference-film speech or a modern Bible translation.

## Architecture and assets

- Reuse Chapter 1's valley environment, foreground rig and instanced ranks through narrow optional scene inputs; keep existing default behaviour and frozen builds intact.
- Export separate challenge variants of Goliath and the adult speaker/reaction model through the established Blender-to-GLB pipeline. Preserve original assets and battle animation contracts.
- Reuse the licensed local Kokoro model/standard voice bank for Goliath, David, Eliab and soldier lines, with provenance and notices. Mouths remain waveform-driven rather than phoneme-aligned.
- Use the pause-aware speech clock for camera shots, body performances, mouths and reactions. Add timed equipment/footstep reactions, clear captions and restrained ambience.
- Keep async cue ownership and independent checkpoint commits. Normal play requires earned delivery/greeting; preview seeds that prefix only in memory and preserves actual saved progress. Reload after hearing the challenge resumes at Eliab; Restart cancels an unfinished cue.
- Connect Chapter 2's completed gate to this chapter in the new candidate. Keep Chapter 3's own gate before further production.

## Verification and exit

Build the production browser candidate, inspect rendered Goliath speech and soldier/David/Eliab performances, and capture representative evidence. Test range/duplicate input, movement, both automatic cues, pause/resume, muted captions, restart cancellation, save failure/retry, challenge-only reload and review isolation. Run portrait and landscape touch journeys, verify the actual earned Chapter 2 handoff, and measure fresh startup/download/frame pacing on the laptop. Report unmeasured physical-phone behaviour accurately. Open the tested scene for owner review. No deployment, commit, push, authentication work or Chapter 4 production.
