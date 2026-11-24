import './account-game-bootstrap';
import { Vec3, type RenderComponent } from 'playcanvas';
import { createMovementInput } from '../gameplay/movement-input';
import { approachVelocity, firstWallHit, slideAlongWalls } from '../gameplay/ground-motion';
import { loadConversationActor } from '../world/conversation-actor';
import {createAudiencePerformance,reactionNod} from '../world/audience-performance';
import { createWebGLApp, observeCanvas, waitForFrame } from '../world/graphics';
import { buildSaulPavilion } from '../world/saul-pavilion';
import { dialogue, loadSaulAudio, mouthAt } from '../world/saul-audio';
import { loadSavedAppearance, skinTones, hairColours, hairStyles, tunicColours } from '../world/david-appearance';
import davidUrl from '../assets/david-dialogue.glb?url';
import saulUrl from '../assets/saul.glb?url';
import { currentObjective } from '../gameplay/episode-rules';
import type { CueToken } from '../gameplay/episode-session';
import { episodeLink, openEpisodeRoute } from './episode-route';
import './saul.css';

const canvas = document.querySelector<HTMLCanvasElement>('#stage')!;
const stage = canvas.parentElement!;
const byId = (id: string) => document.getElementById(id)!;
const button = (id: string) => byId(id) as HTMLButtonElement;
const enter = button('enter'), pause = button('pause'), reset = button('reset'), sound = button('sound');
const speak = button('speak'), caption = byId('caption'), objective = byId('objective');
const input = createMovementInput(canvas, byId('move-pad'));
const inspect = new URLSearchParams(location.search).has('inspect');
const duration = 40;
const startPosition = { x: -.65, z: 2.8 };
const mark = { x: -.65, z: .65 };
const saulAt = { x: .7, z: -1.2 };
const smooth = (value: number) => { const t = Math.max(0, Math.min(1, value)); return t * t * (3 - 2 * t); };
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const yawTo = (x: number, z: number) => Math.atan2(x, z) * 180 / Math.PI;

async function main() {
  const loadedRoute = await openEpisodeRoute('saul', () => { void setPaused(true); });
  if (loadedRoute === 'redirect') return;
  const route = loadedRoute;
  const app = await createWebGLApp(canvas, true);
  const { camera, walls } = buildSaulPavilion(app);
  const audio = await loadSaulAudio();
  const david = await loadConversationActor(app, davidUrl, 'David');
  const saul = await loadConversationActor(app, saulUrl, 'Saul');
  const soldiers = await Promise.all([0, 1].map(i => loadConversationActor(app, saulUrl, `Soldier ${i + 1}`)));
  const appearance = loadSavedAppearance();
  david.tint('Skin', skinTones[appearance.skin].tint);
  david.tint('Cloth', tunicColours[appearance.tunic].tint);
  david.tint('Hair', hairColours[appearance.hairColour].tint);
  david.tint('Brows', hairColours[appearance.hairColour].tint);
  david.morph('FullerHair', hairStyles[appearance.hairStyle].fullness);
  saul.tint('Skin', [.9, .9, .85]); saul.tint('Cloth', [2.1, .40, .32]);
  saul.tint('Hair', [.65, .65, .65]); saul.tint('Brows', [.65, .65, .65]);
  saul.tint('Eyes', [1, 1, 1]);
  saul.model.setPosition(saulAt.x, 0, saulAt.z);
  saul.model.setEulerAngles(0, yawTo(mark.x - saulAt.x, mark.z - saulAt.z), 0);
  soldiers.forEach((soldier, i) => {
    soldier.model.setPosition(i ? 2.85 : -2.8, 0, -2.7);
    soldier.model.setLocalScale(i ? .94 : .90, i ? .94 : .90, i ? .94 : .90);
    soldier.model.setEulerAngles(0, i ? -25 : 25, 0);
    soldier.tint('Skin', i ? [.78, .78, .74] : [1, 1, .96]);
    soldier.tint('Cloth', i ? [1.4, .85, .48] : [.95, 1.05, .67]);
    soldier.tint('Hair', [.75, .75, .75]); soldier.tint('Eyes', [1, 1, 1]);
    for (const render of soldier.model.findComponents('render') as RenderComponent[]) {
      if (/Saul beard|Saul moustache|Saul circlet|mantle|Mantle clasp|Speaking mouth|Lip edge|Upper teeth/i.test(render.entity.name)) render.enabled = false;
      render.castShadows = false;
    }
  });
  let position = { ...startPosition }, velocity = { x: 0, z: 0 };
  let heading = 180, yaw = 0, walkTime = 0, idleTime = 0;
  let entered = false, paused = true, muted = false, cue = false, finished = false;
  let cueCount = 0, completionCount = 0, cueFrom = { ...position }, lastCueTime = 0;
  let shotName = 'follow', lastShot = '';
  let captionKey = '';
  let currentSpeaker = '', mouth = [0, 0];
  const eye = new Vec3(), target = new Vec3();
  const cameraEye = new Vec3(), cameraTarget = new Vec3();
  let cameraReady = false;
  let owner: CueToken | undefined;
  let equipment: { token: CueToken; start: number } | undefined;
  const episodeGoal = () => route && currentObjective(route.session.run)?.id;

  function canSpeak() {
    const delta = { x: saulAt.x - position.x, z: saulAt.z - position.z };
    return entered && !paused && !cue && !equipment && !route?.pending && (!route || episodeGoal() === 'saul.audience') && Math.hypot(delta.x, delta.z) <= 2.5 && !firstWallHit(position, delta, walls, 0);
  }
  function canUseArmour() {
    return !!route && !route.pending && entered && !paused && !cue && !equipment &&
      ['armour.inspected', 'armour.declined'].includes(episodeGoal() ?? '') && Math.hypot(position.x - 2.35, position.z - .05) <= 1.8;
  }
  function interactionPrompt() {
    speak.hidden = !(canSpeak() || canUseArmour());
    speak.textContent = canUseArmour() ? episodeGoal() === 'armour.inspected' ? 'Inspect Saul’s armour' : 'Set aside the armour' : finished ? 'Replay conversation' : 'Speak to Saul';
  }
  function controls() {
    input.setEnabled(entered && !paused && !cue && !equipment && !route?.pending);
    stage.toggleAttribute('data-moving', entered && !paused && !cue && !equipment && !route?.pending);
    stage.classList.toggle('cinematic', cue || !!equipment);
    byId('pause-notice').hidden = !entered || !paused;
    pause.textContent = paused ? 'Resume' : 'Pause';
    interactionPrompt();
  }
  function resetScene() {
    if (route?.pending) return;
    route?.session.cancelCue(); owner = undefined; equipment = undefined;
    audio.stop(); cue = finished = false; lastCueTime = 0; cueCount = completionCount = 0;
    position = { ...startPosition }; velocity = { x: 0, z: 0 }; heading = 180; yaw = 0;
    walkTime = idleTime = 0; cameraReady = false; caption.hidden = true; captionKey = '';
    objective.textContent = 'Speak to Saul';
    if (route && episodeGoal() !== 'saul.audience') {
      finished = true; position = { ...mark }; objective.textContent = episodeGoal() === 'armour.inspected' ? 'Inspect Saul’s armour' : 'Set aside the unfamiliar armour';
    }
    david.model.setPosition(position.x, 0, position.z); david.model.setEulerAngles(0, heading, 0);
    for (const actor of [david, saul, ...soldiers]) { actor.pose('idle_relaxed', 0, 0); actor.face(0, 0, 0, 0, 0); }
    controls();
  }
  function interact() {
    if (canUseArmour() && route) {
      equipment = { token: route.session.beginCue(episodeGoal() as 'armour.inspected' | 'armour.declined'), start: audio.context.currentTime };
      controls(); return;
    }
    if (!canSpeak()) return;
    owner = route?.session.beginCue('saul.audience');
    cue = true; cueCount++; cueFrom = { ...position }; velocity = { x: 0, z: 0 };
    audio.begin(); lastCueTime = 0; controls();
  }
  async function setPaused(value: boolean) {
    if (!entered || paused === value) return;
    paused = value; controls();
    if (paused) await audio.pause(); else await audio.resume();
  }
  speak.addEventListener('click', interact);
  pause.addEventListener('click', () => { void setPaused(!paused); });
  reset.addEventListener('click', () => { resetScene(); });
  sound.addEventListener('click', () => { muted = !muted; audio.mute(muted); sound.textContent = muted ? 'Sound off' : 'Sound on'; });
  enter.addEventListener('click', async () => {
    enter.disabled = true;
    try {
      await audio.resume(); entered = true; paused = false; byId('entry').hidden = true;
      for (const item of [pause, reset, sound]) item.disabled = false;
      controls(); canvas.focus();
    } catch { enter.disabled = false; byId('entry-message').textContent = 'Select Enter camp again to enable sound.'; }
  });
  window.addEventListener('keydown', event => {
    if (event.repeat || event.altKey || event.ctrlKey || event.metaKey || !entered) return;
    if (event.code === 'KeyE') interact();
    if (event.code === 'Escape') { event.preventDefault(); void setPaused(!paused); }
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) void setPaused(true); });
  window.addEventListener('blur', () => { if (entered) void setPaused(true); });
  window.addEventListener('pagehide', () => { audio.dispose(); input.dispose(); app.destroy(); }, { once: true });

  function setCamera(at: number[], look: number[], fov: number, dt: number, cut = false) {
    eye.set(at[0], at[1], at[2]); target.set(look[0], look[1], look[2]);
    // Widen the lens in portrait without moving through a listener or tent wall.
    const portrait = canvas.clientHeight > canvas.clientWidth;
    if (!cameraReady || cut) { cameraEye.copy(eye); cameraTarget.copy(target); cameraReady = true; }
    else { const blend = 1 - Math.exp(-5 * dt); cameraEye.lerp(cameraEye, eye, blend); cameraTarget.lerp(cameraTarget, target, blend); }
    camera.setPosition(cameraEye); camera.lookAt(cameraTarget); camera.camera!.fov = portrait ? fov * 1.45 : fov;
  }
  function follow(dt: number, cut = false) {
    shotName = 'follow';
    setCamera([position.x + Math.sin(yaw) * 3.9, 2.25, position.z + Math.cos(yaw) * 3.9],
      [position.x, 1.08, position.z - .15], 48, dt, cut);
  }
  function shots(t: number, dt: number) {
    let at: number[], look: number[], fov = 43;
    if (t < 5) { shotName = 'camp-wide'; at = [4.8 - t * .04, 2.6, 5.7]; look = [.1, 1.15, -.5]; }
    else if (t < 9) { shotName = 'two-shot'; at = [2.9, 1.82, 2.8 - (t - 5) * .035]; look = [.05, 1.45, -.3]; }
    else if (t < 14) { shotName = 'saul-concern'; at = [-.95, 1.94, .25]; look = [.64, 1.82, -1.17]; fov = 33; }
    else if (t < 24) { shotName = 'david-resolve'; at = [.55, 1.61, -.60 + (t - 14) * .007]; look = [-.61, 1.44, .63]; fov = 38; }
    else if (t < 27) { shotName = 'soldier-reaction'; at = [-.6, 1.79, .05]; look = [-2.8, 1.60, -2.7]; fov = 35; }
    else if (t < 30) { shotName = 'saul-listens'; at = [-.95, 1.94, .25]; look = [.64, 1.82, -1.17]; fov = 33; }
    else if (t < 35.5) { shotName = 'saul-blessing'; at = [2.9, 1.82, 2.45]; look = [.05, 1.45, -.3]; }
    else { follow(dt); return; }
    setCamera(at, look, fov, dt, shotName !== lastShot); lastShot = shotName;
  }
  function captionAt(t: number) {
    const line = dialogue.find(line => t >= line.start && t < line.start + line.duration + .65);
    const key = line?.id ?? '';
    if (key !== captionKey) {
      captionKey = key; caption.replaceChildren(); caption.hidden = !line;
      if (line) { const speaker = document.createElement('strong'); speaker.textContent = line.speaker; caption.append(speaker, document.createTextNode(line.text)); }
    }
  }
  const performances=[david,saul,...soldiers].map(createAudiencePerformance);
  function act(t: number, dt: number) {
    const travel = Math.hypot(cueFrom.x - mark.x, cueFrom.z - mark.z);
    const travelTime = Math.max(.25, travel / .8);
    const progress = smooth(t / travelTime);
    position = { x: mix(cueFrom.x, mark.x, progress), z: mix(cueFrom.z, mark.z, progress) };
    const walking = t < travelTime && travel > .05;
    const travelPhase = Math.max(0, Math.min(1, t / travelTime));
    if (walking) walkTime += dt * (travel / travelTime) * 6 * travelPhase * (1 - travelPhase) / .93;
    const responding = t >= 15 && t < 23;
    const acknowledging = t >= 33 && t < 35.5;
    const dClip = walking ? 'walk_forward' : responding ? 'speak_resolve' : acknowledging ? 'acknowledge' : 'listen';
    const sClip = t >= 9 && t < 13 ? 'speak_concern' : t >= 30 && t < 33.5 ? 'acknowledge' : 'listen';
    const clipTime = (actor: typeof david, clip: string, time: number) => time % actor.tracks.get(clip)!.duration;
    david.pose(dClip, clipTime(david, dClip, walking ? walkTime : responding ? t - 15 : acknowledging ? t - 33 : t), dt);
    saul.pose(sClip, clipTime(saul, sClip, sClip === 'speak_concern' ? t - 9 : sClip === 'acknowledge' ? t - 30 : t), dt);
    david.model.setPosition(position.x, 0, position.z);
    heading = yawTo(saulAt.x - position.x, saulAt.z - position.z);
    david.model.setEulerAngles(0, heading, 0);
    currentSpeaker = ''; mouth = [0, 0];
    const speaking = dialogue.find(line => t >= line.start && t < line.start + line.duration);
    if (speaking) { currentSpeaker = speaking.speaker; mouth = mouthAt(speaking, t); }
    const blink = (offset: number) => Math.max(0, 1 - Math.abs(((t + offset) % 4.7) - .1) / .10);
    david.face(currentSpeaker === 'David' ? mouth[0] : 0, currentSpeaker === 'David' ? mouth[1] : 0, t > 31 ? .25 : .05, responding ? .32 : .15, blink(1.6));
    saul.face(currentSpeaker === 'Saul' ? mouth[0] : 0, currentSpeaker === 'Saul' ? mouth[1] : 0, t > 30 ? .25 : 0, t < 14 ? .4 : .12, blink(0));
    soldiers.forEach((soldier, i) => {
      const reacts = t > 24 + i * .6 && t < 27 + i * .6;
      const clip = reacts ? 'acknowledge' : 'idle_relaxed';
      soldier.pose(clip, clipTime(soldier, clip, reacts ? t - 24 - i * .6 : t + i * .8), dt);
      soldier.face(0, 0, t > 30 ? .15 : 0, .1, blink(i * 1.9));
    });
    performances[0].apply(t,currentSpeaker==='David',currentSpeaker==='Saul'?reactionNod(t,10.5,1.2,1.8):0,1.6,saul.model.findByName('Head')!,'determination');
    performances[1].apply(t,currentSpeaker==='Saul',currentSpeaker==='David'?reactionNod(t,18,1.2,1.8):0,0,david.model.findByName('Head')!,t<15?'sadness':'confidence');
    soldiers.forEach((s,i)=>performances[i+2].apply(t,false,0,i+2,david.model.findByName('Head')!,t<24?'fear':'happiness'));
    captionAt(t); shots(t, dt);
  }

  app.on('update', rawDt => {
    const dt = Math.min(rawDt, .05);
    if (!paused && !route?.pending) {
      performances.forEach(p=>p.restore());
      idleTime += dt;
      if (equipment && route) {
        const time = audio.context.currentTime - equipment.start;
        const inspecting = equipment.token.objective === 'armour.inspected';
        const clip = inspecting ? 'acknowledge' : 'listen';
        david.pose(clip, Math.min(time, david.tracks.get(clip)!.duration), dt);
        heading = yawTo(2.35 - position.x, .05 - position.z); david.model.setEulerAngles(0, heading, 0);
        setCamera([position.x - 1.4, 1.85, position.z + 2.0], [(position.x + 2.35) / 2, 1.25, (position.z + .05) / 2], 46, dt);
        caption.textContent = inspecting ? 'Saul offers his armour. David examines the unfamiliar equipment.' : 'David sets the armour aside. He will take his shepherd’s sling and choose stones from the brook.';
        caption.hidden = false;
        if (time >= 3.0) {
          const token = equipment.token;
          void route.save(() => route.session.finishCue(token), () => {
            equipment = undefined; caption.hidden = true;
            if (!inspecting) location.assign(episodeLink('episode.html'));
            else { objective.textContent = 'Set aside the unfamiliar armour'; controls(); }
          });
        }
      } else if (cue) {
        const time = Math.min(duration, audio.time());
        act(time, Math.min(.05, Math.max(0, time - lastCueTime))); lastCueTime = time;
        if (time >= duration) {
          cue = false; finished = true; completionCount++;
          objective.textContent = 'Inspect Saul’s armour'; caption.hidden = true; captionKey = '';
          for (const actor of [david, saul]) actor.face(0, 0, .15, .1, 0);
          if (route && owner) {
            const token = owner; owner = undefined;
            void route.save(() => route.session.finishCue(token), () => controls());
          }
          controls();
        }
      } else {
        const move = input.read(); yaw -= move.lookX * .004;
        const desired = { x: (move.x * Math.cos(yaw) - move.forward * Math.sin(yaw)) * 1.35,
          z: (-move.x * Math.sin(yaw) - move.forward * Math.cos(yaw)) * 1.35 };
        velocity = approachVelocity(velocity, desired, (move.x || move.forward ? 5 : 7) * dt);
        const next = slideAlongWalls(position, { x: velocity.x * dt, z: velocity.z * dt }, walls);
        const speed = dt ? Math.hypot(next.x - position.x, next.z - position.z) / dt : 0;
        position = next;
        if (speed > .03) {
          const targetHeading = yawTo(velocity.x, velocity.z);
          const change = ((targetHeading - heading + 540) % 360) - 180;
          heading += change * (1 - Math.exp(-12 * dt)); walkTime += dt * speed / .93;
        }
        david.model.setPosition(position.x, 0, position.z); david.model.setEulerAngles(0, heading, 0);
        const clip = speed > .06 ? 'walk_forward' : 'idle_relaxed';
        david.pose(clip, (speed > .06 ? walkTime : idleTime) % david.tracks.get(clip)!.duration, dt);
        for (const actor of [saul, ...soldiers]) actor.pose('idle_relaxed', idleTime % actor.tracks.get('idle_relaxed')!.duration, dt);
        follow(dt); interactionPrompt();
      }
    }
    if (inspect) canvas.dataset.cinematic = JSON.stringify({ entered, paused, muted, cue, finished, time: lastCueTime,
      shot: shotName, speaker: currentSpeaker, mouth, position, canSpeak: canSpeak(), cueCount, completionCount,
      audio: audio.context.state, tracks: [...david.tracks.keys()],
      davidMouth: david.mouthWeights(), saulMouth: saul.mouthWeights(), frameMs: app.stats.frame.ms,
      episode: route?.session.run, equipment: equipment?.token.objective, pending: route?.pending });
  });
  resetScene(); follow(0, true); observeCanvas(app, canvas); await waitForFrame(app);
  byId('entry-message').textContent = 'Approach Saul and speak once. Watch the exchange, then continue as David.';
  enter.hidden = false;
}

void main().catch(error => {
  console.error(error); byId('entry-message').textContent = 'The camp could not load. Check WebGL 2 support and try again.';
  button('retry').hidden = false;
});
button('retry').addEventListener('click', () => location.reload());
