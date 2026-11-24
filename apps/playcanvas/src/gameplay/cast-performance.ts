/** Deterministic cues use the owning paused story clock, never wall-clock time. */
export function castBlink(time:number,seed=0){const period=4.3+seed*.17,at=Math.max(0,time+seed*1.37),cycle=Math.floor(at/period),phase=at%period,centre=.1+Math.sin(cycle*1.7+seed)*.025;const first=Math.max(0,1-Math.abs(phase-centre)/.10),second=cycle%3===2?Math.max(0,1-Math.abs(phase-centre-.31)/.09):0;return Math.max(first,second);}
export function cueTurn(from:number,to:number,progress:number){const p=Math.max(0,Math.min(1,progress)),e=p*p*(3-2*p);return from+(((to-from)%360+540)%360-180)*e;}
export function listenerNodStart(duration:number,index:number){return Math.max(.35,duration*.64+index*.17);}
export function crowdCheerPose(time:number,index:number){const age=time-12.1-(index%5)*.13;if(age<0)return 0;const phase=(age+index*.19)%(5.2+(index%4)*.55);return phase<(time<28?3.2:1.7)?Math.floor(phase*2.4)%3:0;}
export function foregroundCheer(time:number){const start=[16,21,26].find(t=>time>=t&&time<t+3);return start===undefined?undefined:time-start;}
