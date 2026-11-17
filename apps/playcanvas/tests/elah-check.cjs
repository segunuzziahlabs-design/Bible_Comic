// Run against a production preview: node tests/elah-check.cjs <origin> <playwright-module> <output-dir>
const assert = require('node:assert/strict');
const { mkdir, writeFile } = require('node:fs/promises');
const path = require('node:path');
const [url = 'http://127.0.0.1:4178/', playwright = 'playwright', output = '../../build/sc01-evidence'] = process.argv.slice(2);
const { chromium } = require(playwright);

const stage = page => page.locator('#stage');
const button = (page, name) => page.getByRole('button', { name, exact: true });
const sample = page => stage(page).evaluate(canvas => JSON.parse(canvas.dataset.movement));

async function waitFor(page, key, op, value) {
  await page.waitForFunction(({ key, op, value }) => {
    const state = JSON.parse(document.querySelector('#stage').dataset.movement);
    return op === '<' ? state[key] < value : state[key] === value;
  }, { key, op, value }, { timeout: 24000 });
  return sample(page);
}

async function capture(page, name) {
  await page.screenshot({ path: path.join(output, name + '.png'), scale: 'css' });
}

async function checkEntry(page) {
  const result = await page.evaluate(() => {
    const { root } = window.__elahTestApp;
    const camera = root.findByName('Follow camera').camera;
    const canvas = document.querySelector('#stage');
    const { width, height } = canvas.getBoundingClientRect();
    const points = {};
    for (const [name, heightOffset] of [
      ['Israelite camp shelter', 1], ['Philistine camp shelter', 1],
      ['Goliath', 2.6], ['Shield-bearer', 1.4],
    ]) {
      const point = root.findByName(name).getPosition().clone();
      point.y += heightOffset;
      const { x, y, z } = camera.worldToScreen(point);
      points[name] = [x / width, y / height, z];
    }
    const anchors = ['battle.entry', 'battle.approach', 'battle.aftermath'].map(name => {
      const { x, y, z } = root.findByName(name).getPosition();
      return { name, x, y, z };
    });
    const fits = document.documentElement.scrollWidth <= innerWidth && document.documentElement.scrollHeight <= innerHeight;
    return { points, anchors, fits };
  });
  assert(result.fits, 'The layout fits the viewport');
  for (const [name, [x, y, z]] of Object.entries(result.points)) {
    assert(x > .04 && x < .96 && y > .04 && y < .96 && z > 0, name + ' in frame: ' + [x, y, z]);
  }
  assert(result.points['Israelite camp shelter'][0] < result.points.Goliath[0]);
  assert(result.points['Philistine camp shelter'][0] > result.points.Goliath[0]);
  return result;
}

async function crossWithTouch(context, page) {
  const pad = await page.locator('#move-pad').boundingBox();
  assert(pad && pad.width >= 48 && pad.height >= 48, 'The touch stick is visible');
  const session = await context.newCDPSession(page);
  const start = { id: 0, x: pad.x + pad.width / 2, y: pad.y + pad.height / 2 };
  try {
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [start] });
    await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ ...start, y: start.y - 42 }] });
    return await waitFor(page, 'battlefieldReached', '=', true);
  } finally {
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await session.detach();
  }
}

async function main() {
  await mkdir(output, { recursive: true });
  const browser = await chromium.launch({ channel: 'chrome' });
  const errors = [];
  const report = { browser: browser.version(), layouts: [], errors };
  try {
    for (const [width, height, touch] of [[1280, 720, false], [390, 844, true], [568, 320, true], [320, 568, true]]) {
      const context = await browser.newContext({
        viewport: { width, height }, hasTouch: touch, isMobile: touch, deviceScaleFactor: touch ? 3 : 1,
      });
      const page = await context.newPage();
      await page.addInitScript(() => {
        globalThis[Symbol.for('playcanvas.inspector')] = { register(app) { window.__elahTestApp = app; } };
      });
      page.on('pageerror', error => errors.push(error.message));
      page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
      await page.goto(new URL('elah.html?inspect=1', url).href);
      const enter = button(page, 'Enter valley');
      if (touch) await enter.tap();
      else await enter.click();
      assert.equal(await stage(page).getAttribute('data-renderer'), 'webgl2');
      await page.getByText('Follow the track across the brook').waitFor();
      const label = width + 'x' + height;
      const entry = await checkEntry(page);
      await capture(page, 'entry-' + label);
      const started = await sample(page);

      let reached;
      if (touch) {
        reached = await crossWithTouch(context, page);
      } else {
        await page.keyboard.down('ArrowUp');
        const brook = await waitFor(page, 'z', '<', -2.5);
        await page.keyboard.press('Escape');
        const paused = await waitFor(page, 'paused', '=', true);
        await page.waitForTimeout(300);
        assert.deepEqual(await sample(page), paused, 'Pause holds David and the follow camera');
        assert(brook.groundY < started.groundY - .5, 'David steps down into the brook');
        await page.keyboard.up('ArrowUp');
        await button(page, 'Resume').click();
        await page.keyboard.down('w');
        reached = await waitFor(page, 'battlefieldReached', '=', true);
        await page.keyboard.up('w');
      }
      await page.getByText(/^Goliath: Come here/).waitFor();
      assert(Math.abs(reached.x) < .1 && reached.z < -5.5);
      assert(reached.groundY < started.groundY - .5 && reached.eyeY > reached.groundY + 1);
      await capture(page, 'approach-' + label);
      const spearTipY = await page.evaluate(() => {
        const { root } = window.__elahTestApp;
        const camera = root.findByName('Follow camera').camera;
        const spear = root.findByName('Spear tip');
        return camera.worldToScreen(spear.getPosition()).y / document.querySelector('#stage').clientHeight;
      });
      assert(spearTipY > .015 && spearTipY < .95, 'Goliath’s spear tip is in frame at the approach: ' + spearTipY);

      if (touch) await button(page, 'Restart').tap();
      else await button(page, 'Restart').click();
      await waitFor(page, 'battlefieldReached', '=', false);
      await page.getByText('Follow the track across the brook').waitFor();
      const restarted = await sample(page);
      assert.deepEqual([restarted.x, restarted.z, restarted.yaw], [started.x, started.z, started.yaw]);
      report.layouts.push({ width, height, touch, entry, started, reached, spearTipY, restarted });
      await context.close();
    }
    assert.deepEqual(errors, []);
    await writeFile(path.join(output, 'results.json'), JSON.stringify(report, null, 2) + '\n');
    console.log('Elah entry framing, brook crossing, approach and restart passed in four Chrome layouts.');
  } finally {
    await browser.close();
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
