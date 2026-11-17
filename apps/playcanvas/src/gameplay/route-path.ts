export type RoutePoint = { x: number; y: number; z: number };

/** Project onto the coordinator's walkable polyline, then look ahead along its bends. */
export function routeAhead(player: RoutePoint, path: readonly RoutePoint[]) {
  if (path.length < 2) return [...path];
  let nearest = Infinity, index = 0, projection = path[0];
  for (let i = 0; i < path.length - 1; i++) {
    const a=path[i], b=path[i+1], dx=b.x-a.x, dz=b.z-a.z;
    const t=Math.max(0,Math.min(1,((player.x-a.x)*dx+(player.z-a.z)*dz)/(dx*dx+dz*dz||1)));
    const p={x:a.x+dx*t,y:a.y+(b.y-a.y)*t,z:a.z+dz*t}, d=Math.hypot(p.x-player.x,p.z-player.z);
    if(d<nearest){nearest=d;index=i;projection=p;}
  }
  const remaining=[projection,...path.slice(index+1)], points:RoutePoint[]=[];
  let distance=.9;
  for(let i=0;i<remaining.length-1&&points.length<7;i++){
    const a=remaining[i],b=remaining[i+1],length=Math.hypot(b.x-a.x,b.z-a.z);
    while(distance<length&&points.length<7){const t=distance/(length||1);points.push({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t});distance+=1.05;}
    distance-=length;
  }
  return points;
}
