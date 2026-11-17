import { currentAccountSettings, setSessionMuted } from '../product/preferences';
// A presentation preference, separate from the confirmed story checkpoint.
const key = 'bible-comic.episode.sound-muted.v1';

export function readEpisodeMuted(): boolean {
  const settings = currentAccountSettings(); if (settings) return settings.muted;
  try { return localStorage.getItem(key) === '1'; }
  catch { return false; }
}

export function writeEpisodeMuted(muted: boolean): void {
  if (currentAccountSettings()) { setSessionMuted(muted); return; }
  // Unavailable preference storage must not interrupt a playable chapter.
  try { localStorage.setItem(key, muted ? '1' : '0'); }
  catch { /* Keep the current audio choice for this page. */ }
}

export function setEpisodeSoundButton(button: HTMLButtonElement, muted: boolean): void {
  button.textContent = muted ? 'Enable sound' : 'Mute sound';
  button.setAttribute('aria-pressed', String(!muted));
  button.title = muted ? 'Turn dialogue, music and effects on' : 'Turn dialogue, music and effects off';
}
