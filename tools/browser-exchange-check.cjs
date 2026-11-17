// node tools/browser-exchange-check.cjs <playwright module> [origin] [output] [all|desktop|portrait|portrait-marker]
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.argv[2] || 'playwright');

const origin = process.argv[3] || 'http://127.0.0.1:8064';
const output = path.resolve(process.argv[4] || 'build/q04/browser');
const mode = process.argv[5] || 'all';
const storyBuild = 'Q06-village-life-v1';
const report = { browser: '', checks: [], errors: [], frames: {} };
fs.mkdirSync(output, { recursive: true });

function check(condition, label, details) {
  report.checks.push({ label, passed: !!condition, details });
  assert(condition, `${label} ${JSON.stringify(details ?? '')}`);
}

async function open(browser, touch) {
  const name = touch ? 'portrait' : 'desktop';
  const viewport = touch ? { width: 390, height: 844 } : { width: 1280, height: 720 };
  const context = await browser.newContext({ viewport, hasTouch: touch, isMobile: touch, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  page.on('console', message => { if (message.type() === 'error') report.errors.push(message.text()); });
  page.on('pageerror', error => report.errors.push(error.message));
  page.on('requestfailed', request => report.errors.push(`${request.url()} ${request.failure()?.errorText}`));
  const state = () => page.evaluate(() => window.__bibleProof);
  const wait = async (predicate, label, timeout = 12000) => {
    const end = Date.now() + timeout;
    let latest;
    while (Date.now() < end) {
      latest = await state();
      if (latest && predicate(latest)) return latest;
      await page.waitForTimeout(70);
    }
    throw new Error(`Timed out waiting for ${name} ${label}: ${JSON.stringify(latest)}`);
  };
  const click = async button => {
    const [x, y, w, h] = (await state()).layout[button];
    if (touch) await page.touchscreen.tap(x + w / 2, y + h / 2);
    else await page.mouse.click(x + w / 2, y + h / 2);
  };
  const shot = async label => {
    report.frames[`${name}-${label}`] = await state();
    await page.screenshot({ path: path.join(output, `${name}-${label}.png`) });
  };
  const move = async (x, z) => {
    for (let attempt = 0; attempt < 26; attempt++) {
      const { player, walk_speed: speed } = await state();
      const dx = x - player[0], dz = z - player[2];
      if (Math.hypot(dx, dz) < .32) return;
      const sideways = Math.abs(dx) > Math.abs(dz);
      const amount = sideways ? dx : dz;
      const delay = Math.min(850, Math.max(130, Math.abs(amount) / speed * 1000));
      if (touch) {
        const finger = { x: 80, y: viewport.height - 88, id: 1 };
        const vector = Math.sign(amount) * 48;
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [finger] });
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [
          { ...finger, x: finger.x + (sideways ? vector : 0), y: finger.y + (sideways ? 0 : vector) }
        ] });
        await page.waitForTimeout(delay);
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      } else {
        const key = sideways ? (amount > 0 ? 'd' : 'a') : (amount > 0 ? 's' : 'w');
        await page.keyboard.down(key);
        await page.waitForTimeout(delay);
        await page.keyboard.up(key);
      }
      await page.waitForTimeout(370);
    }
    throw new Error(`${name} could not walk to (${x}, ${z}): ${JSON.stringify((await state()).player)}`);
  };
  const approachJesse = async () => {
    await move(0, 2.65);
    await wait(s => s.target === 'jesse', 'Speak prompt');
  };
  const approachTable = async () => {
    await move(0, .75);
    await move(1.95, .75);
    await wait(s => s.target === 'provisions', 'Take prompt');
  };

  await page.goto(`${origin}/?diagnostics=1`, { waitUntil: 'domcontentloaded' });
  const ready = await wait(s => s.mode === 'welcome', 'welcome', 55000);
  check(['Q04-village-v1', 'Q05-village-v1', storyBuild].includes(ready.build) && ready.jesse_animation.bones === 65,
    `${name} export uses clothed Jesse`);
  await click('primary');
  await wait(s => s.mode === 'game', 'entered village');
  return { name, touch, viewport, context, page, cdp, state, wait, click, shot, move, approachJesse, approachTable };
}

function sameEvents(state, events) {
  return JSON.stringify(state.story_events) === JSON.stringify(events);
}

async function normal(game, gate, skipConversation = false) {
  const { name, touch, viewport, page, state, wait, click, shot, move, approachJesse, approachTable } = game;
  await approachJesse();
  const start = await state();
  const cinematic = start.build === storyBuild;
  const checkExchangeFit = (state, size, label) => {
    const inside = ([x, y, w, h]) => x >= 0 && y >= 0 && x + w <= size.width + 1 && y + h <= size.height + 1;
    check(['exchange', 'exchange_pause', 'exchange_skip'].every(key => inside(state.layout[key])), label,
      state.layout.exchange);
  };
  await click('context');
  if (cinematic) {
    const intro = await wait(s => s.mode === 'exchange' && s.exchange.seconds >= .9, 'establishing shot');
    check(intro.exchange.shot === 'establish' && intro.exchange.line.includes('1000 BCE'), `${name} opens on the period and place`);
    await shot('establish');
  }
  const talk = await wait(s => s.mode === 'exchange' && s.exchange.seconds >= 2.4, 'greeting');
  check(talk.interaction.requests === 1 && !talk.interaction.active && talk.stage === 0,
    `${name} one Speak starts and reserves the exchange`);
  checkExchangeFit(talk, viewport, `${name} subtitle controls fit the viewport`);
  if (!touch && gate) await page.keyboard.down('w');
  await shot('greeting');
  if (skipConversation) {
    await click('exchange_skip');
  } else {
    await wait(s => s.exchange.seconds >= 8.7 && s.exchange.line.includes('Bring me news'), 'point and glance');
    await shot('point');
    await wait(s => s.exchange.seconds >= 13.45 && s.exchange.line.includes('I will, Father'), 'acknowledgement');
    await shot('nod');
    if (cinematic) {
      const yard = await wait(s => s.exchange.shot === 'yard' && s.exchange.seconds >= 17.55, 'yard cutaway');
      check(yard.exchange.line.includes('Mattan') && yard.stage === 0 && !yard.interaction.active,
        `${name} shows the authored yard beat before handing back control`);
      await shot('yard');
      if (touch) {
        for (const size of [{ width: 568, height: 320 }, { width: 320, height: 568 }, viewport]) {
          await page.setViewportSize(size);
          const resized = await wait(s => s.layout.view[0] === size.width && s.layout.view[1] === size.height, 'canvas resize');
          checkExchangeFit(resized, size, `Touch subtitles and controls fit ${size.width}×${size.height}`);
          if (size !== viewport) await shot(`yard-${size.width}x${size.height}`);
        }
      }
    }
  }
  const handedOff = await wait(s => s.mode === 'game' && s.stage === 1 && s.interaction.active, 'conversation handoff', 21000);
  check(sameEvents(handedOff, ['jesse_spoken']) && handedOff.exchange.bundle_visible
    && handedOff.exchange.contact_count === 0 && handedOff.interaction.requests === 1,
    `${name} talk hands back control and leaves Take separate`);
  check(Math.hypot(handedOff.player[0] - start.player[0], handedOff.player[2] - start.player[2]) < .07,
    `${name} David keeps his approach position through the conversation`);
  if (!touch && gate) {
    await page.waitForTimeout(440);
    const afterHold = await state();
    await page.keyboard.up('w');
    check(Math.hypot(afterHold.player[0] - start.player[0], afterHold.player[2] - start.player[2]) < .07,
      'Held movement during the scene does not leak into exploration');
  }

  if (start.build === 'Q05-village-v1' || cinematic) {
    await wait(s => s.camera.stage_mix < .02, 'camera returns to exploration');
    await shot('provisions-far');
  }

  await approachTable();
  const beforeTake = await state();
  if (start.build === 'Q05-village-v1' || cinematic) await shot('provisions-near');
  await click('context');
  const reach = await wait(s => s.exchange.phase === 'pickup' && s.exchange.seconds >= .35, 'reach');
  check(reach.stage === 1 && reach.animation.clip === 'pickup_provisions' && !reach.interaction.active,
    `${name} Take plays the reserved pickup while the objective waits`);
  await shot('reach');
  const lift = await wait(s => s.exchange.phase === 'pickup' && s.exchange.seconds >= 1.75, 'lift');
  check(lift.exchange.contact_count === 1 && lift.exchange.bundle_visible
    && lift.exchange.bundle[1] > beforeTake.exchange.bundle[1] + .05 && lift.stage === 1,
    `${name} contact attaches the same bundle and lifts it before progression`, lift.exchange);
  await shot('lift');
  const collected = await wait(s => s.mode === 'game' && s.stage === 2 && s.interaction.active, 'pickup handoff');
  check(!collected.exchange.bundle_visible && collected.interaction.targets.provisions.completions === 1
    && sameEvents(collected, ['jesse_spoken', 'provisions_collected']), `${name} stow advances the objective once`);
  if (gate) {
    await move(0, .75);
    await move(0, -13.0);
    await wait(s => s.target === 'gate', 'Leave prompt');
    await click('context');
    const complete = await wait(s => s.stage === 3 && s.mode === 'complete', 'gate completion');
    check(sameEvents(complete, ['jesse_spoken', 'provisions_collected', 'gate_reached']), `${name} completes the ordered village route`);
    await click('primary');
    const reset = await wait(s => s.stage === 0 && s.mode === 'game', 'restart after completion');
    check(reset.exchange.bundle_visible && reset.exchange.contact_count === 0, `${name} restart restores the bundle`);
  }
}

async function recovery(game) {
  const { page, cdp, context, state, wait, click, approachJesse, approachTable } = game;
  await approachJesse();
  await click('context');
  await wait(s => s.mode === 'exchange' && s.exchange.seconds >= 2.15, 'dialogue before focus loss');
  await cdp.send('Emulation.setFocusEmulationEnabled', { enabled: false });
  const other = await context.newPage();
  await other.goto('about:blank');
  await other.bringToFront();
  await page.waitForTimeout(350);
  await page.bringToFront();
  const paused = await wait(s => s.mode === 'pause' && s.paused, 'focus-loss pause');
  await page.waitForTimeout(550);
  const held = await state();
  check(held.exchange.seconds === paused.exchange.seconds && held.exchange.line === paused.exchange.line,
    'Focus loss freezes the current beat');
  await other.close();
  await click('primary');
  await wait(s => s.mode === 'exchange' && s.exchange.seconds > held.exchange.seconds, 'resume same beat');
  await click('exchange_skip');
  const skipped = await wait(s => s.mode === 'game' && s.stage === 1, 'skip handoff');
  check(sameEvents(skipped, ['jesse_spoken']), 'Skip accepts the first objective once');
  await wait(s => s.target === 'jesse' && s.context.text.includes('Replay'), 'replay prompt');
  await page.waitForTimeout(370);
  await click('context');
  await wait(s => s.mode === 'exchange', 'replay');
  await click('exchange_skip');
  check(sameEvents(await wait(s => s.mode === 'game', 'replay handoff'), ['jesse_spoken']), 'Replay preserves progress');

  for (const afterContact of [false, true]) {
    if (afterContact) {
      await approachJesse();
      await click('context');
      await wait(s => s.mode === 'exchange', 'second conversation');
      await click('exchange_skip');
      await wait(s => s.mode === 'game' && s.stage === 1, 'second skip');
    }
    await approachTable();
    await click('context');
    await wait(s => s.exchange.phase === 'pickup' && (afterContact ? s.exchange.attached : s.exchange.seconds >= .05), 'interrupted pickup');
    await click('exchange_pause');
    const frozen = await wait(s => s.mode === 'pause', 'pickup pause');
    check(frozen.exchange.attached === afterContact && frozen.stage === 1, `Pause ${afterContact ? 'after' : 'before'} contact preserves the pending pickup`);
    await page.waitForTimeout(350);
    check((await state()).exchange.seconds === frozen.exchange.seconds, 'Pickup clock freezes while paused');
    await click('secondary');
    const restored = await wait(s => s.mode === 'game' && s.stage === 0, 'restart during pickup');
    check(restored.exchange.bundle_visible && restored.exchange.contact_count === 0 && sameEvents(restored, []),
      `Restart ${afterContact ? 'after' : 'before'} contact restores a fresh bundle and objective`);
  }
}

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    report.browser = browser.version();
    assert(['all', 'desktop', 'portrait', 'portrait-marker'].includes(mode));
    if (mode === 'all' || mode === 'desktop') {
      const desktop = await open(browser, false);
      await normal(desktop, true);
      await recovery(desktop);
      await desktop.context.close();
    }
    if (mode !== 'desktop') {
      const portrait = await open(browser, true);
      await normal(portrait, (await portrait.state()).build === storyBuild && mode !== 'portrait-marker', mode === 'portrait-marker');
      await portrait.context.close();
    }
    check(report.errors.length === 0, 'No browser errors', report.errors);
    report.result = 'passed';
  } finally {
    await browser.close();
  }
})().catch(error => {
  report.result = 'failed';
  report.failure = error.stack;
  process.exitCode = 1;
}).finally(() => {
  fs.writeFileSync(path.join(output, 'exchange-review.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ result: report.result, checks: report.checks.length, errors: report.errors, failure: report.failure }));
});
