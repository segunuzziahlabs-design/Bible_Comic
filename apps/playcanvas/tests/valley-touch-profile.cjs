const {chromium}=require(process.argv[2]);
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib'),assert=require('node:assert/strict');
const out=path.resolve('docs/implementation/evidence/m3-ch01-2026-11-11');
const url='http://127.0.0.1:4183/valley.html?review=1';
const sample=page=>page.locator('canvas').evaluate(el=>JSON.parse(el.dataset.valley));
const quantile=(values,p)=>[...values].sort((a,b)=>a-b)[Math.min(values.length-1,Math.floor(values.length*p))];
(async()=>{
 const errors=[],cold=[];let profile;
 if(!process.argv.includes('--touch-only'))for(let i=0;i<(process.argv.includes('--steady-only')?1:3);i++){
  const browser=await chromium.launch({channel:'chrome'});const page=await browser.newPage({viewport:{width:1280,height:720}});
  await page.addInitScript(()=>{
   globalThis[Symbol.for('playcanvas.inspector')]={register(app){window.app=app;window.frameTimes=[];app.on('frameend',()=>{if(document.getElementById('entry')?.hidden&&document.getElementById('pause-notice')?.hidden)window.frameTimes.push(performance.now());});}};
  });
  page.on('pageerror',e=>errors.push(e.message));const start=Date.now();await page.goto(url);await page.locator('#enter').waitFor({state:'visible',timeout:60000});cold.push(Date.now()-start);
  if(i===0){
   await page.locator('#enter').click();await page.waitForTimeout(45000);
   const data=await page.evaluate(()=>({times:window.frameTimes,resources:performance.getEntriesByType('resource').map(r=>({url:r.name,bytes:r.encodedBodySize})),renderer:window.app.graphicsDevice.unmaskedRenderer}));
   const times=data.times.filter(time=>time>data.times[0]+1500),intervals=times.slice(1).map((time,index)=>time-times[index]);
   const resources=data.resources.filter(r=>r.url.startsWith('http://127.0.0.1:4183/'));
   const gzipEstimate=resources.reduce((sum,r)=>{const file=path.join('build/playcanvas-m3-ch01',new URL(r.url).pathname);return sum+(fs.existsSync(file)?zlib.gzipSync(fs.readFileSync(file)).length:0);},0);
   profile={windowSeconds:45,warmupExcludedSeconds:1.5,frames:times.length,measuredSeconds:(times.at(-1)-times[0])/1000,fps:(times.length-1)*1000/(times.at(-1)-times[0]),p95Ms:quantile(intervals,.95),maxMs:Math.max(...intervals),over50ms:intervals.filter(x=>x>50).length,
    outliers:intervals.map((gap,index)=>({atMs:times[index]-data.times[0],gap})).filter(item=>item.gap>50),
    encodedResourceBytes:resources.reduce((sum,r)=>sum+r.bytes,0),gzipBodyEstimateBytes:gzipEstimate,renderer:data.renderer,resources};
  }
  await browser.close();
 }
 if(profile){const result={browser:'Chrome',coldStartupMs:cold,medianStartupMs:quantile(cold,.5),profile,errors};fs.writeFileSync(path.join(out,process.argv.includes('--steady-only')?'profile-steady.json':'profile.json'),JSON.stringify(result,null,2));console.log('PROFILE',JSON.stringify(result));}
 if(!process.argv.includes('--profile-only')&&!process.argv.includes('--steady-only')){
  const browser=await chromium.launch({channel:'chrome'});const layouts=[];
  for(const [name,width,height] of [['portrait',390,844],['landscape',844,390]]){
   const context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true,deviceScaleFactor:1});const page=await context.newPage();page.on('pageerror',e=>{errors.push(e.message);console.log('BROWSER ERROR',e.stack);});
   await page.goto(url+'&inspect=1');await page.locator('#enter').waitFor({state:'visible',timeout:60000});
   await page.evaluate(()=>localStorage.setItem('bible-comic.episode.local.v1','preserve-review-test'));
   await page.locator('#enter').click();
   await page.waitForFunction(()=>JSON.parse(document.querySelector('canvas').dataset.valley).time>=14,undefined,{timeout:25000});
   await page.screenshot({path:path.join(out,`08-${name}-soldier.png`)});
   await page.locator('#pause').click();await page.waitForTimeout(100);const frozen=await sample(page);await page.waitForTimeout(400);
   assert.equal((await sample(page)).time,frozen.time);assert.equal((await sample(page)).audio,'suspended');assert.deepEqual((await sample(page)).patrol,frozen.patrol);
   await page.locator('#pause').click();
   await page.waitForFunction(()=>JSON.parse(document.querySelector('canvas').dataset.valley).time>=29,undefined,{timeout:25000});
   await page.screenshot({path:path.join(out,`09-${name}-david.png`)});
   await page.waitForFunction(()=>JSON.parse(document.querySelector('canvas').dataset.valley).mode==='explore');
   await page.locator('#move-pad').waitFor({state:'visible'});const pad=await page.locator('#move-pad').boundingBox(),cdp=await context.newCDPSession(page);
   const x=pad.x+pad.width/2,y=pad.y+pad.height/2;
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y-32}]});
   await page.locator('#survey').waitFor({state:'visible',timeout:10000});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
   const position=(await sample(page)).position;assert.ok(position.z<10.7,'Touch movement returns after the film');
   await page.locator('#survey').click();await page.locator('#review-gate').waitFor({state:'visible',timeout:20000});
   assert.equal((await sample(page)).run.completed.length,1);assert.equal(await page.evaluate(()=>localStorage.getItem('bible-comic.episode.local.v1')),'preserve-review-test');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   for(const id of ['sound','pause','reset'])assert.ok((await page.locator('#'+id).boundingBox()).height>=48);
   layouts.push({name,width,height,status:'PASS'});await context.close();
  }
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'touch-results.json'),JSON.stringify({status:'PASS',browser:browser.version(),layouts,errors,reviewIsolation:'Existing local value preserved'},null,2));await browser.close();console.log('PASS Chapter 1 portrait and landscape touch journeys');
 }
 assert.deepEqual(errors,[]);
})().catch(error=>{console.error(error);process.exit(1)});
