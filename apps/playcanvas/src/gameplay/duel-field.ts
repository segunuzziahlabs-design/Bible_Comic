import type { WallBounds } from './ground-motion';

/** Chapter Five alone. Other Elah chapters use their original terrain staging. */
export const duelField: Readonly<WallBounds> = { minX: -10, maxX: 10, minZ: -16, maxZ: 12.8 };
export const duelCameraField: Readonly<WallBounds> = { minX: -15.5, maxX: 15.5, minZ: -24, maxZ: 21 };
export const duelRankFrontX = 16.8;

const { minX, maxX, minZ, maxZ } = duelField;
export const duelStoneField = { minX: minX + .55, maxX: maxX - .55, minZ: minZ + .55, maxZ: maxZ - .55 };
export const duelWalls: WallBounds[] = [
  { minX: minX - 4, maxX: minX, minZ: minZ - 4, maxZ: maxZ + 4 },
  { minX: maxX, maxX: maxX + 4, minZ: minZ - 4, maxZ: maxZ + 4 },
  { minX, maxX, minZ: minZ - 4, maxZ: minZ },
  { minX, maxX, minZ: maxZ, maxZ: maxZ + 4 },
];
