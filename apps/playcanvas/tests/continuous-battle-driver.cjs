const assert=require('node:assert/strict');
const sample=p=>p.locator('canvas').evaluate(e=>JSON.parse(e.dataset.movement));
const wait=(p,fn,timeout=30000)=>p.waitForFunction(fn,undefined,{timeout});
async function evadeNextSpear(page,driver){
 await wait(page,()=>{const s=JSON.parse(document.querySelector('canvas').dataset.movement);return s.battle.phase==='fight'&&s.battle.attack==='windup'&&s.battle.attackTime>.45;});
 await driver.direction(1,0);await driver.action('dodge');await page.waitForTimeout(130);await driver.release();
 await wait(page,()=>{const s=JSON.parse(document.querySelector('canvas').dataset.movement);return s.battle.phase==='defeat'||s.battle.attack==='recover';});assert.equal((await sample(page)).battle.phase,'fight');
}
async function walkTarget(page,driver){
 for(let i=0;i<220;i++){const s=await sample(page),target=s.aftermathTarget,dx=target.x-s.x,dz=target.z-s.z,r=Math.hypot(dx,dz);if(r<.65)break;const a=s.yaw;await driver.direction((dx*Math.cos(a)-dz*Math.sin(a))/r,(-dx*Math.sin(a)-dz*Math.cos(a))/r);await page.waitForTimeout(65);}await driver.release();await page.waitForTimeout(200);assert((await sample(page)).canInteract);
}
async function completeAftermath(page,driver){
 await wait(page,()=>JSON.parse(document.querySelector('canvas').dataset.movement).battle.phase==='retrieve');
 await walkTarget(page,driver);await driver.action('interact');
 await wait(page,()=>JSON.parse(document.querySelector('canvas').dataset.movement).battle.phase==='finish_approach');
 await walkTarget(page,driver);await driver.action('interact');await wait(page,()=>JSON.parse(document.querySelector('canvas').dataset.movement).battle.phase==='finish_ready');
 await page.waitForTimeout(300);assert.equal((await sample(page)).battle.phase,'finish_ready');await swingSword(page,driver);
 await page.locator('#review-gate').waitFor({timeout:20000});
}
async function swingSword(page,driver){
 if(!driver.touch){await page.keyboard.down('e');try{await wait(page,()=>JSON.parse(document.querySelector('canvas').dataset.movement).battle.swordSwing>=1);}finally{await page.keyboard.up('e');}return;}
 const box=await page.locator('#sword-grip').boundingBox(),stage=await page.locator('.stage').boundingBox();
 const x=box.x+box.width/2,y=box.y+box.height/2,travel=Math.min(130,Math.max(64,stage.height*.23));
 await driver.cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:8,x,y}]});
 try{for(let i=1;i<=24;i++){await driver.cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{id:8,x,y:y+travel*i/24+2}]});await page.waitForTimeout(80);}await wait(page,()=>JSON.parse(document.querySelector('canvas').dataset.movement).battle.swordSwing>=1);}finally{await driver.cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
}
module.exports={evadeNextSpear,walkTarget,completeAftermath,swingSword};
