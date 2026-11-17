import { playerRadius } from './ground-motion';
import { standingHeight } from './jump-motion';

export type Point3 = { x: number; y: number; z: number };
export type SpearSample = { grip: Point3; tip: Point3 };
export const spearGeometry = { shaftRadius: .014 * 1.61, headRadius: .037 * 1.61,
  backRatio: -.47 / .86, headRatio: .16 / .86, margin: .006 } as const;
const add = (a: Point3, b: Point3): Point3 => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
const sub = (a: Point3, b: Point3): Point3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const scale = (a: Point3, s: number): Point3 => ({ x: a.x * s, y: a.y * s, z: a.z * s });
const dot = (a: Point3, b: Point3) => a.x * b.x + a.y * b.y + a.z * b.z;
const length = (a: Point3) => Math.sqrt(dot(a, a));
const clamp = (x: number) => Math.max(0, Math.min(1, x));
export const lerpPoint = (a: Point3, b: Point3, t: number) => add(a, scale(sub(b, a), t));
export const copyPoint = (p: Point3): Point3 => ({ x: p.x, y: p.y, z: p.z });
export const copySpear = (s: SpearSample): SpearSample => ({ grip: copyPoint(s.grip), tip: copyPoint(s.tip) });

/** Closest points of two finite segments, including parallel/degenerate cases. */
export function segmentDistance(a: Point3, b: Point3, c: Point3, d: Point3) {
  const u = sub(b, a), v = sub(d, c), w = sub(a, c);
  const aa = dot(u, u), bb = dot(u, v), cc = dot(v, v), dd = dot(u, w), ee = dot(v, w);
  let s = 0, t = 0;
  if (aa < 1e-14) t = cc < 1e-14 ? 0 : clamp(ee / cc);
  else if (cc < 1e-14) s = clamp(-dd / aa);
  else {
    const determinant = aa * cc - bb * bb;
    s = determinant > 1e-14 ? clamp((bb * ee - cc * dd) / determinant) : 0;
    t = (bb * s + ee) / cc;
    if (t < 0) { t = 0; s = clamp(-dd / aa); }
    else if (t > 1) { t = 1; s = clamp((bb - dd) / aa); }
  }
  const first = add(a, scale(u, s)), second = add(c, scale(v, t));
  return { distance: length(sub(first, second)), first, second };
}

export function playerCapsule(feet: Point3) {
  return { bottom: add(feet, { x: 0, y: playerRadius, z: 0 }),
    top: add(feet, { x: 0, y: standingHeight - playerRadius, z: 0 }), radius: playerRadius };
}
export function spearSegments(sample: SpearSample) {
  const direction = sub(sample.tip, sample.grip);
  const back = add(sample.grip, scale(direction, spearGeometry.backRatio));
  const headBase = add(sample.tip, scale(direction, -spearGeometry.headRatio));
  return [{ part: 'shaft' as const, a: back, b: headBase, radius: spearGeometry.shaftRadius },
    { part: 'head' as const, a: headBase, b: sample.tip, radius: spearGeometry.headRadius }];
}

/** Sweep linearly moving weapon endpoints against a linearly moving vertical capsule.
 * A relative-motion distance bound prunes safe intervals; remaining intervals are
 * subdivided to <=0.1 mm of motion. This includes grazing and between-frame contact.
 */
export function sweepSpear(from: SpearSample, to: SpearSample, feetFrom: Point3, feetTo: Point3) {
  const oldParts = spearSegments(from), newParts = spearSegments(to);
  const footTravel = sub(feetTo, feetFrom);
  let best: { time: number; part: 'head' | 'shaft'; distance: number; radius: number; weapon: Point3; body: Point3; feet: Point3 } | undefined;
  let minimumMargin = Infinity, checks = 0;
  for (let part = 0; part < oldParts.length; part++) {
    const first = oldParts[part], last = newParts[part], radius = playerRadius + first.radius + spearGeometry.margin;
    const bound = Math.max(length(sub(sub(last.a, first.a), footTravel)), length(sub(sub(last.b, first.b), footTravel)));
    const evaluate = (t: number) => {
      const feet = lerpPoint(feetFrom, feetTo, t), capsule = playerCapsule(feet);
      const result = segmentDistance(lerpPoint(first.a, last.a, t), lerpPoint(first.b, last.b, t), capsule.bottom, capsule.top);
      minimumMargin = Math.min(minimumMargin, result.distance - radius); checks++;
      return { time: t, part: first.part, distance: result.distance, radius, weapon: result.first, body: result.second, feet };
    };
    const start = evaluate(0), end = evaluate(1);
    const stack = [{ lo: start, hi: end, depth: 0 }];
    while (stack.length) {
      const interval = stack.pop()!;
      if (best && interval.lo.time >= best.time) continue;
      const mid = evaluate((interval.lo.time + interval.hi.time) / 2), width = interval.hi.time - interval.lo.time;
      if (interval.lo.distance <= radius) { best = interval.lo; continue; }
      const lower = Math.max(interval.lo.distance - bound * width, interval.hi.distance - bound * width, mid.distance - bound * width / 2);
      if (lower > radius + 1e-5) continue;
      if (bound * width <= .0001 || interval.depth >= 22) {
        const closest = [interval.lo, mid, interval.hi].sort((a, b) => a.distance - b.distance)[0];
        if (closest.distance <= radius + .0001 && (!best || closest.time < best.time)) best = closest;
        continue;
      }
      stack.push({ lo: mid, hi: interval.hi, depth: interval.depth + 1 });
      stack.push({ lo: interval.lo, hi: mid, depth: interval.depth + 1 });
    }
  }
  return { hit: best, minimumMargin, checks };
}
