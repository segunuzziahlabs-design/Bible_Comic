const fs=require('node:fs'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root='apps/playcanvas/src/assets',hash=b=>crypto.createHash('sha256').update(b).digest('hex'),files=[];
const lines=JSON.parse(fs.readFileSync(root+'/victory-dialogue/dialogue.json','utf8')),source=JSON.parse(fs.readFileSync('source-assets/audio/chapter-06-lines.json','utf8'));
const provenance=JSON.parse(fs.readFileSync('docs/assets/victory-voice-provenance.json','utf8')),prior=JSON.parse(fs.readFileSync('docs/assets/duel-voice-provenance.json','utf8'));
assert.equal(provenance.modelSha256,prior.modelSha256);assert.equal(provenance.voicesSha256,prior.voicesSha256);assert.equal(lines.length,7);
for(const line of lines){assert.equal(line.text,source.lines.find(l=>l.id===line.id).text);assert(line.mouthCues.some(c=>c[1]>.3));assert.equal(line.mouthCues.at(-1)[1],0);const file=root+'/victory-dialogue/'+line.id+'.wav',bytes=fs.readFileSync(file);assert.equal(hash(bytes),line.sha256);files.push({file,bytes:bytes.length,sha256:hash(bytes),duration:line.duration});}
function glb(name){const file=root+'/'+name,bytes=fs.readFileSync(file),json=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString());files.push({file,bytes:bytes.length,sha256:hash(bytes)});return json;}
const soldier=glb('victory-soldier.glb'),crowd=glb('victory-crowd.glb');
for(const name of ['retreat_run','victory_cheer','listen'])assert(soldier.animations.some(a=>a.name===name));assert(soldier.skins.length>0);assert(soldier.meshes.some(m=>m.extras?.targetNames?.includes('SpeakOpen')));
assert.equal(crowd.skins?.length??0,0);assert.equal(crowd.animations?.length??0,0);assert.equal(crowd.meshes.length,9);
const triangles={};for(const mesh of crowd.meshes){triangles[mesh.name]=mesh.primitives.reduce((n,p)=>n+crowd.accessors[p.indices].count/3,0);assert(triangles[mesh.name]<1900);assert(mesh.primitives.every(p=>p.attributes.COLOR_0!==undefined));}
for(const name of ['Run 0','Run 5','Cheer 0','Cheer 2'])assert(triangles[name]>1000);
fs.writeFileSync('docs/assets/victory-asset-manifest.json',JSON.stringify({status:'PASS',checked:new Date().toISOString(),checks:'Source text/WAV/mouth envelope and licensed generator hash continuity; speaking rig with new clips; nine unskinned coloured crowd poses under 1900 triangles each',crowdTriangles:triangles,files},null,2)+'\n');console.log('PASS Victory assets, recorded voices and crowd budget');
