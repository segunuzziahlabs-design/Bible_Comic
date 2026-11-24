import {BUFFER_DYNAMIC,Color,Entity,Mat4,Quat,Vec3,VertexBuffer,VertexFormat,StandardMaterial,type Application,type ContainerResource,type RenderComponent} from 'playcanvas';
import {buildValleyOpening} from './valley-opening';
import goliathUrl from '../assets/goliath-speaking.glb?url';
import actorUrl from '../assets/victory-soldier.glb?url';
import atlasUrl from '../assets/victory-crowd.glb?url';
import pursuitUrl from '../assets/victory-pursuit.glb?url';
import {cueTurn,foregroundCheer} from '../gameplay/cast-performance';
import {victoryPursuit,type CrowdPose} from '../gameplay/victory-pursuit';
import {dialogueGestureTime} from '../gameplay/story-motion';
const ease=(v:number)=>{v=Math.max(0,Math.min(1,v));return v*v*(3-2*v);};
export const victoryVersion='victory-pursuit-2026-11-23';
export const davidMark={x:1.4,z:-7},israelMark={x:-3.5,z:-8.2};
export async function buildVictoryWorld(app:Application){
  const world=await buildValleyOpening(app,{goliathUrl,actorUrl,playableBattle:true});
  world.marker.enabled=false;
  for(const name of['Israelite ranks','Philistine ranks','Champion’s shield-bearer'])world.root.findByName(name)!.enabled=false;
  world.champion.model.setPosition(.28,world.groundHeight(.28,-10.5),-10.5);world.champion.pose('goliath_fall',46/24,0,true);world.champion.face(0,0,0,0,1);
  const israel=world.sentinel,bearer=world.patrol;israel.model.name='Cheering Israelite';bearer.model.name='Fleeing shield-bearer';
  israel.tint('Cloth',[.9,1.05,.7]);bearer.tint('Cloth',[1.8,.68,.43]);
  const resource=await new Promise<ContainerResource>((resolve,reject)=>app.assets.loadFromUrl(atlasUrl,'container',(error,asset)=>error||!asset?.resource?reject(new Error('Victory crowd poses could not load.')):resolve(asset.resource as ContainerResource)));
  const pursuit=await new Promise<ContainerResource>((resolve,reject)=>app.assets.loadFromUrl(pursuitUrl,'container',(error,asset)=>error||!asset?.resource?reject(new Error('Pursuit crowd poses could not load.')):resolve(asset.resource as ContainerResource)));
  const groups=[] as Array<{entity:Entity;data:Float32Array;buffer:VertexBuffer;meshes:ReturnType<typeof collectMeshes>;kind:CrowdPose['kind'];index:number}>;
  function collectMeshes(node:Entity){return(node.findComponents('render')as RenderComponent[]).flatMap(r=>r.enabled?r.meshInstances:[]);}
  for(const kind of['Run','Cheer','Pursue','Strike','Fall']as const)for(let i=0;i<({Run:6,Cheer:3,Pursue:6,Strike:5,Fall:6}[kind]);i++){
    const entity=(kind==='Run'||kind==='Cheer'?resource:pursuit).instantiateRenderEntity({castShadows:false});entity.name=`${kind} crowd pose ${i}`;world.root.addChild(entity);
    for(const render of entity.findComponents('render')as RenderComponent[])render.enabled=render.entity.name===`${kind} ${i}`;
    const meshes=collectMeshes(entity);if(!meshes.length)throw new Error('A baked victory pose is missing.');
    for(const mesh of meshes)if(mesh.material instanceof StandardMaterial){const mat=mesh.material.clone();mat.diffuse=new Color(1,1,1);mat.update();mesh.material=mat;}
    const data=new Float32Array(24*16),buffer=new VertexBuffer(app.graphicsDevice,VertexFormat.getDefaultInstancingFormat(app.graphicsDevice),24,{data,usage:BUFFER_DYNAMIC});
    for(const mesh of meshes)mesh.setInstancing(buffer,false);groups.push({entity,data,buffer,meshes,kind,index:i});
  }
  app.once('destroy',()=>groups.forEach(g=>g.buffer.destroy()));
  const matrix=new Mat4(),rotation=new Quat(),position=new Vec3(),scale=new Vec3(.88,.88,.88);
  let fleeing=0,raised=0,pursuing=0,striking=0,fallen=0,bearerStride=0,previousTime=0,previousBearer={x:-1.45,z:-9.8},firstRunner={x:5.2,z:-13.7},firstPursuer={x:-5.2,z:-13.7};
  function stage(t:number,dt:number,line?:{speaker:string;local:number;duration:number}){
    // Existing dressing activity runs without taking ownership of the actor rigs.
    world.stage(t,true,0,false);
    const lists=new Map(groups.map(g=>[`${g.kind} ${g.index}`,[]as Array<{x:number;z:number;yaw:number}>]));fleeing=raised=pursuing=striking=fallen=0;
    for(let i=0;i<24;i++){
      const pair=victoryPursuit(t,i);if(pair.pursuing)pursuing++;if(pair.striking)striking++;if(pair.fallen)fallen++;
      if(pair.enemy.kind==='Run'&&t>3.4)fleeing++;
      if(i===0){firstRunner={x:pair.enemy.x,z:pair.enemy.z};firstPursuer={x:pair.ally.x,z:pair.ally.z};}
      for(const at of[pair.enemy,pair.ally])lists.get(`${at.kind} ${at.index}`)!.push(at);
    }
    for(const group of groups){const actors=lists.get(`${group.kind} ${group.index}`)!;actors.forEach((at,i)=>{rotation.setFromEulerAngles(0,at.yaw,0);position.set(at.x,world.groundHeight(at.x,at.z),at.z);matrix.setTRS(position,rotation,scale);group.data.set(matrix.data,i*16);});group.buffer.setData(group.data);for(const mesh of group.meshes)mesh.instancingCount=actors.length;}
    const age=Math.max(0,t-3.2),p=ease(age/8.4),x=-1.45+11*p-4*Math.sin(Math.PI*p),z=-9.8-16*p;
    if(t<previousTime||t===0)bearerStride=0;else if(age>.8)bearerStride+=Math.hypot(x-previousBearer.x,z-previousBearer.z);previousTime=t;previousBearer={x,z};
    bearer.model.enabled=t<12.5;bearer.model.setPosition(x,world.groundHeight(x,z),z);bearer.model.setEulerAngles(0,cueTurn(0,Math.atan2(11-4*Math.PI*Math.cos(Math.PI*p),-16)*180/Math.PI,age/.85),0);
    if(bearer.model.enabled){const reacting=age>0&&age<.8&&bearer.tracks.has('react_alarm'),clip=reacting?'react_alarm':age>0?'retreat_run':'listen';bearer.pose(clip,reacting?age/.8*bearer.tracks.get(clip)!.duration:age>0?(bearerStride/1.67*.667)%.667:t%bearer.tracks.get('listen')!.duration,dt);}
    israel.model.setPosition(israelMark.x,world.groundHeight(israelMark.x,israelMark.z),israelMark.z);israel.model.setEulerAngles(0,48,0);
    const cheer=foregroundCheer(t),speaking=line?.speaker==='Soldier'&&israel.tracks.has('speak_concern'),clip=speaking?'speak_concern':cheer!==undefined?'victory_cheer':'listen';israel.pose(clip,speaking?dialogueGestureTime(line.local,line.duration,israel.tracks.get(clip)!.duration):cheer!==undefined?cheer:t%israel.tracks.get(clip)!.duration,dt);
  }
  stage(0,0);
  return{...world,israel,bearer,stageVictory:stage,sample:()=>({fleeing,raised,pursuing,striking,fallen,firstRunner,firstPursuer,instances:groups.map(g=>({pose:`${g.kind} ${g.index}`,count:g.meshes[0].instancingCount}))})};
}
