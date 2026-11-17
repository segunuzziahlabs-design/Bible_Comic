import {
  BLEND_NORMAL, CULLFACE_NONE, Color, Entity, Mesh, MeshInstance, StandardMaterial, Texture,
  TONEMAP_NEUTRAL, calculateNormals, type Application,
} from 'playcanvas';
import type { WallBounds } from '../gameplay/ground-motion';

function fabric(app: Application, colour: Color, scale: number) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#d4c6a8';
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 256; i += 2) {
    ctx.strokeStyle = i % 4 ? '#cbbd9f' : '#e1d3b5';
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 256); ctx.stroke();
    ctx.strokeStyle = '#c7b99d';
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(256, i); ctx.stroke();
  }
  const texture = new Texture(app.graphicsDevice, { name: 'Original woven linen', mipmaps: true });
  texture.setSource(canvas);
  texture.anisotropy = 4;
  const material = new StandardMaterial();
  material.diffuse = colour;
  material.diffuseMap = texture;
  material.diffuseMapTiling.set(scale, scale);
  material.gloss = .05;
  material.cull = CULLFACE_NONE;
  material.update();
  return material;
}

export function buildSaulPavilion(app: Application) {
  const linen = fabric(app, new Color(.83, .73, .57), 7);
  const red = fabric(app, new Color(.49, .15, .09), 4);
  const carpet = fabric(app, new Color(.32, .075, .046), 8);
  function material(rgb: [number, number, number]) {
    const value = new StandardMaterial();
    value.diffuse = new Color(...rgb);
    value.gloss = .16;
    value.update();
    return value;
  }
  const sand = material([.54, .43, .30]);
  const wood = material([.24, .14, .075]);
  const bronze = material([.47, .30, .12]);
  const clay = material([.43, .23, .13]);
  const stone = material([.55, .49, .40]);
  const trim = material([.63, .43, .20]);
  const groundCanvas=document.createElement('canvas');groundCanvas.width=groundCanvas.height=256;
  const groundPaint=groundCanvas.getContext('2d')!,grain=groundPaint.createImageData(256,256);let seed=582;
  for(let i=0;i<256*256;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const c=220+(seed/4294967296)*32;grain.data.set([c,c*.98,c*.94,255],i*4);}
  groundPaint.putImageData(grain,0,0);const groundTexture=new Texture(app.graphicsDevice,{name:'Original camp sand grain',mipmaps:true});groundTexture.setSource(groundCanvas);groundTexture.anisotropy=4;
  sand.diffuseMap=groundTexture;sand.diffuseMapTiling.set(18,18);sand.update();
  const walls: WallBounds[] = [
    { minX: -4.5, maxX: -4.0, minZ: -4.2, maxZ: 5 },
    { minX: 4.0, maxX: 4.5, minZ: -4.2, maxZ: 5 },
    { minX: -4.5, maxX: 4.5, minZ: -4.3, maxZ: -3.7 },
    { minX: -4.5, maxX: 4.5, minZ: 4.8, maxZ: 5.2 },
    { minX: -3.5, maxX: -1.7, minZ: -2.4, maxZ: -1.6 },
    { minX: 1.8, maxX: 2.9, minZ: -.25, maxZ: .5 },
    { minX: .22, maxX: 1.18, minZ: -2.72, maxZ: -1.99 },
  ];

  function shape(name: string, type: 'box' | 'cylinder' | 'sphere' | 'cone',
    at: [number, number, number], size: [number, number, number], surface: StandardMaterial, shadow = true) {
    const entity = new Entity(name);
    entity.addComponent('render', { type, material: surface, castShadows: shadow, receiveShadows: true });
    entity.setPosition(...at);
    entity.setLocalScale(...size);
    app.root.addChild(entity);
    return entity;
  }
  shape('Camp ground', 'box', [0, -.07, 0], [70, .14, 70], sand, false);
  shape('Audience carpet', 'box', [0, .009, -.45], [3.1, .018, 4.1], carpet, false);
  for (const x of [-1.42, 1.42]) {
    shape('Woven carpet border', 'box', [x, .023, -.45], [.075, .008, 4.0], trim, false);
  }
  for (let z = -2.35; z < 1.3; z += .36) {
    const stitch = shape('Carpet diamond', 'box', [0, .025, z], [.10, .009, .10], trim, false);
    stitch.setEulerAngles(0, 45, 0);
  }
  for (const x of [-3.7, 3.7]) {
    for (const z of [-3.5, 2.35]) {
      shape('Pavilion timber', 'cylinder', [x, 1.66, z], [.115, 3.32, .115], wood);
      shape('Pole bronze binding', 'cylinder', [x, 1.05, z], [.127, .075, .127], bronze);
    }
  }
  const canopyPositions: number[] = [];
  const canopyIndices: number[] = [];
  const uvs: number[] = [];
  for (let row = 0; row <= 8; row++) {
    for (let column = 0; column <= 12; column++) {
      const x = -4.0 + column * (8 / 12);
      const z = -3.85 + row * .81;
      const y = 3.25 + .68 * (1 - Math.abs(x) / 4) - .12 * Math.sin(row / 8 * Math.PI);
      canopyPositions.push(x, y, z);
      uvs.push(column / 12, row / 8);
      if (row === 8 || column === 12) continue;
      const i = row * 13 + column;
      canopyIndices.push(i, i + 13, i + 1, i + 1, i + 13, i + 14);
    }
  }
  const mesh = new Mesh(app.graphicsDevice);
  mesh.setPositions(canopyPositions); mesh.setIndices(canopyIndices); mesh.setUvs(0, uvs);
  mesh.setNormals(calculateNormals(canopyPositions, canopyIndices)); mesh.update();
  const roof = new Entity('Woven pavilion canopy');
  roof.addComponent('render', { meshInstances: [new MeshInstance(mesh, linen)], castShadows: true });
  app.root.addChild(roof);
  for (const x of [-3.76, 3.76]) {
    shape('Pavilion side cloth', 'box', [x, 1.65, -1.0], [.035, 3.1, 4.9], linen, false);
    shape('Mantle-coloured entrance drape', 'box', [x * .88, 1.55, 2.30], [.68, 3.05, .04], red, false);
  }
  shape('Pavilion back cloth', 'box', [0, 1.65, -3.80], [7.6, 3.15, .035], linen, false);
  shape('Back cloth central panel', 'box', [.65, 1.50, -3.765], [2.0, 2.9, .025], red, false);
  // Woven trim and portable camp furniture, rather than a permanent palace.
  for(const x of[-.32,1.62])shape('Royal hanging woven border','box',[x,1.5,-3.73],[.045,2.8,.018],trim,false);
  for(let i=0;i<8;i++){
    const stitch=shape('Hanging diamond embroidery','box',[.65,2.72-i*.30,-3.72],[.11,.11,.015],trim,false);
    stitch.setEulerAngles(0,0,45);
  }
  shape('Campaign seat cushion','box',[.7,.43,-2.35],[.84,.15,.67],red);
  for(const x of[.36,1.04])shape('Campaign seat leg','box',[x,.21,-2.35],[.08,.42,.50],wood);
  shape('Campaign seat back','box',[.7,.84,-2.65],[.80,.72,.075],wood);
  shape('Camp table', 'box', [-2.6, .85, -2.0], [1.65, .12, .75], wood);
  for (const x of [-3.2, -2.0]) for (const z of [-2.25, -1.75]) {
    shape('Table leg', 'box', [x, .42, z], [.075, .84, .075], wood);
  }
  shape('Folded woven cloth', 'box', [-2.55, .945, -2.05], [.80, .07, .40], linen);
  shape('Provision bowl', 'sphere', [-2.1, .96, -1.92], [.21, .07, .21], clay);
  for (const [x, z] of [[-3.15, -.5], [2.75, -2.95], [3.05, -3.05]]) {
    shape('Earthen jar', 'sphere', [x, .31, z], [.38, .59, .38], clay);
    shape('Jar neck', 'cylinder', [x, .61, z], [.17, .12, .17], clay);
  }
  shape('Armour stand upright', 'cylinder', [2.35, .87, .05], [.065, 1.74, .065], wood);
  shape('Armour stand foot', 'box', [2.35, .04, .05], [.60, .08, .48], wood);
  shape('Saul armour', 'box', [2.35, 1.25, .05], [.55, .57, .28], bronze);
  shape('Saul helmet', 'sphere', [2.35, 1.83, .05], [.27, .26, .29], bronze);
  for (const x of [-3.25, 3.35]) {
    shape('Guard spear shaft', 'cylinder', [x, 1.16, -2.80], [.026, 2.32, .026], wood);
    shape('Guard bronze spearhead', 'cone', [x, 2.40, -2.80], [.095, .22, .035], bronze);
    const shield = shape('Guard hide shield', 'cylinder', [x, .45, -2.49], [.64, .055, .77], wood);
    shield.setEulerAngles(73, 0, 0);
    const boss = shape('Shield bronze boss', 'sphere', [x, .45, -2.44], [.16, .16, .09], bronze);
    boss.setEulerAngles(0, 0, 0);
  }
  for (let i = 0; i < 18; i++) {
    const x = -18 + i * 2.8;
    const z = 10 + Math.sin(i * 2.4) * 4;
    shape('Distant ridge', 'sphere', [x, -2.1, z + 10], [16, 7 + i % 3, 14], stone, false);
  }
  // The entrance looks into a lived-in field camp, with low-detail linen tents.
  for(const [x,z,yaw]of[[-5.4,9,10],[4.8,10,-12],[.3,15,8]]){
    const tent=new Entity('Distant woven field tent');app.root.addChild(tent);tent.setPosition(x,0,z);tent.setEulerAngles(0,yaw,0);
    const positions=[-1.6,0,-1.5, 0,2,-1.5, 1.6,0,-1.5, -1.6,0,1.5, 0,2,1.5, 1.6,0,1.5];
    const indices=[0,3,1,1,3,4,1,4,2,2,4,5,0,1,2];
    const tentMesh=new Mesh(app.graphicsDevice);tentMesh.setPositions(positions);tentMesh.setNormals(calculateNormals(positions,indices));tentMesh.setUvs(0,[0,0,.5,1,1,0,0,0,.5,1,1,0]);tentMesh.setIndices(indices);tentMesh.update();
    tent.addComponent('render',{meshInstances:[new MeshInstance(tentMesh,linen)],castShadows:true});
  }

  // The entrance provides soft warm light; a cooler reflected fill separates
  // silhouettes. Only the sun casts a shadow map, retaining the mobile budget.
  app.scene.ambientLight = new Color(.26, .285, .33);
  const sun = new Entity('Afternoon camp sun');
  sun.addComponent('light', {
    type: 'directional', color: new Color(1, .93, .83), intensity: 1.65,
    castShadows: true, shadowResolution: 2048, shadowDistance: 20, normalOffsetBias: .025,
  });
  sun.setEulerAngles(42, -44, 0);
  app.root.addChild(sun);
  const fill = new Entity('Pavilion reflected light');
  fill.addComponent('light', { type: 'directional', color: new Color(.87, .92, 1), intensity: .95 });
  fill.setEulerAngles(66, 139, 0);
  app.root.addChild(fill);
  const entrance=new Entity('Warm light reflected through the pavilion entrance');
  entrance.addComponent('light',{type:'spot',color:new Color(1,.93,.83),intensity:1.65,range:14,innerConeAngle:45,outerConeAngle:70,castShadows:false});
  entrance.setPosition(1,3.5,5);entrance.setEulerAngles(68,12,0);app.root.addChild(entrance);
  const rim=new Entity('Cool pavilion rim light');rim.addComponent('light',{type:'directional',color:new Color(.62,.74,1),intensity:.35});rim.setEulerAngles(50,160,0);app.root.addChild(rim);
  const contact = material([.11, .065, .035]);
  contact.opacity = .20; contact.blendType = BLEND_NORMAL; contact.depthWrite = false; contact.update();
  for (const [x, z] of [[.7, -1.2], [-.65, .65], [-2.8, -2.7], [2.85, -2.7]]) {
    shape('Soft foot contact', 'sphere', [x, .012, z], [.55, .008, .40], contact, false);
  }
  const camera = new Entity('Saul scene camera');
  camera.addComponent('camera', { fov: 46, nearClip: .05, farClip: 70, clearColor: new Color(.64, .72, .77) });
  camera.camera!.toneMapping=TONEMAP_NEUTRAL;
  app.root.addChild(camera);
  return { camera, walls };
}
