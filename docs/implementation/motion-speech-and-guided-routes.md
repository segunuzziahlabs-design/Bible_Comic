# Motion, speech and guided journeys: review build and handover

20 November 2026 · MSR-08 engineering handover complete; owner/player acceptance remains pending.

The active game is [PlayCanvas + TypeScript + Vite](../../apps/playcanvas/), with the existing Clerk/Supabase account and checkpoint system. MSR retains six chapters and twelve objectives. It connects the existing places with short guided routes and improves performances using the current rigs and voice cast. No new chapter, engine migration, reward system or unrestricted world was added.

## What changed

- David blends walking/idle from actual movement, eases starts/stops and turns, and stops walking when blocked. Jesse and camp speakers sustain their gestures instead of holding the final pose through long lines.
- David–Saul and David's faith response use four directed recordings with the original cast/words, recording-derived cues and restrained mouths. Main staged dialogue uses a cinematic mix; environmental sound remains spatial. Listener reactions and supported blinks are staggered. Foreground cheering follows the correct soldier's voice.
- R03 connects Elah to the baggage camp, R05 brothers to the challenge, R07 Eliab to Saul, R09 the pavilion to the brook, and R11 practice to the battlefield. Arrows guide actual player walking; loading/root changes stay covered. Existing automatic messenger/courtyard arrival and stone collection remain automatic.
- Saves confirm before departure; exits require valid grounded movement; temporary arrival hints never grant objectives. Retry/fallback, stale-hint handling and save-conflict UI protect the confirmed checkpoint.
- The final integration pass adds bounded Victory audio startup and a visible retry. A failed audio request cannot leave Begin disabled indefinitely or grant the conclusion checkpoint; late startup completion and competing starts cannot replay the scene.

Detailed evidence: [motion](../quality-review/msr02-motion-foundation.md), [Saul speech](../quality-review/msr03-speech-and-reactions.md), [R07 pilot](../quality-review/msr04-eliab-to-saul-connection.md), [other connections](../quality-review/msr05-connected-journeys.md), [remaining cast](../quality-review/msr06-cast-performance.md), [integrated validation](../quality-review/msr07-integrated-validation.md).

## Play and review

The local QA build is at [Start/continue the episode](http://127.0.0.1:4225/episode.html). The development cloud-account build is at [Game website](http://127.0.0.1:4224/). Begin/Enter supplies the browser sound gesture. A private browser session gives a fresh local run without changing an existing local profile; cloud play uses the signed-in account's actual confirmed checkpoint.

| Chapter | What to do |
| --- | --- |
| 1 | Watch David with the flock and the automatic messenger. Follow the arrows; watch the courtyard arrival. Speak once to Jesse, then separately Take the provisions. Follow the road, listen at the ridge, enter Elah and survey it. |
| 2 | Follow the camp route, deliver provisions, then greet the brothers. Follow the marked path towards the overlook. |
| 3 | Hear Goliath's challenge and speak with Eliab. Walk to the pavilion; approach Saul and Speak. |
| 4 | Watch the audience, try/decline the armour, follow the exit/brook route. Reaching the stones starts the automatic collection. Practise aiming/throwing, then leave along the battlefield path. |
| 5 | Approach after Goliath's entrance. Survive the sword/spear stages, then keep dodging while repositioning/aiming the sling. A real forehead hit earns the fall. Walk to the sword and deliberately perform the final interactions. Retry Battle preserves Preparation after defeat. |
| 6 | Watch retreat, cheers and the conclusion. Confirm the completed episode; use Replay Episode for a fresh run while keeping completion history. |

Desktop: WASD/arrows move, drag to look, E performs the contextual action, Space jumps, Shift dodges, and the displayed sling/aim controls apply in practice/battle. Touch: use the left movement pad and displayed action controls; drag the view/aim area as instructed. Controls and help change with the current story state. Dialogue requires one Speak action, followed by an automatic exchange. Pause, sound and checkpoint restart remain available where displayed.

Safe isolated previews, which do not change the normal episode: [Jesse](http://127.0.0.1:4225/valley.html?review=1), [camp](http://127.0.0.1:4225/camp.html?review=1), [Challenge/Eliab](http://127.0.0.1:4225/challenge.html?review=1), [Saul](http://127.0.0.1:4225/preparation.html?review=1&cinematic=1), [battle](http://127.0.0.1:4225/duel.html?review=1), [Victory](http://127.0.0.1:4225/victory.html?review=1).

## Engineering acceptance and remaining review

Final local/cloud exports, three fresh complete journeys (hosted desktop and local touch portrait/landscape), 21 route-recovery cases, six Victory audio-recovery cases, laptop combat, Edge hosted resume and fifteen contract/asset/SQL checks passed. Local frame/input targets were measured as described in the [validation report](../quality-review/msr07-integrated-validation.md). No confirmed implementation blocker remains in the executed matrix.

MSR-07's **engineering validation is complete**. Its human acceptance remains open because no participant is available today and the owner has not reviewed the latest delivery. MSR-08's frozen review exports, guide, limitations, provenance and [committed manifest](msr-review-build-manifest.json) are ready for the requested GitHub push. The final delivery message records the pushed revision; this document does not claim a production release approval.

The owner confirmed on 20 November that no first-time player is available today and that the latest motion/speech previews have not been reviewed. The [participant/owner task sheet](../quality-review/msr07-player-review.md) is ready; it contains no invented observations. Native regular-Chrome tab-away/return and formal planted-sole contact remain separately tracked. Browser touch emulation does not certify physical-phone/Safari performance.

Existing facial rigs differ. Available open/round shapes and supported blinks are improved; phoneme-specific lips and new facial morphs were not added. Distant crowds retain economical baked poses. Between separate chapter pages, ambient audio can be interrupted by teardown or browser sound activation; the tap-to-enter fallback is preserved.

## Reopen the frozen candidates

From `apps/playcanvas`, use the existing local candidate with `npm run preview -- --outDir ../../build/msr-final-local --host 127.0.0.1 --port 4225 --strictPort`, or the tested cloud-mode candidate with `npm run preview -- --outDir ../../build/msr-final-cloud --host 127.0.0.1 --port 4224 --strictPort`. Build directories and raw evidence are local, ignored artifacts; their manifests are referenced by the final validation report.

For a fresh export, use `npm ci` and `npm run build` in the app directory. `VITE_ACCOUNT_MODE=local` is local engineering QA; cloud mode uses only the public Clerk/Supabase browser configuration described in [.env.example](../../apps/playcanvas/.env.example). Backend secrets, database passwords and QA credentials belong outside source control and browser output. The dedicated provider resources remain development services; production identity/domain/email/support readiness is separate from this MSR pass.

The root [Vercel configuration](../../vercel.json) installs/builds `apps/playcanvas` and serves `build/playcanvas`. The owner requested a GitHub push after completion. No separate deployment or production-setting change is authorised by this handover; any repository-linked deployment follows the existing Git integration.

## Maintenance and provenance

Keep the small motion/face helpers, chapter coordinators and existing scene ownership. Preserve physical combat release/collision clocks when editing gestures. Do not use arrival hints as save state, add route objectives, or replace the authoritative cloud commands with client snapshots.

The directed recordings retain originals and exact generation hashes: [MSR-03 voice provenance](../assets/msr03-saul-performance.md) and [MSR-06 voice provenance](../assets/msr06-battle-performance.md). Existing model licences/notices remain intact. MSR-06 changed no GLB model bytes. Raw captures remain in the ignored local evidence archive; the source test drivers, written findings and provenance are committed for review/reproduction.

Use the [implementation plan](motion-speech-and-guided-routes-plan.md), [MSR-07/08 execution plan](msr07-08-completion-execution-plan.md), [defect/acceptance register](../quality-review/motion-speech-and-route-defects.json) and final validation matrix for the remaining owner decisions. Do not treat a passing automated route as evidence that an uncoached participant understood it.
