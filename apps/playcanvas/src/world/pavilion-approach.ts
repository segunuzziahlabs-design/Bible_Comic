import {Color,Entity,StandardMaterial,type Application} from 'playcanvas';

/** A small camp passage using the pavilion's existing timber/linen/red palette.
 * It is a landmark for the covered connection, not a second loaded pavilion. */
export function buildPavilionApproach(app:Application,parent:Entity,ground:(x:number,z:number)=>number){
  const linen=new StandardMaterial();linen.diffuse=new Color(.75,.66,.51);linen.gloss=.05;linen.update();
  const red=new StandardMaterial();red.diffuse=new Color(.49,.15,.09);red.gloss=.05;red.update();
  const wood=new StandardMaterial();wood.diffuse=new Color(.24,.14,.075);wood.update();
  const earth=new StandardMaterial();earth.diffuse=new Color(.59,.48,.32);earth.update();
  function box(name:string,x:number,y:number,z:number,sx:number,sy:number,sz:number,material:StandardMaterial){const node=new Entity(name);node.addComponent('render',{type:'box',material,castShadows:true});node.setPosition(x,ground(x,z)+y,z);node.setLocalScale(sx,sy,sz);parent.addChild(node);return node;}
  for(const x of[-.4,1.8]){box('Pavilion approach timber',x,1.22,14.95,.10,2.44,.10,wood);box('Pavilion approach red cloth',x+(x<0?-.23:.23),1.1,14.96,.45,2.2,.045,red);}
  box('Woven camp passage lintel',.7,2.37,14.95,2.8,.15,.45,linen);
  box('Pavilion approach awning',.7,2.5,16.15,6,.08,2.8,linen);
  for(const x of[-2.25,3.65])box('Pavilion approach side cloth',x,1.2,16.15,.045,2.4,2.8,linen);
  box('Pavilion approach back cloth',.7,1.2,17.5,6,2.4,.045,linen);
  box('Pavilion approach royal hanging',.7,1.2,17.45,1.8,2.3,.045,red);
  box('Camp path to the pavilion',.7,-.005,13.3,1.45,.018,3.7,earth);
  for(const z of[12.5,13.4,14.3])for(const x of[-.32,1.72])box('Camp route waystone',x,.055,z,.18,.11,.24,linen);
  return{dispose(){linen.destroy();red.destroy();wood.destroy();earth.destroy();}};
}
