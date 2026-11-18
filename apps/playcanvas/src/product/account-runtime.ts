import { validateAccount, type AccountApi, type Account, type Settings } from './contracts';
import { useAccountSettings } from './preferences';

export const localDevelopment = import.meta.env.VITE_ACCOUNT_MODE === 'local';
export const shellLink = (view = 'home') => `index.html?view=${encodeURIComponent(view)}`;
let runtime: Promise<Awaited<ReturnType<typeof initialise>>> | undefined;
export function accountRuntime() { return runtime ??= initialise().catch(error => { runtime = undefined; throw error; }); }
async function initialise() {
  const key = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
  if (!key || !/^pk_(test|live)_/.test(key)) throw new Error('Player sign-in is not configured yet. The game preview remains available separately.');
  const [{ Clerk }, { ui }] = await Promise.all([import('@clerk/clerk-js'), import('@clerk/ui')]);
  const clerk = new Clerk(key);
  const dashboardUrl = new URL(shellLink('dashboard'), location.href).href;
  await clerk.load({ ui, afterSignOutUrl: new URL(shellLink(),location.href).href, signInUrl: new URL(shellLink('sign-in'),location.href).href, signUpUrl: new URL(shellLink('sign-up'),location.href).href, signInFallbackRedirectUrl: dashboardUrl, signUpFallbackRedirectUrl: dashboardUrl });
  // The vanilla SDK's standard browser global shares this instance with Clerk's
  // supported browser integrations/test helpers. Backend credentials never enter it.
  (window as Window & { Clerk: typeof clerk }).Clerk = clerk;
  let owner = clerk.user?.id;
  const listeners = new Set<() => void>();
  clerk.addListener(({user}) => { if (user?.id !== owner) { owner = user?.id; for (const callback of listeners) callback(); } });
  async function apiForPlayer(): Promise<AccountApi> {
    if (!clerk.user || !clerk.session) throw new Error('Sign in to open your saved story.');
    const identity = clerk.user.id;
    const url = import.meta.env.VITE_SUPABASE_URL, publicKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !publicKey) throw new Error('Cloud checkpoints are not configured yet. Your existing browser saves have been preserved.');
    if (!/^https:\/\/[a-z0-9.-]+(?::\d+)?\/?$/i.test(url)) throw new Error('The cloud service address is invalid.');
    const { createClient } = await import('@supabase/supabase-js');
    const db = createClient(url,publicKey,{accessToken:async()=>{
      if (clerk.user?.id !== identity || !clerk.session) throw new Error('The account changed. Sign in again.');
      const token = await clerk.session.getToken(); if (!token) throw new Error('Your session expired. Sign in again.'); return token;
    },auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},global:{fetch:async(input,init)=>{
      // A slow/lost response must expose Retry save; the adapter keeps its command ID.
      const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);
      const abort=()=>controller.abort();init?.signal?.addEventListener('abort',abort,{once:true});
      if(init?.signal?.aborted)controller.abort();
      try{return await fetch(input,{...init,signal:controller.signal});}
      finally{clearTimeout(timer);init?.signal?.removeEventListener('abort',abort);}
    }}});
    async function rpc(name: string, args?: object) {
      if (clerk.user?.id !== identity) throw new Error('The account changed. Reload before continuing.');
      const {data,error} = await db.rpc(name,args);
      if (clerk.user?.id !== identity) throw new Error('The account changed. Reload before continuing.');
      if(error) {
        if (error.message.includes('revision_conflict')) throw new Error('Progress changed in another tab. Reload the confirmed checkpoint.');
        if (error.message.includes('settings_conflict')) throw new Error('Settings changed elsewhere. Reload before saving again.');
        throw new Error('The cloud service could not confirm this request. Retry, or reload the last confirmed checkpoint.');
      }
      return data;
    }
    return {
      async dashboard() { return validateAccount(await rpc('game_dashboard')); },
      async history(offset=0) { return await rpc('game_attempt_history',{p_offset:offset}); },
      async progress(command) { return (await rpc('game_progress',command)) as Account['episode']; },
      async battle(command) { return (await rpc('game_battle',command)) as Account['episode']; },
      async update(command) { return validateAccount(await rpc('game_update_account',command)); },
    };
  }
  return { clerk, apiForPlayer, onIdentityChange(callback:()=>void) { listeners.add(callback); return ()=>listeners.delete(callback); } };
}
export async function playerAccount() {
  const identity = await accountRuntime(); const api = await identity.apiForPlayer();
  const account = await api.dashboard(); useAccountSettings(account.settings,account.id,account.revision);
  return { ...identity, api, account };
}
export async function savePlayerSettings(api: AccountApi, account: Account, settings: Settings, name = account.displayName, command: string = crypto.randomUUID()) {
  return api.update({p_command:command,p_revision:account.revision,p_name:name,p_settings:settings});
}
