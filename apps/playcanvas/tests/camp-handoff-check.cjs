const {chromium}=require(process.argv[2]);
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const origin='http://127.0.0.1:4184',out=path.resolve('docs/implementation/evidence/m3-ch02-2026-11-11');
(async()=>{
 const browser=await chromium.launch({channel:'chrome'}),page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];page.on('pageerror',e=>errors.push(e.stack));
 await page.goto(origin+'/episode.html?inspect=1');await page.locator('#enter').waitFor({state:'visible',timeout:60000});await page.locator('#enter').click();await page.waitForURL('**/valley.html?inspect=1');
 await page.locator('#enter').waitFor({state:'visible',timeout:60000});await page.locator('#enter').click();await page.waitForFunction(()=>JSON.parse(document.querySelector('canvas').dataset.valley).mode==='explore',undefined,{timeout:45000});
 await page.keyboard.down('KeyW');await page.locator('#survey').waitFor({state:'visible',timeout:10000});await page.keyboard.up('KeyW');await page.locator('#survey').click();await page.locator('#review-gate').waitFor({state:'visible',timeout:18000});
 const earned=await page.evaluate(()=>JSON.parse(localStorage.getItem('bible-comic.episode.local.v1')).current);assert.deepEqual(earned.completed,['valley.surveyed']);
 await page.locator('#continue-camp').click();await page.waitForURL('**/camp.html?inspect=1');await page.locator('#enter').waitFor({state:'visible',timeout:60000});const camp=await page.locator('canvas').evaluate(el=>JSON.parse(el.dataset.camp));assert.equal(camp.run.runId,earned.runId);assert.deepEqual(camp.run.completed,earned.completed);assert.equal(camp.review,false);assert.equal(camp.carried,true);
 await page.screenshot({path:path.join(out,'12-earned-chapter-handoff.png')});assert.deepEqual(errors,[]);
 fs.writeFileSync(path.join(out,'handoff-results.json'),JSON.stringify({status:'PASS',browser:browser.version(),checks:'Fresh actual episode entry, Chapter 1 film and player-earned survey, Continue to camp, same run/revision/prefix with visible carried provisions. No seeded checkpoint.',errors},null,2));await browser.close();console.log('PASS earned Chapter 1 to Chapter 2 handoff');
})().catch(e=>{console.error(e);process.exit(1)});
