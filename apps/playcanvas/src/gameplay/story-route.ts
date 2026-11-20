import {objectives,type Run} from './episode-rules';

export type RoutePoint={x:number;z:number};
export const storyRoutes={
  r03:{id:'r03',destination:'camp.html',count:1,title:'Walk to the baggage camp',label:'Baggage camp',yaw:Math.PI,departure:[{x:0,z:8.2},{x:0,z:10.5},{x:-1.8,z:12.1}],arrival:[{x:0,z:4.6},{x:0,z:2.8},{x:-2,z:2.8},{x:-2,z:1.85}]},
  r05:{id:'r05',destination:'challenge.html',count:3,title:'Follow the path to the battle line',label:'Battle overlook',yaw:0,departure:[{x:2.2,z:-.8},{x:0,z:-.8},{x:0,z:-4.8}],arrival:[{x:0,z:11.6},{x:0,z:8.2}]},
  r09:{id:'r09',destination:'preparation.html',count:8,title:'Walk out towards the brook',label:'Brook path',yaw:Math.PI,departure:[{x:1.1,z:1.2},{x:.2,z:2.7},{x:.2,z:4.1}],arrival:[{x:-4.3,z:3.7},{x:-3,z:2.5},{x:-2.7,z:1},{x:-1.65,z:.12}]},
  r11:{id:'r11',destination:'duel.html',count:10,title:'Follow the bank towards Goliath',label:'Battlefield',yaw:-Math.PI/2,departure:[{x:0,z:1.55},{x:2.8,z:2.7},{x:4.3,z:3.6}],arrival:[]},
} as const;
export type StoryRouteId=keyof typeof storyRoutes;
export type StoryRoute=typeof storyRoutes[StoryRouteId];
export const storyRouteHintKey='bible-comic.presentation.route.v1';
type Store=Pick<Storage,'getItem'|'setItem'|'removeItem'>|undefined;
type Hint={route:StoryRouteId;destination:string;runId:string;revision:number;contentVersion:string;battleRevision?:number;review:boolean;createdAt:number};
export function routeAllowed(route:StoryRoute,run:Run){return run.status==='active'&&run.completed.length===route.count&&objectives.slice(0,route.count).every((goal,i)=>goal.id===run.completed[i]);}
export function readStoryRouteHint(storage:Store,now=Date.now()):Hint|undefined{
  try{const h=JSON.parse(storage?.getItem(storyRouteHintKey)??'null');if(!h||!Object.hasOwn(storyRoutes,h.route)||h.destination!==storyRoutes[h.route as StoryRouteId].destination||typeof h.runId!=='string'||!/^[a-f0-9-]{36}$/i.test(h.runId)||!Number.isSafeInteger(h.revision)||h.revision<0||typeof h.contentVersion!=='string'||typeof h.review!=='boolean'||!Number.isFinite(h.createdAt)||now-h.createdAt>300000||h.createdAt-now>5000||h.battleRevision!==undefined&&(!Number.isSafeInteger(h.battleRevision)||h.battleRevision<0))return;return h;}catch{return;}
}
export function clearStoryRouteHint(storage:Store){try{storage?.removeItem(storyRouteHintKey);}catch{/* Canonical entry does not depend on session storage. */}}
export function storeStoryRouteHint(storage:Store,route:StoryRoute,run:Run,review:boolean,now=Date.now()){
  if(!routeAllowed(route,run))throw new Error('Confirm the story checkpoint before leaving.');
  const hint:Hint={route:route.id,destination:route.destination,runId:run.runId,revision:run.revision,contentVersion:run.contentVersion,battleRevision:run.battle?.revision,review,createdAt:now};
  try{if(!storage)return false;storage.setItem(storyRouteHintKey,JSON.stringify(hint));return true;}catch{return false;}
}
export function consumeStoryRouteHint(storage:Store,route:StoryRoute,run:Run,review:boolean,now=Date.now()){
  const hint=readStoryRouteHint(storage,now);clearStoryRouteHint(storage);
  return !!hint&&hint.route===route.id&&routeAllowed(route,run)&&hint.review===review&&hint.runId===run.runId&&hint.revision===run.revision&&hint.contentVersion===run.contentVersion&&hint.battleRevision===run.battle?.revision;
}
