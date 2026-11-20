// Read-only browser instrumentation: actual Web Audio source clocks, graph paths
// and rendered actor/mouth samples. No scene, clock or progression writes.
function installSpeechObserver(config) {
  const NativeContext=window.AudioContext,nativeConnect=AudioNode.prototype.connect;
  const contexts=new Map(),edges=new Map(),voices=[],frames=[],lifecycle=[];let serial=0,lastFrame=-100;
  const clocks=()=>[...contexts].map(([c,i])=>({id:i.id,time:c.currentTime,state:c.state}));
  for(const type of ['blur','focus'])window.addEventListener(type,e=>lifecycle.push({type,trusted:e.isTrusted,at:performance.now(),hidden:document.hidden,clocks:clocks()}));
  document.addEventListener('visibilitychange',e=>lifecycle.push({type:e.type,trusted:e.isTrusted,at:performance.now(),hidden:document.hidden,clocks:clocks()}));
  window.msrSpeechNow=()=>({hidden:document.hidden,focused:document.hasFocus(),clocks:clocks(),lifecycle:lifecycle.slice()});
  const pathFrom=source=>{const path=[],seen=new Set();let node=source;while(node&&!seen.has(node)){seen.add(node);path.push(node);node=edges.get(node)?.[0];}return path;};
  AudioNode.prototype.connect=function(...args){const result=nativeConnect.apply(this,args);if(args[0] instanceof AudioNode){const list=edges.get(this)??[];list.push(args[0]);edges.set(this,list);}
    const info=contexts.get(this.context);
    if(info&&args[0]===this.context.destination){info.masters.push(this);if(!info.meter){info.meter=this.context.createAnalyser();info.meter.fftSize=1024;nativeConnect.call(this,info.meter);info.data=new Float32Array(1024);}
      if(config.recordAudio){if(!info.destination){info.destination=this.context.createMediaStreamDestination();info.recorder=new MediaRecorder(info.destination.stream,{mimeType:'audio/webm;codecs=opus'});info.chunks=[];info.recorder.ondataavailable=e=>{if(e.data.size)info.chunks.push(e.data);};}nativeConnect.call(this,info.destination);}}
    return result;
  };
  window.AudioContext=class extends NativeContext {
    constructor(...args){super(...args);contexts.set(this,{id:serial++,masters:[]});}
    async resume(){const result=await super.resume(),info=contexts.get(this);if(info.recorder&&info.recorder.state==='inactive'&&!info.recorded){info.recorded=true;info.recorder.start(500);}return result;}
    createBufferSource(){const source=super.createBufferSource(),start=source.start.bind(source),stop=source.stop.bind(source),context=this;let row;
      // decodeAudioData resamples the WAV to the device/context rate. Match its
      // decoded duration, not the source file's 24 kHz sample rate.
      source.start=(at,...args)=>{const line=source.buffer&&config.lines.find(l=>Math.abs(l.duration-source.buffer.duration)<.0001);if(line&&!source.loop){const path=pathFrom(source),panner=path.find(n=>n instanceof PannerNode);row={id:line.id,context:contexts.get(context).id,scheduled:at??context.currentTime,calledAt:context.currentTime,duration:source.buffer.duration,nodes:path,source,panner,ended:false};voices.push(row);source.addEventListener('ended',()=>{row.ended=true;row.endedAt=context.currentTime;});}return start(at,...args);};
      source.stop=(...args)=>{if(row)row.cancelledAt=context.currentTime;return stop(...args);};return source;
    }
  };
  function sourceSample(v){return{id:v.id,context:v.context,scheduled:v.scheduled,calledAt:v.calledAt,duration:v.duration,cancelledAt:v.cancelledAt,endedAt:v.endedAt,ended:v.ended,
    path:v.nodes.map(n=>n.constructor.name),gain:v.nodes.filter(n=>n instanceof GainNode).reduce((p,n)=>p*n.gain.value,1),panner:v.panner?{x:v.panner.positionX.value,y:v.panner.positionY.value,z:v.panner.positionZ.value}:null};}
  const existing=globalThis[Symbol.for('playcanvas.inspector')];globalThis[Symbol.for('playcanvas.inspector')]={register(app){existing?.register?.(app);window.msrSpeechApp=app;app.on('frameend',()=>{
    const now=performance.now();if(now-lastFrame<45)return;lastFrame=now;const raw=document.querySelector('canvas')?.dataset.preparation;if(!raw)return;const s=JSON.parse(raw);if(!['audience','explore'].includes(s.mode))return;
    const actors=['David','Saul','Left pavilion guard'].map(name=>{const model=app.root.findByName(name),joints={};for(const bone of ['Head','spine_03','upperarm_r','lowerarm_r']){const n=model.findByName(bone);joints[bone]=n.getLocalRotation().toArray();}const p=model.getPosition();return{name,position:{x:p.x,y:p.y,z:p.z},clip:model.anim.baseLayer.activeState,clipTime:model.anim.baseLayer.activeStateCurrentTime,joints,mouth:name==='David'?s.davidMouth:name==='Saul'?s.saulMouth:[]};});
    const audio=[...contexts].map(([context,info])=>{let rms=0;if(info.meter){info.meter.getFloatTimeDomainData(info.data);rms=Math.sqrt(info.data.reduce((sum,x)=>sum+x*x,0)/info.data.length);}return{id:info.id,time:context.currentTime,state:context.state,rms,masters:info.masters.map(n=>n instanceof GainNode?n.gain.value:null)};});
    frames.push({at:now,time:s.time,mode:s.mode,paused:s.paused,muted:s.muted,shot:s.shot,speaker:s.speaker,caption:document.querySelector('#caption')?.textContent,actors,audio,voices:voices.filter(v=>{const c=[...contexts].find(([,i])=>i.id===v.context)?.[0];return c&&!v.ended&&v.cancelledAt===undefined&&c.currentTime>=v.scheduled&&c.currentTime<v.scheduled+v.duration;}).map(sourceSample)});
  });}};
  window.msrSpeechCollect=async()=>{const recordings=[];for(const [context,info]of contexts){if(info.recorder&&info.recorder.state!=='inactive'){await new Promise(r=>{info.recorder.addEventListener('stop',r,{once:true});info.recorder.stop();});const blob=new Blob(info.chunks,{type:'audio/webm;codecs=opus'}),bytes=new Uint8Array(await blob.arrayBuffer());let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));recordings.push({context:info.id,base64:btoa(binary),mime:blob.type});}}
    return{frames,voices:voices.map(sourceSample),lifecycle,recordings,viewport:{width:innerWidth,height:innerHeight},userAgent:navigator.userAgent};};
}
module.exports={installSpeechObserver};
