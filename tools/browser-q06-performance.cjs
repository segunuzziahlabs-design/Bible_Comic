// node tools/browser-q06-performance.cjs <playwright> <origin> <new-output-directory> [process-cold [preview-pck-sha256]]
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.argv[2] || 'playwright');

const origin = new URL(process.argv[3]).origin;
const output = path.resolve(process.argv[4]);
const processCold = process.argv[5] === 'process-cold';
const previewHash = process.argv[6];
const viewport = { width: 1440, height: 810 };
const durationMs = 15 * 60 * 1000;
const report = { origin, viewport, deviceScaleFactor: 1, startedAt: new Date().toISOString(),
  browserMode: 'Headless Chrome, default acceleration, local gzip, no network throttling',
  loadingMode: processCold ? 'Fresh Chrome process per pair, loading only' : 'Fresh context per pair in one Chrome process',
  loading: [], cycles: [], errors: [] };
fs.mkdirSync(output, { recursive: true });
const reportFile = path.join(output, 'performance-review.json');
fs.writeFileSync(reportFile, '', { flag: 'wx' });

function summary(values) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const at = p => Number(sorted[Math.max(0, Math.ceil(sorted.length * p) - 1)].toFixed(2));
  return { count: sorted.length, min: at(0), p50: at(.5), p95: at(.95), max: at(1) };
}

function watch(page) {
  page.on('console', message => { if (message.type() === 'error') report.errors.push(message.text()); });
  page.on('pageerror', error => report.errors.push(error.message));
  page.on('requestfailed', request => report.errors.push(`${request.url()} ${request.failure()?.errorText}`));
}

async function load(page, reload) {
  if (reload) await page.reload({ waitUntil: 'domcontentloaded' });
  else await page.goto(`${origin}/`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__proofLoading?.ready || window.__proofLoading?.error, null,
    { polling: 100, timeout: 120000 });
  const data = await page.evaluate(() => ({
    shellToReadyMs: window.__proofLoading.readyMs,
    navigationToReadyMs: window.__proofLoading.startedAt + window.__proofLoading.readyMs,
    error: window.__proofLoading.error,
    diagnostics: !!window.__bibleProof,
    resources: performance.getEntriesByType('resource').filter(e => /index\.(wasm|pck|js)$/.test(e.name)).map(e => ({
      file: new URL(e.name).pathname, durationMs: e.duration, transferBytes: e.transferSize,
      encodedBytes: e.encodedBodySize, decodedBytes: e.decodedBodySize, status: e.responseStatus,
      deliveryType: e.deliveryType,
    })),
  }));
  assert(!data.error && !data.diagnostics && data.navigationToReadyMs > 0, 'Invalid load measurement');
  assert.equal(data.resources.length, 3, 'Expected WASM, PCK and engine JavaScript timing');
  return data;
}

async function startCapture(page) {
  await page.evaluate(() => {
    const capture = window.q06Capture = { active: true, times: [], engine: [], longTasks: [], hidden: false };
    const append = entries => capture.longTasks.push(...entries.map(e => [e.startTime, e.duration]));
    const observer = new PerformanceObserver(list => append(list.getEntries()));
    observer.observe({ type: 'longtask' });
    capture.stop = () => {
      capture.active = false;
      append(observer.takeRecords());
      observer.disconnect();
    };
    let previous;
    function frame(time) {
      if (!capture.active) return;
      capture.times.push(time);
      capture.hidden ||= document.hidden;
      const state = window.__bibleProof;
      if (state && state !== previous) {
        capture.engine.push({ time, fps: state.fps, processMs: state.frame_ms, draws: state.draw_calls,
          primitives: state.visible_primitives, position: state.player, scale: state.scale_3d,
          mode: state.mode, stage: state.stage, yaw: state.yaw });
        previous = state;
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  });
}

function analyse(capture) {
  const { times, engine, longTasks } = capture;
  const measuredMs = times.at(-1) - times[0];
  const intervals = times.slice(1).map((time, i) => time - times[i]);
  const stalls = intervals.flatMap((ms, i) => ms > 50 ? [{ elapsedMs: times[i] - times[0], ms }] : []);
  const below30 = [];
  const rolling = [];
  let left = 0, right = 0, start = null;
  for (let end = times[0] + 1000; end <= times.at(-1); end += 100) {
    while (times[right] <= end) right++;
    while (times[left] <= end - 1000) left++;
    const fps = right - left;
    rolling.push(fps);
    if (fps < 30 && start === null) start = end;
    if (fps >= 30 && start !== null) {
      below30.push({ elapsedMs: start - times[0], ms: end - start });
      start = null;
    }
  }
  if (start !== null) below30.push({ elapsedMs: start - times[0], ms: times.at(-1) - start });
  return { measuredMs, callbacks: times.length, meanCallbackFps: intervals.length * 1000 / measuredMs,
    callbackMs: summary(intervals), rollingCallbackFps: summary(rolling), stalls, below30,
    floorViolations: below30.filter(span => span.ms > 2000), longTaskMs: summary(longTasks.map(e => e[1])),
    engineFps: summary(engine.map(s => s.fps)), processMs: summary(engine.map(s => s.processMs)),
    draws: summary(engine.map(s => s.draws)), visiblePrimitives: summary(engine.map(s => s.primitives)),
    renderScales: [...new Set(engine.map(s => s.scale))] };
}

async function sustain(context) {
  const page = await context.newPage();
  watch(page);
  const state = () => page.evaluate(() => window.__bibleProof);
  const wait = async (predicate, value) => {
    await page.waitForFunction(predicate, value, { polling: 120, timeout: 26000 });
    return state();
  };
  const click = async button => {
    const [x, y, w, h] = (await state()).layout[button];
    await page.mouse.click(x + w / 2, y + h / 2);
  };
  const move = async (x, z) => {
    for (let attempt = 0; attempt < 26; attempt++) {
      const { player, walk_speed: speed } = await state();
      const dx = x - player[0], dz = z - player[2];
      if (Math.hypot(dx, dz) < .32) return;
      const sideways = Math.abs(dx) > Math.abs(dz);
      const amount = sideways ? dx : dz;
      const key = sideways ? (amount > 0 ? 'd' : 'a') : (amount > 0 ? 's' : 'w');
      await page.keyboard.down(key);
      await page.waitForTimeout(Math.min(850, Math.max(130, Math.abs(amount) / speed * 1000)));
      await page.keyboard.up(key);
      await page.waitForTimeout(370);
    }
    throw new Error(`Could not walk to (${x}, ${z}): ${JSON.stringify((await state()).player)}`);
  };
  const cameraSweep = async () => {
    await page.mouse.move(610, 360);
    await page.mouse.down();
    await page.mouse.move(790, 360, { steps: 25 });
    await page.waitForTimeout(260);
    await page.mouse.move(500, 360, { steps: 35 });
    await page.waitForTimeout(260);
    await page.mouse.move(610, 360, { steps: 16 });
    await page.mouse.up();
    await wait(() => Math.abs(window.__bibleProof?.yaw) < .025);
  };
  await page.goto(`${origin}/?diagnostics=1`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__bibleProof?.mode === 'welcome', null, { timeout: 120000 });
  assert.equal((await state()).build, report.candidate.gameBuild);
  await click('primary');
  const entered = await wait(() => window.__bibleProof?.mode === 'game');
  assert.equal(entered.extra_light, false, 'Expected the default detail setting');
  report.renderer = await page.evaluate(() => {
    const gl = document.querySelector('canvas').getContext('webgl2');
    const info = gl?.getExtension('WEBGL_debug_renderer_info');
    return info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : null;
  });
  const cdp = await context.newCDPSession(page);
  const memoryBefore = await cdp.send('Runtime.getHeapUsage');
  await startCapture(page);
  const started = performance.now();
  try {
    do {
      await move(0, 3.25);
      await cameraSweep();
      await move(-1.3, 3.25);
      await move(0, 3.25);
      await move(0, 2.65);
      await wait(() => window.__bibleProof?.target === 'jesse');
      await click('context');
      await wait(() => window.__bibleProof?.mode === 'exchange');
      await wait(() => window.__bibleProof?.mode === 'game' && window.__bibleProof.stage === 1);
      await wait(() => window.__bibleProof?.camera.stage_mix < .02);
      await move(0, .75);
      await move(1.95, .75);
      await wait(() => window.__bibleProof?.target === 'provisions');
      await click('context');
      await wait(() => window.__bibleProof?.exchange.phase === 'pickup' && window.__bibleProof.exchange.attached);
      await wait(() => window.__bibleProof?.mode === 'game' && window.__bibleProof.stage === 2);
      await move(0, .75);
      await move(0, -13);
      await wait(() => window.__bibleProof?.target === 'gate');
      await click('context');
      const complete = await wait(() => window.__bibleProof?.mode === 'complete' && window.__bibleProof.stage === 3);
      assert.deepEqual(complete.story_events, ['jesse_spoken', 'provisions_collected', 'gate_reached']);
      await click('primary');
      const reset = await wait(() => window.__bibleProof?.mode === 'game' && window.__bibleProof.stage === 0);
      assert(reset.exchange.bundle_visible && reset.exchange.contact_count === 0);
      assert.deepEqual(reset.story_events, []);
      const elapsedMs = Math.round(performance.now() - started);
      report.cycles.push({ elapsedMs, completed: complete.story_events, restarted: true });
      console.log(`Sustained route ${report.cycles.length} completed and restarted at ${Math.round(elapsedMs / 1000)} s`);
    } while (performance.now() - started < durationMs + 500 || report.cycles.length < 3);
  } finally {
    const capture = await page.evaluate(() => {
      const { times, engine, longTasks, hidden, stop } = window.q06Capture;
      stop();
      return { times, engine, longTasks, hidden };
    });
    fs.writeFileSync(path.join(output, 'sustained-samples.json'), JSON.stringify(capture) + '\n');
    report.sustained = analyse(capture);
    report.sustained.hidden = capture.hidden;
    report.sustained.memory = { before: memoryBefore, after: await cdp.send('Runtime.getHeapUsage') };
  }
  assert(report.sustained.measuredMs >= durationMs && !report.sustained.hidden, 'Invalid duration or tab visibility');
}

async function loadPair(browser, pair) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  try {
    const page = await context.newPage();
    watch(page);
    for (const reload of [false, true]) {
      const sample = { pair, kind: reload ? 'warm reload' : processCold ? 'cold process' : 'cold context',
        ...await load(page, reload) };
      report.loading.push(sample);
      console.log(`Load pair ${pair}, ${sample.kind}, navigation to ready ${Math.round(sample.navigationToReadyMs)} ms`);
    }
  } finally {
    await context.close();
  }
}

async function withBrowser(task) {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    report.browser = browser.version();
    await task(browser);
  } finally {
    await browser.close();
  }
}

async function run() {
  if (previewHash) {
    assert(processCold && /^[a-f0-9]{64}$/.test(previewHash), 'Supply the preview PCK SHA-256 for a process-cold run');
    const manifest = await fetch(`${origin}/build-manifest.json`);
    assert(manifest.ok);
    report.buildManifest = await manifest.json();
    assert.equal(report.buildManifest.files.find(file => file.file === 'index.pck').sha256, previewHash);
    const pack = await fetch(`${origin}/index.pck`);
    assert(pack.ok);
    assert.equal(createHash('sha256').update(Buffer.from(await pack.arrayBuffer())).digest('hex'), previewHash);
  } else {
    const identity = await fetch(`${origin}/candidate.json`);
    assert(identity.ok);
    report.candidate = await identity.json();
    assert.equal(report.candidate.candidateId, 'Q06-20261109-01');
  }
  if (processCold) {
    for (let i = 1; i <= 3; i++) await withBrowser(browser => loadPair(browser, i));
  } else {
    await withBrowser(async browser => {
      for (let i = 1; i <= 3; i++) await loadPair(browser, i);
      const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
      await sustain(context);
    });
  }
  assert.deepEqual(report.errors, []);
  report.result = 'measured';
}

run().catch(error => {
  report.result = 'failed';
  report.failure = error.stack;
  process.exitCode = 1;
}).finally(() => {
  report.finishedAt = new Date().toISOString();
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ result: report.result, cycles: report.cycles.length,
    measuredMs: report.sustained?.measuredMs, floorViolations: report.sustained?.floorViolations.length,
    errors: report.errors, failure: report.failure }));
});
