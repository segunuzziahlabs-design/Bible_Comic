# A04 physical-device test sheet

Use the exact exported proof identified by its verification record. **Blank results mean not tested.** Desktop touch emulation does not substitute for these checks. For the current B06 session, use the [frozen candidate and session guide](../testing/b06-session-guide.md); the [A05/A04 record](a05-a04-proof-2026-10-29.md) remains historical.

## Make the proof available

On the development laptop, export with `.\tools\export-proof.ps1`, then run `python .\tools\serve-proof.py` using an available Python 3.12+ interpreter. Open `http://127.0.0.1:8060/` on that laptop. The currently running loopback server is not reachable from a phone.

**B06 correction, 9 November:** the shipped engine requires a secure context even when threading is disabled. Plain `http://<laptop-private-IP>` from a phone fails its feature check; this is not just an optional audio limitation. Use a trusted HTTPS test route approved by the owner, with the frozen candidate as its only served content. The [Godot web-export guidance](https://docs.godotengine.org/en/4.3/tutorials/export/exporting_for_web.html) describes the secure-context requirement. Do not disable the check, bypass certificate warnings or change firewall/router/trust settings as a workaround. No public test link or hosting deployment is authorised by these instructions alone. Loopback still works on the laptop; it does not refer to that laptop when opened on a phone.

## Device/build record

| Field | Laptop | Android | iPhone |
|---|---|---|---|
| Tester / date | Not recorded | Not recorded | Not recorded |
| Device model; CPU/GPU; RAM if known | Not recorded | Not recorded | Not recorded |
| OS and exact browser version | Not recorded | Not recorded | Not recorded |
| Build manifest/PCK SHA-256 | Not recorded | Not recorded | Not recorded |
| Network; viewport/orientation; Low detail or Extra light | Not recorded | Not recorded | Not recorded |
| Three cold loads / three warm loads | Not tested | Not tested | Not tested |
| Visible launch errors or missing assets | Not tested | Not tested | Not tested |

Choose the weakest devices you actually have. If no lower-capacity device is available, retain that coverage gap. Device names and RAM are evidence to collect at testing, not another prerequisite for reviewing the local sample.

## Participant actions and observations

Run once without coaching, then repeat targeted checks. Record pass/fail/not tested, exact confusion and a screenshot or short capture where useful.

1. Open a fresh visit. Read the controls and enter. Note time until an actionable scene, loading failures, legibility and any misleading guidance.
2. Walk as David. Rotate the camera. On touch, move with the left region and look with the right simultaneously; release each finger independently, drag outside its initial region and interrupt a gesture. Movement must stop on release/cancellation.
3. Speak to Jesse, read and close the dialogue, approach the provisions beside the table, collect them and reach the stone gate. Do not walk through the table. Note any uncertain target/prompt or need for help.
4. Confirm idle/walk/gesture animation and a non-silent cue after user input. Mute/unmute; check the phone's own mute/volume state. A console audio-context result is not a speaker test.
5. Try the gate before collecting provisions and the bundle before speaking. Neither must skip the required order. Repeated interaction must not duplicate progression.
6. Complete and restart three times. Restart should restore David, the bundle and the first objective. Reload should intentionally begin a new visit, without suggesting a durable save.
7. Pause/resume, briefly change tabs/apps, return after a minute and after five minutes. No stuck movement, unexplained skipped objective or forced developer repair. Record OS page eviction separately; full reload resets this proof.
8. Rotate portrait ↔ landscape during movement, dialogue and pause. All primary buttons stay visible and reachable, text fits, camera and touch coordinates remain aligned; account for notches, browser bars and safe areas.
9. Play for at least ten minutes in each orientation, using both quality settings. Record stutters, slowdown, heat, browser reloads/crashes and available memory observations. Do not treat JavaScript heap as total WASM/GPU/process memory.
10. Try one slower-network cold load and a failed connection/retry. Confirm useful guidance, correct WASM MIME, compression and cache behavior when the final host is chosen.

Use `/?diagnostics=1` to show FPS/render scale and read-only diagnostics for assisted measurements. Record minimum/typical FPS and stalls alongside observations; the proposed 30 FPS floor and numerical loading budgets still require owner acceptance. This test is for a small proof, not final episode performance certification.

## Short feedback and gate decision

- Could you move and understand what to do without help? Where did you hesitate?
- Did controls and camera feel comfortable in both orientations?
- Did acting as David feel interactive? What should change before the full episode?
- Would you want to try the complete episode? Why?

Record actual responses, unaided completion and any assistance; there are no participant observations yet. Segun supplies real-device observations; the assistant reproduces/fixes defects and updates A04/G1. A06 still needs device inventory and external participant bookings. Final episode enjoyment and return interest require the later E02 study.
