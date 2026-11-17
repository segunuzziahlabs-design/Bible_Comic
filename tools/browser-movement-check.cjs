// node tools/browser-movement-check.cjs <playwright module path> [local origin]
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.argv[2]);

const origin = process.argv[3] || 'http://127.0.0.1:8063';
const out = path.resolve('build/q03/browser');
const report = { errors: [], desktop: {}, touch: {} };
fs.mkdirSync(out, { recursive: true });
const turnDistance = (a, b) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));

async function load(browser, touch) {
  const context = await browser.newContext({ viewport: touch ? { width: 390, height: 844 } : { width: 1280, height: 720 },
    isMobile: touch, hasTouch: touch, deviceScaleFactor: 1 });
  const page = await context.newPage();
  page.on('console', m => { if (m.type() === 'error') report.errors.push(m.text()); });
  page.on('pageerror', e => report.errors.push(e.message));
  page.on('requestfailed', r => report.errors.push(`${r.url()} ${r.failure()?.errorText}`));
  await page.goto(`${origin}/?diagnostics=1&motion=1`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__bibleProof?.mode === 'welcome' && window.__bibleMotion?.length > 0,
    null, { timeout: 55000 });
  const state = () => page.evaluate(() => window.__bibleProof);
  const count = () => page.evaluate(() => window.__bibleMotion.length);
  const frames = async (start, length) => {
    await page.waitForFunction(n => window.__bibleMotion.length >= n, start + length, { timeout: 12000 });
    return page.evaluate(({ start, length }) => window.__bibleMotion.slice(start, start + length).map(JSON.parse), { start, length });
  };
  const click = async key => {
    const [x, y, width, height] = (await state()).layout[key];
    if (touch) await page.touchscreen.tap(x + width / 2, y + height / 2);
    else await page.mouse.click(x + width / 2, y + height / 2);
  };
  const shot = name => page.screenshot({ path: path.join(out, `${name}.png`) });
  await click('primary');
  await page.waitForFunction(() => window.__bibleProof?.mode === 'game');
  const initial = await state();
  assert.equal(initial.build, 'Q03-village-v1');
  assert.equal(initial.animation.bones, 65);
  assert.equal(initial.animation.clip, 'idle_relaxed');
  return { context, page, state, frames, count, click, shot };
}

function verifyCadence(trace, endSpeed) {
  const settled = trace.slice(-10);
  for (const row of settled) {
    assert(Math.abs(row[4] - endSpeed) < .05, `Expected ${endSpeed} m/s, got ${row[4]}`);
    assert(Math.abs(row[5] * 1.05 - row[4]) < .02, 'Cadence did not match actual horizontal speed');
  }
  assert(settled[0][7] !== settled.at(-1)[7], 'Walk phase did not advance');
  return { speedMps: settled.at(-1)[4], playbackRate: settled.at(-1)[5] };
}

function verifyStop(trace) {
  const settled = trace.slice(-8);
  assert(settled.every(row => row[4] < .01 && row[5] < .01 && row[6] < .01), 'Stop did not settle to idle');
  assert(Math.abs(settled[0][7] - settled.at(-1)[7]) < .001, 'Walk phase advanced at rest');
  return Math.hypot(trace[0][1] - trace.at(-1)[1], trace[0][2] - trace.at(-1)[2]);
}

function verifyTurn(trace, radians) {
  const max = Math.max(...trace.slice(1).map((row, i) => turnDistance(row[3], trace[i][3])));
  const total = turnDistance(trace[0][3], trace.at(-1)[3]);
  assert(max > .02 && max < .18, `Unexpected turn per physics frame ${max}`);
  assert(Math.abs(total - radians) < .21, `Expected turn near ${radians}, got ${total}`);
  return { degrees: total * 180 / Math.PI, maxDegreesPerFrame: max * 180 / Math.PI };
}

async function desktop(browser) {
  const { context, page, state, frames, count, click, shot } = await load(browser, false);
  try {
    await shot('desktop-idle');
    let start = await count();
    await page.keyboard.down('w');
    const walking = await frames(start, 42);
    report.desktop.full = verifyCadence(walking, 1.8);
    assert(walking.some(row => row[6] > .1 && row[6] < .9), 'Start skipped the idle-to-walk blend');
    await shot('desktop-walk');
    start = (await count()) - 1;
    await page.keyboard.up('w');
    await page.keyboard.down('d');
    report.desktop.rightAngle = verifyTurn(await frames(start, 30), Math.PI / 2);
    await shot('desktop-turn');
    start = (await count()) - 1;
    await page.keyboard.up('d');
    await page.keyboard.down('a');
    report.desktop.reversal = verifyTurn(await frames(start, 35), Math.PI);
    start = (await count()) - 1;
    await page.keyboard.up('a');
    report.desktop.releaseTravelM = verifyStop(await frames(start, 30));
    assert(report.desktop.releaseTravelM < .22, 'Release drift was excessive');

    start = await count();
    await page.keyboard.down('s');
    const wall = await frames(start, 260);
    await shot('desktop-wall');
    verifyStop(wall.slice(-35));
    assert(wall.at(-1)[2] > 8.5 && wall.at(-1)[2] < 9.0, 'Did not reach the rear wall');
    await page.keyboard.up('s');
    report.desktop.wallZ = wall.at(-1)[2];
    await click('pause');
    await page.waitForFunction(() => window.__bibleProof?.paused);
    await click('secondary');
    await page.waitForFunction(() => window.__bibleProof?.mode === 'game' && window.__bibleProof?.animation.time === 0);
    assert(Math.abs((await state()).player[2] - 5) < .01, 'Restart did not restore the spawn');
    report.desktop.reset = true;
  } finally {
    await context.close();
  }
}

async function touch(browser) {
  const { context, page, frames, count, shot } = await load(browser, true);
  try {
    const session = await context.newCDPSession(page);
    const finger = { x: 80, y: 756, id: 1 };
    const move = y => session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ ...finger, y }] });
    let start = await count();
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [finger] });
    await move(finger.y - 17);
    report.touch.partial = verifyCadence(await frames(start, 42), 1.8 * 17 / 48);
    await shot('touch-partial-walk');
    start = await count();
    await move(finger.y - 48);
    report.touch.full = verifyCadence(await frames(start, 42), 1.8);
    await shot('touch-full-walk');
    start = (await count()) - 1;
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    report.touch.releaseTravelM = verifyStop(await frames(start, 30));
    assert(report.touch.releaseTravelM < .22, 'Touch release drift was excessive');
  } finally {
    await context.close();
  }
}

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    report.browser = browser.version();
    await desktop(browser);
    await touch(browser);
    assert.deepEqual(report.errors, []);
    report.result = 'passed';
  } finally {
    await browser.close();
  }
})().catch(error => {
  report.result = 'failed';
  report.failure = error.stack;
  process.exitCode = 1;
}).finally(() => {
  fs.writeFileSync(path.join(out, 'movement-review.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report));
});
