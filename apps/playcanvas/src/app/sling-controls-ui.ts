/** Shared player-facing vocabulary. Opening help preserves an existing manual pause. */
export function mountSlingHelp(stage: HTMLElement, actions: HTMLElement, battle: boolean,
  pause: (value: boolean) => void, isPaused: () => boolean) {
  const button = document.createElement('button'); button.type = 'button'; button.textContent = 'Controls'; button.id = 'controls-help';
  const panel = document.createElement('section'); panel.className = 'sling-help entry'; panel.id = 'sling-help'; panel.hidden = true;
  panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'true'); panel.setAttribute('aria-labelledby', 'sling-help-title');
  const card = document.createElement('div'); card.className = 'entry-card';
  const title = document.createElement('h2'); title.id = 'sling-help-title'; title.textContent = 'You control David';
  const desktop = document.createElement('p'); desktop.className = 'keyboard-hint';
  desktop.textContent = `Move: WASD, arrows or the on-screen keys. Jump: Space. Aim: point the mouse. Throw: click the game view, press F, or use Throw.${battle ? ' Hold a movement direction and press Shift or Dodge to step quickly that way.' : ' You can move while aiming and throwing.'} Land before interacting or throwing. Use the movement gear to choose a stick or direction keys.`;
  const touch = document.createElement('p'); touch.className = 'touch-hint';
  touch.textContent = `Move: left stick or direction keys. Jump: tap Jump. Aim: drag the game view. Land before throwing.${battle ? ' Hold a movement direction and tap Dodge to step quickly that way.' : ' Keep one thumb moving while the other jumps, aims or throws.'}`;
  const note = document.createElement('p'); note.textContent = battle ? 'Survive the sword, then two spear throws to ready the sling. Watch Goliath raise his blade or draw back his arm. Give yourself room to move and track the spear after he releases it. Goliath keeps throwing while you aim or collect stones. Aim higher at his forehead to allow for gravity. The bright dots show the stone’s arc. Use F or Throw, or press Q for a Jump Shot. Select Collect stones or press R to find missed stones. Stop near one to pick it up. After Goliath falls, follow the arrow and use E or the action button to take his sword. Approach him and ready the sword to finish the battle.' : 'Aim at the red centre of the woven target. The ring changes colour when your aim can hit. Misses let you try again.';
  const close = document.createElement('button'); close.type = 'button'; close.id = 'close-controls'; close.textContent = 'Back to game';
  let wasPaused = true;
  function dismiss() { if (panel.hidden) return; panel.hidden = true; pause(wasPaused); if (!wasPaused) stage.querySelector('canvas')?.focus(); }
  button.addEventListener('click', () => { wasPaused = isPaused(); pause(true); panel.hidden = false; close.focus(); });
  close.addEventListener('click', dismiss);
  panel.addEventListener('keydown', event => {
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); dismiss(); }
    if (event.key === 'Tab') { event.preventDefault(); close.focus(); }
  });
  card.append(title, desktop, touch, note, close); panel.append(card); stage.append(panel); actions.append(button);
  return { button, dismiss, get open() { return !panel.hidden; } };
}

/** Secondary touch actions work while the other thumb owns the movement stick. */
export function bindSlingAction(button: HTMLButtonElement, action: () => void) {
  let lastTouch = -Infinity;
  button.addEventListener('pointerup', event => {
    if (event.pointerType !== 'touch' || button.disabled || button.hidden) return;
    if (!button.contains(document.elementFromPoint(event.clientX, event.clientY))) return;
    lastTouch = performance.now(); action();
  });
  button.addEventListener('click', () => {
    if (!button.disabled && performance.now() - lastTouch > 500) action();
  });
}
