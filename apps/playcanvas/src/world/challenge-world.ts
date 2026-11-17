import type {Application} from 'playcanvas';
import {buildValleyOpening} from './valley-opening';
import goliathUrl from '../assets/goliath-encounter.glb?url';
import adultUrl from '../assets/challenge-soldier.glb?url';
export const challengeVersion='cinematic-challenge-2';
export const hearingMark={x:0,z:8.2},eliabMark={x:2.4,z:10.85};
export const alarmStart=7.7;
const ease=(v:number)=>{const t=Math.max(0,Math.min(1,v));return t*t*(3-2*t);};
export async function buildChallengeWorld(app:Application){
  const world=await buildValleyOpening(app,{goliathUrl,actorUrl:adultUrl});
  const eliab=world.sentinel,soldier=world.patrol;eliab.model.name='Eliab';soldier.model.name='Alarmed soldier';
  eliab.tint('Cloth',[1.9,.7,.45]);eliab.tint('Hair',[.75,.75,.75]);soldier.tint('Cloth',[.9,1.1,.7]);
  if(!world.champion.mouthWeights().length)throw new Error('Goliath’s speaking face is missing.');
  function step(globalTime:number,challengeTime:number,heard:boolean){
    const age=challengeTime>=0?challengeTime-alarmStart:heard?100:-1;
    const alarm=age<0?0:ease(age/1.5);
    world.stage(globalTime,true,Math.max(alarm,challengeTime>=0?.5*ease(challengeTime/5):0),false);
    const entrance=heard?1:challengeTime>=0?ease(challengeTime/7):0,xg=2.8-2.52*entrance,zg=-18+7.5*entrance;world.champion.model.setPosition(xg,world.groundHeight(xg,zg),zg);world.champion.model.setEulerAngles(0,Math.atan2(-2.52,7.5)*180/Math.PI*(1-entrance),0);
    world.root.findByName('Champion’s shield-bearer')?.setPosition(-1.45-1.1*Math.sin(Math.PI*entrance),world.groundHeight(-1.45,zg+.6),zg+.6);
    const retreat=.85*ease((age-.12)/1.65),x=-1.8-.22*ease((age-.12)/1.65),z=7.4+retreat;
    soldier.model.setPosition(x,world.groundHeight(x,z),z);soldier.model.setEulerAngles(0,180,0);
    const eliabFlinch=age>=.45&&age<4?.12*Math.sin(Math.PI*ease((age-.45)/3.55)):0;
    eliab.model.setPosition(2.4,world.groundHeight(2.4,9.3),9.3+eliabFlinch);eliab.model.setEulerAngles(0,180,0);
    return{age,retreat,alarm,eliabAge:age-.45,entrance,entranceWalking:challengeTime>=0&&challengeTime<7};
  }
  step(0,-1,false);
  return{...world,eliab,soldier,step};
}
