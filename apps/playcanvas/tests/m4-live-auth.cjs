const {chromium}=require(process.argv[2]);const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const support=require('./m4-live-support.cjs');const root=path.resolve(process.argv[3]||'docs/implementation/evidence/m4-2026-11-17/live-auth');fs.mkdirSync(root,{recursive:true});
const origin='http://127.0.0.1:4205';const users=JSON.parse(fs.readFileSync(path.join(support.build,'m4-development-test-users.json'),'utf8'));
async function authenticate(page,user,exists){
 await page.goto(origin+'/index.html?view='+(exists?'sign-in':'sign-up'));
 await page.locator(exists?'input[name=identifier]':'input[name=emailAddress]').waitFor({state:'visible',timeout:60000});
 await page.locator(exists?'input[name=identifier]':'input[name=emailAddress]').fill(user.email);
 await page.locator('input[name=password]').fill(user.password);await page.getByRole('button',{name:'Continue',exact:true}).click();
 const outcome=await Promise.race([page.getByRole('heading',{name:'Welcome, Player.',exact:true}).waitFor({timeout:60000}).then(()=> 'dashboard'),page.getByRole('textbox',{name:'Enter verification code'}).waitFor({timeout:60000}).then(()=> 'code')]);
 if(outcome==='code'){await page.getByRole('textbox',{name:'Enter verification code'}).pressSequentially('424242');await page.waitForURL('**/index.html?view=dashboard',{timeout:60000});}
 await page.locator('#play-episode').waitFor({state:'visible',timeout:60000});await page.waitForFunction(()=>!!window.Clerk?.session);
}
(async()=>{const {backend,env}=await support.setup();const browser=await chromium.launch({channel:'chrome'});const results=[];try{
 for(const user of users){const ctx=await support.context(browser);const p=await ctx.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
  try{const existing=await backend.users.getUserList({emailAddress:[user.email]});await authenticate(p,user,existing.totalCount>0);
   const account=await support.rpc(p,'game_dashboard');assert.equal(account.episode,null);assert.equal(account.displayName,'Player');
   const claims=await p.evaluate(async()=>{const token=await window.Clerk.session.getToken();const payload=JSON.parse(atob(token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));return{issuer:payload.iss,role:payload.role,subject:payload.sub};});assert.equal(claims.role,'authenticated');assert.equal(claims.issuer,'https://blessed-wren-3811.clerk.accounts.dev');
   await p.screenshot({path:path.join(root,'real-account-'+user.id+'-dashboard.png'),fullPage:true});await ctx.storageState({path:path.join(support.build,'m4-live-'+user.id+'-state.json')});
   results.push({identity:user.id,accountId:account.id,clerkSubject:claims.subject,issuer:claims.issuer,role:claims.role,status:'PASS',errors});assert.deepEqual(errors,[]);
  }catch(error){await p.screenshot({path:path.join(root,'failure-'+user.id+'.png'),fullPage:true});const text=(await p.locator('body').innerText()).replaceAll(user.email,'[development test email]');fs.writeFileSync(path.join(root,'failure-'+user.id+'.json'),JSON.stringify({error:error.message,url:p.url(),text},null,2));throw error;}finally{await ctx.close();}
 }
 assert.notEqual(results[0].accountId,results[1].accountId);
 const anon=await fetch(env.VITE_SUPABASE_URL+'/rest/v1/rpc/game_dashboard',{method:'POST',headers:{apikey:env.VITE_SUPABASE_PUBLISHABLE_KEY,'Content-Type':'application/json'},body:'{}'});assert.equal(anon.status,401);
 fs.writeFileSync(path.join(root,'results.json'),JSON.stringify({status:'PASS',basis:'Real Clerk development sign-up/sign-in forms and verified JWTs accepted by hosted Supabase. Reserved test email addresses; no mocked identity.',results,anonymousStatus:anon.status},null,2));console.log('PASS: two real Clerk development accounts authenticated through the browser; hosted Supabase accepted authenticated issuer claims and isolated profiles; anonymous API denied.');
 }finally{await browser.close();}})().catch(e=>{console.error(e.message);process.exitCode=1;});
