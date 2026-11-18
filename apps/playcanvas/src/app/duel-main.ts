import { checkpointSaved } from './account-game-bootstrap';
import { readEpisodeMuted, writeEpisodeMuted, setEpisodeSoundButton } from './episode-sound';
import { createMovementInput } from '../gameplay/movement-input';
import { contentVersion, currentObjective, episodeId, episodePage, freshRun, objectives, preparation, reduceEpisode, requiresBattleFinish } from '../gameplay/episode-rules';
import { aftermathMovement } from '../gameplay/elah-battle';
import { openEpisodeSession, type EpisodeSaveAdapter } from '../gameplay/episode-session';
import { loadSavedAppearance } from '../world/david-appearance';
import { openMovementArea, type BattleView, type InteractionView } from '../world/movement-area';
import { mountSlingHelp } from './sling-controls-ui';
import { mountPlayerControls } from './player-controls-ui';
import './style.css';
import './movement.css';
import './duel.css';
import './sling-controls.css';

const el = (id: string) => document.getElementById(id)!;
const button = (id: string) => el(id) as HTMLButtonElement;
const text=(id:string,value:string)=>{const node=el(id);if(node.textContent!==value)node.textContent=value;};
const canvas = el('stage') as HTMLCanvasElement, stage = canvas.parentElement!;
const params = new URLSearchParams(location.search), review = params.has('review'), inspect = params.has('inspect');
const input = createMovementInput(canvas, el('move-pad'), true);
let area: Awaited<ReturnType<typeof openMovementArea>> | undefined;
let session: Awaited<ReturnType<typeof openEpisodeSession>>;
let started = false, paused = true, muted = readEpisodeMuted(), busy = false, view: BattleView | undefined;
let retryWrite: (() => Promise<void>) | undefined;
const hasHit = () => session?.run.completed.includes('goliath.struck');
const localStatus = () => review ? 'Chapter 5 preview · Saved episode unchanged' : checkpointSaved();
const help = mountSlingHelp(stage, document.querySelector('.actions')!, true, value => { void pause(value); }, () => paused);

function controls() {
  const live = started && !paused && !busy && !view?.result;
  const cinematic=!!view?.cinematic;
  const moving = live && !!view && (view.phase === 'approach' || view.phase === 'fight'||aftermathMovement(view.phase));
  button('battle-interact').hidden=!moving||!view?.actionPrompt;button('battle-interact').disabled=!view?.canInteract;
  button('battle-interact').textContent=(view?.actionPrompt??'Interact')+' · E';
  stage.toggleAttribute('data-running', moving);
  stage.toggleAttribute('data-aiming', live && view?.phase === 'fight'&&!!view.slingReady);
  el('battle-hud').hidden = !moving;
  el('stone-count').hidden = true;
  el('sling-aim').hidden = button('throw-stone').hidden = cinematic || !live || view?.phase !== 'fight'||!view.slingReady;
  button('throw-stone').disabled = !live || !view?.canThrow;
  button('pause').disabled = button('reset').disabled = !started || busy || !!view?.result;
  button('battle-replay').disabled = busy;
  button('sound').disabled = !started;
  help.button.disabled = !started || busy || !!view?.result;
  button('jump-shot').hidden=cinematic||!live||view?.phase!=='fight'||!view.slingReady;button('jump-shot').disabled=!view?.canJumpShot;
  button('dodge').hidden = cinematic || !live || view?.phase !== 'fight';
  button('dodge').disabled = !view?.dodgeReady;
  button('dodge').textContent = view?.dodgeReady ? (view.slingReady?'Dodge':`Dodge ${view.attackDirection!<0?'← left':'right →'}`) : `Dodge · ${view?.dodgeCooldown?.toFixed(1) ?? '0.0'}s`;
  button('pause').textContent = paused ? 'Resume' : 'Pause';
  el('pause-notice').hidden = !started || !paused || busy || !!view?.result;
  el('instructions').hidden = view?.phase === 'fight'||!!view?.result;el('instructions').textContent=view?.phase==='approach'?(matchMedia('(any-pointer: coarse), (hover: none)').matches?'Move: left controls · Drag to look · Follow the arrows':'Move: WASD / arrows · Drag to look · Follow the arrows'):'Watch the scene · Pause at any time';
  el('battle-instructions').hidden = view?.phase !== 'fight';
  el('spear-guide').hidden=!live||view?.phase!=='fight'||!!view.slingReady&&!(view.attackProgress!>0||view.instruction.startsWith('Incoming'));
  stage.toggleAttribute('data-threat',!el('spear-guide').hidden&&!!view?.slingReady);
  if(view){
    text('combat-stage-label',aftermathMovement(view.phase)?'IV · Goliath’s sword':view.phase==='approach'?'The confrontation':view.combatStage==='sword'?'I · Survive the sword':view.combatStage==='spear'?`II · Survive the spear · ${view.spearEvasions??0}/2`:`III · Dodge and counterattack · ${view.stones} stones`);
    text('spear-guide',view.combatStage==='sword'?'Sword strike · Leave the marked ground':view.slingReady?'Incoming spear · Leave the landing circle':`Spear ${Math.min(2,(view.spearEvasions??0)+1)} of 2 · Watch the landing circle`);
    el('spear-guide').style.setProperty('--attack-progress',`${(view.attackProgress??0)*100}%`);el('spear-guide').toggleAttribute('data-warning',(view.attackProgress??0)>0);
    const aiming=live&&!cinematic&&view.phase==='fight'&&!!view.slingReady;
    el('combat-aim-panel').hidden=!aiming;
    text('position-guidance',`${view.positionHint??'Find your position'}${view.distance!==undefined?' · '+view.distance.toFixed(1)+' m':''}`);
    text('angle-guidance',view.aimHint??'Aim towards the forehead');
    el('combat-aim-panel').toggleAttribute('data-aligned',view.aimed);
    el('forehead-target').hidden=!aiming||!view.foreheadVisible;
    el('forehead-target').style.left=`${(view.foreheadX??.5)*100}%`;el('forehead-target').style.top=`${(view.foreheadY??.3)*100}%`;
    el('forehead-target').toggleAttribute('data-aligned',view.aimed);
  }
  if (inspect && session) canvas.dataset.duel = JSON.stringify({ review, started, paused, muted, busy, run: session.run, inventory: preparation(session.run), objective: currentObjective(session.run)?.id });
}
async function save(operation: () => Promise<void>, done: () => void) {
  if (busy && el('save-error').hidden) return;
  busy = true; area?.setPaused(true); controls(); button('retry-save').disabled = true;
  const attempt = async () => {
    await operation(); retryWrite = undefined; busy = false; el('save-error').hidden = true;
    el('save-status').textContent = localStatus(); done(); controls();
  };
  retryWrite = attempt;
  try { await attempt(); }
  catch (error) { paused = true; area?.setPaused(true); el('save-error').hidden = false;
    el('save-error-message').textContent = error instanceof Error ? error.message : 'The last checkpoint is preserved.';
    button('retry-save').disabled = false; el('save-status').textContent = 'Checkpoint not saved'; controls(); }
}
function gate() {
  paused = true; area?.setPaused(true); el('entry').hidden = true; el('battle-result').hidden = true;
  el('review-gate').hidden = false; el('battle-caption').hidden = true;
  el('review-message').textContent = review ? 'Preview complete. Your saved episode progress is unchanged.' : 'Battle outcome saved. The victory chapter remains ahead.';
  controls();
}
function render(next: InteractionView) {
  if (!next.battle) return;
  const previous = view; view = next.battle;
  const instruction = matchMedia('(any-pointer: coarse), (hover: none)').matches
    ? view.instruction.replace('Dodge (Shift)', 'tap Dodge').replace('Click or F to throw · Shift to dodge', 'Tap Throw · Tap Dodge').replace('Shift / Dodge','Tap Dodge') : view.instruction;text('objective',instruction);
  el('battle-instructions').textContent=matchMedia('(any-pointer: coarse), (hover: none)').matches?(view.slingReady?'Drag to aim · Tap Throw · Dots show the stone’s arc':'Move with the left controls · Hold a direction + Dodge'):(view.slingReady?'Mouse / IJKL: aim · F: Throw · Q: Jump Shot':'WASD / arrows: move · Direction + Shift: Dodge · Space: Jump');
  if(view.cinematic)el('battle-instructions').textContent=view.phase==='finisher'?'The decisive throw · Cinematic replay · Pause any time':'Watch the scene · Pause any time';
  text('stone-count',`${view.stones} ${view.stones === 1 ? 'stone' : 'stones'}`);
  text('battle-caption',view.caption); el('battle-caption').hidden = !view.caption;
  el('sling-aim').style.left = `${view.aimX * 100}%`; el('sling-aim').style.top = `${view.aimY * 100}%`;
  el('sling-aim').toggleAttribute('data-aimed', view.aimed);
  if (session && !busy) {
    if (view.phase === 'fall_checkpoint' && !hasHit()) {
      void save(() => session.commit({ type: 'objective', id: 'goliath.struck' }), () => {
        area?.confirmCheckpoint();paused = document.hidden; area?.setPaused(paused);
      });
    } else if(view.phase==='sword_checkpoint'&&session.run.battle?.stage==='fallen'){
      void save(()=>session.commit({type:'battle',action:'take_sword'}),()=>{area?.confirmCheckpoint();paused=document.hidden;area?.setPaused(paused);});
    } else if(view.phase==='finish_checkpoint'&&session.run.battle?.stage==='sword_taken'){
      void save(()=>session.commit({type:'battle',action:'finish'}),()=>{area?.confirmCheckpoint();paused=document.hidden;area?.setPaused(paused);});
    } else if (view.result === 'defeat' && session.run.status !== 'defeated') {
      void save(() => session.commit({ type: 'defeat', reason: 'david_killed_by_goliath' }), () => {
        paused = true; area?.setPaused(true); button('battle-replay').focus();
      });
    } else if (view.result === 'victory' && hasHit()&&!requiresBattleFinish(session.run)) gate();
  }
  if (view.result === 'defeat') {
    el('battle-result').hidden = false; el('battle-result-title').textContent = 'David fell';
    el('battle-result-detail').textContent = `${view.weaponHit?`Goliath’s ${view.weaponHit} struck David.`:'David was struck by Goliath.'} Your earlier preparation is safe. Retry the sword and spear encounter from the battle checkpoint.`;
    button('battle-replay').textContent = 'Retry Battle';
    if (previous?.result !== 'defeat' && !busy) button('battle-replay').focus();
  } else el('battle-result').hidden = true;
  controls();
  if (inspect && session) canvas.dataset.duel = JSON.stringify({ review, started, paused, muted, busy, run: session.run, inventory: preparation(session.run), objective: currentObjective(session.run)?.id });
}
async function pause(value: boolean) {
  if (!started || busy || view?.result) return;
  paused = value; area?.setPaused(value); controls(); if (!value) canvas.focus();
}
async function restart() {
  if (!area || busy) return;
  if(hasHit()){location.reload();return;}
  area.setPaused(true);
  const reset = () => { paused = document.hidden; area!.reset({ attempt: session.run.attempt }); area!.setPaused(paused); controls(); canvas.focus(); };
  if (session.run.status === 'defeated') await save(async () => {await session.commit({ type: 'retry' });if(!session.run.battle)await session.commit({type:'battle',action:'begin'});}, reset);
  else reset();
}
function throwStone() { if (started && !paused && !busy && area?.throwStone()) canvas.focus(); }
button('enter').addEventListener('click', () => { started = true; el('entry').hidden = true; void pause(false); });
const playerControls=mountPlayerControls(canvas,input,value=>{void pause(value);},()=>paused);
input.bindActions({
  interact:{run:()=>{area?.interact();},available:()=>started&&!paused&&!busy&&!!view?.canInteract},
  jump:{run:()=>{area?.jump();},available:()=>started&&!paused&&!busy&&!!area?.canJump()},
  jumpShot:{run:()=>{area?.jumpShot();},available:()=>started&&!paused&&!busy&&!!view?.canJumpShot},
  sling:{run:throwStone,available:()=>started&&!paused&&!busy&&!!view?.canThrow},
  dodge:{run:()=>{if(area?.dodge())canvas.focus();},available:()=>started&&!paused&&!busy&&!!view?.dodgeReady},
  pause:{run:()=>{void pause(!paused);},available:()=>!button('pause').disabled&&!help.open&&!playerControls.open},
});
input.bindButton(button('pause'),'pause');
input.bindButton(button('battle-interact'),'interact');
button('reset').addEventListener('click', () => { void restart(); });
button('battle-replay').addEventListener('click', () => { void restart(); });
input.bindButton(button('jump-shot'),'jumpShot');input.bindButton(button('throw-stone'),'sling');input.bindButton(button('dodge'),'dodge');
button('sound').addEventListener('click', () => { muted = !muted; writeEpisodeMuted(muted); area?.setMuted(muted); setEpisodeSoundButton(button('sound'),muted); button('sound').setAttribute('aria-pressed', String(!muted)); });
button('retry-save').addEventListener('click', () => { if (!retryWrite) return; button('retry-save').disabled = true; void retryWrite().catch(error => { el('save-error-message').textContent = String(error); button('retry-save').disabled = false; }); });
button('reload-save').addEventListener('click', () => location.reload());
button('retry').addEventListener('click', () => location.reload());
button('replay-chapter').addEventListener('click', () => location.assign('duel.html?review=1' + (inspect ? '&inspect=1' : '')));
button('continue-victory').addEventListener('click', () => { if (hasHit() && !busy&&!requiresBattleFinish(session.run)) location.assign('victory.html' + (review ? '?review=1' : '') + (inspect ? (review ? '&' : '?') + 'inspect=1' : '')); });
window.addEventListener('blur', () => { void pause(true); });
document.addEventListener('visibilitychange', () => { if (document.hidden) void pause(true); });
window.addEventListener('pageshow', event => { if (event.persisted) location.reload(); });
window.addEventListener('storage', event => {
  if (review || event.key !== 'bible-comic.episode.local.v1') return;
  busy = true; paused = true; area?.setPaused(true); controls(); el('save-error').hidden = false;
  el('save-error-message').textContent = 'Progress changed in another tab. Reload its checkpoint.'; button('retry-save').hidden = true; retryWrite = undefined;
});
window.addEventListener('pagehide', () => { area?.dispose(); input.dispose(); }, { once: true });

async function main() {
  let run = freshRun(); for (const objective of objectives.slice(0, 10)) run = reduceEpisode(run, { type: 'objective', id: objective.id });
  let temporary: Awaited<ReturnType<EpisodeSaveAdapter['read']>> = { current: run, history: [] };
  session = await openEpisodeSession(review ? { async read() { return temporary; }, async write(value) { temporary = structuredClone(value); } } : undefined);
  const goal = currentObjective(session.run)?.id;
  if (goal !== 'goliath.struck' && goal !== 'victory.witnessed') { location.replace(episodePage(session.run)); return; }
  if(goal==='goliath.struck'&&!session.run.battle&&session.run.status==='active')await session.commit({type:'battle',action:'begin'});
  area = await openMovementArea(canvas, input, loadSavedAppearance(), render, 'elah', {
    episodeId, contentVersion, preparation: preparation(session.run), attempt: session.run.attempt,
    anchor: hasHit() ? 'battle.aftermath' : 'battle.entry', defeated: session.run.status === 'defeated',
    aftermath:session.run.battle?.stage??'combat',
  }, { chapter: 'duel' });
  area.setMuted(muted); setEpisodeSoundButton(button('sound'),muted);
  button('sound').setAttribute('aria-pressed', String(!muted));
  canvas.dataset.renderer = area.backend;
  el('save-status').textContent = localStatus();
  if (hasHit()&&!requiresBattleFinish(session.run)) { started = true; gate(); }
  else if (session.run.status === 'defeated') { started = true; el('entry').hidden = true; controls(); button('battle-replay').focus(); }
  else {button('enter').textContent=hasHit()?'Resume at Goliath’s sword':session.run.attempt>1?'Resume battle':'Begin Chapter 5';el('entry-message').textContent = hasHit()?'Goliath’s fall is saved. Follow the arrow. Use E / the action button to take his sword, then approach and ready it. Press Finish battle yourself. The final blow is shown off-screen.':`${session.run.attempt>1?'Return to the battle checkpoint.':'Watch David step forward, then approach Goliath.'} Evade the sword, then two spear throws. Move with WASD / arrows or left controls; direction + Shift / Dodge is a quick step. Goliath keeps throwing while you aim and use F / Throw. After his fall, retrieve his sword and finish the battle through the action button.`; button('enter').hidden = false; }
}
void main().catch(error => { console.error(error); el('entry-message').textContent = error instanceof Error ? error.message : 'The duel could not load.'; button('retry').hidden = false; });
