const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const origin=process.argv[3]||'http://127.0.0.1:4188',out=path.resolve(process.argv[4]||'docs/implementation/evidence/controls-polish-2026-11-12');fs.mkdirSync(out,{recursive:true});
const prep=p=>p.locator('canvas').evaluate(el=>JSON.parse(el.dataset.preparation));
const battle=p=>p.locator('canvas').evaluate(el=>JSON.parse(el.dataset.movement));
const run=p=>p.locator('canvas').evaluate(el=>JSON.parse(el.dataset.duel).run);
const wait=(p,fn,arg,timeout=50000)=>p.waitForFunction(fn,arg,{timeout});
const capture=(p,name)=>p.screenshot({path:path.join(out,name+'.png'),scale:'css'});
async function hook(p){const errors=[];p.on('pageerror',e=>{errors.push(e.stack);console.error(e.stack);});await p.addInitScript(()=>{globalThis[Symbol.for('playcanvas.inspector')]={register(app){window.controlsApp=app;}};});return errors;}
async function point(p,x,y){const b=await p.locator('canvas').boundingBox();await p.mouse.move(b.x+b.width*x,b.y+b.height*y);}
async function target(p,practice){if(practice){const s=await prep(p);await point(p,s.targetScreen.x,s.targetScreen.y);}else{const at=await p.locator('canvas').evaluate(el=>{const s=JSON.parse(el.dataset.movement),camera=window.controlsApp.root.findByName('Follow camera').camera,target=camera.entity.getPosition().clone().set(s.battle.target.x,s.battle.target.y,s.battle.target.z),screen=camera.worldToScreen(target);return{x:screen.x/el.clientWidth,y:screen.y/el.clientHeight};});await point(p,at.x,at.y);}}
async function clickView(p){await p.mouse.down();await p.mouse.up();}
async function approach(p){await p.keyboard.down('w');await wait(p,()=>JSON.parse(document.querySelector('canvas').dataset.movement).battle.phase==='challenge');await p.keyboard.up('w');await wait(p,()=>JSON.parse(document.querySelector('canvas').dataset.movement).battle.phase==='fight');}
module.exports={assert,fs,path,origin,out,prep,battle,run,wait,capture,hook,point,target,clickView,approach};
