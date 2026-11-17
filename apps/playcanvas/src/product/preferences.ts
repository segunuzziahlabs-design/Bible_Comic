import type { Settings } from './contracts';
let accountSettings: Settings | undefined;
let overrideKey: string | undefined;
type Overrides = Pick<Settings,'muted'|'movement'|'labels'>;
export function useAccountSettings(settings: Settings, accountId?: string, revision?: number) {
  accountSettings = structuredClone(settings);
  overrideKey = accountId ? `bible-comic.account.overrides.v1.${accountId}.${revision ?? 0}` : undefined;
  if (overrideKey) try {
    const saved = JSON.parse(sessionStorage.getItem(overrideKey) ?? 'null');
    if(saved && typeof saved.muted === 'boolean' && ['auto','keys','stick'].includes(saved.movement) && ['wasd','arrows'].includes(saved.labels)) Object.assign(accountSettings,saved);
  } catch { /* Session choices remain usable when browser storage is restricted. */ }
  document.documentElement.dataset.captions = settings.captions ? 'on' : 'off';
  document.documentElement.dataset.graphics = settings.graphics;
}
export function currentAccountSettings() { return accountSettings; }
// Preserve choices across chapter pages in this tab, isolated by account and settings revision.
function remember() {
  if (!accountSettings || !overrideKey) return;
  const {muted,movement,labels}=accountSettings;
  try { sessionStorage.setItem(overrideKey,JSON.stringify({muted,movement,labels} satisfies Overrides)); } catch { /* Keep the current page usable. */ }
}
export function setSessionMuted(muted: boolean) { if (accountSettings) { accountSettings.muted = muted; remember(); } }
export function setSessionControls(movement: Settings['movement'], labels: Settings['labels']) { if(accountSettings) {accountSettings.movement=movement;accountSettings.labels=labels;remember();} }
