const { chromium } = require(process.argv[2]);
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const { createDriver } = require('./ctrl07-browser-driver.cjs');
const origin = process.argv[3] || 'http://127.0.0.1:4201';
const out = path.resolve(process.argv[4] || 'docs/implementation/evidence/ctrl07-2026-11-16/final-layout');
fs.mkdirSync(out, { recursive: true });
const fixtureSource = path.resolve(process.argv[5] || path.join(out, '..', 'run2', 'desktop', 'results.json'));
const completedFixture = JSON.parse(fs.readFileSync(fixtureSource)).completed;
assert.equal(completedFixture.status, 'completed');
assert.equal(completedFixture.completed.length, 12);
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', args: ['--autoplay-policy=user-gesture-required'] });
  const results = [];
  try {
    for (const [name, width, height, touch] of [['desktop', 1280, 720, false], ['portrait', 390, 844, true], ['landscape', 844, 390, true]]) {
      const context = await browser.newContext({ viewport: { width, height }, hasTouch: touch, isMobile: touch, deviceScaleFactor: 1 });
      const p = await context.newPage(), driver = await createDriver(context, p, touch), errors = [];
      p.on('pageerror', e => errors.push(e.stack));
      await p.goto(origin + '/episode.html?inspect=1');
      await driver.tap('#enter');
      await p.waitForURL('**/valley.html?inspect=1');
      await p.locator('#enter').waitFor({ state: 'visible', timeout: 60000 });
      const geometry = await p.locator('#enter').evaluate(e => {
        const b = e.getBoundingClientRect(), c = e.closest('.entry-card').getBoundingClientRect();
        return { button: { x: b.x, y: b.y, width: b.width, height: b.height }, card: { top: c.top, bottom: c.bottom }, fullyVisible: b.top >= c.top && b.bottom <= c.bottom, clear: e.contains(document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2)), shortRule: matchMedia('(max-height:500px)').matches, paragraphFont: getComputedStyle(document.getElementById('entry-message')).fontSize, overflow: document.documentElement.scrollWidth > innerWidth + 1 || document.documentElement.scrollHeight > innerHeight + 1 };
      });
      assert(geometry.fullyVisible && geometry.clear && !geometry.overflow, name + ': Begin must be visible without card scrolling');
      assert.equal(geometry.shortRule, name === 'landscape');
      assert.equal(geometry.paragraphFont, name === 'landscape' ? '13px' : '14px');
      await p.screenshot({ path: path.join(out, name + '-entry.png'), scale: 'css' });
      await driver.tap('#enter');
      await p.waitForFunction(() => { const s = JSON.parse(document.querySelector('canvas').dataset.valley); return s.mode === 'prologue' && s.prologue.time > 4.8; }, null, { timeout: 30000 });
      assert.deepEqual(errors, []);
      await context.close();
      // Separate UI recovery fixture: use an actually earned completed run. Never
      // import this fixture into the fresh six-chapter playthrough runner.
      const resumed = await browser.newContext({ viewport: { width, height }, hasTouch: touch, isMobile: touch, deviceScaleFactor: 1 });
      await resumed.addInitScript(completed => {
        const key = 'bible-comic.episode.local.v1';
        if (location.pathname.endsWith('/episode.html') && !localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify({ current: completed, history: [] }));
      }, completedFixture);
      const resultPage = await resumed.newPage(), resultDriver = await createDriver(resumed, resultPage, touch);
      resultPage.on('pageerror', e => errors.push(e.stack));
      await resultPage.goto(origin + '/episode.html?inspect=1');
      await resultPage.locator('#results').waitFor({ state: 'visible' });
      const replayGeometry = await resultPage.locator('#replay').evaluate(e => {
        const b = e.getBoundingClientRect(), c = e.closest('.entry-card').getBoundingClientRect();
        return { fullyVisible: b.top >= c.top && b.bottom <= c.bottom, clear: e.contains(document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2)), height: b.height };
      });
      assert(replayGeometry.fullyVisible && replayGeometry.clear && replayGeometry.height >= 44, name + ': Replay must be visible without scrolling');
      await resultPage.screenshot({ path: path.join(out, name + '-completed-replay.png'), scale: 'css' });
      await resultDriver.tap('#replay');
      await resultPage.waitForURL('**/valley.html?inspect=1');
      await resultPage.locator('#enter').waitFor({ state: 'visible', timeout: 60000 });
      const replay = await resultPage.evaluate(() => JSON.parse(localStorage.getItem('bible-comic.episode.local.v1')));
      assert.notEqual(replay.current.runId, completedFixture.runId);
      assert.deepEqual(replay.current.completed, []);
      assert.equal(replay.history[0].runId, completedFixture.runId);
      assert.deepEqual(errors, []);
      results.push({ status: 'PASS', layout: name, geometry, replayGeometry, fixtureSource, checks: 'Normal fresh entry to automatic flock; Begin and Replay fully visible without scrolling. Separate completed-save UI fixture verifies Replay creates a new run and retains history. This fixture is not a fresh full-episode result.', errors });
      await resumed.close();
    }
    fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify({ status: 'PASS', browser: browser.version(), results }, null, 2));
    console.log(JSON.stringify(results, null, 2));
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
