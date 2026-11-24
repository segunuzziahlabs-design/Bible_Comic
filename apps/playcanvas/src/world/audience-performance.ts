import { Quat,Vec3, type Entity,type GraphNode } from 'playcanvas';
import type {CharacterEmotion} from './character-face';
type Actor={model:Entity;gaze?:(yaw:number,pitch:number)=>void;expression?:(name:CharacterEmotion,strength?:number)=>void};

/** Small additive reactions over the authored clips. Restore before sampling the
 * next pose so offsets never accumulate or alter the saved/default rig. */
export function createAudiencePerformance(actor: Actor) {
  const nodes = ['Head', 'spine_03'].map(name => {
    const node = actor.model.findByName(name);
    if (!node) throw new Error(`Missing ${actor.model.name} reaction joint ${name}`);
    return { node: node as GraphNode, base: new Quat() };
  });
  const offset = new Quat(), combined = new Quat(),worldRotation=new Quat(),parentRotation=new Quat(),pitchRotation=new Quat(),gazeTarget=new Vec3();
  const shoulders=['upperarm_l','upperarm_r'].map(name=>actor.model.findByName(name)).filter((n):n is GraphNode=>!!n).map(node=>({node,base:new Quat()}));
  const all=[...nodes,...shoulders];
  let applied = false,previous=-1,eyeYaw=0,headYaw=0,eyePitch=0,headPitch=0,lookAway=false;
  function restore() {
    if (applied) for (const { node, base } of all) node.setLocalRotation(base);
    applied = false;
  }
  function apply(time: number, speaking: boolean, nod: number, seed: number,partner?:GraphNode,emotion:CharacterEmotion='neutral',bodyLanguage=true) {
    for (const { node, base } of all) base.copy(node.getLocalRotation());
    const head = nodes[0], chest = nodes[1];
    const dt=previous<0||time<previous?1/30:Math.min(.05,Math.max(0,time-previous));previous=time;
    let desiredYaw=0,desiredPitch=0;
    if(partner){const otherRight=partner.findByName('Tracked right eye'),otherLeft=partner.findByName('Tracked left eye');
      const target=otherRight&&otherLeft?gazeTarget.lerp(otherRight.getPosition(),otherLeft.getPosition(),.5):partner.getPosition(),eye=head.node.findByName('Tracked right eye'),at=eye?.getPosition()??head.node.getPosition(),dx=target.x-at.x,dz=target.z-at.z,forward=eye?.forward;
      const actualYaw=forward?Math.atan2(-forward.x,-forward.z)*180/Math.PI:actor.model.getEulerAngles().y;
      const actualPitch=forward?Math.atan2(-forward.y,Math.hypot(forward.x,forward.z))*180/Math.PI:0;
      desiredYaw=((Math.atan2(dx,dz)*180/Math.PI-actualYaw+540)%360)-180;
      desiredPitch=Math.atan2(target.y-at.y,Math.hypot(dx,dz))*180/Math.PI-actualPitch;
    }
    const phase=(time+seed*1.7)%8.9;lookAway=phase>6.9&&phase<7.65;
    const glance=lookAway?Math.sin((phase-6.9)/.75*Math.PI)*(speaking?5:9):0;
    desiredYaw=Math.max(-30,Math.min(30,desiredYaw+glance));desiredPitch=Math.max(-15,Math.min(15,desiredPitch));
    eyeYaw+=(desiredYaw-eyeYaw)*(1-Math.exp(-20*dt));headYaw+=(desiredYaw-headYaw)*(1-Math.exp(-4.2*dt));
    eyePitch+=(desiredPitch-eyePitch)*(1-Math.exp(-18*dt));headPitch+=(desiredPitch-headPitch)*(1-Math.exp(-3.6*dt));
    const bodyYaw=bodyLanguage?headYaw*.20:0;
    offset.setFromEulerAngles(bodyLanguage?Math.sin(time * 1.45 + seed) * .32:0,0,bodyLanguage?Math.sin(time * .53 + seed) * .28:0);
    chest.node.setLocalRotation(combined.mul2(chest.base, offset));
    offset.setFromAxisAngle(Vec3.UP,bodyYaw);worldRotation.mul2(offset,chest.node.getRotation());parentRotation.copy(chest.node.parent!.getRotation()).invert();chest.node.setLocalRotation(combined.mul2(parentRotation,worldRotation));
    // Rotate about the character's world up/right axes, not an assumed bone axis.
    // This preserves the original rig's non-standard Head bind orientation.
    offset.setFromAxisAngle(Vec3.UP,headYaw-bodyYaw);
    pitchRotation.setFromAxisAngle(actor.model.right,-headPitch+nod+Math.sin(time*2.1+seed)*(speaking?.55:.22));
    worldRotation.mul2(offset,head.node.getRotation());worldRotation.mul2(pitchRotation,worldRotation);
    parentRotation.copy(head.node.parent!.getRotation()).invert();head.node.setLocalRotation(combined.mul2(parentRotation,worldRotation));
    if(bodyLanguage)for(const [i,{node,base}]of shoulders.entries()){offset.setFromEulerAngles(Math.sin(time*1.7+seed+i)*.24,0,Math.sin(time*.8+seed+i)*(speaking?.55:.28));node.setLocalRotation(combined.mul2(base,offset));}
    actor.gaze?.(eyeYaw-headYaw+Math.sin(time*3.7+seed)*.55,eyePitch-headPitch+Math.sin(time*2.4+seed)*.22);
    actor.expression?.(emotion,speaking?.7:.45);
    applied = true;
  }
  return { restore, apply,sample:()=>({eyeYaw,headYaw,eyePitch,headPitch,lookAway}) };
}

export function reactionNod(time: number, start: number, duration: number, degrees = 3) {
  const phase = (time - start) / duration;
  return phase > 0 && phase < 1 ? Math.sin(phase * Math.PI * 2) * Math.sin(phase * Math.PI) * degrees : 0;
}

/** Continue an expressive gesture with a smooth return instead of freezing the
 * last authored frame halfway through a longer voiced line. */
export function speakingGestureTime(local: number, duration: number) {
  const phase = Math.max(0, local) % (duration * 2);
  return phase <= duration ? phase : duration * 2 - phase;
}
