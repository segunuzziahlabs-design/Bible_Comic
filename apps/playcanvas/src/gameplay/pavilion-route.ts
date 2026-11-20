import type {Run} from './episode-rules';
import type {WallBounds} from './ground-motion';

export const pavilionRoute={id:'r07',destination:'preparation.html',exitRadius:.45,
  departure:[{x:2.4,z:10.85},{x:.7,z:11.7},{x:.7,z:14.5}],
  arrival:[{x:.7,z:4.2},{x:.7,z:2.8},{x:-.65,z:1.6},{x:-.65,z:.65}],
} as const;
export const routeHintKey='bible-comic.presentation.r07.v1';
type Store=Pick<Storage,'getItem'|'setItem'|'removeItem'>|undefined;
type Hint={route:'r07';destination:'preparation.html';runId:string;revision:number;contentVersion:string;battleRevision?:number;review:boolean;createdAt:number};
export const canWalkToSaul=(run:Run)=>run.status==='active'&&run.completed.length===5&&run.completed.at(-1)==='eliab.answered';
export function readPavilionHint(storage:Store,now=Date.now()):Hint|undefined{
  try{const h=JSON.parse(storage?.getItem(routeHintKey)??'null');if(!h||h.route!=='r07'||h.destination!=='preparation.html'||typeof h.runId!=='string'||!/^[a-f0-9-]{36}$/i.test(h.runId)||!Number.isSafeInteger(h.revision)||h.revision<0||typeof h.contentVersion!=='string'||typeof h.review!=='boolean'||!Number.isFinite(h.createdAt)||now-h.createdAt>300000||h.createdAt-now>5000||h.battleRevision!==undefined&&(!Number.isSafeInteger(h.battleRevision)||h.battleRevision<0))return;return h;}catch{return;}
}
export function storePavilionHint(storage:Store,run:Run,review:boolean,now=Date.now()){
  if(!canWalkToSaul(run))throw new Error('Confirm Eliab’s exchange before leaving for Saul.');
  const hint:Hint={route:'r07',destination:'preparation.html',runId:run.runId,revision:run.revision,contentVersion:run.contentVersion,battleRevision:run.battle?.revision,review,createdAt:now};
  try{if(!storage)return false;storage.setItem(routeHintKey,JSON.stringify(hint));return true;}catch{return false;}
}
export function clearPavilionHint(storage:Store){try{storage?.removeItem(routeHintKey);}catch{/* Normal checkpoint entry remains available. */}}
export function consumePavilionHint(storage:Store,run:Run,review:boolean,now=Date.now()){
  const hint=readPavilionHint(storage,now);clearPavilionHint(storage);
  return !!hint&&canWalkToSaul(run)&&hint.review===review&&hint.runId===run.runId&&hint.revision===run.revision&&hint.contentVersion===run.contentVersion&&hint.battleRevision===run.battle?.revision;
}
export function navigationStorage():Store{try{return sessionStorage;}catch{return;}}
/** Change only the camp's north boundary. The exit remains closed during story scenes. */
export function pavilionDepartureWalls(walls:readonly WallBounds[]){
  return [...walls.filter(w=>w.minZ!==12.8||w.maxZ!==15),
    {minX:-13,maxX:-.6,minZ:12.8,maxZ:15.6},{minX:2,maxX:13,minZ:12.8,maxZ:15.6},
    {minX:-.6,maxX:2,minZ:15.4,maxZ:15.7}];
}
