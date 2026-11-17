const assert=require('node:assert/strict');
const {createJumpMotor,standingHeight}=require('../src/gameplay/jump-motion.ts');
for(const delta of [1/120,1/60,1/30,.1]){
 const motor=createJumpMotor();motor.reset(.25);assert(motor.request(.25));assert.equal(motor.request(.25),false);
 let max=0;const phases=new Set();for(let t=0;t<1.8;t+=delta){motor.step(delta,.25);const s=motor.sample();phases.add(s.phase);max=Math.max(max,s.height);assert(s.feet>=.25-1e-8);}
 assert(max>.72&&max<.81);assert(phases.has('takeoff')&&phases.has('airborne')&&phases.has('landing')&&phases.has('grounded'));
 assert.equal(motor.sample().phase,'grounded');assert.equal(motor.sample().landed,1);assert.equal(motor.sample().started,1);
}
const roof=createJumpMotor();assert.equal(roof.request(0,standingHeight+.03),false);assert(roof.request(0,2.0));
for(let i=0;i<150;i++){roof.step(1/120,0,2);assert(roof.sample().feet+standingHeight<=2.001);}
assert.equal(roof.sample().ceilingHits,1);assert.equal(roof.sample().landed,1);
const slope=createJumpMotor();slope.reset(-.2);slope.request(-.2);for(let i=0;i<150;i++)slope.step(1/120,-.2+i*.002);
assert.equal(slope.sample().phase,'grounded');assert(Math.abs(slope.sample().feet-(-.2+149*.002))<1e-8);
slope.request(.1);slope.step(.3,.1);slope.reset(-.3);assert.equal(slope.sample().phase,'grounded');assert.equal(slope.sample().feet,-.3);assert.equal(slope.sample().cameraLift,0);
console.log('PASS: takeoff/air/landing arc, step rates, single request, roof collision, terrain grounding and restart cancellation.');
