// Isolated development QA identity; credentials and browser state stay in ignored build/.
const {chromium}=require(process.argv[2]),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const support=require('./m4-live-support.cjs'),origin=process.argv[3]||'http://127.0.0.1:4209';
const userFile=path.join(support.build,'cinematic-test-user.json'),stateFile=path.join(support.build,'cinematic-live-state.json');
(async()=>{await support.setup();let user;if(fs.existsSync(userFile)&&!process.argv.includes('--fresh'))user=JSON.parse(fs.readFileSync(userFile));else{user={email:'cinematic-'+crypto.randomUUID().slice(0,8)+'+clerk_test@example.com',password:'Aa1!'+crypto.randomBytes(24).toString('base64url')};fs.writeFileSync(userFile,JSON.stringify(user));}
 const {backend}=await support.setup(),existing=await backend.users.getUserList({emailAddress:[user.email]}),browser=await chromium.launch({channel:'chrome'});
 try{const context=await support.context(browser),page=await context.newPage();await page.goto(origin+'/index.html?view='+(existing.totalCount?'sign-in':'sign-up'));
  await page.locator(existing.totalCount?'input[name=identifier]':'input[name=emailAddress]').waitFor({timeout:60000});await page.locator(existing.totalCount?'input[name=identifier]':'input[name=emailAddress]').fill(user.email);await page.locator('input[name=password]').fill(user.password);await page.getByRole('button',{name:'Continue',exact:true}).click();
  const outcome=await Promise.race([page.locator('#play-episode').waitFor({timeout:60000}).then(()=> 'dashboard'),page.getByRole('textbox',{name:'Enter verification code'}).waitFor({timeout:60000}).then(()=> 'code')]);if(outcome==='code'){await page.getByRole('textbox',{name:'Enter verification code'}).pressSequentially('424242');await page.locator('#play-episode').waitFor({timeout:60000});}
  const account=await support.rpc(page,'game_dashboard');assert.equal(account.episode,null,'Use --fresh for a new isolated full-journey QA account');await context.storageState({path:stateFile});console.log('PASS: real Clerk development sign-up/sign-in and hosted empty profile; isolated full-episode QA state saved privately.');await context.close();
 }finally{await browser.close();}
})().catch(error=>{console.error(error.message);process.exitCode=1;});
