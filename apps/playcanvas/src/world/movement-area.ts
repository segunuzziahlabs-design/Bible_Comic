import {
  ANIM_BLEND_1D, ANIM_PARAMETER_FLOAT, Color, Entity, Quat, StandardMaterial, Vec3, math,
  type AnimComponent, type AnimTrack, type Application, type RenderComponent,
} from 'playcanvas';
import { mountObjectiveGuide } from '../app/objective-guide';
import {resumeChapterAudio} from './chapter-audio-start';
import { approachVelocity, confineToField, firstWallHit, slideAlongWalls } from '../gameplay/ground-motion';
import { duelCameraField, duelField, duelStoneField } from '../gameplay/duel-field';
import { canInspectMarker, markerCueDuration, markerCueText, trailMarker } from '../gameplay/courtyard-cue';
import { aimAssistRadius, challengeDuration, createElahBattle, fallDuration, slingWindup, aftermathMovement, fallenPhase, swordPickupDuration, type EpisodeBattleSetup } from '../gameplay/elah-battle';
import { createBattleAftermath } from './battle-aftermath';
import type { MovementInput } from '../gameplay/movement-input';
import { loadDavid } from './david-character';
import type { DavidAppearance } from './david-appearance';
import { createDavidSling } from './david-sling';
import { createCharacterJump } from './character-jump';
import { createElahSound } from './elah-sound';
import { createWebGLApp, observeCanvas, waitForFrame } from './graphics';
import { decisiveReplay, slingGuidance, type SlingGuidance } from '../gameplay/sling-ballistics';
import { swordTiming } from '../gameplay/sword-combat';
import { createStonePreview } from './stone-preview';
import { groundedStones,reachableStoneLanding,stonePickupSeconds,stoneRecoveryRoute } from '../gameplay/battle-stones';
import { spearFlightDuration } from '../gameplay/thrown-spear';
import { createRecoverableStones } from './recoverable-stones';

const walls = [
  { minX: -6.45, maxX: -6, minZ: -6.45, maxZ: 6.45 },
  { minX: 6, maxX: 6.45, minZ: -6.45, maxZ: 6.45 },
  { minX: -6, maxX: 6, minZ: -6.45, maxZ: -6 },
  { minX: -6, maxX: 6, minZ: 6, maxZ: 6.45 },
  { minX: -4.35, maxX: -.78, minZ: -.24, maxZ: .24 },
  { minX: .78, maxX: 4.35, minZ: -.24, maxZ: .24 },
  { minX: -4.35, maxX: -3.90, minZ: .24, maxZ: 3.0 },
];
const markerFootRadius = trailMarker.footWidth / 2;
const movementObstacles = [...walls, {
  minX: trailMarker.x - markerFootRadius, maxX: trailMarker.x + markerFootRadius,
  minZ: trailMarker.z - markerFootRadius, maxZ: trailMarker.z + markerFootRadius,
}];
const start = { x: 0, z: 3.6 };
const walkSpeed = 1.35;
const authoredWalkSpeed = .93; // Original in-place cycle at the teenage model's scale.
const followDistance = 3.8;
const gestureState = 'Inspect';

export type BattleView = {
  phase: ReturnType<typeof createElahBattle>['state']['phase'];
  instruction: string;
  caption: string;
  stones: number;
  groundedStones?:number; collectingStones?:boolean; canCollectStones?:boolean;
  canThrow: boolean; canJumpShot?:boolean; cinematic?:boolean;
  aimX: number;
  aimY: number;
  aimed: boolean;
  result: 'victory' | 'defeat' | '';
  reason?: 'david_killed_by_goliath';
  dodgeReady?: boolean;
  dodgeCooldown?: number; slingReady?:boolean; dodges?:number; attackDirection?:number;attackName?:string;attackHeight?:'low'|'middle'|'high';attackProgress?:number;
  combatStage?: 'sword'|'spear'|'sling'; swordEvaded?:boolean; spearEvasions?:number; weaponHit?:'sword'|'spear';
  positionHint?:string; aimHint?:string; distance?:number; foreheadX?:number; foreheadY?:number; foreheadVisible?:boolean;
  actionPrompt?:string; canInteract?:boolean; swordSwing?:number;
};
export type InteractionView = { canInteract: boolean; cueText: string; battle?: BattleView };

const defeatDuration = .65;

function material(r: number, g: number, b: number) {
  const result = new StandardMaterial();
  result.diffuse = new Color(r, g, b);
  result.gloss = .1;
  result.update();
  return result;
}

function buildArea(app: Application) {
  const sand = material(.55, .43, .31);
  const stone = material(.68, .54, .38);
  const trim = material(.81, .68, .49);
  const tile = material(.64, .53, .39);
  const markerCap = material(.27, .57, .55);

  function box(name: string, x: number, y: number, z: number, width: number, height: number, depth: number,
    surface: StandardMaterial, wall = false) {
    const entity = new Entity(name);
    entity.addComponent('render', { type: 'box', material: surface, castShadows: wall, receiveShadows: !wall });
    entity.setLocalScale(width, height, depth);
    entity.setPosition(x, y, z);
    app.root.addChild(entity);
  }

  box('Courtyard floor', 0, -.07, 0, 19, .14, 19, sand);
  walls.forEach((wall, index) => {
    const width = wall.maxX - wall.minX;
    const depth = wall.maxZ - wall.minZ;
    const x = (wall.minX + wall.maxX) / 2;
    const z = (wall.minZ + wall.maxZ) / 2;
    const height = index < 4 ? 1.25 : 1.9;
    box('Stone wall', x, height / 2, z, width, height, depth, stone, true);
    box('Wall coping', x, height + .04, z, width, .08, depth, trim, true);
    box('Stone course', x, .44, z, width + .004, .035, depth + .004, trim, true);
  });

  for (let z = -3.2; z <= 3.2; z += .68) box('Path stone', 0, .012, z, 1.15, .024, .54, tile);
  box('Trail marker foot', trailMarker.x, .065, trailMarker.z, trailMarker.footWidth, .13, trailMarker.footWidth, trim);
  box('Trail marker', trailMarker.x, .38, trailMarker.z, .33, .63, .33, stone, true);
  box('Trail marker cap', trailMarker.x, .73, trailMarker.z, .44, .10, .44, markerCap, true);

  app.scene.ambientLight = new Color(.58, .56, .54);
  const sun = new Entity('Sun');
  sun.addComponent('light', {
    type: 'directional', color: new Color(1, .93, .8), intensity: 1.55,
    castShadows: true, shadowResolution: 1024, shadowDistance: 15, normalOffsetBias: .035,
  });
  sun.setEulerAngles(-55, -35, 0);
  sun.rotateLocal(90, 0, 0);
  app.root.addChild(sun);

  const camera = new Entity('Follow camera');
  camera.addComponent('camera', { fov: 52, nearClip: .05, farClip: 40, clearColor: new Color(.39, .54, .55) });
  app.root.addChild(camera);
  const cueLight = new Entity('Cue fill');
  cueLight.addComponent('light', { type: 'directional', color: new Color(1, .94, .83), intensity: .6 });
  cueLight.enabled = false;
  app.root.addChild(cueLight);
  return { camera, cueLight };
}

function configureLocomotion(animator: AnimComponent, tracks: Map<string, AnimTrack>) {
  const idle = tracks.get('idle_relaxed');
  const walk = tracks.get('walk_forward');
  const gesture = tracks.get('acknowledge');
  if (!idle || !walk || !gesture) throw new Error('Missing David movement or gesture clips');
  animator.loadStateGraph({
    parameters: { walk: { name: 'walk', type: ANIM_PARAMETER_FLOAT, value: 0 } },
    layers: [{
      name: 'Base',
      states: [
        { name: 'START' },
        { name: 'Locomotion', blendTree: {
          type: ANIM_BLEND_1D, parameter: 'walk', syncAnimations: false,
          children: [{ name: 'Idle', point: 0, speed: 1 }, { name: 'Walk', point: 1, speed: 1 }],
        } },
        { name: gestureState, loop: false },
        ...['jump_takeoff','jump_air','jump_land'].map(name=>({name,loop:false})),
        ...(tracks.has('dodge_left') ? [{name:'DodgeLeft',loop:false},{name:'DodgeRight',loop:false},{name:'March',loop:false}] : []),
        ...(tracks.has('speak_resolve') ? [{ name: 'Speak', loop: false }, { name: 'Listen', loop: true }] : []),
        ...['pickup_provisions','sword_carry','sword_finish'].filter(name=>tracks.has(name)).map(name=>({name,loop:false})),
      ],
      transitions: [{ from: 'START', to: 'Locomotion' }],
    }],
  });
  animator.assignAnimation('Locomotion.Idle', idle);
  animator.assignAnimation('Locomotion.Walk', walk);
  animator.assignAnimation(gestureState, gesture);
  for(const name of ['pickup_provisions','sword_carry','sword_finish'])if(tracks.has(name))animator.assignAnimation(name,tracks.get(name)!);
  for(const clip of ['jump_takeoff','jump_air','jump_land'])animator.assignAnimation(clip,tracks.get(clip)!);
  if (tracks.has('speak_resolve')) {
    animator.assignAnimation('Speak', tracks.get('speak_resolve')!);
    animator.assignAnimation('Listen', tracks.get('listen')!);
  }
  if(tracks.has('dodge_left')){animator.assignAnimation('DodgeLeft',tracks.get('dodge_left')!);animator.assignAnimation('DodgeRight',tracks.get('dodge_right')!);animator.assignAnimation('March',tracks.get('walk_forward')!);}
  const layer = animator.baseLayer;
  if (!layer) throw new Error('Missing David locomotion layer');
  layer.play('Locomotion');
  return { layer, gestureDuration: gesture.duration };
}

export async function openMovementArea(
  canvas: HTMLCanvasElement,
  input: MovementInput,
  appearance: DavidAppearance,
  renderInteraction: (view: InteractionView) => void,
  scene: 'courtyard' | 'elah' = 'courtyard',
  episode?: EpisodeBattleSetup,
  options: { chapter?: 'duel' } = {},
) {
  const app = await createWebGLApp(canvas, !!options.chapter);
  let chapter: Awaited<ReturnType<typeof import('./duel-presentation')['createDuelPresentation']>> | undefined;
  try {
    observeCanvas(app, canvas);
    if (options.chapter === 'duel') chapter = await (await import('./duel-presentation')).createDuelPresentation(app);
    const elah = chapter?.world ?? (scene === 'elah' ? await (await import('./elah-area')).buildElah(app) : undefined);
    const area = elah ?? buildArea(app);
    const camera = area.camera;
    const destinationGuide=chapter?mountObjectiveGuide(canvas.parentElement!,canvas):undefined,guidePoint=new Vec3();
    const cueLight = 'cueLight' in area ? area.cueLight : undefined;
    const spawn = elah?.anchors[chapter&&episode&&episode.attempt>1&&episode.anchor==='battle.entry'&&!episode.defeated?'battle.approach':episode?.anchor ?? 'battle.entry'] ?? start;
    const cameraWalls = elah?.walls ?? walls;
    const battle = elah && createElahBattle(elah.anchors['battle.approach'].z, elah.brookZ, elah.goliath, elah.groundHeight,
      () => elah.champion.forehead.getPosition(), episode, {...(chapter?{challengeSeconds:28,stopAfterFall:true,requiredDodges:3,entranceSeconds:13,rangedSpear:true,cinematicCombat:true,field:duelField,sampleSword:elah.sampleSword,
        stoneLanding:(p:{x:number;y:number;z:number})=>reachableStoneLanding(p,elah.groundHeight,elah.stoneObstacles(),duelStoneField),
        stoneBarrier:(from:{x:number;y:number;z:number},to:{x:number;y:number;z:number})=>{const hit=firstWallHit(from,{x:to.x-from.x,z:to.z-from.z},elah.walls,.05);if(hit){const t=Math.max(0,hit.time-.002);return{x:from.x+(to.x-from.x)*t,y:from.y+(to.y-from.y)*t,z:from.z+(to.z-from.z)*t};}}
      }:{}),sampleSpear:elah.poseChampion});
    const lookHeight = elah ? 1.46 : .91;
    const startPitch = (elah ? 16 : 20) * math.DEG_TO_RAD;
    const david = await loadDavid(app, chapter?.davidUrl);
    const { model, animator, tracks, setAppearance } = david;
    setAppearance(appearance);
    const { layer, gestureDuration } = configureLocomotion(animator, tracks);
    const sling = elah && createDavidSling(model, animator, tracks.get('sling_throw'));
    const sound = elah && createElahSound();
    const aftermath=chapter&&elah?createBattleAftermath(app,model,elah.groundHeight):undefined;
    const stonePreview=chapter?createStonePreview(app):undefined;
    const recoverableStones=chapter?createRecoverableStones(app):undefined;
    let recoveryPose=false,routeAge=1,routeTarget=0,recoveryRoute:ReturnType<typeof stoneRecoveryRoute>=[];
    let guidance:SlingGuidance|undefined;
    const inspect = new URLSearchParams(location.search).has('inspect');

    let position = { ...spawn };let defeatLift=0,jumpShotActive=false;
    const jump=createCharacterJump(app,elah?.groundHeight??(()=>0));jump.connect(input,updateInteraction);
    let velocity = { x: 0, z: 0 };
    let yaw = 0;
    let pitch = startPitch;
    let heading = Math.PI;
    let arm = followDistance;
    let allowedArm = arm;
    let speed = 0;
    let walkWeight = 0;
    let paused = true;
    let cue: { id: number; elapsed: number; cameraHeading: number } | undefined;
    let nextCueId = 0;
    let completedCueId = 0;
    let aimX = .5;
    let aimY = .55;
    let aimed = false;
    let dodgeRemaining = 0, dodgeCooldown = 0, dodgeAge = -1, dodgeSide = 1;
    let dodgeVector = { x: 0, z: 0 }, lastMove = { x: 0, forward: 0 };
    let view: InteractionView = { canInteract: false, cueText: '' };
    const aimRay = new Vec3();
    const aimDepth = new Vec3();
    const eyeGoal = new Vec3();
    const oldRotation = new Quat();
    const smoothedRotation = new Quat();

    function battleControlsAvailable() {
      return !battle || battle.state.phase === 'approach' || battle.state.phase === 'fight' || aftermathMovement(battle.state.phase);
    }

    function canJumpShot(){return !!chapter&&!paused&&!jumpShotActive&&battle?.state.phase==='fight'&&battle.slingAvailable()&&battle.state.stones>0&&!battle.state.shot&&battle.state.throwTime===undefined&&jump.ready(position);}
    function recommendedDodgeDirection(){
      if(!battle||!elah)return 1;
      const wanted=battle.pattern().direction,angle=battleBearing(),obstacles=elah.battleObstacles(battle.state);
      const space=(side:number)=>{const next=slideAlongWalls(position,{x:Math.cos(angle)*1.7*side,z:-Math.sin(angle)*1.7*side},obstacles);return Math.hypot(next.x-position.x,next.z-position.z);};
      return space(wanted)>=1.05?wanted:space(-wanted)>space(wanted)?-wanted:wanted;
    }
    function describeBattle(): BattleView | undefined {
      if (!battle) return;
      const { phase, attack, time, shot, stones, misses, throwTime } = battle.state;
      let caption = '';
      let instruction = '';
      if(phase==='entrance')caption=chapter?.caption()??'';
      if (phase === 'approach') instruction = chapter?'Follow the arrows to face Goliath':'Follow the track across the brook';
      if (phase === 'challenge') caption = chapter ? chapter.caption() : time < 2.8
        ? 'Goliath: Come here, boy. Face me if you dare.'
        : 'David: You come with a spear. I come in the name of the Lord.';
      if (phase === 'fight') {
        if (attack === 'windup') instruction = chapter && battle.state.ranged ? `Spear ${battle.state.dodges+1} of 3 · Move away from the red landing circle · Shift / Dodge in any direction` : chapter ? `Spear ${battle.state.dodges+1} of 3 · ${battle.pattern().height==='low'?'Low thrust: Jump or ':battle.pattern().height+' thrust: '}Dodge ${recommendedDodgeDirection()<0?'left ←':'right →'}` : 'Spear raised! Step sideways out of the lane.';
        else if (attack === 'strike') instruction = battle.state.ranged?'Incoming spear · Move away from the landing circle!':'Spear thrust!';
        else if(chapter&&!battle.slingAvailable())instruction=battle.state.feedbackTime>0?battle.state.feedback:`${battle.state.dodges}/3 spears avoided · Move and wait for the next warning`;
        else if(chapter&&battle.state.feedbackTime>0)instruction=battle.state.feedback;
        else if (stones === 0 && !shot) instruction = 'Back away to the brook for more stones';
        else if (shot?.kind === 'windup') instruction = 'David winds up the sling';
        else if (shot) instruction = 'Stone away';
        else if (misses) instruction = 'Missed. Aim at his forehead and throw again.';
        else instruction = chapter ? 'Move · Aim at his forehead · Click or F to throw · Shift to dodge' : 'Aim at Goliath’s forehead and throw';
        if(battle.state.cinematicCombat){
          if(battle.state.combatStage==='sword')instruction=attack==='draw'?'Goliath draws his sword — stay ready':attack==='windup'?'Sword raised — move out of the marked strike':attack==='strike'?'Dodge the blade!':battle.state.swordEvaded?'Sword evaded — stay alert':'Keep moving — Goliath is closing in';
          else if(battle.state.combatStage==='spear')instruction=attack==='windup'?`Spear ${battle.state.spearEvasions+1}/2 — leave the marked landing point`:attack==='strike'?'Incoming spear — move now!':battle.state.feedbackTime>0?battle.state.feedback:'Keep your distance — watch for the spear';
          else instruction=attack==='windup'?'Spear raised — keep aiming and leave the landing circle':attack==='strike'?'Incoming spear — dodge while aiming!':battle.state.stoneRecovery.pickup?'Collecting stone — move or dodge to cancel':stones===0&&!shot?'Out of stones · Collect stones to follow their landing places':shot?'Stone away — stay alert for the next spear':battle.state.feedbackTime>0?battle.state.feedback:'Move and aim · Goliath will throw again';
        }
      }
      if(phase==='finisher')caption='Decisive shot · Cinematic replay';
      if(phase==='stagger')caption=time<1.4?'The stone struck his forehead.':time<5.2?'Goliath groans and struggles to keep his balance.':'His knees begin to give way.';
      if (phase === 'fall') caption = 'The stone struck Goliath.';
      let actionPrompt='';
      const afterTarget=battle.aftermathTarget(),near=Math.hypot(position.x-afterTarget.x,position.z-afterTarget.z)<=1.15;
      if(phase==='retrieve'){instruction='Take Goliath’s sword · Follow the arrow';actionPrompt='Take sword';}
      if(phase==='pickup')caption='David takes Goliath’s sword.';
      if(phase==='finish_approach'){instruction='Finish the battle · Approach the fallen champion';actionPrompt='Ready sword';}
      if(phase==='finish_ready')instruction='Drag the sword grip down, or hold E to swing';
      if(phase==='execution')caption=battle.state.swordSwing<.66?'Guide Goliath’s sword · Drag down or hold E':'David finishes the battle with Goliath’s own sword.';
      if(phase.endsWith('_checkpoint'))instruction='Saving the battle checkpoint…';
      if (phase === 'retreat') caption = time < 1.7
        ? 'The Philistines saw their champion fall.'
        : 'They turned and fled. David prevailed.';
      const result = phase === 'victory' || (phase === 'defeat' && time >= defeatDuration) ? phase : '';
      const forehead=chapter?camera.camera!.worldToScreen(battle.target()):undefined;
      return { phase, instruction, caption, stones, canThrow: phase === 'fight' && !jumpShotActive && !jump.active() && battle.slingAvailable() && throwTime === undefined && !shot && stones > 0,
        groundedStones:groundedStones(battle.state.stoneRecovery).length,collectingStones:battle.state.stoneRecovery.guiding,canCollectStones:phase==='fight'&&battle.slingAvailable()&&groundedStones(battle.state.stoneRecovery).length>0,
        aimX, aimY, aimed, result, reason: battle.state.reason, canJumpShot:canJumpShot(), cinematic:jumpShotActive||['finisher','stagger','fall','pickup','execution'].includes(phase),actionPrompt,canInteract:!!actionPrompt&&near,
        combatStage:battle.state.combatStage,swordEvaded:battle.state.swordEvaded,spearEvasions:battle.state.spearEvasions,weaponHit:battle.state.weaponHit,swordSwing:battle.state.swordSwing,
        positionHint:guidance?.position,aimHint:guidance?.aiming,distance:guidance?.distance,
        foreheadX:forehead?forehead.x/canvas.clientWidth:undefined,foreheadY:forehead?forehead.y/canvas.clientHeight:undefined,
        foreheadVisible:!!forehead&&forehead.z>0&&forehead.x>0&&forehead.x<canvas.clientWidth&&forehead.y>0&&forehead.y<canvas.clientHeight,
        ...(chapter ? { slingReady:battle.slingAvailable(),dodges:battle.state.dodges,attackDirection:recommendedDodgeDirection(),attackName:battle.state.combatStage==='sword'?'Overhead sword strike':battle.state.ranged?['First aimed throw','Second aimed throw','Final aimed throw'][battle.state.attackIndex]:battle.pattern().name,attackHeight:battle.pattern().height,attackProgress:attack==='windup'?Math.min(1,battle.state.attackTime/(battle.state.combatStage==='sword'?swordTiming.windup:battle.pattern().windup)):0,dodgeReady: phase === 'fight' && !jumpShotActive && !jump.active() && dodgeCooldown === 0, dodgeCooldown: Math.ceil(dodgeCooldown * 10) / 10 } : {}) };
    }

    function updateInteraction() {
      const canInteract = !paused && (battle?!!describeBattle()?.canInteract:!cue&&canInspectMarker(position,walls));
      const cueText = cue ? markerCueText(cue.elapsed) : '';
      const nextBattle = describeBattle();
      if (canInteract !== view.canInteract || cueText !== view.cueText ||
        (nextBattle && Object.entries(nextBattle).some(([key, value]) => view.battle?.[key as keyof BattleView] !== value))) {
        view = { canInteract, cueText, battle: nextBattle };
        renderInteraction(view);
      }
    }

    function safeArm(angle: number, distance: number) {
      const offset = { x: Math.sin(angle) * distance, z: Math.cos(angle) * distance };
      const hit = firstWallHit(position, offset, cameraWalls, .16);
      return hit ? Math.max(0, distance * hit.time - .02) : distance;
    }

    function placeCamera(dt: number) {
      if (cueLight) cueLight.enabled = false;
      allowedArm = safeArm(yaw, followDistance * Math.cos(pitch));
      // Pull in before a wall and ease back out as it clears.
      arm = Math.min(allowedArm, math.lerp(arm, allowedArm, 1 - Math.exp(-8 * dt)));
      const height = Math.max(1.17, arm * Math.tan(pitch));
      const eyeX = position.x + Math.sin(yaw) * arm;
      const eyeZ = position.z + Math.cos(yaw) * arm;
      const groundY = elah?.groundHeight(position.x,position.z)??0;
      const eyeGround = elah?.groundHeight(eyeX, eyeZ) ?? groundY;
      camera.setPosition(eyeX,jump.cameraY(Math.max(groundY + .95 + height, eyeGround + .65),eyeX,eyeZ),eyeZ);
      camera.lookAt(position.x, groundY + lookHeight+jump.cameraFocus(), position.z);
    }

    function frameCue(elapsed: number, cameraHeading: number) {
      const distance = safeArm(cameraHeading, 2.55 - .30 * elapsed / markerCueDuration);
      const height = distance < 1.2 ? 2.18 : 1.64;
      camera.setPosition(position.x + Math.sin(cameraHeading) * distance, height,
        position.z + Math.cos(cameraHeading) * distance);
      camera.lookAt(position.x, 1.04, position.z);
      if (cueLight) {
        cueLight.setRotation(camera.getRotation());
        cueLight.rotateLocal(90, 0, 0);
        cueLight.enabled = true;
      }
    }

    function battleBearing() {
      const foe = battle!.state.foe;
      return Math.atan2(position.x - foe.x, position.z - foe.z);
    }

    function frameBattle(dt: number) {
      if (!battle || !elah) return;
      if (chapter?.frame(battle.state, model, dt)) return;
      const swordStage=battle.state.cinematicCombat&&battle.state.combatStage==='sword'&&battle.state.phase==='fight';
      const spearStage=battle.state.cinematicCombat&&battle.state.combatStage!=='sword'&&battle.state.phase==='fight';
      camera.camera!.fov = swordStage?(canvas.clientWidth<canvas.clientHeight?70:63):spearStage?(canvas.clientWidth<canvas.clientHeight?66:62):chapter?(battle?.state.ranged?(canvas.clientWidth<canvas.clientHeight?61:55):battle&&!battle.slingAvailable()?61:58):52;
      const { phase, time, foe } = battle.state;
      const narrow = canvas.clientWidth < canvas.clientHeight;
      const landing=phase==='fight'&&battle.state.ranged&&['windup','strike'].includes(battle.state.attack)?battle.state.aimLock:undefined;
      const nearX=landing?(position.x+landing.x)*.5:position.x,nearZ=landing?(position.z+landing.z)*.5:position.z;
      const spread=landing?Math.hypot(position.x-landing.x,position.z-landing.z):0;
      const exchange = phase === 'challenge' ? 1 - math.smoothstep(challengeDuration - .65, challengeDuration, time) : 0;
      const angle = (landing?Math.atan2(nearX-foe.x,nearZ-foe.z):battleBearing()) + exchange * (narrow ? .18 : .48);
      const defence=!!chapter&&phase==='fight'&&(battle.state.ranged||!battle.slingAvailable());
      const requestedDistance=defence?(narrow?5.4:5.3)+(swordStage?.6:spearStage?.9:0)+Math.min(4,spread*(narrow?.65:.25)):(chapter?4.3:3.3)+exchange*.45;
      // Elah's perimeter bounds constrain David, not an elevated battle camera.
      // Pulling the camera into David at those bounds hid him and cropped the spear.
      const distance=chapter&&phase==='fight'?requestedDistance:safeArm(angle,requestedDistance);
      const edgeLift=chapter&&phase==='fight'?1-math.smoothstep(requestedDistance*.35,requestedDistance*.85,safeArm(angle,requestedDistance)):0;
      const shoulder = (battle.state.ranged&&phase==='fight'?(narrow?.55:1.6):(narrow ? .31 : .53)) * (1 - exchange) * Math.min(1, distance / 2);
      const desired = { x: nearX + Math.sin(angle) * distance + Math.cos(angle) * shoulder,
        z: nearZ + Math.cos(angle) * distance - Math.sin(angle) * shoulder };
      const {x:eyeX,z:eyeZ} = chapter ? confineToField(desired,duelCameraField) : desired;
      const y = elah.groundHeight(position.x,position.z);
      // Rise over the hillside ranks at arena edges rather than looking through soldiers.
      eyeGoal.set(eyeX,jump.cameraY(Math.max(y + (defence?3.1:1.92) + edgeLift*2.4 + .2 * exchange, elah.groundHeight(eyeX, eyeZ) + .75 + edgeLift*3.6),eyeX,eyeZ),eyeZ);
      const retreat = phase === 'victory' ? 1 : phase === 'retreat' ? math.smoothstep(0, 1.0, time) : 0;
      if (retreat) {
        eyeGoal.x = math.lerp(eyeGoal.x, 1.05, retreat);
        eyeGoal.y = math.lerp(eyeGoal.y, elah.groundHeight(1.05, -5.4) + 2.55, retreat);
        eyeGoal.z = math.lerp(eyeGoal.z, -5.4, retreat);
      }
      const blend = 1 - Math.exp(-9 * dt);
      eyeGoal.lerp(camera.getPosition(), eyeGoal, blend);
      camera.setPosition(eyeGoal);
      oldRotation.copy(camera.getRotation());
      const fall = phase === 'victory' || phase === 'retreat' ? 1
        : phase === 'fall' ? math.smoothstep(.12, 1, time / fallDuration) : 0;
      const collapse = phase === 'defeat' ? math.smoothstep(0, defeatDuration, time) : 0;
      const focus = battle.state.ranged&&phase==='fight'?.42:.28 * exchange + .38 * collapse;
      const runner = elah.retreatFocus.getPosition();
      const focusX = math.lerp(foe.x, nearX, focus);
      let focusY = battle.state.ranged&&phase==='fight'?math.lerp(elah.groundHeight(foe.x,foe.z)+(swordStage?2.7:2.6),model.getPosition().y+1.1,.42):elah.groundHeight(foe.x, foe.z) + math.lerp(2.0 - .43 * exchange, .38, Math.max(fall, .68 * collapse));
      if(spearStage&&battle.state.spear&&!battle.state.spear.landed)focusY=math.lerp(focusY,Math.min(focusY,battle.state.spear.sample.tip.y+.45),.7*math.smoothstep(.60*spearFlightDuration,.976*spearFlightDuration,battle.state.spear.time));
      const focusZ = math.lerp(foe.z, nearZ, focus);
      camera.lookAt(math.lerp(focusX, math.lerp(runner.x, 6.4, .24), retreat),
        math.lerp(focusY, runner.y + 1.12, retreat), math.lerp(focusZ, math.lerp(runner.z, -18.5, .24), retreat));
      camera.setRotation(smoothedRotation.slerp(oldRotation, camera.getRotation(), blend));
    }

    function aimAt() {
      const target = battle!.target();
      const eye = camera.getPosition();
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const forward = camera.forward;
      camera.camera!.screenToWorld(aimX * width, aimY * height, 1, aimRay, width, height);
      aimRay.sub(eye);
      aimDepth.sub2(target, eye);
      aimRay.mulScalar(aimDepth.dot(forward) / aimRay.dot(forward)).add(eye);
      if(battle!.state.cinematicCombat&&sling&&elah){guidance=slingGuidance(model.getPosition(),{x:battle!.state.foe.x,y:elah.groundHeight(battle!.state.foe.x,battle!.state.foe.z),z:battle!.state.foe.z},sling.previewOrigin(),aimRay,target,elah.groundHeight,battle!.state.foeYaw);aimed=guidance.aligned;}
      else aimed = aimRay.distance(target) <= aimAssistRadius;
      return aimRay;
    }

    function slingRelease() {
      sling!.pose(slingWindup);
      return sling!.position(slingWindup).pouch;
    }

    function stepBattle(dt: number) {
      if (!battle || !elah || !sling) return;
      const before = battle.state.phase;
      if(chapter&&before==='entrance'){const t=battle.state.time,p=math.smoothstep(5,11,t),previous=position.z;position={x:spawn.x,z:spawn.z-2*p};model.setPosition(position.x,elah.groundHeight(position.x,position.z),position.z);heading=Math.PI;model.setEulerAngles(0,180,0);animator.playing=false;const marching=t>5&&t<11;if(layer.activeState!==(marching?'March':'Listen'))layer.transition(marching?'March':'Listen',.12);layer.activeStateCurrentTime=Math.max(0,(marching?(spawn.z-position.z)/authoredWalkSpeed%1.333:t%david.tracks.get('listen')!.duration)-dt);animator.update(dt);}
      if (chapter && before === 'challenge') battle.state.time = chapter.audio.cueTime();
      battle.update(chapter && before === 'challenge' ? 0 : dt, model.getPosition(), slingRelease);
      battle.updateRecovery(dt,position,!jump.active()&&dodgeAge<0&&speed<.15&&!jumpShotActive&&!input.state().x&&!input.state().forward);
      const pickup=battle.state.stoneRecovery.pickup;
      if(pickup){recoveryPose=true;animator.playing=false;animator.speed=1;if(layer.activeState!=='pickup_provisions')layer.transition('pickup_provisions',.12);layer.activeStateCurrentTime=Math.max(0,pickup.time/stonePickupSeconds*tracks.get('pickup_provisions')!.duration-dt);animator.update(dt);}
      else if(recoveryPose){recoveryPose=false;if((battle.state.phase==='fight'||battle.state.phase==='defeat')&&dodgeAge<0&&!jump.active()){layer.transition('Locomotion',.12);animator.playing=battle.state.phase==='fight';}}
      const { phase, time } = battle.state;
      if(phase!=='approach'&&!aftermathMovement(phase)&&!(phase==='fight'&&battle.state.stoneRecovery.guiding&&battle.state.stoneRecovery.targetId))destinationGuide?.hide();
      if (phase !== before) {
        if(phase!=='fight'&&phase!=='approach'){defeatLift=phase==='defeat'?Math.max(0,model.getPosition().y-elah.groundHeight(position.x,position.z)):0;jump.reset(position);model.setPosition(position.x,elah.groundHeight(position.x,position.z)+defeatLift,position.z);}
        input.setAimMode(!!chapter && phase === 'fight');
        input.setEnabled(!jumpShotActive&&battleControlsAvailable());
        if (phase !== 'fight') {
          dodgeRemaining = 0;
          velocity = { x: 0, z: 0 };
          speed = walkWeight = 0;
          animator.setFloat('walk', 0);
          animator.speed = 1;
        }
        if (phase === 'challenge') {
          heading = battleBearing() + Math.PI;
          model.setEulerAngles(0, heading * math.RAD_TO_DEG, 0);
        }
        if (phase === 'defeat' || chapter && (phase === 'challenge'||phase==='entrance')) animator.playing = false;
        if (chapter && (before === 'challenge' && phase === 'fight'||before==='entrance'&&phase==='approach')) {
          layer.transition('Locomotion', .16); animator.playing = true;
        }
      }
      if(phase==='defeat'){model.setPosition(position.x,elah.groundHeight(position.x,position.z)+Math.max(0,defeatLift-7*time*time),position.z);model.setEulerAngles(-80*math.smoothstep(0,defeatDuration,time),heading*math.RAD_TO_DEG,0);}
      sling.pose(battle.state.throwTime);
      if(phase==='finisher'){
        jumpShotActive=false;animator.playing=false;
        const hop=time<decisiveReplay.release?.50*Math.sin(Math.PI*time/decisiveReplay.release):0;
        model.setPosition(position.x,elah.groundHeight(position.x,position.z)+hop,position.z);
        const clip=time<.18?'jump_takeoff':time<.65?'jump_air':time<decisiveReplay.release?'jump_land':'Listen';
        if(layer.activeState!==clip)layer.transition(clip,.06);
        layer.activeStateCurrentTime=clip==='Listen'?time%david.tracks.get('listen')!.duration:Math.min(tracks.get(clip)!.duration,time<.18?time/.18*tracks.get(clip)!.duration:time<.65?(time-.18)/.47*tracks.get(clip)!.duration:(time-.65)/.3*tracks.get(clip)!.duration);
        animator.update(0);sling.pose(time<1.4?Math.max(0,time-decisiveReplay.release+slingWindup):undefined);
      }
      if(chapter&&fallenPhase(phase)){
        if(phase==='pickup'||phase==='execution'||phase==='finish_ready'){
          animator.playing=false;animator.speed=1;
          const clip=phase==='pickup'?'pickup_provisions':phase==='execution'?'sword_finish':'sword_carry';
          if(layer.activeState!==clip)layer.transition(clip,.12);
          const poseTime=phase==='pickup'?Math.min(1,time/swordPickupDuration)*tracks.get(clip)!.duration:Math.min(time,tracks.get(clip)!.duration);
          layer.activeStateCurrentTime=Math.max(0,poseTime-dt);
          animator.update(dt);
        }
      }
      aftermath?.update(battle.state);
      sound?.step(battle.state, dt, jump.active()?0:speed);
      if (phase === 'approach'||aftermathMovement(phase)) placeCamera(dt);
      else {
        const shot = battle.state.shot;
        const replayWindup=phase==='finisher'&&time>=decisiveReplay.release-slingWindup&&time<decisiveReplay.release;
        elah.renderBattle(battle.state, dt, shot?.kind === 'windup' ? sling.position(shot.time) : replayWindup?sling.position(time-decisiveReplay.release+slingWindup):undefined);
        frameBattle(dt);
      }
      chapter?.step(battle.state, dt, david);
      if(phase==='execution')chapter?.frame(battle.state,model,dt);
      if((jumpShotActive||battle.state.cinematicCombat&&battle.state.jumpShotTime!==undefined)&&phase==='fight'&&!jump.active()&&battle.state.jumpShotTime!>1.3&&!battle.state.shot){jumpShotActive=false;battle.state.jumpShotTime=undefined;input.clear();input.setEnabled(!paused);}
      if (phase === 'fight') aimAt();
      stonePreview?.update(phase==='fight'&&battle.slingAvailable()&&!battle.state.shot?guidance:undefined,camera.camera!,canvas.clientHeight);
      recoverableStones?.update(battle.state.stoneRecovery,phase==='fight');
    }

    function showSample() {
      if (!inspect) return;
      const eye = camera.getPosition();
      const battleState = battle?.state;
      canvas.dataset.movement = JSON.stringify({
        x: position.x, z: position.z, speed, yaw, arm, allowedArm, walkWeight, paused,jump:jump.sample(),
        eyeX: eye.x, eyeZ: eye.z, animation: animator.baseLayer?.activeState,
        phase: layer.activeStateCurrentTime,
        canInteract: view.canInteract, cueId: cue?.id ?? 0, cueElapsed: cue?.elapsed ?? 0,
        startedCues: nextCueId, completedCueId,
        groundY: model.getPosition().y, eyeY: eye.y,
        battlefieldReached: !!battleState && battleState.phase !== 'approach',
        presentation: chapter?.sample(), davidMouth: david.mouthWeights(), dodgeRemaining, dodgeCooldown,
        aftermath:aftermath?.sample(),aftermathTarget:battle&&fallenPhase(battle.state.phase)?battle.aftermathTarget():undefined,
        battle: battleState && {
          ...battleState, preparation: battle.checkpoint.preparation, aimX, aimY, aimed,
          target: battle.target(),
          guidance,
        },
      });
    }

    function reset(options?: { attempt: number }) {
      cue = undefined;defeatLift=0;jumpShotActive=false;guidance=undefined;stonePreview?.update();recoveryPose=false;routeTarget=0;routeAge=1;recoveryRoute=[];
      completedCueId = 0;
      position = { ...(initialized && elah ? elah.anchors[chapter&&(options?.attempt??battle?.state.attempt??1)>1?'battle.approach':'battle.entry'] : spawn) };
      // The initial setup may resume an aftermath/defeat; later resets use battle.entry.
      if (!episode || options || initialized) battle?.reset(options?.attempt);
      sound?.reset();
      chapter?.reset();
      input.clear();jump.reset(position); input.setAimMode(!!chapter&&battle?.state.phase==='fight');
      dodgeRemaining = dodgeCooldown = 0; dodgeAge=-1; lastMove = { x: 0, forward: 0 };
      aimX = .5;
      aimY = .55;
      aimed = false;
      velocity = { x: 0, z: 0 };
      speed = walkWeight = yaw = 0;
      pitch = startPitch;
      heading = Math.PI;
      arm = followDistance;
      input.setEnabled(!paused && battleControlsAvailable());
      model.setPosition(position.x, elah?.groundHeight(position.x, position.z) ?? 0, position.z);
      model.setEulerAngles(0, 180, 0);
      animator.setFloat('walk', 0);
      animator.speed = 1;
      animator.playing = !paused;
      layer.transition('Locomotion', 0);
      layer.activeStateCurrentTime = 0;
      sling?.pose(undefined);
      animator.update(.001);
      if (battle) elah?.renderBattle(battle.state, 0);
      if(battle)recoverableStones?.update(battle.state.stoneRecovery,false);
      if(battle)aftermath?.update(battle.state);
      placeCamera(1);
      if (chapter && battle?.state.phase === 'victory') frameBattle(1);
      updateInteraction();
      showSample();
    }

    function setPaused(value: boolean) {
      paused = value;
      sound?.setPaused(paused);
      if (chapter) void (paused ? chapter.audio.pause() : chapter.audio.resume());
      if (!paused) sound?.start();
      input.setEnabled(!paused && !cue && !jumpShotActive && battleControlsAvailable());
      animator.playing = !paused && !cue && !recoveryPose && !jump.active() && dodgeAge<0 && battle?.state.phase !== 'defeat' && battle?.state.phase !== 'finisher' && !(chapter && (battle?.state.phase === 'challenge'||battle?.state.phase==='entrance'));
      if (paused) {
        battle?.setSwordSwing();
        destinationGuide?.hide();
        velocity = { x: 0, z: 0 };
        speed = 0;
      }
      updateInteraction();
      showSample();
    }

    function interact() {
      if(chapter&&battle&&!paused&&battle.interact(position)){
        const head=elah!.champion.forehead.getPosition();heading=Math.atan2(head.x-position.x,head.z-position.z);model.setEulerAngles(0,heading*math.RAD_TO_DEG,0);
        input.clear();velocity={x:0,z:0};speed=0;input.setEnabled(battleControlsAvailable());updateInteraction();showSample();return true;
      }
      if (elah || paused || cue || !canInspectMarker(position, walls)) return false;
      const offset = { x: trailMarker.x - position.x, z: trailMarker.z - position.z };
      if (Math.hypot(offset.x, offset.z) > .05) heading = Math.atan2(offset.x, offset.z);
      const left = heading - .62;
      const right = heading + .62;
      const cameraHeading = safeArm(left, 2.55) >= safeArm(right, 2.55) ? left : right;
      cue = { id: ++nextCueId, elapsed: 0, cameraHeading };
      input.setEnabled(false);
      velocity = { x: 0, z: 0 };
      speed = walkWeight = 0;
      model.setEulerAngles(0, heading * math.RAD_TO_DEG, 0);
      animator.setFloat('walk', 0);
      animator.speed = 1;
      animator.playing = false;
      layer.transition(gestureState, 0);
      layer.activeStateCurrentTime = 0;
      animator.update(0);
      frameCue(0, cameraHeading);
      updateInteraction();
      showSample();
      return true;
    }

    function throwStone() {
      if (paused || jumpShotActive || jump.active() || battle?.state.phase !== 'fight') return false;
      const pointer = chapter && input.pointerAim();
      if (pointer) { aimX = pointer.x; aimY = pointer.y; }
      const point = aimAt();
      if (!battle.startThrow(point, aimed)) return false;
      updateInteraction();
      showSample();
      return true;
    }

    function jumpShot(){
      if(!canJumpShot()||!battle)return false;const pointer=input.pointerAim();if(pointer){aimX=pointer.x;aimY=pointer.y;}const point=aimAt().clone();
      if(!jump.request(position))return false;if(!battle.startThrow(point,false,true)){jump.reset(position);return false;}
      jumpShotActive=!battle.state.cinematicCombat;if(jumpShotActive){velocity={x:0,z:0};input.clear();}input.setEnabled(!jumpShotActive);updateInteraction();showSample();return true;
    }
    function dodge() {
      if (!chapter || paused || jumpShotActive || jump.active() || battle?.state.phase !== 'fight' || dodgeCooldown > 0) return false;
      battle.cancelPickup();
      const held=input.state();lastMove={x:held.x,forward:held.forward};
      const x = lastMove.x || (!lastMove.forward ? recommendedDodgeDirection() : 0), forward = lastMove.forward;
      const angle = battleBearing(), scale = Math.max(.001, Math.hypot(x, forward));
      dodgeVector = { x: (x * Math.cos(angle) - forward * Math.sin(angle)) / scale,
        z: (-x * Math.sin(angle) - forward * Math.cos(angle)) / scale };
      dodgeRemaining = .36; dodgeCooldown = .9;dodgeAge=0;dodgeSide=x<0?-1:1;animator.playing=false;layer.transition(dodgeSide<0?'DodgeLeft':'DodgeRight',.05);battle.registerDodge(model.getPosition());
      updateInteraction(); showSample(); return true;
    }

    app.on('update', (elapsed: number) => {
      if (paused || elapsed <= 0) return;
      const dt = Math.min(elapsed, .05);
      if(dodgeAge>=0){dodgeAge+=dt;layer.activeStateCurrentTime=Math.max(0,Math.min(.75,dodgeAge)-dt);animator.update(dt);if(dodgeAge>=.75){dodgeAge=-1;layer.transition('Locomotion',.12);animator.playing=true;}}
      if (cue) {
        // The cue, camera and sampled animation share the paused game clock.
        cue.elapsed = Math.min(markerCueDuration, cue.elapsed + dt);
        layer.activeStateCurrentTime = Math.min(gestureDuration, cue.elapsed);
        animator.update(0);
        frameCue(cue.elapsed, cue.cameraHeading);
        if (cue.elapsed === markerCueDuration) {
          completedCueId = cue.id;
          cue = undefined;
          layer.transition('Locomotion', .16);
          animator.playing = true;
          input.setEnabled(true);
          placeCamera(dt);
        }
        updateInteraction();
        showSample();
        return;
      }

      if (!battleControlsAvailable()) {
        stepBattle(dt);
        updateInteraction();
        showSample();
        return;
      }
      const controls = input.read();
      const fighting = battle?.state.phase === 'fight';
      lastMove = { x: controls.x, forward: controls.forward };
      dodgeCooldown = Math.max(0, dodgeCooldown - dt);
      dodgeRemaining = Math.max(0, dodgeRemaining - dt);
      if (fighting) {
        yaw = battleBearing();
        if (chapter && controls.mouseAim) { aimX = controls.mouseAim.x; aimY = controls.mouseAim.y; }
        aimX = math.clamp(aimX + controls.lookX / canvas.clientWidth + controls.aimX * .56 * dt, .045, .955);
        aimY = math.clamp(aimY + controls.lookY / canvas.clientHeight + controls.aimY * .56 * dt, .06, .92);
      } else {
        yaw = (yaw - controls.lookX * .008) % (2 * Math.PI);
        pitch = math.clamp(pitch + controls.lookY * .004, .13, .67);
      }
      const sin = Math.sin(yaw);
      const cos = Math.cos(yaw);
      const target = {
        x: (controls.x * cos - controls.forward * sin) * (chapter ? fighting ? 2.1 : 1.35 : walkSpeed),
        z: (-controls.x * sin - controls.forward * cos) * (chapter ? fighting ? 2.1 : 1.35 : walkSpeed),
      };
      velocity = dodgeRemaining > 0 ? { x: dodgeVector.x * 4.8, z: dodgeVector.z * 4.8 }
        : approachVelocity(velocity, target, (controls.x || controls.forward ? chapter ? 14 : 7 : chapter ? 16 : 11) * (jump.active()?.6:1) * dt);
      const obstacles = battle && elah ? elah.battleObstacles(battle.state) : movementObstacles;
      const next = slideAlongWalls(position, { x: velocity.x * dt, z: velocity.z * dt }, obstacles);
      velocity = { x: (next.x - position.x) / dt, z: (next.z - position.z) / dt };
      position = next;jump.step(dt,position);
      speed = Math.hypot(velocity.x, velocity.z);
      if (fighting || speed > .05) {
        const angle = (fighting ? yaw + Math.PI : Math.atan2(velocity.x, velocity.z)) - heading;
        heading += Math.atan2(Math.sin(angle), Math.cos(angle)) * (1 - Math.exp(-16 * dt));
      }
      model.setPosition(position.x,jump.bodyY(),position.z);
      model.setEulerAngles(dodgeRemaining > 0 ? -8 : 0, heading * math.RAD_TO_DEG, dodgeRemaining > 0 ? -10 * Math.sign(lastMove.x || 1) : 0);
      walkWeight = math.lerp(walkWeight, math.smoothstep(.04, .40, speed), 1 - Math.exp(-18 * dt));
      const jumpClip=jump.animation();
      if(jumpClip){animator.playing=false;animator.speed=1;if(layer.activeState!==jumpClip.clip)layer.transition(jumpClip.clip,.08);layer.activeStateCurrentTime=Math.max(0,jumpClip.progress*tracks.get(jumpClip.clip)!.duration-dt);animator.update(dt);}
      else if(layer.activeState.startsWith('jump_')){layer.transition('Locomotion',.10);animator.playing=!paused;}
      animator.setFloat('walk', walkWeight);
      animator.speed = speed > .05 ? Math.min(dodgeRemaining > 0 ? 2 : 3, Math.max(.2, speed / authoredWalkSpeed)) : 1;
      if (battle) stepBattle(dt);
      else placeCamera(dt);
      if (chapter && controls.fire) throwStone();
      if(chapter&&battle&&elah){
        const state=battle.state,refill=!state.cinematicCombat&&state.phase==='fight'&&state.stones===0&&!state.shot;
        if(aftermathMovement(state.phase)){
          const target=battle.aftermathTarget();destinationGuide?.update(camera.camera!,model.getPosition(),guidePoint.set(target.x,elah.groundHeight(target.x,target.z)+.25,target.z),state.phase==='retrieve'?'Goliath’s sword':'Finish the battle','Walk to the arrow · E / action button',true);
        }else if(state.phase==='fight'&&state.stoneRecovery.guiding&&state.stoneRecovery.targetId){
          const token=state.stoneRecovery.stones.find(s=>s.id===state.stoneRecovery.targetId&&s.status==='ground');
          if(token?.position){routeAge+=dt;if(routeAge>.4||routeTarget!==token.id){recoveryRoute=stoneRecoveryRoute(model.getPosition(),token.position,elah.stoneObstacles(),elah.groundHeight,duelStoneField);routeAge=0;routeTarget=token.id;}
            destinationGuide?.update(camera.camera!,model.getPosition(),guidePoint.set(token.position.x,token.position.y+.22,token.position.z),`Stone ${token.id} · ${state.stones}/5 held`,state.stoneRecovery.pickup?'Collecting · Move / dodge cancels':'Follow arrows · Stop close to collect',true,recoveryRoute);
          }
        }else{
        const away=!state.ranged&&Math.hypot(position.x-state.foe.x,position.z-state.foe.z)>6.2;
        const x=refill?0:state.foe.x,z=refill?elah.brookZ:state.foe.z;
        destinationGuide?.update(camera.camera!,model.getPosition(),guidePoint.set(x,elah.groundHeight(x,z)+(refill?.3:1.4),z),
          refill?'More stones · Brook':state.phase==='approach'||away?'Approach Goliath':'Aim at his forehead',
          refill?'Walk into the shallow brook to refill':'Move towards the marker',
          state.phase==='approach'||state.phase==='fight'&&(refill||away));
        }
      }
      updateInteraction();
      showSample();
    });

    let initialized = false;
    reset();
    initialized = true;
    setPaused(true);
    // Compile off-screen battlefield and recovery materials while the entry loader
    // still owns the screen. The paused game clock and checkpoint remain unchanged.
    const meshes=chapter?(app.root.findComponents('render')as RenderComponent[]).flatMap(r=>r.meshInstances):[];
    const culling=meshes.map(m=>m.cull),restoreStones=recoverableStones?.warm();meshes.forEach(m=>m.cull=false);
    try{await waitForFrame(app);}finally{meshes.forEach((m,i)=>m.cull=culling[i]);restoreStones?.();}
    return {
      backend: app.graphicsDevice.deviceType,
      interact,
      setSwordSwing:(target?:number)=>!paused&&!!battle?.setSwordSwing(target),
      confirmCheckpoint:()=>{const ok=battle?.confirmCheckpoint();if(ok){input.setEnabled(!paused&&battleControlsAvailable());layer.transition('Locomotion',.12);animator.playing=!paused;updateInteraction();showSample();}return ok;},
      throwStone, jumpShot, canJumpShot,
      collectStones:()=>{if(paused||!battle)return false;const accepted=battle.collectStones();routeAge=1;updateInteraction();showSample();return accepted;},
      jump:()=>{if(!paused&&!cue&&!jumpShotActive&&battleControlsAvailable()&&dodgeAge<0&&!battle?.state.shot){const accepted=jump.request(position);if(accepted){battle?.cancelPickup();battle?.registerJump();}return accepted;}return false;},
      canJump:()=>!paused&&!cue&&!jumpShotActive&&battleControlsAvailable()&&dodgeAge<0&&!battle?.state.shot&&jump.ready(position),
      dodge,
      reset,
      setPaused,
      // A connected page entry can check audio without advancing the battle.
      prepareAudio:()=>chapter?resumeChapterAudio(chapter.audio.context):Promise.resolve(),
      setMuted: (value: boolean) => { sound?.setMuted(value); chapter?.mute(value); },
      dispose() {
        sound?.dispose();
        chapter?.dispose();
        input.setEnabled(false);
        app.destroy();
      },
    };
  } catch (error) {
    chapter?.dispose();
    app.destroy();
    throw error;
  }
}
