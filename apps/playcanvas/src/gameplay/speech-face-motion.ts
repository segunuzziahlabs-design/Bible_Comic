/** Restrained jaw/rounding for the audience close-ups. The audio clock owns the
 * filter so pause/resume cannot run the face ahead of the recording. */
export function createSpeechFaceMotion() {
  let previous=0,open=0,round=0;
  function reset(clock:number){previous=clock;open=round=0;}
  function step(target:readonly number[],clock:number):[number,number]{
    const dt=Math.min(.05,Math.max(0,clock-previous));previous=clock;
    const toOpen=Math.max(0,Math.min(1,target[0]))*.72,toRound=Math.max(0,Math.min(1,target[1]))*.8;
    open+=(toOpen-open)*(1-Math.exp(-dt/(toOpen>open?.025:.03)));
    round+=(toRound-round)*(1-Math.exp(-dt/(toRound>round?.025:.03)));
    return [open,round];
  }
  return{reset,step};
}
