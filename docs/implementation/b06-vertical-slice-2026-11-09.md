# B06 browser vertical-slice verification

9 November 2026. **Partially implemented:** the fixed candidate, test tooling, desktop regression and participant/device protocol are ready. Physical Android/iPhone observations and the first-time-player trial have not yet been supplied. **G2 remains open.** Work follows the [plan written first](b06-vertical-slice-plan.md).

## Fixed candidate and executed evidence

Candidate **B06-20261109-01** contains the unchanged **B05-village-v1** release built at `2026-11-09T11:01:49.9295235Z`. Its three objectives are Jesse, provisions and the gate. No gameplay, scene, asset, source document or runtime configuration was changed for B06.

| Executed B06 check | Result |
|---|---|
| Candidate/integrity and local delivery | 26 checks passed: refusing overwrite, invalid IDs, changed raw/compressed files, missing/unlisted files, manifest paths/hash metadata; actual raw/gzip bytes, WASM MIME and restricted HTTP routes |
| Chrome desktop exported journey | 42 checks passed; no captured browser/script/request errors; final manifest unchanged |
| Archive | ZIP integrity and every archived file hash match the candidate; browser files/metadata only |
| B05 comparison | Exact export manifest retained and 61 runtime/source-asset files unchanged |
| Prior results reused, not rerun | B05's 281 engine, 143 browser journey and 24 shell checks remain dated evidence for the same runtime; they are not new B06 physical/user results |

Saved [result](evidence/b06-2026-11-09/result.json), [candidate identity](evidence/b06-2026-11-09/candidate.json), [candidate/delivery checks](evidence/b06-2026-11-09/candidate-checks.json), [browser report](evidence/b06-2026-11-09/chrome-desktop.json) and [screenshots](evidence/b06-2026-11-09/).

- PCK SHA-256: `7325c07318d2af668be6b95a83dffc9bdc5cb9354def503833097797fef96f7e`.
- Prepared archive: `build/candidates/B06-20261109-01.zip`, 20,750,484 bytes. SHA-256: `0d5f093082b87ece1233ae4aa6f374b53534850717a21e0f59a417f06eea16e0`.
- The ZIP includes raw and precompressed delivery variants. Its archive size is not a page's transfer size or performance acceptance result.
- The local candidate is [on port 8061](http://127.0.0.1:8061/); the mutable development preview remains on 8060.

[Preparation tooling](../../tools/prepare-slice-candidate.py) refuses to replace an existing candidate. [The server](../../tools/serve-proof.py) validates a selected candidate before serving only listed browser files. Hash checks detect changes; the folder is not an OS-enforced immutable store. Verify it before/after sessions, and create a new numbered candidate for any fix. Browser checks now accept an optional origin argument so they can target the frozen candidate without changing gameplay.

```powershell
python tools/prepare-slice-candidate.py B06-20261109-01 --verify-only
python tools/serve-proof.py --candidate B06-20261109-01 --port 8061
```

With that server running, `python tools/check-slice-candidate.py` exercises packaging/delivery guards. Browser invocation: `tools/browser-proof-check.cjs <playwright-module-path> chrome desktop build/verification/b06/browser http://127.0.0.1:8061` with Node. Preparation without `--verify-only` is for a new candidate ID only.

## Physical-device access finding

The engine's shipped `getMissingFeatures()` checks `isSecureContext` independently of the threading flag. Consequently the former plain LAN HTTP advice would block the game on a phone. The [A04 checklist](a04-device-test-checklist.md) now corrects this and links the current session. [Godot's guidance](https://docs.godotengine.org/en/4.3/tutorials/export/exporting_for_web.html) explains the secure-context requirement; localhost is the laptop exception, not a phone connection to the laptop.

The existing Tailscale CLI rejects access from this Windows account because another account manages its service. No Tailscale account/security configuration was changed. Installed Cloudflare tooling could provide a temporary HTTPS route to the restricted candidate server; [Cloudflare documents](https://developers.cloudflare.com/tunnel/get-started/quick-tunnels/) that anyone with such a URL can access it until the process stops. **Owner decision, 9 November: keep this session on the laptop only.** No public link was approved or created. Phone HTTPS access is deferred; no Tailscale, firewall/router, hosting or trust settings were changed. This session decision does not waive later Android/iPhone coverage or approve production hosting.

## Human/session status and next action

The owner reports **one Android phone** and **a first-time player** available now. The owner subsequently chose a laptop-only session. The Android is available but is not being tested in this session; the iPhone is unavailable. Laptop/browser details, notes consent and observations remain unknown. These are availability facts, not completed tests or a verified minimum device.

Use the [neutral session guide](../testing/b06-session-guide.md), then fill the [observation and G2 record](../testing/b06-session-record.md). Run the first unaided attempt before revealing the facilitator's route/checklist; log hints and rescue separately. Record actual touch, orientation, audio, interruption, restart and performance evidence. An owner-reported result is labelled as such. One pilot cannot close the later full-episode user study.

B06 remains partial until real-device/user evidence and the G2 disposition are recorded; C01 is not started by this task. Original B06 date/estimate (3 November, 0.5–1 person-day) are retained as the baseline; actual preparation is 9 November. The full-episode schedule still requires reforecasting. No commit or push was performed.

The roadmap workbook now records B06 as Partially implemented. Before/after renders, recalculation/error scan and XML comparison verified only E20/M20/P12 and row 20 height changed; all other cells, estimates, dates, formulas, table, validation and frozen panes remain intact. The artifact runtime exited nonzero after writing the candidate; the written ZIP and rendered output were independently verified before replacement. [Documentation checks](evidence/b06-2026-11-09/documentation-checks.json) also confirm schedule/status agreement, local links, unchanged original DOCX files and source/export fingerprints. Native Excel was not opened.
