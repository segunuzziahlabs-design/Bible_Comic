import type {ValleyShot} from './valley-shots';
import {victoryPursuit} from '../gameplay/victory-pursuit';
export function victoryShot(t:number,ground:(x:number,z:number)=>number):ValleyShot{
  const h=(x:number,z:number,y:number)=>ground(x,z)+y;
  if(t<3)return{id:'the-battle-is-over',eye:[2.9,h(0,-6,2.2),-6.3],focus:[.28,h(.28,-10.5,.5),-10.5],fov:48};
  if(t<7)return{id:'the-shield-bearer-turns',eye:[-4,h(-2,-7,2.7),-7],focus:[-.8,h(-.8,-13,1.25),-13],fov:51};
  if(t<12.1){const a=victoryPursuit(t,0).ally;return{id:'israel-pursues-the-philistines',eye:[a.x-4,h(a.x,a.z,3.4),a.z+5.5],focus:[a.x+2,h(a.x,a.z,1),a.z-2],fov:57};}
  if(t<16.6)return{id:'israel-recognises-victory',eye:[-1.2,h(-3.5,-8.2,1.95),-5.4],focus:[-3.5,h(-3.5,-8.2,1.5),-8.2],fov:43};
  if(t<22.5){const a=victoryPursuit(t,3).enemy;return{id:t<18?'pursuit-closes-in':'israel-overcomes-the-retreating-ranks',eye:[a.x-5,h(a.x,a.z,3.5),a.z+5.8],focus:[a.x,h(a.x,a.z,.85),a.z],fov:53};}
  if(t<28.5)return{id:'david-gives-thanks',eye:[3.1,h(1.4,-7,1.65),-9],focus:[1.4,h(1.4,-7,1.43),-7],fov:40};
  return{id:'faith-and-courage',eye:[4.4+(t-28.5)*.13,6.6+(t-28.5)*.06,1.4],focus:[.1,1.6,-15.5],fov:55};
}
