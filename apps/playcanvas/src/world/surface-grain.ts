import {Texture,type Application} from 'playcanvas';
const cache=new WeakMap<Application,Texture>();
/** One original, mipmapped detail texture per scene; no external download. */
export function surfaceGrain(app:Application){let texture=cache.get(app);if(texture)return texture;
  const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const ctx=canvas.getContext('2d')!,pixels=ctx.createImageData(128,128);let seed=1961;
  for(let y=0;y<128;y++)for(let x=0;x<128;x++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const c=222+(seed/4294967296)*24+5*Math.sin(x*.19)*Math.cos(y*.23);pixels.data.set([c,c,c,255],(y*128+x)*4);}
  ctx.putImageData(pixels,0,0);texture=new Texture(app.graphicsDevice,{name:'Original earth and plaster grain',mipmaps:true});texture.setSource(canvas);texture.anisotropy=2;cache.set(app,texture);app.once('destroy',()=>texture!.destroy());return texture;
}
