import { Application, DEVICETYPE_WEBGL2, FILLMODE_NONE, RESOLUTION_FIXED, createGraphicsDevice } from 'playcanvas';
import { currentAccountSettings } from '../product/preferences';
import {warmCharacterFaces} from './character-face';

export class WebGLUnavailable extends Error {}

export async function createWebGLApp(canvas: HTMLCanvasElement, antialias = false) {
  const device = await createGraphicsDevice(canvas, { deviceTypes: [DEVICETYPE_WEBGL2], antialias })
    .catch(() => { throw new WebGLUnavailable(); });
  if (device.deviceType !== DEVICETYPE_WEBGL2) {
    device.destroy();
    throw new WebGLUnavailable();
  }
  device.maxPixelRatio = 1;
  const app = new Application(canvas, { graphicsDevice: device });
  app.setCanvasFillMode(FILLMODE_NONE);
  return app;
}

export function observeCanvas(app: Application, canvas: HTMLCanvasElement) {
  function resize() {
    const { clientWidth: width, clientHeight: height } = canvas;
    const low = currentAccountSettings()?.graphics === 'low';
    const scale = Math.min(1, (low ? 960 : 1280) / Math.max(width, height), (low ? 540 : 720) / Math.min(width, height));
    app.setCanvasResolution(RESOLUTION_FIXED, Math.max(1, Math.floor(width * scale)), Math.max(1, Math.floor(height * scale)));
  }
  resize();
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  app.once('destroy', () => observer.disconnect());
}

export function waitForFrame(app: Application) {
  const restoreFaces=warmCharacterFaces(app);
  return new Promise<void>(resolve => {
    app.once('frameend',()=>{restoreFaces();resolve();});
    app.start();
  });
}
