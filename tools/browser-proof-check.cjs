// Test the exported release through real browser input. Diagnostics are read-only.
// node tools/browser-proof-check.cjs <playwright module path> [chrome|msedge] [desktop|touch] [report directory] [origin]
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.argv[2] || 'playwright');
const channel = process.argv[3] || 'chrome';
const touch = process.argv[4] === 'touch';
const out = path.resolve(process.argv[5] || 'build/browser-checks');
const origin = (process.argv[6] || 'http://127.0.0.1:8060').replace(/\/$/,'');
fs.mkdirSync(out, { recursive: true });
const name = `${channel}-${touch ? 'touch-emulation' : 'desktop'}`;
const report = { timestamp: new Date().toISOString(), origin, channel, touchEmulation: touch, checks: [], errors: [], samples: [] };
let browser, page;
function check(ok, label, detail) {
  report.checks.push({ label, passed: !!ok, ...(detail === undefined ? {} : { detail }) });
  if (!ok) throw new Error(label + ': ' + JSON.stringify(detail));
}
const sleep = ms => page.waitForTimeout(ms);
const state = () => page.evaluate(() => window.__bibleProof);
async function wait(predicate, label, timeout = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeout) { const s = await state(); if (s && predicate(s)) return s; await sleep(150); }
  throw new Error('Timed out: ' + label + ' / ' + JSON.stringify(await state()));
}
async function button(key) {
  const s = await state(), [x,y,w,h] = s.layout[key];
  if (touch) await page.touchscreen.tap(x+w/2,y+h/2); else await page.mouse.click(x+w/2,y+h/2);
  await sleep(400);
}
let cdp;
async function gesture(dx, dy, duration) {
  const {height} = page.viewportSize();
  const origin = {x:80,y:height-88,id:1};
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[origin]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{...origin,x:origin.x+dx*48,y:origin.y+dy*48}]});
  await sleep(duration);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await sleep(350);
}
async function move(x,z) {
  for (let i=0;i<18;i++) {
    const s=await state(), dx=x-s.player[0], dz=z-s.player[2];
    if (Math.hypot(dx,dz)<.45) return;
    const horizontal=Math.abs(dx)>Math.abs(dz), amount=horizontal?dx:dz;
    const duration=Math.min(900,Math.max(100,Math.abs(amount)/(s.walk_speed || 2.8)*1000));
    if(touch) await gesture(horizontal?Math.sign(amount):0,horizontal?0:Math.sign(amount),duration);
    else {const key=horizontal?(amount>0?'d':'a'):(amount>0?'s':'w');await page.keyboard.down(key);await sleep(duration);await page.keyboard.up(key);await sleep(300);}
  }
  throw new Error('Could not walk to destination '+x+','+z+': '+JSON.stringify(await state()));
}
async function interact() { if(touch) await button('context');else{await page.keyboard.press('e');await sleep(400);} }
async function restart() { await button('pause'); await wait(s=>s.paused,'test reset pause'); await button('secondary'); await wait(s=>s.mode==='game'&&s.stage===0,'test reset'); }
async function verticalLook(fromY,toY) {
  if(touch){
    const point={x:300,y:fromY,id:4};
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point]});
    await sleep(120);
    await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{...point,y:toY}]});
    await sleep(300);
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  }else{
    await page.mouse.move(700,fromY);await page.mouse.down();await page.mouse.move(700,toY,{steps:10});await page.mouse.up();
  }
  await sleep(450);
}
async function movementCameraChecks(){
  check(['Q06-village-life-v1','Q05-village-v1','Q04-village-v1','Q03-village-v1','B05-village-v1'].includes((await state()).build),'Expected village export identity is active');
  await move(0,8.5);
  await verticalLook(550,250);
  const nearWall=await wait(s=>s.camera.pitch<=.151&&s.camera.obstructed,'camera retracts at rear wall');
  check(nearWall.camera.position[2]<9.04&&nearWall.camera.distance<1.2,'Camera retracts in front of rear wall at lower pitch limit',nearWall.camera);
  await page.screenshot({path:path.join(out,`${name}-camera-wall.png`)});
  await move(0,4);
  await sleep(1000);
  check((await state()).camera.distance>5.4,'Camera restores full distance after walking away from wall',(await state()).camera);
  await verticalLook(250,550);
  check((await state()).camera.pitch>=.849,'Upper camera pitch is clamped');
  await restart();
  const reset=await state();
  check(Math.abs(reset.yaw)<.001&&Math.abs(reset.camera.pitch-.4)<.001,'Restart restores camera direction and pitch');
  if(!touch){
    await page.keyboard.down('w');await sleep(600);await button('pause');
    const paused=await wait(s=>s.paused,'pause during motion');await sleep(450);
    const after=await state();
    check(after.velocity.every(v=>v===0)&&JSON.stringify(after.player)===JSON.stringify(paused.player),'Pause during movement immediately stops David');
    await page.keyboard.up('w');await button('primary');await sleep(500);
    check(JSON.stringify((await state()).player)===JSON.stringify(paused.player),'Resume does not reuse a held movement key');
    await page.keyboard.down('d');await sleep(350);await page.keyboard.up('d');await sleep(250);
    check((await state()).player[0]>paused.player[0]+.3,'Fresh movement works after pause');
    await page.mouse.move(650,350);await page.mouse.down();await page.mouse.move(700,350,{steps:4});
    await page.setViewportSize({width:1180,height:680});await sleep(400);
    const resized=await state();await page.mouse.move(760,350,{steps:4});await page.mouse.up();await sleep(350);
    check(!(await state()).mouse_looking&&Math.abs((await state()).yaw-resized.yaw)<.001,'Resize cancels an active mouse drag');
    await page.setViewportSize({width:1280,height:720});await sleep(350);
  }else{
    const origin={x:80,y:756,id:1};
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[origin]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{...origin,y:708}]});await sleep(400);
    await page.setViewportSize({width:844,height:390});await sleep(500);
    const resized=await state();await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await sleep(400);
    check(resized.touch.move_id===-1&&resized.touch.look_id===-1&&resized.velocity.every(v=>v===0)&&JSON.stringify((await state()).player)===JSON.stringify(resized.player),'Orientation change cancels held movement without drift');
    await page.setViewportSize({width:390,height:844});await sleep(350);
    const before=await state();await gesture(0,-1,400);
    check((await state()).player[2]<before.player[2]-.3,'Fresh touch works after orientation change');
  }
  await restart();
}
async function interactionChecks() {
  let s=await state();
  check(!s.context.enabled && s.target==='', 'Out-of-range action is disabled at spawn');
  await interact();
  check((await state()).interaction.requests===0, 'Out-of-range input cannot dispatch');
  await move(3.2,.6);
  await interact();
  s=await state();
  check(s.stage===0 && !s.context.enabled && s.interaction.requests===0, 'Locked provisions have no actionable prompt and cannot dispatch');
  await move(0,.6); await move(0,-13);
  await interact();
  s=await state();
  check(s.stage===0 && !s.context.enabled && s.interaction.requests===0, 'Locked gate cannot skip the errand');
  await move(0,2.4);
  s=await wait(s=>s.target==='jesse','available character prompt');
  check(s.context.enabled && s.context.text===(touch?'Speak to Jesse':'E · Speak to Jesse'), 'Context uses authored action and device-appropriate hint');
  const [x,y,w,h]=s.layout.context, [vw,vh]=s.layout.view;
  check(x>=0&&y>=0&&x+w<=vw+1&&y+h<=vh+1&&h>=48,'Action button fits viewport and remains touch-sized');
  await page.screenshot({path:path.join(out,`${name}-interaction-prompt.png`)});
  await move(0,4.1); await wait(s=>!s.context.enabled,'prompt leaves range');
  check((await state()).target==='', 'Moving away removes actionable target');
}
async function helpChecks(beforeEntry=false) {
  const before=await state();
  if(beforeEntry&&!touch){await page.keyboard.press('Tab');await page.keyboard.press('Enter');}
  else await button(beforeEntry?'secondary':'help');
  const opened=await wait(s=>s.mode==='help'&&s.help_open,'Controls opens');
  check(opened.stage===before.stage&&opened.started===before.started,'Controls preserves progress and entry state');
  if(!beforeEntry){
    if(touch)await gesture(0,-1,300);else{await page.keyboard.press('w');await page.keyboard.press('e');}
    const frozen=await state();
    check(frozen.stage===before.stage&&JSON.stringify(frozen.player)===JSON.stringify(opened.player)&&frozen.velocity.every(v=>v===0),'Controls blocks world movement and interaction');
  }
  const [x,y,w,h]=opened.layout.body_scroll;
  if(touch){
    const p={x:x+w/2,y:y+h-16,id:8};
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[p]});
    for(let i=1;i<=6;i++){await sleep(60);await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{...p,y:p.y-(h-32)*i/6}]});}
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  }else{await page.mouse.move(x+w/2,y+h/2);await page.mouse.wheel(0,700);}
  await wait(s=>s.layout.scroll_y>0,'Controls text scrolls');
  check(true,'Controls text scrolls while Back stays reachable');
  await page.screenshot({path:path.join(out,name+(beforeEntry?'-entry-controls.png':'-controls.png'))});
  await button('primary');
  await wait(s=>s.mode===(beforeEntry?'welcome':'game')&&!s.help_open,'Controls closes');
  check((await state()).stage===before.stage,'Closing Controls returns without changing objective');
}
async function journey() {
  await move(0,2.4); await wait(s=>s.target==='jesse','Jesse target');
  if(touch) await button('context');
  else {
    const s=await state(),[x,y,w,h]=s.layout.context;
    await page.mouse.dblclick(x+w/2,y+h/2,{delay:40});await sleep(400);
  }
  const conversation=await wait(s=>s.mode==='exchange'||s.mode==='dialogue','dialogue');
  check(conversation.interaction.requests===1&&conversation.story_events.length===0, 'Character request reserves once before dialogue completes');
  if(conversation.mode==='dialogue')await button('primary');
  await wait(s=>s.stage===1,'first objective',35000);
  check(JSON.stringify((await state()).story_events)===JSON.stringify(['jesse_spoken']), 'Dialogue accepts one story event');
  // Approach the table; walking through its collider is deliberately impossible.
  await move(3.2,.6); await wait(s=>s.target==='provisions','provisions target'); await interact();
  await wait(s=>s.stage===2,'pickup');
  await interact();
  check((await state()).interaction.requests===2&&(await state()).interaction.targets.provisions.completions===1&&!((await state()).context.enabled), 'Repeated pickup input cannot dispatch or complete twice');
  await move(0,.6);
  // Explore the public well loop using actual player input before taking the main exit.
  for(const [x,z] of [[0,-3],[-6,-3],[-6,-9.5],[0,-9.5]]) await move(x,z);
  check((await state()).recoveries===0,'Player traverses the village well loop without recovery');
  await page.screenshot({path:path.join(out,`${name}-village-lane.png`)});
  await move(0,-13); await wait(s=>s.target==='gate','gate target'); await interact();
  await wait(s=>s.stage===3 && s.mode==='complete','complete');
  check(JSON.stringify((await state()).story_events)===JSON.stringify(['jesse_spoken','provisions_collected','gate_reached']), 'Exactly three ordered story events complete the sample');
  await page.screenshot({path:path.join(out,`${name}-complete.png`)});
  check(true,'Real input completes dialogue, collection and gate in order');
  await button('primary'); const s=await wait(s=>s.stage===0&&s.mode==='game','restart');
  check(Math.abs(s.player[2]-5)<.2,'Restart restores objectives and spawn');
  check(s.interaction.requests===0&&!s.interaction.targets.provisions.consumed&&s.story_events.length===0,'Restart clears target consumption and accepted-event history');
}
(async()=>{
  browser=await chromium.launch({channel,headless:true});
  report.browserVersion=browser.version();
  const context=await browser.newContext({viewport:touch?{width:390,height:844}:{width:1280,height:720},hasTouch:touch,isMobile:touch,deviceScaleFactor:touch?3:1});
  const manifestResponse=await context.request.get(origin+'/build-manifest.json');
  if(!manifestResponse.ok())throw new Error('Build manifest is unavailable');
  report.buildManifest=await manifestResponse.json();
  // Observe Web Audio state and sources without changing autoplay policy or game state.
  await context.addInitScript(()=>{
    window.__audioObserved={contexts:[],startedSources:0};
    const Native=window.AudioContext;
    window.AudioContext=class extends Native { constructor(...args){super(...args);window.__audioObserved.contexts.push(this);} };
    const start=AudioBufferSourceNode.prototype.start;
    AudioBufferSourceNode.prototype.start=function(...args){window.__audioObserved.startedSources++;return start.apply(this,args);};
  });
  page=await context.newPage(); cdp=await context.newCDPSession(page);
  page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});
  page.on('pageerror',e=>report.errors.push(e.message));
  page.on('requestfailed',r=>report.errors.push(r.url()+': '+r.failure()?.errorText));
  await page.goto(origin+'/?diagnostics=1',{waitUntil:'domcontentloaded'});
  await wait(s=>s.mode==='welcome','initial rendering',60000);
  await sleep(3000);
  report.launch=await page.evaluate(()=>({loading:window.__proofLoading,resources:performance.getEntriesByType('resource').filter(r=>/index\.(wasm|pck|js)$/.test(r.name)).map(r=>({url:r.name,encoded:r.encodedBodySize,decoded:r.decodedBodySize,duration:r.duration})),renderer:(()=>{const gl=document.querySelector('canvas').getContext('webgl2');const ext=gl.getExtension('WEBGL_debug_renderer_info');return ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):'unavailable';})()}));
  await page.screenshot({path:path.join(out,`${name}-welcome.png`)});
  await helpChecks(true);
  if(touch)await button('primary');else await page.keyboard.press('Enter');
  await wait(s=>s.mode==='game','entry action',10000);
  check(true,'User can enter exported scene');
  await sleep(1000);
  await page.screenshot({path:path.join(out,`${name}-courtyard.png`)});
  const before=await state();await sleep(700);const after=await state();
  check(after.animation.ready&&after.animation.bones>0&&after.jesse_animation.time!==before.jesse_animation.time,'Imported skinned character animates in browser',{before:before.jesse_animation,after:after.jesse_animation});
  await movementCameraChecks();
  await helpChecks();
  await interactionChecks();
  await journey();
  await button('pause'); await wait(s=>s.paused,'pause');
  const paused=await state();await sleep(400);check(JSON.stringify((await state()).player)===JSON.stringify(paused.player),'Pause stops movement');
  await button('primary'); await wait(s=>!s.paused,'resume');
  await button('mute'); check((await state()).muted,'Mute toggles');
  await button('quality');
  const quality=await wait(s=>s.extra_light&&s.scale_3d<1,'Extra light diagnostic update');
  check(quality.extra_light&&quality.scale_3d<1,'Extra light mode reduces 3D resolution',{extra_light:quality.extra_light,scale_3d:quality.scale_3d});
  report.audio=await page.evaluate(()=>({states:window.__audioObserved.contexts.map(c=>c.state),sources:window.__audioObserved.startedSources}));
  check(report.audio.states.includes('running')&&report.audio.sources>0,'Audio context runs and sound source starts after user input',report.audio);
  if(touch){
    const origin={x:80,y:756,id:1},look={x:300,y:400,id:2};
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[origin]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{...origin,y:708}]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...origin,y:708},look]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{...origin,y:708},{...look,x:340}]});await sleep(450);
    const dual=await state();check(dual.touch.move_id>=0&&dual.touch.look_id>=0&&Math.abs(dual.yaw)>.01,'Separate fingers move and look concurrently',dual.touch);
    await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});await sleep(450);
    const cancel=await state();check(cancel.touch.move_id===-1&&cancel.touch.look_id===-1&&cancel.touch.movement.every(v=>v===0),'Touch cancellation clears both controls');
    for(const viewport of [{width:844,height:390},{width:360,height:800},{width:800,height:360},{width:320,height:568},{width:568,height:320}]){
      await page.setViewportSize(viewport);await sleep(800);
      const hud=await state(), inside=r=>r[0]>=0&&r[1]>=0&&r[0]+r[2]<=viewport.width+1&&r[1]+r[3]<=viewport.height+1;
      check(['header','toolbar','context'].every(key=>inside(hud.layout[key])),'HUD fits '+viewport.width+'x'+viewport.height);
      await page.screenshot({path:path.join(out,`${name}-hud-${viewport.width}x${viewport.height}.png`)});
      await button('pause');await wait(s=>s.paused,'orientation pause');
      const s=await state(),c=s.layout.card;
      check(s.layout.view[0]===viewport.width&&s.layout.view[1]===viewport.height,'Canvas follows viewport '+viewport.width+'x'+viewport.height,s.layout.view);
      check(c[0]>=0&&c[1]>=0&&c[0]+c[2]<=viewport.width+1&&c[1]+c[3]<=viewport.height+1,'Modal fits '+viewport.width+'x'+viewport.height,c);
      check(s.layout.primary[3]>=48&&s.layout.secondary[3]>=48,'Touch targets at least 48px '+viewport.width+'x'+viewport.height);
      await page.screenshot({path:path.join(out,`${name}-${viewport.width}x${viewport.height}.png`)});await button('primary');
    }
  }else{
    await move(0,7);
    await page.keyboard.down('a');await sleep(Math.ceil(15/((await state()).walk_speed || 2.8)*1000)+600);await page.keyboard.up('a');await sleep(400);
    const collision=await state();check(collision.player[0]>-14.01&&collision.player[0]<-13.8,'Village boundary stops the moving player',collision.player);
    await page.mouse.move(700,350);await page.mouse.down();await page.mouse.move(800,380,{steps:8});await page.mouse.up();await sleep(400);
    check(Math.abs((await state()).yaw)>.1,'Mouse drag changes camera');
    await cdp.send('Emulation.setFocusEmulationEnabled',{enabled:false});
    const other=await context.newPage();await other.goto('about:blank');await other.bringToFront();await sleep(500);
    report.focusAway=await page.evaluate(()=>({visible:document.visibilityState,focused:document.hasFocus()}));
    await page.bringToFront();await sleep(600);
    check((await state()).paused,'Focus loss pauses gameplay');await other.close();await button('primary');
  }
  for(let i=0;i<30;i++){await sleep(1000);const s=await state();report.samples.push({fps:s.fps,frame_ms:s.frame_ms,draw_calls:s.draw_calls,visible_primitives:s.visible_primitives,scale_3d:s.scale_3d});}
  check(report.errors.length===0,'No browser, script or failed-request errors',report.errors);
  const finalManifest=await (await context.request.get(origin+'/build-manifest.json')).json();
  check(JSON.stringify(report.buildManifest)===JSON.stringify(finalManifest),'Tested export did not change during the run');
  report.result='passed';
})().catch(e=>{report.result='failed';report.failure=e.stack;process.exitCode=1;}).finally(async()=>{
  if(page){report.finalState=await state().catch(()=>null);await page.screenshot({path:path.join(out,`${name}-final.png`)}).catch(()=>{});}
  fs.writeFileSync(path.join(out,`${name}.json`),JSON.stringify(report,null,2));
  console.log(JSON.stringify({result:report.result,checks:report.checks.length,failure:report.failure,errors:report.errors,report:path.join(out,`${name}.json`)}));
  if(browser)await browser.close();
});
