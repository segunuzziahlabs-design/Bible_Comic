const assert=require('node:assert/strict');

/** Real browser inputs only. Coordinates are derived from rendered controls/state. */
async function createDriver(context,page,touch){
  const cdp=await context.newCDPSession(page),points=new Map(),keys=new Set();let stick;
  const centre=b=>({x:b.x+b.width/2,y:b.y+b.height/2});
  const send=type=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:[...points].map(([id,p])=>({id,...p}))});
  page.on('framenavigated',frame=>{if(frame===page.mainFrame()){points.clear();keys.clear();stick=undefined;}});
  async function start(id,at){points.set(id,at);await send('touchStart');}
  async function move(id,at){points.set(id,at);await send('touchMove');}
  async function end(id){if(!points.has(id))return;const at=points.get(id);points.delete(id);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:points.size?[{id,...at}]:[]});}
  async function tap(selector){const button=page.locator(selector);await button.waitFor({state:'visible',timeout:60000});await page.waitForFunction(selector=>{const e=document.querySelector(selector);return e&&!e.disabled;},selector,{timeout:15000});assert(await button.isEnabled(),selector+' is disabled');const box=await button.boundingBox();assert(box.width>=43&&box.height>=43,'Unreachable target '+selector+': '+JSON.stringify(box));const at=centre(box),clear=await button.evaluate((e,at)=>e.contains(document.elementFromPoint(at.x,at.y)),at);assert(clear,selector+' is covered');if(touch){await start(2,at);await end(2);}else await button.click();}
  async function release(){if(touch){await end(1);stick=undefined;}else{for(const key of keys)await page.keyboard.up(key);keys.clear();}}
  async function direction(x,forward){if(touch){if(!points.has(1)){stick=centre(await page.locator('#move-pad').boundingBox());await start(1,stick);}await move(1,{x:stick.x+x*42,y:stick.y-forward*42});}else{const desired=new Set([...(Math.abs(x)>.15?[x>0?'d':'a']:[]),...(Math.abs(forward)>.15?[forward>0?'w':'s']:[])]);for(const key of keys)if(!desired.has(key)){await page.keyboard.up(key);keys.delete(key);}for(const key of desired)if(!keys.has(key)){await page.keyboard.down(key);keys.add(key);}}}
  async function aim(name,x,y){const box=await page.locator('canvas').boundingBox();if(touch){const state=await page.locator('canvas').evaluate((e,n)=>JSON.parse(e.dataset[n]),name),current=state.battle??state,at={x:box.x+box.width*.55,y:box.y+box.height*.42};await start(3,at);await move(3,{x:at.x+(x-current.aimX)*box.width,y:at.y+(y-current.aimY)*box.height});await end(3);}else await page.mouse.move(box.x+x*box.width,box.y+y*box.height);}
  async function action(name){if(touch)await tap({interact:'#battle-interact',jump:'#jump',dodge:'#dodge',sling:'#throw-stone',jumpShot:'#jump-shot',practiceThrow:'#throw'}[name]);else await page.keyboard.press({interact:'e',jump:'Space',dodge:'Shift',sling:'f',jumpShot:'q',practiceThrow:'f'}[name]);}
  return{tap,direction,release,aim,action,cdp,touch};
}

module.exports={createDriver};
