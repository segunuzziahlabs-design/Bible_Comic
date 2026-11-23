import { Vec3 } from 'playcanvas';
import { copyPoint, copySpear, lerpPoint, playerCapsule, sweepSpear, type Point3, type SpearSample } from './spear-collision';
import { spearFlightDuration, thrownSpearSample, type ThrownSpear } from './thrown-spear';
import { playerRadius, type GroundPoint } from './ground-motion';
import { decisiveReplay, slingPhysics, stoneAt, stoneContact, stoneVelocity, type DecisiveThrow } from './sling-ballistics';
import { swordTiming, sweepSword } from './sword-combat';

const preparation = { provisionsDelivered: true, armourDeclined: true, stonesGathered: 5 } as const;
const entryCheckpoint = {
  episodeId: 'fixture-elah', contentVersion: 1, missionId: 'face-goliath',
  anchor: 'battle.entry', preparation,
} as const;

export const strikeReach = 2.75;
export const attackDistance = 2.45;
export const rangedBattleDistance = 9.5;
export const strikeHalfWidth = .57;
export const spearWindup = 1.7;
export const spearStrike = .28;
export const spearRecovery = 1.25;
export const challengeDuration = 6.2;
export const slingWindup = 13 / 24;
const slingDuration = 23 / 24;
export const fallDuration = 46 / 24;
export const staggerDuration = 6;
export const heavyFallDuration = 64 / 24;
export const swordPickupDuration = 2.7;
export const finalActionDuration = 2.5;
export const retreatDuration = 3.7;
// Readiness feedback uses the physical forehead radius; shots never retarget after input.
export const aimAssistRadius = .27;
const stoneSpeed = 17;
export type EpisodeBattleSetup = {
  episodeId: string; contentVersion: string;
  preparation: { provisionsDelivered: boolean; armourDeclined: boolean; stonesGathered: number; slingReady: boolean };
  attempt: number; anchor: 'battle.entry' | 'battle.aftermath'; defeated: boolean;
  aftermath?: 'combat'|'fallen'|'sword_taken'|'finished';
};

type Phase = 'entrance' | 'approach' | 'challenge' | 'fight' | 'finisher' | 'stagger' | 'fall' | 'fall_checkpoint' | 'retrieve' | 'pickup' | 'sword_checkpoint' | 'finish_approach' | 'finish_ready' | 'execution' | 'finish_checkpoint' | 'retreat' | 'victory' | 'defeat';
export const aftermathMovement = (phase:Phase) => ['retrieve','finish_approach','finish_ready'].includes(phase);
export const fallenPhase = (phase:Phase) => ['fall_checkpoint','retrieve','pickup','sword_checkpoint','finish_approach','finish_ready','execution','finish_checkpoint'].includes(phase);
type Attack = 'advance' | 'draw' | 'windup' | 'strike' | 'recover' | 'exposed';
export const spearPatterns = [
  { name: 'Low right-hand thrust', height: 'low' as const, direction: -1, windup: 2.35, recovery: 1.7, yawOffset: -.10, width: .57 },
  { name: 'Middle angled thrust', height: 'middle' as const, direction: 1, windup: 2.05, recovery: 1.6, yawOffset: .10, width: .60 },
  { name: 'High final thrust', height: 'high' as const, direction: -1, windup: 1.85, recovery: 1.8, yawOffset: 0, width: .68 },
] as const;
type Shot = { kind: 'windup'; time: number; aim: Vec3; assisted: boolean }
  | { kind: 'flight'; time: number; position: Vec3; velocity: Vec3; origin?: Vec3; launchVelocity?: Vec3 };

export type SpearPoseState = {
  phase: Phase; time: number; foe: GroundPoint; foeYaw: number; attackYaw: number;
  attack: Attack; attackTime: number; attackIndex: number; dodgesRequired: number;
  dodges: number; ranged?: boolean; spear?: ThrownSpear; jumpShotTime?: number; poseFrame: number; impactAttackTime?: number;
  cinematicCombat?: boolean; combatStage?: 'sword' | 'spear' | 'sling'; swordEvaded?: boolean; spearEvasions?: number;
  sword?: SpearSample; swordGround?: Point3; decisiveThrow?: DecisiveThrow; weaponHit?: 'sword' | 'spear';
};
type Impact = NonNullable<ReturnType<typeof sweepSpear>['hit']> & { attackIndex: number; attackTime: number };
type CollisionFrame = { active: boolean; spear: SpearSample; feet: Point3;
  capsule: ReturnType<typeof playerCapsule>; margin: number | null; checks: number; hit?: Impact };

export function createElahBattle(
  approachZ: number,
  brookZ: number,
  championStart: GroundPoint,
  groundHeight: (x: number, z: number) => number,
  forehead: () => Vec3,
  episode: EpisodeBattleSetup | undefined,
  presentation: { challengeSeconds?: number; stopAfterFall?: boolean; requiredDodges?: number; entranceSeconds?: number; rangedSpear?: boolean; cinematicCombat?: boolean; sampleSword?: (state: SpearPoseState, dt: number) => SpearSample; sampleSpear: (state: SpearPoseState, dt: number) => SpearSample },
) {
  if(!presentation?.sampleSpear)throw new Error('A visible spear-pose sampler is required.');
  if(presentation.cinematicCombat&&!presentation.sampleSword)throw new Error('Cinematic combat requires a rendered blade sampler.');
  const supplies = episode?.preparation ?? preparation;
  if (episode && (!supplies.provisionsDelivered || !supplies.armourDeclined || supplies.stonesGathered !== 5 || !episode.preparation.slingReady)) throw new Error('Complete the episode preparation before entering the duel.');
  const checkpoint = episode ? { ...entryCheckpoint, episodeId: episode.episodeId, contentVersion: episode.contentVersion, preparation: supplies } : entryCheckpoint;
  function freshAttempt(attempt: number, anchor: 'battle.entry' | 'battle.aftermath' = 'battle.entry', defeated = false) {
    return {
      attempt, anchor,
      phase: (defeated ? 'defeat' : anchor === 'battle.aftermath' ? (episode?.aftermath==='fallen'?'retrieve':episode?.aftermath==='sword_taken'?'finish_approach':presentation.stopAfterFall ? 'victory' : 'retreat') : presentation.requiredDodges&&attempt>1?'fight':presentation.entranceSeconds ? 'entrance' : 'approach') as Phase, time: defeated ? .65 : 0,
      swordTaken:episode?.aftermath==='sword_taken'||episode?.aftermath==='finished', finalPerformed:episode?.aftermath==='finished',
      swordSwing: 0, swordSettle: 0,
      ranged: !!presentation.rangedSpear, spear: undefined as ThrownSpear|undefined, aimLock: undefined as Point3|undefined, jumpShotTime: undefined as number|undefined,
      cinematicCombat: !!presentation.cinematicCombat,
      combatStage: (presentation.cinematicCombat ? 'sword' : undefined) as 'sword'|'spear'|'sling'|undefined,
      swordEvaded: false, spearEvasions: 0, sword: undefined as SpearSample|undefined, swordGround: undefined as Point3|undefined,
      decisiveThrow: undefined as DecisiveThrow|undefined, weaponHit: undefined as 'sword'|'spear'|undefined,
      attack: 'advance' as Attack, attackTime: 0, attackYaw: 0, attackIndex: 0, poseFrame: 0,
      collision: undefined as CollisionFrame | undefined, lastContact: undefined as Impact | undefined, impactAttackTime: undefined as number | undefined,
      dodgesRequired: presentation.requiredDodges ?? 0, dodges: 0, dodgeRegistered: false,
      dodgeFrom: undefined as GroundPoint | undefined, dodgeThreatened: false, jumpRegistered: false, jumpCleared: false,
      lastEvasion: undefined as 'jump'|'dodge'|undefined, feedback: '', feedbackTime: 0,
      foe: presentation.entranceSeconds&&attempt<=1&&anchor==='battle.entry'&&!defeated?{x:championStart.x+2,z:championStart.z-5}:{ ...championStart }, foeYaw: 0,
      shot: undefined as Shot | undefined,
      throwTime: undefined as number | undefined,
      stones: supplies.stonesGathered as number, throws: 0, misses: 0, hits: anchor === 'battle.aftermath' ? 1 : 0, strikes: 0,
      reason: (defeated ? 'david_killed_by_goliath' : undefined) as 'david_killed_by_goliath' | undefined,
    };
  }

  let state = freshAttempt(episode?.attempt ?? 0, episode?.anchor, episode?.defeated);
  let swordDemand = 0;
  const head = new Vec3();
  const travel = new Vec3();
  const nearest = new Vec3();

  function target() {
    return head.copy(forehead());
  }

  let previousFeet: Point3|undefined,previousSpear:SpearSample|undefined,previousSword:SpearSample|undefined;
  let strikeWindow: { start: number; end: number; ageStart: number; ageEnd: number; finish: boolean }|undefined;
  const pattern = () => spearPatterns[state.attackIndex];
  const slingAvailable = () => state.cinematicCombat ? state.combatStage === 'sling' && state.swordEvaded && state.spearEvasions >= 2 : state.dodges >= state.dodgesRequired;
  function registerDodge(david: Vec3) {
    if (state.phase !== 'fight' || !['windup','strike'].includes(state.attack) || state.dodgeRegistered || !state.cinematicCombat&&slingAvailable()) return false;
    state.dodgeRegistered = true; state.dodgeFrom ??= { x: david.x, z: david.z }; return true;
  }
  function registerJump() {
    if(state.phase!=='fight'||!['windup','strike'].includes(state.attack)||!state.cinematicCombat&&slingAvailable())return false;
    state.jumpRegistered=true;return true;
  }
  function startThrow(aim: Vec3, assisted: boolean, cinematic = false) {
    if (state.phase !== 'fight' || state.shot || state.throwTime !== undefined || state.stones === 0 || !slingAvailable()) return false;
    state.shot = { kind: 'windup', time: 0, aim: aim.clone(), assisted };
    state.throwTime = 0;
    if(cinematic)state.jumpShotTime=0;
    return true;
  }

  function updateShot(dt: number, releasePoint: () => Vec3) {
    const shot = state.shot;
    if (!shot) return;
    shot.time += dt;
    if (shot.kind === 'windup') {
      if (shot.time < slingWindup) return;
      const origin = releasePoint().clone();
      const velocity = new Vec3().sub2(shot.aim, origin).normalize().mulScalar(stoneSpeed);
      if(state.cinematicCombat){
        const launch=stoneVelocity(origin,shot.aim);
        velocity.set(launch.x,launch.y,launch.z);
      }
      state.shot = { kind: 'flight', time: 0, position: origin, velocity };
      if(state.cinematicCombat){state.shot.origin=origin.clone();state.shot.launchVelocity=velocity.clone();}
      state.stones--;
      state.throws++;
      return;
    }

    if(state.cinematicCombat&&shot.origin&&shot.launchVelocity){
      const next=stoneAt(shot.origin,shot.launchVelocity,shot.time),head=target().clone();
      const contact=stoneContact(shot.position,next,head);
      if(contact!==undefined){
        const impact=lerpPoint(shot.position,next,contact);
        state.decisiveThrow={origin:copyPoint(shot.origin),velocity:copyPoint(shot.launchVelocity),flightSeconds:shot.time-dt+dt*contact,impact,david:copyPoint(previousFeet??shot.origin),jump:state.jumpShotTime!==undefined};
        state.hits++;state.anchor='battle.aftermath';state.shot=undefined;state.throwTime=undefined;
        state.phase='finisher';state.time=0;state.spear=undefined;state.aimLock=undefined;return;
      }
      shot.position.set(next.x,next.y,next.z);shot.velocity.y=shot.launchVelocity.y-slingPhysics.gravity*shot.time;
      const ground=next.y<=groundHeight(next.x,next.z)+slingPhysics.stoneRadius;
      const armour=Math.hypot(next.x-state.foe.x,next.z-state.foe.z)<.52&&next.y<head.y-.32;
      if(ground||armour||shot.time>=slingPhysics.maxSeconds){state.misses++;state.shot=undefined;state.feedback=armour?'Armour hit — aim higher at the forehead':'Missed — adjust your position and aim';state.feedbackTime=2.2;}
      return;
    }
    travel.copy(shot.velocity).mulScalar(dt);
    nearest.sub2(target(), shot.position);
    const along = Math.max(0, Math.min(1, nearest.dot(travel) / travel.lengthSq()));
    nearest.sub(travel.mulScalar(along));
    if (nearest.lengthSq() <= .27 ** 2) {
      state.hits++;
      state.anchor = 'battle.aftermath';
      state.shot = undefined;
      state.phase = 'fall';
      state.time = 0;
      return;
    }
    shot.position.addScaled(shot.velocity, dt);
    if (shot.time >= 2.8 || shot.position.y <= groundHeight(shot.position.x, shot.position.z) + .07) {
      state.misses++;
      state.shot = undefined;
    }
  }

  function updateAttack(dt: number, david: Vec3) {
    const dx=david.x-state.foe.x,dz=david.z-state.foe.z,distance=Math.hypot(dx,dz);
    const oldTime=state.attackTime;state.attackTime+=dt;
    if(state.attack==='advance'){
      if(distance>.01)state.foeYaw=Math.atan2(dx,dz);
      if(state.time<.85)return;
      if(distance<=attackDistance+.01){
        state.attack='windup';state.attackTime=0;state.attackIndex=Math.min(2,state.dodges);
        state.attackYaw=state.foeYaw+(state.dodgesRequired?pattern().yawOffset:0);
        state.dodgeRegistered=state.jumpRegistered=state.jumpCleared=state.dodgeThreatened=false;state.dodgeFrom=undefined;
      }else{const step=Math.min(distance-attackDistance,.94*dt);state.foe.x+=dx/distance*step;state.foe.z+=dz/distance*step;}
    }else if(state.attack==='windup'){
      const windup=state.dodgesRequired?pattern().windup:spearWindup;
      if(state.attackTime>=windup){
        const remaining=state.attackTime-windup;state.attack='strike';state.attackTime=Math.min(spearStrike,remaining);state.strikes++;
        strikeWindow={start:dt?Math.max(0,1-remaining/dt):0,end:dt?Math.min(1,(windup+spearStrike-oldTime)/dt):1,ageStart:0,ageEnd:state.attackTime,finish:remaining>=spearStrike};
      }
    }else if(state.attack==='strike'){
      strikeWindow={start:0,end:dt?Math.min(1,(spearStrike-oldTime)/dt):1,ageStart:oldTime,ageEnd:Math.min(spearStrike,state.attackTime),finish:state.attackTime>=spearStrike};state.attackTime=Math.min(spearStrike,state.attackTime);
    }else if(state.attack==='recover'){
      if(state.attackTime>=(state.dodgesRequired?pattern().recovery:spearRecovery)){state.attack='advance';state.attackTime=0;}
    }else state.foeYaw=Math.atan2(dx,dz);
  }

  function updateRangedAttack(dt:number,david:Vec3) {
    const dx=david.x-state.foe.x,dz=david.z-state.foe.z,distance=Math.hypot(dx,dz),old=state.attackTime;
    state.attackTime+=dt;
    if(state.attack==='advance'){
      state.foeYaw=Math.atan2(dx,dz);if(state.time<.85)return;
      if(state.cinematicCombat&&slingAvailable()||Math.abs(distance-rangedBattleDistance)<.12){
        state.attack='windup';state.attackTime=0;state.attackIndex=Math.min(2,state.cinematicCombat?state.spearEvasions:state.dodges);state.attackYaw=state.foeYaw;
        state.aimLock={x:david.x,y:groundHeight(david.x,david.z)+.07,z:david.z};
        state.spear=undefined;state.dodgeFrom={x:david.x,z:david.z};state.dodgeRegistered=state.dodgeThreatened=state.jumpRegistered=state.jumpCleared=false;
      }else{
        const movement=Math.sign(distance-rangedBattleDistance)*Math.min(Math.abs(distance-rangedBattleDistance),1.3*dt);
        state.foe.x=Math.max(-7,Math.min(7,state.foe.x+dx/distance*movement));state.foe.z=Math.max(-13.7,Math.min(10,state.foe.z+dz/distance*movement));
        if(state.attackTime>5){state.attackTime=0;state.attack='windup';state.attackIndex=Math.min(2,state.dodges);state.attackYaw=state.foeYaw;state.aimLock={x:david.x,y:groundHeight(david.x,david.z)+.07,z:david.z};state.spear=undefined;state.dodgeFrom={x:david.x,z:david.z};state.dodgeRegistered=state.dodgeThreatened=state.jumpRegistered=state.jumpCleared=false;}
      }
    }else if(state.attack==='windup'&&state.attackTime>=pattern().windup){
      const remaining=state.attackTime-pattern().windup;state.attack='strike';state.attackTime=Math.min(spearFlightDuration,remaining);state.strikes++;
      const initial=copySpear(presentation.sampleSpear({...state,attackTime:0},0));
      state.spear={time:0,start:copyPoint(initial.tip),landing:copyPoint(state.aimLock!),initial,sample:initial,landed:false};
      strikeWindow={start:dt?Math.max(0,1-remaining/dt):0,end:1,ageStart:0,ageEnd:state.attackTime,finish:remaining>=spearFlightDuration};
    }else if(state.attack==='strike'){
      strikeWindow={start:0,end:dt?Math.min(1,(spearFlightDuration-old)/dt):1,ageStart:old,ageEnd:Math.min(spearFlightDuration,state.attackTime),finish:state.attackTime>=spearFlightDuration};state.attackTime=Math.min(spearFlightDuration,state.attackTime);
    }else if(state.attack==='recover'&&state.attackTime>=(state.cinematicCombat&&slingAvailable()?3.2:pattern().recovery)){state.attack='advance';state.attackTime=0;}
    else if(state.attack==='exposed'&&!state.cinematicCombat)state.foeYaw=Math.atan2(dx,dz);
  }

  function updateSwordAttack(dt:number,david:Vec3){
    const dx=david.x-state.foe.x,dz=david.z-state.foe.z,distance=Math.hypot(dx,dz),old=state.attackTime;
    state.attackTime+=dt;
    if(state.attack==='advance'){
      state.foeYaw=Math.atan2(dx,dz);
      if(state.time<1)return;
      if(distance>swordTiming.distance+.03){const step=Math.min(distance-swordTiming.distance,1.9*dt);state.foe.x+=dx/distance*step;state.foe.z+=dz/distance*step;}
      else{state.attack='draw';state.attackTime=0;state.attackYaw=state.foeYaw;}
    }else if(state.attack==='draw'&&state.attackTime>=swordTiming.draw){
      state.attack='windup';state.attackTime=0;state.attackYaw=state.foeYaw=Math.atan2(dx,dz);
      state.aimLock={x:david.x,y:groundHeight(david.x,david.z)+.07,z:david.z};
      state.dodgeFrom={x:david.x,z:david.z};state.dodgeThreatened=state.dodgeRegistered=state.jumpRegistered=state.jumpCleared=false;
      state.swordGround=undefined;
    }else if(state.attack==='windup'&&state.attackTime>=swordTiming.windup){
      const remaining=state.attackTime-swordTiming.windup;state.attack='strike';state.attackTime=Math.min(swordTiming.strike,remaining);state.strikes++;
      strikeWindow={start:dt?Math.max(0,1-remaining/dt):0,end:1,ageStart:0,ageEnd:state.attackTime,finish:remaining>=swordTiming.strike};
    }else if(state.attack==='strike'){
      strikeWindow={start:0,end:dt?Math.min(1,(swordTiming.strike-old)/dt):1,ageStart:old,ageEnd:Math.min(swordTiming.strike,state.attackTime),finish:state.attackTime>=swordTiming.strike};state.attackTime=Math.min(swordTiming.strike,state.attackTime);
    }else if(state.attack==='recover'&&state.attackTime>=swordTiming.recovery){
      if(state.swordEvaded){state.combatStage='spear';state.spear=undefined;state.aimLock=undefined;state.feedback='Sword evaded · Goliath is reaching for his spear';state.feedbackTime=3;}
      state.attack='advance';state.attackTime=0;
    }
  }

  function resolveSword(david:Vec3,dt:number){
    const current=copySpear(presentation.sampleSword!(state,dt)),from=previousSword??current,window=strikeWindow;
    state.sword=current;
    if(window&&state.phase==='fight'){
      const old=previousFeet??david,feetFrom=lerpPoint(old,david,window.start),feetTo=lerpPoint(old,david,window.end);
      const result=sweepSword(from,current,feetFrom,feetTo);
      if(result.hit){state.weaponHit='sword';state.phase='defeat';state.time=0;state.reason='david_killed_by_goliath';state.shot=undefined;state.throwTime=state.jumpShotTime=undefined;state.impactAttackTime=state.attackTime;}
      else{
        if(state.dodgeFrom){const at={...state.dodgeFrom,y:groundHeight(state.dodgeFrom.x,state.dodgeFrom.z)};if(sweepSword(from,current,at,at).hit)state.dodgeThreatened=true;}
        if(window.finish){
          const moved=state.dodgeFrom&&Math.hypot(david.x-state.dodgeFrom.x,david.z-state.dodgeFrom.z)>.55;
          if(state.dodgeThreatened&&moved){state.swordEvaded=true;state.dodges=1;state.lastEvasion='dodge';state.feedback='Sword evaded — the blade struck the earth';}
          else state.feedback='Keep clear of the blade — move during the warning';
          state.swordGround={x:current.tip.x,y:groundHeight(current.tip.x,current.tip.z),z:current.tip.z};
          state.feedbackTime=2.5;state.attack='recover';state.attackTime=0;
        }
      }
    }
    previousSword=current;previousFeet=copyPoint(david);
  }

  function resolveRangedSpear(david:Vec3,dt:number) {
    const held=copySpear(presentation.sampleSpear(state,dt)),flight=state.spear,window=strikeWindow;
    state.collision={active:!!window,spear:copySpear(flight?.sample??held),feet:copyPoint(david),capsule:playerCapsule(david),margin:null,checks:0};
    if(!flight||!window||state.phase!=='fight')return;
    const from=copySpear(flight.sample),to=thrownSpearSample(flight,window.ageEnd),old=previousFeet??david;
    const feetFrom=lerpPoint(old,david,window.start),feetTo=lerpPoint(old,david,window.end),result=sweepSpear(from,to,feetFrom,feetTo);
    flight.sample=to;flight.time=window.ageEnd;flight.landed=window.finish;state.collision.spear=copySpear(to);state.collision.margin=result.minimumMargin;state.collision.checks=result.checks;
    if(result.hit){
      const impact={...result.hit,attackIndex:state.attackIndex,attackTime:window.ageStart+(window.ageEnd-window.ageStart)*result.hit.time};
      state.lastContact=state.collision.hit=impact;state.impactAttackTime=impact.attackTime;flight.sample={grip:lerpPoint(from.grip,to.grip,result.hit.time),tip:lerpPoint(from.tip,to.tip,result.hit.time)};
      state.weaponHit='spear';state.phase='defeat';state.time=0;state.shot=undefined;state.throwTime=state.jumpShotTime=undefined;state.reason='david_killed_by_goliath';return;
    }
    const locked={...flight.landing,y:flight.landing.y-.07};if(sweepSpear(from,to,locked,locked).hit)state.dodgeThreatened=true;
    if(state.jumpRegistered){const a={...feetFrom,y:groundHeight(feetFrom.x,feetFrom.z)},b={...feetTo,y:groundHeight(feetTo.x,feetTo.z)};if(Math.max(feetFrom.y-a.y,feetTo.y-b.y)>.1&&sweepSpear(from,to,a,b).hit)state.jumpCleared=true;}
    if(window.finish){
      const moved=state.dodgeFrom&&Math.hypot(david.x-state.dodgeFrom.x,david.z-state.dodgeFrom.z)>.55;
      if(state.dodgeThreatened&&moved||state.jumpRegistered&&state.jumpCleared){state.dodges++;if(state.cinematicCombat){state.spearEvasions++;if(state.spearEvasions>=2)state.combatStage='sling';}state.lastEvasion=state.jumpCleared?'jump':'dodge';state.feedback=`Spear ${state.cinematicCombat?state.spearEvasions:state.dodges} avoided${slingAvailable()?' · Your sling is ready':''}`;}
      else state.feedback='Spear missed. Move away from the marked landing point.';
      state.feedbackTime=2.2;state.attack=state.cinematicCombat?'recover':slingAvailable()?'exposed':'recover';state.attackTime=0;
    }
  }

  function resolveSpear(david: Vec3, dt: number) {
    if(state.cinematicCombat&&state.combatStage==='sword'){resolveSword(david,dt);return;}
    if(state.ranged){resolveRangedSpear(david,dt);previousFeet=state.phase==='fight'?copyPoint(david):undefined;return;}
    let from=previousSpear;
    if(strikeWindow&&strikeWindow.start>0)from=presentation.sampleSpear({...state,attack:'strike',attackTime:0},0);
    const current=copySpear(presentation.sampleSpear(state,strikeWindow?0:dt));
    state.collision={active:!!strikeWindow,spear:current,feet:copyPoint(david),capsule:playerCapsule(david),margin:null,checks:0};
    if(strikeWindow&&state.phase==='fight'){
      const old=previousFeet??david,feetFrom=lerpPoint(old,david,strikeWindow.start),feetTo=lerpPoint(old,david,strikeWindow.end);
      const result=sweepSpear(from??current,current,feetFrom,feetTo);
      state.collision.margin=result.minimumMargin;state.collision.checks=result.checks;
      if(result.hit){
        const impact={...result.hit,attackIndex:state.attackIndex,attackTime:strikeWindow.ageStart+(strikeWindow.ageEnd-strikeWindow.ageStart)*result.hit.time};
        state.lastContact=state.collision.hit=impact;state.impactAttackTime=impact.attackTime;
        state.phase='defeat';state.time=0;state.shot=undefined;state.throwTime=undefined;state.reason='david_killed_by_goliath';
      }else{
        if(state.jumpRegistered){
          const groundFrom={...feetFrom,y:groundHeight(feetFrom.x,feetFrom.z)},groundTo={...feetTo,y:groundHeight(feetTo.x,feetTo.z)};
          if(Math.max(feetFrom.y-groundFrom.y,feetTo.y-groundTo.y)>.1&&sweepSpear(from??current,current,groundFrom,groundTo).hit)state.jumpCleared=true;
        }
        if(state.dodgeRegistered&&state.dodgeFrom){const at={...state.dodgeFrom,y:groundHeight(state.dodgeFrom.x,state.dodgeFrom.z)};if(sweepSpear(from??current,current,at,at).hit)state.dodgeThreatened=true;}
        if(strikeWindow.finish){
          if(state.dodgesRequired&&!slingAvailable()){
            const dodged=state.dodgeRegistered&&state.dodgeThreatened&&state.dodgeFrom&&Math.hypot(david.x-state.dodgeFrom.x,david.z-state.dodgeFrom.z)>.55;
            if(dodged||state.jumpRegistered&&state.jumpCleared){state.dodges++;state.lastEvasion=dodged?'dodge':'jump';state.feedback=`Spear ${state.dodges} avoided${slingAvailable()?' · Your sling is ready':''}`;}
            else state.feedback=pattern().height==='low'?'Spear missed. Time a jump over the low thrust, or use Shift / Dodge.':'Spear missed. Use Shift / Dodge during the warning.';
            state.feedbackTime=2.2;
          }
          state.attack=state.dodgesRequired&&slingAvailable()?'exposed':'recover';state.attackTime=0;
        }
      }
    }
    previousSpear=state.phase==='fight'?current:undefined;previousFeet=state.phase==='fight'?copyPoint(david):undefined;
  }

  return {
    get state() { return state; },
    checkpoint,
    target,
    startThrow, registerDodge, registerJump, slingAvailable, pattern,
    aftermathTarget() {
      if(state.phase==='retrieve'||state.phase==='pickup'||state.phase==='fall_checkpoint')return {x:state.foe.x+1.35,z:state.foe.z+.65};
      const p=forehead();return {x:Math.max(-7,Math.min(7,p.x+1.05)),z:Math.max(-13.7,Math.min(12,p.z+.35))};
    },
    interact(david:GroundPoint) {
      const target=this.aftermathTarget();if(Math.hypot(target.x-david.x,target.z-david.z)>1.15)return false;
      if(state.phase==='retrieve'&&!state.swordTaken){state.phase='pickup';state.time=0;return true;}
      if(state.phase==='finish_approach'&&state.swordTaken){state.phase='finish_ready';state.time=0;return true;}
      return false;
    },
    // Pointer travel or a held key drives the existing authored animation. Releasing
    // freezes the blade; elapsed time alone cannot perform the final action.
    setSwordSwing(target = state.swordSwing) {
      if(!state.swordTaken||state.finalPerformed||!['finish_ready','execution'].includes(state.phase))return false;
      swordDemand=Number.isFinite(target)?Math.max(state.swordSwing,Math.min(1,target)):state.swordSwing;
      if(state.phase==='finish_ready'&&swordDemand>0){state.phase='execution';state.time=0;}
      return true;
    },
    confirmCheckpoint() {
      if(state.phase==='fall_checkpoint')state.phase='retrieve';
      else if(state.phase==='sword_checkpoint'){state.swordTaken=true;state.phase='finish_approach';}
      else if(state.phase==='finish_checkpoint'){state.finalPerformed=true;state.phase='victory';}
      else return false;
      state.time=0;return true;
    },
    reset(attempt = state.attempt + 1) { state = freshAttempt(attempt);swordDemand=0;previousFeet=previousSpear=previousSword=undefined;strikeWindow=undefined; },
    update(dt: number, david: Vec3, releasePoint: () => Vec3) {
      strikeWindow=undefined;state.poseFrame++;
      state.time += dt;if(state.jumpShotTime!==undefined)state.jumpShotTime+=dt; state.feedbackTime = Math.max(0, state.feedbackTime - dt);
      if (state.throwTime !== undefined) {
        state.throwTime += dt;
        if (state.throwTime >= slingDuration) state.throwTime = undefined;
      }
      if(state.phase==='entrance'){const u=Math.max(0,Math.min(1,state.time/4.5)),p=u*u*(3-2*u);state.foe.x=championStart.x+2*(1-p);state.foe.z=championStart.z-5*(1-p);state.foeYaw=Math.atan2(-2,5)*(1-p);if(state.time>=(presentation.entranceSeconds??0)){state.phase='approach';state.time=0;}}
      else if (state.phase === 'approach' && david.z <= approachZ) {
        state.phase = 'challenge';
        state.time = 0;
        state.foeYaw = Math.atan2(david.x - state.foe.x, david.z - state.foe.z);
      } else if (state.phase === 'challenge' && state.time >= (presentation.challengeSeconds ?? challengeDuration)) {
        state.phase = 'fight';
        state.time = 0;
      } else if (state.phase === 'fight') {
        if (state.stones === 0 && !state.shot && Math.abs(david.z - brookZ) <= .65) {
          state.stones = supplies.stonesGathered;
        }
        // A confirmed impact wins before the champion can resolve a strike in the same update.
        updateShot(dt, releasePoint);
        if (state.phase === 'fight') {if(state.cinematicCombat&&state.combatStage==='sword')updateSwordAttack(dt,david);else if(state.ranged)updateRangedAttack(dt,david);else updateAttack(dt,david);}
      } else if(state.phase==='finisher'&&state.time>=decisiveReplay.duration){
        state.phase=state.cinematicCombat?'stagger':'fall';state.time=0;
      } else if(state.phase==='stagger'&&state.time>=staggerDuration){state.phase='fall';state.time=0;
      } else if (state.phase === 'fall' && state.time >= (state.cinematicCombat?heavyFallDuration:fallDuration)) {
        state.phase = state.cinematicCombat&&episode?.aftermath ? 'fall_checkpoint' : presentation.stopAfterFall ? 'victory' : 'retreat';
        state.time = 0;
      } else if(state.phase==='pickup'&&state.time>=swordPickupDuration){state.phase='sword_checkpoint';state.time=0;
      } else if(state.phase==='execution'){
        state.swordSwing=Math.min(swordDemand,state.swordSwing+dt*.62);
        state.time=state.swordSwing*finalActionDuration;
        if(state.swordSwing>=1){state.swordSettle+=dt;if(state.swordSettle>=.65){state.phase='finish_checkpoint';state.time=0;}}
      } else if(state.phase==='finish_ready'&&Math.hypot(this.aftermathTarget().x-david.x,this.aftermathTarget().z-david.z)>1.4){state.phase='finish_approach';state.time=0;
      } else if (state.phase === 'retreat' && state.time >= retreatDuration) {
        state.phase = 'victory';
        state.time = 0;
      }
      resolveSpear(david,dt);
    },
  };
}

export type ElahBattleState = ReturnType<typeof createElahBattle>['state'];
