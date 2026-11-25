import { Vec3, type Application, type Entity } from 'playcanvas';
import { buildValleyOpening } from './valley-opening';
import { createSceneSpeech, mouthEnvelope } from './scene-speech';
import { createDuelSoundscape } from './duel-soundscape';
import {dialogueGestureTime} from '../gameplay/story-motion';
import {createSpeechFaceMotion} from '../gameplay/speech-face-motion';
import {castBlink,listenerNodStart} from '../gameplay/cast-performance';
import {createAudiencePerformance,reactionNod} from './audience-performance';
import type { ElahBattleState } from '../gameplay/elah-battle';
import type { loadDavid } from './david-character';
import davidUrl from '../assets/david-aftermath.glb?url';
import goliathUrl from '../assets/goliath-continuous.glb?url';
import { decisiveReplay, stoneAt } from '../gameplay/sling-ballistics';
import actorUrl from '../assets/challenge-soldier.glb?url';
import oldLines from '../assets/duel-dialogue/dialogue.json';
import performanceLines from '../assets/battle-performance-dialogue/dialogue.json';
import encounterLines from '../assets/encounter-dialogue/dialogue.json';
import concern from '../assets/encounter-dialogue/soldier-concern.wav?url';
import forward from '../assets/encounter-dialogue/step-forward.wav?url';
import steady from '../assets/encounter-dialogue/steady.wav?url';
const lines=[...oldLines.filter(line=>line.id!=='david-faith'),...performanceLines,...encounterLines];
import contempt from '../assets/duel-dialogue/goliath-contempt.wav?url';
import threat from '../assets/duel-dialogue/goliath-threat.wav?url';
import faith from '../assets/battle-performance-dialogue/david-faith.wav?url';
import battle from '../assets/duel-dialogue/david-battle.wav?url';
import watch from '../assets/duel-dialogue/soldier-watch.wav?url';

export const duelVersion = 'continuous-duel-5';
export const confrontationDuration = 28;
type David = Awaited<ReturnType<typeof loadDavid>>;

export async function createDuelPresentation(app: Application) {
  const world = await buildValleyOpening(app, { goliathUrl, actorUrl, playableBattle: true, externalChallenge: true });
  // The opening hides the original fixture dressing. Retain its combat props only.
  for (const child of app.root.children) if (/^(Sling stone|Stone trail|Sling cord|Sling pouch)/.test(child.name)) child.enabled = true;
  world.anchors={...world.anchors,'battle.approach':{x:0,z:-1.0}};
  world.marker.enabled = false;
  const audio = await createSceneSpeech(lines, {
    'soldier-concern':concern,'step-forward':forward,steady,
    'goliath-contempt': contempt, 'goliath-threat': threat, 'david-faith': faith,
    'david-battle': battle, 'soldier-watch': watch,
  }, {departure:[{id:'soldier-concern',start:1},{id:'step-forward',start:5.2}],opportunity:[{id:'steady',start:.2}],confrontation: [
    { id: 'goliath-contempt', start: 1.4 }, { id: 'goliath-threat', start: 6 },
    { id: 'david-faith', start: 9.5 }, { id: 'david-battle', start: 16.5 },
    { id: 'soldier-watch', start: 22.2 },
  ] }, [], 7,{cinematicDialogue:['departure','confrontation','opportunity']});
  const soundscape = await createDuelSoundscape(audio.context, world.groundHeight);
  let phase = '', starts = 0, shot = 'approach', previousShot = '', elapsed = 0;
  const eye = new Vec3();let opportunity=false,entranceGap=0,lastDavid:David|undefined,davidPerformance:ReturnType<typeof createAudiencePerformance>|undefined;const beats=new Set<number>(),speechFace=createSpeechFaceMotion(),performances=[world.patrol,world.sentinel].map(createAudiencePerformance),championPerformance=createAudiencePerformance(world.champion);
  function reset() { performances.forEach(p=>p.restore());audio.reset();soundscape.reset();speechFace.reset(audio.context.currentTime);lastDavid?.speech(0,0);world.patrol.face(0,0,0,.1,0);world.sentinel.face(0,0,0,.1,0);world.champion.face(0,0);world.resetActivity(); phase = ''; shot = 'approach';previousShot=''; elapsed = 0;opportunity=false;entranceGap=0;beats.clear(); }
  function step(state: ElahBattleState, dt: number, david: David) {
    lastDavid=david;performances.forEach(p=>p.restore());davidPerformance??=createAudiencePerformance(david);davidPerformance.restore();championPerformance.restore();
    elapsed += dt;
    if (state.phase !== phase) {
      phase = state.phase;
      if(phase==='entrance'){audio.begin('departure',{David:david.model.getPosition(),Soldier:world.patrol.model.getPosition()});}
      else if (phase === 'challenge') {
        starts++;
        audio.begin('confrontation', {
          David: david.model.getPosition(), Goliath: world.champion.forehead.getPosition(),
          Soldier: world.patrol.model.getPosition().clone().add(new Vec3(0,1.5,0)),
        });
      } else audio.cancel();
    }
    if(phase==='fight'&&state.dodges>=3&&!opportunity){opportunity=true;audio.begin('opportunity',{David:david.model.getPosition()});}
    const line = audio.lineAt();
    const cheers = soundscape.step(state, !!line, dt);
    world.stage(elapsed,true,phase==='entrance'?Math.min(.8,state.time/5):phase==='challenge'?.7:.3,false,cheers);
    if(phase==='entrance'){entranceGap=Math.min(.8,state.time/5);for(const beat of[.4,1.1,1.8,2.5,3.2,3.9])if(state.time>=beat&&!beats.has(beat)){beats.add(beat);audio.footstep(world.champion.model.getPosition());audio.equipment(world.champion.model.getPosition());}}
    for(const actor of[world.patrol,world.sentinel]){const p=actor.model.getPosition();actor.model.setPosition(p.x+(p.x<0?-1:1)*entranceGap,p.y,p.z);}
    const mouth = speechFace.step(line ? mouthEnvelope(line, line.local) : [0, 0],audio.context.currentTime);
    david.speech(line?.speaker === 'David' ? mouth[0] : 0, line?.speaker === 'David' ? mouth[1] : 0);
    const groan=phase==='stagger'?Math.max(0,Math.sin(state.time*5.4))*.65:0;
    world.champion.face(line?.speaker === 'Goliath' ? mouth[0] : groan, line?.speaker === 'Goliath' ? mouth[1] : groan*.3,0,0,castBlink(elapsed,4));
    if(phase==='fight'){david.expression('determination',.55);world.champion.expression('anger',.65);}
    world.patrol.face(line?.speaker === 'Soldier' ? mouth[0] : 0, line?.speaker === 'Soldier' ? mouth[1] : 0, 0, .35, castBlink(elapsed,2));
    world.sentinel.face(0,0,0,.22,castBlink(elapsed,3));
    for (const actor of [world.patrol, world.sentinel]) {
      const alarmAge=phase==='entrance'?state.time-1:state.time,alarmed=(phase==='challenge'||phase==='entrance')&&alarmAge>=0&&alarmAge<(actor.tracks.get('react_alarm')?.duration??0);
      const speaking=actor===world.patrol&&line?.speaker==='Soldier';
      const clip = alarmed?'react_alarm':speaking?'speak_concern':'listen';
      const actual = actor.tracks.has(clip) ? clip : 'listen';
      actor.pose(actual,alarmed?alarmAge:speaking?dialogueGestureTime(line!.local,line!.duration,actor.tracks.get(actual)!.duration):elapsed%actor.tracks.get(actual)!.duration,dt);
      if((phase==='challenge'||phase==='entrance')&&!alarmed){const i=actor===world.patrol?0:1;performances[i].apply(elapsed,speaking,line&&!speaking?reactionNod(line.local,listenerNodStart(line.duration,i),.9,1.8):0,i*1.7,world.champion.model.findByName('Head')!,'fear');}
    }
    if (phase === 'challenge') {
      if (line?.speaker === 'Goliath') world.champion.pose('goliath_speak', line.local, 0);
      else world.champion.pose('goliath_ready', elapsed % 2.083, 0);
      const layer = david.animator.baseLayer!;
      const clip = line?.speaker === 'David' ? 'Speak' : 'Listen';
      if (layer.activeState !== clip) layer.transition(clip,.12);
      layer.activeStateCurrentTime = line?.speaker === 'David'
        ? Math.max(0,dialogueGestureTime(line.local,line.duration,david.tracks.get('speak_resolve')!.duration)-dt)
        : Math.max(0,elapsed % david.tracks.get('listen')!.duration-dt);
      david.animator.update(dt);
      davidPerformance.apply(elapsed,line?.speaker==='David',line?.speaker==='Goliath'?reactionNod(line.local,line.duration*.7,.9,1.5):0,1.6,world.champion.model.findByName('Head')!,'determination');
      championPerformance.apply(elapsed,line?.speaker==='Goliath',0,4,david.model.findByName('Head')!,'anger');
    }
    audio.update(world.camera.getPosition(), world.camera.forward);
  }
  const canvasPortrait=()=>app.graphicsDevice.canvas.clientHeight>app.graphicsDevice.canvas.clientWidth;
  function frame(state: ElahBattleState, david: Entity, dt: number) {
    if(state.phase==='stagger'){
      shot=state.time<1.4?'forehead-reaction':state.time<5.2?'stagger-and-turn':'knees-give-way';
      const p=state.foe,g=world.champion.forehead.getPosition(),y=world.groundHeight(p.x,p.z),portrait=canvasPortrait();
      eye.lerp(world.camera.getPosition(),new Vec3(p.x+3.2,y+1.8,p.z+(portrait?6.3:4.9)),1-Math.exp(-3*dt));world.camera.setPosition(eye);world.camera.lookAt(p.x,y+1.45,p.z);world.camera.camera!.fov=portrait?57:49;return true;
    }
    if(state.phase==='execution'){
      // The camera follows the player's blade progress, not an independent timer.
      // At contact, frame David above the fallen champion: no graphic wound detail.
      const u=state.swordSwing,p=david.getPosition(),forward=david.forward,right=david.right;
      const contact=u>=.60;
      shot=contact?'player-sword-contact-reaction':u<.28?'player-sword-lift':'player-sword-downswing';
      const side=contact?-1.3:1.6,back=canvasPortrait()?2.8:2.4;
      const destination=new Vec3(p.x-forward.x*back+right.x*side,p.y+(contact?1.62:1.9),p.z-forward.z*back+right.z*side);
      eye.lerp(world.camera.getPosition(),destination,1-Math.exp(-(contact?14:6)*dt));
      world.camera.setPosition(eye);world.camera.lookAt(p.x,p.y+(contact?1.46:1.23),p.z);world.camera.camera!.fov=contact?(canvasPortrait()?45:35):(canvasPortrait()?59:49);return true;
    }
    if(state.phase==='finisher'&&state.decisiveThrow){
      const t=state.time,replay=state.decisiveThrow,g=world.champion.forehead.getPosition(),p=david.getPosition();
      const u=Math.max(0,Math.min(1,(t-decisiveReplay.release)/(decisiveReplay.impact-decisiveReplay.release)));
      const stone=stoneAt(replay.origin,replay.velocity,replay.flightSeconds*u);
      let destination:Vec3,focus:Vec3;
      if(t<decisiveReplay.release){shot='earned-jump-and-sling-replay';destination=new Vec3(p.x+2.3,p.y+1.8,p.z+2.7);focus=new Vec3(p.x,p.y+1.15,p.z);}
      else if(t<decisiveReplay.impact){shot='follow-the-earned-stone';destination=new Vec3(stone.x+1.2,stone.y+.55,stone.z+1.6);focus=new Vec3(stone.x,stone.y,stone.z);}
      else{shot='forehead-impact';destination=new Vec3(g.x+1.3,g.y+.22,g.z+2.7);focus=g.clone();}
      eye.lerp(world.camera.getPosition(),destination,1-Math.exp(-12*dt));world.camera.setPosition(eye);world.camera.lookAt(focus);world.camera.camera!.fov=canvasPortrait()?57:48;return true;
    }
    if(state.cinematicCombat&&state.phase==='fight'&&state.combatStage==='spear'&&state.spearEvasions===0&&state.attack==='windup'&&state.attackTime<.4){
      shot='spear-direction-establish';const p=david.getPosition(),g=world.champion.forehead.getPosition();
      eye.lerp(world.camera.getPosition(),new Vec3(p.x+2.2,p.y+2.8,p.z+4.4),1-Math.exp(-6*dt));world.camera.setPosition(eye);world.camera.lookAt(g.x,g.y-1,g.z);world.camera.camera!.fov=canvasPortrait()?64:57;return true;
    }
    if(state.phase==='fight'&&state.jumpShotTime!==undefined&&!state.cinematicCombat){
      shot='david-jump-and-sling';const p=david.getPosition(),g=world.champion.forehead.getPosition(),angle=Math.atan2(p.x-g.x,p.z-g.z),t=state.jumpShotTime;
      const side=1.8*Math.min(1,t/.3),distance=canvasPortrait()?4.7:4.2;
      const destination=new Vec3(p.x+Math.sin(angle)*distance+Math.cos(angle)*side,p.y+1.9,p.z+Math.cos(angle)*distance-Math.sin(angle)*side);
      eye.lerp(world.camera.getPosition(),destination,1-Math.exp(-5*dt));world.camera.setPosition(eye);world.camera.lookAt((p.x+g.x)*.5,p.y+1.15,(p.z+g.z)*.5);world.camera.camera!.fov=canvasPortrait()?61:53;return true;
    }
    if(state.phase==='entrance'){const p=david.getPosition(),g=world.champion.model.getPosition(),t=state.time;shot=t<4.5?'the-champion-walks-out':t<9?'david-steps-forward':'the-field-awaits';const target=t<4.5?new Vec3(g.x+3.1,g.y+.9,g.z+4.3):t<9?new Vec3(p.x+2.0,p.y+1.65,p.z-.8):new Vec3(p.x+.4,p.y+2.1,p.z+3.8);eye.lerp(world.camera.getPosition(),target,1-Math.exp(-5*dt));world.camera.setPosition(eye);if(t<4.5)world.camera.lookAt(g.x,g.y+1.85,g.z);else if(t<9)world.camera.lookAt(p.x,p.y+1.3,p.z);else world.camera.lookAt(g.x,g.y+1.8,g.z);world.camera.camera!.fov=53;return true;}
    if (state.phase === 'fall' || state.phase === 'victory') {
      shot = 'the-champion-falls'; const p = state.foe, y = world.groundHeight(p.x, p.z);
      eye.set(p.x + 2.6, y + 1.65, p.z + 4.1).lerp(world.camera.getPosition(), eye, 1 - Math.exp(-5 * dt));
      world.camera.setPosition(eye); world.camera.lookAt(p.x, y + .5, p.z + .25); world.camera.camera!.fov = 49; return true;
    }
    if (state.phase !== 'challenge') { shot = state.phase; previousShot = ''; return false; }
    const t = state.time, p = david.getPosition(), g = world.champion.forehead.getPosition();
    const portrait = app.graphicsDevice.canvas.clientHeight > app.graphicsDevice.canvas.clientWidth;
    let focus: number[], destination: number[], fov = portrait ? 48 : 42;
    if (t < 1.4) { shot = 'a-shepherd-before-the-champion'; destination = [-3.2, p.y + 2.6, p.z + .6]; focus = [.2, g.y - .6, -9.2]; fov = 54; }
    else if (t < 9.1) { shot = 'goliath-contempt'; destination = [2.1 - t * .025, g.y + .05, -6.6]; focus = [g.x, g.y - .18, g.z]; }
    else if (t < 21.9) { shot = 'david-faith'; destination = [p.x + 1.0, p.y + 1.59, p.z - 2.5]; focus = [p.x, p.y + 1.43, p.z]; }
    else if (t < 24.8) { shot = 'soldiers-hold-their-breath'; const a = world.patrol.model.getPosition(); destination = [a.x + 1, a.y + 1.8, a.z - 2.2]; focus = [a.x, a.y + 1.5, a.z]; }
    else { shot = 'control-returns-to-david'; destination = [p.x + (portrait ? .31 : .53), p.y + 1.92, p.z + 3.3]; focus = [g.x, world.groundHeight(g.x, g.z) + 2, g.z]; fov = 52; }
    const blend = shot !== previousShot ? 1 : 1 - Math.exp(-5 * dt); previousShot = shot;
    eye.set(destination[0], destination[1], destination[2]); eye.lerp(world.camera.getPosition(), eye, blend);
    world.camera.setPosition(eye); world.camera.lookAt(focus[0], focus[1], focus[2]); world.camera.camera!.fov = fov;
    return true;
  }
  return { world, davidUrl, audio, step, frame, reset,
    mute(value: boolean) { audio.mute(value); soundscape.mute(value); },
    dispose() { soundscape.dispose(); audio.dispose(); },
    caption: () => { const line = audio.lineAt(); return line ? `${line.speaker}: ${line.text}` : ''; },
    sample: () => ({ version: duelVersion, starts, shot, speaker: audio.lineAt()?.speaker,
      voiceTime: audio.cueTime(), audio: audio.context.state, soundscape: soundscape.sample(),
      goliathMouth: world.champion.mouthWeights(), soldierMouth: world.patrol.mouthWeights() }),
  };
}
