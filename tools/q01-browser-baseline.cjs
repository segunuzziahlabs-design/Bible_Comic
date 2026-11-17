// Run against the frozen B06 candidate with the local server already listening.
// node tools/q01-browser-baseline.cjs <playwright-module-path> <new-output.json>
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require(process.argv[2] || 'playwright');

assert(process.argv[3], 'Supply a new output JSON path');
const output = path.resolve(process.argv[3]);
const origin = 'http://127.0.0.1:8061';
const viewport = { width: 1280, height: 720 };
const report = {
  startedAt: new Date().toISOString(),
  origin,
  viewport,
  deviceScaleFactor: 1,
  browserMode: 'Chrome headless, default acceleration, no artificial throttling',
  route: 'Spawn lane. W 850ms, S 850ms, D 550ms, A 550ms, then idle 800ms. Repeat three times.',
  routePreparation: 'Fresh browser context for every route. Allow 2s after entering and selecting detail. Warm reload follows the low-detail diagnostics-off route.',
  timingMethod: 'Browser requestAnimationFrame callback intervals. Proxy for callback pacing, not display presents or GPU timings.',
  loading: [],
  runs: [],
  errors: [],
};
fs.mkdirSync(path.dirname(output), { recursive: true });
const fd = fs.openSync(output, 'wx');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

function describe(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const percentile = p => Number(sorted[Math.ceil(p * sorted.length) - 1].toFixed(2));
  return { count: sorted.length, p50: percentile(.5), p95: percentile(.95), max: percentile(1) };
}

async function load(page, diagnostics, reload = false) {
  if (reload) await page.reload({ waitUntil: 'domcontentloaded' });
  else await page.goto(origin + (diagnostics ? '/?diagnostics=1' : '/'), { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__proofLoading?.ready, null, { timeout: 45000 });
  return page.evaluate(() => ({
    engineReadyMs: window.__proofLoading.readyMs,
    resources: performance.getEntriesByType('resource')
      .filter(entry => /index\.(wasm|pck|js)$/.test(entry.name))
      .map(entry => ({
        file: new URL(entry.name).pathname,
        encodedBytes: entry.encodedBodySize,
        transferredBytes: entry.transferSize,
        decodedBytes: entry.decodedBodySize,
        durationMs: entry.duration,
        status: entry.responseStatus,
        deliveryType: entry.deliveryType,
      })),
  }));
}

async function measure(page, diagnostics, extraLight) {
  // At the fixed 1280 × 720 viewport the existing canvas renders these controls.
  await page.mouse.click(490, 550);
  if (diagnostics) await page.waitForFunction(() => window.__bibleProof?.mode === 'game');
  if (extraLight) await page.mouse.click(990, 48);
  if (diagnostics) await page.waitForFunction(expected => window.__bibleProof?.extra_light === expected, extraLight);
  await delay(2000);
  await page.evaluate(() => {
    const capture = window.q01Capture = { active: true, times: [], engine: [], longTasks: [], hidden: false };
    let lastDiagnostic;
    capture.observer = new PerformanceObserver(list => {
      capture.longTasks.push(...list.getEntries().map(entry => ({ startMs: entry.startTime, durationMs: entry.duration })));
    });
    capture.observer.observe({ entryTypes: ['longtask'] });
    function frame(t) {
      if (!capture.active) return;
      capture.times.push(t);
      capture.hidden ||= document.hidden;
      const current = window.__bibleProof;
      if (current && current !== lastDiagnostic) {
        capture.engine.push({
          timeMs: t, fps: current.fps, processMs: current.frame_ms, draws: current.draw_calls,
          visiblePrimitives: current.visible_primitives, scale: current.scale_3d, player: current.player,
        });
        lastDiagnostic = current;
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  });
  for (let pass = 0; pass < 3; pass++) {
    for (const [key, hold] of [['w', 850], ['s', 850], ['d', 550], ['a', 550]]) {
      await page.keyboard.down(key);
      await delay(hold);
      await page.keyboard.up(key);
    }
    await delay(800);
  }
  const data = await page.evaluate(() => {
    const capture = window.q01Capture;
    capture.active = false;
    capture.observer.disconnect();
    const { times, engine, longTasks, hidden } = capture;
    const gl = document.querySelector('canvas').getContext('webgl2');
    const extension = gl?.getExtension('WEBGL_debug_renderer_info');
    return { times, engine, longTasks, hidden, renderer: extension ? gl.getParameter(extension.UNMASKED_RENDERER_WEBGL) : null };
  });
  const metrics = await (await page.context().newCDPSession(page)).send('Runtime.getHeapUsage');
  assert(!data.hidden && data.times.length > 50, 'Measurement lost visibility or had insufficient callbacks');
  assert.equal(data.engine.length > 0, diagnostics, 'Unexpected diagnostics state');
  if (diagnostics) {
    const z = data.engine.map(sample => sample.player[2]);
    assert(Math.max(...z) - Math.min(...z) > 1, 'Keyboard route did not move David as expected');
  }
  const intervals = data.times.slice(1).map((time, index) => Number((time - data.times[index]).toFixed(3)));
  return {
    diagnostics, detail: extraLight ? 'Extra light' : 'Low detail', renderer: data.renderer,
    durationMs: Number((data.times.at(-1) - data.times[0]).toFixed(2)),
    browserCallbackMs: describe(intervals), intervalsOver50Ms: intervals.filter(ms => ms > 50).length,
    engineFps: describe(data.engine.map(s => s.fps)),
    engineProcessMs: describe(data.engine.map(s => s.processMs)),
    drawCalls: describe(data.engine.map(s => s.draws)),
    visiblePrimitives: describe(data.engine.map(s => s.visiblePrimitives)),
    cdpHeapUsageBytes: metrics, browserIntervalsMs: intervals, engineSamples: data.engine, longTasks: data.longTasks,
  };
}

async function run() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    report.browserVersion = browser.version();
    const response = await browser.newContext();
    try {
      const manifest = await response.request.get(origin + '/candidate.json');
      assert(manifest.ok(), 'Frozen candidate is not available');
      const candidate = await manifest.json();
      assert.equal(candidate.candidateId, 'B06-20261109-01');
      report.candidate = candidate;
    } finally {
      await response.close();
    }

    for (let repetition = 1; repetition <= 3; repetition++) {
      const cases = [[false, false], [false, true], [true, true], [true, false]];
      // Reverse the middle pass to reduce order bias.
      if (repetition === 2) cases.reverse();
      for (const [diagnostics, extraLight] of cases) {
        const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
        try {
          const page = await context.newPage();
          page.on('pageerror', error => report.errors.push(error.message));
          page.on('console', message => {
            if (message.type() === 'error') report.errors.push(message.text());
          });
          const cold = await load(page, diagnostics);
          const result = await measure(page, diagnostics, extraLight);
          report.runs.push({ repetition, ...result });
          if (repetition === 1) {
            const capture = path.join(path.dirname(output), `route-${diagnostics ? 'diagnostics' : 'plain'}-${extraLight ? 'extra-light' : 'low-detail'}.png`);
            await page.screenshot({ path: capture });
          }
          if (!diagnostics && !extraLight) {
            report.loading.push({ repetition, cache: 'cold context', ...cold });
            report.loading.push({ repetition, cache: 'warm reload', ...await load(page, diagnostics, true) });
          }
          console.log(JSON.stringify({ repetition, diagnostics, detail: result.detail, callbackMs: result.browserCallbackMs, engineFps: result.engineFps, renderer: result.renderer }));
        } finally {
          await context.close();
        }
      }
    }
    assert.equal(report.errors.length, 0, JSON.stringify(report.errors));
  } finally {
    await browser.close();
  }
}

run().then(() => { report.result = 'measured'; }).catch(error => {
  report.result = 'incomplete';
  report.failure = error.stack;
  console.error(report.failure);
  process.exitCode = 1;
}).finally(() => {
  report.finishedAt = new Date().toISOString();
  fs.writeFileSync(fd, JSON.stringify(report, null, 2) + '\n');
  fs.closeSync(fd);
});
