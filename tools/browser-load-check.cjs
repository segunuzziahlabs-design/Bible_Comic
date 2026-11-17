// Local browser-cache measurements, not real-phone or hosted-network evidence.
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.argv[2]||'playwright');
const output=path.resolve('build/browser-checks/chrome-loading.json');
const report={timestamp:new Date().toISOString(),network:'loopback unless labelled simulated',measurements:[],errors:[]};
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 report.browserVersion=browser.version();
 try{
  for(let i=0;i<4;i++){
   const context=await browser.newContext({viewport:{width:960,height:540}}),page=await context.newPage();
   page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});
   page.on('pageerror',e=>report.errors.push(e.message));
   if(i===3){const cdp=await context.newCDPSession(page);await cdp.send('Network.enable');await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:150,downloadThroughput:1250000,uploadThroughput:250000,connectionType:'cellular4g'});}
   for(const cache of (i===3?['cold-simulated-10Mbps-150ms']:['cold-context','warm-reload'])){
    await page.goto('http://127.0.0.1:8060/?diagnostics=1',{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>window.__bibleProof?.mode==='welcome'&&window.__proofLoading?.ready,{},{timeout:60000});
    const measurement=await page.evaluate(()=>({engineReadyMs:window.__proofLoading.readyMs,firstDiagnosticsMs:performance.now(),resources:performance.getEntriesByType('resource').filter(r=>/index\.(wasm|pck|js)$/.test(r.name)).map(r=>({url:r.name,encoded:r.encodedBodySize,decoded:r.decodedBodySize,transfer:r.transferSize,duration:r.duration}))}));
    report.measurements.push({run:i+1,cache,...measurement});
   }
   await context.close();
  }
  report.result=report.errors.length?'failed':'passed';if(report.errors.length)process.exitCode=1;
 }finally{await browser.close();}
})().catch(e=>{report.result='failed';report.failure=e.stack;process.exitCode=1;}).finally(()=>{fs.writeFileSync(output,JSON.stringify(report,null,2));console.log(JSON.stringify({result:report.result,runs:report.measurements.length,errors:report.errors,failure:report.failure,output}));});
