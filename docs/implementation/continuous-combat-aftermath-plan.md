# Continuous combat and interactive aftermath

Implementation plan, 18 November 2026. Baseline commit `3e79be0`. Extend the existing PlayCanvas encounter; retain the six chapters, twelve mission objectives, original rig/asset provenance, account/profile ownership and prior checkpoints. No application dependency upgrade, deployment, commit or push is included.

## Existing foundation

`elah-battle.ts` already owns sword → two spear evasions → sling, real projectile collision, defeat/retry and an earned replay. Sling readiness currently changes the attack to `exposed`, stopping attacks. `movement-area.ts` already supports moving and aiming together, physical jumps/dodges, collision and mobile controls. `duel-presentation.ts` owns the camera and voiced encounters. The current finishing replay hands directly to the short fall; `duel-main.ts` saves `goliath.struck` at the fall and opens Victory. Those two shortcuts are the main changes.

## Ordered implementation

| Step | Work | Acceptance |
| --- | --- | --- |
| CC-01 | Add an optional versioned battle checkpoint to the existing run JSON and semantic battle commands; retain the existing objective IDs/revision rules and old saves. | Local SQL/adapter tests prove ownership, stage order, stale/duplicate command handling, fall/sword/finish reload and protection of Victory. Apply only the additive development migration after local verification. |
| CC-02 | Keep the existing spear scheduler alive after sling unlock. Add a readable post-evasion recovery window and repeatable warnings. | Spear release/contact continues while the player moves, aims and throws; misses/dodges never disable the scheduler. No immunity or automatic displacement. |
| CC-03 | Extend the same Goliath rig with a staged stagger/balance/turn/kneel performance before the retained heavy fall; add original groan/impact sound and coherent shots. | Actual browser observations show impact, stagger, one deliberate full turn, knees giving way, collapse and control return. No teleport/spin shortcut. |
| CC-04 | Add sword-retrieval, pickup, approach, ready and player-strike states. Reuse David's movement/interaction controls and models; author only missing sword poses. | Player walks to and picks up the sword once, walks to the fallen body, deliberately readies and initiates the strike. Wrong/early/repeated actions cannot advance. |
| CC-05 | Integrate post-fall and sword checkpoints with the existing save adapter, responsive HUD, guidance, camera and Victory entry gates. | Reload after the fall preserves defeated Goliath; reload after pickup retains the sword. Victory is gated until the final action is confirmed, including direct URLs and hosted objective commands. |
| CC-06 | Build separate production candidates, verify desktop/laptop and portrait/landscape touch combat, then test real development-account persistence and normal story integration. | Browser results/captures plus rules/SQL/asset/build checks; report executed evidence and practical limits. |

## State and save design

- Combat remains sword → spear → sling; the spear's windup/flight/recovery loop continues throughout the sling phase. A confirmed physical forehead hit stops future attacks and cancels any remaining active spear before the earned presentation.
- The hit presentation retains its earned replay, then adds explicit stagger/balance/turn/kneel and fall phases. The turn belongs to the authored performance and moves with planted steps, rather than rotating the whole body arbitrarily in code.
- Add an optional `battle` checkpoint on run JSON, with its own revision and ordered `combat → fallen → sword_taken → finished` state. Existing run revisions and twelve mission objectives remain unchanged. Activate it only for the new battle implementation; older completed/checkpointed battles without the field remain valid.
- Confirm the existing `goliath.struck` objective after the actual fall; this preserves the won-battle checkpoint. Separate semantic pickup/finish commands preserve subsequent interactions without inventing another chapter. The server and client both gate `victory.witnessed` until a marked new battle is finished.
- Cloud writes remain canonical, owned, revision checked and idempotent; no browser-only fallback masquerades as a cloud save. The additive development SQL operates on existing JSON/receipts and does not reset or rewrite existing runs/profiles.
- Pickup has one owner token/phase; its completion saves once before walking resumes. Final approach requires the held sword and a confirmed defeat. One action readies David; a second deliberate **Strike** action performs the final swing. Repeated inputs and interruption/reload cannot duplicate a completed action.

## All-ages presentation

The player performs a clear sword lift and finishing swing. The decisive contact is conveyed off-camera/behind the fallen body's cover, followed by a wide shot and restrained sound/caption. No blood, visible wound, detached head or graphic close-up is required to communicate the biblical beheading. Movement to the sword/body and the final strike are never automatic. Existing Victory retreat, cheering and conclusion follow only after that action.

## Verification

Use the existing rigged assets and PlayCanvas sampling/camera patterns. Local browser fixtures must be labelled separately from a normal journey and from real Clerk/Supabase verification. Test continued spear releases, aimed throws during warnings, moving throws, natural/quick-step evasion and defeat in sling mode; test physical misses/hits, staged fall, objective arrows, pickup/strike guards, pause/restart, failure/retry, reload of each durable aftermath stage, direct Victory access and the final conclusion.

Run final exported builds on desktop/laptop layouts and portrait/landscape CDP touch layouts. Capture the actual animation and audio scheduling. Physical-device GPU/Safari acceptance and subjective art/balance remain distinct from Chromium layout checks. Keep credentials, sessions, recordings and raw evidence in ignored/local storage. Document the final result in `continuous-combat-aftermath.md`.
