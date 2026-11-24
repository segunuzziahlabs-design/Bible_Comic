import { StandardMaterial, type Application, type AnimTrack, type ContainerResource, type MorphInstance, type RenderComponent } from 'playcanvas';
import davidUrl from '../assets/david.glb?url';
import { hairColours, hairStyles, skinTones, tunicColours, type DavidAppearance } from './david-appearance';
import { loadJumpAnimations } from './jump-animations';
import {createCharacterFace} from './character-face';

const clips = ['idle_relaxed', 'walk_forward', 'acknowledge', 'listen', 'listen_to_provisions', 'pickup_provisions'];
const faces = ['Blink', 'BrowLift', 'Smile'] as const;

function setTint(material: StandardMaterial, tint: readonly [number, number, number]) {
  material.diffuse.set(...tint);
  material.update();
}

export async function loadDavid(app: Application, url = davidUrl) {
  const resource = await new Promise<ContainerResource>((resolve, reject) => {
    app.assets.loadFromUrl(url, 'container', (error, asset) => {
      if (error || !asset?.resource) reject(new Error('Could not load David', { cause: error }));
      else resolve(asset.resource as ContainerResource);
    });
  });
  const model = resource.instantiateRenderEntity({ castShadows: true });
  model.name = 'David';
  app.root.addChild(model);
  model.addComponent('anim', { activate: true });
  const animator = model.anim;
  if (!animator) throw new Error('David has no animation component');

  const tracks = new Map(resource.animations.map(asset => {
    const track = asset.resource as AnimTrack;
    return [track.name, track] as const;
  }));
  for (const [name, track] of await loadJumpAnimations(app)) tracks.set(name, track);
  for (const clip of clips) {
    const track = tracks.get(clip);
    if (!track) throw new Error(`Missing David animation: ${clip}`);
    animator.assignAnimation(clip, track, undefined, 1, clip !== 'acknowledge');
  }

  const morphs = new Map<string, [MorphInstance, number]>();
  const materials = new Map<string, StandardMaterial>();
  for (const render of model.findComponents('render') as RenderComponent[]) {
    for (const mesh of render.meshInstances) {
      if (mesh.material instanceof StandardMaterial) materials.set(mesh.material.name, mesh.material);
      const instance = mesh.morphInstance;
      instance?.morph.targets.forEach((target, index) => morphs.set(target.name, [instance, index]));
    }
  }
  for (const face of faces) if (!morphs.has(face)) throw new Error(`Missing David face shape: ${face}`);
  const hairShape = morphs.get('FullerHair');
  const skin = materials.get('Skin');
  const hair = materials.get('Hair');
  const brows = materials.get('Brows');
  const cloth = materials.get('Cloth');
  if (!hairShape || !skin || !hair || !brows || !cloth) throw new Error('Missing David appearance slots');


  const [hairInstance, hairIndex] = hairShape;
  const appearanceMaterials = { skin, hair, brows, cloth };
  function setAppearance(appearance: DavidAppearance) {
    const { skin, hair, brows, cloth } = appearanceMaterials;
    const hairTint = hairColours[appearance.hairColour].tint;
    setTint(skin, skinTones[appearance.skin].tint);
    setTint(hair, hairTint);
    setTint(brows, hairTint);
    setTint(cloth, tunicColours[appearance.tunic].tint);
    hairInstance.setWeight(hairIndex, hairStyles[appearance.hairStyle].fullness);
  }
  const facial=createCharacterFace(app,model);
  return { model, animator, tracks, setFace:(ack:number)=>facial.set(0,0,.75*ack,.7*ack,0), setAppearance, speech:facial.speech, mouthWeights:facial.mouthWeights,
    gaze:facial.gaze,expression:facial.expression,faceSample:facial.sample };
}
