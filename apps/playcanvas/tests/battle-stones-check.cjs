const assert=require('node:assert/strict');
require('node:module').registerHooks({resolve(s,c,next){if(s==='playcanvas')return next('./build/playcanvas/src/index.js',{...c,parentURL:new URL('../node_modules/playcanvas/package.json',require('node:url').pathToFileURL(__filename)).href});if(c.parentURL?.includes('/gameplay/')&&s.startsWith('.')&&!require('node:path').extname(s))s+='.ts';return next(s,c);}});
const{createBattleStones,releaseBattleStone,landBattleStone,heldStones,groundedStones,toggleStoneRoute,stepStoneRecovery,reachableStoneLanding,stoneRecoveryRoute}=require('../src/gameplay/battle-stones.ts');
const{firstWallHit,playerRadius}=require('../src/gameplay/ground-motion.ts');
const{Vec3}=require('../node_modules/playcanvas/build/playcanvas/src/index.js');
const{createElahBattle,slingSpearRecovery}=require('../src/gameplay/elah-battle.ts');
const{spearFlightDuration,thrownSpearSample}=require('../src/gameplay/thrown-spear.ts');
const pool=createBattleStones(),feet={x:0,z:0};assert(!toggleStoneRoute(pool));
for(let id=1;id<=5;id++){assert(releaseBattleStone(pool,id));assert(!releaseBattleStone(pool,id));assert(landBattleStone(pool,id,{x:id,y:0,z:0},{x:id,y:0,z:0}));assert(!landBattleStone(pool,id,feet,feet));}
assert.equal(heldStones(pool),0);assert.equal(groundedStones(pool).length,5);assert(toggleStoneRoute(pool));
stepStoneRecovery(pool,.6,{x:1,z:0},true);assert.equal(pool.pickup.id,1);stepStoneRecovery(pool,.2,{x:1,z:0},true);stepStoneRecovery(pool,.1,{x:1,z:0},false);assert.equal(heldStones(pool),0);assert.equal(pool.pickup,undefined);
stepStoneRecovery(pool,.6,{x:1,z:0},true);stepStoneRecovery(pool,.4,{x:1,z:0},true);assert.equal(heldStones(pool),1);assert.equal(pool.recovered,1);
assert(releaseBattleStone(pool,1),'Can throw the first recovered stone while four remain');assert(landBattleStone(pool,1,{x:1,y:0,z:0},{x:1,y:0,z:0}));
for(let id=1;id<=5;id++){stepStoneRecovery(pool,.6,{x:id,z:0},true);stepStoneRecovery(pool,.4,{x:id,z:0},true);}
assert.equal(heldStones(pool),5);assert.equal(pool.stones.length,5);assert.equal(pool.guiding,false);assert.equal(pool.recovered,6);
const wall={minX:-.5,maxX:.5,minZ:-4,maxZ:-2},ground=()=>0;
const landing=reachableStoneLanding({x:0,y:2,z:-3},ground,[wall]);assert(!firstWallHit({x:landing.x-1,z:landing.z},{x:1,z:0},[wall],playerRadius));
const path=stoneRecoveryRoute({x:0,y:0,z:0},{x:0,y:0,z:-6},[wall],ground);assert(path.length>2);for(let i=1;i<path.length;i++)assert(!firstWallHit(path[i-1],{x:path[i].x-path[i-1].x,z:path[i].z-path[i-1].z},[wall],playerRadius));
const edge=reachableStoneLanding({x:500,y:0,z:-500},ground,[]);assert(edge.x<=7.75&&edge.z>=-13.75);
assert.equal(spearFlightDuration,2.1);assert.equal(slingSpearRecovery,4.8);
const sample={grip:{x:0,y:3,z:-8.5},tip:{x:0,y:3.7,z:-7.3}},flight={time:0,start:sample.tip,landing:{x:0,y:.07,z:0},initial:sample,sample,landed:false};
for(const u of[0,.2,.4,.6,.8,1]){const p=thrownSpearSample(flight,u*spearFlightDuration).tip,oldY=sample.tip.y+(.07-sample.tip.y)*u+.5*12*1.25**2*u*(1-u);assert(Math.abs(p.y-oldY)<1e-8,'Longer flight preserves the original arc');}
const setup={episodeId:'stones-test',contentVersion:'1',preparation:{provisionsDelivered:true,armourDeclined:true,stonesGathered:5,slingReady:true},attempt:2,anchor:'battle.entry',defeated:false};
const b=createElahBattle(0,-2.8,{x:0,z:-9.5},ground,()=>new Vec3(0,3,-9.5),setup,{cinematicCombat:true,rangedSpear:true,requiredDodges:3,sampleSpear:()=>sample,sampleSword:()=>sample});
// Unit fixture only: isolate real shot rules from the already-tested prerequisite combat stages.
b.state.phase='fight';b.state.combatStage='sling';b.state.swordEvaded=true;b.state.spearEvasions=2;b.state.attack='recover';b.state.attackTime=-1000;
const david=new Vec3(0,0,-2.8);for(let id=1;id<=5;id++){assert(b.startThrow(new Vec3(5,2,-8),false));for(let i=0;i<200&&b.state.shot;i++)b.update(.02,david,()=>new Vec3(0,1.4,-2.8));}
assert.equal(b.state.misses,5);assert.equal(b.state.hits,0);assert.equal(b.state.stones,0);assert.equal(groundedStones(b.state.stoneRecovery).length,5);for(let i=0;i<100;i++)b.update(.02,david,()=>new Vec3(0,1.4,-2.8));assert.equal(b.state.stones,0,'Brook no longer grants a bulk refill');
assert(b.collectStones());const target=groundedStones(b.state.stoneRecovery)[0].position;b.updateRecovery(.6,target,true);b.updateRecovery(.4,target,true);assert.equal(b.state.stones,1);
b.state.phase='defeat';b.updateRecovery(5,target,true);assert.equal(b.state.stones,1,'Defeat cannot grant recovery');b.reset(3);assert.equal(b.state.stones,5);assert.equal(groundedStones(b.state.stoneRecovery).length,0);assert(!b.state.stoneRecovery.guiding);
console.log('PASS five-token conservation, duplicate protection, interrupted/partial/all recovery, accessible landings/routes, real missed shots, no bulk refill, defeat/retry reset, 2.1s spear arc and 4.8s recovery.');
