import {
  ANIM_BLEND_1D, ANIM_PARAMETER_FLOAT, Color, StandardMaterial, type AnimTrack, type Application, type ContainerResource,
  type MorphInstance, type RenderComponent,
} from 'playcanvas';
import { loadJumpAnimations } from './jump-animations';
import { storyWalkWeight } from '../gameplay/story-motion';
import {createCharacterFace} from './character-face';

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
  // Configure before callers add the upper-body provisions layer. Existing
  // named one-shot states keep their original sampling and cue ownership.
  const locomotion = name === 'David' && tracks.has('walk_forward');
  if (locomotion) animator.loadStateGraph({
    parameters: { storyWalk: { name: 'storyWalk', type: ANIM_PARAMETER_FLOAT, value: 0 } },
    layers: [{ name: 'Base', states: [{ name: 'START' },
      { name: 'StoryLocomotion', loop: true, blendTree: {
        type: ANIM_BLEND_1D, parameter: 'storyWalk', syncAnimations: false,
        children: [{ name: 'Idle', point: 0, speed: 1 }, { name: 'Walk', point: 1, speed: 1 }],
      } }, ...[...tracks.keys()].map(name => ({ name, loop: false }))],
      transitions: [{ from: 'START', to: 'idle_relaxed' }],
    }],
  });
  for (const [clip, track] of tracks) animator.assignAnimation(clip, track, undefined, 1, false);
  if (locomotion) {
    animator.assignAnimation('StoryLocomotion.Idle', tracks.get('idle_relaxed')!, undefined, 1, true);
    animator.assignAnimation('StoryLocomotion.Walk', tracks.get('walk_forward')!, undefined, 1, true);
  }
  animator.playing = false;
  const base = animator.baseLayer;
  if (!base) throw new Error(`Missing ${name} animation layer`);
  const layer = base;
  let walkWeight = 0, locomotionTime = 0;

  function pose(clip: string, time: number, dt: number) {
    const track = tracks.get(clip);
    if (!track) throw new Error(`Missing ${name} clip ${clip}`);
    walkWeight = 0;
    if (layer.activeState !== clip) {
      if (dt > 0) layer.transition(clip, .14);
      else { layer.play(clip); animator.update(.0001); }
    }
    layer.activeStateCurrentTime = Math.max(0, Math.min(time, track.duration) - dt);
    animator.update(dt);
  }

  function locomote(speed: number, dt: number) {
    if (!locomotion) throw new Error(`${name} has no story locomotion`);
    const actualSpeed = Math.max(0, speed);
    if (layer.activeState !== 'StoryLocomotion') {
      locomotionTime = 0; walkWeight = 0;
      if (dt > 0) layer.transition('StoryLocomotion', .18);
      else layer.play('StoryLocomotion');
    }
    walkWeight += (storyWalkWeight(actualSpeed) - walkWeight) * (1 - Math.exp(-14 * dt));
    animator.setFloat('storyWalk', walkWeight);
    // .93 m/s is the imported in-place walk's calibrated reference speed.
    // Advance from actual travel, including acceleration and collision. At rest
    // only the idle remains weighted and continues breathing normally.
    locomotionTime += dt * (actualSpeed > .025 ? actualSpeed / .93 : 1);
    layer.activeStateCurrentTime = Math.max(0, locomotionTime - dt);
    animator.update(dt);
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
  const facial=createCharacterFace(app,model);
  if(!facial.sample().speechBindings)throw new Error(`Missing ${name} mouth controls`);
  return { model, tracks, pose, locomote, face:facial.set, tint, morph:facial.morph, mouthWeights:facial.mouthWeights,
    gaze:facial.gaze,expression:facial.expression,faceSample:facial.sample,
    motion: () => ({ state: layer.activeState, walkWeight, locomotionTime }) };
}
