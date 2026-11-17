import { Quat, type GraphNode } from 'playcanvas';
import type { loadConversationActor } from './conversation-actor';

type Actor = Awaited<ReturnType<typeof loadConversationActor>>;

/** Small additive reactions over the authored clips. Restore before sampling the
 * next pose so offsets never accumulate or alter the saved/default rig. */
export function createAudiencePerformance(actor: Actor) {
  const nodes = ['Head', 'spine_03'].map(name => {
    const node = actor.model.findByName(name);
    if (!node) throw new Error(`Missing ${actor.model.name} reaction joint ${name}`);
    return { node: node as GraphNode, base: new Quat() };
  });
  const offset = new Quat(), combined = new Quat();
  let applied = false;
  function restore() {
    if (applied) for (const { node, base } of nodes) node.setLocalRotation(base);
    applied = false;
  }
  function apply(time: number, speaking: boolean, nod: number, seed: number) {
    for (const { node, base } of nodes) base.copy(node.getLocalRotation());
    const head = nodes[0], chest = nodes[1];
    offset.setFromEulerAngles(nod + Math.sin(time * 2.1 + seed) * (speaking ? .65 : .20), Math.sin(time * .47 + seed) * .65, Math.sin(time * .33 + seed) * .25);
    head.node.setLocalRotation(combined.mul2(head.base, offset));
    offset.setFromEulerAngles(Math.sin(time * 1.45 + seed) * .32, 0, Math.sin(time * .53 + seed) * .18);
    chest.node.setLocalRotation(combined.mul2(chest.base, offset));
    applied = true;
  }
  return { restore, apply };
}

export function reactionNod(time: number, start: number, duration: number, degrees = 3) {
  const phase = (time - start) / duration;
  return phase > 0 && phase < 1 ? Math.sin(phase * Math.PI * 2) * Math.sin(phase * Math.PI) * degrees : 0;
}

/** Continue an expressive gesture with a smooth return instead of freezing the
 * last authored frame halfway through a longer voiced line. */
export function speakingGestureTime(local: number, duration: number) {
  const phase = Math.max(0, local) % (duration * 2);
  return phase <= duration ? phase : duration * 2 - phase;
}
