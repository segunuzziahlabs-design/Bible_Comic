import {BUFFER_DYNAMIC,Color,Entity,Mat4,Quat,Vec3,VertexBuffer,VertexFormat,StandardMaterial,type Application,type ContainerResource,type RenderComponent} from 'playcanvas';
import {buildValleyOpening} from './valley-opening';
import goliathUrl from '../assets/goliath-speaking.glb?url';
import actorUrl from '../assets/victory-soldier.glb?url';
import atlasUrl from '../assets/victory-crowd.glb?url';
const ease=(v:number)=>{v=Math.max(0,Math.min(1,v));return v*v*(3-2*v);};
export const victoryVersion='m3-victory-1';
export const davidMark={x:1.4,z:-7},israelMark={x:-3.5,z:-8.2};
export async function buildVictoryWorld(app:Application){
  const world=await buildValleyOpening(app,{goliathUrl,actorUrl,playableBattle:true});
  world.marker.enabled=false;
  for(const name of['Israelite ranks','Philistine ranks','Champion’s shield-bearer'])world.root.findByName(name)!.enabled=false;
  world.champion.model.setPosition(.28,world.groundHeight(.28,-10.5),-10.5);world.champion.pose('goliath_fall',46/24,0,true);world.champion.face(0,0);
  const israel=world.sentinel,bearer=world.patrol;israel.model.name='Cheering Israelite';bearer.model.name='Fleeing shield-bearer';
  israel.tint('Cloth',[.9,1.05,.7]);bearer.tint('Cloth',[1.8,.68,.43]);
  const resource=await new Promise<ContainerResource>((resolve,reject)=>app.assets.loadFromUrl(atlasUrl,'container',(error,asset)=>error||!asset?.resource?reject(new Error('Victory crowd poses could not load.')):resolve(asset.resource as ContainerResource)));
  const groups=[] as Array<{entity:Entity;data:Float32Array;buffer:VertexBuffer;meshes:ReturnType<typeof collectMeshes>;kind:'Run'|'Cheer';index:number}>;
  function collectMeshes(node:Entity){return(node.findComponents('render')as RenderComponent[]).flatMap(r=>r.enabled?r.meshInstances:[]);}
  for(const kind of['Run','Cheer']as const)for(let i=0;i<(kind==='Run'?6:3);i++){
    const entity=resource.instantiateRenderEntity({castShadows:false});entity.name=`${kind} crowd pose ${i}`;world.root.addChild(entity);
    for(const render of entity.findComponents('render')as RenderComponent[])render.enabled=render.entity.name===`${kind} ${i}`;
    const meshes=collectMeshes(entity);if(!meshes.length)throw new Error('A baked victory pose is missing.');
    for(const mesh of meshes)if(mesh.material instanceof StandardMaterial){const mat=mesh.material.clone();mat.diffuse=new Color(1,1,1);mat.update();mesh.material=mat;}
    const data=new Float32Array(24*16),buffer=new VertexBuffer(app.graphicsDevice,VertexFormat.getDefaultInstancingFormat(app.graphicsDevice),24,{data,usage:BUFFER_DYNAMIC});
    for(const mesh of meshes)mesh.setInstancing(buffer,false);groups.push({entity,data,buffer,meshes,kind,index:i});
  }
  app.once('destroy',()=>groups.forEach(g=>g.buffer.destroy()));
  const matrix=new Mat4(),rotation=new Quat(),position=new Vec3(),scale=new Vec3(.88,.88,.88);
  let fleeing=0,raised=0,firstRunner={x:5.2,z:-13.7};
  function stage(t:number,dt:number){
    // Existing dressing activity runs without taking ownership of the actor rigs.
    world.stage(t,true,0,false);
    const lists=new Map(groups.map(g=>[`${g.kind} ${g.index}`,[]as Array<{x:number;z:number;yaw:number}>]));fleeing=raised=0;
    for(let i=0;i<24;i++){
      const x=5.2+(i%8)*.73,z=-13.7-Math.floor(i/8)*.85,age=Math.max(0,t-3.4-(i%8)*.13-Math.floor(i/8)*.22),p=ease(age/8.5);
      const at={x:x+(8+i%4*.4)*p,z:z-(15+i%3)*p,yaw:age>0?151:270};if(age>0)fleeing++;if(i===0)firstRunner={x:at.x,z:at.z};
      lists.get(`Run ${age>0?Math.floor(age/.667*6+i)%6:0}`)!.push(at);
      const cheering=t>12.1+i%5*.13,pose=cheering?Math.floor((t-12.1+i*.17)*2.4)%3:0;if(pose>0)raised++;
      lists.get(`Cheer ${Math.max(0,pose)}`)!.push({x:-x,z,yaw:cheering?50:90});
    }
    for(const group of groups){const actors=lists.get(`${group.kind} ${group.index}`)!;actors.forEach((at,i)=>{rotation.setFromEulerAngles(0,at.yaw,0);position.set(at.x,world.groundHeight(at.x,at.z),at.z);matrix.setTRS(position,rotation,scale);group.data.set(matrix.data,i*16);});group.buffer.setData(group.data);for(const mesh of group.meshes)mesh.instancingCount=actors.length;}
    const age=Math.max(0,t-3.2),p=ease(age/8.4),x=-1.45+11*p-4*Math.sin(Math.PI*p),z=-9.8-16*p;
    bearer.model.enabled=t<12.5;bearer.model.setPosition(x,world.groundHeight(x,z),z);bearer.model.setEulerAngles(0,age>0?Math.atan2(11-4*Math.PI*Math.cos(Math.PI*p),-16)*180/Math.PI:0,0);
    if(bearer.model.enabled)bearer.pose(age>0?'retreat_run':'listen',age>0?age%.667:t%bearer.tracks.get('listen')!.duration,dt);
    israel.model.setPosition(israelMark.x,world.groundHeight(israelMark.x,israelMark.z),israelMark.z);israel.model.setEulerAngles(0,48,0);
    const cheer=t>=12.1;israel.pose(cheer?'victory_cheer':'listen',cheer?(t-12.1)%3:t%israel.tracks.get('listen')!.duration,dt);
  }
  stage(0,0);
  return{...world,israel,bearer,stageVictory:stage,sample:()=>({fleeing,raised,firstRunner,instances:groups.map(g=>({pose:`${g.kind} ${g.index}`,count:g.meshes[0].instancingCount}))})};
}
