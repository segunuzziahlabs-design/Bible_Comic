import {BLEND_NORMAL,CULLFACE_FRONT,Color,Entity,Mesh,MeshInstance,StandardMaterial,Texture,Vec3,calculateNormals,type Application,type ContainerResource,type RenderComponent} from 'playcanvas';
import {buildSaulPavilion} from './saul-pavilion';
import type {WallBounds} from '../gameplay/ground-motion';
import armourUrl from '../assets/preparation-armour.glb?url';
import soldierUrl from '../assets/soldier-standing-lod.glb?url';
export const preparationVersion='m3-preparation-1';
export const audienceMark={x:-.65,z:.65},armourMark={x:1.1,z:1.2},practiceMark={x:0,z:1.55};
export const saulPosition={x:.7,z:-1.2};
export const stonePoints=[{x:-1.65,z:.12},{x:-.75,z:-.08},{x:.2,z:.10},{x:1.15,z:-.10},{x:2.05,z:.14}];
export const coatStand=new Vec3(2.35,1.25,.05),helmetStand=new Vec3(2.35,1.83,.05);
export async function buildPreparationWorld(app:Application){
  const before=new Set(app.root.children),pavilion=buildSaulPavilion(app),pavilionRoot=new Entity('Preparation pavilion');
  const owned=app.root.children.filter(child=>!before.has(child)&&child!==pavilion.camera);app.root.addChild(pavilionRoot);for(const child of owned)pavilionRoot.addChild(child);
  for(const name of['Saul armour','Saul helmet'])pavilionRoot.findByName(name)!.enabled=false;
  const sun=owned.find((child):child is Entity=>child instanceof Entity&&!!child.light?.castShadows);if(sun?.light)sun.light.shadowResolution=1024;
  const brookRoot=new Entity('Preparation brook');app.root.addChild(brookRoot);
  const surface=(name:string,rgb:[number,number,number])=>{const mat=new StandardMaterial();mat.name=name;mat.diffuse=new Color(...rgb);mat.gloss=.1;mat.update();return mat;};
  const earth=surface('Original dry brook bank',[.58,.47,.31]),limestone=surface('Original brook limestone',[.65,.57,.43]),wood=surface('Practice timber',[.23,.13,.065]),olive=surface('Olive foliage',[.27,.32,.14]),leather=surface('Shepherd leather',[.22,.115,.05]),gold=surface('Preparation marker',[.78,.55,.2]);
  let seed=123;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const grainCanvas=document.createElement('canvas');grainCanvas.width=grainCanvas.height=128;const ctx=grainCanvas.getContext('2d')!,data=ctx.createImageData(128,128);
  for(let i=0;i<128*128;i++){const c=224+random()*28;data.data.set([c,c,c,255],i*4);}ctx.putImageData(data,0,0);const grain=new Texture(app.graphicsDevice,{name:'Original bank grain',mipmaps:true});grain.setSource(grainCanvas);for(const mat of[earth,limestone]){mat.diffuseMap=grain;mat.update();}
  function shape(parent:Entity,name:string,type:'box'|'sphere'|'cylinder',at:[number,number,number],size:[number,number,number],mat:StandardMaterial,shadow=true){const entity=new Entity(name);entity.addComponent('render',{type,material:mat,castShadows:shadow});entity.setLocalPosition(...at);entity.setLocalScale(...size);parent.addChild(entity);return entity;}
  shape(brookRoot,'Brook bank','box',[0,-.075,0],[90,.15,90],earth,false);
  for(let i=0;i<45;i++){const x=(random()-.5)*24,z=(random()-.5)*18;if(Math.abs(x)<3&&z>-1&&z<4)continue;shape(brookRoot,'Limestone on bank','sphere',[x,.05+random()*.06,z],[.3+random()*.6,.15+random()*.18,.3+random()*.6],limestone,false);}
  for(const [x,z]of[[-5.7,1.8],[5.8,-2.2],[-7,-5]]){shape(brookRoot,'Olive trunk','cylinder',[x,.9,z],[.15,1.8,.15],wood);for(let i=0;i<4;i++)shape(brookRoot,'Olive canopy','sphere',[x+(i%2?-.4:.4),2.1+i*.04,z+(i<2?.3:-.3)],[1.4,.65,1.25],olive,false);}
  for(const [x,z]of[[-4.5,-.3],[4.2,.4],[-3,-3.8],[3.9,2.4]])shape(brookRoot,'Dry bank scrub','sphere',[x,.12,z],[.6,.25,.5],olive,false);
  for(const [x,z,sx,sy,sz]of[[-20,-18,32,12,22],[17,-22,34,16,24],[-18,25,34,10,21],[18,27,36,13,24]])shape(brookRoot,'Distant Elah limestone','sphere',[x,-2,z],[sx,sy,sz],limestone,false);
  const waterMat=surface('Shallow flowing water',[.27,.42,.41]);waterMat.opacity=.6;waterMat.blendType=BLEND_NORMAL;waterMat.depthWrite=false;waterMat.gloss=.75;waterMat.update();
  const positions:number[]=[],indices:number[]=[];for(let i=0;i<=40;i++){const x=-9+i*.45,z=-1.2+.2*Math.sin(x*.65);positions.push(x,.014,z-.43,x,.014,z+.43);if(i<40){const n=i*2;indices.push(n,n+3,n+2,n,n+1,n+3);}}
  const mesh=new Mesh(app.graphicsDevice);mesh.setPositions(positions);mesh.setIndices(indices);mesh.setNormals(calculateNormals(positions,indices));mesh.update();const water=new Entity('Brook water');water.addComponent('render',{meshInstances:[new MeshInstance(mesh,waterMat)],castShadows:false});brookRoot.addChild(water);
  for(let i=0;i<28;i++){const x=-4+i*.3,z=-1.2+.2*Math.sin(x*.65);shape(brookRoot,'Stream pebble','sphere',[x,.019,z+(i%2?.22:-.22)],[.16,.07,.13],limestone,false);}
  const stones=stonePoints.map((point,i)=>shape(brookRoot,`Smooth stone ${i+1}`,'sphere',[point.x,.023,point.z],[.065,.045,.075],limestone));
  const targetCanvas=document.createElement('canvas');targetCanvas.width=targetCanvas.height=256;const paint=targetCanvas.getContext('2d')!;paint.fillStyle='#a58b57';paint.fillRect(0,0,256,256);
  for(let r=3;r<128;r+=3){paint.beginPath();paint.arc(128,128,r,0,Math.PI*2);paint.strokeStyle=r%2?'#d0b884':'#8c7245';paint.lineWidth=1.4;paint.stroke();}paint.fillStyle='#7b3e25';paint.beginPath();paint.arc(128,128,29,0,Math.PI*2);paint.fill();
  const targetTex=new Texture(app.graphicsDevice,{name:'Original woven practice target',mipmaps:true});targetTex.setSource(targetCanvas);const targetMat=surface('Woven practice target',[1,1,1]);targetMat.diffuseMap=targetTex;targetMat.update();
  shape(brookRoot,'Practice post','cylinder',[0,.75,-4.75],[.08,1.5,.08],wood);const target=shape(brookRoot,'Woven target','cylinder',[0,1.35,-4.70],[1.10,.11,1.10],targetMat);target.setEulerAngles(90,0,0);
  const targetCentre=new Vec3(0,1.35,-4.635);
  const brookSun=new Entity('Brook afternoon sun');brookSun.addComponent('light',{type:'directional',color:new Color(1,.90,.74),intensity:1.4,castShadows:true,shadowResolution:1024,shadowDistance:16,normalOffsetBias:.025});brookSun.setEulerAngles(40,-44,0);brookRoot.addChild(brookSun);
  const fill=new Entity('Brook reflected light');fill.addComponent('light',{type:'directional',color:new Color(.80,.88,1),intensity:.4});fill.setEulerAngles(18,134,0);brookRoot.addChild(fill);
  const skyCanvas=document.createElement('canvas');skyCanvas.width=256;skyCanvas.height=128;const skyContext=skyCanvas.getContext('2d')!,gradient=skyContext.createLinearGradient(0,0,0,128);for(const [at,c]of[[0,'#7ca8c1'],[.48,'#b3c9d1'],[.5,'#e4d3b0'],[.52,'#b3c9d1'],[1,'#7ca8c1']]as const)gradient.addColorStop(at,c);skyContext.fillStyle=gradient;skyContext.fillRect(0,0,256,128);
  const skyTex=new Texture(app.graphicsDevice,{name:'Original brook sky'});skyTex.setSource(skyCanvas);const sky=surface('Brook sky',[0,0,0]);sky.emissive.set(1,1,1);sky.emissiveMap=skyTex;sky.useLighting=false;sky.cull=CULLFACE_FRONT;sky.update();shape(brookRoot,'Afternoon sky','sphere',[0,0,0],[150,150,150],sky,false);
  const marker=shape(app.root,'Preparation objective','cylinder',[-.65,.028,.65],[.7,.018,.7],gold,false);
  const slingRoot=new Entity('Practice sling');app.root.addChild(slingRoot);const cord=shape(slingRoot,'Practice sling cord','box',[0,0,0],[.012,.012,1],leather,false),pouch=shape(slingRoot,'Practice sling pouch','sphere',[0,0,0],[.12,.035,.10],leather,false),projectile=shape(slingRoot,'Practice projectile','sphere',[0,0,0],[.075,.075,.075],limestone,false);projectile.enabled=false;slingRoot.enabled=false;
  async function load(url:string){return new Promise<ContainerResource>((resolve,reject)=>app.assets.loadFromUrl(url,'container',(error,asset)=>error||!asset?.resource?reject(new Error('Preparation equipment could not load.')):resolve(asset.resource as ContainerResource)));}
  const resource=await load(armourUrl);
  function prop(name:string,prefix:string,at:Vec3){const node=resource.instantiateRenderEntity({castShadows:true});node.name=name;app.root.addChild(node);for(const render of node.findComponents('render')as RenderComponent[])if(!render.entity.name.startsWith(prefix))render.enabled=false;node.setPosition(at);return node;}
  const coatProp=prop('Coat on stand','Coat prop',coatStand),helmetProp=prop('Helmet on stand','Helmet prop',helmetStand);pavilionRoot.addChild(coatProp);pavilionRoot.addChild(helmetProp);
  const soldierResource=await load(soldierUrl),guard=soldierResource.instantiateRenderEntity({castShadows:false});guard.name='Right pavilion guard';guard.setPosition(2.85,0,-2.7);guard.setLocalScale(.94,.94,.94);guard.setEulerAngles(0,-25,0);pavilionRoot.addChild(guard);
  const brookWalls:WallBounds[]=[{minX:-7,maxX:-5,minZ:-6,maxZ:5},{minX:5,maxX:7,minZ:-6,maxZ:5},{minX:-7,maxX:7,minZ:4.3,maxZ:6},{minX:-7,maxX:7,minZ:-1.1,maxZ:-.55}];
  let area:'pavilion'|'brook'='pavilion';
  function activate(next:typeof area){area=next;pavilionRoot.enabled=next==='pavilion';brookRoot.enabled=next==='brook';app.scene.ambientLight=next==='pavilion'?new Color(.26,.285,.33):new Color(.55,.58,.60);pavilion.camera.camera!.farClip=100;}
  activate('pavilion');
  return{camera:pavilion.camera,pavilionRoot,brookRoot,stones,marker,coatProp,helmetProp,slingRoot,projectile,target,targetCentre,
    get area(){return area;},get walls(){return area==='pavilion'?[...pavilion.walls,{minX:.40,maxX:1.0,minZ:-1.5,maxZ:-.9}]:brookWalls;},activate,
    step(time:number){water.setLocalPosition(0,Math.sin(time*1.6)*.003,0);guard.setLocalEulerAngles(0,-25+Math.sin(time*.7)*.6,0);},
    drawSling(grip:Vec3,at:Vec3){const mid=new Vec3().lerp(grip,at,.5);cord.setPosition(mid);cord.setLocalScale(.012,.012,grip.distance(at));cord.lookAt(at);pouch.setPosition(at);},
  };
}
