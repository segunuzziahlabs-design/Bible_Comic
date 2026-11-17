import * as pc from './playcanvas.min.mjs';

const canvas = document.querySelector('#canvas');

async function start() {
    const device = await pc.createGraphicsDevice(canvas, { deviceTypes: ['webgl2'], antialias: false });
    if (device.deviceType !== 'webgl2') throw new Error('Expected WebGL 2');
    const app = new pc.Application(canvas, { graphicsDevice: device });
    device.maxPixelRatio = 1;
    app.setCanvasFillMode(pc.FILLMODE_NONE);
    app.setCanvasResolution(pc.RESOLUTION_FIXED, canvas.clientWidth, canvas.clientHeight);
    app.scene.ambientLight = new pc.Color(.57, .56, .54);

    const camera = new pc.Entity('Camera');
    camera.addComponent('camera', { fov: 38, nearClip: .05, farClip: 32,
        clearColor: new pc.Color(59 / 255, 81 / 255, 85 / 255) });
    app.root.addChild(camera);

    const light = new pc.Entity('Key');
    light.addComponent('light', { type: 'directional', color: new pc.Color(1, .94, .85), intensity: 1.55,
        castShadows: true, shadowResolution: 1024, shadowDistance: 8, normalOffsetBias: .035, numCascades: 1 });
    light.setEulerAngles(-48, -28, 0);
    light.rotateLocal(90, 0, 0);
    app.root.addChild(light);

    const floor = new pc.Entity('Floor');
    floor.addComponent('render', { type: 'box', castShadows: false });
    floor.setLocalScale(14, .10, 12);
    floor.setPosition(0, -.05, 0);
    const stone = new pc.StandardMaterial();
    stone.diffuse = new pc.Color(.40, .37, .33);
    stone.gloss = .12;
    stone.update();
    floor.render.material = stone;
    app.root.addChild(floor);

    const asset = await new Promise((resolve, reject) => {
        app.assets.loadFromUrl('./david.glb', 'container', (error, result) => error ? reject(error) : resolve(result));
    });
    const model = asset.resource.instantiateRenderEntity({ castShadows: true });
    app.root.addChild(model);
    model.addComponent('anim', { activate: true });
    for (const clip of asset.resource.animations) model.anim.assignAnimation(clip.resource.name, clip.resource);
    const layer = model.anim.baseLayer;
    const morphs = new Map();
    for (const render of model.findComponents('render')) {
        for (const mesh of render.meshInstances) {
            const instance = mesh.morphInstance;
            if (!instance) continue;
            for (let i = 0; i < instance.morph.targets.length; i++) {
                morphs.set(instance.morph.targets[i].name, [instance, i]);
            }
        }
    }
    const setMorph = (name, value) => {
        const [instance, index] = morphs.get(name);
        instance.setWeight(index, value);
    };
    for (const name of ['Blink', 'BrowLift', 'Smile']) {
        if (!morphs.has(name)) throw new Error('Missing facial pose ' + name);
    }

    window.stackTest.clips = asset.resource.animations.map(clip => clip.resource.name);
    window.stackTest.morphs = [...morphs.keys()];
    window.stackTest.backend = device.deviceType;
    window.stack.snapshot = () => ({ clip: layer.activeState, seconds: layer.activeStateCurrentTime,
        faces: Object.fromEntries([...morphs].map(([name, [instance, index]]) => [name, instance.getWeight(index)])) });
    app.on('frameend', () => window.stack.rendered());
    window.stack.configure('PlayCanvas ' + pc.version, (clip, paused, sample, x, z, yaw,
        camX, camY, camZ, targetX, targetY, targetZ, blink, brow, smile) => {
        if (clip) layer.transition(clip, sample >= 0 ? 0 : .23);
        layer.playing = !paused || sample >= 0;
        if (sample >= 0) {
            layer.activeStateCurrentTime = sample;
            model.anim.update(0);
            layer.pause();
        }
        model.setPosition(x, 0, z);
        model.setEulerAngles(0, yaw * 180 / Math.PI, 0);
        camera.setPosition(camX, camY, camZ);
        camera.lookAt(targetX, targetY, targetZ);
        setMorph('Blink', blink);
        setMorph('BrowLift', brow);
        setMorph('Smile', smile);
    }, (width, height) => app.setCanvasResolution(pc.RESOLUTION_FIXED, width, height));
    app.start();
}

start().catch(error => { window.stack.fail(error); console.error(error); });
