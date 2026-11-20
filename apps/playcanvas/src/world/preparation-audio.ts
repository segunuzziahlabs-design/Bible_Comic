import audience from '../assets/saul-performance-dialogue/dialogue.json';
import concern from '../assets/saul-performance-dialogue/saul-concern.wav?url';
import answer from '../assets/saul-performance-dialogue/david-answer.wav?url';
import blessing from '../assets/saul-performance-dialogue/saul-blessing.wav?url';
import {createAudienceScore} from '../gameplay/saul-audience-score';
import lines from '../assets/preparation-dialogue/dialogue.json';
import offer from '../assets/preparation-dialogue/armour-offer.wav?url';
import heavy from '../assets/preparation-dialogue/armour-heavy.wav?url';
import decline from '../assets/preparation-dialogue/armour-decline.wav?url';
import release from '../assets/preparation-dialogue/saul-release.wav?url';
import arrival from '../assets/preparation-dialogue/brook-arrival.wav?url';
import first from '../assets/preparation-dialogue/stones-first.wav?url';
import five from '../assets/preparation-dialogue/stones-five.wav?url';
import ready from '../assets/preparation-dialogue/practice-ready.wav?url';
import {createSceneSpeech} from './scene-speech';
export const audienceScore=createAudienceScore(audience);
export const audienceDuration=audienceScore.duration,fittingDuration=18,declineDuration=16,brookDuration=7,pickupDuration=5,readyDuration=4.5;
export async function createPreparationAudio(){
  const audio=await createSceneSpeech([...audience,...lines],{'saul-concern':concern,'david-answer':answer,'saul-blessing':blessing,'armour-offer':offer,'armour-heavy':heavy,'armour-decline':decline,'saul-release':release,'brook-arrival':arrival,'stones-first':first,'stones-five':five,'practice-ready':ready},
    {audience:audienceScore.timeline,fitting:[{id:'armour-offer',start:2},{id:'armour-heavy',start:12}],decline:[{id:'armour-decline',start:1},{id:'saul-release',start:10}],brook:[{id:'brook-arrival',start:1.2}],pickup:[],first:[{id:'stones-first',start:.8}],fifth:[{id:'stones-five',start:.8}],ready:[{id:'practice-ready',start:.7}]},[],3,{cinematicDialogue:['audience']});
  const context=audio.context,buffer=context.createBuffer(1,context.sampleRate*3,context.sampleRate);const data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*.11;
  const water=context.createBufferSource();water.buffer=buffer;water.loop=true;const filter=context.createBiquadFilter();filter.type='lowpass';filter.frequency.value=1800;const gain=context.createGain();gain.gain.value=0;water.connect(filter);filter.connect(gain);gain.connect(context.destination);water.start();let brook=false,muted=false;
  return{...audio,audienceScore,setBrook(value:boolean){brook=value;},mute(value:boolean){muted=value;audio.mute(value);gain.gain.setValueAtTime(value ? 0 : brook ? .11 : 0,context.currentTime);},
    update(...args:Parameters<typeof audio.update>){audio.update(...args);gain.gain.setTargetAtTime(!muted&&brook ? (audio.lineAt() ? .04 : .11) : 0,context.currentTime,.25);},
    dispose(){water.stop();filter.disconnect();gain.disconnect();audio.dispose();}};
}
