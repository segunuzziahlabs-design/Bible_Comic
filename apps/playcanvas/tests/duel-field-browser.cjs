const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require(process.argv[2]);
const {open, read, wait, evasion, capture} = require('./cinematic-battle-browser.cjs');
const {duelField, duelCameraField} = require('../src/gameplay/duel-field.ts');
const out = path.resolve(process.argv[4]);
const layout = process.argv[5] || 'desktop';

async function run() {
  const browser = await chromium.launch({channel:'chrome', args:['--autoplay-policy=user-gesture-required']});
  let test;
  try {
    test = await open(browser, layout);
    const {p, driver} = test;
    const ranks = await p.evaluate(() => {
      const {root} = window.battleTestApp;
      function formation(name) {
        const soldier = root.findByName(name);
        const mesh = soldier.findComponents('render')[0].meshInstances[0];
        const {count, vertexBuffer} = mesh.instancingData;
        const matrices = new Float32Array(vertexBuffer.storage);
        return Array.from({length: count}, (_,i) => matrices[i*16+12]);
      }
      return {israel:formation('Israelite ranks'), philistines:formation('Philistine ranks'),
        boundary:root.findByName('Duel field boundary stones').enabled,
        soldiers:['Patrolling soldier','Sentinel','Champion’s shield-bearer'].map(name => root.findByName(name).getPosition().x)};
    });
    assert(ranks.boundary);
    assert.equal(ranks.israel.length,24); assert.equal(ranks.philistines.length,24);
    assert(ranks.israel.every(x=>x<duelCameraField.minX));
    assert(ranks.philistines.every(x=>x>duelCameraField.maxX));
    assert(ranks.soldiers.every(x=>Math.abs(x)>duelField.maxX));
    await wait(p,s=>s.presentation.soundscape.side==='philistines');
    await capture(test,'philistine-reaction');
    await evasion(test,0,'back');
    await wait(p,s=>s.presentation.soundscape.side==='israel');
    await evasion(test,1,'right'); await evasion(test,2,'left');
    await wait(p,s=>s.battle.attack==='recover'&&s.presentation.soundscape.scoreLevel>=.24);
    const audio = await p.evaluate(()=>window.combatAudio);
    assert.equal(audio.filter(a=>a.loop&&a.duration===12&&a.peak>.2).length,1,'One audible synthesized score loop');
    assert(audio.filter(a=>!a.loop&&a.duration>2.34&&a.duration<2.36&&a.peak>.05).length>=2,'Both crowd reactions reach Web Audio');
    await driver.tap('#sound'); await wait(p,s=>s.presentation.soundscape.output<.01);
    await driver.tap('#sound'); await wait(p,s=>s.presentation.soundscape.output>.75);
    await wait(p,s=>s.battle.attack==='windup'&&s.presentation.soundscape.scoreLevel<.08&&s.presentation.soundscape.crowdLevel<.3);

    let lastDodge = -1;
    async function guard(state) {
      if (state.battle.attack==='windup' && state.battle.attackTime>.45 && state.battle.strikes!==lastDodge && state.dodgeCooldown===0) {
        lastDodge=state.battle.strikes;
        await driver.release(); await driver.action('dodge');
        return true;
      }
      if (state.battle.attack==='strike' || state.battle.attack==='windup' && state.battle.strikes===lastDodge) {
        await driver.release(); return true;
      }
      return false;
    }

    const edges = layout==='desktop' ? [['east',10.7,2],['north',8,-16.8],['west',-10.8,-7],['south',-4,13.6]]
      : layout==='portrait' ? [['east',10.8,2]] : [['west',-10.8,2]];
    const results = [];
    function inside(x,z,field) { return x>=field.minX-.01&&x<=field.maxX+.01&&z>=field.minZ-.01&&z<=field.maxZ+.01; }
    for (const [edge,x,z] of edges) {
      const until = Date.now()+65000;
      let contact;
      while(Date.now()<until) {
        const state = await read(p);
        assert.equal(state.battle.phase,'fight');
        assert(inside(state.x,state.z,duelField),'David inside the duel field');
        assert(inside(state.battle.foe.x,state.battle.foe.z,duelField),'Goliath inside the duel field');
        assert(inside(state.eyeX,state.eyeZ,duelCameraField),'Camera inside its clearance area');
        if(await guard(state)) { await p.waitForTimeout(75); continue; }
        const dx=x-state.x,dz=z-state.z,d=Math.hypot(dx,dz),a=state.yaw;
        await driver.direction((dx*Math.cos(a)-dz*Math.sin(a))/d,(-dx*Math.sin(a)-dz*Math.cos(a))/d);
        const hit = edge==='east' ? state.x>9.68 : edge==='west' ? state.x<-9.68 : edge==='north' ? state.z<-15.68 : state.z>12.48;
        if(hit && state.battle.attack==='recover' && state.battle.attackTime<4) {
          await p.waitForTimeout(250);
          contact=await read(p); await driver.release(); break;
        }
        await p.waitForTimeout(95);
      }
      assert(contact,`Reached ${edge} boundary using normal controls`);
      assert(inside(contact.x,contact.z,duelField));
      const framing = await p.evaluate(() => {
        const {root}=window.battleTestApp,camera=root.findByName('Follow camera').camera,canvas=document.querySelector('canvas');
        return ['David','Goliath'].map(name=>{
          const rootPosition=root.findByName(name).getPosition();
          const torso=rootPosition.clone().set(rootPosition.x,rootPosition.y+(name==='David'?1.05:1.7),rootPosition.z);
          const screen=camera.worldToScreen(torso);
          return {name,distance:torso.distance(camera.entity.getPosition()),x:screen.x/canvas.clientWidth,y:screen.y/canvas.clientHeight,z:screen.z};
        });
      });
      assert(framing.every(p=>p.distance>2&&p.z>0&&p.x>0&&p.x<1&&p.y>0&&p.y<1),`${edge} active camera ${JSON.stringify(framing)}`);
      results.push({edge,david:{x:contact.x,z:contact.z},camera:framing});
      await capture(test,`clearing-${edge}`);
    }
    const flights=await p.evaluate(()=>window.spearFlightAudit);
    assert(!flights.some(f=>f.time>.02&&f.parts.some(part=>!part.enabled||part.z<0||part.x<0||part.x>1||part.y<0||part.y>1)), 'Spear stays framed during perimeter traversal');
    assert.deepEqual(test.errors,[]);
    const result={layout,ranks,edges:results,flights:flights.length,audio};
    fs.writeFileSync(path.join(out,`${layout}-field-results.json`),JSON.stringify(result,null,2));
    console.log(JSON.stringify({layout,edges:results.map(r=>r.edge),flights:flights.length,armyPositionsVerified:true,scoreCheeringAndMute:true}));
  } catch(error) {
    if(test) await capture(test,'field-failure');
    throw error;
  } finally { await browser.close(); }
}
run().catch(error=>{console.error(error.stack);process.exitCode=1;});
