const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex'),read=name=>{const file=`apps/playcanvas/src/assets/${name}.glb`,bytes=fs.readFileSync(file);return{file,bytes,glb:JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)))}};
const source=read('goliath-encounter'),derived=read('goliath-collision'),a=source.glb,b=derived.glb;
for(const animation of a.animations)assert(b.animations.some(x=>x.name===animation.name),`Lost ${animation.name}`);
for(const name of['Spear grip','Spear tip','Goliath forehead'])assert(b.nodes.some(n=>n.name===name));
assert.deepEqual(b.skins.map(s=>s.joints.length),a.skins.map(s=>s.joints.length));assert.equal(b.meshes.length,a.meshes.length);
const triangles=j=>j.meshes.flatMap(m=>m.primitives).reduce((sum,p)=>sum+j.accessors[p.indices].count/3,0);assert.equal(triangles(a),triangles(b));assert(b.meshes.some(m=>m.extras?.targetNames?.includes('SpeakOpen')),'Keep the speaking face');
const report={status:'PASS',checks:'Retained animation names, joint/mesh/triangle counts, speaking face and actual grip/tip/forehead markers.',triangles:triangles(b),joints:b.skins.map(s=>s.joints.length),meshes:b.meshes.length,files:[source,derived].map(({file,bytes,glb})=>({file,bytes:bytes.length,sha256:hash(bytes),animations:glb.animations.map(a=>a.name)}))};fs.writeFileSync('docs/assets/goliath-spear-collision-manifest.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
