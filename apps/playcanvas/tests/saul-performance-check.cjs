const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {createAudienceScore,audienceReaction}=require('../src/gameplay/saul-audience-score.ts');
const {mouthEnvelope}=require('../src/world/scene-speech.ts');
const {createSpeechFaceMotion}=require('../src/gameplay/speech-face-motion.ts');
const lines=require('../src/assets/saul-performance-dialogue/dialogue.json'),original=require('../src/assets/saul-dialogue/dialogue.json');
const score=createAudienceScore(lines),words=t=>t.toLowerCase().match(/[a-z]+(?:'[a-z]+)?/g);
assert(score.duration>=30&&score.duration<=45);
for(const [i,cue]of score.timeline.entries()){
 const l=lines.find(l=>l.id===cue.id),previous=i?score.timeline[i-1]:null;
 if(previous)assert(previous.start+lines.find(l=>l.id===previous.id).duration<cue.start,'Thoughts need a gap; voices cannot overlap');
 assert(score.duration>cue.start+l.duration+1.5,'Return control only after the complete final word and reaction');
 const file=path.join(__dirname,'../src/assets/saul-performance-dialogue',l.id+'.wav'),b=fs.readFileSync(file);let format,data;
 for(let at=12;at+8<=b.length;){const n=b.readUInt32LE(at+4);if(b.toString('ascii',at,at+4)==='fmt ')format={channels:b.readUInt16LE(at+10),rate:b.readUInt32LE(at+12),bytes:b.readUInt32LE(at+16),bits:b.readUInt16LE(at+22)};if(b.toString('ascii',at,at+4)==='data')data={at:at+8,size:n};at+=8+n+n%2;}
 assert.equal(format.channels,1);assert.equal(format.rate,24000);assert.equal(format.bits,16);assert(Math.abs(data.size/format.bytes-l.duration)<1e-8);
 assert.equal(crypto.createHash('sha256').update(b).digest('hex'),l.sha256,'Provenance must match the actual recording');
 assert.equal(l.voice,original.find(v=>v.id===l.id).voice,'Retain the cast');assert.deepEqual(words(l.text),words(l.phrases.map(p=>p.text).join(' ')),'Intonation cannot rewrite the biblical paraphrase');
 for(let j=0;j<l.mouthCues.length;j++){const c=l.mouthCues[j];assert(c.every(Number.isFinite));assert(c[1]>=0&&c[1]<=1&&c[2]>=0&&c[2]<=1);if(j)assert(c[0]>l.mouthCues[j-1][0]);}
 assert.deepEqual(mouthEnvelope(l,l.duration),[0,0]);assert.deepEqual(mouthEnvelope(l,-.1),[0,0]);
 for(const p of l.phrases.filter(p=>p.pauseAfter>.15)){const at=p.end+p.pauseAfter/2;assert(mouthEnvelope(l,at)[0]<.01,'Authored pause must close the mouth');}
}
assert.equal(score.guardEnd-score.guardStart,1.5,'One complete guard reaction, not a repeated modulo loop');
assert(score.acknowledgeStart>score.blessingEnd,'David acknowledges the blessing after it is spoken');
assert(audienceReaction(score.answerStart,score).saulBrow>audienceReaction(score.answerEnd,score).saulBrow,'Saul becomes less doubtful during the answer');
for(let t=0;t<score.duration;t+=1/60)assert(Object.values(audienceReaction(t,score)).every(Number.isFinite));
assert.throws(()=>createAudienceScore([]),/recording/);
for(const fps of [20,30,60,120]){
 const face=createSpeechFaceMotion();face.reset(0);let clock=0,weights;
 for(let i=0;i<fps;i++){clock+=1/fps;weights=face.step([1,1],clock);}
 assert(weights[0]>.7&&weights[0]<=.72&&weights[1]<=.8,'Close-ups use restrained finite mouth weights');
 assert.deepEqual(face.step([0,0],clock),weights,'Suspended audio must freeze the face filter');
 for(let i=0;i<Math.ceil(fps*.15);i++){clock+=1/fps;weights=face.step([0,0],clock);}
 assert(weights.every(w=>w<.01),'The mouth must close within 150 ms of sustained silence');
 face.reset(clock);assert.deepEqual(face.step([0,0],clock),[0,0],'Restart clears the old mouth');
}
console.log('PASS recording hashes/durations/cast/words, ordered complete voice cues, authored silence closure, finite reactions and 30–45 s audience.');
