// Run against the production preview: node tests/movement-check.cjs <origin> <playwright-module> <output-dir>
const assert = require('node:assert/strict');
const { mkdir, writeFile } = require('node:fs/promises');
const path = require('node:path');
const [url = 'http://127.0.0.1:4175/', playwright = 'playwright', output = '../../build/pc02-evidence'] = process.argv.slice(2);
const { chromium } = require(playwright);

const stage = page => page.locator('canvas');
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
  }, conditions, { timeout: 6500 });
  return sample(page);
}

async function screenshot(page, label) {
  await page.screenshot({ path: path.join(output, label + '.png'), scale: 'css' });
}

async function checkDesktop(page) {
  const start = await sample(page);
  await page.keyboard.down('w');
  const walking = await waitFor(page, ['z', '<', start.z - .4], ['walkWeight', '>', .85]);
  await waitFor(page, ['phase', '>', walking.phase + .05]);
  await page.keyboard.up('w');
  await waitFor(page, ['speed', '<', .02], ['walkWeight', '<', .1]);
  assert.equal(walking.animation, 'Locomotion');

  await button(page, 'Restart').click();
  await page.keyboard.down('ArrowUp');
  const passage = await waitFor(page, ['z', '<', -.85]);
  assert(Math.abs(passage.x) < .01);
  await page.keyboard.up('ArrowUp');
  await waitFor(page, ['speed', '<', .02]);
  await screenshot(page, 'desktop-passage');

  await button(page, 'Restart').click();
  await page.keyboard.down('ArrowRight');
  await waitFor(page, ['x', '>', 1.8]);
  await page.keyboard.up('ArrowRight');
  await waitFor(page, ['speed', '<', .02]);
  await page.keyboard.down('ArrowUp');
  const contact = await waitFor(page, ['z', '<', .53], ['speed', '<', .02], ['walkWeight', '<', .1]);
  assert(contact.z >= .52, 'David stops outside the wall');
  await page.keyboard.down('ArrowRight');
  const sliding = await waitFor(page, ['x', '>', contact.x + .65]);
  assert(sliding.z >= .52 && sliding.z < .54, 'David slides along the wall face');
  await page.keyboard.up('ArrowUp');
  await page.keyboard.up('ArrowRight');
  await waitFor(page, ['speed', '<', .02]);

  const view = await stage(page).boundingBox();
  const y = view.y + view.height * .4;
  const x = view.x + view.width * .2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 393, y, { steps: 12 });
  await page.mouse.up();
  const nearWall = await waitFor(page, ['arm', '<', .5]);
  assert(nearWall.eyeZ >= .4 && nearWall.arm <= nearWall.allowedArm + .0001, 'Camera stays outside the wall');
  await screenshot(page, 'desktop-camera-clearance');
  await page.mouse.move(x + 393, y);
  await page.mouse.down();
  await page.mouse.move(x, y, { steps: 12 });
  await page.mouse.up();
  const clearWall = await waitFor(page, ['arm', '>', 3.3]);
  assert(clearWall.arm > nearWall.arm + 2);

  await button(page, 'Restart').click();
  await page.keyboard.down('a');
  await waitFor(page, ['x', '<', -3.3]);
  await page.keyboard.up('a');
  await waitFor(page, ['speed', '<', .02]);
  await page.keyboard.down('w');
  await waitFor(page, ['z', '<', .53], ['speed', '<', .02]);
  await page.keyboard.down('a');
  const corner = await waitFor(page, ['x', '<', -3.61], ['speed', '<', .02]);
  assert(corner.x >= -3.62 && corner.z >= .52, 'Both faces of the corner block movement');
  await page.keyboard.up('w');
  await page.keyboard.up('a');
  await page.keyboard.down('d');
  await waitFor(page, ['x', '>', -3.1]);
  await page.keyboard.up('d');

  await button(page, 'Restart').click();
  await page.keyboard.down('w');
  await waitFor(page, ['z', '<', 3.3]);
  await page.keyboard.press('Escape');
  const paused = await waitFor(page, ['paused', '=', true]);
  await page.waitForTimeout(180);
  assert.deepEqual(await sample(page), paused, 'Pause freezes position and pose');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(220);
  assert.equal((await sample(page)).z, paused.z, 'Held key is cleared by pause');
  await page.keyboard.up('w');
  await page.keyboard.down('w');
  await waitFor(page, ['speed', '>', .6]);
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await waitFor(page, ['speed', '<', .02], ['walkWeight', '<', .1]);
  await page.keyboard.up('w');

  return { start, walking, passage, contact, sliding, nearWall, clearWall, corner, pauseAndBlur: 'passed' };
}

async function checkTouch(context, page, width, height) {
  await button(page, 'Restart').click();
  const stick = await page.locator('#move-pad').boundingBox();
  const view = await stage(page).boundingBox();
  assert(stick && view, 'Touch controls are visible');
  const layout = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    scrollHeight: document.documentElement.scrollHeight,
    buttonHeight: Math.min(...[...document.querySelectorAll('footer button')].map(b => b.offsetHeight)),
  }));
  assert(layout.scrollWidth <= width && layout.scrollHeight <= height, JSON.stringify(layout));
  assert(layout.buttonHeight >= 48);
  const cdp = await context.newCDPSession(page);
  const send = (type, touchPoints) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints });
  const move = { id: 0, x: stick.x + stick.width / 2, y: stick.y + stick.height / 2 };
  const look = { id: 1, x: view.x + view.width * .65, y: view.y + view.height * .35 };
  await send('touchStart', [move, look]);
  await send('touchMove', [{ ...move, y: move.y - 40 }, { ...look, x: look.x + 51 }]);
  const simultaneous = await waitFor(page, ['z', '<', 3.26], ['yaw', '<', -.3], ['walkWeight', '>', .75]);
  assert(simultaneous.x > .08, 'Touch movement is relative to the adjusted camera');
  await send('touchCancel', []);
  const stopped = await waitFor(page, ['speed', '<', .02], ['walkWeight', '<', .1]);
  await page.waitForTimeout(150);
  assert.equal((await sample(page)).z, stopped.z);
  await screenshot(page, `touch-${width}x${height}`);

  await button(page, 'Restart').click();
  await send('touchStart', [move]);
  await send('touchMove', [{ ...move, y: move.y - 42 }]);
  const passage = await waitFor(page, ['z', '<', -.75]);
  await send('touchEnd', []);
  assert(Math.abs(passage.x) < .02);
  await waitFor(page, ['speed', '<', .02]);
  await cdp.detach();
  return { width, height, ...layout, simultaneous, stopped, passage };
}

async function checkRotation(context, page) {
  await button(page, 'Restart').click();
  const stick = await page.locator('#move-pad').boundingBox();
  const cdp = await context.newCDPSession(page);
  const point = { id: 0, x: stick.x + stick.width / 2, y: stick.y + stick.height / 2 };
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ ...point, y: point.y - 40 }] });
  await waitFor(page, ['speed', '>', .6]);
  await page.setViewportSize({ width: 568, height: 320 });
  const stopped = await waitFor(page, ['speed', '<', .02]);
  await page.waitForTimeout(170);
  assert.equal((await sample(page)).z, stopped.z, 'Rotation clears held touch movement');
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await cdp.detach();
}

async function main() {
  await mkdir(output, { recursive: true });
  const browser = await chromium.launch({ channel: 'chrome' });
  const report = { browser: browser.version(), origin: new URL(url).origin, touch: [] };
  const errors = [];
  async function start(context, viaPreview = false) {
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    if (viaPreview) {
      await page.goto(url);
      await page.getByRole('link', { name: 'Movement' }).click();
      assert(new URL(page.url()).pathname.endsWith('/movement.html'));
    }
    await page.goto(new URL('movement.html?inspect=1', url).href);
    await button(page, 'Enter courtyard').click();
    assert.equal(await stage(page).getAttribute('data-renderer'), 'webgl2');
    await waitFor(page, ['animation', '=', 'Locomotion']);
    return page;
  }
  try {
    const desktop = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    report.desktop = await checkDesktop(await start(desktop, true));
    await desktop.close();
    const touch = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 });
    const page = await start(touch);
    report.touch.push(await checkTouch(touch, page, 390, 844));
    await checkRotation(touch, page);
    report.rotation = 'Held input cleared during portrait-to-landscape resize';
    report.touch.push(await checkTouch(touch, page, 568, 320));
    await page.setViewportSize({ width: 320, height: 568 });
    report.touch.push(await checkTouch(touch, page, 320, 568));
    assert.deepEqual(errors, []);
    report.errors = errors;
    await writeFile(path.join(output, 'results.json'), JSON.stringify(report, null, 2) + '\n');
    console.log('Desktop movement, wall sliding, camera clearance and touch at all three sizes passed.');
  } finally {
    await browser.close();
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
