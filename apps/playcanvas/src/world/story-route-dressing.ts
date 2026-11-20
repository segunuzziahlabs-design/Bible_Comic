import {Color,Entity,StandardMaterial,type Application} from 'playcanvas';
import type {RoutePoint} from '../gameplay/story-route';

/** Original sand/stone/linen landmarks, kept outside the walkable centre. */
export function buildStoryRouteDressing(_app:Application,parent:Entity,path:readonly RoutePoint[],ground:(x:number,z:number)=>number,bank=false){
  const root=new Entity('Guided story path');parent.addChild(root);
  const materials=[[.56,.46,.31],[.72,.64,.50],[.26,.16,.085],[.45,.22,.12]].map(rgb=>{const m=new StandardMaterial();m.diffuse=new Color(...rgb as [number,number,number]);m.gloss=.04;m.update();return m;});
  function box(name:string,x:number,z:number,y:number,sx:number,sy:number,sz:number,material:number,yaw=0){const node=new Entity(name);node.addComponent('render',{type:'box',material:materials[material],castShadows:sy>.1});node.setPosition(x,ground(x,z)+y,z);node.setEulerAngles(0,yaw,0);node.setLocalScale(sx,sy,sz);root.addChild(node);}
  for(let i=1;i<path.length;i++){const a=path[i-1],b=path[i],dx=b.x-a.x,dz=b.z-a.z,length=Math.hypot(dx,dz),yaw=Math.atan2(dx,dz)*180/Math.PI;box('Worn path', (a.x+b.x)/2,(a.z+b.z)/2,.012,1.05,.014,length,0,yaw);for(const side of[-1,1]){const x=b.x+dz/length*.85*side,z=b.z-dx/length*.85*side;box('Path edge limestone',x,z,.06,.20,.12,.28,1,yaw);}}
  const end=path.at(-1)!,previous=path.at(-2)!,angle=Math.atan2(end.x-previous.x,end.z-previous.z),x=end.x+Math.cos(angle)*1.1,z=end.z-Math.sin(angle)*1.1;
  box(bank?'Bank trail post':'Camp trail post',x,z,.75,.065,1.5,.065,2);box('Small linen way cloth',x+.19,z,1.19,.35,.42,.025,bank?1:3);
  return{root,dispose(){root.destroy();materials.forEach(m=>m.destroy());}};
}
