// Isolated visual test of the actual production face adapter and retained model.
// No account, scene, progress or gameplay code is initialized.
import {Color,Entity} from 'playcanvas';
import {createWebGLApp,observeCanvas,waitForFrame} from '../../src/world/graphics';
import {loadConversationActor} from '../../src/world/conversation-actor';
import type {CharacterEmotion} from '../../src/world/character-face';
import davidUrl from '../../src/assets/david-preparation.glb?url';
const canvas=document.querySelector('canvas')!,app=await createWebGLApp(canvas,true);observeCanvas(app,canvas);app.scene.ambientLight=new Color(.48,.5,.54);
const sun=new Entity('Test key');app.root.addChild(sun);sun.addComponent('light',{type:'directional',intensity:1.15,color:new Color(1,.9,.79)});sun.setEulerAngles(35,125,0);
const camera=new Entity('Test camera');app.root.addChild(camera);camera.addComponent('camera',{fov:29,nearClip:.05,clearColor:new Color(.17,.21,.24)});camera.setPosition(.08,1.47,.90);camera.lookAt(0,1.44,0);
const actor=await loadConversationActor(app,davidUrl,'David');for(const r of actor.model.findComponents('render')as any[])if(r.entity.name.startsWith('Loaned'))r.enabled=false;await waitForFrame(app);
const node=document.getElementById('state')!;
function weights(){const result:Record<string,number[]>={};for(const r of actor.model.findComponents('render')as any[])for(const m of r.meshInstances)m.morphInstance?.morph.targets.forEach((t:any,i:number)=>{(result[t.name]??=[]).push(m.morphInstance.getWeight(i));});return result;}
(window as any).faceLab={set(name:CharacterEmotion,open:number,round:number){actor.expression(name,.7);actor.face(open,round,0,0,0);actor.gaze(-2,0);node.textContent=name+' · controlled component speech input';return{...actor.faceSample(),weights:weights()};},sample:()=>({...actor.faceSample(),weights:weights()})};
node.textContent='Ready — isolated production facial component';
