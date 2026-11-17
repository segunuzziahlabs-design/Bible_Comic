import {BLEND_NORMAL,CULLFACE_FRONT,CULLFACE_NONE,Color,Entity,Mesh,MeshInstance,StandardMaterial,Texture,Vec3,calculateNormals,type Application,type ContainerResource,type RenderComponent} from 'playcanvas';
import type {WallBounds} from '../gameplay/ground-motion';
import soldierUrl from '../assets/soldier-standing-lod.glb?url';

export const campVersion='m3-camp-1';
export const keeperPosition={x:-2,z:0};
export const eliabPosition={x:2.2,z:-2.7};
export const deliveryMark={x:-2,z:1.85};
export const greetingMark={x:2.2,z:-.8};
// Blender's authored frame-42 palm midpoint, transformed at the delivery mark.
export const basketDrop=new Vec3(-2.000192,.928942,1.561897);
export const tableTop=.788942;

export async function buildCampArrival(app:Application){
  const root=new Entity('Israelite baggage camp');app.root.addChild(root);
  let seed=173;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  function texture(name:string,woven=false){const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const ctx=canvas.getContext('2d')!,data=ctx.createImageData(128,128);
    for(let i=0;i<128*128;i++){const grain=woven?(i%128%4===0||Math.floor(i/128)%4===0?16:0):random()*25;const c=224+grain+random()*6;data.data.set([c,c,c,255],i*4);}ctx.putImageData(data,0,0);const result=new Texture(app.graphicsDevice,{name,mipmaps:true});result.setSource(canvas);return result;}
  const weave=texture('Original camp weave',true),grain=texture('Original camp grit');
  function surface(name:string,rgb:[number,number,number],detail?:Texture){const mat=new StandardMaterial();mat.name=name;mat.diffuse=new Color(...rgb);mat.gloss=.1;if(detail)mat.diffuseMap=detail;mat.update();return mat;}
  const sand=surface('Camp ochre',[.57,.46,.31],grain),linen=surface('Woven linen',[.74,.64,.46],weave),red=surface('Clay-coloured camp cloth',[.43,.23,.14],weave),wood=surface('Camp timber',[.24,.14,.075]),clay=surface('Earthenware',[.48,.27,.15]),stone=surface('Pale limestone',[.63,.55,.43],grain),bread=surface('Baked bread',[.63,.37,.14],grain),basketMaterial=surface('Woven provision basket',[.45,.28,.11],weave),cheese=surface('Wrapped cheese',[.70,.60,.39]);
  const shapes:Entity[]=[];
  function shape(parent:Entity,name:string,type:'box'|'cylinder'|'sphere'|'cone'|'torus',pos:[number,number,number],size:[number,number,number],material:StandardMaterial,shadow=true){const node=new Entity(name);node.addComponent('render',{type,material,castShadows:shadow});node.setLocalPosition(...pos);node.setLocalScale(...size);parent.addChild(node);shapes.push(node);return node;}
  shape(root,'Dirt beneath the camp','box',[0,-.06,0],[85,.12,85],sand,false);
  shape(root,'Woven baggage mat','box',[-2,.012,.8],[2.8,.024,2.8],red,false);
  shape(root,'Baggage table','box',[-2,tableTop-.055,1.05],[1.35,.11,1.4],wood);
  shape(root,'Table linen','box',[-2.25,tableTop+.006,.85],[.62,.012,.82],linen);
  for(const x of [-2.52,-1.48])for(const z of [.55,1.55])shape(root,'Table leg','box',[x,(tableTop-.11)/2,z],[.075,tableTop-.11,.075],wood);
  for(let i=0;i<4;i++){shape(root,'Grain sack','sphere',[-3.1-(i%2)*.38,.25,-.05-Math.floor(i/2)*.42],[.42,.50,.43],linen);shape(root,'Sack tie','cylinder',[-3.1-(i%2)*.38,.51,-.05-Math.floor(i/2)*.42],[.13,.065,.13],wood);}
  for(const [x,z]of[[-4,1.2],[-3.5,2.8],[4.1,-1.8],[4.45,-1.9]]){shape(root,'Clay water jar','sphere',[x,.30,z],[.39,.60,.39],clay);shape(root,'Jar neck','cylinder',[x,.62,z],[.16,.10,.16],clay);}
  const flaps:Entity[]=[];
  function tent(x:number,z:number,colour:StandardMaterial,scale=1){
    const entity=new Entity('Canvas camp shelter');entity.setPosition(x,0,z);entity.setLocalScale(scale,scale,scale);root.addChild(entity);
    const vertices=[-1.2,0,-1.5,0,1.95,-1.5,1.2,0,-1.5,-1.2,0,1.5,0,1.95,1.5,1.2,0,1.5],indices=[0,1,4,0,4,3,1,2,5,1,5,4,0,2,1];
    const mesh=new Mesh(app.graphicsDevice);mesh.setPositions(vertices);mesh.setIndices(indices);mesh.setNormals(calculateNormals(vertices,indices));mesh.setUvs(0,[0,0,.5,1,1,0,0,1,.5,0,1,1]);mesh.update();
    const cloth=colour.clone();cloth.cull=CULLFACE_NONE;cloth.update();entity.addComponent('render',{meshInstances:[new MeshInstance(mesh,cloth)],castShadows:true});
    for(const dz of[-1.5,1.5])shape(entity,'Shelter timber','cylinder',[0,.96,dz],[.07,1.92,.07],wood);
    const flap=shape(entity,'Entrance canvas','box',[-.67,.77,1.43],[.38,1.42,.035],cloth,false);flaps.push(flap);
  }
  tent(-4.55,2.5,linen);tent(4.55,2.2,linen);tent(-4.6,-2.6,red);tent(4.5,-4.6,linen);tent(-1.5,-7.5,linen,.8);tent(2.0,-8.3,red,.8);
  const canopy=shape(root,'Baggage shade','box',[-2,2.5,-.15],[2.7,.045,2.2],linen,false);canopy.setEulerAngles(0,0,7);
  for(const z of[-1.15,.85])shape(root,'Shade support','cylinder',[-3.25,1.2,z],[.09,2.4,.09],wood);
  for(const [x,z]of[[3.5,-2.1],[4.0,-2.0]]){shape(root,'Guard spear','cylinder',[x,1.12,z],[.025,2.24,.025],wood);shape(root,'Spear point','cone',[x,2.32,z],[.08,.18,.03],stone);}
  for(let i=0;i<15;i++){const x=-24+i*3.5,z=-20+Math.sin(i*1.8)*4;shape(root,'Distant valley ridge','sphere',[x,-2,z],[19,7+i%4,18],stone,false);}
  for(const [x,z,sx,sy,sz]of[[-27,4,22,8,28],[28,2,23,9,30],[-18,24,35,8,20],[16,28,39,10,24]])shape(root,'Camp horizon ridge','sphere',[x,-2,z],[sx,sy,sz],stone,false);
  // Keep the painted afternoon atmosphere of the accepted opening rather than a flat clear colour.
  const skyCanvas=document.createElement('canvas');skyCanvas.width=512;skyCanvas.height=256;const skyContext=skyCanvas.getContext('2d')!,skyGradient=skyContext.createLinearGradient(0,0,0,256);
  for(const [at,colour]of[[0,'#7ca8c1'],[.48,'#a3c3d3'],[.5,'#e4d3b0'],[.52,'#a3c3d3'],[1,'#7ca8c1']] as const)skyGradient.addColorStop(at,colour);
  skyContext.fillStyle=skyGradient;skyContext.fillRect(0,0,512,256);
  for(let i=0;i<38;i++){skyContext.fillStyle='rgba(250,244,219,.10)';skyContext.beginPath();skyContext.ellipse((i*113)%512,35+(i*31)%67,34+i%4*13,2+i%5,0,0,Math.PI*2);skyContext.fill();}
  const skyTexture=new Texture(app.graphicsDevice,{name:'Original camp afternoon sky',mipmaps:true});skyTexture.setSource(skyCanvas);
  const skyMaterial=new StandardMaterial();skyMaterial.diffuse.set(0,0,0);skyMaterial.emissive.set(1,1,1);skyMaterial.emissiveMap=skyTexture;skyMaterial.useLighting=false;skyMaterial.useFog=false;skyMaterial.cull=CULLFACE_FRONT;skyMaterial.update();
  const skyDome=new Entity('Camp afternoon sky');skyDome.addComponent('render',{type:'sphere',material:skyMaterial,castShadows:false});skyDome.setLocalScale(140,140,140);root.addChild(skyDome);
  const sky=new Color(.64,.75,.79);app.scene.ambientLight=new Color(.54,.55,.56);
  const sun=new Entity('Camp afternoon sun');sun.addComponent('light',{type:'directional',color:new Color(1,.91,.74),intensity:1.4,castShadows:true,shadowResolution:1024,shadowDistance:17,normalOffsetBias:.025});sun.setEulerAngles(39,-44,0);root.addChild(sun);
  const fill=new Entity('Linen reflected light');fill.addComponent('light',{type:'directional',color:new Color(.84,.90,1),intensity:.47});fill.setEulerAngles(15,130,0);root.addChild(fill);
  const camera=new Entity('Camp camera');camera.addComponent('camera',{fov:48,nearClip:.05,farClip:110,clearColor:sky});app.root.addChild(camera);
  const contact=surface('Foot contact',[.13,.085,.04]);contact.opacity=.17;contact.blendType=BLEND_NORMAL;contact.depthWrite=false;contact.update();
  for(const at of[keeperPosition,eliabPosition])shape(root,'Soft character contact','sphere',[at.x,.014,at.z],[.5,.008,.38],contact,false);
  const davidContact=shape(root,'David foot contact','sphere',[0,.014,4],[.48,.008,.37],contact,false);
  const basket=new Entity('Provisions basket');root.addChild(basket);
  shape(basket,'Basket base','box',[0,-.11,0],[.36,.06,.30],basketMaterial);
  for(const x of[-.17,.17])shape(basket,'Woven basket wall','box',[x,.01,0],[.035,.25,.30],basketMaterial);
  for(const z of[-.14,.14])shape(basket,'Woven basket wall','box',[0,.01,z],[.35,.25,.03],basketMaterial);
  for(const x of[-.15,.15]){const handle=shape(basket,'Basket handle','torus',[x,.15,0],[.16,.018,.12],basketMaterial);handle.setEulerAngles(0,0,90);}
  for(let i=0;i<3;i++)shape(basket,'Loaf of bread','sphere',[-.10+i*.10,.12,-.015+(i%2)*.08],[.14,.085,.19],bread);
  shape(basket,'Provisions cloth','sphere',[.08,.10,-.07],[.14,.13,.12],cheese);
  const markerMat=surface('Camp objective gold',[.76,.54,.2]);const marker=shape(root,'Camp objective marker','cylinder',[-2,.025,1.8],[.73,.018,.73],markerMat,false);
  const resource=await new Promise<ContainerResource>((resolve,reject)=>app.assets.loadFromUrl(soldierUrl,'container',(error,asset)=>error||!asset?.resource?reject(new Error('The background camp cast could not load.')):resolve(asset.resource as ContainerResource)));
  const background=Array.from({length:6},(_,i)=>{
    const actor=resource.instantiateRenderEntity({castShadows:false});actor.name=i<2?['Abinadab · background','Shammah · background'][i]:'Camp guard';root.addChild(actor);
    const pos=i===0?[3.6,-3.4]:i===1?[4.8,-3]:[-4.0+(i-2)*2.2,-6.2];actor.setPosition(pos[0],0,pos[1]);actor.setLocalScale(.94,.94,.94);actor.setEulerAngles(0,i<2?-25:0,0);
    for(const render of actor.findComponents('render') as RenderComponent[])for(const mesh of render.meshInstances)if(mesh.material instanceof StandardMaterial&&mesh.material.name==='Cloth'){const mat=mesh.material.clone();mat.diffuse=new Color(...(i%2?[1.9,.72,.48]:[.9,1.1,.7]) as [number,number,number]);mat.update();mesh.material=mat;}
    return{actor,yaw:i<2?-25:0};
  });
  const walls:WallBounds[]=[
    {minX:-7,maxX:-6,minZ:-9,maxZ:7},{minX:6,maxX:7,minZ:-9,maxZ:7},{minX:-7,maxX:7,minZ:5.6,maxZ:7},{minX:-7,maxX:7,minZ:-9,maxZ:-7.8},
    {minX:-5.8,maxX:-3.4,minZ:1,maxZ:4},{minX:3.4,maxX:5.8,minZ:.7,maxZ:3.7},{minX:-5.8,maxX:-3.4,minZ:-4.1,maxZ:-1.1},{minX:3.4,maxX:5.7,minZ:-6.1,maxZ:-3.1},
    {minX:-2.55,maxX:-1.45,minZ:.55,maxZ:1.55},{minX:-2.32,maxX:-1.68,minZ:-.3,maxZ:.3},{minX:1.88,maxX:2.52,minZ:-3,maxZ:-2.4},
  ];
  return{root,camera,basket,marker,davidContact,walls,step(time:number){flaps.forEach((flap,i)=>flap.setLocalEulerAngles(0,Math.sin(time*1.8+i)*2,0));background.forEach(({actor,yaw},i)=>actor.setEulerAngles(0,yaw+Math.sin(time*.7+i*1.7)*.7,0));}};
}
