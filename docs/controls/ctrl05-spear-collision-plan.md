# CTRL-05 — airborne spear collision

16 November 2026. Owner authorises spear collision that accounts for David's airborne height, followed by portrait/landscape browser checks of clearance, hits, defeat and Retry Battle. [CTRL-04 baseline](../implementation/ctrl04-jump-movement.md) · [Approved controls](player-control-design.md).

## Assessment and implementation order

1. Inspect and sample the existing three spear performances. The current ground-plane corridor ignores both David's height and actual weapon endpoints. Establish one animation clock/attack index for the visible spear and collision; do not add an invisible low damage plane simply to make Jump succeed.
2. Introduce a vertical player capsule using the existing movement radius and standing height, translated by the jump motor's absolute feet position. Test the moving spear head/shaft against the moving capsule over the whole active thrust, including the first/last active frame and movement between updates. Use bounded substeps/sweeps to avoid tunnelling. Never grant an invulnerability flag because Jump or Dodge was pressed.
3. Integrate the collision with the actual retained spear rig/presentation. Lock the current attack pattern through its strike/recovery. If the measured pose cannot reach its advertised lane or cannot provide meaningful jump clearance, make the smallest necessary visible alignment and record it, rather than disagreeing with the rendered weapon. Preserve the three existing attacks and warning/recovery timings.
4. Retain three successful physical evasions before the sling. A registered, correctly timed jump that physically clears a threatening thrust may count; a premature jump, an airborne contact or an unrelated jump outside danger may not. Shift Dodge remains available. Show attack-height/defence guidance based on the actual trajectory. Keep ordinary throws grounded until CTRL-06.
5. Reset collision/evasion history on restart, checkpoint entry, defeat and Retry Battle; freeze it on pause. Preserve objective order, preparation, stone count, lethal defeat and battle-only retry. Keep source builds and owner progress intact.
6. Build a separate local candidate. Run geometry/sequence tests and actual browser input in portrait and landscape: grounded hit, successful jump clearance, early/late jump hit, higher thrust contact while airborne, directional dodge, pause/resume, defeat/retry and completion through the retained sling. Record rendered weapon/capsule evidence, including boundary margins and a valid checkpoint fixture where used.

## Exit criteria

- A visible low thrust can pass below airborne David when the physical capsule clears it; touching the head/shaft still kills him. A higher thrust can hit an airborne capsule. Grounded hits still work.
- The complete active trajectory is tested; fast relative movement, varied update steps and grazing contact have explicit checks. No collision history bridges a retry/teleport or paused interval.
- Three actual avoidances unlock the sling once. Jump/Shift input alone never grants progress or safety. No defeat except a lethal Goliath hit.
- Browser portrait/landscape controls, camera and Retry Battle work without state repair. Saved preparation remains intact; retry restores the battle checkpoint and five stones.
- Build/typecheck, geometry/sequence checks and story/save rules pass. Captures demonstrate real rendered clearance/contact. Emulated touch results are not physical-device performance evidence.

No Jump Shot, arrows, new episode, backend/authentication, deployment, commit or push. Animation/geometry adjustments are limited to making the retained attacks and their physical contact agree. Record actual outcomes and remaining limitations in the handover before advancing to CTRL-06.
