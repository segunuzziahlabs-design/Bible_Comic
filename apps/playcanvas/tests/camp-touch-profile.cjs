const {chromium}=require(process.argv[2]);
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib'),assert=require('node:assert/strict');
const out=path.resolve('docs/implementation/evidence/m3-ch02-2026-11-11'),origin='http://127.0.0.1:4184';fs.mkdirSync(out,{recursive:true});
const sample=p=>p.locator('canvas').evaluate(el=>JSON.parse(el.dataset.camp));
const quantile=(values,p)=>[...values].sort((a,b)=>a-b)[Math.min(values.length-1,Math.floor(values.length*p))];
const ready=async p=>{await p.goto(origin+'/camp.html?review=1&inspect=1');await p.locator('#enter').waitFor({state:'visible',timeout:60000});};
const at=(p,t)=>p.waitForFunction(t=>JSON.parse(document.querySelector('canvas').dataset.camp).time>=t,t,{timeout:40000});
const explore=p=>p.waitForFunction(()=>JSON.parse(document.querySelector('canvas').dataset.camp).mode==='explore',undefined,{timeout:40000});
async function touchMove(p,cdp,x,z){
 const box=await p.locator('#move-pad').boundingBox();assert.ok(box);const centre={x:box.x+box.width/2,y:box.y+box.height/2};
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[centre]});const start=Date.now();
 try{while(Date.now()-start<10000){const pos=(await sample(p)).position,dx=x-pos.x,dz=z-pos.z,distance=Math.hypot(dx,dz);if(distance<.16)break;const scale=32/Math.max(distance,.4);await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:centre.x+dx*scale,y:centre.y+dz*scale}]});await p.waitForTimeout(100);}}
 finally{await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}await p.waitForTimeout(200);const pos=(await sample(p)).position;assert.ok(Math.hypot(x-pos.x,z-pos.z)<.4,'Touch reaches waypoint');
}
(async()=>{
 const errors=[],cold=[];let profile;
 if(!process.argv.includes('--touch-only'))for(let i=0;i<3;i++){
  const browser=await chromium.launch({channel:'chrome'}),p=await browser.newPage({viewport:{width:1280,height:720}});p.on('pageerror',e=>errors.push(e.stack));
  await p.addInitScript(()=>{globalThis[Symbol.for('playcanvas.inspector')]={register(app){window.app=app;window.times=[];app.on('frameend',()=>{if(document.getElementById('entry')?.hidden&&document.getElementById('pause-notice')?.hidden)window.times.push(performance.now());});}};});
  const start=Date.now();await ready(p);cold.push(Date.now()-start);console.log('Ready',i+1,cold.at(-1));
  if(i===0){
   await p.locator('#enter').click();const playStart=Date.now();await explore(p);await p.keyboard.down('KeyA');await p.keyboard.down('KeyW');await p.locator('#interact').waitFor({state:'visible',timeout:8000});await p.keyboard.up('KeyA');await p.keyboard.up('KeyW');await p.locator('#interact').click();
   await at(p,14.78);await p.locator('#pause').click();await p.waitForTimeout(100);await p.locator('#pause-notice').evaluate(el=>el.style.visibility='hidden');await p.screenshot({path:path.join(out,'04-basket-contact.png')});await p.locator('#pause-notice').evaluate(el=>el.style.visibility='');await p.locator('#pause').click();
   await explore(p);await p.waitForTimeout(Math.max(0,45000-(Date.now()-playStart)));
   const data=await p.evaluate(()=>({times:window.times,resources:performance.getEntriesByType('resource').map(r=>({url:r.name,bytes:r.encodedBodySize})),renderer:window.app.graphicsDevice.unmaskedRenderer}));
   // Exclude warm-up and the deliberate pause; do not count the pause as a rendering stall.
   const times=data.times.filter(t=>t>data.times[0]+1500),all=times.slice(1).map((t,i)=>t-times[i]);
   const resources=data.resources.filter(r=>r.url.startsWith(origin)),gzipEstimate=resources.reduce((sum,r)=>{const file=path.join('build/playcanvas-m3-ch02',new URL(r.url).pathname);return sum+(fs.existsSync(file)?zlib.gzipSync(fs.readFileSync(file)).length:0);},0);
   // A separate unpaused sample below supplies the actual steady frame-pacing gate.
   const stable=await p.evaluate(()=>new Promise(resolve=>{const times=[];const record=()=>times.push(performance.now());window.app.on('frameend',record);setTimeout(()=>{window.app.off('frameend',record);resolve(times);},45000);}));
   const gaps=stable.slice(1).map((t,i)=>t-stable[i]);
   profile={startupMs:cold[0],journeyWindowSeconds:45,journey:'Eight-second arrival, player approach and full voiced delivery; deliberate pause for contact capture',journeyRawIntervals:all,steadyWindowSeconds:45,steadyFps:(stable.length-1)*1000/(stable.at(-1)-stable[0]),steadyP95Ms:quantile(gaps,.95),steadyMaxMs:Math.max(...gaps),steadyOver50Ms:gaps.filter(t=>t>50).length,encodedResourceBytes:resources.reduce((sum,r)=>sum+r.bytes,0),gzipBodyEstimateBytes:gzipEstimate,renderer:data.renderer,resources};
  }
  await browser.close();
 }
 if(profile){fs.writeFileSync(path.join(out,'profile.json'),JSON.stringify({browser:'Chrome',coldStartupMs:cold,medianStartupMs:quantile(cold,.5),profile,errors},null,2));console.log('PROFILE',JSON.stringify({...profile,journeyRawIntervals:undefined,resources:undefined}));}
 if(!process.argv.includes('--profile-only')){
  const browser=await chromium.launch({channel:'chrome'}),layouts=[];
  for(const [name,width,height]of[['portrait',390,844],['landscape',844,390]]){
   const context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true,deviceScaleFactor:1}),p=await context.newPage(),cdp=await context.newCDPSession(p);p.on('pageerror',e=>errors.push(e.stack));
   await ready(p);await p.evaluate(()=>localStorage.setItem('bible-comic.episode.local.v1','touch-review-sentinel'));await p.locator('#enter').tap();await explore(p);
   await touchMove(p,cdp,-1.6,2.7);await p.locator('#interact').tap();await p.waitForFunction(()=>JSON.parse(document.querySelector('canvas').dataset.camp).mode==='delivery');await at(p,4);await p.screenshot({path:path.join(out,`08-${name}-delivery.png`)});
   await p.locator('#pause').tap();await p.waitForTimeout(100);const frozen=await sample(p);await p.waitForTimeout(450);assert.equal((await sample(p)).time,frozen.time);assert.equal((await sample(p)).audio,'suspended');await p.locator('#pause').tap();
   await at(p,15);await p.screenshot({path:path.join(out,`09-${name}-set-down.png`)});await explore(p);assert.equal((await sample(p)).run.completed.length,2);
   await touchMove(p,cdp,1.7,1.9);await touchMove(p,cdp,2.2,.1);await p.locator('#interact').tap();await p.waitForFunction(()=>JSON.parse(document.querySelector('canvas').dataset.camp).mode==='greeting');await at(p,3);await p.screenshot({path:path.join(out,`10-${name}-eliab.png`)});await at(p,9);await p.screenshot({path:path.join(out,`11-${name}-david.png`)});
   await p.locator('#review-gate').waitFor({state:'visible',timeout:35000});assert.equal((await sample(p)).run.completed.length,3);assert.equal(await p.evaluate(()=>localStorage.getItem('bible-comic.episode.local.v1')),'touch-review-sentinel');assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   for(const id of['sound','pause','reset'])assert.ok((await p.locator('#'+id).boundingBox()).height>=48);
   layouts.push({name,width,height,status:'PASS',checks:'Actual touch-stick route, both timed exchanges, pause, review-only completion, no horizontal overflow, 48px essential controls'});await context.close();console.log('PASS touch',name);
  }
  fs.writeFileSync(path.join(out,'touch-results.json'),JSON.stringify({status:'PASS',browser:browser.version(),layouts,errors,limitation:'Chrome responsive/touch emulation on the laptop; physical phone GPU, memory, Safari and thermal behaviour are unmeasured.'},null,2));await browser.close();
 }
 assert.deepEqual(errors,[]);
})().catch(e=>{console.error(e);process.exit(1)});
