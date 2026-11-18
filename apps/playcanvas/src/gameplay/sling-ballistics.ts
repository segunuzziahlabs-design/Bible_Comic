import { type Point3, copyPoint } from './spear-collision';

export const slingPhysics = { speed: 13.5, gravity: 9.81, stoneRadius: .045, foreheadRadius: .23, maxSeconds: 3 } as const;
export const decisiveReplay = { release: .95, impact: 2.85, duration: 3.45 } as const;
export type DecisiveThrow = { origin: Point3; velocity: Point3; flightSeconds: number; impact: Point3; david: Point3; jump: boolean };
export function stoneVelocity(origin: Point3, aim: Point3): Point3 {
  const x = aim.x - origin.x, y = aim.y - origin.y, z = aim.z - origin.z;
  const scale = slingPhysics.speed / Math.max(.001, Math.hypot(x, y, z));
  return { x: x * scale, y: y * scale, z: z * scale };
}
export function stoneAt(origin: Point3, velocity: Point3, seconds: number): Point3 {
  return { x: origin.x + velocity.x * seconds, y: origin.y + velocity.y * seconds - .5 * slingPhysics.gravity * seconds ** 2, z: origin.z + velocity.z * seconds };
}
/** Analytic swept sphere contact in relative motion, including between-frame hits. */
export function stoneContact(from: Point3, to: Point3, headFrom: Point3, headTo = headFrom) {
  const x = from.x - headFrom.x, y = from.y - headFrom.y, z = from.z - headFrom.z;
  const dx = to.x - headTo.x - x, dy = to.y - headTo.y - y, dz = to.z - headTo.z - z;
  const a = dx * dx + dy * dy + dz * dz, b = 2 * (x * dx + y * dy + z * dz);
  const c = x * x + y * y + z * z - (slingPhysics.foreheadRadius + slingPhysics.stoneRadius) ** 2;
  if (c <= 0) return 0;
  const determinant = b * b - 4 * a * c;
  if (a < 1e-12 || determinant < 0) return undefined;
  const time = (-b - Math.sqrt(determinant)) / (2 * a);
  return time >= 0 && time <= 1 ? time : undefined;
}
export function slingGuidance(feet: Point3, foe: Point3, origin: Point3, aim: Point3, head: Point3, ground: (x: number, z: number) => number, foeYaw: number) {
  const distance = Math.hypot(feet.x - foe.x, feet.z - foe.z);
  const bearing = Math.atan2(feet.x - foe.x, feet.z - foe.z);
  const angle = Math.abs(Math.atan2(Math.sin(bearing - foeYaw), Math.cos(bearing - foeYaw)));
  const position = distance > 12.5 ? 'Move closer' : distance < 5.5 ? 'Move back' : angle > Math.PI * .4 ? 'Adjust your position' : 'Good throwing position';
  const velocity = stoneVelocity(origin, aim), points: Point3[] = [copyPoint(origin)];
  let previous = points[0], nearest = previous, minimum = Infinity, hit = false;
  for (let time = .04; time <= slingPhysics.maxSeconds; time += .04) {
    const point = stoneAt(origin, velocity, time), d = Math.hypot(point.x - head.x, point.y - head.y, point.z - head.z);
    if (d < minimum) { minimum = d; nearest = point; }
    if (Math.round(time / .04) % 2 === 0) points.push(point);
    if (stoneContact(previous, point, head) !== undefined) { hit = true; break; }
    if (point.y < ground(point.x, point.z) + slingPhysics.stoneRadius) break;
    previous = point;
  }
  const planeTime=Math.max(0,((head.x-origin.x)*velocity.x+(head.z-origin.z)*velocity.z)/Math.max(.001,velocity.x**2+velocity.z**2));
  const atPlane=stoneAt(origin,velocity,planeTime),horizontal=Math.hypot(atPlane.x-head.x,atPlane.z-head.z);
  const aiming = hit ? 'Forehead aligned — release when ready' : distance > 15 ? 'Too far to reach the forehead' : horizontal > .5 ? 'Aim towards Goliath’s forehead' : atPlane.y < head.y - .15 ? 'Aim higher' : atPlane.y > head.y + .15 ? 'Aim lower' : 'Find the right angle';
  return { distance, angle, position, aiming, aligned: hit, points, nearest };
}
export type SlingGuidance = ReturnType<typeof slingGuidance>;
