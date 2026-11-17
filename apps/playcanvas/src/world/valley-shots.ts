export type ValleyShot = { id: string; eye: [number,number,number]; focus: [number,number,number]; fov: number };
export function openingShot(time:number, ground:(x:number,z:number)=>number):ValleyShot {
  if(time<6)return{id:'arrival',eye:[1.4,ground(0,12)+.62,13.5-time*.08],focus:[0,ground(0,11)+.65,11.2],fov:46};
  if(time<12)return{id:'valley-reveal',eye:[-.5+(time-6)*.11,7.1,18.5-(time-6)*.19],focus:[0,1.4,-17],fov:57};
  if(time<18.3)return{id:'soldier-speaking',eye:[.3,ground(2.4,9.3)+1.85,11.2],focus:[2.4,ground(2.4,9.3)+1.65,9.3],fov:38};
  if(time<25.9)return{id:'a-voice-from-the-philistine-line',eye:[2.8-(time-18.3)*.05,4.4,-1.5],focus:[7,1.8,-16],fov:52};
  if(time<28.3)return{id:'soldier-reaction',eye:[-1.2,ground(-3,7.4)+1.8,10.9],focus:[-3,ground(-3,7.4)+1.55,7.4],fov:40};
  return{id:'david-resolve',eye:[.9,ground(0,10.8)+1.57,9.0],focus:[0,ground(0,10.8)+1.44,10.8],fov:39};
}
export function surveyShot(time:number,ground:(x:number,z:number)=>number):ValleyShot {
  if(time<2.4)return{id:'survey-wide',eye:[-1.2,6.7,13],focus:[0,1.3,-17],fov:56};
  return{id:'survey-guidance',eye:[.3,ground(2.4,9.3)+1.85,11.2],focus:[2.4,ground(2.4,9.3)+1.62,9.3],fov:41};
}
