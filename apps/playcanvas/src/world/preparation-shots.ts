import type {ValleyShot} from './valley-shots';
import type {AudienceScore} from '../gameplay/saul-audience-score';
export type PreparationCue='audience'|'fitting'|'decline'|'brook'|'pickup'|'ready';
export function preparationShot(kind:PreparationCue,t:number,position:{x:number;z:number},score?:AudienceScore):ValleyShot{
  if(kind==='audience'){
    // Keep the camera on the same side of the David–Saul eyeline. Each move
    // settles before the next line; close-ups preserve eye level and headroom.
    if(t<5)return{id:'pavilion-wide',eye:[3.05-t*.045,2.10-t*.025,3.65-t*.07],focus:[.05,1.08,-.35],fov:51-t*.35};
    if(!score)throw new Error('Audience camera needs its recording-derived score');
    if(t<score.concernStart-.25)return{id:'audience-two-shot',eye:[.20+(t-5)*.02,1.72,1.82-(t-5)*.025],focus:[.46,1.48,-1.0],fov:48};
    if(t<score.answerStart-.35)return{id:'saul-concern',eye:[1.02,1.82,.76-(t-score.concernStart)*.025],focus:[.70,1.65,-1.2],fov:37};
    if(t<score.answerEnd+.35)return{id:'david-resolve',eye:[.78-(t-score.answerStart)*.012,1.58,-.18+(t-score.answerStart)*.006],focus:[-.65,1.39,.65],fov:37-(t-score.answerStart)*.12};
    if(t<score.guardEnd+.35)return{id:'guard-reaction',eye:[-.80,1.78,-.35],focus:[-2.8,1.52,-2.7],fov:38};
    if(t<score.blessingStart)return{id:'saul-listens',eye:[1.02,1.80,.63],focus:[.70,1.65,-1.2],fov:36};
    return{id:'saul-blessing',eye:[2.55-(t-score.blessingStart)*.025,1.90,2.5-(t-score.blessingStart)*.025],focus:[.02,1.38,-.30],fov:44};
  }
  if(kind==='fitting'){
    if(t<4)return{id:'armour-offered',eye:[-.9,2.0,2.7],focus:[1.15,1.3,.25],fov:46};
    if(t<8.5)return{id:'helmet-and-coat-fitted',eye:[2.85,1.8,2.55],focus:[1.1,1.45,1.2],fov:45};
    if(t<12.5)return{id:'trial-steps',eye:[-1.3,1.9,3.9],focus:[1.1,1.0,1.6],fov:46};
    return{id:'unfamiliar-armour',eye:[2.3,1.65,.25],focus:[1.1,1.43,1.2],fov:41};
  }
  if(kind==='decline'){
    if(t<4.5)return{id:'david-declines',eye:[2.3,1.65,.25],focus:[1.1,1.43,1.2],fov:41};
    if(t<10)return{id:'equipment-removed',eye:[-.5,1.9,3.5],focus:[1.65,1.05,.8],fov:46};
    return{id:'saul-sends-david',eye:[-.95,1.94,.25],focus:[.64,1.82,-1.17],fov:35};
  }
  if(kind==='brook')return{id:'brook-arrival',eye:[-5.0+t*.12,3.2,5.7],focus:[-.4,.65,-.4],fov:49};
  if(kind==='pickup')return{id:'stone-to-bag',eye:[position.x-1.3,1.25,position.z-.9],focus:[position.x,.42,position.z-.15],fov:51};
  return{id:'ready-with-the-sling',eye:[1.2,1.65,.05],focus:[0,1.43,1.55],fov:42};
}
