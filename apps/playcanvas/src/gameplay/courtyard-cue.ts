import { firstWallHit, type GroundPoint, type WallBounds } from './ground-motion';

export const trailMarker = { x: 1.04, z: -1.46, footWidth: .55 };
export const markerRange = 2.10;
export const markerCueDuration = 2.4;

export function canInspectMarker(position: GroundPoint, walls: readonly WallBounds[]) {
  const offset = { x: trailMarker.x - position.x, z: trailMarker.z - position.z };
  return Math.hypot(offset.x, offset.z) <= markerRange && !firstWallHit(position, offset, walls, .02);
}

export function markerCueText(elapsed: number) {
  return elapsed < 1.15 ? 'David studies the trail marker.' : 'The path continues beyond the courtyard.';
}
