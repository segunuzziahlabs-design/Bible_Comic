// Run against a production preview: node tests/cue-check.cjs <origin> <playwright-module> <output-dir>
const assert = require('node:assert/strict');
const { mkdir, writeFile } = require('node:fs/promises');
const path = require('node:path');
const [url = 'http://127.0.0.1:4176/', playwright = 'playwright', output = '../../build/pc03-evidence'] = process.argv.slice(2);
const { chromium } = require(playwright);

const stage = page => page.locator('canvas');
const caption = page => page.locator('#cue-caption');
const button = (page, name) => page.getByRole('button', { name, exact: true });
const sample = page => stage(page).evaluate(canvas => JSON.parse(canvas.dataset.movement));

async function waitFor(page, ...conditions) {
  await page.waitForFunction(rules => {
    const state = JSON.parse(document.querySelector('canvas').dataset.movement);
    return rules.every(([key, test, value]) => {
      if (test === '<') return state[key] < value;
      if (test === '>') return state[key] > value;
      return state[key] === value;
    });
  }, conditions, { timeout: 7000 });
  return sample(page);
}

async function screenshot(page, label) {
  await page.screenshot({ path: path.join(output, label + '.png'), scale: 'css' });
}

async function checkDesktop(page) {
  const inspect = button(page, 'Inspect marker');
  await page.keyboard.press('e');
  assert.equal((await sample(page)).startedCues, 0);
  assert(!await inspect.isVisible(), 'A distant marker has no prompt');

  await page.keyboard.down('d');
  await waitFor(page, ['x', '>', 1.4]);
  await page.keyboard.up('d');
  await waitFor(page, ['speed', '<', .02]);
  await page.keyboard.down('w');
  const blocked = await waitFor(page, ['z', '<', .53], ['speed', '<', .02]);
  await page.keyboard.up('w');
  assert(Math.hypot(blocked.x - 1.04, blocked.z + 1.46) < 2.1, 'David is in range across the wall');
  assert(!await inspect.isVisible(), 'The wall hides the prompt');
  await page.keyboard.press('e');
  assert.equal((await sample(page)).startedCues, 0);

  await button(page, 'Restart').click();
  await page.keyboard.down('ArrowUp');
  await waitFor(page, ['z', '<', -.9]);
  await page.keyboard.up('ArrowUp');
  const ready = await waitFor(page, ['canInteract', '=', true], ['speed', '<', .02]);
  await inspect.waitFor();
  await screenshot(page, 'desktop-prompt');
  await page.keyboard.press('e');
  const started = await waitFor(page, ['cueId', '=', 1], ['animation', '=', 'Inspect']);
  assert(Math.hypot(started.eyeX - ready.eyeX, started.eyeZ - ready.eyeZ) > 1, 'The cue takes the camera');
  assert(!await inspect.isVisible());
  await page.keyboard.press('e');
  await page.keyboard.press('e');
  await page.keyboard.down('w');
  await waitFor(page, ['cueElapsed', '>', .25]);
  await page.keyboard.press('Escape');
  const paused = await waitFor(page, ['paused', '=', true]);
  const pose = await stage(page).screenshot();
  await page.waitForTimeout(2600);
  assert.deepEqual(await sample(page), paused, 'The cue clock, camera and position stay paused');
  assert((await stage(page).screenshot()).equals(pose), 'The rendered paused frame stays fixed');
  assert.equal(paused.startedCues, 1);

  await button(page, 'Resume').click();
  const resumed = await waitFor(page, ['cueId', '=', 1], ['cueElapsed', '>', paused.cueElapsed + .2]);
  assert(resumed.phase > paused.phase, 'Resume advances the same animation');
  await page.getByText('The path continues beyond the courtyard.').waitFor();
  await screenshot(page, 'desktop-cue');
  const finished = await waitFor(page, ['completedCueId', '=', 1], ['cueId', '=', 0], ['animation', '=', 'Locomotion']);
  assert.equal(finished.startedCues, 1);
  assert.equal(finished.x, started.x);
  assert.equal(finished.z, started.z);
  assert(finished.eyeZ > finished.z + 1, 'The follow camera is restored');
  assert(!await caption(page).isVisible());
  await page.waitForTimeout(180);
  assert.equal((await sample(page)).z, finished.z, 'Movement held during the cue is cleared');
  await page.keyboard.up('w');
  await page.keyboard.down('d');
  await waitFor(page, ['x', '>', finished.x + .18]);
  const markerContact = await waitFor(page, ['x', '>', .47], ['speed', '<', .02]);
  assert(markerContact.x <= .485, 'David stops before the marker base');
  await page.keyboard.up('d');

  await inspect.click();
  await waitFor(page, ['cueId', '=', 2], ['cueElapsed', '>', .2]);
  await button(page, 'Pause').click();
  await button(page, 'Restart').click();
  const restarted = await waitFor(page, ['paused', '=', false], ['cueId', '=', 0], ['animation', '=', 'Locomotion']);
  assert.equal(restarted.x, 0);
  assert.equal(restarted.z, 3.6);
  assert.equal(restarted.yaw, 0);
  assert(Math.hypot(restarted.eyeX - ready.eyeX, restarted.eyeZ - ready.eyeZ) > 1);
  assert(!await caption(page).isVisible() && !await inspect.isVisible());
  await page.waitForTimeout(2500);
  assert.equal((await sample(page)).completedCueId, 0, 'Restart discards the old completion');
  await page.keyboard.down('w');
  await waitFor(page, ['z', '<', 3.35]);
  await page.keyboard.up('w');
  return { blocked, started, paused, resumed, finished, markerContact, restarted };
}

async function approachWithTouch(context, page) {
  const pad = await page.locator('#move-pad').boundingBox();
  assert(pad, 'The touch stick is available');
  const session = await context.newCDPSession(page);
  const start = { id: 0, x: pad.x + pad.width / 2, y: pad.y + pad.height / 2 };
  try {
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [start] });
    await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ ...start, y: start.y - 42 }] });
    await waitFor(page, ['z', '<', -.9]);
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await waitFor(page, ['canInteract', '=', true], ['speed', '<', .02]);
  } finally {
    await session.detach();
  }
}

async function checkTouch(context, page, width, height, rotate) {
  await page.setViewportSize({ width, height });
  await button(page, 'Restart').tap();
  await approachWithTouch(context, page);
  const prompt = button(page, 'Inspect marker');
  const bounds = await prompt.boundingBox();
  assert(bounds && bounds.height >= 48);
  assert(bounds.x >= 0 && bounds.x + bounds.width <= width && bounds.y + bounds.height <= height);
  await prompt.tap();
  const cue = await waitFor(page, ['cueId', '>', 0], ['cueElapsed', '>', .25]);
  assert(!await page.locator('#move-pad').isVisible());
  await screenshot(page, `cue-${width}x${height}`);
  await button(page, 'Pause').tap();
  const paused = await waitFor(page, ['paused', '=', true]);
  if (rotate) await page.setViewportSize({ width: 568, height: 320 });
  await page.waitForTimeout(240);
  assert.equal((await sample(page)).cueElapsed, paused.cueElapsed);
  assert(await caption(page).isVisible());
  await button(page, 'Resume').tap();
  await waitFor(page, ['completedCueId', '=', cue.cueId], ['cueId', '=', 0]);
  assert(await page.locator('#move-pad').isVisible(), 'Touch movement returns on completion');
  await prompt.tap();
  await waitFor(page, ['cueId', '>', cue.cueId]);
  await button(page, 'Restart').tap();
  await waitFor(page, ['z', '=', 3.6], ['cueId', '=', 0], ['paused', '=', false]);
  assert(!await caption(page).isVisible());
  const layout = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth,
    height: document.documentElement.scrollHeight,
    innerWidth, innerHeight,
  }));
  assert(layout.width <= layout.innerWidth && layout.height <= layout.innerHeight, JSON.stringify(layout));
  return { width, height, rotatedWhilePaused: rotate, completedCueId: cue.cueId, restart: 'passed' };
}

async function main() {
  await mkdir(output, { recursive: true });
  const browser = await chromium.launch({ channel: 'chrome' });
  const report = { browser: browser.version(), origin: new URL(url).origin, touch: [] };
  const errors = [];
  async function open(context, touch = false) {
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.goto(new URL('movement.html?inspect=1', url).href);
    const enter = button(page, 'Enter courtyard');
    if (touch) await enter.tap();
    else await enter.click();
    assert.equal(await stage(page).getAttribute('data-renderer'), 'webgl2');
    return page;
  }
  try {
    const desktop = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    report.desktop = await checkDesktop(await open(desktop));
    await desktop.close();
    const touch = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 });
    const page = await open(touch, true);
    for (const [width, height, rotate] of [[390, 844, true], [568, 320, false], [320, 568, false]]) {
      report.touch.push(await checkTouch(touch, page, width, height, rotate));
    }
    assert.deepEqual(errors, []);
    report.errors = errors;
    await writeFile(path.join(output, 'results.json'), JSON.stringify(report, null, 2) + '\n');
    console.log('Cue guards, one start per interaction, pause, resume, restart and returned control passed on desktop and touch.');
  } finally {
    await browser.close();
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
