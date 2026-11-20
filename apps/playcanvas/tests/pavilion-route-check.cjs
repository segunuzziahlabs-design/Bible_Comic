const assert=require('node:assert/strict');
const {freshRun,objectives,reduceEpisode}=require('../src/gameplay/episode-rules.ts');
const {pavilionRoute,routeHintKey,canWalkToSaul,readPavilionHint,storePavilionHint,consumePavilionHint,pavilionDepartureWalls}=require('../src/gameplay/pavilion-route.ts');
const {firstWallHit,playerRadius}=require('../src/gameplay/ground-motion.ts');
const clock=1800000000000,map=new Map(),storage={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)};
let run=freshRun();for(const o of objectives.slice(0,4))run=reduceEpisode(run,{type:'objective',id:o.id});
assert(!canWalkToSaul(run));assert.throws(()=>storePavilionHint(storage,run,false,clock),/Eliab/);
run=reduceEpisode(run,{type:'objective',id:'eliab.answered'});assert(canWalkToSaul(run));
assert(storePavilionHint(storage,run,false,clock));const raw=JSON.parse(map.get(routeHintKey));assert(!('completed'in raw)&&!('position'in raw)&&!('coordinates'in raw),'Navigation carries presentation identity, never objectives or coordinates');
assert(consumePavilionHint(storage,run,false,clock+100));assert(!consumePavilionHint(storage,run,false,clock+101),'Consume once');
for(const variant of [{runId:crypto.randomUUID()},{revision:run.revision+1},{contentVersion:'old'},{battle:{schemaVersion:1,revision:0,stage:'combat'}},{status:'completed'}]){storePavilionHint(storage,run,false,clock);assert(!consumePavilionHint(storage,{...run,...variant},false,clock+100));}
storePavilionHint(storage,run,true,clock);assert(!consumePavilionHint(storage,run,false,clock));
storePavilionHint(storage,run,true,clock);assert(consumePavilionHint(storage,run,true,clock));
storePavilionHint(storage,run,false,clock);assert(!readPavilionHint(storage,clock+300001));assert(!readPavilionHint(storage,clock-5001));
for(const value of ['garbage','null','{}',JSON.stringify({...raw,destination:'https://example.com'}),JSON.stringify({...raw,revision:-1}),JSON.stringify({...raw,createdAt:null})]){map.set(routeHintKey,value);assert(!consumePavilionHint(storage,run,false,clock));assert(!map.has(routeHintKey));}
const blocked={getItem(){throw Error('blocked');},setItem(){throw Error('blocked');},removeItem(){throw Error('blocked');}};assert(!storePavilionHint(blocked,run,false,clock));assert(!consumePavilionHint(blocked,run,false,clock));assert(!storePavilionHint(undefined,run,false,clock));
const boundary={minX:-13,maxX:13,minZ:12.8,maxZ:15},tent={minX:3.7,maxX:6.1,minZ:9.7,maxZ:12.7},eliab={minX:1.98,maxX:2.82,minZ:8.9,maxZ:9.7};const closed=[boundary,tent,eliab],opened=pavilionDepartureWalls(closed);
assert(firstWallHit({x:.7,z:12},{x:0,z:2.5},closed,playerRadius),'Unconfirmed route stays blocked');
for(let i=1;i<pavilionRoute.departure.length;i++){const a=pavilionRoute.departure[i-1],b=pavilionRoute.departure[i];assert(!firstWallHit(a,{x:b.x-a.x,z:b.z-a.z},opened,playerRadius),'Source waypoints must clear real boundary/nearby props');}
assert(firstWallHit({x:.7,z:14.5},{x:0,z:2},opened,playerRadius),'The new corridor still has an end boundary');assert(opened.includes(tent)&&opened.includes(eliab),'Opening the passage cannot remove unrelated obstacles');
console.log('PASS confirmed route gate; run/revision/version/battle/review/expiry checks; one-use and unavailable-storage recovery; collision-valid passage with original obstacles retained.');
