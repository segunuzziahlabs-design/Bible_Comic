type Tint = readonly [number, number, number];
import { currentAccountSettings } from '../product/preferences';
type Colour = { label: string; tint: Tint };

export const skinTones = {
  golden: { label: 'Golden', tint: [1.10, 1.25, 1.32] },
  warm: { label: 'Warm brown', tint: [1, 1, 1] },
  deep: { label: 'Deep brown', tint: [.68, .67, .63] },
} as const satisfies Record<string, Colour>;

export const hairColours = {
  dark: { label: 'Dark brown', tint: [1, 1, 1] },
  black: { label: 'Soft black', tint: [.51, .64, .75] },
  chestnut: { label: 'Chestnut', tint: [1.65, 1.26, 1.03] },
} as const satisfies Record<string, Colour>;

export const tunicColours = {
  teal: { label: 'Teal', tint: [1, 1, 1] },
  clay: { label: 'Clay', tint: [2.10, .69, .46] },
  linen: { label: 'Natural linen', tint: [2.78, 1.48, 1.16] },
} as const satisfies Record<string, Colour>;

export const hairStyles = {
  short: { label: 'Short curls', fullness: 0 },
  full: { label: 'Full curls', fullness: 1 },
} as const;

export type DavidAppearance = {
  skin: keyof typeof skinTones;
  hairColour: keyof typeof hairColours;
  hairStyle: keyof typeof hairStyles;
  tunic: keyof typeof tunicColours;
};

export const defaultAppearance: DavidAppearance = {
  skin: 'warm', hairColour: 'dark', hairStyle: 'short', tunic: 'teal',
};

export const appearanceStorage = 'bible-comic.david-appearance.v1';

export function loadSavedAppearance(): DavidAppearance {
  const settings = currentAccountSettings();
  if (settings) return { ...(settings.appearance ?? defaultAppearance) };
  try {
    const saved = JSON.parse(localStorage.getItem(appearanceStorage) ?? 'null');
    return {
      skin: choice(saved?.skin, skinTones, defaultAppearance.skin),
      hairColour: choice(saved?.hairColour, hairColours, defaultAppearance.hairColour),
      hairStyle: choice(saved?.hairStyle, hairStyles, defaultAppearance.hairStyle),
      tunic: choice(saved?.tunic, tunicColours, defaultAppearance.tunic),
    };
  } catch {
    return { ...defaultAppearance };
  }
}

function choice<Key extends string>(value: unknown, options: Record<Key, unknown>, fallback: Key): Key {
  return typeof value === 'string' && Object.hasOwn(options, value) ? value as Key : fallback;
}
