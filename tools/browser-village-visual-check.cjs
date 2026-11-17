// node tools/browser-village-visual-check.cjs <playwright> <origin> <output> [route]
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.argv[2] || 'playwright');

const origin = process.argv[3];
const output = path.resolve(process.argv[4]);
const routeOnly = process.argv[5] === 'route';
const viewport = { width: 1440, height: 810 };
const report = { origin, viewport, deviceScaleFactor: 1, errors: [], routes: [], views: {} };
fs.mkdirSync(output, { recursive: true });

function summary(values) {
  assert(values.length > 0);
  const sorted = [...values].sort((a, b) => a - b);
  const percentile = p => Number(sorted[Math.ceil(p * sorted.length) - 1].toFixed(2));
  return { count: sorted.length, p50: percentile(.5), p95: percentile(.95), max: sorted.at(-1) };
}

async function run() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    report.browser = browser.version();
    const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
    page.on('console', message => { if (message.type() === 'error') report.errors.push(message.text()); });
    page.on('pageerror', error => report.errors.push(error.message));
    page.on('requestfailed', request => report.errors.push(`${request.url()} ${request.failure()?.errorText}`));
    const state = () => page.evaluate(() => window.__bibleProof);
    const wait = async (condition, argument) => {
      await page.waitForFunction(condition, argument, { timeout: 16000 });
      return state();
    };
    const click = async button => {
      const [x, y, w, h] = (await state()).layout[button];
      await page.mouse.click(x + w / 2, y + h / 2);
    };
    const key = async (name, ms) => {
      await page.keyboard.down(name);
      await page.waitForTimeout(ms);
      await page.keyboard.up(name);
    };
    const shot = async name => {
      report.views[name] = await state();
      await page.screenshot({ path: path.join(output, `${name}.png`) });
    };
    const move = async (x, z) => {
      for (let attempt = 0; attempt < 18; attempt++) {
        const { player, walk_speed: speed } = await state();
        const dx = x - player[0], dz = z - player[2];
        if (Math.hypot(dx, dz) < .24) return;
        const side = Math.abs(dx) > Math.abs(dz);
        const amount = side ? dx : dz;
        await key(side ? (amount > 0 ? 'd' : 'a') : (amount > 0 ? 's' : 'w'),
          Math.min(850, Math.max(130, Math.abs(amount) / speed * 1000)));
        await page.waitForTimeout(365);
      }
      throw new Error(`Could not reach ${x}, ${z}`);
    };
    const startRoute = async () => {
      await page.evaluate(() => {
        const capture = window.q05Capture = { active: true, times: [], samples: [], hidden: false };
        let previous;
        function frame(time) {
          if (!capture.active) return;
          capture.times.push(time);
          capture.hidden ||= document.hidden;
          const current = window.__bibleProof;
          if (current && current !== previous) {
            capture.samples.push({ fps: current.fps, draws: current.draw_calls, primitives: current.visible_primitives,
              position: current.player, scale: current.scale_3d });
            previous = current;
          }
          requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
      });
    };
    const finishRoute = async preset => {
      const { times, samples, hidden } = await page.evaluate(() => {
        window.q05Capture.active = false;
        return window.q05Capture;
      });
      const z = samples.map(sample => sample.position[2]);
      assert(!hidden && times.length > 50 && Math.max(...z) - Math.min(...z) > .9, 'Invalid route sample');
      const intervals = times.slice(1).map((time, index) => time - times[index]);
      report.routes.push({ preset, callbackMs: summary(intervals), gapsOver50Ms: intervals.filter(ms => ms > 50).length,
        fps: summary(samples.map(s => s.fps)), draws: summary(samples.map(s => s.draws)),
        primitives: summary(samples.map(s => s.primitives)), samples, intervals });
    };

    const manifest = await page.request.get(`${origin}/build-manifest.json`);
    assert(manifest.ok());
    report.manifest = await manifest.json();
    await page.goto(`${origin}/?diagnostics=1`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.__bibleProof?.mode === 'welcome', null, { timeout: 55000 });
    await click('primary');
    await wait(() => window.__bibleProof?.mode === 'game');
    report.build = (await state()).build;
    report.renderer = await page.evaluate(() => {
      const gl = document.querySelector('canvas').getContext('webgl2');
      const info = gl?.getExtension('WEBGL_debug_renderer_info');
      return info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : null;
    });
    for (const preset of (routeOnly ? ['default'] : ['default', 'extra-light'])) {
      if (preset === 'extra-light') {
        await click('quality');
        await wait(() => window.__bibleProof?.extra_light);
      }
      await page.waitForTimeout(1200);
      await shot(`lane-${preset}`);
      for (let repeat = 0; repeat < 2; repeat++) {
        await startRoute();
        for (const [name, ms] of [['w', 850], ['s', 850], ['d', 550], ['a', 550]]) {
          await key(name, ms);
          await page.waitForTimeout(180);
        }
        // Sample the camera while it moves as well as the fixed forward view.
        await page.mouse.move(600, 345);
        await page.mouse.down();
        await page.mouse.move(670, 345, { steps: 8 });
        await page.mouse.move(600, 345, { steps: 8 });
        await page.mouse.up();
        await page.waitForTimeout(450);
        await finishRoute(preset);
        await click('pause');
        await wait(() => window.__bibleProof?.mode === 'pause');
        await click('secondary');
        await wait(() => window.__bibleProof?.mode === 'game' && Math.abs(window.__bibleProof.player[2] - 5) < .1);
      }
    }
    if (!routeOnly) {
      await click('quality');
      await wait(() => window.__bibleProof?.extra_light === false);
      await move(0, 2.65);
      await wait(() => window.__bibleProof?.target === 'jesse');
      await click('context');
      await wait(() => window.__bibleProof?.exchange.seconds >= 2.65 && window.__bibleProof?.mode === 'exchange');
      await shot('greeting');
      await click('exchange_skip');
      await wait(() => window.__bibleProof?.mode === 'game' && window.__bibleProof?.stage === 1);
      await page.waitForTimeout(900);
      await shot('provisions-far');
      await move(0, .75);
      await move(1.95, .75);
      await wait(() => window.__bibleProof?.target === 'provisions');
      await shot('provisions-near');
      await click('context');
      await wait(() => window.__bibleProof?.exchange.phase === 'pickup' && window.__bibleProof?.exchange.seconds >= 1.8);
      await shot('lift');
      await wait(() => window.__bibleProof?.mode === 'game' && window.__bibleProof?.stage === 2);
    }
    assert.deepEqual(report.errors, []);
    report.result = 'passed';
  } finally {
    await browser.close();
  }
}

run().catch(error => {
  report.result = 'failed';
  report.failure = error.stack;
  process.exitCode = 1;
}).finally(() => {
  fs.writeFileSync(path.join(output, 'visual-review.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ result: report.result, routes: report.routes.map(r => [r.preset, r.callbackMs.p95, r.gapsOver50Ms]),
    errors: report.errors, failure: report.failure }));
});
