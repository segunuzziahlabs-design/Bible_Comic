const { chromium } = require(process.argv[2]);
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { createDriver } = require('./ctrl07-browser-driver.cjs');
const origin = process.argv[3] || 'http://127.0.0.1:4201';
const out = path.resolve(process.argv[4]);
const cpu = process.argv.includes('--cpu');
fs.mkdirSync(out, { recursive: true });

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', args: ['--autoplay-policy=user-gesture-required'] });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  const page = await context.newPage(), driver = await createDriver(context, page, false);
  const errors = [], requests = [], events = [];
  page.on('pageerror', e => errors.push(e.stack));
  page.on('response', r => { if (r.status() >= 400) requests.push({ url: r.url(), status: r.status() }); });
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.addInitScript(() => {
    window.elahFrames = []; window.elahLongTasks = [];
    new PerformanceObserver(list => { for (const e of list.getEntries()) window.elahLongTasks.push({ at: e.startTime, duration: e.duration }); }).observe({ type: 'longtask', buffered: true });
    globalThis[Symbol.for('playcanvas.inspector')] = { register(app) {
      window.elahApp = app;
      app.on('frameend', () => {
        const canvas = document.querySelector('canvas'); if (!canvas?.dataset.valley) return;
        const s = JSON.parse(canvas.dataset.valley);
        window.elahFrames.push({ at: performance.now(), mode: s.mode, stage: s.prologue.stage, time: s.time, prologueTime: s.prologue.time, paused: s.paused, audio: s.audio, prologueAudio: s.prologue.audio, updateMs: app.stats.frame.updateTime, renderMs: app.stats.frame.renderTime, drawCalls: app.stats.drawCallCount });
      });
    } };
  });
  const read = () => page.locator('canvas').evaluate(e => JSON.parse(e.dataset.valley));
  const wait = (fn, timeout = 70000) => page.waitForFunction(fn, null, { timeout });
  const stage = name => page.waitForFunction(name => JSON.parse(document.querySelector('canvas').dataset.valley).prologue.stage === name, name, { timeout: 70000 });
  async function move(x, z) {
    try {
      for (let i = 0; i < 300; i++) {
        const s = (await read()).prologue; if (s.stage === 'courtyard_arrival') return;
        const dx = x - s.position.x, dz = z - s.position.z, length = Math.hypot(dx, dz);
        if (length < .17) return;
        await driver.direction(dx / length, -dz / length); await page.waitForTimeout(85);
      }
      throw new Error(`Unreached path ${x},${z}`);
    } finally { await driver.release(); await page.waitForTimeout(140); }
  }
  try {
    const start = Date.now(); await page.goto(origin + '/valley.html?inspect=1');
    await page.locator('#enter').waitFor({ state: 'visible', timeout: 60000 });
    events.push({ label: 'entry-ready', ms: Date.now() - start });
    await driver.tap('#enter'); await stage('pasture_path'); console.log('Automatic messenger complete');
    await move(-.65, -2.8); await move(-1, -5); await move(-1, -8.1); await stage('courtyard');
    await driver.tap('#survey'); await stage('errand'); await stage('provisions');
    await move(.8, -7.2); await driver.tap('#survey'); await stage('journey');
    await move(0, -7.1); await move(0, -11.3); await move(0, -14.2); await move(-1, -18.2);
    await driver.tap('#survey'); await stage('discovery');
    await wait(() => { const s = JSON.parse(document.querySelector('canvas').dataset.valley); return s.prologue.stage === 'journey' && s.prologue.discovered; });
    await move(0, -24.1); console.log('Real Elah departure ready');
    const before = await page.evaluate(() => performance.now());
    if (cpu) { await driver.cdp.send('Profiler.enable'); await driver.cdp.send('Profiler.setSamplingInterval', { interval: 1000 }); await driver.cdp.send('Profiler.start'); }
    await driver.tap('#survey');
    await wait(() => { const s = JSON.parse(document.querySelector('canvas').dataset.valley); return s.mode === 'intro' && s.time >= 5; });
    if (cpu) {
      const { profile } = await driver.cdp.send('Profiler.stop');
      fs.writeFileSync(path.join(out, 'transition.cpuprofile'), JSON.stringify(profile));
      const nodes = new Map(profile.nodes.map(n => [n.id, n])); const self = new Map();
      profile.samples.forEach((id, i) => self.set(id, (self.get(id) || 0) + profile.timeDeltas[i]));
      const top = [...self].map(([id, us]) => ({ ms: us / 1000, ...nodes.get(id).callFrame })).sort((a, b) => b.ms - a.ms).slice(0, 30);
      fs.writeFileSync(path.join(out, 'cpu-self-times.json'), JSON.stringify(top, null, 2)); console.log(JSON.stringify(top.slice(0, 12)));
    }
    const data = await page.evaluate(before => ({ frames: window.elahFrames, longTasks: window.elahLongTasks, transitionStart: before, resources: performance.getEntriesByType('resource').map(e => ({ name: e.name, duration: e.duration, encodedBytes: e.encodedBodySize })), renderer: window.elahApp.graphicsDevice.unmaskedRenderer }), before);
    const gaps = data.frames.slice(1).map((b, i) => ({ ms: b.at - data.frames[i].at, before: data.frames[i], after: b })).filter(g => g.before.at >= before);
    const largest = [...gaps].sort((a, b) => b.ms - a.ms).slice(0, 5);
    await page.screenshot({ path: path.join(out, 'elah-intro.png'), scale: 'css' });
    assert.deepEqual(errors, []); assert.deepEqual(requests, []);
    assert.equal((await read()).mode, 'intro');
    assert.deepEqual((await read()).run.completed, [], 'No early survey checkpoint or progress injection');
    const result = { status: 'PASS', origin, browser: browser.version(), cpuProfile: cpu, basis: 'Fresh normal Chapter 1 through real inputs and unchanged clocks. Optional CPU sampling covers only the actual Elah departure.', events, largestTransitionGaps: largest, ...data, errors, requests };
    fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify(result, null, 2));
    console.log(JSON.stringify({ status: 'PASS', entryReadyMs: events[0].ms, largestGaps: largest.map(g => ({ ms: g.ms, before: g.before.stage, after: g.after.mode, renderMs: g.after.renderMs, updateMs: g.after.updateMs })) }));
  } catch (e) {
    await page.screenshot({ path: path.join(out, 'failure.png') }).catch(() => {});
    fs.writeFileSync(path.join(out, 'failure.json'), JSON.stringify({ error: e.stack, state: await read().catch(() => null), errors, requests }, null, 2)); throw e;
  } finally { await context.close(); await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
