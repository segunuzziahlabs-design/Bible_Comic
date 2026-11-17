# Cinematic storytelling and engagement pass

13 November 2026. Implements the owner's supplied cinematic/gameplay brief on the existing six-chapter PlayCanvas episode. The M3 integration candidate remains frozen. No deployment, commit/push, new episode or account-service work is included.

**Owner correction:** [Jesse courtyard correction plan](jesse-courtyard-correction-plan.md) supersedes step 1's messenger-delivered errand and pickup beside the flock. Jesse gives the errand personally and David collects the provisions at the courtyard bench. The remaining chapter and battle boundaries are retained.

## Inspection and boundaries

- Existing chapter coordinators, twelve ordered objectives, atomic local saves, battle-entry retry, responsive input, generated dialogue and asset pipeline are retained.
- Authentication/profiles are not implemented; they remain deferred M4 work. No existing account system is replaced or claimed.
- Jesse's provisions errand and leaving the flock with a keeper follow [1 Samuel 17:12–40](https://www.biblegateway.com/passage/?search=1+Samuel+17%3A12-40&version=KJV). The messenger and three spear attacks are expressly labelled creative staging in the story notes. The biblical victory and approved non-graphic ending remain unchanged.

## Implementation order

1. **Chapter 1 shepherd opening and journey.** Add a countryside subscene, wandering/grazing flock, David's player-controlled approach and tending interaction, a voiced messenger carrying Jesse's instruction, a visible handover to a keeper, provisions pickup and a short playable journey with an environmental discovery. Transition into the existing Elah opening/survey. Reuse the existing character rig, appearance, carry components, audio clock and input; author only the additional clips/performances needed. Keep the twelve mission objectives and existing save format; an unfinished Chapter 1 sequence restarts from its confirmed chapter entry and is clearly described.
2. **Guidance across the episode.** Add one reusable on-screen destination/interaction guide driven by the existing actual objective targets, including off-screen direction, distance and desktop/touch actions. Retain world markers. Explain cinematic waiting and control return; verify reachable interactions, chapter handoffs and recovery.
3. **Character entrances and commitment.** Stage Goliath's walk out of the ranks before his Chapter 3 voiced challenge, with heavy footsteps, soldiers giving space and camera scale contrast. Stage David stepping forward at Chapter 5's entrance before handing the approach back to the player. Preserve existing dialogue and cinematic timing where practical.
4. **Three-stage spear encounter.** Extend the existing battle state machine, only for the produced duel, with three distinct telegraphed attacks before sling release. Actual player movement/dodge input and physical lane clearance are required; no automatic escape or invulnerability. Vary attack angle/timing, show recommended dodge direction, animate crouch/sidestep/recovery, keep the camera wide and readable, and provide success/recovery feedback. Lethal contact retains the existing defeat and Retry Battle flow. Retry/reload starts the encounter's three attacks again while retaining all earlier preparation. After three successes, unlock the sling, retain misses/retry/refill and present the existing biblical outcome. Legacy isolated fixtures keep their prior contract.
5. **Verification and corrections.** Run meaningful rule checks, actual browser animation/interaction checks, repeated first/second/third attack input/collision checks, failed-dodge/retry/reload and pause/cancellation. Verify desktop, portrait and landscape touch guidance/actions. Complete one genuinely fresh Chapters 1–6 journey at normal speed with all new scenes and three earned dodges; do not substitute fixtures for that connected journey.
6. **Performance and browser review.** Measure startup, loaded resources and sustained frame pacing on the existing laptop; address measured regressions. Freeze a separate candidate, record actual evidence/remaining limits, and open the complete normal episode from a fresh origin for review. Do not reset the owner's existing port-4190 camp save.

## Exit criteria

- New scenes appear in their correct story positions; the player tends the flock, accepts the errand, carries provisions and experiences the valley route.
- Every playable objective has an identifiable destination and a clear next action. Cinematics pause/restart and return input reliably.
- Goliath visibly walks into the challenge; David's voluntary approach is staged before combat.
- Three separately observed, player-controlled, physically successful spear dodges unlock sling use; premature throw, no-input survival, failed dodge, repeat input, pause and retry are tested. No automatic dodge credit.
- Existing chapter order, preparation, save recovery, completion/history and appearance are preserved. A fresh connected run reaches Chapter 6 completion without developer state repair.
- Browser evidence and measurements distinguish verified results from owner quality judgement, physical-device performance and unaided player feedback.

Results and handover: [cinematic engagement implementation](cinematic-engagement.md). Baseline: [M3 integration](m3-final-integration.md).
