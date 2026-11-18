import { copyPoint, lerpPoint, playerCapsule, segmentDistance, type Point3, type SpearSample } from './spear-collision';

export const swordTiming = { distance: 2.9, draw: 1.25, windup: 2.3, strike: .44, recovery: 1.15, radius: .065 } as const;
/** Sweep the rendered blade segment against David's actual moving/airborne capsule.
 * Adaptive relative-motion bounds include contact between rendered frames. */
export function sweepSword(from: SpearSample, to: SpearSample, feetFrom: Point3, feetTo: Point3) {
  const radius = playerCapsule(feetFrom).radius + swordTiming.radius + .006;
  const travel = { x: feetTo.x - feetFrom.x, y: feetTo.y - feetFrom.y, z: feetTo.z - feetFrom.z };
  const relative = (a: Point3, b: Point3) => Math.hypot(b.x - a.x - travel.x, b.y - a.y - travel.y, b.z - a.z - travel.z);
  const bound = Math.max(relative(from.grip, to.grip), relative(from.tip, to.tip));
  let checks = 0, minimumMargin = Infinity;
  const evaluate = (time: number) => {
    const feet = lerpPoint(feetFrom, feetTo, time), capsule = playerCapsule(feet);
    const result = segmentDistance(lerpPoint(from.grip, to.grip, time), lerpPoint(from.tip, to.tip, time), capsule.bottom, capsule.top);
    checks++; minimumMargin = Math.min(minimumMargin, result.distance - radius);
    return { time, distance: result.distance, radius, part: 'blade' as const, weapon: copyPoint(result.first), body: result.second, feet };
  };
  type Contact = ReturnType<typeof evaluate>;
  let hit: Contact | undefined;
  const stack = [{ lo: evaluate(0), hi: evaluate(1), depth: 0 }];
  while (stack.length) {
    const { lo, hi, depth } = stack.pop()!;
    if (hit && lo.time >= hit.time) continue;
    if (lo.distance <= radius) { hit = lo; continue; }
    const width = hi.time - lo.time, mid = evaluate((lo.time + hi.time) * .5);
    if (Math.max(lo.distance - bound * width, hi.distance - bound * width, mid.distance - bound * width * .5) > radius + .00001) continue;
    if (bound * width <= .0001 || depth >= 20) {
      const closest = [lo, mid, hi].sort((a, b) => a.distance - b.distance)[0];
      if (closest.distance <= radius + .0001 && (!hit || closest.time < hit.time)) hit = closest;
      continue;
    }
    stack.push({ lo: mid, hi, depth: depth + 1 }, { lo, hi: mid, depth: depth + 1 });
  }
  return { hit, minimumMargin, checks };
}
