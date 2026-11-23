const assert=require('node:assert/strict');
require('node:module').registerHooks({resolve(s,c,next){if(s==='playcanvas')return next('./build/playcanvas/src/index.js',{...c,parentURL:new URL('../node_modules/playcanvas/package.json',require('node:url').pathToFileURL(__filename)).href});if(c.parentURL?.includes('/gameplay/')&&s.startsWith('.')&&!require('node:path').extname(s))s+='.ts';return next(s,c);}});
const {Vec3}=require('../node_modules/playcanvas/build/playcanvas/src/index.js');
const {createElahBattle}=require('../src/gameplay/elah-battle.ts');
const {victoryPursuit}=require('../src/gameplay/victory-pursuit.ts');
const setup={episodeId:'test',contentVersion:'test',preparation:{provisionsDelivered:true,armourDeclined:true,stonesGathered:5,slingReady:true},attempt:2,anchor:'battle.aftermath',aftermath:'sword_taken',defeated:false};
const feet=new Vec3(1.05,0,-9.15),ground=()=>0,spear=()=>({grip:{x:0,y:3,z:-9.5},tip:{x:0,y:4,z:-9.5}});
for(const dt of[1/120,1/60,1/30,.05]){
 const b=createElahBattle(0,-2.8,{x:0,z:-9.5},ground,()=>new Vec3(0,1,-9.5),setup,{cinematicCombat:true,sampleSword:spear,sampleSpear:spear});
 assert(!b.setSwordSwing(1),'Cannot swing before reaching final position');assert(b.interact(feet));assert.equal(b.state.phase,'finish_ready');
 assert(!b.interact(feet),'Repeated interaction is not a completed swing');for(let i=0;i<120;i++)b.update(dt,feet,()=>feet);assert.equal(b.state.phase,'finish_ready');
 b.setSwordSwing(.4);for(let i=0;i<120;i++)b.update(dt,feet,()=>feet);assert.equal(b.state.swordSwing,.4);assert.equal(b.state.phase,'execution');
 b.setSwordSwing(1);b.update(dt,feet,()=>feet);assert(b.state.swordSwing<1,'An instantaneous pointer move cannot skip the blade motion');b.setSwordSwing();const frozen=b.state.swordSwing;
 for(let i=0;i<120;i++)b.update(dt,feet,()=>feet);assert.equal(b.state.swordSwing,frozen,'Releasing freezes the swing');assert.equal(b.state.phase,'execution');
 b.setSwordSwing(NaN);b.update(dt,feet,()=>feet);assert(Number.isFinite(b.state.swordSwing));b.setSwordSwing(1);
 for(let i=0;i<800;i++)b.update(dt,feet,()=>feet);assert.equal(b.state.phase,'finish_checkpoint');assert(!b.state.finalPerformed);assert(b.confirmCheckpoint());assert.equal(b.state.phase,'victory');assert(b.state.finalPerformed);assert(!b.setSwordSwing(1));
 b.reset(3);assert.equal(b.state.swordSwing,0);assert.equal(b.state.combatStage,'sword');
}
for(let i=0;i<24;i++){
 const before=victoryPursuit(0,i),contact=victoryPursuit(victoryPursuit(0,i).contact,i),fallen=victoryPursuit(24,i);
 assert.equal(before.ally.kind,'Cheer');assert.equal(contact.ally.kind,'Strike');assert(Math.hypot(contact.ally.x-contact.enemy.x,contact.ally.z-contact.enemy.z)<1);
 assert.equal(fallen.enemy.kind,'Fall');assert.equal(fallen.enemy.index,5);assert(fallen.fallen);assert.deepEqual(fallen.enemy,victoryPursuit(38,i).enemy,'Fallen bodies remain, not disappear');
}
console.log('PASS player-driven sword, no timer completion or stage bypass, bounded animation at 120/60/30/20 Hz, release/invalid input/retry, 24 converging pursuit paths and retained collapsed soldiers.');
