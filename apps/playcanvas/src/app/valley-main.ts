import './account-game-bootstrap';
import { readEpisodeMuted, writeEpisodeMuted, setEpisodeSoundButton } from './episode-sound';
import { Vec3 } from 'playcanvas';
import { currentObjective, episodePage } from '../gameplay/episode-rules';
import { openEpisodeSession, type CueToken } from '../gameplay/episode-session';
import { createMovementInput } from '../gameplay/movement-input';
import { approachVelocity, firstWallHit, slideAlongWalls } from '../gameplay/ground-motion';
import { createWebGLApp, observeCanvas, waitForFrame } from '../world/graphics';
import { buildValleyOpening, overlook, valleyPresentationVersion } from '../world/valley-opening';
import { createValleyAudio, openingDuration, surveyDuration, valleyMouth, valleySpeech } from '../world/valley-audio';
import { openingShot, surveyShot, type ValleyShot } from '../world/valley-shots';
import { loadConversationActor } from '../world/conversation-actor';
import { loadSavedAppearance, skinTones, tunicColours, hairColours, hairStyles } from '../world/david-appearance';
import davidUrl from '../assets/david-adventure.glb?url';
import { createShepherdOpening } from '../world/shepherd-opening';
import { mountObjectiveGuide } from './objective-guide';
import { createCharacterJump } from '../world/character-jump';
import { mountPlayerControls } from './player-controls-ui';
import './saul.css';
import './valley.css';

const element=(id:string)=>document.getElementById(id)!;
const button=(id:string)=>element(id) as HTMLButtonElement;
const canvas=element('stage') as HTMLCanvasElement, stage=canvas.parentElement!;
const input=createMovementInput(canvas,element('move-pad'));
const guide=mountObjectiveGuide(stage,canvas),guidePoint=new Vec3();
const params=new URLSearchParams(location.search), review=params.has('review'), inspect=params.has('inspect');
const smooth=(v:number)=>{const t=Math.max(0,Math.min(1,v));return t*t*(3-2*t);};
window.addEventListener('pageshow',event=>{if(event.persisted)location.reload();});

async function main(){
  let temporary:Awaited<ReturnType<import('../gameplay/episode-session').EpisodeSaveAdapter['read']>>;
  const session=await openEpisodeSession(review?{async read(){return temporary;},async write(value){temporary=structuredClone(value);}}:undefined);
  if(currentObjective(session.run)?.id!=='valley.surveyed') {location.replace(episodePage(session.run));return;}
  const app=await createWebGLApp(canvas,true);observeCanvas(app,canvas);
  const world=await buildValleyOpening(app), audio=await createValleyAudio();
  const david=await loadConversationActor(app,davidUrl,'David');
  const appearance=loadSavedAppearance();
  david.tint('Skin',skinTones[appearance.skin].tint);david.tint('Cloth',tunicColours[appearance.tunic].tint);
  david.tint('Hair',hairColours[appearance.hairColour].tint);david.tint('Brows',hairColours[appearance.hairColour].tint);
  david.morph('FullerHair',hairStyles[appearance.hairStyle].fullness);
  const camera=world.camera, eye=new Vec3(),focus=new Vec3();
  let mode:'entry'|'prologue'|'intro'|'explore'|'survey'|'complete'='entry';
  let paused=true,muted=readEpisodeMuted(),busy=false,time=0,yaw=0,pitch=.29,heading=180,walk=0,idle=0;
  let position={x:0,z:12},velocity={x:0,z:0},lastShot='',shot='entry',captionId='';
  const jump=createCharacterJump(app,world.groundHeight);jump.reset(position);
  let owner:CueToken|undefined, stepDistance=0, patrolDistance=0, surveyCount=0;
  let startPending=false,soundBlocked=false;
  let oldDavid=new Vec3(),oldPatrol=new Vec3(),retryWrite:(()=>Promise<void>)|undefined;

  function setActorPosition(){david.model.setPosition(position.x,world.groundHeight(position.x,position.z)+jump.sample().height,position.z);david.model.setEulerAngles(0,heading,0);}
  function canSurvey(){return mode==='explore'&&!jump.active()&&!paused&&!busy&&Math.hypot(position.x-overlook.x,position.z-overlook.z)<=1.65;}
  function controls(){
    const moving=(mode==='explore'||mode==='prologue'&&opening.moving())&&!paused&&!busy;input.setEnabled(moving);stage.toggleAttribute('data-moving',moving);
    stage.classList.toggle('cinematic',mode==='intro'||mode==='survey'||mode==='prologue'&&!opening.moving());element('pause-notice').hidden=!paused||mode==='entry'||mode==='complete';
    button('pause').textContent=paused?'Resume':'Pause';button('survey').hidden=mode==='prologue'?paused||!opening.canInteract():!canSurvey();button('survey').textContent=mode==='prologue'?opening.action():'Survey the valley';
    button('reset').disabled=busy||startPending||mode==='entry'||mode==='complete';button('pause').disabled=startPending||mode==='entry'||mode==='complete';
    setEpisodeSoundButton(button('sound'),muted||soundBlocked);
    if(mode==='prologue'){element('instructions').querySelector('.keyboard-hint')!.textContent=opening.moving()?(opening.pathWalking()?'WASD / arrows · Follow the path arrows · Arrival starts automatically':`WASD / arrows · Drag to look · E: ${opening.action()}`):'Watch the scene · Escape to pause';element('instructions').querySelector('.touch-hint')!.textContent=opening.moving()?(opening.pathWalking()?'Left controls · Follow the path arrows · Arrival starts automatically':`Left controls to move · Drag to look · Tap ${opening.action()}`):'Watch the scene · Tap Pause';element('save-status').textContent=opening.moving()?'Follow the arrows · First checkpoint after the Elah survey':'Watch the scene · Pause or restart at any time';}else{element('instructions').querySelector('.keyboard-hint')!.textContent='WASD / arrows · Drag to look · E to survey';element('instructions').querySelector('.touch-hint')!.textContent='Left controls to move · Drag to look · Tap Survey';}
    world.marker.enabled=mode==='explore';if(!moving)guide.hide();
  }
  function frame(value:ValleyShot,dt:number,blend=false){
    shot=value.id;const cut=lastShot!==value.id&&!blend;lastShot=value.id;
    const desiredEye=new Vec3(...value.eye),desiredFocus=new Vec3(...value.focus);
    if(cut||dt===0){eye.copy(desiredEye);focus.copy(desiredFocus);}
    else {const factor=1-Math.exp(-4*dt);eye.lerp(eye,desiredEye,factor);focus.lerp(focus,desiredFocus,factor);}
    camera.setPosition(eye);camera.lookAt(focus);camera.camera!.fov=value.fov*(canvas.clientHeight>canvas.clientWidth?1.4:1);
  }
  function follow(dt:number,blend=false){
    const offset={x:Math.sin(yaw)*3.8,z:Math.cos(yaw)*3.8};
    // Only physical camp props constrain the camera; an invisible walk boundary does not.
    const hit=firstWallHit(position,offset,world.walls.slice(world.walls.length-3),.16);
    const distance=hit?Math.max(.85,3.8*hit.time-.05):3.8;
    const x=position.x+Math.sin(yaw)*distance,z=position.z+Math.cos(yaw)*distance;
    frame({id:'follow',eye:[x,Math.max(world.groundHeight(x,z)+.7,jump.cameraY(world.groundHeight(position.x,position.z)+1.05+distance*Math.tan(pitch),x,z)),z],
      focus:[position.x,world.groundHeight(position.x,position.z)+1.1+jump.cameraFocus(),position.z-.15],fov:49},dt,blend);
  }
  function clearFaces(){for(const actor of [david,world.sentinel,world.patrol])actor.face(0,0,0,.1,0);}
  function speech(sequence:'intro'|'survey',t:number){
    const line=valleySpeech(sequence,t),id=line?.id??'';
    if(id!==captionId){captionId=id;element('caption').replaceChildren();element('caption').hidden=!line;
      if(line){const speaker=document.createElement('strong');speaker.textContent=line.speaker;element('caption').append(speaker,document.createTextNode(line.text));}}
    const mouth=line?valleyMouth(line,t):[0,0];
    const blink=(offset:number)=>Math.max(0,1-Math.abs(((audio.time()+offset)%4.8)-.1)/.10);
    david.face(line?.speaker==='David'?mouth[0]:0,line?.speaker==='David'?mouth[1]:0,t>27?.25:.05,line?.speaker==='David'?.3:.15,blink(1.8));
    world.sentinel.face(line?.speaker==='Soldier'?mouth[0]:0,line?.speaker==='Soldier'?mouth[1]:0,.05,.2,blink(0));
    return !!line;
  }
  async function beginValley(){
    jump.reset({x:0,z:12});
    if(busy)return;session.cancelCue();owner=undefined;audio.cancel();await audio.resume();
    mode='intro';paused=false;time=0;world.champion.model.enabled=false;document.querySelector('header h1')!.textContent='The Valley of Elah';document.querySelector('header .chapter')!.textContent='Two armies. One valley. A young shepherd.';opening.setValleyCarry();element('objective').textContent='Survey the valley from the overlook';document.querySelector('.objective span')!.textContent='THE ISRAELITE APPROACH';position={x:0,z:12};velocity={x:0,z:0};heading=180;yaw=0;pitch=.29;walk=idle=stepDistance=patrolDistance=0;
    world.resetActivity();setActorPosition();clearFaces();oldDavid.copy(david.model.getPosition());oldPatrol.copy(world.patrol.model.getPosition());
    audio.sequence('intro',{soldier:world.sentinel.model.getPosition().clone().add(new Vec3(0,1.6,0)),david:new Vec3(0,world.groundHeight(0,10.8)+1.4,10.8)});
    element('entry').hidden=true;element('review-gate').hidden=true;button('sound').disabled=false;captionId='';lastShot='';controls();canvas.focus();
  }
  async function pause(value:boolean){if(mode==='entry'||mode==='complete'||paused===value)return;paused=value;velocity={x:0,z:0};controls();try{if(mode==='prologue'){if(value)await opening.pause();else await opening.resume();}else if(value)await audio.pause();else await audio.resume();soundBlocked=false;controls();if(!value)canvas.focus();}catch{paused=true;soundBlocked=true;controls();element('save-status').textContent='Sound could not resume. Select Enable sound to try again.';}}
  function survey(){if(mode==='prologue'){if(!paused&&!busy)opening.interact();return;}if(!canSurvey())return;owner=session.beginCue('valley.surveyed');mode='survey';surveyCount++;velocity={x:0,z:0};time=0;captionId='';
    audio.sequence('survey',{soldier:world.sentinel.model.getPosition().clone().add(new Vec3(0,1.6,0)),david:david.model.getPosition()});controls();}
  async function finish(){
    if(!owner||busy)return;busy=true;controls();const token=owner;
    const operation=async()=>{
      await session.finishCue(token);owner=undefined;busy=false;mode='complete';paused=true;await audio.pause();clearFaces();
      element('caption').hidden=true;element('save-error').hidden=true;element('review-gate').hidden=false;
      element('review-message').textContent=review?'Preview complete. Continue to Chapter 2 without changing your saved episode progress.':'Chapter 1 saved. Continue to the baggage camp to deliver the provisions.';
      element('save-status').textContent=review?'Review preview · Progress unchanged':'Chapter 1 checkpoint saved';controls();
    };
    retryWrite=operation;
    try{await operation();retryWrite=undefined;}catch(error){await audio.pause();paused=true;controls();element('save-error').hidden=false;element('save-error-message').textContent=error instanceof Error?error.message:'The last checkpoint is preserved.';}
  }
  const opening=await createShepherdOpening(app,world,david,input,canvas,guide,controls,()=>{void beginValley();});
  async function start(){
    if(busy||startPending)return;startPending=true;paused=true;mode='entry';input.clear();session.cancelCue();owner=undefined;audio.cancel();
    // Unlock BOTH Chapter 1 contexts in this user gesture. The automatic Elah
    // handoff must not be their first resume request. Keep preloaded sound silent.
    audio.mute(true);opening.mute(true);
    const unlocks=Promise.all([opening.resume(),audio.resume()]).then(()=>{});
    button('enter').disabled=true;controls();
    try{
      await opening.start(unlocks);await audio.pause();audio.mute(muted);opening.mute(muted);
      soundBlocked=false;mode='prologue';paused=document.hidden;time=0;document.querySelector('header h1')!.textContent='A shepherd’s calling';document.querySelector('header .chapter')!.textContent='A quiet morning. An unexpected calling.';
      element('entry').hidden=true;element('review-gate').hidden=true;button('sound').disabled=false;button('enter').textContent='Begin Chapter 1';
      if(paused)await opening.pause();else canvas.focus();
    }catch(error){
      soundBlocked=true;paused=true;await Promise.allSettled([opening.pause(),audio.pause()]);opening.mute(muted);audio.mute(muted);
      element('entry').hidden=false;element('entry-message').textContent=error instanceof Error?error.message:'Sound could not start. Select Enable sound and begin to try again.';button('enter').textContent='Enable sound and begin';button('sound').disabled=false;
    }finally{startPending=false;button('enter').disabled=false;controls();}
  }
  button('enter').addEventListener('click',()=>{void start();});button('reset').addEventListener('click',()=>{void start();});
  const playerControls=mountPlayerControls(canvas,input,value=>{void pause(value);},()=>paused);
  jump.connect(input,controls);
  input.bindActions({jump:{run:()=>{if(mode==='prologue')opening.jump();else jump.request(position);},available:()=>!paused&&!busy&&(mode==='prologue'?opening.canJump():mode==='explore'&&jump.ready(position))},interact:{run:survey,available:()=>mode==='prologue'?opening.canInteract()&&!paused&&!busy:canSurvey()},pause:{run:()=>{void pause(!paused);},available:()=>!button('pause').disabled&&!playerControls.open}});
  input.bindButton(button('survey'),'interact');input.bindButton(button('pause'),'pause');
  button('sound').addEventListener('click',()=>{if(soundBlocked){muted=false;writeEpisodeMuted(false);audio.mute(false);opening.mute(false);if(mode==='entry')void start();else void pause(false);return;}muted=!muted;writeEpisodeMuted(muted);audio.mute(muted);opening.mute(muted);setEpisodeSoundButton(button('sound'),muted);});
  button('replay').addEventListener('click',()=>location.assign('valley.html?review=1'+(inspect?'&inspect=1':'')));
  button('continue-camp').addEventListener('click',()=>location.assign('camp.html'+(review?'?review=1'+(inspect?'&inspect=1':''):inspect?'?inspect=1':'')));
  button('retry-save').addEventListener('click',()=>{if(retryWrite)void retryWrite().catch(error=>{element('save-error-message').textContent=String(error);});});
  button('reload-save').addEventListener('click',()=>location.reload());
  window.addEventListener('blur',()=>{void pause(true);});document.addEventListener('visibilitychange',()=>{if(document.hidden)void pause(true);});
  window.addEventListener('storage',event=>{if(!review&&event.key==='bible-comic.episode.local.v1'){void pause(true);busy=true;controls();element('save-error').hidden=false;element('save-error-message').textContent='Progress changed in another tab. Reload its checkpoint.';button('retry-save').hidden=true;}});
  window.addEventListener('pagehide',()=>{session.cancelCue();audio.dispose();opening.dispose();input.dispose();app.destroy();},{once:true});

  app.on('update',rawDt=>{
    const dt=Math.min(rawDt,.05);
    if(!paused&&!busy){
      idle+=dt;if(mode!=='prologue')world.stage(audio.time(),mode==='survey'||(mode==='intro'&&time>25.9&&time<28.3));
      let speaking=false;
      if(mode==='prologue'){opening.step(dt);button('survey').hidden=paused||!opening.canInteract();button('survey').textContent=opening.action();}else if(mode==='intro'){
        time=Math.min(openingDuration,audio.sequenceTime());const progress=smooth(time/5.3);const oldZ=position.z;position.z=12-1.2*progress;walk+=Math.abs(position.z-oldZ)/.93;
        const clip=time<5.3?'walk_forward':time>28.3&&time<31?'speak_resolve':'listen';
        david.pose(clip,clip==='walk_forward'?walk%david.tracks.get(clip)!.duration:Math.max(0,time-28.3)%david.tracks.get(clip)!.duration,dt);
        setActorPosition();
        if(time<32)frame(openingShot(time,world.groundHeight),dt);else follow(dt,true);
        speaking=speech('intro',time);
        const soldierSpeaking=time>=12.8&&time<17.4;
        world.sentinel.pose(soldierSpeaking?'speak_concern':'idle_relaxed',soldierSpeaking?Math.min(time-12.8,world.sentinel.tracks.get('speak_concern')!.duration):idle%world.sentinel.tracks.get('idle_relaxed')!.duration,dt);
        if(time>=openingDuration){mode='explore';element('caption').hidden=true;captionId='';clearFaces();element('save-status').textContent=review?'Chapter 1 preview · Follow the arrows to the overlook':'Reach the overlook to save Chapter 1';controls();}
      }else if(mode==='survey'){
        time=Math.min(surveyDuration,audio.sequenceTime());david.pose('listen',time%david.tracks.get('listen')!.duration,dt);
        const speakingGesture=time>=2.4&&time<7.5;
        const soldierClip=speakingGesture?'speak_concern':'idle_relaxed';
        world.sentinel.pose(soldierClip,speakingGesture?Math.min(time-2.4,world.sentinel.tracks.get(soldierClip)!.duration):time%world.sentinel.tracks.get(soldierClip)!.duration,dt);
        if(time<8)frame(surveyShot(time,world.groundHeight),dt);else follow(dt,true);
        speaking=speech('survey',time);if(time>=surveyDuration)void finish();
      }else if(mode==='explore'){
        const movement=input.read();yaw-=movement.lookX*.004;pitch=Math.max(.1,Math.min(.6,pitch+movement.lookY*.003));
        const desired={x:(movement.x*Math.cos(yaw)-movement.forward*Math.sin(yaw))*1.35,z:(-movement.x*Math.sin(yaw)-movement.forward*Math.cos(yaw))*1.35};
        velocity=approachVelocity(velocity,desired,(movement.x||movement.forward?5:8)*(jump.active()?.6:1)*dt);
        const next=slideAlongWalls(position,{x:velocity.x*dt,z:velocity.z*dt},world.walls);const distance=Math.hypot(next.x-position.x,next.z-position.z),speed=distance/Math.max(.0001,dt);position=next;walk+=distance/.93;
        if(speed>.03){const desiredHeading=Math.atan2(velocity.x,velocity.z)*180/Math.PI;heading+=(((desiredHeading-heading+540)%360)-180)*(1-Math.exp(-12*dt));}
        jump.step(dt,position);const clip=speed>.06?'walk_forward':'idle_relaxed';jump.pose(david,clip,(speed>.06?walk:idle)%david.tracks.get(clip)!.duration,dt);
        world.sentinel.pose('idle_relaxed',idle%world.sentinel.tracks.get('idle_relaxed')!.duration,dt);setActorPosition();follow(dt,true);
        button('survey').hidden=!canSurvey();button('survey').textContent='Survey the valley';element('distance').textContent=`${Math.round(Math.hypot(position.x-overlook.x,position.z-overlook.z))} m to the overlook`;
      }
      if(mode!=='prologue'){opening.updateCarry();guide.update(camera.camera!,david.model.getPosition(),guidePoint.set(overlook.x,world.groundHeight(overlook.x,overlook.z)+.6,overlook.z),'Survey the valley','E / tap Survey',mode==='explore');}
      if(!jump.active()&&mode!=='prologue')stepDistance+=oldDavid.distance(david.model.getPosition());patrolDistance+=oldPatrol.distance(world.patrol.model.getPosition());
      oldDavid.copy(david.model.getPosition());oldPatrol.copy(world.patrol.model.getPosition());
      if(stepDistance>.46){stepDistance=0;audio.footstep(oldDavid);}if(patrolDistance>.53){patrolDistance=0;audio.footstep(oldPatrol);}
      if(mode==='intro'&&time>25.9&&time<26.0)audio.gear(world.patrol.model.getPosition());
      if(mode!=='prologue')audio.update(camera.getPosition(),camera.forward,speaking);
    }
    if(inspect)canvas.dataset.valley=JSON.stringify({version:valleyPresentationVersion,prologue:opening.sample(),mode,time,paused,muted,busy,startPending,soundBlocked,position,shot,canSurvey:canSurvey(),surveyCount,jump:jump.sample(),run:session.run,review,
      audio:audio.context.state,speakers:captionId,soldiers:world.soldierCount,davidMouth:david.mouthWeights(),soldierMouth:world.sentinel.mouthWeights(),patrol:world.patrol.model.getPosition(),frameMs:app.stats.frame.ms,
      championHead:world.champion.forehead.getPosition(),championRoot:world.champion.model.getPosition()});
  });
  document.querySelector('header h1')!.textContent='A shepherd’s calling';document.querySelector('header .chapter')!.textContent='A quiet morning. An unexpected calling.';opening.preview();oldDavid.copy(david.model.getPosition());oldPatrol.copy(world.patrol.model.getPosition());
  audio.mute(muted);opening.mute(muted);setEpisodeSoundButton(button('sound'),muted);
  // Compile the actual Elah material/instancing variants before Begin. The entry
  // stays opaque and both story clocks remain suspended throughout this work.
  element('entry').style.background='#172124';element('entry').style.backdropFilter='none';
  element('entry-message').textContent='Preparing the pasture and Valley of Elah lighting…';
  await waitForFrame(app);
  const nextFrame=()=>new Promise<void>(resolve=>app.once('frameend',resolve));
  const warmStart=performance.now();
  try{
    opening.prepareValleyRender();world.stage(0,false);david.model.setPosition(0,world.groundHeight(0,10.8),10.8);
    for(const t of [0,14,35]){frame(openingShot(t,world.groundHeight),0);await nextFrame();}
  }finally{
    opening.preview();lastShot='';oldDavid.copy(david.model.getPosition());oldPatrol.copy(world.patrol.model.getPosition());
    await nextFrame();element('entry').style.background='';element('entry').style.backdropFilter='';
  }
  if(inspect)canvas.dataset.elahWarmup=JSON.stringify({milliseconds:performance.now()-warmStart,shots:3,clock:'Suspended before Begin'});
  element('entry-message').textContent='Watch David tending the flock as a messenger arrives automatically. Follow the pasture path when control returns. David then arrives at Jesse’s separate courtyard automatically; speak with him and collect the supplies. Sound starts with Begin Chapter 1. Unfinished Chapter 1 actions restart from its entry.';
  button('enter').hidden=false;
}
void main().catch(error=>{console.error(error);element('entry-message').textContent=error instanceof Error?error.message:'The valley could not load.';button('retry').hidden=false;});
button('retry').addEventListener('click',()=>location.reload());
