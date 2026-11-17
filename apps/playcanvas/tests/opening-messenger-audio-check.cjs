// Actual Chapter 1 input, no story-state seeds or presentation clock changes.
const {chromium}=require(process.argv[2]),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {meterAudio,levels}=require('./opening-audio-diagnostic.cjs');
const audioChecks=[],messengerChecks=[];
const origin=process.argv[3]||'http://127.0.0.1:4193';
const out=path.resolve(process.argv[4]||'docs/implementation/evidence/opening-messenger-audio-2026-11-13');
fs.mkdirSync(out,{recursive:true});
const state=p=>p.locator('canvas').evaluate(e=>JSON.parse(e.dataset.valley));
const wait=(p,fn,timeout=65000)=>p.waitForFunction(fn,null,{timeout});
const atStage=(p,name)=>p.waitForFunction(name=>JSON.parse(document.querySelector('canvas').dataset.valley).prologue.stage===name,name,{timeout:65000});
const screenshot=(p,name)=>p.screenshot({path:path.join(out,name+'.png'),scale:'css'});
async function move(p,cdp,x,z){
  const held=new Set(),pad=cdp?await p.locator('#move-pad').boundingBox():null;
  const center=pad&&{x:pad.x+pad.width/2,y:pad.y+pad.height/2,id:1};
  if(cdp)await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[center]});
  try{for(let i=0;i<200;i++){
    const a=(await state(p)).prologue.position,dx=x-a.x,dz=z-a.z,d=Math.hypot(dx,dz);
    if(d<.17)return;
    if(cdp){const scale=Math.min(1,d/.5);await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{id:1,x:center.x+dx/d*34*scale,y:center.y+dz/d*34*scale}]});}
    else{const wanted=new Set([...(Math.abs(dx)>.08?[dx>0?'d':'a']:[]),...(Math.abs(dz)>.08?[dz>0?'s':'w']:[])]);
      for(const k of held)if(!wanted.has(k)){await p.keyboard.up(k);held.delete(k);}
      for(const k of wanted)if(!held.has(k)){await p.keyboard.down(k);held.add(k);}}
    await p.waitForTimeout(90);
  }throw new Error('Courtyard path not reached: '+JSON.stringify({x,z,state:(await state(p)).prologue}));}
  finally{if(cdp)await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});for(const k of held)await p.keyboard.up(k);await p.waitForTimeout(140);}
}
async function action(p,cdp,id='survey'){if(cdp)await p.locator('#'+id).tap();else await p.locator('#'+id).click();}
async function heard(p,label,min=.002){const readings=[];for(let i=0;i<8;i++){readings.push(await levels(p));await p.waitForTimeout(70);}const maxRms=Math.max(...readings.flatMap(a=>a.map(v=>v.rms)));assert(maxRms>min,`${label} output is silent: ${maxRms}`);audioChecks.push({label,maxRms});return maxRms;}
async function reachCourt(p,cdp,label){
  await atStage(p,'flock');assert(Math.abs((await state(p)).prologue.bundle.z+8.3)<.001,'No provisions at the flock');
  await move(p,cdp,1.2,1.45);await action(p,cdp);await atStage(p,'handoff');
  await wait(p,()=>{const s=JSON.parse(document.querySelector('canvas').dataset.valley).prologue;return s.stage==='handoff'&&s.time>.7&&s.time<2.5;});
  const before=(await state(p)).prologue.messenger;await screenshot(p,label+'-messenger-arriving');
  await wait(p,()=>{const s=JSON.parse(document.querySelector('canvas').dataset.valley).prologue;return s.line==='jesse-calls'&&s.messengerMouth.some(v=>v>.2);});
  const summons=(await state(p)).prologue;assert(summons.messengerVisible);assert(summons.messenger.z-before.z>2,'Messenger actually walks from courtyard to flock');assert.notDeepEqual(summons.messenger,summons.keeper);await screenshot(p,label+'-messenger-calls');const rms=await heard(p,label+' messenger summons');messengerChecks.push({label,before,arrived:summons.messenger,keeper:summons.keeper,rms});
  await atStage(p,'courtyard');assert.equal((await state(p)).prologue.metJesse,false);
  assert.match(await p.locator('#objective').innerText(),/Speak with Jesse/);
  await move(p,cdp,0,-5.8);await move(p,cdp,-.7,-7.3);
}
(async()=>{const browser=await chromium.launch({channel:'chrome',args:['--autoplay-policy=user-gesture-required']}),results=[];
try{for(const [label,width,height]of[['desktop',1280,720],['portrait',390,844],['landscape',844,390]]){
  const touch=label!=='desktop',errors=[],failed=[];
  const context=await browser.newContext({viewport:{width,height},hasTouch:touch,isMobile:touch,deviceScaleFactor:1});
  const p=await context.newPage(),cdp=touch?await context.newCDPSession(p):null;await p.addInitScript(meterAudio);
  p.on('pageerror',e=>errors.push(e.stack));p.on('response',r=>{if(r.status()>=400)failed.push({url:r.url(),status:r.status()});});
  try{
    await p.goto(origin+'/episode.html?inspect=1');await p.locator('#enter').waitFor({state:'visible',timeout:60000});
    await action(p,cdp,'enter');await p.waitForURL('**/valley.html?inspect=1');await p.locator('#enter').waitFor({state:'visible',timeout:60000});
    const runId=(await state(p)).run.runId;assert.equal((await state(p)).run.completed.length,0);
    assert((await levels(p)).every(a=>a.state==='suspended'));await action(p,cdp,'enter');
    await wait(p,()=>{const s=JSON.parse(document.querySelector('canvas').dataset.valley);return s.mode==='prologue'&&s.prologue.stage==='establish'&&s.prologue.time>.25;});await screenshot(p,label+'-first-scene-flock');await heard(p,label+' opening ambience',.0001);
    await wait(p,()=>JSON.parse(document.querySelector('canvas').dataset.valley).prologue.line==='shepherd-life');await heard(p,label+' opening narration');const unlocked=await levels(p);assert(unlocked.every(a=>a.resumes[0]?.active),'Both contexts unlock directly in the entry gesture');
    if(!touch){assert.equal(await p.locator('#sound').innerText(),'Mute sound');await p.locator('#sound').click();await p.waitForTimeout(150);assert.equal(await p.locator('#sound').innerText(),'Enable sound');assert((await levels(p)).every(a=>a.state!=='running'||a.rms<1e-7));await p.locator('#sound').click();await heard(p,'unmuted opening narration');}
    await reachCourt(p,cdp,label);await screenshot(p,label+'-courtyard-arrival');
    if(!touch){
      await move(p,null,1.35,-7.2);assert.equal((await state(p)).prologue.canInteract,false);
      await p.keyboard.press('e');assert.equal((await state(p)).prologue.stage,'courtyard');assert.equal((await state(p)).prologue.carried,false);
      await p.keyboard.down('w');await p.waitForTimeout(550);await p.keyboard.up('w');
      assert((await state(p)).prologue.position.z>=-7.59,'Bench collision prevents walking through supplies');
      await move(p,null,1.35,-7.15);await move(p,null,-.7,-7.3);
    }
    await action(p,cdp);await wait(p,()=>{const s=JSON.parse(document.querySelector('canvas').dataset.valley).prologue;return s.stage==='errand'&&s.line==='jesse-greeting'&&s.jesseMouth.some(v=>v>.2);});
    assert.match(await p.locator('#caption').innerText(),/^Jesse:/);await screenshot(p,label+'-jesse-greeting');
    if(label==='portrait'){
      await action(p,cdp,'reset');await atStage(p,'flock');assert.equal((await state(p)).prologue.starts.errand,0);assert.equal((await state(p)).prologue.metJesse,false);assert.equal((await state(p)).prologue.carried,false);
      await p.waitForTimeout(400);assert(!(await state(p)).prologue.line?.startsWith('jesse-'),'Restart cancels Jesse speech');
      await reachCourt(p,cdp,label+'-restart');await action(p,cdp);
    }
    await wait(p,()=>{const s=JSON.parse(document.querySelector('canvas').dataset.valley).prologue;return s.stage==='errand'&&s.line==='jesse-provisions'&&s.jesseMouth.some(v=>v>.2);});
    await p.waitForTimeout(1500);const speaking=(await state(p)).prologue;assert.equal(speaking.jesseClip,'explain_point');
    await heard(p,label+' Jesse instruction');await screenshot(p,label+'-jesse-errand');await action(p,cdp,'pause');await p.waitForTimeout(100);
    const paused=(await state(p)).prologue;await p.waitForTimeout(350);assert.equal((await state(p)).prologue.time,paused.time);assert.equal(paused.audio,'suspended');
    await action(p,cdp,'pause');if(!touch){await p.keyboard.press('e');await p.keyboard.press('e');}
    await wait(p,()=>{const s=JSON.parse(document.querySelector('canvas').dataset.valley).prologue;return s.stage==='errand'&&s.line==='david-accepts'&&s.mouth.some(v=>v>.2);});
    await p.waitForTimeout(800);await screenshot(p,label+'-david-acknowledges');await atStage(p,'provisions');
    assert((await state(p)).prologue.metJesse);assert.equal((await state(p)).prologue.starts.errand,1);assert.equal((await state(p)).prologue.carried,false);
    assert.match(await p.locator('#objective').innerText(),/Take the provisions/);
    await move(p,cdp,1.35,-7.1);await screenshot(p,label+'-courtyard-provisions');await action(p,cdp);
    await wait(p,()=>{const s=JSON.parse(document.querySelector('canvas').dataset.valley).prologue;return s.stage==='pack'&&s.time>2.2;});
    assert((await state(p)).prologue.position.z> -7.57,'Pickup alignment stays outside the padded bench collider');
    await screenshot(p,label+'-pickup');await atStage(p,'journey');assert((await state(p)).prologue.carried);assert.equal((await state(p)).prologue.starts.pack,1);
    await move(p,cdp,0,-11.3);await move(p,cdp,-1,-18.2);await action(p,cdp);await atStage(p,'discovery');
    await screenshot(p,label+'-valley-discovery');await wait(p,()=>{const s=JSON.parse(document.querySelector('canvas').dataset.valley).prologue;return s.stage==='journey'&&s.discovered;});
    assert.equal((await state(p)).prologue.starts.journeyNarration,1);await move(p,cdp,0,-24.1);await action(p,cdp);
    await wait(p,()=>JSON.parse(document.querySelector('canvas').dataset.valley).mode==='intro');
    assert.equal((await state(p)).run.runId,runId);assert.equal((await state(p)).run.completed.length,0);
    let checkpoint;
    if(!touch){
      await wait(p,()=>{const s=JSON.parse(document.querySelector('canvas').dataset.valley);return s.mode==='intro'&&s.time>6.8;});await heard(p,'Elah arrival narration after automatic handoff');await wait(p,()=>JSON.parse(document.querySelector('canvas').dataset.valley).mode==='explore');
      await p.keyboard.down('w');await p.locator('#survey').waitFor({state:'visible'});await p.keyboard.up('w');await p.locator('#survey').click();
      await p.locator('#review-gate').waitFor({state:'visible',timeout:20000});checkpoint=(await state(p)).run;assert.deepEqual(checkpoint.completed,['valley.surveyed']);
      await p.locator('#continue-camp').click();await p.waitForURL('**/camp.html?inspect=1');await p.locator('#enter').waitFor({state:'visible',timeout:60000});
      const camp=await p.locator('canvas').evaluate(e=>JSON.parse(e.dataset.camp));assert.equal(camp.run.runId,runId);assert.deepEqual(camp.run.completed,['valley.surveyed']);assert(camp.carried);await p.locator('#enter').click();await p.waitForTimeout(1200);const campEntryOutput={state:await p.locator('canvas').evaluate(e=>JSON.parse(e.dataset.camp)),levels:await levels(p)};fs.writeFileSync(path.join(out,'camp-entry-output.json'),JSON.stringify(campEntryOutput,null,2));await p.waitForFunction(()=>{const s=JSON.parse(document.querySelector('canvas').dataset.camp);return s.mode==='explore'&&!s.paused;},null,{timeout:20000});
      const held=new Set();try{for(let i=0;i<160;i++){const a=await p.locator('canvas').evaluate(e=>JSON.parse(e.dataset.camp).position),dx=-1.6-a.x,dz=2.7-a.z;if(Math.hypot(dx,dz)<.18)break;const desired=new Set([...(Math.abs(dx)>.08?[dx>0?'d':'a']:[]),...(Math.abs(dz)>.08?[dz>0?'s':'w']:[])]);for(const k of held)if(!desired.has(k)){await p.keyboard.up(k);held.delete(k);}for(const k of desired)if(!held.has(k)){await p.keyboard.down(k);held.add(k);}await p.waitForTimeout(80);}}finally{for(const k of held)await p.keyboard.up(k);}await p.locator('#interact').click();await p.waitForFunction(()=>JSON.parse(document.querySelector('canvas').dataset.camp).speaker==='David');await heard(p,'Camp spoken delivery after earned handoff');
    }else assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight));
    assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
    results.push({label,status:'PASS',viewport:{width,height},basis:'Fresh normal run, real keyboard/mouse or joystick/tap input. Flock first, distinct arriving messenger summons and keeper, walk to courtyard, Jesse voiced greeting/pointing, David acknowledgement, pause/resume, separate gated bench pickup, carried journey and Elah arrival.',runId,speaking,checkpoint,checks:touch?[...(label==='portrait'?['Restart cancels father exchange and resets permission']:[]),'Touch courtyard access, conversation and pickup','No page overflow']:['No pickup before father conversation','Bench collision','Complete original survey and same-run Camp handoff'],errors,failed});
    fs.writeFileSync(path.join(out,'opening-flow-audio-results.json'),JSON.stringify({status:results.length===3?'PASS':'IN_PROGRESS',browser:browser.version(),results,audioChecks,messengerChecks,limits:'Chrome touch emulation; physical phones and Safari not tested. Chapters 2–6 retain the preceding complete-run evidence, not rerun by this opening-focused test.'},null,2));
    console.log('PASS flock, messenger, courtyard and real audio',label);
  }catch(e){await screenshot(p,label+'-failure').catch(()=>{});fs.writeFileSync(path.join(out,label+'-failure.json'),JSON.stringify({error:e.stack,state:await state(p).catch(()=>null),errors,failed},null,2));throw e;}
  finally{await context.close();}
}}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
