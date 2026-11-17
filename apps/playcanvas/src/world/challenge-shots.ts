import type {ValleyShot} from './valley-shots';
export function challengeShot(kind:'arrival'|'challenge'|'exchange',t:number,ground:(x:number,z:number)=>number):ValleyShot{
  const h=(x:number,z:number,y:number)=>ground(x,z)+y;
  if(kind==='arrival')return{id:'approaching-the-line',eye:[1.8-t*.06,h(0,11.6,1.9),13.8-t*.10],focus:[0,h(0,10.9,1.25),9.5],fov:48};
  if(kind==='challenge'){
    if(t<2)return{id:'opposing-armies',eye:[-.5,6.6,14],focus:[0,1.6,-13],fov:56};
    if(t<7.7){const u=Math.max(0,Math.min(1,t/7)),p=u*u*(3-2*u),x=2.8-2.52*p,z=-18+7.5*p;return{id:t<4.5?'the-champion-emerges':'goliath-footsteps',eye:[x+3.0,h(x,z,t<4.5?1.0:.65),z+4.2],focus:[x,h(x,z,1.9),z],fov:48};}
    if(t<8.5)return{id:'ranks-flinch',eye:[-4.4,h(-7.5,-15,3.3),-8.5],focus:[-7.5,h(-7.5,-15,.9),-15],fov:47};
    if(t<10.5)return{id:'soldier-recoils',eye:[-3.5,h(-1.8,7.4,1.8),6.0],focus:[-1.9,h(-1.8,8,1.48),8.0],fov:43};
    if(t<16)return{id:'goliath-terms',eye:[-2.7,h(.28,-10.5,2.8),-5.4],focus:[.28,h(.28,-10.5,2.4),-10.5],fov:39};
    if(t<18.6)return{id:'soldier-fear',eye:[-.5,h(-1.8,8.25,1.85),6.9],focus:[-2.02,h(-2.02,8.25,1.56),8.25],fov:39};
    if(t<23.2)return{id:'goliath-defies-israel',eye:[1.9,h(.28,-10.5,2.83),-6.8],focus:[.28,h(.28,-10.5,2.62),-10.5],fov:36};
    return{id:'david-remains',eye:[.9,h(0,8.2,1.58),6.7],focus:[0,h(0,8.2,1.44),8.2],fov:39};
  }
  if(t<2)return{id:'david-and-eliab',eye:[.3,h(2.4,10,1.95),12.0],focus:[2.4,h(2.4,10,1.3),10],fov:44};
  if(t<7||t>=14.5&&t<19.5)return{id:t<7?'david-questions':'david-answers',eye:[3.35,h(2.4,10.85,1.58),9.5],focus:[2.4,h(2.4,10.85,1.44),10.85],fov:40};
  if(t<14.5)return{id:'eliab-rebukes',eye:[.95,h(2.4,9.3,1.85),10.6],focus:[2.4,h(2.4,9.3,1.65),9.3],fov:39};
  if(t<24)return{id:'soldier-will-report',eye:[-.1,h(-2.02,8.25,1.9),10.5],focus:[-2.02,h(-2.02,8.25,1.60),8.25],fov:39};
  return{id:'david-turns-toward-the-call',eye:[3.35,h(2.4,10.85,1.65),9.5],focus:[2.4,h(2.4,10.85,1.44),10.85],fov:42};
}
