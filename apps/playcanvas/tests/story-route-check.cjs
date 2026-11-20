const assert=require('node:assert/strict');
const {freshRun,objectives,reduceEpisode}=require('../src/gameplay/episode-rules.ts');
const {storyRoutes,storyRouteHintKey,routeAllowed,readStoryRouteHint,storeStoryRouteHint,consumeStoryRouteHint}=require('./load-story-routes.cjs');
const clock=1800000000000;
for(const route of Object.values(storyRoutes)){
 const map=new Map(),store={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)};
 let run=freshRun();for(const o of objectives.slice(0,route.count-1))run=reduceEpisode(run,{type:'objective',id:o.id});
 assert(!routeAllowed(route,run));assert.throws(()=>storeStoryRouteHint(store,route,run,false,clock));
 run=reduceEpisode(run,{type:'objective',id:objectives[route.count-1].id});assert(routeAllowed(route,run));assert(storeStoryRouteHint(store,route,run,false,clock));
 const hint=JSON.parse(map.get(storyRouteHintKey));for(const key of ['completed','position','coordinates','account','tokens'])assert(!(key in hint));
 assert(consumeStoryRouteHint(store,route,run,false,clock));assert(!consumeStoryRouteHint(store,route,run,false,clock));
 for(const variant of [{runId:crypto.randomUUID()},{revision:run.revision+1},{contentVersion:'stale'},{status:'defeated'},{battle:{revision:1}},{completed:[...run.completed].reverse()}]){storeStoryRouteHint(store,route,run,false,clock);if(variant.completed&&route.count===1)variant.completed=['wrong'];assert(!consumeStoryRouteHint(store,route,{...run,...variant},false,clock));}
 storeStoryRouteHint(store,route,run,true,clock);assert(!consumeStoryRouteHint(store,route,run,false,clock));
 storeStoryRouteHint(store,route,run,true,clock);assert(consumeStoryRouteHint(store,route,run,true,clock));
 storeStoryRouteHint(store,route,run,false,clock);assert(!readStoryRouteHint(store,clock+300001));assert(!readStoryRouteHint(store,clock-5001));
 for(const corrupt of ['garbage','null','{}',JSON.stringify({...hint,route:'__proto__'}),JSON.stringify({...hint,destination:'https://example.com'}),JSON.stringify({...hint,revision:-1}),JSON.stringify({...hint,createdAt:null})]){map.set(storyRouteHintKey,corrupt);assert(!consumeStoryRouteHint(store,route,run,false,clock));assert(!map.has(storyRouteHintKey));}
 const other=Object.values(storyRoutes).find(r=>r.id!==route.id);storeStoryRouteHint(store,route,run,false,clock);assert(!consumeStoryRouteHint(store,other,run,false,clock));
 const blocked={getItem(){throw Error('blocked');},setItem(){throw Error('blocked');},removeItem(){throw Error('blocked');}};assert(!storeStoryRouteHint(blocked,route,run,false,clock));assert(!consumeStoryRouteHint(blocked,route,run,false,clock));
 const later=reduceEpisode(run,{type:'objective',id:objectives[route.count].id});assert(!routeAllowed(route,later),'No returning to an obsolete route');
}
console.log('PASS four route checkpoint gates, complete ordered prefixes, presentation-only hints, route/run/revision/version/battle/review binding, expiry, consume-once and storage failure.');
