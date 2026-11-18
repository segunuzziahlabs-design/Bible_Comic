const {PGlite}=require('@electric-sql/pglite');
const fs=require('node:fs');const path=require('node:path');const assert=require('node:assert/strict');const {randomUUID}=require('node:crypto');
require('node:module').registerHooks({resolve(s,c,next){if(s.startsWith('.')&&/\/(product|gameplay|world)\//.test(c.parentURL??'')&&!path.extname(s))s+='.ts';return next(s,c);}});
const rules=require('../src/gameplay/episode-rules.ts');
const {cloudEpisodeSaves}=require('../src/product/cloud-saves.ts');const {openEpisodeSession}=require('../src/gameplay/episode-session.ts');
const {defaultSettings}=require('../src/product/contracts.ts');
async function createDatabase(){
 const db=new PGlite();await db.exec(`create role anon;create role authenticated;create schema auth;
 create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$;
 grant usage on schema auth to authenticated,anon;grant execute on function auth.jwt() to authenticated,anon;`);
 for(const file of fs.readdirSync(path.join(__dirname,'../supabase/migrations')).filter(f=>f.endsWith('.sql')).sort())await db.exec(fs.readFileSync(path.join(__dirname,'../supabase/migrations',file),'utf8'));return db;
}
function apiFor(db,subject){
 async function rpc(name,args=[]){await db.exec('set role authenticated');await db.query("select set_config('request.jwt.claims',$1,false)",[JSON.stringify(subject?{sub:subject}:{})]);
 const {rows}=await db.query(`select public.${name}(${args.map((_,i)=>'$'+(i+1)).join(',')}) result`,args);return rows[0].result;}
 return {dashboard:()=>rpc('game_dashboard'),battle:c=>rpc('game_battle',[c.p_command,c.p_run,c.p_revision,c.p_battle_revision,c.p_action]),progress:c=>rpc('game_progress',[c.p_command,c.p_kind,c.p_run,c.p_revision,c.p_objective,c.p_version]),update:c=>rpc('game_update_account',[c.p_command,c.p_revision,c.p_name,JSON.stringify(c.p_settings)]),history:offset=>rpc('game_attempt_history',[offset??0])};
}
module.exports={createDatabase,apiFor};
if(require.main===module)(async()=>{
 const db=await createDatabase();const a=apiFor(db,'test_alice'),b=apiFor(db,'test_bob');
 await assert.rejects(apiFor(db,null).dashboard(),/authentication_required/);
 await db.exec('set role anon');await assert.rejects(db.query('select public.game_dashboard()'),/permission denied/);
 const first=await a.dashboard();assert.equal(first.episode,null);assert.equal(first.displayName,'Player');
 assert.equal((await a.dashboard()).id,first.id);assert.notEqual((await b.dashboard()).id,first.id);
 const serverObjectives=(await (async()=>{await db.exec('reset role');return db.query('select objectives from game_private.catalog');})()).rows[0].objectives;
 assert.deepEqual(serverObjectives,rules.objectives.map(o=>o.id),'Server manifest must match shipped rules');
 let drop=false,failedCommand,commands=[];
 const flaky={...a,progress:async c=>{commands.push(c.p_command);const r=await a.progress(c);if(drop){drop=false;failedCommand=c.p_command;throw new Error('response lost');}return r;}};
 const s=await openEpisodeSession(cloudEpisodeSaves(flaky));rules.validateRun(s.run);assert.equal(s.run.revision,0);
 await assert.rejects(a.progress({p_command:randomUUID(),p_kind:'objective',p_run:s.run.runId,p_revision:0,p_objective:'goliath.struck',p_version:rules.contentVersion}),/invalid_objective/);
 drop=true;await assert.rejects(s.commit({type:'objective',id:'valley.surveyed'}),/response lost/);assert.equal(s.run.revision,0);
 await s.commit({type:'objective',id:'valley.surveyed'});assert.equal(commands.at(-1),failedCommand);assert.equal(s.run.revision,1);
 const restored=await openEpisodeSession(cloudEpisodeSaves(a));assert.deepEqual(restored.run,s.run);
 const stale=await openEpisodeSession(cloudEpisodeSaves(a));await s.commit({type:'objective',id:'provisions.delivered'});
 await assert.rejects(stale.commit({type:'objective',id:'provisions.delivered'}),/revision_conflict/);
 assert.equal((await b.dashboard()).episode,null,'Another identity sees no run');
 await db.exec('set role authenticated');await db.query("select set_config('request.jwt.claims',$1,false)",[JSON.stringify({sub:'test_bob'})]);
 assert.equal((await db.query('select * from game_private.runs')).rows.length,0,'RLS hides other runs');
 await assert.rejects(db.query('update game_private.profiles set display_name=$1',['hacked']),/permission denied/);
 await assert.rejects(b.progress({p_command:randomUUID(),p_kind:'objective',p_run:s.run.runId,p_revision:s.run.revision,p_objective:'brothers.met',p_version:rules.contentVersion}),/revision_conflict/);
 for(const o of rules.objectives.slice(2,10))await s.commit({type:'objective',id:o.id});
 await s.commit({type:'defeat',reason:'david_killed_by_goliath'});assert.equal(s.run.status,'defeated');
 const resumed=await openEpisodeSession(cloudEpisodeSaves(a));await resumed.commit({type:'retry'});assert.equal(resumed.run.attempt,2);assert.equal(rules.preparation(resumed.run).stonesGathered,5);
 await resumed.commit({type:'objective',id:'goliath.struck'});await resumed.commit({type:'objective',id:'victory.witnessed'});rules.validateRun(resumed.run);
 assert.equal((await a.history()).length,2);assert.equal((await b.history()).length,0);
 const complete=resumed.run;await resumed.replay();assert.notEqual(resumed.run.runId,complete.runId);assert.equal(resumed.history[0].runId,complete.runId);
 const update={p_command:randomUUID(),p_revision:0,p_name:'David’s player',p_settings:{...defaultSettings,appearance:{skin:'deep',hairStyle:'full',hairColour:'black',tunic:'clay'}}};
 const changed=await a.update(update);assert.equal(changed.revision,1);assert.deepEqual(await a.update(update),changed);
 await assert.rejects(a.update({...update,p_command:randomUUID()}),/settings_conflict/);
 await assert.rejects(a.update({...update,p_command:randomUUID(),p_revision:1,p_settings:{...defaultSettings,graphics:null}}),/invalid_settings/);
 await assert.rejects(a.update({...update,p_command:randomUUID(),p_revision:1,p_settings:{...defaultSettings,appearance:{...update.p_settings.appearance,skin:null}}}),/invalid_appearance/);
 assert.equal((await b.dashboard()).settings.appearance,null);
 await db.close();console.log('PASS: actual migration in local PostgreSQL WASM; ordered story, authoritative saves, lost-response idempotency, stale revisions, anonymous denial, two-identity RLS, defeat/retry, completion/history/replay, settings validation/isolation. Live Clerk/JWT verification is separate.');
})().catch(e=>{console.error(e);process.exitCode=1;});
