const { chromium } = require(process.argv[2]);
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { freshRun, objectives, reduceEpisode } = require('../src/gameplay/episode-rules.ts');
const out = path.resolve('docs/implementation/evidence/m2-2026-11-11');
const origin = 'http://127.0.0.1:4182';
const key = 'bible-comic.episode.local.v1';
const state = page => page.locator('canvas').evaluate(el => JSON.parse(el.dataset.episode || el.dataset.cinematic));
const fixture = count => objectives.slice(0, count).reduce((run, item) => reduceEpisode(run, { type: 'objective', id: item.id }), freshRun());

(async () => {
  const browser = await chromium.launch({ channel: 'chrome' });
  const errors = [], layouts = [];
  for (const [name, width, height] of (process.argv.includes('--recovery-only') ? [] : [['portrait', 390, 844], ['landscape', 844, 390]])) {
    const context = await browser.newContext({ viewport: { width, height }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
    const page = await context.newPage(); page.on('pageerror', error => errors.push(error.message));
    await page.goto(origin + '/elah.html?episode=1&inspect=1');
    await page.waitForURL('**/episode.html?inspect=1');
    await page.locator('#enter').waitFor({ state: 'visible', timeout: 60000 });
    assert.equal((await state(page)).run.completed.length, 0, 'Direct battle URL cannot grant preparations');
    await page.locator('#enter').click(); await page.locator('#entry').waitFor({ state: 'hidden' });
    await page.locator('#move-pad').waitFor({ state: 'visible' });
    const pad = await page.locator('#move-pad').boundingBox();
    const cdp = await context.newCDPSession(page);
    const x = pad.x + pad.width / 2, y = pad.y + pad.height / 2;
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y - 32 }] });
    await page.waitForTimeout(1300);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await page.locator('#interact').waitFor({ state: 'visible' });
    await page.locator('#interact').click(); await page.waitForTimeout(400);
    await page.locator('#pause').click(); await page.waitForTimeout(100);
    const held = (await state(page)).cue;
    await page.waitForTimeout(400); assert.equal((await state(page)).cue, held);
    await page.screenshot({ path: path.join(out, `05-${name}-opening.png`) });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    for (const id of ['pause', 'reset']) assert.ok((await page.locator('#' + id).boundingBox()).height >= 48);
    await page.locator('#pause').click();
    await page.waitForFunction(() => JSON.parse(document.querySelector('canvas').dataset.episode).run.completed.length === 1);
    // A valid preparation checkpoint fixture isolates the new armour layout from the full desktop journey.
    await page.evaluate(([key, run]) => localStorage.setItem(key, JSON.stringify({ current: run, history: [] })), [key, fixture(6)]);
    await page.goto(origin + '/saul.html?episode=1&inspect=1');
    await page.locator('#enter').waitFor({ state: 'visible', timeout: 60000 }); await page.locator('#enter').click();
    await page.locator('#entry').waitFor({ state: 'hidden' });
    await page.screenshot({ path: path.join(out, `06-${name}-saul-resume.png`) });
    assert.equal((await state(page)).episode.completed.length, 6);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    layouts.push({ name, width, height, opening: 'touch movement, cue, pause/resume, checkpoint', saul: 'valid local checkpoint fixture and layout' });
    await context.close();
  }
  // Corrupt data is preserved and receives an explicit recovery message.
  const context = await browser.newContext(); const page = await context.newPage();
  // Use distinct URLs so Back has an actual prior game entry rather than about:blank.
  await page.goto(origin + '/episode.html?checkpoint-review=1');
  await page.evaluate(([key, run]) => localStorage.setItem(key, JSON.stringify({ current: run, history: [] })), [key, fixture(12)]);
  await page.reload(); await page.locator('#results').waitFor({ state: 'visible' });
  await page.locator('#replay').click(); await page.locator('#enter').waitFor({ state: 'visible', timeout: 60000 });
  const replayId = await page.evaluate(key => JSON.parse(localStorage.getItem(key)).current.runId, key);
  await page.goBack(); assert.match(page.url(), /checkpoint-review=1/);
  await page.locator('#enter').waitFor({ state: 'visible', timeout: 15000 }).catch(async error => {
    console.log('Back content:', await page.locator('body').innerText()); throw error;
  });
  assert.equal(await page.locator('#results').isHidden(), true, 'Back does not revive a completed previous run');
  assert.equal(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).current.runId, key), replayId);
  await page.evaluate(key => localStorage.setItem(key, '{invalid'), key);
  await page.reload(); await page.locator('#retry').waitFor({ state: 'visible' });
  assert.match(await page.locator('#entry-message').textContent(), /unreadable|preserved/);
  assert.equal(await page.evaluate(key => localStorage.getItem(key), key), '{invalid');
  await context.close();
  assert.deepEqual(errors, []);
  if (!process.argv.includes('--recovery-only')) fs.writeFileSync(path.join(out, 'touch-results.json'), JSON.stringify({ status: 'PASS', browser: browser.version(), layouts, errors, corruptSave: 'preserved with recovery message', backNavigation: 'latest replay checkpoint restored' }, null, 2));
  await browser.close(); console.log(process.argv.includes('--recovery-only')
    ? 'PASS Back restores the latest replay checkpoint; corrupt save is preserved with recovery feedback'
    : 'PASS portrait/landscape opening, Saul resume layout, direct-route guards, Back and corrupt-save recovery');
})().catch(error => { console.error(error); process.exit(1); });
