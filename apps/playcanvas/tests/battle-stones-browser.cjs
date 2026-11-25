const{chromium}=require(process.argv[2]),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const{open,read,wait,evasion,capture}=require('./cinematic-battle-browser.cjs');
const{aimBallisticForehead}=require('./cinematic-battle-aim.cjs');
const{completeAftermath}=require('./continuous-battle-driver.cjs');
const out=path.resolve(process.argv[4]),label=process.argv[5]||'desktop';fs.mkdirSync(out,{recursive:true});

async function assertDockedRoute(page,expected){
 const dock=page.locator('#duel-route-instructions');await dock.waitFor({state:'visible'});assert.match(await dock.innerText(),expected);
 const anchors=await page.evaluate(()=>{
   const dock=document.querySelector('#duel-route-instructions'),stage=document.querySelector('canvas'),pin=document.querySelector('.destination-guide');
   const card=dock.getBoundingClientRect(),screen=stage.getBoundingClientRect();
   const overlaps=[...document.querySelectorAll('#forehead-target,#throw-stone,#collect-stones,#dodge,#jump-shot,#battle-interact')].some(element=>{
     if(element.hidden||!element.getClientRects().length)return false;
     const b=element.getBoundingClientRect();return Math.min(b.right,card.right)>Math.max(b.left,card.left)&&Math.min(b.bottom,card.bottom)>Math.max(b.top,card.top);
   });
   return {top:card.top-screen.top,bottom:card.bottom-screen.top,height:screen.height,right:screen.right-card.right,overlaps,hasFloatingText:!!pin.querySelector('strong,small')};
 });
 assert(!anchors.hasFloatingText&&!anchors.overlaps&&anchors.top>=0&&anchors.bottom<anchors.height*.42&&anchors.right<17,JSON.stringify(anchors));
}

async function run(){const browser=await chromium.launch({channel:'chrome',headless:true,args:['--autoplay-policy=user-gesture-required']}),t=await open(browser,label),{p,driver}=t;let lastEvaded=-1;const checks=[];
 async function guard(){const s=await read(p);assert.equal(s.battle.phase,'fight','Combat remained playable');if(s.battle.attack==='windup'&&s.battle.attackTime>.48&&s.battle.strikes!==lastEvaded&&s.dodgeCooldown===0){lastEvaded=s.battle.strikes;await driver.release();await driver.action('dodge');await p.waitForTimeout(160);return true;}
   if(s.battle.attack==='strike'||s.battle.attack==='windup'&&s.battle.strikes===lastEvaded){await driver.release();await p.waitForTimeout(80);return true;}return false;}
 async function until(fn,timeout=30000,protect=true){const end=Date.now()+timeout;while(Date.now()<end){const s=await read(p);if(fn(s))return s;if(protect)await guard();await p.waitForTimeout(80);}throw Error('Condition timed out: '+String(fn));}
 async function pauseCheck(){await driver.release();await driver.tap('#pause');const s=await read(p);if(s.battle.stoneRecovery.pickup){assert.equal(s.animation,'pickup_provisions');await capture(t,'automatic-pickup-paused');}await p.waitForTimeout(350);assert.deepEqual((await read(p)).battle.stoneRecovery,s.battle.stoneRecovery);assert.equal((await read(p)).battle.time,s.battle.time);await driver.tap('#pause');checks.push('Pause freezes combat and stone recovery');}
 async function walkCollect(wanted,timeout=75000,interrupt=false){const end=Date.now()+timeout;let interrupted=false;while(Date.now()<end){let s=await read(p);if(s.battle.stoneRecovery.recovered>=wanted){await driver.release();return;}if(await guard()){await driver.release();continue;}s=await read(p);const pool=s.battle.stoneRecovery;if(pool.recovered>=wanted){await driver.release();return;}const token=pool.stones.find(x=>x.id===pool.targetId);assert(token?.position,'Ground target with actual position');
   const r=Math.hypot(token.position.x-s.x,token.position.z-s.z);
   if(r<.66){await driver.release();if(interrupt&&!interrupted&&pool.pickup?.time>0&&s.dodgeCooldown===0){const held=s.battle.stones;await pauseCheck();await driver.action('dodge');await p.waitForTimeout(220);assert.equal((await read(p)).battle.stones,held);assert(!(await read(p)).battle.stoneRecovery.pickup);checks.push('Dodge cancels pickup without granting a stone');interrupted=true;}else await p.waitForTimeout(80);}
   else{const route=await p.locator('.walking-route').evaluate(e=>JSON.parse(e.dataset.points||'[]')),at=route[0]??token.position,dx=at.x-s.x,dz=at.z-s.z,l=Math.hypot(dx,dz),a=s.yaw;await driver.direction((dx*Math.cos(a)-dz*Math.sin(a))/l,(-dx*Math.sin(a)-dz*Math.cos(a))/l);await p.waitForTimeout(80);}
 }throw Error('Could not collect '+wanted+' stones');}
 try{
   const loaded=await read(p);assert.equal(loaded.battle.stones,5);assert(loaded.battle.stoneRecovery.stones.every(s=>s.status==='held'));assert.equal(await p.evaluate(()=>window.battleTestApp.root.find(e=>/^Recoverable stone |^Recovery stone ring /.test(e.name)&&e.enabled).length),0);checks.push('Loading warm-up leaves five held stones and no visible ground drops');
   await p.evaluate(()=>{
     const app=window.battleTestApp,lane=app.root.findByName('Spear warning 0'),landing=app.root.findByName('Spear landing warning'),head=app.root.findByName('Thrown spear head');
     window.groundWarningAudit=[];
     app.on('frameend',()=>{
       const raw=document.querySelector('canvas').dataset.movement;if(!raw)return;
       const {battle:b}=JSON.parse(raw);
       if(b.phase==='fight'&&['windup','strike'].includes(b.attack))window.groundWarningAudit.push({sword:b.combatStage==='sword',state:b.attack,time:b.attackTime,lane:lane.enabled,circle:landing.enabled,weapon:head.enabled,opacity:lane.render.meshInstances[0].material.opacity});
     });
   });
   await evasion(t,0,'back');await evasion(t,1,'right');await evasion(t,2,'left');checks.push('Sword and two spear stages survived with real controls');
   if(label==='desktop'){
     await driver.aim('movement',.73,.37);await driver.action('sling');await until(s=>s.battle.misses===1);assert(await p.locator('#collect-stones').isEnabled());
     await wait(p,s=>s.battle.phase==='defeat');assert.equal((await read(p)).battle.weaponHit,'spear');assert((await read(p)).battle.lastContact);await driver.tap('#battle-replay');await wait(p,s=>s.battle.phase==='fight');const reset=await read(p);assert.equal(reset.battle.stones,5);assert(reset.battle.stoneRecovery.stones.every(s=>s.status==='held'));assert(!reset.battle.stoneRecovery.guiding);
     await evasion(t,0,'back');await evasion(t,1,'right');await evasion(t,2,'left');lastEvaded=-1;checks.push('Real spear hit defeats David; Retry restores five stones and clears old drops at the battle checkpoint');
   }
   await capture(t,'aiming-and-slower-spears');
   const geometry=await p.evaluate(()=>['collect-stones','throw-stone','dodge','jump','jump-shot'].map(id=>{const e=document.getElementById(id),b=e.getBoundingClientRect();return{id,x:b.x,y:b.y,w:b.width,h:b.height,inside:b.x>=0&&b.y>=0&&b.right<=innerWidth&&b.bottom<=innerHeight,clear:e.contains(document.elementFromPoint(b.x+b.width/2,b.y+b.height/2))};}));for(const box of geometry)assert(box.w>=43&&box.h>=43&&box.inside&&box.clear,JSON.stringify(box));for(let i=0;i<geometry.length;i++)for(let j=i+1;j<geometry.length;j++){const a=geometry[i],b=geometry[j];assert(Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x)<=1||Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y)<=1,'Overlapping actions '+a.id+' / '+b.id);}
   for(let i=1;i<=5;i++){await until(s=>!s.battle.shot&&s.battle.throwTime===undefined&&s.dodgeCooldown===0);await driver.aim('movement',.66+i*.025,.37);await driver.action('sling');if(i===1){await until(s=>s.battle.shot?.kind==='flight'&&s.battle.shot.time>.15,5000,false);await capture(t,'visible-stone-flight');}await until(s=>s.battle.misses===i);}
   const empty=await read(p);assert.equal(empty.battle.stones,0);assert.equal(empty.battle.stoneRecovery.stones.filter(s=>s.status==='ground').length,5);assert.equal(empty.battle.hits,0);checks.push('Five real misses leave five individual recoverable stones and no victory');await capture(t,'five-misses-empty');
   if(label==='desktop')await p.keyboard.press('r');else await driver.tap('#collect-stones');await until(s=>s.battle.stoneRecovery.guiding);await p.locator('.destination-guide').waitFor({state:'visible',timeout:5000});await assertDockedRoute(p,/Stone \d/);await capture(t,'stone-route');
   await walkCollect(1,75000,true);checks.push('Arrow-guided walk and automatic single pickup');
   await until(s=>!s.battle.shot&&s.battle.throwTime===undefined&&s.dodgeCooldown===0);await driver.aim('movement',.73,.37);await driver.action('sling');await until(s=>s.battle.misses===6);assert.equal((await read(p)).battle.stones,0);assert.equal((await read(p)).battle.stoneRecovery.stones.filter(s=>s.status==='ground').length,5);checks.push('Recovered one stone can be thrown while four remain');
   await walkCollect(6,100000);assert.equal((await read(p)).battle.stones,5);assert.equal((await read(p)).battle.stoneRecovery.stones.filter(s=>s.status==='ground').length,0);assert(!(await read(p)).battle.stoneRecovery.guiding);await capture(t,'all-five-collected');checks.push('All five recovered once, route ends and inventory stays bounded');
   // Move into physical sling range while defending; neither aim nor collisions are overridden.
   await until(s=>s.battle.attack==='recover');for(let i=0;i<200;i++){if(await guard())continue;const s=await read(p);if(s.battle.guidance.distance<11.2&&s.battle.guidance.distance>7)break;await driver.direction(0,s.battle.guidance.distance>11.2?1:-1);await p.waitForTimeout(70);}await driver.release();
   await until(s=>s.battle.attack==='recover'&&s.battle.attackTime<1.5);await aimBallisticForehead(p,driver);await capture(t,'physical-forehead-aim');await driver.action('sling');await until(s=>s.battle.phase==='finisher'||s.battle.hits===1,12000,false);assert.equal((await read(p)).battle.hits,1);checks.push('Physically aimed recovered stone earns forehead hit and replay');
   await wait(p,s=>s.battle.phase==='retrieve');await assertDockedRoute(p,/Goliath’s sword/);await capture(t,'sword-route');
   await completeAftermath(p,driver);assert.equal((await read(p,'duel')).run.battle.stage,'finished');checks.push('Stone and sword route text stays in the upper-right HUD');checks.push('Sword pickup, player finish and saved Chapter 6 gate preserved');await capture(t,'victory-gate');
   const flights=await p.evaluate(()=>window.spearFlightAudit);
   const warnings=await p.evaluate(()=>window.groundWarningAudit);
   for(const [sword,half] of [[true,.22],[false,1.05]]){
     const rows=warnings.filter(row=>row.sword===sword),windup=rows.filter(row=>row.state==='windup'),strike=rows.filter(row=>row.state==='strike');
     assert(windup.length&&windup.every(row=>row.lane&&row.circle===!sword&&Math.abs(row.opacity-.30)<.001));
     assert(strike.some(row=>row.time>0&&row.time<half&&row.lane&&row.circle===!sword));
     assert(strike.some(row=>row.time<half&&row.opacity>0&&row.opacity<.29),'Ground cue fades before halfway');
     const late=strike.filter(row=>row.time>=half);
     assert(late.length&&late.every(row=>!row.lane&&!row.circle&&(sword||row.weapon)),'Only the ground marker disappears at halfway');
   }
   checks.push('Faint sword and spear ground warnings fade by 0.22 s and 1.05 s of their active attacks');
   fs.writeFileSync(path.join(out,label+'-warning-frames.json'),JSON.stringify(warnings));
   await p.reload();await p.locator('#review-gate').waitFor({timeout:60000});assert.equal((await read(p,'duel')).run.battle.stage,'finished');checks.push('Reload preserves completed battle and Chapter 6 gate');
   const cropped=flights.filter(f=>f.time>.02&&f.parts.some(p=>!p.enabled||p.z<0||p.x<0||p.x>1||p.y<0||p.y>1));
   assert(flights.length>25);assert(Math.max(...flights.map(f=>f.time))>2);assert.equal(cropped.length,0,'Visible spear throughout flight: '+JSON.stringify(cropped.slice(0,2)));checks.push('Slower spear visible through its full 2.1s flight');assert.deepEqual(t.errors,[]);
   const result={status:'PASS',label,basis:'Frozen local production build, reducer-built prepared checkpoint, actual mouse/keyboard or emulated multitouch controls; normal game clocks; no runtime state writes.',checks,geometry,spearFrames:flights.length,maxFlightTime:Math.max(...flights.map(f=>f.time)),consoleErrors:t.errors};fs.writeFileSync(path.join(out,label+'-results.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
 }catch(e){await capture(t,'failure');fs.writeFileSync(path.join(out,label+'-error.txt'),e.stack);throw e;}finally{await t.context.close();await browser.close();}
}
run().catch(e=>{console.error(e.stack);process.exitCode=1;});
