// Loopback-only test service. Never deploy this server or fixture build.
const http=require('node:http');const {createDatabase,apiFor}=require('./m4-database-check.cjs');
(async()=>{const db=await createDatabase();let queue=Promise.resolve();
 const server=http.createServer((req,res)=>{
  const origin=req.headers.origin;if(origin==='http://127.0.0.1:4204')res.setHeader('Access-Control-Allow-Origin',origin);
  res.setHeader('Access-Control-Allow-Headers','Content-Type,X-Test-Identity');res.setHeader('Access-Control-Allow-Methods','POST,OPTIONS');
  if(req.method==='OPTIONS'){res.writeHead(204);res.end();return;}
  let raw='';req.on('data',chunk=>{raw+=chunk;if(raw.length>8192)req.destroy();});
  req.on('end',()=>{queue=queue.then(async()=>{try{const id=req.headers['x-test-identity'];if(!['alice','bob'].includes(id))throw new Error('Unknown fixture identity');
   const api=apiFor(db,'fixture_'+id),method=req.url?.slice(1);if(!['dashboard','progress','update','history'].includes(method))throw new Error('Unknown method');
   const result=await api[method](JSON.parse(raw||'{}'));res.setHeader('Content-Type','application/json');res.end(JSON.stringify(result));
  }catch(error){res.writeHead(400,{'Content-Type':'application/json'});res.end(JSON.stringify({error:error.message}));}});});
 });server.listen(4212,'127.0.0.1',()=>console.log('Local M4 PostgreSQL fixture API: 127.0.0.1:4212 (simulated identities only)'));
})().catch(e=>{console.error(e);process.exitCode=1;});
