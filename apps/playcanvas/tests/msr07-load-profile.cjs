// Real exported pages: fresh Chrome process per cold trial, same-page warm reload.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.argv[2]);
const origin=process.argv[3],out=path.resolve(process.argv[4]),trials=Number(process.argv[5]||3);
const pages=process.argv[6]?.split(',')||['episode','valley','camp','challenge','preparation','duel','victory'];
fs.mkdirSync(out,{recursive:true});
(async()=>{const rows=[];for(const pageName of pages)for(let trial=1;trial<=trials;trial++){
 const browser=await chromium.launch({channel:'chrome'}),context=await browser.newContext({viewport:{width:1280,height:720}}),p=await context.newPage(),errors=[],failed=[];
 p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});p.on('response',r=>{if(r.status()>=400)failed.push({file:new URL(r.url()).pathname,status:r.status()});});
 try{for(const cache of ['cold','warm']){
  const start=Date.now();if(cache==='cold')await p.goto(origin+'/'+pageName+'.html?review=1');else await p.reload();
  await p.locator('#enter').waitFor({state:'visible',timeout:90000});
  const readyMs=Date.now()-start,data=await p.evaluate(()=>{const nav=performance.getEntriesByType('navigation')[0],resources=performance.getEntriesByType('resource');return{navigation:{encodedBytes:nav.encodedBodySize,transferBytes:nav.transferSize,domContentLoadedMs:nav.domContentLoadedEventEnd},resources:resources.map(r=>({file:new URL(r.name).pathname,encodedBytes:r.encodedBodySize,transferBytes:r.transferSize,durationMs:r.duration})),renderer:document.querySelector('canvas')?.dataset.renderer};});
  rows.push({page:pageName,trial,cache,readyMs,browser:browser.version(),...data,encodedResourceBytes:data.resources.reduce((s,r)=>s+r.encodedBytes,0),transferredBytes:data.navigation.transferBytes+data.resources.reduce((s,r)=>s+r.transferBytes,0)});
 }assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);console.log('PASS loading '+pageName+' trial '+trial);}
 finally{await context.close();await browser.close();}
 fs.writeFileSync(path.join(out,'loading-progress.json'),JSON.stringify({rows},null,2));
 }
 const median=a=>[...a].sort((a,b)=>a-b)[Math.floor(a.length/2)];
 const summary=pages.map(page=>({page,...Object.fromEntries(['cold','warm'].map(cache=>{const r=rows.filter(r=>r.page===page&&r.cache===cache);return[cache,{trials:r.length,medianReadyMs:median(r.map(x=>x.readyMs)),medianTransferredBytes:median(r.map(x=>x.transferredBytes)),medianEncodedResourceBytes:median(r.map(x=>x.encodedResourceBytes))}];}))}));
 fs.writeFileSync(path.join(out,'loading-profile.json'),JSON.stringify({status:'PASS',basis:'Exported local-mode pages, unthrottled loopback, 1280×720. Cold uses a fresh Chrome profile/process; warm is a same-page reload with the server’s actual cache headers. OS/driver caches are not flushed; no hosted/mobile network or first-playable cinematic duration promise.',summary,rows},null,2));console.log(JSON.stringify(summary));
})().catch(e=>{console.error(e);process.exitCode=1;});
