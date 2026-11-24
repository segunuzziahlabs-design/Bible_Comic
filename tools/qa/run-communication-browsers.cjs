// Sequential GPU tests: no concurrent browsers, recording or workbook renders
// during the unrecorded performance measurements.
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..'),app=path.join(root,'apps/playcanvas'),pw=process.argv[2],base='../../docs/qa/evidence/communication-2026-11-23/',local='http://127.0.0.1:4230';
const jobs=[
 ['cast-final','communication-cast-browser.cjs',local,base+'cast-final','desktop','opening,challenge'],
 ['motion-final','msr07-motion-probe.cjs',local,base+'motion-final'],
 ['active-battle','communication-battle-profile.cjs',local,base+'active-battle'],
 ['continuous-battle','continuous-battle-browser.cjs',local,base+'continuous-final','laptop'],
 ['controlled-ending','battle-ending-browser.cjs',local,base+'ending-final','desktop'],
 ...['desktop','portrait','landscape'].map(l=>['victory-'+l,'msr07-victory-profile.cjs',local,base+'victory-performance',l]),
 ['challenge-performance','msr07-sustained-profile.cjs',local,base+'challenge-performance','desktop'],
 ['memory','communication-memory-browser.cjs',local,base+'memory-final'],
 ['load-pages','msr07-load-profile.cjs',local,base+'loading-final','1','episode,valley,camp,challenge,preparation,duel,victory'],
 ['load-opening-repeat','msr07-load-profile.cjs',local,base+'loading-opening-repeat','3','valley'],
 ['live-accounts','communication-account-browser.cjs','http://127.0.0.1:4231',base+'accounts-final'],
];
const rows=[];for(const [id,file,...args]of jobs){console.log('START '+id);const r=spawnSync(process.execPath,['--use-system-ca','tests/'+file,pw,...args],{cwd:app,encoding:'utf8',timeout:600000});rows.push({id,file,arguments:args,exit:r.status,status:r.status===0?'EXECUTED':'HARNESS_OR_TEST_FAILURE',output:r.stdout,error:r.stderr});fs.writeFileSync(path.join(root,'docs/qa/communication-browser-runs.json'),JSON.stringify({date:'2026-11-23',runs:rows},null,2));console.log((r.status===0?'DONE ':'FAILED ')+id+'\n'+r.stdout.slice(-1300)+(r.status!==0?'\n'+r.stderr.slice(-1500):''));}
if(rows.some(r=>r.exit!==0))process.exitCode=1;
