// Content and progression are independent of rendering and storage.
export const episodeId = 'david-and-goliath';
export const contentVersion = 'm2-outline-1';
export const chapters = ['The Valley of Elah', 'David Arrives', 'The Challenge', 'Preparation', 'David and Goliath', 'Victory'] as const;
export const objectives = [
  { id: 'valley.surveyed', chapter: 0, label: 'Survey the valley from the overlook', anchor: 'valley.entry', area: 'valley' },
  { id: 'provisions.delivered', chapter: 1, label: 'Deliver the provisions to the baggage keeper', anchor: 'camp.entry', area: 'valley' },
  { id: 'brothers.met', chapter: 1, label: 'Greet your brothers in the camp', anchor: 'camp.entry', area: 'valley' },
  { id: 'challenge.heard', chapter: 2, label: 'Hear Goliath’s challenge from the overlook', anchor: 'challenge.entry', area: 'valley' },
  { id: 'eliab.answered', chapter: 2, label: 'Speak to Eliab about the challenge', anchor: 'challenge.entry', area: 'valley' },
  { id: 'saul.audience', chapter: 3, label: 'Speak to Saul in his pavilion', anchor: 'saul.entry', area: 'saul' },
  { id: 'armour.inspected', chapter: 3, label: 'Inspect Saul’s armour', anchor: 'saul.entry', area: 'saul' },
  { id: 'armour.declined', chapter: 3, label: 'Set aside the unfamiliar armour', anchor: 'saul.entry', area: 'saul' },
  { id: 'stones.gathered', chapter: 3, label: 'Gather five smooth stones at the brook', anchor: 'brook.entry', area: 'valley' },
  { id: 'sling.practised', chapter: 3, label: 'Practise: aim at the woven target and throw', anchor: 'brook.entry', area: 'valley' },
  { id: 'goliath.struck', chapter: 4, label: 'Face Goliath with your sling', anchor: 'battle.entry', area: 'battle' },
  { id: 'victory.witnessed', chapter: 5, label: 'Witness the Philistine retreat', anchor: 'battle.aftermath', area: 'battle' },
] as const;
export type ObjectiveId = typeof objectives[number]['id'];
export type Run = {
  schemaVersion: 1; episodeId: typeof episodeId; contentVersion: typeof contentVersion;
  runId: string; revision: number; completed: ObjectiveId[];
  status: 'active' | 'defeated' | 'completed'; attempt: number; defeats: number;
  startedAt: string; updatedAt: string;
};
export type EpisodeEvent = { type: 'objective'; id: ObjectiveId }
  | { type: 'defeat'; reason: 'david_killed_by_goliath' }
  | { type: 'retry' };
export type RunSummary = Pick<Run, 'runId' | 'startedAt' | 'updatedAt' | 'status' | 'attempt' | 'defeats'>;

export function freshRun(now = new Date().toISOString()): Run {
  return { schemaVersion: 1, episodeId, contentVersion, runId: crypto.randomUUID(), revision: 0,
    completed: [], status: 'active', attempt: 1, defeats: 0, startedAt: now, updatedAt: now };
}
export function currentObjective(run: Run) { return objectives[run.completed.length]; }
export function preparation(run: Run) {
  return { provisionsDelivered: run.completed.includes('provisions.delivered'),
    armourDeclined: run.completed.includes('armour.declined'),
    stonesGathered: run.completed.includes('stones.gathered') ? 5 : 0,
    slingReady: run.completed.includes('sling.practised') };
}
export function checkpoint(run: Run) { return currentObjective(run)?.anchor ?? 'episode.complete'; }
export function episodePage(run: Run) {
  if (currentObjective(run)?.id === 'valley.surveyed') return 'valley.html';
  if (['provisions.delivered', 'brothers.met'].includes(currentObjective(run)?.id ?? '')) return 'camp.html';
  if (['challenge.heard', 'eliab.answered'].includes(currentObjective(run)?.id ?? '')) return 'challenge.html';
  if (currentObjective(run)?.chapter === 3) return 'preparation.html';
  if (currentObjective(run)?.chapter === 4) return 'duel.html';
  if (currentObjective(run)?.id === 'victory.witnessed') return 'victory.html';
  const area = currentObjective(run)?.area;
  return area === 'saul' ? 'saul.html?episode=1' : area === 'battle' ? 'elah.html?episode=1' : 'episode.html';
}
export function reduceEpisode(run: Run, event: EpisodeEvent, now = new Date().toISOString()): Run {
  if (event.type === 'objective' && run.completed.includes(event.id)) return run;
  if (run.status === 'completed') throw new Error('This run is complete. Replay starts a new run.');
  const next = structuredClone(run);
  if (event.type === 'retry') {
    if (run.status !== 'defeated') throw new Error('Retry is available after Goliath defeats David.');
    next.status = 'active'; next.attempt++;
  } else if (event.type === 'defeat') {
    if (run.status === 'defeated') return run;
    if (event.reason !== 'david_killed_by_goliath' || currentObjective(run)?.id !== 'goliath.struck') throw new Error('Only a lethal Goliath strike can cause defeat.');
    next.status = 'defeated'; next.defeats++;
  } else {
    if (run.status !== 'active' || currentObjective(run)?.id !== event.id) throw new Error('Complete the current objective first.');
    next.completed.push(event.id);
    if (next.completed.length === objectives.length) next.status = 'completed';
  }
  next.revision++; next.updatedAt = now;
  return next;
}

export function validateRun(value: unknown): Run {
  if (!value || typeof value !== 'object') throw new Error('The local checkpoint is unreadable.');
  const run = value as Run;
  if (run.schemaVersion !== 1 || run.episodeId !== episodeId || run.contentVersion !== contentVersion) throw new Error('This checkpoint belongs to a different content version.');
  if (typeof run.runId !== 'string' || !/^[a-f0-9-]{36}$/i.test(run.runId) ||
    !Number.isSafeInteger(run.revision) || run.revision < 0 ||
    !Number.isSafeInteger(run.attempt) || run.attempt < 1 || run.attempt > 100000 ||
    !Number.isSafeInteger(run.defeats) || run.defeats < 0 || run.defeats > 100000 || run.attempt > run.defeats + 1 ||
    !['active', 'defeated', 'completed'].includes(run.status) ||
    !Array.isArray(run.completed) || run.completed.length > objectives.length ||
    run.completed.some((id, index) => id !== objectives[index].id) ||
    typeof run.startedAt !== 'string' || !Number.isFinite(Date.parse(run.startedAt)) ||
    typeof run.updatedAt !== 'string' || !Number.isFinite(Date.parse(run.updatedAt))) throw new Error('The local checkpoint failed validation.');
  if ((run.status === 'completed') !== (run.completed.length === objectives.length) ||
    (run.status === 'defeated' && (currentObjective(run)?.id !== 'goliath.struck' || run.defeats !== run.attempt)) ||
    (run.status !== 'defeated' && run.defeats !== run.attempt - 1) || run.revision !== run.completed.length + run.defeats + run.attempt - 1) throw new Error('The local checkpoint contains inconsistent progress.');
  return structuredClone(run);
}
