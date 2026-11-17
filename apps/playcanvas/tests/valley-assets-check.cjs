const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../../..');
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const provenance=JSON.parse(fs.readFileSync(path.join(root,'docs/assets/valley-voice-provenance.json')));
const previous=JSON.parse(fs.readFileSync(path.join(root,'docs/assets/saul-voice-provenance.json')));
assert.equal(provenance.modelSha256,previous.modelSha256);assert.equal(provenance.voicesSha256,previous.voicesSha256);
for(const line of provenance.lines){const audio=fs.readFileSync(path.join(root,'apps/playcanvas/src/assets/valley-dialogue',line.id+'.wav'));assert.equal(hash(audio),line.sha256);assert.equal(audio.toString('ascii',0,4),'RIFF');}
const bytes=fs.readFileSync(path.join(root,'apps/playcanvas/src/assets/soldier-standing-lod.glb'));
assert.equal(bytes.toString('ascii',0,4),'glTF');assert.equal(bytes.readUInt32LE(4),2);
const gltf=JSON.parse(bytes.toString('utf8',20,20+bytes.readUInt32LE(12)));
assert.equal(gltf.animations?.length??0,0);assert.equal(gltf.skins?.length??0,0);
const triangles=gltf.meshes.flatMap(mesh=>mesh.primitives).reduce((sum,p)=>sum+gltf.accessors[p.indices].count/3,0);
assert.ok(triangles>=2500&&triangles<=4000);
const result={checked:new Date().toISOString(),soldier:{file:'apps/playcanvas/src/assets/soldier-standing-lod.glb',sha256:hash(bytes),bytes:bytes.length,triangles,skins:0,animations:0,source:'Existing prepared CC0 adult character; original shield and spear; Blender bake/decimation',generator:'source-assets/characters/valley_soldier_lod.py'},voices:{clips:provenance.lines.length,hashes:'all match provenance',model:'same licensed model and supplied voice bank as the accepted Saul sample'}};
fs.writeFileSync(path.join(root,'docs/assets/valley-asset-manifest.json'),JSON.stringify(result,null,2)+'\n');console.log('PASS Chapter 1 voice hashes, model provenance and baked soldier budget:',triangles,'triangles');
