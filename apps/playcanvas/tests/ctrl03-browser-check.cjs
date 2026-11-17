// Real inputs in the production build. Review shortcuts are explicit per case.
const {chromium}=require(process.argv[2]),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const origin=process.argv[3]||'http://127.0.0.1:4196',out=path.resolve(process.argv[4]||'docs/implementation/evidence/ctrl03-2026-11-16'),suite=process.argv[5]||'foundation';
fs.mkdirSync(out,{recursive:true});
const read=(p,name)=>p.locator('canvas').evaluate((e,n)=>JSON.parse(e.dataset[n]),name);
const wait=async(p,name,predicate,arg,timeout=60000)=>{try{return await p.waitForFunction(({name,source,arg})=>new Function('s','arg',`return (${source})(s,arg)`)(JSON.parse(document.querySelector('canvas').dataset[name]),arg),{name,source:String(predicate),arg},{timeout});}catch(error){fs.writeFileSync(path.join(out,suite+'-timeout.json'),JSON.stringify({name,predicate:String(predicate),arg,state:await read(p,name)},null,2));throw error;}};
const shot=(p,name)=>p.screenshot({path:path.join(out,name+'.png'),scale:'css'});
const mid=b=>({x:b.x+b.width/2,y:b.y+b.height/2});
const vector=p=>p.locator('#player-movement').evaluate(e=>({x:+e.dataset.x,forward:+e.dataset.forward}));
async function touchDriver(context,p){
 const c=await context.newCDPSession(p),active=new Map();
 async function send(type){await c.send('Input.dispatchTouchEvent',{type,touchPoints:[...active].map(([id,point])=>({id,...point}))});}
 return{async start(id,point){active.set(id,point);await send('touchStart');},async move(id,point){active.set(id,point);await send('touchMove');},async end(id){const point=active.get(id);active.delete(id);await c.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:active.size?[{id,...point}]:[]});},async cancel(){active.clear();await send('touchCancel');},async tap(selector,id=2){const point=mid(await p.locator(selector).boundingBox());await this.start(id,point);await this.end(id);},async stick(x,y){const point=mid(await p.locator('#move-pad').boundingBox());await this.start(1,point);await this.move(1,{x:point.x+x,y:point.y+y});},async aim(dx,dy){const box=await p.locator('canvas').boundingBox(),from={x:box.x+box.width*.55,y:box.y+box.height*.32};await this.start(2,from);await this.move(2,{x:from.x+dx*box.width,y:from.y+dy*box.height});await this.end(2);}};
}
async function setup(browser,width=1280,height=720,touch=false){
 const context=await browser.newContext({viewport:{width,height},hasTouch:touch,isMobile:touch,deviceScaleFactor:1}),p=await context.newPage(),errors=[],failed=[];
 p.on('pageerror',e=>errors.push(e.stack));p.on('response',r=>{if(r.status()>=400)failed.push({url:r.url(),status:r.status()});});
 await p.addInitScript(()=>{globalThis[Symbol.for('playcanvas.inspector')]={register(app){window.ctrl03App=app;}};});
 return{context,p,errors,failed};
}
async function enter(p,url,touch=false){await p.goto(origin+url);await p.locator('#enter').waitFor({state:'visible',timeout:60000});assert.equal(await p.locator('#player-movement').isVisible(),false,'Entry masks movement');if(touch)await p.locator('#enter').tap();else await p.locator('#enter').click();}
async function layout(p,label){
 assert(await p.locator('#player-movement').isVisible());
 const checks=await p.evaluate(()=>{const root=document.getElementById('player-movement'),stage=document.querySelector('canvas').getBoundingClientRect(),left=root.getBoundingClientRect(),visible=e=>!!e.getClientRects().length;
 const targets=[...root.querySelectorAll('button')].filter(visible).map(e=>{const b=e.getBoundingClientRect();return{name:e.getAttribute('aria-label'),x:b.x,y:b.y,width:b.width,height:b.height,inside:b.left>=stage.left-1&&b.right<=stage.right+1&&b.top>=stage.top-1&&b.bottom<=stage.bottom+1};});
 const actions=[...document.querySelectorAll('[data-player-action]')].filter(e=>e.dataset.playerAction!=='pause'&&visible(e)).map(e=>{const b=e.getBoundingClientRect();return{id:e.id,width:b.width,height:b.height,separate:b.left>=left.right+5,inside:b.right<=stage.right+1&&b.bottom<=stage.bottom+1};});return{targets,actions,overflow:document.documentElement.scrollWidth>innerWidth||document.documentElement.scrollHeight>innerHeight};});
 for(const t of checks.targets)assert(t.width>=44&&t.height>=44&&t.inside,`${label}: target ${JSON.stringify(t)}`);
 for(const a of checks.actions)assert(a.width>=44&&a.height>=44&&a.separate&&a.inside,`${label}: action ${JSON.stringify(a)}`);
 assert.equal(checks.overflow,false,`${label}: page overflow`);await shot(p,label);return checks;
}
async function settings(p,movement,labels='arrows',touch=false){
 await p.locator('#movement-options')[touch?'tap':'click']();await p.locator('#movement-settings').waitFor({state:'visible'});
 await p.locator('#movement-layout').selectOption(movement);await p.locator('#movement-labels').selectOption(labels);
 await p.locator('#close-movement-settings')[touch?'tap':'click']();await p.locator('#movement-settings').waitFor({state:'hidden'});
}
async function practiceReady(p){await wait(p,'preparation',s=>s.mode==='practice'&&s.practiceReady);}
async function walkTo(p,dataset,x,z,opening=false){
 const held=new Set();try{for(let i=0;i<180;i++){const data=await read(p,dataset),position=(opening?data.prologue:data).position,dx=x-position.x,dz=z-position.z;if(Math.hypot(dx,dz)<.18)return;const wanted=new Set([...(Math.abs(dx)>.08?[dx>0?'d':'a']:[]),...(Math.abs(dz)>.08?[dz>0?'s':'w']:[])]);for(const key of held)if(!wanted.has(key)){await p.keyboard.up(key);held.delete(key);}for(const key of wanted)if(!held.has(key)){await p.keyboard.down(key);held.add(key);}await p.waitForTimeout(85);}throw new Error('Walk did not reach interaction');}finally{for(const key of held)await p.keyboard.up(key);await p.waitForTimeout(150);}
}
async function foundation(browser){const results=[];
 const {context,p,errors,failed}=await setup(browser);try{
 await enter(p,'/preparation.html?review=1&practice=1&inspect=1');await practiceReady(p);
 assert.equal(await p.locator('#move-pad').isVisible(),false);const initial=await read(p,'preparation');
 await p.keyboard.down('w');const key=mid(await p.locator('[data-move=forward]').boundingBox());await p.mouse.move(key.x,key.y);await p.mouse.down();await p.waitForTimeout(180);await p.mouse.up();assert.equal((await vector(p)).forward,1,'Virtual W release preserves physical W');await p.waitForTimeout(120);assert((await read(p,'preparation')).position.z<initial.position.z-.2);await p.keyboard.up('w');
 await p.keyboard.down('s');await p.keyboard.down('d');assert(Math.abs(Math.hypot(...Object.values(await vector(p)))-1)<1e-6);await p.keyboard.up('s');await p.keyboard.up('d');
 await p.locator('[data-move=left]').focus();await p.keyboard.down('Space');assert.equal((await vector(p)).x,-1);await p.waitForTimeout(120);await p.keyboard.up('Space');assert.equal((await vector(p)).x,0);
 await p.keyboard.down('d');await p.locator('#movement-options').click();assert((await read(p,'preparation')).paused);assert.deepEqual(await vector(p),{x:0,forward:0});await p.locator('#movement-labels').selectOption('arrows');
 await p.keyboard.press('w');await p.keyboard.press('e');await p.keyboard.press('f');assert.equal((await read(p,'preparation')).throws,0,'Settings focus must not drive gameplay');await p.keyboard.press('Escape');await p.keyboard.up('d');await p.waitForTimeout(150);assert.deepEqual(await vector(p),{x:0,forward:0});
 assert.equal(await p.locator('[data-move=forward]').innerText(),'↑');await p.reload();await p.locator('#enter').waitFor({state:'visible'});await p.locator('#enter').click();await practiceReady(p);assert.equal(await p.locator('[data-move=forward]').innerText(),'↑');
 const box=await p.locator('canvas').boundingBox();await p.mouse.move(box.x+box.width*.86,box.y+box.height*.15);await p.keyboard.down('d');const before=await read(p,'preparation');await p.keyboard.down('f');await p.keyboard.down('f');await p.waitForTimeout(280);await p.keyboard.up('f');const during=await read(p,'preparation');assert.equal(during.throws,1);assert(during.position.x-before.position.x>.2,'Movement continues during sling');await p.keyboard.up('d');await wait(p,'preparation',s=>s.misses===1);
 await p.keyboard.press('Escape');await wait(p,'preparation',s=>s.paused);await p.keyboard.press('Escape');await wait(p,'preparation',s=>!s.paused);
 await layout(p,'desktop-real-practice');await p.locator('#throw').click();await wait(p,'preparation',s=>s.throws===2);await wait(p,'preparation',s=>s.misses===2);assert.equal((await read(p,'preparation')).throws,2,'Pointerup and compatibility click fire only once');
 await p.keyboard.down('d');await p.setViewportSize({width:1200,height:700});await p.waitForTimeout(100);assert.deepEqual(await vector(p),{x:0,forward:0});await p.keyboard.up('d');
 assert.equal(await p.evaluate(()=>localStorage.getItem('bible-comic.episode.local.v1')),null);assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);results.push({layout:'desktop',status:'PASS',checks:'Actual practice movement, physical/virtual ownership, normalised diagonal, focused direction key, settings input mask/persistence, held F once, move + sling, pause and resize cancellation, no save mutation'});
 }finally{await context.close();}
 for(const[label,width,height]of[['portrait',390,844],['landscape',844,390],['small-portrait',320,568]]){
 const{context,p,errors,failed}=await setup(browser,width,height,true);try{const t=await touchDriver(context,p);
 await enter(p,'/preparation.html?review=1&practice=1&inspect=1',true);await practiceReady(p);assert(await p.locator('#move-pad').isVisible());await layout(p,`${label}-real-stick`);
 const before=await read(p,'preparation');await t.stick(34,0);await t.aim(.25,-.2);assert.equal((await read(p,'preparation')).throws,0,'Touch aim is not a throw');await t.tap('#throw');await wait(p,'preparation',s=>s.throws===1);await p.waitForTimeout(220);assert((await read(p,'preparation')).position.x-before.position.x>.3);assert((await vector(p)).x>.9,'Action thumb release must leave movement thumb active');await t.end(1);await wait(p,'preparation',s=>s.misses===1);assert.equal((await read(p,'preparation')).throws,1);assert.deepEqual(await vector(p),{x:0,forward:0});
 await t.stick(-34,0);const action=mid(await p.locator('#throw').boundingBox());await t.start(2,action);await t.cancel();await p.waitForTimeout(120);assert.equal((await read(p,'preparation')).throws,1,'Cancelled action cannot throw');assert.deepEqual(await vector(p),{x:0,forward:0});
 await settings(p,'keys','arrows',true);assert.equal(await p.locator('#move-pad').isVisible(),false,'Direction mode must hide the old practice stick');await layout(p,`${label}-real-arrows`);const forward=mid(await p.locator('[data-move=forward]').boundingBox()),right=mid(await p.locator('[data-move=right]').boundingBox());await t.start(1,forward);await t.start(2,right);let v=await vector(p);assert(v.x>.6&&v.forward>.6);await t.end(1);assert.equal((await vector(p)).x,1);assert.equal((await vector(p)).forward,0);await t.end(2);
 await settings(p,'stick','arrows',true);await t.stick(-30,0);await t.tap('#pause');await t.end(1);assert((await read(p,'preparation')).paused);assert.equal(await p.locator('#player-movement').isVisible(),false);await p.locator('#pause').tap();assert.deepEqual(await vector(p),{x:0,forward:0});
 await t.stick(25,0);await p.setViewportSize({width:height,height:width});await p.waitForTimeout(150);assert.deepEqual(await vector(p),{x:0,forward:0});await t.cancel();
 const heldAction=mid(await p.locator('#throw').boundingBox());await t.start(2,heldAction);await p.locator('#reset').press('Enter');await practiceReady(p);await t.end(2);await p.waitForTimeout(200);assert.equal((await read(p,'preparation')).throws,1,'Restart cannot replay a queued throw');assert.deepEqual(await vector(p),{x:0,forward:0});
 }catch(error){await shot(p,label+'-failure');throw error;}finally{await context.close();}
 results.push({layout:label,status:'PASS',checks:'Actual two-thumb move/aim/throw, one throw per tap, cancel, independent two-key pointers, 44px targets, preferences, pause and rotation input reset'});
 }
 return results;
}
async function chapters(browser){const results=[];
 for(const[name,url,dataset,ready]of[['opening','/valley.html?inspect=1','valley',s=>s.mode==='prologue'&&s.prologue.stage==='courtyard'],['camp','/camp.html?review=1&inspect=1','camp',s=>s.mode==='explore'],['challenge','/challenge.html?review=1&inspect=1','challenge',s=>s.mode==='explore']]){
 const{context,p,errors,failed}=await setup(browser);try{
 await enter(p,url);assert.equal(await p.locator('#player-movement').isVisible(),false,'Cinematic masks movement');await p.keyboard.down('w');await p.keyboard.press('e');await wait(p,dataset,ready);await p.keyboard.up('w');assert.deepEqual(await vector(p),{x:0,forward:0},'Automatic handoff clears stale held keys');
 const get=s=>name==='opening'?s.prologue:s;let s=get(await read(p,dataset)),before={...s.position};const back=mid(await p.locator('[data-move=back]').boundingBox());await p.mouse.move(back.x,back.y);await p.mouse.down();await p.waitForTimeout(330);await p.mouse.up();await p.waitForTimeout(120);s=get(await read(p,dataset));assert(s.position.z-before.z>.15,`${name}: virtual key moves real David`);
 await layout(p,name+'-movement-console');await settings(p,'stick');assert(await p.locator('#move-pad').isVisible());await settings(p,'keys');
 await p.locator('#pause').click();const frozen=get(await read(p,dataset)).position;await p.keyboard.press('w');await p.locator('#pause').click();await p.waitForTimeout(180);assert.deepEqual(get(await read(p,dataset)).position,frozen);
 if(name==='opening'){await walkTo(p,dataset,0,-5.8,true);await walkTo(p,dataset,-.7,-7.3,true);await p.locator('#survey').click();await wait(p,dataset,s=>s.prologue.stage==='errand');}
 else{const target=(await read(p,dataset)).target;await walkTo(p,dataset,target.x,target.z);await p.keyboard.down('e');await p.keyboard.down('e');await wait(p,dataset,s=>s.mode==='delivery'||s.mode==='challenge');await p.keyboard.up('e');}
 assert.equal(await p.locator('#player-movement').isVisible(),false,'Interaction returns control to the cinematic');const acting=get(await read(p,dataset));assert.equal(acting.starts[name==='opening'?'errand':name==='camp'?'delivery':'challenge'],1,'One accepted interaction owns the cue');await shot(p,name+'-shared-interaction');
 assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);results.push({chapter:name,status:'PASS',basis:name==='opening'?'Fresh field opening with automatic messenger':'Explicit chapter review fixture',checks:'Cinematic input mask, stale held-key handoff, actual virtual-key movement, preferences, pause and once-only contextual action'});
 }catch(error){await shot(p,name+'-failure');throw error;}finally{await context.close();}}
 return results;
}
async function battleChecks(browser){const results=[];
 for(const[label,width,height,touch]of[['desktop',1280,720,false],['portrait',390,844,true],['landscape',844,390,true]]){
 const{context,p,errors,failed}=await setup(browser,width,height,touch);try{const t=touch?await touchDriver(context,p):null;
 await enter(p,'/duel.html?review=1&inspect=1',touch);await wait(p,'movement',s=>s.battle.phase==='approach');assert(await p.locator('#player-movement').isVisible());
 if(t)await t.stick(0,-34);else await p.keyboard.down('w');await wait(p,'movement',s=>s.battle.phase==='challenge');if(t)await t.end(1);else await p.keyboard.up('w');assert.equal(await p.locator('#player-movement').isVisible(),false);await wait(p,'movement',s=>s.battle.phase==='fight');assert.deepEqual(await vector(p),{x:0,forward:0});
 if(!touch){await wait(p,'movement',s=>s.battle.phase==='defeat');await wait(p,'duel',s=>s.run.status==='defeated');assert.equal(await p.locator('#player-movement').isVisible(),false);await p.locator('#battle-replay').click();await wait(p,'movement',s=>s.battle.phase==='fight');assert.deepEqual(await vector(p),{x:0,forward:0});assert.equal((await read(p,'movement')).battle.stones,5);assert.equal((await read(p,'duel')).run.attempt,2);await shot(p,'desktop-retry-controls');}
 for(let index=0;index<3;index++){
  await wait(p,'movement',(s,i)=>s.battle.attack==='windup'&&s.battle.dodges===i&&s.battle.attackTime>.4,index);await p.keyboard.press('f');assert.equal((await read(p,'movement')).battle.throws,0);
  if(index===0)await layout(p,label+'-real-spear-defence');
  const before=await read(p,'movement');if(t)await t.tap('#dodge');else await p.keyboard.press(index===0?'Shift':'Space');await wait(p,'movement',(s,i)=>s.battle.dodges===i+1,index);const after=await read(p,'movement');assert(Math.hypot(after.x-before.x,after.z-before.z)>.55,'Dodge physically clears the lane');assert.equal(after.battle.phase,'fight');
 }
 await layout(p,label+'-real-unlocked-sling');const box=await p.locator('canvas').boundingBox();
 if(t){await t.stick(20,0);await t.aim(.3,-.2);await t.tap('#throw-stone');await p.waitForTimeout(250);assert((await vector(p)).x>.5);await t.end(1);}else{await p.mouse.move(box.x+box.width*.9,box.y+box.height*.12);await p.locator('#throw-stone').click();}
 await wait(p,'movement',s=>s.battle.misses===1);assert.equal((await read(p,'movement')).battle.throws,1);await shot(p,label+'-real-moving-sling');
 const target=await p.locator('canvas').evaluate(e=>{const s=JSON.parse(e.dataset.movement),camera=window.ctrl03App.root.findByName('Follow camera').camera,point=camera.entity.getPosition().clone().set(s.battle.target.x,s.battle.target.y,s.battle.target.z),at=camera.worldToScreen(point);return{x:at.x/e.clientWidth,y:at.y/e.clientHeight};});
 if(t){const s=await read(p,'movement');await t.aim(target.x-s.battle.aimX,target.y-s.battle.aimY);await t.tap('#throw-stone');}else{await p.mouse.move(box.x+box.width*target.x,box.y+box.height*target.y);await p.keyboard.press('f');}
 await p.locator('#review-gate').waitFor({state:'visible',timeout:20000});assert.equal(await p.locator('#player-movement').isVisible(),false);assert.equal((await read(p,'duel')).run.completed.length,11);assert.equal((await read(p,'movement')).battle.hits,1);assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);results.push({layout:label,status:'PASS',basis:'Explicit prepared Chapter 5 review fixture; actual entrance, challenge, three earned evasions and shots',checks:'Virtual/stick approach, cinematic handoff, Shift/Space or touch dodge, physical evasion, sling lock/readiness, move + throw, miss and real forehead hit'});
 }catch(error){await shot(p,label+'-battle-failure');throw error;}finally{await context.close();}}
 return results;
}
(async()=>{const browser=await chromium.launch({channel:'chrome',args:['--autoplay-policy=user-gesture-required']});try{
 const results=await({foundation,chapters,battle:battleChecks}[suite])(browser);const record={status:'PASS',suite,browser:browser.version(),results,limitations:'Browser touch emulation; not physical-device performance, new jump mechanics, or a full six-chapter release regression.'};fs.writeFileSync(path.join(out,suite+'-results.json'),JSON.stringify(record,null,2));console.log(JSON.stringify(record));
}finally{await browser.close();}})().catch(error=>{console.error(error);process.exitCode=1;});
