import lines from '../assets/camp-dialogue/dialogue.json';
import deliveryDavid from '../assets/camp-dialogue/delivery-david.wav?url';
import deliveryKeeper from '../assets/camp-dialogue/delivery-keeper.wav?url';
import directionsDavid from '../assets/camp-dialogue/directions-david.wav?url';
import directionsKeeper from '../assets/camp-dialogue/directions-keeper.wav?url';
import greetingEliab from '../assets/camp-dialogue/greeting-eliab.wav?url';
import greetingDavid from '../assets/camp-dialogue/greeting-david.wav?url';
import answerEliab from '../assets/camp-dialogue/answer-eliab.wav?url';
import answerDavid from '../assets/camp-dialogue/answer-david.wav?url';
import hold from '../assets/valley-dialogue/hold.wav?url';
import ready from '../assets/valley-dialogue/ready.wav?url';
import {createSceneSpeech} from './scene-speech';
export const deliveryDuration=30,greetingDuration=26,arrivalDuration=8;
export const deliveryActionStart=13,deliveryRelease=deliveryActionStart+42/24;
export function createCampAudio(){return createSceneSpeech(lines,{
  'delivery-david':deliveryDavid,'delivery-keeper':deliveryKeeper,'directions-david':directionsDavid,'directions-keeper':directionsKeeper,
  'greeting-eliab':greetingEliab,'greeting-david':greetingDavid,'answer-eliab':answerEliab,'answer-david':answerDavid,hold,ready,
},{delivery:[{id:'delivery-david',start:3},{id:'delivery-keeper',start:9},{id:'directions-david',start:18},{id:'directions-keeper',start:22}],
  greeting:[{id:'greeting-eliab',start:2},{id:'greeting-david',start:7},{id:'answer-eliab',start:15},{id:'answer-david',start:22}]},['hold','ready']);}
