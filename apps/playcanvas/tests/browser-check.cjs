// Run against a local production preview: node tests/browser-check.cjs <url> <playwright-module> <output-dir>
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { mkdir, readFile, writeFile } = require('node:fs/promises');
const path = require('node:path');
const [url = 'http://127.0.0.1:4173/', playwright = 'playwright', output = '../../build/pc01-evidence'] = process.argv.slice(2);
const { chromium } = require(playwright);
const origin = new URL(url).origin;
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const glbRequest = /\/david-[^/]+\.glb(?:\?.*)?$/;

async function main() {
  await mkdir(output, { recursive: true });
  const browser = await chromium.launch({ channel: 'chrome' });
  const errors = [], failures = [], outbound = [];
  const report = { browser: browser.version(), origin, captures: {} };
  try {
    const context = await browser.newContext({ viewport: { width: 1328, height: 1045 }, deviceScaleFactor: 1 });
    const mobile = await browser.newContext({
      viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true,
    });
    for (const ctx of [context, mobile]) {
      await ctx.route('**/*', route => {
        const target = route.request().url();
        if (new URL(target).origin === origin) return route.continue();
        outbound.push(target);
        return route.abort();
      });
    }

    function watch(page) {
      page.on('pageerror', error => errors.push(error.message));
      page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
      page.on('requestfailed', request => failures.push(request.url()));
      page.on('response', response => { if (response.status() >= 400) failures.push(response.url()); });
    }

    const enter = page => page.getByRole('button', { name: 'Enter preview' });
    const action = (page, name) => page.getByRole('button', { name, exact: true });
    const stage = page => page.locator('canvas');
    async function capture(page, filename) {
      const bytes = await page.screenshot({ path: path.join(output, filename + '.png'), scale: 'css' });
      report.captures[filename] = sha256(bytes);
    }

    const desktop = await context.newPage();
    watch(desktop);
    const assetResponse = desktop.waitForResponse(response => glbRequest.test(response.url()));
    await desktop.goto(url);
    const response = await assetResponse;
    assert(response.ok());
    const bytes = await response.body();
    const modelHash = sha256(await readFile(path.join(__dirname, '../src/assets/david.glb')));
    assert.equal(sha256(bytes), modelHash);
    const glb = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString('utf8'));
    assert.equal(glb.skins[0].joints.length, 65);
    assert.deepEqual(glb.animations.map(clip => clip.name).sort(), [
      'acknowledge', 'idle_relaxed', 'listen', 'listen_to_provisions', 'pickup_provisions', 'sling_throw', 'walk_forward',
    ]);
    const shapes = glb.meshes.flatMap(mesh => mesh.extras?.targetNames ?? []);
    assert(shapes.includes('FullerHair'));
    report.model = { bytes: bytes.length, sha256: modelHash, joints: glb.skins[0].joints.length,
      clips: glb.animations.map(clip => clip.name), shapes };
    await enter(desktop).click();
    const graphics = await stage(desktop).evaluate(canvas => {
      const gl = canvas.getContext('webgl2');
      const debug = gl?.getExtension('WEBGL_debug_renderer_info');
      return { backend: canvas.dataset.renderer, webgl2: gl instanceof WebGL2RenderingContext,
        renderer: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : null };
    });
    assert.equal(graphics.backend, 'webgl2');
    assert(graphics.webgl2);
    report.graphics = graphics;
    assert(await action(desktop, 'Walk').evaluate(button => button === document.activeElement));

    for (const [key, label, delay] of [['walk', 'Walk', 220], ['acknowledge', 'Acknowledge', 420]]) {
      await action(desktop, label).press('Enter');
      const a = sha256(await stage(desktop).screenshot());
      await desktop.waitForTimeout(delay);
      const b = sha256(await stage(desktop).screenshot());
      assert.notEqual(a, b, label + ' must visibly change between rendered frames');
      await action(desktop, 'Reference pose').press('Enter');
      assert.equal(await action(desktop, 'Reference pose').getAttribute('aria-pressed'), 'true');
      await desktop.waitForTimeout(120);
      const held = sha256(await stage(desktop).screenshot());
      await desktop.waitForTimeout(260);
      assert.equal(sha256(await stage(desktop).screenshot()), held, label + ' reference pose must stay fixed');
      await capture(desktop, 'desktop-' + key);
    }
    await action(desktop, 'Reference pose').click();
    assert.equal(await action(desktop, 'Reference pose').getAttribute('aria-pressed'), 'false');
    report.desktopPlayback = 'Both animations change between rendered frames, then hold a fixed reference pose';

    async function posePixels(page) {
      await page.waitForTimeout(150);
      return sha256(await stage(page).screenshot());
    }
    await action(desktop, 'Customize').click();
    const defaultLook = await posePixels(desktop);
    let lastLook = defaultLook;
    const preferences = {
      'Skin tone': 'deep',
      'Hairstyle': 'full',
      'Hair colour': 'chestnut',
      'Tunic colour': 'clay',
    };
    for (const [field, value] of Object.entries(preferences)) {
      await desktop.getByLabel(field, { exact: true }).selectOption(value);
      const newLook = await posePixels(desktop);
      assert.notEqual(newLook, lastLook, field + ' must visibly change David at a fixed pose');
      lastLook = newLook;
    }
    await capture(desktop, 'desktop-custom-look');
    await action(desktop, 'Walk').click();
    await action(desktop, 'Reference pose').click();
    await action(desktop, 'Acknowledge').click();
    await action(desktop, 'Reference pose').click();
    assert.equal(await posePixels(desktop), lastLook, 'Changing animation must preserve the chosen appearance');
    await desktop.reload();
    await enter(desktop).click();
    await action(desktop, 'Customize').click();
    for (const [field, value] of Object.entries(preferences)) {
      assert.equal(await desktop.getByLabel(field, { exact: true }).inputValue(), value);
    }
    assert.equal(await posePixels(desktop), lastLook, 'Saved appearance must render after reload');
    await action(desktop, 'Reset look').click();
    assert.equal(await posePixels(desktop), defaultLook, 'Reset must restore the original model appearance');
    report.appearance = 'All four choices changed the rendered model, persisted after reload and reset to default';

    const phone = await mobile.newPage();
    watch(phone);
    await phone.goto(url);
    await enter(phone).tap();
    report.emulatedTouch = [];
    for (const [width, height, label] of [[390, 844, 'portrait'], [568, 320, 'landscape'], [320, 568, 'narrow']]) {
      await phone.setViewportSize({ width, height });
      for (const [key, name] of [['walk', 'Walk'], ['acknowledge', 'Acknowledge']]) {
        await action(phone, name).tap();
        await action(phone, 'Reference pose').tap();
        await phone.waitForTimeout(120);
        const layout = await phone.evaluate(() => {
          const canvas = document.querySelector('canvas');
          return {
            horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
            verticalOverflow: document.documentElement.scrollHeight > innerHeight,
            buttonHeight: Math.min(...Array.from(document.querySelectorAll('.actions button'), button => button.offsetHeight)),
            resolution: [canvas.width, canvas.height],
          };
        });
        assert(!layout.horizontalOverflow && !layout.verticalOverflow, label + ' controls must fit: ' + JSON.stringify(layout));
        assert(layout.buttonHeight >= 44);
        if (label !== 'narrow' || key === 'walk') await capture(phone, label + '-' + key);
        report.emulatedTouch.push({ width, height, action: key, ...layout });
      }
    }
    for (const [width, height, orientation] of [[390, 844, 'portrait'], [568, 320, 'landscape']]) {
      await phone.setViewportSize({ width, height });
      await action(phone, 'Customize').tap();
      await phone.getByLabel('Hairstyle', { exact: true }).selectOption('full');
      await phone.getByLabel('Tunic colour', { exact: true }).selectOption('linen');
      assert(await phone.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await capture(phone, orientation + '-custom-look');
      await action(phone, 'Done').tap();
      assert(await action(phone, 'Walk').isEnabled());
    }
    assert.deepEqual(errors, []);
    assert.deepEqual(failures, []);
    assert.deepEqual(outbound, []);
    report.normalRun = { errors, failures, outbound };

    const retry = await context.newPage();
    let blocked = 0;
    await retry.route(glbRequest, route => {
      blocked++;
      return route.abort();
    });
    await retry.goto(url);
    await retry.getByText('David could not be loaded.', { exact: false }).waitFor();
    assert(blocked > 0);
    await retry.unroute(glbRequest);
    await action(retry, 'Retry').click();
    await enter(retry).click();
    assert(await action(retry, 'Walk').isEnabled());
    report.assetRetry = 'Passed with GLB request deliberately blocked, then restored';

    const noWebgl = await context.newPage();
    await noWebgl.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type, ...args) {
        return type === 'webgl2' ? null : original.call(this, type, ...args);
      };
    });
    await noWebgl.goto(url);
    await noWebgl.getByText('WebGL 2 is unavailable.', { exact: false }).waitFor();
    assert(await action(noWebgl, 'Retry').isVisible());
    assert(await action(noWebgl, 'Walk').isDisabled());
    report.noWebgl2 = 'Passed with WebGL 2 deliberately disabled';
    await writeFile(path.join(output, 'results.json'), JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify(report, null, 2));
  } finally {
    await browser.close();
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
