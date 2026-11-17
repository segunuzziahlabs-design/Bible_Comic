import { Color, Vec3, type Application, type Entity } from 'playcanvas';
import { approachVelocity, slideAlongWalls } from '../gameplay/ground-motion';
import type { MovementInput } from '../gameplay/movement-input';
import type { mountObjectiveGuide } from '../app/objective-guide';
import { createSceneSpeech, mouthEnvelope } from './scene-speech';
import { resumeChapterAudio } from './chapter-audio-start';
import { buildShepherdWorld, bundleMark, lambMark } from './shepherd-world';
import { bundleHeight, jesseMark, ridgeMark, valleyExit } from './jesse-courtyard';
import { arrivalDuration, arrivalEnd, arrivalSample, pastureExit, pasturePath } from '../gameplay/courtyard-arrival';
import { createCharacterJump } from './character-jump';
import { createProvisionsCarry } from './provisions-carry';
import type { loadConversationActor } from './conversation-actor';
import type { buildValleyOpening } from './valley-opening';
import lines from '../assets/shepherd-dialogue/dialogue.json';
import life from '../assets/shepherd-dialogue/shepherd-life.wav?url';
import gentle from '../assets/shepherd-dialogue/gentle.wav?url';
import courtyardLines from '../assets/courtyard-dialogue/dialogue.json';
import messengerLines from '../assets/messenger-dialogue/dialogue.json';
import jesseCalls from '../assets/messenger-dialogue/jesse-calls.wav?url';
import davidFollows from '../assets/messenger-dialogue/david-follows.wav?url';
import keeperReady from '../assets/messenger-dialogue/keeper-ready.wav?url';
import jesseGreeting from '../assets/courtyard-dialogue/jesse-greeting.wav?url';
import davidListens from '../assets/courtyard-dialogue/david-listens.wav?url';
import jesseProvisions from '../assets/courtyard-dialogue/jesse-provisions.wav?url';
import davidAccepts from '../assets/courtyard-dialogue/david-accepts.wav?url';
import jesseFarewell from '../assets/courtyard-dialogue/jesse-farewell.wav?url';
import journey from '../assets/shepherd-dialogue/journey.wav?url';
import horns from '../assets/shepherd-dialogue/distant-horns.wav?url';

type Actor=Awaited<ReturnType<typeof loadConversationActor>>;
type Area=Awaited<ReturnType<typeof buildValleyOpening>>;
type Stage='establish'|'handoff'|'pasture_path'|'courtyard_arrival'|'courtyard'|'errand'|'provisions'|'pack'|'journey'|'discovery'|'depart';
const tendingStart=4.2, messengerWalkStart=6.4, messengerWalkDuration=3.6, establishmentEnd=10.2;
const ease=(v:number)=>{const p=Math.max(0,Math.min(1,v));return p*p*(3-2*p);};
export async function createShepherdOpening(app:Application,area:Area,david:Actor,input:MovementInput,canvas:HTMLCanvasElement,
  guide:ReturnType<typeof mountObjectiveGuide>,changed:()=>void,finished:()=>void){
  const dialogue=[...courtyardLines,...messengerLines];
  function schedule(ids:string[],start:number){let at=start;return {cues:ids.map(id=>{const cue={id,start:at};at+=dialogue.find(line=>line.id===id)!.duration+.45;return cue;}),end:()=>at+.45};}
  const handoff=schedule(['jesse-calls','david-follows','keeper-ready'],.35);
  const errand=schedule(['jesse-greeting','david-listens','jesse-provisions','david-accepts','jesse-farewell'],1);
  const [world,audio]=await Promise.all([buildShepherdWorld(app),createSceneSpeech([...lines,...dialogue],{
    'shepherd-life':life,gentle,journey,'distant-horns':horns,
    'jesse-calls':jesseCalls,'david-follows':davidFollows,'keeper-ready':keeperReady,'jesse-greeting':jesseGreeting,'david-listens':davidListens,
    'jesse-provisions':jesseProvisions,'david-accepts':davidAccepts,'jesse-farewell':jesseFarewell,
  },{establish:[{id:'shepherd-life',start:.7},{id:'gentle',start:6.6}],handoff:handoff.cues,errand:errand.cues,
    journey:[{id:'journey',start:.5}],discovery:[{id:'distant-horns',start:1}]},[],6)]);
  const sun=(app.root.children.find(child=>(child as Entity).light?.castShadows) as Entity|undefined)?.light;
  const originalBias=sun?.shadowBias??.05;
  const carry=createProvisionsCarry(david.model,david.tracks.get('deliver_provisions'));
  const extra=audio.context.createGain();extra.gain.value=.15;extra.connect(audio.context.destination);
  const effects=new Set<OscillatorNode>();let lastBleat=-10,lastBird=-10,lastNote=-10;
  function tone(frequency:number,duration:number,gain:number,kind:OscillatorType,slide=frequency){const c=audio.context,at=c.currentTime,node=c.createOscillator(),volume=c.createGain();effects.add(node);node.type=kind;node.frequency.setValueAtTime(frequency,at);node.frequency.exponentialRampToValueAtTime(Math.max(20,slide),at+duration);volume.gain.setValueAtTime(.001,at);volume.gain.linearRampToValueAtTime(gain,at+.025);volume.gain.exponentialRampToValueAtTime(.001,at+duration);node.connect(volume);volume.connect(extra);node.onended=()=>{effects.delete(node);node.disconnect();volume.disconnect();};node.start(at);node.stop(at+duration+.02);}
  let stageOrigin=audio.context.currentTime;let stage:Stage='establish',time=0,elapsed=0,position={x:lambMark.x,z:lambMark.z+.25},velocity={x:0,z:0},heading=180,yaw=0,pitch=.28,walk=0;
  let departureDone=false,waitingForNarration=false;let carried=false,discovered=false,metJesse=false,caption='',clip='idle_relaxed',jesseClip='idle_relaxed',from={...position},lastStep=0;
  const jump=createCharacterJump(app,world.ground);jump.connect(input,changed);
  const starts={tend:0,handoff:0,arrival:0,errand:0,pack:0,discovery:0,journeyNarration:0},eye=new Vec3(),focus=new Vec3(),point=new Vec3();
  const text=document.getElementById('caption')!,objective=document.getElementById('objective')!,distance=document.getElementById('distance')!,label=document.querySelector('.objective span')!;
  const transition=document.createElement('div');transition.className='area-transition';transition.style.cssText='position:absolute;inset:0;background:#152124;opacity:0;pointer-events:none;z-index:5';canvas.parentElement!.append(transition);
  const playable=()=>!waitingForNarration&&['pasture_path','courtyard','provisions','journey'].includes(stage);
  const target=()=>stage==='pasture_path'?pastureExit:stage==='courtyard'||stage==='courtyard_arrival'?jesseMark:stage==='provisions'?bundleMark:!discovered?ridgeMark:valleyExit;
  const action=()=>stage==='pasture_path'?'Follow the path to Jesse’s home':stage==='courtyard'?'Speak with Jesse':stage==='provisions'?'Take the provisions':stage==='journey'?(!discovered?'Listen beyond the ridge':'Enter the valley'):'Watch the scene';
  const canInteract=()=>stage!=='pasture_path'&&playable()&&!jump.active()&&Math.hypot(position.x-target().x,position.z-target().z)<1.45;
  function captionAt(){const line=audio.lineAt(),id=line?.id??'';if(id!==caption){caption=id;text.textContent=line?`${line.speaker}: ${line.text}`:'';text.hidden=!line;}const m=line?mouthEnvelope(line,line.local):[0,0];david.face(line?.speaker==='David'?m[0]:0,line?.speaker==='David'?m[1]:0,.16,.15,Math.max(0,1-Math.abs(elapsed%4.8-.1)/.1));world.keeper.face(line?.speaker==='Keeper'?m[0]:0,line?.speaker==='Keeper'?m[1]:0,.15,.2,0);world.messenger.face(line?.speaker==='Messenger'?m[0]:0,line?.speaker==='Messenger'?m[1]:0,.12,.15,0);world.courtyard.jesse.face(line?.speaker==='Jesse'?m[0]:0,line?.speaker==='Jesse'?m[1]:0,.12,.15,0);return line;}
  function setStage(next:Stage){stage=next;stageOrigin=audio.context.currentTime;waitingForNarration=false;time=0;from={...position};velocity={x:0,z:0};caption='';text.hidden=true;text.textContent='';audio.cancel();if(next==='journey'&&!discovered)starts.journeyNarration++;if(['establish','handoff','errand','discovery'].includes(next)||next==='journey'&&!discovered)audio.begin(next,{
    David:{x:position.x,y:world.ground(position.x,position.z)+1.4,z:position.z},Messenger:{x:-1.25,y:1.6,z:.35},Keeper:{x:-3,y:1.6,z:1.4},Jesse:{x:jesseMark.x,y:1.5,z:jesseMark.z},
  });changed();}
  function show(active:boolean){world.root.enabled=active;area.root.enabled=!active;for(const actor of[area.sentinel,area.patrol])actor.model.enabled=!active;area.champion.model.enabled=!active;if(sun)sun.shadowBias=active?.18:originalBias;app.scene.ambientLight=new Color(...(active?[.58,.62,.52]:[.52,.54,.56])as[number,number,number]);app.scene.fog.start=active?35:38;app.scene.fog.end=active?100:108;area.camera.camera!.clearColor=new Color(...(active?[.65,.77,.80]:[.61,.72,.77])as[number,number,number]);}
  function place(){david.model.setPosition(position.x,world.ground(position.x,position.z)+jump.sample().height,position.z);david.model.setEulerAngles(0,heading,0);}
  function frame(dt:number,cinematic:boolean){const p=david.model.getPosition(),portrait=canvas.clientHeight>canvas.clientWidth;let destination:Vec3,to:Vec3;
    if(stage==='establish'){destination=new Vec3(6-time*.22,4.2,8-time*.15);to=new Vec3(.2,.7,.2);}
    else if(stage==='handoff'){const speaker=audio.lineAt()?.speaker;if(speaker==='David'){destination=new Vec3(-2.1,1.75,-.8);to=new Vec3(position.x,1.4,position.z);}else if(speaker==='Keeper'){destination=new Vec3(-.6,1.7,3);to=new Vec3(-3,1.4,1.4);}else{destination=new Vec3(.2,1.8,2.7);to=new Vec3(-1.25,1.4,.35);}}
    else if(stage==='courtyard_arrival'&&time<arrivalDuration-.8){
      if(world.location==='pasture'){destination=new Vec3(p.x+2.2,p.y+1.9,p.z+2.7);to=new Vec3(p.x,p.y+1.0,p.z-1.1);}
      else{const q=arrivalSample(time,from).progress;destination=new Vec3(4.8-1.2*q,3.4-.7*q,1.0-1.4*q);to=new Vec3(-.25-.15*q,1.05,-5.8-1.2*q);}
    }
    else if(stage==='errand'){const line=audio.lineAt();if(time<2){destination=new Vec3(2.1,2,-4.6);to=new Vec3(-.5,1.1,-7.8);}else if(line?.speaker==='David'){destination=new Vec3(.05,1.72,-9.4);to=new Vec3(position.x,1.40,position.z);}else if(line?.id==='jesse-provisions'&&line.local>3&&line.local<6){destination=new Vec3(1.7,1.9,-5.2);to=new Vec3(-.5,1.1,-8);}else{destination=new Vec3(.45,1.68,-6.35);to=new Vec3(jesseMark.x,1.47,jesseMark.z);}}
    else if(stage==='pack'){destination=new Vec3(position.x+1.8,1.5,position.z+1.6);to=new Vec3(position.x,.9,position.z-.3);}
    else if(stage==='discovery'){destination=new Vec3(-3.4,4.3,-16.8);to=new Vec3(0,.8,-36);}
    else{const length=portrait?4.8:4.1;destination=new Vec3(p.x+Math.sin(yaw)*length,jump.cameraY(world.ground(position.x,position.z)+1.1+length*Math.tan(pitch),p.x+Math.sin(yaw)*length,p.z+Math.cos(yaw)*length),p.z+Math.cos(yaw)*length);to=new Vec3(p.x,world.ground(position.x,position.z)+1.1+jump.cameraFocus(),p.z-.15);}
    const blend=dt===0?1:1-Math.exp(-(cinematic?4:7)*dt);eye.lerp(area.camera.getPosition(),destination,blend);focus.lerp(focus,to,blend);area.camera.setPosition(eye);area.camera.lookAt(focus);area.camera.camera!.fov=stage==='establish'||stage==='discovery'?(portrait?69:55):portrait?64:49;
  }
  function step(dt:number){if(departureDone)return;elapsed=audio.time();time=Math.max(0,audio.context.currentTime-stageOrigin);world.step(elapsed,stage==='establish'&&time>=tendingStart);const line=captionAt();
    if(world.location==='pasture'&&elapsed-lastBleat>6.7){lastBleat=elapsed;tone(260,.55,.42,'triangle',185);tone(520,.48,.13,'sine',370);}if(elapsed-lastBird>9.3){lastBird=elapsed;tone(1800,.17,.1,'sine',2800);tone(2450,.22,.065,'sine',1700);}if(stage==='journey'&&elapsed-lastNote>3){lastNote=elapsed;tone([196,220,261.63,293.66][Math.floor(elapsed/3)%4],1.8,.16,'triangle');}
    const old={...position};let locationChanged=false;
    if(playable()){const m=input.read();yaw-=m.lookX*.004;pitch=Math.max(.12,Math.min(.5,pitch+m.lookY*.003));const pace=stage==='journey'&&discovered?1.15:1.55;const desired={x:(m.x*Math.cos(yaw)-m.forward*Math.sin(yaw))*pace,z:(-m.x*Math.sin(yaw)-m.forward*Math.cos(yaw))*pace};velocity=approachVelocity(velocity,desired,(m.x||m.forward?6:9)*(jump.active()?.6:1)*dt);position=slideAlongWalls(position,{x:velocity.x*dt,z:velocity.z*dt},world.walls);const moved=Math.hypot(position.x-old.x,position.z-old.z);walk+=moved/.93;if(moved>.0001){const to=Math.atan2(velocity.x,velocity.z)*180/Math.PI;heading+=(((to-heading+540)%360)-180)*(1-Math.exp(-12*dt));}jump.step(dt,position);clip=jump.animation()?.clip??(moved>.0005?'walk_forward':'idle_relaxed');jump.pose(david,moved>.0005?'walk_forward':'idle_relaxed',(moved>.0005?walk:elapsed)%david.tracks.get(moved>.0005?'walk_forward':'idle_relaxed')!.duration,dt);}
    else if(stage==='establish'){const tending=time>=tendingStart;clip=tending?'care_for_lamb':'listen';if(tending)starts.tend=1;david.pose(clip,tending?Math.min(3.5,(time-tendingStart)/1.6):elapsed%david.tracks.get(clip)!.duration,dt);if(time>=establishmentEnd){starts.handoff++;setStage('handoff');}}
    else if(stage==='handoff'){const desired=line?.speaker==='Keeper'?-85:-106;heading+=(((desired-heading+540)%360)-180)*(1-Math.exp(-5*dt));clip=line?.speaker==='David'?'speak_resolve':'listen';david.pose(clip,line?.local??elapsed%david.tracks.get(clip)!.duration,dt);if(time>=handoff.end())setStage('pasture_path');}
    else if(stage==='courtyard_arrival'){
      const sample=arrivalSample(time,from);locationChanged=sample.location!==world.location;
      if(locationChanged){world.activate(sample.location);jump.reset(sample.position);yaw=0;pitch=.28;heading=180;}
      transition.style.opacity=String(locationChanged?1:sample.fade);
      position={...sample.position};const moved=locationChanged?0:Math.hypot(position.x-old.x,position.z-old.z);walk+=moved/.93;
      if(moved>.0001){const to=Math.atan2(position.x-old.x,position.z-old.z)*180/Math.PI;heading+=(((to-heading+540)%360)-180)*(1-Math.exp(-12*dt));}
      else if(time>6.35){const to=Math.atan2(jesseMark.x-position.x,jesseMark.z-position.z)*180/Math.PI;heading+=(((to-heading+540)%360)-180)*(1-Math.exp(-5*dt));}
      clip=moved>.0001?'walk_forward':'listen';david.pose(clip,(moved>.0001?walk:elapsed)%david.tracks.get(clip)!.duration,dt);
      if(time>=arrivalDuration){position={...arrivalEnd};jump.reset(position);transition.style.opacity='0';setStage('courtyard');}
    }
    else if(stage==='errand'){const q=ease(time/.8);position={x:from.x+(-.6-from.x)*q,z:from.z+(-6.8-from.z)*q};heading=210;clip=time<.8?'walk_forward':line?.speaker==='David'?'speak_resolve':'listen';david.pose(clip,time<.8?time:line?.local??elapsed%david.tracks.get(clip)!.duration,dt);if(time>=errand.end()){metJesse=true;setStage('provisions');}}
    else if(stage==='pack'){const q=ease(time/.8);position={x:from.x+(bundleMark.x-from.x)*q,z:from.z+(bundleMark.z+.8-from.z)*q};heading=180;clip=time<.8?'walk_forward':'pickup_provisions';david.pose(clip,time<.8?time:Math.min(time-.8,david.tracks.get(clip)!.duration),dt);if(time>2.1)carried=true;if(time>=3.8)setStage('journey');}
    else{if(stage==='journey'&&waitingForNarration&&time>=8.6)setStage('discovery');clip='listen';david.pose(clip,elapsed%david.tracks.get(clip)!.duration,dt);if(stage==='discovery'&&time>=7){discovered=true;setStage('journey');}if(stage==='depart'){transition.style.opacity=String(ease(time/.8));if(time>=1){departureDone=true;transition.style.opacity='0';show(false);guide.hide();audio.cancel();void audio.pause();finished();return;}}}
    if(stage==='pasture_path'&&!jump.active()&&Math.hypot(position.x-pastureExit.x,position.z-pastureExit.z)<.65){starts.arrival++;jump.reset(position);setStage('courtyard_arrival');}
    place();carry.set(carried);if(carried)world.bundle.setPosition(carry.grip().clone().add(new Vec3(0,-.18,0)));else if(stage==='pack'&&time>1.5){const grip=carry.grip();world.bundle.setPosition(new Vec3().lerp(new Vec3(bundleMark.x,bundleHeight,bundleMark.z),grip,ease((time-1.5)/.6)));}
    const keeperClip=line?.speaker==='Keeper'?'speak_concern':'listen';world.keeper.pose(keeperClip,line?.speaker==='Keeper'?line.local:elapsed%world.keeper.tracks.get(keeperClip)!.duration,dt);
    if(stage==='establish'||stage==='handoff'){const progress=stage==='establish'?ease((time-messengerWalkStart)/messengerWalkDuration):1;world.messenger.model.enabled=progress>0;const x=-.4-.85*progress,z=-5.6+5.95*progress;world.messenger.model.setPosition(x,world.ground(x,z),z);world.messenger.model.setEulerAngles(0,progress<1?-8:74,0);const moving=progress>0&&progress<1;world.messenger.pose(moving?'walk_forward':line?.speaker==='Messenger'?'speak_concern':'listen',moving?(6.01*progress/.93)%world.messenger.tracks.get('walk_forward')!.duration:line?.local??elapsed%2,dt);}else world.messenger.pose('listen',elapsed%world.messenger.tracks.get('listen')!.duration,dt);
    jesseClip='idle_relaxed';let jesseTime=elapsed%world.courtyard.jesse.tracks.get('idle_relaxed')!.duration;
    if(stage==='errand'&&time<2.75){jesseClip='greet';jesseTime=Math.min(time,1.75);}else if(stage==='errand'&&line?.id==='jesse-provisions'){jesseClip='explain_point';jesseTime=Math.min(line.local,1.3);}
    world.courtyard.jesse.pose(jesseClip,jesseTime,dt);
    const at=target();world.marker.enabled=playable();world.marker.setPosition(at.x,world.ground(at.x,at.z)+.025,at.z);frame(locationChanged?0:dt,!playable());
    const route=stage==='pasture_path'?pasturePath.map(p=>[p.x,p.z]):stage==='courtyard'?[[arrivalEnd.x,arrivalEnd.z],[jesseMark.x,jesseMark.z]]:stage==='provisions'?[[-.6,-6.8],[0,-7.1],[bundleMark.x,bundleMark.z]]:!discovered?[[bundleMark.x,bundleMark.z+.8],[0,-7.1],[0,-11],[0,-14.2],[ridgeMark.x,ridgeMark.z]]:[[ridgeMark.x,ridgeMark.z],[0,-22],[valleyExit.x,valleyExit.z]];
    guide.update(area.camera.camera!,david.model.getPosition(),point.set(at.x,world.ground(at.x,at.z)+.65,at.z),action(),canInteract()?'E / tap action':stage==='pasture_path'?'Arrival starts at the end of the path':'Follow the arrows',playable(),route.map(([x,z])=>({x,y:world.ground(x,z),z})));
    label.textContent=stage==='pasture_path'?'THE PATH TO JESSE’S HOME':stage==='courtyard_arrival'?(world.location==='pasture'?'LEAVING THE PASTURE':'JESSE’S COURTYARD'):stage==='journey'||stage==='discovery'?'THE ROAD TO ELAH':['courtyard','errand','provisions','pack'].includes(stage)?'JESSE’S COURTYARD':'THE HILLS OF BETHLEHEM';objective.textContent=playable()?action():stage==='courtyard_arrival'?'David arrives at Jesse’s courtyard':stage==='errand'?'Jesse sends David to his brothers':stage==='handoff'?'A messenger: Jesse is calling':stage==='establish'&&time>=tendingStart?'David tends the flock':stage==='pack'?'Take Jesse’s provisions':'David, the shepherd';distance.textContent=playable()?`${Math.round(Math.hypot(position.x-at.x,position.z-at.z))} m · ${canInteract()?'E / tap to continue':'Follow the arrows through the gate'}`:'Watch the scene · Escape / Pause';
    if(!jump.active()&&Math.hypot(position.x-old.x,position.z-old.z)>.001&&elapsed-lastStep>.37){lastStep=elapsed;audio.footstep(david.model.getPosition());}audio.update(area.camera.getPosition(),area.camera.forward);
  }
  function interact(){if(!canInteract())return;if(stage==='courtyard'){starts.errand++;setStage('errand');}else if(stage==='provisions'&&metJesse){starts.pack++;setStage('pack');}else if(!discovered){starts.discovery++;if(time<8.6){waitingForNarration=true;velocity={x:0,z:0};changed();}else setStage('discovery');}else setStage('depart');}
  function preview(){world.activate('pasture');transition.style.opacity='0';show(true);world.marker.enabled=false;position={x:lambMark.x,z:lambMark.z+.25};place();world.step(0,false);frame(0,true);}
  return{step,interact,canInteract,action,moving:playable,pathWalking:()=>stage==='pasture_path',world,jump:()=>playable()&&jump.request(position),canJump:()=>playable()&&jump.ready(position),
    async start(unlock?:Promise<void>){world.activate('pasture');jump.reset({x:lambMark.x,z:lambMark.z+.25});audio.reset();for(const node of effects)try{node.stop();}catch{/* finished */}effects.clear();departureDone=false;lastBleat=lastBird=lastNote=-10;lastStep=0;elapsed=walk=0;position={x:lambMark.x,z:lambMark.z+.25};velocity={x:0,z:0};heading=180;yaw=0;carried=discovered=metJesse=false;for(const key of Object.keys(starts) as Array<keyof typeof starts>)starts[key]=0;world.courtyard.root.addChild(world.bundle);carry.set(false);world.bundle.setPosition(bundleMark.x,bundleHeight,bundleMark.z);world.keeper.model.setPosition(-3,world.ground(-3,1.4),1.4);world.messenger.model.enabled=false;world.messenger.model.setPosition(-.4,world.ground(-.4,-5.6),-5.6);transition.style.opacity='0';show(true);await (unlock??resumeChapterAudio(audio.context));setStage('establish');place();frame(0,true);},
    preview,prepareValleyRender(){show(false);},setValleyCarry(){app.root.addChild(world.bundle);world.bundle.enabled=true;carried=true;},updateCarry(){carry.set(true);world.bundle.setPosition(carry.grip().clone().add(new Vec3(0,-.18,0)));},async pause(){await audio.pause();},resume:()=>resumeChapterAudio(audio.context),mute(value:boolean){audio.mute(value);extra.gain.setValueAtTime(value?0:.15,audio.context.currentTime);},
    sample:()=>({stage,time,location:world.location,pastureVisible:world.pastureRoot.enabled,courtyardVisible:world.householdRoot.enabled,transitionOpacity:Number(transition.style.opacity),arrival:stage==='courtyard_arrival'?arrivalSample(time,from):undefined,clockTime:audio.context.currentTime-stageOrigin,automaticOpening:true,playerControl:playable(),jump:jump.sample(),position,carried,discovered,metJesse,waitingForNarration,line:audio.lineAt()?.id,canInteract:canInteract(),target:target(),action:action(),starts,clip,sheep:world.flock.map(s=>({x:s.x,z:s.z})),keeper:world.keeper.model.getPosition(),messenger:world.messenger.model.getPosition(),messengerVisible:world.messenger.model.enabled,messengerMouth:world.messenger.mouthWeights(),jesse:world.courtyard.jesse.model.getPosition(),jesseMouth:world.courtyard.jesse.mouthWeights(),jesseClip,bundle:world.bundle.getPosition(),mouth:david.mouthWeights(),audio:audio.context.state,output:audio.outputLevel()}),
    dispose(){for(const node of effects)try{node.stop();}catch{/* ended */}extra.disconnect();audio.dispose();},
  };
}
