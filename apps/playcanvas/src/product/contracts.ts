import { validateRun, type Run, type RunSummary } from '../gameplay/episode-rules';
import { defaultAppearance, hairColours, hairStyles, skinTones, tunicColours, type DavidAppearance } from '../world/david-appearance';

export type Settings = { schemaVersion: 1; muted: boolean; captions: boolean; graphics: 'balanced' | 'low'; movement: 'auto' | 'keys' | 'stick'; labels: 'wasd' | 'arrows'; appearance: DavidAppearance | null };
export const defaultSettings: Settings = { schemaVersion: 1, muted: false, captions: true, graphics: 'balanced', movement: 'auto', labels: 'wasd', appearance: null };
export type Account = { id: string; displayName: string; revision: number; settings: Settings; episode: { current: Run; history: RunSummary[] } | null };
export type ProgressCommand = { p_command: string; p_kind: 'start' | 'objective' | 'defeat' | 'retry' | 'replay'; p_run: string | null; p_revision: number | null; p_objective: string | null; p_version: string };
export type Attempt = { run_id: string; attempt: number; outcome: 'defeated' | 'completed'; recorded_at: string };
export interface AccountApi {
  dashboard(): Promise<Account>;
  history(offset?: number): Promise<Attempt[]>;
  progress(command: ProgressCommand): Promise<Account['episode']>;
  update(command: { p_command: string; p_revision: number; p_name: string; p_settings: Settings }): Promise<Account>;
}
export function validateSettings(value: unknown): Settings {
  const s = value as Settings;
  if (!s || s.schemaVersion !== 1 || typeof s.muted !== 'boolean' || typeof s.captions !== 'boolean' || !['balanced','low'].includes(s.graphics) || !['auto','keys','stick'].includes(s.movement) || !['wasd','arrows'].includes(s.labels)) throw new Error('The saved settings use an unsupported format.');
  if (s.appearance) {
    if (!Object.hasOwn(skinTones,s.appearance.skin) || !Object.hasOwn(hairColours,s.appearance.hairColour) || !Object.hasOwn(hairStyles,s.appearance.hairStyle) || !Object.hasOwn(tunicColours,s.appearance.tunic)) throw new Error('The saved appearance uses unsupported choices.');
  } else if (s.appearance !== null) throw new Error('The saved appearance is invalid.');
  return structuredClone(s);
}
export function validateAccount(value: unknown): Account {
  const a = value as Account;
  if (!a || typeof a.id !== 'string' || typeof a.displayName !== 'string' || !Number.isSafeInteger(a.revision) || a.revision < 0) throw new Error('The account response is invalid.');
  validateSettings(a.settings);
  if (a.episode) {
    validateRun(a.episode.current);
    if (!Array.isArray(a.episode.history) || a.episode.history.length>20 || a.episode.history.some(h=>!h || h.status!=='completed' || typeof h.runId!=='string' || !Number.isSafeInteger(h.attempt) || h.attempt<1 || !Number.isSafeInteger(h.defeats) || h.defeats!==h.attempt-1 || !Number.isFinite(Date.parse(h.updatedAt)) || !Number.isFinite(Date.parse(h.startedAt)))) throw new Error('The result history is invalid.');
  } else if (a.episode!==null) throw new Error('The episode response is invalid.');
  return structuredClone(a);
}
export function appearanceFor(settings: Settings) { return settings.appearance ?? { ...defaultAppearance }; }
