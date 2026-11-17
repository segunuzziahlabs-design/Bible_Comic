import './account-game-bootstrap';
import { mountObjectiveGuide } from './objective-guide';
import { createCharacterJump } from '../world/character-jump';
import { mountPlayerControls } from './player-controls-ui';
import { readEpisodeMuted, writeEpisodeMuted, setEpisodeSoundButton } from './episode-sound';
import {Vec3} from 'playcanvas';
import {currentObjective,episodePage,freshRun,objectives,reduceEpisode} from '../gameplay/episode-rules';
import {openEpisodeSession,type CueToken,type EpisodeSaveAdapter} from '../gameplay/episode-session';
import {createMovementInput} from '../gameplay/movement-input';
import {approachVelocity,firstWallHit,slideAlongWalls} from '../gameplay/ground-motion';
import {createWebGLApp,observeCanvas,waitForFrame} from '../world/graphics';
import {buildChallengeWorld,challengeVersion,hearingMark,eliabMark,alarmStart} from '../world/challenge-world';
import {createChallengeAudio,arrivalDuration,challengeDuration,exchangeDuration} from '../world/challenge-audio';
import {challengeShot} from '../world/challenge-shots';
import type {ValleyShot} from '../world/valley-shots';
import {loadConversationActor} from '../world/conversation-actor';
import {mouthEnvelope} from '../world/scene-speech';
import {hairColours,hairStyles,loadSavedAppearance,skinTones,tunicColours} from '../world/david-appearance';
import davidUrl from '../assets/david-dialogue.glb?url';
import './saul.css';
import './valley.css';

const el=(id:string)=>document.getElementById(id)!;
const button=(id:string)=>el(id) as HTMLButtonElement;
const canvas=el('stage') as HTMLCanvasElement,stage=canvas.parentElement!;
const input=createMovementInput(canvas,el('move-pad'));
const objectiveGuide=mountObjectiveGuide(stage,canvas),guideTarget=new Vec3();
const params=new URLSearchParams(location.search),review=params.has('review'),inspect=params.has('inspect');
const smooth=(v:number)=>{const t=Math.max(0,Math.min(1,v));return t*t*(3-2*t);};
const turn=(from:number,to:number,amount:number)=>from+(((to-from+540)%360)-180)*amount;
window.addEventListener('pageshow',event=>{if(event.persisted)location.reload();});

async function main(){
  let preview=freshRun();for(const goal of objectives.slice(0,3))preview=reduceEpisode(preview,{type:'objective',id:goal.id});
  let temporary:Awaited<ReturnType<EpisodeSaveAdapter['read']>>={current:preview,history:[]};
  const session=await openEpisodeSession(review?{async read(){return temporary;},async write(value){temporary=structuredClone(value);}}:undefined);
  if(!['challenge.heard','eliab.answered'].includes(currentObjective(session.run)?.id??'')){location.replace(episodePage(session.run));return;}
  const app=await createWebGLApp(canvas,true);observeCanvas(app,canvas);
  const [world,audio]=await Promise.all([buildChallengeWorld(app),createChallengeAudio()]);
  const david=await loadConversationActor(app,davidUrl,'David'),eliab=world.eliab,soldier=world.soldier,champion=world.champion;
  const appearance=loadSavedAppearance();david.tint('Skin',skinTones[appearance.skin].tint);david.tint('Cloth',tunicColours[appearance.tunic].tint);david.tint('Hair',hairColours[appearance.hairColour].tint);david.tint('Brows',hairColours[appearance.hairColour].tint);david.morph('FullerHair',hairStyles[appearance.hairStyle].fullness);
  const camera=world.camera,eye=new Vec3(),focus=new Vec3(),oldFeet=new Vec3();
  let mode:'entry'|'arrival'|'explore'|'challenge'|'exchange'|'complete'='entry';
  let paused=true,muted=readEpisodeMuted(),busy=false,time=0,idle=0,walk=0,yaw=0,pitch=.28,heading=180;
  let position={x:0,z:11.6},velocity={x:0,z:0},cueFrom={...position},cueHeading=180;
  const jump=createCharacterJump(app,world.groundHeight);jump.reset(position);
  let owner:CueToken|undefined,captionId='',lastShot='',shot='',stepDistance=0,retryWrite:(()=>Promise<void>)|undefined;
  const starts={challenge:0,exchange:0},foley=new Set<number>();let reaction={age:-1,retreat:0,alarm:0,eliabAge:-1,entrance:0,entranceWalking:false},soldierPose='idle_relaxed',eliabPose='listen';
  const heard=()=>session.run.completed.includes('challenge.heard');
  const target=()=>heard()?eliabMark:hearingMark;
  function placeDavid(){david.model.setPosition(position.x,world.groundHeight(position.x,position.z)+jump.sample().height,position.z);david.model.setEulerAngles(0,heading,0);}
  function canInteract(){const at=target();return mode==='explore'&&!jump.active()&&!paused&&!busy&&Math.hypot(position.x-at.x,position.z-at.z)<=1.55&&!firstWallHit(position,{x:at.x-position.x,z:at.z-position.z},world.walls,.08);}
  function controls(){const moving=mode==='explore'&&!paused&&!busy;input.setEnabled(moving);stage.toggleAttribute('data-moving',moving);stage.classList.toggle('cinematic',['arrival','challenge','exchange'].includes(mode));el('pause-notice').hidden=!paused||mode==='entry'||mode==='complete';
    button('pause').textContent=paused?'Resume':'Pause';button('pause').disabled=busy||mode==='entry'||mode==='complete';button('reset').disabled=busy||mode==='entry'||mode==='complete';button('interact').hidden=!canInteract();button('interact').textContent=heard()?'Speak with Eliab':'Hear the challenge';world.marker.enabled=mode==='explore';if(!moving)objectiveGuide.hide();}
  function hud(){const at=target();el('objective').textContent=heard()?'Speak with Eliab about the challenge':"Hear Goliath’s challenge from the overlook";world.marker.setPosition(at.x,world.groundHeight(at.x,at.z)+.025,at.z);el('save-status').textContent=review?'Chapter 3 review · Saved episode unchanged':heard()?'Challenge saved · Speak with Eliab':'Chapter 2 saved · Reach the overlook';}
  function frame(value:ValleyShot,dt:number,blend=false){shot=value.id;const cut=lastShot!==value.id&&!blend;lastShot=value.id;const toEye=new Vec3(...value.eye),toFocus=new Vec3(...value.focus);
    if(cut||dt===0){eye.copy(toEye);focus.copy(toFocus);}else{const factor=1-Math.exp(-5*dt);eye.lerp(eye,toEye,factor);focus.lerp(focus,toFocus,factor);}camera.setPosition(eye);camera.lookAt(focus);camera.camera!.fov=value.fov*(canvas.clientHeight>canvas.clientWidth?1.4:1);}
  function follow(dt:number,blend=true){const delta={x:Math.sin(yaw)*3.6,z:Math.cos(yaw)*3.6},hit=firstWallHit(position,delta,world.walls.slice(-3),.15),distance=hit?Math.max(.8,3.6*hit.time-.05):3.6;
    const x=position.x+Math.sin(yaw)*distance,z=position.z+Math.cos(yaw)*distance,y=world.groundHeight(position.x,position.z);
    frame({id:'follow',eye:[x,Math.max(world.groundHeight(x,z)+.7,jump.cameraY(y+1.05+distance*Math.tan(pitch),x,z)),z],focus:[position.x,y+1.1+jump.cameraFocus(),position.z-.12],fov:49},dt,blend);}
  function faces(){const line=audio.lineAt(),key=line?.id??'';
    if(captionId!==key){captionId=key;el('caption').replaceChildren();el('caption').hidden=!line;if(line){const speaker=document.createElement('strong');speaker.textContent=line.speaker;el('caption').append(speaker,document.createTextNode(line.text));}}
    const mouth=line?mouthEnvelope(line,line.local):[0,0];champion.face(line?.speaker==='Goliath'?mouth[0]:0,line?.speaker==='Goliath'?mouth[1]:0);
    for(const [actor,name,offset]of[[david,'David',1.8],[eliab,'Eliab',0],[soldier,'Soldier',3]] as const){const speaking=line?.speaker===name,blink=Math.max(0,1-Math.abs(((audio.time()+offset)%4.8)-.1)/.1);actor.face(speaking?mouth[0]:0,speaking?mouth[1]:0,name==='Eliab'?0:.04,name==='Eliab'&&mode==='exchange'?.04:.2,blink);}
  }
  async function start(){jump.reset(position);if(busy)return;session.cancelCue();owner=undefined;audio.reset();await audio.resume();mode='arrival';paused=false;time=idle=walk=0;position={x:0,z:11.6};velocity={x:0,z:0};heading=180;yaw=0;pitch=.28;stepDistance=0;captionId='';lastShot='';foley.clear();world.resetActivity();reaction=world.step(0,-1,heard());
    for(const actor of[david,eliab,soldier]){actor.pose('idle_relaxed',0,0);actor.face(0,0,0,.1,0);}champion.face(0,0);placeDavid();oldFeet.copy(david.model.getPosition());el('entry').hidden=true;el('review-gate').hidden=true;el('caption').hidden=true;button('sound').disabled=false;hud();controls();canvas.focus();}
  async function pause(value:boolean){if(busy||mode==='entry'||mode==='complete'||paused===value)return;paused=value;velocity={x:0,z:0};controls();if(value)await audio.pause();else{await audio.resume();canvas.focus();}}
  function interact(){if(!canInteract())return;const kind=heard()?'exchange':'challenge';owner=session.beginCue(kind==='challenge'?'challenge.heard':'eliab.answered');cueFrom={...position};cueHeading=heading;mode=kind;starts[kind]++;time=0;velocity={x:0,z:0};captionId='';
    audio.begin(kind,{David:{x:target().x,y:world.groundHeight(target().x,target().z)+1.45,z:target().z},Eliab:eliab.model.getPosition().clone().add(new Vec3(0,1.65,0)),Soldier:soldier.model.getPosition().clone().add(new Vec3(0,1.6,0)),Goliath:champion.model.getPosition().clone().add(new Vec3(0,2.6,0))});controls();}
  async function finish(kind:'challenge'|'exchange'){
    if(!owner||busy)return;busy=true;controls();const token=owner;
    const operation=async()=>{await session.finishCue(token);owner=undefined;busy=false;el('save-error').hidden=true;audio.cancel();el('caption').hidden=true;captionId='';
      if(kind==='challenge'){mode='explore';hud();controls();}else{mode='complete';paused=true;await audio.pause();el('review-gate').hidden=false;el('review-message').textContent=review?'Preview complete. Your saved episode progress is unchanged.':'The challenge and David’s answer are saved. Continue to his audience with Saul.';el('save-status').textContent=review?'Chapter 3 preview complete':'Chapter 3 checkpoint saved';controls();}};
    retryWrite=operation;try{await operation();retryWrite=undefined;}catch(error){paused=true;await audio.pause();controls();el('save-error').hidden=false;el('save-error-message').textContent=error instanceof Error?error.message:'The last checkpoint is preserved.';}
  }
  const playerControls=mountPlayerControls(canvas,input,value=>{void pause(value);},()=>paused);
  jump.connect(input,controls);
  input.bindActions({jump:{run:()=>{jump.request(position);},available:()=>mode==='explore'&&!paused&&!busy&&jump.ready(position)},interact:{run:interact,available:canInteract},pause:{run:()=>{void pause(!paused);},available:()=>!button('pause').disabled&&!playerControls.open}});
  input.bindButton(button('interact'),'interact');input.bindButton(button('pause'),'pause');
  button('enter').addEventListener('click',()=>{void start();});button('reset').addEventListener('click',()=>{void start();});
  button('sound').addEventListener('click',()=>{muted=!muted;writeEpisodeMuted(muted);audio.mute(muted);setEpisodeSoundButton(button('sound'),muted);});button('replay').addEventListener('click',()=>location.assign('challenge.html?review=1'+(inspect?'&inspect=1':'')));
  button('continue-preparation').addEventListener('click',()=>location.assign('preparation.html'+(review?'?review=1'+(inspect?'&inspect=1':''):inspect?'?inspect=1':'')));
  button('retry-save').addEventListener('click',()=>{if(retryWrite)void retryWrite().catch(error=>{el('save-error-message').textContent=String(error);});});button('reload-save').addEventListener('click',()=>location.reload());
  window.addEventListener('blur',()=>{void pause(true);});document.addEventListener('visibilitychange',()=>{if(document.hidden)void pause(true);});
  window.addEventListener('storage',event=>{if(!review&&event.key==='bible-comic.episode.local.v1'){void pause(true);busy=true;controls();el('save-error').hidden=false;el('save-error-message').textContent='Progress changed in another tab. Reload the checkpoint.';button('retry-save').hidden=true;}});
  window.addEventListener('pagehide',()=>{session.cancelCue();input.dispose();audio.dispose();app.destroy();},{once:true});
  app.on('update',rawDt=>{
    const dt=Math.min(rawDt,.05);
    if(!paused&&!busy){
      idle+=dt;if(mode==='arrival')time=Math.min(arrivalDuration,audio.time());else if(mode==='challenge'||mode==='exchange')time=Math.min(mode==='challenge'?challengeDuration:exchangeDuration,audio.cueTime());
      reaction=world.step(audio.time(),mode==='challenge'?time:-1,heard());const line=audio.lineAt();
      soldierPose=reaction.age>=0&&reaction.age<2.2?'react_alarm':line?.speaker==='Soldier'?'speak_concern':'listen';
      soldier.pose(soldierPose,soldierPose==='react_alarm'?Math.min(reaction.age,soldier.tracks.get(soldierPose)!.duration):line?.speaker==='Soldier'?Math.min(line.local,soldier.tracks.get(soldierPose)!.duration):idle%soldier.tracks.get(soldierPose)!.duration,dt);
      eliabPose=reaction.eliabAge>=0&&reaction.eliabAge<2.2?'react_alarm':line?.speaker==='Eliab'?'speak_rebuke':'listen';
      eliab.pose(eliabPose,eliabPose==='react_alarm'?Math.min(reaction.eliabAge,eliab.tracks.get(eliabPose)!.duration):line?.speaker==='Eliab'?Math.min(line.local,eliab.tracks.get(eliabPose)!.duration):idle%eliab.tracks.get(eliabPose)!.duration,dt);
      champion.pose(reaction.entranceWalking?'goliath_advance':line?.speaker==='Goliath'?'goliath_speak':'goliath_ready',reaction.entranceWalking?(time*1.2)%1.333:line?.speaker==='Goliath'?Math.min(line.local,champion.tracks.get('goliath_speak')!.duration):idle%champion.tracks.get('goliath_ready')!.duration,dt);
      if(mode==='arrival'){
        const old={...position};position={x:0,z:11.6-.7*smooth(time/6)};walk+=Math.hypot(position.x-old.x,position.z-old.z)/.93;const clip=time<6?'walk_forward':'idle_relaxed';david.pose(clip,(time<6?walk:idle)%david.tracks.get(clip)!.duration,dt);placeDavid();frame(challengeShot('arrival',time,world.groundHeight),dt);
        if(time>=arrivalDuration){mode='explore';follow(dt,true);controls();}
      }else if(mode==='challenge'||mode==='exchange'){
        const kind=mode,mark=kind==='challenge'?hearingMark:eliabMark,progress=smooth(time/1.6),old={...position};position={x:cueFrom.x+(mark.x-cueFrom.x)*progress,z:cueFrom.z+(mark.z-cueFrom.z)*progress};heading=turn(cueHeading,180,progress);const distance=Math.hypot(position.x-old.x,position.z-old.z);walk+=distance/.93;placeDavid();
        const walking=time<1.6&&distance>.0001,clip=walking?'walk_forward':line?.speaker==='David'?'speak_resolve':'listen';david.pose(clip,walking?walk%david.tracks.get(clip)!.duration:line?.speaker==='David'?Math.min(line.local,david.tracks.get(clip)!.duration):idle%david.tracks.get(clip)!.duration,dt);
        if(kind==='exchange'){eliab.model.setEulerAngles(0,0,0);const soldierAt=soldier.model.getPosition();soldier.model.setEulerAngles(0,Math.atan2(position.x-soldierAt.x,position.z-soldierAt.z)*180/Math.PI,0);if(time>=24){heading=turn(180,239,smooth((time-24)/2));placeDavid();}}
        if(kind==='challenge'&&reaction.entranceWalking)for(const beat of[.5,1.35,2.2,3.05,3.9,4.75,5.6,6.45])if(time>=beat&&!foley.has(beat)){foley.add(beat);audio.footstep(champion.model.getPosition());audio.equipment(champion.model.getPosition());}
        if(kind==='challenge')for(const beat of[alarmStart+.05,alarmStart+.5,alarmStart+.95,alarmStart+1.4,16.1,19.1])if(time>=beat&&!foley.has(beat)){foley.add(beat);audio.equipment(soldier.model.getPosition());audio.footstep(soldier.model.getPosition());}
        if(time<(kind==='challenge'?28:26))frame(challengeShot(kind,time,world.groundHeight),dt);else follow(dt,true);
        if(time>=(kind==='challenge'?challengeDuration:exchangeDuration))void finish(kind);
      }else if(mode==='explore'){
        const movement=input.read();yaw-=movement.lookX*.004;pitch=Math.max(.1,Math.min(.6,pitch+movement.lookY*.003));const desired={x:(movement.x*Math.cos(yaw)-movement.forward*Math.sin(yaw))*1.35,z:(-movement.x*Math.sin(yaw)-movement.forward*Math.cos(yaw))*1.35};velocity=approachVelocity(velocity,desired,(movement.x||movement.forward?5:8)*(jump.active()?.6:1)*dt);
        const next=slideAlongWalls(position,{x:velocity.x*dt,z:velocity.z*dt},world.walls),distance=Math.hypot(next.x-position.x,next.z-position.z),speed=distance/Math.max(.0001,dt);position=next;walk+=distance/.93;if(speed>.03)heading=turn(heading,Math.atan2(velocity.x,velocity.z)*180/Math.PI,1-Math.exp(-12*dt));
        jump.step(dt,position);const clip=speed>.06?'walk_forward':'idle_relaxed';jump.pose(david,clip,(speed>.06?walk:idle)%david.tracks.get(clip)!.duration,dt);placeDavid();follow(dt,true);button('interact').hidden=!canInteract();el('distance').textContent=`${Math.round(Math.hypot(position.x-target().x,position.z-target().z))} m · Follow the gold marker`;
      }
      faces();if(!jump.active())stepDistance+=oldFeet.distance(david.model.getPosition());oldFeet.copy(david.model.getPosition());if(stepDistance>.46){stepDistance=0;audio.footstep(oldFeet);}audio.update(camera.getPosition(),camera.forward);
    }
    objectiveGuide.update(camera.camera!,david.model.getPosition(),guideTarget.set(target().x,world.groundHeight(target().x,target().z)+1.3,target().z),heard()?'Speak with Eliab':'Hear the challenge',canInteract()?'E / tap to interact':'Follow the arrows',mode==='explore'&&!paused&&!busy);
    if(inspect)canvas.dataset.challenge=JSON.stringify({version:challengeVersion,mode,time,paused,muted,busy,review,position,jump:jump.sample(),shot,canInteract:canInteract(),target:target(),starts,reaction,foley:foley.size,soldierPosition:soldier.model.getPosition(),soldierPose,eliabPose,championHead:champion.forehead.getPosition(),championRoot:champion.model.getPosition(),speaker:audio.lineAt()?.speaker,goliathMouth:champion.mouthWeights(),davidMouth:david.mouthWeights(),eliabMouth:eliab.mouthWeights(),soldierMouth:soldier.mouthWeights(),audio:audio.context.state,run:session.run,frameMs:app.stats.frame.ms});
  });
  reaction=world.step(0,-1,heard());placeDavid();oldFeet.copy(david.model.getPosition());hud();frame(challengeShot('arrival',0,world.groundHeight),0);audio.mute(muted);setEpisodeSoundButton(button('sound'),muted);await waitForFrame(app);el('entry-message').textContent=heard()?'The challenge is saved. Speak with Eliab about what David has heard.':'Enter with sound. Reach the overlook, hear the champion, then speak with Eliab.';button('enter').textContent=heard()?'Resume Chapter 3':'Begin Chapter 3';button('enter').hidden=false;
}
void main().catch(error=>{console.error(error);el('entry-message').textContent=error instanceof Error?error.message:'The challenge could not load.';button('retry').hidden=false;});button('retry').addEventListener('click',()=>location.reload());
