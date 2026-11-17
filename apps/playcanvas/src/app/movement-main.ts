import './account-game-bootstrap';
import { createMovementInput } from '../gameplay/movement-input';
import { loadSavedAppearance } from '../world/david-appearance';
import { WebGLUnavailable } from '../world/graphics';
import { openMovementArea, type BattleView, type InteractionView } from '../world/movement-area';
import { contentVersion, currentObjective, episodeId, preparation } from '../gameplay/episode-rules';
import { episodeLink, openEpisodeRoute } from './episode-route';
import type { EpisodeBattleSetup } from '../gameplay/elah-battle';
import './style.css';
import './movement.css';

let canvas = document.querySelector<HTMLCanvasElement>('#stage')!;
const stage = canvas.parentElement!;
const pad = document.getElementById('move-pad')!;
const entry = document.getElementById('entry')!;
const message = document.getElementById('entry-message')!;
const enter = document.querySelector<HTMLButtonElement>('#enter')!;
const retry = document.querySelector<HTMLButtonElement>('#retry')!;
const pause = document.querySelector<HTMLButtonElement>('#pause')!;
const reset = document.querySelector<HTMLButtonElement>('#reset')!;
const sound = document.querySelector<HTMLButtonElement>('#sound');
const notice = document.getElementById('pause-notice')!;
const inspectMarker = document.querySelector<HTMLButtonElement>('#inspect-marker');
const caption = document.getElementById('cue-caption');
const scene = stage.closest('main')?.dataset.scene === 'elah' ? 'elah' : 'courtyard';
const sceneName = scene === 'elah' ? 'the Valley of Elah' : 'the courtyard';
const battleUi = scene === 'elah' ? {
  hud: document.getElementById('battle-hud')!,
  objective: document.getElementById('objective')!,
  stones: document.getElementById('stone-count')!,
  reticle: document.getElementById('sling-aim')!,
  throwButton: document.querySelector<HTMLButtonElement>('#throw-stone')!,
  caption: document.getElementById('battle-caption')!,
  panel: document.getElementById('battle-result')!,
  title: document.getElementById('battle-result-title')!,
  detail: document.getElementById('battle-result-detail')!,
  replay: document.querySelector<HTMLButtonElement>('#battle-replay')!,
  approachInstructions: document.getElementById('instructions')!,
  fightInstructions: document.getElementById('battle-instructions')!,
} : undefined;

let input: ReturnType<typeof createMovementInput> | undefined;
let area: Awaited<ReturnType<typeof openMovementArea>> | undefined;
let paused = true;
let leaving = false;
let muted = false;
let battleView: BattleView | undefined;
let episodeRoute: Exclude<Awaited<ReturnType<typeof openEpisodeRoute>>, 'redirect'>;
let routeLoaded = false;

function updateControls() {
  const running = entry.hidden === true && !paused;
  const fighting = battleView?.phase === 'fight';
  const moving = !battleView || battleView.phase === 'approach' || fighting;
  stage.toggleAttribute('data-running', running && moving && (!caption || caption.hidden === true));
  if (!battleUi || !battleView) return;
  battleUi.hud.hidden = !running || !moving;
  battleUi.stones.hidden = !fighting;
  battleUi.reticle.hidden = battleUi.throwButton.hidden = !running || !fighting;
  battleUi.throwButton.disabled = !battleView.canThrow;
  battleUi.approachInstructions.hidden = battleView.phase !== 'approach';
  battleUi.fightInstructions.hidden = !fighting;
  pause.disabled = reset.disabled = entry.hidden !== true || !!battleView.result;
  if (episodeRoute && currentObjective(episodeRoute.session.run)?.id === 'victory.witnessed') reset.disabled = true;
}

function setText(element: HTMLElement, text: string) {
  if (element.textContent !== text) element.textContent = text;
}

function renderInteraction(view: InteractionView) {
  if (inspectMarker) inspectMarker.hidden = !view.canInteract;
  if (caption) {
    caption.hidden = !view.cueText;
    caption.textContent = view.cueText;
  }
  if (battleUi && view.battle) {
    const previous = battleView;
    battleView = view.battle;
    if (episodeRoute && !episodeRoute.pending) {
      const route = episodeRoute, goal = currentObjective(route.session.run)?.id;
      if ((battleView.phase === 'fall' || battleView.phase === 'retreat') && goal === 'goliath.struck') {
        area?.setPaused(true);
        void route.save(() => route.session.commit({ type: 'objective', id: 'goliath.struck' }), () => area?.setPaused(paused));
      } else if (battleView.result === 'defeat' && route.session.run.status !== 'defeated') {
        area?.setPaused(true);
        void route.save(() => route.session.commit({ type: 'defeat', reason: 'david_killed_by_goliath' }), () => {});
      } else if (battleView.result === 'victory' && goal === 'victory.witnessed') {
        area?.setPaused(true);
        void route.save(() => route.session.commit({ type: 'objective', id: 'victory.witnessed' }), () => location.assign(episodeLink('episode.html')));
      }
    }
    const { instruction, stones, aimX, aimY, aimed, caption, result } = battleView;
    setText(battleUi.objective, instruction);
    setText(battleUi.stones, stones === 1 ? '1 stone' : `${stones} stones`);
    setText(battleUi.caption, caption);
    battleUi.caption.hidden = !caption;
    battleUi.reticle.style.left = `${aimX * 100}%`;
    battleUi.reticle.style.top = `${aimY * 100}%`;
    battleUi.reticle.toggleAttribute('data-aimed', aimed);
    if (result !== previous?.result) {
      battleUi.panel.hidden = !result;
      if (result) {
        const lost = result === 'defeat';
        setText(battleUi.title, lost ? 'David fell' : 'Goliath fell');
        setText(battleUi.detail, lost ? 'Goliath’s spear struck David.' : 'David struck Goliath with his sling. The Philistines fled.');
        setText(battleUi.replay, lost ? 'Retry Battle' : episodeRoute ? 'View results' : 'Play again');
        battleUi.replay.focus();
      }
    }
  }
  updateControls();
}

async function load() {
  retry.hidden = true;
  enter.hidden = true;
  message.textContent = `Loading David and ${sceneName}…`;
  const controls = createMovementInput(canvas, pad, scene === 'elah');
  input = controls;
  try {
    if (!routeLoaded && scene === 'elah') {
      const route = await openEpisodeRoute('battle', () => { paused = true; area?.setPaused(true); updateControls(); });
      if (route === 'redirect') { controls.dispose(); return; }
      episodeRoute = route; routeLoaded = true;
      if (route) {
        const nav = document.querySelector<HTMLAnchorElement>('.preview-link');
        if (nav) { nav.href = episodeLink('episode.html'); nav.textContent = 'Episode'; }
        reset.textContent = 'Restart checkpoint';
      }
    }
    const progress = episodeRoute?.session.run;
    const setup: EpisodeBattleSetup | undefined = progress && {
      episodeId, contentVersion, preparation: preparation(progress), attempt: progress.attempt,
      anchor: progress.completed.includes('goliath.struck') ? 'battle.aftermath' : 'battle.entry', defeated: progress.status === 'defeated',
    };
    const session = await openMovementArea(canvas, controls, loadSavedAppearance(), renderInteraction, scene, setup);
    if (leaving) {
      session.dispose();
      return;
    }
    area = session;
    area.setMuted(muted);
    canvas.dataset.renderer = area.backend;
    message.textContent = scene === 'elah'
      ? 'Walk down to the brook and approach Goliath.'
      : 'Follow the stones through the gap to find the trail marker.';
    enter.hidden = false;
  } catch (error) {
    controls.dispose();
    message.textContent = error instanceof WebGLUnavailable
      ? 'WebGL 2 is unavailable. Enable hardware acceleration or try another browser.'
      : `Could not load ${sceneName}. Try again.`;
    retry.hidden = false;
    console.error('Scene setup failed:', error);
  }
}

function setPaused(value: boolean) {
  if (battleView?.result) return;
  paused = value;
  area?.setPaused(value);
  pause.textContent = value ? 'Resume' : 'Pause';
  notice.hidden = !value;
  updateControls();
  if (!value) canvas.focus();
}

enter.addEventListener('click', () => {
  if (!area) return;
  entry.hidden = true;
  pause.disabled = reset.disabled = false;
  setPaused(false);
});
retry.addEventListener('click', () => {
  const replacement = canvas.cloneNode(false) as HTMLCanvasElement;
  canvas.replaceWith(replacement);
  canvas = replacement;
  void load();
});
pause.addEventListener('click', () => setPaused(!paused));
sound?.addEventListener('click', () => {
  muted = !muted;
  sound.setAttribute('aria-pressed', String(!muted));
  sound.textContent = muted ? 'Sound off' : 'Sound on';
  area?.setMuted(muted);
});
function restart() {
  if (episodeRoute) {
    const route = episodeRoute;
    if (route.pending) return;
    if (route.session.run.status === 'defeated') {
      void route.save(() => route.session.commit({ type: 'retry' }), () => {
        area?.reset({ attempt: route.session.run.attempt }); setPaused(false);
      });
    } else if (route.session.run.status === 'completed') location.assign(episodeLink('episode.html'));
    else if (currentObjective(route.session.run)?.id === 'goliath.struck') { area?.reset({ attempt: route.session.run.attempt }); setPaused(false); }
    return;
  }
  area?.reset();
  setPaused(false);
}
reset.addEventListener('click', restart);
battleUi?.replay.addEventListener('click', restart);
function releaseSling() {
  if (area?.throwStone()) canvas.focus();
}
battleUi?.throwButton.addEventListener('click', releaseSling);
battleUi?.throwButton.addEventListener('pointerup', event => {
  if (event.pointerType !== 'touch') return;
  const underPointer = document.elementFromPoint(event.clientX, event.clientY);
  if (battleUi.throwButton.contains(underPointer)) releaseSling();
});
inspectMarker?.addEventListener('click', () => {
  if (area?.interact()) canvas.focus();
});
window.addEventListener('keydown', event => {
  if (!area || !entry.hidden || event.repeat || episodeRoute?.pending) return;
  if (event.key === 'Escape') setPaused(!paused);
  if (event.altKey || event.ctrlKey || event.metaKey) return;
  if (event.code === 'KeyE' && area.interact()) {
    event.preventDefault();
    canvas.focus();
  }
  if (event.code === 'Space' && (event.target === canvas || event.target === document.body) && area.throwStone()) {
    event.preventDefault();
  }
});
window.addEventListener('pagehide', event => {
  if (event.persisted) {
    if (area && entry.hidden) setPaused(true);
    return;
  }
  leaving = true;
  area?.dispose();
  input?.dispose();
});

void load();
