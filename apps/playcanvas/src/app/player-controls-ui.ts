import type { MovementInput } from '../gameplay/movement-input';
import type { Direction } from '../gameplay/action-router';
import './player-controls.css';
import { currentAccountSettings, setSessionControls } from '../product/preferences';

const preferenceKey = 'bible-comic.controls.v1';
type Preferences = { movement: 'keys' | 'stick'; labels: 'wasd' | 'arrows' };

/** Actual game controls, backed by the same actions as physical input. */
export function mountPlayerControls(canvas: HTMLCanvasElement, input: MovementInput,
  pause: (value: boolean) => void, isPaused: () => boolean, { jump = true } = {}) {
  const stage = canvas.parentElement!, pad = stage.querySelector<HTMLElement>('#move-pad')!;
  const coarse = matchMedia('(any-pointer: coarse), (hover: none)');
  let preferences: Preferences = { movement: coarse.matches ? 'stick' : 'keys', labels: 'wasd' };
  let explicit = false;
  try {
    const cloud = currentAccountSettings();
    const saved = cloud ? { movement: cloud.movement === 'auto' ? (coarse.matches ? 'stick' : 'keys') : cloud.movement, labels: cloud.labels } : JSON.parse(localStorage.getItem(preferenceKey) ?? 'null');
    if (saved && ['keys', 'stick'].includes(saved.movement) && ['wasd', 'arrows'].includes(saved.labels)) {
      preferences = saved; explicit = true;
    }
  } catch { /* Defaults work even if storage is unavailable. */ }
  const listeners = new AbortController(), options = { signal: listeners.signal };
  const root = document.createElement('div'); root.className = 'player-movement'; root.id = 'player-movement'; root.hidden = true;
  root.setAttribute('role', 'group'); root.setAttribute('aria-label', 'David movement controls');
  const keys = document.createElement('div'); keys.className = 'player-direction-keys'; keys.setAttribute('aria-label', 'Movement console');
  const definitions: [Direction, string, string][] = [['forward', 'W', '↑'], ['left', 'A', '←'], ['back', 'S', '↓'], ['right', 'D', '→']];
  const buttons = definitions.map(([direction, letter, arrow]) => {
    const button = document.createElement('button'); button.type = 'button'; button.dataset.move = direction;
    button.setAttribute('aria-label', `Move ${direction === 'back' ? 'backward' : direction}`);
    button.setAttribute('aria-pressed', 'false'); button.textContent = letter;
    button.title = `Move ${direction} (${letter} / ${arrow})`; input.bindDirection(button, direction); keys.append(button); return button;
  });
  const label = document.createElement('p'); label.className = 'player-move-label'; label.textContent = 'Move · WASD / arrows';
  const settings = document.createElement('button'); settings.type = 'button'; settings.id = 'movement-options';
  settings.className = 'player-movement-options'; settings.textContent = '⚙'; settings.setAttribute('aria-label', 'Movement options'); settings.title = 'Movement options';
  pad.removeAttribute('aria-hidden'); pad.setAttribute('aria-label', 'Movement thumb stick');
  root.append(keys, pad, label, settings); stage.append(root); stage.dataset.sharedControls = 'ctrl04';
  const jumpButton = jump ? document.createElement('button') : undefined;
  if (jumpButton) {
    jumpButton.type = 'button'; jumpButton.id = 'jump'; jumpButton.className = 'player-jump'; jumpButton.hidden = true;
    jumpButton.innerHTML = '<span aria-hidden="true">↥</span> Jump <kbd>Space</kbd>';
    jumpButton.title = 'Jump · Space'; input.bindButton(jumpButton, 'jump'); stage.append(jumpButton);
  }

  const panel = document.createElement('section'); panel.id = 'movement-settings'; panel.className = 'entry player-control-settings'; panel.hidden = true;
  panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'true'); panel.setAttribute('aria-labelledby', 'movement-settings-title');
  const card = document.createElement('div'); card.className = 'entry-card';
  const title = document.createElement('h2'); title.id = 'movement-settings-title'; title.textContent = 'Move as David';
  const description = document.createElement('p'); description.textContent = 'WASD or arrows work with either layout. Hold a direction button, or drag the left stick. Drag the view to look or aim.';
  function select(labelText: string, id: string, choices: [string, string][]) {
    const label = document.createElement('label'); label.textContent = labelText;
    const select = document.createElement('select'); select.id = id;
    for (const [value, text] of choices) { const option = document.createElement('option'); option.value = value; option.textContent = text; select.append(option); }
    label.append(select); card.append(label); return select;
  }
  card.append(title, description);
  const movement = select('Movement layout', 'movement-layout', [['keys', 'Direction keys'], ['stick', 'Thumb stick']]);
  const labels = select('Key labels', 'movement-labels', [['wasd', 'WASD'], ['arrows', 'Arrows']]);
  const note = document.createElement('p');
  note.textContent = jump
    ? 'Speak / Take: E or the action button. Jump: Space or Jump. Throw: F / click or Throw. Dodge: Shift. Keep one thumb moving while the other aims or acts.'
    : 'Take: E or the action button. Press F, click or tap Throw to leap and release. Dodge: Shift or Dodge. Keep one thumb moving while the other aims or acts.';
  const close = document.createElement('button'); close.type = 'button'; close.id = 'close-movement-settings'; close.textContent = 'Back to game';
  card.append(note, close); panel.append(card); stage.append(panel);
  let wasPaused = true;
  function renderPreferences() {
    root.dataset.layout = preferences.movement; root.dataset.labels = preferences.labels;
    movement.value = preferences.movement; labels.value = preferences.labels;
    buttons.forEach((button, index) => { button.textContent = definitions[index][preferences.labels === 'arrows' ? 2 : 1]; });
    label.textContent = preferences.movement === 'stick' ? 'Move · left stick' : 'Move · WASD / arrows';
  }
  function savePreferences() {
    input.clear(); explicit = true; preferences = { movement: movement.value as Preferences['movement'], labels: labels.value as Preferences['labels'] };
    const cloud = currentAccountSettings();
    if (cloud) setSessionControls(preferences.movement,preferences.labels);
    else try { localStorage.setItem(preferenceKey, JSON.stringify(preferences)); } catch { /* Keep this session usable. */ }
    renderPreferences();
  }
  function dismiss() { if (panel.hidden) return; panel.hidden = true; input.clear(); pause(wasPaused); if (!wasPaused) canvas.focus({ preventScroll: true }); }
  settings.addEventListener('click', () => { wasPaused = isPaused(); input.clear(); pause(true); panel.hidden = false; movement.focus(); }, options);
  close.addEventListener('click', dismiss, options); movement.addEventListener('change', savePreferences, options); labels.addEventListener('change', savePreferences, options);
  panel.addEventListener('keydown', event => {
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); dismiss(); }
    if (event.key === 'Tab') {
      const focusable = [movement, labels, close], current = focusable.indexOf(document.activeElement as HTMLSelectElement);
      if (event.shiftKey && current === 0) { event.preventDefault(); close.focus(); }
      else if (!event.shiftKey && current === focusable.length - 1) { event.preventDefault(); movement.focus(); }
    }
  }, options);
  const adapt = () => { if (!explicit) { preferences.movement = coarse.matches ? 'stick' : 'keys'; input.clear(); renderPreferences(); } };
  coarse.addEventListener('change', adapt, options);
  const unsubscribe = input.subscribe(() => {
    const state = input.state(); root.hidden = !state.enabled;
    if (jumpButton) {
      jumpButton.hidden = !state.enabled || !input.hasAction('jump');
      jumpButton.disabled = !input.can('jump');
    }
    root.dataset.x = String(state.x); root.dataset.forward = String(state.forward);
    buttons.forEach((button, index) => {
      const direction = definitions[index][0], active = state.held.has(direction) || (direction === 'forward' ? state.forward > .15 : direction === 'back' ? state.forward < -.15 : direction === 'left' ? state.x < -.15 : state.x > .15);
      button.setAttribute('aria-pressed', String(active));
    });
  });
  renderPreferences();
  window.addEventListener('pagehide', () => { unsubscribe(); listeners.abort(); }, { once: true });
  return { get open() { return !panel.hidden; }, dismiss };
}
