const {chromium}=require(process.argv[2]),fs=require('node:fs'),path=require('node:path');
const origin=process.argv[3]||'http://127.0.0.1:4192',out=path.resolve(process.argv[4]||'docs/implementation/evidence/opening-messenger-audio-2026-11-13');fs.mkdirSync(out,{recursive:true});
function meterAudio(){
 const Base=window.AudioContext,nativeConnect=AudioNode.prototype.connect;window.chapterAudio=[];
 AudioNode.prototype.connect=function(target,...rest){const observed=window.chapterAudio.find(a=>a.context===this.context);return nativeConnect.call(this,observed&&target===this.context.destination&&this!==observed.meter?observed.meter:target,...rest);};
 window.AudioContext=class extends Base{
  constructor(...args){super(...args);const meter=this.createAnalyser();meter.fftSize=2048;nativeConnect.call(meter,this.destination);this.observed={context:this,meter,sources:[]};window.chapterAudio.push(this.observed);this.observed.resumes=[];}
  resume(){this.observed.resumes.push({active:navigator.userActivation.isActive,hasBeenActive:navigator.userActivation.hasBeenActive,at:performance.now()});return super.resume();}
  createBufferSource(){const source=super.createBufferSource(),start=source.start.bind(source);source.start=(...args)=>{this.observed.sources.push({duration:source.buffer?.duration,loop:source.loop,at:this.currentTime});return start(...args);};return source;}
 };
}
async function levels(p){return p.evaluate(()=>window.chapterAudio.map(a=>{const data=new Float32Array(a.meter.fftSize);a.meter.getFloatTimeDomainData(data);return{state:a.context.state,time:a.context.currentTime,rms:Math.sqrt(data.reduce((n,x)=>n+x*x,0)/data.length),peak:Math.max(...data.map(Math.abs)),sources:a.sources,resumes:a.resumes};}));}
async function runDiagnostic(){const browser=await chromium.launch({channel:'chrome',args:['--autoplay-policy=user-gesture-required']}),p=await browser.newPage(),logs=[],samples=[];try{
 await p.addInitScript(meterAudio);p.on('console',m=>{if(['error','warning'].includes(m.type()))logs.push(m.text());});p.on('pageerror',e=>logs.push(e.stack));
 await p.goto(origin+'/valley.html?review=1&inspect=1');await p.locator('#enter').waitFor({state:'visible',timeout:60000});const before=await levels(p);await p.locator('#enter').click({timeout:10000});
 for(let i=0;i<100;i++){await p.waitForTimeout(100);samples.push({ms:i*100,audio:await levels(p),state:await p.locator('canvas').evaluate(e=>JSON.parse(e.dataset.valley))});}
 const result={browser:browser.version(),basis:'Fresh Chrome, strict gesture-required autoplay, real entry click. Output analysers inserted immediately before destinations.',before,samples,logs};fs.writeFileSync(path.join(out,'prior-opening-audio.json'),JSON.stringify(result,null,2));console.log(JSON.stringify({maxRms:Math.max(...samples.flatMap(s=>s.audio.map(a=>a.rms))),contexts:samples.at(-1).audio.map(a=>({state:a.state,time:a.time,sources:a.sources.length})),logs}));
}finally{await browser.close();}}
if(require.main===module)runDiagnostic().catch(e=>{console.error(e);process.exitCode=1;});
module.exports={meterAudio,levels};
