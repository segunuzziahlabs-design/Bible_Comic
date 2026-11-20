type Line = { id: string; duration: number; phrases?: Array<{ start: number; end: number }> };
export function createAudienceScore(lines: readonly Line[]) {
  function line(id: string) { const found=lines.find(l=>l.id===id); if(!found||!Number.isFinite(found.duration)||found.duration<=0)throw new Error(`Missing audience recording ${id}`);return found; }
  const concern=line('saul-concern'),answer=line('david-answer'),blessing=line('saul-blessing');
  const concernStart=8,concernEnd=concernStart+concern.duration;
  const answerStart=concernEnd+.8,answerEnd=answerStart+answer.duration;
  const guardStart=answerEnd+.75,guardEnd=guardStart+1.5;
  const blessingStart=answerEnd+3.8,blessingEnd=blessingStart+blessing.duration;
  const acknowledgeStart=blessingEnd+.2,acknowledgeEnd=acknowledgeStart+1.5;
  const duration=Math.max(30,blessingEnd+4.4);
  return {concernStart,concernEnd,answerStart,answerEnd,guardStart,guardEnd,blessingStart,blessingEnd,acknowledgeStart,acknowledgeEnd,duration,
    faithStart:answerStart+(answer.phrases?.[1]?.start??answer.duration*.35),
    timeline:[{id:concern.id,start:concernStart},{id:answer.id,start:answerStart},{id:blessing.id,start:blessingStart}],
  };
}
export type AudienceScore = ReturnType<typeof createAudienceScore>;

/** Authored nonverbal beats derived from the final recordings, not frame counts. */
export function audienceReaction(time: number, score: AudienceScore) {
  const ease=(v:number)=>{const p=Math.max(0,Math.min(1,v));return p*p*(3-2*p);};
  const nod=(start:number,length:number,degrees:number)=>{const p=(time-start)/length;return p>0&&p<1?Math.sin(p*Math.PI*2)*Math.sin(p*Math.PI)*degrees:0;};
  const acceptance=ease((time-score.faithStart)/Math.max(1,score.answerEnd-score.faithStart));
  return {
    davidNod:nod(score.concernEnd-.7,1.35,1.8),
    saulNod:nod(score.answerEnd+.1,1.7,2.8),
    guardNod:nod(score.guardStart+.1,1.2,.8),
    saulBrow:.38-(acceptance*.24),saulSmile:acceptance*.16,
    davidBrow:time>=score.answerStart&&time<score.answerEnd?.25:.13,
    davidSmile:time>=score.blessingStart?.10:.035,
  };
}
