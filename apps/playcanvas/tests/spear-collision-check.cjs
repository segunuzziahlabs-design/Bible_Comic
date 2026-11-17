const assert=require('node:assert/strict');
require('node:module').registerHooks({resolve(s,c,next){if(['./ground-motion','./jump-motion'].includes(s))s+='.ts';return next(s,c);}});
const{segmentDistance,sweepSpear,spearSegments,playerCapsule,spearGeometry,lerpPoint}=require('../src/gameplay/spear-collision.ts');
const point=(x,y,z)=>({x,y,z}),foot=point(0,0,0),air=point(0,.77,0),weapon=(y,x=0)=>({grip:point(x,y,-1.1),tip:point(x,y,.2)});
assert.equal(segmentDistance(point(0,0,0),point(1,0,0),point(.5,-1,0),point(.5,1,0)).distance,0);
assert.equal(segmentDistance(point(0,0,0),point(0,0,0),point(0,2,0),point(0,2,0)).distance,2);
assert.equal(segmentDistance(point(0,0,0),point(2,0,0),point(1,1,0),point(3,1,0)).distance,1);
assert(sweepSpear(weapon(.35),weapon(.35),foot,foot).hit,'Low thrust hits grounded legs');
assert(!sweepSpear(weapon(.35),weapon(.35),air,air).hit,'Real vertical clearance');
assert(sweepSpear(weapon(1),weapon(1),air,air).hit,'Middle thrust hits airborne capsule');
assert(sweepSpear(weapon(1.6),weapon(1.6),air,air).hit,'High thrust hits airborne capsule');
assert(!sweepSpear(weapon(2.2),weapon(2.2),foot,foot).hit,'Weapon above a grounded head misses');
assert(sweepSpear(weapon(1,-2),weapon(1,2),foot,foot).hit,'Fast weapon crossing cannot tunnel');
assert(sweepSpear(weapon(1),weapon(1),point(-2,0,0),point(2,0,0)).hit,'Fast player crossing cannot tunnel');
const radius=playerCapsule(foot).radius+spearGeometry.headRadius+spearGeometry.margin;
assert(sweepSpear(weapon(1,radius),weapon(1,radius),foot,foot).hit,'Grazing contact included');
assert(!sweepSpear(weapon(1,radius+.001),weapon(1,radius+.001),foot,foot).hit,'One-millimetre separation remains clear');
const shaft={grip:point(0,1,.2),tip:point(0,1,1.5)};
assert.equal(sweepSpear(shaft,shaft,foot,foot).hit.part,'shaft','The shaft, not only the tip, can strike');
let seed=31;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296),rnd=()=>point(random()*4-2,random()*3,random()*4-2);
for(let i=0;i<100;i++){
 const from={grip:rnd(),tip:rnd()},to={grip:rnd(),tip:rnd()},a=rnd(),b=rnd();let sampledHit=false;
 for(let j=0;j<=300&&!sampledHit;j++){
  const t=j/300,c=playerCapsule(lerpPoint(a,b,t));
  for(const s of spearSegments({grip:lerpPoint(from.grip,to.grip,t),tip:lerpPoint(from.tip,to.tip,t)}))if(segmentDistance(s.a,s.b,c.bottom,c.top).distance<=c.radius+s.radius+spearGeometry.margin)sampledHit=true;
 }
 if(sampledHit)assert(sweepSpear(from,to,a,b).hit,'Sweep cannot miss a sampled moving contact');
}
console.log('PASS: segment geometry, grounded/airborne clearance, higher hits, shaft contact, grazing, fast crossings and 100 moving-path cases.');
