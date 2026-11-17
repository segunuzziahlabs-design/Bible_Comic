const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const origin=process.argv[3]||'http://127.0.0.1:4189',out=path.resolve(process.argv[4]||'docs/implementation/evidence/m3-ch06-2026-11-12');fs.mkdirSync(out,{recursive:true});
const sample=p=>p.locator('canvas').evaluate(el=>JSON.parse(el.dataset.victory));
const at=(p,t)=>p.waitForFunction(t=>{const s=JSON.parse(document.querySelector('canvas').dataset.victory);return s.mode==='playing'&&s.time>=t;},t,{timeout:50000});
const capture=(p,name)=>p.screenshot({path:path.join(out,name+'.png'),scale:'css'});
function instrument(){
 globalThis[Symbol.for('playcanvas.inspector')]={register(app){window.victoryApp=app;}};window.audioSources=[];window.outputMasters=[];const Context=window.AudioContext;
 window.AudioContext=class extends Context{createGain(){const node=super.createGain(),connect=node.connect.bind(node);node.connect=(target,...args)=>{if(target===this.destination)window.outputMasters.push({node,context:this});return connect(target,...args);};return node;}createBufferSource(){const node=super.createBufferSource(),start=node.start.bind(node);node.start=(...args)=>{let peak=0;const a=node.buffer?.getChannelData(0);if(a)for(let i=0;i<a.length;i+=11)peak=Math.max(peak,Math.abs(a[i]));window.audioSources.push({duration:node.buffer?.duration,rate:node.playbackRate.value,peak,loop:node.loop});return start(...args);};return node;}};
}
async function open(browser,{touch=false,width=1280,height=720,review=true,run}={}){
 const context=await browser.newContext({viewport:{width,height},isMobile:touch,hasTouch:touch,deviceScaleFactor:1}),p=await context.newPage(),errors=[];p.on('pageerror',e=>{errors.push(e.stack);console.error(e.stack);});p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});await p.addInitScript(instrument);
 if(run)await p.addInitScript(run=>{if(!localStorage.getItem('bible-comic.episode.local.v1'))localStorage.setItem('bible-comic.episode.local.v1',JSON.stringify({current:run,history:[]}));},run);
 const start=Date.now();await p.goto(origin+'/victory.html?inspect=1'+(review?'&review=1':''));await p.locator('#enter').waitFor({state:'visible',timeout:60000});return{context,p,errors,startupMs:Date.now()-start};
}
module.exports={fs,path,assert,origin,out,sample,at,capture,instrument,open};
