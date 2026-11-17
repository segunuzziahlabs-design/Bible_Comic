import type { GroundPoint } from './ground-motion';

export const pasturePath=[{x:1.2,z:1.05},{x:-.65,z:-2.8},{x:-1.05,z:-5},{x:-1,z:-8.2}] as const;
export const pastureExit=pasturePath[pasturePath.length-1];
export const arrivalEntry={x:0,z:-2.1},arrivalEnd={x:-.7,z:-7.1};
export const arrivalDuration=7.1,arrivalSwitch=1.8;
const clamp=(v:number)=>Math.max(0,Math.min(1,v));

/** Opaque hold surrounds the location switch; movement after it is scene-local. */
export function arrivalSample(time:number,from:GroundPoint) {
  const courtyard=time>=arrivalSwitch;
  const fade=time<1.2?0:time<1.6?clamp((time-1.2)/.4):time<=2?1:1-clamp((time-2)/.55);
  if(!courtyard){const t=clamp(time/1.5);return{location:'pasture' as const,fade,position:{x:from.x+(-1-from.x)*t,z:from.z+(-9.4-from.z)*t},progress:0};}
  const t=clamp((time-2.1)/4.25),p=t*t*(3-2*t);
  const points=[arrivalEntry,{x:0,z:-4.6},arrivalEnd],first=2.5,last=Math.hypot(.7,2.5),along=p*(first+last);
  const a=along<first?points[0]:points[1],b=along<first?points[1]:points[2],u=along<first?along/first:(along-first)/last;
  return{location:'courtyard' as const,fade,position:{x:a.x+(b.x-a.x)*u,z:a.z+(b.z-a.z)*u},progress:t};
}
