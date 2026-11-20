import {dialogueGestureTime,smoothStoryHeading} from '../gameplay/story-motion';
import {audienceReaction} from '../gameplay/saul-audience-score';
import {createSpeechFaceMotion} from '../gameplay/speech-face-motion';
import {consumePavilionHint,navigationStorage,pavilionRoute,readPavilionHint} from '../gameplay/pavilion-route';
import {routeAllowed,storyRoutes,type StoryRouteId} from '../gameplay/story-route';
import {mountStoryDeparture} from './story-departure';
import {buildStoryRouteDressing} from '../world/story-route-dressing';
import './account-game-bootstrap';
import { mountObjectiveGuide } from './objective-guide';
import { createCharacterJump } from '../world/character-jump';
import { mountPlayerControls } from './player-controls-ui';
import { readEpisodeMuted, writeEpisodeMuted, setEpisodeSoundButton } from './episode-sound';
import {Vec3,type RenderComponent} from 'playcanvas';
import {currentObjective,episodePage,freshRun,objectives,preparation,reduceEpisode,type ObjectiveId} from '../gameplay/episode-rules';
import {openEpisodeSession,type CueToken,type EpisodeSaveAdapter} from '../gameplay/episode-session';
import {createMovementInput} from '../gameplay/movement-input';
import {approachVelocity,firstWallHit,slideAlongWalls} from '../gameplay/ground-motion';
import {createWebGLApp,observeCanvas,waitForFrame} from '../world/graphics';
import {buildPreparationWorld,audienceMark,armourMark,practiceMark,saulPosition,stonePoints,coatStand,helmetStand,preparationVersion} from '../world/preparation-world';
import {createPreparationAudio,audienceDuration,fittingDuration,declineDuration,brookDuration,pickupDuration,readyDuration} from '../world/preparation-audio';
import {preparationShot,type PreparationCue} from '../world/preparation-shots';
import type {ValleyShot} from '../world/valley-shots';
import {loadConversationActor} from '../world/conversation-actor';
import {createDavidSling} from '../world/david-sling';
import {mouthEnvelope} from '../world/scene-speech';
import {resumeChapterAudio} from '../world/chapter-audio-start';
import {hairColours,hairStyles,loadSavedAppearance,skinTones,tunicColours} from '../world/david-appearance';
import davidUrl from '../assets/david-preparation.glb?url';
import armourAnchors from '../assets/preparation-armour.json';
import saulUrl from '../assets/saul.glb?url';
import {mountSlingHelp} from './sling-controls-ui';
import {createAudiencePerformance} from '../world/audience-performance';
import './saul.css';import './valley.css';import './preparation.css';import './sling-controls.css';

const el=(id:string)=>document.getElementById(id)!;
const button=(id:string)=>el(id) as HTMLButtonElement;
const canvas=el('stage') as HTMLCanvasElement,stage=canvas.parentElement!,input=createMovementInput(canvas,el('move-pad'),true);
const objectiveGuide=mountObjectiveGuide(stage,canvas),guideTarget=new Vec3();
const params=new URLSearchParams(location.search),review=params.has('review'),inspect=params.has('inspect'),practiceReview=review&&params.has('practice'),audienceReview=review&&params.has('cinematic');
const brookRouteReview=review&&params.get('route')==='brook',battleRouteReview=review&&params.get('route')==='battle';
const requestedArrival=params.get('arrival')==='r07',hintStore=navigationStorage(),offeredArrival=requestedArrival?readPavilionHint(hintStore):undefined;
const smooth=(v:number)=>{const t=Math.max(0,Math.min(1,v));return t*t*(3-2*t);};
const turn=(a:number,b:number,t:number)=>a+(((b-a+540)%360)-180)*t;
const goals=['saul.audience','armour.inspected','armour.declined','stones.gathered','sling.practised'];
type Mode='entry'|'explore'|PreparationCue|'practice'|'departure'|'complete';
window.addEventListener('pageshow',event=>{if(event.persisted)location.reload();});

async function main(){
  let preview=freshRun();for(const goal of objectives.slice(0,battleRouteReview?10:brookRouteReview?8:practiceReview?9:5))preview=reduceEpisode(preview,{type:'objective',id:goal.id});
  // Review already derives its fixed prefix above. Only correlate the temporary
  // run ID; never copy objectives or account progress from a navigation hint.
  if(review&&!practiceReview&&!audienceReview&&offeredArrival?.review&&offeredArrival.revision===preview.revision&&offeredArrival.contentVersion===preview.contentVersion)preview.runId=offeredArrival.runId;
  let temporary:Awaited<ReturnType<EpisodeSaveAdapter['read']>>={current:preview,history:[]};
  const session=await openEpisodeSession(review?{async read(){return temporary;},async write(value){temporary=structuredClone(value);}}:undefined);
  if(!goals.includes(currentObjective(session.run)?.id??'')&&!(battleRouteReview&&routeAllowed(storyRoutes.r11,session.run))){location.replace(episodePage(session.run)+(inspect?'?inspect=1':''));return;}
  const connectedArrival=requestedArrival&&consumePavilionHint(hintStore,session.run,review);
  let autoEntry:'not_requested'|'pending'|'entered'|'tap_required'='not_requested',arrivalCover=false,revealAge=0,firstArrival=connectedArrival;
  const app=await createWebGLApp(canvas,true);observeCanvas(app,canvas);
  const [world,audio]=await Promise.all([buildPreparationWorld(app),createPreparationAudio()]);
  const david=await loadConversationActor(app,davidUrl,'David'),saul=await loadConversationActor(app,saulUrl,'Saul'),guard=await loadConversationActor(app,saulUrl,'Left pavilion guard');
  const performances=[david,saul,guard].map(createAudiencePerformance);
  const speechFace=createSpeechFaceMotion();
  const appearance=loadSavedAppearance();david.tint('Skin',skinTones[appearance.skin].tint);david.tint('Cloth',tunicColours[appearance.tunic].tint);david.tint('Hair',hairColours[appearance.hairColour].tint);david.tint('Brows',hairColours[appearance.hairColour].tint);david.morph('FullerHair',hairStyles[appearance.hairStyle].fullness);
  saul.model.setPosition(saulPosition.x,0,saulPosition.z);saul.model.setEulerAngles(0,-36,0);saul.tint('Skin',[.9,.9,.85]);saul.tint('Cloth',[2.1,.4,.32]);saul.tint('Hair',[.65,.65,.65]);saul.tint('Brows',[.65,.65,.65]);saul.tint('Eyes',[1,1,1]);world.pavilionRoot.addChild(saul.model);
  guard.model.setPosition(-2.8,0,-2.7);guard.model.setEulerAngles(0,25,0);guard.model.setLocalScale(.90,.90,.90);guard.tint('Cloth',[.95,1.05,.67]);guard.tint('Skin',[1,1,.96]);guard.tint('Eyes',[1,1,1]);
  for(const render of guard.model.findComponents('render')as RenderComponent[])if(/Saul beard|Saul moustache|Saul circlet|mantle|Mantle clasp/i.test(render.entity.name))render.enabled=false;world.pavilionRoot.addChild(guard.model);
  const renders=david.model.findComponents('render')as RenderComponent[],coatParts=renders.filter(r=>r.entity.name.startsWith('Loaned coat')),helmetParts=renders.filter(r=>r.entity.name.startsWith('Loaned helmet')),hairParts=renders.filter(r=>r.meshInstances.every(mesh=>mesh.material?.name==='Hair'));
  if(!coatParts.length||!helmetParts.length)throw new Error('David’s loaned armour is missing.');
  const sling=createDavidSling(david.model,david.model.anim!,david.tracks.get('sling_throw')),hand=david.model.findByName('hand_r')!;
  const camera=world.camera,eye=new Vec3(),focus=new Vec3(),oldFeet=new Vec3();
  let mode:Mode='entry',paused=true,muted=readEpisodeMuted(),busy=false,time=0,idle=0,walk=0,heading=180,yaw=0,pitch=.28;
  let position=currentObjective(session.run)?.id==='saul.audience'&&!audienceReview?{...pavilionRoute.arrival[0]}:{x:-.65,z:2.8},velocity={x:0,z:0},cueFrom={...position},cueHeading=180,shotId='',lastShot='',captionId='',feedback='';
  const jump=createCharacterJump(app,()=>0);jump.reset(position);
  let owner:CueToken|undefined,stoneOwner:CueToken|undefined,selected:number|undefined,retryWrite:(()=>Promise<void>)|undefined;
  let collected=new Set<number>(),wornCoat=false,wornHelmet=false,contacted=false,stepDistance=0,practiceReady=false;
  const starts={audience:0,fitting:0,decline:0,pickup:0,practice:0};let throws=0,misses=0,aimX=.5,aimY=.5,aimed=false,lastHit=-100;
  let centrePracticeAim=true;
  const help=mountSlingHelp(stage,document.querySelector('.actions')!,false,value=>{void pause(value);},()=>paused);
  let shot:{origin:number;hit:boolean;end:Vec3;release?:Vec3;impacted:boolean}|undefined;
  const foley=new Set<string>();
  const departure=mountStoryDeparture(stage,{run:()=>session.run,review,inspect,lock:()=>{input.clear();velocity={x:0,z:0};controls();},summary:()=>{void pause(true);el('review-gate').hidden=false;},localTransfer:beginBrook});
  const pathDressing=[buildStoryRouteDressing(app,world.pavilionRoot,storyRoutes.r09.departure,()=>0),buildStoryRouteDressing(app,world.brookRoot,storyRoutes.r11.departure,()=>0,true)];
  function beginDeparture(id:Extract<StoryRouteId,'r09'|'r11'>){mode='departure';input.clear();input.setAimMode(false);velocity={x:0,z:0};shot=undefined;sling.pose(undefined);world.projectile.enabled=false;yaw=storyRoutes[id].yaw;departure.start(storyRoutes[id]);el('review-gate').hidden=true;el('caption').hidden=true;hud();controls();}
  const goal=()=>currentObjective(session.run)?.id;
  const has=(id:ObjectiveId)=>session.run.completed.includes(id);
  function nearest(){let found:number|undefined,distance=Infinity;stonePoints.forEach((p,i)=>{const d=Math.hypot(position.x-p.x,position.z-p.z);if(!collected.has(i)&&d<distance){found=i;distance=d;}});return found;}
  function target(){if(mode==='departure')return departure.target()!;const id=goal();return id==='saul.audience'?audienceMark:id==='armour.inspected'||id==='armour.declined'?armourMark:id==='stones.gathered'?stonePoints[nearest()??0]:practiceMark;}
  function available(){if(arrivalCover||goal()==='stones.gathered')return false;if(jump.active())return false;if(goal()==='sling.practised'&&world.area==='brook')return mode==='explore'&&!paused&&!busy;const at=target();return mode==='explore'&&!paused&&!busy&&Math.hypot(position.x-at.x,position.z-at.z)<=(goal()==='stones.gathered'?1.0:1.4)&&!firstWallHit(position,{x:at.x-position.x,z:at.z-position.z},world.walls,.08);}
  function placeDavid(){david.model.setPosition(position.x,jump.sample().height,position.z);david.model.setEulerAngles(0,heading,0);}
  function palmPosition(){const point=new Vec3();hand.getWorldTransform().transformPoint(new Vec3(0,.07,.025),point);return point;}
  function wardrobe(coat:boolean,helmet:boolean){wornCoat=coat;wornHelmet=helmet;coatParts.forEach(r=>r.enabled=coat);helmetParts.forEach(r=>r.enabled=helmet);hairParts.forEach(r=>r.enabled=!helmet);}
  function equip(){
    const worn=has('armour.inspected')&&!has('armour.declined');let coat=worn,helmet=worn;world.coatProp.enabled=!worn;world.helmetProp.enabled=!worn;world.coatProp.setPosition(coatStand);world.helmetProp.setPosition(helmetStand);world.coatProp.setEulerAngles(0,0,0);world.helmetProp.setEulerAngles(0,0,0);
    const chest=new Vec3(),head=new Vec3();david.model.findByName('spine_03')!.getWorldTransform().transformPoint(new Vec3(...armourAnchors.coat as [number,number,number]),chest);david.model.findByName('Head')!.getWorldTransform().transformPoint(new Vec3(...armourAnchors.helmet as [number,number,number]),head);
    function transfer(node:typeof world.coatProp,from:Vec3,to:Vec3,progress:number,fromYaw:number,toYaw:number){node.setPosition(new Vec3().lerp(from,to,smooth(progress)));node.setEulerAngles(0,turn(fromYaw,toYaw,smooth(progress)),0);}
    if(mode==='fitting'){coat=time>=5.5;helmet=time>=7.8;world.coatProp.enabled=!coat;world.helmetProp.enabled=!helmet;transfer(world.coatProp,coatStand,chest,(time-4)/1.5,0,heading);transfer(world.helmetProp,helmetStand,head,(time-6)/1.8,0,heading);}
    if(mode==='decline'){coat=time<8;helmet=time<5.25;world.coatProp.enabled=!coat;world.helmetProp.enabled=!helmet;transfer(world.helmetProp,head,helmetStand,(time-5.25)/3,heading,0);transfer(world.coatProp,chest,coatStand,(time-8)/3,heading,0);}
    wardrobe(coat,helmet);
  }
  function hud(){const id=goal(),at=target();el('area-label').textContent=world.area==='pavilion'?"SAUL’S PAVILION":'THE BROOK OF ELAH';el('objective').textContent=id==='saul.audience'?(position.z>2.5?'Follow the path into Saul’s pavilion':'Speak to Saul'):id==='armour.inspected'?'Try Saul’s armour':id==='armour.declined'?'Set aside the unfamiliar armour':id==='stones.gathered'?`Gather smooth stones · ${collected.size}/5`:'Start sling practice';world.marker.setPosition(at.x,.028,at.z);
    button('interact').textContent=id==='saul.audience'?'Speak to Saul':id==='armour.inspected'?'Try the armour':id==='armour.declined'?'Set aside the armour':id==='stones.gathered'?`Walk to the stones · Automatic pickup`:'Start sling practice';
    el('save-status').textContent=review?'Chapter 4 review · Saved episode unchanged':id==='stones.gathered'?'Armour set aside · All five stones save together':`Preparation · ${Math.min(5,session.run.completed.length-4)} of 5`;if(mode==='departure'){const route=departure.sample()!.id as 'r09'|'r11';el('objective').textContent=storyRoutes[route].title;}}
  function controls(){
    const move=(mode==='explore'||mode==='departure'&&departure.walking())&&!paused&&!busy&&!arrivalCover,practiceLive=mode==='practice'&&practiceReady&&!paused&&!busy;
    input.setEnabled(move||practiceLive);input.setAimMode(practiceLive);
    stage.toggleAttribute('data-moving',move||practiceLive);stage.toggleAttribute('data-aiming',practiceLive);stage.toggleAttribute('data-practice',mode==='practice');
    stage.classList.toggle('cinematic',['audience','fitting','decline','brook','pickup','ready'].includes(mode));el('pause-notice').hidden=!paused||mode==='entry'||mode==='complete';
    button('pause').textContent=paused?'Resume':'Pause';button('pause').disabled=busy||mode==='entry'||mode==='complete';button('reset').disabled=busy||mode==='entry'||mode==='complete';help.button.disabled=busy||mode==='entry'||mode==='complete';
    if(departure.covered())button('reset').disabled=true;
    const keyboard=el('instructions').querySelector('.keyboard-hint')!,touch=el('instructions').querySelector('.touch-hint')!;keyboard.textContent=mode==='practice'?'Move: WASD · Aim: mouse · Throw: click / F':'WASD / arrows · Drag to look · E to interact';touch.textContent=mode==='practice'?'Move: left controls · Aim: drag · Tap Throw':'Left controls to move · Drag to look · Tap to interact';
    if(mode==='pickup'){keyboard.textContent=touch.textContent='David collects all five stones automatically · Pause any time';}
    if(mode==='audience'){keyboard.textContent=touch.textContent='Watch David and Saul · Pause any time';}if(mode==='fitting'||mode==='decline'||mode==='brook'||mode==='ready'||departure.covered())keyboard.textContent=touch.textContent='Watch the scene · Pause any time';
    button('interact').hidden=!available();button('throw').hidden=mode!=='practice'||paused||busy;button('throw').disabled=!practiceReady||!!shot||jump.active();
    button('leave-practice').hidden=mode!=='practice'||paused||busy;el('practice-help').hidden=mode!=='practice'||paused;el('reticle').hidden=mode!=='practice'||paused||busy;world.marker.enabled=mode==='explore';if(!move)objectiveGuide.hide();world.slingRoot.enabled=mode==='practice';
  }
  function frame(value:ValleyShot,dt:number,blend=false){shotId=value.id;const cut=lastShot!==value.id&&!blend;lastShot=value.id;const toEye=new Vec3(...value.eye),toFocus=new Vec3(...value.focus);if(cut||dt===0){eye.copy(toEye);focus.copy(toFocus);}else{const factor=1-Math.exp(-5*dt);eye.lerp(eye,toEye,factor);focus.lerp(focus,toFocus,factor);}camera.setPosition(eye);camera.lookAt(focus);camera.camera!.fov=value.fov*(canvas.clientHeight>canvas.clientWidth?1.4:1);}
  function follow(dt:number,blend=true){const delta={x:Math.sin(yaw)*3.6,z:Math.cos(yaw)*3.6},hit=firstWallHit(position,delta,world.walls.slice(4),.14),distance=hit?Math.max(.8,3.6*hit.time-.05):3.6;frame({id:'follow',eye:[position.x+Math.sin(yaw)*distance,jump.cameraY(1.05+distance*Math.tan(pitch),position.x+Math.sin(yaw)*distance,position.z+Math.cos(yaw)*distance),position.z+Math.cos(yaw)*distance],focus:[position.x,1.08+jump.cameraFocus(),position.z-.12],fov:49},dt,blend);}
  function faces(){const line=audio.lineAt(),key=line?.id??(feedback?'feedback':'');if(captionId!==key){captionId=key;el('caption').replaceChildren();el('caption').hidden=!line&&!feedback;if(line){const speaker=document.createElement('strong');speaker.textContent=line.speaker;el('caption').append(speaker,document.createTextNode(line.text));}else if(feedback)el('caption').textContent=feedback;}
    const envelope=line?mouthEnvelope(line,line.local):[0,0],mouth=mode==='audience'?speechFace.step(envelope,audio.context.currentTime):envelope,reaction=audienceReaction(time,audio.audienceScore);for(const [actor,name,offset]of[[david,'David',1.6],[saul,'Saul',0],[guard,'Guard',2.8]]as const){const speaking=line?.speaker===name,blink=Math.max(0,1-Math.abs(((audio.time()+offset)%4.7)-.1)/.1);const smile=mode==='audience'?(name==='Saul'?reaction.saulSmile:reaction.davidSmile):.035,brow=mode==='audience'?(name==='Saul'?reaction.saulBrow:reaction.davidBrow):speaking?.27:.12;actor.face(speaking?mouth[0]:0,speaking?mouth[1]:0,smile,brow,blink);}}
  function speakers(){return{David:david.model.getPosition().clone().add(new Vec3(0,1.45,0)),Saul:saul.model.getPosition().clone().add(new Vec3(0,1.7,0))};}
  function beginBrook(){world.activate('brook');audio.setBrook(true);position={x:goal()==='sling.practised'?0:-4.3,z:3.7};jump.reset(position);heading=180;yaw=0;pitch=.28;placeDavid();cueFrom={...position};mode='brook';time=0;audio.begin('brook',speakers());el('transition').style.opacity='1';hud();controls();}
  async function start(){const restartBrook=brookRouteReview||mode==='departure'&&departure.sample()?.id==='r09';performances.forEach(performance=>performance.restore());jump.reset(position);if(busy)return;session.cancelCue();input.clear();input.setAimMode(false);owner=stoneOwner=undefined;selected=undefined;shot=undefined;sling.pose(undefined);world.projectile.enabled=false;audio.reset();speechFace.reset(audio.context.currentTime);await resumeChapterAudio(audio.context);paused=false;time=idle=walk=0;velocity={x:0,z:0};heading=180;yaw=0;pitch=.28;captionId=lastShot=feedback='';stepDistance=0;foley.clear();collected=new Set(has('stones.gathered')?[0,1,2,3,4]:[]);world.stones.forEach((node,i)=>{node.setPosition(stonePoints[i].x,.023,stonePoints[i].z);node.enabled=!collected.has(i);});
    departure.stop();for(const actor of[david,saul,guard]){actor.pose('idle_relaxed',0,0);actor.face(0,0,0,.1,0);}if(routeAllowed(storyRoutes.r11,session.run)||restartBrook){const next=restartBrook?'r09':'r11';world.activate(next==='r09'?'pavilion':'brook');audio.setBrook(next==='r11');position={...(next==='r09'?armourMark:practiceMark)};jump.reset(position);placeDavid();beginDeparture(next);follow(0);}else if(has('armour.declined')&&!practiceReview)beginBrook();else{world.activate(practiceReview?'brook':'pavilion');audio.setBrook(practiceReview);position=practiceReview?{...practiceMark}:has('armour.inspected')?{...armourMark}:has('saul.audience')?{...audienceMark}:audienceReview?{x:-.65,z:2.8}:{...pavilionRoute.arrival[0]};mode='explore';placeDavid();hud();controls();follow(0);}
    arrivalCover=firstArrival&&goal()==='saul.audience';firstArrival=false;revealAge=0;if(arrivalCover)el('transition').style.opacity='1';else if(mode!=='brook')el('transition').style.opacity='0';controls();equip();oldFeet.copy(david.model.getPosition());el('entry').hidden=true;el('review-gate').hidden=true;el('caption').hidden=true;button('sound').disabled=false;canvas.focus();if(practiceReview)interact();else if(audienceReview&&!has('saul.audience'))beginCue('audience');}
  async function pause(value:boolean){if(busy||mode==='entry'||mode==='complete'||paused===value)return;paused=value;velocity={x:0,z:0};controls();if(value)await audio.pause();else{await audio.resume();canvas.focus();}}
  let starting=false;
  async function startFromGesture(){if(starting||busy)return;starting=true;paused=true;controls();button('enter').disabled=true;try{await start();if(connectedArrival)autoEntry='entered';}catch(error){mode='entry';paused=true;el('entry').hidden=false;el('entry-message').textContent=error instanceof Error?error.message:'The pavilion could not start. Tap to try again.';button('enter').hidden=false;button('enter').textContent='Enter the pavilion';controls();}finally{starting=false;button('enter').disabled=false;}}
  async function save(token:CueToken,done:()=>void){if(busy)return;busy=true;controls();const operation=async()=>{await session.finishCue(token);owner=stoneOwner=undefined;busy=false;paused=document.hidden;el('save-error').hidden=true;audio.cancel();feedback='';captionId='';el('caption').hidden=true;if(!paused)await audio.resume();done();hud();controls();};retryWrite=operation;try{await operation();retryWrite=undefined;}catch(error){paused=true;await audio.pause();controls();el('save-error').hidden=false;el('save-error-message').textContent=error instanceof Error?error.message:'The last checkpoint is preserved.';}}
  function beginCue(kind:'audience'|'fitting'|'decline'){speechFace.reset(audio.context.currentTime);owner=session.beginCue(goal()!);mode=kind;starts[kind]++;cueFrom={...position};cueHeading=heading;time=0;velocity={x:0,z:0};feedback='';audio.begin(kind,speakers());foley.clear();controls();}
  function beginStonePickup(index:number){velocity={x:0,z:0};stoneOwner??=session.beginCue('stones.gathered');selected=index;mode='pickup';starts.pickup++;cueFrom={...position};cueHeading=heading;time=0;contacted=false;feedback='';audio.begin(collected.size===0?'first':collected.size===4?'fifth':'pickup',speakers());controls();}
  function interact(){if(!available())return;const id=goal();if(id==='saul.audience'){beginCue('audience');return;}if(id==='armour.inspected'){beginCue('fitting');return;}if(id==='armour.declined'){beginCue('decline');return;}
    owner=session.beginCue('sling.practised');mode='practice';starts.practice++;time=0;cueFrom={...position};cueHeading=heading;practiceReady=false;centrePracticeAim=true;aimX=aimY=.5;shot=undefined;feedback='';captionId='';audio.begin('pickup',speakers());controls();}
  function aimPoint(){const ray=new Vec3();camera.camera!.screenToWorld(aimX*canvas.clientWidth,aimY*canvas.clientHeight,1,ray,canvas.clientWidth,canvas.clientHeight);ray.sub(camera.getPosition());const ratio=(world.targetCentre.z-camera.getPosition().z)/ray.z;return ray.mulScalar(Math.max(0,ratio)).add(camera.getPosition());}
  function throwStone(){if(mode!=='practice'||!practiceReady||paused||busy||shot||jump.active())return;const pointer=input.pointerAim();if(pointer){aimX=pointer.x;aimY=pointer.y;}const end=aimPoint();shot={origin:audio.time(),hit:Math.hypot(end.x-world.targetCentre.x,end.y-world.targetCentre.y)<=.44,end,impacted:false};throws++;feedback='';captionId='';controls();}
  const playerControls=mountPlayerControls(canvas,input,value=>{void pause(value);},()=>paused);
  jump.connect(input,controls);
  input.bindActions({jump:{run:()=>{jump.request(position);},available:()=>!arrivalCover&&!paused&&!busy&&(mode==='explore'||mode==='departure'&&departure.walking()||mode==='practice'&&practiceReady&&!shot)&&jump.ready(position)},interact:{run:interact,available},sling:{run:throwStone,available:()=>mode==='practice'&&practiceReady&&!paused&&!busy&&!shot&&!jump.active()},pause:{run:()=>{void pause(!paused);},available:()=>!button('pause').disabled&&!help.open&&!playerControls.open}});
  input.bindButton(button('interact'),'interact');input.bindButton(button('throw'),'sling');input.bindButton(button('pause'),'pause');
  button('enter').addEventListener('click',()=>{void startFromGesture();});button('reset').addEventListener('click',()=>{void startFromGesture();});
  button('leave-practice').addEventListener('click',()=>{if(mode!=='practice'||busy)return;session.cancelCue();owner=undefined;audio.cancel();shot=undefined;world.projectile.enabled=false;sling.pose(undefined);mode='explore';feedback='';captionId='';hud();controls();follow(0);canvas.focus();});
  button('sound').addEventListener('click',()=>{muted=!muted;writeEpisodeMuted(muted);audio.mute(muted);setEpisodeSoundButton(button('sound'),muted);});button('face-goliath').textContent='Back to the path';button('face-goliath').addEventListener('click',()=>{el('review-gate').hidden=true;void pause(false);});button('replay').addEventListener('click',()=>location.assign('preparation.html?review=1'+(practiceReview?'&practice=1':audienceReview?'&cinematic=1':'')+(inspect?'&inspect=1':'')));
  button('retry-save').addEventListener('click',()=>{if(retryWrite)void retryWrite().catch(error=>{el('save-error-message').textContent=String(error);});});button('reload-save').addEventListener('click',()=>location.reload());
  window.addEventListener('blur',()=>{void pause(true);});document.addEventListener('visibilitychange',()=>{if(document.hidden)void pause(true);});window.addEventListener('storage',event=>{if(!review&&event.key==='bible-comic.episode.local.v1'){void pause(true);busy=true;controls();el('save-error').hidden=false;el('save-error-message').textContent='Progress changed in another tab. Reload the checkpoint.';button('retry-save').hidden=true;}});
  window.addEventListener('pagehide',()=>{session.cancelCue();departure.dispose();pathDressing.forEach(item=>item.dispose());input.dispose();audio.dispose();app.destroy();},{once:true});

  app.on('update',rawDt=>{
    const dt=Math.min(rawDt,.05);
    if(!paused&&!busy){
      performances.forEach(performance=>performance.restore());
      if(arrivalCover){revealAge+=dt;el('transition').style.opacity=String(1-smooth(revealAge/.45));if(revealAge>=.45){arrivalCover=false;controls();}}idle+=dt;world.step(audio.time());if(mode!=='explore'&&mode!=='entry'&&mode!=='complete'&&mode!=='departure')time=audio.cueTime();const line=audio.lineAt();
      const saulClip=line?.speaker==='Saul'?(line.id==='saul-blessing'||line.id==='saul-release'?'acknowledge':'speak_concern'):'listen';saul.pose(saulClip,line?.speaker==='Saul'?dialogueGestureTime(line.local,line.duration,saul.tracks.get(saulClip)!.duration):idle%saul.tracks.get(saulClip)!.duration,dt);
      const guardClip=mode==='audience'&&time>=audio.audienceScore.guardStart&&time<audio.audienceScore.guardEnd?'acknowledge':'idle_relaxed';guard.pose(guardClip,guardClip==='acknowledge'?time-audio.audienceScore.guardStart:idle%guard.tracks.get(guardClip)!.duration,dt);
      if(mode==='audience'||mode==='fitting'||mode==='decline'){
        const kind=mode,mark=kind==='audience'?audienceMark:armourMark,progress=smooth(time/1.6),previous={...position};position={x:cueFrom.x+(mark.x-cueFrom.x)*progress,z:cueFrom.z+(mark.z-cueFrom.z)*progress};const face=kind==='audience'?144:133;heading=turn(cueHeading,face,progress);
        const trial=kind==='fitting'&&time>=8.5&&time<12.5;if(trial){const p=(time-8.5)/4;position.z=armourMark.z+.7*Math.sin(Math.PI*p);heading=turn(133,p<.5?0:180,smooth(Math.min(1,p*3)));}
        const distance=Math.hypot(position.x-previous.x,position.z-previous.z);walk+=distance/.93;const approaching=time<1.6&&distance>.0001;
        let clip=approaching?'walk_forward':trial?'armour_walk':kind==='fitting'&&time>=2&&time<8?'don_armour':kind==='decline'&&time>=4&&time<10?'remove_armour':line?.speaker==='David'?'speak_resolve':kind==='audience'&&time>=audio.audienceScore.acknowledgeStart&&time<audio.audienceScore.acknowledgeEnd?'acknowledge':'listen';
        const at=approaching||trial?walk%david.tracks.get(clip)!.duration:clip==='don_armour'?time-2:clip==='remove_armour'?time-4:line?.speaker==='David'?(kind==='audience'?dialogueGestureTime(line.local,line.duration,david.tracks.get(clip)!.duration):Math.min(line.local,david.tracks.get(clip)!.duration)):clip==='acknowledge'?time-audio.audienceScore.acknowledgeStart:idle%david.tracks.get(clip)!.duration;
        if(approaching&&kind==='audience')david.locomote(distance/Math.max(dt,.0001),dt);else david.pose(clip,at,dt);placeDavid();if(time<(kind==='audience'?audio.audienceScore.acknowledgeEnd+.6:kind==='fitting'?16:14))frame(preparationShot(kind,time,position,audio.audienceScore),dt);else follow(dt,true);
        const beats=kind==='fitting'?[5.5,7.8]:kind==='decline'?[5.25,8]:[];for(const beat of beats)if(time>=beat&&!foley.has(String(beat))){foley.add(String(beat));audio.equipment(david.model.getPosition());}
        if(time>=(kind==='audience'?audienceDuration:kind==='fitting'?fittingDuration:declineDuration)&&owner){const token=owner;void save(token,()=>{if(kind==='decline')beginDeparture('r09');else{mode='explore';controls();}});}
      }else if(mode==='brook'){
        position={x:cueFrom.x,z:cueFrom.z};david.pose('listen',idle%david.tracks.get('listen')!.duration,dt);placeDavid();if(time>brookDuration-.8)follow(dt,true);else frame(preparationShot('brook',time,position),dt);el('transition').style.opacity=String(1-smooth(time/1.3));if(time>=brookDuration){mode='explore';el('transition').style.opacity='0';audio.cancel();controls();hud();}
      }else if(mode==='pickup'&&selected!==undefined){
        const index=selected,point=stonePoints[index],mark={x:point.x-.132826,z:point.z+.282915},progress=smooth(time/1.2),previous={...position};position={x:cueFrom.x+(mark.x-cueFrom.x)*progress,z:cueFrom.z+(mark.z-cueFrom.z)*progress};heading=turn(cueHeading,180,progress);walk+=Math.hypot(position.x-previous.x,position.z-previous.z)/.93;const clip=time<1.2?'walk_forward':'gather_stone';david.pose(clip,time<1.2?walk%david.tracks.get(clip)!.duration:Math.min(time-1.2,david.tracks.get(clip)!.duration),time<1.2?dt:0);placeDavid();if(collected.size===4&&time>pickupDuration-.8)follow(dt,true);else frame(preparationShot('pickup',time,position),dt);
        if(time>=1.2+32/24){if(!contacted){contacted=true;audio.setDown(world.stones[index].getPosition());}if(time<4.2)world.stones[index].setPosition(palmPosition());else world.stones[index].enabled=false;}
        if(time>=pickupDuration){collected.add(index);world.stones[index].enabled=false;selected=undefined;if(collected.size===5&&stoneOwner){const token=stoneOwner;void save(token,()=>{mode='explore';controls();});}else{audio.cancel();captionId='';feedback='';beginStonePickup(nearest()!);hud();controls();}}
      }else if(mode==='practice'){
        let movingSpeed=0;
        if(!practiceReady){
          const p=smooth(time/1.2),previous={...position};position={x:cueFrom.x+(practiceMark.x-cueFrom.x)*p,z:cueFrom.z+(practiceMark.z-cueFrom.z)*p};heading=turn(cueHeading,180,p);walk+=Math.hypot(position.x-previous.x,position.z-previous.z)/.93;david.pose('walk_forward',walk%david.tracks.get('walk_forward')!.duration,dt);placeDavid();
          if(time>=1.2){practiceReady=true;controls();}
        }
        const movement=input.read();
        if(practiceReady){
          const angle=Math.atan2(position.x-world.targetCentre.x,position.z-world.targetCentre.z),c=Math.cos(angle),s=Math.sin(angle);
          const desired={x:(movement.x*c-movement.forward*s)*2.1,z:(-movement.x*s-movement.forward*c)*2.1};
          velocity=approachVelocity(velocity,desired,(movement.x||movement.forward?12:16)*(jump.active()?.6:1)*dt);
          const next=slideAlongWalls(position,{x:velocity.x*dt,z:velocity.z*dt},world.walls);next.x=Math.max(-3.8,Math.min(3.8,next.x));next.z=Math.max(.35,Math.min(3.65,next.z));
          const distance=Math.hypot(next.x-position.x,next.z-position.z);movingSpeed=distance/Math.max(dt,.001);position=next;walk+=distance/.93;heading=turn(heading,angle*180/Math.PI+180,1-Math.exp(-14*dt));
          jump.step(dt,position);const clip=movingSpeed>.04?'walk_forward':'idle_relaxed';jump.pose(david,clip,(movingSpeed>.04?walk:idle)%david.tracks.get(clip)!.duration,dt,movingSpeed);placeDavid();
        }
        const portrait=canvas.clientHeight>canvas.clientWidth,practiceArm=portrait?4.7:4.0;
        frame({id:'practice-aim',eye:[position.x+.65,jump.cameraY(2.05,position.x+.65,position.z+practiceArm),position.z+practiceArm],focus:[world.targetCentre.x,.98+jump.cameraFocus()*.25,world.targetCentre.z],fov:52},dt,true);camera.camera!.fov=52;
        if(centrePracticeAim&&practiceReady){const screen=camera.camera!.worldToScreen(world.targetCentre);aimX=screen.x/canvas.clientWidth;aimY=screen.y/canvas.clientHeight;centrePracticeAim=false;}
        if(practiceReady){if(movement.mouseAim){aimX=movement.mouseAim.x;aimY=movement.mouseAim.y;}aimX=Math.max(.05,Math.min(.95,aimX+movement.lookX/canvas.clientWidth+movement.aimX*.56*dt));aimY=Math.max(.06,Math.min(.92,aimY+movement.lookY/canvas.clientHeight+movement.aimY*.56*dt));}
        const point=aimPoint();aimed=Math.hypot(point.x-world.targetCentre.x,point.y-world.targetCentre.y)<=.44;el('reticle').style.left=`${aimX*100}%`;el('reticle').style.top=`${aimY*100}%`;el('reticle').toggleAttribute('data-aimed',aimed);
        const status=!practiceReady?'Getting ready…':shot?(audio.time()-shot.origin<13/24?'Winding the sling — keep moving':'Stone away — keep moving'):feedback|| (aimed?'On target — Throw when ready':'Aim at the red centre of the target');if(el('practice-status').textContent!==status)el('practice-status').textContent=status;
        if(movement.fire)throwStone();
        const age=shot?audio.time()-shot.origin:0;sling.pose(shot?Math.min(.94,age):undefined);const slingAt=sling.position(Math.min(13/24,age));world.drawSling(slingAt.grip,slingAt.pouch);
        if(shot){if(age>=13/24){if(!shot.release){sling.pose(13/24);shot.release=sling.position(13/24).pouch.clone();sling.pose(Math.min(.94,age));}const p=Math.min(1,(age-13/24)/.45),at=new Vec3().lerp(shot.release,shot.end,p);at.y+=Math.sin(p*Math.PI)*.24;world.projectile.enabled=true;world.projectile.setPosition(at);if(p===1&&!shot.impacted){shot.impacted=true;audio.setDown(shot.end);if(shot.hit)lastHit=audio.time();}}
          if(age>=1.3){if(shot.hit){shot=undefined;world.projectile.enabled=false;sling.pose(undefined);mode='ready';time=0;feedback='';audio.begin('ready',speakers());controls();}else{misses++;shot=undefined;world.projectile.enabled=false;sling.pose(undefined);feedback='Missed. Aim at the red centre and throw again.';captionId='';controls();}}}
      }else if(mode==='ready'){
        const clip=line?.speaker==='David'?'speak_resolve':'acknowledge';david.pose(clip,line?.speaker==='David'?Math.min(line.local,david.tracks.get(clip)!.duration):Math.min(time,david.tracks.get(clip)!.duration),dt);frame(preparationShot('ready',time,position),dt);
        if(time>=readyDuration&&owner){const token=owner;void save(token,()=>{el('review-message').textContent=review?'Preparation review complete. Your saved episode is unchanged.':'Preparation saved: armour declined, five stones gathered and sling practice complete.';beginDeparture('r11');});}
      }else if(mode==='explore'||mode==='departure'&&departure.walking()){
        const movement=input.read();yaw-=movement.lookX*.004;pitch=Math.max(.1,Math.min(.6,pitch+movement.lookY*.003));const desired={x:(movement.x*Math.cos(yaw)-movement.forward*Math.sin(yaw))*(world.area==='brook'?.90:1.35),z:(-movement.x*Math.sin(yaw)-movement.forward*Math.cos(yaw))*(world.area==='brook'?.90:1.35)};velocity=approachVelocity(velocity,desired,(movement.x||movement.forward?5:8)*(jump.active()?.6:1)*dt);const next=slideAlongWalls(position,{x:velocity.x*dt,z:velocity.z*dt},world.walls),distance=Math.hypot(next.x-position.x,next.z-position.z),speed=distance/Math.max(.0001,dt);position=next;walk+=distance/.93;if(speed>.03)heading=smoothStoryHeading(heading,Math.atan2(velocity.x,velocity.z)*180/Math.PI,dt);jump.step(dt,position);const clip=speed>.06?'walk_forward':'idle_relaxed';jump.pose(david,clip,(speed>.06?walk:idle)%david.tracks.get(clip)!.duration,dt,speed);placeDavid();follow(dt,true);hud();button('interact').hidden=!available();el('distance').textContent=goal()==='sling.practised'?'Ready — select Start sling practice':`${Math.round(Math.hypot(position.x-target().x,position.z-target().z))} m · Follow the arrows`;
      }
      if(mode==='explore'&&goal()==='stones.gathered'&&!jump.active()&&Math.hypot(position.x-target().x,position.z-target().z)<=.85){beginStonePickup(nearest()!);}
      if(mode==='departure'){const previousPhase=departure.sample()?.phase;departure.step(dt,position,!jump.active());if(previousPhase!==departure.sample()?.phase)controls();}
      if(mode==='audience'){
        const reaction=audienceReaction(time,audio.audienceScore);
        performances[0]!.apply(time,line?.speaker==='David',reaction.davidNod,1.6);
        performances[1]!.apply(time,line?.speaker==='Saul',reaction.saulNod,.2);
        performances[2]!.apply(time,false,reaction.guardNod,2.8);
      }
      equip();faces();const hitAge=audio.time()-lastHit;world.target.setLocalEulerAngles(90+(hitAge<.5?Math.sin(hitAge*25)*(1-hitAge/.5)*6:0),0,0);if(!jump.active())stepDistance+=oldFeet.distance(david.model.getPosition());oldFeet.copy(david.model.getPosition());if(stepDistance>.46){stepDistance=0;audio.footstep(oldFeet);}audio.update(camera.getPosition(),camera.forward);
    }
    const at=target(),route=mode==='departure'?departure.path()!.map(p=>[p.x,p.z]):goal()==='stones.gathered'?[[-4.3,3.7],[-3.0,2.5],[-2.7,1.0],[at.x,at.z]]:goal()==='sling.practised'?[[2.05,.45],[0,1.55]]:goal()==='saul.audience'?pavilionRoute.arrival.map(p=>[p.x,p.z]):[[position.x,position.z],[at.x,at.z]];
    objectiveGuide.update(camera.camera!,david.model.getPosition(),guideTarget.set(at.x,.7,at.z),mode==='departure'?(departure.sample()!.id==='r09'?'Brook path':'Battlefield'):goal()==='stones.gathered'?'Five smooth stones':goal()==='sling.practised'?'Sling practice':'Preparation',mode!=='departure'&&goal()==='stones.gathered'?'Walk here · David collects automatically':'Follow the arrows',(mode==='explore'||mode==='departure'&&departure.walking())&&!paused&&!busy&&!arrivalCover,route.map(([x,z])=>({x,y:0,z})));
    if(inspect){const screen=camera.camera!.worldToScreen(world.targetCentre);canvas.dataset.preparation=JSON.stringify({version:preparationVersion,mode,area:world.area,route:departure.sample(),jump:jump.sample(),time,paused,muted,busy,review,position,heading,yaw,arrival:{route:connectedArrival?'r07':null,autoEntry,cover:arrivalCover,revealAge,path:pavilionRoute.arrival},shot:shotId,objective:goal(),canInteract:available(),target:target(),starts,collected:[...collected],selected,contacted,animation:{state:david.model.anim!.baseLayer!.activeState,time:david.model.anim!.baseLayer!.activeStateCurrentTime},hand:hand.getPosition(),palm:palmPosition(),stones:world.stones.map(node=>({enabled:node.enabled,position:node.getPosition()})),wornCoat,wornHelmet,coatProp:world.coatProp.enabled,helmetProp:world.helmetProp.enabled,practiceReady,throws,misses,aimX,aimY,aimed,projectile:world.projectile.enabled,flight:shot?{age:audio.time()-shot.origin,hit:shot.hit,end:shot.end}:undefined,targetScreen:{x:screen.x/canvas.clientWidth,y:screen.y/canvas.clientHeight},davidMouth:david.mouthWeights(),saulMouth:saul.mouthWeights(),speaker:audio.lineAt()?.speaker,audio:audio.context.state,inventory:preparation(session.run),run:session.run,frameMs:app.stats.frame.ms});}
  });
  collected=new Set(has('stones.gathered')?[0,1,2,3,4]:[]);world.stones.forEach((node,i)=>node.enabled=!collected.has(i));if(brookRouteReview){world.activate('pavilion');position={...armourMark};}else if(has('armour.declined')){world.activate('brook');audio.setBrook(true);position={x:-4.3,z:3.7};}else if(has('armour.inspected'))position={...armourMark};placeDavid();equip();oldFeet.copy(david.model.getPosition());hud();follow(0);audio.mute(muted);setEpisodeSoundButton(button('sound'),muted);
  el('entry').style.background='#172124';el('entry').style.backdropFilter='none';el('entry-message').textContent='Preparing the pavilion and brook...';
  await waitForFrame(app);
  const preparationStart=performance.now();
  // Pavilion and brook have different light/material variants. Prepare the
  // destination while audio and objectives are still suspended before Begin.
  if(world.area==='pavilion'){
    const nextFrame=()=>new Promise<void>(resolve=>app.once('frameend',resolve));
    try{
      world.activate('brook');david.model.setPosition(practiceMark.x,0,practiceMark.z);
      frame(preparationShot('brook',0,position),0);await nextFrame();
      frame(preparationShot('ready',0,position),0);await nextFrame();
    }finally{world.activate('pavilion');placeDavid();lastShot='';follow(0);await nextFrame();}
  }
  el('entry').style.background='';el('entry').style.backdropFilter='';
  if(inspect)canvas.dataset.preparationWarmup=JSON.stringify({milliseconds:performance.now()-preparationStart,clock:'Suspended before Begin'});
  el('entry-message').textContent=has('armour.declined')?'Resume at the brook. Gather the five stones, then practise aiming and throwing.':has('saul.audience')?'Resume the saved preparation. Try or set aside the equipment, then continue to the brook.':'Approach Saul and speak once, try the armour, then choose David’s familiar sling.';button('enter').textContent=practiceReview?'Start sling practice':session.run.completed.length>5?'Resume Chapter 4':'Begin Chapter 4';if(practiceReview){el('entry-message').textContent='Move David with WASD or the left stick. Point the mouse or drag to aim. Click, press F or tap Throw. You can move while throwing.';button('replay').textContent='Practise again';}if(audienceReview){el('entry-message').textContent='David stands before Saul. Watch their voiced exchange, then continue with the armour and the five stones. Sound begins when you press Play.';button('enter').textContent='Play David before Saul';}button('enter').hidden=false;if(connectedArrival&&!practiceReview&&!audienceReview){autoEntry='pending';el('entry-message').textContent='Entering Saul’s pavilion. You can also tap to continue your walk.';button('enter').textContent='Enter the pavilion';void resumeChapterAudio(audio.context).then(async()=>{if(mode==='entry'&&!starting&&!document.hidden)await startFromGesture();}).catch(()=>{if(mode==='entry'){autoEntry='tap_required';el('entry-message').textContent='The pavilion is ready. Tap to continue your walk; your sound preference is preserved.';}});}
  if(brookRouteReview||battleRouteReview){button('enter').textContent=brookRouteReview?'Walk from the pavilion to the brook':'Walk from practice to the battlefield';el('entry-message').textContent='Review the connected walking route. This temporary preview preserves your normal saved episode.';}
}
void main().catch(error=>{console.error(error);el('entry-message').textContent=error instanceof Error?error.message:'Preparation could not load.';button('retry').hidden=false;});button('retry').addEventListener('click',()=>location.reload());
