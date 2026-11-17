# M2 · Connected episode implementation brief

11 November 2026. Segun accepted the playable David–Saul sample and instructed development to begin under the new project plan. This authorises the next planned milestone, M2. The accepted sample becomes the cinematic reference for continuing production; it is not approval of every final asset or unresolved service decision.

**Implementation:** [playable outline, engineering results and remaining review](m2-connected-episode.md).

## Player experience and implementation order

1. Define one versioned six-chapter episode, with ordered objectives, inventory derived from earned progress, safe anchors and an explicit battle-only defeat rule.
2. Add a browser-local save adapter, validated snapshots, duplicate-event rejection, cue ownership and recoverable save errors. Keep identity and cloud services for M4.
3. Build the connected outline: survey Elah → deliver supplies and meet brothers → hear the challenge and answer Eliab → the accepted Saul conversation, armour, five stones and sling practice → the existing interactive duel → retreat and completion.
4. Connect the accepted Saul route and existing duel through that same state. Neither a URL nor a scene's existence grants chapter credit. The standalone previews remain available.
5. Test out-of-order events, cancelled cues, reload, a miss, lethal defeat, retry preserving preparation, aftermath recovery, completion and replay. Inspect desktop and touch layouts and show the browser route.

The outline reuses the current valley, camp candidates and character rigs, with clear temporary-character and scene labels. It does not represent final M3 dialogue, modelling, acting, crowds or sound. New final scripts and major art choices remain chapter-review work. The Saul performance is retained.

## Completion gate

One player can reach the conclusion through all six chapters, reload a named local checkpoint, and retry Goliath without repeating earlier preparation. A miss remains an active battle. Only Goliath's lethal strike causes defeat. The browser refuses unknown/incompatible saves and shows save failures without silently advancing. Replaying a completed episode creates a new run and retains its previous result locally.

M2 ends with a playable browser review and evidence, then Segun reviews pacing, objectives and handoffs before M3 chapter production. It does not include deployment, Clerk provisioning, cloud saves, rewards, commits or pushes.
