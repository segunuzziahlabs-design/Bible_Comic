const state = document.querySelector('#state');
const run = document.querySelector('#run');
const pause = document.querySelector('#pause');
const view = document.querySelector('#view');
const canvas = document.querySelector('#canvas');
const loop = new URLSearchParams(location.search).has('loop');

const smooth = (low, high, x) => {
    const t = Math.min(1, Math.max(0, (x - low) / (high - low)));
    return t * t * (3 - 2 * t);
};
const mix = (a, b, t) => a + (b - a) * t;
let elapsed = 0;
let running = false;
let paused = false;
let close = false;
let priorTime;
let priorClip;
let take = 0;
let frozen;
let update;
let resize;
const metrics = window.stackTest = { ready: false, frames: 0, renders: 0, finished: 0 };

window.stack = {
    fail(error) {
        metrics.error = String(error);
        state.textContent = metrics.error;
    },
    configure(name, step, onResize) {
        metrics.engine = name;
        update = step;
        resize = onResize ?? ((width, height) => {
            canvas.width = width;
            canvas.height = height;
        });
        resizeCanvas();
        run.disabled = pause.disabled = view.disabled = false;
        state.textContent = 'Ready';
        draw(performance.now());
    },
    rendered() {
        metrics.renders++;
        if (!metrics.ready && metrics.renders >= 2) {
            metrics.ready = true;
            metrics.readyMs = performance.now();
        }
    },
    // Sample the same clip and pose time in both engines for still comparisons.
    still(clip, seconds, wide, blink = 0, brow = 0, smile = 0) {
        frozen = { clip, seconds, wide, blink, brow, smile };
        priorClip = undefined;
    },
};

function resizeCanvas() {
    if (resize) resize(canvas.clientWidth, canvas.clientHeight);
}
new ResizeObserver(resizeCanvas).observe(canvas);

function start() {
    if (!metrics.ready || running) return;
    elapsed = 0;
    running = true;
    paused = false;
    pause.textContent = 'Pause';
    frozen = null;
    take++;
    metrics.inputs = (metrics.inputs || 0) + 1;
    state.textContent = 'Playing';
}

function togglePause() {
    if (!metrics.ready) return;
    paused = !paused;
    pause.textContent = paused ? 'Resume' : 'Pause';
    state.textContent = paused ? 'Paused' : running ? 'Playing' : 'Ready';
}

run.addEventListener('click', start);
pause.addEventListener('click', togglePause);
view.addEventListener('click', () => {
    close = !close;
    view.textContent = close ? 'Full figure' : 'Close-up';
});
document.addEventListener('keydown', event => {
    if (event.repeat || event.target.tagName === 'BUTTON') return;
    if (event.code === 'Space') {
        event.preventDefault();
        start();
    }
    if (event.code === 'KeyP') togglePause();
});

function draw(now) {
    const dt = priorTime === undefined ? 0 : Math.min((now - priorTime) / 1000, .1);
    priorTime = now;
    if (!paused && running) {
        elapsed += dt;
        if (elapsed >= 4.15) {
            elapsed = 4.15;
            running = false;
            metrics.finished++;
            state.textContent = 'Ready';
        }
    }
    if (loop && metrics.ready && !paused && !running) start();
    const t = elapsed;
    const progress = smooth(0, 1.76, t);
    const x = mix(-.60, .43, progress);
    const z = .45 * progress * progress;
    const yaw = mix(1.04, .06, smooth(.65, 1.8, t));
    const closeWeight = frozen ? +!frozen.wide
        : close ? 1 : smooth(1.62, 2.28, t) * (1 - smooth(3.56, 4.12, t));
    const clip = frozen?.clip ?? (t === 0 ? 'idle_relaxed' : t < 1.67 ? 'walk_forward'
        : t < 2.22 ? 'idle_relaxed' : t < 3.42 ? 'acknowledge' : 'idle_relaxed');
    const change = priorClip !== clip;
    const facial = smooth(2.2, 2.53, t) * (1 - smooth(3.22, 3.53, t));
    const blink = Math.max(0, 1 - Math.abs(t - 2.68) / .085);
    const wideFollow = 1 - smooth(.48, .80, canvas.clientWidth / canvas.clientHeight);
    const centerX = frozen ? 0 : mix(x * wideFollow, x, closeWeight);
    const centerZ = frozen ? 0 : z * closeWeight;
    update(change ? clip : '', paused, frozen?.seconds ?? -1,
        frozen ? 0 : x, frozen ? 0 : z, frozen ? .12 : yaw,
        centerX + mix(.70, .18, closeWeight), mix(1.29, 1.68, closeWeight),
        centerZ + mix(4.20, 1.14, closeWeight), centerX, mix(.93, 1.59, closeWeight), centerZ,
        frozen?.blink ?? blink, frozen?.brow ?? facial * .7, frozen?.smile ?? facial * .75);
    priorClip = clip;
    metrics.frames++;
    metrics.pose = { t, clip, x, z, yaw, paused, take, closeWeight };
    requestAnimationFrame(draw);
}
