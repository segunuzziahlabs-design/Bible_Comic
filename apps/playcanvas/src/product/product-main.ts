import './product.css';
import { chapters, currentObjective, episodePage, objectives, requiresBattleFinish } from '../gameplay/episode-rules';
import { accountRuntime, localDevelopment, playerAccount, savePlayerSettings, shellLink } from './account-runtime';
import { defaultSettings, type Account, type Settings } from './contracts';
import { cloudEpisodeSaves } from './cloud-saves';
import { openEpisodeSession } from '../gameplay/episode-session';
import { canReviewChapter } from './chapter-access';
import { appearanceStorage, defaultAppearance, hairColours, hairStyles, skinTones, tunicColours } from '../world/david-appearance';
import heroUrl from '../assets/product-hero.png?url';

const content = document.getElementById('content')!;
const view = new URLSearchParams(location.search).get('view') ?? 'home';
const chapterPages = ['valley.html','camp.html','challenge.html','preparation.html','duel.html','victory.html'];
const descriptions = ['Tend the flock. Answer Jesse’s call and journey to Elah.','Deliver the provisions and find your brothers among Israel’s tents.','Hear the champion. Stand firm when fear spreads through the camp.','Speak before Saul, set aside the armour and prepare your sling.','Step into the valley. Move, dodge and face Goliath with your sling.','Witness the retreat, the soldiers’ cheers and the conclusion.'];
const escape = (value: string) => value.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const link = (text: string, href: string, secondary=false) => `<a class="action${secondary?' secondary':''}" href="${escape(href)}">${escape(text)}</a>`;
const status = (message: string, error=false) => `<p class="notice${error?' error':''}" role="${error?'alert':'status'}">${escape(message)}</p>`;
function heading(eyebrow: string,title: string,copy='') { return `<p class="eyebrow">${eyebrow}</p><h1>${title}</h1>${copy?`<p class="lead">${copy}</p>`:''}`; }
function chapterCards(account?: Account) {
  const run = account?.episode?.current, active = run ? requiresBattleFinish(run)?4:currentObjective(run)?.chapter ?? 5 : -1;
  return chapters.map((title,i)=>{
    const finished = account && canReviewChapter(account.episode,i);
    const available = run && i===active && run.status !== 'completed';
    const text = finished ? 'Completed · Revisit without changing progress' : available ? 'Current chapter' : account ? 'Continue the story to unlock' : 'Chapter '+(i+1);
    return `<article class="card"><span class="chapter-number">CHAPTER ${String(i+1).padStart(2,'0')}</span><h3>${title}</h3><p>${descriptions[i]}</p><p class="chapter-state">${text}</p>${finished?link('Revisit chapter',chapterPages[i]+'?review=1',true):available?link('Continue',episodePage(run!)):''}</article>`;
  }).join('');
}
function home() {
  content.innerHTML=`<section class="hero"><div class="hero-copy">${heading('An interactive biblical journey','A shepherd.<br/>A giant.<br/>A moment of faith.','Become David. Walk from the hills of Bethlehem to the Valley of Elah, and face the champion in a cinematic story you help bring to life.')}<div class="actions">${link('Enter the story',shellLink('dashboard'))}${link('Explore six chapters',shellLink('chapters'),true)}</div><p class="subtle">Play in your browser · Desktop and touch controls · Headphones recommended</p></div><div class="hero-art"><img src="${heroUrl}" alt="David stands before Saul in the Israelite pavilion"/><span class="image-caption">David before Saul · In-game scene</span></div></section><section class="section-line">${heading('One complete episode','Faith in the face of fear.')}<div class="grid"><article class="card"><h3>Step into the story</h3><p>Meet Jesse, find David’s brothers and stand before Saul. Watch voiced encounters unfold around you.</p></article><article class="card"><h3>Take the sling</h3><p>Gather five smooth stones, practise your aim and control David in the encounter with Goliath.</p></article><article class="card"><h3>Continue your journey</h3><p>Sign in to keep your confirmed checkpoints and David’s appearance with your account.</p></article></div></section>`;
}
function unavailable(error: unknown) {
  content.innerHTML=heading('Your journey','We couldn’t open your account.')+status(error instanceof Error?error.message:'Please retry your connection.',true)+`<div class="actions"><button id="retry-account">Try again</button>${link('Back to the story',shellLink(),true)}</div>`;
  document.getElementById('retry-account')!.addEventListener('click',()=>location.reload());
}
async function identityMenu(runtime: Awaited<ReturnType<typeof accountRuntime>>) {
  const {clerk}=runtime;
  if(clerk.user) {document.getElementById('sign-in-link')!.hidden=true;clerk.mountUserButton(document.getElementById('account-menu')! as HTMLDivElement);}
  runtime.onIdentityChange(()=>location.replace(shellLink(clerk.user?'dashboard':'home')));
}
async function auth() {
  content.innerHTML=`<div class="auth-layout">${heading('Your story, saved',view==='sign-up'?'Begin your journey':'Welcome back','Sign in to continue from your confirmed checkpoint.')}<div id="clerk-panel"><p role="status">Connecting to sign-in…</p></div></div>`;
  const runtime=await accountRuntime(); await identityMenu(runtime);
  if(runtime.clerk.user) {location.replace(shellLink('dashboard'));return;}
  const panel=document.getElementById('clerk-panel')! as HTMLDivElement;panel.replaceChildren();
  const redirect=new URL(shellLink('dashboard'),location.href).href;
  if(view==='sign-up') runtime.clerk.mountSignUp(panel,{routing:'hash',signInUrl:new URL(shellLink('sign-in'),location.href).href,forceRedirectUrl:redirect});
  else runtime.clerk.mountSignIn(panel,{routing:'hash',signUpUrl:new URL(shellLink('sign-up'),location.href).href,forceRedirectUrl:redirect});
}
async function accountPage() {
  content.innerHTML=heading('Your journey','Opening your saved story…')+status('Connecting to your account.');
  const runtime=await accountRuntime();await identityMenu(runtime);
  if(!runtime.clerk.user) {location.replace(shellLink('sign-in'));return;}
  const player=await playerAccount();let account=player.account;
  const run=account.episode?.current,goal=run&&(requiresBattleFinish(run)?{chapter:4,label:run.battle?.stage==='fallen'?'Take Goliath’s sword':'Finish the battle'}:currentObjective(run));
  if(view==='settings'||view==='profile') {renderSettings(player.api,account);return;}
  if(view==='account') {content.innerHTML=heading('Account','Manage sign-in')+'<div id="clerk-panel"></div>';runtime.clerk.mountUserProfile(document.getElementById('clerk-panel')! as HTMLDivElement,{routing:'hash'});return;}
  if(view==='chapters') {content.innerHTML=heading('The story','Six chapters. One act of courage.','Revisiting completed chapters leaves your confirmed progress unchanged. An episode replay begins a separate run.')+`<div class="grid">${chapterCards(account)}</div>`;return;}
  if(view==='results' && run?.status!=='completed') {content.innerHTML=heading('Results','The story is still unfolding.')+link('Return to your journey',shellLink('dashboard'));return;}
  const progress=run?.completed.length??0;
  const finished=run?.status==='completed';
  content.innerHTML=heading(finished?'Episode complete':'Your journey',finished?'David prevailed.':`Welcome, ${escape(account.displayName)}.`)+`<section class="episode-feature"><div><p class="eyebrow">DAVID AND GOLIATH · 1 SAMUEL 17</p><h2>${finished?'Faith. Courage. Victory.':goal?chapters[goal.chapter]:'From Bethlehem to Elah'}</h2><p class="lead">${finished?'The Philistines have fled. Israel’s soldiers cheer as David’s story closes.':goal?escape(goal.label):'Begin with David and the flock as a messenger arrives with Jesse’s call.'}</p><div class="progress-track" role="progressbar" aria-label="Episode objectives" aria-valuemin="0" aria-valuemax="12" aria-valuenow="${progress}"><div class="progress-fill" style="width:${progress/12*100}%"></div></div><p class="subtle">${progress} of 12 objectives confirmed${run?` · ${run.attempt} battle attempt${run.attempt===1?'':'s'}`:''}</p><div class="actions"><button id="play-episode">${finished?'Replay episode':run?'Continue episode':'Begin episode'}</button>${link('Your David & settings',shellLink('settings'),true)}</div><p id="play-status" role="status" class="subtle">${run?.status==='defeated'?'Your preparation is saved. Continue to choose Retry Battle.':'Checkpoints save after completed objectives.'}</p></div><div class="card"><p class="eyebrow">YOUR STORY</p><p class="metric">${finished?'6 / 6':`${goal?.chapter??0} / 6`}</p><p>Chapters complete</p><p>${run?.defeats??0} battle defeats</p><p class="subtle">${account.episode?.history.length??0} previous completed runs</p>${link('Chapters',shellLink('chapters'),true)}</div></section><section class="section-line"><h2>The chapters</h2><div class="grid">${chapterCards(account)}</div></section>${account.episode?.history.length?`<section class="section-line"><h2>Earlier journeys</h2>${account.episode.history.map(h=>`<div class="history-row"><span>Completed ${escape(new Date(h.updatedAt).toLocaleDateString())}</span><span>${h.attempt} battle attempts · ${h.defeats} defeats</span></div>`).join('')}</section>`:''}`;
  const history=document.createElement('section');history.className='section-line';history.innerHTML='<h2>Battle history</h2><div id="battle-history" role="status">Opening confirmed results…</div><div class="actions"><button type="button" id="earlier-attempts" class="secondary" hidden>Earlier results</button><button type="button" id="recent-attempts" class="secondary" hidden>More recent results</button></div>';content.append(history);
  let offset=0;
  async function loadHistory(){
    const older=document.getElementById('earlier-attempts')as HTMLButtonElement,newer=document.getElementById('recent-attempts')as HTMLButtonElement;
    older.disabled=newer.disabled=true;
    try{const rows=await player.api.history(offset);document.getElementById('battle-history')!.innerHTML=rows.length?rows.map(row=>`<div class="history-row"><span>${row.outcome==='completed'?'Episode completed':'Defeated by Goliath'} · Attempt ${row.attempt}</span><span>${escape(new Date(row.recorded_at).toLocaleDateString())}</span></div>`).join(''):'<p class="subtle">No confirmed battle results yet.</p>';older.hidden=rows.length<20;newer.hidden=offset===0;}
    catch{document.getElementById('battle-history')!.textContent='Battle history could not load. Reload to retry. Your confirmed checkpoint is unchanged.';}
    finally{older.disabled=newer.disabled=false;}
  }
  document.getElementById('earlier-attempts')!.addEventListener('click',()=>{offset+=20;void loadHistory();});document.getElementById('recent-attempts')!.addEventListener('click',()=>{offset=Math.max(0,offset-20);void loadHistory();});void loadHistory();
  let session:Awaited<ReturnType<typeof openEpisodeSession>>|undefined;
  document.getElementById('play-episode')!.addEventListener('click',async event=>{
    const button=event.currentTarget as HTMLButtonElement;button.disabled=true;
    try {
      session??=await openEpisodeSession(cloudEpisodeSaves(player.api));
      if(session.run.status==='completed') await session.replay();
      location.assign(episodePage(session.run));
    } catch(error) {document.getElementById('play-status')!.textContent=error instanceof Error?error.message:'Your checkpoint could not be confirmed.';button.disabled=false;}
  });
}
function renderSettings(api: Awaited<ReturnType<typeof playerAccount>>['api'],account: Account) {
  const settings=structuredClone(account.settings),appearance=settings.appearance??defaultAppearance;
  content.innerHTML=heading('Make the journey yours','Your David & settings','Choose David’s appearance and how you play. Account changes are saved only when you select Save settings.')+`<form id="settings-form" class="card form-grid"><label>Player name<input id="player-name" maxlength="40" required value="${escape(account.displayName)}" autocomplete="nickname"/></label><label>Graphics<select id="graphics"><option value="balanced">Balanced · 1280 × 720 limit</option><option value="low">Low · 960 × 540 limit</option></select></label><label>Movement controls<select id="movement"><option value="auto">Automatic for this device</option><option value="keys">Direction keys</option><option value="stick">Touch stick</option></select></label><label>Key labels<select id="labels"><option value="wasd">WASD</option><option value="arrows">Arrows</option></select></label><label>Skin tone<select id="skin"></select></label><label>Hair style<select id="hairStyle"></select></label><label>Hair colour<select id="hairColour"></select></label><label>Tunic colour<select id="tunic"></select></label><label class="checkbox"><input type="checkbox" id="muted"/>Mute dialogue, music and effects</label><label class="checkbox"><input type="checkbox" id="captions"/>Show dialogue captions</label><div class="form-full"><p class="subtle">Changes to in-game sound or movement are temporary. Save your preferred defaults here for your next visit.</p><p id="settings-status" role="status"></p><div class="actions"><button type="submit" id="save-settings">Save settings</button>${link('Back to journey',shellLink('dashboard'),true)}${link('Sign-in & security',shellLink('account'),true)}</div></div></form>`;
  const select=(id:string)=>document.getElementById(id)as HTMLSelectElement;
  for(const [id,choices] of Object.entries({skin:skinTones,hairStyle:hairStyles,hairColour:hairColours,tunic:tunicColours})) {
    for(const [value,choice]of Object.entries(choices)) select(id).add(new Option(choice.label,value));
    select(id).value=appearance[id as keyof typeof appearance];
  }
  for(const id of ['graphics','movement','labels']as const) select(id).value=settings[id];
  for(const id of ['muted','captions']as const) (document.getElementById(id)as HTMLInputElement).checked=settings[id];
  // Local appearance is offered explicitly; never silently copy another browser user's choice.
  if(!settings.appearance) {try {const raw=localStorage.getItem(appearanceStorage);if(raw){const local=JSON.parse(raw);const b=document.createElement('button');b.type='button';b.className='secondary form-full';b.textContent='Use this browser’s saved David appearance';b.onclick=()=>{for(const id of ['skin','hairStyle','hairColour','tunic']) if([...select(id).options].some(o=>o.value===local[id]))select(id).value=local[id];};document.getElementById('settings-form')!.prepend(b);}}catch{/* Preserve invalid local preference without importing. */}}
  let pending:{id:string;settings:Settings;name:string}|undefined;
  document.getElementById('settings-form')!.addEventListener('submit',async event=>{
    event.preventDefault(); const button=document.getElementById('save-settings')as HTMLButtonElement;button.disabled=true;
    const next:Settings={...defaultSettings,graphics:select('graphics').value as Settings['graphics'],movement:select('movement').value as Settings['movement'],labels:select('labels').value as Settings['labels'],muted:(document.getElementById('muted')as HTMLInputElement).checked,captions:(document.getElementById('captions')as HTMLInputElement).checked,appearance:{skin:select('skin').value as typeof appearance.skin,hairStyle:select('hairStyle').value as typeof appearance.hairStyle,hairColour:select('hairColour').value as typeof appearance.hairColour,tunic:select('tunic').value as typeof appearance.tunic}};
    pending??={id:crypto.randomUUID(),settings:next,name:(document.getElementById('player-name')as HTMLInputElement).value.trim()};
    try {await savePlayerSettings(api,account,pending.settings,pending.name,pending.id);location.replace(shellLink('settings'));}
    catch(error) {document.getElementById('settings-status')!.textContent=error instanceof Error?error.message:'Settings have not saved.';button.textContent='Retry pending settings';button.disabled=false;for(const input of document.querySelectorAll<HTMLInputElement|HTMLSelectElement>('#settings-form input,#settings-form select'))input.disabled=true;if(!document.getElementById('reload-settings')){const reload=document.createElement('button');reload.type='button';reload.id='reload-settings';reload.className='secondary';reload.textContent='Reload saved settings';reload.addEventListener('click',()=>location.reload());button.parentElement!.append(reload);}}
  });
}
for(const a of document.querySelectorAll<HTMLAnchorElement>('.navigation a')) if(new URL(a.href).searchParams.get('view')===view)a.setAttribute('aria-current','page');
window.addEventListener('pageshow',event=>{if(event.persisted&&view!=='home')location.reload();});
if(view==='home') {home();if(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY)void accountRuntime().then(identityMenu).catch(()=>{});}
else if(view==='chapters'&&!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY) {content.innerHTML=heading('The story','Six chapters. One act of courage.')+`<div class="grid">${chapterCards()}</div><div class="actions">${link('Sign in to begin',shellLink('sign-in'))}</div>`;}
else if(localDevelopment) {content.innerHTML=heading('Local development','Account services are disabled.')+status('This build uses browser-only development saves. It does not provide sign-in or cloud progress.')+`<div class="actions">${link('Open local episode','episode.html')}${link('David preview','david-preview.html',true)}</div>`;}
else void (view==='sign-in'||view==='sign-up'?auth():view==='chapters'?accountRuntime().then(async r=>{if(r.clerk.user)await accountPage();else{await identityMenu(r);content.innerHTML=heading('The story','Six chapters. One act of courage.')+`<div class="grid">${chapterCards()}</div><div class="actions">${link('Sign in to begin',shellLink('sign-in'))}</div>`;}}):accountPage()).catch(unavailable);
