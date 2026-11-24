const {chromium}=require(process.argv[2]),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {createDriver}=require('./ctrl07-browser-driver.cjs'),{createAudienceScore}=require('../src/gameplay/saul-audience-score.ts');
const lines=require('../src/assets/saul-performance-dialogue/dialogue.json'),score=createAudienceScore(lines);
const origin=process.argv[3],out=path.resolve(process.argv[4]),layout=process.argv[5]||'desktop',channel=process.argv[6]||'chrome';fs.mkdirSync(out,{recursive:true});
const [width,height,touch]={desktop:[1280,720,false],portrait:[390,844,true],landscape:[844,390,true]}[layout];
function observe(){
 window.communicationFrames=[];window.communicationAudio=[];window.communicationMasters=[];let contexts=0;
 const Native=window.AudioContext;window.AudioContext=class extends Native{
  constructor(...args){super(...args);this.auditId=contexts++;}
  createGain(){const g=super.createGain(),connect=g.connect.bind(g);g.connect=(target,...args)=>{if(target===this.destination)window.communicationMasters.push({node:g,context:this});return connect(target,...args);};return g;}
  createBufferSource(){const s=super.createBufferSource(),start=s.start.bind(s),stop=s.stop.bind(s),ctx=this;let record;
   s.start=(...args)=>{if(s.buffer){let peak=0;const pcm=s.buffer.getChannelData(0);for(let i=0;i<pcm.length;i+=113)peak=Math.max(peak,Math.abs(pcm[i]));record={context:ctx.auditId,start:args[0]??ctx.currentTime,duration:s.buffer.duration,loop:s.loop,rate:s.playbackRate.value,peak};window.communicationAudio.push(record);}return start(...args);};
   s.stop=(...args)=>{if(record)record.stop=args[0]??ctx.currentTime;return stop(...args);};return s;
  }
 };
 globalThis[Symbol.for('playcanvas.inspector')]={register(app){window.communicationApp=app;app.on('frameend',()=>{
  const raw=document.querySelector('canvas')?.dataset.preparation;if(!raw)return;const s=JSON.parse(raw);if(s.mode!=='audience')return;
  const actors=['David','Saul'].map(name=>{
   const model=app.root.findByName(name),head=model?.findByName('Head'),eye=model?.findByName('Tracked right eye'),pupil=eye?.findByName('Tracked pupil');
   const other=app.root.findByName(name==='David'?'Saul':'David'),right=other?.findByName('Tracked right eye'),left=other?.findByName('Tracked left eye');
   const face=s[name==='David'?'davidFace':'saulFace'],mouth=s[name==='David'?'davidMouth':'saulMouth'];let gazeError;
   if(eye&&pupil&&right&&left&&face?.blink<.25){const p=pupil.getPosition(),o=eye.getPosition(),r=right.getPosition(),l=left.getPosition(),v=[p.x-o.x,p.y-o.y,p.z-o.z],target=[(r.x+l.x)/2-o.x,(r.y+l.y)/2-o.y,(r.z+l.z)/2-o.z];gazeError=Math.acos(Math.max(-1,Math.min(1,v.reduce((sum,x,i)=>sum+x*target[i],0)/(Math.hypot(...v)*Math.hypot(...target)))))*180/Math.PI;}
   return{name,face,mouth,head:head?.getLocalRotation().toArray(),eye:eye?.getPosition().toArray(),pupil:pupil?.getPosition().toArray(),gazeError};
  });window.communicationFrames.push({at:performance.now(),time:s.time,paused:s.paused,speaker:s.speaker,shot:s.shot,actors});
 });}};
}
const read=p=>p.locator('canvas').evaluate(e=>JSON.parse(e.dataset.preparation));
(async()=>{const browser=await chromium.launch({channel,args:['--autoplay-policy=user-gesture-required']}),context=await browser.newContext({viewport:{width,height},hasTouch:touch,isMobile:touch,recordVideo:{dir:path.join(out,'video'),size:{width,height}}}),p=await context.newPage(),d=await createDriver(context,p,touch),errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});await p.addInitScript(observe);
const wait=fn=>p.waitForFunction(fn,null,{timeout:70000}),at=async t=>p.waitForFunction(t=>{const s=JSON.parse(document.querySelector('canvas').dataset.preparation);return s.mode==='audience'&&s.time>=t;},t,{timeout:70000});
const capture=async label=>{await p.screenshot({path:path.join(out,label+'.png'),scale:'css'});fs.writeFileSync(path.join(out,label+'.json'),JSON.stringify(await read(p),null,2));};
try{
 await p.goto(origin+'/preparation.html?review=1&cinematic=1&inspect=1');await d.tap('#enter');await at(1.2);await d.tap('#reset');await wait(()=>{const s=JSON.parse(document.querySelector('canvas').dataset.preparation);return s.starts.audience===2&&s.time<1;});
 await at(score.concernStart+.8);await d.tap('#pause');const frozen=await read(p);await p.waitForTimeout(250);assert.equal((await read(p)).time,frozen.time);assert.deepEqual((await read(p)).davidFace,frozen.davidFace);assert.deepEqual((await read(p)).saulFace,frozen.saulFace);await capture('concern');await d.tap('#pause');
 await at(score.answerStart+2);await capture('david-speaking');let s=await read(p);assert(s.davidMouth.length>=3);assert(Math.max(...s.davidMouth)-Math.min(...s.davidMouth)<1e-7,'Jaw/rim/interior share the same intended opening');assert.equal(s.davidFace.eyeCount,2);assert.equal(s.saulFace.eyeCount,2);
 await d.tap('#sound');await p.waitForTimeout(150);assert((await read(p)).muted);const muted=await p.evaluate(()=>window.communicationMasters.map(m=>m.node.gain.value));assert(muted.every(g=>g<.001),'Every scene output master must mute');await d.tap('#sound');
 await at(score.answerStart+4.25);assert.equal((await read(p)).shot,'over-saul-shoulder');await capture('over-shoulder');
 await at(score.answerStart+8.15);await capture('listener-reaction');await at(score.answerEnd+.35);s=await read(p);assert(s.davidMouth.every(w=>w<.015));assert.equal(s.davidFace.mouthSurfaces.length,0);await capture('neutral-after-voice');
 await at(score.blessingStart+.7);await capture('blessing');await wait(()=>{const s=JSON.parse(document.querySelector('canvas').dataset.preparation);return s.mode==='explore'&&s.run.completed.includes('saul.audience');});
 const end=await read(p);await d.direction(1,0);await p.waitForTimeout(300);await d.release();assert(Math.abs((await read(p)).position.x-end.position.x)>.05);await capture('returned-control');
 const audit=await p.evaluate(()=>({frames:window.communicationFrames,audio:window.communicationAudio})),stats={};
 for(const name of['David','Saul']){const a=audit.frames.filter(f=>!f.paused&&f.time>2).map(f=>f.actors.find(a=>a.name===name));assert(a.every(v=>v.head.every(Number.isFinite)));assert(a.some(v=>v.face.blink>.7)&&a.some(v=>v.face.blink<.1),'Visible blink/return '+name);assert(new Set(a.map(v=>v.pupil?.join(','))).size>30,'Rendered pupils must move '+name);assert(a.some(v=>Math.abs(v.face.eyeYaw)>.3||Math.abs(v.face.eyePitch)>.3));assert(a.some(v=>v.mouth.some(w=>w>.05)),'Spoken mouth '+name);
  const angles=a.map(v=>v.gazeError).filter(Number.isFinite).sort((a,b)=>a-b);stats[name]={eyeCount:a[0].face.eyeCount,medianGazeError:angles[Math.floor(angles.length*.5)],p95GazeError:angles[Math.floor(angles.length*.95)],pupilPositions:new Set(a.map(v=>v.pupil?.join(','))).size,emotions:[...new Set(a.map(v=>v.face.emotion))]};assert(stats[name].medianGazeError<15,'Actual pupil direction should generally meet partner eyeline: '+JSON.stringify(stats[name]));
 }
 const voices=audit.audio.filter(a=>!a.loop&&lines.some(l=>Math.abs(l.duration-a.duration)<.001)&&a.peak>.01).map(a=>({...a,end:Math.min(a.start+a.duration/a.rate,a.stop??Infinity)})).filter(a=>a.end>a.start+.01);
 for(const line of lines)assert(voices.some(v=>Math.abs(v.duration-line.duration)<.001),'Actual non-silent PCM source for '+line.id);
 for(let i=0;i<voices.length;i++)for(let k=i+1;k<voices.length;k++)if(voices[i].context===voices[k].context)assert(Math.min(voices[i].end,voices[k].end)-Math.max(voices[i].start,voices[k].start)<.025,'No expired/restarted dialogue overlap');
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'audit.json'),JSON.stringify(audit));const result={status:'PASS',channel,browser:browser.version(),layout,width,height,touch,basis:'Real normal-clock Chapter 4 review with actual inputs, one restart, mute, pause and returned movement. Recorded rendered eyes, head joints, all mouth bindings and real AudioBufferSource intervals.',stats,voices:voices.length,starts:end.starts.audience,muteMasters:muted,errors};fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}catch(e){await capture('failure').catch(()=>{});const audit=await p.evaluate(()=>({frames:window.communicationFrames,audio:window.communicationAudio})).catch(()=>null);fs.writeFileSync(path.join(out,'failure.json'),JSON.stringify({error:e.stack,errors,audit},null,2));throw e;}finally{const video=p.video();await context.close();if(video)await video.saveAs(path.join(out,'conversation.webm'));await browser.close();}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
