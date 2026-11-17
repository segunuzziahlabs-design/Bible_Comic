import {AnimTrack,Vec3,type Entity} from 'playcanvas';
export function createProvisionsCarry(model:Entity,track:AnimTrack|undefined){
  if(!track||!model.anim)throw new Error('David’s provisions performance is missing.');
  const upper=new Set(['spine_02','spine_03','Head','upperarm_l','lowerarm_l','hand_l','upperarm_r','lowerarm_r','hand_r']);
  const curves=track.curves.filter(curve=>curve.paths.every(path=>upper.has(path.entityPath.at(-1)??'')&&path.propertyPath[0]==='localRotation'));
  if(curves.length!==upper.size)throw new Error('The delivery clip does not match David’s upper-body rig.');
  const pose=new AnimTrack('Carry provisions',track.duration,track.inputs,track.outputs,curves);
  const layer=model.anim.addLayer('Provisions',0);layer.assignAnimation('Carry',pose,1,false);layer.play('Carry');model.anim.rebind();
  const left=model.findByName('hand_l'),right=model.findByName('hand_r'),a=new Vec3(),b=new Vec3(),centre=new Vec3();
  if(!left||!right)throw new Error('David’s delivery hands are missing.');
  return{set(active:boolean){layer.weight=active?1:0;if(active)layer.activeStateCurrentTime=0;model.anim!.update(0);},
    grip(){a.copy(left.getPosition());b.copy(right.getPosition());return centre.lerp(a,b,.5);},
    gap(){return left.getPosition().distance(right.getPosition());}};
}
