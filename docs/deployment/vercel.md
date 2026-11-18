# GitHub and Vercel hosting

18 November update: the cinematic Chapter 5 source uses the same build settings and four public variables below. The environment template now includes the current public development values for copying into Vercel. Sign into the hosted game and continue to Chapter 5, or use the chapter catalog to revisit it if previously completed. Authentication/progression gates remain active. This update requires no new database migration.

Prepared 17 November 2026. This configuration hosts the existing PlayCanvas application; the Clerk and Supabase services remain separate. Preparing and pushing the source is not a deployment or M5 release approval.

## Import settings

Import `segunuzziahlabs-design/Bible_Comic` into Vercel and select `main`.

| Setting | Value |
| --- | --- |
| Root directory | Repository root (`./`), **not** `apps/playcanvas` |
| Framework preset | Vite |
| Node.js version | **24.x** in Build and Deployment settings, matching local verification |
| Install command | `npm ci --prefix apps/playcanvas` |
| Build command | `npm run build --prefix apps/playcanvas` |
| Output directory | `build/playcanvas` |

The committed [vercel.json](../../vercel.json) supplies the framework, install, build and output settings. The output is inside the repository root, although it is outside the nested application directory. Keep `.html` URLs: this is a multi-page application with real chapter files, not a single-page application requiring a catch-all rewrite.

## Public build configuration

Add the following environment variables to the intended Vercel environment **before building**. The [environment template](../../apps/playcanvas/.env.example) contains the current public development values, ready to copy. Backend secrets and database credentials remain outside the repository.

| Variable | Value/source |
| --- | --- |
| `VITE_ACCOUNT_MODE` | `cloud` |
| `VITE_CLERK_PUBLISHABLE_KEY` | Dedicated game's Clerk publishable key |
| `VITE_SUPABASE_URL` | Dedicated game's Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Dedicated game's Supabase publishable client key |

These variables enter the browser bundle. Never add a Clerk secret key, a Supabase privileged/service-role key, a database password, or testing credentials. [Environment template](../../apps/playcanvas/.env.example). Changes require a new build. Missing cloud configuration deliberately prevents authenticated gameplay instead of silently using browser-only saves.

The current providers are **development** resources. A hosted review can use those resources, subject to provider domain configuration and verification. A public production release requires the production Clerk instance, final domain/redirect and OAuth configuration, matching Supabase Clerk issuer trust, and the M5 release checks. Do not replace these provider settings or reapply the database migration merely to host the frontend. The [M4 handover](../implementation/m4-account-and-product-handover.md) records what is already installed and tested.

## Verification after deployment

1. Open the actual HTTPS deployment in a fresh browser; confirm the landing page loads and the Clerk sign-in form works on that origin.
2. Sign in to a game account, open the dashboard and start/continue the episode. Confirm GLB and audio requests succeed and there are no failed asset requests or console errors.
3. Complete an objective, leave and sign in again; confirm the server-confirmed checkpoint resumes. Check a second account cannot see the first account's progress.
4. Check direct chapter URLs are still account/progression gated; test the normal transitions, defeat/Retry Battle, completion and replay. Repeat responsive checks in portrait and landscape.
5. Run the remaining M5 usability, browser/performance and release checks against the hosted build. Local passes do not establish a hosted pass.

No Vercel deployment or hosted-origin acceptance is claimed by this preparation.

## Pre-push verification executed

17 November 2026, Node 24.14.1 on Windows. A separate clean source export from the Git index was installed with the exact configured `npm ci --prefix apps/playcanvas` command. Only the four public development settings were injected into that build process; ignored source-workspace dependencies and generated files were not copied.

- Fresh install passed; npm reported zero known vulnerabilities at that run.
- Exact configured production build and TypeScript checks passed: 426 output files, 33,835,847 bytes in total. This is the whole output, not initial page download size.
- Existing story-rule tests and actual SQL migration checks in local PostgreSQL WASM/PGlite passed. The database test was local; the earlier hosted results are in the M4 handover.
- The fresh build served on loopback port 4207: landing and real Clerk sign-in form rendered at 1280×800, 390×844 and 844×390. No horizontal overflow, JavaScript page errors or failed same-origin asset responses were observed. The landing did not request 3D models, game rendering code or WAV audio. These were browser-emulated layouts, not physical-phone or hosted-domain tests.
- All 665 staged files were checked for configured private credentials and credential-shaped literals; no matches remained. Ignored environment files, generated credentials and the raw evidence archive were excluded. A static check of 444 relative import paths found no filename-case mismatches; this was not a Linux build.

Vite still reports large JavaScript chunks and a Clerk UI `use client` directive warning. The build succeeds; download/startup performance remains M5 work. No gameplay, dependency version, database or provider configuration was changed for this handoff.

## Local reproduction and repository contents

With Node 24 installed, run from the repository root:

```powershell
npm ci --prefix apps/playcanvas
# Copy apps/playcanvas/.env.example to .env.local in that same directory,
# then supply the four public development settings above.
npm run test:story --prefix apps/playcanvas
npm run build --prefix apps/playcanvas
npm run preview --prefix apps/playcanvas -- --host 127.0.0.1 --port 4207 --strictPort
```

Generated builds, installed dependencies, local environment files and raw `docs/**/evidence/` browser captures are excluded from Git. The local evidence archive is preserved on disk; historical report links into it work in this workspace but are not included in the GitHub publication. Written implementation reports, original specifications, source assets, runtime models/audio, licence records, test scripts and the SQL migration are included. Earlier Godot work is retained for project provenance; Vercel builds only `apps/playcanvas`.

References: [Vercel Vite support](https://vercel.com/docs/frameworks/frontend/vite), [repository configuration](https://vercel.com/docs/project-configuration/vercel-json), [Node.js version selection](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions).
