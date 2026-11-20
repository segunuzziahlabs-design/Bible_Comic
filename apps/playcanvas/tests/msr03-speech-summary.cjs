const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {mouthEnvelope}=require('../src/world/scene-speech.ts');
const lines=require('../src/assets/saul-performance-dialogue/dialogue.json');
const root=path.resolve(process.argv[2]||'docs/quality-review/evidence/msr03-2026-11-20/final'),summaries=[];
for(const layout of ['desktop','portrait','landscape']){
 const source=layout==='desktop'&&process.argv[3]?path.resolve(process.argv[3]):path.join(root,layout);
 const result=JSON.parse(fs.readFileSync(path.join(source,'results.json'))),audit=JSON.parse(fs.readFileSync(path.join(source,'audit.json')));assert.equal(result.status,'PASS');
 const completed=audit.voices.filter(v=>v.cancelledAt===undefined);assert.equal(completed.length,3,'One complete set of lines after the cancelled attempt');assert.equal(audit.voices.filter(v=>v.cancelledAt!==undefined).length,3,'Restart cancels all earlier scheduled lines');
 const origin=completed.find(v=>v.id==='saul-concern').scheduled-result.score.concernStart;
 const lineResults=[];
 for(const line of lines){const voice=completed.find(v=>v.id===line.id);assert(voice.ended);assert.equal(voice.panner,null,'Audience dialogue cannot attenuate with camera distance');assert(!voice.path.includes('PannerNode'));
  const cue=result.score.timeline.find(c=>c.id===line.id);assert(Math.abs(voice.scheduled-origin-cue.start)<.001,'Schedule must use the recording-derived score');
  const frames=audit.frames.filter(f=>!f.paused&&f.voices.some(v=>v.id===line.id)),interior=frames.filter(f=>{const c=f.audio.find(c=>c.id===voice.context),t=c.time-voice.scheduled;return t>.1&&t<line.duration-.1;});assert(interior.length>10);
  for(const f of interior){assert(f.caption.includes(line.text),'Caption must match the actual playing buffer');for(const actor of f.actors){if(actor.name===line.speaker){assert(actor.mouth.every(w=>Number.isFinite(w)&&w>=0&&w<=.72001));}else assert(actor.mouth.every(w=>w<.001),'Only the current speaker opens their mouth');}}
  const samples=frames.map(f=>({local:f.audio.find(c=>c.id===voice.context).time-voice.scheduled,value:f.actors.find(a=>a.name===line.speaker).mouth[0]}));
  let best={lag:0,error:Infinity};for(let lag=-.15;lag<=.1501;lag+=.005){const error=samples.reduce((sum,s)=>sum+(s.value-.72*mouthEnvelope(line,s.local-lag)[0])**2,0)/samples.length;if(error<best.error)best={lag,error};}
  assert(Math.abs(best.lag)<=.1001,'Visible mouth envelope must align within the proposed 100 ms pilot target');
  const phrasePauses=line.phrases.filter(p=>p.pauseAfter>.15).flatMap(p=>samples.filter(s=>s.local>=p.end+.15&&s.local<p.end+p.pauseAfter));assert(phrasePauses.every(s=>s.value<.015),'Sustained sentence pauses close the mouth within 150 ms');
  const voiced=frames.filter(f=>!f.muted);assert(voiced.some(f=>f.audio.find(c=>c.id===voice.context).rms>.005),'Actual browser output is nonzero during each line');
  lineResults.push({id:line.id,duration:line.duration,observedFrames:frames.length,bestEnvelopeLagMs:+(best.lag*1000).toFixed(1),envelopeRmsError:+Math.sqrt(best.error).toFixed(4),pauseSamples:phrasePauses.length});
 }
 const speechFrames=audit.frames.filter(f=>f.mode==='audience'&&!f.paused);let reversals=0,guardResets=0;
 for(let i=1;i<speechFrames.length;i++){const a=speechFrames[i-1],b=speechFrames[i];if(a.speaker==='David'&&b.speaker==='David'&&a.actors[0].clip==='speak_resolve'&&b.actors[0].clip==='speak_resolve'&&b.actors[0].clipTime<a.actors[0].clipTime-.01)reversals++;if(a.actors[2].clip==='acknowledge'&&b.actors[2].clip==='acknowledge'&&b.actors[2].clipTime<a.actors[2].clipTime-.2)guardResets++;}
 assert.equal(reversals,0);assert.equal(guardResets,0);
 const quiet=audit.frames.filter(f=>f.mode==='audience'&&!f.paused&&f.voices.length===0);assert(quiet.length>10);assert(quiet.every(f=>f.actors.every(a=>a.mouth.every(w=>w<.001))));
 const muted=audit.frames.filter(f=>f.muted&&f.audio.every(c=>c.masters.every(g=>g===0)));assert(muted.length>=2);assert(muted.slice(1).every(f=>f.audio.every(c=>c.rms<.001)),'Mute must silence the actual output bus, not just a UI flag');
 summaries.push({layout,status:'PASS',lineResults,scheduledVoices:audit.voices.length,cancelledVoices:3,completedVoices:3,davidReverseSteps:reversals,guardResets,mutedSamples:muted.length,tabReturn:result.tabReturn});
}
const report={basis:'Actual decoded Web Audio sources and rendered mouth weights at normal clocks. Envelope lag uses the best fit to final PCM-derived 30 Hz cues; it is not phoneme alignment, output-device latency or a judgement of intonation. Only a native suspended audio clock plus trusted lifecycle event establishes tab pause.',summaries};
fs.writeFileSync(path.join(root,'speech-summary.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
