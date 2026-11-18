import { chapters, currentObjective, requiresBattleFinish } from '../gameplay/episode-rules';
import type { Account } from './contracts';

/** A replay does not remove access to chapters in a confirmed completed run. */
export function canReviewChapter(episode: Account['episode'], chapter: number) {
  if (!episode || !Number.isInteger(chapter) || chapter < 0 || chapter >= chapters.length) return false;
  return episode.current.status === 'completed' || episode.history.some(run => run.status === 'completed')
    || chapter < (requiresBattleFinish(episode.current)?4:currentObjective(episode.current)?.chapter ?? 0);
}
