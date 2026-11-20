import type {Run} from '../gameplay/episode-rules';
import {clearStoryRouteHint,routeAllowed,storeStoryRouteHint,type RoutePoint,type StoryRoute} from '../gameplay/story-route';
import {navigationStorage} from '../gameplay/pavilion-route';
import {createGuidedHandoff} from './guided-handoff';
import './guided-route.css';

/** Owns the handoff only; existing controllers still own movement and saves. */
export function mountStoryDeparture(stage:HTMLElement,options:{run:()=>Run;review:boolean;inspect:boolean;lock:()=>void;summary?:()=>void;localTransfer?:()=>void}){
  let route:StoryRoute|undefined,phase:'inactive'|'departure'|'transfer'='inactive',age=0,sent=false;
  let handoff:ReturnType<typeof createGuidedHandoff>|undefined,error='';
  const cover=document.createElement('div');cover.className='route-cover';cover.hidden=true;cover.dataset.storyRouteCover='';
  const message=document.createElement('p');message.setAttribute('role','status');cover.append(message);
  const failure=document.createElement('div');failure.className='entry route-failure';failure.hidden=true;failure.dataset.storyRouteFailure='';
  const card=document.createElement('div');card.className='entry-card';const heading=document.createElement('h2');heading.textContent='The next location could not load';const detail=document.createElement('p');detail.setAttribute('role','alert');
  const retry=document.createElement('button');retry.textContent='Retry loading';retry.dataset.routeRetry='';
  const checkpoint=document.createElement('button');checkpoint.textContent=options.review?'Open next location preview':'Return to saved checkpoint';checkpoint.dataset.routeCheckpoint='';card.append(heading,detail,retry,checkpoint);failure.append(card);stage.append(cover,failure);
  const summary=document.createElement('button');summary.textContent='Chapter summary';summary.hidden=true;summary.dataset.routeSummary='';if(options.summary)document.querySelector('.actions')!.prepend(summary);summary.addEventListener('click',()=>options.summary?.());
  const suffix=()=>{const q=new URLSearchParams();if(options.review)q.set('review','1');if(options.inspect)q.set('inspect','1');return q;};
  retry.addEventListener('click',()=>{error='';failure.hidden=true;if(handoff)handoff.prepare();else sent=false;});
  checkpoint.addEventListener('click',()=>{clearStoryRouteHint(navigationStorage());if(route?.id==='r09')location.reload();else if(route){const q=suffix();location.assign(route.destination+(q.size?'?'+q:''));}});
  function stop(){phase='inactive';cover.hidden=failure.hidden=summary.hidden=true;stage.removeAttribute('data-route-transfer');handoff?.dispose();handoff=undefined;}
  return{
    start(next:StoryRoute){stop();if(!routeAllowed(next,options.run()))throw new Error('The route checkpoint has not saved.');route=next;phase='departure';age=0;sent=false;error='';summary.hidden=!options.summary||next.id==='r09';message.textContent=`Following the path · ${next.label}…`;if(next.id!=='r09'){handoff=createGuidedHandoff(next.destination);handoff.prepare();}},
    walking:()=>phase==='departure',active:()=>phase!=='inactive',covered:()=>phase==='transfer',target:()=>route?.departure.at(-1),path:()=>route?.departure,
    step(dt:number,position:RoutePoint,grounded:boolean){
      if(!route)return;const end=route.departure.at(-1)!;
      if(phase==='departure'&&grounded&&Math.hypot(position.x-end.x,position.z-end.z)<.45){phase='transfer';age=0;options.lock();summary.hidden=true;cover.hidden=false;cover.style.opacity='0';stage.setAttribute('data-route-transfer','');}
      if(phase!=='transfer')return;age+=dt;const t=Math.min(1,age/.4);cover.style.opacity=String(t*t*(3-2*t));if(age<.4)return;
      const prepared=handoff?.sample()??{state:'ready',error};if(prepared.state==='failed'||error){detail.textContent=prepared.error||error;failure.hidden=false;return;}
      if(prepared.state!=='ready'||sent||!routeAllowed(route,options.run()))return;sent=true;options.lock();
      if(route.id==='r09'){try{options.localTransfer?.();stop();}catch(cause){error=String(cause);sent=false;}}
      else{storeStoryRouteHint(navigationStorage(),route,options.run(),options.review);const q=suffix();q.set('arrival',route.id);location.assign(route.destination+'?'+q);}
    },
    sample:()=>route?{id:route.id,phase,network:handoff?.sample()??{state:'ready'},transferAge:age,navigationSent:sent,path:route.departure}:undefined,
    stop,dispose(){stop();cover.remove();failure.remove();summary.remove();},
  };
}
