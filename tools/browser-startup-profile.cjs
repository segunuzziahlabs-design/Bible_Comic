// node tools/browser-startup-profile.cjs <playwright> <origin> <new-report.json>
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.argv[2] || 'playwright');
const origin = new URL(process.argv[3]).origin;
const output = path.resolve(process.argv[4]);

function instrumentStartup() {
  const events = [];
  const calls = {};
  const tasks = [];
  const shaders = new WeakMap();
  const programs = new WeakMap();
  window.__startupProfile = { events, calls, tasks };
  const observer = new PerformanceObserver(list => {
    for (const entry of list.getEntries()) tasks.push([entry.startTime, entry.duration]);
  });
  observer.observe({ type: 'longtask', buffered: true });
  function wrap(target, name, label, async = false) {
    const original = target?.[name];
    if (!original) return;
    target[name] = function (...args) {
      if (window.__proofLoading?.ready) return original.apply(this, args);
      if (name === 'shaderSource') {
        const [, source] = args;
        shaders.set(args[0], { bytes: source.length, defines: source.split('\n').slice(0, 40)
          .filter(line => line.startsWith('#define')) });
      } else if (name === 'attachShader') {
        const sources = programs.get(args[0]) || [];
        sources.push(shaders.get(args[1]));
        programs.set(args[0], sources);
      }
      const start = performance.now();
      const method = calls[label] ||= { count: 0, totalMs: 0, maxMs: 0 };
      method.count++;
      const record = () => {
        const ms = performance.now() - start;
        method.totalMs += ms;
        method.maxMs = Math.max(method.maxMs, ms);
        if (async || ms >= 10 || label === 'canvas.getContext') events.push({ label, start, ms,
          parameter: name === 'getProgramParameter' ? args[1] : undefined,
          sources: name === 'getProgramParameter' ? programs.get(args[0]) : undefined });
      };
      let result;
      try {
        result = original.apply(this, args);
      } catch (error) {
        record();
        throw error;
      }
      if (async) result.then(record, record);
      else record();
      return result;
    };
  }
  for (const name of ['instantiateStreaming', 'instantiate', 'compileStreaming', 'compile']) {
    wrap(WebAssembly, name, `wasm.${name}`, true);
  }
  wrap(HTMLCanvasElement.prototype, 'getContext', 'canvas.getContext');
  for (const name of ['shaderSource', 'attachShader', 'compileShader', 'linkProgram', 'getProgramParameter', 'getShaderParameter',
    'getUniformLocation', 'getUniformBlockIndex', 'getProgramInfoLog', 'getError', 'bufferData', 'texImage2D',
    'texImage3D', 'texStorage2D', 'texStorage3D', 'compressedTexImage2D', 'readPixels', 'finish', 'drawArrays',
    'drawElements', 'getParameter']) {
    wrap(window.WebGL2RenderingContext?.prototype, name, `gl.${name}`);
  }
  wrap(window.AudioWorklet?.prototype, 'addModule', 'audio.addModule', true);
  wrap(window.AudioContext?.prototype, 'resume', 'audio.resume', true);
}

async function run() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const report = { origin, browser: browser.version(), runs: [], errors: [] };
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 810 }, deviceScaleFactor: 1 });
    await page.addInitScript(instrumentStartup);
    page.on('console', message => { if (message.type() === 'error') report.errors.push(message.text()); });
    page.on('pageerror', error => report.errors.push(error.message));
    for (const reload of [false, true]) {
      if (reload) await page.reload({ waitUntil: 'domcontentloaded' });
      else await page.goto(`${origin}/`, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => window.__proofLoading?.ready || window.__proofLoading?.error, null,
        { polling: 100, timeout: 120000 });
      const sample = await page.evaluate(() => ({
        readyMs: window.__proofLoading.startedAt + window.__proofLoading.readyMs,
        error: window.__proofLoading.error,
        ...window.__startupProfile,
        resources: performance.getEntriesByType('resource').map(entry => ({
          name: new URL(entry.name).pathname, start: entry.startTime, end: entry.responseEnd,
          transferSize: entry.transferSize,
        })),
      }));
      assert(!sample.error && sample.readyMs > 0, 'Game did not start');
      report.runs.push({ reload, ...sample });
      console.log(JSON.stringify({ reload, readyMs: sample.readyMs,
        longestCalls: Object.entries(sample.calls).sort((a, b) => b[1].totalMs - a[1].totalMs).slice(0, 6),
        tasks: sample.tasks }));
    }
    assert.deepEqual(report.errors, []);
  } finally {
    await browser.close();
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
  }
}

run().catch(error => { console.error(error); process.exitCode = 1; });
