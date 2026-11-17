# Flock first, messenger summons and Chapter 1 sound

13 November 2026 · [Implementation plan](opening-messenger-audio-plan.md) · [Messenger asset/voice record](../assets/opening-messenger-assets.md)

**Superseded opening trigger, 16 November:** the current [automatic opening](automatic-opening-and-control-design.md) removes the required Tend action. The messenger now walks in while David tends the lamb automatically. This document and port 4193 remain the historical candidate/audio record; use port 4194 for current review.

The owner clarified the intended opening and reported silence until Chapter 2 in Codex's in-app browser. The opening remains David in the field with the flock. A **separate messenger** walks from the courtyard entrance to David and says that Jesse is calling. The keeper remains responsible for the sheep. The player then walks to Jesse's courtyard, watches the retained father–son exchange after one Speak action, and collects the bundle there with a separate Take action.

The messenger gives only the summons. Jesse personally gives the provisions errand. There is no field-site pickup. The eight sheep, tending action, countryside, father model, courtyard, ridge discovery, Elah survey, twelve objectives and existing local save contract remain.

The field is the first scene after **Begin Chapter 1**. Tend the marked lamb to trigger the messenger's arrival. His walking distance, mouth motion, voiced summons and the distinct stationary keeper are verified. David then receives control for the walk to his father. The first review is now left at the **beginning**, rather than walking ahead to the courtyard as in the preceding handoff.

## Sound investigation and changes

The exact cause of the owner's earlier silence was **not reproduced**. The previous frozen Chapter 1 produced narration in a fresh Chrome process under gesture-required autoplay, with measured output up to approximately 0.138 RMS. The voice files were present. This prevents treating a missing recording, mute flag or autoplay restriction as a proven diagnosis.

The start path did have weaknesses worth correcting: it awaited work on the inactive valley context before requesting opening playback, and the preloaded Elah context's first resume was left to an automatic handoff. Chapter 1 now requests **both audio contexts directly in the Begin click/tap**, before awaiting anything else. Preloaded audio stays muted while unlocking; only the current scene plays. [Chrome's official autoplay guidance](https://developer.chrome.com/blog/autoplay/#web_audio) explains the need to resume pre-created Web Audio contexts after user interaction. This supports the change; it does not prove the cause of the earlier in-app symptom.

- A failed or unresolved start shows **Enable sound and begin**, with a bounded retry instead of silently waiting. Retry returns to the first shepherd scene.
- An unsuccessful Resume keeps the scene paused and offers **Enable sound**. Successful recovery refreshes the control immediately.
- All six production chapters use **Mute sound** and **Enable sound** action labels, with accessible pressed state. The previous Sound on/off labels described a state while clicking performed its opposite; this ambiguity is removed.
- A deliberate saved mute remains respected. Unmuting, pause/resume and restarting do not silently override that preference.
- Lazy output meters are created only by the Chapter 1 inspection path. Normal play does not read a waveform every frame.

The updated game was also exercised in the **actual in-app browser**. [Recorded DOM-backed measurements](evidence/opening-messenger-audio-2026-11-13/in-app-audio-output.json) show `shepherd-life` at 1.239 s, context running, not paused or muted, **0.1167 RMS / 0.2604 peak**. A separate flock sample also showed output. These measure the game's signal, not Windows volume, host routing or the sound reaching the user's speakers. The user still needs to judge audible playback in their session; no physical-hearing confirmation is claimed.

## Verification

Evidence: [opening-messenger-audio-2026-11-13](evidence/opening-messenger-audio-2026-11-13/).

| Check | Result |
| --- | --- |
| Fresh desktop opening → courtyard → ridge → Elah survey → same-run Camp delivery interaction | Passed with real input, no seeded story or clock changes; voice-output samples include opening, messenger, Jesse, Elah and spoken Camp delivery. |
| Portrait and landscape touch | Passed. [Three-layout results](evidence/opening-messenger-audio-2026-11-13/opening-flow-audio-results.json) include field first, messenger arrival/voice, courtyard interaction/pickup, Elah arrival and portrait restart cancellation. |
| Audio start and saved mute recovery | Passed. [Results](evidence/opening-messenger-audio-2026-11-13/audio-recovery-results.json) include initial failure/retry, waveform output, saved mute, pause and blocked Resume. The final successful-resume label refresh was checked after the last build. |
| Six-chapter mute continuity | Passed. [Results](evidence/opening-messenger-audio-2026-11-13/sound/sound-continuity-results.json) verify restored preferences and muted running outputs in all six chapters. |
| Small entry/footer layouts | Passed at 320 × 568 and 568 × 320 for launcher and all chapters, with the longer sound labels. [Results](evidence/opening-messenger-audio-2026-11-13/small/small-layout-results.json). |
| TypeScript/build and story rules | Passed after the source changes. Vite's existing large-engine-chunk warning remains. Ordered objectives, saves, retry and replay rules passed. |
| Actual in-app opening output | Verified as recorded above. |

The [flow test](../../apps/playcanvas/tests/opening-messenger-audio-check.cjs) launches Chrome with gesture-required autoplay. It verifies the field first, messenger displacement and mouth activity, distinct keeper, clear objectives, once-only father exchange, no early pickup, bench collision, pause/restart, carried journey and earned handoff. Touch cases use actual joystick/taps at 390 × 844 and 844 × 390. They establish responsive input/layout, not phone hardware performance. The initial sound sampling window can overlap narration; it is not an isolated ambience/music balance measurement.

The [recovery test](../../apps/playcanvas/tests/opening-audio-recovery-check.cjs) deliberately leaves resume requests unresolved in test memory, then uses the visible controls to recover. An early harness version reapplied the initial fault after reload; its injection was corrected to occur once across that reload. An initial fixed-delay Camp output sample was zero; a standalone Camp check and a later actual delivery interaction produced output. No reproducible Camp defect was established. The final test waits for the actual scene/speech state and records the early Camp readings separately.

Chapters 2–6 gameplay and battle rules were not rebuilt or played through again in this follow-up. Their sound labels changed and receive the focused cross-chapter check. The earlier full six-chapter evidence remains historical. No new hardware/network performance baseline or guarantee of physical audibility is claimed.

## Local review

**[Open the updated episode](http://127.0.0.1:4193/episode.html).** Select Begin episode, then **Begin Chapter 1**. The review is left before that second gesture so the owner sees and hears the complete opening from its first frame. During play, use Mute sound to turn audio off and Enable sound to turn it back on.

The output directory is `build/playcanvas-opening-messenger-audio`. [Candidate manifest](evidence/opening-messenger-audio-2026-11-13/candidate-manifest.json) freezes **OPENING-20261113-01**. The three-layout flow run precedes the final paused-Resume label refresh; the focused recovery check covers that final change. Earlier ports, builds and the owner's port-4192 Camp progress are preserved. No deploy, commit or push.

```powershell
npm.cmd --prefix apps/playcanvas run preview -- --outDir ../../build/playcanvas-opening-messenger-audio --host 127.0.0.1 --port 4193 --strictPort
```

Review the beginning in the in-app browser before moving to another implementation milestone.
