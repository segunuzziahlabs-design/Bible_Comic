# Village story presentation

The opening village depicts an interpretation of the Judean hill country around 1000 BCE. The scene should show a working settlement while David receives his errand. Use rough stone footings, mudbrick, timber and reed roofs, clay jars and a small livestock pen. The references inform materials and daily activity. [Harvard Museum village house](https://hmane.harvard.edu/house) · [Tel Reḥov excavated houses](https://www.eretzmuseum.org.il/en/exhibitions/it-is-the-land-of-honey/)

1. Dress Jesse’s yard with a small work shelter, storage, livestock and a visible household routine. Keep the required exploration route clear. Use lightweight geometry and a few looping motions.
2. Stage the one-button exchange with a wide opening, a closer two-person shot, a brief view of household work and a return to the speakers. Keep the draft wording and shot cues editable separately from the code that handles input and progression. Give the fictional enslaved household member a name and establish his status in the scene’s text.
3. Keep Speak, Take, gate completion, skip, pause and restart working through the existing story state. Check the full exported flow, narrow portrait and landscape browser sizes, and the new staging in captures.
4. Apply the owner’s updated mobile acceptance criterion. Check responsiveness and touch layout in browser emulation. Record visual review and first-time-player observation separately.

## Scene draft

The player presses Speak once. The opening names Bethlehem and the period, then the camera moves in for Jesse’s request and David’s response. A cutaway shows Mattan at the workbench and two goats by the trough. The camera returns to Jesse for the handoff. Take remains a separate action after the scene.

The village has two low storage huts, a reed-roof shelter, exposed masonry, clay jars and a livestock pen. Mattan is a fictional enslaved member of Jesse’s household. The narration establishes his role in the scene. His model uses the existing rig with a distinct wardrobe, and his work loop plays alongside the animal motion.

Edit [Jesse’s errand](../../assets/story/jesse_errand.tres) in Godot or as text. Beats use `at` in seconds, `line` for the subtitle, and `shot` for the framing. The available shots are `establish`, `two_shot`, `response` and `yard`. Optional actor cues are `greet`, `point`, `listen` and `acknowledge`. List beats in time order and set `duration` after the final beat. A beat may use a cue without changing the line or shot.

## Review build

The local review build passed 38 Chrome checks with no captured browser errors. The desktop and emulated touch routes completed Speak, Take, Leave and Restart. During the cutaway, the emulated browser changed from 390 × 844 to 568 × 320 and 320 × 568. Subtitles and controls fit both orientations, and the short landscape shot kept the workbench and goats visible. The Godot route, camera, interaction and UI checks passed during development. [Play the scene](http://127.0.0.1:8076/) · [Browser results](evidence/q06-village-life-2026-11-10/exchange-review.json)

[Opening shot](evidence/q06-village-life-2026-11-10/desktop-establish.png) · [Yard cutaway](evidence/q06-village-life-2026-11-10/desktop-yard.png) · [Narrow portrait](evidence/q06-village-life-2026-11-10/portrait-yard-320x568.png) · [Short landscape](evidence/q06-village-life-2026-11-10/portrait-yard-568x320.png)

The next review covers the art and story presentation with the owner, followed by an unaided first playthrough. Phase C begins after the acceptance decision.
