import {
  BLEND_NORMAL, BUFFER_DYNAMIC, CULLFACE_FRONT, CULLFACE_NONE, Color, Entity, Mat4, Mesh, MeshInstance, Quat, StandardMaterial,
  Texture, Vec3, VertexBuffer, VertexFormat, calculateNormals, type Application, type ContainerResource, type RenderComponent,
} from 'playcanvas';
import { buildElah } from './elah-area';
import { duelField, duelRankFrontX } from '../gameplay/duel-field';
import { loadConversationActor } from './conversation-actor';
import saulUrl from '../assets/saul.glb?url';
import soldierUrl from '../assets/soldier-standing-lod.glb?url';

export const valleyPresentationVersion = 'm3-valley-1';
export const overlook = { x: 0, z: 8.2 };
type Placement = { x: number; y: number; z: number; sx: number; sy: number; sz: number; yaw?: number; roll?: number; pitch?: number };

export async function buildValleyOpening(app: Application, options: { goliathUrl?: string; actorUrl?: string; playableBattle?: boolean; externalChallenge?: boolean } = {}) {
  const area = await buildElah(app, options);
  // Exaggerate only the distant ridges; the playable approach/collision surface is unchanged.
  const groundHeight=(x:number,z:number)=>{
    const depth=Math.max(0,Math.min(1,(-z-(options.playableBattle ? 18 : 8))/10));
    const shelf = options.playableBattle ? 2.2 * Math.max(0, Math.min(1, (Math.abs(x) - 14) / 3))
      * Math.exp(-(((Math.abs(x) - 19) / 5.5) ** 2 + ((z + 17) / 16) ** 2)) : 0;
    return area.groundHeight(x,z)*(1+.45*depth)+1.5*depth*(1-Math.exp(-x*x/20))+shelf;
  };
  // Retain the tested ground-height surface and champion, replacing this scene's old presentation.
  for (const child of [...app.root.children]) {
    if (child === area.camera || child === area.champion.model || (child instanceof Entity && child.light)) continue;
    child.enabled = false;
  }
  const root = new Entity('Valley opening environment'); app.root.addChild(root);
  const skyCanvas = document.createElement('canvas'); skyCanvas.width = 512; skyCanvas.height = 256;
  const skyContext = skyCanvas.getContext('2d')!;
  const skyGradient = skyContext.createLinearGradient(0,0,0,256);
  skyGradient.addColorStop(0,'#7ca8c1'); skyGradient.addColorStop(.48,'#a3c3d3'); skyGradient.addColorStop(.5,'#e4d3b0'); skyGradient.addColorStop(.52,'#a3c3d3'); skyGradient.addColorStop(1,'#7ca8c1');
  skyContext.fillStyle = skyGradient; skyContext.fillRect(0,0,512,256);
  for (let i=0;i<38;i++) { skyContext.fillStyle='rgba(250,244,219,.10)'; skyContext.beginPath(); skyContext.ellipse((i*113)%512,35+(i*31)%67,34+i%4*13,2+i%5,0,0,Math.PI*2); skyContext.fill(); }
  const skyTexture = new Texture(app.graphicsDevice,{name:'Original painted afternoon sky',mipmaps:true}); skyTexture.setSource(skyCanvas);
  const skyMaterial = new StandardMaterial(); skyMaterial.diffuse.set(0,0,0);skyMaterial.emissive.set(1,1,1);skyMaterial.emissiveMap=skyTexture; skyMaterial.useLighting=false; skyMaterial.useFog=false; skyMaterial.cull=CULLFACE_FRONT; skyMaterial.update();
  const skyDome = new Entity('Afternoon sky'); skyDome.addComponent('render',{type:'sphere',material:skyMaterial,castShadows:false}); skyDome.setLocalScale(220,220,220); root.addChild(skyDome);
  function surface(name: string, rgb: [number, number, number], texture?: Texture) {
    const mat = new StandardMaterial(); mat.name = name; mat.diffuse = new Color(...rgb);
    mat.gloss = .08; if (texture) mat.diffuseMap = texture; mat.update(); return mat;
  }
  let seed = 173;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  function texture(name: string, woven = false) {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 128;
    const ctx = canvas.getContext('2d')!; const data = ctx.createImageData(128, 128);
    for (let i = 0; i < 128 * 128; i++) {
      const grain = woven ? (i % 128 % 4 === 0 || Math.floor(i / 128) % 4 === 0 ? 16 : -5) : random() * 25+7*Math.sin((i%128)*.23)*Math.cos(Math.floor(i/128)*.31);
      const colour = 218 + grain + random() * 6;
      data.data.set([colour, colour, colour, 255], i * 4);
    }
    ctx.putImageData(data, 0, 0);
    const result = new Texture(app.graphicsDevice, { name, mipmaps: true }); result.setSource(canvas); return result;
  }
  const mineral = texture('Original limestone grain');
  const weave = texture('Original camp fabric', true);
  const sand = surface('Dry Elah terrain', [1, 1, 1], mineral); sand.diffuseVertexColor = true; sand.update();
  const limestone = surface('Weathered limestone', [.64, .56, .42], mineral);
  const canvas = surface('Israelite woven linen', [.71, .61, .43], weave); canvas.cull = CULLFACE_NONE; canvas.update();
  const red = surface('Philistine woven clay cloth', [.44, .24, .15], weave); red.cull = CULLFACE_NONE; red.update();
  const wood = surface('Dark acacia timber', [.22, .135, .075]);
  const bronze = surface('Worked bronze', [.43, .29, .13]); bronze.gloss = .3; bronze.update();
  const olive = surface('Olive leaf', [.26, .31, .12]);
  const earth = surface('Shepherd leather', [.23, .13, .065]);

  const positions: number[] = [], indices: number[] = [], colours: number[] = [], uvs: number[] = [];
  const width = 101;
  for (let z = -75; z <= 25; z++) for (let x = -50; x <= 50; x++) {
    positions.push(x, groundHeight(x, z), z); uvs.push(x * .4, z * .4);
    const grain = Math.sin(x * .59 + z * .33) * .5 + Math.cos(z * .57 - x * .44) * .3;
    const track = Math.max(0, 1 - Math.abs(x - .35 * Math.sin(z * .23)) / 1.65) * (z > -12 ? 1 : 0);
    const brook = Math.max(0, 1 - Math.abs(z + 2.8 + .24 * Math.sin(x * .65)) / 1.2);
    const rgb = [.55 + grain * .035 + track * .09 - brook * .10, .46 + grain * .04 + track * .04 - brook * .055, .30 + grain * .025 + track * .015 + brook * .005];
    if (options.playableBattle) {
      const edge = Math.min(x - duelField.minX, duelField.maxX - x, z - duelField.minZ, duelField.maxZ - z);
      const clearing = Math.max(0, Math.min(1, (edge + 1.2) / 2.4));
      rgb[0] += .028 * clearing; rgb[1] += .022 * clearing; rgb[2] += .014 * clearing;
      const wornEdge = Math.max(0, 1 - Math.abs(edge) / 1.15);
      rgb[0] -= .07 * wornEdge; rgb[1] -= .065 * wornEdge; rgb[2] -= .032 * wornEdge;
    }
    colours.push(...rgb, 1);
    if (x < 50 && z < 25) { const i = (z + 75) * width + x + 50; indices.push(i, i + width, i + width + 1, i, i + width + 1, i + 1); }
  }
  const ground = new Mesh(app.graphicsDevice); ground.setPositions(positions); ground.setIndices(indices);
  ground.setNormals(calculateNormals(positions, indices)); ground.setColors(colours); ground.setUvs(0, uvs); ground.update();
  const terrain = new Entity('Limestone and ochre valley'); terrain.addComponent('render', { meshInstances: [new MeshInstance(ground, sand)], castShadows: false }); root.addChild(terrain);
  const waterMaterial=surface('Shallow brook water',[.28,.39,.35]);waterMaterial.opacity=.65;waterMaterial.blendType=BLEND_NORMAL;waterMaterial.depthWrite=false;waterMaterial.gloss=.6;waterMaterial.update();
  const waterPositions:number[]=[],waterIndices:number[]=[];
  for(let i=0;i<=60;i++){
    const x=-15+i*.5,z=-2.8-.24*Math.sin(x*.65),y=groundHeight(x,z)+.025;
    waterPositions.push(x,y,z-.15,x,y,z+.15);
    if(i<60){const n=i*2;waterIndices.push(n,n+2,n+3,n,n+3,n+1);}
  }
  const waterMesh=new Mesh(app.graphicsDevice);waterMesh.setPositions(waterPositions);waterMesh.setIndices(waterIndices);waterMesh.setNormals(calculateNormals(waterPositions,waterIndices));waterMesh.update();
  const water=new Entity('Brook through Elah');water.addComponent('render',{meshInstances:[new MeshInstance(waterMesh,waterMaterial)],castShadows:false});root.addChild(water);

  const vertexBufferDisposals: VertexBuffer[] = [];
  const q = new Quat(), p = new Vec3(), s = new Vec3(), matrix = new Mat4();
  function fill(data: Float32Array, placements: Placement[]) {
    placements.forEach((at, i) => {
      q.setFromEulerAngles(at.pitch ?? 0, at.yaw ?? 0, at.roll ?? 0);
      matrix.setTRS(p.set(at.x, at.y, at.z), q, s.set(at.sx, at.sy, at.sz)); data.set(matrix.data, i * 16);
    });
  }
  function batch(name: string, kind: 'box' | 'sphere' | 'cylinder' | 'cone', material: StandardMaterial, placements: Placement[], dynamic = false) {
    const entity = new Entity(name); entity.addComponent('render', { type: kind, material, castShadows: false }); root.addChild(entity);
    const data = new Float32Array(placements.length * 16); fill(data, placements);
    const buffer = new VertexBuffer(app.graphicsDevice, VertexFormat.getDefaultInstancingFormat(app.graphicsDevice), placements.length,
      { data, ...(dynamic ? { usage: BUFFER_DYNAMIC } : {}) });
    entity.render!.meshInstances[0].setInstancing(buffer, false); vertexBufferDisposals.push(buffer);
    return { update(next: Placement[]) { fill(data, next); buffer.setData(data); }, entity };
  }
  function at(x: number, z: number, y: number, sx: number, sy: number, sz: number, yaw = 0): Placement {
    return { x, y: groundHeight(x, z) + y, z, sx, sy, sz, yaw };
  }
  const stones: Placement[] = [], grasses: Placement[] = [], trunks: Placement[] = [], crowns: Placement[] = [];
  for (let i = 0; i < 125; i++) {
    const x = (random() < .5 ? -1 : 1) * (2.3 + random() * 29), z = 13 - random() * 66;
    const size = .19 + random() * .95, turn = random() * 360;
    const inClearing = options.playableBattle && Math.abs(x)<duelField.maxX+1 && z>duelField.minZ-1 && z<duelField.maxZ+1;
    if (!inClearing || i % 4 === 0) {
      const scale = inClearing ? size * .42 : size;
      stones.push(at(x, z, scale * .09, scale * 1.35, scale * .54, scale, turn));
    }
  }
  for (let i = 0; i < 120; i++) {
    const x = (random() < .5 ? -1 : 1) * (2.3 + random() * 22), z = 13 - random() * 50;
    grasses.push(at(x, z, .09, .20 + random() * .2, .16, .20 + random() * .2));
  }
  const trees = options.playableBattle ? [[-19, 10], [21, 9.4], [-22, -10], [20, -30], [-23, -32]]
    : [[-7.3, 10], [7.2, 9.4], [-10.5, -10], [13, -26], [-18, -32]];
  for (const [x, z] of trees) {
    trunks.push(at(x, z, .9, .16, 1.8, .18, 9));
    for (let i = 0; i < 4; i++) crowns.push(at(x + (i % 2 ? .5 : -.4), z + (i > 1 ? .35 : -.35), 2.1 + i * .08, 1.35, .68, 1.4));
  }
  batch('Limestone outcrops', 'sphere', limestone, stones);const scrub=batch('Dry valley scrub', 'sphere', olive, grasses,true);let lastBreeze=-1;
  if (options.playableBattle) {
    const markers: Placement[] = [];
    for (const x of [duelField.minX, duelField.maxX]) {
      for (let z = duelField.minZ; z < duelField.maxZ; z += 1.55) {
        markers.push(at(x, z, .095, .38 + random() * .19, .25, .55, random() * 180));
      }
    }
    for (const z of [duelField.minZ, duelField.maxZ]) {
      for (let x = duelField.minX + 1; x < duelField.maxX; x += 1.55) {
        markers.push(at(x, z, .095, .49, .25, .34 + random() * .16, random() * 180));
      }
    }
    batch('Duel field boundary stones', 'sphere', surface('Pale boundary limestone',[.83,.72,.54],mineral), markers);
  }
  batch('Olive trunks', 'cylinder', wood, trunks); batch('Olive canopies', 'sphere', olive, crowns);

  const posts: Placement[] = [], ropes: Placement[] = [], jars: Placement[] = [], shields: Placement[] = [];
  const flags: Array<{ entity: Entity; base: Vec3; phase: number }> = [];
  function tent(x: number, z: number, scale: number, material: StandardMaterial, index: number) {
    const y = groundHeight(x, z);
    const tent = new Entity('Woven army shelter'); root.addChild(tent); tent.setPosition(x, y, z); tent.setLocalScale(scale, scale, scale);
    const vertices = [-1.1, 0, -1.5, 0, 1.75, -1.5, 1.1, 0, -1.5, -1.1, 0, 1.5, 0, 1.75, 1.5, 1.1, 0, 1.5];
    const triangles = [0, 1, 4, 0, 4, 3, 1, 2, 5, 1, 5, 4, 0, 2, 1];
    const mesh = new Mesh(app.graphicsDevice); mesh.setPositions(vertices); mesh.setIndices(triangles);
    mesh.setNormals(calculateNormals(vertices, triangles)); mesh.setUvs(0, [0,0,.5,1,1,0,0,1,.5,0,1,1]); mesh.update();
    tent.addComponent('render', { meshInstances: [new MeshInstance(mesh, material)], castShadows: scale > .95 });
    flags.push({ entity: tent, base: tent.getLocalScale().clone(), phase: index * 1.7 });
    for (const dz of [-1.5, 1.5]) posts.push(at(x, z + dz * scale, .86 * scale, .07, 1.75 * scale, .07));
    for (const side of [-1, 1]) ropes.push(at(x + side * 1.4 * scale, z + 1.7 * scale, .15, .055, .30, .055));
  }
  tent(options.playableBattle ? -19 : -4.3, 11.0, 1.0, canvas, 0);
  tent(options.playableBattle ? 19 : 4.9, 11.2, .95, canvas, 1);
  for (const side of [-1, 1]) for (let i = 0; i < 7; i++) {
    const campX = options.playableBattle ? 21.5 : 8;
    tent(side * (campX + (i % 3) * 2.45), -15.8 - Math.floor(i / 3) * 4.0, .76 + (i % 2) * .1, side < 0 ? canvas : red, i + 2);
  }
  for (const [x,z] of [[-3.0,10.2],[-3.5,10.3],[4.0,11.3]]) jars.push(at(options.playableBattle ? x + Math.sign(x)*15 : x,z,.30,.37,.60,.37));
  const guardX = options.playableBattle ? -duelRankFrontX : 2.9;
  shields.push({ ...at(guardX, 9.3, .45, .68, .055, .86), pitch: 76 });
  batch('Tent poles and guard spears', 'cylinder', wood, [...posts, at(guardX, 9.0, 1.15, .027, 2.3, .027)]);
  batch('Tent stakes', 'cylinder', wood, ropes); batch('Camp water jars', 'sphere', red, jars);
  batch('Guard shield', 'cylinder', earth, shields);
  batch('Guard spearhead', 'cone', bronze, [at(guardX, 9.0, 2.4, .09, .22, .035)]);
  if (!options.playableBattle) batch('Overlook ledge', 'sphere', limestone, [at(0, 7.6, .12, 2.2, .32, .65)]);

  // Baked, clothed low-detail meshes retain the character style without 48 skeletal controllers.
  const soldierResource=await new Promise<ContainerResource>((resolve,reject)=>app.assets.loadFromUrl(soldierUrl,'container',(error,asset)=>{
    if(error||!asset?.resource)reject(new Error('The soldier asset could not load.'));else resolve(asset.resource as ContainerResource);
  }));
  function tintSoldier(entity:Entity,side:number){
    for(const render of entity.findComponents('render') as RenderComponent[])for(const mesh of render.meshInstances){
      if(mesh.material instanceof StandardMaterial&&mesh.material.name==='Cloth'){
        const material=mesh.material.clone();material.diffuse=new Color(...(side<0?[.9,1.05,.7]:[1.8,.68,.43]) as [number,number,number]);material.update();mesh.material=material;
      }
    }
  }
  const ranks = [-1, 1].map(side => {
    const bases = Array.from({ length: 24 }, (_, i) => options.playableBattle
      ? { x: side * (duelRankFrontX + Math.floor(i / 8) * .97 + (i % 8) * .19), z: -12 - (i % 8) * 1.45, phase: i * 1.91 }
      : { x: side * (5.2 + (i % 8) * .73), z: -13.7 - Math.floor(i / 8) * .85, phase: i * 1.91 });
    const entity=soldierResource.instantiateRenderEntity({castShadows:false});entity.name=side<0?'Israelite ranks':'Philistine ranks';root.addChild(entity);tintSoldier(entity,side);
    const data=new Float32Array(bases.length*16);
    const buffer=new VertexBuffer(app.graphicsDevice,VertexFormat.getDefaultInstancingFormat(app.graphicsDevice),bases.length,{data,usage:BUFFER_DYNAMIC});vertexBufferDisposals.push(buffer);
    for(const render of entity.findComponents('render') as RenderComponent[])for(const mesh of render.meshInstances)mesh.setInstancing(buffer,false);
    return {step(time: number, alarm: number, cheer: number) {
      fill(data,bases.map(base => {
        const reaction = side < 0 ? Math.max(0, Math.min(1, (alarm - base.phase % 1 * .28) * 2)) : 0;
        const rise = cheer * Math.max(0, Math.sin(time * 7.5 + base.phase)) ** 2;
        return { ...at(base.x,base.z,rise*.1,.88,.88,.88,side<0?90+reaction*22:-90),
          roll: Math.sin(time*1.6+base.phase)*.35+reaction*2.5,
          pitch: -rise * 9 };
      }));
      buffer.setData(data);
    }};
  });
  const bearer=soldierResource.instantiateRenderEntity({castShadows:true});bearer.name='Champion’s shield-bearer';root.addChild(bearer);tintSoldier(bearer,1);bearer.setLocalScale(.98,.98,.98);
  const bearerX = options.playableBattle ? duelRankFrontX + .4 : -1.45;
  bearer.setPosition(bearerX,groundHeight(bearerX,-9.8),-9.8);
  if (options.playableBattle) bearer.setEulerAngles(0,-90,0);
  // Prime the shared container before cloning a second rig from it.
  const actors = [await loadConversationActor(app, options.actorUrl ?? saulUrl, 'Sentinel')];
  actors.push(await loadConversationActor(app, options.actorUrl ?? saulUrl, 'Patrolling soldier'));
  actors.forEach((actor, i) => {
    actor.model.setLocalScale(.95, .95, .95); actor.tint('Skin', i ? [.86,.86,.82] : [1,1,1]); actor.tint('Eyes',[1,1,1]);
    actor.tint('Cloth', i && !options.playableBattle ? [1.8,.72,.5] : [.9,1.05,.75]); actor.tint('Hair', [.75,.75,.75]);
    for (const render of actor.model.findComponents('render') as RenderComponent[]) if (/Saul beard|Saul moustache|Saul circlet|mantle|Mantle clasp/i.test(render.entity.name)) render.enabled = false;
  });
  const sentinel = actors[0], patrol = actors[1];
  const sun = app.root.children.find(child => child instanceof Entity && child.light?.castShadows) as Entity | undefined;
  if (sun?.light) { sun.light.intensity = 1.4; sun.light.shadowResolution = 1024; sun.light.shadowDistance = 20; sun.light.color = new Color(1,.90,.73); }
  const bounce = new Entity('Warm camp bounce'); bounce.addComponent('light', { type: 'directional', intensity: .55, color: new Color(.83,.89,1) }); bounce.setEulerAngles(22,135,0); root.addChild(bounce);
  app.scene.ambientLight = new Color(.36,.40,.44); app.scene.fog.color = new Color(.65,.70,.70); app.scene.fog.start = 32; app.scene.fog.end = 108;
  area.camera.camera!.farClip = 130; area.camera.camera!.clearColor = new Color(.61,.72,.77);
  const markerMaterial = surface('Overlook marker', [.76,.55,.22]);
  const marker = new Entity('Overlook survey point'); marker.addComponent('render', { type: 'cylinder', material: markerMaterial, castShadows: false });
  marker.setPosition(overlook.x, area.groundHeight(overlook.x, overlook.z) + .025, overlook.z); marker.setLocalScale(.75,.025,.75); root.addChild(marker);
  area.champion.model.setPosition(area.goliath.x,groundHeight(area.goliath.x,area.goliath.z),area.goliath.z);
  app.once('destroy', () => vertexBufferDisposals.forEach(buffer => buffer.destroy()));
  let lastTime=0, patrolTime=0, patrolWalk=0, patrolX=-4, patrolYaw=90;
  function stage(time: number, reacting = false, alarm = 0, automaticActors = true, cheers?: {israel: number; philistines: number}) {
    const dt=Math.max(0,Math.min(.05,time-lastTime)); lastTime=time;
    if(lastBreeze<0||Math.abs(time-lastBreeze)>=1/12){lastBreeze=time;for(let i=0;i<grasses.length;i++){grasses[i].roll=Math.sin(time*1.15+i*.61)*2.6;grasses[i].sy=.14+Math.sin(time*.8+i)*.012;}scrub.update(grasses);}
    ranks.forEach((rank,i) => rank.step(time,alarm,(i===0?cheers?.israel:cheers?.philistines)??0));
    flags.forEach(({ entity, base, phase }) => entity.setLocalScale(base.x * (1 + .007 * Math.sin(time * 1.6 + phase)), base.y * (1 + .009 * Math.sin(time * 2 + phase)), base.z));
    const sentinelX = options.playableBattle ? -duelRankFrontX-.9 : 2.4;
    const sentinelZ = options.playableBattle ? 4.1 : 9.3;
    sentinel.model.setPosition(sentinelX,groundHeight(sentinelX,sentinelZ),sentinelZ); sentinel.model.setEulerAngles(0,options.playableBattle ? 124 : -65,0);
    if (!reacting) patrolTime+=dt;
    const phase=patrolTime%16;
    const smooth=(x:number)=>{const t=Math.max(0,Math.min(1,x));return t*t*(3-2*t);};
    const nextX=phase<5 ? -4+3*smooth(phase/5) : phase<8 ? -1 : phase<13 ? -1-3*smooth((phase-8)/5) : -4;
    const distance=Math.abs(nextX-patrolX); patrolWalk+=distance/.93;
    const targetYaw=reacting ? 170 : phase<8 ? 90 : -90;
    patrolYaw+=(((targetYaw-patrolYaw+540)%360)-180)*(1-Math.exp(-5*dt)); patrolX=nextX;
    const soldierX = options.playableBattle ? -duelRankFrontX : patrolX;
    const soldierZ = options.playableBattle ? 2.2 : 7.4;
    patrol.model.setPosition(soldierX, groundHeight(soldierX,soldierZ),soldierZ); patrol.model.setEulerAngles(0,options.playableBattle ? 126 : patrolYaw,0);
    const clip = reacting ? 'listen' : distance>.0005 ? 'walk_forward' : 'idle_relaxed';
    if (automaticActors) {
      patrol.pose(clip,(clip==='walk_forward'?patrolWalk:time)%patrol.tracks.get(clip)!.duration,dt);
      area.champion.pose('goliath_ready',time % 2.083,.033);
    }
  }
  stage(0);
  function resetActivity(){lastTime=patrolTime=patrolWalk=0;patrolX=-4;patrolYaw=90;stage(0);}
  return { ...area, groundHeight, root, sentinel, patrol, bearer, marker, stage, resetActivity, soldierCount: 51,
    // The overlook's camera rail is not geometry in the playable battlefield.
    // Keeping it here shortened the battle camera behind a backward evasion.
    walls: options.playableBattle ? area.walls : [...area.walls, {minX:-10,maxX:10,minZ:3.4,maxZ:3.8},
      {minX:1.98,maxX:2.82,minZ:8.9,maxZ:9.7}, {minX:-5.5,maxX:-3.1,minZ:9.4,maxZ:12.6}, {minX:3.7,maxX:6.1,minZ:9.7,maxZ:12.7}] };
}
