export type CampShot={id:string;eye:[number,number,number];focus:[number,number,number];fov:number};
export function campShot(kind:'arrival'|'delivery'|'greeting',time:number):CampShot{
  if(kind==='arrival')return{id:'arrival',eye:[4.6-time*.1,2.7,5.8],focus:[-.5,1.0,0],fov:49};
  if(kind==='delivery'){
    if(time<3)return{id:'keeper-two-shot',eye:[1.0,1.95,2.8],focus:[-2,1.25,.8],fov:43};
    if(time<8.5)return{id:'delivery-david',eye:[-.9,1.58,.55],focus:[-2,1.43,1.85],fov:40};
    if(time<13)return{id:'keeper-response',eye:[-.8,1.85,1.55],focus:[-2,1.68,0],fov:39};
    if(time<17.5)return{id:'provisions-set-down',eye:[-.55,1.45,2.1],focus:[-2,.95,1.45],fov:44};
    if(time<21.5)return{id:'david-asks-directions',eye:[-.9,1.58,.55],focus:[-2,1.43,1.85],fov:40};
    return{id:'keeper-directions',eye:[-.8,1.85,1.55],focus:[-2,1.68,0],fov:39};
  }
  if(time<2)return{id:'brothers-two-shot',eye:[4.8,2.1,-.3],focus:[2.2,1.3,-1.75],fov:45};
  if(time<7||time>=15&&time<22)return{id:'eliab-speaks',eye:[1,1.82,-1.6],focus:[2.2,1.65,-2.7],fov:40};
  return{id:'david-greets-brothers',eye:[3.1,1.57,-2.0],focus:[2.2,1.43,-.8],fov:40};
}
