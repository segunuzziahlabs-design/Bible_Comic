import { Vec3, type CameraComponent } from 'playcanvas';
import './objective-guide.css';
import { routeAhead, type RoutePoint } from '../gameplay/route-path';

/** One guide projects each coordinator's real interaction target, never a second objective state. */
export function mountObjectiveGuide(stage: HTMLElement, canvas: HTMLCanvasElement) {
  const pin = document.createElement('div'); pin.className = 'destination-guide'; pin.hidden = true;
  const arrow = document.createElement('span'); arrow.className = 'destination-arrow'; arrow.textContent = '◆';
  const label = document.createElement('strong'), action = document.createElement('small');
  pin.append(arrow, label, action); stage.append(pin);
  const route=document.createElement('div');route.className='walking-route';route.hidden=true;route.setAttribute('aria-hidden','true');
  const chevrons=Array.from({length:7},()=>{const e=document.createElement('span');e.textContent='➤';route.append(e);return e;});stage.append(route);
  const a=new Vec3(),b=new Vec3(),screenB=new Vec3();
  const screen = new Vec3(), delta = new Vec3();
  let lastLabel = '';
  return {
    hide() { pin.hidden = route.hidden = true; },
    update(camera: CameraComponent, player: Vec3, target: Vec3, title: string, prompt: string, visible: boolean, path?: readonly RoutePoint[]) {
      pin.hidden = route.hidden = !visible; if (!visible) return;
      const w = canvas.clientWidth, h = canvas.clientHeight;
      const points=routeAhead(player,path??[{x:player.x,y:target.y-.8,z:player.z},{x:target.x,y:target.y-.8,z:target.z}]);
      route.dataset.points=JSON.stringify(points);
      chevrons.forEach((e,i)=>{const p=points[i],next=points[i+1]??target;if(!p){e.hidden=true;return;}a.set(p.x,p.y+.10,p.z);b.set(next.x,next.y+.10,next.z);camera.worldToScreen(a,screen);camera.worldToScreen(b,screenB);const forward=delta.sub2(a,camera.entity.getPosition()).dot(camera.entity.forward)>0;e.hidden=!forward||screen.x<24||screen.x>w-24||screen.y<40||screen.y>h-75;if(!e.hidden){e.style.left=`${screen.x}px`;e.style.top=`${screen.y}px`;e.style.transform=`translate(-50%,-50%) rotate(${Math.atan2(screenB.y-screen.y,screenB.x-screen.x)}rad)`;}});
      camera.worldToScreen(target, screen);
      const behind = delta.sub2(target, camera.entity.getPosition()).dot(camera.entity.forward) <= 0;
      let dx = screen.x - w / 2, dy = screen.y - h / 2;
      if (behind) { dx = -dx; dy = Math.abs(dy) + h / 2; }
      const x = Math.max(76, Math.min(w - 76, w / 2 + dx));
      const y = Math.max(65, Math.min(h - Math.min(136, h * .35), h / 2 + dy));
      const offscreen = behind || Math.abs(x - screen.x) > 2 || Math.abs(y - screen.y) > 2;
      arrow.textContent = '➤';
      arrow.style.transform = `rotate(${offscreen?Math.atan2(dy,dx):-Math.PI/2}rad)`;
      pin.toggleAttribute('data-offscreen', offscreen);
      pin.style.left = `${x}px`; pin.style.top = `${y}px`;
      if (title !== lastLabel) { label.textContent = title; lastLabel = title; }
      const detail=`${Math.round(Math.hypot(target.x-player.x,target.z-player.z))} m · ${prompt}`;if(action.textContent!==detail)action.textContent=detail;
    },
  };
}
