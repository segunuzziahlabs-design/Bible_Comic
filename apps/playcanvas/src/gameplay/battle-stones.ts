import {confineToField,firstWallHit,playerRadius,type GroundPoint,type WallBounds} from './ground-motion';
import type {Point3} from './spear-collision';

export const stonePickupSeconds=.95,stoneSettleSeconds=.55,stonePickupRadius=.88;
export type BattleStone={id:number;status:'held'|'airborne'|'ground'|'spent';position?:Point3;impact?:Point3;age:number};
export function createBattleStones(count=5){return{stones:Array.from({length:count},(_,i)=>({id:i+1,status:'held',age:0}as BattleStone)),guiding:false,targetId:undefined as number|undefined,pickup:undefined as {id:number;time:number}|undefined,recovered:0,interruptions:0};}
export type BattleStones=ReturnType<typeof createBattleStones>;
export const heldStones=(pool:BattleStones)=>pool.stones.filter(s=>s.status==='held').length;
export const groundedStones=(pool:BattleStones)=>pool.stones.filter(s=>s.status==='ground');
export function cancelStonePickup(pool:BattleStones){if(pool.pickup){pool.interruptions++;pool.pickup=undefined;}}
export function toggleStoneRoute(pool:BattleStones){if(pool.guiding){pool.guiding=false;pool.targetId=undefined;cancelStonePickup(pool);return true;}if(!groundedStones(pool).length)return false;pool.guiding=true;return true;}
export function releaseBattleStone(pool:BattleStones,id:number){const stone=pool.stones.find(s=>s.id===id&&s.status==='held');if(!stone)return false;stone.status='airborne';stone.position=stone.impact=undefined;stone.age=0;cancelStonePickup(pool);return true;}
export function landBattleStone(pool:BattleStones,id:number,impact:Point3,position:Point3){const stone=pool.stones.find(s=>s.id===id&&s.status==='airborne');if(!stone)return false;stone.status='ground';stone.impact={...impact};stone.position={...position};stone.age=0;return true;}
export function nearestBattleStone(pool:BattleStones,feet:GroundPoint){const active=pool.pickup&&pool.stones.find(s=>s.id===pool.pickup!.id&&s.status==='ground');return active||groundedStones(pool).sort((a,b)=>Math.hypot(a.position!.x-feet.x,a.position!.z-feet.z)-Math.hypot(b.position!.x-feet.x,b.position!.z-feet.z)||a.id-b.id)[0];}
/** Only normal game updates advance settling and pickup. No invulnerability or player movement. */
export function stepStoneRecovery(pool:BattleStones,dt:number,feet:GroundPoint,allowed:boolean){
  for(const s of groundedStones(pool))s.age=Math.min(stoneSettleSeconds,s.age+Math.max(0,dt));
  const target=pool.guiding?nearestBattleStone(pool,feet):undefined;pool.targetId=target?.id;
  if(!target||!allowed||target.age<stoneSettleSeconds||Math.hypot(target.position!.x-feet.x,target.position!.z-feet.z)>stonePickupRadius){cancelStonePickup(pool);return;}
  pool.pickup??={id:target.id,time:0};pool.pickup.time+=Math.max(0,dt);
  if(pool.pickup.time<stonePickupSeconds)return;
  target.status='held';target.position=target.impact=undefined;target.age=0;pool.pickup=undefined;pool.recovered++;
  if(heldStones(pool)===pool.stones.length)pool.guiding=false;
  pool.targetId=pool.guiding?nearestBattleStone(pool,feet)?.id:undefined;return target.id;
}
const legacyStoneField = {minX:-7.75,maxX:7.75,minZ:-13.75,maxZ:12.1};
const inField=(p:GroundPoint,field:Readonly<WallBounds>)=>p.x>=field.minX&&p.x<=field.maxX&&p.z>=field.minZ&&p.z<=field.maxZ;
const blocked=(p:GroundPoint,walls:readonly WallBounds[],radius=playerRadius+.12)=>walls.some(w=>p.x>w.minX-radius&&p.x<w.maxX+radius&&p.z>w.minZ-radius&&p.z<w.maxZ+radius);
/** Keep ordinary misses where they land; roll obstructed impacts to nearby accessible ground. */
export function reachableStoneLanding(impact:Point3,ground:(x:number,z:number)=>number,walls:readonly WallBounds[],field=legacyStoneField):Point3{
  const base=confineToField(impact,field);
  for(const radius of[0,.4,.8,1.2,1.6,2.2])for(let i=0;i<12;i++){const p={x:base.x+Math.cos(i*Math.PI/6)*radius,z:base.z+Math.sin(i*Math.PI/6)*radius};if(inField(p,field)&&!blocked(p,walls))return{...p,y:ground(p.x,p.z)+.06};}
  for(const p of[{x:0,z:-2.8},{x:3,z:-2.8},{x:-3,z:-2.8}])if(!blocked(p,walls))return{...p,y:ground(p.x,p.z)+.06};
  throw new Error('No reachable stone landing in the battle area');
}
/** Small visibility graph around the actual movement obstacles, used only while guiding. */
export function stoneRecoveryRoute(from:Point3,to:Point3,walls:readonly WallBounds[],ground:(x:number,z:number)=>number,field=legacyStoneField){
  const margin=playerRadius+.16,nodes:GroundPoint[]=[from,to];
  for(const w of walls)for(const x of[w.minX-margin,w.maxX+margin])for(const z of[w.minZ-margin,w.maxZ+margin])if(inField({x,z},field)&&!blocked({x,z},walls))nodes.push({x,z});
  const distances=nodes.map((_,i)=>i?Infinity:0),parent=nodes.map(()=>-1),visited=new Set<number>();
  for(let pass=0;pass<nodes.length;pass++){let at=-1;for(let i=0;i<nodes.length;i++)if(!visited.has(i)&&(at<0||distances[i]<distances[at]))at=i;if(at<0||!Number.isFinite(distances[at])||at===1)break;visited.add(at);
    for(let next=0;next<nodes.length;next++){if(next===at||visited.has(next))continue;const delta={x:nodes[next].x-nodes[at].x,z:nodes[next].z-nodes[at].z};if(firstWallHit(nodes[at],delta,walls,playerRadius+.06))continue;const d=distances[at]+Math.hypot(delta.x,delta.z);if(d<distances[next]){distances[next]=d;parent[next]=at;}}
  }
  const path=[1];if(parent[1]>=0)while(path.at(-1)!==0)path.push(parent[path.at(-1)!]);else path.push(0);
  return path.reverse().map(i=>({x:nodes[i].x,y:ground(nodes[i].x,nodes[i].z),z:nodes[i].z}));
}
