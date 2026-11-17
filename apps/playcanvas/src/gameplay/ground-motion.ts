export type GroundPoint = { x: number; z: number };
export type WallBounds = { minX: number; maxX: number; minZ: number; maxZ: number };

export const playerRadius = .28;

function slab(position: number, change: number, min: number, max: number) {
  if (Math.abs(change) < 1e-8) {
    return position > min && position < max ? [-Infinity, Infinity] : undefined;
  }
  const first = (min - position) / change;
  const last = (max - position) / change;
  return [Math.min(first, last), Math.max(first, last)];
}

export function firstWallHit(start: GroundPoint, delta: GroundPoint, walls: readonly WallBounds[], padding: number) {
  let first: { time: number; axis: 'x' | 'z' } | undefined;
  for (const wall of walls) {
    const x = slab(start.x, delta.x, wall.minX - padding, wall.maxX + padding);
    const z = slab(start.z, delta.z, wall.minZ - padding, wall.maxZ + padding);
    if (!x || !z) continue;
    const enter = Math.max(x[0], z[0]);
    const exit = Math.min(x[1], z[1]);
    if (enter < 0 || enter > 1 || enter >= exit || (first && enter >= first.time)) continue;
    first = { time: enter, axis: x[0] > z[0] ? 'x' : 'z' };
  }
  return first;
}

export function slideAlongWalls(start: GroundPoint, delta: GroundPoint, walls: readonly WallBounds[]) {
  const position = { ...start };
  const remaining = { ...delta };
  for (let step = 0; step < 3; step++) {
    const distance = Math.hypot(remaining.x, remaining.z);
    if (distance < 1e-6) break;
    const hit = firstWallHit(position, remaining, walls, playerRadius);
    if (!hit) {
      position.x += remaining.x;
      position.z += remaining.z;
      break;
    }
    const safeTime = Math.max(0, hit.time - .001 / distance);
    position.x += remaining.x * safeTime;
    position.z += remaining.z * safeTime;
    remaining.x *= 1 - hit.time;
    remaining.z *= 1 - hit.time;
    remaining[hit.axis] = 0;
  }
  return position;
}

export function approachVelocity(current: GroundPoint, target: GroundPoint, maxChange: number) {
  const dx = target.x - current.x;
  const dz = target.z - current.z;
  const distance = Math.hypot(dx, dz);
  if (distance <= maxChange) return target;
  return { x: current.x + dx * maxChange / distance, z: current.z + dz * maxChange / distance };
}
