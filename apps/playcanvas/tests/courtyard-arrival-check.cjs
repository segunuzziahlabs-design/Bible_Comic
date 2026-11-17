const assert=require('node:assert/strict'),{arrivalSample,arrivalDuration,arrivalSwitch,arrivalEnd,pastureExit,pasturePath}=require('../src/gameplay/courtyard-arrival.ts');
const from={x:-1,z:-7.6};
for(let t=1.6;t<=2;t+=.025)assert.equal(arrivalSample(t,from).fade,1,'Scene swap has an opaque hold');
assert.equal(arrivalSample(arrivalSwitch-.001,from).location,'pasture');assert.equal(arrivalSample(arrivalSwitch,from).location,'courtyard');
assert.deepEqual(arrivalSample(arrivalDuration,from).position,arrivalEnd);assert.equal(arrivalSample(arrivalDuration,from).fade,0);assert.deepEqual(pasturePath.at(-1),pastureExit);
for(const dt of[1/120,1/60,1/30,.05]){let old=arrivalSample(2.1,from).position;for(let t=2.1+dt;t<=arrivalDuration;t+=dt){const p=arrivalSample(t,from).position;assert(p.z<=old.z+1e-8,'Forward arrival without reversing');assert(Math.hypot(p.x-old.x,p.z-old.z)/dt<1.85,'Walkable speed, no visible teleport');if(p.z>-4.8&&p.z< -3.8)assert(Math.abs(p.x)<1.2,'Walk through the actual gate opening');old=p;}}
console.log('PASS opaque scene switch, exact end pose, bounded monotonic walking, gate clearance and 120/60/30/20 Hz arrival sampling.');
