/** Network preparation only: no destination script execution, extra game context
 * or promise of GPU warm-up. Navigation stays with the paused chapter loop. */
export function createGuidedHandoff(destination:string,timeoutMs=10000){
  let state:'idle'|'loading'|'ready'|'failed'='idle',error='',request:AbortController|undefined,disposed=false;
  async function prepare(){
    request?.abort();const controller=new AbortController();request=controller;state='loading';error='';
    const timeout=window.setTimeout(()=>controller.abort(),timeoutMs);
    try{
      const response=await fetch(destination,{signal:controller.signal,cache:'no-cache'});if(!response.ok)throw new Error('The next location could not load.');
      const html=new DOMParser().parseFromString(await response.text(),'text/html'),src=html.querySelector<HTMLScriptElement>('script[type="module"][src]')?.getAttribute('src');
      if(!src)throw new Error('Some files for the next location are missing.');
      const url=new URL(src,new URL(destination,location.href));if(url.origin!==location.origin)throw new Error('The next location could not be opened.');
      const script=await fetch(url,{signal:controller.signal,cache:'force-cache'});if(!script.ok||script.headers.get('content-type')?.includes('text/html'))throw new Error('Some files for the next location could not load.');await script.arrayBuffer();
      if(disposed||request!==controller)return;
      const preload=document.createElement('link');preload.rel='modulepreload';preload.href=url.href;document.head.append(preload);state='ready';
    }catch(cause){if(!disposed&&request===controller){state='failed';error=cause instanceof Error&&cause.name!=='AbortError'?cause.message:'Loading the next location took too long. Please retry.';}}
    finally{window.clearTimeout(timeout);}
  }
  return{prepare:()=>{void prepare();},sample:()=>({state,error}),dispose(){disposed=true;request?.abort();}};
}
