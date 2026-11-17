import './account-game-bootstrap';
import { mountObjectiveGuide } from './objective-guide';
import { createCharacterJump } from '../world/character-jump';
import { mountPlayerControls } from './player-controls-ui';
import { readEpisodeMuted, writeEpisodeMuted, setEpisodeSoundButton } from './episode-sound';
import {Vec3,type RenderComponent} from 'playcanvas';
import {currentObjective,episodePage,freshRun,reduceEpisode} from '../gameplay/episode-rules';
import {openEpisodeSession,type CueToken,type EpisodeSaveAdapter} from '../gameplay/episode-session';
import {createMovementInput} from '../gameplay/movement-input';
import {approachVelocity,firstWallHit,slideAlongWalls} from '../gameplay/ground-motion';
import {createWebGLApp,observeCanvas,waitForFrame} from '../world/graphics';
import {buildCampArrival,basketDrop,campVersion,deliveryMark,eliabPosition,greetingMark,keeperPosition,tableTop} from '../world/camp-arrival';
import {createCampAudio,arrivalDuration,deliveryActionStart,deliveryDuration,deliveryRelease,greetingDuration} from '../world/camp-audio';
import {campShot,type CampShot} from '../world/camp-shots';
import {createProvisionsCarry} from '../world/provisions-carry';
import {loadConversationActor} from '../world/conversation-actor';
import {mouthEnvelope} from '../world/scene-speech';
import {hairColours,hairStyles,loadSavedAppearance,skinTones,tunicColours} from '../world/david-appearance';
import davidUrl from '../assets/david-camp.glb?url';
import saulUrl from '../assets/saul.glb?url';
import './saul.css';
import './valley.css';

const el=(id:string)=>document.getElementById(id)!;
const button=(id:string)=>el(id) as HTMLButtonElement;
const canvas=el('stage') as HTMLCanvasElement,stage=canvas.parentElement!;
const input=createMovementInput(canvas,el('move-pad'));
const objectiveGuide=mountObjectiveGuide(stage,canvas),guideTarget=new Vec3();
const params=new URLSearchParams(location.search),review=params.has('review'),inspect=params.has('inspect');
const smooth=(value:number)=>{const t=Math.max(0,Math.min(1,value));return t*t*(3-2*t);};
const headingTo=(x:number,z:number)=>Math.atan2(x,z)*180/Math.PI;
window.addEventListener('pageshow',event=>{if(event.persisted)location.reload();});

async function main(){
  let temporary:Awaited<ReturnType<EpisodeSaveAdapter['read']>>={current:reduceEpisode(freshRun(),{type:'objective',id:'valley.surveyed'}),history:[]};
  const session=await openEpisodeSession(review?{async read(){return temporary;},async write(value){temporary=structuredClone(value);}}:undefined);
  if(!['provisions.delivered','brothers.met'].includes(currentObjective(session.run)?.id??'')){location.replace(episodePage(session.run));return;}
  const app=await createWebGLApp(canvas,true);observeCanvas(app,canvas);
  const [world,audio]=await Promise.all([buildCampArrival(app),createCampAudio()]);
  const david=await loadConversationActor(app,davidUrl,'David');
  const keeper=await loadConversationActor(app,saulUrl,'Baggage keeper');
  const eliab=await loadConversationActor(app,saulUrl,'Eliab');
  const appearance=loadSavedAppearance();david.tint('Skin',skinTones[appearance.skin].tint);david.tint('Cloth',tunicColours[appearance.tunic].tint);
  david.tint('Hair',hairColours[appearance.hairColour].tint);david.tint('Brows',hairColours[appearance.hairColour].tint);david.morph('FullerHair',hairStyles[appearance.hairStyle].fullness);
  for(const [actor,index]of[[keeper,0],[eliab,1]] as const){
    actor.model.setLocalScale(.95,.95,.95);actor.tint('Skin',[1,1,1]);actor.tint('Eyes',[1,1,1]);actor.tint('Cloth',index?[1.9,.7,.45]:[.85,1.05,.7]);
    for(const render of actor.model.findComponents('render') as RenderComponent[]){if(/Saul circlet|mantle|Mantle clasp/i.test(render.entity.name)||(index===1&&/Saul beard|Saul moustache/i.test(render.entity.name)))render.enabled=false;}
  }
  keeper.tint('Saul beard',[.25,.24,.21]);keeper.tint('Hair',[1.35,1.55,1.8]);
  keeper.model.setPosition(keeperPosition.x,0,keeperPosition.z);keeper.model.setEulerAngles(0,0,0);
  eliab.model.setPosition(eliabPosition.x,0,eliabPosition.z);eliab.model.setEulerAngles(0,180,0);
  const carry=createProvisionsCarry(david.model,david.tracks.get('deliver_provisions'));
  const camera=world.camera,eye=new Vec3(),focus=new Vec3(),oldFeet=new Vec3();
  let mode:'entry'|'arrival'|'explore'|'delivery'|'greeting'|'complete'='entry';
  let paused=true,muted=readEpisodeMuted(),busy=false,time=0,idle=0,walk=0,yaw=0,pitch=.28,heading=180;
  let position={x:0,z:4.6},velocity={x:0,z:0},cueFrom={...position},cueHeading=180;
  const jump=createCharacterJump(app,()=>0);jump.reset(position);
  let owner:CueToken|undefined,captionId='',shotId='',lastShot='',placed=false,setDownPlayed=false,stepDistance=0;
  let starts={delivery:0,greeting:0},retryWrite:(()=>Promise<void>)|undefined;
  const delivered=()=>session.run.completed.includes('provisions.delivered');
  const target=()=>delivered()?greetingMark:deliveryMark;
  function positionDavid(){david.model.setPosition(position.x,0+jump.sample().height,position.z);david.model.setEulerAngles(0,heading,0);world.davidContact.setPosition(position.x,.014,position.z);}
  function canInteract(){const at=target();return mode==='explore'&&!jump.active()&&!paused&&!busy&&Math.hypot(position.x-at.x,position.z-at.z)<=.8&&!firstWallHit(position,{x:at.x-position.x,z:at.z-position.z},world.walls,.08);}
  function controls(){const moving=mode==='explore'&&!paused&&!busy;input.setEnabled(moving);stage.toggleAttribute('data-moving',moving);stage.classList.toggle('cinematic',['arrival','delivery','greeting'].includes(mode));el('pause-notice').hidden=!paused||mode==='entry'||mode==='complete';
    button('pause').textContent=paused?'Resume':'Pause';button('pause').disabled=mode==='entry'||mode==='complete';button('reset').disabled=busy||mode==='entry'||mode==='complete';
    button('interact').hidden=!canInteract();button('interact').textContent=delivered()?'Greet your brothers':'Deliver provisions';world.marker.enabled=mode==='explore';if(!moving)objectiveGuide.hide();}
  function hud(){const at=target();el('objective').textContent=delivered()?'Greet your brothers near the line':'Leave the provisions with the keeper';world.marker.setPosition(at.x,.025,at.z);
    el('save-status').textContent=review?'Chapter 2 review · Saved episode unchanged':delivered()?'Delivery saved · Find your brothers':'Chapter 1 saved · Deliver the provisions';}
  function frame(value:CampShot,dt:number,blend=false){shotId=value.id;const cut=lastShot!==value.id&&!blend;lastShot=value.id;const toEye=new Vec3(...value.eye),toFocus=new Vec3(...value.focus);
    if(cut||dt===0){eye.copy(toEye);focus.copy(toFocus);}else{const factor=1-Math.exp(-5*dt);eye.lerp(eye,toEye,factor);focus.lerp(focus,toFocus,factor);}camera.setPosition(eye);camera.lookAt(focus);camera.camera!.fov=value.fov*(canvas.clientHeight>canvas.clientWidth?1.4:1);}
  function follow(dt:number,blend=true){const delta={x:Math.sin(yaw)*3.6,z:Math.cos(yaw)*3.6},hit=firstWallHit(position,delta,world.walls.slice(4),.15),distance=hit?Math.max(.75,3.6*hit.time-.04):3.6;
    frame({id:'follow',eye:[position.x+Math.sin(yaw)*distance,jump.cameraY(1.05+distance*Math.tan(pitch),position.x+Math.sin(yaw)*distance,position.z+Math.cos(yaw)*distance),position.z+Math.cos(yaw)*distance],focus:[position.x,1.08+jump.cameraFocus(),position.z-.12],fov:49},dt,blend);}
  function faces(){const line=audio.lineAt(),key=line?.id??'';
    if(captionId!==key){captionId=key;el('caption').replaceChildren();el('caption').hidden=!line;if(line){const speaker=document.createElement('strong');speaker.textContent=line.speaker;el('caption').append(speaker,document.createTextNode(line.text));}}
    const envelope=line?mouthEnvelope(line,line.local):[0,0];
    for(const [actor,name,offset]of[[david,'David',1.8],[keeper,'Baggage keeper',0],[eliab,'Eliab',3.0]] as const){const speaking=line?.speaker===name;const blink=Math.max(0,1-Math.abs(((audio.time()+offset)%4.8)-.1)/.1);actor.face(speaking?envelope[0]:0,speaking?envelope[1]:0,.13,speaking?.3:.15,blink);}
    return line;
  }
  function moveBasket(){if(placed||delivered())world.basket.setPosition(basketDrop);else{const point=carry.grip();world.basket.setPosition(point.x,point.y-.15,point.z);}world.basket.setEulerAngles(0,placed||delivered()?180:heading,0);}
  async function start(){jump.reset(position);if(busy)return;session.cancelCue();owner=undefined;audio.reset();await audio.resume();mode='arrival';paused=false;time=idle=walk=0;position={x:0,z:4.6};velocity={x:0,z:0};heading=180;yaw=0;pitch=.28;placed=delivered();setDownPlayed=false;stepDistance=0;captionId='';lastShot='';
    for(const actor of[david,keeper,eliab]){actor.pose('idle_relaxed',0,0);actor.face(0,0,0,.1,0);}positionDavid();carry.set(!delivered());moveBasket();oldFeet.copy(david.model.getPosition());el('entry').hidden=true;el('caption').hidden=true;button('sound').disabled=false;hud();controls();canvas.focus();}
  async function pause(value:boolean){if(mode==='entry'||mode==='complete'||paused===value)return;paused=value;velocity={x:0,z:0};controls();if(value)await audio.pause();else{await audio.resume();canvas.focus();}}
  function interact(){if(!canInteract())return;const kind=delivered()?'greeting':'delivery';owner=session.beginCue(kind==='delivery'?'provisions.delivered':'brothers.met');cueFrom={...position};cueHeading=heading;mode=kind;starts[kind]++;time=0;velocity={x:0,z:0};captionId='';setDownPlayed=false;
    audio.begin(kind,{David:{x:target().x,y:1.45,z:target().z},'Baggage keeper':{x:keeperPosition.x,y:1.65,z:keeperPosition.z},Eliab:{x:eliabPosition.x,y:1.65,z:eliabPosition.z}});controls();}
  async function finish(kind:'delivery'|'greeting'){
    if(!owner||busy)return;busy=true;controls();const token=owner;
    const operation=async()=>{await session.finishCue(token);owner=undefined;busy=false;el('save-error').hidden=true;audio.cancel();el('caption').hidden=true;captionId='';placed=true;moveBasket();
      if(kind==='delivery'){mode='explore';hud();controls();}else{mode='complete';paused=true;await audio.pause();el('review-gate').hidden=false;el('review-message').textContent=review?'Preview complete. Your saved episode progress is unchanged.':'Provisions delivered and brothers greeted. Continue to hear the challenge.';el('save-status').textContent=review?'Chapter 2 preview complete':'Chapter 2 checkpoint saved';controls();}};
    retryWrite=operation;try{await operation();retryWrite=undefined;}catch(error){paused=true;await audio.pause();controls();el('save-error').hidden=false;el('save-error-message').textContent=error instanceof Error?error.message:'The last checkpoint is preserved.';}
  }
  const playerControls=mountPlayerControls(canvas,input,value=>{void pause(value);},()=>paused);
  jump.connect(input,controls);
  input.bindActions({jump:{run:()=>{jump.request(position);},available:()=>mode==='explore'&&!paused&&!busy&&jump.ready(position)},interact:{run:interact,available:canInteract},pause:{run:()=>{void pause(!paused);},available:()=>!button('pause').disabled&&!playerControls.open}});
  input.bindButton(button('interact'),'interact');input.bindButton(button('pause'),'pause');
  button('enter').addEventListener('click',()=>{void start();});button('reset').addEventListener('click',()=>{void start();});
  button('sound').addEventListener('click',()=>{muted=!muted;writeEpisodeMuted(muted);audio.mute(muted);setEpisodeSoundButton(button('sound'),muted);});
  button('replay').addEventListener('click',()=>location.assign('camp.html?review=1'+(inspect?'&inspect=1':'')));
  button('continue-challenge').addEventListener('click',()=>location.assign('challenge.html'+(review?'?review=1'+(inspect?'&inspect=1':''):inspect?'?inspect=1':'')));
  button('retry-save').addEventListener('click',()=>{if(retryWrite)void retryWrite().catch(error=>{el('save-error-message').textContent=String(error);});});button('reload-save').addEventListener('click',()=>location.reload());
  window.addEventListener('blur',()=>{void pause(true);});document.addEventListener('visibilitychange',()=>{if(document.hidden)void pause(true);});
  window.addEventListener('storage',event=>{if(!review&&event.key==='bible-comic.episode.local.v1'){void pause(true);busy=true;controls();el('save-error').hidden=false;el('save-error-message').textContent='Progress changed in another tab. Reload the checkpoint.';button('retry-save').hidden=true;}});
  window.addEventListener('pagehide',()=>{session.cancelCue();input.dispose();audio.dispose();app.destroy();},{once:true});

  app.on('update',rawDt=>{
    const dt=Math.min(rawDt,.05);
    if(!paused&&!busy){
      idle+=dt;world.step(audio.time());let carrying=!delivered();
      const line=audio.lineAt();
      keeper.pose(line?.speaker==='Baggage keeper'?'speak_concern':'idle_relaxed',line?.speaker==='Baggage keeper'?Math.min(line.local,keeper.tracks.get('speak_concern')!.duration):idle%keeper.tracks.get('idle_relaxed')!.duration,dt);
      eliab.pose(line?.speaker==='Eliab'?'speak_concern':'listen',line?.speaker==='Eliab'?Math.min(line.local,eliab.tracks.get('speak_concern')!.duration):idle%eliab.tracks.get('listen')!.duration,dt);
      if(mode==='arrival'){
        time=Math.min(arrivalDuration,audio.time());const old={...position};position={x:-.25*smooth(time/6),z:4.6-.8*smooth(time/6)};walk+=Math.hypot(position.x-old.x,position.z-old.z)/.93;
        const clip=time<6?'walk_forward':'idle_relaxed';david.pose(clip,(time<6?walk:idle)%david.tracks.get(clip)!.duration,dt);positionDavid();carry.set(carrying);frame(campShot('arrival',time),dt);
        if(time>=arrivalDuration){mode='explore';follow(dt,true);controls();}
      }else if(mode==='delivery'||mode==='greeting'){
        const kind=mode;time=Math.min(kind==='delivery'?deliveryDuration:greetingDuration,audio.cueTime());const mark=kind==='delivery'?deliveryMark:greetingMark;
        const progress=smooth(time/2);const old={...position};position={x:cueFrom.x+(mark.x-cueFrom.x)*progress,z:cueFrom.z+(mark.z-cueFrom.z)*progress};heading=cueHeading+(((180-cueHeading+540)%360)-180)*progress;
        const distance=Math.hypot(position.x-old.x,position.z-old.z);walk+=distance/.93;positionDavid();
        const walking=time<2&&distance>.0001,performing=kind==='delivery'&&time>=deliveryActionStart&&time<deliveryActionStart+david.tracks.get('deliver_provisions')!.duration;
        carrying=kind==='delivery'&&time<deliveryActionStart;
        carry.set(false);
        const clip=walking?'walk_forward':performing?'deliver_provisions':line?.speaker==='David'&&!carrying?'speak_resolve':'listen';
        const poseTime=walking?walk%david.tracks.get(clip)!.duration:performing?time-deliveryActionStart:line?.speaker==='David'&&!carrying?Math.min(line.local,david.tracks.get(clip)!.duration):idle%david.tracks.get(clip)!.duration;
        david.pose(clip,poseTime,dt);carry.set(carrying);
        if(kind==='delivery'&&time>=deliveryRelease){placed=true;if(!setDownPlayed){setDownPlayed=true;audio.setDown(basketDrop);}}
        eliab.model.setEulerAngles(0,kind==='greeting'?0:180,0);
        if(time<(kind==='delivery'?28:24))frame(campShot(kind,time),dt);else follow(dt,true);
        if(time>=(kind==='delivery'?deliveryDuration:greetingDuration))void finish(kind);
      }else if(mode==='explore'){
        const movement=input.read();yaw-=movement.lookX*.004;pitch=Math.max(.1,Math.min(.6,pitch+movement.lookY*.003));
        const desired={x:(movement.x*Math.cos(yaw)-movement.forward*Math.sin(yaw))*.95,z:(-movement.x*Math.sin(yaw)-movement.forward*Math.cos(yaw))*.95};velocity=approachVelocity(velocity,desired,(movement.x||movement.forward?5:8)*(jump.active()?.6:1)*dt);
        const next=slideAlongWalls(position,{x:velocity.x*dt,z:velocity.z*dt},world.walls),distance=Math.hypot(next.x-position.x,next.z-position.z),speed=distance/Math.max(.0001,dt);position=next;walk+=distance/.93;
        if(speed>.03){const targetHeading=headingTo(velocity.x,velocity.z);heading+=(((targetHeading-heading+540)%360)-180)*(1-Math.exp(-12*dt));}
        jump.step(dt,position);const clip=speed>.06?'walk_forward':'idle_relaxed';jump.pose(david,clip,(speed>.06?walk:idle)%david.tracks.get(clip)!.duration,dt);positionDavid();carry.set(carrying);follow(dt,true);
        button('interact').hidden=!canInteract();el('distance').textContent=`${Math.round(Math.hypot(position.x-target().x,position.z-target().z))} m · Follow the arrows along the camp aisle`;
      }
      moveBasket();faces();if(!jump.active())stepDistance+=oldFeet.distance(david.model.getPosition());oldFeet.copy(david.model.getPosition());if(stepDistance>.46){stepDistance=0;audio.footstep(oldFeet);}audio.update(camera.getPosition(),camera.forward);
    }
    const route=delivered()?[[-2,1.85],[0,2.8],[1.6,1.1],[greetingMark.x,greetingMark.z]]:[[-.25,3.8],[0,2.8],[-2,2.8],[deliveryMark.x,deliveryMark.z]];
    objectiveGuide.update(camera.camera!,david.model.getPosition(),guideTarget.set(target().x,1.3,target().z),delivered()?'Your brothers':'Baggage keeper',canInteract()?'E / tap to speak':'Follow the arrows',mode==='explore'&&!paused&&!busy,route.map(([x,z])=>({x,y:0,z})));
    if(inspect)canvas.dataset.camp=JSON.stringify({version:campVersion,mode,time,paused,muted,busy,review,position,jump:jump.sample(),shot:shotId,canInteract:canInteract(),target:target(),starts,placed,carried:!placed&&!delivered(),basket:world.basket.getPosition(),tableTop,hand:carry.grip(),handGap:carry.gap(),speaker:audio.lineAt()?.speaker,davidMouth:david.mouthWeights(),keeperMouth:keeper.mouthWeights(),eliabMouth:eliab.mouthWeights(),audio:audio.context.state,run:session.run,frameMs:app.stats.frame.ms});
  });
  placed=delivered();positionDavid();carry.set(!delivered());moveBasket();oldFeet.copy(david.model.getPosition());hud();frame(campShot('arrival',0),0);audio.mute(muted);setEpisodeSoundButton(button('sound'),muted);await waitForFrame(app);
  el('entry-message').textContent=delivered()?'Your delivery is saved. Find Eliab and greet your brothers.':'Enter with sound. Leave the provisions with the baggage keeper, then find your brothers.';
  button('enter').textContent=delivered()?'Resume Chapter 2':'Begin Chapter 2';button('enter').hidden=false;
}
void main().catch(error=>{console.error(error);el('entry-message').textContent=error instanceof Error?error.message:'The camp could not load.';button('retry').hidden=false;});button('retry').addEventListener('click',()=>location.reload());
