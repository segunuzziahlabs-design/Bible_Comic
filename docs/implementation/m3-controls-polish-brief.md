# Chapter 4/5 controls polish: scoped plan

12 November 2026. Segun reports that sling practice is hard to reach/control and the duel does not provide the expected direct control of David. He authorises polishing Chapters 4/5 before Chapter 6. This plan covers those controls and their guidance; no Chapter 6 production, deployment, commit or push.

[Implementation and browser review](m3-controls-polish.md).

## Findings and proposed treatment

Browser inspection of the existing Preparation preview found the player at the brook with five stones but a camera facing away from the target, a generic distance/marker instruction and no readily available practice action. Source inspection confirms practice consumes movement input without moving David and hides the touch movement stick. Desktop aiming requires dragging or unfamiliar I/J/K/L keys. The duel's walking speed and absence of a dedicated evasive action make its attack response indirect.

1. **Consistent inputs:** WASD/arrows move David, desktop mouse points the aim and primary click throws; Space performs a short directional dodge in battle. Keep a visible Throw button and a keyboard throw fallback, and retain I/J/K/L as optional accessibility adjustments. Touch keeps the left movement stick, drags the view to aim and uses Throw/Dodge buttons. Mouse shooting must not activate from touch taps, UI buttons, camera drags or held/repeated keys.
2. **Understandable practice:** after five stones, Start sling practice is available anywhere at the brook and clearly shown. Place David at the practice area once, point the view at the target and centre the initial reticle there. During practice allow movement, aim and throws together, within the safe target range. Show a short control card and live aiming/release feedback. Misses invite another attempt. Offer leaving/re-entering practice without losing confirmed preparation.
3. **Direct combat:** retain target-facing shoulder framing and allow forward/back/strafe movement continuously in the fight, with faster responsive movement. Add a short directional sidestep on Space or Dodge, a visible cooldown and clear attack warning. A dodge physically moves David; it does not add invulnerability, health or a new defeat condition. Throw timing, finite stones, lethal spear, hit, confirmed checkpoints and Retry Battle remain authoritative.
4. **Guidance:** display the same action vocabulary in practice and battle, a dismissible control card, clear transition back to player control, contextual aiming and reloading messages. Provide a review-only practice shortcut so Segun can evaluate the exact problem without replaying the audience and collecting stones. Normal runs still require earned preparation.
5. **Verification:** production build/rules; actual browser reproduction before/after; keyboard and mouse practice movement/aim/click/miss/hit; combat movement/throw/dodge/miss/defeat/retry/win; pause, restart, cancelled inputs, focus loss and persistence; portrait/landscape touch, including simultaneous stick + aim + action. Check the existing fixture defaults separately and record captures and measurements/limitations.

## Boundaries and acceptance

Retain existing character/environment/voice assets, narrative order, single-hit biblical outcome and the versioned story/save contract. Scope does not introduce sword combat, rewards, new attacks or additional story content. Extend shared input/movement APIs with explicit optional settings so the older courtyard/battle fixtures retain their original defaults. Do not require pointer lock or specialised hardware.

Pass when a player can discover practice, move while practising, point/drag the aim and throw with immediate visible feedback; in Chapter 5 the same controls move and throw while the dodge action can physically clear the spear lane. Pausing/retrying must cancel in-progress movement and prevent stale shots. A confirmed hit alone advances progress. Layout/input emulation and engineering checks do not establish unaided usability acceptance or physical-phone GPU performance; Segun reviews the actual revised build before Chapter 6.

[Chapter 4](m3-chapter-04.md) · [Chapter 5](m3-chapter-05.md) · [Current production plan](../roadmap/project-reset-plan.md)
