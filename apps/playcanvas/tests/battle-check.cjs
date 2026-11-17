// Run against a production preview: node tests/battle-check.cjs <origin> <playwright-module> <output-dir>
const assert = require('node:assert/strict');
const { mkdir, writeFile } = require('node:fs/promises');
const path = require('node:path');
const [url = 'http://127.0.0.1:4180/', playwright = 'playwright', output = '../../build/sc02-evidence'] = process.argv.slice(2);
const { chromium } = require(playwright);

const canvas = page => page.locator('#stage');
const button = (page, name) => page.getByRole('button', { name, exact: true });
const caption = page => page.locator('#battle-caption');
const sample = page => canvas(page).evaluate(el => JSON.parse(el.dataset.movement));
const capture = (page, name) => page.screenshot({ path: path.join(output, name + '.png'), scale: 'css' });

async function joints(page) {
  return page.evaluate(() => {
    const { root } = window.__battleApp;
    const champion = root.findByName('Goliath');
    const vector = entity => [...entity.getPosition().toArray()];
    const david = root.children.find(child => child.anim?.findLayer('Sling'));
    return {
      goliath: champion.anim.baseLayer.activeState,
      spear: vector(champion.findByName('Spear tip')),
      grip: vector(champion.findByName('Spear grip')),
      head: vector(champion.findByName('Goliath forehead')),
      davidHand: vector(david.findByName('hand_r')),
      slingWeight: david.anim.findLayer('Sling').weight,
      pouch: vector(root.findByName('Sling stone')),
      bearer: vector(root.findByName('Shield-bearer')),
      army: [1, 2, 3].map(i => vector(root.findByName('Philistine camp soldier ' + i))),
    };
  });
}

const distance = (a, b) => Math.hypot(...a.map((value, axis) => value - b[axis]));

async function waitFor(page, ...rules) {
  await page.waitForFunction(conditions => {
    const state = JSON.parse(document.querySelector('#stage').dataset.movement);
    return conditions.every(([key, op, value]) => {
      const current = key.split('.').reduce((parent, part) => parent?.[part], state);
      return op === '>' ? current > value : op === '<' ? current < value : current === value;
    });
  }, rules, { timeout: 24000 }).catch(async error => {
    throw new Error('Waiting for ' + JSON.stringify(rules) + '; last sample ' + JSON.stringify(await sample(page)), { cause: error });
  });
  return sample(page);
}

async function touchDrag(session, start, dx, dy, hold = false) {
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ ...start, id: 1 }] });
  await session.send('Input.dispatchTouchEvent', {
    type: 'touchMove', touchPoints: [{ x: start.x + dx, y: start.y + dy, id: 1 }],
  });
  if (!hold) await endTouch(session);
}

function endTouch(session) {
  return session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}

async function walkToChallenge(page, session) {
  if (session) {
    const pad = await page.locator('#move-pad').boundingBox();
    await touchDrag(session, { x: pad.x + pad.width / 2, y: pad.y + pad.height / 2 }, 0, -40, true);
  } else await page.keyboard.down('ArrowUp');
  const challenge = await waitFor(page, ['battle.phase', '=', 'challenge']);
  if (session) await endTouch(session);
  else await page.keyboard.up('ArrowUp');
  assert.match(await caption(page).textContent(), /^Goliath:/);
  assert(!await button(page, 'Throw').isVisible());
  return challenge;
}

async function aim(page, destination, session) {
  const { x, y, width, height } = await canvas(page).boundingBox();
  const { battle } = await sample(page);
  const dx = (destination[0] - battle.aimX) * width;
  const dy = (destination[1] - battle.aimY) * height;
  const start = { x: x + width * .5, y: y + height * .5 };
  if (session) await touchDrag(session, start, dx, dy);
  else {
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(start.x + dx, start.y + dy);
    await page.mouse.up();
  }
}

async function aimAtHead(page, session) {
  const destination = await canvas(page).evaluate(el => {
    const { target } = JSON.parse(el.dataset.movement).battle;
    const camera = window.__battleApp.root.findByName('Follow camera').camera;
    const point = camera.entity.getPosition().clone().set(target.x, target.y, target.z);
    const screen = camera.worldToScreen(point);
    return [screen.x / el.clientWidth, screen.y / el.clientHeight];
  });
  await aim(page, destination, session);
  return waitFor(page, ['battle.aimed', '=', true]);
}

async function checkLayout(page, touch) {
  const fits = await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth &&
    document.documentElement.scrollHeight <= innerHeight);
  assert(fits, 'Battle UI fits inside the viewport');
  const throwBounds = await button(page, 'Throw').boundingBox();
  const stage = await canvas(page).boundingBox();
  assert(throwBounds && throwBounds.height >= 48);
  assert(throwBounds.x >= stage.x && throwBounds.y + throwBounds.height <= stage.y + stage.height);
  if (touch) {
    const pad = await page.locator('#move-pad').boundingBox();
    assert(pad && pad.x + pad.width < throwBounds.x, 'The two touch targets do not overlap');
  }
}

async function desktop(page) {
  const challenge = await walkToChallenge(page);
  await page.keyboard.down('w');
  await page.keyboard.press('Space');
  await page.keyboard.press('Escape');
  const paused = await waitFor(page, ['paused', '=', true]);
  await page.waitForFunction(() => window.__elahAudio.state === 'suspended');
  const heldPose = await joints(page);
  await page.waitForTimeout(400);
  assert.deepEqual(await sample(page), paused, 'Pause freezes the challenge');
  assert.deepEqual(await joints(page), heldPose, 'Pause freezes the sampled joints');
  assert.deepEqual([paused.x, paused.z], [challenge.x, challenge.z], 'David cannot move during the challenge');
  assert.equal(paused.battle.throws, 0);
  await page.keyboard.up('w');
  await button(page, 'Resume').click();
  await page.waitForFunction(() => window.__elahAudio.state === 'running');
  await page.getByText(/^David: You come/).waitFor();
  await capture(page, 'desktop-challenge');
  await waitFor(page, ['battle.phase', '=', 'fight']);
  await checkLayout(page, false);

  await aim(page, [.85, .3]);
  await waitFor(page, ['battle.aimX', '>', .8], ['battle.aimed', '=', false]);
  await page.keyboard.press('Space');
  await page.keyboard.press('Space');
  const flight = await waitFor(page, ['battle.shot.kind', '=', 'flight']);
  assert(await page.evaluate(() => window.__battleApp.root.findByName('Sling stone').enabled));
  await page.keyboard.press('Escape');
  const flightPause = await waitFor(page, ['paused', '=', true], ['battle.shot.kind', '=', 'flight']);
  await page.waitForTimeout(250);
  assert.deepEqual(await sample(page), flightPause, 'Pause freezes the stone in flight');
  await button(page, 'Resume').click();
  const miss = await waitFor(page, ['battle.misses', '=', 1], ['battle.phase', '=', 'fight']);
  assert.equal(miss.battle.attempt, challenge.battle.attempt);
  assert.equal(miss.battle.throws, 1);
  assert.equal(miss.battle.stones, 4);
  await waitFor(page, ['battle.throwTime', '=', undefined]);
  assert(await button(page, 'Throw').isEnabled(), 'David can throw again after a miss and follow-through');

  const warning = await waitFor(page, ['battle.attack', '=', 'windup']);
  await page.getByText('Spear raised! Step sideways out of the lane.').waitFor();
  assert(await page.evaluate(() => window.__battleApp.root.findByName('Spear warning 0').enabled));
  await page.keyboard.down('d');
  await waitFor(page, ['battle.attackTime', '>', .82], ['battle.attack', '=', 'windup']);
  const drawnSpear = await joints(page);
  assert.equal(drawnSpear.goliath, 'goliath_spear');
  await capture(page, 'desktop-telegraph');
  await waitFor(page, ['battle.attack', '=', 'strike']);
  const thrust = await joints(page);
  assert(distance(thrust.spear, drawnSpear.spear) > 1.0, 'The spear tip advances during the active strike');
  assert(Math.abs(thrust.spear[1] - thrust.grip[1]) < .65, 'The active thrust points forward');
  const dodge = await waitFor(page, ['battle.strikes', '=', 1], ['battle.attack', '=', 'recover']);
  await page.keyboard.up('d');
  assert(dodge.x - warning.x > .9 && dodge.battle.phase === 'fight', 'Leaving the lane avoids the strike');

  await waitFor(page, ['battle.strikes', '=', 1], ['battle.attack', '=', 'windup']);
  const defeat = await waitFor(page, ['battle.phase', '=', 'defeat']);
  assert.equal(defeat.battle.reason, 'david_killed_by_goliath');
  assert.equal(defeat.battle.strikes, 2);
  await button(page, 'Retry Battle').waitFor();
  assert.equal(await page.evaluate(() => document.activeElement.id), 'battle-replay');
  await capture(page, 'desktop-defeat');
  await page.keyboard.down('w');
  await button(page, 'Retry Battle').click();
  const retry = await waitFor(page, ['battle.phase', '=', 'approach']);
  await page.waitForTimeout(250);
  await page.keyboard.up('w');
  assert.deepEqual([retry.x, retry.z], [0, 8.5]);
  assert.equal((await sample(page)).z, 8.5, 'A key held during defeat does not move the new attempt');
  assert.equal(retry.battle.attempt, defeat.battle.attempt + 1);
  assert.deepEqual(retry.battle.preparation, defeat.battle.preparation);
  assert.equal(retry.battle.stones, 5);
  assert.equal(retry.battle.anchor, 'battle.entry');
  assert.equal(retry.battle.strikes + retry.battle.throws + retry.battle.misses, 0);
  assert.equal(retry.battle.shot, undefined);
  assert.equal(retry.battle.throwTime, undefined);
  assert.deepEqual(retry.battle.foe, { x: .28, z: -10.5 });
  const resetRig = await joints(page);
  assert.equal(resetRig.goliath, 'goliath_ready');
  assert.equal(resetRig.slingWeight, 0);

  await walkToChallenge(page);
  await waitFor(page, ['battle.phase', '=', 'fight']);
  await page.keyboard.down('i');
  await waitFor(page, ['battle.aimY', '<', .51]);
  await page.keyboard.up('i');
  await aimAtHead(page);
  const idle = await joints(page);
  await page.keyboard.press('Space');
  await waitFor(page, ['battle.throwTime', '>', .28], ['battle.shot.kind', '=', 'windup']);
  const winding = await joints(page);
  assert(winding.slingWeight > .9 && distance(winding.davidHand, idle.davidHand) > .25, 'David draws the sling with his arm');
  assert(distance(winding.davidHand, winding.pouch) < .65, 'The visible pouch stays within cord reach');
  await capture(page, 'desktop-sling');
  const fall = await waitFor(page, ['battle.phase', '=', 'fall'], ['battle.hits', '=', 1]);
  assert.equal(fall.battle.anchor, 'battle.aftermath');
  assert.equal(fall.battle.throws, 1);
  await waitFor(page, ['battle.phase', '=', 'fall'], ['battle.time', '>', .8]);
  await capture(page, 'desktop-impact');
  await waitFor(page, ['battle.phase', '=', 'retreat'], ['battle.time', '>', .8]);
  const fleeing = await joints(page);
  assert.equal(fleeing.goliath, 'goliath_fall');
  assert(fleeing.head[1] < idle.head[1] - 1.5, 'The fall lowers Goliath’s rig to the ground');
  assert(Math.abs(fleeing.spear[1] - fleeing.grip[1]) < .35, 'The spear settles with Goliath');
  assert(distance(fleeing.bearer, resetRig.bearer) > 1, 'The shield-bearer flees after the fall');
  assert(fleeing.army.some((actor, index) => distance(actor, resetRig.army[index]) > .5));
  await page.keyboard.press('Escape');
  const retreatPause = await waitFor(page, ['paused', '=', true]);
  const stopped = await joints(page);
  await page.waitForTimeout(300);
  assert.deepEqual(await sample(page), retreatPause);
  assert.deepEqual(await joints(page), stopped);
  await button(page, 'Resume').click();
  await page.getByText('They turned and fled. David prevailed.').waitFor();
  await capture(page, 'desktop-retreat');
  await button(page, 'Play again').waitFor();
  const victory = await waitFor(page, ['battle.phase', '=', 'victory']);
  assert.equal(victory.battle.hits, 1);
  assert.equal(victory.battle.reason, undefined);
  const audio = await page.evaluate(() => window.__elahAudioSources);
  assert.equal(audio.filter(item => item.loop).length, 2);
  for (const duration of [.18, .3, .37, .62, .75]) {
    assert(audio.some(item => !item.loop && Math.abs(item.duration - duration) < .001 && item.peak > .02));
  }
  await button(page, 'Play again').click();
  const replay = await waitFor(page, ['battle.phase', '=', 'approach']);
  const replayRig = await joints(page);
  assert.deepEqual(replayRig.army, resetRig.army, 'Replay restores the Philistine ranks');
  assert.deepEqual(replayRig.bearer, resetRig.bearer);
  assert.equal(replay.battle.stones, 5);
  return { flight, miss, warning, drawnSpear, thrust, dodge, defeat, retry, winding, fleeing, victory, replay, audio };
}

async function touch(context, page) {
  const session = await context.newCDPSession(page);
  try {
    await walkToChallenge(page, session);
    await waitFor(page, ['battle.phase', '=', 'fight']);
    await checkLayout(page, true);
    await capture(page, 'touch-390x844');
    const sound = button(page, 'Battle sound');
    await sound.tap();
    assert.equal(await sound.getAttribute('aria-pressed'), 'false');
    await page.waitForFunction(() => window.__elahMaster.gain.value < .01);
    await aim(page, [.86, .29], session);
    await waitFor(page, ['battle.aimX', '>', .8], ['battle.aimed', '=', false]);
    await button(page, 'Throw').tap();
    const miss = await waitFor(page, ['battle.misses', '=', 1], ['battle.phase', '=', 'fight']);
    assert.equal(miss.battle.throws, 1);
    await waitFor(page, ['battle.attack', '=', 'windup']);
    const pad = await page.locator('#move-pad').boundingBox();
    await touchDrag(session, { x: pad.x + pad.width / 2, y: pad.y + pad.height / 2 }, 42, 0, true);
    const dodge = await waitFor(page, ['battle.strikes', '=', 1], ['battle.attack', '=', 'recover']);
    await endTouch(session);
    assert(dodge.x - miss.x > .9 && dodge.battle.phase === 'fight');
    await button(page, 'Retry Battle').waitFor();
    const defeat = await sample(page);
    assert.equal(defeat.battle.reason, 'david_killed_by_goliath');
    await button(page, 'Retry Battle').tap();
    const retry = await waitFor(page, ['battle.phase', '=', 'approach']);
    assert.equal(retry.battle.stones, 5);
    assert.equal(retry.battle.attempt, defeat.battle.attempt + 1);
    assert.deepEqual([retry.x, retry.z], [0, 8.5]);

    await walkToChallenge(page, session);
    await waitFor(page, ['battle.phase', '=', 'fight']);
    await page.setViewportSize({ width: 320, height: 568 });
    await checkLayout(page, true);
    await capture(page, 'touch-320x568');
    await page.setViewportSize({ width: 568, height: 320 });
    await checkLayout(page, true);
    await capture(page, 'touch-568x320');
    await aimAtHead(page, session);
    await button(page, 'Throw').tap();
    await waitFor(page, ['battle.phase', '=', 'fall'], ['battle.hits', '=', 1]);
    await waitFor(page, ['battle.phase', '=', 'retreat'], ['battle.time', '>', 1.5]);
    await capture(page, 'touch-retreat-landscape');
    await page.setViewportSize({ width: 390, height: 844 });
    await capture(page, 'touch-retreat-portrait');
    await button(page, 'Play again').waitFor();
    await capture(page, 'touch-victory');
    const victory = await sample(page);
    assert.equal(victory.battle.hits, 1);
    return { miss, dodge, defeat, retry, victory };
  } finally {
    await session.detach();
  }
}

async function main() {
  await mkdir(output, { recursive: true });
  const browser = await chromium.launch({ channel: 'chrome' });
  const errors = [];
  async function open(context, isTouch) {
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.addInitScript(() => {
      globalThis[Symbol.for('playcanvas.inspector')] = { register(app) { window.__battleApp = app; } };
      window.__elahAudioSources = [];
      const BrowserAudioContext = window.AudioContext;
      window.AudioContext = class extends BrowserAudioContext {
        constructor() {
          super();
          window.__elahAudio = this;
        }
        createGain() {
          const node = super.createGain();
          window.__elahMaster ??= node;
          return node;
        }
        createBufferSource() {
          const node = super.createBufferSource();
          const start = node.start.bind(node);
          node.start = (...args) => {
            const values = node.buffer.getChannelData(0);
            let peak = 0;
            for (let i = 0; i < values.length; i += 11) peak = Math.max(peak, Math.abs(values[i]));
            window.__elahAudioSources.push({ duration: node.buffer.duration, loop: node.loop, peak });
            return start(...args);
          };
          return node;
        }
      };
    });
    await page.goto(new URL('elah.html?inspect=1', url).href);
    if (isTouch) await button(page, 'Enter valley').tap();
    else await button(page, 'Enter valley').click();
    assert.equal(await canvas(page).getAttribute('data-renderer'), 'webgl2');
    return page;
  }
  try {
    const desktopContext = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const desktopResult = await desktop(await open(desktopContext, false));
    await desktopContext.close();
    const touchContext = await browser.newContext({
      viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3,
    });
    const touchResult = await touch(touchContext, await open(touchContext, true));
    assert.deepEqual(errors, []);
    await writeFile(path.join(output, 'results.json'), JSON.stringify({
      browser: browser.version(), desktop: desktopResult, touch: touchResult, errors,
    }, null, 2) + '\n');
    console.log('Animated challenge, sling and spear, audio, fall, retreat, defeat and retry passed on desktop and touch.');
  } finally {
    await browser.close();
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
