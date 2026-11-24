import {
  BLEND_NORMAL, Color, Entity, FOG_LINEAR, Mesh, MeshInstance, StandardMaterial, Vec3, calculateNormals, math,
  type Application,
} from 'playcanvas';
import {
  fallDuration, heavyFallDuration, fallenPhase, retreatDuration, spearPatterns, spearStrike, spearWindup, strikeHalfWidth, strikeReach,
  type ElahBattleState, type SpearPoseState,
} from '../gameplay/elah-battle';
import { spearSegments, copyPoint, type SpearSample, type Point3 } from '../gameplay/spear-collision';
import { thrownSpearSample } from '../gameplay/thrown-spear';
import { playerRadius, type WallBounds } from '../gameplay/ground-motion';
import { loadGoliath } from './goliath-character';
import { decisiveReplay, stoneAt } from '../gameplay/sling-ballistics';
import { swordTiming } from '../gameplay/sword-combat';
import { duelWalls } from '../gameplay/duel-field';

export const elahAnchors = {
  'battle.entry': { x: 0, z: 8.5 },
  'battle.approach': { x: 0, z: -5.6 },
  'battle.aftermath': { x: 2.6, z: -12.4 },
};

const goliath = { x: .28, z: -10.5 };
const bearer = { x: -1.45, z: -9.8 };
const brookZ = -2.8;
const xExtent = 34;
const front = 25;
const back = -65;

function mound(x: number, z: number, centerX: number, centerZ: number, width: number, depth: number) {
  return Math.exp(-(((x - centerX) / width) ** 2 + ((z - centerZ) / depth) ** 2));
}

function heightAtVertex(x: number, z: number) {
  return .028 * (z + 4)
    + .82 * mound(x, z, 0, 9, 7, 9)
    + 3.7 * mound(x, z, -8.8, -18, 5.8, 10)
    + 3.5 * mound(x, z, 8.3, -18, 5.6, 9.7)
    + 6.7 * mound(x, z, -17, -35, 13, 13)
    + 7.9 * mound(x, z, 16, -42, 14, 16)
    + 5.1 * mound(x, z, -1, -49, 15, 14)
    - .24 * Math.exp(-((z - brookZ - .24 * Math.sin(x * .65)) ** 2) / .72)
    + .065 * Math.sin(x * .8) * Math.cos(z * .45);
}

// Follow the same planar triangles as the terrain mesh, including at the brook.
function groundHeight(x: number, z: number) {
  const left = Math.floor(x);
  const near = Math.floor(z);
  const u = x - left;
  const v = z - near;
  const northwest = heightAtVertex(left, near);
  const southeast = heightAtVertex(left + 1, near + 1);
  return u > v
    ? (1 - u) * northwest + (u - v) * heightAtVertex(left + 1, near) + v * southeast
    : (1 - v) * northwest + (v - u) * heightAtVertex(left, near + 1) + u * southeast;
}

function surface(rgb: readonly [number, number, number]) {
  const result = new StandardMaterial();
  result.diffuse = new Color(...rgb);
  result.gloss = .14;
  result.update();
  return result;
}

function terrain(app: Application) {
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  const row = xExtent * 2 + 1;
  for (let z = back; z <= front; z++) {
    for (let x = -xExtent; x <= xExtent; x++) {
      positions.push(x, heightAtVertex(x, z), z);
      const variation = .5 + .22 * Math.sin(x * .6 + z * .44) + .18 * Math.cos(x * .83 - z * .65)
        + .1 * Math.sin(x * 2.68 + z * 1.93);
      const path = (1 - math.smoothstep(.7, 1.95, Math.abs(x - .5 * Math.sin(z * .28))))
        * math.smoothstep(-19, -10, z);
      const gravel = 1 - math.smoothstep(.2, 1.4, Math.abs(z - brookZ - .24 * Math.sin(x * .65)));
      const scrub = [108 + 29 * variation, 115 + 26 * variation, 70 + 22 * variation];
      const track = [165 + 15 * variation, 134 + 14 * variation, 89 + 11 * variation];
      const channel = [105 + 16 * variation, 101 + 12 * variation, 85 + 12 * variation];
      for (let i = 0; i < 3; i++) {
        const tone = math.lerp(math.lerp(scrub[i], track[i], path), channel[i], gravel);
        // StandardMaterial takes vertex colours in linear space.
        colors.push(Math.round(255 * (tone / 255) ** 2.2));
      }
      colors.push(255);
      if (z === front || x === xExtent) continue;
      const i = (z - back) * row + x + xExtent;
      indices.push(i, i + row, i + row + 1, i, i + row + 1, i + 1);
    }
  }
  const mesh = new Mesh(app.graphicsDevice);
  mesh.setPositions(positions);
  mesh.setIndices(indices);
  mesh.setNormals(calculateNormals(positions, indices));
  mesh.setColors32(colors);
  mesh.update();
  const ground = surface([1, 1, 1]);
  ground.diffuseVertexColor = true;
  ground.update();
  const entity = new Entity('Elah terrain');
  entity.addComponent('render', { meshInstances: [new MeshInstance(mesh, ground)], castShadows: false });
  app.root.addChild(entity);
}

function addScrub(app: Application) {
  const positions: number[] = [];
  const indices: number[] = [];
  for (let i = 0; i < 112; i++) {
    const x = (i % 2 ? 1 : -1) * (2.1 + (i * 41 % 113) * .118);
    const z = 14 - (i * 59 % 113) * .37;
    if (Math.abs(z - brookZ) < 1.25) continue;
    const y = groundHeight(x, z);
    for (let blade = 0; blade < 5; blade++) {
      const angle = i * 1.97 + blade * 1.26;
      const spread = .11 + .03 * (blade % 3);
      const tipHeight = .19 + .034 * ((i + blade) % 5);
      const start = positions.length / 3;
      const dx = Math.cos(angle);
      const dz = Math.sin(angle);
      positions.push(x + dz * .058, y, z - dx * .058, x - dz * .058, y, z + dx * .058,
        x + spread * dx, y + tipHeight, z + spread * dz);
      indices.push(start, start + 1, start + 2, start + 2, start + 1, start);
    }
  }
  const mesh = new Mesh(app.graphicsDevice);
  mesh.setPositions(positions);
  mesh.setIndices(indices);
  // Opposite faces share vertices, so assign upward normals for an even response to the sun.
  mesh.setNormals(Array.from(positions, (_, index) => index % 3 === 1 ? 1 : 0));
  mesh.update();
  const scrub = new Entity('Elah scrub');
  scrub.addComponent('render', { meshInstances: [new MeshInstance(mesh, surface([.36, .38, .19]))], castShadows: false });
  app.root.addChild(scrub);
}

export async function buildElah(app: Application, options: { goliathUrl?: string; externalChallenge?: boolean; playableBattle?: boolean } = {}) {
  terrain(app);
  addScrub(app);
  const clay = surface([.54, .33, .24]);
  const linen = surface([.79, .65, .43]);
  const cloth = surface([.39, .43, .29]);
  const stone = surface([.52, .46, .39]);
  const limestone = surface([.69, .61, .48]);
  const leather = surface([.27, .19, .14]);
  const bronze = surface([.55, .39, .22]);
  const skin = surface([.57, .38, .28]);

  function shape(parent: Entity, name: string, type: 'box' | 'sphere' | 'cylinder' | 'cone',
    material: StandardMaterial, position: [number, number, number], size: [number, number, number],
    angles: [number, number, number] = [0, 0, 0], shadow = false) {
    const part = new Entity(name);
    part.addComponent('render', { type, material, castShadows: shadow, receiveShadows: true });
    parent.addChild(part);
    part.setLocalPosition(...position);
    part.setLocalScale(...size);
    part.setLocalEulerAngles(...angles);
    return part;
  }

  function site(name: string, x: number, z: number, turn = 0) {
    const entity = new Entity(name);
    app.root.addChild(entity);
    entity.setPosition(x, groundHeight(x, z), z);
    entity.setEulerAngles(0, turn, 0);
    return entity;
  }

  function figure(name: string, x: number, z: number, height: number, tunic: StandardMaterial) {
    const actor = site(name, x, z);
    actor.setLocalScale(height, height, height);
    const legs: Entity[] = [];
    const arms: Entity[] = [];
    for (const side of [-1, 1]) {
      const hip = new Entity('Hip');
      actor.addChild(hip);
      hip.setLocalPosition(side * .10, .44, 0);
      shape(hip, 'Leg', 'box', leather, [0, -.21, 0], [.10, .43, .112], [0, 0, side * 4]);
      shape(hip, 'Boot', 'box', leather, [side * .02, -.396, .037], [.115, .087, .19]);
      legs.push(hip);
      const shoulder = new Entity('Shoulder');
      actor.addChild(shoulder);
      shoulder.setLocalPosition(side * .18, .735, 0);
      shape(shoulder, 'Sleeve', 'box', tunic, [0, -.085, 0], [.107, .20, .128], [0, 0, side * 12]);
      shape(shoulder, 'Forearm', 'box', skin, [side * .03, -.22, .043], [.075, .16, .085], [-18, 0, 0]);
      arms.push(shoulder);
    }
    shape(actor, 'Tunic', 'box', tunic, [0, .54, 0], [.26, .29, .18], [0, 0, 0], true);
    shape(actor, 'Head', 'sphere', skin, [0, .885, .015], [.153, .17, .146], [0, 0, 0], true);
    shape(actor, 'Helmet', 'sphere', leather, [0, .948, -.016], [.19, .135, .187], [0, 0, 0], true);
    return { actor, legs, arms };
  }

  const champion = await loadGoliath(app, options.goliathUrl);
  const shieldBearer = figure('Shield-bearer', bearer.x, bearer.z, 1.76, clay);
  shape(shieldBearer.arms[0], 'Shield', 'cylinder', leather, [.10, -.175, .16], [.39, .042, .55], [90, 0, -10], true);
  shape(shieldBearer.arms[0], 'Shield boss', 'sphere', bronze, [.10, -.175, .191], [.1, .1, .05]);
  const retreat = [{
    ...shieldBearer, start: bearer, end: { x: 5.6, z: -18.8 }, delay: .15, turn: 0, bend: 1.8,
  }];

  for (const side of [-1, 1]) {
    const camp = side < 0 ? 'Israelite camp' : 'Philistine camp';
    const fabric = side < 0 ? linen : clay;
    for (let i = 0; i < 3; i++) {
      const x = side * (4.45 + i * (side < 0 ? 1.32 : 1.08));
      const z = -18.5 - i * (side < 0 ? 2.05 : 2.5);
      const tent = site(camp + ' shelter', x, z, side * (12 + i * 11));
      shape(tent, 'Shelter opening', 'box', leather, [0, .48, -.12], [1.18, .97, 1.7]);
      shape(tent, 'Left roof', 'box', fabric, [-.41, .91, 0], [1.09, .075, 2.06], [0, 0, 36]);
      shape(tent, 'Right roof', 'box', fabric, [.41, .91, 0], [1.09, .075, 2.06], [0, 0, -36]);
    }
    for (let i = 0; i < 3; i++) {
      const start = { x: side * (4.25 + i * .8), z: -16.6 - i * .63 };
      if (side > 0) {
        const runner = figure(camp + ' soldier ' + (i + 1), start.x, start.z, 1.65 + .06 * i, clay);
        const turn = -18;
        runner.actor.setEulerAngles(0, turn, 0);
        shape(runner.arms[1], 'Spear', 'box', leather, [.055, .06, .12], [.022, 1.36, .023], [0, 0, -10]);
        retreat.push({ ...runner, start, end: { x: 9.7 + i * 1.2, z: -26.4 - i * 1.5 },
          delay: .32 + .22 * i, turn, bend: -.25 });
        continue;
      }
      const guard = site(camp + ' silhouette', start.x, start.z, side * -18);
      const fabric = side < 0 ? cloth : clay;
      shape(guard, 'Body', 'box', fabric, [0, .67, 0], [.42, 1.33, .25]);
      shape(guard, 'Head', 'sphere', leather, [0, 1.47, 0], [.25, .29, .24]);
      shape(guard, 'Spear', 'box', leather, [.29, 1.05, .1], [.04, 2.1, .04], [0, 0, -6]);
    }
  }

  for (let i = 0; i < 21; i++) {
    const x = (i - 10) * .81;
    const z = brookZ + .5 * Math.sin(i * 2.17);
    shape(app.root, 'Brook gravel', 'sphere', i % 3 ? stone : limestone,
      [x, groundHeight(x, z) + .012, z], [.12 + .16 * (i % 4) / 3, .07, .15], [0, i * 37, 9]);
  }
  for (let i = 0; i < 24; i++) {
    const x = (i % 2 ? 1 : -1) * (2.7 + (i * 7 % 19) * .47);
    const z = 13 - i * 1.37;
    shape(app.root, 'Limestone outcrop', 'sphere', i % 3 ? limestone : stone,
      [x, groundHeight(x, z) + .07, z], [.42 + (i % 4) * .18, .19 + (i % 5) * .08, .38], [12, i * 47, -15]);
  }

  for (const [name, anchor] of Object.entries(elahAnchors)) site(name, anchor.x, anchor.z);

  const sky = new Color(.63, .71, .72);
  app.scene.ambientLight = new Color(.35, .39, .43);
  app.scene.fog.type = FOG_LINEAR;
  app.scene.fog.color = sky;
  app.scene.fog.start = 19;
  app.scene.fog.end = 65;
  const sun = new Entity('Late-afternoon sun');
  sun.addComponent('light', {
    type: 'directional', color: new Color(1, .91, .76), intensity: 1.42,
    castShadows: true, shadowResolution: 1024, shadowDistance: 16, normalOffsetBias: .018,shadowBias:.035,
  });
  sun.setEulerAngles(38, -43, 0);
  app.root.addChild(sun);
  const skyFill=new Entity('Elah sky bounce');skyFill.addComponent('light',{type:'directional',color:new Color(.72,.83,1),intensity:.25,castShadows:false});skyFill.setEulerAngles(65,135,0);app.root.addChild(skyFill);

  const camera = new Entity('Follow camera');
  camera.addComponent('camera', { fov: 52, nearClip: .05, farClip: 85, clearColor: sky });
  app.root.addChild(camera);
  const walls: WallBounds[] = options.playableBattle ? duelWalls : [
    { minX: -13, maxX: -8.3, minZ: -17, maxZ: 15 },
    { minX: 8.3, maxX: 13, minZ: -17, maxZ: 15 },
    { minX: -13, maxX: 13, minZ: -17, maxZ: -14.4 },
    { minX: -13, maxX: 13, minZ: 12.8, maxZ: 15 },
  ];
  const obstacles = options.playableBattle ? walls : [...walls,
    { minX: bearer.x - .46, maxX: bearer.x + .31, minZ: bearer.z - .19, maxZ: bearer.z + .32 },
  ];
  const warning = surface([.72, .21, .075]);
  warning.emissive = new Color(.30, .08, .025);
  warning.opacity = .65;
  warning.blendType = BLEND_NORMAL;
  warning.depthWrite = false;
  warning.update();
  const lane = Array.from({ length: 7 }, (_, i) => shape(app.root, 'Spear warning ' + i, 'box', warning,
    [0, 0, 0], [1, .019, 1]));
  const slingStone = surface([.91, .86, .70]);
  slingStone.emissive = new Color(.42, .35, .21);
  slingStone.update();
  const projectile = shape(app.root, 'Sling stone', 'sphere', slingStone, [0, 0, 0], [.091, .091, .091]);
  const tracer = shape(app.root, 'Stone trail', 'box', slingStone, [0, 0, 0], [.04, .04, .58]);
  const cord = shape(app.root, 'Sling cord', 'box', leather, [0, 0, 0], [.022, .022, 1]);
  const pocket = shape(app.root, 'Sling pouch', 'sphere', leather, [0, 0, 0], [.123, .038, .108]);
  const spearWood=surface([.53,.32,.13]);spearWood.emissive=new Color(.11,.065,.025);spearWood.update();
  const flyingShaft=shape(app.root,'Thrown spear shaft','cylinder',spearWood,[0,0,0],[.05,1,.05]);
  const iron=surface([.77,.83,.84]);iron.emissive=new Color(.16,.20,.22);iron.update();
  const flyingHead=shape(app.root,'Thrown spear head','cone',iron,[0,0,0],[.12,.26,.12]);
  const trailMat=surface([.9,.87,.65]);trailMat.emissive=new Color(.38,.34,.19);trailMat.opacity=.65;trailMat.blendType=BLEND_NORMAL;trailMat.depthWrite=false;trailMat.update();
  const flightTrail=shape(app.root,'Spear flight trail','cylinder',trailMat,[0,0,0],[.027,1,.027]);
  const landing=shape(app.root,'Spear landing warning','cylinder',warning,[0,0,0],[1.0,.025,1.0]);
  const dustMaterial=surface([.64,.53,.37]);dustMaterial.opacity=.38;dustMaterial.blendType=BLEND_NORMAL;dustMaterial.depthWrite=false;dustMaterial.update();
  const dust=Array.from({length:9},(_,i)=>shape(app.root,'Weapon earth impact '+i,'sphere',dustMaterial,[0,0,0],[.05,.05,.05]));
  let dustAge=2,dustPoint:Point3|undefined,lastGround:Point3|undefined;
  const rear = new Vec3();
  let distanceWalked = 0;
  let lastFoe = { ...goliath };

  function stageRetreat(elapsed: number) {
    for (const runner of retreat) {
      const time = Math.max(0, elapsed - runner.delay);
      const t = Math.min(1, time / (retreatDuration - runner.delay));
      const bend = runner.bend * Math.sin(t * Math.PI);
      const x = math.lerp(runner.start.x, runner.end.x, t);
      const z = math.lerp(runner.start.z, runner.end.z, t) + bend;
      const phase = time * 13;
      const motion = math.smoothstep(0, .22, time) * (1 - math.smoothstep(.89, 1, t));
      const angle = Math.atan2(runner.end.x - runner.start.x,
        runner.end.z - runner.start.z + runner.bend * Math.PI * Math.cos(t * Math.PI)) * math.RAD_TO_DEG;
      runner.actor.setPosition(x, groundHeight(x, z) + .08 * Math.abs(Math.sin(phase)) * motion, z);
      runner.actor.setEulerAngles(12 * motion, math.lerp(runner.turn, angle, math.smoothstep(0, .24, time)), 0);
      for (let i = 0; i < 2; i++) {
        const stride = Math.sin(phase + i * Math.PI) * motion;
        runner.legs[i].setLocalEulerAngles(44 * stride, 0, 0);
        runner.arms[i].setLocalEulerAngles(-28 * stride - 12 * motion, 0, 0);
      }
    }
  }

  let posedState:SpearPoseState|undefined,posedFrame=-1,posedSpear:SpearSample|undefined;
  function poseChampion(state:SpearPoseState,dt:number):SpearSample {
    if(posedState===state&&posedFrame===state.poseFrame&&posedSpear)return posedSpear;
    const { foe, foeYaw, attackYaw, attack, attackTime, phase, time } = state;
    const fallen = phase === 'retreat' || phase === 'victory' || fallenPhase(phase);
    const active = phase === 'fight';
    const telegraph = active && attack === 'windup';
    const thrusting = active && attack === 'strike';
    const walked = active ? Math.hypot(foe.x - lastFoe.x, foe.z - lastFoe.z) : 0;
    distanceWalked += walked;
    lastFoe = { ...foe };
    champion.model.setPosition(foe.x, groundHeight(foe.x, foe.z), foe.z);
    champion.model.setEulerAngles(0, (telegraph||thrusting?attackYaw:foeYaw) * math.RAD_TO_DEG, 0);
    const swordStage=state.cinematicCombat&&state.combatStage==='sword';
    champion.heldWeapon(!swordStage&&!fallen&&phase!=='stagger'&&phase!=='fall'&&phase!=='finisher'&&!(state.ranged&&state.spear));
    champion.heldSword(!!swordStage&&(attack!=='advance')&&(attack!=='draw'||attackTime>.55));
    if(swordStage&&(active||phase==='defeat')){
      if(attack==='draw')champion.pose('goliath_draw_sword',attackTime,dt);
      else if(attack==='advance')champion.pose(walked>.001?'goliath_advance':'goliath_ready',walked>.001?(distanceWalked%1.84)/1.84*(32/24):time%2.083,dt);
      else champion.pose('goliath_sword_strike',telegraph?attackTime/swordTiming.windup*(26/24):thrusting?26/24+attackTime:phase==='defeat'?26/24+(state.impactAttackTime??0):26/24+swordTiming.strike+attackTime,dt);
    }else if(phase==='stagger'){champion.pose('goliath_stagger',time,dt);
    }else if(phase==='finisher'){champion.pose(time>=decisiveReplay.impact?'goliath_hit':'goliath_ready',time>=decisiveReplay.impact?time-decisiveReplay.impact:time%2.083,dt);
    }else if(state.ranged&&active&&attack==='recover'){champion.pose('goliath_ready',time%2.083,dt);
    }else if(state.ranged&&active&&attack!=='advance'&&attack!=='exposed'){champion.pose('goliath_throw',telegraph?attackTime/spearPatterns[state.attackIndex].windup:1+attackTime,dt);
    }else if(phase==='entrance'){champion.pose(time<4.5?'goliath_advance':'goliath_ready',time<4.5?(time*1.03)%1.333:time%2.083,dt);
    } else if (phase === 'approach') {
      distanceWalked = 0;
      champion.pose('goliath_ready', 0, 0, true);
    } else if (phase === 'fall' || fallen) {
      champion.pose(state.cinematicCombat?'goliath_heavy_fall':'goliath_fall', fallen ? state.cinematicCombat?heavyFallDuration:fallDuration : time, dt);
    } else if(active&&attack==='exposed'){champion.pose('goliath_ready',time%2.083,dt);
    } else if ((active && attack !== 'advance') || phase === 'defeat') {
      const spearTime = telegraph ? state.dodgesRequired?attackTime/spearPatterns[state.attackIndex].windup*spearWindup:attackTime : thrusting ? spearWindup + attackTime
        : phase === 'defeat' ? spearWindup + (state.impactAttackTime??0) + Math.min(.20,time*.3)
          : spearWindup + spearStrike + attackTime;
      const clip=state.dodgesRequired?(['goliath_spear_1','goliath_spear_2','goliath_spear_3']as const)[state.attackIndex]:'goliath_spear';champion.pose(clip,spearTime,dt);
    } else if (phase === 'challenge' && options.externalChallenge) {
      // The produced exchange owns the champion pose; avoid two controllers per frame.
    } else if (phase === 'challenge' && time < 2.8) {
      champion.pose('goliath_challenge', time, dt);
    } else if (walked > .001) {
      champion.pose('goliath_advance', (distanceWalked % 1.84) / 1.84 * (32 / 24), dt);
    } else {
      champion.pose('goliath_ready', time % 2.083, dt);
    }
    posedState=state;posedFrame=state.poseFrame;
    posedSpear={grip:copyPoint(champion.grip.getPosition()),tip:copyPoint(champion.tip.getPosition())};return posedSpear;
  }
  function sampleSword(state:SpearPoseState,dt:number):SpearSample{
    poseChampion(state,dt);
    if(!champion.swordGrip||!champion.swordTip)throw new Error('The duel model is missing its rendered blade markers');
    return{grip:copyPoint(champion.swordGrip.getPosition()),tip:copyPoint(champion.swordTip.getPosition())};
  }
  function renderBattle(state: ElahBattleState, dt: number, sling?: { grip: Vec3; pouch: Vec3 }) {
    poseChampion(state,dt);
    const {foe,attackYaw,attack,phase,time,shot}=state,fallen=phase==='retreat'||phase==='victory';
    const telegraph=phase==='fight'&&attack==='windup',thrusting=phase==='fight'&&attack==='strike';
    if (fallen || phase === 'approach') stageRetreat(phase === 'victory' ? retreatDuration : phase === 'retreat' ? time : 0);

    const swordStage=state.cinematicCombat&&state.combatStage==='sword';
    const rangedWarning=state.cinematicCombat&&state.combatStage!=='sword';
    const showLane = (!state.ranged||swordStage||rangedWarning) && phase === 'fight' && (telegraph || thrusting);
    const length = (rangedWarning&&state.aimLock?Math.hypot(state.aimLock.x-foe.x,state.aimLock.z-foe.z):strikeReach + playerRadius) / lane.length;
    const dx = Math.sin(attackYaw);
    const dz = Math.cos(attackYaw);
    lane.forEach((tile, i) => {
      tile.enabled = showLane;
      if (!showLane) return;
      const x = foe.x + dx * length * (i + .5);
      const z = foe.z + dz * length * (i + .5);
      const rise = groundHeight(x + dx * length * .5, z + dz * length * .5)
        - groundHeight(x - dx * length * .5, z - dz * length * .5);
      tile.setPosition(x, groundHeight(x, z) + .049, z);
      tile.setEulerAngles(-Math.atan2(rise, length) * math.RAD_TO_DEG, attackYaw * math.RAD_TO_DEG, 0);
      tile.setLocalScale(rangedWarning?.15:swordStage?1.1:2 * ((state.dodgesRequired?spearPatterns[state.attackIndex].width:strikeHalfWidth) + playerRadius), .02, length * (rangedWarning?.55:.95));
    });

    const flight=state.ranged?state.spear:undefined;
    flyingShaft.enabled=flyingHead.enabled=!!flight;flightTrail.enabled=!!flight&&!flight.landed&&phase==='fight';
    if(flightTrail.enabled){const a=thrownSpearSample(flight!,Math.max(0,flight!.time-.15)).tip,b=flight!.sample.tip,from=new Vec3(a.x,a.y,a.z),to=new Vec3(b.x,b.y,b.z);flightTrail.setPosition(new Vec3().lerp(from,to,.5));flightTrail.lookAt(to);flightTrail.rotateLocal(-90,0,0);flightTrail.setLocalScale(.027,Math.max(.01,from.distance(to)),.027);}
    if(flight){const parts=spearSegments(flight.sample),shaft=parts[0],head=parts[1],a=new Vec3(shaft.a.x,shaft.a.y,shaft.a.z),b=new Vec3(shaft.b.x,shaft.b.y,shaft.b.z);flyingShaft.setPosition(new Vec3().lerp(a,b,.5));flyingShaft.lookAt(b);flyingShaft.rotateLocal(-90,0,0);flyingShaft.setLocalScale(.045,a.distance(b),.045);a.set(head.a.x,head.a.y,head.a.z);b.set(head.b.x,head.b.y,head.b.z);flyingHead.setPosition(new Vec3().lerp(a,b,.5));flyingHead.lookAt(b);flyingHead.rotateLocal(-90,0,0);flyingHead.setLocalScale(.119,a.distance(b),.119);}
    landing.enabled=!!state.ranged&&phase==='fight'&&!!state.aimLock&&(telegraph||thrusting);
    if(landing.enabled){const p=state.aimLock!;landing.setPosition(p.x,groundHeight(p.x,p.z)+.035,p.z);}
    cord.enabled = !!sling && (shot?.kind === 'windup'||phase==='finisher');
    pocket.enabled = cord.enabled;
    projectile.enabled = !!shot;
    tracer.enabled = shot?.kind === 'flight';
    if ((shot?.kind === 'windup'||phase==='finisher') && sling) {
      const { grip, pouch } = sling;
      projectile.setPosition(pouch);
      pocket.setPosition(pouch.x, pouch.y - .035, pouch.z);
      cord.setPosition(rear.lerp(grip, pouch, .5));
      cord.lookAt(pouch);
      cord.setLocalScale(.022, .022, grip.distance(pouch));
    } else if (shot?.kind === 'flight') {
      projectile.setPosition(shot.position);
      // Minimum screen presence for readability; the swept collision radius stays unchanged.
      const size=Math.max(.105,Math.min(.23,6*2*camera.getPosition().distance(projectile.getPosition())*Math.tan(camera.camera!.fov*Math.PI/360)/Math.max(1,app.graphicsDevice.canvas.clientHeight)));
      projectile.setLocalScale(size,size,size);
      rear.copy(shot.position).addScaled(shot.velocity, -.026);
      tracer.setPosition(rear);
      tracer.lookAt(shot.position);
    }
    if(shot?.kind!=='flight')projectile.setLocalScale(.105,.105,.105);
    if(phase==='finisher'&&state.decisiveThrow){
      const replay=state.decisiveThrow,u=math.clamp((time-decisiveReplay.release)/(decisiveReplay.impact-decisiveReplay.release),0,1);
      projectile.enabled=time>=decisiveReplay.release&&time<decisiveReplay.duration;
      tracer.enabled=projectile.enabled&&time<decisiveReplay.impact;
      const p=time>=decisiveReplay.impact?replay.impact:stoneAt(replay.origin,replay.velocity,replay.flightSeconds*u);
      projectile.setPosition(p.x,p.y,p.z);tracer.setPosition(p.x-replay.velocity.x*.01,p.y,p.z-replay.velocity.z*.01);tracer.lookAt(p.x,p.y,p.z);
    }
    const groundImpact=state.spear?.landed?state.spear.landing:state.swordGround;
    if(groundImpact&&lastGround!==groundImpact){dustAge=0;dustPoint=groundImpact;}lastGround=groundImpact;dustAge+=dt;
    dust.forEach((e,i)=>{e.enabled=!!dustPoint&&dustAge<.8&&phase==='fight';if(e.enabled){const a=i*2.39996,r=.08+dustAge*(.4+i*.07),size=.04+Math.sin(Math.PI*dustAge/.8)*(.09+i*.008);e.setPosition(dustPoint!.x+Math.cos(a)*r,dustPoint!.y+.04+Math.sin(Math.PI*dustAge/.8)*.24,dustPoint!.z+Math.sin(a)*r);e.setLocalScale(size,size*.6,size);}});
  }

  function battleObstacles(state: ElahBattleState) {
    if (state.phase === 'fall' || state.phase === 'retreat' || state.phase === 'victory' || fallenPhase(state.phase)) return obstacles;
    const { x, z } = state.foe;
    return [...obstacles, { minX: x - .45, maxX: x + .45, minZ: z - .32, maxZ: z + .32 }];
  }
  function stoneObstacles(){const{x,z}=champion.model.getPosition();return[...obstacles,{minX:x-.45,maxX:x+.45,minZ:z-.32,maxZ:z+.32}];}
  return { camera, walls, groundHeight, anchors: elahAnchors, goliath, brookZ, champion, poseChampion, sampleSword, renderBattle, battleObstacles,
    stoneObstacles,
    retreatFocus: shieldBearer.actor };
}
