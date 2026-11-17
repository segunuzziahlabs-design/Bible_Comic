import { type ElahBattleState } from '../gameplay/elah-battle';

const rate = 22050;
const durations = {
  wind: 3.2, ranks: 3.2, step: .18, armour: .32, whirl: .46, release: .18,
  spear: .3, miss: .16, impact: .37, landing: .62, retreat: .75,
} as const;
type Sound = keyof typeof durations;

function synthesize(context: AudioContext, sound: Sound) {
  const buffer = context.createBuffer(1, Math.ceil(rate * durations[sound]), rate);
  const data = buffer.getChannelData(0);
  let random = 129307;
  let low = 0;
  let middle = 0;
  for (let i = 0; i < data.length; i++) {
    const t = i / rate;
    const p = i / data.length;
    random = (Math.imul(1664525, random) + 1013904223) >>> 0;
    const noise = random / 2147483648 - 1;
    low += .024 * (noise - low);
    middle += .19 * (noise - middle);
    const ring = (hz: number) => Math.sin(2 * Math.PI * hz * t);
    const burst = Math.min(1, t / .009);
    const fade = Math.min(1, (1 - p) * 14);
    let sample: number;
    switch (sound) {
      case 'wind': sample = low * (.58 + .20 * ring(.625)) + middle * .035; break;
      case 'ranks': sample = low * (.30 + .20 * ring(2.5) + .10 * ring(3.75))
        + middle * (.045 + .037 * ring(5)); break;
      case 'step': sample = (middle * .58 + low * .42 + ring(78) * .09) * Math.exp(-p * 5.0); break;
      case 'armour': sample = (ring(457) * .19 + ring(811) * .115 + ring(1371) * .075 + middle * .23)
        * Math.exp(-p * 7.0); break;
      case 'whirl': sample = (noise - middle) * .43 * Math.sin(Math.PI * p) ** 2
        * (.38 + .29 * ring(6.4) + .25 * p); break;
      case 'release': sample = ((noise - middle) * .55 + ring(362) * .11) * Math.exp(-p * 7); break;
      case 'spear': sample = (middle * .75 + (noise - middle) * .20)
        * Math.sin(Math.PI * p) ** 2 * (1 - .45 * p); break;
      case 'miss': sample = (middle * .47 + ring(164) * .22 + ring(993) * .10) * Math.exp(-p * 9); break;
      case 'impact': sample = (ring(125) * .37 + ring(518) * .17 + ring(1019) * .09 + middle * .32)
        * Math.exp(-p * 6); break;
      case 'landing': sample = (ring(53) * .33 + low * .81 + middle * .27 + ring(281) * .07)
        * Math.exp(-p * 6.5); break;
      case 'retreat': sample = (middle * .36 + low * .53) * Math.sin(Math.PI * p) ** 2
        * (.55 + .26 * ring(7.0) + .16 * ring(12)); break;
    }
    data[i] = sample * burst * fade;
  }
  return buffer;
}

export function createElahSound() {
  let context: AudioContext | undefined;
  let master: GainNode | undefined;
  let crowd: GainNode | undefined;
  let muted = false;
  let paused = true;
  let disposed = false;
  const buffers = new Map<Sound, AudioBuffer>();
  const transient = new Set<AudioBufferSourceNode>();
  let previous: { phase: ElahBattleState['phase']; attack: ElahBattleState['attack']; time: number;
    launches: number; misses: number; hits: number; strikes: number; x: number; z: number } | undefined;
  let davidStride = 0;
  let foeStride = 0;
  let footsteps = 0;

  function source(sound: Sound, level: number, loop = false, speed = 1) {
    if (!context || !master) return;
    let buffer = buffers.get(sound);
    if (!buffer) {
      buffer = synthesize(context, sound);
      buffers.set(sound, buffer);
    }
    const player = context.createBufferSource();
    player.buffer = buffer;
    player.loop = loop;
    player.playbackRate.value = speed;
    const gain = context.createGain();
    gain.gain.value = level;
    player.connect(gain).connect(master);
    if (!loop) {
      transient.add(player);
      player.onended = () => {
        transient.delete(player);
        player.disconnect();
        gain.disconnect();
      };
    }
    player.start();
    return gain;
  }

  function sync() {
    if (!context || !master || disposed) return;
    master.gain.setTargetAtTime(muted ? 0 : .68, context.currentTime, .025);
    const change = paused ? context.suspend() : context.resume();
    void change.catch(() => { /* Captions remain available if the browser blocks audio. */ });
  }

  function start() {
    if (context || disposed) return;
    try {
      context = new AudioContext();
      master = context.createGain();
      master.gain.value = muted ? 0 : .68;
      master.connect(context.destination);
      source('wind', .59, true);
      crowd = source('ranks', .19, true);
    } catch {
      return;
    }
    sync();
  }

  function reset() {
    for (const sound of transient) sound.stop();
    transient.clear();
    previous = undefined;
    davidStride = foeStride = footsteps = 0;
    if (crowd && context) {
      crowd.gain.cancelScheduledValues(context.currentTime);
      crowd.gain.setTargetAtTime(.19, context.currentTime, .15);
    }
  }

  function step(state: ElahBattleState, dt: number, speed: number) {
    if (!context || !crowd) return;
    const { phase, attack, time, throws, misses, hits, strikes, throwTime, foe } = state;
    if (previous) {
      if (phase !== previous.phase) {
        const level = phase === 'challenge' ? .035 : phase === 'retreat' ? .30 : phase === 'victory' ? .09 : .15;
        crowd.gain.setTargetAtTime(level, context.currentTime, .22);
        if (phase === 'retreat') source('retreat', .43);
      }
      if (attack === 'windup' && previous.attack !== attack) source('armour', .60, false, .87);
      if (strikes > previous.strikes) source('spear', .78);
      if (throwTime !== undefined && throwTime < dt * 1.1) source('whirl', .60);
      if (throws > previous.launches) source('release', .83);
      if (misses > previous.misses) source('miss', .48);
      if (hits > previous.hits) source('impact', .88);
      if (phase === 'fall' && previous.phase === 'fall' && previous.time < 1.34 && time >= 1.34) source('landing', .84);
      if (phase === 'defeat' && previous.phase === 'defeat' && previous.time < .42 && time >= .42) source('landing', .56);
      foeStride += Math.hypot(foe.x - previous.x, foe.z - previous.z);
    }
    davidStride += speed * dt;
    if (davidStride >= .62) {
      davidStride -= .62;
      source('step', .58, false, footsteps++ % 2 ? 1.08 : .95);
    }
    if (foeStride >= .92) {
      foeStride -= .92;
      source('step', .84, false, .67);
      source('armour', .31, false, .91);
    }
    previous = { phase, attack, time, launches: throws, misses, hits, strikes, x: foe.x, z: foe.z };
  }

  return {
    start, reset, step,
    setPaused(value: boolean) { paused = value; sync(); },
    setMuted(value: boolean) { muted = value; sync(); },
    dispose() {
      reset();
      disposed = true;
      void context?.close().catch(() => {});
    },
  };
}
