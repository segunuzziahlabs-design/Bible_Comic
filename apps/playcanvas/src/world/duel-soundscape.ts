import cheerDavid from '../assets/victory-dialogue/cheer-david.wav?url';
import cheerIsrael from '../assets/victory-dialogue/cheer-israel.wav?url';
import { duelRankFrontX } from '../gameplay/duel-field';
import type { ElahBattleState } from '../gameplay/elah-battle';

type Army = 'israel' | 'philistines';
const sampleRate = 22050;
const tau = 2 * Math.PI;

/** Original drum and plucked-string figure. The source loops on the chapter audio clock. */
function makeScore(context: AudioContext) {
  const buffer = context.createBuffer(1, sampleRate * 12, sampleRate);
  const data = buffer.getChannelData(0);
  function note(at: number, duration: number, wave: (t: number) => number) {
    const start = Math.round(at * sampleRate);
    for (let i = 0; i < duration * sampleRate; i++) {
      const t = i / sampleRate;
      const envelope = Math.min(1, t / .012, (duration - t) / .04);
      data[(start + i) % data.length] += wave(t) * envelope;
    }
  }
  for (const at of [.05, 1.55, 3.05, 4.17, 6.05, 7.55, 9.05, 10.17]) {
    note(at, .46, t => .55 * Math.sin(tau * (49 * t + 1.5 * (1 - Math.exp(-18 * t)))) * Math.exp(-10 * t));
  }
  const pitches = [146.83, 220, 174.61, 196, 146.83, 130.81, 174.61, 110];
  pitches.forEach((pitch, index) => note(.42 + index * 1.5, 1.75, t => {
    const string = Math.sin(tau * pitch * t) + .35 * Math.sin(tau * pitch * 2 * t) + .12 * Math.sin(tau * pitch * 3 * t);
    return .23 * string * Math.exp(-t * 3.2);
  }));
  return buffer;
}

/** Staggered open-vowel calls without words, reinforced by the existing Israel voice clips. */
function makeRoar(context: AudioContext, pitch: number) {
  const length = 2.35;
  const buffer = context.createBuffer(1, Math.round(sampleRate * length), sampleRate);
  const data = buffer.getChannelData(0);
  for (let voice = 0; voice < 11; voice++) {
    const start = Math.round((voice * .064 + (voice % 3) * .08) * sampleRate);
    const duration = .67 + (voice % 5) * .18;
    const base = pitch + (voice % 7) * 9;
    let phase = voice * 1.7, seed = 177 + voice * 31, breath = 0;
    for (let i = 0; i < duration * sampleRate && start + i < data.length; i++) {
      const t = i / sampleRate, u = t / duration;
      phase += tau * (base + 23 * Math.sin(Math.PI * u) - 14 * u + 4 * Math.sin(t * 32 + voice)) / sampleRate;
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      breath += .17 * (seed / 2147483648 - 1 - breath);
      const vowel = .19 * Math.sin(phase * 2) + .45 * Math.sin(phase * 4) + .31 * Math.sin(phase * 5) + .14 * Math.sin(phase * 7);
      const envelope = Math.sin(Math.PI * u) ** 1.7;
      data[start + i] += (vowel * .12 + breath * .08) * envelope;
    }
  }
  return buffer;
}

export async function createDuelSoundscape(context: AudioContext, ground: (x: number, z: number) => number) {
  const master = context.createGain();
  const music = context.createGain();
  const crowd = context.createGain();
  const limiter = context.createDynamicsCompressor();
  master.gain.value = .82;
  music.gain.value = crowd.gain.value = 0;
  music.connect(master); crowd.connect(master); master.connect(limiter).connect(context.destination);

  const ranks: Record<Army, PannerNode> = {
    israel: panner(-duelRankFrontX, -13),
    philistines: panner(duelRankFrontX, -15),
  };
  function panner(x: number, z: number) {
    const pan = context.createPanner();
    pan.panningModel = 'equalpower';
    pan.refDistance = 16;
    pan.rolloffFactor = .8;
    pan.positionX.value = x; pan.positionY.value = ground(x,z) + 1.6; pan.positionZ.value = z;
    pan.connect(crowd);
    return pan;
  }

  // The existing licensed voice assets are optional reinforcement for the synthesized crowd.
  async function chant(url: string) {
    try {
      const response = await fetch(url);
      return response.ok ? await context.decodeAudioData(await response.arrayBuffer()) : undefined;
    } catch { return undefined; }
  }
  const chants = await Promise.all([chant(cheerDavid),chant(cheerIsrael)]);
  const roars = { israel: makeRoar(context, 118), philistines: makeRoar(context, 94) };
  const score = makeScore(context);
  const active = new Set<AudioBufferSourceNode>();
  let playingScore = false, elapsed = 0, lastCheer = -Infinity, reactions = 0;
  let side: Army | undefined, last: Pick<ElahBattleState, 'phase' | 'attack' | 'dodges' | 'combatStage'> | undefined;
  let scoreLevel = 0, crowdLevel = 0;

  function play(buffer: AudioBuffer, into: AudioNode, volume: number, rate = 1, delay = 0, loop = false) {
    const source = context.createBufferSource(), gain = context.createGain();
    source.buffer = buffer; source.loop = loop; source.playbackRate.value = rate; gain.gain.value = volume;
    source.connect(gain).connect(into);
    active.add(source);
    source.onended = () => { active.delete(source); source.disconnect(); gain.disconnect(); };
    source.start(context.currentTime + delay);
  }

  function react(army: Army, decisive = false) {
    lastCheer = elapsed; side = army; reactions++;
    play(roars[army], ranks[army], decisive ? 1 : .82, .94 + (reactions % 4) * .045);
    const call = army === 'israel' && chants[reactions % chants.length];
    if (call) play(call, ranks[army], .68, .95 + (reactions % 3) * .05, .17);
  }

  function setMix(nextScore: number, nextCrowd: number) {
    if (scoreLevel !== nextScore) music.gain.setTargetAtTime(nextScore, context.currentTime, .12);
    if (crowdLevel !== nextCrowd) crowd.gain.setTargetAtTime(nextCrowd, context.currentTime, .08);
    scoreLevel = nextScore; crowdLevel = nextCrowd;
  }

  function reset() {
    for (const source of active) source.stop();
    active.clear();
    playingScore = false; elapsed = 0; lastCheer = -Infinity; side = last = undefined; reactions = 0;
    setMix(0, 0);
  }

  return {
    step(state: ElahBattleState, speaking: boolean, dt: number) {
      elapsed += dt;
      const {phase, attack, dodges, combatStage} = state;
      if (!playingScore) { play(score, music, 1, 1, 0, true); playingScore = true; }
      const threat = phase === 'fight' && (attack === 'windup' || attack === 'strike');
      const quiet = ['finisher','stagger','fall','defeat','victory'].includes(phase);
      const aftermath = ['retrieve','finish_approach','finish_ready','execution'].includes(phase);
      setMix(quiet ? 0 : speaking ? .037 : threat ? .062 : phase === 'fight' ? .24 : .11,
        quiet ? 0 : speaking ? .14 : threat ? .28 : .88);
      if (phase === 'fight' && elapsed - lastCheer > 2.45) {
        if (last && dodges > last.dodges) react('israel');
        else if ((combatStage==='sword' && attack==='draw' && last?.attack!=='draw')
          || (combatStage==='spear' && last?.combatStage==='sword')) react('philistines');
      }
      if (aftermath && phase === 'retrieve' && last?.phase !== phase) react('israel', true);
      last = {phase,attack,dodges,combatStage};
      const strength = quiet ? 0 : Math.max(0, 1 - (elapsed - lastCheer) / 2.35);
      return { israel: side === 'israel' ? strength : 0, philistines: side === 'philistines' ? strength : 0 };
    },
    mute(value: boolean) { master.gain.setTargetAtTime(value ? 0 : .82, context.currentTime, .025); },
    reset,
    sample: () => ({playingScore,side,reactions,scoreLevel,crowdLevel,output:master.gain.value,activeSources:active.size}),
    dispose() { reset(); Object.values(ranks).forEach(node => node.disconnect()); master.disconnect(); limiter.disconnect(); },
  };
}
