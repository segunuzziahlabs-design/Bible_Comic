# SET-02 · PlayCanvas foundation contracts

These contracts let the playable test area and the account shell develop against the same boundaries. The first saved mission uses a placeholder battle. The existing animation preview stays available as an independent local check. [Implementation plan](playcanvas-implementation-plan.md#milestones) · [Production blueprint](playcanvas-production-blueprint.md)

## Shell, game and input

| Boundary | Contract |
| --- | --- |
| **Mount** | The shell supplies a canvas, the versioned area definition, a safe entry anchor and David's appearance. The game signals ready after the area and actor can render. The shell owns loading, retry, navigation and account access. |
| **Session** | The game owns one active session per play view. It publishes display state for the shell and accepts named actions such as pause, resume and retry. Mounting or retrying a session creates a fresh session or attempt token. Async callbacks check their token before changing state. |
| **Dispose** | Leaving the view or signing out clears held input, releases pointers, detaches observers and stops the renderer. Disposing during a load prevents that load from mounting a stale session. |
| **Input** | Game rules receive a normalized move vector in view-relative space and a look delta. Use WASD or arrow keys for movement and mouse drag for look. On touch, use independent move and look regions so two fingers can act together. Clamp movement magnitude to one. Clear held state on pause, blur, visibility loss, resize or pointer cancellation. |
| **Movement** | Measure the resolved travel after collision. Use that result for character facing and walk/idle blending. The follow camera and player query the same static wall bounds. Prove a corner and a narrow passage before reusing the controller in the village. |

## Saved battle fixture

Use episode ID `fixture-elah`, content version `1` and mission ID `face-goliath`. The entry anchor is `battle.entry` at the battlefield entrance. The successful hit leads to `battle.aftermath`. Keep these IDs with the test content. The full episode has its own catalog identity. Publish the same versioned rule and anchor IDs for client and server validation.

A safe checkpoint contains the content version, mission and anchor IDs, accepted objectives, preparation and inventory flags, and the committed revision. The pinned manifest resolves the spawn and entry mode. Combat input, pending attacks, camera movement and unfinished animations stay in the live session. The first battle proof seeds earlier mission credit and five stones so retry can verify that both survive.

| Case | Local behaviour | Durable behaviour |
| --- | --- | --- |
| **Enter battle** | Mount the battlefield and prepare the entry pose before enabling combat. | Confirm `battle.entry` with the current attempt and preparations. |
| **Miss, David survives** | Resolve the throw once and continue the encounter in the same attempt. | Keep the attempt active and the entry checkpoint available. |
| **Goliath kills David** | Resolve one lethal attack in the current battle attempt. Show the non-graphic defeat and save status. | Accept `david_killed_by_goliath` only in an active battle before a confirmed hit. Close the attempt and keep `battle.entry` and prior credit. |
| **Retry Battle** | Clear pending throws, attacks and input. Use the returned entry pose and reset the encounter. | Create a fresh attempt at `battle.entry` with the saved preparations. Keep the defeated attempt in history. |
| **Hit and completion** | Resolve the hit once, then play the fall, retreat and closing cue. | Commit `battle.aftermath` on hit. After the closing cue, commit one successful attempt and the episode completion. |
| **Resume** | Remount at the confirmed anchor or show the saved defeat panel with **Retry Battle**. | Return the latest confirmed revision and checkpoint or terminal result for the signed-in player. |

## Save adapter

The game and dashboard call a typed adapter for start, resume, checkpoint commits, outcome commits and retry. Local development uses an in-memory fixture. The account path uses the authenticated Data API. Each mutation carries the current run and attempt IDs where available, an expected revision and a stable command ID. The server resolves player identity from the verified Clerk session and derives the snapshot from the allowed event. Confirming a command returns the committed revision and permitted next actions. Retrying a lost request reuses the command ID. A stale revision returns the option to load confirmed progress.

The Phase 2 acceptance run uses two browser contexts and two accounts. Check same-account resume, a miss that leaves the mission active, lethal defeat, retry from the battlefield entrance, one success and a repeated result request. Also check that an expired session or an interrupted save leaves the latest confirmed progress recoverable and that the second account cannot read it.

## Development access

Segun can identify the development Clerk and Postgres project owners and arrange access for APP-01 and APP-02. The local playable slice uses a fixture and can proceed while provider access is arranged. The app will receive publishable settings through its development environment. [Identity and data design](playcanvas-production-blueprint.md#account-profile-and-player-journey)
