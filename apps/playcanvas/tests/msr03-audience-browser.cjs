const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.argv[2]),{createDriver}=require('./ctrl07-browser-driver.cjs'),{installSpeechObserver}=require('./msr03-observer.cjs');
const origin=process.argv[3],out=path.resolve(process.argv[4]),layout=process.argv[5]||'desktop',baseline=process.argv.includes('--baseline'),simple=process.argv.includes('--simple');
const lines=require('../src/assets/'+(baseline?'saul-dialogue':'saul-performance-dialogue')+'/dialogue.json');
const score=baseline?{concernStart:9,concernEnd:9+lines[0].duration,answerStart:15,answerEnd:15+lines[1].duration,guardStart:24,blessingStart:30,blessingEnd:30+lines[2].duration,duration:40}:require('../src/gameplay/saul-audience-score.ts').createAudienceScore(lines);
const sizes={desktop:[1280,720,false],portrait:[390,844,true],landscape:[844,390,true]},[width,height,touch]=sizes[layout];fs.mkdirSync(out,{recursive:true});
const read=p=>p.locator('canvas').evaluate(e=>JSON.parse(e.dataset.preparation));
async function wait(p,fn,timeout=60000){await p.waitForFunction(fn,null,{timeout});}
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:!process.argv.includes('--native-tabs'),args:['--autoplay-policy=user-gesture-required']});const context=await browser.newContext({viewport:{width,height},hasTouch:touch,isMobile:touch}),p=await context.newPage(),d=await createDriver(context,p,touch),errors=[],failed=[];
 p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});p.on('response',r=>{if(r.status()>=400)failed.push({url:r.url(),status:r.status()});});
 // Playwright normally forces pages to appear focused/visible. This optional
 // probe attempts to disable that override and must prove native events/audio
 // suspension; failure is not counted as a lifecycle pass.
 if(process.argv.includes('--native-tabs'))await d.cdp.send('Emulation.setFocusEmulationEnabled',{enabled:false});
 await p.addInitScript(installSpeechObserver,{lines:lines.map(({id,duration})=>({id,duration})),recordAudio:process.argv.includes('--record-audio')});let tabReturn='Not tested by the core runner; native/manual review required';
 try{
  await p.goto(origin+'/preparation.html?review=1&cinematic=1&inspect=1');await p.locator('#enter').waitFor({timeout:90000});await d.tap('#enter');
  if(!baseline&&!simple){await wait(p,()=>JSON.parse(document.querySelector('canvas').dataset.preparation).time>1);await d.tap('#reset');await wait(p,()=>{const s=JSON.parse(document.querySelector('canvas').dataset.preparation);return s.starts.audience===2&&s.time<1;});assert.equal((await read(p)).run.completed.length,5,'Restart cannot commit an interrupted audience');}
  for(const [time,label]of[[score.concernStart+.7,'concern'],[score.answerStart+1.4,'answer'],[score.guardStart+.6,'listener'],[score.blessingStart+.9,'blessing']]){
   await p.waitForFunction(t=>{const s=JSON.parse(document.querySelector('canvas').dataset.preparation);return s.mode==='audience'&&s.time>=t;},time);
   if(!baseline&&!simple&&label==='concern'){await d.tap('#pause');const before=await read(p);await p.waitForTimeout(280);assert.equal((await read(p)).time,before.time);await d.tap('#pause');}
   if(!baseline&&!simple&&label==='answer'){
    await d.tap('#sound');await wait(p,()=>JSON.parse(document.querySelector('canvas').dataset.preparation).muted);await p.waitForTimeout(250);await d.tap('#sound');
    if(process.argv.includes('--native-tabs')){const other=await context.newPage();await other.goto('about:blank');await other.bringToFront();await p.waitForTimeout(180);const hidden=await p.evaluate(()=>window.msrSpeechNow());await p.waitForTimeout(250);const stillHidden=await p.evaluate(()=>window.msrSpeechNow());
    if(hidden.clocks.every(c=>c.state==='suspended')&&hidden.lifecycle.some(e=>e.trusted&&(e.type==='blur'||e.hidden))){assert.deepEqual(stillHidden.clocks,hidden.clocks);tabReturn='Native tab change during speech suspended audio; return/resume retained its clock';}else tabReturn='This browser did not expose a native audio pause on tab change; no native speech-resume claim';
    await p.bringToFront();await other.close();await p.waitForTimeout(120);if((await read(p)).paused)await d.tap('#pause');}
   }
   await p.screenshot({path:path.join(out,label+'.png'),scale:'css'});
  }
  await wait(p,()=>{const s=JSON.parse(document.querySelector('canvas').dataset.preparation);return s.mode==='explore'&&s.run.completed.includes('saul.audience');});
  const end=await read(p);assert.equal(end.objective,'armour.inspected');assert.equal(end.starts.audience,baseline||simple?1:2);
  await d.direction(1,0);await p.waitForTimeout(350);await d.release();assert(Math.abs((await read(p)).position.x-end.position.x)>.1,'Control must return to David');
  const audit=await p.evaluate(()=>window.msrSpeechCollect());for(const recording of audit.recordings)fs.writeFileSync(path.join(out,'browser-output-'+recording.context+'.webm'),Buffer.from(recording.base64,'base64'));delete audit.recordings;
  if(process.argv.includes('--native-tabs'))assert(tabReturn.startsWith('Native'),'Native tab check must observe suspended audio and trusted lifecycle events');
  for(const line of lines)assert(audit.voices.some(v=>v.id===line.id),'Observer must capture the actual Web Audio source for '+line.id);
  assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);assert(audit.frames.some(f=>f.audio.some(a=>a.rms>.005)),'Browser audio output must be nonzero');
  fs.writeFileSync(path.join(out,'audit.json'),JSON.stringify(audit));fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({status:'PASS',baseline,layout,width,height,touch,nativeTabs:process.argv.includes('--native-tabs'),browser:browser.version(),score,tabReturn,end:await read(p),errors,failed},null,2));console.log('PASS MSR03 '+(baseline?'baseline ':'')+layout+' · '+tabReturn);
 }catch(e){await p.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});fs.writeFileSync(path.join(out,'failure.json'),JSON.stringify({error:e.stack,state:await read(p).catch(()=>null),errors,failed},null,2));throw e;}
 finally{await context.close();await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
