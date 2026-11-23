const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const yaw=(x:number,z:number)=>Math.atan2(x,z)*180/Math.PI;
export type CrowdPose={x:number;z:number;yaw:number;kind:'Run'|'Cheer'|'Pursue'|'Strike'|'Fall';index:number};
/** Paired paths actually converge before a strike and collapse; no vanishing ranks. */
export function victoryPursuit(t:number,i:number){
  const x=5.2+(i%8)*.73,z=-13.7-Math.floor(i/8)*.85;
  const start=3.4+(i%8)*.13+Math.floor(i/8)*.22;
  const contact=17.2+(i%8)*.28+Math.floor(i/8)*.4;
  const end={x:x+8+i%4*.4,z:z-15-i%3};
  const run=clamp((t-start)/(contact-start)),fallAge=t-contact-.34;
  const enemy:CrowdPose={x:x+(end.x-x)*run,z:z+(end.z-z)*run,yaw:yaw(end.x-x,end.z-z),kind:'Run',index:t>start?Math.floor((t-start)*7+i)%6:0};
  if(fallAge>=0){enemy.x=end.x;enemy.z=end.z;enemy.kind='Fall';enemy.index=Math.min(5,Math.floor(fallAge/.95*6));}
  const chaseStart=6.4+i*.07,p=clamp((t-chaseStart)/(contact-chaseStart));
  const goal={x:end.x-.55,z:end.z+.80};
  const ally:CrowdPose={x:-x+(goal.x+x)*p,z:z+(goal.z-z)*p,yaw:yaw(goal.x+x,goal.z-z),kind:'Pursue',index:Math.floor(Math.max(0,t-chaseStart)*9+i)%6};
  if(t<chaseStart){ally.kind='Cheer';ally.index=0;ally.yaw=90;}
  if(t>=contact){ally.yaw=yaw(end.x-goal.x,end.z-goal.z);ally.kind='Strike';ally.index=Math.min(4,Math.floor((t-contact)/.9*5));}
  return{enemy,ally,pursuing:t>=chaseStart&&t<contact,striking:t>=contact&&t<contact+.9,fallen:fallAge>=.95,contact};
}
