import { lerpPoint, type Point3, type SpearSample } from './spear-collision';

export const spearFlightDuration=1.25, spearGravity=12;
export type ThrownSpear={time:number;start:Point3;landing:Point3;initial:SpearSample;sample:SpearSample;landed:boolean};
export function thrownSpearSample(flight:ThrownSpear,age:number):SpearSample {
  const t=Math.max(0,Math.min(spearFlightDuration,age)),u=t/spearFlightDuration;
  const vy=(flight.landing.y-flight.start.y+.5*spearGravity*spearFlightDuration**2)/spearFlightDuration;
  const tip={x:flight.start.x+(flight.landing.x-flight.start.x)*u,y:flight.start.y+vy*t-.5*spearGravity*t*t,z:flight.start.z+(flight.landing.z-flight.start.z)*u};
  const velocity={x:(flight.landing.x-flight.start.x)/spearFlightDuration,y:vy-spearGravity*t,z:(flight.landing.z-flight.start.z)/spearFlightDuration};
  const length=Math.hypot(flight.initial.tip.x-flight.initial.grip.x,flight.initial.tip.y-flight.initial.grip.y,flight.initial.tip.z-flight.initial.grip.z);
  const speed=Math.hypot(velocity.x,velocity.y,velocity.z)||1;
  const old={x:flight.initial.tip.x-flight.initial.grip.x,y:flight.initial.tip.y-flight.initial.grip.y,z:flight.initial.tip.z-flight.initial.grip.z};
  const direction=lerpPoint(old,{x:velocity.x/speed*length,y:velocity.y/speed*length,z:velocity.z/speed*length},Math.min(1,t/.12));
  const magnitude=Math.hypot(direction.x,direction.y,direction.z)||1;
  return{tip,grip:{x:tip.x-direction.x/magnitude*length,y:tip.y-direction.y/magnitude*length,z:tip.z-direction.z/magnitude*length}};
}
