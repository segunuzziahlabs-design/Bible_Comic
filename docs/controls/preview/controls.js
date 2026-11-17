const $=id=>document.getElementById(id),screen=$('screen'),phase=$('phase'),movementMode=$('movement-mode');
const keys=$('direction-keys'),stick=$('stick'),status=$('input-status');
const directions={forward:{x:0,z:1,label:'Forward'},left:{x:-1,z:0,label:'Left'},back:{x:0,z:-1,label:'Backward'},right:{x:1,z:0,label:'Right'}};
const movementKeys={KeyW:'forward',ArrowUp:'forward',KeyA:'left',ArrowLeft:'left',KeyS:'back',ArrowDown:'back',KeyD:'right',ArrowRight:'right'};
const actionKeys={Space:'jump',ShiftLeft:'dodge',ShiftRight:'dodge',KeyF:'sling',KeyQ:'jump-shot',KeyE:'interact'};
const held=new Map(),cooldowns=new Map();let paused=false,dodges=0,stones=5,aim={x:.58,y:.46},head={x:.4982567,y:.4282520},locked=false,look,stickPointer,animation,previous=performance.now(),lastMoveLabel='';
function say(text){if(status.textContent!==text)status.textContent=text;}
function canPlay(){return !paused&&phase.value!=='cinematic';}
function clearInputs(){held.clear();look=undefined;stickPointer=undefined;$('stick-knob').style.setProperty('--x','0px');$('stick-knob').style.setProperty('--y','0px');for(const b of keys.querySelectorAll('button'))delete b.dataset.pressed;delete $('move-feedback').dataset.active;}
function setPaused(value){paused=value;clearInputs();$('paused').hidden=!paused;$('pause').innerHTML=paused?'▶ <span>Resume</span>':'Ⅱ <span>Pause</span>';$('pause').setAttribute('aria-label',paused?'Resume preview':'Pause preview');updateActions();}
function setPhase(value,reset=true){phase.value=value;screen.dataset.phase=value;clearInputs();animation=undefined;$('action-tag').hidden=true;delete $('action-arc').dataset.active;if(reset){dodges=0;stones=5;cooldowns.clear();}setPaused(false);updateActions();}
function inputVector(){let x=0,z=0;for(const[k,v]of held)if(!k.startsWith('aim:')){x+=v.x;z+=v.z;}const m=Math.max(1,Math.hypot(x,z));return{x:x/m,z:z/m};}
function updateActions(){
 const defend=phase.value==='defend',strike=phase.value==='strike',explore=phase.value==='explore';
 $('objective-label').textContent=defend?'STAND YOUR GROUND':strike?'YOUR MOMENT':explore?'FOLLOW THE MARKER':'STORY SCENE';
 $('objective').textContent=defend?'Dodge the incoming spear':strike?'Aim for Goliath’s forehead':explore?'Approach Goliath':'Watch the scene';
 $('objective-detail').textContent=defend?`${dodges+1} of 3 · Move ${dodges%2?'right':'left'}, then Dodge`:strike?`${stones} stones · Sling or Jump Shot`:explore?'Move with the console · E to inspect':'Control returns when the dialogue ends';
 $('dodge').querySelector('.symbol').textContent=dodges%2?'↘':'↙';
 $('combat-actions').hidden=explore||phase.value==='cinematic';$('interact').hidden=!explore;$('caption').hidden=phase.value!=='cinematic';
 $('finisher-hint').hidden=!strike||locked;$('aim-state').textContent=locked?'Forehead aim ready':'Aim at the forehead';screen.toggleAttribute('data-locked',locked);
 for(const action of['jump','dodge','sling','jump-shot']){const b=$(action),cool=cooldowns.get(action)||0;let allowed=canPlay()&&!explore;
  if(action==='sling')allowed=allowed&&strike&&stones>0;if(action==='jump-shot')allowed=allowed&&strike&&locked&&stones>0;
  b.disabled=!allowed||cool>0;b.toggleAttribute('data-cooling',cool>0);b.style.setProperty('--cooldown',`${Math.max(0,1-cool/(action==='dodge'?.9:action==='jump'?1:action==='sling'?1.1:1.5))*100}%`);
  b.querySelector('kbd').textContent=cool>0?`${cool.toFixed(1)}s`:action==='sling'?(defend?'3 evades':'F / click'):action==='jump'?'Space':action==='dodge'?'Shift':'Q';
  b.setAttribute('aria-label',`${action==='jump-shot'?'Jump Shot':action==='sling'?'Sling':action==='jump'?'Jump':'Dodge'}${cool>0?' cooling down':action==='jump-shot'&&!locked?' · Aim at forehead first':action==='sling'&&defend?' · Ready after three evasions':''}`);
 }
 $('interact').disabled=!canPlay();
}
function placeAim(){const w=screen.clientWidth,h=screen.clientHeight,img=$('scene-image'),scale=Math.max(w/(img.naturalWidth||1280),h/(img.naturalHeight||720)),dw=(img.naturalWidth||1280)*scale,dh=(img.naturalHeight||720)*scale;
 const target={x:head.x*dw-(dw-w)/2,y:head.y*dh-(dh-h)/2};$('head-target').style.left=target.x+'px';$('head-target').style.top=target.y+'px';
 $('reticle').style.left=aim.x*w+'px';$('reticle').style.top=aim.y*h+'px';locked=Math.hypot(aim.x*w-target.x,aim.y*h-target.y)<=24;
 $('aim-state').style.left=Math.min(w-75,Math.max(75,aim.x*w))+'px';$('aim-state').style.top=Math.min(h-180,Math.max(80,aim.y*h+27))+'px';screen.dataset.targetX=String(target.x/w);screen.dataset.targetY=String(target.y/h);updateActions();
}
function moveAim(x,y){aim={x:Math.max(.05,Math.min(.95,x)),y:Math.max(.10,Math.min(.78,y))};placeAim();}
function perform(action){
 if(action==='pause'){setPaused(!paused);return;}if(!canPlay())return;
 if(action==='interact'){if(phase.value==='explore')say('Inspect · E / tap · Preview action received');return;}
 const b=$(action);if(b.disabled){say(action==='jump-shot'?'Aim at the forehead to ready Jump Shot.':action==='sling'?'The sling is available after three evasion previews.':'Action is recovering.');return;}
 cooldowns.set(action,action==='dodge'?.9:action==='jump'?1:action==='sling'?1.1:1.5);
 if(action==='dodge'){dodges++;say(`Dodge preview ${Math.min(dodges,3)} / 3 · ${dodges%2?'Left':'Right'}`);if(dodges>=3&&phase.value==='defend'){setPhase('strike',false);say('Sling opportunity · Aim at the forehead to ready Jump Shot.');}}
 else if(action==='jump')say('Jump preview · Space / Jump · Physical clearance will determine safety.');
 else if(action==='sling'){stones--;say(`Sling release preview · ${locked?'Forehead aim ready':'Aim is outside the forehead target'} · ${stones} stones`);}
 else{stones--;say('Jump Shot preview · One action queues a jump and sling release near the apex.');}
 animation={action,time:0,duration:action==='jump-shot'?1.15:.8};$('action-tag').hidden=false;$('action-tag').textContent=action==='dodge'?'Dodge preview':action==='jump'?'Jump preview':action==='sling'?'Sling release preview':'Jump → apex release';updateActions();
 screen.dataset.lastAction=action;screen.dataset.actionCount=String(Number(screen.dataset.actionCount||0)+1);
}
for(const b of keys.querySelectorAll('[data-move]')){
 b.addEventListener('pointerdown',e=>{if(!canPlay()||e.button!==0)return;e.preventDefault();screen.focus({preventScroll:true});b.setPointerCapture(e.pointerId);held.set('button:'+e.pointerId,directions[b.dataset.move]);b.dataset.pressed='true';});
 const release=e=>{held.delete('button:'+e.pointerId);delete b.dataset.pressed;};b.addEventListener('pointerup',release);b.addEventListener('pointercancel',release);b.addEventListener('lostpointercapture',release);
}
stick.addEventListener('pointerdown',e=>{if(!canPlay()||stickPointer||e.button!==0)return;e.preventDefault();screen.focus({preventScroll:true});const box=stick.getBoundingClientRect();stickPointer={id:e.pointerId,x:box.x+box.width/2,y:box.y+box.height/2};stick.setPointerCapture(e.pointerId);});
stick.addEventListener('pointermove',e=>{if(stickPointer?.id!==e.pointerId)return;const x=e.clientX-stickPointer.x,y=e.clientY-stickPointer.y,scale=Math.max(36,Math.hypot(x,y));held.set('stick:'+e.pointerId,{x:x/scale,z:-y/scale});$('stick-knob').style.setProperty('--x',`${x/scale*34}px`);$('stick-knob').style.setProperty('--y',`${y/scale*34}px`);});
function releaseStick(e){if(stickPointer?.id!==e.pointerId)return;held.delete('stick:'+e.pointerId);stickPointer=undefined;$('stick-knob').style.setProperty('--x','0px');$('stick-knob').style.setProperty('--y','0px');}
for(const name of['pointerup','pointercancel','lostpointercapture'])stick.addEventListener(name,releaseStick);
for(const b of document.querySelectorAll('[data-action]'))b.addEventListener('click',()=>{screen.focus({preventScroll:true});perform(b.dataset.action);});
// Pointer-up allows a second thumb to act while the stick owns another capture.
for(const b of document.querySelectorAll('[data-action]')){let touchAt=-Infinity;b.addEventListener('pointerup',e=>{if(e.pointerType!=='touch'||b.disabled)return;touchAt=performance.now();screen.focus({preventScroll:true});perform(b.dataset.action);});b.addEventListener('click',e=>{if(performance.now()-touchAt<500)e.stopImmediatePropagation();},true);}
$('aim-zone').addEventListener('pointerdown',e=>{if(!canPlay())return;screen.focus({preventScroll:true});look={id:e.pointerId,x:e.clientX,y:e.clientY,moved:false,type:e.pointerType};e.currentTarget.setPointerCapture(e.pointerId);if(e.pointerType==='touch'){const r=screen.getBoundingClientRect();moveAim((e.clientX-r.left)/r.width,(e.clientY-r.top)/r.height);}});
$('aim-zone').addEventListener('pointermove',e=>{if(!canPlay())return;const r=screen.getBoundingClientRect();if(e.pointerType==='mouse'){moveAim((e.clientX-r.left)/r.width,(e.clientY-r.top)/r.height);if(look&&Math.hypot(e.clientX-look.x,e.clientY-look.y)>6)look.moved=true;}else if(look?.id===e.pointerId){moveAim(aim.x+(e.clientX-look.x)/r.width,aim.y+(e.clientY-look.y)/r.height);look.x=e.clientX;look.y=e.clientY;look.moved=true;}});
$('aim-zone').addEventListener('pointerup',e=>{if(look?.id!==e.pointerId)return;const click=look.type==='mouse'&&!look.moved;look=undefined;if(click&&phase.value==='strike')perform('sling');});
for(const name of['pointercancel','lostpointercapture'])$('aim-zone').addEventListener(name,()=>{look=undefined;});
window.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey||e.target instanceof HTMLInputElement||e.target instanceof HTMLSelectElement||e.target instanceof HTMLTextAreaElement||!screen.contains(document.activeElement))return;
 const dir=movementKeys[e.code],action=actionKeys[e.code];if(!dir&&!action&&e.code!=='Escape'&&!['KeyI','KeyJ','KeyK','KeyL'].includes(e.code))return;e.preventDefault();
 if(e.code==='Escape'){if(!e.repeat)perform('pause');return;}if(!canPlay())return;
 if(dir){held.set('key:'+e.code,directions[dir]);return;}if(['KeyI','KeyJ','KeyK','KeyL'].includes(e.code)){held.set('aim:'+e.code,{x:e.code==='KeyL'?1:e.code==='KeyJ'?-1:0,z:e.code==='KeyK'?1:e.code==='KeyI'?-1:0});return;}if(!e.repeat)perform(action);
});
window.addEventListener('keyup',e=>{held.delete('key:'+e.code);held.delete('aim:'+e.code);});
window.addEventListener('blur',()=>{if(!paused)setPaused(true);else clearInputs();});document.addEventListener('visibilitychange',()=>{if(document.hidden)setPaused(true);});
$('pause').addEventListener('click',()=>{setPaused(!paused);screen.focus({preventScroll:true});});$('resume').addEventListener('click',()=>{setPaused(false);screen.focus({preventScroll:true});});
phase.addEventListener('change',()=>setPhase(phase.value));movementMode.addEventListener('change',()=>{clearInputs();keys.hidden=movementMode.value==='stick';stick.hidden=movementMode.value!=='stick';$('move-label').textContent=movementMode.value==='stick'?'Move · left thumb':'Move · WASD / arrows';});
$('key-style').addEventListener('change',()=>{const letters=$('key-style').value==='wasd'?['W','A','S','D']:['↑','←','↓','→'];[...keys.querySelectorAll('kbd')].forEach((k,i)=>k.textContent=letters[i]);});
for(const b of document.querySelectorAll('button[data-device]'))b.addEventListener('click',()=>{clearInputs();screen.dataset.device=b.dataset.device;for(const peer of document.querySelectorAll('button[data-device]'))peer.setAttribute('aria-pressed',String(peer===b));movementMode.value=b.dataset.device==='desktop'?'keys':'stick';movementMode.dispatchEvent(new Event('change'));placeAim();});
function frame(now){const dt=Math.min(.05,(now-previous)/1000);previous=now;if(!paused){for(const[k,v]of cooldowns)cooldowns.set(k,Math.max(0,v-dt));let ax=0,ay=0;for(const[k,v]of held)if(k.startsWith('aim:')){ax+=v.x;ay+=v.z;}if(ax||ay)moveAim(aim.x+ax*dt*.5,aim.y+ay*dt*.5);
 if(animation){animation.time+=dt;const p=Math.min(1,animation.time/animation.duration),w=screen.clientWidth,h=screen.clientHeight,tx=parseFloat(screen.dataset.targetX)*w,ty=parseFloat(screen.dataset.targetY)*h;
  $('action-arc').setAttribute('viewBox',`0 0 ${w} ${h}`);$('action-arc').dataset.active='true';$('arc-path').setAttribute('d',animation.action==='jump-shot'||animation.action==='sling'?`M ${w*.5} ${h*.67} Q ${w*.55} ${h*.32} ${tx} ${ty}`:animation.action==='jump'?`M ${w*.49} ${h*.75} Q ${w*.53} ${h*.46} ${w*.55} ${h*.75}`:`M ${w*.50} ${h*.77} Q ${w*.42} ${h*.73} ${w*.36} ${h*.77}`);if(p===1){animation=undefined;delete $('action-arc').dataset.active;$('action-tag').hidden=true;}}
 }
 const v=inputVector(),moving=Math.hypot(v.x,v.z)>.05;screen.dataset.moveX=String(v.x);screen.dataset.moveZ=String(v.z);$('move-feedback').toggleAttribute('data-active',moving);$('move-feedback').textContent=Math.abs(v.x)>.3?(v.x<0?'←':'→'):(v.z>0?'↑':'↓');
 for(const b of keys.querySelectorAll('[data-move]')){const d=directions[b.dataset.move];b.toggleAttribute('data-pressed',moving&&(d.x?v.x*d.x>.3:v.z*d.z>.3));}
 const label=moving?`Movement preview · ${v.x<-.3?'left ':v.x>.3?'right ':''}${v.z>.3?'forward':v.z<-.3?'backward':''}`:'';if(label&&label!==lastMoveLabel)say(label);lastMoveLabel=label;updateActions();requestAnimationFrame(frame);
}
new ResizeObserver(()=>{clearInputs();placeAim();}).observe(screen);$('scene-image').addEventListener('load',placeAim);fetch('scene-target.json').then(r=>r.json()).then(data=>{head=data.target;placeAim();}).catch(()=>placeAim());setPhase('defend');placeAim();requestAnimationFrame(frame);
