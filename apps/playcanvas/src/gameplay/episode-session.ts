import { currentObjective, freshRun, reduceEpisode, validateRun, type EpisodeEvent, type ObjectiveId, type Run, type RunSummary } from './episode-rules';

export const episodeStorageKey = 'bible-comic.episode.local.v1';
export type Envelope = { current: Run; history: RunSummary[] };
export interface EpisodeSaveAdapter {
  read(): Promise<Envelope | undefined>;
  write(next: Envelope, expected?: { runId: string; revision: number }): Promise<void | Envelope>;
}
export function browserEpisodeSaves(storage: Storage = localStorage): EpisodeSaveAdapter {
  async function read(): Promise<Envelope | undefined> {
    const raw = storage.getItem(episodeStorageKey);
    if (!raw) return;
    let data: Envelope;
    try { data = JSON.parse(raw); } catch { throw new Error('The local checkpoint is unreadable. It has been preserved.'); }
    const current = validateRun(data?.current);
    if (!Array.isArray(data.history) || data.history.length > 20 || data.history.some(item =>
      !item || typeof item.runId !== 'string' || item.status !== 'completed' || !Number.isSafeInteger(item.attempt))) throw new Error('The local result history is unreadable. It has been preserved.');
    return { current, history: data.history };
  }
  return {
    read,
    async write(next, expected) {
      async function perform() {
        const existing = await read();
        if (expected && (existing?.current.runId !== expected.runId || existing.current.revision !== expected.revision)) throw new Error('Progress changed in another tab. Reload the checkpoint.');
        if (!expected && existing) throw new Error('A local run already exists. Reload its checkpoint.');
        // One storage write commits objectives, inventory-derived flags and checkpoint together.
        storage.setItem(episodeStorageKey, JSON.stringify(next));
      }
      // Serialize cooperating local tabs. Production account writes use the M4 server adapter.
      if (typeof navigator !== 'undefined' && navigator.locks) await navigator.locks.request(episodeStorageKey, perform);
      else await perform();
    },
  };
}

export type CueToken = { runId: string; revision: number; objective: ObjectiveId; nonce: string };
export async function openEpisodeSession(adapter?: EpisodeSaveAdapter) {
  if (!adapter) {
    const { localDevelopment, playerAccount } = await import('../product/account-runtime');
    adapter = localDevelopment ? browserEpisodeSaves() : (await import('../product/cloud-saves')).cloudEpisodeSaves((await playerAccount()).api);
  }
  const storage = adapter;
  let envelope = await adapter.read();
  if (!envelope) { envelope = { current: freshRun(), history: [] }; envelope = await storage.write(envelope) ?? envelope; }
  let ownedCue: CueToken | undefined;
  let busy = false;
  async function commit(event: EpisodeEvent) {
    if (busy) throw new Error('A checkpoint write is already in progress.');
    const before = envelope!.current;
    const next = reduceEpisode(before, event);
    if (next === before) return;
    busy = true;
    try {
      const pending = { ...envelope!, current: next };
      const confirmed = await storage.write(pending, { runId: before.runId, revision: before.revision });
      envelope = confirmed ?? pending; ownedCue = undefined;
    } finally { busy = false; }
  }
  return {
    get run() { return structuredClone(envelope!.current); },
    get history() { return structuredClone(envelope!.history); },
    commit,
    beginCue(objective: ObjectiveId): CueToken {
      const run = envelope!.current;
      if (busy || run.status !== 'active' || currentObjective(run)?.id !== objective) throw new Error('This scene does not own the current objective.');
      ownedCue = { runId: run.runId, revision: run.revision, objective, nonce: crypto.randomUUID() };
      return { ...ownedCue };
    },
    cancelCue() { ownedCue = undefined; },
    async finishCue(token: CueToken) {
      if (!ownedCue || token.nonce !== ownedCue.nonce || token.runId !== envelope!.current.runId || token.revision !== envelope!.current.revision) throw new Error('That interrupted scene no longer owns the objective.');
      await commit({ type: 'objective', id: token.objective });
    },
    async replay() {
      if (busy || envelope!.current.status !== 'completed') throw new Error('Finish this episode before starting a replay.');
      busy = true;
      try {
        const before = envelope!.current;
        const { runId, startedAt, updatedAt, status, attempt, defeats } = before;
        const next = { current: freshRun(), history: [...envelope!.history, { runId, startedAt, updatedAt, status, attempt, defeats }].slice(-20) };
        const confirmed = await storage.write(next, { runId: before.runId, revision: before.revision });
        envelope = confirmed ?? next; ownedCue = undefined;
      } finally { busy = false; }
    },
  };
}
export type EpisodeSession = Awaited<ReturnType<typeof openEpisodeSession>>;
