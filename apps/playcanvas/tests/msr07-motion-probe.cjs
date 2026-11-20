// Actual rendered roots/joints and trusted keyboard/CDP touch input. No state writes.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.argv[2]),{createDriver}=require('./ctrl07-browser-driver.cjs');
const origin=process.argv[3],out=path.resolve(process.argv[4]);fs.mkdirSync(out,{recursive:true});
const layouts={desktop:[1280,720,false],portrait:[390,844,true],landscape:[844,390,true]};
function observe(){
 window.motionFrames=[];window.motionEvents=[];window.motionMarks=[];window.motionMark='entry';
 for(const type of ['keydown','pointerdown','pointermove','keyup','pointerup'])window.addEventListener(type,e=>{if(e.isTrusted)window.motionEvents.push({at:performance.now(),type,code:e.code,target:e.target?.id});},{capture:true});
 globalThis[Symbol.for('playcanvas.inspector')]={register(app){app.on('frameend',()=>{const raw=document.querySelector('canvas')?.dataset.camp;if(!raw)return;const state=JSON.parse(raw),model=app.root.findComponents('anim').map(c=>c.entity).find(e=>e.name==='David');if(!model)return;const joints={};for(const name of ['foot_l','foot_r','ball_l','ball_r']){const node=model.findByName(name);if(node)joints[name]=node.getPosition().toArray();}
  window.motionFrames.push({at:performance.now(),mark:window.motionMark,position:state.position,renderedRoot:{x:model.getPosition().x,y:model.getPosition().y,z:model.getPosition().z},heading:state.heading,motion:state.motion,jump:state.jump,handGap:state.handGap,joints});
 });}};
}
(async()=>{const browser=await chromium.launch({channel:'chrome'});try{for(const [layout,[width,height,touch]]of Object.entries(layouts)){
 const context=await browser.newContext({viewport:{width,height},hasTouch:touch,isMobile:touch}),p=await context.newPage(),d=await createDriver(context,p,touch),errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});await p.addInitScript(observe);
 try{await p.goto(origin+'/camp.html?review=1&inspect=1');await p.locator('#enter').waitFor({timeout:90000});await d.tap('#enter');await p.waitForFunction(()=>JSON.parse(document.querySelector('canvas').dataset.camp).mode==='explore');
  const mark=name=>p.evaluate(n=>{window.motionMark=n;window.motionMarks.push({name:n,at:performance.now()});},name);
  // Short starts in the clear camp aisle, then reverse to keep every trial in bounds.
  for(let i=0;i<6;i++){await mark('response-'+i);await d.direction(0,i%2?-1:1);await p.waitForTimeout(500);await d.release();await p.waitForTimeout(650);}
  await mark('straight-forward');await d.direction(0,1);await p.waitForTimeout(1050);await d.release();await p.waitForTimeout(600);
  await mark('straight-back');await d.direction(0,-1);await p.waitForTimeout(1050);await d.release();await p.waitForTimeout(600);
  await mark('pivot');await d.direction(1,0);await p.waitForTimeout(450);await d.direction(-1,0);await p.waitForTimeout(650);await d.release();await p.waitForTimeout(600);
  await mark('jump');await d.action('jump');await p.waitForFunction(()=>JSON.parse(document.querySelector('canvas').dataset.camp).jump.phase==='airborne');await p.waitForFunction(()=>JSON.parse(document.querySelector('canvas').dataset.camp).jump.phase==='grounded');
  const data=await p.evaluate(()=>({frames:window.motionFrames,events:window.motionEvents,marks:window.motionMarks})),response=[];
  for(let i=0;i<6;i++){const name='response-'+i,frames=data.frames.filter(f=>f.mark===name),input=data.events.find(e=>e.at>=data.marks.find(m=>m.name===name).at&&(touch?e.type==='pointermove'&&e.target==='move-pad':e.type==='keydown'&&['KeyW','KeyS'].includes(e.code)));assert(input,'Trusted movement input observed');const base=[...data.frames].reverse().find(f=>f.at<=input.at),moved=frames.find(f=>f.at>=input.at&&Math.hypot(f.renderedRoot.x-base.renderedRoot.x,f.renderedRoot.z-base.renderedRoot.z)>.00001);assert(moved,'Movement must reach the rendered root');response.push({trial:i+1,eventToObservedRootMs:moved.at-input.at});}
  assert(response.every(r=>r.eventToObservedRootMs<=150),'Local event-to-rendered-root response exceeds proposed 150 ms');
  assert(data.frames.filter(f=>f.mark==='pivot').every(f=>Number.isFinite(f.heading)));assert.deepEqual(errors,[]);
  const result={status:'PASS',layout,width,height,touch,browser:browser.version(),basis:'Trusted browser event to the first frameend with actual root movement, not physical keyboard-to-photon latency. Ankle/ball traces support contact diagnosis; they do not by themselves certify sole contact on terrain/pivots.',response,errors,...data};fs.writeFileSync(path.join(out,layout+'.json'),JSON.stringify(result));await p.screenshot({path:path.join(out,layout+'-settled.png'),scale:'css'});console.log('PASS motion response '+layout+' '+JSON.stringify(response));
 }catch(e){fs.writeFileSync(path.join(out,layout+'-failure.json'),JSON.stringify({error:e.stack,errors,data:await p.evaluate(()=>({frames:window.motionFrames,events:window.motionEvents})).catch(()=>null)}));throw e;}finally{await context.close();}
 }}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
