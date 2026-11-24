import {Color,Entity,StandardMaterial,type Application} from 'playcanvas';
import {stoneSettleSeconds,type BattleStones} from '../gameplay/battle-stones';

/** Five reusable visual tokens. Inventory and collection remain owned by battle rules. */
export function createRecoverableStones(app:Application){
  function material(color:number[],glow:number[]){const m=new StandardMaterial();m.diffuse=new Color(...color);m.emissive=new Color(...glow);m.update();return m;}
  const rock=material([.89,.84,.69],[.13,.12,.08]),ring=material([.21,.35,.30],[.04,.09,.06]),selected=material([.92,.72,.35],[.25,.16,.03]);
  const nodes=Array.from({length:5},(_,i)=>{
    const stone=new Entity('Recoverable stone '+(i+1)),marker=new Entity('Recovery stone ring '+(i+1));
    stone.addComponent('render',{type:'sphere',material:rock,castShadows:false});stone.setLocalScale(.18,.12,.16);
    marker.addComponent('render',{type:'cylinder',material:ring,castShadows:false});marker.setLocalScale(.5,.014,.5);
    app.root.addChild(stone);app.root.addChild(marker);stone.enabled=marker.enabled=false;return{stone,marker};
  });
  app.on('destroy',()=>[rock,ring,selected].forEach(m=>m.destroy()));
  return{warm(){const states=nodes.map(n=>[n.stone.enabled,n.marker.enabled]);nodes.forEach(n=>{n.stone.enabled=n.marker.enabled=true;});return()=>nodes.forEach((n,i)=>{n.stone.enabled=states[i][0];n.marker.enabled=states[i][1];});},update(pool:BattleStones,active:boolean){for(const [i,node]of nodes.entries()){
    const token=pool.stones[i],visible=active&&token?.status==='ground'&&!!token.position;node.stone.enabled=!!visible;node.marker.enabled=!!visible&&pool.guiding;
    if(!visible)continue;const end=token.position!,start=token.impact??end,u=Math.min(1,token.age/stoneSettleSeconds),t=u*u*(3-2*u);
    node.stone.setPosition(start.x+(end.x-start.x)*t,start.y+(end.y-start.y)*t+.06*Math.sin(Math.PI*u),start.z+(end.z-start.z)*t);
    node.marker.setPosition(end.x,end.y-.047,end.z);for(const mesh of node.marker.render!.meshInstances)mesh.material=pool.targetId===token.id?selected:ring;
  }}};
}
