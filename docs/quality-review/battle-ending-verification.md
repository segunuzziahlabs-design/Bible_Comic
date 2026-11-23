# Battle ending verification — 23 November 2026

[Implementation and controls](../implementation/battle-ending-pursuit-and-sword.md) · [New crowd asset provenance](../assets/victory-pursuit-assets.md)

## Browser results

Local **production export**, installed Chrome **157.0.8103.79**, WebGL 2. Browser jobs ran sequentially. Desktop: **1280 × 800**; emulated touch portrait: **390 × 844**; emulated touch landscape: **844 × 390**.

`battle-ending-browser.cjs` passed in all three layouts:

| Check | Actual result |
| --- | --- |
| Retrieve sword and reload saved progress | Restored `sword_taken`; sword remains carried; final action remains incomplete. |
| Wait at the final action | No automatic stroke or Victory transition. |
| Hold E / downward touch drag | Drives the retained sword animation and progress indicator. |
| Release during a partial stroke | Actual swing progress remains unchanged until new input. |
| Upward touch drag | Does not advance or complete the stroke. |
| Pause and resume | Progress stays frozen; resuming alone cannot complete the stroke. |
| Complete the stroke | Confirms `finished` and opens the existing Victory gate. |
| Pursuit | All 24 Israelite crowd soldiers are moving after the retreating ranks at the observed pursuit shot. |
| Overtaking and strikes | Paired actors reach each other; active strike poses and timed spatial impact events appear. |
| Collapse | All 24 staged Philistine crowd actors reach their final collapse poses; bodies remain visible. |
| Conclusion | All 12 existing objectives complete; normal results screen appears. |
| Watch again | Restarts the scene and clears old casualty/impact events. |
| Responsive control geometry | Sword control reachable, unobstructed and inside the viewport; no horizontal overflow. Sizes: desktop 116 × 92 px, portrait 102.4 × 80 px, landscape 132 × 56 px. |
| Browser errors | None recorded in the three ending runs. |

The desktop `continuous-battle-browser.cjs` regression also passed: required sword/spear stages, simultaneous movement/aiming/throwing during continuing spear attacks, intentional missed stone, lethal spear hit, Retry Battle, actual ballistic forehead hit, staged 360° loss-of-balance turn, groans, fall, saved-fall reload, duplicate pickup protection, saved-sword reload, controlled final action and Victory gating. No console errors were recorded.

After the final rebuild (including updated entry instructions and listener cleanup), `mouse-sword-browser.cjs` passed a real downward **mouse** drag from a saved-sword checkpoint, confirmed the completed final checkpoint, navigated into Victory and successfully launched and paused that scene. No console errors were recorded.

Screenshots were inspected for the raised sword and grip, camera framing, pursuit/strikes and fallen ranks, including portrait and landscape. These are rendered browser observations, not conclusions drawn only from code.

## Performance

Unrecorded normal-clock Victory run from 2 seconds through completion, **1280 × 720**, Intel integrated graphics via ANGLE/D3D11:

| Measure | Observed |
| --- | --- |
| Mean rendered frame rate | **32.01 FPS** |
| Median frame gap | **31.3 ms** |
| 95th percentile frame gap | **35.1 ms** |
| Maximum frame gap | **41.2 ms** |
| Gaps over 250 ms | **0** |
| Console errors | **0** |

The existing 30 FPS laptop target was met in this run. This is a local laptop observation, not a claim about every phone or network. New Victory crowd download: **789,232 bytes**; preceding chapter GLBs are unchanged.

## Engineering and save checks

Executed and passed:

- TypeScript typecheck and production build.
- `battle-ending-rules-check.cjs`: input-driven stroke at 120/60/30/20 Hz, release freeze, invalid input, ordered action guards, reset, converging crowd paths and retained fallen actors.
- `cinematic-battle-rules-check.cjs`: existing ballistic hits/misses, physical aiming guidance, sword sweep and required-stage guards.
- `episode-rules-check.cjs`: ordered objectives, cue ownership, idempotency, stale/failed saves, reload, defeat/retry, completion and replay.
- `m4-database-check.cjs`: actual local PostgreSQL WASM migrations, authoritative progression, access isolation, retry/idempotency and history.
- `continuous-battle-saves.cjs`: ordered combat/fall/sword/final checkpoints, ownership, stale tabs, lost-response retry, Victory guard and replay.
- `git diff --check`.

## Evidence and limits

Raw local evidence (ignored by Git): `docs/quality-review/evidence/battle-ending-2026-11-23/`. The `final/` directory contains the three layout results and screenshots; `combat/` contains the successful desktop combat regression; `profile/desktop.json` contains the frame samples; `mouse-final/` contains the final-rebuild mouse/navigation check.

Local review links: [battle](http://127.0.0.1:4226/duel.html?review=1), [Victory/pursuit](http://127.0.0.1:4226/victory.html?review=1). These isolated previews do not overwrite normal episode progress.

The browser ending runs start from reducer-built **fallen** checkpoints; the combat regression starts from a prepared battle checkpoint. All subsequent movement, dodging, aiming, sword input, saves and transitions use real browser inputs and the normal game clock. Chapters 1–4 were not replayed in this targeted change. Physical phones, Safari and the hosted Clerk/Supabase/Vercel deployment were not retested. Local database tests do not certify live authentication.

The final sword contact remains a non-graphic cutaway. No detached head, wound geometry or gore is introduced. The crowd uses directed, low-cost baked poses rather than independent combat AI. Owner approval of the cinematic presentation remains a separate human review.

The owner authorized committing and pushing this change on 23 November 2026. This report covers local verification; it does not certify a Vercel deployment.
