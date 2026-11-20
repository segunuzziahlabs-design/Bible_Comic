/** Pause-aware audio/voice clock shared by newly produced chapters. Existing previews stay intact. */
export type Point3={x:number;y:number;z:number};
export type SpeechLine={id:string;speaker:string;duration:number;text:string;mouthCues:number[][]};
export type SpeechCue={id:string;start:number};
type SpeechOptions={cinematicDialogue?:readonly string[]};
export function mouthEnvelope(line:SpeechLine,local:number){
  if(local<0||local>=line.duration)return[0,0];
  const cues=line.mouthCues,i=Math.min(cues.length-2,Math.floor(local*30)),a=cues[i],b=cues[i+1];
  const blend=Math.max(0,Math.min(1,(local-a[0])/Math.max(.001,b[0]-a[0])));
  return[a[1]+(b[1]-a[1])*blend,a[2]+(b[2]-a[2])*blend];
}
export async function createSceneSpeech(lines:SpeechLine[],urls:Record<string,string>,timelines:Record<string,SpeechCue[]>,calls:string[]=[],voiceDistance=3,options:SpeechOptions={}){
  const context=new AudioContext();await context.suspend();
  const master=context.createGain();master.gain.value=.85;master.connect(context.destination);
  // Opt-in story dialogue stays intelligible across edits and moving cameras.
  // Environmental calls, equipment and footsteps keep their spatial path.
  const dialogue=options.cinematicDialogue?.length?context.createGain():undefined;dialogue?.connect(master);
  // Lazy inspection branch: normal play creates no analyser and no per-frame reads.
  let meter:AnalyserNode|undefined,meterData:Float32Array<ArrayBuffer>|undefined;
  function outputLevel(){if(!meter){meter=context.createAnalyser();meter.fftSize=512;master.connect(meter);meterData=new Float32Array(512);}meter.getFloatTimeDomainData(meterData!);let sum=0,peak=0;for(const value of meterData!){sum+=value*value;peak=Math.max(peak,Math.abs(value));}return{rms:Math.sqrt(sum/meterData!.length),peak};}
  const ambient=context.createGain();ambient.gain.value=.08;ambient.connect(master);
  const buffers=new Map(await Promise.all(Object.entries(urls).map(async([id,url])=>{
    const response=await fetch(url);if(!response.ok)throw new Error('A chapter voice recording could not load.');
    return[id,await context.decodeAudioData(await response.arrayBuffer())] as const;
  })).catch(error=>{void context.close();throw error;}));
  for(const cues of Object.values(timelines))for(let i=0;i<cues.length;i++){
    const line=lines.find(line=>line.id===cues[i].id);
    if(!line||!buffers.has(line.id)||cues[i].start<0||(i>0&&cues[i-1].start+lines.find(line=>line.id===cues[i-1].id)!.duration>cues[i].start))throw new Error('Chapter dialogue timing overlaps or references a missing line.');
  }
  const noise=context.createBuffer(1,context.sampleRate*4,context.sampleRate),data=noise.getChannelData(0);let low=0;
  for(let i=0;i<data.length;i++){low=low*.97+(Math.random()*2-1)*.03;data[i]=low;}
  const wind=context.createBufferSource();wind.buffer=noise;wind.loop=true;
  const filter=context.createBiquadFilter();filter.type='lowpass';filter.frequency.value=800;wind.connect(filter);filter.connect(ambient);wind.start();
  const sources=new Set<AudioScheduledSourceNode>();let origin=0,cueOrigin=0,lastCall=0,lastCloth=0,sequenceName='';
  function track<T extends AudioScheduledSourceNode>(node:T){sources.add(node);node.onended=()=>{sources.delete(node);node.disconnect();};return node;}
  function panner(at:Point3,reference=3){const node=context.createPanner();node.panningModel='equalpower';node.distanceModel='inverse';node.refDistance=reference;node.rolloffFactor=.6;node.maxDistance=50;node.positionX.value=at.x;node.positionY.value=at.y;node.positionZ.value=at.z;node.connect(master);return node;}
  function play(id:string,at:number,position?:Point3,gain=.95,rate=1,cinematic=false){
    const source=track(context.createBufferSource());source.buffer=buffers.get(id)!;source.playbackRate.value=rate;const volume=context.createGain();volume.gain.value=gain;source.connect(volume);
    const pan=position&&!cinematic?panner(position,voiceDistance):undefined;volume.connect(pan??(cinematic?dialogue:undefined)??master);source.addEventListener('ended',()=>{volume.disconnect();pan?.disconnect();});source.start(at);
  }
  function stop(){for(const source of sources){try{source.stop();}catch{/* Already ended. */}source.disconnect();}sources.clear();sequenceName='';}
  function lineAt(){const t=context.currentTime-cueOrigin,cues=timelines[sequenceName]??[];const cue=cues.find(cue=>{const line=lines.find(line=>line.id===cue.id)!;return t>=cue.start&&t<cue.start+line.duration;});return cue&&{...lines.find(line=>line.id===cue.id)!,local:t-cue.start};}
  function effect(position:Point3,gain:number,frequency:number,duration:number){
    const source=track(context.createBufferSource());source.buffer=noise;const tone=context.createBiquadFilter();tone.type='bandpass';tone.frequency.value=frequency;tone.Q.value=.7;
    const envelope=context.createGain(),at=context.currentTime;envelope.gain.setValueAtTime(.001,at);envelope.gain.linearRampToValueAtTime(gain,at+.012);envelope.gain.exponentialRampToValueAtTime(.001,at+duration);
    const pan=panner(position);source.connect(tone);tone.connect(envelope);envelope.connect(pan);source.addEventListener('ended',()=>{tone.disconnect();envelope.disconnect();pan.disconnect();});source.start(at);source.stop(at+duration);
  }
  return{context,lineAt,outputLevel,time:()=>context.currentTime-origin,cueTime:()=>context.currentTime-cueOrigin,
    async resume(){await context.resume();},async pause(){await context.suspend();},mute(value:boolean){master.gain.setValueAtTime(value?0:.85,context.currentTime);},
    reset(){stop();origin=context.currentTime;lastCall=lastCloth=0;},cancel:stop,
    begin(name:string,positions:Record<string,Point3>){stop();sequenceName=name;cueOrigin=context.currentTime;for(const cue of timelines[name]??[]){const line=lines.find(line=>line.id===cue.id)!;play(line.id,cueOrigin+cue.start,positions[line.speaker],.95,1,options.cinematicDialogue?.includes(name)??false);}},
    oneShot(id:string,position?:Point3,gain=.5,rate=1){if(!buffers.has(id))throw new Error('Unknown chapter recording.');play(id,context.currentTime,position,gain,rate);},
    footstep(position:Point3){effect(position,1.0,650,.16);},setDown(position:Point3){effect(position,1.1,420,.30);},
    equipment(position:Point3){effect(position,.65,180,.45);},
    update(eye:Point3,forward:Point3){
      const listener=context.listener;[listener.positionX,listener.positionY,listener.positionZ].forEach((param,i)=>param.setValueAtTime([eye.x,eye.y,eye.z][i],context.currentTime));
      [listener.forwardX,listener.forwardY,listener.forwardZ].forEach((param,i)=>param.setValueAtTime([forward.x,forward.y,forward.z][i],context.currentTime));listener.upY.value=1;
      ambient.gain.setTargetAtTime(lineAt() ? .035 : .09,context.currentTime,.3);
      const t=context.currentTime-origin;if(calls.length&&t-lastCall>20){lastCall=t;play(calls[Math.floor(t/20)%calls.length],context.currentTime,{x:5,y:1.5,z:-7},.3);}
      if(t-lastCloth>11){lastCloth=t;effect({x:-4,y:2,z:0},.2,220,.7);}
    },
    dispose(){stop();wind.stop();dialogue?.disconnect();void context.close();},
  };
}
