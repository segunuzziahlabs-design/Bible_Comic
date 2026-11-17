import './account-game-bootstrap';
import { localDevelopment } from '../product/account-runtime';
import { chapters, currentObjective, episodePage } from '../gameplay/episode-rules';
import { openEpisodeSession } from '../gameplay/episode-session';
import './saul.css';
import './episode.css';

const element = (id: string) => document.getElementById(id)!;
const button = (id: string) => element(id) as HTMLButtonElement;
const inspect = new URLSearchParams(location.search).has('inspect');
const route = (page: string) => page + (inspect ? '?inspect=1' : '');
window.addEventListener('pageshow', event => { if (event.persisted) location.reload(); });

async function main() {
  const session = await openEpisodeSession();
  if (!localDevelopment) {
    document.querySelector('footer p')!.textContent = 'Progress confirms to your account after completed objectives. Unfinished actions resume from the last confirmed checkpoint.';
    element('results').querySelector('.entry-card > p:last-child')!.textContent = 'Your completed run is retained in your account history when you begin again.';
  }
  const run = session.run;
  if (run.status === 'completed') {
    element('chapter').textContent = 'The story is complete';
    element('entry').hidden = true;
    element('results').hidden = false;
    element('result-detail').textContent = `6 chapters complete · ${run.attempt} battle attempt${run.attempt === 1 ? '' : 's'} · ${run.defeats} defeat${run.defeats === 1 ? '' : 's'}`;
    button('replay').addEventListener('click', async () => {
      button('replay').disabled = true;
      try { await session.replay(); location.assign(route('valley.html')); }
      catch (error) { button('replay').disabled = false; element('result-detail').textContent = String(error); }
    });
    return;
  }
  const goal = currentObjective(run)!;
  element('entry-title').textContent = chapters[goal.chapter];
  element('entry-message').textContent = run.status === 'defeated'
    ? 'Your preparation is saved. Return to the battle and choose Retry Battle.'
    : run.completed.length ? `Resume Chapter ${goal.chapter + 1}: ${goal.label}.`
    : 'Watch David tending the flock as a messenger arrives. Follow the pasture arrows; David then arrives at Jesse’s courtyard automatically. Speak with Jesse, collect the supplies and continue the journey to Elah.';
  button('enter').textContent = run.completed.length || run.status === 'defeated' ? 'Continue episode' : 'Begin episode';
  button('enter').hidden = false;
  button('enter').addEventListener('click', () => location.assign(route(episodePage(run))));
}

window.addEventListener('storage', event => {
  if (event.key !== 'bible-comic.episode.local.v1') return;
  button('enter').hidden = button('replay').hidden = true;
  element('entry').hidden = false;
  element('results').hidden = true;
  element('entry-message').textContent = 'Progress changed in another tab. Reload to continue from the confirmed checkpoint.';
  button('retry').hidden = false;
});
button('retry').addEventListener('click', () => location.reload());
void main().catch(error => {
  console.error(error);
  element('entry-message').textContent = error instanceof Error ? error.message : 'The episode could not load.';
  button('retry').hidden = false;
});
