const assert=require('node:assert/strict');
require('node:module').registerHooks({resolve(s,c,next){if(s==='playcanvas')return next('./build/playcanvas/src/index.js',{...c,parentURL:new URL('../node_modules/playcanvas/package.json',require('node:url').pathToFileURL(__filename)).href});if(c.parentURL?.includes('/gameplay/')&&s.startsWith('.')&&!require('node:path').extname(s))s+='.ts';return next(s,c);}});
const {Vec3}=require('../node_modules/playcanvas/build/playcanvas/src/index.js');
const {slingPhysics,stoneAt,stoneContact,stoneVelocity,slingGuidance}=require('../src/gameplay/sling-ballistics.ts');
const {sweepSword}=require('../src/gameplay/sword-combat.ts');
const {createElahBattle}=require('../src/gameplay/elah-battle.ts');
const origin={x:0,y:1.4,z:0},head={x:0,y:3,z:-9.5};
function direction(at,target){const r=Math.hypot(target.x-at.x,target.z-at.z),dy=target.y-at.y,v=slingPhysics.speed,g=slingPhysics.gravity,disc=v**4-g*(g*r*r+2*dy*v*v);assert(disc>0);const tan=(v*v-Math.sqrt(disc))/(g*r),cos=1/Math.sqrt(1+tan*tan);return{x:(target.x-at.x)/r*cos*v,y:tan*cos*v,z:(target.z-at.z)/r*cos*v};}
const velocity=direction(origin,head),aim={x:origin.x+velocity.x,y:origin.y+velocity.y,z:origin.z+velocity.z};
assert(Math.abs(Math.hypot(...Object.values(stoneVelocity(origin,aim)))-slingPhysics.speed)<1e-8);
for(const dt of[1/120,1/60,1/30,.05]){let old=origin,hit=false;for(let t=dt;t<2;t+=dt){const point=stoneAt(origin,velocity,t);hit ||=stoneContact(old,point,head)!==undefined;old=point;}assert(hit,'A physical forehead shot at '+dt);}
assert(Math.abs(stoneContact({x:-2,y:3,z:0},{x:2,y:3,z:0},{x:0,y:3,z:0})-.43125)<1e-10,'Swept contact catches between-frame crossing');
assert.equal(stoneContact({x:-2,y:4,z:0},{x:2,y:4,z:0},{x:0,y:3,z:0}),undefined);
const ground=()=>0,foe={...head,y:0};
assert(slingGuidance(origin,foe,origin,aim,head,ground,0).aligned);
assert.equal(slingGuidance({x:0,y:0,z:-5.5},foe,origin,aim,head,ground,0).position,'Move back');
assert.equal(slingGuidance({x:0,y:0,z:12},foe,origin,aim,head,ground,0).position,'Move closer');
assert(!slingGuidance(origin,foe,origin,{x:5,y:5,z:-9},head,ground,0).aligned);
assert.equal(slingGuidance(origin,foe,origin,head,head,ground,0).aiming,'Aim higher','Line-of-sight aim falls below the forehead');
const from={grip:{x:0,y:3,z:0},tip:{x:0,y:4.5,z:0}},to={grip:{x:0,y:1.1,z:0},tip:{x:0,y:.2,z:0}},feet={x:0,y:0,z:0};
assert(sweepSword(from,to,feet,feet).hit);for(const away of[{x:2,y:0,z:0},{x:-2,y:0,z:0},{x:0,y:0,z:2},{x:0,y:0,z:-2}])assert(!sweepSword(from,to,away,away).hit);
const setup={episodeId:'test',contentVersion:'test',preparation:{provisionsDelivered:true,armourDeclined:true,stonesGathered:5,slingReady:true},attempt:2,anchor:'battle.entry',defeated:false};
const david=new Vec3(0,0,0),b=createElahBattle(0,-2.8,{x:0,z:-9.5},ground,()=>new Vec3(0,3,-9.5),setup,{requiredDodges:3,rangedSpear:true,cinematicCombat:true,sampleSpear:()=>from,sampleSword:()=>from});
assert.equal(b.state.combatStage,'sword');assert(!b.startThrow(new Vec3(0,3,-9.5),true));b.state.dodges=99;assert(!b.slingAvailable(),'Counter alone cannot bypass sword and spear stages');
b.reset(3);assert.equal(b.state.combatStage,'sword');assert.equal(b.state.dodges,0);assert.equal(b.state.spearEvasions,0);assert.equal(b.state.stones,5);assert.equal(b.state.decisiveThrow,undefined);
console.log('PASS ballistic speed/gravity, swept forehead hits at 120/60/30/20 Hz, genuine misses and higher aiming, calculated range feedback, sword capsule sweep, required-stage guard and complete retry reset.');
