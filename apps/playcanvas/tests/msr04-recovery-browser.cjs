const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.argv[2]),{createDriver}=require('./ctrl07-browser-driver.cjs');
const {freshRun,objectives,reduceEpisode}=require('../src/gameplay/episode-rules.ts');
const {routeHintKey,storePavilionHint}=require('../src/gameplay/pavilion-route.ts');
const origin=process.argv[3],out=path.resolve(process.argv[4]);fs.mkdirSync(out,{recursive:true});
const read=(p,key)=>p.locator('canvas').evaluate((e,k)=>JSON.parse(e.dataset[k]),key);
const wait=(p,key,fn)=>p.waitForFunction(({key,fn})=>{const raw=document.querySelector('canvas')?.dataset[key];return raw&&new Function('s',`return (${fn})(s)`)(JSON.parse(raw));},{key,fn:String(fn)},{timeout:90000});
async function walk(p,d,key,x,z){try{for(let i=0;i<220;i++){if(key==='challenge'&&!p.url().includes('challenge.html'))return;const s=await read(p,key);if(s.mode==='transfer')return;const dx=x-s.position.x,dz=z-s.position.z,r=Math.hypot(dx,dz);if(r<.17)return;const yaw=s.yaw??0;await d.direction((dx*Math.cos(yaw)-dz*Math.sin(yaw))/r,(-dx*Math.sin(yaw)-dz*Math.cos(yaw))/r);await p.waitForTimeout(65);}throw Error('Route blocked');}catch(error){if(key!=='challenge'||!String(error).includes('Execution context was destroyed'))throw error;await p.waitForURL('**/preparation.html?**',{timeout:10000});}finally{await d.release();}}
(async()=>{const browser=await chromium.launch({channel:'chrome'});try{for(const scenario of (process.argv[5]?process.argv[5].split(','):['page-retry','module-retry','checkpoint-fallback','asset-reload','stale-hint','source-reload','review-isolation'])){
 const context=await browser.newContext({viewport:{width:1280,height:720}}),p=await context.newPage(),d=await createDriver(context,p,false),errors=[],consoleErrors=[];p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text());});let seed=freshRun();for(const goal of objectives.slice(0,5))seed=reduceEpisode(seed,{type:'objective',id:goal.id});
 await p.addInitScript(({seed})=>{if(!localStorage.getItem('bible-comic.episode.local.v1'))localStorage.setItem('bible-comic.episode.local.v1',JSON.stringify({current:seed,history:[]}));},{seed});const saved=()=>p.evaluate(()=>JSON.parse(localStorage.getItem('bible-comic.episode.local.v1')).current);let injected=0,blockAsset=true;
 try{
  if(['page-retry','module-retry','checkpoint-fallback'].includes(scenario))await p.route(scenario==='module-retry'?'**/assets/preparation-*.js':'**/preparation.html*',async route=>{if(injected++===0)await route.fulfill({status:503,contentType:'text/plain',body:'Intentional MSR04 recovery fixture'});else await route.continue();});
  if(scenario==='asset-reload')await p.route('**/assets/david-preparation-*.glb',async route=>{if(blockAsset){injected++;await route.fulfill({status:503,body:'Intentional persistent asset failure'});}else await route.continue();});
  if(scenario==='stale-hint'){
   const data=new Map(),store={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};storePavilionHint(store,seed,false,Date.now()-400000);await p.addInitScript(({key,value})=>sessionStorage.setItem(key,value),{key:routeHintKey,value:data.get(routeHintKey)});
   await p.goto(origin+'/preparation.html?arrival=r07&inspect=1');await p.locator('#enter').waitFor({timeout:90000});assert.equal((await read(p,'preparation')).arrival.route,null);assert.equal((await read(p,'preparation')).mode,'entry');assert.equal((await read(p,'preparation')).objective,'saul.audience');await d.tap('#enter');await wait(p,'preparation',s=>s.mode==='explore');
  }else if(scenario==='source-reload'){
   await p.goto(origin+'/challenge.html?inspect=1');await p.waitForURL('**/preparation.html?inspect=1');await p.locator('#enter').waitFor({timeout:90000});assert.equal((await read(p,'preparation')).objective,'saul.audience');assert.equal((await read(p,'preparation')).starts.audience,0);
  }else{
   await p.goto(origin+'/challenge.html?review=1&route=saul&inspect=1');await p.locator('#enter').waitFor({timeout:90000});await d.tap('#enter');await wait(p,'challenge',s=>s.mode==='departure');const previewId=(await read(p,'challenge')).run.runId;assert.notEqual(previewId,seed.runId);
   await walk(p,d,'challenge',.7,11.7);
   if(scenario==='review-isolation'){
    await walk(p,d,'challenge',.7,13.82);await d.action('jump');await wait(p,'challenge',s=>s.jump.phase==='airborne');await d.direction(0,1);await p.waitForTimeout(400);await d.release();const airborne=await read(p,'challenge');assert.equal(airborne.mode,'departure','Airborne exit cannot transfer');assert(airborne.jump.height>0);assert(Math.hypot(airborne.position.x-.7,airborne.position.z-14.5)<.45,'The airborne check must actually enter the exit trigger');await wait(p,'challenge',s=>s.jump.phase==='grounded'||s.mode==='transfer');
   }
   await walk(p,d,'challenge',.7,14.5);
   if(['page-retry','module-retry','checkpoint-fallback'].includes(scenario)){
    await p.locator('#route-error').waitFor({state:'visible',timeout:20000});assert(p.url().includes('challenge.html'));assert.equal((await read(p,'challenge')).run.completed.length,5);assert.equal((await read(p,'challenge')).route.navigationSent,false);await p.screenshot({path:path.join(out,scenario+'-covered-error.png')});
    if(scenario==='checkpoint-fallback'){await d.tap('#route-checkpoint');await p.waitForURL('**/preparation.html?review=1&inspect=1');await p.locator('#enter').waitFor({timeout:90000});assert.equal((await read(p,'preparation')).arrival.route,null);}
    else{await d.tap('#pause');const held=(await read(p,'challenge')).route.transferAge;await d.tap('#retry-route');await wait(p,'challenge',s=>s.route.network.state==='ready');await p.waitForTimeout(300);assert.equal((await read(p,'challenge')).route.transferAge,held);assert.equal((await read(p,'challenge')).paused,true);assert(p.url().includes('challenge.html'));await d.tap('#pause');}
   }
   if(scenario!=='checkpoint-fallback')await p.waitForURL('**/preparation.html?**',{timeout:30000});
   if(scenario==='asset-reload'){
    await p.locator('#retry').waitFor({state:'visible',timeout:90000});assert.equal(await p.locator('#entry').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(23, 33, 36)','Failed loading stays opaque');assert.deepEqual(await saved(),seed);blockAsset=false;await d.tap('#retry');await p.locator('#enter').waitFor({timeout:90000});
   }else if(scenario!=='checkpoint-fallback'){
    await wait(p,'preparation',s=>s.mode==='explore'&&!s.arrival.cover||s.mode==='entry'&&s.arrival.autoEntry==='tap_required');assert.equal((await read(p,'preparation')).arrival.route,'r07');assert.equal((await read(p,'preparation')).run.runId,previewId);assert.equal(await p.evaluate(key=>sessionStorage.getItem(key),routeHintKey),null,'Arrival consumes its hint');
   }
   if((await read(p,'preparation')).mode==='entry')await d.tap('#enter');await wait(p,'preparation',s=>s.mode==='explore'&&!s.arrival.cover);assert.equal((await read(p,'preparation')).starts.audience,0);assert.equal((await read(p,'preparation')).objective,'saul.audience');
   if(scenario==='review-isolation'){await d.tap('#reset');await wait(p,'preparation',s=>s.mode==='explore'&&!s.arrival.cover);assert.equal(await p.locator('#transition').evaluate(e=>Number(getComputedStyle(e).opacity)),0);}
  }
  assert.deepEqual(await saved(),seed,'Recovery/review cannot rewrite the normal checkpoint');assert.deepEqual(errors,[]);const result={scenario,status:'PASS',basis:'Explicit local checkpoint/review fixtures; real UI movement, jump and retry actions. Expected injected HTTP/asset errors are listed separately.',injectedRequests:injected,errors,expectedConsoleErrors:consoleErrors};fs.writeFileSync(path.join(out,scenario+'.json'),JSON.stringify(result,null,2));console.log('PASS MSR04 recovery '+scenario);
 }catch(e){await p.screenshot({path:path.join(out,scenario+'-failure.png')}).catch(()=>{});fs.writeFileSync(path.join(out,scenario+'-failure.json'),JSON.stringify({error:e.stack,url:p.url(),state:await p.locator('canvas').evaluate(e=>e.dataset).catch(()=>null),errors,consoleErrors},null,2));throw e;}
 finally{await context.close();}
}}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
