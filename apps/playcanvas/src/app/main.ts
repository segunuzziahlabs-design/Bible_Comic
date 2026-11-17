import './account-game-bootstrap';
import { openDavidPreview, type PreviewAction } from '../world/david-preview';
import { WebGLUnavailable } from '../world/graphics';
import { appearanceStorage, loadSavedAppearance, defaultAppearance, hairColours, hairStyles, skinTones, tunicColours, type DavidAppearance } from '../world/david-appearance';
import './style.css';

function element<T extends HTMLElement>(id: string): T {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Missing preview element: ${id}`);
  return node as T;
}

let canvas = element<HTMLCanvasElement>('stage');
const entry = element('entry');
const message = element('entry-message');
const enter = element<HTMLButtonElement>('enter');
const retry = element<HTMLButtonElement>('retry');
const walk = element<HTMLButtonElement>('walk');
const acknowledge = element<HTMLButtonElement>('acknowledge');
const pose = element<HTMLButtonElement>('pose');
const playback = element<HTMLOutputElement>('playback');
const customize = element<HTMLButtonElement>('customize');
const appearancePanel = element('appearance');

let preview: Awaited<ReturnType<typeof openDavidPreview>> | undefined;
let action: PreviewAction | undefined;
let held = false;

function appearanceField<Key extends string>(id: string, choices: Record<Key, { label: string }>, fallback: Key) {
  const select = element<HTMLSelectElement>(id);
  for (const key of Object.keys(choices) as Key[]) {
    select.add(new Option(choices[key].label, key));
  }
  select.addEventListener('change', applyAppearance);
  return {
    set(value: unknown) {
      select.value = typeof value === 'string' && Object.hasOwn(choices, value) ? value : fallback;
    },
    get: () => select.value as Key,
  };
}

const appearanceFields = {
  skin: appearanceField('skin-tone', skinTones, defaultAppearance.skin),
  hairStyle: appearanceField('hair-style', hairStyles, defaultAppearance.hairStyle),
  hairColour: appearanceField('hair-colour', hairColours, defaultAppearance.hairColour),
  tunic: appearanceField('tunic-colour', tunicColours, defaultAppearance.tunic),
};

function setFields(saved?: Partial<DavidAppearance>) {
  appearanceFields.skin.set(saved?.skin);
  appearanceFields.hairStyle.set(saved?.hairStyle);
  appearanceFields.hairColour.set(saved?.hairColour);
  appearanceFields.tunic.set(saved?.tunic);
}

function readAppearance(): DavidAppearance {
  return {
    skin: appearanceFields.skin.get(),
    hairStyle: appearanceFields.hairStyle.get(),
    hairColour: appearanceFields.hairColour.get(),
    tunic: appearanceFields.tunic.get(),
  };
}

function applyAppearance() {
  const selected = readAppearance();
  preview?.setAppearance(selected);
  try {
    localStorage.setItem(appearanceStorage, JSON.stringify(selected));
  } catch {
    // The preview still works when the browser restricts storage.
  }
}

setFields(loadSavedAppearance());

async function load() {
  retry.hidden = true;
  enter.hidden = true;
  message.textContent = 'Loading David and the test area…';
  try {
    preview = await openDavidPreview(canvas);
    preview.setAppearance(readAppearance());
    canvas.dataset.renderer = preview.backend;
    message.textContent = 'David is ready. Compare his walk and acknowledgement.';
    enter.hidden = false;
  } catch (error) {
    message.textContent = error instanceof WebGLUnavailable
      ? 'WebGL 2 is unavailable. Enable hardware acceleration or try another browser.'
      : 'David could not be loaded. Try loading the preview again.';
    retry.hidden = false;
    console.error('Preview setup failed:', error);
  }
}

function select(next: PreviewAction, hold: boolean) {
  preview?.show(next, hold);
  action = next;
  held = hold;
  walk.setAttribute('aria-pressed', String(next === 'walk'));
  acknowledge.setAttribute('aria-pressed', String(next === 'acknowledge'));
  pose.setAttribute('aria-pressed', String(hold));
  const label = next === 'walk' ? 'Walk cycle' : 'Acknowledgement';
  playback.textContent = hold ? `${label} · reference pose` : label;
}

enter.addEventListener('click', () => {
  if (!preview) return;
  entry.hidden = true;
  walk.disabled = acknowledge.disabled = pose.disabled = false;
  customize.hidden = false;
  playback.textContent = 'Idle · choose an animation';
  walk.focus();
});
retry.addEventListener('click', () => {
  const replacement = canvas.cloneNode(false) as HTMLCanvasElement;
  canvas.replaceWith(replacement);
  canvas = replacement;
  void load();
});
walk.addEventListener('click', () => select('walk', false));
acknowledge.addEventListener('click', () => select('acknowledge', false));
pose.addEventListener('click', () => select(action ?? 'walk', !held));
customize.addEventListener('click', () => {
  const open = appearancePanel.hidden === true;
  appearancePanel.hidden = !open;
  customize.textContent = open ? 'Done' : 'Customize';
  customize.setAttribute('aria-expanded', String(open));
  document.querySelector('main')?.toggleAttribute('data-customizing', open);
  if (open) select('acknowledge', true);
});
element('reset-look').addEventListener('click', () => {
  setFields();
  applyAppearance();
});

void load();
