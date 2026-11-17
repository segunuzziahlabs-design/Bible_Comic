// node tests/foundation-profile.cjs <playwright-module> <production-dir> <output-json>
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { mkdir, readdir, readFile, writeFile } = require('node:fs/promises');
const { createServer } = require('node:http');
const os = require('node:os');
const path = require('node:path');
const { gzipSync } = require('node:zlib');

const [playwright = 'playwright', directory = '../../build/playcanvas-pc04', output = '../../build/pc04-evidence/profile.json'] = process.argv.slice(2);
const { chromium } = require(playwright);
const viewport = { width: 1280, height: 720 };
const durationMs = 45000;
const targets = { coldMedianMs: 3500, compressedBytes: 2000000, renderFps: 30 };
const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.glb': 'model/gltf-binary' };
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

async function makeServer() {
  const root = path.resolve(directory);
  const entries = await readdir(root, { recursive: true, withFileTypes: true });
  const files = new Map();
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const absolute = path.join(entry.parentPath, entry.name);
    const route = '/' + path.relative(root, absolute).split(path.sep).join('/');
    const body = await readFile(absolute);
    files.set(route, { body, gzip: gzipSync(body), mime: mime[path.extname(route)] || 'application/octet-stream' });
  }
  const manifest = [...files].sort(([a], [b]) => a.localeCompare(b)).map(([file, { body, gzip }]) => ({
    file, bytes: body.length, gzipBytes: gzip.length, sha256: sha256(body),
  }));
  const server = createServer((request, response) => {
    const route = new URL(request.url, 'http://127.0.0.1').pathname;
    const file = files.get(route === '/' ? '/index.html' : route);
    if (!file) return response.writeHead(route === '/favicon.ico' ? 204 : 404).end();
    const compressed = /(?:^|,)s*gzip(?:,|$)/.test(request.headers['accept-encoding'] || '');
    const body = compressed ? file.gzip : file.body;
    response.writeHead(200, {
      'Content-Type': file.mime,
      'Content-Length': body.length,
      'Cache-Control': file.mime === 'text/html' ? 'no-store' : 'public, max-age=3600',
      Vary: 'Accept-Encoding',
      ...(compressed && { 'Content-Encoding': 'gzip' }),
    });
    response.end(body);
  });
  await new Promise((resolve, reject) => server.once('error', reject).listen(0, '127.0.0.1', resolve));
  return { server, origin: 'http://127.0.0.1:' + server.address().port, manifest };
}

function installProbe() {
  const probe = window.__foundationProfile = {
    engineMs: null, firstFrameMs: null, entryReadyMs: null, controllableMs: null,
  };
  // Register with the engine's inspector bridge before the production module loads.
  globalThis[Symbol.for('playcanvas.inspector')] = {
    register(app) {
      probe.app = app;
      probe.engineMs = performance.now();
      app.on('frameend', () => {
        const time = performance.now();
        probe.firstFrameMs ??= time;
        if (probe.entryReadyMs !== null) probe.controllableMs ??= time;
        const run = probe.run;
        if (run && time <= run.end) run.frames.push(time);
      });
    },
  };
  const entry = new MutationObserver(() => {
    const enter = document.getElementById('enter');
    if (!enter || enter.hidden) return;
    probe.entryReadyMs = performance.now();
    enter.click();
    entry.disconnect();
  });
  entry.observe(document, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden'] });
  probe.startRun = duration => {
    const start = performance.now();
    const run = probe.run = { start, end: start + duration, frames: [], callbacks: [], longTasks: [], visibilityLost: document.hidden };
    const observer = new PerformanceObserver(list => run.longTasks.push(...list.getEntries().map(({ startTime, duration }) => ({
      startTime, duration,
    }))));
    observer.observe({ type: 'longtask' });
    function checkVisibility() {
      if (document.hidden) run.visibilityLost = true;
    }
    document.addEventListener('visibilitychange', checkVisibility);
    function frame(timestamp) {
      if (timestamp <= run.end) {
        run.callbacks.push(timestamp);
        requestAnimationFrame(frame);
      } else {
        run.longTasks.push(...observer.takeRecords().map(({ startTime, duration }) => ({ startTime, duration })));
        observer.disconnect();
        document.removeEventListener('visibilitychange', checkVisibility);
        run.done = true;
      }
    }
    requestAnimationFrame(frame);
  };
}

function watch(page, errors, origin) {
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('requestfailed', request => errors.push(request.url() + ' ' + request.failure()?.errorText));
  page.on('response', response => {
    if (response.status() >= 400) errors.push(response.status() + ' ' + response.url());
    if (/^https?:/.test(response.url()) && new URL(response.url()).origin !== origin) errors.push('Off-origin ' + response.url());
  });
}

async function load(page, url, reload = false) {
  if (reload) await page.reload({ waitUntil: 'domcontentloaded' });
  else await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__foundationProfile.controllableMs !== null, null, { polling: 100, timeout: 60000 });
  return page.evaluate(() => {
    const { engineMs, firstFrameMs, entryReadyMs, controllableMs } = window.__foundationProfile;
    const timing = [performance.getEntriesByType('navigation')[0], ...performance.getEntriesByType('resource')];
    const resources = timing.filter(entry => entry.name.startsWith(location.origin + '/')).map(entry => ({
      path: new URL(entry.name).pathname, responseEndMs: entry.responseEnd,
      encodedBytes: entry.encodedBodySize, decodedBytes: entry.decodedBodySize, transferBytes: entry.transferSize,
    }));
    const canvas = document.querySelector('canvas');
    const gl = canvas.getContext('webgl2');
    const debug = gl.getExtension('WEBGL_debug_renderer_info');
    return {
      engineMs, firstFrameMs, entryReadyMs, controllableMs, resources,
      compressedBytes: resources.reduce((sum, entry) => sum + (entry.transferBytes ? entry.encodedBytes : 0), 0),
      wireBytes: resources.reduce((sum, entry) => sum + entry.transferBytes, 0),
      backend: canvas.dataset.renderer,
      gpu: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
      buffer: [gl.drawingBufferWidth, gl.drawingBufferHeight],
    };
  });
}

function frameStats(frames) {
  const durationMs = frames.at(-1) - frames[0];
  const intervals = frames.slice(1).map((time, i) => time - frames[i]);
  const ordered = [...intervals].sort((a, b) => a - b);
  const rounded = value => +value.toFixed(2);
  const percentile = fraction => rounded(ordered[Math.ceil(ordered.length * fraction) - 1]);
  return {
    frames: frames.length, durationMs: rounded(durationMs), fps: rounded(intervals.length * 1000 / durationMs),
    p50Ms: percentile(.5), p95Ms: percentile(.95), p99Ms: percentile(.99),
    maxMs: rounded(ordered.at(-1)), gapsOver50Ms: intervals.filter(ms => ms > 50).length,
  };
}

function rollingFrames(frames) {
  const counts = [];
  let left = 0, right = 0, consecutive = 0, longest = 0;
  for (let end = frames[0] + 1000; end <= frames.at(-1); end += 100) {
    while (frames[right + 1] <= end) right++;
    while (frames[left + 1] <= end - 1000) left++;
    const count = right - left;
    counts.push(count);
    consecutive = count < targets.renderFps ? consecutive + 1 : 0;
    longest = Math.max(longest, consecutive);
  }
  return {
    minFps: Math.min(...counts), longestBelow30Ms: longest * 100,
    samplesBelow30: counts.filter(count => count < targets.renderFps).length,
  };
}

async function walkTo(page, key, targetZ, direction) {
  await page.keyboard.down(key);
  try {
    await page.waitForFunction(({ targetZ, direction }) => {
      const player = window.__foundationProfile.app.root.findComponent('anim').entity;
      return direction * (player.getPosition().z - targetZ) > 0;
    }, { targetZ, direction }, { polling: 100, timeout: 12000 });
  } finally {
    await page.keyboard.up(key);
  }
}

async function sustain(page) {
  const caption = page.locator('#cue-caption');
  const cueCompletions = [];
  async function lap(record) {
    await walkTo(page, 'w', -.91, -1);
    await page.getByRole('button', { name: 'Inspect marker' }).waitFor({ timeout: 3000 });
    await page.keyboard.press('e');
    await caption.waitFor({ state: 'visible', timeout: 3000 });
    await caption.waitFor({ state: 'hidden', timeout: 10000 });
    if (record) cueCompletions.push(await page.evaluate(() => performance.now()));
    await walkTo(page, 's', 2.55, 1);
  }
  await lap(false);
  await page.evaluate(duration => window.__foundationProfile.startRun(duration), durationMs);
  while (!await page.evaluate(() => window.__foundationProfile.run.done === true)) await lap(true);
  const run = await page.evaluate(() => window.__foundationProfile.run);
  assert(!run.visibilityLost, 'Page was hidden during the timed run');
  const frames = run.frames.filter(time => time >= run.start);
  const callbacks = run.callbacks.filter(time => time >= run.start);
  return {
    requestedDurationMs: durationMs, completedCues: cueCompletions.filter(time => time <= run.end).length,
    render: frameStats(frames), browser: frameStats(callbacks), rolling: rollingFrames(frames),
    longTasks: run.longTasks.filter(task => task.startTime >= run.start && task.startTime < run.end),
    frameTimestampsMs: frames.map(time => +(time - run.start).toFixed(3)),
  };
}

async function checkRecovery(browser, url) {
  const context = await browser.newContext({ viewport });
  try {
    const page = await context.newPage();
    let blocked = true;
    await page.route('**/*.glb', route => blocked ? route.abort() : route.continue());
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.getByText('The courtyard could not be loaded. Try again.', { exact: true }).waitFor();
    blocked = false;
    await page.getByRole('button', { name: 'Retry' }).click();
    await page.getByRole('button', { name: 'Enter courtyard' }).click();
    assert.equal(await page.locator('canvas').getAttribute('data-renderer'), 'webgl2');

    const unavailable = await context.newPage();
    await unavailable.addInitScript(() => {
      const getContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type, ...args) {
        if (type === 'webgl2') return null;
        return getContext.call(this, type, ...args);
      };
    });
    await unavailable.goto(url, { waitUntil: 'domcontentloaded' });
    await unavailable.getByText('WebGL 2 is unavailable. Enable hardware acceleration or try another browser.', { exact: true }).waitFor();
    assert(await unavailable.getByRole('button', { name: 'Retry' }).isVisible());
    return { modelRetry: 'passed', unavailableWebGL2: 'passed' };
  } finally {
    await context.close();
  }
}

async function main() {
  await mkdir(path.dirname(output), { recursive: true });
  const { server, origin, manifest } = await makeServer();
  const url = origin + '/movement.html';
  const report = {
    build: { id: sha256(JSON.stringify(manifest)), files: manifest },
    machine: { cpu: os.cpus()[0].model, os: os.platform(), release: os.release(), viewport },
    method: 'Headless Chrome with fresh processes and profiles, loopback gzip, automatic Enter on readiness, PlayCanvas frameend sampling',
    targets, loads: [], errors: [],
  };
  try {
    for (let i = 0; i < 3; i++) {
      const browser = await chromium.launch({ channel: 'chrome' });
      try {
        report.machine.chrome = browser.version();
        const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
        watch(page, report.errors, origin);
        await page.addInitScript(installProbe);
        const cold = await load(page, url);
        const warm = await load(page, url, true);
        assert.equal(cold.backend, 'webgl2');
        assert.equal(warm.backend, 'webgl2');
        assert(cold.resources.every(entry => entry.transferBytes > 0 && entry.encodedBytes < entry.decodedBytes),
          'Cold resources must be gzip transfers');
        report.loads.push({ cold, warm });
        console.log(`Launch ${i + 1}: cold ${Math.round(cold.controllableMs)} ms, reload ${Math.round(warm.controllableMs)} ms, ${cold.compressedBytes} gzip bytes`);
      } finally {
        await browser.close();
      }
    }
    const browser = await chromium.launch({ channel: 'chrome' });
    try {
      const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
      const page = await context.newPage();
      watch(page, report.errors, origin);
      await page.addInitScript(installProbe);
      await load(page, url);
      console.log('Warming up the courtyard and sampling 45 seconds of walking and cue playback.');
      report.sustain = await sustain(page);
      await context.close();
      report.recovery = await checkRecovery(browser, url);
    } finally {
      await browser.close();
    }
    assert.deepEqual(report.errors, []);
    const median = values => [...values].sort((a, b) => a - b)[1];
    report.coldMedianMs = median(report.loads.map(run => run.cold.controllableMs));
    report.warmMedianMs = median(report.loads.map(run => run.warm.controllableMs));
    report.coldCompressedBytes = Math.max(...report.loads.map(run => run.cold.compressedBytes));
    report.gate = {
      startup: report.coldMedianMs <= targets.coldMedianMs,
      download: report.coldCompressedBytes <= targets.compressedBytes,
      framePacing: report.sustain.render.fps >= targets.renderFps && report.sustain.rolling.longestBelow30Ms <= 2000,
    };
    console.log(JSON.stringify({ render: report.sustain.render, browser: report.sustain.browser, rolling: report.sustain.rolling, gate: report.gate }));
  } catch (error) {
    report.failure = error.message;
    throw error;
  } finally {
    server.close();
    await writeFile(output, JSON.stringify(report, null, 2) + '\n');
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
