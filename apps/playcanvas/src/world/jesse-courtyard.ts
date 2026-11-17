import { Color, Entity, StandardMaterial, type Application } from 'playcanvas';
import { loadConversationActor } from './conversation-actor';
import jesseUrl from '../assets/jesse-courtyard.glb?url';

export const jesseMark = { x: -1.5, z: -8.2 };
export const bundleMark = { x: 1.35, z: -8.3 };
export const ridgeMark = { x: -1, z: -19 };
export const valleyExit = { x: 0, z: -25 };
export const bundleHeight = .53;

/** A household on the existing shepherd route, not a separate game/save system. */
export async function buildJesseCourtyard(app: Application, parent: Entity) {
  const root = new Entity('Jesse’s household courtyard'); parent.addChild(root);
  function material(name: string, rgb: [number, number, number]) {
    const m = new StandardMaterial(); m.name = name; m.diffuse = new Color(...rgb);
    m.gloss = .04; m.update(); return m;
  }
  const plaster = material('Earth and lime plaster', [.66, .53, .36]);
  const stone = material('Courtyard limestone', [.48, .43, .32]);
  const floor = material('Trodden courtyard earth', [.51, .43, .30]);
  const wood = material('Household timber', [.24, .15, .075]);
  const shade = material('Reed and linen shade', [.64, .58, .40]);
  const dark = material('Dark doorway', [.13, .10, .065]);
  const clay = material('Household clay jars', [.51, .26, .13]);
  const olive = material('Dried herbs and olive leaves', [.28, .32, .16]);
  function shape(name: string, type: 'box'|'cylinder'|'sphere'|'torus', at: number[], size: number[], mat: StandardMaterial, cast = true) {
    const e = new Entity(name); e.addComponent('render', {type, material: mat, castShadows: cast});
    e.setLocalPosition(at[0], at[1], at[2]); e.setLocalScale(size[0], size[1], size[2]); root.addChild(e); return e;
  }
  shape('Open household courtyard', 'box', [0, -.04, -8.5], [11.6, .10, 9.0], floor, false);
  // Flat timber/reed roofs, plaster and stone foundations; no medieval castle motifs.
  for (const [x, z, width, depth, height] of [[-4.1, -10.5, 3.2, 3.5, 2.15], [4.4, -10.65, 2.3, 3.15, 1.9]]) {
    shape('Rubble-stone house footing', 'box', [x, .16, z], [width+.12, .32, depth+.12], stone);
    shape('Mud-plastered household', 'box', [x, height/2+.16, z], [width, height, depth], plaster);
    shape('Reed roof', 'box', [x, height+.23, z], [width+.22, .16, depth+.22], shade);
    shape('Recessed household doorway', 'box', [x, .87, z+depth/2+.014], [.70, 1.42, .025], dark, false);
    shape('Timber door lintel', 'box', [x, 1.62, z+depth/2+.04], [.92, .13, .16], wood);
    for (let i=0; i<4; i++) shape('Roof beam end', 'box', [x-width*.36+i*width*.24, height+.19, z], [.09, .13, depth+.35], wood);
  }
  // Both the entry from the flock and the rear gate to Elah remain open.
  for (const z of [-4.25, -13.0]) for (const side of [-1, 1]) {
    shape('Low courtyard boundary', 'box', [side*3.8, .42, z], [3.8, .84, .32], stone);
    shape('Courtyard gate post', 'box', [side*1.85, .67, z], [.28, 1.34, .32], plaster);
  }
  shape('Provisions stone bench', 'box', [bundleMark.x, .17, bundleMark.z], [1.65, .34, .9], stone);
  // A modest work shade beside the table leaves the father/son sightline clear.
  for (const x of [2.8, 5.5]) for (const z of [-5.1, -8.1]) shape('Work shade pole', 'cylinder', [x, 1.12, z], [.075, 2.24, .075], wood);
  shape('Reed work shade', 'box', [4.15, 2.28, -6.6], [2.9, .065, 3.2], shade);
  for (const [x,z,scale] of [[-3.0,-6.4,.9],[-3.5,-6.1,1.05],[4.7,-5.8,.85],[5.05,-6.1,.7]]) {
    shape('Storage jar body', 'sphere', [x, .32*scale, z], [.45*scale,.62*scale,.45*scale], clay);
    shape('Storage jar neck', 'cylinder', [x, .64*scale, z], [.18*scale,.17*scale,.18*scale], clay);
    shape('Open jar mouth', 'cylinder', [x, .73*scale, z], [.13*scale,.008,.13*scale], dark, false);
  }
  shape('Woven work mat', 'box', [4.2,.03,-6.2], [1.2,.025,1.5], shade, false);
  for(let i=0;i<3;i++) shape('Drying herbs', 'sphere', [-2.7+i*.15,1.56,-8.73], [.13,.34,.10], olive, false);

  const jesse = await loadConversationActor(app, jesseUrl, 'Jesse, David’s father');
  root.addChild(jesse.model); jesse.model.setPosition(jesseMark.x, 0, jesseMark.z); jesse.model.setEulerAngles(0, 24, 0);
  const walls = [
    {minX:-5.76,maxX:-2.44,minZ:-12.31,maxZ:-8.69},
    {minX:3.19,maxX:5.61,minZ:-12.29,maxZ:-9.01},
    {minX:.52,maxX:2.18,minZ:-8.75,maxZ:-7.85},
    {minX:-1.82,maxX:-1.18,minZ:-8.52,maxZ:-7.88},
    ...[-4.25,-13].flatMap(z=>[
      {minX:-5.7,maxX:-1.71,minZ:z-.18,maxZ:z+.18},
      {minX:1.71,maxX:5.7,minZ:z-.18,maxZ:z+.18},
    ]),
  ];
  return {root, jesse, walls};
}
