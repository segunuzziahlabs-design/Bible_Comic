import { contentVersion, validateRun } from '../gameplay/episode-rules';
import type { EpisodeSaveAdapter } from '../gameplay/episode-session';
import type { AccountApi, ProgressCommand, BattleCommand } from './contracts';

/** Send semantic commands, never a caller-supplied progress snapshot. */
export function cloudEpisodeSaves(api: AccountApi): EpisodeSaveAdapter {
  let confirmed: Awaited<ReturnType<EpisodeSaveAdapter['read']>>;
  let pending: ProgressCommand | undefined;
  let pendingBattle:BattleCommand|undefined;
  return {
    async read() { confirmed = (await api.dashboard()).episode ?? undefined; return confirmed && structuredClone(confirmed); },
    async write(next, expected) {
      validateRun(next.current);
      const before=confirmed?.current;
      if(expected&&before&&next.current.runId===before.runId&&next.current.revision===before.revision&&next.current.battle?.revision!==before.battle?.revision){
        if(pending)throw new Error('Retry the pending objective save first.');
        if(before.runId!==expected.runId||before.revision!==expected.revision||before.battle?.revision!==expected.battleRevision)throw new Error('Reload the confirmed battle checkpoint.');
        const stage=next.current.battle!.stage,p_action=stage==='combat'?'begin':stage==='sword_taken'?'take_sword':stage==='finished'?'finish':undefined;
        if(!p_action)throw new Error('The fallen checkpoint belongs to the story objective.');
        const request={p_run:before.runId,p_revision:before.revision,p_battle_revision:before.battle?.revision??null,p_action} as const;
        if(pendingBattle&&Object.entries(request).some(([key,value])=>pendingBattle![key as keyof BattleCommand]!==value))throw new Error('Retry the pending battle save or reload.');
        pendingBattle??={...request,p_command:crypto.randomUUID()};
        const result=await api.battle(pendingBattle);if(!result)throw new Error('The battle checkpoint was not confirmed.');
        validateRun(result.current);confirmed=structuredClone(result);pendingBattle=undefined;return structuredClone(result);
      }
      if(pendingBattle)throw new Error('Retry the pending battle save first.');
      let kind: ProgressCommand['p_kind']; let objective: string | null = null;
      if (!expected) {
        if (confirmed || next.current.revision !== 0) throw new Error('Reload the confirmed episode before starting.');
        kind = 'start';
      } else {
        const before = confirmed?.current;
        if (!before || before.runId !== expected.runId || before.revision !== expected.revision) throw new Error('Progress changed. Reload the confirmed checkpoint.');
        if (next.current.runId !== before.runId) {
          if (before.status !== 'completed' || next.current.revision !== 0) throw new Error('Replay requires a completed episode.');
          kind = 'replay';
        } else if (next.current.completed.length === before.completed.length + 1) {
          kind = 'objective'; objective = next.current.completed.at(-1)!;
        } else if (next.current.status === 'defeated' && before.status === 'active') kind = 'defeat';
        else if (before.status === 'defeated' && next.current.status === 'active') kind = 'retry';
        else throw new Error('Unsupported progress change.');
      }
      const request = { p_kind: kind, p_run: expected?.runId ?? null, p_revision: expected?.revision ?? null, p_objective: objective, p_version: contentVersion };
      // Preserve the command ID after a timeout: the server may already have committed it.
      if (pending && Object.entries(request).some(([key,value]) => pending![key as keyof ProgressCommand] !== value)) throw new Error('Retry the pending save or reload the confirmed checkpoint.');
      pending ??= { ...request, p_command: crypto.randomUUID() };
      const result = await api.progress(pending);
      if (!result) throw new Error('The server did not confirm the checkpoint.');
      validateRun(result.current); confirmed = structuredClone(result); pending = undefined;
      return structuredClone(result);
    },
  };
}
