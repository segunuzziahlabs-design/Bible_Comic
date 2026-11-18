/** Test driver only: calculate a ballistic direction, then apply it through the
 * ordinary mouse/touch reticle. No game state is modified or auto-aim installed. */
async function aimBallisticForehead(page,driver){
  await page.waitForTimeout(1100);
  const aim=await page.locator('canvas').evaluate(el=>{
    const s=JSON.parse(el.dataset.movement),app=window.battleTestApp??window.integrationApp;
    const camera=app.root.findByName('Follow camera').camera,origin=s.battle.guidance.points[0],head=s.battle.target;
    const speed=13.5,gravity=9.81,dx=head.x-origin.x,dz=head.z-origin.z,range=Math.hypot(dx,dz),dy=head.y-origin.y;
    const discriminant=speed**4-gravity*(gravity*range*range+2*dy*speed*speed);
    if(discriminant<0)throw Error('Forehead physically out of range');
    const tangent=(speed*speed-Math.sqrt(discriminant))/(gravity*range),horizontal=1/Math.sqrt(1+tangent*tangent);
    const direction={x:dx/range*horizontal,y:tangent*horizontal,z:dz/range*horizontal},forward=camera.entity.forward;
    const t=((head.x-origin.x)*forward.x+(head.y-origin.y)*forward.y+(head.z-origin.z)*forward.z)/(direction.x*forward.x+direction.y*forward.y+direction.z*forward.z);
    const point=camera.worldToScreen(camera.entity.getPosition().clone().set(origin.x+direction.x*t,origin.y+direction.y*t,origin.z+direction.z*t));
    return{x:point.x/el.clientWidth,y:point.y/el.clientHeight};
  });
  await driver.aim('movement',aim.x,aim.y);
  await page.waitForFunction(()=>JSON.parse(document.querySelector('canvas').dataset.movement).battle.aimed,undefined,{timeout:5000});
}
module.exports={aimBallisticForehead};
