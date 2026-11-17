const assert = require('node:assert/strict');
require('node:module').registerHooks({ resolve(s, c, next) {
  if (s === 'playcanvas') return next('./build/playcanvas/src/index.js', { ...c, parentURL: new URL('../node_modules/playcanvas/package.json', require('node:url').pathToFileURL(__filename)).href });
  return next(s, c);
} });
const { Entity, Quat } = require('../node_modules/playcanvas/build/playcanvas/src/index.js');
const { createAudiencePerformance, speakingGestureTime, reactionNod } = require('../src/world/audience-performance.ts');
const model = new Entity('Test actor'), head = new Entity('Head'), chest = new Entity('spine_03');
model.addChild(chest); chest.addChild(head);
head.setLocalEulerAngles(-15, 2, 1); chest.setLocalEulerAngles(-7, -1, 0);
const original = [head.getLocalRotation().clone(), chest.getLocalRotation().clone()];
const performance = createAudiencePerformance({ model });
for (let i = 0; i < 500; i++) {
  performance.apply(i / 30, true, reactionNod(i / 30, 5, 2), 1.6);
  assert(head.getLocalRotation().toArray().every(Number.isFinite));
  performance.restore();
  [head, chest].forEach((joint, n) => joint.getLocalRotation().toArray().forEach((v, c) => assert(Math.abs(v - original[n].toArray()[c]) < 1e-10, 'Additive offsets must not accumulate or survive restore')));
}
const duration = 4.4166666667;
assert(Math.abs(speakingGestureTime(duration - .00001, duration) - speakingGestureTime(duration + .00001, duration)) < .00001, 'Gesture return must not jump at the clip endpoint');
assert(speakingGestureTime(duration + 1, duration) < duration, 'Long speech must continue moving rather than hold the endpoint');
assert.equal(reactionNod(100, 5, 2), 0, 'Reactions stop outside their authored beat');
assert.throws(() => createAudiencePerformance({ model: new Entity('Incomplete rig') }), /reaction joint/);
void Quat;
console.log('PASS 500 additive-pose restore cycles, finite joints, gesture continuity, continued long-line motion and explicit missing-rig failure.');
