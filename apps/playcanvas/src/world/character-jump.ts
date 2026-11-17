import type { AnimTrack, Application, RenderComponent } from 'playcanvas';
import { createJumpMotor, standingHeight } from '../gameplay/jump-motion';
import type { GroundPoint } from '../gameplay/ground-motion';
import type { MovementInput } from '../gameplay/movement-input';

/** Conservative overhead AABBs from the scene's actual roof/beam render bounds. */
export function createCharacterJump(app: Application, ground: (x: number, z: number) => number) {
  const motor = createJumpMotor();
  let roofs: RenderComponent[] | undefined, position: GroundPoint = { x: 0, z: 0 }, lastPhase = 'grounded', lastReady = true;
  let changed = () => {};
  function ceiling(x: number, z: number) {
    roofs ??= (app.root.findComponents('render') as RenderComponent[]).filter(r => /roof|lintel|woven pavilion canopy|baggage shade/i.test(r.entity.name));
    let result = Infinity;
    for (const render of roofs) {
      if (!render.enabled || !render.entity.enabled) continue;
      for (const mesh of render.meshInstances) {
        const box = mesh.aabb, min = box.getMin(), max = box.getMax();
        if (x >= min.x - .26 && x <= max.x + .26 && z >= min.z - .26 && z <= max.z + .26) result = Math.min(result, min.y);
      }
    }
    return result;
  }
  function ready(at = position) { return !motor.active() && ceiling(at.x, at.z) - ground(at.x, at.z) - standingHeight >= .08; }
  function publish() { const phase = motor.sample().phase, canJump = ready(); if (phase !== lastPhase || canJump !== lastReady) { lastPhase = phase; lastReady = canJump; changed(); } }
  return {
    connect(input: MovementInput, update?: () => void) { changed = () => { input.refreshActions(); update?.(); }; },
    request(at: GroundPoint) { position = at; const accepted = motor.request(ground(at.x, at.z), ceiling(at.x, at.z)); publish(); return accepted; },
    step(dt: number, at: GroundPoint) { position = at; motor.step(dt, ground(at.x, at.z), ceiling(at.x, at.z)); publish(); },
    reset(at: GroundPoint) { position = at; motor.reset(ground(at.x, at.z)); publish(); },
    active: motor.active, ready, animation: motor.animation,
    bodyY: () => motor.sample().feet,
    cameraY(base: number, x: number, z: number) { return Math.max(ground(x, z) + .5, Math.min(base + motor.sample().cameraLift, ceiling(x, z) - .12)); },
    cameraFocus: () => motor.sample().height * .72,
    pose(actor: { tracks: Map<string, AnimTrack>; pose: (clip: string, time: number, dt: number) => void }, clip: string, time: number, dt: number) {
      const animation = motor.animation();
      if (animation) actor.pose(animation.clip, animation.progress * actor.tracks.get(animation.clip)!.duration, dt);
      else actor.pose(clip, time, dt);
    },
    sample: () => ({ ...motor.sample(), ceiling: Number.isFinite(ceiling(position.x, position.z)) ? ceiling(position.x, position.z) : null }),
  };
}
