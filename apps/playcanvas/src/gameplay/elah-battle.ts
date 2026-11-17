import { Vec3 } from 'playcanvas';
import { copyPoint, copySpear, lerpPoint, playerCapsule, sweepSpear, type Point3, type SpearSample } from './spear-collision';
import { spearFlightDuration, thrownSpearSample, type ThrownSpear } from './thrown-spear';
import { playerRadius, type GroundPoint } from './ground-motion';

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
export const retreatDuration = 3.7;
// Readiness feedback uses the physical forehead radius; shots never retarget after input.
export const aimAssistRadius = .27;
const stoneSpeed = 17;
export type EpisodeBattleSetup = {
  episodeId: string; contentVersion: string;
  preparation: { provisionsDelivered: boolean; armourDeclined: boolean; stonesGathered: number; slingReady: boolean };
  attempt: number; anchor: 'battle.entry' | 'battle.aftermath'; defeated: boolean;
};

type Phase = 'entrance' | 'approach' | 'challenge' | 'fight' | 'fall' | 'retreat' | 'victory' | 'defeat';
type Attack = 'advance' | 'windup' | 'strike' | 'recover' | 'exposed';
export const spearPatterns = [
  { name: 'Low right-hand thrust', height: 'low' as const, direction: -1, windup: 2.35, recovery: 1.7, yawOffset: -.10, width: .57 },
  { name: 'Middle angled thrust', height: 'middle' as const, direction: 1, windup: 2.05, recovery: 1.6, yawOffset: .10, width: .60 },
  { name: 'High final thrust', height: 'high' as const, direction: -1, windup: 1.85, recovery: 1.8, yawOffset: 0, width: .68 },
] as const;
type Shot = { kind: 'windup'; time: number; aim: Vec3; assisted: boolean }
  | { kind: 'flight'; time: number; position: Vec3; velocity: Vec3 };

export type SpearPoseState = {
  phase: Phase; time: number; foe: GroundPoint; foeYaw: number; attackYaw: number;
  attack: Attack; attackTime: number; attackIndex: number; dodgesRequired: number;
  dodges: number; ranged?: boolean; spear?: ThrownSpear; jumpShotTime?: number; poseFrame: number; impactAttackTime?: number;
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
  presentation: { challengeSeconds?: number; stopAfterFall?: boolean; requiredDodges?: number; entranceSeconds?: number; rangedSpear?: boolean; sampleSpear: (state: SpearPoseState, dt: number) => SpearSample },
) {
  if(!presentation?.sampleSpear)throw new Error('A visible spear-pose sampler is required.');
  const supplies = episode?.preparation ?? preparation;
  if (episode && (!supplies.provisionsDelivered || !supplies.armourDeclined || supplies.stonesGathered !== 5 || !episode.preparation.slingReady)) throw new Error('Complete the episode preparation before entering the duel.');
  const checkpoint = episode ? { ...entryCheckpoint, episodeId: episode.episodeId, contentVersion: episode.contentVersion, preparation: supplies } : entryCheckpoint;
  function freshAttempt(attempt: number, anchor: 'battle.entry' | 'battle.aftermath' = 'battle.entry', defeated = false) {
    return {
      attempt, anchor,
      phase: (defeated ? 'defeat' : anchor === 'battle.aftermath' ? (presentation.stopAfterFall ? 'victory' : 'retreat') : presentation.requiredDodges&&attempt>1?'fight':presentation.entranceSeconds ? 'entrance' : 'approach') as Phase, time: defeated ? .65 : 0,
      ranged: !!presentation.rangedSpear, spear: undefined as ThrownSpear|undefined, aimLock: undefined as Point3|undefined, jumpShotTime: undefined as number|undefined,
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
  const head = new Vec3();
  const travel = new Vec3();
  const nearest = new Vec3();

  function target() {
    return head.copy(forehead());
  }

  let previousFeet: Point3|undefined,previousSpear:SpearSample|undefined;
  let strikeWindow: { start: number; end: number; ageStart: number; ageEnd: number; finish: boolean }|undefined;
  const pattern = () => spearPatterns[state.attackIndex];
  const slingAvailable = () => state.dodges >= state.dodgesRequired;
  function registerDodge(david: Vec3) {
    if (state.phase !== 'fight' || !['windup','strike'].includes(state.attack) || state.dodgeRegistered || slingAvailable()) return false;
    state.dodgeRegistered = true; state.dodgeFrom ??= { x: david.x, z: david.z }; return true;
  }
  function registerJump() {
    if(state.phase!=='fight'||!['windup','strike'].includes(state.attack)||slingAvailable())return false;
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
      state.shot = { kind: 'flight', time: 0, position: origin, velocity };
      state.stones--;
      state.throws++;
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
      if(Math.abs(distance-rangedBattleDistance)<.12){
        state.attack='windup';state.attackTime=0;state.attackIndex=Math.min(2,state.dodges);state.attackYaw=state.foeYaw;
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
    }else if(state.attack==='recover'&&state.attackTime>=pattern().recovery){state.attack='advance';state.attackTime=0;}
    else if(state.attack==='exposed')state.foeYaw=Math.atan2(dx,dz);
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
      state.phase='defeat';state.time=0;state.shot=undefined;state.throwTime=state.jumpShotTime=undefined;state.reason='david_killed_by_goliath';return;
    }
    const locked={...flight.landing,y:flight.landing.y-.07};if(sweepSpear(from,to,locked,locked).hit)state.dodgeThreatened=true;
    if(state.jumpRegistered){const a={...feetFrom,y:groundHeight(feetFrom.x,feetFrom.z)},b={...feetTo,y:groundHeight(feetTo.x,feetTo.z)};if(Math.max(feetFrom.y-a.y,feetTo.y-b.y)>.1&&sweepSpear(from,to,a,b).hit)state.jumpCleared=true;}
    if(window.finish){
      const moved=state.dodgeFrom&&Math.hypot(david.x-state.dodgeFrom.x,david.z-state.dodgeFrom.z)>.55;
      if(state.dodgeThreatened&&moved||state.jumpRegistered&&state.jumpCleared){state.dodges++;state.lastEvasion=state.jumpCleared?'jump':'dodge';state.feedback=`Spear ${state.dodges} avoided${slingAvailable()?' · Your sling is ready':''}`;}
      else state.feedback='Spear missed. Move away from the marked landing point.';
      state.feedbackTime=2.2;state.attack=slingAvailable()?'exposed':'recover';state.attackTime=0;
    }
  }

  function resolveSpear(david: Vec3, dt: number) {
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
    reset(attempt = state.attempt + 1) { state = freshAttempt(attempt);previousFeet=previousSpear=undefined;strikeWindow=undefined; },
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
        if (state.phase === 'fight') {if(state.ranged)updateRangedAttack(dt,david);else updateAttack(dt,david);}
      } else if (state.phase === 'fall' && state.time >= fallDuration) {
        state.phase = presentation.stopAfterFall ? 'victory' : 'retreat';
        state.time = 0;
      } else if (state.phase === 'retreat' && state.time >= retreatDuration) {
        state.phase = 'victory';
        state.time = 0;
      }
      resolveSpear(david,dt);
    },
  };
}

export type ElahBattleState = ReturnType<typeof createElahBattle>['state'];
