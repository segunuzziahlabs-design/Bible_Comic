const fs=require('node:fs'),path=require('node:path');
const {clerkSetup,setupClerkTestingToken}=require('@clerk/testing/playwright');
const {createClerkClient}=require('@clerk/backend');
const privateDir='C:/Users/Segun/.codex/private/bible-comic';
const build=path.resolve(__dirname,'../../../build');
function config(){const env=Object.fromEntries(fs.readFileSync(path.resolve(__dirname,'../.env.local'),'utf8').split(/\r?\n/).filter(l=>l.includes('=')).map(l=>{const i=l.indexOf('=');return[l.slice(0,i),l.slice(i+1)]}));const credential=JSON.parse(fs.readFileSync(path.join(privateDir,'clerk-development.json'),'utf8'));const database=JSON.parse(fs.readFileSync(path.join(privateDir,'supabase-development.json'),'utf8'));
 if(!env.VITE_CLERK_PUBLISHABLE_KEY?.startsWith('pk_test_')||!credential.secretKey?.startsWith('sk_test_')||credential.application!=='app_3MEVSiOeIUzWx5cGOP8xcoRK9uR'||env.VITE_SUPABASE_URL!==`https://${database.projectRef}.supabase.co`||database.project!=='bible-comic-dev')throw new Error('Live test must target the explicitly approved development services.');
 return{env,credential,database};}
async function setup(){const c=config();await clerkSetup({secretKey:c.credential.secretKey,publishableKey:c.env.VITE_CLERK_PUBLISHABLE_KEY,dotenv:false,debug:false});return{...c,backend:createClerkClient({secretKey:c.credential.secretKey})};}
async function context(browser,options={}){const c=await browser.newContext(options);await setupClerkTestingToken({context:c});return c;}
async function rpc(page,name,args={}){const {env}=config();return page.evaluate(async({url,key,name,args})=>{const token=await window.Clerk.session?.getToken();if(!token)throw new Error('No real Clerk session');const response=await fetch(url+'/rest/v1/rpc/'+name,{method:'POST',headers:{apikey:key,Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(args)});const data=await response.json();if(!response.ok)throw new Error('Authenticated RPC failed: '+response.status+' '+data.code+' '+data.message);return data;},{url:env.VITE_SUPABASE_URL,key:env.VITE_SUPABASE_PUBLISHABLE_KEY,name,args});}
module.exports={setup,context,rpc,config,build};
