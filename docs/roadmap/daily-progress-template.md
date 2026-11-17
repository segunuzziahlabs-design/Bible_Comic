# Daily progress update

Use one short update per working day. Describe a demonstrable outcome, not files created or lines written. Link the relevant [milestone](development-roadmap.md), [gate](mvp-scope-and-acceptance.md) or [decision](risk-and-decision-register.md). Do not mark a milestone complete until its required browser/device evidence exists.

```text
David and Goliath — daily update — [date]

Completed today: [One or two outcomes actually demonstrated.]
Evidence: [Build/link/recording/test result; device/browser; what passed and what remains untested.]
Planned next: [Next usable result and intended date.]
Blockers or decisions: [Decision ID, person needed, deadline and effect; or None.]
Schedule and quality risks: [Change to the two-week build target or mobile/desktop quality; action.]
Current milestone: [Phase/gate, Not started / In progress / Awaiting verification / Passed / Blocked.]
Target: Playable candidate 10 November; release decision 30 November [or approved revised dates].
```

Example based on the verified A03 work on 29 October:

```text
Completed today: Installed and pinned the development tools. A minimal project imports, starts locally and produces debug/release web packages successfully.
Evidence: docs/implementation/a03-toolchain-setup-2026-10-29.md and saved check logs. No browser gameplay or physical-device result exists yet.
Planned next: Prepare a representative animated asset, then test movement, interaction and audio in an exported desktop/mobile browser scene.
Blockers or decisions: Exact device models and browser baseline, detailed story content, art sample, performance thresholds and hosting remain open.
Schedule and quality risks: The earlier multi-person staffing assumption no longer applies. Keep 10 November as a stretch target and reforecast after the browser and asset proof.
Current milestone: Phase 1 — A01/A03 complete; A02 retains open details; A04 export preparation exists but browser feasibility remains unverified.
```

When a result fails, state the failure and next action plainly. Use “not tested” rather than “works” where evidence is absent. No daily reporting automation or message to the boss has been configured or sent. 
