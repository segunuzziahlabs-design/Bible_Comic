const assert = require('node:assert/strict');
const path = require('node:path');
// Node 24 strips TypeScript; resolve the browser's extensionless local import.
require('node:module').registerHooks({ resolve(specifier, context, next) {
  if (specifier === './episode-rules' && context.parentURL?.endsWith('/episode-session.ts')) specifier += '.ts';
  return next(specifier, context);
} });
const rules = require('../src/gameplay/episode-rules.ts');
const saves = require('../src/gameplay/episode-session.ts');

(async () => {
  let stored;
  let fail = false;
  const storage = {
    getItem: () => stored ?? null,
    setItem: (_, value) => { if (fail) throw new Error('Quota exceeded'); stored = value; },
  };
  const adapter = saves.browserEpisodeSaves(storage);
  const session = await saves.openEpisodeSession(adapter);
  assert.equal(rules.currentObjective(session.run).id, 'valley.surveyed');
  assert.equal(rules.preparation(session.run).stonesGathered, 0);
  await assert.rejects(session.commit({ type: 'objective', id: 'goliath.struck' }));
  await assert.rejects(session.commit({ type: 'defeat', reason: 'david_killed_by_goliath' }));
  const cancelled = session.beginCue('valley.surveyed'); session.cancelCue();
  await assert.rejects(session.finishCue(cancelled), /no longer owns/);
  const first = session.beginCue('valley.surveyed');
  fail = true;
  await assert.rejects(session.finishCue(first), /Quota/);
  assert.equal(session.run.revision, 0, 'A failed save must not advance memory');
  fail = false;
  await session.finishCue(first);
  assert.equal(session.run.revision, 1);
  assert.equal(rules.episodePage(session.run), 'camp.html', 'Earned survey routes to the produced baggage camp');
  await session.commit({ type: 'objective', id: 'valley.surveyed' });
  assert.equal(session.run.revision, 1, 'Duplicates are idempotent');
  const secondTab = await saves.openEpisodeSession(adapter);
  await session.commit({ type: 'objective', id: 'provisions.delivered' });
  await assert.rejects(secondTab.commit({ type: 'objective', id: 'provisions.delivered' }), /another tab/);
  const loaded = await saves.openEpisodeSession(adapter);
  assert.equal(loaded.run.completed.length, 2);
  assert.equal(rules.episodePage(loaded.run), 'camp.html', 'Delivery-only checkpoint resumes at the brothers');
  let challengeRun = rules.reduceEpisode(loaded.run, { type: 'objective', id: 'brothers.met' });
  assert.equal(rules.episodePage(challengeRun), 'challenge.html');
  challengeRun = rules.reduceEpisode(challengeRun, { type: 'objective', id: 'challenge.heard' });
  assert.equal(rules.episodePage(challengeRun), 'challenge.html', 'Heard challenge resumes at Eliab');
  challengeRun = rules.reduceEpisode(challengeRun, { type: 'objective', id: 'eliab.answered' });
  assert.equal(rules.episodePage(challengeRun), 'preparation.html');
  for (const id of ['saul.audience', 'armour.inspected', 'armour.declined', 'stones.gathered']) {
    challengeRun = rules.reduceEpisode(challengeRun, { type: 'objective', id });
    assert.equal(rules.episodePage(challengeRun), 'preparation.html', 'Every preparation checkpoint resumes in the produced chapter');
  }
  challengeRun = rules.reduceEpisode(challengeRun, { type: 'objective', id: 'sling.practised' });
  assert.equal(rules.episodePage(challengeRun), 'duel.html', 'Only complete preparation routes to the produced duel');
  for (const objective of rules.objectives.slice(2, 10)) await loaded.commit({ type: 'objective', id: objective.id });
  assert.deepEqual(rules.preparation(loaded.run), { provisionsDelivered: true, armourDeclined: true, stonesGathered: 5, slingReady: true });
  const prepared = [...loaded.run.completed];
  await loaded.commit({ type: 'defeat', reason: 'david_killed_by_goliath' });
  assert.equal(loaded.run.status, 'defeated');
  const defeated = await saves.openEpisodeSession(adapter);
  assert.equal(defeated.run.status, 'defeated');
  await defeated.commit({ type: 'retry' });
  assert.equal(defeated.run.attempt, 2); assert.deepEqual(defeated.run.completed, prepared);
  assert.equal(rules.checkpoint(defeated.run), 'battle.entry');
  await defeated.commit({ type: 'objective', id: 'goliath.struck' });
  assert.equal(rules.checkpoint(defeated.run), 'battle.aftermath');
  assert.equal(rules.episodePage(defeated.run), 'victory.html', 'A confirmed win resumes the produced Victory chapter');
  await assert.rejects(defeated.commit({ type: 'defeat', reason: 'david_killed_by_goliath' }));
  const aftermath = await saves.openEpisodeSession(adapter);
  assert.equal(rules.currentObjective(aftermath.run).id, 'victory.witnessed');
  await aftermath.commit({ type: 'objective', id: 'victory.witnessed' });
  assert.equal(aftermath.run.status, 'completed');
  rules.validateRun(aftermath.run);
  const prior = aftermath.run.runId;
  await aftermath.replay();
  assert.notEqual(aftermath.run.runId, prior); assert.equal(aftermath.history[0].runId, prior);
  assert.equal(aftermath.run.completed.length, 0);
  for (const corrupt of [
    { ...aftermath.run, contentVersion: 'unknown' },
    { ...aftermath.run, completed: ['goliath.struck'] },
    { ...aftermath.run, status: 'completed' },
    { ...aftermath.run, attempt: -1 },
    { ...aftermath.run, defeats: 8 },
  ]) assert.throws(() => rules.validateRun(corrupt));
  const saved = stored; stored = '{broken';
  await assert.rejects(adapter.read(), /preserved/); assert.equal(stored, '{broken'); stored = saved;
  console.log('PASS: ordered objectives, cue ownership, idempotency, failed/stale saves, reload, real preparation, defeat/retry, aftermath, completion, replay and invalid saves.');
})().catch(error => { console.error(error); process.exitCode = 1; });
