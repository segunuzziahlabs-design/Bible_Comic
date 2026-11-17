import { AnimTrack, Vec3, math, type AnimComponent, type Entity } from 'playcanvas';
import { slingWindup } from '../gameplay/elah-battle';

const upperBody = new Set(['spine_02', 'spine_03', 'upperarm_r', 'lowerarm_r', 'hand_r',
  'upperarm_l', 'lowerarm_l', 'Head']);

export function createDavidSling(model: Entity, animator: AnimComponent, clip: AnimTrack | undefined) {
  const hand = model.findByName('hand_r');
  if (!clip || !hand) throw new Error('David’s sling requires the authored clip and right hand joint');
  const curves = clip.curves.filter(curve => curve.paths.every(path =>
    upperBody.has(path.entityPath.at(-1) ?? '') && path.propertyPath[0] === 'localRotation'));
  if (curves.length !== upperBody.size) throw new Error('David’s sling clip does not match the upper body rig');
  const track = new AnimTrack(clip.name, clip.duration, clip.inputs, clip.outputs, curves);
  const layer = animator.addLayer('Sling', 0);
  layer.assignAnimation('Throw', track, 1, false);
  layer.play('Throw');
  // The base layer bound its targets before the sling layer was added.
  animator.rebind();
  const palm = new Vec3(0, .086, 0);
  const grip = new Vec3();
  const pouch = new Vec3();

  function pose(time: number | undefined) {
    if (time === undefined && layer.weight === 0) return;
    layer.weight = time === undefined ? 0
      : math.smoothstep(0, .10, time) * (1 - math.smoothstep(.69, track.duration, time));
    if (time !== undefined) layer.activeStateCurrentTime = Math.min(time, track.duration);
    animator.update(0);
  }

  function position(time: number) {
    const progress = math.clamp(time / slingWindup, 0, 1);
    const angle = -Math.PI * 2.0 * (1 - progress);
    const radius = math.lerp(.16, .40, math.smoothstep(.15, .55, progress));
    hand!.getWorldTransform().transformPoint(palm, grip);
    pouch.copy(grip).addScaled(model.right, radius * Math.sin(angle));
    pouch.addScaled(model.forward, -radius * Math.cos(angle));
    pouch.y += .14 * Math.sin(Math.PI * progress);
    return { grip, pouch };
  }
  return { pose, position };
}
