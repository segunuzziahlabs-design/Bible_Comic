const {chromium}=require(process.argv[2]);
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {freshRun,reduceEpisode,episodePage}=require('../src/gameplay/episode-rules.ts');
const out=path.resolve('docs/implementation/evidence/m3-ch02-2026-11-11');fs.mkdirSync(out,{recursive:true});
const origin='http://127.0.0.1:4184',key='bible-comic.episode.local.v1';
const state=p=>p.locator('canvas').evaluate(el=>JSON.parse(el.dataset.camp));
async function at(p,time){await p.waitForFunction(t=>JSON.parse(document.querySelector('canvas').dataset.camp).time>=t,time,{timeout:40000});}
async function explore(p){await p.waitForFunction(()=>JSON.parse(document.querySelector('canvas').dataset.camp).mode==='explore',undefined,{timeout:40000});}
async function ready(p,url){await p.goto(url);await p.locator('#enter').waitFor({state:'visible',timeout:60000});}
async function move(p,x,z){
 const held=new Set();const started=Date.now();
 try{while(Date.now()-started<10000){const pos=(await state(p)).position,dx=x-pos.x,dz=z-pos.z;if(Math.hypot(dx,dz)<.16)break;
  const desired=new Set([...(Math.abs(dx)>.1?[dx>0?'KeyD':'KeyA']:[]),...(Math.abs(dz)>.1?[dz>0?'KeyS':'KeyW']:[])]);
  for(const key of held)if(!desired.has(key)){await p.keyboard.up(key);held.delete(key);}for(const key of desired)if(!held.has(key)){await p.keyboard.down(key);held.add(key);}await p.waitForTimeout(100);
 }}finally{for(const key of held)await p.keyboard.up(key);}await p.waitForTimeout(250);
 assert.ok(Math.hypot((await state(p)).position.x-x,(await state(p)).position.z-z)<.4,`Movement reached ${x},${z}`);
}
async function deliver(p){await move(p,-1.6,2.7);assert.equal((await state(p)).canInteract,true);await p.locator('#interact').click();}
async function greet(p){await move(p,1.7,1.9);await move(p,2.2,.1);assert.equal((await state(p)).canInteract,true);await p.locator('#interact').click();}
function fixture(count){let run=freshRun();for(const id of ['valley.surveyed','provisions.delivered'].slice(0,count))run=reduceEpisode(run,{type:'objective',id});return{current:run,history:[]};}

(async()=>{
 const browser=await chromium.launch({channel:'chrome'});const context=await browser.newContext({viewport:{width:1366,height:900}}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.stack));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 const started=Date.now();await ready(page,origin+'/camp.html?review=1&inspect=1');const startupMs=Date.now()-started;
 await page.evaluate(k=>localStorage.setItem(k,'review-isolation-sentinel'),key);await page.locator('#enter').click();await explore(page);
 assert.equal((await state(page)).run.completed.length,1);assert.equal((await state(page)).carried,true);
 await page.keyboard.press('KeyE');assert.equal((await state(page)).starts.delivery,0,'No distant action');
 // Walk into a shelter; its expanded collision bounds stop the character.
 await page.keyboard.down('KeyA');await page.waitForTimeout(3400);await page.keyboard.up('KeyA');
 const blocked=(await state(page)).position;assert.ok(blocked.x>-3.13,'Shelter collision stops movement');
 await page.screenshot({path:path.join(out,'01-carry-and-camp.png')});
 await deliver(page);await page.keyboard.press('KeyE');assert.equal((await state(page)).starts.delivery,1,'One action owns one delivery');
 await at(page,4);await page.waitForFunction(()=>JSON.parse(document.querySelector('canvas').dataset.camp).davidMouth.some(w=>w>.15));await page.screenshot({path:path.join(out,'02-david-delivers.png')});
 await at(page,10);await page.waitForFunction(()=>JSON.parse(document.querySelector('canvas').dataset.camp).keeperMouth.some(w=>w>.15));await page.screenshot({path:path.join(out,'03-keeper-response.png')});
 await page.locator('#pause').click();await page.waitForTimeout(150);const frozen=await state(page);await page.waitForTimeout(550);
 const after=await state(page);for(const field of ['time','basket','keeperMouth','davidMouth'])assert.deepEqual(after[field],frozen[field]);assert.equal(after.audio,'suspended');await page.locator('#pause').click();
 await at(page,14.76);await page.locator('#pause').click();await page.waitForTimeout(120);const release=await state(page);assert.equal(release.placed,true);
 assert.ok(Math.abs(release.basket.y-.14-release.tableTop)<.001,'Basket base rests on table');
 assert.ok(Math.hypot(release.hand.x-release.basket.x,release.hand.y-.15-release.basket.y,release.hand.z-release.basket.z)<.025,'Palms meet the prop at release');
 await page.locator('#pause-notice').evaluate(el=>el.style.visibility='hidden');await page.screenshot({path:path.join(out,'04-basket-contact.png')});await page.locator('#pause-notice').evaluate(el=>el.style.visibility='');await page.locator('#pause').click();
 await at(page,18.5);await page.locator('#sound').click();assert.equal(await page.locator('#caption').isVisible(),true);assert.equal((await state(page)).muted,true);await page.locator('#sound').click();
 await explore(page);assert.deepEqual((await state(page)).run.completed,['valley.surveyed','provisions.delivered']);assert.equal((await state(page)).carried,false);
 await greet(page);await at(page,3);await page.waitForFunction(()=>JSON.parse(document.querySelector('canvas').dataset.camp).eliabMouth.some(w=>w>.15));await page.screenshot({path:path.join(out,'05-eliab-greeting.png')});
 await at(page,9);await page.screenshot({path:path.join(out,'06-david-with-brothers.png')});await page.locator('#review-gate').waitFor({state:'visible',timeout:30000});
 assert.deepEqual((await state(page)).run.completed,['valley.surveyed','provisions.delivered','brothers.met']);assert.equal((await state(page)).starts.greeting,1);await page.screenshot({path:path.join(out,'07-chapter-two-complete.png')});
 assert.equal(await page.evaluate(k=>localStorage.getItem(k),key),'review-isolation-sentinel');
 // Normal-save test fixtures describe an earned Chapter 1 checkpoint; they are not claimed as Chapter 1 play evidence.
 await page.evaluate(({key,value})=>localStorage.setItem(key,JSON.stringify(value)),{key,value:fixture(1)});await ready(page,origin+'/camp.html?inspect=1');await page.locator('#enter').click();await explore(page);await deliver(page);await at(page,1);await page.locator('#reset').click();await explore(page);await page.waitForTimeout(24000);
 assert.deepEqual((await state(page)).run.completed,['valley.surveyed'],'Cancelled delivery never gains late credit');assert.equal((await state(page)).carried,true);
 await deliver(page);await page.evaluate(()=>{const original=Storage.prototype.setItem;window.restoreCampStorage=()=>Storage.prototype.setItem=original;Storage.prototype.setItem=function(key,value){if(key==='bible-comic.episode.local.v1')throw new DOMException('Test quota failure','QuotaExceededError');return original.call(this,key,value);};});
 await page.locator('#save-error').waitFor({state:'visible',timeout:40000});assert.equal((await state(page)).run.completed.length,1,'Failed persistence does not advance progress');
 await page.evaluate(()=>window.restoreCampStorage());await page.locator('#retry-save').click();await explore(page);assert.equal((await state(page)).run.completed.length,2);
 await page.reload();await page.locator('#enter').waitFor({state:'visible',timeout:60000});assert.equal((await state(page)).carried,false);assert.equal((await state(page)).placed,true);assert.ok(Math.abs((await state(page)).basket.y-.928942)<.001);assert.equal(await page.locator('#enter').textContent(),'Resume Chapter 2');
 await page.locator('#enter').click();await explore(page);assert.equal((await state(page)).target.x,2.2);await greet(page);await page.locator('#review-gate').waitFor({state:'visible',timeout:40000});
 const saved=JSON.parse(await page.evaluate(k=>localStorage.getItem(k),key));assert.equal(saved.current.completed.length,3);assert.equal(episodePage(saved.current),'challenge.html');
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'browser-results.json'),JSON.stringify({status:'PASS',browser:browser.version(),startupMs,release,checks:['range and shelter collision','one automatic cue per action','all three speaking mouths','audio/prop/mouth pause','table and palm contact','mute with captions','independent delivery and greeting','review storage isolation','restart cancellation past old completion','save failure and retry','delivery-only reload','normal Chapter 2 saved prefix only'],fixtureNote:'Normal-save recovery starts from a typed Chapter 1 checkpoint fixture; review uses an isolated prefix.',errors},null,2));await browser.close();console.log('PASS Chapter 2 desktop journey, visual captures, checkpoint and failure recovery');
})().catch(e=>{console.error(e);process.exit(1);});
