const { chromium }=require(process.argv[2]);
const fs=require('node:fs');const path=require('node:path');const assert=require('node:assert/strict');
const out=path.resolve('docs/implementation/evidence/m3-ch01-2026-11-11');fs.mkdirSync(out,{recursive:true});
const origin='http://127.0.0.1:4183';
const state=page=>page.locator('canvas').evaluate(el=>JSON.parse(el.dataset.valley));
async function time(page,t){await page.waitForFunction(t=>JSON.parse(document.querySelector('canvas').dataset.valley).time>=t,t,{timeout:60000});}
async function survey(page){
  await page.keyboard.down('KeyW');await page.locator('#survey').waitFor({state:'visible',timeout:10000});await page.keyboard.up('KeyW');
  await page.locator('#survey').click();
}
(async()=>{
 const browser=await chromium.launch({channel:'chrome'});const context=await browser.newContext({viewport:{width:1366,height:900}});
 const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
 page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
 const started=Date.now();await page.goto(origin+'/valley.html?inspect=1');await page.locator('#enter').waitFor({state:'visible',timeout:60000});
 const startupMs=Date.now()-started;console.log('Ready',startupMs,'ms');
 const initial=await state(page);assert.ok(initial.championHead.y-initial.championRoot.y>2,'Goliath rig starts with non-collapsed bones');
 await page.locator('#enter').click();await page.locator('#entry').waitFor({state:'hidden'});
 await time(page,2);await page.screenshot({path:path.join(out,'01-arrival.png')});
 await time(page,7.5);await page.screenshot({path:path.join(out,'02-valley-reveal.png')});
 console.log('WIDE',await state(page));
 await time(page,13.8);await page.waitForFunction(()=>JSON.parse(document.querySelector('canvas').dataset.valley).soldierMouth.some(w=>w>.2));await page.screenshot({path:path.join(out,'03-soldier-speaking.png')});
 await page.locator('#pause').click();await page.waitForTimeout(100);const frozen=await state(page);await page.waitForTimeout(500);
 assert.equal((await state(page)).time,frozen.time);assert.equal((await state(page)).audio,'suspended');assert.deepEqual((await state(page)).soldierMouth,frozen.soldierMouth);
 await page.locator('#pause').click();await time(page,20);await page.screenshot({path:path.join(out,'04-goliath-glimpse.png')});
 await time(page,29);await page.waitForFunction(()=>JSON.parse(document.querySelector('canvas').dataset.valley).davidMouth.some(w=>w>.2));await page.screenshot({path:path.join(out,'05-david-speaking.png')});
 await page.locator('#sound').click();await page.waitForFunction(()=>JSON.parse(document.querySelector('canvas').dataset.valley).muted);
 assert.equal(await page.locator('#caption').isVisible(),true);await page.locator('#sound').click();
 await page.waitForFunction(()=>JSON.parse(document.querySelector('canvas').dataset.valley).mode==='explore',{},{timeout:30000});
 assert.equal((await state(page)).run.completed.length,0,'Intro alone grants no objective');
 await page.screenshot({path:path.join(out,'06-player-control.png')});await survey(page);
 await time(page,1);await page.locator('#reset').click();await page.waitForTimeout(300);
 assert.equal((await state(page)).mode,'intro');await time(page,12);
 assert.equal((await state(page)).run.completed.length,0,'Cancelled survey cannot grant credit after its old end time');
 await page.waitForFunction(()=>JSON.parse(document.querySelector('canvas').dataset.valley).mode==='explore',undefined,{timeout:35000});
 await survey(page);
 await page.keyboard.press('KeyE');assert.equal((await state(page)).surveyCount,2,'Repeated input cannot start a second active survey');
 await page.locator('#review-gate').waitFor({state:'visible',timeout:20000});
 assert.equal((await state(page)).run.completed.length,1);assert.equal((await state(page)).run.completed[0],'valley.surveyed');
 await page.screenshot({path:path.join(out,'07-chapter-one-complete.png')});
 const stored=await page.evaluate(()=>localStorage.getItem('bible-comic.episode.local.v1'));
 await page.locator('#replay').click();await page.locator('#enter').waitFor({state:'visible',timeout:60000});
 await page.locator('#enter').click();await time(page,2);await page.locator('#reset').click();await page.waitForTimeout(300);
 assert.ok((await state(page)).time<1,'Restart resets audio/camera clock');
 assert.equal(await page.evaluate(()=>localStorage.getItem('bible-comic.episode.local.v1')),stored,'Review leaves saved progress unchanged');
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'browser-results.json'),JSON.stringify({status:'PASS',browser:browser.version(),startupMs,errors,chapterCredit:'Only valley.surveyed; Chapter 2 production/review is not entered',review:'Existing saved episode preserved'},null,2));
 await browser.close();console.log('PASS Chapter 1 opening, pause, mute, exploration, survey, saved gate, review isolation and restart');
})().catch(error=>{console.error(error);process.exit(1);});
