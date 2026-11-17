import lines from '../assets/challenge-dialogue/dialogue.json';
import summon from '../assets/challenge-dialogue/summon.wav?url';
import terms from '../assets/challenge-dialogue/terms.wav?url';
import defiance from '../assets/challenge-dialogue/defiance.wav?url';
import fallBack from '../assets/challenge-dialogue/fall-back.wav?url';
import fear from '../assets/challenge-dialogue/fear.wav?url';
import question from '../assets/challenge-dialogue/david-question.wav?url';
import rebuke from '../assets/challenge-dialogue/eliab-rebuke.wav?url';
import answer from '../assets/challenge-dialogue/david-answer.wav?url';
import report from '../assets/challenge-dialogue/report-to-saul.wav?url';
import {createSceneSpeech} from './scene-speech';
export const arrivalDuration=8,challengeDuration=30,exchangeDuration=28;
export function createChallengeAudio(){return createSceneSpeech(lines,{summon,terms,defiance,'fall-back':fallBack,fear,'david-question':question,'eliab-rebuke':rebuke,'david-answer':answer,'report-to-saul':report},
  {challenge:[{id:'summon',start:2},{id:'fall-back',start:7.7},{id:'terms',start:10.6},{id:'fear',start:16},{id:'defiance',start:18.6}],
    exchange:[{id:'david-question',start:2},{id:'eliab-rebuke',start:7},{id:'david-answer',start:14.5},{id:'report-to-saul',start:20}]},[],7);}
