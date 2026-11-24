/** Shared story movement policy. Distances, collision and input stay with the chapter. */
export function smoothStoryHeading(current: number, target: number, dt: number) {
  const delta = ((target - current) % 360 + 540) % 360 - 180;
  const step = delta * (1 - Math.exp(-10 * Math.max(0, dt)));
  const limit = 300 * Math.max(0, dt);
  return current + Math.max(-limit, Math.min(limit, step));
}

/** Stretch a forward gesture across a long line, without speeding up a short
 * reply. Clip transitions provide the return for shorter lines. Prop actions
 * deliberately do not use this policy. */
export function dialogueGestureTime(local: number, lineDuration: number, clipDuration: number) {
  return Math.max(0, Math.min(local, lineDuration)) * Math.min(1, clipDuration / Math.max(.001, lineDuration));
}

export function storyWalkWeight(speed: number) {
  const t = Math.max(0, Math.min(1, (speed - .025) / .375));
  return t * t * (3 - 2 * t);
}
