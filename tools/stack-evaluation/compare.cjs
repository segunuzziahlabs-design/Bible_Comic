// node tools/stack-evaluation/compare.cjs <playwright-module> [build-dir] [--smoke] [--unity | --engine=unity]
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { readFileSync, readdirSync, mkdirSync, writeFileSync } = require('node:fs');
const { createServer } = require('node:http');
const path = require('node:path');
const { gzipSync } = require('node:zlib');
const { chromium } = require(process.argv[2] || 'playwright');

const root = path.resolve(process.argv.slice(3).find(value => !value.startsWith('--')) || 'build/stack-evaluation/matched');
const smoke = process.argv.includes('--smoke');
const selected = process.argv.find(value => value.startsWith('--engine='))?.split('=')[1];
const includeUnity = process.argv.includes('--unity');
assert(!selected || ['godot', 'playcanvas', 'unity'].includes(selected), 'Unknown engine');
const suffix = selected ? '-' + selected : includeUnity ? '-with-unity' : '';
const evidence = path.join(root, (smoke ? 'smoke' : 'results') + suffix);
mkdirSync(evidence, { recursive: true });
const engines = selected ? [selected] : includeUnity ? ['godot', 'playcanvas', 'unity'] : ['godot', 'playcanvas'];
const desktop = { width: 1280, height: 720 };
const mobile = { width: 390, height: 844 };
const seconds = smoke ? 2 : 45;
const types = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.html': 'text/html',
    '.wasm': 'application/wasm', '.glb': 'model/gltf-binary', '.png': 'image/png' };
const hash = data => createHash('sha256').update(data).digest('hex');
const files = new Map();
for (const engine of engines) {
    const directory = path.join(root, 'web', engine);
    for (const entry of readdirSync(directory, { withFileTypes: true, recursive: true })) {
        if (!entry.isFile()) continue;
        const file = path.join(entry.parentPath, entry.name);
        const name = path.relative(directory, file).split(path.sep).join('/');
        const data = readFileSync(file);
        const type = types[path.extname(name)] || 'application/octet-stream';
        files.set('/' + engine + '/' + name, { gzip: gzipSync(data), type, hash: hash(data) });
    }
}

const server = createServer((request, response) => {
    const url = new URL(request.url, 'http://127.0.0.1');
    const pathname = url.pathname.endsWith('/') ? url.pathname + 'index.html' : url.pathname;
    const file = files.get(pathname);
    if (!file) {
        response.writeHead(url.pathname === '/favicon.ico' ? 204 : 404).end();
        return;
    }
    response.writeHead(200, { 'Content-Type': file.type, 'Content-Encoding': 'gzip',
        'Cache-Control': file.type === 'text/html' ? 'no-store' : 'public, max-age=3600',
        'Content-Length': file.gzip.length });
    response.end(file.gzip);
});
const asset = readFileSync(path.join(root, 'david.glb'));
const gltf = JSON.parse(asset.toString('utf8', 20, 20 + asset.readUInt32LE(12)));
const assetInfo = {
    sha256: hash(asset), bytes: asset.length, joints: gltf.skins.map(skin => skin.joints.length),
    triangles: gltf.meshes.flatMap(mesh => mesh.primitives).reduce((sum, p) => sum + gltf.accessors[p.indices].count / 3, 0),
    primitives: gltf.meshes.flatMap(mesh => mesh.primitives).length,
    uvPrimitives: gltf.meshes.flatMap(mesh => mesh.primitives).filter(p => p.attributes.TEXCOORD_0 !== undefined).length,
    clips: gltf.animations.map(clip => clip.name),
    morphs: gltf.meshes.flatMap(mesh => mesh.extras?.targetNames || []),
    materials: gltf.materials.map(mat => ({ name: mat.name, normalMap: !!mat.normalTexture,
        baseColorMap: !!mat.pbrMetallicRoughness?.baseColorTexture, roughness: mat.pbrMetallicRoughness?.roughnessFactor ?? 1 })),
    images: gltf.images.length,
};
if (engines.includes('playcanvas')) assert.equal(files.get('/playcanvas/david.glb').hash, assetInfo.sha256);
if (engines.includes('godot')) assert.equal(hash(readFileSync(path.join(root, 'godot-project/david.glb'))), assetInfo.sha256);
if (engines.includes('unity')) assert.equal(hash(readFileSync(path.join(root, 'unity-project/Assets/David.glb'))), assetInfo.sha256);
const report = { date: new Date().toISOString(), asset: assetInfo,
    method: 'Headless Chrome WebGL 2, localhost gzip, fresh browser process per cold/warm pair, 1 render pixel per CSS pixel',
    build: Object.fromEntries([...files].map(([name, file]) => [name, { gzipBytes: file.gzip.length, sha256: file.hash }])),
    results: Object.fromEntries(engines.map(engine => [engine, { loads: [], checks: [], errors: [] }])) };

function summary(data) {
    const values = [...data].sort((a, b) => a - b);
    const at = p => +values[Math.max(0, Math.ceil(values.length * p) - 1)].toFixed(2);
    return values.length ? { p50: at(.5), p95: at(.95), p99: at(.99), max: at(1) } : null;
}

function watch(page, result) {
    function error(message) {
        result.errors.push(message);
        if (smoke) console.error(message);
    }
    page.on('pageerror', value => error(value.message));
    page.on('console', msg => { if (msg.type() === 'error') error(msg.text()); });
    page.on('requestfailed', req => result.errors.push(req.failure()?.errorText + ' ' + new URL(req.url()).pathname));
}

async function load(page, url, warm = false) {
    if (warm) await page.reload({ waitUntil: 'domcontentloaded' });
    else await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.stackTest?.ready || window.stackTest?.error, null, { timeout: 90000, polling: 100 });
    return page.evaluate(() => {
        if (window.stackTest.error) throw Error(window.stackTest.error);
        const navigation = performance.getEntriesByType('navigation')[0];
        const resources = [navigation, ...performance.getEntriesByType('resource')];
        const gl = document.querySelector('canvas').getContext('webgl2');
        const extension = gl.getExtension('WEBGL_debug_renderer_info');
        return { readyMs: window.stackTest.readyMs, engine: window.stackTest.engine, backend: window.stackTest.backend,
            gpu: extension ? gl.getParameter(extension.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
            clips: window.stackTest.clips, morphs: window.stackTest.morphs,
            resources: resources.map(entry => ({ name: new URL(entry.name).pathname, encoded: entry.encodedBodySize,
                transfer: entry.transferSize, time: entry.duration })),
            encoded: resources.reduce((total, entry) => total + entry.encodedBodySize, 0),
            transferredEncoded: resources.reduce((total, entry) => total + (entry.transferSize ? entry.encodedBodySize : 0), 0) };
    });
}

async function layout(page) {
    return page.evaluate(() => {
        const rect = element => {
            const { x, y, width, height } = element.getBoundingClientRect();
            return [x, y, width, height];
        };
        const canvas = document.querySelector('canvas');
        const gl = canvas.getContext('webgl2');
        return { viewport: [innerWidth, innerHeight], scroll: [document.documentElement.scrollWidth,
            document.documentElement.scrollHeight], canvas: rect(canvas), buffer: [gl.drawingBufferWidth, gl.drawingBufferHeight],
            buttons: Array.from(document.querySelectorAll('button'), rect), dpr: devicePixelRatio };
    });
}

function checkLayout(current) {
    const [width, height] = current.viewport;
    assert.deepEqual(current.scroll, current.viewport, 'Unexpected page scrolling');
    assert.deepEqual(current.buffer, current.canvas.slice(2).map(Math.round), 'Expected matched render resolution');
    for (const [x, y, w, h] of current.buttons) {
        assert(x >= 0 && y >= 0 && x + w <= width + .01 && y + h <= height + .01 && h >= 44 && w >= 44,
            'Control out of view or below 44px touch size');
    }
}

const snapshot = page => page.evaluate(() => {
    const state = window.stack.snapshot();
    return state ?? JSON.parse(window.stackTest.enginePose);
});
const pose = page => page.evaluate(() => window.stackTest.pose);

async function still(page, engine, label, args) {
    await page.evaluate(values => window.stack.still(...values), args);
    await page.waitForFunction(({ clip, time, faces }) => {
        const raw = window.stack.snapshot();
        const state = raw ?? JSON.parse(window.stackTest.enginePose);
        return state.clip === clip && Math.abs(state.seconds - time) < .055 &&
            ['Blink', 'BrowLift', 'Smile'].every((key, i) => Math.abs(state.faces[key] - (faces[i] || 0)) < .02);
    }, { clip: args[0], time: args[1], faces: args.slice(3) });
    const actual = await snapshot(page);
    for (let index = 0; index < 3; index++) {
        const key = ['Blink', 'BrowLift', 'Smile'][index];
        assert(Math.abs(actual.faces[key] - (args[index + 3] || 0)) < .02, 'Facial weight ' + key);
    }
    await page.screenshot({ path: path.join(evidence, engine + '-' + label + '.png') });
    return actual;
}

async function verify(browser, engine, origin, result) {
    const url = origin + '/' + engine + '/';
    const context = await browser.newContext({ viewport: desktop, deviceScaleFactor: 1 });
    const page = await context.newPage();
    watch(page, result);
    const configuration = await load(page, url);
    assert.equal(configuration.backend, 'webgl2');
    for (const clip of assetInfo.clips) assert(configuration.clips.includes(clip), 'Missing clip ' + clip);
    const wide = await still(page, engine, 'wide', ['walk_forward', .42, true]);
    const face = await still(page, engine, 'face', ['acknowledge', .58, false, 0, .7, .75]);
    await still(page, engine, 'blink', ['acknowledge', .58, false, 1, .7, .75]);
    checkLayout(await layout(page));
    await page.keyboard.press('Space');
    await page.waitForFunction(() => window.stackTest.pose.clip === 'walk_forward');
    await page.keyboard.press('KeyP');
    await page.waitForFunction(() => window.stackTest.pose.paused);
    const paused = await pose(page);
    const pausedTime = (await snapshot(page)).seconds;
    await page.waitForTimeout(350);
    assert.equal((await pose(page)).t, paused.t);
    assert(Math.abs((await snapshot(page)).seconds - pausedTime) < .06, 'Engine playback advanced during pause');
    await page.keyboard.press('KeyP');
    await page.waitForFunction(() => window.stackTest.finished === 1);
    result.checks.push({ desktop: await layout(page), wide, face, keyboardCueAndPause: true });
    await context.close();

    const touch = await browser.newContext({ viewport: mobile, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
    const phone = await touch.newPage();
    watch(phone, result);
    await load(phone, url);
    const portrait = await layout(phone);
    checkLayout(portrait);
    await still(phone, engine, 'portrait', ['acknowledge', .58, false, 0, .7, .75]);
    await still(phone, engine, 'portrait-wide', ['walk_forward', .42, true]);
    await phone.locator('#run').tap();
    await phone.waitForFunction(() => window.stackTest.pose.t > .2);
    const take = (await pose(phone)).take;
    await phone.setViewportSize({ width: 568, height: 320 });
    await phone.waitForFunction(() => {
        const canvas = document.querySelector('canvas');
        return canvas.clientWidth === 568 && canvas.width === canvas.clientWidth && canvas.height === canvas.clientHeight;
    });
    const landscape = await layout(phone);
    checkLayout(landscape);
    assert.equal((await pose(phone)).take, take);
    await phone.locator('#pause').tap();
    await phone.waitForFunction(() => window.stackTest.pose.paused);
    await phone.locator('#pause').tap();
    await phone.waitForFunction(() => window.stackTest.finished === 1);
    await still(phone, engine, 'landscape', ['walk_forward', .42, true]);
    await still(phone, engine, 'landscape-close', ['acknowledge', .58, false, 0, .7, .75]);
    await phone.setViewportSize({ width: 320, height: 568 });
    await phone.waitForFunction(() => document.querySelector('canvas').width === 320);
    const compact = await layout(phone);
    checkLayout(compact);
    result.checks.push({ portrait, landscape, compact, touchCueOrientationPause: true });
    await touch.close();
}

async function sustain(browser, engine, origin, result) {
    const context = await browser.newContext({ viewport: desktop, deviceScaleFactor: 1 });
    const page = await context.newPage();
    watch(page, result);
    await load(page, origin + '/' + engine + '/?loop=1');
    await page.waitForFunction(() => window.stackTest.finished >= 1, null, { timeout: 25000 });
    result.sustain = await page.evaluate(duration => new Promise(resolve => {
        const timestamps = [], counts = [], tasks = [];
        const observer = new PerformanceObserver(list => tasks.push(...list.getEntries().map(e => e.duration)));
        observer.observe({ type: 'longtask' });
        const start = performance.now();
        const initialCues = window.stackTest.finished;
        function frame(time) {
            timestamps.push(time);
            counts.push(window.stackTest.renders);
            if (time - start < duration) {
                requestAnimationFrame(frame);
                return;
            }
            tasks.push(...observer.takeRecords().map(e => e.duration));
            observer.disconnect();
            resolve({ timestamps, counts, tasks, hidden: document.hidden, cues: window.stackTest.finished - initialCues });
        }
        requestAnimationFrame(frame);
    }), seconds * 1000).then(({ timestamps, counts, tasks, hidden, cues }) => {
        const intervals = timestamps.slice(1).map((time, i) => time - timestamps[i]);
        const span = timestamps.at(-1) - timestamps[0];
        const renderFrames = counts.at(-1) - counts[0];
        const rolling = [];
        let left = 0, right = 0;
        for (let end = timestamps[0] + 1000; end <= timestamps.at(-1); end += 100) {
            while (timestamps[right + 1] <= end) right++;
            while (timestamps[left + 1] <= end - 1000) left++;
            rolling.push(counts[right] - counts[left]);
        }
        return { durationMs: span, callbackFps: +(intervals.length * 1000 / span).toFixed(2),
            renderFps: +(renderFrames * 1000 / span).toFixed(2), renderFrames, callbackMs: summary(intervals),
            stallsOver50: intervals.filter(ms => ms > 50).length, longTasks: tasks, hidden, cues,
            minimumRollingRenderedFps: Math.min(...rolling), rollingSamplesBelow30: rolling.filter(fps => fps < 30).length };
    });
    assert(!result.sustain.hidden, 'Background tab invalidated frame timing');
    await context.close();
}

async function main() {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const origin = 'http://127.0.0.1:' + server.address().port;
    for (let run = 0; run < (smoke ? 0 : 3); run++) {
        for (const engine of run % 2 ? [...engines].reverse() : engines) {
            const browser = await chromium.launch({ channel: 'chrome' });
            try {
                report.browser = browser.version();
                const page = await browser.newPage({ viewport: desktop, deviceScaleFactor: 1 });
                const result = report.results[engine];
                watch(page, result);
                const url = origin + '/' + engine + '/';
                const cold = await load(page, url);
                const warm = await load(page, url, true);
                result.loads.push({ cold, warm });
                console.log(engine, 'load', run + 1, Math.round(cold.readyMs), Math.round(warm.readyMs));
            } finally {
                await browser.close();
            }
        }
    }
    for (const engine of engines) {
        const browser = await chromium.launch({ channel: 'chrome' });
        try {
            report.browser = browser.version();
            const result = report.results[engine];
            console.log(engine, 'checking visuals and controls');
            await verify(browser, engine, origin, result);
            console.log(engine, 'measuring', seconds, 'seconds');
            await sustain(browser, engine, origin, result);
            assert.deepEqual(result.errors, []);
        } finally {
            await browser.close();
        }
    }
}

main().catch(error => {
    report.failure = error.stack;
    console.error(error);
    process.exitCode = 1;
}).finally(() => {
    writeFileSync(path.join(evidence, 'comparison.json'), JSON.stringify(report, null, 2) + '\n');
    server.close();
});
