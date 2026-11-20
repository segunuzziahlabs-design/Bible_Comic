const assert = require('node:assert/strict');
const { smoothStoryHeading, dialogueGestureTime, storyWalkWeight } = require('../src/gameplay/story-motion.ts');
for (const fps of [20, 30, 60, 120]) {
  let heading = 179;
  const first = smoothStoryHeading(heading, -179, 1 / fps);
  assert(first > heading && first - heading < 2, 'Cross the angle seam by the short path');
  heading = 180;
  for (let i = 0; i < fps * 2; i++) {
    const next = smoothStoryHeading(heading, 0, 1 / fps);
    assert(Math.abs(next - heading) <= 420 / fps + 1e-9, 'Reversal must respect the body turn rate');
    assert(next <= heading && next >= 0, 'No reversal overshoot');
    heading = next;
  }
  assert(heading < .001, 'A reversal must settle without locking movement');
}
for (const [line, clip] of [[9.579, 2.5], [4.843, 3.208333], [5.12, 3.208333]]) {
  let previous = -1;
  for (let i = 0; i < 100; i++) {
    const t = dialogueGestureTime(line * i / 100, line, clip);
    assert(t > previous && t < clip, 'Long lines advance forward throughout, without a held or reversed tail');
    previous = t;
  }
  assert.equal(dialogueGestureTime(line, line, clip), clip);
}
assert.equal(storyWalkWeight(0), 0, 'Blocked movement selects idle');
assert.equal(dialogueGestureTime(.7, 1.4, 4.416667), .7, 'A short reply must not speed up the hands');
assert.equal(storyWalkWeight(.95), 1, 'Normal travel selects the full calibrated stride');
assert(storyWalkWeight(.2) > 0 && storyWalkWeight(.2) < 1, 'Starts and stops blend between idle and walk');
assert.equal(smoothStoryHeading(180, 0, 0), 180, 'Paused time cannot turn the body');
console.log('PASS short-path and bounded turns at 20/30/60/120 Hz, forward long-line timing, blocked idle and start/stop weights.');
