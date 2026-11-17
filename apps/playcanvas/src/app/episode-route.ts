import { chapters, currentObjective, episodePage } from '../gameplay/episode-rules';
import { openEpisodeSession } from '../gameplay/episode-session';
import { checkpointSaved } from './account-game-bootstrap';

export async function openEpisodeRoute(area: 'saul' | 'battle', suspend: () => void) {
  if (!new URLSearchParams(location.search).has('episode')) return;
  const session = await openEpisodeSession();
  // A restored page must read the latest chapter rather than revive an old scene owner.
  window.addEventListener('pageshow', event => { if (event.persisted) location.reload(); });
  if (currentObjective(session.run)?.area !== area) {
    location.replace(episodeLink(episodePage(session.run))); return 'redirect' as const;
  }
  const label = document.createElement('p'); label.id = 'episode-save-status';
  label.style.cssText = 'position:absolute;left:16px;bottom:8px;margin:0;font:10px system-ui;color:#eadab8;background:#182427d9;padding:5px 8px;pointer-events:none;z-index:2';
  document.querySelector('.stage')!.append(label);
  const panel = document.createElement('div'); panel.className = 'entry'; panel.hidden = true; panel.style.zIndex = '9';
  const card = document.createElement('div'); card.className = 'entry-card';
  const title = document.createElement('h2'); title.textContent = 'Progress has not saved';
  const message = document.createElement('p'); message.setAttribute('role', 'alert');
  const retry = document.createElement('button'); retry.textContent = 'Retry save';
  const reload = document.createElement('button'); reload.textContent = 'Reload checkpoint';
  reload.addEventListener('click', () => location.reload()); card.append(title, message, retry, reload); panel.append(card);
  document.querySelector('.stage')!.append(panel);
  let pending = false, retryWrite: (() => void) | undefined;
  function refresh() {
    const goal = currentObjective(session.run);
    label.textContent = `${goal ? `Chapter ${goal.chapter + 1} · ${chapters[goal.chapter]}` : 'Episode complete'} · ${checkpointSaved()}`;
  }
  async function save(operation: () => Promise<void>, done: () => void) {
    if (pending && panel.hidden) return;
    pending = true; retry.disabled = true; label.textContent = 'Confirming checkpoint…';
    retryWrite = () => { void save(operation, done); };
    try {
      await operation(); pending = false; retryWrite = undefined; panel.hidden = true; refresh(); done();
    } catch (error) {
      suspend(); panel.hidden = false; retry.disabled = false;
      message.textContent = error instanceof Error ? error.message : 'The last checkpoint is preserved. Try saving again.';
      label.textContent = 'Checkpoint not saved';
    }
  }
  retry.addEventListener('click', () => retryWrite?.());
  window.addEventListener('storage', event => {
    if (event.key !== 'bible-comic.episode.local.v1') return;
    pending = true; suspend(); panel.hidden = false; retry.hidden = true;
    message.textContent = 'Progress changed in another tab. Reload its checkpoint.';
  });
  refresh();
  return { session, save, refresh, get pending() { return pending; } };
}
export function episodeLink(path: string) {
  return path + (new URLSearchParams(location.search).has('inspect') ? (path.includes('?') ? '&' : '?') + 'inspect=1' : '');
}
