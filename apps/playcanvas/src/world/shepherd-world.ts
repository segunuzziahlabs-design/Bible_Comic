import { Color, Entity, Mat4, Mesh, MeshInstance, Quat, StandardMaterial, Vec3, VertexBuffer, VertexFormat, calculateNormals, type Application, type RenderComponent } from 'playcanvas';
import { loadConversationActor } from './conversation-actor';
import adultUrl from '../assets/challenge-soldier.glb?url';
import { buildJesseCourtyard, bundleHeight, bundleMark } from './jesse-courtyard';
export { bundleMark } from './jesse-courtyard';

export const shepherdVersion = 'separate-pasture-courtyard-5';
export const lambMark = { x: 1.2, z: .8 };
export function pastureHeight(x: number, z: number) { return Math.abs(x)<5.9&&z< -3.8&&z> -13.5 ? 0 : .075 * Math.sin(x * .32) + .07 * Math.sin(z * .31); }
export async function buildShepherdWorld(app: Application) {
  const root = new Entity('Bethlehem hills and valley journey'); app.root.addChild(root);
  let seed = 493; const random = () => { seed = (Math.imul(seed,1664525)+1013904223)>>>0; return seed / 4294967296; };
  function material(name: string, rgb: [number,number,number]) { const m = new StandardMaterial(); m.name=name; m.diffuse=new Color(...rgb); m.gloss=.08; m.update(); return m; }
  const grass=material('Spring pasture',[.37,.43,.20]), stone=material('Warm limestone',[.59,.55,.40]), wood=material('Olive wood',[.28,.20,.11]);
  const leaf=material('Sage olive foliage',[.28,.36,.18]), wool=material('Cream sheep wool',[.83,.79,.63]), face=material('Sheep ears and face',[.31,.25,.18]), dark=material('Sheep eyes and hooves',[.10,.08,.055]);
  const basketMat=material('Woven grain basket',[.46,.29,.12]), breadMat=material('Barley loaves',[.70,.45,.20]), linen=material('Wrapped cheeses',[.80,.72,.52]);
  function shape(parent: Entity, name: string, type: 'sphere'|'box'|'cylinder'|'cone'|'torus', at: number[], size: number[], mat: StandardMaterial, shadow=true) {
    const e=new Entity(name); e.addComponent('render',{type,material:mat,castShadows:shadow});e.setLocalPosition(at[0],at[1],at[2]);e.setLocalScale(size[0],size[1],size[2]);parent.addChild(e);return e;
  }
  const matrices: VertexBuffer[]=[];
  function batch(name:string,type:'sphere'|'cone'|'cylinder',mat:StandardMaterial,items:number[][]){
    const e=shape(root,name,type,[0,0,0],[1,1,1],mat,false),data=new Float32Array(items.length*16),m=new Mat4(),q=new Quat(),p=new Vec3(),s=new Vec3();
    items.forEach((v,i)=>{m.setTRS(p.set(v[0],v[1],v[2]),q.setFromEulerAngles(0,v[6]??0,0),s.set(v[3],v[4],v[5]));data.set(m.data,i*16);});
    const buffer=new VertexBuffer(app.graphicsDevice,VertexFormat.getDefaultInstancingFormat(app.graphicsDevice),items.length,{data});matrices.push(buffer);e.render!.meshInstances[0].setInstancing(buffer,false);return e;
  }
  const positions:number[]=[],indices:number[]=[],colours:number[]=[];
  for(let z=-40;z<=24;z+=2)for(let x=-40;x<=40;x+=2){const y=pastureHeight(x,z);positions.push(x,y,z);const path=Math.abs(x-1.1*Math.sin(z*.23))<1.15&&z<3;const shade=.95+random()*.09;colours.push(...(path?[.58*shade,.50*shade,.32*shade]:[.35*shade,.43*shade,.22*shade]),1);const i=positions.length/3-1;if(x<40&&z<24)indices.push(i,i+41,i+42,i,i+42,i+1);}
  const mesh=new Mesh(app.graphicsDevice);mesh.setPositions(positions);mesh.setIndices(indices);mesh.setNormals(calculateNormals(positions,indices));mesh.setColors(colours);mesh.update();
  const terrainMaterial=material('Pasture and shepherd path',[1,1,1]);terrainMaterial.diffuseVertexColor=true;terrainMaterial.update();const terrain=new Entity('Walkable pasture');terrain.addComponent('render',{meshInstances:[new MeshInstance(mesh,terrainMaterial)],castShadows:false});root.addChild(terrain);
  batch('Layered green hills','sphere',grass,Array.from({length:14},(_,i)=>{const angle=i/14*Math.PI*2;return[Math.cos(angle)*39,-1.5,Math.sin(angle)*39-5,26,9+random()*10,24];}));
  const trunks:number[][]=[],crowns:number[][]=[],rocks:number[][]=[],tufts:number[][]=[];
  for(const [x,z]of[[-7,0],[8,4],[-6,-10],[7,-14],[-10,9],[11,-5]]){const y=pastureHeight(x,z);trunks.push([x,y+1.1,z,.28,2.2,.28]);for(let i=0;i<3;i++)crowns.push([x+(i-1)*.55,y+2.3+random()*.4,z+random()*.5,2.2,1.3,1.8]);}
  for(let i=0;i<95;i++){const x=(random()-.5)*33,z=random()*40-24;if(Math.abs(x)<2&&z>-28||Math.abs(x)<5.9&&z> -13.5&&z< -3.8)continue;rocks.push([x,pastureHeight(x,z),z,.2+random()*.55,.16+random()*.35,.3+random()*.5]);}
  for(let i=0;i<700;i++){const x=(random()-.5)*38,z=random()*43-27;if(Math.abs(x-1.1*Math.sin(z*.23))<1.25||Math.abs(x)<5.9&&z> -13.5&&z< -3.8)continue;tufts.push([x,pastureHeight(x,z)+.15,z,.12,.2+random()*.24,.13,random()*360]);}
  batch('Olive trunks','cylinder',wood,trunks);batch('Olive crowns','sphere',leaf,crowns);batch('Limestone scattered along the path','sphere',stone,rocks);batch('Pasture grasses','cone',grass,tufts);
  shape(root,'Watering basin','torus',[2.8,pastureHeight(2.8,.4)+.22,.4],[1.3,.44,1.3],stone);const water=material('Water in the trough',[.25,.44,.44]);shape(root,'Still water','cylinder',[2.8,.23,.4],[1.0,.03,1.0],water,false);
  const flock=Array.from({length:8},(_,i)=>{
    const e=new Entity(i===0?'Lamb needing David':'Sheep '+i);root.addChild(e);const small=i===0?.75:1;
    e.setLocalScale(small,small,small);shape(e,'Wool body','sphere',[0,.53,0],[.55,.50,.85],wool);
    const head=new Entity('Sheep head');head.setLocalPosition(0,.64,-.40);e.addChild(head);shape(head,'Face','sphere',[0,0,-.06],[.23,.25,.34],face);
    for(const side of[-1,1]){shape(head,'Ear','sphere',[side*.17,.04,0],[.18,.07,.11],face,false);shape(head,'Eye','sphere',[side*.105,.03,-.13],[.035,.035,.035],dark,false);}
    const legs=[[-.16,-.23],[.16,-.23],[-.16,.24],[.16,.24]].map(([x,z])=>{const leg=new Entity('Sheep leg pivot');leg.setLocalPosition(x,.41,z);e.addChild(leg);shape(leg,'Leg','cylinder',[0,-.18,0],[.075,.36,.075],face,false);return leg;});
    return{e,head,legs,x:i===0?1.2:-3+(i%4)*1.5,z:i===0?0:-2+Math.floor(i/4)*2,heading:0};
  });
  const courtyard=await buildJesseCourtyard(app,root);
  const bundle=new Entity('Jesse’s courtyard provisions');courtyard.root.addChild(bundle);bundle.setPosition(bundleMark.x,bundleHeight,bundleMark.z);
  shape(bundle,'Grain basket','cylinder',[0,0,0],[.5,.40,.43],basketMat);for(let i=0;i<3;i++)shape(bundle,'Barley loaf','sphere',[(i-1)*.14,.22,.02],[.20,.10,.27],breadMat,false);shape(bundle,'Cheese cloth','sphere',[.16,.21,-.1],[.2,.14,.18],linen,false);
  const marker=shape(root,'Shepherd destination','cylinder',[lambMark.x,.02,lambMark.z],[.7,.025,.7],material('Sunlit gold marker',[.85,.66,.25]),false);
  const campCloth=material('Distant camp cloth',[.62,.49,.30]);for(const side of[-1,1])for(let i=0;i<5;i++)shape(root,'Distant army shelter','cone',[side*(8+i*.85),.7,-36-i%2],[1.4,1.5,1.7],campCloth,false);
  async function fieldActor(name:string,tint:[number,number,number]){const actor=await loadConversationActor(app,adultUrl,name);root.addChild(actor.model);actor.model.setLocalScale(.95,.95,.95);actor.tint('Cloth',tint);for(const render of actor.model.findComponents('render') as RenderComponent[])if(/circlet|mantle|clasp/i.test(render.entity.name))render.enabled=false;return actor;}
  const keeper=await fieldActor('The flock keeper',[.46,.37,.24]);keeper.model.setPosition(-3,pastureHeight(-3,1.4),1.4);
  const messenger=await fieldActor('Jesse’s messenger',[.17,.26,.29]);messenger.model.setPosition(-.4,pastureHeight(-.4,-5.6),-5.6);messenger.model.enabled=false;
  // Separate scene-local casts/dressing; the inexpensive rural backdrop is shared.
  const pastureRoot=new Entity('Flock pasture scene'),householdRoot=new Entity('Jesse household scene');root.addChild(pastureRoot);root.addChild(householdRoot);
  for(const node of[...flock.map(s=>s.e),keeper.model,messenger.model,root.findByName('Watering basin')!,root.findByName('Still water')!])pastureRoot.addChild(node);
  householdRoot.addChild(courtyard.root);
  for(const node of [...root.children])if(node.name==='Distant army shelter')householdRoot.addChild(node);
  shape(householdRoot,'Household approach path','box',[0,-.012,-3.2],[1.7,.045,4],material('Trodden household approach',[.55,.45,.29]),false);
  for(const side of[-1,1])for(let i=0;i<5;i++)shape(householdRoot,'Approach path stone','sphere',[side*.99,.045,-1.7-i*.65],[.23,.12,.28],stone,false);
  let location:'pasture'|'courtyard'='pasture';
  function activate(next:typeof location){location=next;pastureRoot.enabled=next==='pasture';householdRoot.enabled=next==='courtyard';}
  function ground(x:number,z:number){return location==='courtyard'&&Math.abs(x)<.85&&z> -5.2&&z< -1.2?.012:pastureHeight(x,z);}
  const pastureWalls=[{minX:-7.5,maxX:-7,minZ:-10.5,maxZ:7},{minX:7,maxX:7.5,minZ:-10.5,maxZ:7},{minX:-7,maxX:7,minZ:7,maxZ:7.5},{minX:-7,maxX:7,minZ:-11,maxZ:-10.5}];
  const householdWalls=[...courtyard.walls,{minX:-7.5,maxX:-7,minZ:-29,maxZ:-1.2},{minX:7,maxX:7.5,minZ:-29,maxZ:-1.2},{minX:-7,maxX:7,minZ:-1.2,maxZ:-.7},{minX:-7,maxX:7,minZ:-29.5,maxZ:-29}];
  activate('pasture');
  let lastTime=0;function step(t:number,tending:boolean){const dt=Math.max(0,Math.min(.05,t-lastTime));lastTime=t;if(location!=='pasture')return;flock.forEach((s,i)=>{const oldX=s.x,oldZ=s.z,roam=i>0&&Math.sin(t*.27+i*2)>.1;
    if(i===0){s.x=lambMark.x;s.z=lambMark.z-.56;}else if(roam){s.x+=(-3+(i%4)*1.5+Math.sin(t*.24+i)*.6-s.x)*(1-Math.exp(-1.2*dt));s.z+=(-2+Math.floor(i/4)*2+Math.cos(t*.22+i)*.5-s.z)*(1-Math.exp(-1.2*dt));}
    const moving=Math.hypot(s.x-oldX,s.z-oldZ)>.0001;if(moving)s.heading=Math.atan2(s.x-oldX,s.z-oldZ)*180/Math.PI;
    s.e.setPosition(s.x,pastureHeight(s.x,s.z),s.z);s.e.setEulerAngles(0,i===0?180:s.heading,0);s.head.setLocalEulerAngles(i===0&&tending?-14:!moving?38+Math.sin(t*1.6+i)*7:Math.sin(t*2+i)*4,Math.sin(t*.5+i)*7,0);
    s.legs.forEach((leg,j)=>leg.setLocalEulerAngles(moving?Math.sin(t*6+i+(j===0||j===3?0:Math.PI))*23:0,0,0));});
  }
  app.once('destroy',()=>matrices.forEach(m=>m.destroy()));step(0,false);root.enabled=false;
  return{root,pastureRoot,householdRoot,keeper,messenger,courtyard,bundle,marker,flock,step,ground,activate,get location(){return location;},get walls(){return location==='pasture'?pastureWalls:householdWalls;}};
}
