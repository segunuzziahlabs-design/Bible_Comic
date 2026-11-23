import lines from '../assets/victory-dialogue/dialogue.json';
import retreat from '../assets/victory-dialogue/retreat-call.wav?url';
import israel from '../assets/victory-dialogue/israel-call.wav?url';
import cheerIsrael from '../assets/victory-dialogue/cheer-israel.wav?url';
import cheerVictory from '../assets/victory-dialogue/cheer-victory.wav?url';
import cheerDavid from '../assets/victory-dialogue/cheer-david.wav?url';
import david from '../assets/victory-dialogue/david-thanks.wav?url';
import closing from '../assets/victory-dialogue/closing.wav?url';
import {createSceneSpeech,type Point3} from './scene-speech';
import {victoryPursuit} from '../gameplay/victory-pursuit';
export const victoryDuration=38;
const cheers=[
  // The foreground soldier keeps bm_george for both his call and his chant.
  // The existing am_michael victory chant belongs to a different crowd position.
  {id:'cheer-victory',at:15.2,rate:.96,x:-5,z:-10},{id:'cheer-david',at:15.8,rate:1.04,x:-8,z:-13},
  {id:'cheer-israel',at:17.1,rate:1,x:-3.5,z:-8.2},{id:'cheer-israel',at:18.4,rate:1.05,x:-6,z:-14},
  {id:'cheer-david',at:19,rate:.95,x:-9,z:-15},{id:'cheer-victory',at:20.4,rate:.94,x:-4,z:-11},
  {id:'cheer-israel',at:21.2,rate:1.02,x:-7,z:-13},{id:'cheer-david',at:21.8,rate:1.07,x:-5,z:-10},
];
export async function createVictoryAudio(){
  const speech=await createSceneSpeech(lines,{'retreat-call':retreat,'israel-call':israel,'cheer-israel':cheerIsrael,'cheer-victory':cheerVictory,'cheer-david':cheerDavid,'david-thanks':david,closing},
    {victory:[{id:'retreat-call',start:3.2},{id:'israel-call',start:12.4},{id:'david-thanks',start:23},{id:'closing',start:29.2}]},[],8,{cinematicDialogue:['victory']});
  const ctx=speech.context,music=ctx.createGain();music.gain.value=.15;music.connect(ctx.destination);
  const notes=new Set<OscillatorNode>();let fired=new Set<number>(),impacts=new Set<number>(),lastFoot=0,muted=false;
  function score(){
    const pitches=[146.83,174.61,196,220,261.63,293.66,261.63,220,196,174.61,146.83,293.66];
    [8,10,12,14.25,16.5,18.75,21,23.5,27,29,31.5,34].forEach((offset,i)=>{
      const node=ctx.createOscillator(),gain=ctx.createGain();node.type='triangle';node.frequency.value=pitches[i];
      const at=ctx.currentTime+offset;gain.gain.setValueAtTime(.001,at);gain.gain.linearRampToValueAtTime(i>8?.09:.17,at+.012);gain.gain.exponentialRampToValueAtTime(.001,at+2.1);
      node.connect(gain).connect(music);notes.add(node);node.onended=()=>{notes.delete(node);node.disconnect();gain.disconnect();};node.start(at);node.stop(at+2.2);
    });
  }
  function cancel(){speech.cancel();for(const note of notes){try{note.stop();}catch{/* Ended. */}note.disconnect();}notes.clear();fired.clear();impacts.clear();}
  return{context:ctx,time:speech.cueTime,lineAt:speech.lineAt,
    async resume(){await speech.resume();},async pause(){await speech.pause();},
    mute(value:boolean){muted=value;speech.mute(value);music.gain.setValueAtTime(value?0:.15,ctx.currentTime);},
    begin(positions:Record<string,Point3>){cancel();speech.reset();lastFoot=0;speech.begin('victory',positions);score();},cancel,
    step(eye:Point3,forward:Point3,ground:(x:number,z:number)=>number){
      const t=speech.cueTime();cheers.forEach((cue,i)=>{if(t>=cue.at&&!fired.has(i)){fired.add(i);speech.oneShot(cue.id,{x:cue.x,y:ground(cue.x,cue.z)+1.5,z:cue.z},.42,cue.rate);}});
      if(t>=3.4&&t<22&&t-lastFoot>.22){lastFoot=t;const p=victoryPursuit(t,3).ally;speech.footstep({x:p.x,y:ground(p.x,p.z),z:p.z});speech.equipment({x:p.x,y:ground(p.x,p.z)+1,z:p.z});}
      for(let i=0;i<24;i++){const pair=victoryPursuit(t,i);if(t>=pair.contact+.34&&!impacts.has(i)){impacts.add(i);const p=pair.enemy;speech.setDown({x:p.x,y:ground(p.x,p.z)+.4,z:p.z});}}
      speech.update(eye,forward);
    },
    crowdLine(at?:{x:number;z:number}){const t=speech.cueTime(),cue=cheers.find(c=>(!at||c.x===at.x&&c.z===at.z)&&t>=c.at&&t<c.at+lines.find(l=>l.id===c.id)!.duration/c.rate);return cue&&{...lines.find(l=>l.id===cue.id)!,local:(t-cue.at)*cue.rate};},
    sample:()=>({cheers:fired.size,pursuitImpacts:impacts.size,scoreSources:notes.size,muted,audio:ctx.state}),
    dispose(){cancel();music.disconnect();speech.dispose();},
  };
}
