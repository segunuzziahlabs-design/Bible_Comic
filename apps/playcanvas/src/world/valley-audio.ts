import manifest from '../assets/valley-dialogue/dialogue.json';
import valley from '../assets/valley-dialogue/valley.wav?url';
import sentinel from '../assets/valley-dialogue/sentinel.wav?url';
import champion from '../assets/valley-dialogue/champion.wav?url';
import david from '../assets/valley-dialogue/david.wav?url';
import survey from '../assets/valley-dialogue/survey.wav?url';
import hold from '../assets/valley-dialogue/hold.wav?url';
import ready from '../assets/valley-dialogue/ready.wav?url';
import type { Vec3 } from 'playcanvas';
import { resumeChapterAudio } from './chapter-audio-start';

export const openingDuration = 36;
export const surveyDuration = 10;
export type ValleySequence = 'intro' | 'survey';
export function valleySpeech(sequence: ValleySequence, time: number) {
  const starts: Record<string, number> = sequence === 'intro' ? { valley:6, sentinel:12.8, champion:18.3, david:28.3 } : { survey:2.4 };
  return manifest.map(line => ({ ...line, start: starts[line.id] ?? -100 }))
    .find(line => time >= line.start && time < line.start + line.duration);
}
export function valleyMouth(line: NonNullable<ReturnType<typeof valleySpeech>>, time: number) {
  const local = Math.max(0,time-line.start), cues=line.mouthCues;
  const i=Math.min(cues.length-2,Math.floor(local*30)), a=cues[i], b=cues[i+1];
  const mix=Math.max(0,Math.min(1,(local-a[0])/Math.max(.001,b[0]-a[0])));
  return [a[1]+(b[1]-a[1])*mix,a[2]+(b[2]-a[2])*mix];
}

export async function createValleyAudio() {
  const context = new AudioContext(); await context.suspend();
  const master=context.createGain(); master.gain.value=.85; master.connect(context.destination);
  const ambience=context.createGain(); ambience.gain.value=.06; ambience.connect(master);
  const urls={valley,sentinel,champion,david,survey,hold,ready};
  const buffers=new Map(await Promise.all(Object.entries(urls).map(async([id,url])=>{
    const response=await fetch(url); if(!response.ok) throw new Error('A Chapter 1 recording could not load.');
    return [id,await context.decodeAudioData(await response.arrayBuffer())] as const;
  })).catch(error=>{void context.close();throw error;}));
  const noise=context.createBuffer(1,context.sampleRate*4,context.sampleRate);
  const data=noise.getChannelData(0); let previous=0;
  for(let i=0;i<data.length;i++){previous=previous*.97+(Math.random()*2-1)*.03;data[i]=previous;}
  const wind=context.createBufferSource(); wind.buffer=noise; wind.loop=true;
  const filter=context.createBiquadFilter(); filter.type='lowpass'; filter.frequency.value=950;
  wind.connect(filter); filter.connect(ambience); wind.start();
  let origin=0, sequenceOrigin=0, lastCall=0,lastCloth=0;
  const sources=new Set<AudioScheduledSourceNode>();
  function track<T extends AudioScheduledSourceNode>(source:T){sources.add(source);source.onended=()=>{sources.delete(source);source.disconnect();};return source;}
  function spatial(position:{x:number;y:number;z:number}){
    const panner=context.createPanner(); panner.panningModel='equalpower'; panner.distanceModel='inverse'; panner.refDistance=3;panner.rolloffFactor=.65;panner.maxDistance=90;
    panner.positionX.value=position.x;panner.positionY.value=position.y;panner.positionZ.value=position.z;panner.connect(master);return panner;
  }
  function play(id:string, at:number, gain:number, position?:{x:number;y:number;z:number}){
    const source=track(context.createBufferSource());source.buffer=buffers.get(id)!;
    const volume=context.createGain();volume.gain.value=gain;source.connect(volume);
    const panner=position&&spatial(position);volume.connect(panner??master);
    source.addEventListener('ended',()=>{volume.disconnect();panner?.disconnect();});source.start(at);return source;
  }
  function cancel(){for(const source of sources){try{source.stop();}catch{/* Finished. */}source.disconnect();}sources.clear();}
  function drum(at:number){
    const oscillator=track(context.createOscillator()),gain=context.createGain();
    oscillator.frequency.setValueAtTime(79,at);oscillator.frequency.exponentialRampToValueAtTime(46,at+.4);
    gain.gain.setValueAtTime(.001,at);gain.gain.linearRampToValueAtTime(.09,at+.012);gain.gain.exponentialRampToValueAtTime(.001,at+.55);
    oscillator.connect(gain);gain.connect(ambience);oscillator.addEventListener('ended',()=>gain.disconnect());oscillator.start(at);oscillator.stop(at+.6);
  }
  function sequence(kind:ValleySequence, positions:{soldier:Vec3;david:Vec3}){
    cancel();sequenceOrigin=context.currentTime;
    if(kind==='intro'){
      origin=context.currentTime;lastCall=lastCloth=0;
      play('valley',sequenceOrigin+6,.92);play('sentinel',sequenceOrigin+12.8,1.0,positions.soldier);
      play('champion',sequenceOrigin+18.3,.92);play('david',sequenceOrigin+28.3,1.05,positions.david);
      play('hold',sequenceOrigin+3.5,.35,{x:-9,y:3,z:-14});play('ready',sequenceOrigin+26.3,.28,{x:9,y:3,z:-15});
      drum(sequenceOrigin+18.4);drum(sequenceOrigin+21.0);drum(sequenceOrigin+25.8);
    } else play('survey',sequenceOrigin+2.4,1.05,positions.soldier);
  }
  function textureSound(position:Vec3, gain:number, cutoff:number, duration:number){
    const source=track(context.createBufferSource());source.buffer=noise;
    const tone=context.createBiquadFilter();tone.type='bandpass';tone.frequency.value=cutoff;tone.Q.value=.7;
    const envelope=context.createGain();const at=context.currentTime;envelope.gain.setValueAtTime(.001,at);envelope.gain.linearRampToValueAtTime(gain,at+.012);envelope.gain.exponentialRampToValueAtTime(.001,at+duration);
    const panner=spatial(position);source.connect(tone);tone.connect(envelope);envelope.connect(panner);
    source.addEventListener('ended',()=>{tone.disconnect();envelope.disconnect();panner.disconnect();});source.start(at);source.stop(at+duration);
  }
  return {
    context, sequence, time:()=>context.currentTime-origin, sequenceTime:()=>context.currentTime-sequenceOrigin,
    resume:()=>resumeChapterAudio(context),async pause(){await context.suspend();},
    mute(value:boolean){master.gain.setValueAtTime(value?0:.85,context.currentTime);},
    footstep(position:Vec3){textureSound(position,1.1,650,.16);},
    gear(position:Vec3){textureSound(position,.15,1750,.3);},
    update(eye:Vec3,forward:Vec3,speaking:boolean){
      const listener=context.listener;
      [listener.positionX,listener.positionY,listener.positionZ].forEach((param,i)=>param.setValueAtTime([eye.x,eye.y,eye.z][i],context.currentTime));
      [listener.forwardX,listener.forwardY,listener.forwardZ].forEach((param,i)=>param.setValueAtTime([forward.x,forward.y,forward.z][i],context.currentTime));
      listener.upY.value=1; ambience.gain.setTargetAtTime((speaking ? .035 : .09)*(1+.2*Math.sin(context.currentTime*.4)),context.currentTime,.3);
      const time=context.currentTime-origin;
      if(time>42&&time-lastCall>17){lastCall=time;play(Math.floor(time/17)%2?'ready':'hold',context.currentTime,.3,{x:-9,y:3,z:-14});}
      if(time-lastCloth>9){lastCloth=time;textureSound({x:-4,y:2,z:11} as Vec3,.22,230,.8);}
    },
    cancel,
    dispose(){cancel();wind.stop();void context.close();},
  };
}
