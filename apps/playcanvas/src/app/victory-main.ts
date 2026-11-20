import { checkpointSaved } from './account-game-bootstrap';
import {resumeChapterAudio} from '../world/chapter-audio-start';
import {createSpeechFaceMotion} from '../gameplay/speech-face-motion';
import {castBlink,listenerNodStart} from '../gameplay/cast-performance';
import {dialogueGestureTime} from '../gameplay/story-motion';
import {createAudiencePerformance,reactionNod} from '../world/audience-performance';
import { readEpisodeMuted, writeEpisodeMuted, setEpisodeSoundButton } from './episode-sound';
import {Vec3} from 'playcanvas';
import {currentObjective,episodePage,freshRun,objectives,reduceEpisode,requiresBattleFinish} from '../gameplay/episode-rules';
import {openEpisodeSession,type CueToken,type EpisodeSaveAdapter} from '../gameplay/episode-session';
import {createWebGLApp,observeCanvas,waitForFrame} from '../world/graphics';
import {buildVictoryWorld,davidMark,israelMark,victoryVersion} from '../world/victory-world';
import {createVictoryAudio,victoryDuration} from '../world/victory-audio';
import {victoryShot} from '../world/victory-shots';
import {loadConversationActor} from '../world/conversation-actor';
import {mouthEnvelope} from '../world/scene-speech';
import {hairColours,hairStyles,loadSavedAppearance,skinTones,tunicColours} from '../world/david-appearance';
import davidUrl from '../assets/david-dialogue.glb?url';
import './saul.css';import './valley.css';import './victory.css';
const el=(id:string)=>document.getElementById(id)!,button=(id:string)=>el(id)as HTMLButtonElement;
const canvas=el('stage')as HTMLCanvasElement,stage=canvas.parentElement!,params=new URLSearchParams(location.search);
const review=params.has('review'),inspect=params.has('inspect');
const link=(page:string)=>page+(inspect?(page.includes('?')?'&':'?')+'inspect=1':'');
window.addEventListener('pageshow',event=>{if(event.persisted)location.reload();});
async function main(){
  let preview=freshRun();for(const objective of objectives.slice(0,11))preview=reduceEpisode(preview,{type:'objective',id:objective.id});
  let memory:Awaited<ReturnType<EpisodeSaveAdapter['read']>>={current:preview,history:[]};
  const session=await openEpisodeSession(review?{async read(){return memory;},async write(value){memory=structuredClone(value);}}:undefined);
  if(!review&&requiresBattleFinish(session.run)){location.replace(link('duel.html'));return;}
  if(session.run.status!=='completed'&&currentObjective(session.run)?.id!=='victory.witnessed'){location.replace(link(episodePage(session.run)));return;}
  const app=await createWebGLApp(canvas,true);observeCanvas(app,canvas);
  const [world,audio]=await Promise.all([buildVictoryWorld(app),createVictoryAudio()]);
  const david=await loadConversationActor(app,davidUrl,'David'),appearance=loadSavedAppearance();
  david.tint('Skin',skinTones[appearance.skin].tint);david.tint('Cloth',tunicColours[appearance.tunic].tint);david.tint('Hair',hairColours[appearance.hairColour].tint);david.tint('Brows',hairColours[appearance.hairColour].tint);david.morph('FullerHair',hairStyles[appearance.hairStyle].fullness);
  david.model.setPosition(davidMark.x,world.groundHeight(davidMark.x,davidMark.z),davidMark.z);david.model.setEulerAngles(0,-65,0);
  const performances=[david,world.israel].map(createAudiencePerformance),speechFace=createSpeechFaceMotion(),crowdFace=createSpeechFaceMotion();
  let mode:'entry'|'playing'|'results'='entry',paused=true,muted=readEpisodeMuted(),busy=false,starting=false,time=0,starts=0,lastShot='',captionKey='';
  let owner:CueToken|undefined,retryWrite:(()=>Promise<void>)|undefined;
  const eye=new Vec3(),focus=new Vec3();
  function controls(){button('pause').disabled=busy||starting||mode!=='playing';button('reset').disabled=busy||starting||mode==='entry';button('pause').textContent=paused?'Resume':'Pause';button('watch-again').disabled=button('replay-episode').disabled=busy||starting;el('pause-notice').hidden=!paused||mode!=='playing'||busy;stage.classList.toggle('cinematic',mode==='playing');}
  async function pause(value:boolean){if(busy||mode!=='playing'||paused===value)return;paused=value;controls();if(value)await audio.pause();else{await audio.resume();canvas.focus();}}
  function results(){mode='results';paused=true;void audio.pause();el('entry').hidden=true;el('results').hidden=false;el('caption').hidden=true;
    const run=session.run;el('result-detail').textContent=`6 chapters complete · ${run.attempt} battle attempt${run.attempt===1?'':'s'} · ${run.defeats} defeat${run.defeats===1?'':'s'}`;
    el('result-save').textContent=review?'Isolated preview complete · Normal episode unchanged':checkpointSaved();el('save-status').textContent=review?'Chapter 6 preview complete':checkpointSaved();button('episode-summary').hidden=review;controls();}
  async function save(operation:()=>Promise<void>,done:()=>void){
    if(busy&&el('save-error').hidden)return;busy=true;paused=true;await audio.pause();controls();button('retry-save').disabled=true;
    const attempt=async()=>{await operation();retryWrite=undefined;busy=false;el('save-error').hidden=true;done();controls();};retryWrite=attempt;
    try{await attempt();}catch(error){el('save-error-message').textContent=error instanceof Error?error.message:'The confirmed checkpoint is preserved.';el('save-error').hidden=false;button('retry-save').disabled=false;el('save-status').textContent='Progress not saved';controls();}
  }
  async function start(){if(busy||starting)return;starting=true;paused=true;controls();try{performances.forEach(p=>p.restore());session.cancelCue();audio.cancel();speechFace.reset(audio.context.currentTime);crowdFace.reset(audio.context.currentTime);owner=session.run.status==='completed'?undefined:session.beginCue('victory.witnessed');button('enter').disabled=true;await resumeChapterAudio(audio.context);
    mode='playing';paused=false;time=0;starts++;lastShot=captionKey='';el('entry').hidden=el('results').hidden=true;button('sound').disabled=false;button('enter').disabled=false;
    audio.begin({Philistine:{x:-1.45,y:world.groundHeight(-1.45,-9.8)+1.5,z:-9.8},Soldier:{x:israelMark.x,y:world.groundHeight(israelMark.x,israelMark.z)+1.5,z:israelMark.z},David:david.model.getPosition().clone().add(new Vec3(0,1.45,0))});
    render(0);el('save-status').textContent=review?'Chapter 6 review · Normal episode unchanged':'Victory checkpoint · Completion saves after the conclusion';controls();canvas.focus();
    }catch(error){session.cancelCue();owner=undefined;audio.cancel();void audio.pause().catch(()=>{});mode='entry';paused=true;time=0;render(0);el('entry').hidden=false;el('results').hidden=true;el('caption').hidden=true;el('entry-message').textContent=error instanceof Error&&/sound|audio/i.test(error.message)?'Sound could not start. Select Try again to begin the conclusion.':'The conclusion could not start. Select Try again.';button('enter').textContent='Try again';
    }finally{starting=false;button('enter').disabled=false;controls();}
  }
  function render(dt:number){
    performances.forEach(p=>p.restore());
    const line=audio.lineAt(),crowd=audio.crowdLine(israelMark),davidSpeaking=line?.speaker==='David';world.stageVictory(time,dt,line);
    const clip=davidSpeaking?'speak_resolve':time>=26&&time<28?'acknowledge':'listen';david.pose(clip,davidSpeaking?dialogueGestureTime(line.local,line.duration,david.tracks.get(clip)!.duration):clip==='acknowledge'?time-26:time%david.tracks.get(clip)!.duration,dt);
    const mouth=speechFace.step(line?mouthEnvelope(line,line.local):[0,0],audio.context.currentTime),cheer=crowdFace.step(crowd?mouthEnvelope(crowd,crowd.local):[0,0],audio.context.currentTime);
    david.face(davidSpeaking?mouth[0]:0,davidSpeaking?mouth[1]:0,.18,.15,castBlink(time,0));
    world.israel.face(line?.speaker==='Soldier'?mouth[0]:crowd?cheer[0]:0,line?.speaker==='Soldier'?mouth[1]:crowd?cheer[1]:0,time>=12?.4:.05,.3,castBlink(time,2));
    world.bearer.face(line?.speaker==='Philistine'?mouth[0]:0,line?.speaker==='Philistine'?mouth[1]:0,0,.5,castBlink(time,3));
    performances[0].apply(time,davidSpeaking,line&&!davidSpeaking?reactionNod(line.local,listenerNodStart(line.duration,0),.9,1.8):0,1.6);performances[1].apply(time,line?.speaker==='Soldier',davidSpeaking?reactionNod(line.local,listenerNodStart(line.duration,1),.9,1.8):0,.4);
    const shot=victoryShot(time,world.groundHeight),cut=lastShot!==shot.id;lastShot=shot.id;const blend=cut?1:1-Math.exp(-5*dt);
    eye.lerp(eye,new Vec3(...shot.eye),blend);focus.lerp(focus,new Vec3(...shot.focus),blend);world.camera.setPosition(eye);world.camera.lookAt(focus);world.camera.camera!.fov=shot.fov*(canvas.clientHeight>canvas.clientWidth?1.12:1);
    const key=line?.id??(time>=15.2&&time<23?'cheering':'');if(key!==captionKey){captionKey=key;el('caption').textContent=line?`${line.speaker}: ${line.text}`:key?'Israelite soldiers cheer.':'';el('caption').hidden=!key;}
  }
  button('enter').addEventListener('click',()=>{void start();});button('reset').addEventListener('click',()=>{void start();});button('watch-again').addEventListener('click',()=>{void start();});
  button('pause').addEventListener('click',()=>{void pause(!paused);});button('sound').addEventListener('click',()=>{muted=!muted;writeEpisodeMuted(muted);audio.mute(muted);setEpisodeSoundButton(button('sound'),muted);});
  button('replay-episode').addEventListener('click',()=>{void save(()=>session.replay(),()=>location.assign(link(review?'valley.html?review=1':'valley.html')));});
  button('episode-summary').addEventListener('click',()=>location.assign(link('episode.html')));
  button('retry-save').addEventListener('click',()=>{if(retryWrite){button('retry-save').disabled=true;void retryWrite().catch(error=>{el('save-error-message').textContent=String(error);button('retry-save').disabled=false;});}});
  button('reload-save').addEventListener('click',()=>location.reload());
  window.addEventListener('keydown',event=>{if(event.code==='Escape'&&!event.repeat){event.preventDefault();void pause(!paused);}});
  window.addEventListener('blur',()=>{void pause(true);});document.addEventListener('visibilitychange',()=>{if(document.hidden)void pause(true);});
  window.addEventListener('storage',event=>{if(review||event.key!=='bible-comic.episode.local.v1')return;session.cancelCue();busy=paused=true;void audio.pause();controls();el('save-error').hidden=false;el('save-error-message').textContent='Progress changed in another tab. Reload its checkpoint.';button('retry-save').hidden=true;retryWrite=undefined;});
  window.addEventListener('pagehide',()=>{session.cancelCue();audio.dispose();app.destroy();},{once:true});
  app.on('update',dt=>{
    if(mode==='playing'&&!paused&&!busy){time=Math.min(victoryDuration,audio.time());render(Math.min(dt,.05));audio.step(world.camera.getPosition(),world.camera.forward,world.groundHeight);
      if(time>=victoryDuration){if(owner){const token=owner;owner=undefined;void save(()=>session.finishCue(token),results);}else results();}}
    if(inspect)canvas.dataset.victory=JSON.stringify({version:victoryVersion,mode,time,paused,muted,busy,review,starts,shot:lastShot,speaker:audio.lineAt()?.speaker,audio:audio.sample(),activity:world.sample(),davidMouth:david.mouthWeights(),israelMouth:world.israel.mouthWeights(),bearer:world.bearer.model.getPosition(),cheeringArm:world.israel.model.findByName('hand_r')?.getPosition(),run:session.run,history:session.history});
  });
  time=session.run.status==='completed'?victoryDuration:0;render(0);audio.mute(muted);setEpisodeSoundButton(button('sound'),muted);await waitForFrame(app);canvas.dataset.renderer=app.graphicsDevice.deviceType;
  if(session.run.status==='completed'){button('sound').disabled=false;results();}else{el('entry-message').textContent='Witness the Philistine retreat, the cheers of Israel and David’s closing response. You can pause or restart the conclusion.';button('enter').hidden=false;}
}
void main().catch(error=>{console.error(error);el('entry-message').textContent=error instanceof Error?error.message:'The conclusion could not load.';button('retry').hidden=false;});button('retry').addEventListener('click',()=>location.reload());
