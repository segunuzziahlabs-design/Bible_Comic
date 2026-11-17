// Real development Clerk UI, with reserved +clerk_test addresses (no real email).
// Credentials are generated privately into the ignored build directory. Never run on live keys.
const {chromium}=require(process.argv[2]);const fs=require('node:fs');const path=require('node:path');const crypto=require('node:crypto');
const root=path.resolve('docs/implementation/evidence/m4-2026-11-17');const credentialPath=path.resolve('build/m4-development-test-users.json');
(async()=>{
 let users;if(fs.existsSync(credentialPath))users=JSON.parse(fs.readFileSync(credentialPath,'utf8'));else{users=['a','b'].map(id=>({id,email:`m4-${id}+clerk_test_20261117@example.com`,password:crypto.randomBytes(18).toString('base64url')+'5a!'}));fs.writeFileSync(credentialPath,JSON.stringify(users),{mode:0o600});}
 const b=await chromium.launch({channel:'chrome'});try{
 for(const [label,viewport]of Object.entries({desktop:{width:1280,height:800},portrait:{width:390,height:844},landscape:{width:844,height:390}})){
  const p=await b.newPage({viewport});await p.goto('http://127.0.0.1:4205/index.html?view=sign-in');await p.locator('input[name=identifier]').waitFor({state:'visible',timeout:60000});
  const layout=await p.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth+1,inputs:[...document.querySelectorAll('input')].map(e=>({name:e.name,width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height}))}));if(layout.overflow)throw new Error(label+': horizontal overflow');
  await p.screenshot({path:path.join(root,`real-clerk-${label}.png`),fullPage:true});await p.close();console.log('Real Clerk sign-in form rendered: '+label);
 }
 if(!process.argv.includes('--sign-up'))return;
 const p=await b.newPage();await p.goto('http://127.0.0.1:4205/index.html?view=sign-up');await p.locator('input[name=emailAddress]').waitFor({state:'visible',timeout:60000});
 await p.locator('input[name=emailAddress]').fill(users[0].email);await p.locator('input[name=password]').fill(users[0].password);await p.getByRole('button',{name:'Continue',exact:true}).click();await p.waitForTimeout(4000);
 const code=p.locator('input[name=code]');if(await code.isVisible()){await code.pressSequentially('424242');await p.waitForTimeout(4000);}
 const body=await p.locator('body').innerText();const report={url:p.url(),body:body.replaceAll(users[0].email,'[development test email]'),basis:'Real Clerk development UI; generated test identity; not a mocked session.'};fs.writeFileSync(path.join(root,'clerk-signup-observation.json'),JSON.stringify(report,null,2));await p.screenshot({path:path.join(root,'clerk-signup-observation.png'),fullPage:true});console.log(report.body.slice(-1800));
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
