# Controlled sword finish and Israel’s pursuit

23 November 2026. Extends Chapters 5–6; no changes to authentication, database schema, story objective IDs or earlier chapters.

## Player-controlled final action

After the earned forehead hit and staged fall, the existing `fallen` checkpoint still gates the sword pickup. David must reach and take the sword, then approach the fallen champion and select **Ready sword**. The saved `sword_taken` checkpoint still restores this stage after reload.

A new control offers a downward mouse/touch drag, or **hold E** (Space also works when the sword grip has keyboard focus). The existing `sword_finish` animation is sampled from player-driven swing progress. Releasing freezes its progress; resuming the game alone cannot finish it. The forward-only stroke is rate-limited to avoid an instantaneous pointer jump completing the animation. A completed stroke and short recovery are required before the existing final checkpoint and Victory gate open. No new save schema is needed: an interrupted stroke reloads at the saved sword stage.

Fixed the previous manual-sampling blend freeze in the pickup/held-sword/final-action clips by advancing the animation transition while sampling the intended pose. The sword is seated in the right palm; retained weighted fingers curl around its grip. Camera framing follows the lift, downswing and reaction, with the contact concealed for the established non-graphic presentation. Existing sword/impact sound cues follow animation progress, including pauses. Movement overlays are hidden during the sword action so the new control is clear.

The action communicates the biblical beheading through the controlled sword stroke, cutaway, sound and conclusion. It introduces no blood, wound detail or detached head. It reuses the current authored animation and character, rather than claiming a new motion-captured performance.

## Pursuit and battlefield conclusion

Twenty-four green-clothed Israelites now leave their ranks and pursue the twenty-four retreating Philistines. Paired paths converge within one metre before a staged spear strike; the corresponding Philistine reacts and collapses. Fallen soldiers remain in the scene. This replaces the former stationary cheering background. The foreground soldier’s voiced response, victory chants, David’s closing response and narration remain.

Two tracking shots show the pursuit and the overtaking/strikes, followed by the existing thanksgiving and conclusion. Footsteps, equipment and impact effects follow the pursuing cast spatially. Pause freezes the shared voice/scene clock; restart clears pursuit impact events and returns the armies to their initial positions.

This is a directed, non-graphic crowd sequence. The main player-controlled sword/spear/sling duel retains its existing actual collision and ballistic calculations. Crowd pursuit is cinematic choreography, not a new open-world AI system.

## Assets and architecture

- [`sword-swing-controls.ts`](../../apps/playcanvas/src/app/sword-swing-controls.ts): isolated pointer/keyboard input and progress control.
- [`elah-battle.ts`](../../apps/playcanvas/src/gameplay/elah-battle.ts): ordered combat gates and input-driven stroke progression.
- [`victory-pursuit.ts`](../../apps/playcanvas/src/gameplay/victory-pursuit.ts): deterministic paired paths/contact/fall timing.
- [`victory-world.ts`](../../apps/playcanvas/src/world/victory-world.ts): instanced faction poses; existing foreground cast preserved.
- [Asset provenance and rebuild instructions](../assets/victory-pursuit-assets.md): one additional ~0.79 MB crowd GLB; no new dependency or third-party asset licence.

## Verification

Final browser results and limitations are recorded in [the verification report](../quality-review/battle-ending-verification.md). Raw screenshots and JSON are archived locally under `docs/quality-review/evidence/battle-ending-2026-11-23/`; they are ignored by Git.
