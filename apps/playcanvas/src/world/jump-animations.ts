import type { AnimTrack, Application, ContainerResource } from 'playcanvas';
import jumpUrl from '../assets/david-jump.glb?url';

const cache = new WeakMap<Application, Promise<Map<string, AnimTrack>>>();
export function loadJumpAnimations(app: Application) {
  let result = cache.get(app);
  if (!result) {
    result = new Promise<Map<string, AnimTrack>>((resolve, reject) => {
      app.assets.loadFromUrl(jumpUrl, 'container', (error, asset) => {
        if (error || !asset?.resource) { reject(new Error('David’s jump animations could not load.', { cause: error })); return; }
        const resource = asset.resource as ContainerResource;
        const tracks = new Map(resource.animations.map(asset => { const track = asset.resource as AnimTrack; return [track.name, track] as const; }));
        for (const name of ['jump_takeoff', 'jump_air', 'jump_land']) if (!tracks.has(name)) { reject(new Error(`Missing jump animation ${name}`)); return; }
        resolve(tracks);
      });
    });
    cache.set(app, result);
  }
  return result;
}
