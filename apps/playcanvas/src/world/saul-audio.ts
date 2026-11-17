import lines from '../assets/saul-dialogue/dialogue.json';
import concern from '../assets/saul-dialogue/saul-concern.wav?url';
import answer from '../assets/saul-dialogue/david-answer.wav?url';
import blessing from '../assets/saul-dialogue/saul-blessing.wav?url';

export const dialogue = lines.map((line, i) => ({ ...line, start: [9, 15, 30][i] }));

export function mouthAt(line: typeof dialogue[number], time: number) {
  const local = time - line.start;
  if (local < 0 || local >= line.duration) return [0, 0];
  const cues = line.mouthCues;
  const frame = Math.min(cues.length - 2, Math.floor(local * 30));
  const a = cues[frame], b = cues[frame + 1];
  const mix = Math.max(0, Math.min(1, (local - a[0]) / Math.max(.001, b[0] - a[0])));
  return [a[1] + (b[1] - a[1]) * mix, a[2] + (b[2] - a[2]) * mix];
}

export async function loadSaulAudio() {
  const context = new AudioContext();
  await context.suspend();
  const master = context.createGain(); master.gain.value = .8; master.connect(context.destination);
  const buffers = await Promise.all([concern, answer, blessing].map(async url => {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Voice recording unavailable');
    return context.decodeAudioData(await response.arrayBuffer());
  })).catch(error => { void context.close(); throw error; });
  let sources: AudioBufferSourceNode[] = [];
  let start = 0;
  const ambience = context.createBuffer(1, context.sampleRate * 4, context.sampleRate);
  const data = ambience.getChannelData(0);
  // Original quiet wind bed. No external sound recordings or music licences.
  let low = 0;
  for (let i = 0; i < data.length; i++) {
    low = .98 * low + .02 * (Math.random() * 2 - 1);
    data[i] = low * .17 * (.7 + .3 * Math.sin(i / context.sampleRate * Math.PI / 2));
  }
  const wind = context.createBufferSource(); wind.buffer = ambience; wind.loop = true;
  wind.connect(master); wind.start();
  function stop() { for (const node of sources) { try { node.stop(); } catch { /* Already stopped. */ } node.disconnect(); } sources = []; }
  return {
    context,
    async resume() { await context.resume(); },
    async pause() { await context.suspend(); },
    mute(value: boolean) { master.gain.setValueAtTime(value ? 0 : .8, context.currentTime); },
    begin() {
      stop(); start = context.currentTime;
      buffers.forEach((buffer, index) => {
        const source = context.createBufferSource(); source.buffer = buffer;
        source.connect(master); source.start(start + dialogue[index].start); sources.push(source);
      });
    },
    time() { return context.currentTime - start; },
    stop,
    dispose() { stop(); wind.stop(); void context.close(); },
  };
}
