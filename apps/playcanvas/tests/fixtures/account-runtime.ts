import type { Account, AccountApi, Settings } from '../../src/product/contracts';
import { useAccountSettings } from '../../src/product/preferences';
export const localDevelopment=false;
export const shellLink=(view='home')=>`index.html?view=${encodeURIComponent(view)}`;
const identity=()=>localStorage.getItem('m4.fixture.identity')??'alice';
const callbacks=new Set<()=>void>();
const user=identity()==='signed-out'?null:{id:identity()};
const fixtureBanner=document.createElement('p');fixtureBanner.style.cssText='position:fixed;bottom:0;left:0;right:0;z-index:100;pointer-events:none;margin:0;padding:3px;background:#573c25;color:#fff;font:9px system-ui;text-align:center';fixtureBanner.textContent='AUTOMATED TEST FIXTURE — local simulated identity, not Clerk authentication';document.body.prepend(fixtureBanner);
window.addEventListener('storage',()=>{if(identity()!==(user?.id??'signed-out'))for(const callback of callbacks)callback();});
const clerk={user,mountUserButton(el:HTMLDivElement){el.textContent='Fixture player';},mountSignIn(el:HTMLDivElement){el.textContent='Fixture sign-in — real Clerk flows are not tested here.';},mountSignUp(el:HTMLDivElement){el.textContent='Fixture sign-up';},mountUserProfile(el:HTMLDivElement){el.textContent='Fixture account — identity handled by Clerk in production.';}};
async function apiForPlayer():Promise<AccountApi>{
 if(!user)throw new Error('Sign in to open your saved story.');const owner=user.id;
 async function call(method:string,args?:unknown){if(identity()!==owner)throw new Error('The account changed. Reload before continuing.');const response=await fetch('http://127.0.0.1:4212/'+method,{method:'POST',headers:{'Content-Type':'application/json','X-Test-Identity':owner},body:JSON.stringify(args??{})});const result=await response.json();if(!response.ok)throw new Error(result.error??'Request failed.');return result;}
 return {dashboard:()=>call('dashboard'),history:(offset=0)=>call('history',offset),progress:c=>call('progress',c),battle:c=>call('battle',c),update:c=>call('update',c)};
}
export async function accountRuntime(){return{clerk,apiForPlayer,onIdentityChange(callback:()=>void){callbacks.add(callback);return()=>callbacks.delete(callback);}};}
export async function playerAccount(){const runtime=await accountRuntime();const api=await apiForPlayer();const account:Account=await api.dashboard();useAccountSettings(account.settings,account.id,account.revision);return{...runtime,api,account};}
export async function savePlayerSettings(api:AccountApi,account:Account,settings:Settings,name=account.displayName,command:string=crypto.randomUUID()){return api.update({p_command:command,p_revision:account.revision,p_name:name,p_settings:settings});}
