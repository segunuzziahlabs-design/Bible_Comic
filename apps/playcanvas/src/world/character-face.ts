import {Color,Entity,Mat4,Quat,StandardMaterial,Vec3,type Application,type Mesh,type MorphInstance,type RenderComponent} from 'playcanvas';

export type CharacterEmotion='neutral'|'surprise'|'anger'|'fear'|'confidence'|'sadness'|'determination'|'happiness';
const moods:Record<CharacterEmotion,{smile:number;brow:number;wide:number}>={
  neutral:{smile:0,brow:0,wide:0},surprise:{smile:0,brow:.65,wide:.22},anger:{smile:-.15,brow:-.45,wide:-.12},
  fear:{smile:-.12,brow:.48,wide:.16},confidence:{smile:.20,brow:.08,wide:0},sadness:{smile:-.3,brow:.2,wide:-.13},
  determination:{smile:-.06,brow:-.23,wide:-.06},happiness:{smile:.5,brow:.12,wide:-.05},
};
const surfaces=new WeakMap<Application,{white:StandardMaterial;iris:StandardMaterial;pupil:StandardMaterial}>();
const warmups=new WeakMap<Application,Set<()=>()=>void>>(),refined=new WeakSet<StandardMaterial>();
const cleanedEyeMeshes=new WeakSet<Mesh>();
export function warmCharacterFaces(app:Application){const restore=[...(warmups.get(app)??[])].map(start=>start());return()=>restore.forEach(fn=>fn());}
function eyeSurfaces(app:Application){let existing=surfaces.get(app);if(existing)return existing;
  const make=(name:string,rgb:number[],gloss:number)=>{const m=new StandardMaterial();m.name=name;m.diffuse=new Color(rgb[0],rgb[1],rgb[2]);m.gloss=gloss;m.update();return m;};
  existing={white:make('Ivory eye surface',[.65,.60,.49],.42),iris:make('Brown iris',[.12,.057,.025],.55),pupil:make('Pupil',[.012,.009,.006],.6)};
  surfaces.set(app,existing);app.once('destroy',()=>Object.values(existing!).forEach(m=>m.destroy()));return existing;
}

/** Single owner for every matching face surface, with independent expression and speech channels. */
export function createCharacterFace(app:Application,model:Entity){
  const renders=model.findComponents('render')as RenderComponent[],morphs=new Map<string,Array<[MorphInstance,number]>>();
  const speechSurfaces=renders.filter(r=>/speaking mouth|lip edge|upper teeth/i.test(r.entity.name));
  for(const render of renders)for(const mesh of render.meshInstances)if(mesh.material instanceof StandardMaterial&&!refined.has(mesh.material)){
    const mat=mesh.material;refined.add(mat);
    if(/skin|cloth|woven|mantle|hair|beard|leather|sandals/i.test(mat.name)){
      // glTF imports roughness into gloss with glossInvert=true. Reducing that
      // value makes imported faces shinier, the opposite of the legacy gloss path.
      const roughness=/cloth|woven|mantle/i.test(mat.name)?.91:/skin/i.test(mat.name)?.72:.83;
      mat.gloss=mat.glossInvert?Math.max(mat.gloss,roughness):Math.min(mat.gloss,1-roughness);
      if(mat.diffuseMap)mat.diffuseMap.anisotropy=2;mat.update();
    }
  }
  for(const render of renders)for(const mesh of render.meshInstances)mesh.morphInstance?.morph.targets.forEach((target,index)=>{
    const entries=morphs.get(target.name)??[];entries.push([mesh.morphInstance!,index]);morphs.set(target.name,entries);
  });
  function morph(name:string,value:number){const safe=Number.isFinite(value)?value:0;for(const [instance,index]of morphs.get(name)??[])instance.setWeight(index,name==='Smile'||name==='BrowLift'?Math.max(-.45,Math.min(1,safe)):Math.max(0,Math.min(1,safe)));}
  const head=model.findByName('Head'),eyes=renders.find(r=>/eyes|eye whites/i.test(r.entity.name));
  const skin=eyes?.meshInstances.find(m=>m.skinInstance)?.skinInstance??renders.flatMap(r=>r.meshInstances).find(m=>m.skinInstance)?.skinInstance;
  const headIndex=skin?.bones.findIndex(b=>b.name==='Head')??-1;
  const inverseBind=headIndex>=0?skin!.skin.inverseBindPose[headIndex]:undefined;
  const eyeNodes:Array<{root:Entity;iris:Entity;pupil:Entity;radius:number;bindScale:Vec3}>=[];
  const eyeGeometry=eyes?.meshInstances[0].mesh,positions:number[]=[];eyeGeometry?.getPositions(positions);
  // Goliath's legacy static irises/pupils share the beard mesh. Keep its beard
  // and eyebrows, removing only triangles wholly inside the measured eye box.
  // Otherwise two pupil layers remain visible after replacing the eye whites.
  let replacedPupilTriangles=0;
  if(positions.length){const bounds=[0,1,2].map(c=>{const values=positions.filter((_,i)=>i%3===c);return[Math.min(...values),Math.max(...values)];});
    for(const render of renders.filter(r=>/Charcoal beard/i.test(r.entity.name)))for(const instance of render.meshInstances){const mesh=instance.mesh;if(!mesh||cleanedEyeMeshes.has(mesh))continue;cleanedEyeMeshes.add(mesh);const vertices:number[]=[],indices:number[]=[],kept:number[]=[];mesh.getPositions(vertices);mesh.getIndices(indices);
      const inside=(i:number)=>{const x=vertices[i*3],y=vertices[i*3+1],z=vertices[i*3+2];return x>=bounds[0][0]&&x<=bounds[0][1]&&y>=bounds[1][0]&&y<=bounds[1][1]&&z>=bounds[2][0];};
      for(let i=0;i<indices.length;i+=3){if(indices.slice(i,i+3).every(inside))replacedPupilTriangles++;else kept.push(indices[i],indices[i+1],indices[i+2]);}
      if(kept.length!==indices.length){mesh.setIndices(kept);mesh.update(undefined,false);}
    }
  }
  if(head&&inverseBind){
    const material=eyeSurfaces(app),rotation=new Quat().setFromMat4(inverseBind),point=new Vec3();
    for(const side of[-1,1]){
      const points=[]as number[][];for(let i=0;i<positions.length;i+=3)if(positions[i]*side>0)points.push(positions.slice(i,i+3));
      const bounds=points.length?[0,1,2].map(c=>[Math.min(...points.map(p=>p[c])),Math.max(...points.map(p=>p[c]))]):undefined;
      // Jesse's retained combined palette mesh has no separate eye node. These
      // centres are measured from its original source rig, not guessed per frame.
      const centre=bounds?new Vec3((bounds[0][0]+bounds[0][1])/2,(bounds[1][0]+bounds[1][1])/2,bounds[2][1]-.004):new Vec3(side*.035,1.696,.080);
      const radius=bounds?Math.max(.007,(bounds[0][1]-bounds[0][0])*.40):.014;
      const root=new Entity(`Tracked ${side<0?'right':'left'} eye`);head.addChild(root);root.setLocalPosition(inverseBind.transformPoint(centre,point));root.setLocalRotation(rotation);
      const part=(name:string,mat:StandardMaterial,x:number,y:number,z:number,depth:number)=>{const entity=new Entity(name);root.addChild(entity);entity.addComponent('render',{type:'sphere',material:mat,castShadows:false});entity.setLocalScale(x*2,y*2,depth*2);entity.setLocalPosition(0,0,z);return entity;};
      part('Eye white',material.white,radius,radius*.62,0,radius*.36);
      const iris=part('Tracked iris',material.iris,radius*.42,radius*.46,radius*.32,radius*.12);
      const pupil=part('Tracked pupil',material.pupil,radius*.21,radius*.29,radius*.42,radius*.07);
      eyeNodes.push({root,iris,pupil,radius,bindScale:inverseBind.getScale(new Vec3())});
    }
    if(eyes)eyes.enabled=false;
  }
  let open=0,round=0,smile=0,brow=0,blink=0,eyeYaw=0,eyePitch=0,emotion:CharacterEmotion='neutral',intensity=0;
  function drawEyes(){const wide=moods[emotion].wide*intensity;
    for(const eye of eyeNodes){eye.root.setLocalScale(eye.bindScale.x,eye.bindScale.y*Math.max(.025,(1-blink)*(1+wide)),eye.bindScale.z);const x=Math.sin(eyeYaw*Math.PI/180)*eye.radius*.65,y=Math.sin(eyePitch*Math.PI/180)*eye.radius*.48;
      eye.iris.setLocalPosition(x,y,eye.radius*.32);eye.pupil.setLocalPosition(x,y,eye.radius*.42);}
  }
  function apply(){const blend=emotion==='neutral'?0:intensity;morph('SpeakOpen',open);morph('SpeakRound',round);morph('Smile',smile*(1-blend)+moods[emotion].smile*blend);morph('BrowLift',brow*(1-blend)+moods[emotion].brow*blend);morph('Blink',blink);
    for(const render of speechSurfaces)render.enabled=/teeth/i.test(render.entity.name)?open>.15:open>.018;
    drawEyes();
  }
  function set(nextOpen:number,nextRound:number,nextSmile=smile,nextBrow=brow,nextBlink=blink){open=Math.max(0,Math.min(.85,Number.isFinite(nextOpen)?nextOpen:0));round=Math.max(0,Math.min(.8,Number.isFinite(nextRound)?nextRound:0));smile=nextSmile;brow=nextBrow;blink=nextBlink;apply();}
  let appWarmups=warmups.get(app);if(!appWarmups){appWarmups=new Set();warmups.set(app,appWarmups);app.once('destroy',()=>appWarmups!.clear());}
  appWarmups.add(()=>{const old=[open,round,smile,brow,blink];set(.08,.08,.08,.08,.08);return()=>set(old[0],old[1],old[2],old[3],old[4]);});
  apply();return{morph,set,speech:(a:number,b:number)=>set(a,b),
    gaze:(yaw:number,pitch:number)=>{eyeYaw=Math.max(-16,Math.min(16,Number.isFinite(yaw)?yaw:0));eyePitch=Math.max(-12,Math.min(12,Number.isFinite(pitch)?pitch:0));drawEyes();},
    expression:(name:CharacterEmotion,strength=.65)=>{emotion=name;intensity=Math.max(0,Math.min(1,strength));apply();},
    mouthWeights:()=> (morphs.get('SpeakOpen')??[]).map(([instance,index])=>instance.getWeight(index)),
    sample:()=>({open,round,blink,eyeYaw,eyePitch,emotion,intensity,eyeCount:eyeNodes.length,replacedPupilTriangles,mouthSurfaces:speechSurfaces.filter(r=>r.enabled).map(r=>r.entity.name),speechBindings:morphs.get('SpeakOpen')?.length??0}),
  };
}

