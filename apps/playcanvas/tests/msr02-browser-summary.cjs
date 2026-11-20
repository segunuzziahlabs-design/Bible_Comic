const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(process.argv[2]||'docs/quality-review/evidence/msr02-2026-11-20/candidate');
const lines=JSON.parse(fs.readFileSync(path.join(__dirname,'../src/assets/camp-dialogue/dialogue.json')));
function heldSeconds(frames,name){let previous,hold=0,longest=0;for(const f of frames){const a=f.actors.find(a=>a.name===name);if(!a)continue;const rotations=['Head','spine_03','upperarm_r','lowerarm_r'].flatMap(n=>a.joints[n]?.slice(3)??[]);const gap=previous?(f.at-previous.at)/1000:0;const unchanged=previous&&rotations.every((v,i)=>Math.abs(v-previous.rotations[i])<1e-5);hold=unchanged&&gap<.25?hold+gap:0;longest=Math.max(longest,hold);previous={at:f.at,rotations};}return +longest.toFixed(3);}
const results=[];
function contactDiagnostic(frames){
 const moving=frames.filter(f=>f.label==='start-stop').filter((f,i,a)=>i&&Math.hypot(f.position.x-a[i-1].position.x,f.position.z-a[i-1].position.z)/((f.at-a[i-1].at)/1000)>.8);
 return ['foot_l','foot_r'].map(bone=>{
  const points=moving.map(f=>({at:f.at,p:f.actors.find(a=>a.name==='David').joints[bone]})),floor=Math.min(...points.map(v=>v.p[1])),parts=[];let part=[];
  for(const point of points){if(part.length&&point.at-part.at(-1).at>250){parts.push(part);part=[];}if(point.p[1]<floor+.015)part.push(point);else if(part.length){parts.push(part);part=[];}}if(part.length)parts.push(part);
  return {bone,windows:parts.filter(p=>p.length>=2&&p.at(-1).at-p[0].at>=60).map(p=>({seconds:+((p.at(-1).at-p[0].at)/1000).toFixed(3),maximumPlanarDisplacementMetres:+Math.max(...p.map(v=>Math.hypot(v.p[0]-p[0].p[0],v.p[2]-p[0].p[2]))).toFixed(4)}))};
 });
}
for(const layout of ['desktop','portrait','landscape']){
 const checks=JSON.parse(fs.readFileSync(path.join(root,layout+'-results.json')));assert.equal(checks.status,'PASS');
 const opening=JSON.parse(fs.readFileSync(path.join(root,layout+'-jesse-frames.json'))),camp=JSON.parse(fs.readFileSync(path.join(root,layout+'-camp-frames.json')));
 const instruction=opening.filter(f=>f.line==='jesse-provisions');
 const rows=[['jesse-provisions','Jesse, David’s father',instruction],['jesse-listener','David',instruction],...['directions-keeper','answer-eliab'].map(id=>{const line=lines.find(l=>l.id===id);return[id,line.speaker,camp.filter(f=>f.caption?.includes(line.text))];})].map(([line,actor,samples])=>{
   assert(samples.length>20,'Need actual sustained dialogue samples');const longestHold=heldSeconds(samples,actor);assert(longestHold<.5,`${layout} ${line}: long exact body hold remains`);
   return{line,actor,samples:samples.length,wallClockSpanIncludingPauseSeconds:+((samples.at(-1).at-samples[0].at)/1000).toFixed(3),longestSampledBodyHoldSeconds:longestHold,clips:[...new Set(samples.flatMap(f=>f.actors.filter(a=>a.name===actor).map(a=>a.clip)))]};
 });
 const turns=camp.filter(f=>f.label==='turns');let maximumTurnStep=0;
 // frameend timestamp spacing is not the update dt (GPU/capture duration varies).
 // Verify the actual per-update angle step instead of reporting a spurious rate.
 for(let i=1;i<turns.length;i++){const a=turns[i-1],b=turns[i];if(b.at-a.at>100)continue;maximumTurnStep=Math.max(maximumTurnStep,Math.abs(((b.heading-a.heading)%360+540)%360-180));}
 assert(maximumTurnStep<=21.001,'Body turn exceeds 420 degrees/s at the chapter maximum .05 s update');
 const moving=camp.filter(f=>['start-stop','turns'].includes(f.label));
 results.push({layout,status:checks.status,rows,maximumSampledBodyTurnDegreesPerUpdate:+maximumTurnStep.toFixed(3),maximumCarryingHandGapMetres:Math.max(...moving.map(f=>f.handGap??0)),flatCampContactDiagnostic:contactDiagnostic(camp)});
}
const summary={basis:'Actual unpaused Chrome frames; local bone quaternion component tolerance 0.00001, discontinuous sampling gaps over 250 ms excluded. Measures accidental exact holds, not subjective acting quality. Contact diagnostic uses steady straight travel above .8 m/s, ankle within 1.5 cm of its sampled minimum, windows at least 60 ms: a short flat-ground heuristic, not full sole/contact or terrain certification. Layouts use CDP touch emulation, not physical phones.',results};
fs.writeFileSync(path.join(root,'motion-summary.json'),JSON.stringify(summary,null,2));console.log(JSON.stringify(summary,null,2));
