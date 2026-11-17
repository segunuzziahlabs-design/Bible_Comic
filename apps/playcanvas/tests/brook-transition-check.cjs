const { chromium } = require(process.argv[2]);
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { createDriver } = require('./ctrl07-browser-driver.cjs');
const origin = process.argv[3], out = path.resolve(process.argv[4]), layout = process.argv[6] || 'desktop';
const sizes={desktop:[1280,720],portrait:[390,844],landscape:[844,390]},[width,height]=sizes[layout],touch=layout!=='desktop';
const source = JSON.parse(fs.readFileSync(process.argv[5]));
const earned = source.events.find(e => e.label === 'CHECKPOINT 7 armour tried').run;
assert.equal(earned.completed.length, 7);
fs.mkdirSync(out, { recursive: true });
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', args: ['--autoplay-policy=user-gesture-required'] });
  const context = await browser.newContext({ viewport: { width, height },hasTouch:touch,isMobile:touch,deviceScaleFactor:1 });
  await context.addInitScript(run => {
    const key = 'bible-comic.episode.local.v1';
    if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify({ current: run, history: [] }));
    window.brookFrames = [];
    globalThis[Symbol.for('playcanvas.inspector')] = { register(app) { app.on('frameend', () => {
      const e = document.querySelector('canvas'); if (!e?.dataset.preparation) return;
      const s = JSON.parse(e.dataset.preparation);
      window.brookFrames.push({ at: performance.now(), mode: s.mode, time: s.time, paused: s.paused, renderMs: app.stats.frame.renderTime });
    }); } };
  }, earned);
  const p = await context.newPage(), driver = await createDriver(context, p, touch), errors = [];
  p.on('pageerror', e => errors.push(e.stack));
  try {
    const started = Date.now(); await p.goto(origin + '/preparation.html?inspect=1');
    await p.locator('#enter').waitFor({ state: 'visible', timeout: 60000 }); const readyMs = Date.now() - started;
    assert.deepEqual(await p.evaluate(() => JSON.parse(localStorage.getItem('bible-comic.episode.local.v1')).current), earned);
    await driver.tap('#enter'); await driver.tap('#interact');
    await p.waitForFunction(() => { const s = JSON.parse(document.querySelector('canvas').dataset.preparation); return s.mode === 'decline' && s.time >= 10; });
    const begin = await p.evaluate(() => performance.now());
    await p.waitForFunction(() => { const s = JSON.parse(document.querySelector('canvas').dataset.preparation); return s.area === 'brook' && s.mode === 'explore'; }, null, { timeout: 60000 });
    const frames = await p.evaluate(() => window.brookFrames), gaps = frames.slice(1).map((b, i) => ({ ms: b.at - frames[i].at, before: frames[i].mode, after: b.mode, at: b.at })).filter(g => g.at >= begin);
    const state = await p.locator('canvas').evaluate(e => JSON.parse(e.dataset.preparation));
    assert.equal(state.run.completed.length, 8); assert.equal(state.objective, 'stones.gathered'); assert.equal(state.wornHelmet, false); assert.deepEqual(errors, []);
    await p.screenshot({ path: path.join(out, 'brook-control-return.png') });
    const result = { status: 'PASS', layout, browser: browser.version(), readyMs, basis: 'Normal Chapter 4 restored from an actual seven-objective checkpoint earned in the fresh recorded episode. Warm-up cannot alter it; decline and brook handoff use actual UI and clocks. This is a targeted recovery fixture, not a fresh whole episode.', sourceRunId: earned.runId, largestGaps: gaps.sort((a, b) => b.ms - a.ms).slice(0, 5), state, frames, errors };
    fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify(result, null, 2)); console.log(JSON.stringify({ status: 'PASS', readyMs, largestGaps: result.largestGaps }));
  } finally { await context.close(); await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
