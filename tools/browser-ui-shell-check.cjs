// Fault injection is confined to browser requests/context in this verification script.
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.argv[2]||'playwright');
const out=path.resolve(process.argv[3]||'build/verification/b05/shell');
fs.mkdirSync(out,{recursive:true});
const report={timestamp:new Date().toISOString(),checks:[],cases:[],errors:[]};
let browser;
function check(ok,label,detail){report.checks.push({label,passed:!!ok,...(detail===undefined?{}:{detail})});if(!ok)throw new Error(label+': '+JSON.stringify(detail));}
async function loading(page){return page.evaluate(()=>window.__proofLoading);}
async function wait(page,predicate,label,timeout=60000){
 const end=Date.now()+timeout;
 while(Date.now()<end){const value=await loading(page);if(value&&predicate(value))return value;await page.waitForTimeout(200);}
 throw new Error('Timed out: '+label+' '+JSON.stringify(await loading(page)));
}
async function session(name,viewport={width:390,height:844},options={}){
 const context=await browser.newContext({viewport,...options});
 const page=await context.newPage();
 const entry={name,errors:[],failedRequests:[]};report.cases.push(entry);
 page.on('console',m=>{if(m.type()==='error')entry.errors.push(m.text());});
 page.on('pageerror',e=>entry.errors.push(e.message));
 page.on('requestfailed',r=>entry.failedRequests.push(r.url()+': '+r.failure()?.errorText));
 return {context,page,entry};
}
async function capture(page,name){await page.screenshot({path:path.join(out,name+'.png')});}
async function recovery(page,phase,name){
 const s=await wait(page,s=>!!s.error,'failure message');
 check(s.phase===phase,name+': expected recovery category',{phase:s.phase});
 const panel=await page.locator('#notice').innerText();
 check(panel.length>20&&!panel.includes(s.error),name+': clear player message without raw diagnostic text');
 const rect=await page.locator('#retry').boundingBox(),view=page.viewportSize();
 check(rect&&rect.height>=48&&rect.x>=0&&rect.y>=0&&rect.x+rect.width<=view.width+1&&rect.y+rect.height<=view.height+1,name+': recovery button is visible and at least 48px high',rect);
 await capture(page,name);
}
(async()=>{
 browser=await chromium.launch({channel:'chrome',headless:true});report.browserVersion=browser.version();
 const endpoint='http://127.0.0.1:8060/?diagnostics=1';
 let s=await session('engine-script-failure',{width:320,height:568});
 report.buildManifest=await (await s.context.request.get('http://127.0.0.1:8060/build-manifest.json')).json();
 await s.page.route('**/index.js',r=>r.abort('failed'));
 await s.page.goto(endpoint,{waitUntil:'domcontentloaded'});
 await recovery(s.page,'download','engine-script-failure');
 await s.page.unroute('**/index.js');
 await s.page.getByRole('button',{name:'Try again',exact:true}).click();
 await wait(s.page,x=>x.ready,'retry startup');
 check(true,'Retry after script failure reloads a playable export');
 await s.context.close();

 s=await session('wasm-download-failure',{width:568,height:320});
 await s.page.route('**/index.wasm',r=>r.abort('failed'));
 await s.page.goto(endpoint,{waitUntil:'domcontentloaded'});
 await recovery(s.page,'startup','wasm-download-failure');
 await s.context.close();

 s=await session('missing-browser-features');
 await s.page.route('**/index.js',r=>r.fulfill({status:200,contentType:'text/javascript',body:'class Engine { static getMissingFeatures(){ return ["WebGL 2 (injected)"]; } }'}));
 await s.page.goto(endpoint,{waitUntil:'domcontentloaded'});
 await recovery(s.page,'features','missing-browser-features');
 await s.context.close();

 s=await session('slow-loading');
 let release;
 const hold=new Promise(resolve=>{release=resolve;});
 await s.page.route('**/index.wasm',async r=>{await hold;await r.continue();});
 await s.page.goto(endpoint,{waitUntil:'domcontentloaded'});
 await wait(s.page,x=>x.phase==='slow','slow-load recovery option',30000);
 check(await s.page.getByRole('button',{name:'Try again',exact:true}).isVisible(),'Slow load offers retry without reporting false failure');
 check((await loading(s.page)).error===null,'Slow loading remains a recoverable pending state');
 await capture(s.page,'slow-loading');
 release();
 await wait(s.page,x=>x.ready,'slow load resumes');
 check(!(await s.page.locator('#loading').isVisible()),'Delayed download reaches entry and removes loading overlay');
 check(s.entry.errors.length===0&&s.entry.failedRequests.length===0,'Slow successful startup has no unexpected errors',s.entry);
 await s.context.close();

 s=await session('safe-area-and-context-loss',{width:568,height:320});
 await s.page.goto(endpoint,{waitUntil:'domcontentloaded'});
 await wait(s.page,x=>x.ready,'normal startup');
 await s.page.addStyleTag({content:'#frame { inset:24px 22px 16px 18px !important; }'});
 await s.page.waitForFunction(()=>window.__bibleProof?.layout?.view[0]===528&&window.__bibleProof?.layout?.view[1]===280);
 const safe=await s.page.evaluate(()=>({frame:(()=>{const r=document.getElementById('frame').getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};})(),canvas:[document.getElementById('canvas').width,document.getElementById('canvas').height],game:window.__bibleProof.layout}));
 check(safe.frame.x===18&&safe.frame.y===24&&safe.canvas[0]===528&&safe.canvas[1]===280,'Simulated safe-area insets resize CSS-pixel canvas',safe);
 const inside=r=>r[0]>=0&&r[1]>=0&&r[0]+r[2]<=528+1&&r[1]+r[3]<=280+1;
 check(inside(safe.game.card)&&inside(safe.game.primary)&&inside(safe.game.secondary),'Entry card/actions remain inside simulated safe-area viewport');
 await capture(s.page,'safe-area-entry');
 check(s.entry.errors.length===0&&s.entry.failedRequests.length===0,'Normal startup and safe-area resize have no unexpected errors',s.entry);
 const loss=await s.page.evaluate(()=>{const gl=document.getElementById('canvas').getContext('webgl2'),ext=gl.getExtension('WEBGL_lose_context');if(!ext)return false;ext.loseContext();return true;});
 check(loss,'Browser supports actual test-triggered context loss');
 await recovery(s.page,'graphics','graphics-context-loss');
 await s.page.getByRole('button',{name:'Reload village',exact:true}).click();
 await wait(s.page,x=>x.ready,'context-loss recovery');
 check(true,'Reload after graphics loss returns to a fresh playable entry');
 const finalManifest=await (await s.context.request.get('http://127.0.0.1:8060/build-manifest.json')).json();
 check(JSON.stringify(finalManifest)===JSON.stringify(report.buildManifest),'Shell tests used one unchanged export');
 await s.context.close();

 s=await session('javascript-disabled',{width:320,height:568},{javaScriptEnabled:false});
 await s.page.goto(endpoint,{waitUntil:'domcontentloaded'});
 await capture(s.page,'javascript-disabled');
 const noScript=s.page.locator('noscript p');
 check(await noScript.isVisible()&&(await noScript.innerText()).includes('Enable it in your browser settings, then reload'),'Disabled JavaScript shows actionable browser/reload guidance');
 await s.context.close();
 report.result='passed';
})().catch(e=>{report.result='failed';report.failure=e.stack;process.exitCode=1;}).finally(async()=>{
 fs.writeFileSync(path.join(out,'shell-checks.json'),JSON.stringify(report,null,2));
 console.log(JSON.stringify({result:report.result,checks:report.checks.length,failure:report.failure,report:path.join(out,'shell-checks.json')}));
 if(browser)await browser.close();
});
