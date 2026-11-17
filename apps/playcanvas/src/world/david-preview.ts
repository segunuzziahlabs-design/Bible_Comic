import { Color, Entity, StandardMaterial, type Application } from 'playcanvas';
import { createWebGLApp, observeCanvas, waitForFrame } from './graphics';
import { loadDavid } from './david-character';

export type PreviewAction = 'walk' | 'acknowledge';
const poses = {
  walk: { clip: 'walk_forward', time: .42, camera: [.62, 1.14, 3.72], target: [0, .83, 0] },
  acknowledge: { clip: 'acknowledge', time: .58, camera: [.14, 1.46, 1.04], target: [0, 1.43, 0] },
} as const;

function createArea(app: Application) {
  app.scene.ambientLight = new Color(.57, .56, .54);
  const camera = new Entity('David preview camera');
  camera.addComponent('camera', {
    fov: 38, nearClip: .05, farClip: 32, clearColor: new Color(59 / 255, 81 / 255, 85 / 255),
  });
  app.root.addChild(camera);

  const key = new Entity('Key light');
  key.addComponent('light', {
    type: 'directional', color: new Color(1, .94, .85), intensity: 1.55,
    castShadows: true, shadowResolution: 1024, shadowDistance: 8, normalOffsetBias: .035, numCascades: 1,
  });
  key.setEulerAngles(-48, -28, 0);
  key.rotateLocal(90, 0, 0);
  app.root.addChild(key);

  const floor = new Entity('Test floor');
  const stone = new StandardMaterial();
  stone.diffuse = new Color(.40, .37, .33);
  stone.gloss = .12;
  stone.update();
  floor.addComponent('render', { type: 'box', castShadows: false, material: stone });
  floor.setLocalScale(14, .10, 12);
  floor.setPosition(0, -.05, 0);
  app.root.addChild(floor);
  return camera;
}

export async function openDavidPreview(canvas: HTMLCanvasElement) {
  const app = await createWebGLApp(canvas);
  try {
    observeCanvas(app, canvas);
    const camera = createArea(app);
    const { model, animator, setFace, setAppearance } = await loadDavid(app);
    model.setEulerAngles(0, .12 * 180 / Math.PI, 0);
    const baseLayer = animator.baseLayer;
    if (!baseLayer) throw new Error('David has no animation layer');
    const layer = baseLayer;
    let held = false;

    function frame(action: PreviewAction) {
      const { camera: [x, y, z], target: [tx, ty, tz] } = poses[action];
      camera.setPosition(x, y, z);
      camera.lookAt(tx, ty, tz);
    }
    function show(action: PreviewAction, hold: boolean) {
      const { clip, time } = poses[action];
      held = hold;
      frame(action);
      const sameClip = layer.activeState === clip;
      layer.play();
      layer.transition(clip, hold || sameClip ? 0 : .23);
      if (hold || sameClip) {
        layer.activeStateCurrentTime = hold ? time : 0;
        animator.update(0);
      }
      if (hold) layer.pause();
      setFace(hold && action === 'acknowledge' ? 1 : 0);
    }

    layer.play('idle_relaxed');
    frame('walk');
    app.on('update', () => {
      if (held) return;
      const time = layer.activeStateCurrentTime;
      const weight = layer.activeState === 'acknowledge'
        ? Math.max(0, Math.min(1, time / .24, (layer.activeStateDuration - time) / .24))
        : 0;
      setFace(weight);
    });
    await waitForFrame(app);
    return { show, setAppearance, backend: app.graphicsDevice.deviceType };
  } catch (error) {
    app.destroy();
    throw error;
  }
}
