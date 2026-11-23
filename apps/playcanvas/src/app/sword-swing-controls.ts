/** One gesture controls the retained sword animation; no click-to-win timer. */
export function mountSwordSwingControls(stage:HTMLElement, drive:(target?:number)=>unknown){
  const panel=document.createElement('section');panel.id='sword-control';panel.className='sword-control';panel.hidden=true;
  panel.setAttribute('aria-label','Control David’s sword');
  panel.innerHTML='<strong>Finish the battle</strong><p>Drag down and hold<br>or hold <kbd>E</kbd></p><button id="sword-grip" type="button" aria-label="Hold to swing Goliath’s sword"><span aria-hidden="true">↓</span><span class="sword-grip-label">Sword grip</span></button><progress id="sword-progress" max="1" value="0" aria-label="Sword swing progress"></progress>';
  stage.append(panel);
  const grip=panel.querySelector('button')!,progress=panel.querySelector('progress')!;
  const events=new AbortController(),options={signal:events.signal};
  let active=false,value=0,held=false,pointer:{id:number;y:number;start:number;travel:number}|undefined;
  function cancel(){
    held=false;drive();const id=pointer?.id;pointer=undefined;
    if(id!==undefined&&grip.hasPointerCapture(id))grip.releasePointerCapture(id);
  }
  grip.addEventListener('pointerdown',event=>{
    if(!active||event.button!==0||pointer)return;
    event.preventDefault();pointer={id:event.pointerId,y:event.clientY,start:value,travel:Math.min(130,Math.max(64,stage.clientHeight*.23))};
    grip.setPointerCapture(event.pointerId);
  },options);
  grip.addEventListener('pointermove',event=>{
    if(pointer?.id!==event.pointerId)return;
    event.preventDefault();drive(Math.max(value,pointer.start+(event.clientY-pointer.y)/pointer.travel));
  },options);
  grip.addEventListener('pointerup',cancel,options);grip.addEventListener('pointercancel',cancel,options);grip.addEventListener('lostpointercapture',cancel,options);
  window.addEventListener('keydown',event=>{
    if(!active||event.altKey||event.ctrlKey||event.metaKey||!(event.code==='KeyE'||(event.code==='Space'&&event.target===grip)))return;
    event.preventDefault();event.stopImmediatePropagation();held=true;drive(1);
  },{...options,capture:true});
  window.addEventListener('keyup',event=>{
    if(held&&(event.code==='KeyE'||event.code==='Space')){event.preventDefault();event.stopImmediatePropagation();cancel();}
  },{...options,capture:true});
  window.addEventListener('blur',cancel,options);window.addEventListener('resize',cancel,options);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)cancel();},options);
  return{
    update(enabled:boolean,amount=0){
      value=amount;
      if(active&&!enabled)cancel();active=enabled;panel.hidden=!enabled;
      progress.value=amount;panel.style.setProperty('--swing',String(amount));
      // The original mouse/touch gesture owns its travel even while UI re-renders.
      if(held&&enabled)drive(1);
    },
    cancel,
    dispose(){cancel();events.abort();panel.remove();},
  };
}
