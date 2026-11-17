# M1 · David before Saul: browser cinematic sample

11 November 2026. Implemented for the owner's explicitly authorised first cinematic review. **Creative acceptance remains with Segun.** This sample does not establish that the game's final realistic visual target has been achieved.

**Owner review:** Segun said “I like the play David before Saul” and authorised continuing under the new development plan. The sample is accepted as the working cinematic reference. Next is [M2, the connected episode](m2-connected-episode-brief.md); this acceptance does not settle the remaining hardware, backend or final-art decisions.

[Open the local production preview](http://127.0.0.1:4181/saul.html) · [Approved sample direction](m1-cinematic-review-brief.md) · [Current project plan](../roadmap/project-reset-plan.md) · [Voice permissions and provenance](../assets/saul-generated-voices.md)

## Play the sample

1. Select **Enter camp** to enable sound and controls.
2. Walk toward Saul using WASD/arrows or the touch stick. Drag the view to look.
3. Select **Speak to Saul**, or press E, once in range.
4. Watch the **40-second** conversation. Pause/Resume and Sound on/off remain available. Subtitles remain visible when muted.
5. Control returns to David and the objective reads **Inspect Saul's armour**. Move around, return to Saul to replay, or use Restart.

The armour is a staging prop and next-objective handoff in this isolated sample. The armour inspection chapter, battle, account flow and durable chapter progression are not connected to this route yet.

## What was built

- A separate `saul.html` production entry using the existing PlayCanvas + TypeScript + Vite foundation. Existing animation, courtyard and Elah entries remain available.
- A woven command pavilion with carpet, timber poles, clay jars, table, provision cloth, armour stand, warm lighting, character shadows and guard equipment. These are original procedural sample assets, not a claim of final environment quality or archaeological reconstruction.
- The benchmarked youthful David rig, with saved appearance choices retained, speaking jaw/lip shapes and an authored resolve gesture.
- Saul adapted from the project's existing licensed adult rig, with a mantle, beard, circlet, speaking controls and restrained concern/assent gestures.
- Two background soldier rigs with different colours, idle motion and timed acknowledgement reactions. Their spears and shields are staged beside them. Victory cheering belongs to the later victory scene; the soldiers here listen before the battle.
- Three generated, locally recorded voices/lines: Saul's concern, David's resolve and Saul's blessing. The sample uses original biblical paraphrases, quiet original wind synthesis and no external music.
- An establishing shot, two-shot, alternating speaking close-ups, a soldier reaction shot, Saul's listening reaction and a smooth return to the follow view. The same cameras use a wider portrait lens without backing through a listener or tent wall.
- A single accepted interaction starts the whole exchange. Voice playback, camera beats, poses, mouth cues and captions share the AudioContext clock. Suspending it pauses the voice and scene together; restart stops scheduled lines and clears the old sequence.

## Verification and evidence

**Passed:** final production build and browser assertions, 11 November 2026 at 09:36 UTC, Chrome 157.0.8103.39. Desktop was 1366 × 900; emulated touch layouts were 390 × 844 and 844 × 390. The final run recorded zero browser runtime errors. The local in-app browser also loaded the entry screen successfully and was left open for the owner's playthrough.

The production command is `npm.cmd --prefix apps/playcanvas run build -- --outDir ../../build/playcanvas-m1`. It runs TypeScript checking before bundling all four browser entries. Vite still reports the pre-existing large shared engine chunk warning; no new web runtime dependency was added.

The [browser check script](../../tools/saul-cinematic-check.cjs) runs against that production preview, using an installed Playwright module path as its argument. The [machine-readable result](evidence/m1-2026-11-11/browser-check.json) records the final browser version, layouts and pass/fail outcome. It covers:

- Interaction range and duplicate-start rejection.
- Actual rendered mouth morph weights changing during each speaker's recording, rather than checking only calculated timing values.
- Pause freezing cue time, audio and mouth weights; resume continuing playback.
- Muted captions and the complete timed journey to control handoff.
- Player movement after the sequence and replay/restart cancellation.
- Touch-stick movement, entering the conversation, readable framing, no horizontal overflow, essential buttons at least 48 CSS pixels high, and pause/resume in portrait and landscape Chrome emulation.

Captures: [camp entry](evidence/m1-2026-11-11/01-camp-entry.png), [Saul speaking](evidence/m1-2026-11-11/02-saul-speaking.png), [David speaking](evidence/m1-2026-11-11/03-david-speaking.png), [soldier reaction](evidence/m1-2026-11-11/04-soldier-reaction.png), [blessing](evidence/m1-2026-11-11/05-saul-blessing.png), [returned control](evidence/m1-2026-11-11/06-control-returned.png), [portrait](evidence/m1-2026-11-11/07-portrait.png), [landscape](evidence/m1-2026-11-11/07-landscape.png).

Visual inspection caught and corrected Saul obscuring David's response shot, missing adult eye palette/pupils, an oversized beard silhouette and portrait camera clearance. The final handoff retains David's facing direction, and the short approach walk advances its cycle according to distance travelled.

These are desktop Chrome and emulated touch observations. No physical-phone, Safari or low-end-device performance approval is implied. The earlier PC-04 performance results are not being reused as results for this four-character scene. No full new performance profile or unaided participant review was run for this sample.

## Quality boundary and owner review

This is a functioning cinematic sample built with the current stylised characters. It is **not** a completed photorealistic character/animation pass or the full game. Mouth motion is waveform-driven jaw opening and rounding with silence closure, not phoneme-level articulation. The generated recordings are intelligibility/voice-character samples whose dramatic performance and David's perceived age still require owner feedback. There is no bespoke facial capture, eye tracking or full cloth simulation.

Review this actual scene for voice choice, mouth believability, reaction timing, camera composition and character/environment finish before authorising additional cinematic scenes. Record accepted elements and specific revisions against the same sample; a passing browser test does not automatically approve its art.

## Source and reproduction

- Scene and UI: [saul-main.ts](../../apps/playcanvas/src/app/saul-main.ts), [saul.css](../../apps/playcanvas/src/app/saul.css), [pavilion](../../apps/playcanvas/src/world/saul-pavilion.ts).
- Runtime facial/animation adapter: [conversation-actor.ts](../../apps/playcanvas/src/world/conversation-actor.ts). Existing character loaders are retained.
- Audio/cue timing: [saul-audio.ts](../../apps/playcanvas/src/world/saul-audio.ts), [generation source](../../tools/generate-saul-dialogue.py), [exact generation record](../assets/saul-voice-provenance.json).
- Editable character pipeline: [saul_conversation.py](../../source-assets/characters/saul_conversation.py). Run in Blender with the prepared teenage/adult `david-comparison.blend` from the existing `build-david.py` pipeline. It writes separate `david-dialogue` and `saul` exports; original `david.glb` and `goliath.glb` were retained.
- The local generator environment is under ignored `build/voice-tools/`. Only audio clips and a small timing manifest ship. Licence notices are copied into `public/licences/` and the production build.

No deployment, commit or push was performed.
