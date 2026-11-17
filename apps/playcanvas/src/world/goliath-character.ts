import { type Application, type AnimTrack, type ContainerResource, type Entity, type MorphInstance, type RenderComponent } from 'playcanvas';
import goliathUrl from '../assets/goliath-collision.glb?url';

const clips = ['goliath_ready', 'goliath_challenge', 'goliath_advance', 'goliath_spear', 'goliath_fall'] as const;
type Clip = typeof clips[number];

export async function loadGoliath(app: Application, url = goliathUrl) {
  const resource = await new Promise<ContainerResource>((resolve, reject) => {
    app.assets.loadFromUrl(url, 'container', (error, asset) => {
      if (error || !asset?.resource) reject(new Error('Could not load Goliath', { cause: error }));
      else resolve(asset.resource as ContainerResource);
    });
  });
  const model = resource.instantiateRenderEntity({ castShadows: true });
  model.name = 'Goliath';
  app.root.addChild(model);
  model.addComponent('anim', { activate: false });
  const animator = model.anim!;
  const tracks = new Map(resource.animations.map(asset => {
    const track = asset.resource as AnimTrack;
    return [track.name, track] as const;
  }));
  for (const clip of clips) {
    const track = tracks.get(clip);
    if (!track) throw new Error(`Missing Goliath animation: ${clip}`);
    animator.assignAnimation(clip, track, undefined, 1, false);
  }
  for(const clip of ['goliath_spear_1','goliath_spear_2','goliath_spear_3','goliath_throw'])if(tracks.has(clip))animator.assignAnimation(clip,tracks.get(clip)!,undefined,1,false);
  if (tracks.has('goliath_speak')) animator.assignAnimation('goliath_speak', tracks.get('goliath_speak')!, undefined, 1, false);
  animator.playing = false;
  const baseLayer = animator.baseLayer;
  const forehead = model.findByName('Goliath forehead') as Entity | null;
  const grip=model.findByName('Spear grip') as Entity|null,tip=model.findByName('Spear tip') as Entity|null;
  if (!baseLayer || !forehead || !grip || !tip) throw new Error('Goliath rig is missing its animation layer, forehead or spear markers');
  const layer = baseLayer;

  const morphs = new Map<string, Array<[MorphInstance, number]>>();
  for (const render of model.findComponents('render') as RenderComponent[]) for (const mesh of render.meshInstances) {
    const instance = mesh.morphInstance;
    instance?.morph.targets.forEach((target, index) => {
      const entries = morphs.get(target.name) ?? []; entries.push([instance, index]); morphs.set(target.name, entries);
    });
  }
  function face(open: number, round: number) {
    for (const [name, value] of [['SpeakOpen', open], ['SpeakRound', round]] as const)
      for (const [instance, index] of morphs.get(name) ?? []) instance.setWeight(index, value);
  }
  function mouthWeights() { return (morphs.get('SpeakOpen') ?? []).map(([instance, index]) => instance.getWeight(index)); }
  function pose(clip: Clip | 'goliath_speak' | 'goliath_spear_1' | 'goliath_spear_2' | 'goliath_spear_3' | 'goliath_throw', time: number, dt: number, cut = false) {
    if (layer.activeState !== clip || cut) {
      if (!dt || cut) { layer.play(clip); animator.update(.0001); }
      else layer.transition(clip, .10);
    }
    layer.activeStateCurrentTime = Math.max(0, Math.min(time, tracks.get(clip)!.duration) - dt);
    animator.update(dt);
  }

  // Establish a real initial pose before callers transition or sample the rig.
  // Transitioning directly from an unstarted controller leaves its skin bounds collapsed.
  pose('goliath_ready', 0, 0, true);
  const weapon=model.findComponents('render').filter(r=>/Goliath spear (shaft|head)/.test(r.entity.name));
  return { heldWeapon(visible:boolean){for(const render of weapon)render.enabled=visible;}, model, pose, forehead, grip, tip, face, mouthWeights, tracks };
}
