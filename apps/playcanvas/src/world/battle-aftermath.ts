import { Color, Entity, Mesh, MeshInstance, Quat, StandardMaterial, Vec3, calculateNormals, type Application } from 'playcanvas';
import { fallenPhase, swordPickupDuration, type ElahBattleState } from '../gameplay/elah-battle';

/** The original duel sword design, carried as a separate prop after the champion falls. */
export function createBattleAftermath(app:Application,david:Entity,height:(x:number,z:number)=>number){
  const sword=new Entity('Goliath sword · player retrieval');sword.enabled=false;app.root.addChild(sword);
  function surface(colour:[number,number,number],metalness:number){const m=new StandardMaterial();m.diffuse=new Color(...colour);m.useMetalness=true;m.metalness=metalness;m.gloss=.45;m.update();return m;}
  const iron=surface([.40,.43,.44],.64),bronze=surface([.48,.29,.10],.45),hide=surface([.10,.043,.021],0);
  function box(name:string,position:number[],scale:number[],material:StandardMaterial){const e=new Entity(name);e.addComponent('render',{type:'box',material,castShadows:true});sword.addChild(e);e.setLocalPosition(position[0],position[1],position[2]);e.setLocalScale(scale[0],scale[1],scale[2]);}
  // Same tapered silhouette, ridge and dimensions as source-assets/characters/goliath_duel.py.
  const mesh=new Mesh(app.graphicsDevice);mesh.setPositions([-.057,.12,0,.057,.12,0,.044,1.02,0,0,1.19,0,-.044,1.02,0,0,.15,.022,0,.96,.018,0,.15,-.022,0,.96,-.018]);
  const indices=[0,1,5,1,2,6,1,6,5,2,3,6,3,4,6,4,0,5,4,5,6,1,0,7,2,1,7,2,7,8,3,2,8,4,3,8,0,4,8,0,8,7];mesh.setIndices(indices);
  const positions:number[]=[];mesh.getPositions(positions);mesh.setNormals(calculateNormals(positions,indices));mesh.update();
  const blade=new Entity('Retained duel sword blade');blade.addComponent('render',{meshInstances:[new MeshInstance(mesh,iron)],castShadows:true});sword.addChild(blade);
  box('Bronze cross guard',[0,.085,0],[.26,.05,.074],bronze);box('Hide grip',[0,-.035,0],[.042,.20,.046],hide);box('Bronze pommel',[0,-.16,0],[.064,.054,.06],bronze);
  const right=david.findByName('hand_r') as Entity,left=david.findByName('hand_l') as Entity;
  if(!right||!left)throw new Error('Sword performance requires David’s retained hand joints');
  const palm=new Vec3(0,.055,0),gripPoint=new Vec3();
  const fingers=['r','l'].flatMap(side=>['index','middle','ring','thumb'].flatMap(name=>[1,2,3].map(i=>({node:david.findByName(`${name}_0${i}_${side}`),curl:new Quat().setFromEulerAngles(name==='thumb'?20:i===1?35:55,0,0)}))));
  let carried=false;
  function update(state:ElahBattleState){
    sword.enabled=fallenPhase(state.phase)||state.phase==='victory';if(!sword.enabled)return;
    carried=state.swordTaken||['sword_checkpoint','execution','finish_checkpoint','victory'].includes(state.phase)||state.phase==='pickup'&&state.time>swordPickupDuration*.55;
    if(!carried){sword.setPosition(state.foe.x+1.35,height(state.foe.x+1.35,state.foe.z+.65)+.055,state.foe.z+.65);sword.setEulerAngles(88,35,-5);}
    else{
      const p=david.getPosition();
      // The pommel no longer floats between open hands: seat the grip in the
      // right palm and curl the existing weighted finger joints around it.
      right.getWorldTransform().transformPoint(palm,gripPoint);sword.setPosition(gripPoint);
      for(const finger of fingers)if(finger.node)finger.node.setLocalRotation(finger.node.getLocalRotation().clone().mul(finger.curl));
      const t=state.phase==='execution'?state.time:0,raise=t>0?Math.sin(Math.PI*Math.min(1,t/1.3)):0,down=Math.max(0,Math.min(1,(t-1.3)/.35));
      sword.setEulerAngles(18-75*raise+105*down,david.getEulerAngles().y,12);
      // Hand attachment follows the sampled rig; no root snapping or automatic walking.
      if(!Number.isFinite(p.y))sword.enabled=false;
    }
  }
  return{update,sample:()=>({carried,visible:sword.enabled,position:sword.getPosition().clone()})};
}
