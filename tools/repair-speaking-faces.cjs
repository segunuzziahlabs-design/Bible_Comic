// Correct the speaking overlay in place, preserving all non-facial GLB data.
// Idempotent; originals are retained under ignored build/face-audit-originals.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'apps/playcanvas/src/assets'),backup=path.join(root,'build/face-audit-originals');fs.mkdirSync(backup,{recursive:true});
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const clamp=x=>Math.max(0,Math.min(1,x)),records=[];
for(const file of fs.readdirSync(dir).filter(f=>f.endsWith('.glb'))){
 const full=path.join(dir,file),current=fs.readFileSync(full),prior=JSON.parse(current.subarray(20,20+current.readUInt32LE(12)));
 const original=prior.extras?.communicationFaceRevision===1?fs.readFileSync(path.join(backup,file)):current,jsonLength=original.readUInt32LE(12),j=JSON.parse(original.subarray(20,20+jsonLength));let bin=Buffer.from(original.subarray(28+jsonLength));
 const mouthNode=j.nodes.find(n=>n.mesh!==undefined&&/speaking mouth/i.test(n.name));if(!mouthNode)continue;
 if(j.extras?.communicationFaceRevision===2){records.push({...j.extras.communicationFaceRecord,sha256:sha(original),bytes:original.length});continue;}
 const read=id=>{const a=j.accessors[id],v=j.bufferViews[a.bufferView];if(a.componentType!==5126||a.type!=='VEC3')throw Error('Expected uncompressed VEC3');const points=Array.from({length:a.count},(_,i)=>{if(!v)return[0,0,0];const o=(v.byteOffset||0)+(a.byteOffset||0)+i*(v.byteStride||12);return[bin.readFloatLE(o),bin.readFloatLE(o+4),bin.readFloatLE(o+8)];});if(a.sparse){const s=a.sparse,iv=j.bufferViews[s.indices.bufferView],vv=j.bufferViews[s.values.bufferView],size={5121:1,5123:2,5125:4}[s.indices.componentType];for(let i=0;i<s.count;i++){const io=(iv.byteOffset||0)+(s.indices.byteOffset||0)+i*size,at=bin.readUIntLE(io,size),o=(vv.byteOffset||0)+(s.values.byteOffset||0)+i*12;points[at]=[bin.readFloatLE(o),bin.readFloatLE(o+4),bin.readFloatLE(o+8)];}}return points;};
 const write=(id,points)=>{const a=j.accessors[id];if(a.bufferView===undefined||a.sparse){a.bufferView=j.bufferViews.length;j.bufferViews.push({buffer:0,byteOffset:bin.length,byteLength:a.count*12});bin=Buffer.concat([bin,Buffer.alloc(a.count*12)]);a.byteOffset=0;delete a.sparse;j.buffers[0].byteLength=bin.length;}const v=j.bufferViews[a.bufferView];for(let i=0;i<a.count;i++){let o=(v.byteOffset||0)+(a.byteOffset||0)+i*(v.byteStride||12);for(let c=0;c<3;c++)bin.writeFloatLE(points[i][c],o+c*4);}if(a.min)a.min=[0,1,2].map(c=>Math.min(...points.map(p=>p[c])));if(a.max)a.max=[0,1,2].map(c=>Math.max(...points.map(p=>p[c])));};
 const addMorph=(node,name,deltas)=>{const m=j.meshes[node.mesh];m.extras??={};m.extras.targetNames??=[];if(m.extras.targetNames.includes(name))return;const id=j.accessors.length;j.accessors.push({componentType:5126,count:deltas.length,type:'VEC3',min:[0,0,0],max:[0,0,0]});write(id,deltas);m.extras.targetNames.push(name);m.primitives[0].targets??=[];m.primitives[0].targets.push({POSITION:id});m.weights=Array(m.extras.targetNames.length).fill(0);if(node.weights)node.weights=Array(m.extras.targetNames.length).fill(0);};
 const mouth=j.meshes[mouthNode.mesh],mp=mouth.primitives[0],points=read(mp.attributes.POSITION),oldY=(Math.min(...points.map(p=>p[1]))+Math.max(...points.map(p=>p[1])))/2;
 const halfWidth=Math.max(...points.map(p=>Math.abs(p[0]))),scale=halfWidth/.024,isGoliath=/goliath/i.test(file),isJesse=/jesse/i.test(file);
 const skinNode=j.nodes.find(n=>n.mesh!==undefined&&/skin|Jesse face/.test(n.name));if(!skinNode)throw Error('Missing base face '+file);
 const skin=j.meshes[skinNode.mesh],sp=skin.primitives[0],skinPoints=read(sp.attributes.POSITION);
 const candidates=skinPoints.filter(p=>Math.abs(p[0])<.006*scale&&p[1]>oldY+.003&&p[1]<oldY+.04&&p[2]>points[0][2]*.4).sort((a,b)=>a[2]-b[2]);
 if(!candidates.length)throw Error('No original lip crease '+file);
 const anchor=candidates[0][1]-.001*scale,dy=anchor-oldY;
 const depthShift=isGoliath?0:isJesse?-.0025:-.0035*scale;
 for(const node of j.nodes.filter(n=>n.mesh!==undefined&&/speaking mouth|lip edge|upper teeth/i.test(n.name))){
  const m=j.meshes[node.mesh];for(const p of m.primitives){const base=read(p.attributes.POSITION),radius=Math.max(...base.map(v=>Math.abs(v[1]-oldY)),.001*scale),isTeeth=/teeth/i.test(node.name);
   const next=base.map(v=>[v[0],oldY+dy+(v[1]-oldY)*(isTeeth?1:.28),v[2]+depthShift]);write(p.attributes.POSITION,next);
   const index=m.extras?.targetNames?.indexOf('SpeakOpen');if(index>=0&&p.targets?.[index]?.POSITION!==undefined){const delta=read(p.targets[index].POSITION);for(let i=0;i<delta.length;i++)delta[i][1]=((base[i][1]-oldY)/radius*.006-.0045)*scale;write(p.targets[index].POSITION,delta);}
  }
 }
 // Only the lower lip/chin follows the opening, not an unrelated patch under it.
 const openIndex=skin.extras?.targetNames?.indexOf('SpeakOpen');
 if(openIndex>=0&&sp.targets?.[openIndex]?.POSITION!==undefined){const deltas=skinPoints.map(([x,y,z])=>{const lower=clamp((anchor-y)/(.012*scale)),fade=clamp((y-anchor+.065*scale)/(.025*scale)),front=clamp((z-.035*scale)/(.025*scale)),weight=Math.exp(-((x/(.05*scale))**4))*lower*fade*front;return[0,-.009*scale*weight,0];});write(sp.targets[openIndex].POSITION,deltas);}
 if(isJesse){
  addMorph(skinNode,'Blink',skinPoints.map(([x,y,z])=>[0,Math.abs(x)<.065&&y>1.677&&y<1.715&&z>.054?(1.696-y)*.94:0,0]));
  addMorph(skinNode,'BrowLift',skinPoints.map(([x,y,z])=>[0,Math.abs(x)>.014&&Math.abs(x)<.075&&y>1.717&&y<1.75&&z>.045?.009:0,0]));
  addMorph(skinNode,'Smile',skinPoints.map(([x,y,z])=>{const w=Math.exp(-(((Math.abs(x)-.026)/.018)**2)-(((y-anchor)/.022)**2))*clamp((z-.06)/.025);return[.002*w*Math.sign(x),.007*w,0];}));
 }
 if(isGoliath){const browNode=j.nodes.find(n=>n.mesh!==undefined&&/Charcoal beard/.test(n.name));const eyeNode=j.nodes.find(n=>n.mesh!==undefined&&/Eye whites/.test(n.name));if(browNode&&eyeNode){const ep=read(j.meshes[eyeNode.mesh].primitives[0].attributes.POSITION),ey=Math.max(...ep.map(p=>p[1])),bp=read(j.meshes[browNode.mesh].primitives[0].attributes.POSITION);addMorph(browNode,'BrowLift',bp.map(([x,y,z])=>[0,Math.abs(x)<.18&&y>ey&&y<ey+.07&&z>.07?.014:0,0]));}}
 const record={file,originalSha256:sha(original),originalMouthY:oldY,lipAnchorY:anchor,offsetY:dy,depthShift,policy:'Aligned original lip crease; constrained opening; lower-lip jaw target; rig/UV/non-facial tracks unchanged'};
 j.extras={...j.extras,communicationFaceRevision:2,communicationFaceRecord:record};
 let json=Buffer.from(JSON.stringify(j));json=Buffer.concat([json,Buffer.alloc((4-json.length%4)%4,0x20)]);const header=Buffer.alloc(20),binaryHeader=Buffer.alloc(8);header.writeUInt32LE(0x46546c67,0);header.writeUInt32LE(2,4);header.writeUInt32LE(28+json.length+bin.length,8);header.writeUInt32LE(json.length,12);header.writeUInt32LE(0x4e4f534a,16);binaryHeader.writeUInt32LE(bin.length,0);binaryHeader.writeUInt32LE(0x004e4942,4);
 const output=Buffer.concat([header,json,binaryHeader,bin]);if(!fs.existsSync(path.join(backup,file)))fs.writeFileSync(path.join(backup,file),original);fs.writeFileSync(full,output);records.push({...record,sha256:sha(output),bytes:output.length});
}
fs.mkdirSync(path.join(root,'docs/qa'),{recursive:true});fs.writeFileSync(path.join(root,'docs/qa/face-asset-repair.json'),JSON.stringify({revision:2,records},null,2)+'\n');console.log('Repaired/verified '+records.length+' speaking character exports.');

