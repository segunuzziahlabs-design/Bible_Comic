const { chromium } = require(process.argv[2]);
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { createDriver } = require('./ctrl07-browser-driver.cjs');
const { createAudienceScore } = require('../src/gameplay/saul-audience-score.ts');
const score = createAudienceScore(require('../src/assets/saul-performance-dialogue/dialogue.json'));
const origin = process.argv[3], out = path.resolve(process.argv[4]);
const layout = process.argv[5] || 'desktop';
const direct = process.argv.includes('--direct'), restart = process.argv.includes('--restart');
const sizes = { desktop: [1280, 720], portrait: [390, 844], landscape: [844, 390] };
const [width, height] = sizes[layout], touch = layout !== 'desktop';
fs.mkdirSync(out, { recursive: true });
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', args: ['--autoplay-policy=user-gesture-required'] });
  const context = await browser.newContext({ viewport: { width, height }, hasTouch: touch, isMobile: touch, deviceScaleFactor: 1 });
  const p = await context.newPage(), driver = await createDriver(context, p, touch), errors = [], failed = [];
  p.on('pageerror', e => errors.push(e.stack)); p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  p.on('response', r => { if (r.status() >= 400) failed.push({ url: r.url(), status: r.status() }); });
  await p.addInitScript(() => {
    window.saulSamples = [];
    globalThis[Symbol.for('playcanvas.inspector')] = { register(app) { window.saulApp = app;
      app.on('frameend', () => {
        const canvas = document.querySelector('canvas'); if (!canvas?.dataset.preparation) return;
        const s = JSON.parse(canvas.dataset.preparation); if (s.mode !== 'audience') return;
        const camera = app.root.findByName('Saul scene camera').camera;
        const actors = ['David', 'Saul'].map(name => {
          const actor = app.root.findByName(name), head = actor.findByName('Head'), screen = camera.worldToScreen(head.getPosition());
          return { name, headRotation: head.getLocalRotation().toArray(), screen: { x: screen.x / canvas.clientWidth, y: screen.y / canvas.clientHeight }, mouth: s[name === 'David' ? 'davidMouth' : 'saulMouth'] };
        });
        window.saulSamples.push({ at: performance.now(), time: s.time, paused: s.paused, shot: s.shot, actors, updateMs: app.stats.frame.updateTime, renderMs: app.stats.frame.renderTime, drawCalls: app.stats.drawCallCount });
      });
    } };
  });
  const state = () => p.locator('canvas').evaluate(e => JSON.parse(e.dataset.preparation));
  const wait = fn => p.waitForFunction(fn, null, { timeout: 60000 });
  try {
    await p.goto(origin + '/preparation.html?review=1&inspect=1' + (direct ? '&cinematic=1' : ''));
    await driver.tap('#enter');
    if (!direct) {
      await wait(() => JSON.parse(document.querySelector('canvas').dataset.preparation).mode === 'explore');
      await driver.direction(0, 1);
      await p.locator('#interact').waitFor({ state: 'visible', timeout: 10000 });
      await driver.release(); await driver.tap('#interact');
    }
    if (restart) {
      await wait(() => { const s = JSON.parse(document.querySelector('canvas').dataset.preparation); return s.mode === 'audience' && s.time > 4; });
      await driver.tap('#reset');
      await wait(() => { const s = JSON.parse(document.querySelector('canvas').dataset.preparation); return s.mode === 'audience' && s.time < 1 && s.starts.audience === 2; });
      assert.equal((await state()).run.completed.length, 5, 'Restart cannot commit the interrupted audience');
    }
    for (const [time, name] of [[3, 'wide'], [score.concernStart + 1.2, 'saul-concern'], [score.answerStart + 2, 'david-answer'], [(score.guardEnd + .35 + score.blessingStart) / 2, 'saul-listens'], [score.blessingStart + 1, 'blessing']]) {
      await p.waitForFunction(time => { const s = JSON.parse(document.querySelector('canvas').dataset.preparation); return s.mode === 'audience' && s.time >= time; }, time);
      await driver.tap('#pause'); const before = await state();
      const bones = await p.evaluate(() => window.saulSamples.at(-1).actors);
      await p.waitForTimeout(200);
      assert.equal((await state()).time, before.time);
      assert.deepEqual(await p.evaluate(() => window.saulSamples.at(-1).actors), bones, 'Paused bones, framing and mouth weights must stay still');
      await p.screenshot({ path: path.join(out, name + '.png'), scale: 'css', style: '#pause-notice{display:none!important}' });
      await driver.tap('#pause');
    }
    await wait(() => { const s = JSON.parse(document.querySelector('canvas').dataset.preparation); return s.mode === 'explore' && s.run.completed.includes('saul.audience'); });
    const end = await state(); assert.equal(end.objective, 'armour.inspected'); assert.equal(end.starts.audience, restart ? 2 : 1);
    assert.equal(await p.locator('#move-pad').getAttribute('hidden'), null);
    assert.equal(await p.evaluate(() => localStorage.getItem('bible-comic.episode.local.v1')), null, 'Review must not change normal saved progress');
    await p.screenshot({ path: path.join(out, 'control-return.png'), scale: 'css' });
    assert.deepEqual(errors, []); assert.deepEqual(failed, []);
    const samples = await p.evaluate(() => window.saulSamples), intervals = [];
    for (const name of ['David', 'Saul']) {
      const actorSamples = samples.map(s => s.actors.find(a => a.name === name));
      assert(actorSamples.every(a => a.headRotation.every(Number.isFinite)), name + ' non-finite joint pose');
      assert(new Set(actorSamples.map(a => a.headRotation.join(','))).size > 20, name + ' head must actually animate');
      assert(actorSamples.some(a => a.mouth.some(w => w > .03)), name + ' mouth must actually move during the voice');
    }
    for (let i = 1; i < samples.length; i++) if (!samples[i].paused && !samples[i - 1].paused) intervals.push(samples[i].at - samples[i - 1].at);
    intervals.sort((a, b) => a - b);
    const result = { status: 'PASS', layout, width, height, origin, direct, restart, browser: browser.version(), basis: 'Isolated Chapter 4 review, actual keyboard/touch input, normal voice clock, five real pause/capture/resume beats, moving joints/mouths and returned control. Pause indicator hidden only while taking comparison screenshots. Does not represent a fresh six-chapter journey.', end, medianFrameMs: intervals[Math.floor(intervals.length * .5)], p95FrameMs: intervals[Math.floor(intervals.length * .95)], maxFrameMs: Math.max(...intervals), samples, errors, failed };
    fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify(result, null, 2)); console.log(JSON.stringify({ status: 'PASS', layout, medianMs: result.medianFrameMs, p95Ms: result.p95FrameMs }));
  } catch (e) { await p.screenshot({ path: path.join(out, 'failure.png') }).catch(() => {}); fs.writeFileSync(path.join(out, 'failure.json'), JSON.stringify({ error: e.stack, errors, state: await state().catch(() => null) }, null, 2)); throw e; }
  finally { await context.close(); await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
