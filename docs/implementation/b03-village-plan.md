# B03 representative village implementation plan

Prepared 9 November 2026, before implementation, under the owner's explicit request to proceed with B03. This authorises building the representative village using the approved illustrated 3D direction and existing original sample assets. Final art/content acceptance, physical-device evidence and G1/G2 remain open.

## Intended result

A compact, readable home village that the player can explore as David: home courtyard, provisions stall, central lane and well, olive planting, a few homes and a visible exit gate. Reuse Jesse and the current three-objective proof loop. No new narrative events, full episode, extra quest-givers, building interiors or gameplay at the well are implied.

## Plan and ownership

1. Add reusable original environment modules under `scenes/world/village/` with a small shared mesh builder and opaque vertex colours. Batch static primitive geometry per module to limit draw calls. Keep editable scene placements, simple separate collision and the original imported gateway/character assets.
2. Assemble `scenes/world/village.tscn`: spawn (0, 0.1, 5), Jesse (0, 0, 1.3), provisions (3.2, 0, -0.7), gate (0, 0, -14). Use a broad central route, optional side paths around the well/planting, solid visible bounds at x ±14.5, rear z 9.5 and north z -16.5. Use clear material contrast, roof silhouettes and simple lighting; avoid expensive shadows, textures or effects.
3. Compose `scenes/proof/village_proof.tscn` from the B01/B02 player, camera, input and UI. Parameterise the existing sample controller's location/world reference and UI labels. Retain the original courtyard as a regression fixture. Point the default local browser export to the village.
4. Validate the assembled geometry with the real B02 controller: spawn clearance, objective reachability, gate opening, optional routes, boundary containment, camera obstruction and recovery. Check visibility/state isolation and original GLB/audio/source preservation. No arbitrary teleport shortcut counts as a traversed route.
5. Export and exercise entry → Jesse → provisions → gate → restart through real keyboard/mouse and touch-emulated browser input, plus the optional village paths and responsive layouts. Run existing engine suites, new village fixtures and clean-copy export/package checks. Inspect desktop/portrait/landscape screenshots and capture runtime observations, without calling emulation real-phone acceptance.
6. Record evidence, asset provenance, module contracts and remaining limitations; update task statuses and workbook consistently. B03 stays Partially implemented while owner art review and physical-device/G2 acceptance remain open. B04 remains the next reusable interaction-system task.

## Acceptance for local delivery

- A distinct village scene and reusable modules are inspectable in the editor; repeated runtime/editor loading does not duplicate generated geometry.
- David can reach every required interaction and return along the tested public routes without falling, trapping or passing through solid boundaries; the prior three-step state guards/restart still work.
- Camera collision protects major architectural surfaces; route widths and spawn position are tested with the actual capsule.
- The final release export loads all new dependencies, excludes source-only files, renders in desktop/touch-emulated browsers and completes the sample journey.
- Static geometry uses bounded low-detail meshes and shared materials. Report actual geometry/draw calls and transfer sizes; do not invent a mobile performance pass.
- No original DOCX, Blender, GLB or audio asset is overwritten. No commit, push or deployment.

## Schedule and limits

The canonical B03 window was 2–3 November. Actual work starts 9 November; those baseline dates remain historical planning dates, not completion claims. The original 10 November full-episode candidate has only one further weekday and substantial C/D work still outstanding. It cannot be represented as a credible confirmed commitment from the current evidence; reforecast after the village slice and physical-device results. The 30 November release decision remains a decision date, not an automatic release.

This small village is an original gameplay adaptation, not an archaeological reconstruction. Proposed asset/layout choices are reviewable implementation choices within B03, not approval of final biblical portrayal or new product requirements. Segun owns art/content review and physical-device testing; the assistant owns repository implementation and local checks.
