const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const root=path.resolve(__dirname,'../..'),qa=path.join(root,'docs/qa'),records=require('../../docs/qa/dvpr-execution.json'),plan=require('../../docs/qa/dvpr-test-register.json');
const base=path.join(qa,'evidence/communication-2026-11-23'),read=p=>fs.existsSync(path.join(base,p))?JSON.parse(fs.readFileSync(path.join(base,p))):null;
const current=t=>{const r=records.executions[t.id];return r.retest?.status??r.initial.status;},totals={Pass:0,Fail:0,Blocked:0,'Not Run':0};plan.tests.forEach(t=>totals[current(t)]++);
const verified=plan.requirements.filter(r=>{const t=plan.tests.filter(t=>t.requirements.includes(r.id));return t.length&&t.every(t=>current(t)==='Pass');}).length;
const changed=[...new Set([...cp.execFileSync('git',['diff','--name-only'],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim().split(/\r?\n/),...cp.execFileSync('git',['ls-files','--others','--exclude-standard'],{cwd:root,encoding:'utf8'}).trim().split(/\r?\n/)])].filter(p=>p.startsWith('apps/playcanvas/')||p.startsWith('tools/'));
fs.writeFileSync(path.join(qa,'modified-files.json'),JSON.stringify({date:'2026-11-23',baseline:'ce244a8277b77615e35371302cc6a8900786e4ee',files:changed},null,2));
const fps=[];for(const [label,p]of[['Challenge + Eliab','challenge-performance/desktop.json'],['Active sling battle','active-battle/results.json'],['Victory desktop','victory-performance/desktop.json'],['Victory portrait layout','victory-performance/portrait.json'],['Victory landscape layout','victory-performance/landscape.json'],['Victory portrait repeat','victory-repeat/portrait.json'],['Victory landscape repeat','victory-repeat/landscape.json']]){const d=read(p);if(d?.fps)fps.push(`| ${label} | ${d.fps.toFixed(1)} | ${d.p95Ms.toFixed(1)} | ${d.maxMs.toFixed(1)} | ${d.over250} |`);}
for(const l of['desktop','portrait','landscape']){const d=read('victory-warmed/'+l+'.json');if(d?.fps)fps.push(`| Final warmed Victory ${l} | ${d.fps.toFixed(1)} | ${d.p95Ms.toFixed(1)} | ${d.maxMs.toFixed(1)} | ${d.over250} |`);}
const load=read('loading-opening-repeat/loading-profile.json')?.summary[0],memory=read('memory-final/results.json'),account=read('accounts-final/results.json'),finalJourney=read('full-final/desktop/results.json'),hitchFixed=records.defects.find(d=>d.id==='QA-D12')?.status==='Closed',finalLoad=read('loading-warmed/loading-profile.json');
const outstanding=plan.tests.filter(t=>current(t)!=='Pass').map(t=>`| ${t.id} | ${current(t)} | ${records.executions[t.id].limitation||records.executions[t.id].initial.actual||'See actual result and evidence in the workbook.'} |`).join('\n');
const text=`# David and Goliath improvement report

23 November 2026. Original baseline: \`ce244a8\`. This work extends the existing PlayCanvas game. It preserves all six chapters, existing cast and appearance choices, story/objective order, guided routes, sword/spear/sling combat, controls, Clerk/Supabase contracts and checkpoint schemas.

## Outcome and evidence basis

The facial, gaze, body-language, camera, environment and loading changes are implemented, with remaining verification limits below. Fresh normal **desktop, portrait and landscape** journeys each completed all twelve objectives, one deliberate defeat/Retry, the controlled final sword action, conclusion, completion reload and replay on candidate **COMM-20261123-01**. Candidate **02** corrects framing/roughness defects; **03** removes Goliath’s legacy static pupils; final candidate **04** prepares camera/material/morph variants before the conclusion starts. ${finalJourney?.status==='PASS'?'The final candidate additionally passed a fresh complete normal desktop journey with all twelve objectives, defeat/retry, final action, completion reload and replay.':'The final complete normal desktop rerun is not yet recorded as passed.'} Touch-layout complete journeys remain scoped to candidate 01; final candidate conclusion performance is separately retested in all three layouts.

Exports and exact source/file fingerprints are in [communication-builds.json](communication-builds.json). Final local preview: [complete episode](http://127.0.0.1:4234/episode.html); [David–Saul review](http://127.0.0.1:4234/preparation.html?review=1&cinematic=1). The preview uses local-mode saves. Live account checks use the separate candidate 03 cloud-mode export on port 4231 and only dedicated development QA identities; those account modules are unchanged in candidate 04.

## Investigation and implemented changes

| Area | Change | Verification |
| --- | --- | --- |
| Extra mouth / ownership | The added speaking surfaces were below the original lip crease: about 4–28 mm depending on model. David’s target map also overwrote matching skin/rim/interior bindings. Repaired all 15 speaking GLBs, constrained the opening/jaw region, hidden neutral interior/teeth and introduced one shared facial adapter for every matching morph instance. | Original and corrected close-ups; actual 3+ consistent speech bindings; neutral opening below 0.015 after the real voice. Binary checks preserve original animation/skin/UV data. |
| Eyes and conversation | Two lightweight tracking eyes attached to retained Head joints, bounded target-relative gaze, quicker eyes/slower head, saccades, brief lookaways, staggered/double blinks, restrained torso/shoulder movement and listener nods. Existing authored gesture/prop layers remain. | Actual moving pupils/head joints and camera captures; David/Saul median pupil-to-partner error about 8–9°, p95 about 13°. Target movement, eye lead, pause/restore and bounded rotations tested at 20/30/60/120 Hz. Jesse/camp/Eliab/Goliath/Victory captures cover integration. |
| Emotions and speech | Contextual surprise, anger, fear, confidence, sadness, determination and happiness; expression channels are separate from waveform opening/rounding. Audio-recording time remains the authority across pause/resume. | All seven states recorded in normal gameplay; isolated production-component expression checks are identified separately from real audio-clock tests. Voices/rights are unchanged. |
| Body movement | Smoothed heading and walk-weight response; retain calibrated distance-driven locomotion and gesture returns. Foreground and crowd run sampling now follows actual path distance. Gaze restores offsets before the next authored pose so it does not accumulate or move collision roots. | Fresh routes and actual root/joint traces in all three layouts; six starts/stops, reversal, pivots and jump/landing. Observed input-to-root response maxima: desktop 25.6 ms, portrait 11.1 ms, landscape 9.1 ms. These are browser event-to-frame measurements, not physical input-to-photon latency. Sole-contact/sliding acceptance remains incomplete. |
| Cameras | Added shoulder coverage and timed listener reactions to the existing wide, medium, close, two-shot and low Goliath coverage. Corrected the first new shoulder shot after it hid David. Existing gameplay camera ownership is retained. | Same-beat before/after screenshots, audience coverage in all three layouts and Edge; returned movement and normal battle control. |
| Environment | Warmer key/cool reflected fill, adjusted shadow distance/bias, matte skin/cloth/leather response, cached original earth/plaster grain, restrained scrub breeze and existing fog/depth. | Courtyard, valley/camp, pavilion and battlefield captures. Fixed a material regression caused by glTF’s inverted gloss/roughness convention. Existing stylised period art and models retained. |
| Loading and audio | Deduplicate identical speech URLs during fetch/decode, abort failed/disposed requests, clear buffers on disposal, reuse materials/detail textures and warm facial shaders before entry. Preserve existing music/effects and cancellation paths. | Actual non-silent Web Audio sources and non-overlap intervals; pause/mute/restart; cold/warm page timings; twenty-restart collected-heap probe. No old-build speedup is claimed from incomparable recorded/unrecorded measurements. |

Lip-sync remains a smoothed, recording-derived **two-channel amplitude/spectral** system. It is not phoneme-aligned performance capture. The retained low-poly models limit expression detail; these changes do not make them photorealistic.

## Regression and account results

The complete normal playthroughs preserve the flock/messenger/Jesse opening, separate provisions Take, connected walking routes, automatic five-stone pickup, practice miss/hit, six chapters and all ordered checkpoints. Final-build targeted combat verifies live spear attacks during moving aim/throw, lethal spear collision, Retry, genuine forehead collision, staged groans/turn/fall, sword pickup/reload and the guarded player final action. A partial sword stroke stops on release and stays stopped after pause/resume; Israel’s pursuit produces 24 visible casualties/impacts and the retained conclusion.

Seventeen executable checks passed, including actual PostgreSQL WASM migrations, ordered saves, ownership isolation, stale/failed/lost responses, idempotency, supported prior aftermath revisions, replay/history, settings validation, airborne/swept collision rules and asset preservation. These checks do not replace browser or hosted identity testing.

${account?.status==='PASS'?'Real Clerk development sign-in, profile/appearance save, deliberately lost settings response/retry, two-identity write isolation, fresh Edge sign-in/resume, actual camp delivery checkpoint/reload, protected routes and cross-tab logout passed against the dedicated hosted Supabase game project. Reserved test identities/testing tokens were used; no production CAPTCHA, real-email delivery or registration claim.':'Live-account verification is not yet recorded as passed. See the account evidence and outstanding cases below; a local-mode playthrough does not certify hosted identity or persistence.'}

## Measured performance

Hardware: Intel N150 / Intel integrated graphics, 15.8 GiB RAM, Windows 11 Pro. Browser: Chrome 157.0.8103.79; focused audience additionally passed Edge 158.0.4370.33. Touch tests use the laptop GPU, not physical phones. Measurements below are unrecorded, normal-clock browser runs, including every gap in the stated interval; the target is 30 FPS on this baseline.

| Scenario | FPS | p95 gap ms | Largest gap ms | Gaps >250 ms |
| --- | ---: | ---: | ---: | ---: |
${fps.join('\n')}

${load?`Opening ready UI across three fresh Chrome profiles/processes: cold median **${(load.cold.medianReadyMs/1000).toFixed(2)} s**, warm **${(load.warm.medianReadyMs/1000).toFixed(2)} s**, about **${(load.cold.medianEncodedResourceBytes/1048576).toFixed(2)} MiB** encoded resources. All seven pages have separate cold/warm results. These are unthrottled loopback measurements; OS/driver caches are not flushed, and they are not hosted/mobile-network startup guarantees.`:''}

${memory?`Collected JS heap after twenty audience restarts changed from **${(memory.samples[0].usedBytes/1048576).toFixed(2)} MiB** to **${(memory.samples.at(-1).usedBytes/1048576).toFixed(2)} MiB** (**${(memory.growthBytes/1048576).toFixed(2)} MiB** growth), within the stated diagnostic allowance. This excludes GPU/audio/process memory and does not certify long physical-mobile sessions.`:''}

The first portrait and landscape Victory runs contained 605.9 ms and 314.4 ms gaps, repeated at the same camera changes. The WebGL trace captured a **486 ms program-link status call** during the first visible transition. ${hitchFixed?'Camera/material/instancing preparation behind the entry cover removed those playback stalls in final desktop/portrait/landscape retests: maximum gaps 24.9–27.2 ms, zero gaps over 250 ms. QA-D12 is closed; its original evidence remains.':'QA-D12 remains open until the corrected candidate passes the stated retests.'} The preparation moves work to entry; ${finalLoad?finalLoad.summary.map(s=>`${s.page} final cold ready ${(s.cold.medianReadyMs/1000).toFixed(2)} s, warm ${(s.warm.medianReadyMs/1000).toFixed(2)} s`).join('; '):'final entry timing has not yet been recorded'}. Earlier loading values above belong to candidate 03 and are not silently substituted for final-build timings.

## Verification workbook and remaining work

[David_and_Goliath_Complete_Game_DVPR.xlsx](David_and_Goliath_Complete_Game_DVPR.xlsx) contains **12 sheets, 71 requirements and 118 meaningful cases**, with keyed formula traceability, filters/dropdowns/freeze panes, defects, evidence, initial results/retests and a formula summary. Excel’s 31-character sheet-name limit requires “Authentication & Progress”; its title contains the requested full name.

Current recorded outcomes: **${totals.Pass} Pass, ${totals.Fail} Fail, ${totals.Blocked} Blocked, ${totals['Not Run']} Not Run**; **${verified}/71 requirements** have every linked case passed. Overall status remains **Verification incomplete**. A case is not passed merely because its code or file exists. Registration UI, explicitly expired sessions and unavailable platforms are not inferred from other checks.

| Test | Status | Outstanding verification / reason |
| --- | --- | --- |
${outstanding}

Open/closed defects and corrective evidence are in the workbook and [dvpr-execution.json](dvpr-execution.json). Closed defects: displaced mouth, overwritten face bindings, obstructed shoulder framing, inverted roughness treatment and retained Goliath pupils${hitchFixed?', plus the repeated conclusion shader-link stalls':''}. An initial Jesse diagnostic selected “Jesse’s messenger”; correcting that test selector fixed the capture, so no unproven Jesse geometry change was made. The first combat profiler and account harness also needed frame/navigation/data waits; those failed attempts are retained and are not game passes.

## Files and reproducibility

The exact source/asset/test/tool inventory is [modified-files.json](modified-files.json). Main changes are in \`character-face.ts\`, \`audience-performance.ts\`, the retained character loaders, chapter integration calls, \`story-motion.ts\`, \`victory-pursuit.ts\`, existing shot/world helpers, \`scene-speech.ts\` and \`graphics.ts\`. New original surface detail is in \`surface-grain.ts\`. Fifteen repaired speaking GLBs are listed in [face-asset-repair.json](face-asset-repair.json). No new runtime dependency, third-party recording or licensed art was introduced.

After regenerating a speaking GLB from Blender, run \`node tools/repair-speaking-faces.cjs\`, then the asset-preservation check and browser close-ups. The surgical repairs are in the browser exports; the original Blender source is retained. Goliath’s joined static pupils are filtered from the eye region at load time while beard/brow geometry stays intact.

Verification sources: [initial audit](DAVID_AND_GOLIATH_INITIAL_AUDIT.md), [executable checks](communication-unit-results.json), [browser run log](communication-browser-runs.json), [evidence analysis](communication-evidence-analysis.json), [test plan](dvpr-test-register.json), [executions/evidence](dvpr-execution.json). Raw PNG/WebM/audio/JSON evidence is under \`docs/qa/evidence/communication-2026-11-23/\` and is locally ignored by Git; copy that directory with the workbook when sharing evidence. The isolated expression fixture is test-only and is not a new game scene.

Next quality work is to review the captured acting, complete sole-contact/turn-sliding assessment, and close the explicitly unrun registration/session/platform cases. No unrelated episode, account schema or deployment changes were made.
`;
fs.writeFileSync(path.join(qa,'DAVID_AND_GOLIATH_IMPROVEMENT_REPORT.md'),text);console.log(JSON.stringify({totals,verifiedRequirements:verified,modifiedFiles:changed.length,report:'docs/qa/DAVID_AND_GOLIATH_IMPROVEMENT_REPORT.md'}));
