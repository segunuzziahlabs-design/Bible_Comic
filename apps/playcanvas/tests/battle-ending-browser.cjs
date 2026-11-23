// Reducer-built fallen checkpoint. All subsequent movement/swing/story input is real.
const {chromium}=require(process.argv[2]),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {freshRun,reduceEpisode,objectives}=require('../src/gameplay/episode-rules.ts');
const {createDriver}=require('./ctrl07-browser-driver.cjs');
const {walkTarget,swingSword}=require('./continuous-battle-driver.cjs');
const origin=process.argv[3]||'http://127.0.0.1:4226',out=path.resolve(process.argv[4]||'../../docs/quality-review/evidence/battle-ending-2026-11-23'),only=process.argv[5];
fs.mkdirSync(out,{recursive:true});
const layouts={desktop:{width:1280,height:800,touch:false},portrait:{width:390,height:844,touch:true},landscape:{width:844,height:390,touch:true}};
const read=(p,key='movement')=>p.locator('canvas').evaluate((e,key)=>JSON.parse(e.dataset[key]),key);
const wait=(p,fn)=>p.waitForFunction(fn,undefined,{timeout:45000});
async function geometry(p){const g=await p.locator('#sword-grip').evaluate(e=>{const b=e.getBoundingClientRect();return{width:b.width,height:b.height,inside:b.x>=0&&b.y>=0&&b.right<=innerWidth&&b.bottom<=innerHeight,clear:e.contains(document.elementFromPoint(b.x+b.width/2,b.y+b.height/2)),overflow:document.documentElement.scrollWidth>innerWidth+1};});assert(g.inside&&g.clear&&!g.overflow&&g.width>=44&&g.height>=44,JSON.stringify(g));return g;}
(async()=>{const browser=await chromium.launch({channel:'chrome',args:['--autoplay-policy=user-gesture-required']});try{for(const label of only?[only]:Object.keys(layouts)){
 const l=layouts[label],context=await browser.newContext({viewport:{width:l.width,height:l.height},hasTouch:l.touch,isMobile:l.touch}),p=await context.newPage(),errors=[];
 p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 const capture=async name=>{await p.screenshot({path:path.join(out,`${label}-${name}.png`),scale:'css'});const key=(await p.url()).includes('victory')?'victory':'movement';fs.writeFileSync(path.join(out,`${label}-${name}.json`),JSON.stringify(await read(p,key),null,2));};
 try{
 let run=freshRun();for(const o of objectives.slice(0,10))run=reduceEpisode(run,{type:'objective',id:o.id});run=reduceEpisode(run,{type:'battle',action:'begin'});run=reduceEpisode(run,{type:'objective',id:'goliath.struck'});
 await p.addInitScript(run=>{if(!localStorage.getItem('bible-comic.episode.local.v1'))localStorage.setItem('bible-comic.episode.local.v1',JSON.stringify({current:run,history:[]}));},run);
 const driver=await createDriver(context,p,l.touch);
 await p.goto(origin+'/duel.html?inspect=1');await driver.tap('#enter');
 await wait(p,()=>JSON.parse(document.querySelector('canvas').dataset.movement).battle.phase==='retrieve');
 await walkTarget(p,driver);await driver.action('interact');await wait(p,()=>JSON.parse(document.querySelector('canvas').dataset.movement).battle.phase==='finish_approach');
 assert.equal((await read(p,'duel')).run.battle.stage,'sword_taken');
 await p.reload();await driver.tap('#enter');await wait(p,()=>JSON.parse(document.querySelector('canvas').dataset.movement).battle.phase==='finish_approach');
 await walkTarget(p,driver);await driver.action('interact');await wait(p,()=>JSON.parse(document.querySelector('canvas').dataset.movement).battle.phase==='finish_ready');
 const bounds=await geometry(p);await p.waitForTimeout(400);assert.equal((await read(p)).battle.phase,'finish_ready');await capture('ready');
 if(l.touch){
   const b=await p.locator('#sword-grip').boundingBox(),x=b.x+b.width/2,y=b.y+b.height/2;
   await driver.cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:9,x,y}]});
   await driver.cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{id:9,x,y:y-35}]});await p.waitForTimeout(160);
   await driver.cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert.equal((await read(p)).battle.swordSwing,0,'Upward drag cannot finish');
   await driver.cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:9,x,y}]});
   await driver.cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{id:9,x,y:y+40}]});await p.waitForTimeout(450);
   await driver.cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 }else{await p.keyboard.down('e');await p.waitForTimeout(500);await p.keyboard.up('e');}
 await p.waitForTimeout(100);let partial=(await read(p)).battle.swordSwing;assert(partial>0&&partial<.5);await capture('player-lift');
 await p.waitForTimeout(450);assert.equal((await read(p)).battle.swordSwing,partial,'Releasing stops the actual animation');assert.equal((await read(p,'duel')).run.battle.stage,'sword_taken');
 await driver.tap('#pause');await p.waitForTimeout(200);assert.equal((await read(p)).battle.swordSwing,partial);await driver.tap('#pause');
 await p.waitForTimeout(200);assert.equal((await read(p)).battle.swordSwing,partial,'Resume cannot perform an abandoned swing');
 await swingSword(p,driver);await capture('controlled-final-action');await p.locator('#review-gate').waitFor({timeout:15000});
 let done=await read(p,'duel');assert.equal(done.run.battle.stage,'finished');assert.equal(done.run.completed.length,11);await driver.tap('#continue-victory');
 await p.waitForURL('**/victory.html?inspect=1');await driver.tap('#enter');
 await wait(p,()=>{const s=JSON.parse(document.querySelector('canvas').dataset.victory);return s.time>=9;});
 let chase=await read(p,'victory');assert.equal(chase.activity.pursuing,24);assert(chase.activity.firstPursuer.x>-5.2);await capture('israel-pursues');
 await driver.tap('#pause');const frozen=await read(p,'victory');await p.waitForTimeout(300);assert.equal((await read(p,'victory')).time,frozen.time);assert.deepEqual((await read(p,'victory')).activity,frozen.activity);await driver.tap('#pause');
 await wait(p,()=>JSON.parse(document.querySelector('canvas').dataset.victory).time>=18.2);let fight=await read(p,'victory');assert(fight.activity.striking>0);assert(fight.audio.pursuitImpacts>0);await capture('pursuit-strikes');
 await wait(p,()=>JSON.parse(document.querySelector('canvas').dataset.victory).time>=21.5);let fallen=await read(p,'victory');assert.equal(fallen.activity.fallen,24);assert.equal(fallen.audio.pursuitImpacts,24);await capture('philistines-fallen');
 await p.locator('#results').waitFor({timeout:30000});done=await read(p,'victory');assert.equal(done.run.completed.length,12);assert.equal(done.run.status,'completed');assert.deepEqual(errors,[]);await capture('episode-complete');
 await driver.tap('#watch-again');await wait(p,()=>{const s=JSON.parse(document.querySelector('canvas').dataset.victory);return s.starts>=2&&s.time>.3&&s.time<2;});let again=await read(p,'victory');assert.equal(again.activity.fallen,0);assert.equal(again.audio.pursuitImpacts,0);await driver.tap('#pause');
 const result={status:'PASS',label,browser:browser.version(),basis:'Local production build; reducer-built fallen checkpoint; real inputs and normal clock. Touch layouts emulated.',bounds,partialProgress:partial,releasedSwingFreezes:true,swordReload:true,upwardDragIgnored:l.touch,controlledSwing:true,victoryGated:true,pursuing:chase.activity.pursuing,fallen:fallen.activity.fallen,impacts:fallen.audio.pursuitImpacts,completion:done.run.completed.length,restartClearsPursuit:true,errors};
 fs.writeFileSync(path.join(out,`${label}-results.json`),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
 }catch(e){await capture('failure').catch(()=>{});throw e;}finally{await context.close();}
 }}finally{await browser.close();}})().catch(e=>{console.error(e.stack);process.exitCode=1;});
