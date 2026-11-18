import { Color, Entity, StandardMaterial, type Application } from 'playcanvas';
import type { SlingGuidance } from '../gameplay/sling-ballistics';

/** Bounded reusable guide beads; these never alter a gameplay projectile. */
export function createStonePreview(app: Application) {
  const materials = [false, true].map(aligned => {
    const m = new StandardMaterial(); m.diffuse = new Color(.3,.27,.2);
    m.emissive = aligned ? new Color(.3,.9,.66) : new Color(.93,.65,.27); m.update(); return m;
  });
  const points = Array.from({ length: 36 }, (_, i) => {
    const e = new Entity('Sling trajectory guide ' + i);
    e.addComponent('render', { type: 'sphere', material: materials[0], castShadows: false, receiveShadows: false });
    e.setLocalScale(.055,.055,.055);e.enabled=false;app.root.addChild(e);return e;
  });
  return { update(guide?: SlingGuidance) { points.forEach((e,i) => {
    const p=guide?.points[i];e.enabled=!!p;
    if(p){e.setPosition(p.x,p.y,p.z);for(const mesh of e.render!.meshInstances)mesh.material=materials[guide!.aligned?1:0];}
  }); } };
}
