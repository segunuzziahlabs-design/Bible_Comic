import {
  Color, StandardMaterial, type AnimTrack, type Application, type ContainerResource,
  type MorphInstance, type RenderComponent,
} from 'playcanvas';
import { loadJumpAnimations } from './jump-animations';

export async function loadConversationActor(app: Application, url: string, name: string) {
  const resource = await new Promise<ContainerResource>((resolve, reject) => {
    app.assets.loadFromUrl(url, 'container', (error, asset) => {
      if (error || !asset?.resource) reject(new Error(`Could not load ${name}`, { cause: error }));
      else resolve(asset.resource as ContainerResource);
    });
  });
  const model = resource.instantiateRenderEntity({ castShadows: true });
  model.name = name;
  app.root.addChild(model);
  model.addComponent('anim', { activate: false });
  const animator = model.anim!;
  const tracks = new Map(resource.animations.map(asset => {
    const track = asset.resource as AnimTrack;
    return [track.name, track] as const;
  }));
  if (name === 'David') for (const [clip, track] of await loadJumpAnimations(app)) tracks.set(clip, track);
  for (const [clip, track] of tracks) animator.assignAnimation(clip, track, undefined, 1, false);
  animator.playing = false;
  const base = animator.baseLayer;
  if (!base) throw new Error(`Missing ${name} animation layer`);
  const layer = base;
  const morphs = new Map<string, Array<[MorphInstance, number]>>();
  for (const render of model.findComponents('render') as RenderComponent[]) {
    for (const mesh of render.meshInstances) {
      const instance = mesh.morphInstance;
      instance?.morph.targets.forEach((target, index) => {
        const entries = morphs.get(target.name) ?? [];
        entries.push([instance, index]);
        morphs.set(target.name, entries);
      });
    }
  }
  if (!morphs.has('SpeakOpen')) throw new Error(`Missing ${name} mouth controls`);

  function pose(clip: string, time: number, dt: number) {
    const track = tracks.get(clip);
    if (!track) throw new Error(`Missing ${name} clip ${clip}`);
    if (layer.activeState !== clip) {
      if (dt > 0) layer.transition(clip, .14);
      else { layer.play(clip); animator.update(.0001); }
    }
    layer.activeStateCurrentTime = Math.max(0, Math.min(time, track.duration) - dt);
    animator.update(dt);
  }

  function morph(name: string, value: number) {
    for (const [instance, index] of morphs.get(name) ?? []) instance.setWeight(index, value);
  }

  function face(open: number, round: number, smile: number, brow: number, blink: number) {
    for (const [name, value] of [['SpeakOpen', open], ['SpeakRound', round],
      ['Smile', smile], ['BrowLift', brow], ['Blink', blink]] as const) {
      morph(name, value);
    }
  }

  function tint(materialName: string, rgb: readonly [number, number, number]) {
    const clones = new Map<StandardMaterial, StandardMaterial>();
    for (const render of model.findComponents('render') as RenderComponent[]) {
      for (const mesh of render.meshInstances) {
        if (!(mesh.material instanceof StandardMaterial) || mesh.material.name !== materialName) continue;
        const original = mesh.material;
        let coloured = clones.get(original);
        if (!coloured) {
          coloured = original.clone();
          coloured.diffuse = new Color(...rgb);
          coloured.update();
          clones.set(original, coloured);
        }
        mesh.material = coloured;
      }
    }
  }

  pose('idle_relaxed', 0, 0);
  function mouthWeights() { return (morphs.get('SpeakOpen') ?? []).map(([instance, index]) => instance.getWeight(index)); }
  return { model, tracks, pose, face, tint, morph, mouthWeights };
}
