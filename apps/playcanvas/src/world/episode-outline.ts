import { Color, Entity, StandardMaterial, type Application, type RenderComponent } from 'playcanvas';
import { loadConversationActor } from './conversation-actor';
import saulUrl from '../assets/saul.glb?url';
import type { ObjectiveId } from '../gameplay/episode-rules';

export const outlineTargets: Partial<Record<ObjectiveId, { x: number; z: number; action: string; duration: number; text: string; clip: string }>> = {
  'valley.surveyed': { x: 0, z: 9.2, action: 'Survey the valley', duration: 5,
    text: 'The armies stand on opposing hills, with the valley between them. David has come with provisions for his brothers.', clip: 'listen' },
  'provisions.delivered': { x: -2.6, z: 9.6, action: 'Deliver provisions', duration: 3.3,
    text: 'David leaves the provisions with the keeper of the baggage before going to greet his brothers.', clip: 'pickup_provisions' },
  'brothers.met': { x: 2.5, z: 7.7, action: 'Greet your brothers', duration: 4,
    text: 'David greets his brothers. Their attention turns to the champion who has come out to challenge Israel.', clip: 'acknowledge' },
  'challenge.heard': { x: 0, z: 4.0, action: 'Hear the challenge', duration: 5.5,
    text: 'Goliath calls for a man to face him. The soldiers draw back in fear. David listens to the challenge.', clip: 'listen' },
  'eliab.answered': { x: 2.5, z: 7.7, action: 'Speak to Eliab', duration: 4,
    text: 'Eliab questions why David has come. David turns back to the challenge, confident in the Lord’s deliverance.', clip: 'speak_resolve' },
  'stones.gathered': { x: -.6, z: -2.6, action: 'Gather five stones', duration: 2.8,
    text: 'David chooses five smooth stones from the brook and puts them in his shepherd’s bag.', clip: 'pickup_provisions' },
  'sling.practised': { x: 0, z: -1.1, action: 'Practise with the sling', duration: 0,
    text: 'Aim at the woven target. Drag or use I/J/K/L, then press Space or tap Throw. A miss lets you try again.', clip: 'idle_relaxed' },
};
export const outlineSpawns: Record<string, { x: number; z: number }> = {
  'valley.entry': { x: 0, z: 12.0 }, 'camp.entry': { x: -.4, z: 10.4 },
  'challenge.entry': { x: .2, z: 6.6 }, 'brook.entry': { x: 0, z: .5 },
};

export async function buildEpisodeOutline(app: Application, ground: (x: number, z: number) => number) {
  const surface = (rgb: [number, number, number]) => { const mat = new StandardMaterial(); mat.diffuse = new Color(...rgb); mat.gloss = .1; mat.update(); return mat; };
  const linen = surface([.68, .54, .35]), wood = surface([.24, .14, .075]), clay = surface([.52, .29, .17]);
  const stone = surface([.65, .60, .48]), gold = surface([.75, .51, .20]);
  function shape(name: string, kind: 'box' | 'sphere' | 'cylinder', x: number, y: number, z: number, sx: number, sy: number, sz: number, material = wood) {
    const entity = new Entity(name); entity.addComponent('render', { type: kind, material, castShadows: true });
    entity.setPosition(x, ground(x, z) + y, z); entity.setLocalScale(sx, sy, sz); app.root.addChild(entity); return entity;
  }
  for (const side of [-1, 1]) {
    const x = side * 5.3;
    for (const dz of [-.8, .8]) shape('Camp shelter pole', 'cylinder', x, 1, 9.4 + dz, .08, 2, .08);
    const roof = shape('Camp shelter canvas', 'box', x, 2.08, 9.4, 2.6, .06, 2.25, linen); roof.setEulerAngles(0, 0, side * 8);
    shape('Camp shelter back', 'box', x, 1, 10.5, 2.6, 2, .04, linen);
  }
  shape('Baggage table', 'box', -3.25, .7, 9.3, 1.2, .12, .7);
  for (const x of [-3.7, -2.8]) for (const z of [9.08, 9.52]) shape('Baggage table leg', 'box', x, .32, z, .065, .64, .065);
  const bundle = shape('Delivered provisions', 'box', -3.2, .84, 9.3, .52, .20, .36, linen);
  shape('Clay water jar', 'sphere', -4.25, .28, 9.4, .40, .56, .40, clay);
  shape('Overlook stone', 'box', 0, .18, 9.2, .65, .36, .45, stone);
  const marker = shape('Current objective marker', 'cylinder', 0, .035, 9.2, .86, .018, .86, gold);
  const stones = Array.from({ length: 5 }, (_, i) => shape('Five smooth stones', 'sphere', -.6 + (i % 3 - 1) * .15, .065, -2.6 + Math.floor(i / 3) * .15, .11, .075, .13, stone));
  shape('Practice target post', 'cylinder', 0, .75, -5.0, .055, 1.5, .055);
  const practiceTarget = shape('Woven sling target', 'cylinder', 0, 1.45, -5.0, .78, .08, .78, linen); practiceTarget.setEulerAngles(90, 0, 0);
  const targetCentre = shape('Practice target centre', 'sphere', 0, 1.45, -4.94, .20, .20, .06, gold);

  const people = await Promise.all(['Baggage keeper · temporary cast', 'Eliab · temporary cast'].map(name => loadConversationActor(app, saulUrl, name)));
  people.forEach((actor, i) => {
    const x = i ? 2.5 : -2.6, z = i ? 7.7 : 9.6;
    actor.model.setPosition(x, ground(x, z), z); actor.model.setEulerAngles(0, i ? -30 : 30, 0);
    actor.model.setLocalScale(.94, .94, .94); actor.tint('Skin', [1, 1, 1]); actor.tint('Eyes', [1, 1, 1]);
    actor.tint('Cloth', i ? [1.8, .7, .46] : [1.0, 1.0, .65]);
    for (const render of actor.model.findComponents('render') as RenderComponent[]) {
      if (/Saul beard|Saul moustache|Saul circlet|mantle|Mantle clasp/i.test(render.entity.name)) render.enabled = false;
    }
  });
  return { marker, bundle, stones, people, targetCentre };
}
