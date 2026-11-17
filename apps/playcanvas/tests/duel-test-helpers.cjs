const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const origin='http://127.0.0.1:4187',out=path.resolve('docs/implementation/evidence/m3-ch05-2026-11-12');fs.mkdirSync(out,{recursive:true});
const sample=p=>p.locator('#stage').evaluate(el=>JSON.parse(el.dataset.movement));
const progress=p=>p.locator('#stage').evaluate(el=>JSON.parse(el.dataset.duel));
async function wait(p,predicate,arg,timeout=45000){return p.waitForFunction(predicate,arg,{timeout}).catch(async error=>{throw new Error(error.message+'; '+JSON.stringify(await sample(p)));});}
const phase=(p,value)=>wait(p,value=>JSON.parse(document.querySelector('#stage').dataset.movement).battle.phase===value,value);
const capture=(p,name)=>p.screenshot({path:path.join(out,name+'.png'),scale:'css'});
function instrument(){
  globalThis[Symbol.for('playcanvas.inspector')]={register(app){window.__battleApp=app;}};
  window.__contexts=[];window.__sources=[];const BrowserContext=window.AudioContext;
  window.AudioContext=class extends BrowserContext{constructor(){super();window.__contexts.push(this);}createBufferSource(){const source=super.createBufferSource(),start=source.start.bind(source);source.start=(...args)=>{if(source.buffer){let peak=0;const data=source.buffer.getChannelData(0);for(let i=0;i<data.length;i+=11)peak=Math.max(peak,Math.abs(data[i]));window.__sources.push({duration:source.buffer.duration,rate:source.buffer.sampleRate,peak,loop:source.loop});}return start(...args);};return source;}};
}
async function open(browser,{touch=false,width=1280,height=720,review=true,run}={}){
 const context=await browser.newContext({viewport:{width,height},isMobile:touch,hasTouch:touch,deviceScaleFactor:1}),p=await context.newPage(),errors=[];
 p.on('pageerror',e=>{errors.push(e.stack);console.error('Browser error:',e.stack);});p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});await p.addInitScript(instrument);
 if(run)await p.addInitScript(run=>{if(!localStorage.getItem('bible-comic.episode.local.v1'))localStorage.setItem('bible-comic.episode.local.v1',JSON.stringify({current:run,history:[]}));},run);
 const start=Date.now();await p.goto(origin+'/duel.html?inspect=1'+(review?'&review=1':''));
 await p.locator('#enter').waitFor({state:'visible',timeout:60000});const startupMs=Date.now()-start;
 await p.locator('#enter').click();await wait(p,()=>JSON.parse(document.querySelector('#stage').dataset.movement).paused===false);
 return{p,context,errors,startupMs};
}
async function drag(p,x,y,touch){const b=await p.locator('#stage').boundingBox(),s=await sample(p),dx=(x-s.battle.aimX)*b.width,dy=(y-s.battle.aimY)*b.height,start={x:b.x+b.width*.5,y:b.y+b.height*.5};if(touch){const c=await p.context().newCDPSession(p);await c.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...start,id:1}]});await c.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:start.x+dx,y:start.y+dy,id:1}]});await c.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await c.detach();}else{await p.mouse.move(start.x,start.y);await p.mouse.down();await p.mouse.move(start.x+dx,start.y+dy);await p.mouse.up();}}
async function approach(p,touch){if(touch){const b=await p.locator('#move-pad').boundingBox(),c=await p.context().newCDPSession(p),start={x:b.x+b.width*.5,y:b.y+b.height*.5};await c.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...start,id:1}]});await c.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:start.x,y:start.y-40,id:1}]});await phase(p,'challenge');await c.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await c.detach();}else{await p.keyboard.down('w');await phase(p,'challenge');await p.keyboard.up('w');}}
async function head(p,touch){const target=await p.locator('#stage').evaluate(el=>{const s=JSON.parse(el.dataset.movement),camera=window.__battleApp.root.findByName('Follow camera').camera,point=camera.entity.getPosition().clone().set(s.battle.target.x,s.battle.target.y,s.battle.target.z),screen=camera.worldToScreen(point);return{x:screen.x/el.clientWidth,y:screen.y/el.clientHeight};});await drag(p,target.x,target.y,touch);await wait(p,()=>JSON.parse(document.querySelector('#stage').dataset.movement).battle.aimed);}
module.exports={assert,fs,path,origin,out,sample,progress,wait,phase,capture,instrument,open,drag,approach,head};
