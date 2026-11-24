const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..'),app=path.join(root,'apps/playcanvas');
const tests=['story-motion','cast-performance','saul-performance','story-route','pavilion-route','audience-performance','action-router','jump-motion','ranged-spear-rules','spear-airborne-rules','cinematic-battle-rules','episode-rules','m4-database','continuous-battle-saves','battle-ending-rules','communication-motion','communication-assets'];
const results=[];
for(const name of tests){const filename=name+(name==='continuous-battle-saves'?'.cjs':'-check.cjs'),r=spawnSync(process.execPath,['tests/'+filename],{cwd:app,encoding:'utf8',timeout:180000});results.push({test:filename,status:r.status===0?'PASS':'FAIL',exit:r.status,output:r.stdout,error:r.stderr,method:'Current-source executable checks; not a substitute for browser visual validation.'});console.log((r.status===0?'PASS ':'FAIL ')+filename);}
fs.writeFileSync(path.join(root,'docs/qa/communication-unit-results.json'),JSON.stringify({date:'2026-11-23',results},null,2));
if(results.some(r=>r.status!=='PASS'))process.exitCode=1;
