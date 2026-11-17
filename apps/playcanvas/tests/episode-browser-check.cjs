const { chromium } = require(process.argv[2]);
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const origin = 'http://127.0.0.1:4182';
const out = path.resolve('docs/implementation/evidence/m2-2026-11-11'); fs.mkdirSync(out, { recursive: true });
const key = 'bible-comic.episode.local.v1';
const snapshot = page => page.evaluate(key => JSON.parse(localStorage.getItem(key)).current, key);
const state = page => page.locator('canvas').evaluate(el => JSON.parse(el.dataset.episode || el.dataset.cinematic || el.dataset.movement));
async function waitGoal(page, id) { await page.waitForFunction(([key,id]) => JSON.parse(localStorage.getItem(key)).current.completed.length === id, [key,id], { timeout: 60000 }); }
async function enter(page) { await page.locator('#enter').waitFor({ state: 'visible', timeout: 60000 }); await page.locator('#enter').click(); await page.locator('#entry').waitFor({ state: 'hidden' }); }
async function moveNear(page, target, radius = 1.35) {
  const end = Date.now() + 20000;
  let held = [];
  while (Date.now() < end) {
    const sample = await state(page), at = sample.position;
    const dx = target.x - at.x, dz = target.z - at.z;
    if (Math.hypot(dx, dz) < radius) break;
    const desired = [];
    if (Math.abs(dx) > .18) desired.push(dx > 0 ? 'KeyD' : 'KeyA');
    if (Math.abs(dz) > .18) desired.push(dz > 0 ? 'KeyS' : 'KeyW');
    for (const code of held.filter(code => !desired.includes(code))) await page.keyboard.up(code);
    for (const code of desired.filter(code => !held.includes(code))) await page.keyboard.down(code);
    held = desired; await page.waitForTimeout(100);
  }
  for (const code of held) await page.keyboard.up(code);
  await page.waitForTimeout(200);
}
async function aim(page, dest, battle = false) {
  const sample = await state(page), b = battle ? sample.battle : sample;
  const box = await page.locator('canvas').boundingBox();
  await page.mouse.move(box.x + box.width * .5, box.y + box.height * .5);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * (.5 + dest[0] - b.aimX), box.y + box.height * (.5 + dest[1] - b.aimY));
  await page.mouse.up();
}

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  await context.addInitScript(() => {
    globalThis[Symbol.for('playcanvas.inspector')] = { register(app) { window.__episodeApp = app; } };
    const set = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key, value) { if (key === 'bible-comic.episode.local.v1' && window.__failSaves) throw new Error('Test: storage unavailable'); return set.call(this, key, value); };
  });
  const page = await context.newPage(); const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(origin + '/episode.html?inspect=1'); await enter(page);
  console.log('Episode loaded', await state(page));
  await page.screenshot({ path: path.join(out, '01-valley-entry.png') });
  await moveNear(page, (await state(page)).target);
  await page.locator('#interact').click(); await page.waitForTimeout(700);
  await page.locator('#pause').click(); const frozen = (await state(page)).cue;
  await page.waitForTimeout(400); assert.equal((await state(page)).cue, frozen);
  await page.locator('#pause').click(); await page.locator('#reset').click();
  await page.waitForTimeout(5200); assert.equal((await snapshot(page)).completed.length, 0, 'Cancelled cue cannot grant credit');
  await moveNear(page, (await state(page)).target); await page.locator('#interact').click(); await waitGoal(page, 1);
  await page.reload(); await enter(page); assert.equal((await snapshot(page)).completed.length, 1, 'Reload retains named checkpoint');
  for (const count of [2, 3, 4, 5]) {
    await moveNear(page, (await state(page)).target);
    if (count === 2) await page.evaluate(() => { window.__failSaves = true; });
    await page.locator('#interact').click();
    if (count === 2) {
      await page.locator('#save-error').waitFor({ state: 'visible' });
      assert.equal((await snapshot(page)).completed.length, 1);
      await page.screenshot({ path: path.join(out, '02-recoverable-save-error.png') });
      await page.evaluate(() => { window.__failSaves = false; }); await page.locator('#retry-save').click();
    }
    await waitGoal(page, count); console.log('Objective count', count);
  }
  await page.waitForURL('**/saul.html?episode=1&inspect=1'); await enter(page);
  await moveNear(page, { x: .7, z: -1.2 }, 2.25); await page.locator('#speak').click();
  await waitGoal(page, 6); console.log('Saul complete');
  await moveNear(page, { x: 2.35, z: .05 }); await page.locator('#speak').click(); await waitGoal(page, 7);
  await page.locator('#speak').click(); await waitGoal(page, 8);
  await page.waitForURL('**/episode.html?inspect=1'); await enter(page);
  await moveNear(page, (await state(page)).target); await page.locator('#interact').click(); await waitGoal(page, 9);
  await page.reload(); await enter(page);
  assert.equal((await snapshot(page)).completed.includes('stones.gathered'), true);
  await moveNear(page, (await state(page)).target); await page.locator('#interact').click();
  await aim(page, [.88, .3]); await page.locator('#throw').click();
  await page.waitForFunction(() => JSON.parse(document.querySelector('canvas').dataset.episode).practiceMisses === 1);
  assert.equal((await snapshot(page)).status, 'active');
  await aim(page, (await state(page)).targetScreen); await page.locator('#throw').click(); await waitGoal(page, 10);
  await page.waitForURL('**/elah.html?episode=1&inspect=1'); await enter(page);
  const preparation = (await state(page)).battle.preparation;
  assert.equal(preparation.stonesGathered, 5); assert.equal(preparation.armourDeclined, true);
  await page.keyboard.down('KeyW');
  await page.waitForFunction(() => JSON.parse(document.querySelector('canvas').dataset.movement).battle.phase === 'challenge', undefined, { timeout: 25000 });
  await page.keyboard.up('KeyW');
  await page.waitForFunction(() => JSON.parse(document.querySelector('canvas').dataset.movement).battle.phase === 'fight');
  await aim(page, [.88, .3], true); await page.keyboard.press('Space');
  await page.waitForFunction(() => JSON.parse(document.querySelector('canvas').dataset.movement).battle.misses === 1);
  assert.equal((await snapshot(page)).status, 'active');
  await page.waitForFunction(key => JSON.parse(localStorage.getItem(key)).current.status === 'defeated', key, { timeout: 25000 });
  await page.screenshot({ path: path.join(out, '03-defeat-with-preparation.png') });
  await page.reload(); await enter(page);
  await page.getByRole('button', { name: 'Retry Battle', exact: true }).click();
  await page.waitForFunction(() => JSON.parse(document.querySelector('canvas').dataset.movement).battle.phase === 'approach');
  assert.equal((await snapshot(page)).attempt, 2); assert.equal((await snapshot(page)).completed.length, 10);
  await page.keyboard.down('KeyW');
  await page.waitForFunction(() => JSON.parse(document.querySelector('canvas').dataset.movement).battle.phase === 'challenge', undefined, { timeout: 25000 });
  await page.keyboard.up('KeyW');
  await page.waitForFunction(() => JSON.parse(document.querySelector('canvas').dataset.movement).battle.phase === 'fight');
  const head = await page.evaluate(() => {
    const canvas = document.querySelector('canvas'), app = window.__episodeApp;
    const target = app.root.findByName('Goliath forehead').getPosition();
    const screen = app.root.findByName('Follow camera').camera.worldToScreen(target);
    return [screen.x / canvas.clientWidth, screen.y / canvas.clientHeight];
  });
  await aim(page, head, true); await page.keyboard.press('Space'); await waitGoal(page, 11);
  await page.reload(); await enter(page); await waitGoal(page, 12);
  await page.waitForURL('**/episode.html?inspect=1'); await page.locator('#results').waitFor({ state: 'visible' });
  assert.equal((await snapshot(page)).status, 'completed');
  await page.screenshot({ path: path.join(out, '04-episode-complete.png') });
  const oldId = (await snapshot(page)).runId;
  await page.locator('#replay').click(); await page.locator('#enter').waitFor({ state: 'visible' });
  assert.notEqual((await snapshot(page)).runId, oldId);
  assert.equal(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).history.length, key), 1);
  assert.deepEqual(errors, []);
  fs.writeFileSync(path.join(out, 'browser-results.json'), JSON.stringify({ status: 'PASS', browser: browser.version(), preparation, errors, journey: '12 earned objectives through six chapters, miss, defeat, reload, retry, aftermath reload, completion and replay' }, null, 2));
  await browser.close(); console.log('PASS connected episode journey');
})().catch(error => { console.error(error); process.exit(1); });
